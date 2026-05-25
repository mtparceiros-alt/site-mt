/**
 * DOSSIÊ DO INVESTIDOR - MÓDULO DE CAROUSEL (CAROUSEL)
 * Arquitetura Modular: assets/js/dossie-carousel.js
 * Responsável por: Listagem de imóveis, Match Engine visual e Portfólio.
 * MT_LOG (05/2026): Vitrine de portfólio com badges dinâmicos de déficit.
 * MT_LOG (V10.0): Os UIDs selecionados aqui são o gatilho principal do Aprovador.
 */

const DossieCarousel = {
    /**
     * Inicializa o motor de Match e renderiza a lista inicial.
     */
    initMatchIA: function(poderCompra, preserveUid = null) {
        console.log("DossieCarousel: Inicializando com poder de R$ " + poderCompra);
        
        // Renderizar gaveta lateral
        this.renderPortfolioDrawer();
        
        // Renderizar modal completo
        this.renderPortfolioModal();

        // Se houver um UID preservado, seleciona-o
        if (preserveUid) {
            setTimeout(() => {
                if (window.selectPropertyByUid) window.selectPropertyByUid(preserveUid);
            }, 100);
        } else {
            // Seleciona o primeiro da curadoria por padrão
            const matches = window.currentMatches || [];
            if (matches.length > 0) {
                setTimeout(() => {
                    if (window.selectPropertyByUid) window.selectPropertyByUid(matches[0].uid);
                }, 100);
            }
        }
    },

    /**
     * Renderiza a lista de imóveis na gaveta lateral (Sidebar).
     */
    renderPortfolioDrawer: function() {
        const grid = document.getElementById('portfolio-drawer-grid');
        const pilotGrid = document.getElementById('pilot-portfolio-grid');
        if (!grid) return;

        const disponiveis = [...EMPREENDIMENTOS].filter(e => {
            const p = DossieEngine.parsePreco(e.preco);
            return p > 0 && p !== Infinity;
        });

        // MT_LOG (05/2026): Criar cenário atual para avaliação dinâmica baseada no Motor Financeiro
        const extraRenda = parseInt(document.getElementById('slider-strategy-renda')?.value || 0);
        const extraEntrada = parseInt(document.getElementById('slider-strategy-ent')?.value || 0);
        
        const scenario = DossieEngine.buildStrategyScenario({}, { extraRenda, extraEntrada }, window._originalSimData);
        
        // Enriquecer e Ordenar: Matches primeiro, depois menor déficit
        const enriched = disponiveis.map(emp => {
            const preco = DossieEngine.parsePreco(emp.preco);
            const evalMatch = DossieEngine.evaluateMatch(preco, scenario);
            return { ...emp, eval: evalMatch };
        }).sort((a, b) => {
            if (a.eval.isMatch && !b.eval.isMatch) return -1;
            if (!a.eval.isMatch && b.eval.isMatch) return 1;
            return a.eval.delta - b.eval.delta;
        });

        const html = enriched.map(emp => {
            const isMatch = emp.eval.isMatch;
            const delta = emp.eval.delta;
            const deltaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(delta).replace('R$', '').trim();

            return `
                <div class="portfolio-item group ${isMatch ? 'match' : 'deficit'}" 
                     onclick="selectPropertyByUid('${emp.uid}')"
                     data-uid="${emp.uid}">
                    <div class="relative overflow-hidden rounded-lg aspect-video mb-2">
                        <img src="${emp.imagem}" class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500">
                        <div class="absolute top-2 right-2">
                            ${isMatch ? 
                                '<span class="bg-tertiary text-on-tertiary text-[8px] font-black px-2 py-0.5 rounded shadow-lg">MATCH IA</span>' : 
                                `<span class="bg-red-500/90 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg backdrop-blur-sm flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[10px]">warning</span> R$ ${deltaFmt}
                                 </span>`
                            }
                        </div>
                    </div>
                    <div class="px-1">
                        <h4 class="text-white text-xs font-bold truncate">${emp.nome}</h4>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-slate-500 text-[10px]">${emp.entrega}</span>
                            <span class="text-primary text-[10px] font-bold">${emp.preco}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = html;
        if (pilotGrid) pilotGrid.innerHTML = html;
    },

    /**
     * Renderiza o modal de portfólio completo.
     */
    renderPortfolioModal: function() {
        const grid = document.getElementById('portfolio-modal-grid');
        if (!grid) return;

        // FILTRO: Apenas imóveis comerciais ativos
        const disponiveis = [...EMPREENDIMENTOS].filter(e => {
            const p = DossieEngine.parsePreco(e.preco);
            return p > 0 && p !== Infinity;
        });

        const extraRenda = parseInt(document.getElementById('slider-strategy-renda')?.value || 0);
        const extraEntrada = parseInt(document.getElementById('slider-strategy-ent')?.value || 0);
        const scenario = DossieEngine.buildStrategyScenario({}, { extraRenda, extraEntrada }, window._originalSimData);
        
        // Enriquecer e Ordenar Inteligente
        const enriched = disponiveis.map(emp => {
            const preco = DossieEngine.parsePreco(emp.preco);
            const evalMatch = DossieEngine.evaluateMatch(preco, scenario);
            return { ...emp, eval: evalMatch };
        }).sort((a, b) => {
            if (a.eval.isMatch && !b.eval.isMatch) return -1;
            if (!a.eval.isMatch && b.eval.isMatch) return 1;
            return a.eval.delta - b.eval.delta;
        });

        grid.innerHTML = enriched.map(emp => {
            const isMatch = emp.eval.isMatch;
            const delta = emp.eval.delta;
            const deltaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(delta);

            return `
                <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/40 transition-all group cursor-pointer relative" 
                     onclick="selectPropertyByUid('${emp.uid}'); closePortfolioModal();">
                    <div class="relative h-48">
                        <img src="${emp.imagem}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                        
                        <!-- Badge de Status Premium -->
                        <div class="absolute top-4 right-4 z-10">
                            ${isMatch ? 
                                '<span class="bg-tertiary text-on-tertiary text-[10px] font-black px-3 py-1.5 rounded-lg shadow-2xl border border-white/10 flex items-center gap-1 animate-pulse-gentle"><span class="material-symbols-outlined text-[14px]">check_circle</span> MATCH IA</span>' : 
                                `<span class="bg-red-500/90 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-2xl border border-white/10 flex items-center gap-1 backdrop-blur-md">
                                    <span class="material-symbols-outlined text-[14px]">warning</span> DÉFICIT: ${deltaFmt}
                                 </span>`
                            }
                        </div>

                        <div class="absolute bottom-4 left-4">
                            <h3 class="text-white font-bold text-lg">${emp.nome}</h3>
                            <p class="text-slate-400 text-xs flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">location_on</span>
                                ${emp.endereco || emp.bairro}
                            </p>
                        </div>
                    </div>
                    <div class="p-4 flex justify-between items-center bg-black/20">
                        <div>
                            <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Investimento</p>
                            <p class="text-primary font-bold text-base">${emp.preco}</p>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 rounded-full text-[10px] font-black ${isMatch ? 'text-tertiary' : 'text-slate-500'}">
                                ${isMatch ? 'PRONTO PARA AVANÇAR' : 'REQUER AJUSTE'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// Exportar globalmente
window.DossieCarousel = DossieCarousel;
