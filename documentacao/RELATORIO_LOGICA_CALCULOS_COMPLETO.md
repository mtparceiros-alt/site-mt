# RELATÓRIO TÉCNICO: LÓGICA DOS CÁLCULOS SIMULADOR.HTML v3 2026

**Data:** 12 de junho de 2026  
**Versão:** 3.2 (Produção)  
**Foco:** Arquivos Componentes + Variáveis + Fluxo de Cálculo  

---

## 📦 ARQUIVOS QUE COMPÕEM A LÓGICA

### 1. **simulador.html** (Orquestrador Principal)
| Responsabilidade | Detalhes |
| :--- | :--- |
| **Estrutura DOM** | Define 80+ elementos HTML com IDs para entrada/saída |
| **Importação de Scripts** | Carrega `simulator-core.js` e `simulator-v3-logic.js` |
| **Componentes Interativos** | Sliders, checkboxes, campo de texto, botões |
| **Renderização** | Tailwind CSS (grid 2 colunas: entrada esq / resultados dir) |
| **Injeção Dinâmica** | Valores de moeda, barras visuais, gauges SVG |

**Localização dos Scripts:**
```html
<script src="assets/js/simulator-core.js"></script>
<script src="assets/js/simulator-v3-logic.js"></script>
```

---

### 2. **assets/js/simulator-core.js** (Motor MCMV)
| Responsabilidade | Detalhes |
| :--- | :--- |
| **Cálculo de Crédito** | `MT_Core.calculateMCMV()` — função principal |
| **Domínio Lock** | Valida domínios autorizados antes de executar |
| **Lógica Bancária** | 11 etapas de processamento (ajuste renda → ITBI) |
| **Retorno Estruturado** | Objeto com 40+ propriedades financeiras |
| **Ofuscação** | Versão `.min.js` usada em produção |

**Escopo:** IIFE — `window.MT_Core` (global)

---

### 3. **assets/js/simulator-v3-logic.js** (Sincronização & Lógica UI)
| Responsabilidade | Detalhes |
| :--- | :--- |
| **Sincronização** | Conecta inputs HTML → motor de cálculo |
| **Event Listeners** | Captura mudanças em sliders, checkboxes, etc |
| **Atualização Visual** | Renderiza labels, barras, valores em tempo real |
| **Cache Local** | Armazena resultados em `localStorage['mt_sim_data']` |
| **CRM Sync** | Envia dados para Google Sheets (assíncrono) |
| **Lead Capture** | Validação de Nome + Telefone antes de conversão |
| **Redirecionamento** | Transição do Simulador → Dossiê |

**Execução:** Ao carregar `DOMContentLoaded`

---

### 4. **assets/js/score-module.js** (Inteligência IA)
| Responsabilidade | Detalhes |
| :--- | :--- |
| **Score Calculation** | `MT_Score.calcular()` — 6 critérios bancários |
| **Conceito** | A+, A, B, C, D baseado em pontos (0-100) |
| **Dicas Inteligentes** | `generateMelhoriasInteligentes()` personalizadas |
| **Coach IA** | Cards expansíveis com plano de ação |
| **Renderização** | Gauge SVG animado, barras de critério |

**Escopo:** Modular — `window.MT_Score`

---

### 5. Arquivos de Suporte (Não executados, mas usados)
- **new-results-v2.js** (Legacy — não importado atualmente)
- **dna-data.js** (Banco de dados imóveis — usado no Dossiê)
- **score-melhorias.js** (Hook automático para Score)

---

## 🔌 MAPA COMPLETO DE VARIÁVEIS DE ENTRADA (HTML → JavaScript)

### A. Inputs de Slider (Numéricos)

| ID HTML | Tipo | Min | Max | Step | Variável JS | Descrição |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `renda` | range | 0 | 30.000 | 100 | `data.renda` | Renda familiar bruta mensal (R$) |
| `idade` | range | 18 | 80 | 1 | `data.idade` | Idade do proponente (anos) |
| `dividas` | range | 0 | 5.000 | 50 | `data.dividas` | Dívidas mensais (R$) |
| `fgts` | range | 0 | 200.000 | 100 | `data.fgts` | Saldo FGTS disponível (R$) |
| `entrada` | range | 0 | 500.000 | 500 | `data.entrada` | Capital para entrada (R$) |

**Exemplo de captura:**
```javascript
const data = {
  renda: parseFloat(inputs.renda.value),     // 5000
  idade: parseInt(inputs.idade.value),       // 35
  dividas: parseFloat(inputs.dividas.value), // 500
  fgts: parseFloat(inputs.fgts.value),       // 20000
  entrada: parseFloat(inputs.entrada.value)  // 10000
};
```

---

### B. Inputs de Seleção (Texto / Radio)

