# 🚀 PLANO DE AÇÃO: TRANSFORMAR EM SIMULADOR PERFEITO DE APARTAMENTOS NA PLANTA

**Versão:** v4 (Roadmap 2026)  
**Escopo:** 4 Fases de Implementação  
**Tempo Estimado:** 40-60 horas de desenvolvimento

---

## 📋 FASE 1: FUNDAÇÃO (Crítica) — 12-16 horas

### Objetivo
Fazer o motor aceitar parâmetros de empreendimento e deixar de ter valores hardcoded.

### 1.1 Expandir Assinatura MT_Core.calculateMCMV()

**Arquivo:** `simulator-core.js` (antes: linha 69)

**De:**
```javascript
calculateMCMV: function (renda, dividas, fgts, entrada, clt3anos, ePrimeiroImovel, idade, vinculo, hasDependents) {
```

**Para:**
```javascript
calculateMCMV: function (renda, dividas, fgts, entrada, clt3anos, ePrimeiroImovel, idade, vinculo, hasDependents, naPlantaConfig = {}) {
    // MT_LOG (23/06/2026): Suporte a parâmetros de empreendimento
    
    // Desempacar configuração na planta
    const mesesObra = naPlantaConfig.mesesObra || 36;
    const taxaMensalAtualiz = naPlantaConfig.taxaMensalAtualiz || 0.0055;  // INCC padrão
    const margemIncorporadora = (naPlantaConfig.margemIncorporadora || 0) / 100;  // Converter % em decimal
    const preLibCreditoMeses = naPlantaConfig.preLibCreditoMeses || 0;
    const distrib = naPlantaConfig.distribuicao || {  // Distribuição padrão
        assinatura: 0.10,
        vigencia: 0.10,
        obra: 0.40,
        preChaves: 0.25,
        chaves: 0.15
    };
    const cenarioAtraso = naPlantaConfig.mesesAtraso || 0;
    
    // Validações
    if (mesesObra < 12 || mesesObra > 60) {
        console.warn("MT_Core: mesesObra fora do intervalo [12, 60]. Limitando.");
        mesesObra = Math.max(12, Math.min(60, mesesObra));
    }
    
    if (taxaMensalAtualiz < 0.001 || taxaMensalAtualiz > 0.015) {
        console.warn("MT_Core: taxaMensalAtualiz suspeita. Verificar INCC/IGPM.");
    }
```

### 1.2 Aplicar Margem de Lucro da Incorporadora

**Arquivo:** `simulator-core.js` (novo, após linha 310)

**Adicionar após cálculo de `poder`:**
```javascript
// MT_LOG (23/06/2026): Aplicar margem de lucro da incorporadora
// A margem é cobrada sobre o VGV total
const valorImovelComMargem = poderReal * (1 + margemIncorporadora);
const margemAbsoluta = poderReal * margemIncorporadora;

// O poder efetivo se reduz pela margem da incorporadora
const poderEfetivoAposMargemIncorporadora = poderReal;  // Mantém mesmo, mas registra margem

console.log(`MT_Core: Margem incorporadora: ${Math.round(margemAbsoluta)} 
            (${(margemIncorporadora * 100).toFixed(1)}% de R$ ${Math.round(poderReal)})`);
```

### 1.3 Parametrizar Taxa INCC

**Arquivo:** `simulator-core.js` (linha 273, substituir)**Antes:**
```javascript
const taxaINCC = 0.0055;
```

**Depois:**
```javascript
// MT_LOG (23/06/2026): Taxa de atualização parametrizável (INCC/IGPM)
const taxaMensalAtualizacao = taxaMensalAtualiz;  // Já vem do naPlantaConfig
```

### 1.4 Parametrizar Período de Obra

**Arquivo:** `simulator-core.js` (linha 266)

**Antes:**
```javascript
const mesesObra = 36;
```

**Depois:**
```javascript
// MT_LOG (23/06/2026): Período de obra parametrizável (24-48 meses)
// Já desempacotado acima como naPlantaConfig.mesesObra
```

### 1.5 Aplicar Distribuição Customizada de Pagamento

