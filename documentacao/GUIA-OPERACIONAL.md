# GUIA OPERACIONAL — Site MT Parceiros

Este manual centraliza as instruções para edição, manutenção e publicação do site, integrando as regras de mercado de 2026 e a arquitetura da nova geração de simuladores.

---

## 1. Estrutura do Ecossistema MT Parceiros

| Arquivo | Função | Status |
| :--- | :--- | :--- |
| `index.html` | Home Page com atalho para simulador e destaques. | Produção |
| `simulador.html` | Simulador Principal (v1) e Plano de Pagamento. | Produção |
| `simulador-v2.html` | **Nova Geração Neon (v2.1)** — Interface Premium. | Homologação |
| `properties.html` | Listagem de imóveis e Mapa Geográfico. | Produção |
| `property-details.html` | Detalhes específicos de cada imóvel. | Produção |
| `empreendimentos.js` | Banco de Dados dinâmico dos imóveis. | Automático |

---

## 2. Regras de Crédito (São Paulo Capital 2026)

O core matemático do simulador (`simulator-core.js`) utiliza as regras vigentes no mercado imobiliário paulista para Enquadramento e ITBI.

### 🏢 Enquadramento HIS/HMP (Decreto SP 64.895/2026)
| Categoria | Renda Familiar Máxima | Benefício |
| :--- | :--- | :--- |
| **HIS-1** | R$ 4.863,00 | **Isenção Total de ITBI** |
| **HIS-2** | R$ 9.726,00 | Taxa MCMV Reduzida |
| **HMP** | R$ 16.210,00 | Financiamento CVA |

### 💰 Taxas e Subsídios (Minha Casa Minha Vida)
- **Teto Imóvel SP Capital**: Faixas 1/2 (R$ 275k) / Faixa 3 (R$ 400k) / Faixa 4 (R$ 600k).
- **Subsídio Federal**: Até R$ 55.000 (ajustado por dependentes).
- **Casa Paulista (Estadual)**: Bônus de R$ 16.000 para rendas até HIS-1 na Capital.

---

## 3. Arquitetura Técnica: Simulador v1 (Atual)

O simulador residente em `simulador.html` é o motor de conversão principal hoje.

### Fluxo de Funcionamento:
1. **Inputs**: Usuário move sliders em `index-logic.js`.
2. **Cálculo**: `MT_Core.calculateMCMV()` no arquivo `simulator-core.js`.
3. **Score IA**: `MT_Score.calcular()` gera a nota de 0 a 100 via `score-module.js`.
4. **Renderização Gold**: A interface premium escura é injetada via `new-results.js`.

---

## 4. Geração 2.1: Simulador Neon (v2.1 / Stitch2)

Este projeto (`simulador-v2.html`) representa a próxima evolução estética do site, com design "Dark Neon" e Bento Grid em real-time.

### Componentes Críticos (v2.1):
- **Bento Grid**: 4 cards dinâmicos (`card-subsidio-val`, `card-fgts-val`, etc.) atualizados ao vivo.
- **Gauge Vetorial SVG**: Indicador de Score com efeito de brilho (*Bloom*).
- **IDs Padronizados**: `sim-name`, `sim-celular`, `val-fgts`.
- **Motor de Renderização**: `new-results-v2.js` e `dash-ia.js`.

---

## 5. Guia de Manutenção e Segurança

### 🛡️ Proteção de Código (Pipeline .min)
O site utiliza uma política de "Tolerância Zero" para código legível em produção.
1. **Edição**: Sempre edite os arquivos `.js` originais na pasta `assets/js/`.
2. **Build**: `npm run build` ofusca os scripts para `.min.js` no diretório `dist/`.
3. **Deploy**: `npm run deploy` sincroniza a pasta `Site_MT_Final` (visível ao GitHub).

### 📁 Política de Backups (Nova)
Após a limpeza de Abril/2026, todos os backups e arquivos obsoletos devem ser movidos para a pasta:
`_limpeza_backup/`
*Não mantenha arquivos `.bkp` ou `.bak` no diretório raiz ou em assets ativos.*

