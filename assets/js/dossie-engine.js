/**
 * DOSSIÊ DO INVESTIDOR - MOTOR DE INTELIGÊNCIA FINANCEIRA (ENGINE)
 * Arquitetura Modular: assets/js/dossie-engine.js
 * Responsável por: Cálculos de Match, Alvos de Equilíbrio, Formatação e Projeções.
 * [Tolerância Zero]: Este arquivo NÃO deve conter seletores de DOM ou manipulação de UI.
 * MT_LOG (05/2026): Central de inteligência para Match e Alvos dinâmicos.
 * MT_LOG (V10.0): Integração de vínculos para validação do Aprovador Universal.
 */

const DossieEngine = {
    /**
     * Gera um diagnóstico dinâmico baseado nos resultados da simulação.
     */
    generateDynamicRecommendation: function(res, data, formatCurrency) {
        const fr = res.fullResults;
        const pts = res.scorePoints || {};
        
        if (fr.dividas > (fr.renda * 0.15)) {
            return `"Detectamos que o seu **comprometimento de dívidas** (${formatCurrency(fr.dividas)}) está acima do ideal. Reduzir cartões de crédito ou empréstimos ativos pode liberar até **R$ 45.000 extras** no seu potencial de financiamento imediato."`;
        }

        if (fr.prazoEfetivo < 420 && fr.idade > 45) {
            return `"O prazo de financiamento foi ajustado para **${fr.prazoEfetivo} meses** devido ao fator idade. Recomendamos incluir um **co-proponente mais jovem** (filho ou cônjuge) para estender o prazo para 420 meses e reduzir sua parcela em aproximadamente 18%."`;
        }

        if (fr.perfilEnquadramento === 'HIS-1') {
            return `"Excelente notícia! Seu perfil se enquadra como **HIS-1**, o que garante **Isenção Total de ITBI** em São Paulo. Isso representa uma economia direta de aproximadamente **${formatCurrency(fr.valorImovel * 0.03)}** no ato da sua escritura."`;
        }

        if (fr.saldoEntrada > (fr.valorImovel * 0.12)) {
            return `"Para viabilizar sua compra, estruturamos um plano onde a entrada de ${formatCurrency(fr.saldoEntrada)} é **parcelada em 36 meses** pela construtora. Isso permite que você mantenha sua reserva de emergência rendendo enquanto garante sua unidade."`;
        }

        if (fr.foraDoMCMV) {
            return `"Com base no seu perfil de alta renda, identificamos uma oportunidade de **valorização patrimonial via SBPE**. Com a entrega prevista para ${fr.mesesObra} meses, a projeção de valorização do imóvel supera o custo do financiamento, sendo um excelente match de investimento."`;
        }

        return `"Seu perfil se enquadra com excelência no programa **Minha Casa Minha Vida**. Com subsídio de ${formatCurrency(fr.subsidio)}, a estratégia recomendada é focar no uso do FGTS para reduzir o saldo devedor e garantir as menores taxas do mercado."`;
    },

    /**
     * Constrói o cenário de dados para cálculo de estratégia.
     */
    buildStrategyScenario: function(baseData = {}, overrides = {}, originalSimData = {}) {
        // MT_LOG (05/2026): Busca de Alvo com Contexto Completo (Vínculo + Idade)
        const scenario = {
            ...(originalSimData.raw || {}),
            ...baseData,
            renda: (originalSimData.raw?.renda || 0) + (overrides.extraRenda || 0),
            entrada: (originalSimData.raw?.entrada || 0) + (overrides.extraEntrada || 0),
            fgts: (originalSimData.raw?.fgts || 0) + (overrides.extraFgts || 0),
            vinculo: overrides.vinculo || baseData.vinculo || 'clt',
            idade: overrides.idade || baseData.idade || 30,
            clt3anos: (baseData.clt3anos ?? originalSimData.raw?.clt3anos ?? true),
            isPrimeiroImovel: (baseData.isPrimeiroImovel ?? originalSimData.raw?.isPrimeiroImovel ?? true),
            possuiDependentes: (baseData.possuiDependentes ?? originalSimData.raw?.possuiDependentes ?? false)
        };
        return scenario;
    },

    /**
     * Avalia se um imóvel dá Match com o cenário atual.
     * v5.1: Unificado para usar 'valorImovel' como teto oficial.
     */
    evaluateMatch: function(precoImovel, scenario, strategyOverrides = {}) {
        // MT_LOG (05/2026): Blindagem contra cenário nulo
        if (!scenario) {
            scenario = this.buildStrategyScenario({}, {}, window._originalSimData || {});
        }

        if (typeof MT_Core === 'undefined') {
            console.error("DossieEngine: MT_Core não encontrado.");
            return { delta: Infinity, isMatch: false };
        }

        const sim = MT_Core.calculateMCMV(
            scenario.renda || 0,
            scenario.dividas || 0,
            scenario.fgts || 0,
            scenario.entrada || 0,
            !!scenario.clt3anos,
            scenario.isPrimeiroImovel !== false,
            scenario.idade,
            scenario.vinculo,
            !!scenario.possuiDependentes
        );

        // MT_LOG (05/2026): LÓGICA OPÇÃO 3 - PESSIMISMO SAUDÁVEL
        // 1. Identifica se o usuário está tentando uma nova estratégia
        const isStrategyActive = (strategyOverrides.extraRenda > 0 || strategyOverrides.extraEntrada > 0 || strategyOverrides.extraFgts > 0);
        // MT_LOG (05/2026): LÓGICA DE APORTE REAL (V9.2)
        // - referencePower: O poder real (blindado contra quedas de subsídio).
        // - linearPower: O que o usuário espera (Original + Ganho de Crédito + Extras).
        const cachedPower = window.MT_SimulatedPower || 0;
        
        const initialPotencial = (window._originalSimData?.results?.potencial || window._originalSimData?.results?.financiamento || 0);
        const creditGain = Math.max(0, (sim.potencial || 0) - initialPotencial);
        const extraSum = (strategyOverrides.extraEntrada || 0) + (strategyOverrides.extraFgts || 0);
        const leverageGain = creditGain + extraSum;

        // [V9.5] LÓGICA DE GANHO LÍQUIDO: Desconta a perda de subsídio - MT_LOG (05/2026)
        const initialSubsidio = (window._originalSimData?.results?.subsidio || 0);
        const subsidyLoss = Math.max(0, initialSubsidio - (sim.subsidio || 0));
        const netCreditGain = Math.max(0, creditGain - subsidyLoss);
        const netLeverageGain = netCreditGain + extraSum;

        const referencePower = Math.max(sim.poderReal || 0, cachedPower + extraSum);
        const linearPower = cachedPower + creditGain + extraSum;
        
        // Delta Real (O que vale para a Caixa)
        const realDelta = Math.max(0, (precoImovel || 0) - referencePower);
        
        // Delta Linear (O que reage visualmente nos sliders)
        const linearDelta = Math.max(0, (precoImovel || 0) - linearPower);
        
        // Eficiência: Se o delta real for muito maior que o linear, há perda de subsídio.
        const isEfficient = realDelta <= (linearDelta + 500);
        
        const isMatch = realDelta <= 100;

        // Injetamos o poder blindado para a UI
        sim.poderReal = referencePower;

        return {
            isMatch,
            delta: realDelta,
            linearDelta,
            isEfficient,
            sim,
            creditGain,
            leverageGain,
            netCreditGain,
            netLeverageGain,
            subsidyLoss
        };
    },

    /**
     * Busca o ponto de equilíbrio financeiro para atingir o Match.
     * MT_LOG (05/2026): EVOLUÇÃO V8.7 - Engenharia de Eficiência de Subsídio.
     * Agora o motor detecta "penhascos" de subsídio e evita sugerir rendas prejudiciais ao usuário.
     */
    findMatchTarget: function(type, baseData, propertyPrice, originalSimData = {}, currentSliders = {}) {
        const steps = 400; // Dobro da precisão para fluidez total
        const maxVal = type === 'renda' ? 10000 : 50000;
        const stepVal = maxVal / steps;
        
        let bestTarget = maxVal;
        let foundMatch = false;
        let lastEfficientPower = 0;
        let lastSubsidio = -1;
        let lastCreditGain = 0;

        // MT_LOG (05/2026): Identifica se já existe um déficit antes de começar
        const initialScenario = this.buildStrategyScenario(baseData || {}, { ...currentSliders, [type === 'renda' ? 'extraRenda' : 'extraEntrada']: 0 }, originalSimData);
        const initialEval = this.evaluateMatch(propertyPrice, initialScenario, {});
        const hasRealDeficit = initialEval.delta > 100;

        // Escaneamento Linear de Eficiência
        for (let i = 0; i <= steps; i++) {
            const currentExtra = i * stepVal;
            
            const overrides = {
                extraRenda: currentSliders.extraRenda || 0,
                extraEntrada: currentSliders.extraEntrada || 0,
                extraFgts: currentSliders.extraFgts || 0
            };
            
            overrides[type === 'renda' ? 'extraRenda' : 'extraEntrada'] = currentExtra;
            const scenario = this.buildStrategyScenario(baseData || {}, overrides, originalSimData);
            const result = this.evaluateMatch(propertyPrice, scenario, overrides);
            
            const currentSubsidio = result.sim.subsidio || 0;
            const currentPower = result.sim.poderReal || 0;

            // [LÓGICA DE PROTEÇÃO - V8.9] 
            // MT_LOG (05/2026): Se existe déficit, o alvo nunca pode ser zero. Pulamos o passo 0
            // para evitar que erros de arredondamento ou instabilidade inicial travem o marcador.
            if (hasRealDeficit && i === 0) {
                lastSubsidio = currentSubsidio;
                lastEfficientPower = currentPower;
                continue;
            }

            // [LÓGICA DE EFICIÊNCIA - V9.2]
            // MT_LOG (05/2026): O Alvo agora busca o PONTO ZERO real, mas detecta penhascos.
            if (result.isMatch) {
                if (!foundMatch) {
                    bestTarget = currentExtra;
                    foundMatch = true;
                }
            }

            if (type === 'renda' && lastSubsidio !== -1) {
                const subsidyDrop = lastSubsidio - currentSubsidio;
                const powerGain = result.creditGain - (lastCreditGain || 0);

                // Detector de Penhasco: Se perder mais subsídio do que ganhou de crédito
                if (subsidyDrop > 500 && subsidyDrop > powerGain) {
                    // Aqui sinalizamos que o ponto de eficiência foi atingido
                }
            }
            lastCreditGain = result.creditGain;

            if (result.isMatch && !foundMatch) {
                bestTarget = currentExtra;
                foundMatch = true;
                if (type !== 'renda') break; 
            }

            lastSubsidio = currentSubsidio;
            lastEfficientPower = currentPower;
        }
        
        return bestTarget;
    },

    /**
     * Calibra o alvo operacional para garantir que o degrau da UI seja suficiente para o Match.
     */
    calibrateOperationalTarget: function(type, baseData, propertyPrice, snappedTarget, originalSimData = {}) {
        const step = type === 'renda' ? 100 : 500;
        const maxVal = type === 'renda' ? 10000 : 50000;
        let candidate = Math.ceil((snappedTarget || 0) / step) * step;
        candidate = Math.max(0, Math.min(maxVal, candidate));

        for (let i = 0; i < 6; i++) {
            const test = { ...baseData };
            if (type === 'renda') test.renda = (baseData.renda ?? 0) + candidate;
            else test.entrada = (baseData.entrada ?? 0) + candidate;

            const scenario = this.buildStrategyScenario(test, {}, originalSimData);
            const evalRes = this.evaluateMatch(propertyPrice, scenario, {});
            if (evalRes.isMatch) return candidate;

            candidate = Math.min(maxVal, candidate + step);
        }

        return candidate;
    },

    /**
     * Calcula meses para entrega com base na data atual real.
     */
    getMesesParaEntrega: function(dataString) {
        if (!dataString) return 36;
        const hoje = new Date(); 
        const clean = dataString.toLowerCase();

        if (clean.includes('pronto')) return 1;
        if (clean.includes('lança')) return 36;
        
        const mesesMap = { 'jan':0, 'fev':1, 'mar':2, 'abr':3, 'mai':4, 'jun':5, 'jul':6, 'ago':7, 'set':8, 'out':9, 'nov':10, 'dez':11 };
        const parts = dataString.split('/');
        if (parts.length === 2) {
            const mesAbv = parts[0].toLowerCase().trim();
            const ano = parseInt(parts[1]);
            const mesNum = mesesMap[mesAbv];
            
            if (!isNaN(ano) && mesNum !== undefined) {
                const dataEntrega = new Date(ano, mesNum, 1);
                const diffMs = dataEntrega - hoje;
                const diffMeses = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44));
                return Math.max(1, diffMeses);
            }
        }
        return 36;
    },



    /**
     * Utilitários de conversão e parsing.
     */
    parsePreco: function(txt) {
        if (!txt) return 0;
        if (typeof txt === 'number') return txt;
        let clean = txt.toLowerCase().trim();
        
        if (clean.includes('aguarde') || clean.includes('breve') || clean.includes('consulta')) return Infinity;

        if (clean.includes('milhão') || clean.includes('milhões')) {
            const parts = clean.split(/milh[õesão]+/);
            let megaStr = parts[0].replace(/[^\d,.]/g, '').replace(',', '.');
            const mega = parseFloat(megaStr) || 0;
            let kilo = 0;
            if (parts[1] && parts[1].includes('mil')) {
                kilo = parseInt(parts[1].replace(/\D/g, '')) || 0;
                if (kilo < 100 && kilo > 0) kilo *= 10;
            }
            return Math.floor(mega * 1000000) + (kilo * 1000);
        }

        if (clean.includes('mil')) {
            let valStr = clean.replace(/[^\d,.]/g, '').replace(',', '.');
            let val = parseFloat(valStr) || 0;
            if (val < 1000) return val * 1000;
            return val;
        }

        let work = clean.replace(/r\$/g, '').trim();
        if (work.includes(',')) work = work.split(',')[0];
        return parseInt(work.replace(/\D/g, '')) || 0;
    }
};

// Exportar globalmente para o Dossiê
window.DossieEngine = DossieEngine;
