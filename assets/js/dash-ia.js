/**
 * =========================================
 * MT PARCEIROS - DASHBOARD IA UNIFICADO (JS)
 * Controla os cliques de Accordion e sincroniza os dados 
 * dos cálculos antigos para renderizar no novo layout.
 * =========================================
 * @version 1.0
 */

(function () {
    // 💡 1. EVENTO DE CLIQUE (ACCORDION) & INIT
    document.addEventListener('DOMContentLoaded', function () {
        // Usa delegação de eventos para ser resistente a re-renderizações
        document.body.addEventListener('click', function (e) {
            const head = e.target.closest('.dash-ia-card-head');
            if (head) {
                const card = head.parentElement;
                card.classList.toggle('expanded');
            }
        });

        // 🎡 Sincronização Forçada Inicial (Garante disparo da animação no load)
        setTimeout(() => {
            const scoreEl = document.getElementById('score-value') || document.getElementById('score-counter');
            if (scoreEl && scoreEl.innerText !== '0') {
                const score = parseInt(scoreEl.innerText.replace(/\D/g, ''), 10);
                if (window.MT_Score) {
                   const s = window.MT_Score.calcular({ renda: 0 }); 
                   // Atualiza o gauge neon se o valor inicial for válido
                   const arc = document.getElementById('score-gauge') || document.getElementById('gauge-arc');
                   if (arc && !isNaN(score)) {
                       const maxStroke = 690;
                       const offset = maxStroke - (score / 100) * maxStroke;
                       arc.style.strokeDashoffset = offset;
                   }
                }
            }
        }, 1000);
    });

    // 🧠 2. HOOK / INTERCEPTADOR DE DADOS
    if (window.MT_Score) {
        const originalAtualizar = window.MT_Score.atualizar;

        window.MT_Score.atualizar = function (params) {
            if (typeof originalAtualizar === 'function') {
                originalAtualizar(params);
            }

            const s = window.MT_Score.calcular(params);
            if (!s) return;

            // d. Salva globalmente para acesso externo se necessário
            window.lastScoreData = s;

            // a. Atualizar Gauge (Número e Legenda)
            const numEl = document.getElementById('score-counter') || document.getElementById('score-value');
            if (numEl) {
                // Animação numérica simples
                let start = 0;
                let end = s.total;
                if (numEl.innerText !== '0') start = parseInt(numEl.innerText, 10) || 0;
                
                const duration = 1000;
                const startTime = performance.now();
                
                function animate(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const current = Math.floor(progress * (end - start) + start);
                    numEl.innerText = current;
                    if (progress < 1) requestAnimationFrame(animate);
                    else numEl.innerText = end;
                }
                requestAnimationFrame(animate);
            }

            const conceptEl = document.getElementById('score-concept') || document.getElementById('profile-status');
            if (conceptEl) {
                conceptEl.innerText = s.conceito;
                conceptEl.style.color = s.corHex;
            }

            // ARC SVG NEON (Sincronizado com o design real)
            const arc = document.getElementById('score-gauge') || document.getElementById('gauge-arc');
            if (arc) {
                const maxStroke = 691;
                const offset = maxStroke - (s.total / 100) * maxStroke;
                arc.style.strokeDashoffset = offset;
                arc.style.stroke = s.corHex; // Aplica a cor do conceito (A, B, C...)
            }

            // b. Atualizar Critérios (6 mini bars)
            _updateNeonCriteria(s.criteria);

            // c. Recomendação IA Dinâmica
            const recEl = document.getElementById('ia-recommendation-text');
            if (recEl) {
                let txt = `"Com base no seu Score de <strong>${s.total}</strong>, identificamos um perfil de <strong>${s.total > 70 ? 'Altíssima' : 'Média'} Viabilidade</strong>. `;
                if (s.total > 80) {
                    txt += `Recomendamos o enquadramento no <strong>SBPE Flex</strong> para o melhor aproveitamento de taxas."`;
                } else if (s.total > 50) {
                    txt += `O programa <strong>Minha Casa Minha Vida</strong> é o ideal, garantindo o subsídio máximo de até R$ 55 mil."`;
                } else {
                    txt += `Sugerimos uma composição de renda para elevar seu poder de compra imediatamente."`;
                }
                recEl.innerHTML = txt;
            }
        };
    }

    /**
     * Auxiliar: Atualiza as 6 barrinhas de critérios.
     */
    function _updateNeonCriteria(criteria) {
        if (!criteria) return;
        const idMap = [
            'comprometimento', // 1. Comprometimento de Renda
            'historico',       // 2. Nível de Endividamento
            'fgts',            // 3. Saldo FGTS
            'entrada',         // 4. Capital Próprio
            'renda',           // 5. Vínculo Empregatício
            'idade'            // 6. Prazo Disponível (Idade)
        ];
        criteria.forEach((c, idx) => {
            const key = idMap[idx];
            const ptsEl = document.getElementById(`pts-${key}`);
            const barEl = document.getElementById(`bar-${key}`);
            if (ptsEl) ptsEl.innerText = `${c.pts}/${c.max} pts`;
            if (barEl) {
                const pct = Math.round((c.pts / c.max) * 100);
                barEl.style.width = pct + '%';
                let cor = '#40e17e'; // neon green
                if (pct < 40) cor = '#ffb4ab'; // error/red
                else if (pct < 70) cor = '#ffb5a0'; // primary/orange
                barEl.style.backgroundColor = cor;
            }
        });
    }
})();
