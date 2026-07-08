# 🏗️ ANÁLISE CRÍTICA: SIMULADOR vs REALIDADE "APARTAMENTOS NA PLANTA"

**Data:** 23 de junho de 2026  
**Escopo:** Identificar gaps entre simulador atual e simulador de financiamento de imóvel em construção

---

## 📊 COMPARAÇÃO: O QUE FALTA

### ✅ JÁ IMPLEMENTADO

| Aspecto | Status | Detalhe |
| --- | :---: | --- |
| INCC para obra | ✅ | 0,55% a.m. fixo (simulator-core.js linha 273) |
| Fluxo de obra | ✅ | 36 meses (simulador-core.js linha 266) |
| Distribuição saldo | ✅ | 35% mensal + 35% anual + 30% chaves |
| Parcela durante obra | ✅ | Calculada via taxa INCC |
| Margem bancária | ✅ | 30-32% conforme vínculo |
| Subsídios | ✅ | Federal + Casa Paulista |

---

## ❌ IDENTIFICADOS GAPS CRÍTICOS

### **GAP 1: Período de Obra Fixo (36 meses)**

**Realidade:**
```
- Empreendimentos variam de 24 a 48 meses
- Cada incorporadora tem cronograma diferente
- Atrasos de obra afetam prazo total disponível
```

**Código Atual (simulator-core.js linha 266):**
```javascript
const mesesObra = 36;  // ❌ HARDCODED
```

**Impacto:** 
- ❌ Não reflete verdadeira duração de projeto
- ❌ Parcelas podem estar incorretas
- ❌ Poder de compra subavaliado/superavaliado

---

### **GAP 2: Taxa de Atualização Monetária Fixa (0,55% INCC)**

**Realidade:**
```
- INCC varia de 0,2% a 0,8% a.m.
- IGPM pode ser usado (historicamente 0,6-1,2%)
- Diferente por incorporadora/região
- Atualiza mensalmente
```

**Código Atual (simulator-core.js linha 273):**
```javascript
const taxaINCC = 0.0055;  // ❌ FIXO
```

**Impacto:**
- ❌ Parcelas podem estar erradas
- ❌ Se INCC real é 0,8% e simulador usa 0,55%, parcela está subestimada
- ❌ Usuário pode se surpreender na assinatura

---

### **GAP 3: Distribuição de Pagamento Simplista**

**Realidade (35% + 35% + 30%):**
```
Típico em incorporadora moderna:
├─ 5-10%  → Assinatura (liberação de número de matrícula)
├─ 5-10%  → Vigência (assinatura do contrato com banco)
├─ 30-40% → Obra (distribuído em fases)
├─ 20-30% → Pré-Chaves (últimas fases)
└─ 5-10%  → Chaves (entrega + documentação)

Mas varia demais por tipo de incorporadora!
```

**Código Atual (simulator-core.js linhas 287-293):**
```javascript
saldoMensais = saldoEntrada * 0.35;   // ❌ Simplista
saldoAnuais = saldoEntrada * 0.35;
chaves = saldoEntrada * 0.30;
```

**Impacto:**
- ❌ Fluxo de caixa do usuário pode estar errado
- ❌ Não reflete realidade de quando precisa desembolsar

---

### **GAP 4: Ausência de "Margem de Lucro" da Incorporadora**

**Realidade:**
```
Incorporadora cobra:
├─ Margem de lucro: 5-15% do VGV (Valor Geral de Venda)
├─ Pode estar pré-fixada ou pode variar com atraso
└─ Afeta preço final do imóvel
```

**Código Atual:**
```javascript
// ❌ NÃO EXISTE
```

**Impacto:**
- ❌ Poder de compra pode estar inflado
- ❌ Se incorporadora cobra 10% e não foi considerado, usuário fica sem R$

---

### **GAP 5: Não Diferencia "Pré-Liberação de Crédito"**

**Realidade:**
```
Muitos bancos liberam:
├─ Crédito antes das chaves (ex: faltam 60 dias)
├─ Permite quitar saldo maior durante obra
├─ Reduz parcelas de obra
└─ Muda estrutura financeira completamente
```