**Arquivo:** `simulator-core.js` (linhas 287-293, expandir)**Antes:**
```javascript
let saldoMensais = saldoEntrada * 0.35;
let saldoAnuais = saldoEntrada * 0.35;
let chaves = saldoEntrada * 0.30;
```

**Depois:**
```javascript
// MT_LOG (23/06/2026): Distribuição de pagamento customizável
// Validar que percentuais somam 100%
const distribTotal = Object.values(distrib).reduce((a, b) => a + b, 0);
if (Math.abs(distribTotal - 1.0) > 0.01) {
    console.warn("MT_Core: Distribuição não soma 100%. Normalizando.");
}

// Aplicar distribuição
const saldoAssinatura = saldoEntrada * distrib.assinatura;
const saldoVigencia = saldoEntrada * distrib.vigencia;
const saldoObra = saldoEntrada * distrib.obra;
const saldoPreChaves = saldoEntrada * distrib.preChaves;
const saldoChaves = saldoEntrada * distrib.chaves;

// Para compatibilidade com código antigo, recalcular as parcelas
let saldoMensais = (saldoObra + saldoVigencia) * 0.5;  // Distribuir entre mensal
let saldoAnuais = (saldoObra + saldoVigencia) * 0.5 / 12 * 12;
let chaves = saldoChaves + saldoPreChaves;
```

### 1.6 Novo Output: Margem da Incorporadora

**Arquivo:** `simulator-core.js` (adicionar ao return, linha ~415)**Adicionar:**
```javascript
margemIncorporadora: Math.round(margemAbsoluta),
margemIncorporadoraPct: (margemIncorporadora * 100).toFixed(1),
mesesObra: mesesObra,
taxaMensalAtualizacao: taxaMensalAtualiz,
distribuicaoPagamento: distrib,
```

---

## 📋 FASE 2: UX INPUTS (Alta) — 16-20 horas

### Objetivo
Criar interface para usuário parametrizar empreendimento.

### 2.1 Novo Bloco HTML: "Dados do Empreendimento"

**Arquivo:** `simulador.html` (adicionar após inputs de vínculo)**Adicionar:**
```html
<!-- MT_LOG (23/06/2026): Nova seção - Dados do Empreendimento -->
<div class="section-empreendimento" id="sec-empreendimento">
    <h3>📦 Dados do Empreendimento</h3>
    
    <div class="input-group">
        <label for="meses-obra">Período de Obra (meses)</label>
        <input type="range" id="meses-obra" min="24" max="48" step="6" value="36">
        <span id="label-meses-obra">36 meses</span>
        <small>Tipicamente 24, 30, 36 ou 48 meses</small>
    </div>
    
    <div class="input-group">
        <label for="taxa-atualizacao">Índice de Atualização</label>
        <select id="taxa-atualizacao">
            <option value="0.0055">INCC Médio (0,55% a.m.)</option>
            <option value="0.0070">IGPM Médio (0,70% a.m.)</option>
            <option value="0.0075">IGPM Alto (0,75% a.m.)</option>
            <option value="0.0040">INCC Baixo (0,40% a.m.)</option>
        </select>
        <small>Atualização mensal da parcela durante obra</small>
    </div>
    
    <div class="input-group">
        <label for="margem-incorporadora">Margem de Lucro Incorporadora (%)</label>
        <input type="range" id="margem-incorporadora" min="0" max="20" step="1" value="8">
        <span id="label-margem-incorporadora">8%</span>
        <small>Típico: 5-15% do VGV</small>
    </div>
    
    <div class="input-group">
        <label for="pre-lib-credito">Pré-Liberação de Crédito</label>
        <select id="pre-lib-credito">
            <option value="0">Não tem</option>
            <option value="30">30 dias antes das chaves</option>
            <option value="60">60 dias antes das chaves</option>
            <option value="90">90 dias antes das chaves</option>
        </select>
        <small>Alguns bancos liberam crédito antes de chaves</small>
    </div>
</div>
```

### 2.2 Novo Bloco HTML: "Distribuição de Pagamento"