### ⚡ Sistema Anti-Vibração v3
Para evitar trepidação no layout durante o uso dos sliders:
- **JS**: Usa `requestAnimationFrame` (throttle) no `index-logic.js`.
- **CSS**: Usa `contain: layout` no container de resultados.

### 🌓 Ajustes de Layout e Sincronia
- **Gaps Visuais**: Seções com a classe `.video-no-gap-top` sincronizam automaticamente o fundo com a seção anterior para evitar faixas brancas.
- **Ícones Flutuantes**: Usam sistema de centralização absoluta (Flexbox) para garantir visibilidade perfeita em qualquer resolução (PC/Mobile).

---

| `node scripts/optimize-images.js` | Converte imagens PNG para JPG Otimizado (LCP < 2.5s). |

### 📊 Contadores Automáticos
O site utiliza a função `syncIndexCounters()` (em `index-logic.js`) para garantir que os dados de "Fun Facts" sejam reais e não estáticos:
1. **Empreendimentos**: Conta automaticamente as chaves no objeto `DNA_DATA` (em `dna-data.js`).
2. **IDs Críticos**: O elemento HTML deve possuir o ID `count-empreendimentos` para ser atualizado dinamicamente.

---

## 7. Roadmap e Ideias Futuras

### 🔗 Integração HubSpot CRM (Ideia)
Planejado para capturar Nome, WhatsApp e Valor de Compra via API v3. 
*Status: Aguardando implementação técnica (Script `hubspot-sync.js` inexistente).*

### ☁️ Sincronização Google Drive
Migrar a fonte do `sync_cms.py` do Excel local para uma Google Sheet compartilhada na nuvem.

---

## 8. Padrão de Comentários (MT_LOG)
Para facilitar a auditoria e manutenção futura, alterações críticas de layout e lógica devem ser marcadas com o prefixo:
`// MT_LOG (Mês/Ano): Descrição da alteração`

---
---
## 9. Melhorias de Layout (Abril/2026)

### 📱 Grid Técnico Mobile (2 Colunas)
Para reduzir o scroll vertical, as tabelas de especificações (`.info-table`) agora usam `display: grid` com 2 colunas no mobile.
- **Arquivo**: `assets/css/templatemo-villa-agency.css` -> `@media (max-width: 767px)`.
- **Destaque**: Alinhamento central forçado via `flex + text-align` para cards harmônicos.

