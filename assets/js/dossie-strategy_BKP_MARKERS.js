/**
 * DOSSIÊ DO INVESTIDOR - MÓDULO DE ESTRATÉGIA (STRATEGY)
 * Arquitetura Modular: assets/js/dossie-strategy.js
 * Responsável por: Sliders de Renda/Entrada, Perfil de Usuário e Cenários Dinâmicos.
 * [Tolerância Zero]: Interage com sliders e inputs de configuração.
 */

const DossieStrategy = {
    /**
     * Altera o tipo de vínculo (CLT, PJ, etc) e recalcula o cenário.
     */
    selectProfileVinculo: function(v, btn) {
        const vinculoMap = {
            pj: 'autonomo',
            clt: 'clt',
            publico: 'publico',
            autonomo: 'autonomo',
            mei: 'mei',
            aposentado: 'aposentado'
        };
        _strategyProfile.vinculo = vinculoMap[v] || 'clt';
        
        // Atualizar visual dos botões
        const container = btn.parentElement;
        container.querySelectorAll('.pill-btn').forEach(b => {
            b.classList.remove('active', 'bg-primary/20', 'text-primary', 'border-primary/30');
            b.classList.add('border-white/10', 'text-slate-500');
        });
        btn.classList.add('active', 'bg-primary/20', 'text-primary', 'border-primary/30');
        btn.classList.remove('border-white/10', 'text-slate-500');
        
        const currentProp = document.getElementById('main-match-title')?.innerText || '';
        if (window.updateTargetMarkers) window.updateTargetMarkers(currentProp);
        
        this.updateStrategyValues();
    },

    /**
     * Atualiza idade e FGTS do perfil de estratégia.
     */
    updateStrategyProfile: function() {
        _strategyProfile.idade = parseInt(document.getElementById('opt-strategy-idade').value) || 30;
        _strategyProfile.fgts = parseInt(document.getElementById('opt-strategy-fgts').value) || 0;
        
        const currentProp = document.getElementById('main-match-title')?.innerText || '';
        if (window.updateTargetMarkers) window.updateTargetMarkers(currentProp);

        const vIdade = document.getElementById('val-opt-idade');
        const vFgts = document.getElementById('val-opt-fgts');
        if (vIdade) vIdade.innerText = _strategyProfile.idade;
        if (vFgts) vFgts.innerText = window.MT_Utils.formatCurrency(_strategyProfile.fgts);
        
        this.updateStrategyValues();
    },

    /**
     * Orquestrador de mudanças nos sliders.
     */
    updateStrategyValues: function() {
        if (window.isUpdating) return;
        window.isUpdating = true;
        try {
            this._internalUpdateStrategyValues();
        } finally {
            window.isUpdating = false;
        }
    },

    /**
     * Lógica interna de simulação live (Arraste dos sliders).
     */
    _internalUpdateStrategyValues: function() {
        const extraRenda = parseInt(document.getElementById('slider-strategy-renda').value) || 0;
        const extraEntrada = parseInt(document.getElementById('slider-strategy-ent').value) || 0;

        const rendaLabel = document.getElementById('val-strategy-renda-label');
        const entLabel = document.getElementById('val-strategy-ent-label');
        if (rendaLabel) rendaLabel.innerText = `+ ${window.MT_Utils.formatCurrency(extraRenda)}`;
        if (entLabel) entLabel.innerText = `+ ${window.MT_Utils.formatCurrency(extraEntrada)}`;

        const orig = _originalSimData;
        if (orig) {
            const scenario = DossieEngine.buildStrategyScenario({}, {
                extraRenda: extraRenda,
                extraEntrada: extraEntrada,
                extraFgts: _strategyProfile.fgts
            }, orig);

            const title = document.getElementById('main-match-title')?.innerText || '';
            const emp = EMPREENDIMENTOS.find(e => e.nome === title) || EMPREENDIMENTOS[0];
            const precoImovel = DossieEngine.parsePreco(emp.preco);
            
            const liveEval = DossieEngine.evaluateMatch(precoImovel, scenario, false, 0, { extraRenda, extraEntrada });
            const r = liveEval.sim;
            const delta = liveEval.delta;

            // Atualizar KPIs rápidos
            this.updateQuickKPIs(r, orig, scenario, delta);
            
            // Atualizar Badge de Déficit no cabeçalho
            this.updateHeaderDeficitBadge(delta);

            // Atualizar Insight IA
            this.updateIAInsight(delta, r, orig);

            // Sincronizar marcadores de alvo
            if (window.updateTargetMarkers) window.updateTargetMarkers(title);

            // Chamar renderizador de fluxo dinâmico (Se disponível)
            if (window.renderFluxoPagamento) {
                window.renderFluxoPagamento(r, scenario.entrada, scenario.fgts);
            }
        }
    },

    updateQuickKPIs: function(r, orig, scenario, delta) {
        const pPoder = document.getElementById('kpi-strategy-poder');
        const pParcela = document.getElementById('kpi-strategy-parcela');
        const pFaixa = document.getElementById('kpi-strategy-faixa');
        const pCobertura = document.getElementById('kpi-strategy-cobertura');

        const title = document.getElementById('main-match-title')?.innerText || '';
        const emp = EMPREENDIMENTOS.find(e => e.nome === title) || EMPREENDIMENTOS[0];
        const precoImovel = DossieEngine.parsePreco(emp.preco);

        const powerBase = window.MT_SimulatedPower || (orig.results.fullResults ? orig.results.fullResults.poderReal : 0);
        if (pPoder) pPoder.innerText = `+ ${window.MT_Utils.formatCurrency(Math.max(0, r.poderReal - powerBase))}`;
        if (pParcela) pParcela.innerText = window.MT_Utils.formatCurrency(r.parcelaPosChaves || r.parcela || 0);
        if (pFaixa) pFaixa.innerText = r.foraDoMCMV ? 'SBPE' : r.faixaMCMV;
        
        // Cobertura real sobre o preço do imóvel selecionado
        if (pCobertura) {
            const totalRecursos = (r.subsidio || 0) + (scenario.fgts || 0) + (scenario.entrada || 0) + (r.potencial || 0);
            const perc = Math.min(100, Math.round((totalRecursos / precoImovel) * 100));
            pCobertura.innerText = perc + '%';
        }
    },

    updateHeaderDeficitBadge: function(delta) {
        const stratBadge = document.getElementById('strategy-deficit-badge');
        const stratVal = document.getElementById('strategy-deficit-val');
        const mainBadge = document.getElementById('property-status-badge');
        const mainIcon = document.getElementById('ps-badge-icon');
        const mainText = document.getElementById('ps-badge-text');

        const isMatch = delta <= 1000;
        const formattedDelta = window.MT_Utils.formatCurrency(delta);

        // Atualizar Badge Interno (Cockpit)
        if (stratBadge && stratVal) {
            const bIcon = stratBadge.querySelector('.material-symbols-outlined');
            if (!isMatch) {
                stratBadge.className = "badge-deficit px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg transition-all duration-300";
                if (bIcon) bIcon.innerText = 'warning';
                stratVal.innerText = `DÉFICIT: ${formattedDelta}`;
            } else {
                stratBadge.className = "badge-match badge-match-pulse px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg transition-all duration-300";
                if (bIcon) bIcon.innerText = 'verified';
                stratVal.innerText = 'MATCH CONFIRMADO';
            }
        }

        // Sincronizar Badge Externo (Imagem do Imóvel)
        if (mainBadge) {
            if (!isMatch) {
                mainBadge.className = "property-status-badge active badge-deficit px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-500";
                if (mainIcon) mainIcon.innerText = 'warning';
                if (mainText) mainText.innerText = `DÉFICIT: ${formattedDelta}`;
            } else {
                mainBadge.className = "property-status-badge active badge-match px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-500";
                if (mainIcon) mainIcon.innerText = 'verified';
                if (mainText) mainText.innerText = 'MATCH ALTO IA';
            }
        }
        
        // Sincronizar Botão de Abertura (Pulsar)
        const btnJornada = document.getElementById('btn-open-jornada');
        if (btnJornada) {
            if (!isMatch) {
                btnJornada.classList.add('ring-4', 'ring-red-500/30', 'btn-pulse-alert');
                const jIcon = btnJornada.querySelector('.material-symbols-outlined');
                if (jIcon) jIcon.innerText = 'construction';
            } else {
                btnJornada.classList.remove('ring-4', 'ring-red-500/30', 'btn-pulse-alert');
                const jIcon = btnJornada.querySelector('.material-symbols-outlined');
                if (jIcon) jIcon.innerText = 'rocket_launch';
            }
        }
    },

    updateIAInsight: function(delta, r, orig) {
        const insightMsg = document.getElementById('ia-insight-msg');
        if (insightMsg) {
            if (delta <= 1000) {
                insightMsg.innerText = "Parabéns! Você atingiu o potencial necessário para este imóvel.";
                insightMsg.className = "text-[10px] text-tertiary font-bold";
            } else if (r.poderReal > (orig.results.fullResults?.poderReal || 0) + 30000) {
                insightMsg.innerText = "Excelente ganho de poder! Você está reduzindo o déficit rapidamente.";
                insightMsg.className = "text-[10px] text-primary font-bold";
            } else {
                insightMsg.innerText = "Arraste os sliders para simular o cenário ideal de compra.";
                insightMsg.className = "text-[10px] text-slate-300";
            }
        }
    },

    /**
     * Aplica o cenário simulado como novo perfil base do Dossiê.
     */
    applyStrategyCenario: function() {
        const extraRenda = parseInt(document.getElementById('slider-strategy-renda').value) || 0;
        const extraEntrada = parseInt(document.getElementById('slider-strategy-ent').value) || 0;
        const title = document.getElementById('main-match-title').innerText;
        const emp = EMPREENDIMENTOS.find(e => e.nome === title) || EMPREENDIMENTOS[0];
        
        const orig = _originalSimData;
        if (orig) {
            const scenario = DossieEngine.buildStrategyScenario({}, {
                extraRenda: extraRenda,
                extraEntrada: extraEntrada,
                extraFgts: _strategyProfile.fgts
            }, orig);

            const liveEval = DossieEngine.evaluateMatch(DossieEngine.parsePreco(emp.preco), scenario);
            const r = liveEval.sim;
            const prevFull = (orig.results && orig.results.fullResults) ? orig.results.fullResults : {};

            const finalPayload = {
                ...orig,
                timestamp: new Date().toISOString(),
                raw: {
                    ...orig.raw,
                    renda: (orig.raw.renda || 0) + extraRenda,
                    entrada: (orig.raw.entrada || 0) + extraEntrada,
                    fgts: (orig.raw.fgts || 0) + _strategyProfile.fgts,
                    idade: _strategyProfile.idade,
                    vinculo: _strategyProfile.vinculo
                },
                results: {
                    ...orig.results,
                    subsidio: r.subsidio || 0,
                    fgtsTotal: (orig.raw.fgts || 0) + _strategyProfile.fgts,
                    entradaTotal: (orig.raw.entrada || 0) + extraEntrada,
                    financiamento: r.potencial || 0,
                    taxa: r.taxaAnualMCMV || 0,
                    prazo: r.prazoEfetivo || 420,
                    parcela: r.parcelaPosChaves || 0,
                    valorImovel: r.poderReal || 0,
                    fullResults: {
                        ...prevFull,
                        potencial: r.potencial || 0,
                        subsidio: r.subsidio || 0,
                        poderReal: r.poderReal || 0,
                        taxaAnualMCMV: r.taxaAnualMCMV || 0,
                        prazoEfetivo: r.prazoEfetivo || 420,
                        faixaMCMV: r.faixaMCMV || 'Faixa 2',
                        foraDoMCMV: !!r.foraDoMCMV,
                        prazoObra: DossieEngine.getMesesParaEntrega(emp.entrega)
                    }
                }
            };

            window.MT_SimulatedPower = r.poderReal;
            if (window.syncLiveCacheAndHydrate) {
                window.syncLiveCacheAndHydrate(finalPayload, title);
            }

            // Reset local overrides
            _strategyOverrides.extraRenda = 0;
            _strategyOverrides.extraEntrada = 0;
            document.getElementById('slider-strategy-renda').value = 0;
            document.getElementById('slider-strategy-ent').value = 0;
            
            if (window.toggleJornadaAccordion) window.toggleJornadaAccordion();
        }
    },

    /**
     * Reseta a estratégia para os valores originais do simulador.
     */
    resetStrategyCenario: function() {
        document.getElementById('slider-strategy-renda').value = 0;
        document.getElementById('slider-strategy-ent').value = 0;
        _strategyProfile.idade = 30;
        _strategyProfile.fgts = 0;
        _strategyProfile.vinculo = 'clt';
        
        this.updateStrategyValues();
        this.applyStrategyCenario();
    },

    /**
     * Sincroniza visualmente os marcadores de Alvo Match nos sliders.
     */
    updateTargetMarkers: function(empName) {
        if (!empName) return;
        const emp = EMPREENDIMENTOS.find(e => e.nome === empName);
        if (!emp) return;
        
        const price = DossieEngine.parsePreco(emp.preco);
        const orig = _originalSimData;
        if (!orig) return;

        // Buscar Alvos (Renda e Entrada)
        const targetRenda = DossieEngine.findMatchTarget('renda', {}, price, orig);
        const targetEnt = DossieEngine.findMatchTarget('entrada', {}, price, orig);

        // Atualizar Slider de Renda (Max: 10000)
        const mRenda = document.getElementById('marker-renda-target');
        const lRenda = document.getElementById('label-renda-target');
        if (mRenda) {
            const perc = Math.min(100, (targetRenda / 10000) * 100);
            mRenda.style.left = perc + '%';
            if (lRenda) lRenda.innerText = `Alvo: + ${window.MT_Utils.formatCurrency(targetRenda)}`;
            
            const currentExtraRenda = parseInt(document.getElementById('slider-strategy-renda').value) || 0;
            mRenda.classList.toggle('met-reached', currentExtraRenda >= targetRenda && targetRenda > 0);
        }

        // Atualizar Slider de Entrada (Max: 50000)
        const mEnt = document.getElementById('marker-ent-target');
        const lEnt = document.getElementById('label-ent-target');
        if (mEnt) {
            const perc = Math.min(100, (targetEnt / 50000) * 100);
            mEnt.style.left = perc + '%';
            if (lEnt) lEnt.innerText = `Alvo: + ${window.MT_Utils.formatCurrency(targetEnt)}`;

            const currentExtraEnt = parseInt(document.getElementById('slider-strategy-ent').value) || 0;
            mEnt.classList.toggle('met-reached', currentExtraEnt >= targetEnt && targetEnt > 0);
        }
    }
};

// Exportar globalmente
window.DossieStrategy = DossieStrategy;
window.updateTargetMarkers = DossieStrategy.updateTargetMarkers;