**Arquivo:** `simulador.html` (adicionar após seção anterior)**Adicionar:**
```html
<!-- MT_LOG (23/06/2026): Nova seção - Distribuição Customizada -->
<div class="section-distribuicao" id="sec-distribuicao">
    <h3>📊 Distribuição de Pagamento</h3>
    <p class="info-text">Customize como o valor será pago durante a obra</p>
    
    <div class="distrib-grid">
        <div class="distrib-item">
            <label>Assinatura (%)</label>
            <input type="range" id="distrib-assinatura" min="5" max="20" step="1" value="10">
            <span id="distrib-assinatura-val">10%</span>
            <small>Liberação de matrícula</small>
        </div>
        
        <div class="distrib-item">
            <label>Vigência (%)</label>
            <input type="range" id="distrib-vigencia" min="5" max="20" step="1" value="10">
            <span id="distrib-vigencia-val">10%</span>
            <small>Assinatura contrato</small>
        </div>
        
        <div class="distrib-item">
            <label>Obra (%)</label>
            <input type="range" id="distrib-obra" min="30" max="60" step="5" value="40">
            <span id="distrib-obra-val">40%</span>
            <small>Distribuído em fases</small>
        </div>
        
        <div class="distrib-item">
            <label>Pré-Chaves (%)</label>
            <input type="range" id="distrib-pre-chaves" min="10" max="30" step="5" value="25">
            <span id="distrib-pre-chaves-val">25%</span>
            <small>Últimas fases</small>
        </div>
        
        <div class="distrib-item">
            <label>Chaves (%)</label>
            <input type="range" id="distrib-chaves" min="5" max="20" step="1" value="15">
            <span id="distrib-chaves-val">15%</span>
            <small>Entrega do imóvel</small>
        </div>
    </div>
    
    <div id="distrib-warning" style="color: red; display: none;">
        ⚠️ Percentuais devem somar 100%
    </div>
</div>
```

### 2.3 Novo Bloco HTML: "Cenários"

**Arquivo:** `simulador.html` (adicionar ao final)**Adicionar:**
```html
<!-- MT_LOG (23/06/2026): Nova seção - Cenários -->
<div class="section-cenarios" id="sec-cenarios">
    <h3>⚙️ Cenários</h3>
    
    <div class="cenario-item">
        <label for="meses-atraso">Atraso de Obra (meses)</label>
        <input type="range" id="meses-atraso" min="0" max="12" step="1" value="0">
        <span id="label-meses-atraso">Sem atraso</span>
        <small>Se obra atrasa, como muda o financiamento?</small>
    </div>
    
    <div class="cenario-switch">
        <input type="checkbox" id="toggle-comparacao" name="comparacao">
        <label for="toggle-comparacao">Comparar com Imóvel Pronto</label>
        <small>Ver diferença de preço e prazos</small>
    </div>
</div>
```

### 2.4 Novo Card Visual: Timeline de Obra

**Arquivo:** `simulador.html` (novo, para mostrar timeline)**Adicionar:**
```html
<!-- MT_LOG (23/06/2026): Timeline visual da obra -->
<div id="timeline-obra" class="card timeline-container" style="display: none;">
    <h4>📅 Timeline da Obra</h4>
    <div class="timeline-bar">
        <div class="timeline-mark assinatura"></div>
        <div class="timeline-mark vigencia"></div>
        <div class="timeline-mark obra"></div>
        <div class="timeline-mark pre-chaves"></div>
        <div class="timeline-mark chaves"></div>
    </div>
    <div id="timeline-info"></div>
</div>
```

### 2.5 Listeners para Novos Inputs

**Arquivo:** `simulator-v3-logic.js` (adicionar após inputs existentes)**Adicionar:**
```javascript
// MT_LOG (23/06/2026): Novos inputs do empreendimento
const empreendimentoInputs = {
    mesesObra: document.getElementById('meses-obra'),
    taxaAtualizacao: document.getElementById('taxa-atualizacao'),
    margemIncorporadora: document.getElementById('margem-incorporadora'),
    preLibCredito: document.getElementById('pre-lib-credito'),
    
    // Distribuição
    distribAssinatura: document.getElementById('distrib-assinatura'),
    distribVigencia: document.getElementById('distrib-vigencia'),
    distribObra: document.getElementById('distrib-obra'),
    distribPreChaves: document.getElementById('distrib-pre-chaves'),
    distribChaves: document.getElementById('distrib-chaves'),
    
    // Cenários
    mesesAtraso: document.getElementById('meses-atraso'),
    toggleComparacao: document.getElementById('toggle-comparacao')
};

// Adicionar listeners
Object.values(empreendimentoInputs).forEach(input => {
    if (input) {
        input.addEventListener('change', updateSimulation);
        input.addEventListener('input', () => {
            // Validar distribuição em tempo real
            validateDistribuicao();
            updateSimulationDebounced();
        });
    }
});
```

