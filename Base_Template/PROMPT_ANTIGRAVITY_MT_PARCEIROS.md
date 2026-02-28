# 🚀 PROMPT MASTER — ANTIGRAVITY | TEMPLATE EXCEL MT PARCEIROS

---

## 🎯 CONTEXTO DO PROJETO

Você é um **desenvolvedor Fullstack Sênior especializado em Excel avançado, Power BI, dashboards profissionais e automação com Python (xlsxwriter)**. Você também tem expertise em **design de interfaces, UX/UI para planilhas**, percepção visual e storytelling de dados.

Vou te apresentar o código-fonte Python do meu template Excel (`gerar_template_excel.py`), usado no site **MT Parceiros** (`mtparceiros-alt.github.io/site-mt`). Este template é baixado por clientes para simular a compra de apartamentos na planta e controlar seu planejamento financeiro.

**Seu objetivo é analisar, criticar e reescrever esse template num nível profissional absoluto**, aplicando os conhecimentos abaixo em cada decisão técnica e visual.

---

## 📚 BASE DE CONHECIMENTO OBRIGATÓRIA

Aplique **todos** os seguintes domínios ao analisar e melhorar o template:

### 1. Power Query
- Estruture a aba `System Data` como uma **tabela nomeada** (`Table_Empreendimentos`) pronta para conexão via Power Query
- Garanta que os dados sejam importáveis via `Dados > Obter Dados > De Tabela/Intervalo`
- Crie a estrutura de colunas padronizada: `ID | Nome | Preço | Área | Quartos | Bairro | Entrega | Diferenciais | Imagem_URL`
- Adicione instruções comentadas no código sobre como o usuário pode atualizar a fonte de dados

### 2. Power Pivot
- Estruture os dados para suportar **modelo de dados relacional** no Power Pivot
- Crie relação conceitual entre tabela de `Empreendimentos`, `Simulação` e `Fluxo`
- Nomeie as tabelas com padrão `tbl_[Nome]` para compatibilidade com Power Pivot
- Documente no código as chaves primárias e estrangeiras sugeridas

### 3. DAX (Fórmulas e Medidas)
- Substitua fórmulas PROCV simples por fórmulas equivalentes ao padrão DAX onde possível
- Implemente medidas calculadas comentadas no código para:
  - `[Poder de Compra] = Crédito Banco + Subsídio + FGTS`
  - `[Comprometimento de Renda %] = Parcela Mensal / Renda`
  - `[Meses para Meta] = Meta Entrada / Capacidade Poupança`
- Adicione validações condicionais com formatação semafórica (verde/amarelo/vermelho)

### 4. Dashboard de Análise de Vendas
- A aba `Laudo de Crédito` deve funcionar como um **dashboard executivo de análise de capacidade de compra**
- Inclua KPI cards com: Poder de Compra, Renda Comprometida (%), Parcela Estimada, Benefício Gov.
- Adicione mini gráfico de barras comparando: Crédito Banco × Subsídio × FGTS × Total
- Use formatação condicional para destacar aprovação (verde) ou alerta (laranja)

### 5. Relatórios de Análise de Vendas
- A aba `Fluxo Mensal` deve gerar um **relatório de projeção financeira completo** com:
  - Tabela de evolução mês a mês (24 meses)
  - Acumulado de pagamento vs. saldo devedor
  - Linha do tempo até a entrega do imóvel
  - Coluna de status dinâmico (PAGO / PLANEJADO / ATRASADO) via fórmula

### 6. Importação Power BI
- Estruture todas as abas de dados com **cabeçalhos limpos, sem mesclagens**, prontos para importação no Power BI
- Separe claramente dados de INPUT (editável pelo usuário), CÁLCULO (fórmulas) e OUTPUT (resultados)
- Crie aba oculta `_BI_Export` com dados normalizados prontos para consumo no Power BI

### 7. Introdução aos Dashboards — Princípios Aplicados
- Aplique a regra dos 5 segundos: o cliente deve entender o resultado em 5 segundos
- Hierarquia clara: Título → KPIs → Gráfico → Tabela de detalhes
- Limite de 3 cores por dashboard (laranja `#f35525`, escuro `#1e1e1e`, cinza claro `#fafafa`)
- Evite poluição visual: remova bordas desnecessárias, use espaçamento generoso

### 8. Percepção Visual
- Aplique os princípios de Gestalt: proximidade, similaridade e figura-fundo
- Use tamanho de fonte proporcional à hierarquia: 24pt título → 16pt valor → 10pt label
- Alinhe todos os elementos numa grade invisível de 15px
- Números grandes à esquerda, labels pequenos acima (padrão de cartão KPI)

### 9. Métodos de Apresentação de Informações
- Use **Cartões (Cards)** para valores únicos de destaque (Poder de Compra, Parcela)
- Use **Tabelas** para dados tabulares comparativos (Fluxo Mensal)
- Use **Gráficos de barras** para composição (como o financiamento é composto)
- Use **Indicadores semafóricos** para status (aprovado/alerta/reprovado)
- Evite gráficos de pizza; prefira barras horizontais

### 10. Design para Criação de Dashboards
- Paleta fiel ao site: `#f35525` (laranja CTA), `#1e1e1e` (dark), `#FFFFFF` (fundo), `#fafafa` (bg cards)
- Fonte: `Poppins` (títulos e valores), `Calibri` como fallback
- Header fixo com navegação entre abas (já implementado, manter e melhorar)
- Rodapé com branding MT Parceiros + link WhatsApp + data de geração automática (`=HOJE()`)
- Sombra simulada em cards usando bordas coloridas laterais (esquerda laranja, 3px)