**Código Atual:**
```javascript
// ❌ Só simula crédito APÓS chaves
```

**Impacto:**
- ❌ Poder de compra subestimado
- ❌ Não mostra benefício da pré-liberação
- ❌ Usuário não negocia essa vantagem com banco

---

### **GAP 6: Score IA não é otimizado para "Na Planta"**

**Realidade - Critérios Específicos para Na Planta:**
```
1. ⭐ Histórico da Incorporadora (risco de paralização)
2. ⭐ Localização do Projeto (revenda futura)
3. ⭐ Estágio da Obra (quanto já foi construído?)
4. ⭐ Garantias/SAC (Seguro de Atraso)
5. ⭐ Rentabilidade Esperada (quanto o imóvel vai valorizar)
```

**Código Atual (score-module.js):**
```javascript
// Critérios genéricos (Comprometimento renda, endividamento, etc)
// ❌ Nenhum relacionado a empreendimento
```

**Impacto:**
- ❌ Score não reflete risco real de investir em na planta
- ❌ Ótimo score em perfil fraco poderia estar enganoso

---

### **GAP 7: Ausência de "Cenários de Atraso de Obra"**

**Realidade:**
```
Na prática:
├─ Obra atrasa em média 6-12 meses
├─ Se atraso > prazo bancário, crédito vence
├─ Usuário fica com parcelas em aberto
├─ Pode precisar refinanciar
└─ Prazo efetivo se reduz!
```

**Código Atual:**
```javascript
// ❌ NÃO SIMULA ATRASO
```

**Impacto:**
- ❌ Usuário não sabe o que fazer se obra atrasa
- ❌ Poder de compra real é menor do que simulado

---

### **GAP 8: Ausência de "Pré-Chaves" / TED (Transferência Eletrônica)**

**Realidade:**
```
Pré-Chaves = período entre fim de financiamento e entrega real
├─ Tipicamente 15-30 dias
├─ Escritura já está registrada
├─ Banco finaliza seus débitos
├─ Muitas taxas finais são cobradas
└─ Influencia quando usuário realmente "recebe" o imóvel
```

**Código Atual:**
```javascript
// ❌ NÃO CONSIDERA PRÉ-CHAVES
```

**Impacto:**
- ❌ Timeline está incorreta
- ❌ Usuário pensa que vai morar antes

---

### **GAP 9: Ausência de "Simulação Comparativa: Pronto vs Na Planta"**

**Realidade:**
```
Usuário deveria escolher:
1. Comprar pronto → paga logo, sem risco de atraso
2. Comprar na planta → paga menos, mas arriscado
```

**Código Atual:**
```javascript
// ❌ SÓ SIMULA NA PLANTA
```

**Impacto:**
- ❌ Usuário não sabe diferença financeira
- ❌ Não vê economia real de comprar na planta

---

### **GAP 10: Ausência de "Empreendimento como Fator de Risco"**

**Realidade:**
```
Banco analisa:
├─ Localização: Zona de valorização? (mais seguro)
├─ Densidade: Muitos ou poucos apartamentos? (mais = risco maior)
├─ Acabamento: Padrão/Médio/Alto? (impacta revenda)
├─ VGV total: R$ 5M ou R$ 200M? (grandes = mais risco)
└─ Mercado: Mercado quente ou frio? (afeta liquidez)
```

**Código Atual:**
```javascript
// ❌ NENHUMA ANÁLISE DE EMPREENDIMENTO
```

**Impacto:**
- ❌ Poder de compra não reflete risco do projeto
- ❌ Pode superestimar capacidade em zona desvalorizada

---

### **GAP 11: Ausência de "Restrições de Liquidação Antecipada"**

**Realidade:**
```
Contrato de na planta pode ter:
├─ Lock-up period: 12-24 meses (não pode vender/refinanciar)
├─ Penalidade de cancelamento: 5-10% do saldo
├─ Clausula de atraso: Obra atrasa + X meses → crédito estende
└─ Limite de portabilidade: Pode mudar para outro banco?
```

**Código Atual:**
```javascript
// ❌ NÃO SIMULA RESTRIÇÕES
```

