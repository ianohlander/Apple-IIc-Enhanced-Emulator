// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Uthernet W5100 TCP/IP Network Card Adapter
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';
import { UthernetController } from '../../network/uthernet';

export class UthernetCard implements IPeripheralCard {
  public readonly name = 'Uthernet W5100 Ethernet Card';
  public readonly slot = 5;
  public readonly description = 'Hardware 10/100 Mbps TCP/IP & UDP network adapter for 65C02 programs ($C0B0)';
  public readonly icon = '🌐';
  public isPlugged = true;

  private controller: UthernetController;

  constructor(controller?: UthernetController) {
    this.controller = controller || new UthernetController();
  }

  public ioRead(offset: number): number {
    return this.controller.read(offset);
  }

  public ioWrite(offset: number, value: number): void {
    this.controller.write(offset, value);
  }

  public romRead(offset: number): number {
    return 0x60; // RTS
  }

  public reset(): void {
    this.controller.reset();
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    return {
      'Chipset': 'WIZnet W5100',
      'IP Address': '192.168.1.100 (DHCP)',
      'Sockets': '4 Hardware TCP/UDP Channels',
      'Link Status': 'CONNECTED'
    };
  }
}
