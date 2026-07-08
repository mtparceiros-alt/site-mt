# 🎯 SUMÁRIO: O QUE FALTA PARA "PERFEIÇÃO"

**Foco:** Simular Fidedignamente "Apartamentos Na Planta"  
**Data:** 23 de junho de 2026  
**Status:** Documentação Completa + Plano de Ação

---

## 📊 COMPARAÇÃO RÁPIDA

### ✅ O QUE JÁ FUNCIONA (Hoje)

```
Simulador MT Parceiros v3 (Atual)
├─ Cálculo de MCMV/SBPE ✅
├─ Score IA 0-100 ✅
├─ Subsídios (Federal + Estadual) ✅
├─ ITBI SP 2026 ✅
├─ Fluxo básico de obra (36 meses fixo) ✅
├─ INCC (0,55% fixo) ✅
└─ Conversão CRM ✅

Mas...
└─ Tudo MUITO genérico para "pronto"
   (Não reflete bem a realidade de apartamentos NA PLANTA)
```

### ❌ O QUE FALTA (Para Perfeição)

```
Simulador Perfeito para Na Planta (Novo)
├─ Período de obra PARAMETRIZÁVEL (24-48 meses) ❌
├─ Taxa de atualização PARAMETRIZÁVEL (INCC/IGPM) ❌
├─ Margem de lucro da incorporadora ❌
├─ Distribuição de pagamento CUSTOMIZÁVEL ❌
├─ Pré-liberação de crédito ❌
├─ Simulação de ATRASO de obra ❌
├─ Comparação PRONTO vs NA PLANTA ❌
├─ Timeline visual mês-a-mês ❌
├─ Score otimizado para NA PLANTA ❌
└─ Dados de empreendimento (risk, incorporador, etc) ❌
```

---

## 🏗️ ARQUITETURA PROPOSTA

```
Simulador v4 (Nova Geração)
│
├─ ENTRADA (UI Nova)
│  ├─ Seção 1: Perfil Financeiro (Atual)
│  │  └─ Renda, idade, dívidas, FGTS, entrada, vínculo
│  │
│  ├─ Seção 2: Dados do Empreendimento (NOVO)
│  │  ├─ Período de obra: 24-48 meses [SLIDER]
│  │  ├─ Taxa de atualização: INCC/IGPM [DROPDOWN]
│  │  ├─ Margem de lucro: 0-20% [SLIDER]
│  │  └─ Pré-liberação: Não/30/60/90 dias [DROPDOWN]
│  │
│  ├─ Seção 3: Distribuição Customizada (NOVO)
│  │  ├─ Assinatura: 5-20% [SLIDER]
│  │  ├─ Vigência: 5-20% [SLIDER]
│  │  ├─ Obra: 30-60% [SLIDER]
│  │  ├─ Pré-Chaves: 10-30% [SLIDER]
│  │  └─ Chaves: 5-20% [SLIDER]
│  │
│  └─ Seção 4: Cenários (NOVO)
│     ├─ Atraso de obra: 0-12 meses [SLIDER]
│     └─ Comparar com Pronto [TOGGLE]
│
├─ PROCESSAMENTO (Motor Expandido)
│  ├─ calculateMCMVNaPlanta() (NOVO)
│  │  ├─ Aceita 20+ parâmetros de empreendimento
│  │  ├─ Aplica margem incorporadora
│  │  ├─ Distribui pagamento customizado
│  │  ├─ Simula atraso
│  │  └─ Retorna 50+ propriedades
│  │
│  ├─ calculateScoreNaPlanta() (NOVO)
│  │  ├─ 5 critérios específicos na planta
│  │  ├─ Avalia estabilidade de obra
│  │  ├─ Rentabilidade do projeto
│  │  └─ Retorna score + conceito + conselhos
│  │
│  └─ compararProtoVsNaPlanta() (NOVO)
│     ├─ Simula pronto (mesesObra = 0)
│     ├─ Simula na planta (mesesObra = X)
│     └─ Retorna diferenças e impactos
│
└─ SAÍDA (UI Expandida)
   ├─ Card Principal: Poder de Compra (IGUAL)
   ├─ Barra de Composição: 5 segmentos (IGUAL)
   ├─ Score IA: 5 critérios de na planta (NOVO)
   ├─ Timeline: Visual mês-a-mês (NOVO)
   ├─ Cenários: Comparação lado-a-lado (NOVO)
   ├─ Custo Total: Decomposto por fase (NOVO)
   └─ Aviso de Risco: Atraso, lock-up, etc (NOVO)
```

---

## 💰 IMPACTO FINANCEIRO DO EXEMPLO

### Cenário 1: Pronto (Hoje)
```
Renda: R$ 5.000
Entrada: R$ 30.000
FGTS: R$ 20.000

Poder: R$ 260.000 (financiamento) + subsídios
TOTAL: R$ 330.000 ✅

Parcela 1º mês: R$ 1.925
Prazo: 360 meses
Taxa: 6,5% a.a.
```

