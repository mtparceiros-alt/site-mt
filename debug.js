const fs = require('fs');

// Mock environment
global.window = {
    _originalSimData: { raw: { entrada: 10000, fgts: 5000 }, results: { subsidio: 50000, potencial: 100000, parcela: 800 } },
    activePropertyUid: 'prop1',
    lastMatchResult: { sim: { subsidio: 50000, potencial: 100000, parcela: 800 } },
    DossieEngine: {
        parsePreco: (p) => 200000,
        getMesesParaEntrega: () => 24
    },
    MT_Utils: { formatCurrency: (v) => `R$ ${v}` }
};
global.EMPREENDIMENTOS = [{ uid: 'prop1', preco: '200k', entrega: 'Dez/2025' }];
global.document = {
    getElementById: (id) => ({ innerText: '', src: '', className: '' })
};

try {
    const code = fs.readFileSync('assets/js/dossie-fluxo.js', 'utf8');
    eval(code);
    console.log("Evaluating dossie-fluxo.js succeeded.");
    DossieFluxo.hydrateFluxoPremium();
    console.log("hydrateFluxoPremium finished without throwing.");
} catch (e) {
    console.error("CRASH:", e);
}
