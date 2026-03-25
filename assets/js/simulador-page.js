/**
 * simulador-page.js - MT Parceiros
 * Bootstrap de scripts específicos para a página simulador.html.
 * Lógica complementar que não interfere no motor de cálculo principal.
 */

(function () {
    'use strict';

    function initSimuladorPage() {
        const yearEl = document.getElementById('simulador-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSimuladorPage);
    } else {
        initSimuladorPage();
    }
})();