| ID HTML | Tipo | Opções | Variável JS | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `vinculo` (4x buttons) | radio | `clt`, `mei`, `autonomo`, `publico` | `data.vinculo` | Vínculo empregatício |

**Mapeamento:**
```javascript
const vinculos = ['clt', 'mei', 'autonomo', 'publico'];
currentVinculo = this.getAttribute('data-vinculo');
// → data.vinculo = 'clt' | 'mei' | 'autonomo' | 'publico'
```

---

### C. Inputs de Texto (Form)

| ID HTML | Tipo | Máx Chars | Variável JS | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `nome` | text | — | `inputs.nome.value` | Nome completo do proponente |
| `celular` | tel | — | `inputs.celular.value` | Telefone de contato (WhatsApp) |

**Validação:**
```javascript
const nomeVal = inputs.nome.value.trim();           // Min 4 chars para conversão
const telVal = inputs.celular.value.replace(/\D/g, ''); // Min 10 dígitos
```

---

### D. Inputs de Checkbox (Booleans)

| ID HTML | Tipo | Valor Padrão | Variável JS | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `dependentes` | checkbox | false | `data.hasDependents` | Possui dependentes (filhos/cônjuge)? |
| `clt3anos` | checkbox | false | `data.clt3anos` | Trabalhei 3+ anos com FGTS? |
| `primeiroImovel` | checkbox | **true** | `data.ePrimeiro` | Este é meu 1º imóvel? |

**Captura:**
```javascript
const data = {
  hasDependents: inputs.dependentes.checked,          // true | false
  clt3anos: inputs.clt3anos.checked,                 // true | false
  ePrimeiro: inputs.primeiroImovel.checked,          // true | false (default true)
};
```

---

## 📤 MAPA COMPLETO DE VARIÁVEIS DE SAÍDA (JavaScript → HTML)

### A. Labels de Atualização Dinâmica (LHS Column)

| ID HTML | Fonte | Formato | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `label-renda` | Slider `renda` | Moeda (R$) | `R$ 5.000` | Exibe renda digitada |
| `label-idade` | Slider `idade` | Número + anos | `35 anos` | Exibe idade digitada |
| `label-dividas` | Slider `dividas` | Moeda (R$) | `R$ 500` | Exibe dívidas digitadas |
| `label-fgts` | Slider `fgts` | Moeda (R$) | `R$ 20.000` | Exibe FGTS digitado |
| `label-entrada` | Slider `entrada` | Moeda (R$) | `R$ 10.000` | Exibe entrada digitada |
| `label-prazo-val` | Cálculo `prazo` | Número + "anos" | `35 anos` | Prazo máximo bancário |

**Função de Atualização:**
```javascript
function updateSimulation() {
  // ... captura data ...
  
  if (labelEls.renda) labelEls.renda.innerText = formatCurrency(data.renda);
  if (labelEls.idade) labelEls.idade.innerText = data.idade + " anos";
  // ... etc ...
}
```

---

### B. Card Principal (Poder de Compra)

| ID HTML | Fonte | Cálculo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `total-value` | `res.valorImovel \| (sub+fgts+ent+fin)` | Soma 5 fontes | `R$ 350.000` | Poder de compra total |

**HTML injetado:**
```html
<div id="total-value">
  R$ 350.000<span class="text-lg">00</span>
</div>
```

---

### C. Barra de Composição (5 Segmentos)

| ID HTML | Fonte | % Calculado | Exemplo | Cor |
| :--- | :--- | :--- | :--- | :--- |
| `bar-sub` | `res.subsidio / poderReal` | 10% | Width: 10% | 🟢 Verde (`#3de273`) |
| `bar-fgts` | `data.fgts / poderReal` | 6% | Width: 6% | 🔵 Azul (`#38bdf8`) |
| `bar-ent` | `data.entrada / poderReal` | 3% | Width: 3% | 🔷 Ciano (`#22d3ee`) |
| `bar-ent-parcelado` | `res.saldoEntrada / poderReal` | 6% | Width: 6% | 🟡 Amarelo (`#fbbf24`) |
| `bar-fin` | `res.potencial / poderReal` | 75% | Width: 75% | ⚪ Cinza (`#f1f5f9`) |

**Cálculo da Proporção:**
```javascript
const poderReal = res.subsidio + data.fgts + data.entrada + res.saldoEntrada + res.potencial;

const pSub = (res.subsidio / poderReal) * 100;
const pFgts = (data.fgts / poderReal) * 100;
const pEnt = (data.entrada / poderReal) * 100;
const pEnt36x = (res.saldoEntrada / poderReal) * 100;
const pFin = (res.potencial / poderReal) * 100;

// Aplicar nos estilos CSS
outputs.barSub.style.width = pSub + '%';
outputs.barFgts.style.width = pFgts + '%';
// ... etc ...
```

---

### D. Legenda de Valores (4 Colunas × 2 Linhas)

