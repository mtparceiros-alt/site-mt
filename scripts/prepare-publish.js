// Prepara a pasta Site_MT_Final copiando o conteúdo de dist/
const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'dist');
const dest = path.join(process.cwd(), 'Site_MT_Final');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(src)) {
  console.error('Pasta dist/ não encontrada. Rode npm run build primeiro.');
  process.exit(1);
}

// Apaga pasta destino antes de copiar
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
copyRecursive(src, dest);
console.log('Pasta Site_MT_Final atualizada com sucesso a partir de dist/');
