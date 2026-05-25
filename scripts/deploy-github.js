const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../dist');
// O caminho do repositorio GIT configurado pelo cliente
const GITHUB_REPO_DIR = path.join(__dirname, '../../github_site/Site_MT_Final');

// Pastas a deletar no destino ANTES de copiar (para limpar rastros antigos)
const FOLDERS_TO_CLEAN = ['assets', 'vendor', 'videos'];

// 🚫 ARQUIVOS PROIBIDOS (Estes NUNCA devem ir para o repositório público)
const FORBIDDEN_FILES = ['.env', 'sync_cms.py', 'Empreendimentos.xlsx', 'coords_cache.json'];

console.log('🚀 Iniciando Pipeline de Deploy Automático para o GitHub...');

// 1. Validar se a pasta dist existe
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ ERRO: A pasta dist/ não existe. Rode "npm run build" primeiro!');
  process.exit(1);
}

// 2. Validar se a pasta do GitHub existe
if (!fs.existsSync(GITHUB_REPO_DIR)) {
  console.error(`❌ ERRO: O diretório do GitHub não foi encontrado em: ${GITHUB_REPO_DIR}`);
  console.error('Verifique se o nome da pasta principal está correto.');
  process.exit(1);
}

// 3. Limpeza AGRESSIVA do Destino (Segurança Total)
console.log('🧹 Limpando repositório público (Removendo rastros do projeto e arquivos sensíveis)...');

const KEEP_FILES = ['.git', '.nojekyll', 'Web.config', 'googleead4466f86f6eb72.html', 'robots.txt'];

const rootDestItems = fs.readdirSync(GITHUB_REPO_DIR);
rootDestItems.forEach(item => {
  if (KEEP_FILES.includes(item)) return;

  const targetPath = path.join(GITHUB_REPO_DIR, item);
  try {
    if (fs.statSync(targetPath).isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`   - Deletada Pasta: ${item}/`);
    } else {
      fs.unlinkSync(targetPath);
      console.log(`   - Deletado Arquivo: ${item}`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Não foi possível deletar ${item}: ${err.message}`);
  }
});

// 4. Copiar tudo de dist/ para o Repositório Git
console.log('📦 Copiando novos arquivos ofuscados para o Repositório...');
copiarDiretorioInteiro(DIST_DIR, GITHUB_REPO_DIR);

console.log('✅ Cópia concluída com sucesso e SEGURANÇA!');
console.log('===========================================================');
console.log('⚠️  PASSO FINAL PARA VOCÊ:');
console.log('   Abra seu GitHub Desktop (ou Git Bash) na pasta Site_MT_Final.');
console.log('   1. Digite o nome da atualização no campo "Summary".');
console.log('   2. Clique em "Commit to main".');
console.log('   3. Clique em "Push origin".');
console.log('===========================================================');


// --- Funções Auxiliares ---
function copiarDiretorioInteiro(origem, destino) {
  if (!fs.existsSync(destino)) {
    fs.mkdirSync(destino, { recursive: true });
  }

  const itens = fs.readdirSync(origem);
  itens.forEach((item) => {
    const caminhoOrigem = path.join(origem, item);
    const caminhoDestino = path.join(destino, item);
    const stat = fs.statSync(caminhoOrigem);

    if (stat.isDirectory()) {
      copiarDiretorioInteiro(caminhoOrigem, caminhoDestino);
    } else {
      // 🛡️ Filtro de Segurança do MT Parceiros
      if (FORBIDDEN_FILES.includes(item)) {
        console.warn(`🛑 SEGURANÇA: Bloqueada a cópia do arquivo sensível: ${item}`);
        return;
      }
      fs.copyFileSync(caminhoOrigem, caminhoDestino);
    }
  });
}
