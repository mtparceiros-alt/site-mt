# Relatório de Análise Técnica e Financeira: Simulador MT Parceiros

**Data:** Março de 2026
**Objetivo:** Avaliação da lógica de cálculo de financiamento imobiliário e dos mecanismos de segurança do código-fonte ("criptografia").

---

## 1. Resumo Executivo

O simulador do portal **MT Parceiros** foi analisado em sua versão JavaScript (`simulator-core.js`). O sistema demonstra alto nível de aderência às regras vigentes do **Minha Casa Minha Vida (MCMV) 2025** para a região de São Paulo/Sudeste, além de contemplar cenários de mercado (SBPE) para clientes fora do enquadramento social.

O código implementa o **Sistema de Amortização Constante (SAC)** padrão bancário (CAIXA) e cruza estes dados com um plano de fluxo de obra próprio da construtora/parceiro (mensais, anuais e chaves), considerando correções projetadas pelo INCC.

---

## 2. Lógica de Cálculo Financeiro (MCMV e SBPE)

O núcleo do simulador (`calculateMCMV`) recebe 7 parâmetros primários: Renda Bruta, Dívidas Ativas, Saldo FGTS, Valor de Entrada, Dependentes, Condição CLT > 3 anos, e Status de 1º Imóvel. A partir destes dados, a lógica se divide nas seguintes etapas:

### 2.1. Capacidade de Pagamento e Margem Consignável
O banco limita o comprometimento de renda em **30% da Renda Bruta Mensal**. 
O simulador calcula a margem efetiva subtraindo eventuais dívidas ou financiamentos já existentes:
```javascript
const margem = Math.max(0, (renda * 0.30) - dividas);
```
*Observação para o Analista:* Esta abordagem é estrita e segura, prevenindo o sobre-endividamento do cliente logo na triagem.

### 2.2. Enquadramento e Taxas de Juros (Tabela SP 2025)
O algoritmo mapeia a renda do cliente em faixas operacionais. As taxas são reduzidas se o cliente possuir 3 anos ou mais de carteira assinada (regime CLT/Cotista FGTS).

| Faixa MCMV | Renda Limite Bruta | Taxa Anual (Cotista / Não) | Teto Máx. Imóvel |
| :--- | :--- | :--- | :--- |
| **Faixa 1** | Até R$ 2.850,00 | 4,25% a 4,75% a.a. | R$ 190.000,00 |
| **Faixa 2** | Até R$ 4.700,00 | 6,50% a 7,00% a.a. | R$ 264.000,00 |
| **Faixa 3** | Até R$ 8.000,00 | 7,66% a 8,16% a.a. | R$ 350.000,00 |
| **SBPE (Mercado)* | Rendas > 8k ou Teto > 350k | Conservadora 10,99% a.a. | R$ 1.500.000,00 |

*\*Nota: Clientes informando que **não** é o primeiro imóvel perdem o direito ao MCMV, sendo automaticamente enquadrados na taxa mínima de mercado e prazo reduzido de 360 meses (30 anos), versus 420 meses (35 anos) do MCMV.*

### 2.3. Potencial de Financiamento (Algoritmo SAC)
O cálculo determina quanto o banco está disposto a emprestar com base na `margem` calculada. No sistema SAC, a primeira prestação é a mais alta. A fórmula aplicada encontra o valor de empréstimo ("Capital") isolando a variável `P` na fórmula de Parcela Inicial SAC:
```javascript
// Parcela Inicial (Amortização + Juros 1º Mês) = Margem Disponível
const taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1; // Conversão a.a. para a.m.
const potencial = Math.floor(margem / ((1 / prazoMeses) + taxaMensal));
```

### 2.4. Subsídios e Benefícios
O subsídio é calculado combinando as esferas Federal e Estadual (específico para São Paulo):
1. **Subsídio Federal:** Aplicável até a renda de R$ 4.700,00. Utiliza uma fórmula decrescente linear.
2. **Subsídio Estadual (Casa Paulista):** Adição de um bônus fixo de **R$ 13.000,00** para CP/RMSA (dentro dos limites de renda aplicáveis ao MCMV).

