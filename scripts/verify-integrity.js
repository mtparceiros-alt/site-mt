/**
 * SCRIPT DE VERIFICACAO
 *
 * Valida se o build esta seguro e publicavel.
 * Uso: npm run verify
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let tudoOk = true;

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_JS_DIR = path.join(DIST_DIR, 'assets', 'js');

console.log('\nVERIFICANDO INTEGRIDADE E PUBLICACAO...\n');

// 1) .gitignore
console.log('1) Verificando .gitignore...');
try {
  const gitignorePath = path.join(ROOT, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    console.log('   ERRO: .gitignore nao encontrado');
    tudoOk = false;
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const linhasCriticas = ['src/', 'assets/js/simulator-core.js', '.env'];

    linhasCriticas.forEach((linha) => {
      if (gitignoreContent.includes(linha)) {
        console.log(`   OK: ${linha} esta no .gitignore`);
      } else {
        console.log(`   ERRO: falta ${linha} no .gitignore`);
        tudoOk = false;
      }
    });
  }
} catch (err) {
  console.log(`   ERRO ao ler .gitignore: ${err.message}`);
  tudoOk = false;
}

// 2) Historico git
console.log('\n2) Verificando se codigo original foi commitado...');
try {
  const output = execSync('git log --all --full-history -- "assets/js/simulator-core.js" 2>&1', {
    encoding: 'utf8'
  });

  if (output.trim() === '') {
    console.log('   OK: codigo original nao foi encontrado no historico');
  } else {
    console.log('   AVISO: codigo original pode estar no historico do git');
  }
} catch (err) {
  console.log('   AVISO: repositorio git indisponivel neste ambiente');
}

// 3) Arquivos .min.js esperados
console.log('\n3) Verificando arquivos minificados obrigatorios...');
const minEsperados = [
  'simulator-core.min.js',
  'index-logic.min.js',
  'score-module.min.js',
  'score-melhorias.min.js',
  'dash-ia.min.js',
  'new-results-v2.min.js',
  'sandbox-connector.min.js'
];

if (!fs.existsSync(DIST_JS_DIR)) {
  console.log('   ERRO: diretorio dist/assets/js nao encontrado. Rode npm run build');
  tudoOk = false;
} else {
  minEsperados.forEach((arquivo) => {
    const caminho = path.join(DIST_JS_DIR, arquivo);
    if (fs.existsSync(caminho)) {
      const tamanho = fs.statSync(caminho).size;
      console.log(`   OK: ${arquivo} (${tamanho} bytes)`);
    } else {
      console.log(`   ERRO: falta ${arquivo}`);
      tudoOk = false;
    }
  });
}

// 4) Assinaturas
console.log('\n4) Verificando assinaturas digitais...');
const signaturesPath = path.join(DIST_JS_DIR, '.code-signatures.json');
if (fs.existsSync(signaturesPath)) {
  try {
    const signatures = JSON.parse(fs.readFileSync(signaturesPath, 'utf8'));
    const nomes = Object.keys(signatures);
    console.log(`   OK: assinaturas encontradas (${nomes.length} arquivos)`);
    nomes.forEach((nome) => {
      const sig = signatures[nome];
      const hashCurto = sig && sig.sha256 ? sig.sha256.slice(0, 16) : 'indefinido';
      console.log(`      - ${nome} | SHA256: ${hashCurto}...`);
    });
  } catch (err) {
    console.log(`   ERRO ao ler assinaturas: ${err.message}`);
    tudoOk = false;
  }
} else {
  console.log('   AVISO: assinaturas nao encontradas (rode npm run sign-code)');
}

// 5) Estrutura minima do dist
console.log('\n5) Verificando estrutura obrigatoria do dist...');
const itensObrigatorios = [
  'index.html',
  'properties.html',
  'property-details.html',
  'contato.html',
  'simulador.html',
  'empreendimentos.js',
  'assets/css',
  'assets/images',
  'assets/js',
  'vendor/bootstrap/css/bootstrap.min.css',
  'vendor/bootstrap/js/bootstrap.min.js',
  'vendor/jquery/jquery.min.js',
  'videos/videoplayback.mp4',
  'assets/js/simulador-page.min.js'
];

itensObrigatorios.forEach((rel) => {
  const alvo = path.join(DIST_DIR, rel);
  if (fs.existsSync(alvo)) {
    console.log(`   OK: ${rel}`);
  } else {
    console.log(`   ERRO: ausente em dist -> ${rel}`);
    tudoOk = false;
  }
});

// 6) Links locais quebrados nos HTML do dist
console.log('\n6) Verificando links locais (src/href) no dist...');
const htmls = [
  'index.html',
  'properties.html',
  'property-details.html',
  'contato.html',
  'simulador.html'
].map((h) => path.join(DIST_DIR, h));

const ignorePrefix = /^(https?:|mailto:|tel:|javascript:|data:|#|\/\/)/i;
const attrRegex = /(?:src|href)=["']([^"']+)["']/gi;

function normalizarAlvo(raw) {
  const semHash = raw.split('#')[0];
  const semQuery = semHash.split('?')[0];
  return semQuery.trim();
}

for (const htmlPath of htmls) {
  if (!fs.existsSync(htmlPath)) {
    console.log(`   ERRO: HTML nao encontrado para validacao: ${path.basename(htmlPath)}`);
    tudoOk = false;
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const faltantes = new Set();
  let match;

  while ((match = attrRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw || ignorePrefix.test(raw)) continue;

    const rel = normalizarAlvo(raw);
    if (!rel) continue;

    const resolved = path.resolve(path.dirname(htmlPath), rel);
    if (!fs.existsSync(resolved)) {
      faltantes.add(rel);
    }
  }

  if (faltantes.size === 0) {
    console.log(`   OK: ${path.basename(htmlPath)} sem referencias locais quebradas`);
  } else {
    console.log(`   ERRO: ${path.basename(htmlPath)} possui referencias ausentes:`);
    for (const rel of faltantes) {
      console.log(`      - ${rel}`);
    }
    tudoOk = false;
  }
}

// 7) Scripts npm essenciais
console.log('\n7) Verificando scripts npm...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const scriptsEsperados = ['build', 'obfuscate', 'sign-code', 'verify'];

  scriptsEsperados.forEach((script) => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`   OK: npm run ${script}`);
    } else {
      console.log(`   AVISO: npm run ${script} nao definido`);
    }
  });
} catch (err) {
  console.log(`   ERRO ao ler package.json: ${err.message}`);
  tudoOk = false;
}

console.log('\n' + '='.repeat(60));
if (tudoOk) {
  console.log('OK: TODAS AS VERIFICACOES PASSARAM');
  console.log('Dist esta consistente para publicacao.');
} else {
  console.log('ERRO: FORAM ENCONTRADOS PROBLEMAS');
  console.log('Revise os itens acima e rode npm run build && npm run verify.');
}
console.log('='.repeat(60) + '\n');

process.exit(tudoOk ? 0 : 1);
