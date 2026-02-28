/**
 * property-drawer.js — MT Parceiros
 * Lógica para gerenciar o Drawer de detalhes dos empreendimentos com calendário incorporado
 */

(function () {
    'use strict';

    var drawer, backdrop;
    var closeBtn, btnWhatsapp;
    var contentImg, contentBadge, contentTitle, contentPrice, contentSpecs, contentDesc, inlineCalendar;

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
        inlineCalendar.innerHTML = '';

        var year = date.getFullYear();
        var month = date.getMonth();
        var firstDay = new Date(year, month, 1).getDay();
        var lastDay = new Date(year, month + 1, 0).getDate();

        var monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        var dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

        // Header do Calendário
        var header = document.createElement('div');
        header.className = 'ma-cal-header';

        var prev = document.createElement('button');
        prev.innerHTML = '&lt;';
        prev.onclick = function () { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(currentCalendarDate); };

        var title = document.createElement('span');
        title.textContent = monthNames[month] + ' ' + year;

        var next = document.createElement('button');
        next.innerHTML = '&gt;';
        next.onclick = function () { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(currentCalendarDate); };

        header.appendChild(prev);
        header.appendChild(title);
        header.appendChild(next);
        inlineCalendar.appendChild(header);

        // Dias da Semana
        var grid = document.createElement('div');
        grid.className = 'ma-cal-grid';
        dayNames.forEach(function (d) {
            var el = document.createElement('div');
            el.className = 'ma-cal-weekday';
            el.textContent = d;
            grid.appendChild(el);
        });

        // Espaços vazios
        for (var i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        // Dias do mês
        for (var d = 1; d <= lastDay; d++) {
            var dayEl = document.createElement('div');
            dayEl.className = 'ma-cal-day';
            dayEl.textContent = d;

            var checkDate = new Date(year, month, d);
            if (checkDate < today) {
                dayEl.classList.add('disabled');
            } else {
                if (selectedDate && checkDate.getTime() === selectedDate.getTime()) {
                    dayEl.classList.add('selected');
                }
                dayEl.onclick = (function (dd) {
                    return function () {
                        selectedDate = new Date(year, month, dd);
                        updateWhatsAppLink();
                        renderCalendar(currentCalendarDate);
                    };
                })(d);
            }
            grid.appendChild(dayEl);
        }
        inlineCalendar.appendChild(grid);
    }

    function updateWhatsAppLink() {
        if (!currentProperty) return;
        var dateStr = selectedDate ? selectedDate.toLocaleDateString('pt-BR') : '[Escolha uma data acima]';

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
        btnWhatsapp.href = 'https://wa.me/5511960364355?text=' + encodeURIComponent(waMsg);

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
        contentPrice.textContent = 'A partir de: R$ ' + emp.preco;
        contentBadge.textContent = emp.entrega;

        contentSpecs.innerHTML =
            '<li>Espaço Total <strong>' + emp.area + '</strong></li>' +
            '<li>Bairro <strong>' + emp.bairro + '</strong></li>' +
            '<li>Quartos <strong>' + emp.quartos + '</strong></li>' +
            '<li>Diferenciais <strong>' + emp.diferenciais + '</strong></li>';

        contentDesc.textContent = 'Este empreendimento em ' + emp.bairro + ' oferece ' + emp.diferenciais +
            '. Excelente localização com entrega em ' + emp.entrega + '.';

        renderCalendar(currentCalendarDate);
        updateWhatsAppLink();

        document.body.classList.add('drawer-open');
        backdrop.classList.add('active');
        drawer.classList.add('active');
    }

    function closeDrawer() {
        document.body.classList.remove('drawer-open');
        backdrop.classList.remove('active');
        drawer.classList.remove('active');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