| ID HTML | Fonte | Cálculo | Exemplo | Unidade |
| :--- | :--- | :--- | :--- | :--- |
| `val-sub` | `res.subsidio` | Direto | R$ 35.000 | Moeda |
| `val-fgts` | `data.fgts` | Direto | R$ 20.000 | Moeda |
| `val-ent` | `data.entrada` | Direto | R$ 10.000 | Moeda |
| `val-ent-parcelado` | `res.saldoEntrada` | Direto | R$ 20.000 | Moeda |
| `val-fin` | `res.potencial` | Direto | R$ 250.000 | Moeda |
| `pct-sub` | `pSub` | % do total | 10% | % |
| `pct-fgts` | `pFgts` | % do total | 6% | % |
| `pct-ent` | `pEnt` | % do total | 3% | % |
| `pct-ent-parcelado` | `pEnt36x` | % do total | 6% | % |
| `pct-fin` | `pFin` | % do total | 75% | % |

---

### E. Bento Grid (4 Cards)

| ID HTML | Fonte | Cálculo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `bento-sub-val` | `res.subsidio` | Direto | R$ 35.000 | Card: Subsídio Federal |
| `bento-fgts-val` | `data.fgts` | Direto | R$ 20.000 | Card: Uso do FGTS |
| `bento-ent-val` | `data.entrada` | Direto | R$ 10.000 | Card: Entrada Própria |
| `bento-fin-val` | `res.potencial` | Direto | R$ 250.000 | Card: Financiamento |

---

### F. Quadro Profissional (5 Pilares)

| ID HTML | Fonte | Cálculo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `prof-renda` | `data.renda` | Moeda | R$ 5.000 | Renda Familiar |
| `prof-taxa` | `res.taxaAnualMCMV * 100` | % a.a. | 6,50% | Taxa de Juros |
| `prof-prazo` | `res.prazoEfetivo` | meses | 360 meses | Prazo Máximo |
| `prof-parcela` | `res.parcelaPosChaves` | Moeda | R$ 1.925 | Parcela Estimada |
| `prof-imovel-max` | `res.imovelMax` | Moeda | R$ 400.000 | Imóvel Máximo |

---

### G. Tabela Comparativa (MCMV vs SBPE)

| ID HTML | Fonte | Cálculo | Exemplo | Status |
| :--- | :--- | :--- | :--- | :--- |
| `comp-mcmv-taxa` | `res.taxaAnualMCMV` | % + TR | 6,50% + TR | MCMV Row |
| `comp-mcmv-prazo` | `res.prazoEfetivo` | meses | 360 Meses | MCMV Row |
| `comp-mcmv-renda` | Hard-coded | Texto | Até R$ 9.600 | MCMV Row |
| `comp-mcmv-status` | `!res.foraDoMCMV ? "RECOMENDADO"` | Badge | ✅ RECOMENDADO | MCMV Row |
| `det-mcmv-subsidio` | `res.subsidio` | Moeda | R$ 35.000 | MCMV Details |
| `det-mcmv-seguros` | `res.custoMIP + res.custoDFI` | Moeda | R$ 460 | MCMV Details |
| `det-mcmv-parcela` | `res.parcelaPosChaves` | Moeda | R$ 1.925 | MCMV Details |
| `det-mcmv-itbi` | `res.itbi` | Moeda | R$ 4.177 | MCMV Details |

**Lógica de Status:**
```javascript
if (outputs.compMcmvStatus) {
  const isRec = !res.foraDoMCMV;
  outputs.compMcmvStatus.innerText = isRec ? "RECOMENDADO" : "DISPONÍVEL";
  outputs.compMcmvStatus.className = isRec 
    ? "bg-emerald-500 text-white ..." 
    : "bg-surface-container-highest ...";
}
```

---

### H. Score IA (Gauge + Critérios)

| ID HTML | Fonte | Cálculo | Exemplo | Tipo |
| :--- | :--- | :--- | :--- | :--- |
| `score-value` | `MT_Score.calcular()` | Total 100 pts | 65 | Score Total |
| `score-status-label` | Score conceito | Enum | B — Regular | Conceito |
| `gauge-arc` | Score normalizado | strokeDashoffset | 690 × (65/100) | SVG Arc |
| `score-c1-pts` | Critério 1 | % de 30 | 20/30 | Badge Pts |
| `score-c1-bar` | Critério 1 | % visual | 67% | Barra |
| `score-c2-pts` | Critério 2 | % de 20 | 14/20 | Badge Pts |
| `score-c2-bar` | Critério 2 | % visual | 70% | Barra |
| ... | ... | ... | ... | ... |
| `score-c6-pts` | Critério 6 | % de 8 | 8/8 | Badge Pts |
| `score-c6-bar` | Critério 6 | % visual | 100% | Barra |

---

### I. Sticky Power Bar (Flutuante Mobile)