### 📈 Card de Valorização (6º Item)
Adicionamos o card de **VALORIZAÇÃO** para preencher a grade (3x2 no mobile).
- **Lógica**: Baseada no lucro estimado (Nota DNA * Tempo de Obra). 
- **Padrão Estético**: Label em cinza, valor em **Laranja (#f35525)**.

---
> **Última Atualização:** 17 de Abril de 2026 — Otimização Mobile (Grid 2 Colunas) e Card de Valorização.

---

### 🚀 Fase 3: Simulador v3 (Reconstrução Total)

Em Abril de 2026, iniciamos a construção do **MT Parceiros Simulador v3** do zero. O objetivo é superar a complexidade do v2 com uma arquitetura mais limpa, performática e com design de "Dossiê Financeiro".

**Principais Pilares do v3:**
1.  **UX Gold & Vidro**: Uso intensivo de glassmorphism, tipografia Plus Jakarta Sans e paletas de cores neon em fundo escuro (Night Mode).
2.  **Feedback IA em Tempo Real**:
    *   **Status do Perfil**: Barra de progresso dinâmica que mede o engajamento do lead.
    *   **IA Coach**: Sistema de "Score Boost" que ensina o usuário a melhorar seu perfil.
3.  **Transição de Autoridade**: Animação de processamento oficial (Círculo Expandido + Bola Laranja GIF) para validar o laudo técnico.
4.  **Estratégia de Resultados (Step 4)**: Integração do componente "Dossiê do Investidor" (visto em `code.html`) como a fase final de entrega de valor e conversão WhatsApp.

### 🚀 Fase 3: Simulador v3 (Concluída - Abr/2026)

O **MT Parceiros Simulador v3** foi finalizado e homologado como a nova interface principal de simulação. 

**Refinamentos de Alta Fidelidade (V3.2):**
1.  **Zero-Start Experience**: O simulador inicia com valores zerados, garantindo que o usuário interaja com os sliders para ver o poder de cálculo da IA.
2.  **Smart-Hide Logic (36x)**: O rótulo "36x" da entrada parcelada possui visibilidade condicional via JS; ele só aparece quando a barra amarela tem largura > 5% para evitar poluição visual.
3.  **Compactação Mobile-First**:
    *   **Perfis Técnicos**: Seções de "Perfil Financeiro" e "Identificação Profissional" foram verticalmente compactadas no mobile com redução de gaps e ocultação de descrições secundárias.
    *   **Dynamic Hide**: O card principal de resultados é ocultado no mobile assim que a Entrada é 100% coberta, priorizando espaço para o Dossiê.
4.  **Paridade de Header (1320px)**: O cabeçalho customizado foi realinhado de 1536px para 1320px para manter simetria total com o `index.html`.

**Pipeline de Publicação:**
- Sempre utilize `npm run build` para gerar a versão ofuscada em `dist/`.
- O script `copy-assets.js` traduz automaticamente as chamadas JS para `.min.js`.
- Utilize `npm run deploy` para sincronizar o repositório local de produção (`Site_MT_Final`).

---

## 10. Atualizações Críticas (Março/Abril 2026)

### 📈 Motor Financeiro 2026 (Premium Upgrade e Blindagem)
- **Margem CLT**: Elevada para **32%** (anteriormente 30%). Esta alteração reflete a maior agressividade de aprovação da Caixa para perfis estáveis.
- **Poder de Compra Integrado**: O valor total exibido soma: `Financiamento + Subsídios + Entrada Facilitada (36x)`. 
- **Trava de Segurança (Abril/2026)**: Para evitar "Multi-Poder" ilusório, o motor limita o Fôlego de Obra de forma que o comprometimento total (Parcela Banco + Parcela Obra) nunca ultrapasse **35% da renda** (`margemMaximaSegura`).
- **Subsídio Federal**: Aplicada interpolação matemática suave (sem degraus) para rendas acima de R$ 3.200.
- **ITBI SP**: Teto de isenção corrigido para **R$ 245.527,77** (Valor oficial Sec. Fazenda Municipal SP 2026).

### 🔒 Auditoria de Compliance (23/Abril/2026)
Após cruzamento com as normas vigentes (Portaria MCID 333, Tabela Caixa SE/CO, Decreto SP 64.895):
- **Teto Imóvel F1/F2**: Corrigido de R$ 350.000 para **R$ 275.000** (SP Capital — Metrópole).
- **Taxa Juros F1 (Cotista)**: Corrigida de 4,25% para **4,50%** (Região Sudeste).
- **Taxa Juros F1 (Não-Cotista)**: Corrigida de 4,75% para **5,00%** (Região Sudeste).
- **ITBI Isenção**: Corrigido de R$ 254.800 para **R$ 245.527,77**.
- Itens validados sem alteração: Faixas de renda, HIS/HMP, Casa Paulista, SAC, MEI, Seguros, Prazo/Idade.

### 👔 Calibração de Perfis por Vínculo (23/Abril/2026)
Após análise das regras bancárias por tipo de vínculo empregatício:

| Perfil | Fator Renda | Margem | Cotista FGTS | Observação |
| :--- | :--- | :--- | :--- | :--- |
| **CLT** | 100% | 32% | ✅ (se 3+ anos) | Perfil padrão |
| **Aposentado** | 100% | 32% | ❌ | Renda estável (benefício INSS) |
| **Funcionário Público** | 100% | **30%** | ❌ | Vantagem na aprovação, não na margem |
| **Autônomo** | **80%** | 30% | ❌ | Redutor de risco bancário (extrato) |
| **MEI** | **80% de R$ 6.750** | 30% | ❌ | Teto + dedução operacional |

### 📐 Padrão de Simetria Visual (Desktop)
- **Equalização de Colunas**: No simulador, a coluna de inputs (Direita) deve sempre alinhar seu botão final com o rodapé dos quadros de resultado (Esquerda).
- **Check-Grid**: Para economizar espaço vertical, as opções de qualificação adicional devem usar `grid-cols-3` no Desktop.

---

## 11. Dossiê do Investidor e Co-Piloto IA (Abril/2026)

O **Dossiê do Investidor** (`dossie.html`) é a peça final do funil de conversão, transformando a simulação em um laudo técnico de autoridade.

### 🧠 Arquitetura do Co-Piloto (Pilot)
O balão flutuante mobile funciona como um assistente de jornada em 3 estágios:
1.  **Passo 1 (Viabilidade)**: Monitora `window.docState`. Enquanto houver pendências no checklist, ele incita o usuário a validar documentos.
2.  **Passo 2 (Seleção)**: Desbloqueado quando o lead completa o checklist. Ativa a visão expandida do portfólio de empreendimentos sugeridos pela IA.
3.  **Passo 3 (Aprovação)**: O estágio final de "Aprovação Profissional". Ativado quando o lead seleciona um imóvel específico, liberando o botão animado (*Bounce*) para conversão direta no WhatsApp.

### 💾 Persistência e Hidratação
- **localStorage**: Os dados são transmitidos do simulador para o dossiê via chave `mt_sim_data`.
- **Integridade Visual**: O dossiê utiliza fallbacks de imagem (`onerror`) para garantir que o dashboard nunca exiba cards vazios em caso de falha de API ou links expirados.

---
## 12. Matching Engine v5.1: Lógica de Preditividade e Match (Maio/2026)

Em Maio de 2026, implementamos a **Opção 3 (Filtro de Pessimismo Saudável)** para resolver discrepâncias entre o Simulador e o Dossiê.

### 🧠 Lógica de Sincronização (Opção 3)
Para garantir que o "Match" no Portfólio seja 100% fiel ao que o cliente viu no simulador, o motor agora opera em dois estados:

1.  **Estado Base (Modo Protegido)**:
    - Enquanto os sliders de "Ajustar Perfil" estiverem em zero, o Dossiê utiliza o **Poder de Compra do Cache** (vindo do simulador) como teto absoluto.
    - Isso evita que micro-discrepâncias de cálculo (como centavos ou fôlego de obra) transformem imóveis inviáveis em "Match".
2.  **Estado Ativo (Modo Dinâmico)**:
    - Assim que o usuário ajusta a Renda ou Entrada, o sistema libera o **Recálculo Live**.
    - O novo poder é o resultado do motor financeiro, mas garantimos que ele nunca seja menor que o ponto de partida original do cache.

### ⚙️ Parâmetros de Validação
- **Tolerância Técnica**: R$ 100,00 (apenas para flutuações de arredondamento).
- **Referência de Corte**: `valorImovel` (Teto Líquido e Seguro).
- **Paridade de Inputs**: O dossiê agora herda obrigatoriamente `vinculo`, `idade`, `dividas` e `dependentes` para que o cálculo matemático seja idêntico ao original.

---
*MT Parceiros - Engenharia e IA - Última atualização: 01 de Maio de 2026 – Implementação do Matching Engine v5.1 (Opção 3).*

---

## Anexo: Procedimento Rápido — Publicação no GitHub Pages (Novo Fluxo 2026)

O fluxo de publicação foi modernizado para ser extremamente simples e blindar o código-fonte (removendo a dependência da antiga pasta `Site_MT_Final` e do `robocopy`).

Para publicar qualquer atualização (seja HTML, CSS, JS ou novos empreendimentos no catálogo), siga **APENAS** este passo:

1. Abra o terminal (PowerShell ou no VSCode) na raiz do projeto (`C:\Users\Marcos.PC_M1\Documents\site_mt`).
2. Execute o comando:
   ```powershell
   npm run build ; npm run deploy
   ```

**O que o comando faz:**
- `npm run build`: Empacota todo o site, ofusca o JavaScript e copia tudo para a pasta `dist/`.
- `npm run deploy`: Envia **automaticamente** os arquivos minificados da pasta `dist/` para a branch oculta `gh-pages` no GitHub. O site entrará no ar em cerca de 1 a 2 minutos.

**E o GitHub Desktop?**
- Use o GitHub Desktop **apenas** para salvar/fazer backup do seu código-fonte legível (branch `main`). 
- As regras do `.gitignore` já bloqueiam pastas grandes (`node_modules`) e arquivos de banco de dados (`Empreendimentos.xlsx`) para não vazar informações na internet.
