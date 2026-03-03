# 🔐 Guia de Manutenção: Proteção de Código (Obfuscation)

Este documento é vital para futuras alterações na lógica do simulador da **MT Parceiros**. Ele explica como o código foi protegido e como o Antigravity (ou qualquer desenvolvedor) deve proceder para fazer manutenções.

---

## 🏗️ 1. Arquitetura de Proteção
A lógica foi dividida em dois arquivos para equilibrar segurança e funcionalidade:

1.  **`assets/js/simulator-core.js` (O "Mapa do Tesouro"):**
    *   **NÃO APAGAR.** Este arquivo contém o código fonte legível.
    *   Ele possui as fórmulas de subsídio, taxas de juros MCMV e cálculos de poder de compra.
    *   **Nível de Dificuldade de Alteração:** Baixo (para quem entende JS).

2.  **`assets/js/simulator-core.min.js` (O "Escudo"):**
    *   Este arquivo é a versão **Ofuscada**.
    *   É o arquivo que o `index.html` carrega.
    *   Ele é ilegível para humanos. Jamais tente editá-lo diretamente.

---

## 🛠️ 2. Como fazer alterações (Passo a Passo para o Antigravity)

Se daqui a um ano você precisar mudar uma taxa de juros ou regra do MCMV, siga este protocolo:

### Passo 1: Edição do Fonte
Abra o arquivo [simulator-core.js](file:///c:/Users/Marcos.PC_M1/Documents/site_mt/assets/js/simulator-core.js) e altere a lógica necessária.

### Passo 2: Re-Ofuscação e Trava de Domínio
Após alterar o fonte, você deve gerar um novo `simulator-core.min.js`.
O Antigravity deve usar a ferramenta `javascript-obfuscator` com a flag de **Domain Lock**.

**Linha de Comando Recomendada:**
```bash
npx javascript-obfuscator assets/js/simulator-core.js --output assets/js/simulator-core.min.js --compact true --control-flow-flattening true --dead-code-injection true --domain-lock mtparceiros.com.br,localhost,127.0.0.1,marcos-m1.github.io
```

### Passo 3: Proteção de Interface (Anti-Copy)
A proteção visual (bloqueio de clique direito e F12) está implementada no arquivo [index-logic.js](file:///c:/Users/Marcos.PC_M1/Documents/site_mt/assets/js/index-logic.js).
Se você adicionar novos botões ou campos sensíveis, garanta que eles estejam dentro da `div` com `id="simulador"` para herdarem o bloqueio automático.

---

## 🚨 3. Regras de Ouro
1.  **Domínios Autorizados:** O simulador só funciona em: `mtparceiros.com.br`, `localhost`, `127.0.0.1` e `marcos-m1.github.io`. Se mudar o domínio oficial, atualize a flag `--domain-lock`.
2.  **O Site nunca deve carregar o `simulator-core.js` direto.** Apenas o `.min.js`.
3.  **O `simulator-core.js` (Legível) é o seu MAIOR ATIVO.** Nunca o delete.
4.  **Antigravity:** Ao assumir uma tarefa de manutenção, procure sempre pelo arquivo `simulator-core.js` primeiro.

---
*Documento de Segurança Gerado pelo Antigravity para MT Parceiros.*