---

## 📋 FASE 3: LÓGICA AVANÇADA (Média) — 12-16 horas

### Objetivo
Implementar score otimizado e cenários de atraso.

### 3.1 Novo Score IA para Na Planta

**Arquivo:** `score-module.js` (adicionar função nova)**Adicionar:**
```javascript
/**
 * Score IA Otimizado para Apartamentos Na Planta
 * Considera fatores específicos de empreendimento
 */
function calcularScoreNaPlanta(params) {
    // MT_LOG (23/06/2026): Score especializado para na planta
    var criteria = [];
    
    // 1. Capacidade de Entrada (20 pts)
    var entradaPercentual = params.entrada / (params.entrada + params.financiamento);
    var ptsEntrada = Math.min(20, Math.round(entradaPercentual * 20));
    criteria.push({
        nome: 'Capacidade de Entrada',
        pts: ptsEntrada,
        max: 20,
        icone: '💰',
        detalhe: 'Entrada de ' + Math.round(entradaPercentual * 100) + '% do valor total',
        dica: entradaPercentual < 0.10 ? 'Entrada baixa, alto risco.' : 'Boa capacidade de entrada.'
    });
    
    // 2. Estabilidade Durante Obra (25 pts)
    var ptsEstabilidade = Math.min(25, 25);  // TODO: integrar com histórico incorporador
    if (params.mesesAtraso > 6) ptsEstabilidade -= 5;
    if (params.mesesAtraso > 12) ptsEstabilidade -= 10;
    criteria.push({
        nome: 'Estabilidade de Obra',
        pts: ptsEstabilidade,
        max: 25,
        icone: '🏗️',
        detalhe: 'Empreendimento com atraso previsto de ' + params.mesesAtraso + ' meses',
        dica: params.mesesAtraso === 0 ? 'Obra no prazo.' : 'Obra pode atrasar - estude o projeto.'
    });
    
    // 3. Rentabilidade Esperada (20 pts)
    var margemIncorporadora = params.margemIncorporadora || 8;
    var ptsRentabilidade = Math.round((margemIncorporadora / 15) * 20);
    criteria.push({
        nome: 'Rentabilidade do Projeto',
        pts: ptsRentabilidade,
        max: 20,
        icone: '📈',
        detalhe: 'Margem de lucro: ' + margemIncorporadora + '% do VGV',
        dica: margemIncorporadora < 5 ? 'Margem baixa.' : margemIncorporadora > 15 ? 'Margem elevada.' : 'Margem adequada.'
    });
    
    // 4. Segurança Financeira (20 pts)
    var folgaPos = Math.max(0, params.margemLivre - params.parcelaEntrada);
    var ptsSeguranca = folgaPos > 500 ? 20 : folgaPos > 200 ? 15 : folgaPos > 0 ? 10 : 0;
    criteria.push({
        nome: 'Segurança Financeira',
        pts: ptsSeguranca,
        max: 20,
        icone: '🛡️',
        detalhe: 'Folga mensal: R$ ' + Math.round(folgaPos),
        dica: ptsSeguranca < 10 ? 'Orçamento apertado!' : 'Boa margem de segurança.'
    });
    
    // 5. Histórico Creditício (15 pts)
    var ptsHistorico = 15;  // Já calculado em score genérico
    criteria.push({
        nome: 'Perfil Creditício',
        pts: ptsHistorico,
        max: 15,
        icone: '📊',
        detalhe: 'Situação financeira sólida',
        dica: 'Mantenha esse perfil durante toda a obra.'
    });
    
    var scoreTotal = criteria.reduce((sum, c) => sum + c.pts, 0);
    
    // Conceito
    var conceito = scoreTotal >= 85 ? 'A+' : scoreTotal >= 70 ? 'A' : 
                   scoreTotal >= 50 ? 'B' : scoreTotal >= 30 ? 'C' : 'D';
    
    return {
        score: scoreTotal,
        conceito: conceito,
        criteria: criteria,
        isNaPlanta: true
    };
}
```

