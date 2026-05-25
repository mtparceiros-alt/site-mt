#!/usr/bin/env node
/**
 * SCRIPT DE COPIA DE ASSETS
 *
 * Copia CSS, HTML e outros assets para dist/
 * Tambem minifica CSS.
 *
 * Uso: node scripts/copy-assets.js
 */

const fs = require('fs');
const path = require('path');

const ASSETS_SRC = path.join(__dirname, '../assets');
const HTML_SRC = path.join(__dirname, '../');
const DIST_DIR = path.join(__dirname, '../dist');
// O pipeline binário agora filtra tudo o que não for .min.js automaticamente
// para evitar vazamento de código legível.

console.log('Copiando assets para dist/...\n');

const estrutura = [
  'assets/css',
  'assets/images',
  'assets/webfonts',
  'vendor/bootstrap/css',
  'vendor/bootstrap/js',
  'vendor/jquery'
];

estrutura.forEach((pasta) => {
  const caminho = path.join(DIST_DIR, pasta);
  if (!fs.existsSync(caminho)) {
    fs.mkdirSync(caminho, { recursive: true });
    console.log(`Criado: ${pasta}`);
  }
});

copiarArquivos(
  path.join(ASSETS_SRC, 'css'),
  path.join(DIST_DIR, 'assets/css'),
  ['.css'],
  true
);

copiarArquivos(
  path.join(ASSETS_SRC, 'images'),
  path.join(DIST_DIR, 'assets/images'),
  ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
);

copiarRecursivamente(
  path.join(ASSETS_SRC, 'images'),
  path.join(DIST_DIR, 'assets/images')
);

copiarArquivos(
  path.join(ASSETS_SRC, 'webfonts'),
  path.join(DIST_DIR, 'assets/webfonts'),
  ['.woff', '.woff2', '.ttf', '.eot']
);

copiarJsAuxiliares();

copiarArquivos(
  path.join(__dirname, '../vendor/bootstrap/css'),
  path.join(DIST_DIR, 'vendor/bootstrap/css'),
  ['.css']
);

copiarArquivos(
  path.join(__dirname, '../vendor/bootstrap/js'),
  path.join(DIST_DIR, 'vendor/bootstrap/js'),
  ['.min.js']
);

copiarArquivos(
  path.join(__dirname, '../vendor/jquery'),
  path.join(DIST_DIR, 'vendor/jquery'),
  ['.js', '.min.js']
);

processarHTML();

copiarArquivoRaiz('empreendimentos.js');
copiarArquivoRaiz('robots.txt');
copiarArquivoRaiz('sitemap.xml');
copiarArquivoRaiz('.nojekyll');
copiarArquivoRaiz('CNAME');

copiarDiretorioInteiro(
  path.join(__dirname, '../videos'),
  path.join(DIST_DIR, 'videos')
);

console.log('\nAssets copiados com sucesso.\n');

function copiarRecursivamente(origem, destino) {
  if (!fs.existsSync(origem)) return;

  const itens = fs.readdirSync(origem);
  itens.forEach((item) => {
    const caminhoOrigem = path.join(origem, item);
    const caminhoDestino = path.join(destino, item);
    const stats = fs.statSync(caminhoOrigem);

    if (stats.isDirectory()) {
      if (!fs.existsSync(caminhoDestino)) {
        fs.mkdirSync(caminhoDestino, { recursive: true });
      }
      copiarRecursivamente(caminhoOrigem, caminhoDestino);
    } else if (stats.isFile()) {
      try {
        fs.copyFileSync(caminhoOrigem, caminhoDestino);
      } catch (err) {
        console.error(`Erro ao copiar ${item}: ${err.message}`);
      }
    }
  });
}

function copiarArquivos(origem, destino, extensoes, minificar = false) {
  if (!fs.existsSync(origem)) return;

  if (!fs.existsSync(destino)) {
    fs.mkdirSync(destino, { recursive: true });
  }

  const arquivos = fs.readdirSync(origem);

  arquivos.forEach((arquivo) => {
    const temExtensao = extensoes.some((ext) => arquivo.endsWith(ext));
    if (!temExtensao) return;

    const lowerArq = arquivo.toLowerCase();
    if (lowerArq.includes('.bkp') || lowerArq.includes('.temp') || lowerArq.startsWith('temp_')) return;

    const origemArquivo = path.join(origem, arquivo);
    const destinoArquivo = path.join(destino, arquivo);

    try {
      if (minificar && arquivo.endsWith('.css') && !arquivo.endsWith('.min.css')) {
        const conteudo = fs.readFileSync(origemArquivo, 'utf8');
        const minificado = conteudo
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\s+/g, ' ')
          .replace(/\s*([{}:;,>+~])\s*/g, '$1');

        fs.writeFileSync(destinoArquivo, minificado, 'utf8');
        console.log(`OK ${arquivo} (minificado)`);
      } else {
        fs.copyFileSync(origemArquivo, destinoArquivo);
        console.log(`OK ${arquivo}`);
      }
    } catch (err) {
      console.error(`Erro ao copiar ${arquivo}: ${err.message}`);
    }
  });
}

