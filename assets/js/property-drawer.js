/**
 * property-drawer.js — MT Parceiros
 * Lógica para gerenciar o Drawer de detalhes dos empreendimentos
 * com calendário incorporado e mini mapa de localização.
 *
 * ATUALIZAÇÃO (Abr/2026):
 *   - Mini Mapa Leaflet adicionado abaixo do calendário.
 *   - Guard clause protege páginas sem Leaflet (ex: property-details.html).
 */

(function () {
    'use strict';

    var drawer, backdrop;
    var closeBtn, btnWhatsapp;
    var contentImg, contentBadge, contentTitle, contentPrice, contentSpecs, contentDesc, inlineCalendar;

    // 🗺️ Mini Mapa — Instâncias reutilizáveis (evita vazamento de memória)
    var drawerMap = null;
    var drawerMarker = null;

    var currentProperty = null;
    var selectedDate = null;
    var currentCalendarDate = new Date();

    function init() {
        injectHTML();

        drawer = document.getElementById('ma-property-drawer');
        backdrop = document.getElementById('ma-drawer-backdrop');
        closeBtn = drawer.querySelector('.ma-drawer-close');
        btnWhatsapp = drawer.querySelector('.ma-drawer-btn-whatsapp');

        contentImg = drawer.querySelector('.ma-drawer-img');
        contentBadge = drawer.querySelector('.ma-drawer-badge');
        contentTitle = drawer.querySelector('.ma-drawer-title');
        contentPrice = drawer.querySelector('.ma-drawer-price');
        contentSpecs = drawer.querySelector('.ma-drawer-specs');
        contentDesc = drawer.querySelector('.ma-drawer-description');
        inlineCalendar = drawer.querySelector('#ma-drawer-inline-calendar');

        // Listeners
        closeBtn.addEventListener('click', closeDrawer);
        backdrop.addEventListener('click', closeDrawer);

        // Delegar cliques nos botões "Agende uma visita"
        document.addEventListener('click', function (e) {
            var target = e.target.closest('.schedule-visit-link');
            if (target && target.dataset.empNome) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                openDrawer(target.dataset.empNome);
            }
        }, true); // Usando capture phase para garantir que pegamos o clique antes de outros
    }

    function injectHTML() {
        if (document.getElementById('ma-property-drawer')) return;

        var html = '<div id="ma-drawer-backdrop" class="ma-drawer-backdrop"></div>' +
            '<div id="ma-property-drawer" class="ma-drawer">' +
            '  <div class="ma-drawer-header">' +
            '    <h2 class="ma-drawer-title">Detalhes</h2>' +
            '    <button class="ma-drawer-close">&times;</button>' +
            '  </div>' +
            '  <div class="ma-drawer-body">' +
            '    <div class="ma-drawer-img-container">' +
            '      <img src="" alt="" class="ma-drawer-img">' +
            '      <span class="ma-drawer-badge"></span>' +
            '    </div>' +
            '    <div class="ma-drawer-content-inner">' +
            '      <div class="ma-drawer-price"></div>' +
            '      <ul class="ma-drawer-specs"></ul>' +
            '      <div class="ma-drawer-description"></div>' +
            '      <div class="ma-drawer-calendar-wrap">' +
            '        <h4>Agende sua visita direto aqui:</h4>' +
            '        <div id="ma-drawer-inline-calendar"></div>' +
            '      </div>' +
            '      <div class="ma-drawer-map-wrap">' +
            '        <h4>📍 Localização:</h4>' +
            '        <div id="ma-drawer-map"></div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="ma-drawer-footer">' +
            '    <a href="#!" target="_blank" class="ma-drawer-btn ma-drawer-btn-whatsapp">💬 Falar no WhatsApp</a>' +
            '  </div>' +
            '</div>';

        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstChild);
        document.body.appendChild(div.lastChild);
    }

    function renderCalendar(date) {
        if (!inlineCalendar) return;

        if (window.MT_Utils && window.MT_Utils.renderGenericCalendar) {
            window.MT_Utils.renderGenericCalendar(inlineCalendar, date, {
                theme: 'drawer',
                selectedDate: selectedDate,
                onMonthChange: (dir) => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + dir); renderCalendar(currentCalendarDate); },
                onDayClick: (day, month, year) => {
                    selectedDate = new Date(year, month, day);
                    updateWhatsAppLink();
                    renderCalendar(currentCalendarDate);
                }
            });
            return;
        }

        inlineCalendar.innerHTML = '<p>Calendário indisponível.</p>';
    }

    function updateWhatsAppLink() {
        if (!currentProperty) return;
        var dateStr = selectedDate ? selectedDate.toLocaleDateString('pt-BR') : '[Escolha uma data acima]';

        if (window.MT_Utils) {
            btnWhatsapp.href = window.MT_Utils.getWhatsAppLink('VISITA_IMOVEL', {
                data: dateStr,
                imovel: currentProperty.nome,
                simData: window.mtSimData || null
            });
        } else {
            var fmt = function (v) {
                return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : v;
            };

            var waMsg = 'Olá! Gostaria de agendar uma visita para o dia *' + dateStr + '* no empreendimento *' + currentProperty.nome + '*.\n';

            // Integrar dados da simulação se existirem
            if (window.mtSimData) {
                var d = window.mtSimData;
                waMsg += '\n📊 *Dados da minha simulação:*';
                waMsg += '\n- Renda: ' + fmt(d.renda);
                waMsg += '\n- Financiamento: ' + fmt(d.potencial);
                waMsg += '\n- Poder de compra: ' + fmt(d.poder);
                waMsg += '\n';
            }

            waMsg += '\nVi no site MT Parceiros.';
            btnWhatsapp.href = 'https://wa.me/5511946211111?text=' + encodeURIComponent(waMsg);
        }

        if (selectedDate) {
            btnWhatsapp.style.opacity = '1';
            btnWhatsapp.style.pointerEvents = 'auto';
        } else {
            btnWhatsapp.style.opacity = '0.7';
            // btnWhatsapp.style.pointerEvents = 'none'; // Podemos deixar clicável mas a data fica genérica
        }
    }

    function openDrawer(nome) {
        if (typeof EMPREENDIMENTOS === 'undefined') return;

        var emp = EMPREENDIMENTOS.find(function (item) {
            return item.nome === nome;
        });

        if (!emp) return;
        currentProperty = emp;
        selectedDate = null;
        currentCalendarDate = new Date();

        // Preencher dados
        contentImg.src = emp.imagem;
        contentImg.alt = emp.nome;
        contentTitle.textContent = emp.nome;
        // Exibe o preço com tratamento inteligente:
        // Valores como "Aguarde Lançamento" não recebem o prefixo "R$"
        var precoLower = String(emp.preco).toLowerCase();
        var ehTextoInformativo = precoLower.includes('aguard') || precoLower.includes('breve') || precoLower.includes('consult') || precoLower.includes('definir');
        contentPrice.textContent = ehTextoInformativo ? emp.preco : 'A partir de: R$ ' + emp.preco;
        contentBadge.textContent = emp.entrega;

        contentSpecs.innerHTML =
            '<li>Espaço Total <strong>' + emp.area + '</strong></li>' +
            '<li>Bairro <strong>' + emp.bairro + '</strong></li>' +
            '<li>Quartos <strong>' + emp.quartos + '</strong></li>' +
            '<li>Diferenciais <strong>' + emp.diferenciais + '</strong></li>';

        contentDesc.textContent = 'Este empreendimento em ' + emp.bairro + ' oferece ' + emp.diferenciais +
            '. Excelente localização com entrega em ' + emp.entrega + '.';

        // Monta o calendário de agendamento de visitas
        renderCalendar(currentCalendarDate);
        // Prepara o link do WhatsApp com os dados do imóvel
        updateWhatsAppLink();
        // 🗺️ Renderiza o mini mapa de localização (abaixo do calendário)
        updateDrawerMap(emp);

        document.body.classList.add('drawer-open');
        backdrop.classList.add('active');
        drawer.classList.add('active');
    }

    function closeDrawer() {
        document.body.classList.remove('drawer-open');
        backdrop.classList.remove('active');
        drawer.classList.remove('active');
    }

    /**
     * ══════════════════════════════════════════════════════════
     * 🗺️ MINI MAPA DE LOCALIZAÇÃO (Leaflet) — Abr/2026
     * ══════════════════════════════════════════════════════════
     * 
     * Exibe um mapa interativo com o pino do empreendimento
     * logo abaixo do calendário de agendamento.
     *
     * SEGURANÇA (Guard Clause):
     *   - Se a biblioteca Leaflet (L) não estiver carregada na
     *     página (ex: property-details.html), o mapa NÃO aparece
     *     e NENHUM erro é gerado no console.
     *   - Se o imóvel não tiver lat/lng no empreendimentos.js,
     *     o bloco do mapa é ocultado silenciosamente.
     *
     * PERFORMANCE:
     *   - A instância do mapa (drawerMap) é criada uma única vez.
     *   - Nas aberturas seguintes, apenas a posição é atualizada
     *     via setView(), evitando vazamento de memória.
     *
     * RESPONSIVIDADE:
     *   - Desktop: 200px de altura (definido em shared.css)
     *   - Mobile (≤767px): 180px de altura
     *
     * DEPENDÊNCIAS:
     *   - Leaflet 1.9.4 (CSS + JS via CDN)
     *   - empreendimentos.js (campos lat e lng)
     *   - shared.css (.ma-drawer-map-wrap, #ma-drawer-map)
     */
    function updateDrawerMap(emp) {
        var mapEl = document.getElementById('ma-drawer-map');
        var mapWrap = mapEl ? mapEl.parentElement : null;
        if (!mapWrap) return;

        // ── GUARD CLAUSE ─────────────────────────────────────
        // Protege páginas que não carregam o Leaflet (ex: property-details.html)
        // e imóveis que ainda não foram geocodificados.
        if (typeof L === 'undefined' || !emp.lat || !emp.lng) {
            mapWrap.style.display = 'none';
            return;
        }
        mapWrap.style.display = 'block';

        // ── INSTÂNCIA ÚNICA DO MAPA ──────────────────────────
        // Se o mapa já foi criado antes, apenas movemos a câmera.
        // Se é a primeira vez, criamos do zero com zoom nível 15.
        if (drawerMap) {
            drawerMap.setView([emp.lat, emp.lng], 15);
        } else {
            drawerMap = L.map('ma-drawer-map', {
                zoomControl: true,       // Botões + e - habilitados
                attributionControl: false // Créditos do OpenStreetMap ocultos
            }).setView([emp.lat, emp.lng], 15);

            /** 
             * 🎨 PADRÃO VISUAL: CARTO VOYAGER (Light Premium)
             * Estilo claro adotado para mini-mapas no Drawer de propriedades.
             */
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap © CartoDB',
                maxZoom: 18
            }).addTo(drawerMap);
        }

        // ── PINO CUSTOMIZADO (Estilo MT Parceiros) ───────────
        // Remove o pino anterior antes de colocar o novo.
        // O ícone usa o mesmo padrão visual do mapa principal (shared.js).
        if (drawerMarker) drawerMap.removeLayer(drawerMarker);

        var cor = '#f35525'; // Laranja MT Parceiros
        var icone = L.divIcon({
            className: '',
            html: '<div style="background:' + cor + ';width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 20],
            popupAnchor: [0, -22]
        });

        drawerMarker = L.marker([emp.lat, emp.lng], { icon: icone })
            .addTo(drawerMap)
            .bindPopup('<strong style="font-family:Poppins,sans-serif;">' + emp.nome + '</strong>')
            .openPopup();

        // ── CORREÇÃO DE RENDERIZAÇÃO ─────────────────────────
        // O Drawer abre com uma animação CSS de 450ms. Se o mapa
        // calcular seu tamanho ANTES da animação terminar, ele
        // aparece cinza/cortado. O invalidateSize() força o
        // recálculo após a animação concluir.
        setTimeout(function () {
            drawerMap.invalidateSize();
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