### 2.5. Fluxo de Pagamento da Construtora (Período de Obra)
A lógica assume um prazo de obra de **36 meses**. 
O cliente precisa compor no mínimo **20% do valor do imóvel** (exigência bancária). Se a soma de (FGTS + Entrada à vista) não cobrir esses 20%, o "Saldo de Entrada" é parcelado diretamente com a construtora:
- **35% em mensais** durante a obra.
- **35% em reforços anuais** (3 parcelas).
- **30% na entrega das chaves**.

**Projeção de INCC:** O simulador tenta ser realista projetando uma taxa média de INCC de **0,55% a.m.** nas parcelas mensais, gerando um cálculo de prestação média (`PMT`), evitando que o cliente seja surpreendido pelo aumento escalonado da dívida na fase de obra.

### 2.6. Impostos (ITBI)
O cálculo do Imposto de Transmissão reflete a regra paulistana que confere alíquota reduzida para o primeiro imóvel financiado:
- **0,5%** sobre o valor financiado (limitado ao teto de R$ 120.968,00).
- **3,0%** sobre o que exceder esse teto de financiamento, ou sobre o valor pago via recursos próprios.
- Nos casos de compra à vista ou acima das regras de redução, aplica-se a alíquota cheia de **3,0%** sobre a avaliação total.

---

## 3. Análise do Mecanismo de Segurança ("Criptografia")

Para proteger esta propriedade intelectual matemática e evitar a cópia ("clonagem") do simulador do site concorrentes, a arquitetura utiliza duas defesas descritas a seguir.

### 3.1. Trava de Domínio (Domain Lock)
O código inclui uma validação `window.location.hostname`. O simulador só será injetado na página e funcionará se for carregado a partir de domínios específicos previamente autorizados:
`['mtparceiros.com.br', 'localhost', '127.0.0.1', 'marcos-m1.github.io', 'mtparceiros-alt.github.io']`
Se um concorrente copiar o código para `outro-site.com.br`, o script aborta silenciosamente.

### 3.2. Ofuscação de Código Fonte ("Minificação Avançada")
O arquivo em produção, `simulator-core.min.js`, não usa uma "criptografia restritiva padrão" (como AES ou RSA, que exigiria senhas de acesso pelo usuário final), mas sim uma técnica agressiva de **Ofuscação e Empacotamento de JavaScript**.

A análise de engenharia reversa do arquivo `simulator-core.min.js` revela:
1. **Dicionário de Strings Ocultas:** Todo o texto legível (ex: `"Faixa 1"`, `"MT_Core"`, `"calculateMCMV"`) é retirado do código e jogado num array embaralhado (Array Shifting).
2. **Substituição de Nomes de Variáveis:** Variáveis com nomes significativos matemáticos (como `margem`, `taxaMensalEfetiva`, `amortizacao`) foram substituídas por nomes hexadecimais sem sentido, como `_0x1b6321`, `_0x2abf1a`.
3. **Fluxo de Controle Complexo:** Expressões matemáticas diretas foram compiladas para declarações baseadas em chamadas de função dinâmicas, o que torna a leitura humana e o entendimento da fórmula por um leigo praticamente inviáveis.

**Veredito de Segurança:** 
É um método **extremamente eficaz** contra cópias casuais ou desenvolvedores iniciantes-médios. É praticamente impossível extrair as lógicas de subsídio e faixas de renda do arquivo minificado. O código-fonte original (`simulator-core.js`) deve ser mantido restrito aos administradores e repositórios seguros privados, fazendo o deploy (envio do site pro servidor) unicamente da versão minificada (`.min.js`).

---
**Fim da Análise**
O algoritmo demonstra coerência absoluta com práticas reais de mercado bancário, antecipando fluxos de despesa, subsídios reais e restrições de crédito.
