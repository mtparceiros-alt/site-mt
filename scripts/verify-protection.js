/**
 * SCRIPT DE AUDITORIA DE SEGURANÇA - MT PARCEIROS
 * Objetivo: Garantir que nenhum código-fonte legível chegue à pasta de deploy.
 */

const fs = require('fs');
const path = require('path');

const targetArg = process.argv[2] || '../../github_site/Site_MT_Final/assets/js';
const DEPLOY_DIR = path.resolve(targetArg);
const PROHIBITED_WORDS = ['function calcularSimulacao', 'const rendaBruta', 'var score'];

console.log('🔍 Iniciando Auditoria de Blindagem...');

if (!fs.existsSync(DEPLOY_DIR)) {
    console.error('❌ ERRO: Pasta de deploy não encontrada.');
    process.exit(1);
}

const files = fs.readdirSync(DEPLOY_DIR).filter(f => f.endsWith('.js'));
let issues = 0;

files.forEach(file => {
    const content = fs.readFileSync(path.join(DEPLOY_DIR, file), 'utf8');
    
    // Verifica se o arquivo contém a marca hexadecimal de ofuscação
    if (!content.includes('_0x')) {
        console.warn(`⚠️ ALERTA: O arquivo ${file} NÃO parece estar ofuscado!`);
        issues++;
    }

    // Verifica palavras proibidas
    PROHIBITED_WORDS.forEach(word => {
        if (content.includes(word)) {
            console.error(`🚨 CRÍTICO: Logica exposta encontrada no arquivo ${file} -> "${word}"`);
            issues++;
        }
    });
});

if (issues === 0) {
    console.log('✅ SUCESSO: Todos os arquivos estão blindados e protegidos.');
    process.exit(0);
} else {
    console.error(`❌ FALHA: Encontrados ${issues} problemas de segurança. CORRIJA ANTES DO PUSH.`);
    process.exit(1);
}