| ID HTML | Fonte | Cálculo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `sticky-total-val` | `res.valorImovel` | Moeda | R$ 350.000 | Poder total |
| `sticky-bar-sub` | `pSub` | % | Width: 10% | Barra subsídio |
| `sticky-bar-fgts` | `pFgts` | % | Width: 6% | Barra FGTS |
| `sticky-bar-ent` | `pEnt` | % | Width: 3% | Barra entrada |
| `sticky-bar-ent-p` | `pEnt36x` | % | Width: 6% | Barra 36x |
| `sticky-bar-fin` | `pFin` | % | Width: 75% | Barra financ. |

---

### J. Cards de Melhoria (Coach IA)

| ID HTML | Fonte | Cálculo | Exemplo | Tipo |
| :--- | :--- | :--- | :--- | :--- |
| `mt-dicas-list` | `generateMelhoriasInteligentes()` | Array de cards | 4 cards | HTML Injetado |
| `val-parcela-entrada` | `res.parcelaEntrada` | 36x formatado | 36x de R$ 616 | Projeção mensal |
| `badge-entrada` | Visibilidade | `res.saldoEntrada > 0` | Display: flex | Condicional |

---

## 🔄 FLUXO COMPLETO DE CÁLCULO

```
ENTRADA DO USUÁRIO (HTML Inputs)
│
├─ renda: 5.000
├─ idade: 35
├─ dividas: 500
├─ fgts: 20.000
├─ entrada: 10.000
├─ vinculo: 'clt'
├─ clt3anos: true
├─ dependentes: false
├─ primeiroImovel: true
└─ nome, celular: strings

        ↓ EVENTO: onChange / addEventListener

FUNÇÃO: updateSimulation() [simulator-v3-logic.js]
│
├─ Captura dados do formulário
├─ Atualiza labels (renda, idade, etc)
└─ Chama MT_Core.calculateMCMV()

        ↓ PROCESSAMENTO

FUNÇÃO: MT_Core.calculateMCMV() [simulator-core.js]
│
├─ ETAPA 1: Ajuste de Renda por Vínculo
│  ├─ Se MEI: min(renda, 6.750) × 0,80 = 4.000
│  ├─ Se Autônomo: renda × 0,80 = 4.000
│  └─ Resultado: rendaConsiderada = 5.000
│
├─ ETAPA 2: Cálculo de Margem
│  ├─ Fator margem (CLT/Aposen=32%, Outros=30%)
│  ├─ Margem bruta = 5.000 × 0,32 = 1.600
│  ├─ Margem líquida = 1.600 - 500 (dívidas) = 1.100
│  └─ Resultado: margem = 1.100
│
├─ ETAPA 3: Enquadramento em Faixa
│  ├─ Renda 5.000 → Faixa 2 (≤5.000)
│  ├─ Teto imóvel = R$ 275.000
│  ├─ Taxa = 6,5% (CLT 3+) ou 7,0% (outros)
│  ├─ Prazo máx = (80,5 - 35) × 12 = 546 meses → limitado a 420
│  └─ Resultado: faixaMCMV = "Faixa 2", n = 420 meses
│
├─ ETAPA 4: Potencial de Financiamento (SAC com Seguros)
│  ├─ Converte taxa anual em mensal: √(1.065) - 1 = 0,525% a.m.
│  ├─ Seguros: MIP por idade + DFI fixo
│  ├─ Calcula potencial bruto: margem / ((1/n) + taxaMensal)
│  ├─ Desconta seguros: margemLíquida = margem - custos
│  ├─ Potencial final: margemLíquida / ((1/n) + taxaMensal)
│  └─ Resultado: potencial ≈ 250.000
│
├─ ETAPA 5: Subsídios (Federal + Estadual)
│  ├─ Se renda ≤ 3.200: subsídio base até R$ 55.000
│  ├─ Se 3.200 < renda ≤ 5.000: interpolação linear de 34.744 → 0
│  ├─ Se dependentes: × 1,10 (bônus 10%)
│  ├─ Se HIS-1 (renda ≤ 4.863): + 16.000 (estadual)
│  └─ Resultado: subsidio = 30.000 (federal) + 0 (estadual) = 30.000
│
├─ ETAPA 6: Poder de Compra (Soma de Fontes)
│  ├─ Poder = Potencial + FGTS + Entrada + Subsídio + Fôlego Obra
│  ├─ Poder = 250.000 + 20.000 + 10.000 + 30.000 + 15.000
│  ├─ Limitado ao teto da faixa: min(poder, tetoImovel)
│  └─ Resultado: poder = 325.000 (dentro do teto 275.000 F2) → 275.000
│
├─ ETAPA 7: Fluxo de Obra (36 meses Construtora)
│  ├─ Entrada mínima 20% = 55.000
│  ├─ Saldo = 55.000 - (20.000 + 10.000) = 25.000
│  ├─ Parcela mensal = 25.000 × 0,35 × 0,0055 / (1 - 1,0055^-36)
│  ├─ Parcelamento: 35% em 36x, 35% em 3 anuais, 30% chaves
│  └─ Resultado: parcelaEntrada ≈ 780 × 36 meses
│
├─ ETAPA 8: Parcela Bancária (SAC)
│  ├─ Saldo financiado = Imóvel - FGTS - Entrada - Subsídio
│  ├─ Saldo = 275.000 - 20.000 - 10.000 - 30.000 = 215.000
│  ├─ Amortização = 215.000 / 420 = 512/mês
│  ├─ Juros mês 1 = 215.000 × 0,525% = 1.129
│  ├─ Parcela = 512 + 1.129 = 1.641
│  └─ Resultado: parcelaPosChaves = 1.641
│
├─ ETAPA 9: ITBI (Impostos SP)
│  ├─ Se HIS-1: 0 (isenção total)
│  ├─ Se 1º imóvel ≤ 245.527,77: 0 (isenção)
│  ├─ Caso contrário: 0,5% até 120.968 + 3% acima
│  ├─ ITBI = 120.968 × 0,005 + (215.000 - 120.968) × 0,03
│  └─ Resultado: itbi ≈ 3.400
│
└─ RETORNO: Objeto completo com 40 propriedades financeiras

        ↓ SCORE IA

FUNÇÃO: MT_Score.calcular() [score-module.js]
│
├─ C1: Comprometimento Renda (30 pts max)
│  ├─ Margem livre = 1.100
│  ├─ Margem bruta = 1.600
│  ├─ Percentual = 1.100 / 1.600 = 68,75%
│  └─ Pontos = 68,75% × 30 = 20 pts
│
├─ C2: Endividamento (20 pts max)
│  ├─ Razão dívida = 500 / 5.000 = 10%
│  ├─ Faixa: 5-10% → 14 pts
│  └─ Pontos = 14 pts
│
├─ C3: FGTS (15 pts max)
│  ├─ Relação = 20.000 / (5.000 × 12) = 0,333
│  ├─ Faixa: 0,5 < x < 1,0 → 9 pts
│  └─ Pontos = 9 pts
│
├─ C4: Capital Próprio (15 pts max)
│  ├─ Total = 20.000 + 10.000 = 30.000
│  ├─ Ideal = 5.000 × 36 = 180.000
│  ├─ Relação = 30.000 / 180.000 = 16,7%
│  └─ Pontos = 16,7% × 15 ≈ 2 pts
│
├─ C5: Vínculo (12 pts max)
│  ├─ Vínculo = CLT 3+ → 12 pts base
│  ├─ Não penaliza (1º imóvel = true)
│  └─ Pontos = 12 pts
│
├─ C6: Prazo (8 pts max)
│  ├─ Idade 35 → prazo 45,5 anos
│  ├─ Faixa: ≥35 anos → 8 pts
│  └─ Pontos = 8 pts
│
├─ TOTAL = 20 + 14 + 9 + 2 + 12 + 8 = 65 pts
│
├─ CONCEITO = "B — Regular" (50 ≤ 65 < 70)
│
└─ DICAS = generateMelhoriasInteligentes(data, res) → 4 cards

        ↓ RENDERIZAÇÃO VISUAL

FUNÇÃO: Atualizar DOM (simulator-v3-logic.js)
│
├─ Labels de entrada (renda, idade, etc)
├─ Valor total poder de compra
├─ Barras de composição (5 segmentos)
├─ Legenda de valores (2x5 grid)
├─ Bento grid (4 cards)
├─ Quadro profissional (5 pilares)
├─ Tabela comparativa (3 linhas)
├─ Score gauge (SVG animado)
├─ Critérios de score (6 barras)
├─ Dicas IA (4 cards expansíveis)
└─ Sticky power bar (flutuante)

        ↓ CACHE + CRM

FUNÇÃO: saveSimulationToCache() [simulator-v3-logic.js]
│
├─ localStorage['mt_sim_data'] = {...}
├─ Contém: timestamp, inputs, resultados, score
└─ Persistido para carregar no Dossiê

FUNÇÃO: sendLeadToGoogleSheetsStage1() [simulator-v3-logic.js]
│
├─ POST → Google Sheets API
├─ Payload: nome, whatsapp, renda, idade, etc
└─ Assíncrono (no-cors)

        ↓ CONVERSÃO

FUNÇÃO: window.iniciarRotinaIA() [simulator-v3-logic.js]
│
├─ Validação: nome (≥4 chars) + telefone (≥10 dígitos)
├─ Overlay animado "Processando dados..." (3 seg)
├─ sendLeadToGoogleSheets (Lead Fase 1)
└─ Transição automática → dossie.html

        ↓ DOSSIÊ

PÁGINA: dossie.html
│
├─ Lê localStorage['mt_sim_data']
├─ Carrega todos os valores na UI
├─ Ativa Cockpit de Ajustes
├─ Renderiza Carrossel de Imóveis
└─ Gera Laudo de Aprovação → WhatsApp

```

