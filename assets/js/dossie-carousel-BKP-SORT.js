/**
 * DOSSIÊ DO INVESTIDOR - MÓDULO DE CAROUSEL (CAROUSEL)
 * Arquitetura Modular: assets/js/dossie-carousel.js
 * Responsável por: Listagem de imóveis, Match Engine visual e Portfólio.
 */

const DossieCarousel = {
    /**
     * Inicializa o motor de Match e renderiza a lista inicial.
     */
    initMatchIA: function(poderCompra, preserveName = null) {
        console.log("DossieCarousel: Inicializando com poder de R$ " + poderCompra);
        
        // Renderizar gaveta lateral
        this.renderPortfolioDrawer(poderCompra);
        
        // Renderizar modal completo
        this.renderPortfolioModal(poderCompra);

        // Se houver um nome preservado, seleciona-o
        if (preserveName) {
            setTimeout(() => {
                if (window.selectPropertyByName) window.selectPropertyByName(preserveName);
            }, 100);
        } else {
            // Seleciona o primeiro da curadoria por padrão
            const matches = window.currentMatches || [];
            if (matches.length > 0) {
                setTimeout(() => {
                    if (window.selectPropertyByName) window.selectPropertyByName(matches[0].nome);
                }, 100);
            }
        }
    },

    /**
     * Renderiza a lista de imóveis na gaveta lateral (Sidebar).
     */
    renderPortfolioDrawer: function(poderCompra) {
        const grid = document.getElementById('portfolio-drawer-grid');
        const pilotGrid = document.getElementById('pilot-portfolio-grid'); // Mobile Pilot
        if (!grid) return;

        const html = EMPREENDIMENTOS.map(emp => {
            const preco = DossieEngine.parsePreco(emp.preco);
            const power = window.lastCalculatedPoder || poderCompra || 0;
            
            // MT_LOG (04/2026): Criar cenário atual para avaliação dinâmica
            const scenario = DossieEngine.buildStrategyScenario({}, _strategyOverrides, _originalSimData);
            const evalMatch = DossieEngine.evaluateMatch(preco, scenario, false, power);
            const isMatch = evalMatch.delta <= 1000;

            return `
                <div class="portfolio-item group ${isMatch ? 'match' : 'deficit'}" 
                     onclick="selectPropertyByName('${emp.nome}')"
                     data-name="${emp.nome}">
                    <div class="relative overflow-hidden rounded-lg aspect-video mb-2">
                        <img src="${emp.imagem}" class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500">
                        <div class="absolute top-2 right-2">
                            ${isMatch ? 
                                '<span class="bg-tertiary text-on-tertiary text-[8px] font-black px-2 py-0.5 rounded shadow-lg">MATCH IA</span>' : 
                                '<span class="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded backdrop-blur-md">DÉFICIT</span>'
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
    renderPortfolioModal: function(poderCompra) {
        const grid = document.getElementById('portfolio-modal-grid');
        if (!grid) return;

        grid.innerHTML = EMPREENDIMENTOS.map(emp => {
            const preco = DossieEngine.parsePreco(emp.preco);
            const power = window.lastCalculatedPoder || poderCompra || 0;
            
            const scenario = DossieEngine.buildStrategyScenario({}, _strategyOverrides, _originalSimData);
            const evalMatch = DossieEngine.evaluateMatch(preco, scenario, false, power);
            const isMatch = evalMatch.delta <= 1000;

            return `
                <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/40 transition-all group" 
                     onclick="selectPropertyByName('${emp.nome}'); closePortfolioModal();">
                    <div class="relative h-48">
                        <img src="${emp.imagem}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div class="absolute bottom-4 left-4">
                            <h3 class="text-white font-bold">${emp.nome}</h3>
                            <p class="text-slate-400 text-xs">${emp.endereco}</p>
                        </div>
                    </div>
                    <div class="p-4 flex justify-between items-center">
                        <div>
                            <p class="text-[10px] text-slate-500 uppercase font-bold">Investimento</p>
                            <p class="text-primary font-bold">${emp.preco}</p>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 rounded-full text-[10px] font-black ${isMatch ? 'bg-tertiary text-on-tertiary' : 'bg-white/10 text-slate-400'}">
                                ${isMatch ? 'PRONTO PARA MATCH' : 'PERFIL EM AJUSTE'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Atualiza os marcadores de alvo (Goal Posts) no Cockpit.
     */
    updateTargetMarkers: function(empName) {
        const emp = EMPREENDIMENTOS.find(e => e.nome === empName) || EMPREENDIMENTOS[0];
        const preco = DossieEngine.parsePreco(emp.preco);
        const orig = _originalSimData;
        if (!orig) return;

        // Perfil atual (Base + Overrides + Pilot)
        const scenario = {
            renda: (orig.raw.renda || 0) + (_strategyOverrides.extraRenda || 0),
            entrada: (orig.raw.entrada || 0) + (_strategyOverrides.extraEntrada || 0),
            fgts: (orig.raw.fgts || 0) + (_strategyProfile.fgts || 0),
            idade: _strategyProfile.idade || 30,
            vinculo: _strategyProfile.vinculo || 'clt',
            dividas: orig.raw.dividas || 0,
            clt3anos: orig.raw.clt3anos ?? true,
            isPrimeiroImovel: orig.raw.isPrimeiroImovel ?? true,
            possuiDependentes: orig.raw.possuiDependentes ?? false
        };

        // MT_LOG (04/2026): Cálculo de Alvos de Equilíbrio (Renda e Entrada)
        const rawTargetRenda = DossieEngine.findMatchTarget('renda', scenario, preco, orig);
        const targetRenda = DossieEngine.calibrateOperationalTarget('renda', scenario, preco, rawTargetRenda, orig);

        const rawTargetEntrada = DossieEngine.findMatchTarget('entrada', scenario, preco, orig);
        const targetEntrada = DossieEngine.calibrateOperationalTarget('entrada', scenario, preco, rawTargetEntrada, orig);
        
        // Atualizar visual da Régua de Renda
        const markerRenda = document.getElementById('target-marker-renda');
        const valRenda = document.getElementById('target-val-renda');
        const boxRenda = document.getElementById('target-box-renda');
        
        if (markerRenda && valRenda) {
            // Percentual relativo ao alvo
            const currentRenda = scenario.renda;
            const totalRequired = (orig.raw.renda || 0) + targetRenda;
            const pRenda = Math.min(100, Math.max(0, (currentRenda / totalRequired) * 100));
            
            markerRenda.style.left = `calc(${pRenda}% - 2px)`;
            valRenda.innerText = window.MT_Utils.formatCurrency(totalRequired);
            
            if (pRenda >= 98) boxRenda?.classList.add('met-reached');
            else boxRenda?.classList.remove('met-reached');
        }

        // Atualizar visual da Régua de Entrada
        const markerEnt = document.getElementById('target-marker-ent');
        const valEnt = document.getElementById('target-val-ent');
        const boxEnt = document.getElementById('target-box-ent');
        
        if (markerEnt && valEnt) {
            const currentEntrada = scenario.entrada + scenario.fgts;
            const totalRequiredEnt = (orig.raw.entrada || 0) + (orig.raw.fgts || 0) + targetEntrada;
            const pEnt = Math.min(100, Math.max(0, (currentEntrada / totalRequiredEnt) * 100));
            
            markerEnt.style.left = `calc(${pEnt}% - 2px)`;
            valEnt.innerText = window.MT_Utils.formatCurrency(totalRequiredEnt);
            
            if (pEnt >= 98) boxEnt?.classList.add('met-reached');
            else boxEnt?.classList.remove('met-reached');
        }
    }
};

// Exportar globalmente
window.DossieCarousel = DossieCarousel;
