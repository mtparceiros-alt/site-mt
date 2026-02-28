/**
 * micro-animations.js — MT Parceiros
 * Animações baseadas em scroll e interação:
 *   - Fade-in slide-up em seções ao rolar
 *   - Count-up em números/estatísticas
 */

(function () {
    'use strict';

    /* ══════════════════════════════════════════════════════
       1. FADE-IN SLIDE-UP em seções ao rolar a página
       ══════════════════════════════════════════════════════ */
    function initScrollFadeIn() {
        // Seletores que receberão a animação de entrada
        var selectors = [
            '.best-deal .section-heading',
            '.properties .section-heading',
            '.services .section-heading',
            '.contact-us .section-heading',
            '.footer-section .section-heading',
            '.best-deal .item',
            '.properties-items .item',
            '.service-item',
            '.fact-item',
            '.counter-item',
            '.contact-form',
            '#map',
            '.main-banner .caption'
        ];

        var elements = [];
        selectors.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el, idx) {
                if (!el.classList.contains('ma-hidden')) {
                    el.classList.add('ma-hidden');
                    // Delay escalonado para grupos de cards
                    var delayClass = 'ma-delay-' + Math.min(idx + 1, 6);
                    el.classList.add(delayClass);
                    elements.push(el);
                }
            });
        });

        if (!elements.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('ma-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        elements.forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ══════════════════════════════════════════════════════
       2. COUNT-UP em números ao entrar na viewport
       ══════════════════════════════════════════════════════ */
    function animateCountUp(el, target, duration) {
        var start = 0;
        var startTime = null;
        var suffix = el.dataset.suffix || '';
        var prefix = el.dataset.prefix || '';

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease-out cubic
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(eased * target);
            el.textContent = prefix + current.toLocaleString('pt-BR') + suffix;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = prefix + target.toLocaleString('pt-BR') + suffix;
            }
        }

        requestAnimationFrame(step);
    }

    function initCountUp() {
        // Seleciona elementos com data-countup ou que estejam dentro de .counter-item
        var targets = document.querySelectorAll('[data-countup], .counter-item .number, .fact-number');

        if (!targets.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var rawValue = el.dataset.countup || el.textContent.replace(/[^\d]/g, '');
                    var target = parseInt(rawValue, 10);
                    if (!isNaN(target) && target > 0) {
                        animateCountUp(el, target, 1800);
                    }
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        targets.forEach(function (el) {
            // Salvar o valor original como data-countup se não existir
            if (!el.dataset.countup) {
                var num = el.textContent.replace(/[^\d]/g, '');
                if (num) el.dataset.countup = num;
            }
            observer.observe(el);
        });
    }

    /* ══════════════════════════════════════════════════════
       3. FEEDBACK de CLIQUE nos botões (efeito ripple)
       ══════════════════════════════════════════════════════ */
    function initRipple() {
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.main-button a, .schedule-visit-link, .btn, .orange-button');
            if (!btn) return;

            var ripple = document.createElement('span');
            var rect = btn.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height) * 1.5;

            ripple.style.cssText = [
                'position:absolute',
                'border-radius:50%',
                'background:rgba(255,255,255,0.35)',
                'width:' + size + 'px',
                'height:' + size + 'px',
                'left:' + (e.clientX - rect.left - size / 2) + 'px',
                'top:' + (e.clientY - rect.top - size / 2) + 'px',
                'transform:scale(0)',
                'animation:rippleEffect 0.55s ease-out forwards',
                'pointer-events:none'
            ].join(';');

            // Inject keyframes once
            if (!document.getElementById('ma-ripple-style')) {
                var style = document.createElement('style');
                style.id = 'ma-ripple-style';
                style.textContent = '@keyframes rippleEffect{to{transform:scale(1);opacity:0;}}';
                document.head.appendChild(style);
            }

            btn.style.position = 'relative';
            btn.appendChild(ripple);
            setTimeout(function () { ripple.remove(); }, 600);
        });
    }

    /* ══════════════════════════════════════════════════════
       4. INICIALIZAÇÃO
       ══════════════════════════════════════════════════════ */
    function init() {
        initScrollFadeIn();
        initCountUp();
        initRipple();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
