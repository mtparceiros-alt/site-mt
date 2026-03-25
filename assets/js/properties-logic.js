/**
 * properties-logic.js - MT Parceiros
 * Lógica específica para a página de Empreendimentos.
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Renderiza a lista completa de empreendimentos
    if (typeof renderListaCompleta === 'function') {
        renderListaCompleta('#properties-container');
    }

    // 2. Inicializa o Mapa (Leaflet)
    initPropertiesMap();
});

function initPropertiesMap() {
    if (window.MT_Utils && window.MT_Utils.initMap) {
        window.MT_Utils.initMap('map', { popupBtnText: '📅 Agendar Visita' });
    }
}