function processarHTML() {
  const paginas = ['index.html', 'properties.html', 'property-details.html', 'contato.html', 'simulador.html', 'preview-results.html', 'blog.html'];
  paginas.forEach(processarHtmlArquivo);
}

function processarHtmlArquivo(nomeArquivo) {
  const origem = path.join(HTML_SRC, nomeArquivo);
  const destino = path.join(DIST_DIR, nomeArquivo);

  if (!fs.existsSync(origem)) {
    console.warn(`Aviso: ${nomeArquivo} nao encontrado`);
    return;
  }

  try {
    let conteudo = fs.readFileSync(origem, 'utf8');
    conteudo = substituirScriptsJsPorMinQuandoDisponivel(conteudo);
    fs.writeFileSync(destino, conteudo, 'utf8');
    console.log(`OK ${nomeArquivo} (processado para usar .min quando existir)`);
  } catch (err) {
    console.error(`Erro ao processar ${nomeArquivo}: ${err.message}`);
  }
}

function substituirScriptsJsPorMinQuandoDisponivel(html) {
  const re = /(<script[^>]*\ssrc=")assets\/js\/([^"?#]+)\.js(\?[^\"]*)?("[^>]*><\/script>)/g;
  return html.replace(re, (match, p1, nomeBase, query = '', p4) => {
    const nomeMin = `${nomeBase}.min.js`;
    const caminhoMin = path.join(DIST_DIR, 'assets', 'js', nomeMin);
    if (!fs.existsSync(caminhoMin)) {
      return match;
    }
    return `${p1}assets/js/${nomeMin}${query}${p4}`;
  });
}

function copiarJsAuxiliares() {
  const origemJs = path.join(ASSETS_SRC, 'js');
  const destinoJs = path.join(DIST_DIR, 'assets/js');

  if (!fs.existsSync(origemJs)) return;
  if (!fs.existsSync(destinoJs)) fs.mkdirSync(destinoJs, { recursive: true });

  const arquivos = fs.readdirSync(origemJs);
  arquivos.forEach((arquivo) => {
    const origem = path.join(origemJs, arquivo);
    const destino = path.join(destinoJs, arquivo);
    const ext = path.extname(arquivo).toLowerCase();
    
    if (ext !== '.js' && ext !== '.json') return;
    
    // REGRA BINARIA DE SEGURANÇA: Só copiamos se for .min.js OU se for um JSON autorizado.
    // Exceção vital: bibliotecas do carrossel que não passam por ofuscação.
    const EXCECOES = ['isotope.js', 'owl-carousel.js'];
    if (ext === '.js' && !arquivo.endsWith('.min.js') && !EXCECOES.includes(arquivo)) {
      return; 
    }

    const lowerArq = arquivo.toLowerCase();
    if (lowerArq.includes('.bkp') || lowerArq.includes('.temp') || lowerArq.startsWith('temp_')) return;

    try {
      fs.copyFileSync(origem, destino);
      console.log(`OK assets/js/${arquivo}`);

      if (arquivo === 'isotope.js') {
        const destinoMin = path.join(destinoJs, 'isotope.min.js');
        fs.copyFileSync(origem, destinoMin);
        console.log('OK assets/js/isotope.min.js (alias de isotope.js)');
      }
    } catch (err) {
      console.error(`Erro ao copiar ${arquivo}: ${err.message}`);
    }
  });
}

function copiarArquivoRaiz(nomeArquivo) {
  const origem = path.join(HTML_SRC, nomeArquivo);
  const destino = path.join(DIST_DIR, nomeArquivo);

  if (!fs.existsSync(origem)) return;

  try {
    fs.copyFileSync(origem, destino);
    console.log(`OK ${nomeArquivo}`);
  } catch (err) {
    console.error(`Erro ao copiar ${nomeArquivo}: ${err.message}`);
  }
}

function copiarDiretorioInteiro(origem, destino) {
  if (!fs.existsSync(origem)) return;

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
      fs.copyFileSync(caminhoOrigem, caminhoDestino);
    }
  });
  console.log(`OK ${path.relative(DIST_DIR, destino)}`);
}
