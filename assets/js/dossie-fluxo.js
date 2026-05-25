/**
 * DOSSIÊ DO INVESTIDOR - MÓDULO DE FLUXO (FLUXO)
 * Arquitetura Modular: assets/js/dossie-fluxo.js
 * Responsável por: Cronograma de pagamento, Timeline de obra e Barra de Composição.
 * [V9.6 / V10.0] ESTABILIZAÇÃO: Reflete o financiamento com base no período de obra real.
 */

const DossieFluxo = {
    /**
     * [V9.6] HIDRATAÇÃO DO ACORDEÃO PREMIUM DE FLUXO
     * MT_LOG (05/2026): Motor central que popula os 17 elementos do painel premium.
     * Esta função unifica os dois sistemas de fluxo (Cards Simples e Acordeão).
     * 
     * Regra de Negócio:
     * - Resíduo = Preço - (Subsidio + FGTS + Entrada + Financiamento)
     * - Se Pronto: Resíduo integral no ATO.
     * - Se em Obra: Resíduo parcelado pelos meses faltantes (calculado via Engine).
     */
    hydrateFluxoPremium: function() {
        const fmt = window.MT_Utils ? window.MT_Utils.formatCurrency : (v) => `R$ ${v}`;
        const orig = window._originalSimData;
        if (!orig) return;

        // 1. Identificar o imóvel ativo
        const activeUid = window.activePropertyUid;
        if (!activeUid || typeof EMPREENDIMENTOS === 'undefined') return;
        const emp = EMPREENDIMENTOS.find(e => e.uid === activeUid);
        if (!emp) return;

        const precoImovel = window.DossieEngine.parsePreco(emp.preco);
        if (!precoImovel || precoImovel === Infinity) return;

        // 2. Calcular meses REAIS para entrega (usa data atual vs data de entrega)
        const mesesObra = window.DossieEngine.getMesesParaEntrega(emp.entrega);
        const isPronto = (emp.entrega && emp.entrega.toLowerCase().includes('pronto')) || mesesObra <= 1;

        // 3. Obter resultados da simulação atual (com ou sem ajustes de perfil)
        const lastResult = window.lastMatchResult;
        let sim = lastResult ? lastResult.sim : orig.results;

        // Proteção contra simulação falha que congela os cards (R$ 0.000)
        if (!sim) {
            console.error("DossieFluxo: Simulação ausente, abortando hidratação para evitar estado zero.");
            return;
        }

        // [V9.7.3] Restabelece a influência dos sliders no fluxo, mas com cálculo seguro do motor financeiro.
        const strategyOverrides = window._strategyOverrides || { extraRenda: 0, extraEntrada: 0, extraFgts: 0 };
        const hasOverrides = strategyOverrides.extraRenda > 0 || strategyOverrides.extraEntrada > 0 || strategyOverrides.extraFgts > 0;
        
        let fgts = (orig.raw.fgts || 0) + (window._strategyProfile?.fgts || 0) + (strategyOverrides.extraFgts || 0);
        let entrada = (orig.raw.entrada || 0) + (strategyOverrides.extraEntrada || 0);

        if (hasOverrides && window.DossieEngine && window.DossieEngine.buildStrategyScenario) {
            const scenario = window.DossieEngine.buildStrategyScenario({}, strategyOverrides, orig);
            const evalResult = window.DossieEngine.evaluateMatch(precoImovel, scenario, strategyOverrides);
            if (evalResult && evalResult.sim) {
                sim = evalResult.sim;
            }
        }

        // [V10] Helper seguro para obter propriedades da simulação (seja na raiz ou dentro de fullResults) - MT_LOG (05/2026)
        const getSimProp = (prop) => {
            if (sim[prop] !== undefined) return sim[prop];
            if (sim.fullResults && sim.fullResults[prop] !== undefined) return sim.fullResults[prop];
            return undefined;
        };

        const subsidio = sim.subsidio || 0;
        const financiamento = sim.potencial || sim.financiamento || 0;
        const parcela = sim.parcela || 0;
        const prazoFinanc = sim.prazo || sim.prazoEfetivo || 420;

        // 4. Calcular o RESÍDUO (o que falta pagar direto à construtora)
        const coberto = subsidio + fgts + entrada + financiamento;
        const residuo = Math.max(0, precoImovel - coberto);

        // 5. Parcelar o resíduo durante a obra
        let parcelaEntrada = 0;
        let prazoLabel = '';
        let totalEntradaLabel = '';

        if (isPronto) {
            // Imóvel pronto: resíduo pago no ATO
            parcelaEntrada = residuo;
            prazoLabel = 'Pagamento à Vista (Ato)';
            totalEntradaLabel = residuo > 0 ? `Valor de Ato: ${fmt(residuo)}` : '100% Coberta';
        } else if (residuo > 0 && mesesObra > 0) {
            parcelaEntrada = Math.round(residuo / mesesObra);
            prazoLabel = `${mesesObra}x Direto Construtora`;
            totalEntradaLabel = `Total: ${fmt(residuo)}`;
        } else {
            parcelaEntrada = 0;
            prazoLabel = 'Entrada 100% Coberta';
            totalEntradaLabel = 'Subsídio + FGTS cobrem';
        }

        // 6. Custo de evolução de obra (estimativa: ~0.5% do saldo devedor/mês)
        const evolucaoObra = isPronto ? 0 : Math.round(financiamento * 0.005);

        // ═══════════════════════════════════════════════════
        // HIDRATAÇÃO DOS 17 ELEMENTOS DO ACORDEÃO PREMIUM
        // ═══════════════════════════════════════════════════

        const el = (id) => document.getElementById(id);
        
        // -- HEADER --
        if (el('fluxo-title')) el('fluxo-title').innerText = emp.nome;
        if (el('fluxo-prop-price')) el('fluxo-prop-price').innerText = emp.preco;
        if (el('fluxo-prop-img')) el('fluxo-prop-img').src = emp.imagem;
        if (el('fluxo-subtitle')) el('fluxo-subtitle').innerText = `VALOR DO INVESTIMENTO: ${fmt(precoImovel)}`;
        if (el('fluxo-badge')) {
            const foraDoMCMV = getSimProp('foraDoMCMV') || false;
            el('fluxo-badge').innerText = foraDoMCMV ? 'SBPE' : 'MCMV';
            el('fluxo-badge').className = foraDoMCMV
                ? 'bg-primary/10 text-primary text-[9px] font-black px-4 py-1 rounded-full border border-primary/20'
                : 'bg-tertiary/10 text-tertiary text-[9px] font-black px-4 py-1 rounded-full border border-tertiary/20';
        }

        // -- FASE 1: ENTRADA --
        if (el('fluxo-f1-val')) el('fluxo-f1-val').innerText = isPronto
            ? fmt(parcelaEntrada)
            : (parcelaEntrada > 0 ? `${fmt(parcelaEntrada)}/mês` : 'R$ 0');
        if (el('fluxo-f1-prazo')) el('fluxo-f1-prazo').innerText = prazoLabel;
        if (el('fluxo-f1-total')) el('fluxo-f1-total').innerText = totalEntradaLabel;

        // -- FASE 2: DURANTE OBRA --
        if (el('fluxo-f2-val')) el('fluxo-f2-val').innerText = isPronto ? 'N/A' : fmt(evolucaoObra);
        if (el('fluxo-f2-prazo')) el('fluxo-f2-prazo').innerText = isPronto
            ? 'Imóvel Pronto'
            : `≈ ${mesesObra} meses (${emp.entrega})`;

        // -- FASE 3: APÓS CHAVES --
        if (el('fluxo-f3-val')) el('fluxo-f3-val').innerText = fmt(parcela);
        if (el('fluxo-f3-prazo')) el('fluxo-f3-prazo').innerText = `${prazoFinanc} meses`;

        // -- BARRA DE COMPOSIÇÃO --
        this.renderCompositionBar(precoImovel, subsidio, fgts, entrada, financiamento);

        // -- LEGENDAS --
        if (el('fluxo-leg-sub'))  el('fluxo-leg-sub').innerText = fmt(subsidio);
        if (el('fluxo-leg-fgts')) el('fluxo-leg-fgts').innerText = fmt(fgts);
        if (el('fluxo-leg-ent'))  el('fluxo-leg-ent').innerText = fmt(entrada);
        if (el('fluxo-leg-fin'))  el('fluxo-leg-fin').innerText = fmt(financiamento);

        // MT_LOG (05/2026): Atualiza os cards simples da jornada para manter paridade visual.
        if (el('val-parcela-entrada')) el('val-parcela-entrada').innerText = isPronto
            ? fmt(parcelaEntrada)
            : (parcelaEntrada > 0 ? fmt(parcelaEntrada) : '100% Coberta');
        if (el('val-evolucao-obra')) el('val-evolucao-obra').innerText = fmt(evolucaoObra);
        if (el('val-pos-chaves')) el('val-pos-chaves').innerText = fmt(parcela);
        
        // Timeline Horizontal do Passo 1
        if (el('val-timeline-obra')) el('val-timeline-obra').innerText = fmt(parcelaEntrada + evolucaoObra);
        if (el('val-timeline-chaves')) el('val-timeline-chaves').innerText = fmt(parcela);

        // Atualizar Enquadramento
        const enq = el('viability-enquadramento');
        if (enq) {
            const foraDoMCMV = getSimProp('foraDoMCMV') || false;
            const faixaMCMV = getSimProp('faixaMCMV');
            enq.innerText = foraDoMCMV ? 'SBPE / Médio Padrão' : `${faixaMCMV || 'MCMV'} / Econômico`;
        }

        // [V10] Atualização dinâmica de ITBI condicional conforme o perfil - MT_LOG (05/2026)
        const itbiBadge = el('viability-itbi-status');
        if (itbiBadge) {
            const perfilEnquadramento = getSimProp('perfilEnquadramento');
            const itbiVal = getSimProp('itbi') || 0;
            if (perfilEnquadramento === 'HIS-1') {
                itbiBadge.style.display = 'flex';
                itbiBadge.innerHTML = '<span class="material-symbols-outlined text-xs">verified</span> ITBI GRÁTIS';
                itbiBadge.className = "bg-tertiary text-on-tertiary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(64,225,126,0.4)]";
            } else if (itbiVal > 0) {
                itbiBadge.style.display = 'flex';
                itbiBadge.innerHTML = `<span class="material-symbols-outlined text-xs">payments</span> ITBI: ${fmt(itbiVal)}`;
                itbiBadge.className = "bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg";
            } else {
                itbiBadge.style.display = 'none';
            }
        }

        console.log(`DossieFluxo: Hidratado para "${emp.nome}" | Meses: ${mesesObra} | Resíduo: ${residuo}`);
    },

    /**
     * [V9.5] Renderiza a barra de composição visual do preço do imóvel.
     * Cada segmento é proporcional ao peso financeiro.
     * MT_LOG (05/2026)
     */
    renderCompositionBar: function(preco, sub, fgts, entrada, financ) {
        const bar = document.getElementById('fluxo-bar-container');
        if (!bar || !preco || preco <= 0) return;

        const segments = [
            { label: 'Subsídio', value: sub, color: 'bg-primary', glow: 'shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' },
            { label: 'FGTS', value: fgts, color: 'bg-blue-400', glow: '' },
            { label: 'Entrada', value: entrada, color: 'bg-white/40', glow: '' },
            { label: 'Financ.', value: financ, color: 'bg-tertiary', glow: 'shadow-[0_0_10px_rgba(64,225,126,0.3)]' }
        ];

        bar.innerHTML = segments.filter(s => s.value > 0).map(s => {
            const perc = Math.max(2, (s.value / preco) * 100); // Mínimo 2% para visibilidade
            return `<div class="${s.color} ${s.glow} h-full transition-all duration-700" 
                         style="width: ${perc.toFixed(1)}%" 
                         title="${s.label}: ${Math.round(s.value / preco * 100)}%"></div>`;
        }).join('');
    },

    /**
     * Renderiza o Espelho do Teto de Compra no estado inicial,
     * ou delega para o hidratador premium se um imóvel já estiver selecionado.
     */
    renderFluxoPagamento: function(res, entradaBase, fgtsBase) {
        // Se já tiver um imóvel ativo selecionado, confia na hidratação completa da "Realidade do Imóvel"
        if (window.activePropertyUid) {
            this.hydrateFluxoPremium();
            return;
        }

        // Caso contrário, renderiza o "Espelho do Teto de Compra" (Estado Inicial)
        if (!res) return;

        const el = (id) => document.getElementById(id);
        const fmt = (v) => (window.MT_Utils && window.MT_Utils.formatCurrency) ? window.MT_Utils.formatCurrency(v) : `R$ ${v}`;

        console.log("DossieFluxo: Renderizando Espelho do Teto de Compra genérico...");

        const precoImovel = res.valorImovel || 0;
        const subsidio = res.subsidio || 0;
        const financiamento = res.potencial || res.financiamento || 0;
        const fgts = fgtsBase || res.fgtsTotal || 0;
        const entrada = entradaBase || res.entradaTotal || 0;
        const parcela = res.parcela || 0;

        // Teto de compra: a "cobertura" é a soma de todos os capitais
        const coberto = subsidio + fgts + entrada + financiamento;
        const residuo = Math.max(0, precoImovel - coberto);

        // Assumindo obra genérica de 24 meses para demonstrar o teto
        const mesesObra = 24; 
        const parcelaEntrada = Math.max(0, Math.round(residuo / mesesObra));
        const evolucaoObra = Math.round(financiamento * 0.005);

        // -- FASE 1: ENTRADA --
        if (el('fluxo-f1-val')) el('fluxo-f1-val').innerText = parcelaEntrada > 0 ? `${fmt(parcelaEntrada)}/mês` : '100% Coberta';
        if (el('val-parcela-entrada')) el('val-parcela-entrada').innerText = parcelaEntrada > 0 ? fmt(parcelaEntrada) : '100% Coberta';

        // -- FASE 2: OBRA --
        if (el('fluxo-f2-val')) el('fluxo-f2-val').innerText = fmt(evolucaoObra);
        if (el('val-evolucao-obra')) el('val-evolucao-obra').innerText = fmt(evolucaoObra);

        // -- FASE 3: FINANCIAMENTO BANCÁRIO --
        if (el('fluxo-f3-val')) el('fluxo-f3-val').innerText = fmt(parcela);
        if (el('val-pos-chaves')) el('val-pos-chaves').innerText = fmt(parcela);

        // -- ENQUADRAMENTO / ITBI --
        const enq = el('viability-enquadramento');
        if (enq) {
            const foraDoMCMV = res.foraDoMCMV || false;
            const faixaMCMV = res.faixaMCMV || 'MCMV';
            enq.innerText = foraDoMCMV ? 'SBPE / Médio Padrão' : `${faixaMCMV} / Econômico`;
        }

        const itbiBadge = el('viability-itbi-status');
        if (itbiBadge) {
            const perfilEnquadramento = res.perfilEnquadramento;
            const itbiVal = res.itbi || 0;
            if (perfilEnquadramento === 'HIS-1') {
                itbiBadge.style.display = 'flex';
                itbiBadge.innerHTML = '<span class="material-symbols-outlined text-xs">verified</span> ITBI GRÁTIS';
                itbiBadge.className = "bg-tertiary text-on-tertiary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(64,225,126,0.4)]";
            } else if (itbiVal > 0) {
                itbiBadge.style.display = 'flex';
                itbiBadge.innerHTML = `<span class="material-symbols-outlined text-xs">payments</span> ITBI: ${fmt(itbiVal)}`;
                itbiBadge.className = "bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg";
            } else {
                itbiBadge.style.display = 'none';
            }
        }

        // Títulos Premium
        if (el('fluxo-title')) el('fluxo-title').innerText = "Teto de Financiamento";
        if (el('fluxo-prop-price')) el('fluxo-prop-price').innerText = `Até ${fmt(precoImovel)}`;
    },

    /**
     * Expande/Recolhe a timeline interativa.
     */
    toggleTimeline: function() {
        const container = document.getElementById('btn-abrir-fluxo');
        const chevron = document.getElementById('timeline-chevron');
        
        if (container) {
            container.classList.toggle('timeline-expanded');
            container.classList.toggle('timeline-card-active');
        }
        
        if (chevron) {
            chevron.style.transform = container?.classList.contains('timeline-expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
};

// Exportar globalmente
window.DossieFluxo = DossieFluxo;
