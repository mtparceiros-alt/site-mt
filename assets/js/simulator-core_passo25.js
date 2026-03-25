/**
 * MT Parceiros - Core de Cálculos MCMV (PROPRIETÁRIO)
 * Este arquivo contém a lógica matemática do simulador.
 * @version 1.1
 */

(function () {
    // --- TRAVA DE DOMÍNIO ---
    // Impede que o simulador seja clonado e usado em outros sites.
    var allowed = ['mtparceiros.com.br', 'localhost', '127.0.0.1', 'marcos-m1.github.io', 'mtparceiros-alt.github.io'];
    var current = window.location.hostname;
    var isValid = !current || window.DISABLE_DOMAIN_LOCK || allowed.some(function (domain) {
        return current.indexOf(domain) !== -1;
    });

    if (!isValid) {
        console.warn("MT Parceiros: Domínio não autorizado para este simulador.");
        
        // Exibe um erro amigável ao usuário
        document.addEventListener("DOMContentLoaded", function () {
            var simContainer = document.getElementById('simulador');
            if (simContainer) {
                simContainer.innerHTML = '<div style="background: #ffebe8; border: 1px solid #ff3333; color: #cc0000; padding: 20px; border-radius: 10px; text-align: center; font-family: sans-serif;"><h3>Acesso de Segurança Negado</h3><p>Este simulador não está autorizado para rodar no domínio atual. Por favor, acesse através do site oficial da MT Parceiros.</p></div>';
            }
        });
        
        return;
    }

    window.MT_Core = {
        /**
         * ════════════════════════════════════════════════════════════════
         *  MT_Core.calculateMCMV() — Motor de Cálculo Principal
         *  Regras CAIXA/MCMV 2025 + SBPE (São Paulo Capital)
         *
         *  OBJETO RETORNADO (campos principais):
         *  ┌─ renda, dividas, fgts, entrada    → Inputs espelhados
         *  ├─ margem                           → Renda*0.30 - dívidas
         *  ├─ potencial                        → Valor máx. financiável (MCMV)
         *  ├─ poder                            → potencial + fgts + entrada + subsidio
         *  ├─ subsidio                         → Subsídio federal (Faixas 1 e 2)
         *  ├─ taxaAnualMCMV                    → Taxa decimal (ex: 0.0816)
         *  ├─ faixaMCMV                        → "Faixa 1" / "Faixa 2" / "Faixa 3"
         *  ├─ prazoEfetivo                     → Meses (máx 420, limitado por idade)
         *  ├─ parcelaPosChaves                 → Parcela SAC inicial pós-chaves
         *  ├─ parcelaEntrada                   → Valor mensal à construtora (36x)
         *  ├─ evolucaoMedia                    → Taxa obra média mensal (banco)
         *  ├─ valorImovel                      → Imóvel de referência da simulação
         *  ├─ itbi                             → ITBI estimado (0.5% do financiamento)
         *  ├─ foraDoMCMV                       → true se renda > teto MCMV
         *  ├─ excedeTeto                       → true se poder > teto da faixa
         *  ├─ rendaConsiderada                 → Renda após ajuste MEI (×0.80)
         *  └─ sbpe {}                          → Só existe se foraDoMCMV || excedeTeto
         *       ├─ poder, potencial, parcela
         *       ├─ taxa (decimal, ex: 0.1099)
         *       └─ prazo (meses, máx 360)
         *
         *  REGRA MEI: renda = min(renda, 6750) × 0.80
         *  REGRA PRAZO: min(420, floor((80.5 - idade) × 12))
         *  OFUSCAÇÃO: Em produção, este arquivo é substituído pelo .min.js
         *  DOMÍNIOS: Trava de domínio na linha 8 do arquivo
         * ════════════════════════════════════════════════════════════════
         */
        calculateMCMV: function (renda, dividas, fgts, entrada, clt3anos, ePrimeiroImovel, idade, vinculo, hasDependents) {

            // 0. PARÂMETROS OPCIONAIS (Retrocompatibilidade e Segurança)
            idade = (typeof idade === 'number' && !isNaN(idade) && idade >= 18 && idade <= 80) ? idade : 30;
            vinculo = (['clt', 'autonomo', 'mei', 'aposentado'].indexOf(vinculo) !== -1) ? vinculo : 'clt';

            // 0.0 TRAVA DE SEGURANÇA (Renda Zero)
            if (renda <= 0 && (!fgts || fgts <= 0) && (!entrada || entrada <= 0)) {
                return { renda: 0, poder: 0, potencial: 0, itbi: 0, parcelaEntrada: 0, subsidio: 0 };
            }

            // 0.1 AJUSTE DE RENDA POR VÍNCULO
            let rendaOriginal = renda;
            if (vinculo === 'mei') {
                // MEI: limita ao teto de R$ 6.750/mês e aplica fator 80% (dedução operacional)
                renda = Math.min(renda, 6750) * 0.80;
            }
            // Não-CLT não pode ser cotista FGTS (3+ anos)
            if (vinculo !== 'clt') {
                clt3anos = false;
            }

            // 1. MARGEM DE SEGURANÇA BANCÁRIA
            const margem = Math.max(0, (renda * 0.30) - dividas);

            // 2. DEFINIÇÃO DE TAXAS E TETOS (Tabela Oficial MCMV 2025 - São Paulo Capital)
            let taxaAnual = 0.0816;
            let tetoImovel = 500000;
            let faixaMCMV = "Fora do MCMV";
            let foraDoMCMV = false;
            let n = 420; // NOVO PRAZO 2025: 35 anos (420 meses)

            // PRAZO MÁXIMO POR IDADE (Regra Caixa: Idade + Prazo ≤ 80 anos e 6 meses)
            const prazoMaxIdade = Math.floor((80.5 * 12) - (idade * 12));
            n = Math.min(n, Math.max(60, prazoMaxIdade));

            if (renda <= 2850) {
                taxaAnual = clt3anos ? 0.0425 : 0.0475;
                tetoImovel = 275000; // TETO ATUALIZADO 2025 SP CAPITAL
                faixaMCMV = "Faixa 1";
            }
            else if (renda <= 4700) {
                taxaAnual = clt3anos ? 0.0650 : 0.0700;
                tetoImovel = 275000; // TETO ATUALIZADO 2025 SP CAPITAL
                faixaMCMV = "Faixa 2";
            }
            else if (renda <= 8600) {
                taxaAnual = clt3anos ? 0.0766 : 0.0816;
                tetoImovel = 350000;
                faixaMCMV = "Faixa 3";
            }
            else if (renda <= 12000) {
                // FAIXA 4 (OFICIAL 2025)
                taxaAnual = clt3anos ? 0.1000 : 0.1050;
                tetoImovel = 500000;
                faixaMCMV = "Faixa 4";
            }
            else {
                taxaAnual = 0.1099;
                tetoImovel = 1500000;
                n = Math.min(360, Math.max(60, prazoMaxIdade)); // 30 anos para SBPE
                foraDoMCMV = true;
                faixaMCMV = "SBPE/Mercado";
            }

            // 3. REGRA DE RESTRIÇÃO DE PERFIL (SBPE/SFH)
            // Se o usuário já possui um imóvel, ele perde os benefícios do MCMV

            if (ePrimeiroImovel === false) {
                taxaAnual = Math.max(taxaAnual, 0.0950); // Taxa mínima de mercado
                tetoImovel = 1500000;
                n = Math.min(360, Math.max(60, prazoMaxIdade)); // 30 anos (Padrão de mercado), limitado por idade
                foraDoMCMV = true;
                faixaMCMV = "SBPE/Mercado";
            }

            // Conversão da taxa anual para mensal (Juros Compostos)
            const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;

            // 3.5 SEGUROS OBRIGATÓRIOS (MIP + DFI)
            // MIP: Morte e Invalidez Permanente — taxa varia por faixa etária (sobre saldo devedor)
            let taxaMIP;
            if (idade <= 30) taxaMIP = 0.00015;
            else if (idade <= 40) taxaMIP = 0.00025;
            else if (idade <= 50) taxaMIP = 0.00045;
            else if (idade <= 60) taxaMIP = 0.00080;
            else if (idade <= 70) taxaMIP = 0.00150;
            else taxaMIP = 0.00250;

            // DFI: Danos Físicos ao Imóvel — taxa fixa (sobre valor de avaliação do imóvel)
            const taxaDFI = 0.000034; // 0.0034% ao mês

            // 4. POTENCIAL DE FINANCIAMENTO (Algoritmo SAC com Seguros)
            // Passo 1: Potencial bruto (sem seguros) para estimar o saldo devedor
            const potencialBruto = Math.floor(margem / ((1 / n) + taxaMensal));
            // Passo 2: Estimar custos de seguro sobre o potencial bruto
            const custoMIP = potencialBruto * taxaMIP;
            const custoDFI = tetoImovel * taxaDFI;
            // Passo 3: Margem líquida (desconta seguros)
            const margemLiquida = Math.max(0, margem - custoMIP - custoDFI);
            // Passo 4: Potencial real (com seguros descontados da margem)
            const potencial = Math.floor(margemLiquida / ((1 / n) + taxaMensal));

            // 5. SUBSÍDIOS (MCMV Federal + Casa Paulista 2025)
            let subsidio = 0;
            // 💡 NOTA PARA MANUTENÇÃO: Rendas superiores a R$ 4.700 (Faixas 3 e 4) não possuem subsídio federal.
            if (renda > 0 && renda <= 4700 && ePrimeiroImovel) {
                // Subsídio Federal ajustado por Dependentes
                let baseSubsidio = 0;
                if (renda <= 2850) {
                    baseSubsidio = 55000 - (renda - 1412) * 15;
                    subsidio = Math.min(55000, Math.max(20000, baseSubsidio));
                } else {
                    baseSubsidio = 33430 - (renda - 2850) * (33430 / 1850);
                    subsidio = Math.round(Math.max(0, baseSubsidio));
                }

                // Bônus Dependentes (Regra Estimada CAIXA 2025: +10% no subsídio se houver dependentes)
                if (hasDependents) {
                    subsidio = Math.min(55000, subsidio * 1.10);
                }

                // Subsídio Estadual (Casa Paulista 2025 — R$ 16.000 para capital)
                if (renda <= 4863) {
                    subsidio += 16000;
                }
            }

            // 6. PODER DE COMPRA TOTAL
            let poderEstimado = (potencial + (fgts || 0) + (entrada || 0) + subsidio);
            // ARREDONDAMENTO CONSERVADOR (Math.floor)
            const poderReal = Math.floor(poderEstimado / 1000) * 1000;

            // Poder MCMV: limitado ao teto da faixa
            const poderMCMV = Math.min(tetoImovel, poderReal);
            // Flag: recursos excedem o teto?
            const excedeTeto = poderReal > tetoImovel && !foraDoMCMV;
            // Poder exibido nos cards: usa o valor MCMV (com teto)
            const poder = poderMCMV;

            // 6.1 CENÁRIO ALTERNATIVO SBPE (Calculado quando fora do MCMV OU excede o teto)
            let sbpe = null;
            if (excedeTeto || foraDoMCMV) {
                const taxaSBPE = 0.1099; // Taxa média atualizada de mercado (10.99% a.a.)
                const nSBPE = Math.min(360, Math.max(60, prazoMaxIdade)); // 30 anos, limitado por idade
                const taxaMensalSBPE = Math.pow(1 + taxaSBPE, 1 / 12) - 1;
                const potencialSBPE = Math.floor(margem / ((1 / nSBPE) + taxaMensalSBPE));
                // SBPE: sem subsídio do governo
                const poderSBPE = Math.ceil((potencialSBPE + (fgts || 0) + (entrada || 0)) / 1000) * 1000;
                // Parcela pós-chaves no SBPE
                const saldoFinSBPE = Math.max(0, poderSBPE - (fgts || 0) - (entrada || 0));
                const amortSBPE = saldoFinSBPE / nSBPE;
                const jurosSBPE = saldoFinSBPE * taxaMensalSBPE;
                sbpe = {
                    poder: Math.round(poderSBPE),
                    potencial: Math.round(potencialSBPE),
                    parcela: Math.round(Math.max(0, amortSBPE + jurosSBPE)),
                    taxa: taxaSBPE,
                    prazo: nSBPE
                };
            }

            // 7. PLANEJAMENTO DE FLUXO DE OBRA (Padrão MT Parceiros)
            const mesesObra = 36;
            // G4: Usar valor efetivo conforme modalidade ativa
            const eModoMercado = foraDoMCMV || excedeTeto;
            const valorImovel = eModoMercado ? (sbpe ? sbpe.poder : poderReal) : poder;
            const entradaMinima = valorImovel * 0.20; // Banco exige no mínimo 20% de entrada
            const recursosProprios = (fgts || 0) + (entrada || 0);

            // Saldo que precisa ser parcelado com a construtora
            // O cliente deve cobrir no mínimo a entrada exigida pelo banco.
            // saldoEntrada: quanto o cliente ainda precisa parcelar com a construtora para cobrir a entrada mínima.
            // diferencaArredondamento NÃO entra aqui — já é absorvida no saldoFinanciado (passo 8).
            // Usar dif como piso criaria um "saldo fantasma" quando recursosProprios > entradaMinima.
            let saldoEntrada = Math.max(0, entradaMinima - recursosProprios);

            // PROJEÇÃO DE INCC (Realismo Financeiro)
            // Usamos taxa de 0.55% a.m. para calcular uma parcela MÉDIA que já prevê a correção da obra
            const taxaINCC = 0.0055;
            let saldoMensais = saldoEntrada * 0.35; // MT parcela 35% do saldo de entrada em mensais

            // Fórmula PMT p/ calcular parcela média corrigida
            let parcelaEntrada = (saldoMensais * taxaINCC) / (1 - Math.pow(1 + taxaINCC, -mesesObra));
            if (isNaN(parcelaEntrada) || saldoMensais === 0) parcelaEntrada = 0;

            let saldoAnuais = saldoEntrada * 0.35; // 35% em reforços anuais
            let chaves = saldoEntrada * 0.30; // 30% na entrega das chaves;

            // I5: Trava de Viabilidade (Trava de R$ 500 p/ mensais sem capital próprio)
            if (recursosProprios === 0 && parcelaEntrada > 0 && parcelaEntrada < 500) {
                parcelaEntrada = 500;
                saldoMensais = parcelaEntrada * mesesObra;
                // Reajusta chaves para manter o invariante saldoEntrada
                chaves = Math.max(0, saldoEntrada - saldoMensais);
                saldoAnuais = 0;
            }

            const parcelaAnuais = saldoAnuais / 3;

            // 8. CÁLCULO DA PRESTAÇÃO BANCÁRIA (Pós-Chaves)
            // G4: Usar taxa e prazo efetivos conforme modalidade
            const taxaEfetiva = eModoMercado ? 0.1099 : taxaAnual; // Corrigido para a nova taxa base de mercado (10.99%)
            const taxaMensalEfetiva = Math.pow(1 + taxaEfetiva, 1 / 12) - 1;
            const nEfetivo = eModoMercado ? 360 : n;
            const subsidioEfetivo = eModoMercado ? 0 : subsidio;

            // saldoFinanciado é o que o banco efetivamente empresta.
            // É limitado ao potencialEfetivo para garantir que parcelaPeloBanco <= margem (regra dos 30%),
            // evitando estouro por arredondamento do poderReal ou corte de teto.
            const potencialEfetivo = eModoMercado ? (sbpe ? sbpe.potencial : potencial) : potencial;
            const saldoFinanciado = Math.min(
                potencialEfetivo,
                Math.max(0, valorImovel - recursosProprios - subsidioEfetivo)
            );
            const amortizacao = saldoFinanciado > 0 ? saldoFinanciado / nEfetivo : 0;
            const jurosInicial = saldoFinanciado * taxaMensalEfetiva;
            const parcelaPeloBanco = Math.max(0, amortizacao + jurosInicial);

            // 9. IMPOSTOS MUNICIPAIS (ITBI São Paulo 2025 — ATUALIZADO)
            const isencaoItbiTeto = 235485.84; // ISENÇÃO TOTAL MCMV 2025 SP
            const tetoItbiReduzido = 120968; // LIMITE REDUÇÃO 0.5%
            let itbi = 0;

            if (valorImovel <= isencaoItbiTeto && !foraDoMCMV) {
                itbi = 0; // ISENÇÃO TOTAL
            } else if (saldoFinanciado > 0) {
                const valorFinanciadoComReducao = Math.min(saldoFinanciado, tetoItbiReduzido);
                const valorFinanciadoExcedente = Math.max(0, saldoFinanciado - tetoItbiReduzido);
                const valorNaoFinanciado = Math.max(0, valorImovel - saldoFinanciado);

                const itbiReduzido = valorFinanciadoComReducao * 0.005;
                const itbiCheio = (valorFinanciadoExcedente + valorNaoFinanciado) * 0.03;
                itbi = itbiReduzido + itbiCheio;
            } else {
                itbi = valorImovel * 0.03;
            }

            // 10. RETORNO DOS DADOS CONSOLIDADOS (ATUALIZADO 2025)
            return {
                margem: Math.round(margem),
                margemLiquida: Math.round(margemLiquida),
                potencial: Math.round(potencial),
                subsidio: Math.round(subsidio),
                poder: Math.round(poder),
                poderReal: Math.round(poderReal),
                tetoMCMV: tetoImovel,
                imovelMax: Math.round(tetoImovel), // 🎯 Fix: Alimenta exibição de teto no painel visual
                excedeTeto: excedeTeto,
                faixaMCMV: faixaMCMV,
                sbpe: sbpe,
                taxaAnualMCMV: taxaAnual,
                mesesObra,
                prazoEfetivo: n,
                valorImovel: Math.round(valorImovel),
                saldoEntrada: Math.round(saldoEntrada),
                parcelaEntrada: Math.round(parcelaEntrada),
                parcelaAnuais: Math.round(parcelaAnuais),
                chaves: Math.round(chaves),
                itbi: Math.round(itbi),
                // Evolução de Obra realista (Parcela Direta + Provisão ITBI)
                evolucaoMedia: Math.round(parcelaEntrada + (itbi / mesesObra)),
                parcelaPosChaves: Math.round(parcelaPeloBanco),
                foraDoMCMV: foraDoMCMV,
                renda: Math.round(rendaOriginal),
                idade: idade,
                vinculo: vinculo,
                rendaConsiderada: Math.round(renda),
                hasDependents: hasDependents,
                custoMIP: Math.round(custoMIP),
                custoDFI: Math.round(custoDFI)
            };
        }
    };
})();