---

## 📊 TRANSFORMAÇÕES DE DADOS (Input → Output)

### Transformação 1: Ajuste por Vínculo

```
INPUT:  renda = 5.000, vinculo = 'clt'
        ↓
LÓGICA: if (vinculo === 'clt') { renda = renda * 1.0; }
        ↓
OUTPUT: rendaConsiderada = 5.000

---

INPUT:  renda = 5.000, vinculo = 'mei'
        ↓
LÓGICA: renda = Math.min(renda, 6.750) * 0.80 = min(5.000, 6.750) * 0.80 = 5.000 * 0.80
        ↓
OUTPUT: rendaConsiderada = 4.000
```

---

### Transformação 2: Faixa MCMV

```
INPUT:  renda = 5.000
        ↓
LÓGICA: if (renda ≤ 3.200) { faixa = "Faixa 1"; taxa = 0.065; teto = 275.000; }
        else if (renda ≤ 5.000) { faixa = "Faixa 2"; taxa = 0.065; teto = 275.000; }
        ↓
OUTPUT: faixaMCMV = "Faixa 2"
        taxaAnualMCMV = 0.065 (6,5% para CLT 3+)
        imovelMax = 275.000
```

---

### Transformação 3: Taxa Anual → Taxa Mensal (Juros Compostos)

