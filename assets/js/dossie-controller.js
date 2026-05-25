/**
 * DOSSIÊ DO INVESTIDOR - CONTROLADOR DE INTERFACE (CONTROLLER)
 * Arquitetura Modular: assets/js/dossie-controller.js
 * Responsável por: Hidratação da UI, Orquestração de Recálculos e Gestão de Estado.
 * [Tolerância Zero]: Este arquivo gerencia a sincronização entre Engine e DOM.
 */

const DossieController = {
    /**
     * [INTELIGÊNCIA] CURADORIA DE ELITE IA:
     * Motor de decisão que seleciona os 4 melhores imóveis para o investidor.
     * 1. Maximiza o Poder de Compra: Pega os 4 matches mais caros dentro do orçamento.
     * 2. Estratégia de Upgrade: Se faltar match, completa com os menores déficits para estimular o fechamento.
     */
    rankEliteMatches: function(poderCompra) {
        if (typeof EMPREENDIMENTOS === 'undefined' || !EMPREENDIMENTOS.length) return;

        const parsePreco = (txt) => {
            if (typeof window.DossieEngine?.parsePreco === 'function') return window.DossieEngine.parsePreco(txt);
            return parseInt(txt.replace(/\D/g, '')) || 0;
        };

        // [ORDENAÇÃO] Vitrine Crescente: Garante que o investidor veja primeiro o menor investimento.
        const sorted = [...EMPREENDIMENTOS].sort((a, b) => {
            return parsePreco(a.preco) - parsePreco(b.preco);
        });

        // 2. Separar em grupos
        // 2. Separar em grupos baseados na avaliação real do motor
        const scenario = window.DossieEngine?.buildStrategyScenario({}, {}, window._originalSimData) || {};
        
        const matches = sorted.filter(e => {
            const preco = parsePreco(e.preco);
            const evalMatch = window.DossieEngine?.evaluateMatch(preco, scenario) || { isMatch: preco <= poderCompra };
            return evalMatch.isMatch;
        });
        
        const deficits = sorted.filter(e => {
            const preco = parsePreco(e.preco);
            const evalMatch = window.DossieEngine?.evaluateMatch(preco, scenario) || { isMatch: preco <= poderCompra };
            return !evalMatch.isMatch;
        });

        let finalSelection = [];

        if (matches.length >= 4) {
            // Cenário A: Muitos matches -> Pega a ELITE (os 4 mais caros que cabem no bolso)
            finalSelection = matches.slice(-4);
        } else if (matches.length > 0) {
            // Cenário B: 1-3 matches -> Pega todos e completa com os próximos (menores déficits)
            finalSelection = [...matches, ...deficits.slice(0, 4 - matches.length)];
        } else {
            // Cenário C: Nenhum match -> Pega os 4 menores déficits do mercado
            finalSelection = deficits.slice(0, 4);
        }

        // 3. Atualizar estado global
        window.currentMatches = finalSelection;
        
        // [NOVO] Forçar o brilho no botão correto logo após o ranking
        setTimeout(() => {
            if (typeof window.updateDots === 'function') window.updateDots();
        }, 500);
        
        // MT_LOG (04/2026): Atualiza contador de curadoria na UI
        const countEl = document.getElementById('curadoria-count');
        if (countEl) countEl.innerText = String(finalSelection.length).padStart(2, '0');
        
        console.log("IA Ranking: Selecionados " + finalSelection.length + " imóveis de elite.");
    },

    /**
     * Hidrata a página com dados do cache (LocalStorage).
     * Dispara a primeira renderização dos componentes financeiros.
     */
    hydrateFromCache: function(preserveName = null) {
        if (window.isUpdating) return;
        window.isUpdating = true;

        try {
            let rawData = localStorage.getItem('mt_sim_data');
            
            // Modo de Demonstração (Resiliência)
            if (!rawData) {
                console.warn("Dossiê: Cache vazio. Iniciando Modo de Demonstração.");
                const demoData = {
                    timestamp: new Date().toISOString(),
                    raw: { renda: 2900, entrada: 0, fgts: 12000, idade: 30, vinculo: 'clt' },
                    results: {
                        id: "MT-PRO-2026",
                        subsidio: 35000,
                        fgtsTotal: 12000,
                        entradaTotal: 0,
                        financiamento: 228000,
                        parcela: 850,
                        valorImovel: 275000,
                        taxa: 0.045,
                        prazo: 420,
                        score: 92,
                        scorePoints: { c1: 30, c2: 20, c3: 15, c4: 10, c5: 12, c6: 5 },
                        fullResults: {
                            potencial: 228000,
                            foraDoMCMV: false,
                            faixaMCMV: "Faixa 1",
                            parcelaEntrada: 0,
                            itbi: 0,
                            valorImovel: 275000,
                            poderReal: 275000
                        }
                    }
                };
                localStorage.setItem('mt_sim_data', JSON.stringify(demoData));
                rawData = JSON.stringify(demoData);
            }

            const data = JSON.parse(rawData);
            const res = data.results;

            window.MT_SimulatedPower = res.valorImovel || 0;
            _originalSimData = data;
            
            // DISPARAR CURADORIA IA ANTES DE RENDERIZAR
            this.rankEliteMatches(window.MT_SimulatedPower);
            if (window.DossieCarousel) window.DossieCarousel.initMatchIA(window.MT_SimulatedPower, preserveName);
            
            // Forçar brilho inicial
            setTimeout(() => { this.updateDots(0); }, 800);
            
            const formatter = (window.MT_Utils && window.MT_Utils.formatCurrency) ? window.MT_Utils.formatCurrency : (typeof formatCurrency === 'function' ? formatCurrency : (v) => v);

            // Injeção de Valores nos Mappings de Bento e Profile
            const mappings = {
                'bento-sub-val': formatter(res.subsidio),
                'bento-fgts-val': formatter(res.fgtsTotal),
                'bento-ent-val': formatter(res.entradaTotal),
                'bento-fin-val': formatter(res.financiamento),
                'prof-renda': formatter(data.raw.renda),
                'prof-taxa': ((res.taxa || 0) * 100).toFixed(2) + '% a.a.',
                'prof-prazo': res.prazo + ' meses',
                'prof-parcela': formatter(res.parcela),
                'prof-imovel-max': formatter(res.valorImovel),
                'bento-vgv-top': 'VGV: ' + formatter(res.valorImovel),
                'simulation-id': res.id,
                'sim-id-timeline': res.id,
                'val-timeline-chaves': formatter(res.parcela),
                'viability-enquadramento': res.fullResults.foraDoMCMV ? "SBPE / Médio Padrão" : ((res.fullResults.faixaMCMV || "MCMV") + " / Econômico")
            };

            // [V9.5] Os campos val-parcela-entrada, val-evolucao-obra, val-pos-chaves, val-timeline-obra 
            // são agora hidratados unificadamente pelo DossieFluxo - MT_LOG (05/2026)

            // [V10] Atualização dinâmica de ITBI condicional conforme o perfil - MT_LOG (05/2026)
            const itbiEl = document.getElementById('viability-itbi-status');
            if (itbiEl) {
                const perfilEnquadramento = res.fullResults.perfilEnquadramento;
                const itbiVal = res.fullResults.itbi || 0;
                if (perfilEnquadramento === 'HIS-1') {
                    itbiEl.style.display = 'flex';
                    itbiEl.innerHTML = '<span class="material-symbols-outlined text-xs">verified</span> ITBI GRÁTIS';
                    itbiEl.className = "bg-tertiary text-on-tertiary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(64,225,126,0.4)]";
                } else if (itbiVal > 0) {
                    itbiEl.style.display = 'flex';
                    itbiEl.innerHTML = `<span class="material-symbols-outlined text-xs">payments</span> ITBI: ${formatter(itbiVal)}`;
                    itbiEl.className = "bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg";
                } else {
                    itbiEl.style.display = 'none';
                }
            }

            for (const [id, value] of Object.entries(mappings)) {
                const el = document.getElementById(id);
                if (el) el.innerText = value;
            }

            // Atualização de Barras de Score
            this.updateScoreBars(res);

            // Recomendação IA
            const recEl = document.getElementById('ia-recommendation-text');
            if (recEl) {
                recEl.innerHTML = DossieEngine.generateDynamicRecommendation(res, data, formatter);
            }

            // Gauge de Score
            const gauge = document.getElementById('score-gauge');
            if (gauge) {
                const dashOffset = 691 - (691 * res.score / 100);
                setTimeout(() => {
                    gauge.style.strokeDashoffset = dashOffset;
                }, 100);
            }

            // Animação de Score Texto
            if (typeof window.animateScore === 'function') {
                window.finalScoreValue = res.score;
                window.requestAnimationFrame(window.animateScore);
            }

            // [PHASE 4] Sincronização do Comparativo de Modalidades
            this.syncComparativeTable(res, formatter);

            // [PHASE 5] Inicialização do Carrossel e Match IA
            if (window.DossieCarousel) {
                window.DossieCarousel.initMatchIA(res.valorImovel);
            }

            // [V9.5] Hidratação inicial do fluxo unificado - MT_LOG (05/2026)
            setTimeout(() => {
                if (window.DossieFluxo) window.DossieFluxo.hydrateFluxoPremium();
            }, 300);

        } catch (err) {
            console.error("DossieController: Erro crítico na hidratação:", err);
            window.isUpdating = false;
        } finally {
            window.isUpdating = false;
        }
    },

    /**
     * Animação do contador de Score (0 a 100).
     */
    animateScore: function(timestamp) {
        if (!window.scoreStartTime) window.scoreStartTime = timestamp;
        const progress = timestamp - window.scoreStartTime;
        const scoreElement = document.getElementById('score-value');
        if (!scoreElement) return;

        const target = window.finalScoreValue || 0;
        const duration = 2000;
        
        const currentScore = Math.min(Math.floor((progress / duration) * target), target);
        scoreElement.innerText = currentScore.toString().padStart(3, '0');

        if (progress < duration) {
            window.requestAnimationFrame(this.animateScore.bind(this));
        } else {
            window.scoreStartTime = null; // Reset para próxima animação
        }
    },

    /**
     * Sincroniza as barras de progresso do score.
     */
    updateScoreBars: function(res) {
        const pts = res.scorePoints || {};
        const barMappings = {
            'bar-renda': { p: ((pts.c1 || 0) / 30 * 100), label: 'score-c1-pts', txt: `${pts.c1 || 0}/30 pts`, status: 'bar-renda-status', stTxt: pts.c1 >= 25 ? 'Capacidade Plena' : 'Capacidade Moderada' },
            'bar-comprometimento': { p: ((pts.c2 || 0) / 20 * 100), label: 'score-c2-pts', txt: `${pts.c2 || 0}/20 pts`, status: 'bar-comp-status', stTxt: pts.c2 >= 15 ? 'Dentro do Limite' : 'Alerta de Margem' },
            'bar-fgts': { p: ((pts.c3 || 0) / 15 * 100), label: 'score-c5-pts', txt: `${pts.c3 || 0}/15 pts`, status: 'bar-fgts-status', stTxt: pts.c3 >= 10 ? 'Saldo Disponível' : 'Saldo Reduzido' },
            'bar-entrada': { p: ((pts.c4 || 0) / 15 * 100), label: 'score-c4-pts', txt: `${pts.c4 || 0}/15 pts`, status: 'bar-ent-status', stTxt: pts.c4 >= 10 ? 'Aporte Estratégico' : 'Aporte Mínimo' },
            'bar-historico': { p: ((pts.c5 || 0) / 12 * 100), label: 'score-c3-pts', txt: `${pts.c5 || 0}/12 pts`, status: 'bar-hist-status', stTxt: pts.c5 >= 10 ? 'Vínculo Estável' : 'Vínculo Recente' },
            'bar-idade': { p: ((pts.c6 || 0) / 8 * 100), label: 'score-c6-pts', txt: `${pts.c6 || 0}/8 pts`, status: 'bar-idade-status', stTxt: pts.c6 >= 6 ? 'Prazo Máximo OK' : 'Prazo Reduzido' }
        };

        for (const [id, config] of Object.entries(barMappings)) {
            const bar = document.getElementById(id);
            const lbl = document.getElementById(config.label);
            const st = document.getElementById(config.status);
            
            if (bar) {
                const perc = config.p || 0;
                bar.style.width = perc + '%';
                bar.classList.remove('bg-slate-700', 'bg-primary', 'bg-tertiary', 'shadow-[0_0_15px_rgba(64,225,126,0.4)]');
                
                if (perc >= 80) bar.classList.add('bg-tertiary', 'shadow-[0_0_15px_rgba(64,225,126,0.4)]');
                else if (perc > 0) bar.classList.add('bg-primary');
                else bar.classList.add('bg-slate-700');
            }

            if (lbl) lbl.innerText = config.txt;
            if (st) st.innerText = (config.p > 0) ? config.stTxt : "Sob Consulta";
        }
    },

    /**
     * Sincroniza a tabela comparativa de modalidades.
     */
    syncComparativeTable: function(res, formatter) {
        const taxaMcmvTxt = ((res.fullResults.taxaAnualMCMV || 0) * 100).toFixed(2) + "% + TR";
        const parMcmvTxt = formatter(res.parcela);

        const mappings = {
            'comp-mcmv-taxa': taxaMcmvTxt,
            'comp-mcmv-taxa-mobile': taxaMcmvTxt,
            'comp-mcmv-par': parMcmvTxt,
            'comp-mcmv-par-mobile': parMcmvTxt
        };

        for (const [id, val] of Object.entries(mappings)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }

        // SBPE Flex
        const sbpeData = res.fullResults.sbpe || { taxa: 0.1099, parcela: Math.round(res.parcela * 1.35) };
        const taxaSbpeTxt = (sbpeData.taxa * 100).toFixed(2) + "% + TR";
        const parSbpeTxt = formatter(sbpeData.parcela);

        const sbpeMap = {
            'comp-sbpe-taxa': taxaSbpeTxt,
            'comp-sbpe-taxa-mobile': taxaSbpeTxt,
            'comp-sbpe-par': parSbpeTxt,
            'comp-sbpe-par-mobile': parSbpeTxt
        };

        for (const [id, val] of Object.entries(sbpeMap)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }
    },

    /**
     * Recalcula a simulação para um imóvel específico escolhido no carrossel.
     */
    recalculateForProperty: function(empName) {
        if (window.isUpdating) return;
        window.isUpdating = true;

        try {
            const orig = _originalSimData;
            if (!orig) return;

            const emp = EMPREENDIMENTOS.find(e => e.nome === empName) || EMPREENDIMENTOS[0];
            const precoImovel = DossieEngine.parsePreco(emp.preco);
            const mesesObra = DossieEngine.getMesesParaEntrega(emp.entrega);
            const formatter = window.MT_Utils.formatCurrency;

            const extraRenda = window._strategyOverrides?.extraRenda || 0;
            const extraEntrada = window._strategyOverrides?.extraEntrada || 0;

            const scenario = DossieEngine.buildStrategyScenario({}, {
                extraRenda: extraRenda,
                extraEntrada: extraEntrada,
                extraFgts: _strategyProfile.fgts
            }, orig);

            const liveEval = DossieEngine.evaluateMatch(precoImovel, scenario, false, 0, { extraRenda, extraEntrada });
            const delta = liveEval.delta;
            const r = liveEval.sim;

            window.lastCalculatedPoder = r.poderReal;
            
            // Renderizações de UI
            this.updateBentoResults(orig, precoImovel, formatter);
            this.updateStrategyPanelHeader(emp, precoImovel, delta, formatter);
            this.updateProfileRuler(orig, formatter);
            this.updateStatusBadges(delta, formatter);
            this.updatePaymentFlow(precoImovel, r, mesesObra, formatter);

            if (typeof window.updateTargetMarkers === 'function') {
                window.updateTargetMarkers(empName);
            }

            if (typeof window.renderPortfolioDrawer === 'function') {
                window.renderPortfolioDrawer(); 
            }

            if (typeof window.updateDots === 'function') {
                window.updateDots();
            }

        } finally {
            window.isUpdating = false;
        }
    },

    updateBentoResults: function(orig, precoImovel, formatter) {
        const bentoMap = {
            'bento-sub-val': formatter(orig.results.subsidio),
            'bento-fgts-val': formatter(orig.results.fgtsTotal),
            'bento-ent-val': formatter(orig.results.entradaTotal),
            'bento-fin-val': formatter(orig.results.financiamento),
            'bento-vgv-top': 'VGV: ' + formatter(precoImovel)
        };
        for (const [id, val] of Object.entries(bentoMap)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }
    },

    updateStrategyPanelHeader: function(emp, precoImovel, stratDelta, formatter) {
        const headerMap = {
            'strategy-prop-title': emp.nome,
            'strategy-prop-price': formatter(precoImovel),
            'strategy-deficit-val': (stratDelta > 1000) ? `DÉFICIT: ${formatter(stratDelta)}` : 'MATCH CONFIRMADO'
        };
        for (const [id, val] of Object.entries(headerMap)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }
        
        const badge = document.getElementById('strategy-deficit-badge');
        if (badge) {
            const icon = badge.querySelector('.material-symbols-outlined');
            if (stratDelta > 1000) {
                badge.className = "badge-deficit px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg transition-all duration-300";
                if (icon) icon.innerText = 'warning';
            } else {
                badge.className = "badge-match badge-match-pulse px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg transition-all duration-300";
                if (icon) icon.innerText = 'verified';
            }
        }
        const stratImg = document.getElementById('strategy-prop-img');
        if (stratImg) stratImg.src = emp.imagem;
    },

    updateProfileRuler: function(orig, formatter) {
        const mappings = {
            'prof-renda': formatter(orig.raw.renda),
            'prof-taxa': ((orig.results.taxa || 0) * 100).toFixed(2) + '% a.a.',
            'prof-prazo': orig.results.prazo + ' meses',
            'prof-parcela': formatter(orig.results.parcela),
            'prof-imovel-max': formatter(window.MT_SimulatedPower)
        };
        for (const [id, val] of Object.entries(mappings)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }
    },

    updateStatusBadges: function(matchDelta, formatter) {
        const badge = document.getElementById('property-status-badge');
        const bIcon = document.getElementById('ps-badge-icon');
        const bText = document.getElementById('ps-badge-text');
        const btnJornada = document.getElementById('btn-open-jornada');

        if (badge) {
            badge.classList.add('active');
            if (matchDelta > 1000) {
                badge.classList.remove('badge-match');
                badge.classList.add('badge-deficit');
                if (bIcon) bIcon.innerText = 'warning';
                if (bText) bText.innerText = `DÉFICIT: ${formatter(matchDelta)}`;
                if (btnJornada) {
                    btnJornada.classList.add('ring-4', 'ring-red-500/30', 'btn-pulse-alert');
                    const jIcon = btnJornada.querySelector('.material-symbols-outlined');
                    if (jIcon) jIcon.innerText = 'construction';
                }
            } else {
                badge.classList.remove('badge-deficit');
                badge.classList.add('badge-match');
                if (bIcon) bIcon.innerText = 'verified';
                if (bText) bText.innerText = 'MATCH ALTO IA';
                if (btnJornada) {
                    btnJornada.classList.remove('ring-4', 'ring-red-500/30', 'btn-pulse-alert');
                    const jIcon = btnJornada.querySelector('.material-symbols-outlined');
                    if (jIcon) jIcon.innerText = 'rocket_launch';
                }
            }
        }
        
        // Sincronização do Botão de Fluxo
        this.updateFluxoButtonState(matchDelta, formatter);
    },

    updateFluxoButtonState: function(matchDelta, formatter) {
        const fluxoBtn = document.getElementById('btn-abrir-fluxo');
        const fluxoBtnIA = document.getElementById('btn-open-fluxo-ia');
        const statusLabel = document.getElementById('fluxo-status-label');
        const cadeadoIcon = document.getElementById('fluxo-cadeado-icon');

        if (fluxoBtn) {
            fluxoBtn.classList.remove('opacity-50', 'pointer-events-none');
            if (matchDelta <= 1000) {
                fluxoBtn.classList.add('btn-fluxo-success', 'btn-pulse');
                if (fluxoBtnIA) {
                    fluxoBtnIA.classList.add('bg-tertiary', 'text-on-tertiary', 'btn-pulse', 'border-tertiary');
                    fluxoBtnIA.classList.remove('bg-slate-900', 'text-primary', 'border-primary/40');
                }
                if (statusLabel) {
                    statusLabel.innerHTML = '<span class="fluxo-icon material-symbols-outlined text-[10px]">auto_awesome</span><span class="fluxo-main">CONDIÇÃO IDEAL</span><span class="fluxo-ver text-[9px] ml-2">Ver Cronograma</span>';
                    statusLabel.className = "bg-tertiary text-on-tertiary text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(64,225,126,0.4)] animate-bounce";
                }
            } else {
                fluxoBtn.classList.remove('btn-fluxo-success', 'btn-pulse');
                if (fluxoBtnIA) {
                    fluxoBtnIA.classList.remove('bg-tertiary', 'text-on-tertiary', 'btn-pulse', 'border-tertiary');
                    fluxoBtnIA.classList.add('bg-slate-900', 'text-primary', 'border-primary/40');
                }
                if (statusLabel) {
                    statusLabel.innerHTML = '<span class="fluxo-icon material-symbols-outlined text-[12px]">verified_user</span><span class="fluxo-main">Liberado</span><span class="fluxo-ver text-[9px] ml-2">Ver Cronograma</span>';
                    statusLabel.className = "bg-tertiary/20 text-tertiary text-[8px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm";
                }
            }
            if (cadeadoIcon) {
                cadeadoIcon.innerText = matchDelta <= 1000 ? 'check_circle' : 'verified_user';
            }
        }
    },

    updatePaymentFlow: function(precoImovel, r, mesesObra, formatter) {
        if (window.DossieFluxo) {
            const finalFgts = (window._strategyProfile?.fgts || 0) + (window._originalSimData?.raw?.fgts || 0);
            const extraEntrada = window._strategyOverrides?.extraEntrada || 0;
            const finalEntrada = (_originalSimData.raw.entrada || 0) + extraEntrada;
            
            window.DossieFluxo.renderFluxoPagamento(r, finalEntrada, finalFgts);
        }
    }
};

// Exportar globalmente
window.DossieController = DossieController;
