/**
 * schedule-system.js — MT Parceiros
 * Gerencia o modal de calendário e agendamentos via WhatsApp
 * Utiliza delegação de eventos para suportar botões gerados dinamicamente.
 */

document.addEventListener('DOMContentLoaded', function () {
    const whatsappNumber = '5511960364355';
    const modal = document.getElementById('calendar-modal');
    const calendarContainer = document.getElementById('calendar-container');
    let currentDate = new Date();

    if (!modal || !calendarContainer) {
        console.warn('Sistema de agendamento: Modal ou Container não encontrados no DOM.');
        return;
    }

    let selectedPropertyName = '';

    // --- Lógica do Calendário ---

    function renderCalendar(date) {
        calendarContainer.innerHTML = '';

        const month = date.getMonth();
        const year = date.getFullYear();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

        const header = document.createElement('div');
        header.className = 'calendar-header';

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&lt;';
        prevButton.type = 'button';

        const monthYear = document.createElement('h3');
        monthYear.textContent = `${monthNames[month]} ${year}`;

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&gt;';
        nextButton.type = 'button';

        header.appendChild(prevButton);
        header.appendChild(monthYear);
        header.appendChild(nextButton);
        calendarContainer.appendChild(header);

        const weekdays = document.createElement('div');
        weekdays.className = 'calendar-days calendar-weekdays';
        dayNames.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            weekdays.appendChild(dayEl);
        });
        calendarContainer.appendChild(weekdays);

        const daysContainer = document.createElement('div');
        daysContainer.className = 'calendar-days';

        for (let i = 0; i < startDayOfWeek; i++) {
            daysContainer.appendChild(document.createElement('div'));
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const fmt = (v) => typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : v;

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;

            const currentDayDate = new Date(year, month, day);

            if (currentDayDate < today) {
                dayEl.classList.add('past-day');
            } else {
                dayEl.addEventListener('click', () => {
                    const selectedDate = new Date(year, month, day);
                    const formattedDate = selectedDate.toLocaleDateString('pt-BR');

                    let message = `Olá! Gostaria de agendar uma visita para o dia ${formattedDate}.`;

                    if (selectedPropertyName) {
                        message += `\n\n🏠 *Interesse:* ${selectedPropertyName}`;
                    }

                    // Se houver dados de simulação disponíveis
                    if (window.mtSimData) {
                        const d = window.mtSimData;
                        message += `\n\n📊 *Dados da minha simulação:*`;
                        message += `\n- Renda: ${fmt(d.renda)}`;
                        message += `\n- Financiamento: ${fmt(d.potencial)}`;
                        message += `\n- Poder de compra: ${fmt(d.poder)}`;
                    }

                    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

                    window.open(whatsappUrl, '_blank');
                    modal.style.display = 'none';
                });
            }
            daysContainer.appendChild(dayEl);
        }
        calendarContainer.appendChild(daysContainer);

        if (year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth())) {
            prevButton.disabled = true;
        }

        prevButton.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });

        nextButton.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }

    // --- Delegação de Eventos para os botões "Agende uma visita" ---

    document.addEventListener('click', function (e) {
        // Verifica se o clique foi em um elemento com a classe .schedule-visit-link ou dentro dele
        const targetLink = e.target.closest('.schedule-visit-link');

        if (targetLink) {
            e.preventDefault();

            // Captura o nome do empreendimento se disponível
            selectedPropertyName = targetLink.getAttribute('data-emp-nome') || '';

            currentDate = new Date();
            renderCalendar(currentDate);
            modal.style.display = 'block';
        }

        // Fechar modal se clicar no botão de fechar ou fora do conteúdo
        if (e.target.classList.contains('calendar-close-button')) {
            modal.style.display = 'none';
        }

        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