```
INPUT:  taxa_anual = 0.065 (6,5%)
        ↓
LÓGICA: taxaMensal = Math.pow(1 + 0.065, 1/12) - 1
        = 1.065^(1/12) - 1
        = 1.005242 - 1
        ↓
OUTPUT: taxaMensal = 0.005242 (0,5242% a.m.)
```

---

### Transformação 4: Potencial SAC com Seguros

```
INPUT:  margem = 1.100
        n = 420 meses
        taxaMensal = 0.005242
        
LÓGICA: potencialBruto = margem / ((1/n) + taxaMensal)
        = 1.100 / ((1/420) + 0.005242)
        = 1.100 / (0.002381 + 0.005242)
        = 1.100 / 0.007623
        = 144.333
        
        custoMIP = potencialBruto × 0.00025 (idade 30-40)
        = 144.333 × 0.00025 = 36
        
        margemLíquida = 1.100 - 36 - 5 = 1.059
        
        potencial = 1.059 / 0.007623 = 138.928
        ↓
OUTPUT: potencial ≈ 139.000
```

---

### Transformação 5: Subsídio Federal Interpolado

```
INPUT:  renda = 5.000, ePrimeiroImovel = true, hasDependents = false
        
LÓGICA: if (3.200 < renda ≤ 5.000) {
          // Interpolação linear
          subsidio = 34.744 - (5.000 - 3.200) × (34.744 / 1.800)
          = 34.744 - 1.800 × 19.302
          = 34.744 - 34.744
          = 0
        }
        ↓
OUTPUT: subsidio = 0 (limite máximo da faixa 2)
```

---

### Transformação 6: Poder de Compra Segmentado

```
INPUT:  potencial = 139.000
        subsidio = 30.000
        fgts = 20.000
        entrada = 10.000
        folegoObra = 15.000
        
LÓGICA: poderEstimado = 139.000 + 30.000 + 20.000 + 10.000 + 15.000
        = 214.000
        
        poderReal = floor(214.000 / 1.000) × 1.000 = 214.000
        
        // Limitar ao teto MCMV F2
        poder = min(214.000, 275.000) = 214.000
        
        // Preparar segmentação
        pSub = (30.000 / 214.000) × 100 = 14%
        pFgts = (20.000 / 214.000) × 100 = 9%
        pEnt = (10.000 / 214.000) × 100 = 4%
        pEnt36x = (15.000 / 214.000) × 100 = 7%
        pFin = (139.000 / 214.000) × 100 = 65%
        ↓
OUTPUT: poder = 214.000
        [14% Verde | 9% Azul | 4% Ciano | 7% Amarelo | 65% Cinza]
```

---

### Transformação 7: Parcela Mensal (SAC)

```
INPUT:  saldoFinanciado = 180.000
        n = 420 meses
        taxaMensal = 0.005242
        
LÓGICA: amortização = 180.000 / 420 = 428/mês
        jurosM1 = 180.000 × 0.005242 = 943
        parcelaM1 = 428 + 943 = 1.371
        
        // SAC decresce mensalmente
        jurosM2 = (180.000 - 428) × 0.005242 = 937
        parcelaM2 = 428 + 937 = 1.365
        
        // ... até mês 420
        jurosM420 = 428 × 0.005242 = 2
        parcelaM420 = 428 + 2 = 430
        ↓
OUTPUT: parcelaPosChaves = 1.371 (primeira parcela)
```

