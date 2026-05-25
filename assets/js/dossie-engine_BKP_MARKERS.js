/**
 * DOSSIÊ DO INVESTIDOR - MOTOR DE INTELIGÊNCIA FINANCEIRA (ENGINE)
 * Arquitetura Modular: assets/js/dossie-engine.js
 * Responsável por: Cálculos de Match, Alvos de Equilíbrio, Formatação e Projeções.
 * [Tolerância Zero]: Este arquivo NÃO deve conter seletores de DOM ou manipulação de UI.
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
        const raw = (originalSimData && originalSimData.raw) ? originalSimData.raw : {};
        const scenario = {
            renda: (baseData.renda ?? raw.renda ?? 0) + (overrides.extraRenda || 0),
            entrada: (baseData.entrada ?? raw.entrada ?? 0) + (overrides.extraEntrada || 0),
            dividas: (baseData.dividas ?? raw.dividas ?? 0),
            fgts: (baseData.fgts ?? raw.fgts ?? 0) + (overrides.extraFgts || 0),
            idade: (baseData.idade ?? raw.idade ?? 30),
            vinculo: (baseData.vinculo ?? raw.vinculo ?? 'clt'),
            clt3anos: (baseData.clt3anos ?? raw.clt3anos ?? true),
            isPrimeiroImovel: (baseData.isPrimeiroImovel ?? raw.isPrimeiroImovel ?? true),
            possuiDependentes: (baseData.possuiDependentes ?? raw.possuiDependentes ?? false)
        };
        return scenario;
    },

    /**
     * Avalia se um imóvel dá Match com o cenário atual.
     */
    evaluateMatch: function(precoImovel, scenario, forceSimulated = true, simulatedPower = 0, strategyOverrides = {}) {
        // MT_LOG (04/2026): Blindagem contra cenário nulo (Resiliência Modular)
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
        
        const isStrategyActive = (
            (strategyOverrides.extraRenda > 0 || strategyOverrides.extraEntrada > 0)
        );
        
        let referencePower = sim.poderReal || 0;
        if ((forceSimulated || !isStrategyActive) && simulatedPower) {
            referencePower = simulatedPower;
            sim.poderReal = simulatedPower;
        }
        
        const delta = Math.max(0, (precoImovel || 0) - (referencePower));
        return { sim, delta, isMatch: delta <= 1000 };
    },

    /**
     * Busca o ponto de equilíbrio financeiro para atingir o Match.
     */
    findMatchTarget: function(type, baseData, propertyPrice, originalSimData = {}) {
        const steps = 400; 
        const maxVal = type === 'renda' ? 10000 : 50000;
        const stepVal = maxVal / steps;
        
        let low = 0;
        let high = steps;
        let bestIndex = steps;

        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            const currentExtra = mid * stepVal;
            const testData = { ...baseData };
            
            if (type === 'renda') {
                testData.renda = (baseData.renda ?? 0) + currentExtra;
            } else {
                testData.entrada = (baseData.entrada ?? 0) + currentExtra;
            }
            
            // MT_LOG: Modo Dinâmico (forceSimulated=false) para busca de alvos
            const scenario = this.buildStrategyScenario(testData, {}, originalSimData);
            const result = this.evaluateMatch(propertyPrice, scenario, false, 0, {}); 
            if (result.isMatch) {
                bestIndex = mid;
                high = mid - 1; 
            } else {
                low = mid + 1;
            }
        }
        
        return bestIndex * stepVal;
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
            const evalRes = this.evaluateMatch(propertyPrice, scenario, false, 0, {});
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
     * Gera um texto de recomendação personalizado com base no enquadramento.
     */
    generateDynamicRecommendation: function(res, emp) {
        const isMCMV = !res.foraDoMCMV;
        const bairro = emp.bairro || "São Paulo";
        const valor = res.poderReal || 0;
        
        if (isMCMV) {
            return `Excelente notícia! Seu perfil se enquadra como **HIS-1**, o que garante **Isenção Total de ITBI** em ${bairro}. Isso representa uma economia direta de aproximadamente **${window.MT_Utils.formatCurrency(valor * 0.04)}** no ato da sua escritura.`;
        } else {
            return `Ótima escolha! O ${emp.nome} é uma unidade de **Médio Padrão (SBPE)** com alta liquidez. Seu potencial de financiamento permite uma estratégia de **Entrada Facilitada**, otimizando seu fluxo de caixa durante as obras.`;
        }
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
