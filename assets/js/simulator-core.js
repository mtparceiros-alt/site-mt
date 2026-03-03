/**
 * MT Parceiros - Core de Cálculos MCMV (PROPRIETÁRIO)
 * Este arquivo contém a lógica matemática do simulador.
 * @version 1.1
 */

(function () {
    // --- TRAVA DE DOMÍNIO ---
    // Impede que o simulador seja clonado e usado em outros sites.
    var allowed = ['mtparceiros.com.br', 'localhost', '127.0.0.1', 'marcos-m1.github.io'];
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
        calculateMCMV: function (renda, dividas, fgts, entrada, temDependentes, clt3anos, ePrimeiroImovel) {

            // 1. MARGEM DE SEGURANÇA BANCÁRIA
            // O banco limita a parcela em 30% da renda bruta, subtraindo dívidas existentes (empréstimos, etc).
            const margem = Math.max(0, (renda * 0.30) - dividas);

            // 2. DEFINIÇÃO DE TAXAS E TETOS (Tabela Oficial MCMV 2025 - São Paulo/Sudeste)
            let taxaAnual = 0.0816; // Taxa padrão (Faixa 3)
            let tetoImovel = 500000; // Teto para rendas mais altas

            // Lógica por Faixas de Renda (Diferenciando Cotista CLT e Não-Cotista)
            if (renda <= 2850) {
                // Faixa 1: Benefício máximo de juros reduzidos
                taxaAnual = clt3anos ? 0.0425 : 0.0475;
                tetoImovel = 190000;
            }
            else if (renda <= 4700) {
                // Faixa 2: Escalonamento moderado
                taxaAnual = clt3anos ? 0.0650 : 0.0700;
                tetoImovel = 264000;
            }
            else if (renda <= 8600) {
                // Faixa 3: Teto padrão MCMV SP
                taxaAnual = clt3anos ? 0.0766 : 0.0816;
                tetoImovel = 350000;
            }
            else if (renda <= 12000) {
                // Faixa 4 (NOVA): Classe Média com recursos FGTS
                taxaAnual = 0.1050;
                tetoImovel = 500000;
            }
            else {
                // SBPE/SFH: Imóveis acima de 500k ou rendas acima de 12k
                taxaAnual = 0.1150;
                tetoImovel = 1500000;
            }

            // 3. REGRA DE RESTRIÇÃO DE PERFIL (SBPE/SFH)
            // Se o usuário já possui um imóvel, ele perde os benefícios do MCMV
            let foraDoMCMV = false;
            let n = 420; // Prazo de 35 anos (MCMV)

            if (ePrimeiroImovel === false) {
                taxaAnual = Math.max(taxaAnual, 0.0950); // Taxa mínima de mercado
                tetoImovel = 1500000;
                n = 360; // Redução de prazo p/ 30 anos (Padrão de mercado)
                foraDoMCMV = true;
            }

            // Conversão da taxa anual para mensal (Juros Compostos)
            const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;

            // 4. POTENCIAL DE FINANCIAMENTO (Algoritmo SAC)
            // No Sistema SAC, a primeira parcela (Amortização + Juros) é a maior.
            // P = Margem / (1/n + i) -> Calcula quanto o banco empresta baseado na parcela que cabe no bolso.
            const potencial = Math.floor(margem / ((1 / n) + taxaMensal));

            // 5. SUBSÍDIOS (Benefícios do Governo e Estado - SP)
            let subsidio = 0;
            // Só existe subsídio no 1º imóvel e rendas até R$ 4.700
            if (renda > 0 && renda <= 4700 && ePrimeiroImovel) {
                // Subsídio Federal (Minha Casa Minha Vida)
                if (renda <= 2850) {
                    subsidio = Math.max(20000, 55000 - (renda - 1412) * 15);
                } else {
                    subsidio = Math.max(0, 55000 - (renda - 2851) * 25);
                }

                // Subsídio Estadual (Bônus Casa Paulista)
                // Cheque adicional de R$ 13.000 do Governo de SP para Capital/RMSA
                subsidio += 13000;
            }

            // 6. PODER DE COMPRA TOTAL
            // Soma de tudo o que o cliente tem p/ pagar o imóvel (incluindo o benefício do governo/estado)
            let poderEstimado = (potencial + (fgts || 0) + (entrada || 0) + subsidio);
            // Limitamos ao teto da faixa para não gerar falsa expectativa
            const poder = Math.min(tetoImovel, Math.ceil(poderEstimado / 1000) * 1000);

            // 7. PLANEJAMENTO DE FLUXO DE OBRA (Padrão MT Parceiros)
            const mesesObra = 36;
            const valorImovel = poder;
            const entradaMinima = valorImovel * 0.20; // Banco exige no mínimo 20% de entrada
            const recursosProprios = (fgts || 0) + (entrada || 0);

            // Saldo que precisa ser parcelado com a construtora
            let saldoEntrada = entradaMinima - recursosProprios;
            if (saldoEntrada < 0) saldoEntrada = 0;

            // PROJEÇÃO DE INCC (Realismo Financeiro)
            // Usamos taxa de 0.55% a.m. para calcular uma parcela MÉDIA que já prevê a correção da obra
            const taxaINCC = 0.0055;
            let saldoMensais = saldoEntrada * 0.35; // MT parcela 35% do saldo de entrada em mensais

            // Fórmula PMT p/ calcular parcela média corrigida
            let parcelaEntrada = (saldoMensais * taxaINCC) / (1 - Math.pow(1 + taxaINCC, -mesesObra));

            let saldoAnuais = saldoEntrada * 0.35; // 35% em reforços anuais
            const chaves = saldoEntrada * 0.30; // 30% na entrega das chaves

            // Trava de Viabilidade (MT não aprova parcela menor que R$ 500 se o cliente não tem nada de capital)
            if (recursosProprios === 0 && parcelaEntrada > 0 && parcelaEntrada < 500) {
                parcelaEntrada = 500;
                saldoMensais = parcelaEntrada * mesesObra;
                saldoAnuais = saldoEntrada - saldoMensais - chaves;
                if (saldoAnuais < 0) saldoAnuais = 0;
            }

            const parcelaAnuais = saldoAnuais / 3;

            // 8. CÁLCULO DA PRESTAÇÃO BANCÁRIA (Pós-Chaves)
            const saldoFinanciado = valorImovel - recursosProprios - subsidio;
            const amortizacao = saldoFinanciado / n;
            const jurosInicial = saldoFinanciado * taxaMensal;
            const parcelaPeloBanco = Math.max(0, amortizacao + jurosInicial);

            // 9. IMPOSTOS MUNICIPAIS (ITBI São Paulo 2025)
            // Regra: 0.5% sobre o financiado (até R$ 120.968) e 3% sobre o restante.
            const tetoItbiReduzido = 120968;
            let itbi = 0;
            if (saldoFinanciado > 0) {
                const valorFinanciadoParaItbi = Math.min(saldoFinanciado, tetoItbiReduzido);
                const valorNaoFinanciadoOuAcimaDoTeto = valorImovel - valorFinanciadoParaItbi;
                itbi = (valorFinanciadoParaItbi * 0.005) + (valorNaoFinanciadoOuAcimaDoTeto * 0.03);
            } else {
                itbi = valorImovel * 0.03;
            }

            // RETORNO DE DADOS FORMATADOS
            return {
                margem: Math.round(margem),
                potencial: Math.round(potencial),
                subsidio: Math.round(subsidio),
                poder: Math.round(poder),
                mesesObra,
                prazoFinanciamento: n,
                valorImovel: Math.round(valorImovel),
                saldoEntrada: Math.round(saldoEntrada),
                parcelaEntrada: Math.round(parcelaEntrada),
                parcelaAnuais: Math.round(parcelaAnuais),
                chaves: Math.round(chaves),
                itbi: Math.round(itbi),
                evolucaoMedia: Math.round(parcelaPeloBanco * 0.5), // Estimativa de taxa de obra média
                parcelaPosChaves: Math.round(parcelaPeloBanco),
                foraDoMCMV: foraDoMCMV,
                renda: renda
            };
        }
    };
})();
