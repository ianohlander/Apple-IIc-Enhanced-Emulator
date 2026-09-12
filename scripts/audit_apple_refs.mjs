import fs from 'fs';
import path from 'path';

function findFiles(dir, extList = ['.html', '.md']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === 'backups' || file === '.git') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, extList));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extList.includes(ext)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const docFiles = findFiles('./docs').concat(findFiles('./qa'));
const uniqueFiles = Array.from(new Set(docFiles));

const results = [];
for (const file of uniqueFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/(?:Apple|Apple\s*II|Apple\s*\/\/)/i.test(line)) {
      results.push({
        file: path.relative('.', file).replace(/\\/g, '/'),
        lineNum: idx + 1,
        text: line.trim()
      });
    }
  });
}

console.log(`Total remaining lines matching Apple: ${results.length}`);
for (const r of results) {
  console.log(`[${r.file}:${r.lineNum}] ${r.text.slice(0, 110)}`);
}

