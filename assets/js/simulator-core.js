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
    var isValid = allowed.some(function (domain) {
        return current.indexOf(domain) !== -1;
    });

    if (!isValid) {
        console.warn("MT Parceiros: Domínio não autorizado para este simulador.");
        return;
    }

    window.MT_Core = {
        /**
         * FUNÇÃO CENTRAL DE CÁLCULO - MT PARCEIROS v1.2 (Auditoria 2025)
         * Esta função processa as regras de banco (CAIXA) e de mercado (MT) simultaneamente.
         */
        calculateMCMV: function (renda, dividas, fgts, entrada, temDependentes, clt3anos, ePrimeiroImovel, idade, vinculo) {

            // 0. PARÂMETROS OPCIONAIS (Retrocompatibilidade)
            idade = (typeof idade === 'number' && idade >= 18 && idade <= 80) ? idade : 30;
            vinculo = (['clt', 'autonomo', 'mei', 'aposentado'].indexOf(vinculo) !== -1) ? vinculo : 'clt';

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
            // O banco limita a parcela em 30% da renda bruta, subtraindo dívidas existentes (empréstimos, etc).
            const margem = Math.max(0, (renda * 0.30) - dividas);

            // 2. DEFINIÇÃO DE TAXAS E TETOS (Tabela Oficial MCMV 2025 - São Paulo/Sudeste)
            let taxaAnual = 0.0816; // Taxa padrão (Faixa 3)
            let tetoImovel = 500000; // Teto para rendas mais altas
            let faixaMCMV = "Fora do MCMV";
            let foraDoMCMV = false;
            let n = 420; // Prazo de 35 anos (MCMV)

            // PRAZO MÁXIMO POR IDADE (Regra Caixa: Idade + Prazo ≤ 80 anos e 6 meses)
            const prazoMaxIdade = Math.floor((80.5 * 12) - (idade * 12));
            n = Math.min(n, Math.max(60, prazoMaxIdade)); // Mínimo 5 anos

            // Lógica por Faixas de Renda (Diferenciando Cotista CLT e Não-Cotista)
            if (renda <= 2850) {
                // Faixa 1: Benefício máximo de juros reduzidos
                taxaAnual = clt3anos ? 0.0425 : 0.0475;
                tetoImovel = 275000;
                faixaMCMV = "Faixa 1";
            }
            else if (renda <= 4700) {
                // Faixa 2: Escalonamento moderado
                taxaAnual = clt3anos ? 0.0650 : 0.0700;
                tetoImovel = 275000;
                faixaMCMV = "Faixa 2";
            }
            else if (renda <= 8600) {
                // Faixa 3: Teto padrão MCMV SP
                taxaAnual = clt3anos ? 0.0766 : 0.0816;
                tetoImovel = 350000;
                faixaMCMV = "Faixa 3";
            }
            else if (renda <= 12000) {
                // Faixa 4: Nova faixa MCMV (Portaria MCid 399/2025)
                taxaAnual = clt3anos ? 0.1000 : 0.1050; // Taxa de 10% a 10.5% a.a.
                tetoImovel = 500000;
                faixaMCMV = "Faixa 4";
                // n = 420 já é o padrão
            }
            else {
                // SBPE/SFH: Imóveis acima de 500k ou rendas acima de 12k
                taxaAnual = 0.1099; // Taxa conservadora recomendada (10.99% a.a.)
                tetoImovel = 1500000;
                n = Math.min(360, Math.max(60, prazoMaxIdade)); // 30 anos (Padrão de mercado), limitado por idade
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

            // 5. SUBSÍDIOS (Benefícios do Governo e Estado - SP)
            let subsidio = 0;
            // Só existe subsídio no 1º imóvel e rendas até R$ 4.700
            if (renda > 0 && renda <= 4700 && ePrimeiroImovel) {
                // Subsídio Federal (Minha Casa Minha Vida)
                if (renda <= 2850) {
                    subsidio = Math.max(20000, 55000 - (renda - 1412) * 15);
                } else {
                    // Subsídio Faixa 2 decai a partir de 33.430 até zerar em 4.700
                    subsidio = Math.max(0, 33430 - (renda - 2850) * (33430 / 1850));
                }

                // Subsídio Estadual (Bônus Casa Paulista — São Paulo Capital)
                // Valor atualizado: R$ 16.000 (regulamento CCI vigente, renda até R$ 4.863)
                if (renda <= 4863) {
                    subsidio += 16000;
                }
            }

            // 6. PODER DE COMPRA TOTAL
            // Soma bruta de todos os recursos do cliente
            let poderEstimado = (potencial + (fgts || 0) + (entrada || 0) + subsidio);
            const poderReal = Math.ceil(poderEstimado / 1000) * 1000;
            const diferencaArredondamento = poderReal - poderEstimado; // O excedente do teto que o banco não paga, o cliente assume na entrada.

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
            const chaves = saldoEntrada * 0.30; // 30% na entrega das chaves;

            // Trava de Viabilidade (MT não aprova parcela menor que R$ 500 se o cliente não tem nada de capital)
            if (recursosProprios === 0 && parcelaEntrada > 0 && parcelaEntrada < 500) {
                parcelaEntrada = 500;
                saldoMensais = parcelaEntrada * mesesObra;
                saldoAnuais = saldoEntrada - saldoMensais - chaves;
                if (saldoAnuais < 0) saldoAnuais = 0;
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

            // 9. IMPOSTOS MUNICIPAIS (ITBI São Paulo 2025)
            // Regra: 0.5% sobre o financiado (até R$ 120.968) e 3% sobre o restante.
            const tetoItbiReduzido = 120968;
            let itbi = 0;
            if (saldoFinanciado > 0) {
                // Parcela do financiamento contemplada pela redução (0,5%)
                const valorFinanciadoComReducao = Math.min(saldoFinanciado, tetoItbiReduzido);

                // Parcela do financiamento que excede o teto de redução (3%)
                const valorFinanciadoExcedente = Math.max(0, saldoFinanciado - tetoItbiReduzido);

                // Parte do imóvel paga com recursos do comprador (Entrada, FGTS, Parcelamento direto da entrada) (3%)
                const valorNaoFinanciado = Math.max(0, valorImovel - saldoFinanciado);

                const itbiReduzido = valorFinanciadoComReducao * 0.005;
                const itbiCheio = (valorFinanciadoExcedente + valorNaoFinanciado) * 0.03;

                itbi = itbiReduzido + itbiCheio;
            } else {
                itbi = valorImovel * 0.03;
            }

            // RETORNO DE DADOS FORMATADOS
            return {
                margem: Math.round(margem),
                margemLiquida: Math.round(margemLiquida),
                potencial: Math.round(potencial),
                subsidio: Math.round(subsidio),
                poder: Math.round(poder),
                poderReal: Math.round(poderReal),
                tetoFaixa: tetoImovel,
                excedeTeto: excedeTeto,
                faixaMCMV: faixaMCMV,
                sbpe: sbpe,
                taxaAnualMCMV: taxaAnual,
                mesesObra,
                prazoFinanciamento: n,
                valorImovel: Math.round(valorImovel),
                saldoEntrada: Math.round(saldoEntrada),
                parcelaEntrada: Math.round(parcelaEntrada),
                parcelaAnuais: Math.round(parcelaAnuais),
                chaves: Math.round(chaves),
                itbi: Math.round(itbi),
                evolucaoMedia: Math.round(parcelaPeloBanco * 0.5),
                parcelaPosChaves: Math.round(parcelaPeloBanco),
                foraDoMCMV: foraDoMCMV,
                renda: renda,
                // Novos campos v2.0
                idade: idade,
                vinculo: vinculo,
                rendaOriginal: rendaOriginal,
                rendaConsiderada: Math.round(renda),
                prazoEfetivo: n,
                custoMIP: Math.round(custoMIP),
                custoDFI: Math.round(custoDFI),
                taxaMIP: taxaMIP
            };
        }
    };
})();
