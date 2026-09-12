import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export class CDPClient extends EventEmitter {
  constructor(wsUrl) {
    super();
    this.wsUrl = new URL(wsUrl);
    this.msgId = 1;
    this.callbacks = new Map();
    this.socket = null;
    this.on('error', () => {});
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString('base64');
      const req = http.request({
        hostname: this.wsUrl.hostname,
        port: this.wsUrl.port,
        path: this.wsUrl.pathname + this.wsUrl.search,
        headers: {
          'Connection': 'Upgrade',
          'Upgrade': 'websocket',
          'Sec-WebSocket-Key': key,
          'Sec-WebSocket-Version': '13'
        }
      });

      req.on('upgrade', (res, socket) => {
        this.socket = socket;
        this._setupSocket();
        resolve();
      });

      req.on('error', reject);
      req.end();
    });
  }

  _setupSocket() {
    let buffer = Buffer.alloc(0);

    this.socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= 2) {
        const firstByte = buffer[0];
        const secondByte = buffer[1];
        const opcode = firstByte & 0x0f;
        let payloadLen = secondByte & 0x7f;
        let offset = 2;

        if (payloadLen === 126) {
          if (buffer.length < 4) return;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          if (buffer.length < 10) return;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }

        if (buffer.length < offset + payloadLen) return;

        const payload = buffer.slice(offset, offset + payloadLen);
        buffer = buffer.slice(offset + payloadLen);

        if (opcode === 1) { // Text frame
          const str = payload.toString('utf8');
          try {
            const json = JSON.parse(str);
            if (json.id && this.callbacks.has(json.id)) {
              const { resolve, reject } = this.callbacks.get(json.id);
              this.callbacks.delete(json.id);
              if (json.error) reject(json.error);
              else resolve(json.result);
            } else if (json.method) {
              this.emit(json.method, json.params);
            }
          } catch(e) {}
        } else if (opcode === 8) { // Close frame
          this.close();
        } else if (opcode === 9) { // Ping
          const pong = Buffer.from([0x8a, 0x00]);
          this.socket.write(pong);
        }
      }
    });

    this.socket.on('close', () => this.emit('close'));
    this.socket.on('error', (err) => this.emit('error', err));
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      const msg = JSON.stringify({ id, method, params });
      const payload = Buffer.from(msg, 'utf8');
      const len = payload.length;

      let header;
      if (len < 126) {
        header = Buffer.from([0x81, len | 0x80]);
      } else if (len <= 65535) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126 | 0x80;
        header.writeUInt16BE(len, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127 | 0x80;
        header.writeBigUInt64BE(BigInt(len), 2);
      }

      const mask = crypto.randomBytes(4);
      const maskedPayload = Buffer.alloc(len);
      for (let i = 0; i < len; i++) {
        maskedPayload[i] = payload[i] ^ mask[i % 4];
      }

      this.socket.write(Buffer.concat([header, mask, maskedPayload]));
    });
  }

  close() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}

export class BrowserRunner {
  static async launch() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    const browserPath = fs.existsSync(edgePath) ? edgePath : chromePath;

    const tempDir = 'C:\\Users\\ianoh\\AppData\\Local\\Temp\\apple2c_cdp_profile_' + Date.now();

    const proc = spawn(browserPath, [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${tempDir}`,
      'about:blank'
    ], { stdio: 'ignore' });

    // Wait for CDP endpoint
    let pages = null;
    for (let i = 0; i < 40; i++) {
      try {
        pages = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9222/json', (r) => {
            let data = '';
            r.on('data', chunk => data += chunk);
            r.on('end', () => resolve(JSON.parse(data)));
          }).on('error', reject);
        });
        if (pages && pages.length > 0) break;
      } catch(e) {}
      await new Promise(r => setTimeout(r, 150));
    }

    if (!pages || pages.length === 0) {
      proc.kill();
      throw new Error('Failed to connect to browser CDP port 9222');
    }

    const page = pages.find(p => p.type === 'page') || pages[0];
    const client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    return { proc, client };
  }

  static async kill(proc) {
    if (proc && typeof proc.kill === 'function') {
      try { proc.kill(); } catch (e) {}
    }
  }
}
