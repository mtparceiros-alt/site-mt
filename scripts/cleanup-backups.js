// Remove arquivos de backup (.bkp, .bak) e move para _limpeza_backup
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const backupDir = path.join(root, '_limpeza_backup');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_limpeza_backup' || entry.name === 'node_modules') continue;
      scan(full);
    } else {
      const lower = entry.name.toLowerCase();
      if (lower.endsWith('.bkp') || lower.endsWith('.bak')) {
        const rel = path.relative(root, full);
        const dest = path.join(backupDir, rel.replace(/[\\/:]/g, '_'));
        fs.renameSync(full, dest);
        console.log('Movido:', full, '->', dest);
      }
    }
  }
}
scan(root);
console.log('Limpeza completa. Arquivos .bkp/.bak movidos para _limpeza_backup');