---

### Transformação 8: Score Conceito

```
INPUT:  C1 = 20 pts
        C2 = 14 pts
        C3 = 9 pts
        C4 = 2 pts
        C5 = 12 pts
        C6 = 8 pts
        
LÓGICA: total = 20 + 14 + 9 + 2 + 12 + 8 = 65 pts
        
        if (total ≥ 85) { conceito = "A+"; cor = verde; }
        else if (total ≥ 70) { conceito = "A"; cor = azul; }
        else if (total ≥ 50) { conceito = "B"; cor = amarelo; }
        else if (total ≥ 30) { conceito = "C"; cor = laranja; }
        else { conceito = "D"; cor = vermelho; }
        
        // 65 ≥ 50 e 65 < 70
        ↓
OUTPUT: conceito = "B — Regular"
        cor = "#f1c40f" (amarelo)
        pill = "⚠️ Analisar"
```

---

## 📝 RESUMO DE VARIÁVEIS POR ARQUIVO

### simulator-core.js
```javascript
window.MT_Core = {
  calculateMCMV(renda, dividas, fgts, entrada, clt3anos, ePrimeiroImovel, idade, vinculo, hasDependents)
  
  // Retorna objeto com:
  {
    // Input Espelhado
    renda, dividas, fgts, entrada, idade, vinculo, hasDependents,
    
    // Cálculos Intermediários
    margem, margemLiquida, rendaConsiderada,
    
    // Capacidade
    potencial, poder, poderReal, tetoMCMV, imovelMax, excedeTeto,
    
    // Enquadramento
    faixaMCMV, perfilEnquadramento, isExentoITBI,
    
    // Subsídios
    subsidio,
    
    // Fluxo de Obra
    saldoEntrada, parcelaEntrada, parcelaAnuais, chaves, mesesObra,
    
    // Parcela Bancária
    parcela, parcelaPosChaves, evolucaoMedia,
    
    // Taxas
    taxaAnualMCMV, prazoEfetivo,
    
    // Propriedade
    valorImovel, itbi,
    
    // Modo
    foraDoMCMV,
    
    // Cenário Alternativo
    sbpe: { poder, potencial, parcela, taxa, prazo },
    
    // Seguros
    custoMIP, custoDFI
  }
}
```

### simulator-v3-logic.js
```javascript
// Captura de Inputs
const inputs = {
  renda, idade, dividas, fgts, entrada,           // Sliders
  vinculoButtons,                                  // Radio buttons
  nome, celular,                                   // Text inputs
  clt3anos, primeiroImovel, dependentes           // Checkboxes
};

// Atualização Visual
const outputs = {
  // Labels
  labelEls: { renda, idade, dividas, fgts, entrada, prazoVal },
  
  // Card Principal
  totalValue, barSub, barFgts, barEnt, barEntParcelado, barFin,
  valSub, valFgts, valEnt, valEntParcelado, valFin,
  pctSub, pctFgts, pctEnt, pctEntP, pctFin,
  
  // Bento Grid
  bentoSub, bentoFgts, bentoEnt, bentoFin,
  
  // Quadro Profissional
  profRenda, profTaxa, profPrazo, profParcela, profImovelMax,
  
  // Tabela Comparativa
  compMcmvTaxa, compMcmvPrazo, compMcmvRenda, compMcmvStatus,
  detMcmvSub, detMcmvSeg, detMcmvPar, detMcmvItbi,
  
  // Score
  gaugeArc, scoreValue, scoreLabel, scoreDesc,
  scoreC1Pts, scoreC1Bar, scoreC2Pts, scoreC2Bar, ..., scoreC6Pts, scoreC6Bar,
  
  // Sticky Bar
  stickyBar, stickyTotal, stickyBarSub, stickyBarFgts, stickyBarEnt, stickyBarEntP, stickyBarFin,
  
  // Coach
  dicasList, valParcelaEntrada, badgeEntrada, label36x
};

// Funções Principais
function updateSimulation() { /* Orquestra tudo */ }
function updateScoreIA(data, res) { /* Calcula score */ }
function generateMelhoriasInteligentes(data, res) { /* Dicas IA */ }
function sendLeadToGoogleSheetsStage1() { /* CRM sync */ }
function saveSimulationToCache(res, data, score, pts) { /* localStorage */ }
```

### score-module.js
```javascript
window.MT_Score = {
  calcular(p) {
    // Retorna
    {
      total: 65,                    // 0-100
      conceito: "B — Regular",
      corHex: "#f1c40f",
      pill: "⚠️ Analisar",
      tipGeral: "Perfil com potencial, mas com pontos de atenção.",
      dicaEspecifica: "Ponto de melhoria: [...]",
      criteria: [
        { nome, pts, max, icone, detalhe, dica },
        // ... 6 critérios
      ]
    }
  }
};
```