**Impacto:**
- ❌ Usuário pensa que pode cancelar a qualquer hora
- ❌ Poder de compra real é menor

---

### **GAP 12: Falta de "Análise de Fluxo de Caixa em Tempo Real"**

**Realidade:**
```
Usuário deveria ver:
├─ Mês 1: Paga R$ X na construtora
├─ Mês 3: Paga R$ X na construtora
├─ Mês 15: Obra atrasa, paga igual
├─ Mês 36: Chaves, começa financiamento
├─ Mês 37: Primeira parcela do banco
└─ E quanto vai gastar no total?
```

**Código Atual:**
```javascript
// ❌ SIMULA VALOR ÚNICO, NÃO TIMELINE
```

**Impacto:**
- ❌ Usuário não sabe fluxo mês-a-mês
- ❌ Pode ficar sem dinheiro em algum mês

---

## 🎯 PRIORIDADE DE CORREÇÕES

### **CRÍTICO (Afeta Cálculo Principal)**
1. ⚠️ Fazer período de obra parametrizável (não hardcoded)
2. ⚠️ Fazer taxa INCC/IGPM parametrizável
3. ⚠️ Adicionar margem de lucro da incorporadora
4. ⚠️ Oferecer pré-liberação de crédito como opção

### **ALTO (Afeta Experiência do Usuário)**
5. 📊 Criar distribuição de pagamento realistacustomizável
6. 📊 Adicionar cenário de atraso de obra
7. 📊 Mostrar comparação Pronto vs Na Planta

### **MÉDIO (Melhora Análise)**
8. 🔍 Integrar dados do empreendimento (risco)
9. 🔍 Melhorar Score IA com fatores de na planta
10. 🔍 Mostrar timeline mês-a-mês

### **BAIXO (Melhorias Secundárias)**
11. 🔐 Considerar lock-up period
12. 🔐 Mostrar pré-chaves (TED)

---

## 💡 ARQUITETURA PROPOSTA

### **Nova Entrada (simulador.html):**
```html
<!-- SEÇÃO 1: Dados Básicos (Atual) -->
Renda, Idade, Dívidas, FGTS, Entrada, Vínculo

<!-- SEÇÃO 2: NOVO - Dados do Empreendimento -->
├─ Período de Obra: [slider 24, 30, 36, 48 meses]
├─ Índice de Atualização: [dropdown INCC 0,55% ou IGPM 0,75%]
├─ Margem Incorporadora: [slider 0-15%]
├─ Pré-Liberação: [toggle SIM/NÃO + meses antes das chaves]
└─ Localização/Zona: [dropdown Alto/Médio/Baixo risco]

<!-- SEÇÃO 3: NOVO - Distribuição Customizada -->
├─ Assinatura: [slider 5-15%]
├─ Vigência: [slider 5-15%]
├─ Obra: [slider 30-50%]
├─ Pré-Chaves: [slider 10-30%]
└─ Chaves: [slider 5-15%]

<!-- SEÇÃO 4: NOVO - Cenários -->
├─ Atraso de Obra: [slider 0-12 meses]
├─ Simulação: Ver impacto
└─ Comparar: Pronto vs Na Planta
```

### **Novo Motor (simulator-core.js)**

```javascript
MT_Core.calculateMCMVNaPlanta({
    // Inputs antigos
    renda, dividas, fgts, entrada, clt3anos, ePrimeiroImovel, 
    idade, vinculo, hasDependents,
    
    // NOVOS - Empreendimento
    mesesObra,              // 24, 30, 36, 48
    taxaMensalAtualiz,      // 0.0055 (INCC) ou 0.0075 (IGPM)
    margem Incorporadora,   // 0-15%
    preLibCreditoMeses,     // 0, 60, 90 (meses antes chaves)
    zonaRisco,              // 'alto', 'medio', 'baixo'
    
    // NOVOS - Distribuição Personalizada
    pctAssinatura,          // 5-15%
    pctVigencia,            // 5-15%
    pctObra,                // 30-50%
    pctPreChaves,           // 10-30%
    pctChaves,              // 5-15%
    
    // NOVOS - Cenários
    mesesAtraso,            // 0-12
    compararComProto        // boolean
})
```

