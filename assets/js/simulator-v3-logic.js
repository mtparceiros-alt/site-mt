/**
 * MT Parceiros - Lógica de Sincronização v3 (Produção)
 * Conecta os sliders do simulador.html ao motor de cálculo MT_Core.
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log("MT Logic v3: Iniciando...");

        // --- FOCUS GUARD (Opção B) ---
        // Prevê re-focus programático logo após interação com sliders.
        // Quando um slider é tocado, setamos `window.__mt_lastSliderTouch`.
        // Aqui sobrescrevemos temporariamente `HTMLInputElement.prototype.focus`
        // para bloquear focos programáticos que ocorram dentro do intervalo.
        try {
            window.__mt_lastSliderTouch = 0;
            window.__mt_focusGuardTimeout = 800; // ms
            (function () {
                const origFocus = Element.prototype.focus;
                Element.prototype.focus = function () {
                    try {
                        const last = window.__mt_lastSliderTouch || 0;
                        const now = Date.now();
                        if (now - last < (window.__mt_focusGuardTimeout || 800)) {
                            if (window.console && window.console.debug) window.console.debug('MT: focus blocked for', this.id || this);
                            return; // noop — bloqueia foco programático imediato após tocar slider
                        }
                    } catch (e) {
                        // se algo falhar, cair para o comportamento padrão
                    }
                    return origFocus.apply(this, arguments);
                };
            })();
        } catch (e) {
            console.warn('MT: focus guard installation failed', e);
        }

    // --- 1. CONFIGURAÇÃO DE INPUTS ---
    const inputs = {
        renda: document.getElementById('renda'),
        idade: document.getElementById('idade'),
        dividas: document.getElementById('dividas'),
        fgts: document.getElementById('fgts'),
        entrada: document.getElementById('entrada'),
        clt3anos: document.getElementById('clt3anos'),
        primeiroImovel: document.getElementById('primeiroImovel'),
        dependentes: document.getElementById('dependentes'),
        vinculoButtons: document.querySelectorAll('[data-vinculo]'),
        nome: document.getElementById('nome'),
        celular: document.getElementById('celular')
    };

    // Variável para armazenar o último resultado calculado e exportar para o Dossiê
    let lastCalculationResult = null;
    let iaRoutineFinished = false; // Controle de estado para redirecionamento

    /**
     * MT_LOG (04/2026): SINCRONIZAÇÃO DE LEADS (FASE 1)
     * Envia os dados básicos do lead para a planilha mestre assim que 
     * a rotina de IA é iniciada.
     */
    async function sendLeadToGoogleSheetsStage1() {
        const payload = new URLSearchParams();
        payload.append('token', 'mtpc_seguro_2025');
        payload.append('nome', inputs.nome ? inputs.nome.value : 'Lead V3');
        payload.append('whatsapp', inputs.celular ? inputs.celular.value.replace(/\D/g, '') : '');
        payload.append('assunto', 'Simulação Realizada (V3 Stage 1)');
        payload.append('mensagem', `Simulação Básica Realizada (Aguardando Dossiê):\n- Renda: ${labelEls.renda.innerText}\n- Idade: ${labelEls.idade.innerText}\n- FGTS: ${labelEls.fgts.innerText}\n- Entrada: ${labelEls.entrada.innerText}`);
        payload.append('origem', 'Simulador V3 (Fase 1)');

        try {
            fetch('https://script.google.com/macros/s/AKfycbzmtDgzbLghMsO0NFMt3CAUDS4lu1E2CjIHibGGSZP_PlWomYcRoYdVE3cIlYxVJDzNlg/exec', {
                method: 'POST',
                body: payload,
                mode: 'no-cors'
            });
            console.log("MT Logic: Lead Fase 1 sincronizado.");
        } catch (err) {
            console.error("MT Logic: Erro no Stage 1 sync:", err);
        }
    }

    function saveSimulationToCache(res, data, score, pts) {
        const cacheData = {
            timestamp: new Date().getTime(),
            raw: {
                renda: data.renda,
                idade: data.idade,
                fgts: data.fgts,
                entrada: data.entrada,
                dividas: data.dividas,
                vinculo: data.vinculo,
                // MT_LOG (05/2026): Composição de Renda V9.5 - Sincronização de atributos para o Dossiê
                clt3anos: !!data.clt3anos,
                possuiDependentes: !!data.hasDependents,
                isPrimeiroImovel: data.ePrimeiro !== false
            },
            results: {
                subsidio: res.subsidio || 0,
                fgtsTotal: data.fgts || 0,
                entradaTotal: data.entrada || 0,
                financiamento: res.potencial || 0,
                parcela: res.parcelaPosChaves || 0,
                taxa: res.taxaAnualMCMV || 0,
                prazo: res.prazoEfetivo || 0,
                valorImovel: res.valorImovel || 0,
                parcelaEntrada: res.parcelaEntrada || 0,
                score: score || 0,
                id: "#MT-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
                // Novos campos para sincronização total
                fullResults: res,
                scorePoints: pts || {}
            }
        };
        localStorage.setItem('mt_sim_data', JSON.stringify(cacheData));
        console.log("MT Logic: Dados completos salvos no cache para o Dossiê.");
    }

    window.irParaDossie = function() {
        if (!localStorage.getItem('mt_sim_data')) {
            alert("Por favor, realize a simulação primeiro!");
            return;
        }
        window.location.href = 'dossie.html';
    };

    // --- 2. CONFIGURAÇÃO DE LABELS DOS SLIDERS ---
    const labelEls = {
        renda: document.getElementById('label-renda'),
        idade: document.getElementById('label-idade'),
        dividas: document.getElementById('label-dividas'),
        fgts: document.getElementById('label-fgts'),
        entrada: document.getElementById('label-entrada')
    };

    // --- 3. CONFIGURAÇÃO DE OUTPUTS ---
    const outputs = {
        totalValue: document.getElementById('total-value'),
        // Barras de Composição (Gold)
        barSub: document.getElementById('bar-sub'),
        barFgts: document.getElementById('bar-fgts'),
        barEnt: document.getElementById('bar-ent'),
        barEntParcelado: document.getElementById('bar-ent-parcelado'),
        barFin: document.getElementById('bar-fin'),
        // Valores na Legenda do Card Principal
        valSub: document.getElementById('val-sub'),
        valFgts: document.getElementById('val-fgts'),
        valEnt: document.getElementById('val-ent'),
        valEntParcelado: document.getElementById('val-ent-parcelado'),
        valFin: document.getElementById('val-fin'),
        // Porcentagens na Legenda
        pctSub: document.getElementById('pct-sub'),
        pctFgts: document.getElementById('pct-fgts'),
        pctEnt: document.getElementById('pct-ent'),
        pctEntP: document.getElementById('pct-ent-parcelado'),
        pctFin: document.getElementById('pct-fin'),
        // Cards do Bento Grid (Análise Detalhada)
        bentoSub: document.getElementById('bento-sub-val'),
        bentoFgts: document.getElementById('bento-fgts-val'),
        bentoEnt: document.getElementById('bento-ent-val'),
        bentoFin: document.getElementById('bento-fin-val'),
        // Card de Estratégia
        valParcelaEntrada: document.getElementById('val-parcela-entrada'),
        badgeEntrada: document.getElementById('badge-entrada'),
        label36x: document.getElementById('label-36x'),
        // Prazo Máximo
        labelPrazoVal: document.getElementById('label-prazo-val'),
        // Wrappers para Visibilidade Condicional
        wrapClt3anos: document.getElementById('wrap-clt3anos'),
        // Barra de Resumo Profissional (Quadro Preto)
        profRenda: document.getElementById('prof-renda'),
        profTaxa: document.getElementById('prof-taxa'),
        profPrazo: document.getElementById('prof-prazo'),
        profParcela: document.getElementById('prof-parcela'),
        profImovelMax: document.getElementById('prof-imovel-max'),
        // Tabela Comparativa - MCMV
        compMcmvTaxa: document.getElementById('comp-mcmv-taxa'),
        compMcmvPrazo: document.getElementById('comp-mcmv-prazo'),
        compMcmvRenda: document.getElementById('comp-mcmv-renda'),
        compMcmvStatus: document.getElementById('comp-mcmv-status'),
        detMcmvSub: document.getElementById('det-mcmv-subsidio'),
        detMcmvSeg: document.getElementById('det-mcmv-seguros'),
        detMcmvPar: document.getElementById('det-mcmv-parcela'),
        detMcmvItbi: document.getElementById('det-mcmv-itbi'),
        // Tabela Comparativa - SBPE
        compSbpeTaxa: document.getElementById('comp-sbpe-taxa'),
        compSbpePrazo: document.getElementById('comp-sbpe-prazo'),
        compSbpeRenda: document.getElementById('comp-sbpe-renda'),
        compSbpeStatus: document.getElementById('comp-sbpe-status'),
        detSbpeTaxa: document.getElementById('det-sbpe-taxa'),
        detSbpePrazo: document.getElementById('det-sbpe-prazo'),
        detSbpePar: document.getElementById('det-sbpe-parcela'),
        // Tabela Comparativa - SBPE Pré
        compSbpePreTaxa: document.getElementById('comp-sbpe-pre-taxa'),
        compSbpePrePrazo: document.getElementById('comp-sbpe-pre-prazo'),
        compSbpePreRenda: document.getElementById('comp-sbpe-pre-renda'),
        compSbpePreStatus: document.getElementById('comp-sbpe-pre-status'),
        detSbpePrePar: document.getElementById('det-sbpe-pre-parcela'),
        // Relatório de Crédito IA
        gaugeArc: document.getElementById('gauge-arc'),
        scoreValue: document.getElementById('score-value'),
        dicasList: document.getElementById('mt-dicas-list'),
        // Barras de Critérios
        scoreC1Pts: document.getElementById('score-c1-pts'),
        scoreC1Bar: document.getElementById('score-c1-bar'),
        scoreC2Pts: document.getElementById('score-c2-pts'),
        scoreC2Bar: document.getElementById('score-c2-bar'),
        scoreC3Pts: document.getElementById('score-c3-pts'),
        scoreC3Bar: document.getElementById('score-c3-bar'),
        scoreC4Pts: document.getElementById('score-c4-pts'),
        scoreC4Bar: document.getElementById('score-c4-bar'),
        scoreC5Pts: document.getElementById('score-c5-pts'),
        scoreC5Bar: document.getElementById('score-c5-bar'),
        scoreC6Pts: document.getElementById('score-c6-pts'),
        scoreC6Bar: document.getElementById('score-c6-bar'),
        // Relatório de Crédito IA Status
        scoreLabel: document.getElementById('score-status-label'),
        scoreDesc: document.getElementById('score-status-desc'),
        // Perfil Progress (Hero)
        progressPct: document.getElementById('sim-progress-pct'),
        progressFill: document.getElementById('sim-progress-fill'),
        progressMsg: document.getElementById('sim-progress-msg'),
        // Sticky Power Bar v3
        stickyBar: document.getElementById('sticky-power-bar'),
        stickyTotal: document.getElementById('sticky-total-val'),
        stickyBarSub: document.getElementById('sticky-bar-sub'),
        stickyBarFgts: document.getElementById('sticky-bar-fgts'),
        stickyBarEnt: document.getElementById('sticky-bar-ent'),
        stickyBarEntP: document.getElementById('sticky-bar-ent-p'),
        stickyBarFin: document.getElementById('sticky-bar-fin')
    };

    let currentVinculo = 'clt';

    // --- 4. FORMATADORES ---
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    // --- 5. FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO ---
    function updateSimulation() {
        if (!window.MT_Core) return;

        // A. Dados de Entrada
        const data = {
            renda: parseFloat(inputs.renda.value),
            idade: parseInt(inputs.idade.value),
            dividas: parseFloat(inputs.dividas.value),
            fgts: parseFloat(inputs.fgts.value),
            entrada: parseFloat(inputs.entrada.value),
            clt3anos: inputs.clt3anos.checked,
            ePrimeiro: inputs.primeiroImovel.checked,
            hasDependents: inputs.dependentes.checked,
            vinculo: currentVinculo
        };

        // B. Atualização de Labels (Interface de Input)
        if (labelEls.renda) labelEls.renda.innerText = formatCurrency(data.renda);
        if (labelEls.idade) labelEls.idade.innerText = data.idade + " anos";
        if (labelEls.dividas) labelEls.dividas.innerText = formatCurrency(data.dividas);
        if (labelEls.fgts) labelEls.fgts.innerText = formatCurrency(data.fgts);
        if (labelEls.entrada) labelEls.entrada.innerText = formatCurrency(data.entrada);

        // C. Processamento no Motor de Cálculo
        const res = window.MT_Core.calculateMCMV(
            data.renda, data.dividas, data.fgts, data.entrada,
            data.clt3anos, data.ePrimeiro, data.idade, data.vinculo, data.hasDependents
        );

        // D. Atualização do Dashboard Visual
        const displayPoder = res.valorImovel || (res.subsidio + data.fgts + data.entrada + res.potencial);
        
        // 1. Valor Total (Poder de Compra)
        if (outputs.totalValue) {
            outputs.totalValue.innerHTML = `R$ ${displayPoder.toLocaleString('pt-BR')}<span class="text-lg font-normal opacity-70">,00</span>`;
        }

        // 2. Proporções da Barra (Usando res.subsidio, data.fgts, data.entrada, res.saldoEntrada, res.potencial)
        const poderReal = (res.subsidio + data.fgts + data.entrada + res.saldoEntrada + res.potencial) || 1;
        const pSub = (res.subsidio / poderReal) * 100;
        const pFgts = (data.fgts / poderReal) * 100;
        const pEntPropria = (data.entrada / poderReal) * 100;
        const pEnt36x = (res.saldoEntrada / poderReal) * 100;
        const pFin = (res.potencial / poderReal) * 100;

        // 3. Update Visual das Barras (Widths)
        if (outputs.barSub) outputs.barSub.style.width = pSub + '%';
        if (outputs.barFgts) outputs.barFgts.style.width = pFgts + '%';
        if (outputs.barEnt) outputs.barEnt.style.width = pEntPropria + '%';
        if (outputs.barEntParcelado) outputs.barEntParcelado.style.width = pEnt36x + '%';
        if (outputs.barFin) outputs.barFin.style.width = pFin + '%';
        
        // MT_LOG (04/2026): Ocultar texto 36x se a barra amarela for muito fina (Evita poluição visual)
        if (outputs.label36x) {
            outputs.label36x.style.opacity = pEnt36x > 5 ? '1' : '0';
        }

        // 4. Update da Legenda (Valores e Porcentagens)
        if (outputs.valSub) outputs.valSub.innerText = formatCurrency(res.subsidio);
        if (outputs.valFgts) outputs.valFgts.innerText = formatCurrency(data.fgts);
        if (outputs.valEnt) outputs.valEnt.innerText = formatCurrency(data.entrada);
        if (outputs.valEntParcelado) outputs.valEntParcelado.innerText = formatCurrency(res.saldoEntrada);
        if (outputs.valFin) outputs.valFin.innerText = formatCurrency(res.potencial);
        
        // MT_LOG (04/2026): Porcentagens visíveis apenas no Desktop para preenchimento de layout.
        if (outputs.pctSub) outputs.pctSub.innerText = pSub.toFixed(0) + '%';
        if (outputs.pctFgts) outputs.pctFgts.innerText = pFgts.toFixed(0) + '%';
        if (outputs.pctEnt) outputs.pctEnt.innerText = pEntPropria.toFixed(0) + '%';
        if (outputs.pctEntP) outputs.pctEntP.innerText = pEnt36x.toFixed(0) + '%';
        if (outputs.pctFin) outputs.pctFin.innerText = pFin.toFixed(0) + '%';

        // 5. Update do Bento Grid (Análise Detalhada)
        if (outputs.bentoSub) outputs.bentoSub.innerText = formatCurrency(res.subsidio);
        if (outputs.bentoFgts) outputs.bentoFgts.innerText = formatCurrency(data.fgts);
        if (outputs.bentoEnt) outputs.bentoEnt.innerText = formatCurrency(data.entrada);
        if (outputs.bentoFin) outputs.bentoFin.innerText = formatCurrency(res.potencial);

        // EXTRA: Sincronização Sticky Bar v3
        if (outputs.stickyTotal) outputs.stickyTotal.innerText = formatCurrency(displayPoder);
        if (outputs.stickyBarSub) outputs.stickyBarSub.style.width = pSub + '%';
        if (outputs.stickyBarFgts) outputs.stickyBarFgts.style.width = pFgts + '%';
        if (outputs.stickyBarEnt) outputs.stickyBarEnt.style.width = pEntPropria + '%';
        if (outputs.stickyBarEntP) outputs.stickyBarEntP.style.width = pEnt36x + '%';
        if (outputs.stickyBarFin) outputs.stickyBarFin.style.width = pFin + '%';

        // 6. Update Estratégia de Entrada
        if (outputs.valParcelaEntrada) {
            if (res.saldoEntrada > 0) {
                outputs.valParcelaEntrada.innerText = `36x de ${formatCurrency(res.parcelaEntrada)}`;
                // Mostrar card se houver saldo
                if (outputs.badgeEntrada) outputs.badgeEntrada.classList.remove('hidden', 'md:block');
            } else {
                outputs.valParcelaEntrada.innerText = "Entrada 100% Coberta";
                // OCULTAR NO MOBILE: Se entrada está coberta, esconde no celular mas mantém no desktop (md:block)
                if (outputs.badgeEntrada) outputs.badgeEntrada.classList.add('hidden', 'md:block');
            }
        }

        // 7. Update Prazo Máximo
        if (outputs.labelPrazoVal) {
            const prazoAnos = Math.round((res.prazoEfetivo || 0) / 12);
            outputs.labelPrazoVal.innerText = isNaN(prazoAnos) ? 0 : prazoAnos;
        }

        // 8. Update Barra de Resumo Profissional (Quadro Preto)
        if (outputs.profRenda) outputs.profRenda.innerText = formatCurrency(data.renda);
        if (outputs.profTaxa) outputs.profTaxa.innerText = (res.taxaAnualMCMV * 100).toFixed(2) + "% a.a.";
        if (outputs.profPrazo) outputs.profPrazo.innerText = res.prazoEfetivo + " meses";
        if (outputs.profParcela) outputs.profParcela.innerText = formatCurrency(res.parcelaPosChaves);
        if (outputs.profImovelMax) outputs.profImovelMax.innerText = formatCurrency(res.valorImovel);

        // 9. Update Tabela Comparativa (Inteligência de Modalidades)
        console.log("MT Logic: Atualizando Tabela Comparativa...", res.foraDoMCMV);
        
        // A. MCMV
        if (outputs.compMcmvTaxa) outputs.compMcmvTaxa.innerText = (res.taxaAnualMCMV * 100).toFixed(2) + "% + TR";
        if (outputs.compMcmvPrazo) outputs.compMcmvPrazo.innerText = res.prazoEfetivo + " Meses";
        if (outputs.compMcmvRenda) outputs.compMcmvRenda.innerText = "Até R$ 9.600";
        if (outputs.compMcmvStatus) {
            const isRec = !res.foraDoMCMV;
            outputs.compMcmvStatus.innerText = isRec ? "RECOMENDADO" : "DISPONÍVEL";
            outputs.compMcmvStatus.className = isRec 
                ? "bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm"
                : "bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase px-3 py-1 rounded-full";
        }
        if (outputs.detMcmvSub) outputs.detMcmvSub.innerText = formatCurrency(res.subsidio);
        if (outputs.detMcmvSeg) outputs.detMcmvSeg.innerText = formatCurrency(res.custoMIP + res.custoDFI);
        if (outputs.detMcmvPar) outputs.detMcmvPar.innerText = formatCurrency(res.parcelaPosChaves);
        if (outputs.detMcmvItbi) outputs.detMcmvItbi.innerText = formatCurrency(res.itbi);

        // B. SBPE Flex
        const sbpeData = res.sbpe || { 
            taxa: 0.1099, 
            prazo: Math.min(360, res.prazoEfetivo), 
            parcela: Math.round(res.parcelaPosChaves * 1.35), 
            poder: res.valorImovel 
        };
        if (outputs.compSbpeTaxa) outputs.compSbpeTaxa.innerText = (sbpeData.taxa * 100).toFixed(2) + "% + TR";
        if (outputs.compSbpePrazo) outputs.compSbpePrazo.innerText = sbpeData.prazo + " Meses";
        if (outputs.compSbpeRenda) outputs.compSbpeRenda.innerText = "Acima de R$ 9.600";
        if (outputs.compSbpeStatus) {
            const isRec = res.foraDoMCMV;
            outputs.compSbpeStatus.innerText = isRec ? "RECOMENDADO" : "DISPONÍVEL";
            outputs.compSbpeStatus.className = isRec 
                ? "bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm"
                : "bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase px-3 py-1 rounded-full";
        }
        if (outputs.detSbpeTaxa) outputs.detSbpeTaxa.innerText = (sbpeData.taxa * 100).toFixed(2) + "% + TR";
        if (outputs.detSbpePrazo) outputs.detSbpePrazo.innerText = sbpeData.prazo + " Meses";
        if (outputs.detSbpePar) outputs.detSbpePar.innerText = formatCurrency(sbpeData.parcela);

        // C. SBPE Pré-Fixado (Cenário Teórico)
        const taxaPre = 0.1150;
        const prazoPre = 300;
        if (outputs.compSbpePreTaxa) outputs.compSbpePreTaxa.innerText = (taxaPre * 100).toFixed(1) + "% Fixa";
        if (outputs.compSbpePrePrazo) outputs.compSbpePrePrazo.innerText = prazoPre + " Meses";
        if (outputs.compSbpePreRenda) outputs.compSbpePreRenda.innerText = "Acima de R$ 13.000";
        
        // Parcela aproximada p/ Pré-Fixado
        const potencialFin = res.foraDoMCMV ? (res.sbpe ? res.sbpe.potencial : res.potencial) : res.potencial;
        const parcelaPre = Math.round((potencialFin / prazoPre) + (potencialFin * (taxaPre/12)));
        if (outputs.detSbpePrePar) outputs.detSbpePrePar.innerText = formatCurrency(parcelaPre);

        // 10. Update Relatório de Crédito IA
        updateScoreIA(data, res);
    }

    /**
     * 7. INTELIGÊNCIA DE SCORE IA
     */
    function updateScoreIA(data, res) {
        let pts = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0 };
        let dicas = [];

        // C1: Renda (Máx 30) - Quanto maior a faixa, maior a pontuação bancária
        if (res.faixaMCMV === "Faixa 4") pts.c1 = 30;
        else if (res.faixaMCMV === "Faixa 3") pts.c1 = 26;
        else if (res.faixaMCMV === "Faixa 2") pts.c1 = 22;
        else if (res.faixaMCMV === "Faixa 1") pts.c1 = 18;
        else pts.c1 = 30; // SBPE/Mercado

        // C2: Dívidas (Máx 20)
        const ratio = data.dividas / (data.renda || 1);
        if (data.dividas === 0) pts.c2 = 20;
        else if (ratio < 0.1) pts.c2 = 16;
        else if (ratio < 0.25) pts.c2 = 10;
        else pts.c2 = 4;
        if (pts.c2 <= 10) dicas.push("Reduzir suas parcelas mensais (empréstimos/cartão) elevará seu Score para aprovação imediata.");

        // C3: FGTS (Máx 15)
        if (data.fgts >= 15000) pts.c3 = 15;
        else if (data.fgts >= 5000) pts.c3 = 10;
        else pts.c3 = 5;

        // C4: Capital (Entrada) (Máx 15)
        if (data.entrada >= 30000) pts.c4 = 15;
        else if (data.entrada >= 10000) pts.c4 = 10;
        else pts.c4 = 5;
        if (pts.c4 < 15) dicas.push("Um maior aporte de entrada reduz o risco para o banco e pode liberar taxas de juros menores.");

        // C5: Vínculo (Máx 12)
        if (data.vinculo === 'clt' || data.vinculo === 'aposentado') pts.c5 = 12;
        else if (data.vinculo === 'mei') pts.c5 = 8;
        else pts.c5 = 6;
        if (data.vinculo === 'autonomo') dicas.push("Autônomos devem manter extratos bancários PF dos últimos 6 meses organizados para comprovação.");

        // C6: Prazo (Máx 8)
        if (res.prazoEfetivo >= 420) pts.c6 = 8;
        else if (res.prazoEfetivo >= 360) pts.c6 = 6;
        else pts.c6 = 4;
        if (res.prazoEfetivo < 300) dicas.push("A idade do proponente reduziu seu prazo máximo. Inserir um co-proponente mais jovem pode resolver.");

        const totalScore = pts.c1 + pts.c2 + pts.c3 + pts.c4 + pts.c5 + pts.c6;

        // --- LÓGICA DE DIAGNÓSTICO INTELIGENTE ---
        const pillarNames = {
            c1: "Renda Familiar",
            c2: "Comprometimento de Dívidas",
            c3: "FGTS Acumulado",
            c4: "Capital para Entrada",
            c5: "Vínculo Profissional",
            c6: "Prazo Habitacional"
        };

        // Identifica o pilar com menor desempenho relativo
        let worstPillar = 'c1';
        let minRatio = pts.c1 / 30;
        const weights = { c1: 30, c2: 20, c3: 15, c4: 15, c5: 12, c6: 8 };
        
        Object.keys(pts).forEach(key => {
            const ratio = pts[key] / weights[key];
            if (ratio < minRatio) {
                minRatio = ratio;
                worstPillar = key;
            }
        });

        // Matriz de Diagnóstico IA
        let label = "Excelente";
        let color = "#4ade80"; // Emerald 400
        let description = "Você possui alta probabilidade de aprovação imediata e acesso às melhores taxas do mercado.";

        if (totalScore >= 80) {
            label = "Excelente"; color = "#4ade80";
        } else if (totalScore >= 60) {
            label = "Muito Bom"; color = "#fbbf24"; // Amber 400
            description = `Seu perfil é sólido. O item **${pillarNames[worstPillar]}** é o que mais pode ser otimizado para elevar seu score ao nível máximo.`;
        } else if (totalScore >= 40) {
            label = "Regular"; color = "#fb923c"; // Orange 400
            description = `Existem pontos de atenção. O **${pillarNames[worstPillar]}** está limitando seu potencial. Recomendamos seguir as orientações abaixo.`;
        } else {
            label = "Em Análise"; color = "#f87171"; // Red 400
            description = `Seu perfil atual requer ajustes. O **${pillarNames[worstPillar]}** é o principal entrave para a aprovação neste momento.`;
        }

        // --- UPDATE UI ---
        if (outputs.scoreValue) outputs.scoreValue.innerText = totalScore;
        
        if (outputs.scoreLabel) {
            outputs.scoreLabel.innerText = label;
            outputs.scoreLabel.style.color = color;
        }
        if (outputs.scoreDesc) {
            outputs.scoreDesc.innerHTML = description;
        }
        
        // Gauge SVG Animation (StrokeDashoffset 690 logic)
        if (outputs.gaugeArc) {
            const dashOffset = 690 - (690 * totalScore / 100);
            outputs.gaugeArc.style.strokeDashoffset = dashOffset;
            outputs.gaugeArc.style.stroke = color;
        }

        // Critérios Individuais (Barras e Pontos)
        updateCriteria(outputs.scoreC1Pts, outputs.scoreC1Bar, pts.c1, 30);
        updateCriteria(outputs.scoreC2Pts, outputs.scoreC2Bar, pts.c2, 20);
        updateCriteria(outputs.scoreC3Pts, outputs.scoreC3Bar, pts.c3, 15);
        updateCriteria(outputs.scoreC4Pts, outputs.scoreC4Bar, pts.c4, 15);
        updateCriteria(outputs.scoreC5Pts, outputs.scoreC5Bar, pts.c5, 12);
        updateCriteria(outputs.scoreC6Pts, outputs.scoreC6Bar, pts.c6, 8);

        // Lista de Dicas Personalizadas (Coach de Crédito IA - v2 Port)
        if (outputs.dicasList) {
            const items = generateMelhoriasInteligentes(data, res);
            if (items.length === 0) {
                outputs.dicasList.innerHTML = `
                    <div class="flex items-center gap-4 p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <span class="material-symbols-outlined text-emerald-500 text-3xl">verified</span>
                        <div>
                            <h4 class="font-bold text-emerald-900">Perfil Otimizado</h4>
                            <p class="text-xs text-emerald-700">Você já atingiu as condições ideais para as melhores taxas habitacionais.</p>
                        </div>
                    </div>
                `;
            } else {
                outputs.dicasList.innerHTML = items.map((m, i) => buildTipCard(m, i, totalScore)).join('');
            }
        }
        // F. Atualizar Status do Perfil (Hero)
        updateProfileStatus(data, outputs);

        // EXTRA: Salvar no Cache para o Dossiê
        saveSimulationToCache(res, data, totalScore, pts);
    }

    /**
     * Calcula e atualiza a barra de completude do Perfil IA (Hero)
     */
    function updateProfileStatus(data, outputs) {
        if (!outputs.progressPct || !outputs.progressFill || !outputs.progressMsg) return;

        let progress = 10; // Base por ter um vínculo padrão (CLT) selecionado
        
        // Critério: Nome preenchido (mínimo 4 caracteres)
        if (inputs.nome && inputs.nome.value.trim().length >= 4) progress += 15;
        // Critério: Celular (mínimo 10 dígitos)
        const telVal = inputs.celular ? inputs.celular.value : "";
        const digitsOnly = telVal.replace(/\D/g, '');
        if (digitsOnly.length >= 10) progress += 15;
        
        // Critério: Renda Informada
        if (data.renda > 0) progress += 20;
        
        // Critério: Interação com Sliders (FGTS, Entrada ou Dívidas)
        if (data.fgts > 0 || data.entrada >= 500 || data.dividas > 0) progress += 20;
        
        // Critério: Qualificações Adicionais
        if (data.clt3anos || data.hasDependents || !data.ePrimeiro) progress += 20;

        // Limita a 100%
        progress = Math.min(100, progress);

        // Atualização da Interface
        outputs.progressPct.innerText = `${progress}%`;
        outputs.progressFill.style.width = `${progress}%`;

        // Mensagens Dinâmicas de Status
        let statusMsg = "Aguardando dados iniciais...";
        if (progress >= 100) {
            statusMsg = "Perfil 100% Qualificado para o Laudo!";
            outputs.progressPct.classList.remove('text-secondary-fixed-dim');
            outputs.progressPct.classList.add('text-tertiary-fixed-dim'); // Muda para verde se completo
        } else if (progress > 70) {
            statusMsg = "Análise preditiva em curso...";
        } else if (progress > 40) {
            statusMsg = "Identificando perfil financeiro...";
        } else if (progress > 15) {
            statusMsg = "Processando identificação...";
        } else {
            outputs.progressPct.classList.add('text-secondary-fixed-dim');
            outputs.progressPct.classList.remove('text-tertiary-fixed-dim');
        }

        outputs.progressMsg.innerText = statusMsg;
    }

    /**
     * Motor de Geração de Melhorias Inteligentes (Port de v2)
     */
    function generateMelhoriasInteligentes(data, res) {
        const items = [];
        const baseScore = data.totalScore || 0;

        // 1. Quitar Dívidas
        if (data.dividas > 0) {
            const dMeta = 0;
            items.push({
                idx: 1, icone: 'money_off', cor: '#ef4444',
                criterio: 'Nível de Endividamento',
                acao: `Zerar Dívidas Mensais (${formatCurrency(data.dividas)})`,
                prazo: 'Imediato',
                scoreMais: 15,
                passos: [
                    'Priorize a quitação de cartões e cheque especial (maiores juros).',
                    'A cada R$ 100 de dívida quitada, seu poder de compra sobe aproximadamente R$ 4.000.',
                    'Com dívidas zeradas, sua margem bancária sobe para o teto de 30% da renda.'
                ]
            });
        }

        // 2. FGTS (Cotista)
        if (data.fgts < 15000 && data.vinculo === 'clt') {
            items.push({
                idx: 2, icone: 'account_balance', cor: '#3b82f6',
                criterio: 'Saldo FGTS',
                acao: `Atingir R$ 15.000 de Saldo`,
                prazo: 'Médio Prazo',
                scoreMais: 8,
                passos: [
                    'Mantenha 3 anos registrados (mesmo em empresas diferentes) para ser Cotista.',
                    'O FGTS reduz o saldo devedor e, consequentemente, a taxa de juros anual.',
                    'Consulte o app FGTS mensalmente para validar os depósitos da empresa.'
                ]
            });
        }

        // 3. Coach por Vínculo
        const coachProfile = {
            clt: {
                acao: 'Maximização de Estabilidade',
                passos: [
                    'Mantenha-se no emprego atual por pelo menos 6 meses antes de assinar com o banco.',
                    'Evite novos empréstimos com desconto em folha para não travar sua margem.'
                ]
            },
            mei: {
                acao: 'Profissionalização do Faturamento',
                passos: [
                    'Transfira seu faturamento da conta PJ para a PF como "Pró-Labore".',
                    'Mantenha a DAS-SIMEI paga rigorosamente em dia por 12 meses.'
                ]
            },
            autonomo: {
                acao: 'Blindagem de Renda (Provas de 6 meses)',
                passos: [
                    'Concentre toda a sua movimentação em uma única conta pessoa física.',
                    'Mantenha um saldo médio positivo constante nos últimos 6 meses.'
                ]
            }
        };

        const c = coachProfile[data.vinculo] || coachProfile.autonomo;
        items.push({
            idx: 3, icone: 'psychology', cor: '#b02e00',
            criterio: 'Coach: ' + data.vinculo.toUpperCase(),
            acao: c.acao,
            prazo: '3 a 6 meses',
            scoreMais: 10,
            passos: c.passos
        });

        // 4. Composição de Renda
        items.push({
            idx: 4, icone: 'group_add', cor: '#8b5cf6',
            criterio: 'Poder de Compra',
            acao: 'Adicionar Co-proponente (Regras CAIXA)',
            prazo: 'Imediato',
            scoreMais: 20,
            passos: [
                'Você pode somar a renda de até 3 pessoas (mesmo amigos ou parentes).',
                'O proponente mais jovem estende o prazo e reduz o valor das parcelas.',
                'Todos os envolvidos devem ter o nome limpo e sem outros financiamentos.'
            ]
        });

        return items;
    }

    function buildTipCard(m, i, currentScore) {
        const nextScore = Math.min(100, currentScore + m.scoreMais);
        const stepsHTML = m.passos.map(s => `
            <div class="timeline-step">
                <div class="timeline-dot"></div>
                <p class="text-[11px] leading-relaxed text-slate-600 font-medium">${s}</p>
            </div>
        `).join('');

        return `
            <div class="tip-card" id="tip-card-${m.idx}">
                <div class="tip-header" onclick="this.parentElement.classList.toggle('active')">
                    <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0" style="background-color: ${m.cor}15;">
                        <span class="material-symbols-outlined text-[20px] md:text-[24px]" style="color: ${m.cor};">${m.icone}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-0.5">
                            <h5 class="text-xs md:text-sm font-bold text-slate-800">${m.criterio}</h5>
                            <span class="score-boost">+${m.scoreMais} pts</span>
                        </div>
                        <p class="text-[10px] md:text-[11px] text-slate-500 font-medium hidden md:block">${m.acao}</p>
                    </div>
                    <span class="material-symbols-outlined text-slate-300 transition-transform">expand_more</span>
                </div>
                <div class="tip-body">
                    <!-- MT_LOG (04/2026): Descrição principal visível apenas no mobile (já que está oculta no header) -->
                    <p class="md:hidden text-xs text-slate-600 font-bold mb-4 bg-slate-50 p-3 rounded-lg border-l-4" style="border-color: ${m.cor};">
                        ${m.acao}
                    </p>
                    <div class="bg-slate-50 rounded-xl p-4 mb-6 flex items-center justify-between border border-slate-100">
                        <div>
                            <p class="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Score Projetado</p>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-slate-400">${currentScore}</span>
                                <span class="material-symbols-outlined text-xs text-slate-300">trending_flat</span>
                                <span class="text-xl font-black" style="color: ${m.cor};">${nextScore}</span>
                            </div>
                        </div>
                        <div class="text-right">
                             <p class="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Prazo</p>
                             <p class="text-xs font-bold text-slate-600">${m.prazo}</p>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-3">Plano de Ação</p>
                        ${stepsHTML}
                    </div>
                </div>
            </div>
        `;
    }

    function updateCriteria(ptsEl, barEl, current, max) {
        if (ptsEl) ptsEl.innerText = current + "/" + max;
        if (barEl) barEl.style.width = (current / max * 100) + "%";
    }

    // --- 6. ATRIBUIÇÃO DE EVENTOS ---
    ['renda', 'idade', 'dividas', 'fgts', 'entrada'].forEach(id => {
        if (inputs[id]) inputs[id].addEventListener('input', updateSimulation);
    });

    ['clt3anos', 'primeiroImovel', 'dependentes'].forEach(id => {
        if (inputs[id]) inputs[id].addEventListener('change', updateSimulation);
    });

    if (inputs.nome) inputs.nome.addEventListener('input', updateSimulation);
    if (inputs.celular) inputs.celular.addEventListener('input', updateSimulation);

    // --- UX: ao tocar nos sliders no mobile, remove o foco do input ativo
    // Evita que o teclado virtual permaneça aberto e gere scroll indesejado
    (function() {
        const sliderIds = ['renda','idade','dividas','fgts','entrada'];
        const sliders = sliderIds.map(id => document.getElementById(id)).filter(Boolean);
        const blurActive = () => {
            try {
                // Marca o momento do último toque no slider — usado pelo guard de foco
                try { window.__mt_lastSliderTouch = Date.now(); } catch (e) { /* noop */ }
                const a = document.activeElement;
                if (!a) return;
                const tag = (a.tagName || '').toUpperCase();
                if (tag === 'INPUT' || tag === 'TEXTAREA' || a.isContentEditable) {
                    a.blur();
                }
            } catch (e) {
                console.warn('blurActive failed', e);
            }
        };
        sliders.forEach(s => {
            // use capture phase so blur runs before other listeners
            s.addEventListener('pointerdown', blurActive, { capture: true, passive: true });
            s.addEventListener('touchstart', blurActive, { capture: true, passive: true });
        });
    })();

    inputs.vinculoButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Atualizar UI dos botões
            inputs.vinculoButtons.forEach(b => {
                // Estado Inativo
                b.classList.add('bg-surface-container-low', 'text-on-surface');
                b.classList.remove('bg-primary', 'text-white');
                // Remover ícone check se existir
                const oldIcon = b.querySelector('.material-symbols-outlined');
                if (oldIcon && oldIcon.innerText === 'check_circle') oldIcon.remove();
            });
            
            // Estado Ativo
            this.classList.remove('bg-surface-container-low', 'text-on-surface');
            this.classList.add('bg-primary', 'text-white');
            
            // Adicionar ícone ao selecionado
            const checkIcon = document.createElement('span');
            checkIcon.className = "material-symbols-outlined text-sm";
            checkIcon.innerText = "check_circle";
            checkIcon.style.fontVariationSettings = "'FILL' 1";
            this.appendChild(checkIcon);

            currentVinculo = this.getAttribute('data-vinculo');

            // Lógica de Visibilidade Condicional (Regra V2)
            if (outputs.wrapClt3anos) {
                if (currentVinculo === 'clt') {
                    outputs.wrapClt3anos.style.display = 'flex';
                } else {
                    outputs.wrapClt3anos.style.display = 'none';
                    if (inputs.clt3anos) inputs.clt3anos.checked = false;
                }
            }
            
            updateSimulation();
        });
    });

    // Início imediato
    updateSimulation();

    /**
     * Gatilho Oficial de Processamento IA (Port de v2 Premium)
     * Gerencia a validação de leads, animação de autoridade e transição de resultados.
     */
    window.iniciarRotinaIA = function(e) {
        if (e) e.preventDefault();

        // 1. Validação de Lead (Campos Mapeados no Objeto inputs)
        const nomeVal = inputs.nome ? inputs.nome.value.trim() : "";
        const telVal = inputs.celular ? inputs.celular.value.trim() : "";

        if (!nomeVal) {
            alert("Por favor, informe seu nome na área de Identificação Profissional.");
            if (inputs.nome) inputs.nome.focus();
            return;
        }

        const digits = telVal.replace(/\D/g, '');
        if (digits.length < 10) {
            alert("Por favor, informe seu WhatsApp para receber o Laudo Oficial.");
            if (inputs.celular) inputs.celular.focus();
            return;
        }

        // 2. Ativar Animação Overlay IA
        const overlay = document.getElementById('sim-loading-overlay');
        const msg = document.getElementById('loading-msg');
        const fill = document.getElementById('loading-bar-fill');

        if (!overlay) return;

        // MT_LOG (04/2026): Dispara primeiro envio para planilha (Lead de Entrada)
        sendLeadToGoogleSheetsStage1();

        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100');

        let pct = 0;
        const msgs = [
            "Sincronizando bases bancárias...",
            "Calculando subsídios habitacionais...",
            "Mapeando teto de juros 2026...",
            "Consolidando Laudo de Aprovação..."
        ];

        // Reset da Barra
        if (fill) fill.style.width = '0%';

        const interval = setInterval(() => {
            pct += 1.5; // Velocidade da animação (aprox 3 seg)
            
            if (pct >= 100) {
                clearInterval(interval);
                pct = 100;
                
                // 3. Finalização e Transição
                setTimeout(() => {
                    overlay.classList.remove('opacity-100');
                    overlay.classList.add('opacity-0', 'pointer-events-none');
                    
                    // --- MECANISMO DE TRANSIÇÃO AUTOMÁTICA ---
                    // Finaliza a animação, atualiza o estado global e redireciona
                    // o usuário sem necessidade de um segundo clique, otimizando o funil de vendas.
                    iaRoutineFinished = true;
                    setTimeout(() => window.irParaDossie(), 200);
                }, 600);
            }

            // Atualização de UI no Overlay
            if (fill) fill.style.width = pct + '%';
            if (msg) msg.innerText = msgs[Math.min(3, Math.floor(pct / 25))];

        }, 40);
    };
    // --- 7. GATILHOS DE CONVERSÃO (Redirecionamento para Dossiê) ---
    // Mapeia tanto o botão do Hero quanto o do Rodapé para a mesma lógica.
    const mainBtns = [
        document.getElementById('btn-final-submit'),
        document.getElementById('btn-footer-ia')
    ];

    mainBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                // Se o laudo já foi gerado na sessão atual, abre direto.
                // Se não, inicia a rotina de autoridade da IA.
                if (!iaRoutineFinished) {
                    window.iniciarRotinaIA(e);
                } else {
                    window.irParaDossie();
                }
            });
        }
    });

    // --- 8. LÓGICA DE VISIBILIDADE DO BALÃO FLUTUANTE ---
    const mainCard = document.getElementById('main-results-card');
    const stickyBar = outputs.stickyBar;

    if (mainCard && stickyBar) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Quando o card sai da tela (isIntersecting = false)
                if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                    stickyBar.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
                    stickyBar.classList.add('translate-y-0', 'opacity-100');
                } else {
                    stickyBar.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
                    stickyBar.classList.remove('translate-y-0', 'opacity-100');
                }
            });
        }, {
            threshold: 0,
            // MT_LOG (04/2026): Compensação sincronizada com o novo Header h-20 (80px)
            rootMargin: '-80px 0px 0px 0px' 
        });

        observer.observe(mainCard);
    }

});
