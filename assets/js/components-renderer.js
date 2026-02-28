/**
 * components-renderer.js - MT Parceiros
 * Renderiza componentes comuns como Header e Footer.
 */

document.addEventListener('DOMContentLoaded', function () {
    renderSubHeader();
    renderHeader();
    renderFooter();
    renderWhatsApp();
});

function renderSubHeader() {
    const subHeader = document.querySelector('.sub-header');
    if (!subHeader) return;

    subHeader.innerHTML = `
        <div class="container">
            <div class="row">
                <div class="col-lg-8 col-md-8">
                    <ul class="info">
                        <li><i class="fa fa-envelope"></i> <a href="contact.html#contact-form">mtparceiros@gmail.com</a></li>
                        <li><i class="fa fa-map"></i> Rua Manuel Alvares Passos, 249 – Pirituba, São Paulo</li>
                    </ul>
                </div>
                <div class="col-lg-4 col-md-4">
                    <ul class="social-links">
                        <li><a href="https://www.facebook.com/profile.php?id=61587335061570" target="_blank"><i class="fab fa-facebook"></i></a></li>
                        <li><a href="https://x.com/minthu" target="_blank"><i class="fab fa-twitter"></i></a></li>
                        <li><a href="#"><i class="fab fa-linkedin"></i></a></li>
                        <li><a href="https://www.instagram.com/corretora.thainak/" target="_blank"><i class="fab fa-instagram"></i></a></li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function renderHeader() {
    const headerPlaceholder = document.querySelector('header.header-area nav.main-nav');
    if (!headerPlaceholder) return;

    // Detecta qual página é a ativa
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    const menuItems = [
        { name: "Início", link: "index.html" },
        { name: "Empreendimentos", link: "properties.html" },
        { name: "Simulador", link: "index.html#simulador" },
        { name: "Detalhes", link: "property-details.html" },
        { name: "Contato", link: "contact.html" }
    ];

    let navHtml = `
        <a href="index.html" class="logo">
            <h1>MTParceiros</h1>
        </a>
        <ul class="nav">
    `;

    menuItems.forEach(item => {
        // Checagem mais robusta para marcar o item como ativo
        const isActive = (page === item.link || (page === "index.html" && item.link === "index.html")) ? 'class="active"' : '';
        navHtml += `<li><a href="${item.link}" ${isActive}>${item.name}</a></li>`;
    });

    navHtml += `
            <li><a href="#!" class="schedule-visit-link"><i class="fa fa-calendar"></i> Agende uma visita</a></li>
        </ul>
        <a class='menu-trigger'>
            <span>Menu</span>
        </a>
    `;

    headerPlaceholder.innerHTML = navHtml;

    // Menu Dropdown Toggle para Mobile
    const menuTrigger = headerPlaceholder.querySelector('.menu-trigger');
    const navMenu = headerPlaceholder.querySelector('.nav');
    if (menuTrigger && navMenu) {
        menuTrigger.addEventListener('click', function (e) {
            e.preventDefault();
            const isActive = this.classList.contains('active');

            if (isActive) {
                this.classList.remove('active');
                if (window.jQuery) {
                    window.jQuery(navMenu).slideUp(300);
                } else {
                    navMenu.style.display = 'none';
                }
            } else {
                this.classList.add('active');
                if (window.jQuery) {
                    window.jQuery(navMenu).slideDown(300);
                } else {
                    navMenu.style.display = 'block';
                }
            }
        });
    }
}

function renderFooter() {
    const footerPlaceholder = document.querySelector('footer .container');
    if (!footerPlaceholder) return;

    footerPlaceholder.innerHTML = `
        <div class="row">
            <div class="col-lg-8">
                <p>Copyright © 2024 MT Parceiros - Consultoria Imobiliária e Soluções Inteligentes. Todos os direitos reservados.
                <br>Design: <a rel="nofollow" href="https://templatemo.com" target="_blank">TemplateMo</a> 
                Distribuição: <a href="https://themewagon.com">ThemeWagon</a></p>
            </div>
        </div>
    `;
}

function renderWhatsApp() {
    // Verifica se já existe o botão
    if (document.querySelector('.whatsapp-float')) return;

    const waHtml = `
        <a href="https://wa.me/5511960364355" target="_blank" class="whatsapp-float">
            <img src="assets/images/bot-whatsapp.png" alt="Fale conosco pelo WhatsApp">
        </a>
    `;
    document.body.insertAdjacentHTML('beforeend', waHtml);
}