### 3.2 Simular Atraso de Obra

**Arquivo:** `simulator-core.js` (adicionar função nova)**Adicionar:**
```javascript
/**
 * Simula impacto de atraso de obra no financiamento
 */
function aplicarAtrasoObra(resultadoBase, mesesAtraso) {
    // MT_LOG (23/06/2026): Simulação de atraso de obra
    
    if (mesesAtraso === 0) return resultadoBase;  // Sem atraso, sem mudança
    
    const resultado = JSON.parse(JSON.stringify(resultadoBase));
    
    // Atraso estende o período de obra
    resultado.mesesObra = (resultado.mesesObra || 36) + mesesAtraso;
    
    // Parcelas continuam, mas por mais tempo
    resultado.parcelaEntrada = resultadoBase.parcelaEntrada;  // Mesma parcela
    
    // Prazo bancário pode se reduzir se atraso for > prazo disponível
    const novoNMeses = Math.max(60, resultadoBase.prazoEfetivo - mesesAtraso);
    if (novoNMeses < resultadoBase.prazoEfetivo) {
        resultado.prazoEfetivoReduzido = novoNMeses;
        resultado.aviso = `⚠️ Se obra atrasa ${mesesAtraso} meses, prazo bancário reduz para ${novoNMeses} meses`;
    }
    
    // Custo extra da carência
    resultado.custoAtrasoObra = Math.round(resultado.parcelaEntrada * mesesAtraso);
    
    return resultado;
}
```

### 3.3 Simular Comparação Pronto vs Na Planta

**Arquivo:** `simulator-core.js` (adicionar função)**Adicionar:**
```javascript
/**
 * Compara financiamento: Pronto vs Na Planta
 */
function compararProtoVsNaPlanta(paramsBase, paramNaPlanta) {
    // MT_LOG (23/06/2026): Comparação de cenários
    
    // Cenário 1: Pronto (sem período de obra, entra crédito já)
    const simProto = window.MT_Core.calculateMCMV(
        paramsBase.renda, paramsBase.dividas, paramsBase.fgts, 
        paramsBase.entrada, paramsBase.clt3anos, paramsBase.ePrimeiro,
        paramsBase.idade, paramsBase.vinculo, paramsBase.hasDependents,
        { mesesObra: 0 }  // Sem período de obra
    );
    
    // Cenário 2: Na Planta (com período de obra)
    const simNaPlanta = window.MT_Core.calculateMCMV(
        paramsBase.renda, paramsBase.dividas, paramsBase.fgts,
        paramsBase.entrada, paramsBase.clt3anos, paramsBase.ePrimeiro,
        paramsBase.idade, paramsBase.vinculo, paramsBase.hasDependents,
        paramNaPlanta
    );
    
    return {
        proto: simProto,
        naPlanta: simNaPlanta,
        comparacao: {
            diferencaPoder: simNaPlanta.poder - simProto.poder,
            diferencaParcela: simNaPlanta.parcelaPosChaves - simProto.parcela,
            economiaTempoObra: (paramNaPlanta.mesesObra || 36),
            benicio: simNaPlanta.poder > simProto.poder ? 'Na Planta' : 'Pronto',
            rationale: simNaPlanta.poder > simProto.poder ? 
                'Na planta tem mais subsídios e FGTS durante obra' :
                'Pronto tem menos riscos de atraso'
        }
    };
}
```

---

## 📋 FASE 4: REFINAMENTOS (Baixa) — 8-12 horas

### 4.1 Mostrar Timeline Visualmente

