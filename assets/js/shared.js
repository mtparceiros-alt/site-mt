/**
 * shared.js - MT Parceiros
 * Lógica compartilhada entre todas as páginas (Calendário, utilitários, etc).
 */

window.MT_Utils = {
    WHATSAPP_NUMBER: '5511960364355',

    formatCurrency: function (value) {
        return typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : value;
    },

    getWhatsAppLink: function (tipo, dados) {
        let msg = '';
        dados = dados || {};

        switch (tipo) {
            case 'CONTATO':
                msg = `Olá! Me chamo *${dados.nome}*.\nMeu WhatsApp: ${dados.celular}.\nAssunto: ${dados.assunto}${dados.mensagem ? '\n\n' + dados.mensagem : ''}`;
                break;
            case 'SIMULADOR':
                msg = `🏠 *NOVA SIMULAÇÃO — MT Parceiros*\n━━━━━━━━━━━━━━━━━━━\n👤 Cliente: ${dados.nome}\n👨‍👩‍👧‍👦 Dependentes: ${dados.dependentes}\n💰 Renda: ${this.formatCurrency(dados.renda)}\n💳 Dívidas: ${this.formatCurrency(dados.dividas)}\n━━━━━━━━━━━━━━━━━━━\n📊 Parcela: ${this.formatCurrency(dados.margem)}/mês\n🏦 Financiamento: ${this.formatCurrency(dados.potencial)}\n🏡 Poder Total: ${this.formatCurrency(dados.poder)}\n━━━━━━━━━━━━━━━━━━━\nMT Parceiros | (11) 96036-4355`;
                break;
            case 'VISITA_IMOVEL':
                msg = `Olá! Gostaria de agendar uma visita para o dia *${dados.data}* no empreendimento *${dados.imovel}*.\n`;
                if (dados.simData) {
                    msg += `\n📊 *Dados da minha simulação:*\n- Renda: ${this.formatCurrency(dados.simData.renda)}\n- Financiamento: ${this.formatCurrency(dados.simData.potencial)}\n- Poder de compra: ${this.formatCurrency(dados.simData.poder)}\n`;
                }
                msg += '\nVi no site MT Parceiros.';
                break;
            case 'VISITA_SIMPLES':
            default:
                let nomeImovel = dados.imovel ? ` ao *${dados.imovel}*` : '';
                msg = `Olá, gostaria de agendar uma visita${nomeImovel} para o dia ${dados.data}.`;
                break;
        }

        return `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    },

    renderGenericCalendar: function (container, date, config) {
        if (!container) return;
        container.innerHTML = '';

        const month = date.getMonth();
        const year = date.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

        const theme = config.theme || 'modal'; // 'modal' ou 'drawer'

        const header = document.createElement('div');
        header.className = theme === 'modal' ? 'calendar-header' : 'ma-cal-header';

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&lt;';
        prevBtn.type = 'button';
        prevBtn.onclick = () => config.onMonthChange(-1);

        const title = document.createElement(theme === 'modal' ? 'h3' : 'span');
        title.textContent = `${monthNames[month]} ${year}`;

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&gt;';
        nextBtn.type = 'button';
        nextBtn.onclick = () => config.onMonthChange(1);

        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);
        container.appendChild(header);

        let weekdaysContainer, daysContainer;
        if (theme === 'modal') {
            weekdaysContainer = document.createElement('div');
            weekdaysContainer.className = 'calendar-days calendar-weekdays';
            dayNames.forEach(d => { const el = document.createElement('div'); el.textContent = d; weekdaysContainer.appendChild(el); });
            container.appendChild(weekdaysContainer);

            daysContainer = document.createElement('div');
            daysContainer.className = 'calendar-days';
        } else {
            daysContainer = document.createElement('div');
            daysContainer.className = 'ma-cal-grid';
            dayNames.forEach(d => { const el = document.createElement('div'); el.className = 'ma-cal-weekday'; el.textContent = d; daysContainer.appendChild(el); });
        }

        for (let i = 0; i < firstDay; i++) {
            daysContainer.appendChild(document.createElement('div'));
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 1; d <= lastDay; d++) {
            const dayEl = document.createElement('div');
            dayEl.className = theme === 'modal' ? 'calendar-day' : 'ma-cal-day';
            dayEl.textContent = d;

            const checkDate = new Date(year, month, d);
            if (checkDate < today) {
                dayEl.classList.add(theme === 'modal' ? 'past-day' : 'disabled');
            } else {
                if (theme === 'drawer' && config.selectedDate && checkDate.getTime() === config.selectedDate.getTime()) {
                    dayEl.classList.add('selected');
                }
                dayEl.onclick = () => config.onDayClick(d, month, year);
            }
            daysContainer.appendChild(dayEl);
        }

        container.appendChild(daysContainer);

        if (theme === 'modal') {
            if (year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth())) {
                prevBtn.disabled = true;
            }
        }
    },

    initMap: function (containerId, options) {
        if (!document.getElementById(containerId)) return;
        if (typeof L === 'undefined') return;

        options = options || {};
        var popupBtnText = options.popupBtnText || 'ℹ️ Mais Informações';

        var map = L.map(containerId).setView([-23.55, -46.63], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
        }).addTo(map);

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
                        alert("A geolocalização automática é bloqueada por segurança em arquivos locais. Para testar este botão, o site precisa estar em um servidor (http/https).");
                        return;
                    }
                    map.locate({ setView: true, maxZoom: 15 });
                });
                return container;
            }
        });
        map.addControl(new LocationControl());
        map.on('locationerror', function () { alert("Não foi possível obter sua localização."); });

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
                    + popupBtnText + '</a></div>';

                L.marker([e.lat, e.lng], { icon: icone }).addTo(map).bindPopup(popup);
                bounds.push([e.lat, e.lng]);
            });
            if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    initCalendarSystem();
    initSharedContactForm();
});

/**
 * Lógica do Formulário de Contato
 */
function initSharedContactForm() {
    // Procura por formulário pelo ID (usado na Home e em Contato) ou fallback para .contact-content
    const form = document.querySelector('#contact-form') || document.querySelector('.contact-content form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Usa os seletores por atributo 'name' para ser agnóstico de IDs divergentes (ex.: celular vs celular-contato)
        const nameInput = form.querySelector('[name="name"]');
        const emailInput = form.querySelector('[name="email"]');
        const celularInput = form.querySelector('[name="celular"]');

        if (nameInput && !nameInput.value.trim()) { alert('Por favor, preencha seu nome completo.'); nameInput.focus(); return; }
        if (emailInput && !emailInput.value.trim()) { alert('Por favor, preencha seu e-mail.'); emailInput.focus(); return; }

        let unmaskedValue = '';
        if (celularInput) {
            unmaskedValue = celularInput.value.replace(/\D/g, '');
            if (unmaskedValue.length < 10 || unmaskedValue.length > 11) {
                alert('Por favor, insira um número de celular válido com DDD.');
                celularInput.focus();
                return;
            }
        }

        const formData = new FormData(form);
        if (celularInput) {
            formData.set('celular', unmaskedValue);
        }
        const formContainer = form.parentElement;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        const handleSuccess = () => {
            const waName = (form.querySelector('[name="name"]') || {}).value || '';
            const waCelular = unmaskedValue;
            const waSubject = (form.querySelector('[name="subject"]') || {}).value || 'Contato pelo site';
            const waMessage = (form.querySelector('[name="message"]') || {}).value || '';

            setTimeout(() => {
                let waLink;
                if (window.MT_Utils) {
                    waLink = window.MT_Utils.getWhatsAppLink('CONTATO', {
                        nome: waName,
                        celular: waCelular,
                        assunto: waSubject,
                        mensagem: waMessage
                    });
                } else {
                    const waMsg = `Olá! Me chamo *${waName.trim()}*.\nMeu WhatsApp: ${waCelular}.\nAssunto: ${waSubject}${waMessage ? '\n\n' + waMessage : ''}`;
                    waLink = 'https://wa.me/5511960364355?text=' + encodeURIComponent(waMsg);
                }
                window.open(waLink, '_blank');
            }, 2000);

            formContainer.innerHTML = `
            <div class="ma-success-wrapper">
              <div class="ma-success-icon-box">
                <div class="ma-success-circle"></div>
                <svg class="ma-checkmark" viewBox="0 0 52 52">
                  <path d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <h4>Mensagem Enviada!</h4>
              <p>Sua jornada para o novo lar começou com sucesso.</p>
              <button class="ma-btn-reset" onclick="location.reload()">Enviar outra mensagem</button>
            </div>
            `;
        };

        // 1. Envio para Planilha Mestre (Webhook Apps Script)
        const waName = (form.querySelector('[name="name"]') || {}).value || '';
        const payload = new URLSearchParams();
        payload.append('nome', waName);
        payload.append('whatsapp', unmaskedValue);
        payload.append('origem', 'Contato Direto (Site)');

        fetch('https://script.google.com/macros/s/AKfycbxwHM37XFniI7d1l9RjGjPO1wK0ohwmmeuv-jOBiAaS2oFYpCQcrXJh6PvxrM9S-t5KuA/exec', {
            method: 'POST',
            body: payload,
            mode: 'no-cors'
        }).catch(err => console.error("Erro ao salvar no Google Sheets:", err));

        // 2. Envio original para e-mail (FormSubmit)
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            // Força o sucesso mesmo com erros (ex: 429 Rate Limit) garantindo que a jornada do usuário continue
            if (!response.ok) {
                console.warn('FormSubmit retornou um erro, mas o fluxo continuará:', response.status);
            }
            handleSuccess();
        }).catch(error => {
            console.error('Erro de rede ao enviar formulário:', error);
            handleSuccess();
        });
    });
}

/**
 * Sistema de Calendário para Agendamento de Visitas
 */
function initCalendarSystem() {
    const modal = document.getElementById('calendar-modal');
    if (!modal) return;

    const closeButton = modal.querySelector('.calendar-close-button');
    const scheduleLinks = document.querySelectorAll('.schedule-visit-link');
    const calendarContainer = document.getElementById('calendar-container');
    const whatsappNumber = '5511960364355';

    let currentDate = new Date();

    function renderCalendar(date) {
        if (!calendarContainer) return;

        if (window.MT_Utils && window.MT_Utils.renderGenericCalendar) {
            window.MT_Utils.renderGenericCalendar(calendarContainer, date, {
                theme: 'modal',
                onMonthChange: (dir) => { currentDate.setMonth(currentDate.getMonth() + dir); renderCalendar(currentDate); },
                onDayClick: (day, month, year) => {
                    const selectedDate = new Date(year, month, day);
                    const formattedDate = selectedDate.toLocaleDateString('pt-BR');

                    const empNome = window.lastClickedEmpNome || "";

                    const whatsappUrl = window.MT_Utils.getWhatsAppLink('VISITA_SIMPLES', {
                        data: formattedDate,
                        imovel: empNome
                    });

                    window.open(whatsappUrl, '_blank');
                    modal.style.display = 'none';
                }
            });
            return;
        }

        // Fallback para caso MT_Utils falhe (improvável, mas garante o "não quebrar")
        calendarContainer.innerHTML = 'Calendário indisponível.';
    }

    // Delegação de eventos para suportar links injetados dinamicamente (Mapas, CMS)
    document.body.addEventListener('click', function (e) {
        const link = e.target.closest('.schedule-visit-link');
        if (link && !link.hasAttribute('data-emp-nome')) {
            e.preventDefault();
            window.lastClickedEmpNome = null;
            currentDate = new Date();
            renderCalendar(currentDate);
            modal.style.display = 'block';
        }
    });

    if (closeButton) {
        closeButton.addEventListener('click', function () { modal.style.display = 'none'; });
    }

    window.addEventListener('click', function (event) {
        if (event.target == modal) { modal.style.display = 'none'; }
    });
}