### Cenário 2: Na Planta (Futuro)
```
Renda: R$ 5.000
Entrada: R$ 30.000 (PARCELADA EM 36 MESES)
FGTS: R$ 20.000 (PAGA DURANTE OBRA)

PERÍODO DE OBRA:
├─ Mês 1: Assinatura (10% = R$ 3.000)
├─ Mês 1-3: Vigência (10% = R$ 3.000)
├─ Mês 3-18: Obra (40% = R$ 12.000) → ~R$ 800/mês
├─ Mês 18-27: Pré-Chaves (25% = R$ 7.500) → ~R$ 833/mês
└─ Mês 27: Chaves (15% = R$ 4.500)

APÓS CHAVES:
├─ Poder: R$ 260.000 (financiamento)
├─ Subsídios: R$ 35.000 (Federal + Estadual)
├─ FGTS já usado: R$ 20.000
├─ Entrada já paga: R$ 30.000
└─ TOTAL PODER: Igual R$ 330.000, mas distribuído!

Parcela Obra: R$ 800-833/mês (Mês 3-27)
Parcela Pós-Chaves: R$ 1.925/mês (Mês 28+)
Prazo Financiamento: 360 meses (do mês 28)
Taxa: 6,5% a.a.
```

**DIFERENÇA CRÍTICA:** 
- Fluxo de caixa é completamente diferente!
- Usuário precisa ter R$ 800-833 durante obra
- Depois das chaves, parcela é igual

---

## 🚨 RISCOS DE NÃO FAZER

| Risco | Impacto | Severidade |
| --- | --- | :---: |
| Período fixo 36 meses | Simula errado se obra for 24 ou 48 | 🔴 CRÍTICO |
| INCC fixo 0,55% | Parcelas podem estar 50% erradas | 🔴 CRÍTICO |
| Sem margem incorporadora | Poder está inflado | 🔴 CRÍTICO |
| Distribuição fixa 35-35-30 | Fluxo de caixa errado | 🟠 ALTO |
| Sem pré-liberação | Benefício não mostrado | 🟠 ALTO |
| Sem atraso de obra | Usuário é pego desprevenido | 🟠 ALTO |
| Score não otimizado | Recomendação pode ser enganosa | 🟡 MÉDIO |
| Sem comparação Pronto vs Na Planta | Usuário não sabe escolher | 🟡 MÉDIO |

---

## 📁 DOCUMENTOS GERADOS

Criei **4 documentos completos**:

### 1. `ANALISE_GAPS_APARTAMENTOS_NA_PLANTA.md`
```
Status: ✅ LEITURA OBRIGATÓRIA
├─ Identifica 12 gaps específicos
├─ Mostra impacto de cada gap
├─ Prioriza by criticidade
└─ 15 páginas detalhadas
```

### 2. `PLANO_ACAO_FASE1_A_FASE4.md`
```
Status: ✅ PRONTO PARA IMPLEMENTAR
├─ 4 Fases de 12-20 horas cada
├─ Código-exemplo para cada mudança
├─ Localizações exatas (arquivo + linha)
├─ Sprint planning
└─ 40-60 horas total
```

### 3. Anteriores (Resumo + Checklist + Auditoria)
```
├─ RELATORIO_AUDITORIA_SIMULADOR_2026_FINAL.md
├─ RESUMO_EXECUTIVO_SIMULADOR_2026.md
└─ CHECKLIST_CONFORMIDADE_SIMULADOR_2026.md
```

---

## 🎬 PRÓXIMOS PASSOS RECOMENDADOS

### **HOJE (Decisão)**
- [ ] Ler `ANALISE_GAPS_APARTAMENTOS_NA_PLANTA.md`
- [ ] Decidir: fazer todas as 4 fases ou só críticas?
- [ ] Estimar tempo/recursos disponíveis

### **SEMANA 1 (Se decidir fazer)**
- [ ] Começar FASE 1 (parâmetrização básica)
- [ ] Testar em sandbox antes de produção
- [ ] Validar com cliente real

### **SEMANA 2-3 (Continuação)**
- [ ] Implementar FASE 2 (UI nova)
- [ ] Fazer testes de regressão nas faixas MCMV

### **SEMANA 4-6 (Refinamentos)**
- [ ] FASE 3 + FASE 4
- [ ] Integração completa com Dossiê
- [ ] Deploy

---

## ✅ RESULTADO FINAL

### Simulador v4 Será:

```
✅ Realista: Reflete verdade de apartamentos na planta
✅ Flexível: Parametrizável para qualquer empreendimento
✅ Inteligente: Score otimizado para na planta
✅ Visual: Timeline mês-a-mês
✅ Comparativo: Pronto vs Na Planta lado-a-lado
✅ Seguro: Previne surpresas (atraso, lock-up, etc)
✅ Conversão: Usuário entende e compra com confiança
```

### Simulador v3 Permanecerá:

```
❌ Bom para produtos prontos
❌ Não reflete bem apartamentos na planta
❌ Pode enganar usuário sobre fluxo de caixa
❌ Não diferencia cenários reais
```

---

## 🎯 DECISÃO NECESSÁRIA

**Pergunta:** Vamos implementar as 4 fases?

**Opções:**

1. **Apenas FASE 1** (4-8h) → Básico, mínimo necessário
2. **FASES 1+2** (12-16h) → UI funcional
3. **FASES 1+2+3** (24-32h) → Quase perfeito
4. **TODAS 4** (40-60h) → Perfeição completa

---

**Status Atual:** 📋 Documentação 100% pronta, aguardando decisão.

Qualquer dúvida, os documentos têm tudo detalha do com exemplos de código!