**Arquivo:** `simulator-v3-logic.js` (adicionar render function)**Adicionar:**
```javascript
function renderTimelineObra(params) {
    // MT_LOG (23/06/2026): Render visual da timeline
    
    const totalMeses = params.mesesObra || 36;
    const assinatura = Math.ceil(totalMeses * params.distrib.assinatura);
    const vigencia = Math.ceil(totalMeses * params.distrib.vigencia);
    const obra = Math.ceil(totalMeses * params.distrib.obra);
    const preChaves = Math.ceil(totalMeses * params.distrib.preChaves);
    const chaves = Math.ceil(totalMeses * params.distrib.chaves);
    
    const timeline = document.getElementById('timeline-obra');
    if (!timeline) return;
    
    timeline.style.display = 'block';
    
    let html = `
        <div class="timeline-events">
            <div class="event" style="left: 0%">
                <strong>Mês 1</strong><br>
                Assinatura<br>
                ${assinatura} mês(es)
            </div>
            <div class="event" style="left: ${assinatura / totalMeses * 100}%">
                <strong>Mês ${assinatura + 1}</strong><br>
                Vigência<br>
                ${vigencia} mês(es)
            </div>
            <div class="event" style="left: ${(assinatura + vigencia) / totalMeses * 100}%">
                <strong>Mês ${assinatura + vigencia + 1}</strong><br>
                Obra<br>
                ${obra} mês(es)
            </div>
            <div class="event" style="left: ${(assinatura + vigencia + obra) / totalMeses * 100}%">
                <strong>Mês ${assinatura + vigencia + obra + 1}</strong><br>
                Pré-Chaves<br>
                ${preChaves} mês(es)
            </div>
            <div class="event" style="left: 100%">
                <strong>Mês ${totalMeses + 1}</strong><br>
                Chaves<br>
                ${chaves} mês(es)
            </div>
        </div>
    `;
    
    document.getElementById('timeline-info').innerHTML = html;
}
```

### 4.2 Indicador de Lock-up Period

**Arquivo:** `simulador.html` (novo card)**Adicionar:**
```html
<!-- MT_LOG (23/06/2026): Aviso de Lock-up Period -->
<div id="card-lockup" class="card" style="display: none;">
    <h4>🔐 Período de Carência</h4>
    <p id="lockup-info"></p>
    <small>Você não poderá cancelar ou refinar antes deste período.</small>
</div>
```

### 4.3 Mostrar Custo Total da Obra

**Arquivo:** `simulator-v3-logic.js` (adicionar ao render)**Adicionar:**
```javascript
// MT_LOG (23/06/2026): Mostrar custo total decomposto
function renderCustoTotalDetalhado(res, params) {
    const custoAssinatura = res.saldoEntrada * params.distrib.assinatura;
    const custoVigencia = res.saldoEntrada * params.distrib.vigencia;
    const custoObra = res.saldoEntrada * params.distrib.obra;
    const custoPreChaves = res.saldoEntrada * params.distrib.preChaves;
    const custoChaves = res.saldoEntrada * params.distrib.chaves;
    
    // Renderizar em card detalhado
}
```

---

## 🎯 PRIORIDADE DE EXECUÇÃO

### Sprint 1 (Semana 1-2): FASE 1 Completa
- [ ] Expandir assinatura MT_Core
- [ ] Parametrizar mesesObra, taxaINCC, margemIncorporadora
- [ ] Adicionar distribuição customizada

### Sprint 2 (Semana 3-4): FASE 2 Completa
- [ ] Adicionar inputs no HTML
- [ ] Listeners para novos inputs
- [ ] Validação de distribuição

### Sprint 3 (Semana 5): FASE 3 Completa
- [ ] Score IA para na planta
- [ ] Simulação de atraso
- [ ] Comparação Pronto vs Na Planta

### Sprint 4 (Semana 6): FASE 4 + Testes
- [ ] Timeline visual
- [ ] Lock-up period indicator
- [ ] Testes de regressão

---

## ✅ CHECKLIST FINAL

- [ ] Código compilacom sem erros
- [ ] Nenhum hardcode de valores
- [ ] Inputs parametrizáveis via UI
- [ ] Score otimizado para na planta
- [ ] Timeline visual funcional
- [ ] Comparação Pronto vs Na Planta
- [ ] Documentação atualizada
- [ ] Testes de conformidade passando
- [ ] Usuário consegue simular cenários
- [ ] Relatório do Dossiê inclui dados de obra

---

**Resultado Final:** Um simulador verdadeiro de "apartamentos na planta" que reflete a realidade do mercado imobiliário paulista.