### **Novo Score IA (score-module.js)**

```javascript
// Critérios específicos para Na Planta
1. Capacidade de Entrada (20 pts)
   - % que usuário consegue pagar de entrada
   
2. Estabilidade na Obra (25 pts)
   - Risco de paralização
   - Histórico do incorporador
   - Localização (zona de risco)
   
3. Rentabilidade Esperada (20 pts)
   - Projeção de valorização
   - Relação preço/m² vs mercado
   - Liquidez futura
   
4. Segurança Financeira (20 pts)
   - Reserva de emergência
   - Margem livre após todas as parcelas
   
5. Histórico Creditício (15 pts)
   - Vínculo, endividamento, etc
```

---

## 🔧 MAPA DE MUDANÇAS ESPECÍFICAS

### **Arquivo: simulator-core.js**

```
❌ Linha 266: const mesesObra = 36;
✅ Nova:      const mesesObra = params.mesesObra || 36;

❌ Linha 273: const taxaINCC = 0.0055;
✅ Nova:      const taxaMensalAtualiz = params.taxaMensalAtualiz || 0.0055;

❌ Linhas 287-293: Distribuição fixa 35-35-30
✅ Nova:      Aceitar parâmetros: pctAssinatura, pctVigencia, etc

❌ Linha 322: const valorImovel = ...
✅ Nova:      Aplicar margem incorporadora: valorImovel * (1 + margemIncorporadora)

⭐ NEW:       Adicionar cálculo de pré-liberação de crédito
⭐ NEW:       Adicionar cenário de atraso (ajusta prazo)
```

### **Arquivo: score-module.js**

```
⭐ NEW:       Detectar se é "na planta" via params
⭐ NEW:       Se sim, aplicar critérios específicos
⭐ NEW:       Score = mix de fatores empreendimento + financeiros
```

### **Arquivo: simulator-v3-logic.js**

```
⭐ NEW:       Adicionar listeners para novos sliders
⭐ NEW:       Atualizar cálculo em tempo real com novos params
⭐ NEW:       Salvar no localStorage com novos dados
```

### **Arquivo: simulador.html**

```
⭐ NEW:       Seção 2: Dados do Empreendimento
⭐ NEW:       Seção 3: Distribuição Customizada
⭐ NEW:       Seção 4: Cenários (Atraso + Comparação)
⭐ NEW:       Novo card visual para timeline de obra
```

---

## 📈 IMPACTO NO PODER DE COMPRA

### **Exemplo: Mesmo Cliente, 2 Cenários**

**Cenário 1: Pronto (Atual)**
```
Renda: R$ 5.000
Entrada: R$ 30.000
FGTS: R$ 20.000

Poder: R$ 260.000 (financiamento) + subsídios
TOTAL: ~R$ 330.000 ✅
```

**Cenário 2: Na Planta (Novo)**
```
Renda: R$ 5.000
Entrada: R$ 30.000 (parcelada em 36 meses)
FGTS: R$ 20.000 (paga durante obra)

Período obra: 36 meses
Parcela mensal de obra: ~R$ 614
Margem de lucro: 8%
Pré-liberação: 60 dias antes chaves

Poder Imediato: R$ 30.000 + R$ 20.000 = R$ 50.000 ✅
Poder Pós-Chaves: ~R$ 260.000 ✅
TOTAL: Mesmo, mas distribuído ⚠️

Impacto: Fluxo de caixa é CRÍTICO!
```

---

## ✅ PRÓXIMOS PASSOS

1. **Fase 1 (Crítica)**: Parâmetrizar período + taxa + margem
2. **Fase 2 (Alta)**: Distribuição customizável + cenários
3. **Fase 3 (Média)**: Score otimizado + empreendimento data
4. **Fase 4 (Baixa)**: Lock-up + TED + refinamentos

---

**Conclusão:** O simulador atual é um ótimo ponto de partida, mas para ser "perfeito" para apartamentos na planta, precisa de **4 mudanças estruturais + customizações de UX**.

O impacto principal será permitir que o usuário **veja realmente o fluxo de caixa mês-a-mês** e **compare pronto vs na planta** de forma visual e intuitiva.
