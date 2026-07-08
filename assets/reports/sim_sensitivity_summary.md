# Resumo: Sensibilidade do Simulador — São Paulo (Capital)

## Sumário executivo
- Cenário base (renda R$5000): poder = R$175.000; parcela mensal pós-chaves ≈ R$1.055.
- Resultado principal: a variável com maior impacto no `poder` é a `taxaAnual` (juros praticado pelo financiamento). Alterações plausíveis de ±0.01 na `taxaAnual` geraram variações de +8.57% a -7.43% no `poder`.
- `INCC` e `mesesObra` (no modelo atual) tiveram efeito negligenciável sobre `poder` e `parcela` nas faixas testadas.

## Dados principais
- Arquivo de saída completo: [assets/reports/sim_sensitivity_report.json](assets/reports/sim_sensitivity_report.json)
- Baseline: `poder`=R$175.000, `parcelaPosChaves`≈R$1.055
- Sensibilidades observadas:
  - `taxaAnual` = 0.055 → `poder` +8.57% (R$190k)
  - `taxaAnual` = 0.075 → `poder` -7.43% (R$162k)
  - `INCC` variações testadas (0.004–0.008): sem alteração material
  - `mesesObra` (24/36/48): sem alteração material

## Margem de erro estimada (modelo atual)
- `Poder` (capacidade de compra estimada): aproximadamente ±8.6% devido à incerteza em `taxaAnual` (maior fator de sensibilidade).
- `Parcela` (pós-chaves): variações menores que 1% nos cenários testados.
- Observação: essa "margem" é empírica e limitada ao conjunto de cenários testados; uma análise Monte Carlo com distribuições realistas ampliaria e refinaria essa estimativa.

## Recomendações rápidas (prioridade alta → baixa)
- **Parametrizar `taxaAnual`**: não usar valores rígidos — derive a partir do perfil de crédito do usuário (CLT3, score) e opções de mercado; permitir seleção/override em UI.
- **Expor `taxaINCC` e `mesesObra`**: transforme em parâmetros configuráveis para simular projetos "na planta" com diferentes cronogramas e indexadores.
- **Modelar risco incorporadora/prêmio de mercado**: incluir margem do incorporador, janelas de atraso de obra e impacto sobre entrada/parcelamento.
- **Implementar Monte Carlo**: rodar 1–10k iterações variando juros, INCC, atraso e entrada para estimar distribuições e intervalos de confiança (gera margem de erro robusta).
- **Adicionar testes automatizados**: criar testes unitários (Python/JS) que reproduzam fórmulas-chave e evitam regressões em regras de subsídio e teto.
- **UI/UX**: adicionar modo avançado com sliders para `taxaAnual`, `INCC`, `mesesObra`, `probabilidade de atraso` e `margem incorporadora`.

## Próximos passos sugeridos (curto prazo)
1. Implemento as mudanças em `assets/js/simulator-core.js` para parametrizar `taxaAnual`, `taxaINCC` e `mesesObra`, e adiciono inputs no `simulador.html` — quer que eu faça isso agora?
2. Rodar uma análise Monte Carlo (script Python) com distribuições realistas (posso propor as distribuições se concordar).

---
Relatório gerado automaticamente por análise local. Para ver dados brutos, abra: [assets/reports/sim_sensitivity_report.json](assets/reports/sim_sensitivity_report.json)