### 11. Etapas para Criação de Dashboards
Refatore o código Python seguindo estas etapas na ordem:
1. `setup_workbook()` — Configurações globais, paleta, fontes, proteção
2. `build_system_data()` — Motor de dados (já existe, melhorar)
3. `build_navigation()` — Menu de navegação (já existe, manter)
4. `build_laudo_credito()` — Dashboard KPI + aprovação
5. `build_educacao_financeira()` — Simulador interativo
6. `build_fluxo_mensal()` — Relatório de projeção
7. `build_bi_export()` — Aba oculta para Power BI
8. `apply_protection()` — Proteger fórmulas, liberar inputs

### 12. Dashboard de Fluxo de Caixa
- Implemente na aba `Fluxo Mensal` um **dashboard de fluxo de caixa visual**:
  - Gráfico de linha: evolução do saldo acumulado ao longo dos meses
  - Gráfico de barras empilhadas: entrada × parcelas × FGTS por mês
  - Indicador de mês de atingimento da meta de entrada
  - Projeção de 24 meses com linha de tendência

### 13. Cartões no Excel (KPI Cards)
- Implemente os cards com:
  - Fundo branco com borda esquerda laranja (3px simulada via `left_border_color`)
  - Label em cinza 9pt acima
  - Valor em 16-18pt bold na cor dark ou laranja
  - Ícone emoji relevante à esquerda do label
  - Formatação monetária `R$ #.##0,00`
- Cards obrigatórios: Renda Declarada | Crédito Aprovado | Subsídio | FGTS | **Poder de Compra Total**

### 14. Gráficos Avançados no Excel
- Adicione via `xlsxwriter` os seguintes gráficos na aba `Laudo de Crédito`:
  - **Gráfico de barras empilhadas** mostrando composição do financiamento
  - **Gráfico de rosca (donut)** mostrando % da renda comprometida
- Na aba `Fluxo Mensal`:
  - **Gráfico de linha com área preenchida** mostrando evolução do saldo poupado
- Configure: sem bordas, sem título de eixo X, legenda embaixo, cores da paleta MT

### 15. Dashboard de Controle Financeiro Dinâmico
- A aba `Educação Financeira` deve ser um **simulador interativo de controle financeiro**:
  - Input de renda familiar (célula editável com borda laranja)
  - Input de % disponível para poupança (slider via data_bar)
  - Input de meta de entrada (editável)
  - Outputs calculados automaticamente: prazo em meses, data estimada da conquista
  - Semáforo: Verde (dentro da capacidade) / Amarelo (limite) / Vermelho (excede)

### 16. Planilha Kanban para Controle de Tarefas
- Adicione aba oculta `Kanban` com status de documentação do cliente:
  - Colunas: `A FAZER | EM ANDAMENTO | CONCLUÍDO`
  - Documentos típicos: RG, CPF, Holerite, FGTS, Certidão, Comprovante
  - Formatação condicional por coluna (cinza / amarelo / verde)
  - Esta aba pode ser revelada pelo corretor para acompanhar o cliente

---

## 🔍 ANÁLISE CRÍTICA DO CÓDIGO ATUAL

Ao analisar o arquivo `gerar_template_excel.py`, identifique e corrija:

**Problemas Visuais:**
**Problemas Funcionais:**

**Problemas de Arquitetura:**


## 📋 ENTREGÁVEL ESPERADO

Reescreva o arquivo `gerar_template_excel.py` completo com:

1. **Código Python limpo e documentado** com docstrings em português
2. **Todas as 16 áreas de conhecimento** aplicadas explicitamente
3. **Comentários no código** indicando onde cada técnica foi aplicada (ex: `# [Power Query] Tabela nomeada para conexão`)
4. **Função `main()` orquestrada** chamando todas as subfunções na ordem correta
5. **Configuração centralizada** em dicionário `CONFIG = {}` no topo do arquivo
6. **Fallback para imagens** ausentes (placeholder colorido em vez de erro silencioso)
7. **Aba `_BI_Export`** oculta com dados normalizados
8. **Aba `Kanban`** oculta para controle de documentação
9. **Proteção de células** aplicada nas abas de output
10. **Rodapé profissional** em todas as abas com branding MT Parceiros

## ⚙️ CONTEXTO TÉCNICO

- **Biblioteca:** `xlsxwriter` (Python)
- **JSON de entrada:** `empreendimentos.json` com lista de empreendimentos
- **Saída:** `template_mt_parceiros.xlsx`
- **Público-alvo:** Clientes compradores de imóveis na planta (perfil popular/médio)
- **Uso:** Download direto pelo site, preenchimento guiado pelo corretor
- **Compatibilidade:** Excel 2016+, Excel Online, LibreOffice Calc

---

## 🚦 RESTRIÇÕES

- NÃO usar macros VBA (arquivo deve ser `.xlsx`, não `.xlsm`)
- NÃO usar caminhos absolutos de imagem — implementar fallback sem imagem
- NÃO usar mesclagem de células nas abas de dados (incompatível com Power Query)
- NÃO usar mais de 3 cores principais por aba
- SEMPRE gerar o arquivo mesmo se o JSON de empreendimentos estiver ausente (usar dados demo)


