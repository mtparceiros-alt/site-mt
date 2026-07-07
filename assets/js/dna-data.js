/**
 * @file dna-data.js — Banco de Dados de Autoridade (DNA da Conquista Segura)
 * Gerado automaticamente a partir do catálogo atual de empreendimentos.
 */

const DNA_DATA = {
    "Vivaz Penha 2": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Vivaz Estação Lapa": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Grand Vivaz Jardim França Paris": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Vivaz Selection Santo Amaro": { valor: 9.4, jur: 9.7, tec: 9.3, fin: 9.4 },
    "Vivaz Selection Laguna": { valor: 9.4, jur: 9.7, tec: 9.2, fin: 9.5 },
    "Vivaz Estação Pirituba": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.5 },
    "Vivaz Parque João Dias": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Vivaz Connection Adolfo Pinheiro": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Vivaz Parque Freguesia do Ó (1, 2 e 3)": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Vivaz Santa Marina": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Vivaz Cantareira (1, 2 e 3)": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Vivaz Estação Pirituba": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.5 },
    "Vivaz Prime Vila Prudente": { valor: 9.4, jur: 9.7, tec: 9.2, fin: 9.4 },
    "CASA PIAUÍ HIGIENÓPOLIS": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "HAVVA HIGIENÓPOLIS": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "COLLAGE BELA VISTA": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "PATTEO VILA MARIANA": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "PATTEO VILA MARIANA": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "OPEN MIND": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "ROYA PERDIZES": { valor: 9.2, jur: 9.8, tec: 9.2, fin: 9.4 },
    "METROPOLITAN": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Caminhos da Lapa-Nova Vivere": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Caminhos da Lapa-Nova Vivere": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Caminhos da Lapa - Garden design": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Signature": { valor: 9.4, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Concept Barra Funda": { valor: 9.2, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Abytá Santo Amaro": { valor: 9.2, jur: 9.7, tec: 9.3, fin: 9.4 },
    "Brooklin SKY": { valor: 9.2, jur: 9.8, tec: 9.2, fin: 9.4 },
    "011 Brooklin": { valor: 9.2, jur: 9.8, tec: 9.2, fin: 9.4 },
    "Estilo Lapa": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 },
    "Grand Vivaz Lapa": { valor: 9.3, jur: 9.7, tec: 9.2, fin: 9.4 }
};

/**
 * Função Auxiliar para obter notas de um imóvel
 */
function getPropertyDNA(name) {
    return DNA_DATA[name] || { valor: 9.0, jur: 9.8, tec: 9.0, fin: 9.0 };
}

window.getPropertyDNA = getPropertyDNA;
