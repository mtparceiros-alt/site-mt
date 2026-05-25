/**
 * optimize-images.js — MT Parceiros Image Optimizer
 * 
 * Este script automatiza a conversão de imagens PNG pesadas para JPG otimizado,
 * garantindo alta performance (LCP) sem perda de qualidade visual perceptível.
 * 
 * USO: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = 'assets/images/empreendimentos';
const backupDir = '_limpeza_backup/imagens_originais';

// Garantir que a pasta de backup existe
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 Pasta de backup criada: ${backupDir}`);
}

async function optimizeImages() {
    console.log('🚀 Iniciando otimização de imagens...');
    
    const files = fs.readdirSync(inputDir);
    let count = 0;

    for (const file of files) {
        if (path.extname(file).toLowerCase() === '.png') {
            const inputPath = path.join(inputDir, file);
            const stats = fs.statSync(inputPath);
            
            // Só otimiza se for maior que 300KB ou se for PNG (PNGs tendem a ser maiores)
            if (stats.size > 300 * 1024 || path.extname(file).toLowerCase() === '.png') {
                const fileNameNoExt = path.parse(file).name;
                const outputPath = path.join(inputDir, `${fileNameNoExt}.jpg`);
                const backupPath = path.join(backupDir, file);

                console.log(`📸 Processando: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

                try {
                    await sharp(inputPath)
                        .resize({ width: 1400, withoutEnlargement: true }) // Máximo 1400px de largura
                        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
                        .toFile(outputPath);

                    // Mover o original para o backup
                    fs.renameSync(inputPath, backupPath);
                    
                    const newStats = fs.statSync(outputPath);
                    const reduction = ((1 - newStats.size / stats.size) * 100).toFixed(1);
                    
                    console.log(`   ✅ Sucesso! Novo tamanho: ${(newStats.size / 1024).toFixed(0)} KB | Redução: ${reduction}%`);
                    count++;
                } catch (err) {
                    console.error(`   ❌ Erro ao processar ${file}:`, err.message);
                }
            }
        }
    }

    console.log(`\n✨ Processamento concluído! ${count} imagens otimizadas.`);
    console.log(`📦 Originais movidos para: ${backupDir}`);
}

optimizeImages();
