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
    if (!document.getElementById('map')) return;
    if (typeof L === 'undefined') return;

    var map = L.map('map').setView([-23.55, -46.63], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    }).addTo(map);

    // Botão "Minha Localização"
    var LocationControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-location');
            var link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.title = 'Minha Localização';
            link.innerHTML = '📍';
            link.style.fontSize = '18px';
            link.style.lineHeight = '30px';
            link.style.textAlign = 'center';

            L.DomEvent.on(link, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                if (window.location.protocol === 'file:') {
                    alert("A geolocalização automática é bloqueada por segurança em arquivos locais (abertos diretamente da pasta). Para testar este botão, o site precisa estar em um servidor (http/https).");
                    return;
                }
                map.locate({ setView: true, maxZoom: 15 });
            });
            return container;
        }
    });
    map.addControl(new LocationControl());
    map.on('locationerror', function () { alert("Não foi possível obter sua localização."); });

    // Função para definir cor baseada no status (Compartilhada conceitualmente)
    function getCorPorStatus(entrega) {
        if (!entrega) return '#f35525';
        var texto = entrega.toLowerCase();
        if (texto.indexOf('lançamento') !== -1 || texto.indexOf('lancamento') !== -1) return '#007bff';
        if (texto.indexOf('pronto') !== -1) return '#28a745';
        return '#f35525';
    }

    if (typeof EMPREENDIMENTOS !== 'undefined' && EMPREENDIMENTOS.length) {
        var bounds = [];
        EMPREENDIMENTOS.forEach(function (e) {
            if (!e.lat || !e.lng) return;

            var cor = getCorPorStatus(e.entrega);
            var icone = L.divIcon({
                className: '',
                html: '<div style="background:' + cor + ';width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 20],
                popupAnchor: [0, -22]
            });

            var popup = '<div style="font-family:Poppins,sans-serif;min-width:190px;">'
                + '<strong style="color:' + cor + ';font-size:14px;">' + e.nome + '</strong><br>'
                + (e.bairro ? '<span style="font-size:12px;">📍 ' + e.bairro + '</span><br>' : '')
                + (e.preco ? '<strong style="color:#1a1a2e;font-size:13px;">A partir de ' + e.preco + '</strong><br>' : '')
                + (e.entrega ? '<span style="font-size:11px;color:#888;">Entrega: ' + e.entrega + '</span><br>' : '')
                + '<a href="#!" class="schedule-visit-link" data-emp-nome="' + e.nome + '" '
                + 'style="display:inline-block;margin-top:8px;padding:6px 12px;background:#1e1e1e;color:#fff;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;">'
                + '📅 Agendar Visita</a></div>';

            L.marker([e.lat, e.lng], { icon: icone }).addTo(map).bindPopup(popup);
            bounds.push([e.lat, e.lng]);
        });
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    }
}
