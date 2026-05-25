# 🗺️ GUIA DE JORNADA: DESENVOLVIMENTO DOSSIÊ V6/V7

Este guia serve como bússola para o desenvolvimento e manutenção do Dossiê do Investidor MT. Aqui está o mapa da arquitetura atual e as diretrizes para evolução.

---

## 📂 1. Estrutura de Arquivos (Onde está o quê?)

### 🌐 Interface Principal
*   **`dossie.html`**: O "Palco". Contém a estrutura HTML, os controladores de UI (Bento Cards, Mapas) e a lógica de hidratação inicial.

### 🧠 Motores de Lógica (Assets/JS)
*   **`assets/js/dossie-engine.js`**: O **CÉREBRO**. Contém os cálculos de Match, parsing de preços e a busca de alvos (Goal Posts). *Independente de UI.*
*   **`assets/js/dossie-strategy.js`**: O **COCKPIT**. Gerencia os sliders de ajuste de perfil, a composição de renda e a sincronização do "Ponto de Equilíbrio".
*   **`assets/js/dossie-carousel.js`**: O **PORTFÓLIO**. Responsável pela vitrine de imóveis, cálculo de déficit em tempo real nos cards e ordenação inteligente.
*   **`assets/js/dossie-fluxo.js`**: O **CRONOGRAMA**. Controla a linha do tempo de pagamentos e parcelamento de obra.
*   **`assets/js/dossie-pilot.js`**: O **ASSISTENTE**. Controla o Smart Floater mobile e o progresso da jornada.
*   **`assets/js/simulator-core.js`**: O **NÚCLEO CAIXA**. Contém as fórmulas proprietárias de financiamento MCMV/SBPE.

### 📊 Dados
*   **`empreendimentos.js`**: O **BANCO DE DADOS**. Catálogo oficial de imóveis com UIDs únicos.

---

## 🛡️ 2. Segurança e Backups

O ponto de restauração oficial para qualquer erro crítico é:
📍 **`bkps/BKP_DOSSIE_ESTAVEL_V6/`**

> **Importante:** Sempre que uma fase do plano for concluída com sucesso e validada pelo usuário, um novo backup deve ser criado.

---

---

## 🚀 3. Plano de Evolução (Estratégia V9.8) - STATUS: [STABLE / HYDRATION & LEAK-PROOF OK]

O Cockpit opera sob o conceito de **"Simplicidade Inteligente"**, garantindo que o investidor tenha controle absoluto e linear sobre sua viabilidade.

### ✅ Sincronia Total e Alavancagem (V8.9) - STATUS: OK
- **[CONCLUÍDO]** Refinamento da Alavanca de Crédito (Novo Proponente).
- **[CONCLUÍDO]** Sincronização de KPIs (Ganho de Poder, Cobertura, Enquadramento).
- **[CONCLUÍDO]** Engenharia de Eficiência (Detector de Penhasco de Subsídio).

### ✅ Composição de Renda e Blindagem (V9.5) - STATUS: OK
- **[CONCLUÍDO]** Lógica de Composição (Soma de Proponentes vs Substituição).
- **[CONCLUÍDO]** Blindagem de Cotista (Taxa 4.5% protegida via OR).
- **[CONCLUÍDO]** Composição de Idade (Math.max para definição de prazo).

### ✅ Estabilização de Fluxo e Prazos (V9.6) - STATUS: OK
- **[CONCLUÍDO]** Hidratação do Acordeão Premium (17 elementos HTML).
- **[CONCLUÍDO]** Cálculo de Meses Reais (Data Atual vs Data de Entrega).
- **[CONCLUÍDO]** Lógica de Imóvel "Pronto" (Resíduo no Ato).
- **[CONCLUÍDO]** Barra de Composição Visual Proporcional.

### ✅ Espelho do Teto de Compra (V9.7) - STATUS: OK
- **[CONCLUÍDO]** Fim dos zeros (`R$ 0.000`) na carga inicial do fluxo.
- **[CONCLUÍDO]** Renderização automática do máximo poder financeiro (Teto de Compra) antes do primeiro clique de imóvel no carrossel.
- **[CONCLUÍDO]** Adaptação do card de entrada para exibir com inteligência a frase `"100% Coberta"`.

### ✅ Blindagem Total contra Vazamentos - Falha 2 (V9.8) - STATUS: OK
- **[CONCLUÍDO]** Fim do "Vaso Comunicante" de sliders adicionais.
- **[CONCLUÍDO]** Amnésia Estratégica Extendida para limpar e resetar todo o perfil lógico (`window._strategyProfile`) e visual (FGTS, Idade, Vínculo, Cotista) na troca voluntária de imóvel.

### ✅ Aprovador Universal & Tracking (V10.0) - STATUS: OK
- **[CONCLUÍDO]** Unificação dos 3 botões de conversão (IA, Sidebar, Rodapé).
- **[CONCLUÍDO]** Captura global de Variáveis de Contexto (`window.lastMatchResult`, `window._strategyOverrides`, `window.docState`).
- **[CONCLUÍDO]** Formatação de Laudo Avançado para WhatsApp (Padrão UTF-8) com Emojis.
- **[CONCLUÍDO]** Identificação de Tracking de Origem (Card IA, Checklist, Rodapé) para métricas do corretor.

---

## 🚀 Próxima Fase: Integração CRM e Automação (V11.0+)

O sistema agora é estável, preciso e possui um Aprovador Universal de altíssima conversão. O próximo salto é integrar o envio passivo (invisível) desses dados ricos para o CRM (HubSpot/AppSheet) no exato momento do clique, antes mesmo do cliente abrir o WhatsApp.

---

## 🛠️ 5. Engenharia de Fluxo (V9.6/V9.8) - Flow Build
- **Hidratação Unificada:** Função `hydrateFluxoPremium` centraliza a alimentação dos dois sistemas de UI.
- **Prazos Dinâmicos:** Uso de `DossieEngine.getMesesParaEntrega` para refletir a realidade do cronograma de obra.
- **Resíduo Real:** Cálculo matemático preciso considerando todos os pilares (Subsídio, FGTS, Entrada, Financiamento).
- **Amnésia Lógica & UI:** Reset absoluto das variáveis adicionais no seletor de carrossel de curadoria.

---

📍 **Ponto de Segurança V9.8 (Sliders Leak Fixed):** `bkps/BKP_V9_8_PRE_SLIDER_LEAK_FIX/`

---
**MT_LOG (18/05/2026)** - Homologação do Aprovador Universal (V10.0). O ecossistema agora extrai 100% dos dados manipulados pelo usuário no Cockpit e injeta em um laudo rico via WhatsApp, rastreando a origem da conversão.

---
*Atualizado em: Maio de 2026 - MT IA Assistant*
