#!/usr/bin/env node
/**
 * 🔒 SCRIPT DE OFUSCAÇÃO PROFISSIONAL
 * 
 * Ofusca arquivos JavaScript originais em dist/ utilizando a biblioteca javascript-obfuscator.
 * Protege a propriedade intelectual da MT Parceiros.
 * 
 * Uso: node scripts/obfuscate.js
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_DIR = path.join(__dirname, '../assets/js');
const DIST_DIR = path.join(__dirname, '../dist/assets/js');

console.log('🔒 Iniciando ofuscação de código profissional...\n');

// Cria diretório de destino
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
    console.log(`✅ Diretório criado: ${DIST_DIR}`);
}

// Busca Dinâmica de Arquivos Críticos para ofuscar (Core Business Logic)
const arquivosFull = fs.readdirSync(SRC_DIR).filter(f => 
    f.endsWith('.js') && 
    !f.includes('.min.js') && 
    !f.includes('.bkp') && 
    !f.startsWith('temp_')
);

console.log(`📂 Encontrados ${arquivosFull.length} arquivos para blindagem.`);

// Lista de arquivos que devem ser ignorados (bibliotecas ja minificadas ou externas)
const IGNORAR = new Set(['isotope.js', 'owl-carousel.js']);
const arquivos = arquivosFull.filter(f => !IGNORAR.has(f));

// Configurações de Ofuscação (Nível: ALTO)
const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.75,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
};

arquivos.forEach(arquivo => {
    const caminhoOrigem = path.join(SRC_DIR, arquivo);
    const caminhoDestino = path.join(DIST_DIR, arquivo.replace('.js', '.min.js'));

    if (!fs.existsSync(caminhoOrigem)) {
        console.warn(`⚠️  Arquivo não encontrado: ${arquivo}`);
        return;
    }

    try {
        console.log(`📦 Ofuscando com javascript-obfuscator: ${arquivo}`);

        // Lê arquivo original
        const conteudo = fs.readFileSync(caminhoOrigem, 'utf8');

        // Aplica ofuscação real
        const result = JavaScriptObfuscator.obfuscate(conteudo, obfuscatorOptions);
        const ofuscado = result.getObfuscatedCode();

        // Escreve arquivo ofuscado
        fs.writeFileSync(caminhoDestino, ofuscado, 'utf8');

        const tamanhoOrigem = conteudo.length;
        const tamanhoOfuscado = ofuscado.length;
        const variacao = (((tamanhoOfuscado / tamanhoOrigem) - 1) * 100).toFixed(2);

        console.log(`   ✅ Ofuscado: ${caminhoDestino}`);
        console.log(`   📊 ${tamanhoOrigem} bytes → ${tamanhoOfuscado} bytes (Variação: ${variacao}%)\n`);

    } catch (erro) {
        console.error(`❌ Erro ao ofuscar ${arquivo}:`);
        console.error(erro.message);
        process.exit(1);
    }
});

console.log('✅ Ofuscação PROFISSIONAL CONCLUÍDA!\n');
