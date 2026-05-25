/**
 * DOSSIÊ DO INVESTIDOR - MÓDULO DE ESTRATÉGIA (STRATEGY)
 * Arquitetura Modular: assets/js/dossie-strategy.js
 * 
 * Este módulo (O Cockpit) controla a interface de "Ajustar Perfil". Ele gerencia 
 * sliders, botões de vínculo e a sincronização visual com o motor de cálculo.
 * MT_LOG (V10.0): Os dados manipulados aqui alimentam o Aprovador Universal.
 */

const DossieStrategy = {
    /**
     * Inicializa os sliders e marcadores na carga da página.
     */
    init: function() {
        console.log("DossieStrategy: Inicializando Cockpit...");
        this._initialDelta = 0; 
        
        // MT_LOG (05/2026): Captura o Poder Inicial de forma imutável para a sessão do cockpit
        const orig = window._originalSimData;
        this._initialPower = (orig && orig.results) ? (orig.results.valorImovel || window.MT_SimulatedPower) : (window.MT_SimulatedPower || 0);
        
        this.updateStrategyValues();
    },

    /**
     * Altera o tipo de vínculo (CLT, PJ, Público, etc).
     */
    selectProfileVinculo: function(v, btn) {
        if (!window._strategyProfile) window._strategyProfile = { idade: 30, fgts: 0, vinculo: 'clt' };
        
        const vinculoMap = {
            pj: 'autonomo', clt: 'clt', publico: 'publico',
            autonomo: 'autonomo', mei: 'mei', aposentado: 'aposentado'
        };
        window._strategyProfile.vinculo = vinculoMap[v] || 'clt';
        
        // [V9.5] Visibilidade do checkbox cotista (apenas CLT) - MT_LOG (05/2026)
        const wrapClt3 = document.getElementById('wrap-strategy-clt3anos');
        const chkClt3 = document.getElementById('opt-strategy-clt3anos');
        if (wrapClt3) {
            if (v === 'clt') {
                wrapClt3.style.display = 'flex';
            } else {
                wrapClt3.style.display = 'none';
                if (chkClt3) chkClt3.checked = false;
                window._strategyProfile.clt3anos = false;
            }
        }

        // UI: Atualiza o destaque visual dos botões (MT_LOG 05/2026 - Fix de Seleção Dupla)
        if (btn && btn.parentElement) {
            const container = btn.parentElement;
            container.querySelectorAll('.pill-btn').forEach(b => {
                // Remove QUALQUER classe de destaque (sólida ou transparente)
                b.classList.remove('active', 'bg-primary', 'text-on-primary', 'bg-primary/20', 'text-primary', 'border-primary/30', 'border-transparent', 'shadow-lg', 'shadow-primary/20');
                // Adiciona o estado inativo padrão com borda visível
                b.classList.add('border', 'border-white/10', 'text-slate-500');
            });
            
            // Aplica o Estilo Ativo Sólido Premium
            btn.classList.add('active', 'bg-primary', 'text-on-primary', 'shadow-lg', 'shadow-primary/20');
            btn.classList.remove('border-white/10', 'text-slate-500');
            // Mantemos a classe 'border' mas trocamos para transparente para não conflitar com o fundo sólido
            btn.classList.add('border-transparent');
        }
        
        this.updateStrategyValues();
    },

    /**
     * Atualiza dados de Idade e FGTS do perfil de estratégia.
     */
    updateStrategyProfile: function() {
        if (!window._strategyProfile) window._strategyProfile = { idade: 30, fgts: 0, vinculo: 'clt' };
        
        const ageEl = document.getElementById('opt-strategy-idade');
        const fgtsEl = document.getElementById('opt-strategy-fgts');
        
        if (ageEl) window._strategyProfile.idade = parseInt(ageEl.value) || 30;
        if (fgtsEl) window._strategyProfile.fgts = parseInt(fgtsEl.value) || 0;
        
        // [V9.5] Checkbox cotista do novo proponente - MT_LOG (05/2026)
        const clt3El = document.getElementById('opt-strategy-clt3anos');
        if (clt3El) window._strategyProfile.clt3anos = clt3El.checked;
        
        // Atualiza os labels numéricos na UI
        const vIdade = document.getElementById('val-opt-idade');
        const vFgts = document.getElementById('val-opt-fgts');
        if (vIdade) vIdade.innerText = window._strategyProfile.idade;
        if (vFgts) vFgts.innerText = window.MT_Utils ? window.MT_Utils.formatCurrency(window._strategyProfile.fgts) : window._strategyProfile.fgts;
        
        this.updateStrategyValues();
    },

    /**
     * Orquestrador de mudanças.
     * MT_LOG (05/2026): Centraliza a reatividade de todos os sliders do cockpit.
     */
    updateStrategyValues: function() {
        if (window.isUpdatingStrategy) return;
        window.isUpdatingStrategy = true;
        try {
            this._internalUpdateStrategyValues();
        } finally {
            window.isUpdatingStrategy = false;
        }
    },

    /**
     * Lógica central de reatividade.
     */
    _internalUpdateStrategyValues: function() {
        // MT_LOG (05/2026): Unificação via UID - Recuperação de ativo blindada contra nomes repetidos.
        const sliderRenda = document.getElementById('slider-strategy-renda');
        const sliderEntrada = document.getElementById('slider-strategy-ent');
        
        const extraRenda = sliderRenda ? parseInt(sliderRenda.value) : 0;
        const extraEntrada = sliderEntrada ? parseInt(sliderEntrada.value) : 0;

        // Atualiza labels de valores adicionais
        const rendaLabel = document.getElementById('val-strategy-renda-label');
        const entLabel = document.getElementById('val-strategy-ent-label');
        if (rendaLabel) rendaLabel.innerText = `+ ${window.MT_Utils ? window.MT_Utils.formatCurrency(extraRenda) : extraRenda}`;
        if (entLabel) entLabel.innerText = `+ ${window.MT_Utils ? window.MT_Utils.formatCurrency(extraEntrada) : extraEntrada}`;

        const orig = window._originalSimData;
        if (orig && window.DossieEngine) {
            // [V9.5] COMPOSIÇÃO DE RENDA: Novo Proponente como ADIÇÃO - MT_LOG (05/2026)
            const newVinculo = window._strategyProfile.vinculo || 'clt';
            
            // 1. Pré-ajustar a renda extra pelo vínculo do NOVO proponente
            let effectiveExtraRenda = extraRenda;
            if (newVinculo === 'autonomo' || newVinculo === 'pj') {
                effectiveExtraRenda = Math.round(extraRenda * 0.80);
            } else if (newVinculo === 'mei') {
                effectiveExtraRenda = Math.round(Math.min(extraRenda, 6750) * 0.80);
            }
            // CLT e Público: 100% (sem redução)

            // 2. Compor cotista: TRUE se QUALQUER proponente qualifica (Blindagem 4.5%)
            // MT_LOG (05/2026): Regra de Ouro — se um tem 3 anos de CLT, o contrato inteiro ganha a taxa reduzida.
            const origClt3anos = !!(orig.raw && orig.raw.clt3anos);
            const novoClt3anos = (newVinculo === 'clt' && !!(window._strategyProfile.clt3anos));
            const composedClt3anos = origClt3anos || novoClt3anos;

            // 3. Idade Composta: Regra de Seguro Habitacional (MIP)
            // Usa-se a idade do mais velho para definir o prazo máximo do financiamento (80 anos - idade).
            const origIdade = (orig.raw && orig.raw.idade) || 30;
            const novaIdade = window._strategyProfile.idade || origIdade;
            const composedIdade = Math.max(origIdade, novaIdade);

            // 4. Cenário composto (mantém vinculo original para não re-ajustar renda base)
            const scenario = {
                ...orig.raw,
                renda: (orig.raw.renda || 0) + effectiveExtraRenda,
                entrada: (orig.raw.entrada || 0) + extraEntrada,
                fgts: (orig.raw.fgts || 0) + (window._strategyProfile.fgts || 0),
                idade: composedIdade,
                vinculo: (orig.raw && orig.raw.vinculo) || 'clt', // PRESERVA o original
                clt3anos: composedClt3anos                           // COMPÕE cotista
            };

            const activeUid = window.activePropertyUid;
            const emp = (typeof EMPREENDIMENTOS !== 'undefined') ? (EMPREENDIMENTOS.find(e => e.uid === activeUid) || EMPREENDIMENTOS[0]) : null;
            
            if (emp) {
                const precoImovel = window.DossieEngine.parsePreco(emp.preco);
                
                // [V9.5 / V10.0] Globalização de Overrides - MT_LOG (05/2026)
                // Variável consumida pelo DossieFluxo e pelo Aprovador Universal 
                // (dossie.html) para reportar as estratégias ativadas no WhatsApp.
                window._strategyOverrides = {
                    extraRenda: extraRenda,
                    extraEntrada: extraEntrada,
                    extraFgts: window._strategyProfile.fgts || 0
                };

                const liveEval = window.DossieEngine.evaluateMatch(precoImovel, scenario, window._strategyOverrides);
                
                // MT_LOG (05/2026): SINCRONIA V9.2 - Subtração Linear vs Real
                this.updateCockpitHeader(emp, liveEval.linearDelta, liveEval.isEfficient);
                this.updateQuickKPIs(liveEval.sim, orig, scenario, liveEval.linearDelta, liveEval.netLeverageGain, liveEval.isEfficient);
                this.updateHeaderDeficitBadge(liveEval.linearDelta);
                this.updateIAInsight(liveEval.delta, liveEval.sim, orig);

                // Marcadores de alvo (Goal Posts)
                this.updateTargetMarkers(activeUid, liveEval.delta, extraRenda, extraEntrada);
            }
        }
    },

    /**
     * Atualiza o cabeçalho do Cockpit com os dados do imóvel em análise.
     * MT_LOG (05/2026): Automação solicitada pelo usuário.
     */
    updateCockpitHeader: function(emp, delta, isEfficient = true) {
        if (!emp) return;
        const hTitle = document.getElementById('strategy-prop-title');
        const hPrice = document.getElementById('strategy-prop-price');
        const hImg = document.getElementById('strategy-prop-img');
        const hDeficit = document.getElementById('strategy-deficit-val');
        const hBadge = document.getElementById('strategy-deficit-badge');

        if (hTitle) hTitle.innerText = emp.nome;
        if (hPrice) hPrice.innerText = emp.preco;
        if (hImg) hImg.src = emp.imagem;
        
        if (hDeficit) {
            const isMatch = delta <= 100;
            const fmt = window.MT_Utils.formatCurrency;
            if (isMatch) {
                hDeficit.innerText = "MATCH CONFIRMADO";
                if (hBadge) hBadge.className = "badge-match badge-match-pulse px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg";
            } else {
                hDeficit.innerText = `DÉFICIT: ${fmt(delta)}`;
                if (hBadge) hBadge.className = isEfficient ? "badge-deficit px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg" : "badge-deficit-warning px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg";
            }
        }
    },

    /**
     * Mini-cards de KPI.
     */
    updateQuickKPIs: function(r, orig, scenario, delta, leverageGain, isEfficient = true) {
        const pPoder = document.getElementById('kpi-strategy-poder');
        const pParcela = document.getElementById('kpi-strategy-parcela');
        const pFaixa = document.getElementById('kpi-strategy-faixa');
        const pCobertura = document.getElementById('kpi-strategy-cobertura');

        if (pPoder) {
            // MT_LOG (05/2026): Sincronia de KPIs V9.5 - Mostra Ganho Líquido (Real)
            pPoder.innerText = `+ ${window.MT_Utils ? window.MT_Utils.formatCurrency(leverageGain || 0) : (leverageGain || 0)}`;
            
            // Visual feedback for efficiency loss
            const card = pPoder.parentElement;
            if (card) {
                if (!isEfficient && leverageGain > 1000) {
                    card.style.borderColor = "rgba(255, 107, 107, 0.4)";
                    card.classList.add('pulse-efficiency-warning');
                } else {
                    card.style.borderColor = "";
                    card.classList.remove('pulse-efficiency-warning');
                }
            }
        }
        if (pParcela) pParcela.innerText = window.MT_Utils ? window.MT_Utils.formatCurrency(r.parcela || 0) : r.parcela;
        if (pFaixa) pFaixa.innerText = r.foraDoMCMV ? 'SBPE' : r.faixaMCMV;
        
        if (pCobertura) {
            // MT_LOG (05/2026): Cobertura agora considera o cenário completo (Poder Blindado / Preço)
            const activeUid = window.activePropertyUid;
            const emp = (typeof EMPREENDIMENTOS !== 'undefined') ? (EMPREENDIMENTOS.find(e => e.uid === activeUid) || EMPREENDIMENTOS[0]) : null;
            
            if (emp) {
                const preco = window.DossieEngine.parsePreco(emp.preco);
                const perc = Math.min(100, Math.floor(((r.poderReal || 0) / preco) * 100));
                pCobertura.innerText = `${perc}%`;
            }
        }
    },

    /**
     * Badges de Déficit/Match.
     */
    updateHeaderDeficitBadge: function(delta) {
        const stratBadge = document.getElementById('strategy-deficit-badge');
        const stratVal = document.getElementById('strategy-deficit-val');
        const mainBadge = document.getElementById('property-status-badge');
        
        const isMatch = delta <= 100;
        const formattedDelta = window.MT_Utils ? window.MT_Utils.formatCurrency(delta) : delta;

        if (stratBadge && stratVal) {
            const bIcon = stratBadge.querySelector('.material-symbols-outlined');
            if (!isMatch) {
                // stratBadge.className = "badge-deficit px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg"; // Já tratado no updateCockpitHeader
                if (bIcon) bIcon.innerText = 'warning';
                // stratVal.innerText = `DÉFICIT: ${formattedDelta}`;
            } else {
                // stratBadge.className = "badge-match badge-match-pulse px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg";
                if (bIcon) bIcon.innerText = 'verified';
                // stratVal.innerText = 'MATCH CONFIRMADO';
            }
        }

        if (mainBadge) {
            const mainIcon = document.getElementById('ps-badge-icon');
            const mainText = document.getElementById('ps-badge-text');
            if (!isMatch) {
                mainBadge.className = "property-status-badge active badge-deficit px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/10";
                if (mainIcon) mainIcon.innerText = 'warning';
                if (mainText) mainText.innerText = `DÉFICIT: ${formattedDelta}`;
            } else {
                mainBadge.className = "property-status-badge active badge-match px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/10";
                if (mainIcon) mainIcon.innerText = 'verified';
                if (mainText) mainText.innerText = 'MATCH ALTO IA';
            }
        }
    },

    /**
     * Insight IA.
     */
    updateIAInsight: function(delta, r, orig) {
        const insightMsg = document.getElementById('ia-insight-msg');
        if (insightMsg) {
            if (delta <= 100) {
                insightMsg.innerText = "Parabéns! Você atingiu o potencial necessário para este imóvel.";
                insightMsg.className = "text-[10px] text-tertiary font-bold";
            } else {
                insightMsg.innerText = "Arraste os sliders para simular o cenário ideal de compra.";
                insightMsg.className = "text-[10px] text-slate-300";
            }
        }
    },

    /**
     * Aplica o cenário ao Dossiê.
     */
    applyStrategyCenario: function() {
        const extraRenda = parseInt(document.getElementById('slider-strategy-renda')?.value || 0);
        const extraEntrada = parseInt(document.getElementById('slider-strategy-ent')?.value || 0);
        const activeUid = window.activePropertyUid || "";
        
        const orig = window._originalSimData;
        if (orig && window.DossieEngine) {
            // [V9.5] COMPOSIÇÃO DE RENDA: Novo Proponente como ADIÇÃO - MT_LOG (05/2026)
            const newVinculo = window._strategyProfile.vinculo || 'clt';
            
            // 1. Pré-ajustar a renda extra pelo vínculo do NOVO proponente
            let effectiveExtraRenda = extraRenda;
            if (newVinculo === 'autonomo' || newVinculo === 'pj') {
                effectiveExtraRenda = Math.round(extraRenda * 0.80);
            } else if (newVinculo === 'mei') {
                effectiveExtraRenda = Math.round(Math.min(extraRenda, 6750) * 0.80);
            }

            // 2. Compor cotista e Idade
            const origClt3anos = !!(orig.raw && orig.raw.clt3anos);
            const novoClt3anos = (newVinculo === 'clt' && !!(window._strategyProfile.clt3anos));
            
            const scenario = {
                ...orig.raw,
                renda: (orig.raw.renda || 0) + effectiveExtraRenda,
                entrada: (orig.raw.entrada || 0) + extraEntrada,
                fgts: (orig.raw.fgts || 0) + (window._strategyProfile.fgts || 0),
                idade: Math.max((orig.raw && orig.raw.idade) || 30, window._strategyProfile.idade || 30),
                vinculo: (orig.raw && orig.raw.vinculo) || 'clt',
                clt3anos: origClt3anos || novoClt3anos
            };

            const emp = EMPREENDIMENTOS.find(e => e.uid === activeUid) || EMPREENDIMENTOS[0];
            const liveEval = window.DossieEngine.evaluateMatch(window.DossieEngine.parsePreco(emp.preco), scenario);

            // [V8.3] POWER SHIELD: Lógica de Aporte Linear Blindada
            // MT_LOG (05/2026): Garante que aportes de entrada não sofram quedas por regras de subsídio.
            const initialPower = window.MT_SimulatedPower || 0;
            const extraSum = (extraEntrada || 0) + (window._strategyProfile.fgts || 0);
            const minimumGuaranteedPower = initialPower + extraSum;
            
            const finalPower = Math.max(liveEval.sim.poderReal || 0, minimumGuaranteedPower);

            // Payload final para o Cache (Lógica de Aporte V8.1)
            const finalPayload = {
                ...orig,
                raw: scenario,
                results: {
                    ...orig.results,
                    subsidio: liveEval.sim.subsidio || 0,
                    fgtsTotal: scenario.fgts,
                    entradaTotal: scenario.entrada,
                    financiamento: liveEval.sim.potencial || 0,
                    taxa: liveEval.sim.taxaAnualMCMV || 0,
                    prazo: liveEval.sim.prazoEfetivo || 420,
                    parcela: liveEval.sim.parcelaPosChaves || 0,
                    valorImovel: finalPower, // Poder Blindado
                    score: liveEval.sim.score || 80
                }
            };

            // [V8.3] SINCRONIA TOTAL: Notifica todos os 'Sentinelas' da UI
            if (window.syncLiveCacheAndHydrate) {
                window.syncLiveCacheAndHydrate(finalPayload, activeUid);
            }

            // Forçar re-avaliação imediata para trocar etiquetas e ativar botões
            if (window.recalculateForProperty) {
                window.recalculateForProperty(activeUid);
            }

            if (window.rankMatches) {
                window.rankMatches();
            }

            // Sincronizar Portfólio com o novo cenário
            if (window.DossieCarousel) window.DossieCarousel.renderPortfolioDrawer();

            // Fecha o acordeão se estiver no mobile/cockpit
            if (window.toggleJornadaAccordion) window.toggleJornadaAccordion();
        }
    },

    /**
     * Reseta a estratégia.
     */
    resetStrategyCenario: function() {
        const rS = document.getElementById('slider-strategy-renda');
        const eS = document.getElementById('slider-strategy-ent');
        if (rS) rS.value = 0;
        if (eS) eS.value = 0;
        
        this.updateStrategyValues();
    },

    /**
     * Marcadores de Alvo (Vasos Comunicantes).
     * MT_LOG (05/2026): Alvos Estáticos - O marcador não foge do usuário.
     */
    updateTargetMarkers: function(uid, currentDelta = 0, currentExtraRenda = 0, currentExtraEntrada = 0) {
        const targetUid = uid || window.activePropertyUid;
        if (!targetUid || !window.DossieEngine) return;
        const emp = EMPREENDIMENTOS.find(e => e.uid === targetUid);
        if (!emp) return;
        
        const price = window.DossieEngine.parsePreco(emp.preco);
        const orig = window._originalSimData;
        if (!orig) return;

        // Captura o Déficit Inicial (Se sliders estiverem em 0)
        if (currentExtraRenda === 0 && currentExtraEntrada === 0) {
            this._initialDelta = currentDelta;
        }

        const currentSliders = {
            extraRenda: currentExtraRenda,
            extraEntrada: currentExtraEntrada,
            extraFgts: window._strategyProfile.fgts || 0,
            vinculo: window._strategyProfile.vinculo || 'clt',
            idade: window._strategyProfile.idade || 30
        };

        // 1. ALVO DE RENDA (INTELIGENTE): 
        // Se estiver mexendo na RENDA, o alvo fica PARADO no objetivo inicial (Simplicidade Inteligente).
        // Se estiver mexendo na ENTRADA, o alvo da renda recua dinamicamente (Vaso Comunicante).
        let targetRenda = 0;
        if (currentExtraRenda > 0) {
            // Travamos no objetivo que tínhamos antes de começar a deslizar
            targetRenda = window.DossieEngine.findMatchTarget('renda', window._strategyProfile, price, orig, { ...currentSliders, extraRenda: 0 });
        } else {
            // Se a renda está em 0, o alvo é o valor real necessário agora
            targetRenda = window.DossieEngine.findMatchTarget('renda', window._strategyProfile, price, orig, currentSliders);
        }

        // 2. ALVO DE ENTRADA (ESTRATÉGICO):
        // MT_LOG (05/2026): Eliminado fator fixo (* 40). Agora usa o motor real para precisão total.
        let targetEnt = 0;
        if (currentExtraEntrada > 0) {
            // Trava no objetivo inicial da entrada
            targetEnt = window.DossieEngine.findMatchTarget('entrada', window._strategyProfile, price, orig, { ...currentSliders, extraEntrada: 0 });
        } else {
            // Recua dinamicamente se a renda aumentar
            targetEnt = window.DossieEngine.findMatchTarget('entrada', window._strategyProfile, price, orig, currentSliders);
        }

        // UI: Marcador de Renda
        const mRenda = document.getElementById('marker-renda-target');
        const lRenda = document.getElementById('label-renda-target');
        if (mRenda) {
            const perc = Math.min(100, (targetRenda / 10000) * 100);
            mRenda.style.left = perc + '%';
            
            if (currentExtraRenda >= targetRenda && targetRenda > 0) {
                mRenda.classList.add('target-reached');
                if (lRenda) lRenda.innerText = "Match!";
            } else {
                mRenda.classList.remove('target-reached');
                if (lRenda) lRenda.innerText = `Alvo: + ${window.MT_Utils.formatCurrency(targetRenda)}`;
            }
        }

        // UI: Marcador de Entrada
        const mEnt = document.getElementById('marker-ent-target');
        const lEnt = document.getElementById('label-ent-target');
        if (mEnt) {
            const perc = Math.min(100, (targetEnt / 50000) * 100);
            mEnt.style.left = perc + '%';
            
            if (currentExtraEntrada >= targetEnt && targetEnt > 0) {
                mEnt.classList.add('target-reached');
                if (lEnt) lEnt.innerText = "Match!";
            } else {
                mEnt.classList.remove('target-reached');
                if (lEnt) lEnt.innerText = `Alvo: + ${window.MT_Utils.formatCurrency(targetEnt)}`;
            }
        }
    }
};

window.DossieStrategy = DossieStrategy;
