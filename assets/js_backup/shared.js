/**
 * shared.js - MT Parceiros
 * Lógica compartilhada entre todas as páginas (Calendário, etc).
 */

document.addEventListener('DOMContentLoaded', function () {
    initCalendarSystem();
});

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

                    // Verifica se existe um nome de empreendimento associado ao clique
                    const target = event.currentTarget;
                    const empNome = window.lastClickedEmpNome || "";

                    const message = `Olá, gostaria de agendar uma visita ${empNome ? 'ao *' + empNome + '*' : ''} para o dia ${formattedDate}.`;
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

        prevButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });
        nextButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });
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
