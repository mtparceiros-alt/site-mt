# Plano Detalhado: Dossiê de Crédito e Investimento (v12)

Este documento detalha o planejamento estratégico para a reformulação do extrato Excel gerado para o cliente. O objetivo é substituir o atual formato de "linhas e colunas bancárias" por um **Dossiê de Aprovação Narrativo**.

## 1. O Problema Atual vs. A Solução (v12)

- **Atual (v11):** 4 Quadrantes numéricos (Perfil, Caixa, Compra, Jornada). Muito técnico, parece auditoria contábil. Foca apenas na "dor" do pagamento.
- **Solução (v12):** Um "Certificado de Viabilidade" lido e interpretado cronologicamente (Presente, Esforço, Futuro). Foca no "Patrimônio" e na "Segurança" (Selo MT Parceiros).

## 2. Simplificando o Script Python (`gerar_supreme_v12.py`)

A criação do Python também será simplificada estruturalmente para ficar mais manutenível:
- **Componentização:** Em vez de linhas soltas de formatação (`ws.cell...`), criaremos uma função `draw_banner(title, value, color)` e `draw_warning()`. 
- **Separação de Cores:** Abandono do excesso de linhas (borders) douradas que poluem. Uso de blocos de cor sólida grandes (Dark Premium).
- **Sem colunas irrelevantes:** Menos grades, mais espaços em branco (respiro visual).

## 3. Mapeamento de Dados (O que vamos exibir)

De acordo com a auditoria da planilha mestre (v5_charts), cruzamos os seguintes dados essenciais:

**O Presente (A Aprovação):**
- Nome do Cliente (Planilha: `C7`)
- Renda e Limite Comprometido (Planilha: `C12`, `C22`)
- **PODER DE COMPRA MASTER** (Soma: Crédito `D27` + Subsídio `D29` + FGTS `C14` + Entrada `C13`)
- Modalidade Enquadrada: Texto explicativo baseado na Faixa (`D26`). 

**O Esforço (O Pagamento):**
- **Sua Entrada (Período de Obra):** R$ [Entrada em Dinheiro] + 36 parcelas (se necessário).
- **Abatimentos Mágicos:** Menos R$ [Subsídio] (Presente do Governo) e menos R$ [FGTS].
- **Sua Parcela do Banco:** Valor mensal após a entrega das chaves.
- **Taxa de Juros Embutida:** (Ex: 4.5% a.a. para MCMV F1).

**O Futuro (O Retorno e Segurança MT Parceiros):**
- **Valorização de Obra:** Cálculo de Projeção. (Geralmente VPL + 25%). *"Seu imóvel comprado hoje por X valerá Y em 3 anos"*.
- **Laudo de Engenharia & Contrato:** Selos de texto atestando que a MT Parceiros acompanhará a legalidade do contrato, liberação do crédito na Caixa e vistoria das Chaves.

## 4. O Layout do Relatório (Design Narrativo)

O novo Excel não terá cara de Excel. Terá cara de PDF/Apresentação:

1. **Header (Topo):** Logotipo MT Parceiros e Título: "DOSSIÊ DE VIABILIDADE E CRÉDITO IMOBILIÁRIO"
2. **Faixa 1 (Aprovação):** Bloco verde/dourado: *"Aprovado no formato Minha Casa Minha Vida."*
3. **Faixa 2 (Poder de Compra):** O número Gigante em Branco no fundo Laranja.
4. **Faixa 3 (Estratégia 36 Meses):** Texto simples da entrada até a chave. Sem termos como "Tabela SAC/Price". Apenas o fluxo de saída do bolso do cliente.
5. **Faixa 4 (Conquista e Segurança):** Gráfico/Faixa mostrando a valorização futura protegida pelos Advogados e Engenheiros MT Parceiros.
