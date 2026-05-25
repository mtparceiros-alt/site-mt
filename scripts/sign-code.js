#!/usr/bin/env node
/**
 * 🔑 SCRIPT DE ASSINATURA DIGITAL
 * 
 * Gera assinatura SHA256 para cada arquivo ofuscado
 * Permite validação de integridade no browser
 * 
 * Cria arquivo: dist/assets/.code-signatures.json
 * 
 * Uso: node scripts/sign-code.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = path.join(__dirname, '../dist/assets/js');
const SIGNATURES_FILE = path.join(DIST_DIR, '.code-signatures.json');

console.log('🔑 Gerando assinaturas digitais...\n');

// Verifica se dist existe
if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Diretório dist não encontrado!');
    console.error('   Execute primeiro: npm run obfuscate');
    process.exit(1);
}

const signatures = {};
const timestamp = new Date().toISOString();

// Arquivos ofuscados
const arquivos = [
    'simulator-core.min.js',
    'index-logic.min.js',
    'score-module.min.js',
    'score-melhorias.min.js'
];

arquivos.forEach(arquivo => {
    const caminhoArquivo = path.join(DIST_DIR, arquivo);
    
    if (!fs.existsSync(caminhoArquivo)) {
        console.warn(`⚠️  Arquivo não encontrado: ${arquivo}`);
        return;
    }
    
    try {
        console.log(`📝 Assinando: ${arquivo}`);
        
        // Lê arquivo
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
        
        // Gera hash SHA256
        const hash = crypto
            .createHash('sha256')
            .update(conteudo)
            .digest('hex');
        
        // Gera HMAC com chave secreta (em produção, venha de .env)
        const chaveSecreta = process.env.SIGNING_KEY || 'chave-publica-demo-2026';
        const hmac = crypto
            .createHmac('sha256', chaveSecreta)
            .update(conteudo)
            .digest('hex');
        
        signatures[arquivo] = {
            sha256: hash,
            hmac: hmac,
            timestamp: timestamp,
            tamanho: conteudo.length,
            versao: '1.0'
        };
        
        console.log(`   ✅ Hash: ${hash.substring(0, 16)}...`);
        console.log(`   🔐 HMAC: ${hmac.substring(0, 16)}...\n`);
        
    } catch(erro) {
        console.error(`❌ Erro ao assinar ${arquivo}:`);
        console.error(erro.message);
        process.exit(1);
    }
});

// Escreve manifesto de assinaturas
try {
    fs.writeFileSync(
        SIGNATURES_FILE,
        JSON.stringify(signatures, null, 2),
        'utf8'
    );
    
    console.log(`\n✅ Assinaturas salvas em: .code-signatures.json`);
    console.log(`📊 ${Object.keys(signatures).length} arquivos assinados\n`);
    
    // Mostra exemplo de uso
    console.log('💡 Exemplo de uso no browser:\n');
    const exemploAssinatura = signatures['simulator-core.min.js'];
    console.log(`const signatures = ${JSON.stringify(exemploAssinatura, null, 2)};`);
    console.log(`\nif (calculatedHash === signatures.sha256) {`);
    console.log(`    console.log('✅ Arquivo íntegro!');`);
    console.log(`}\n`);
    
} catch(erro) {
    console.error('❌ Erro ao salvar assinaturas:');
    console.error(erro.message);
    process.exit(1);
}

console.log('✅ Assinatura CONCLUÍDA!\n');