---

## ⚙️ REGRAS ESPECIAIS E CONDIÇÕES

### Regra 1: Visibilidade Condicional (CLT 3+ Anos)
```javascript
if (currentVinculo === 'clt') {
  outputs.wrapClt3anos.style.display = 'flex';  // Mostrar
} else {
  outputs.wrapClt3anos.style.display = 'none';  // Ocultar
  inputs.clt3anos.checked = false;              // Desmarcar
}
```

### Regra 2: Ocultar "36x" se Barra Fina
```javascript
if (outputs.label36x) {
  outputs.label36x.style.opacity = pEnt36x > 5 ? '1' : '0';
  // Só aparece se > 5% da barra
}
```

### Regra 3: Status Badge Tabela Comparativa
```javascript
const isRec = !res.foraDoMCMV;  // Recomendado se dentro do MCMV
outputs.compMcmvStatus.innerText = isRec ? "RECOMENDADO" : "DISPONÍVEL";
```

### Regra 4: Entrada 100% Coberta
```javascript
if (res.saldoEntrada > 0) {
  outputs.valParcelaEntrada.innerText = `36x de ${formatCurrency(res.parcelaEntrada)}`;
} else {
  outputs.valParcelaEntrada.innerText = "Entrada 100% Coberta";
}
```

---

## 🔀 EVENT FLOW (Listener → Função → Atualização)

```
┌─ Usuário move slider "renda" para 5.000
│
├─ Evento: input (capturado por addEventListener)
│
├─ Função: updateSimulation() é chamada
│
├─ Passos internos:
│  ├─ Captura renda = 5.000
│  ├─ Atualiza label-renda = "R$ 5.000"
│  ├─ Chama MT_Core.calculateMCMV(5000, 500, 20000, 10000, true, true, 35, 'clt', false)
│  ├─ Recebe objeto res = { margem, potencial, poder, ... }
│  ├─ Chama updateScoreIA(data, res)
│  ├─ Recebe score IA (0-100)
│  └─ Atualiza 50+ elementos DOM
│
└─ Resultado visual: Todas as barras, valores e cards são atualizados em tempo real
```

---

## 💾 LIFECYCLE DE DADOS

```
1. ENTRADA (Usuário interage)
   ├─ HTML Input Elements (sliders, checkboxes, text)
   ├─ Capturados por `document.getElementById(id).value`
   └─ Armazenados em objetos `inputs` e `data`

2. PROCESSAMENTO (Motor de cálculo)
   ├─ MT_Core.calculateMCMV() → Lógica financeira
   ├─ MT_Score.calcular() → Lógica IA
   ├─ Transformações matemáticas
   └─ Objetos `res` e `score` retornados

3. RENDERIZAÇÃO (Atualização visual)
   ├─ DOM updates via `.innerText` e `.style.width`
   ├─ Classes CSS dinâmicas
   ├─ SVG animations
   └─ 50+ elementos de saída atualizados

4. PERSISTÊNCIA (Cache + CRM)
   ├─ localStorage['mt_sim_data'] = cache local
   ├─ Google Sheets API POST (assíncrono)
   └─ Pronto para carregar no Dossiê

5. CONVERSÃO (Lead → Dossiê)
   ├─ window.iniciarRotinaIA() validação
   ├─ Overlay de processamento 3 seg
   ├─ window.irParaDossie() redirecionamento
   └─ dossie.html lê localStorage e hidrata UI
```

---

## 📋 CHECKLIST DE VARIÁVEIS

### Checklist Entrada (9 principais)
- [ ] renda (0 - 30.000)
- [ ] idade (18 - 80)
- [ ] dividas (0 - 5.000)
- [ ] fgts (0 - 200.000)
- [ ] entrada (0 - 500.000)
- [ ] vinculo (clt | mei | autonomo | publico)
- [ ] clt3anos (boolean)
- [ ] primeiroImovel (boolean)
- [ ] dependentes (boolean)

### Checklist Saída Principal (12 core)
- [ ] poder (valor total de compra)
- [ ] potencial (financiamento bruto)
- [ ] subsidio (federal + estadual)
- [ ] faixaMCMV (F1, F2, F3, F4, SBPE)
- [ ] taxaAnualMCMV (% a.a.)
- [ ] prazoEfetivo (meses)
- [ ] parcelaPosChaves (R$ mensal)
- [ ] saldoEntrada (a ser parcelado)
- [ ] parcelaEntrada (36x construtora)
- [ ] itbi (imposto estadual)
- [ ] score (0-100)
- [ ] conceito (A+, A, B, C, D)

---

**Fim do Relatório**

*Próximo: Para integração, consulte GUIA_JORNADA_DOSSIE.md (Cockpit de Ajustes) e GUIA-OPERACIONAL.md (Deploy)*
