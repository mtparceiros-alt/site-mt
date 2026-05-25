/**
 * components-renderer.js - MT Parceiros
 * Orquestrador de renderização de componentes globais (Header, Footer, WhatsApp, Form).
 * Este arquivo centraliza a injeção de HTML repetitivo para facilitar a manutenção.
 */

document.addEventListener('DOMContentLoaded', function () {
    renderSubHeader();
    renderHeader();
    renderFooter();
    renderWhatsApp();
    renderContactForm();
});

function renderSubHeader() {
    const subHeader = document.querySelector('.sub-header');
    if (!subHeader) return;

    // Sub-header removido globalmente por decisao de layout.
    subHeader.remove();
}

/**
 * Renderiza o Header (Menu de Navegação) dinamicamente.
 * Detecta a página atual para aplicar a classe 'active'.
 */
function renderHeader() {
    const headerPlaceholder = document.querySelector('header.header-area nav.main-nav');
    if (!headerPlaceholder) return;

    // Detecta qual pagina e a ativa
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    const menuItems = [
        { name: 'Início', link: 'index.html' },
        { name: 'Empreendimentos', link: 'properties.html' },
        { name: 'Simulador', link: 'simulador.html' },
        { name: 'Blog', link: 'blog.html' },
        { name: 'Detalhes', link: 'property-details.html' },
        { name: 'Contato', link: 'contato.html' }
    ];

    let navHtml = `
        <a href="index.html" class="logo">
            <h1>MTParceiros</h1>
        </a>
        <ul class="nav">
    `;

    menuItems.forEach(item => {
        // Compara apenas o nome do arquivo para links com ou sem hash/query
        const itemPage = item.link.split('#')[0].split('?')[0];
        const isActive = (page === itemPage || (page === 'index.html' && itemPage === 'index.html')) ? 'class="active"' : '';
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
        <div class="row footer-content-row justify-content-center text-center">
            <div class="col-lg-10">
                <p style="margin-bottom: 10px;">Copyright &copy; 2026 MT Parceiros - Consultoria Imobiliária e Soluções Inteligentes. 
                <br>CNPJ: 60.393.773/0001-07 | CRECI-J: 50809-J. 
                <br>Base Operacional: Rua Manuel Álvares Passos, 249 - Pirituba, São Paulo - SP.
                <br><span style="color: #f35525; font-weight: 700;">🔒 Não solicitamos RG/CPF nem realizamos transações financeiras via site.</span></p>
                
                <div class="trust-badges" style="margin: 15px 0 20px 0; display: flex; justify-content: center; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <a href="https://www.reclameaqui.com.br/empresa/thaina-castro-mendes/" target="_blank" rel="noopener noreferrer" aria-label="Reclame Aqui">
                        <img src="assets/images/reclame_aqui.png" alt="Empresa Verificada no Reclame Aqui" style="height: 45px; width: auto; transition: 0.3s; filter: drop-shadow(0 0 5px rgba(255,255,255,0.1));" onmouseover="this.style.transform='scale(1.05)';" onmouseout="this.style.transform='scale(1)';" >
                    </a>
                    <a href="https://maps.app.goo.gl/Jt9T9ZzfhKbJo3qu9" target="_blank" rel="noopener noreferrer" aria-label="Google Maps" style="color: #fff; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; text-decoration: none; background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); height: 45px;">
                        <img src="https://www.google.com/images/branding/product/2x/maps_96dp.png" alt="Google Maps" style="height: 20px; width: auto;">
                         Ver Perfil no Google
                    </a>
                    <div class="social-icons-footer" style="display: flex; gap: 10px; align-items: center;">
                        <a href="https://www.facebook.com/profile.php?id=61587335061570&locale=pt_BR" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style="width: 35px; height: 35px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; transition: 0.3s;" onmouseover="this.style.background='#f35525'; this.style.transform='translateY(-3px)';" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)';"><i class="fa-brands fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/corretora.thainak/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style="width: 35px; height: 35px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; transition: 0.3s;" onmouseover="this.style.background='#f35525'; this.style.transform='translateY(-3px)';" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)';"><i class="fa-brands fa-instagram"></i></a>
                    </div>
                </div>

                <p style="font-size: 0.8rem; opacity: 0.8;">Plataforma Informativa e de Consultoria. Infraestrutura Google Protegida.</p>
            </div>
        </div>
    `;
}

function renderWhatsApp() {
    // Verifica se ja existe o botao
    if (document.querySelector('.whatsapp-float')) return;

    const waHtml = `
        <a href="https://wa.me/5511946211111" target="_blank" class="whatsapp-float">
            <img src="assets/images/bot-whatsapp.png" alt="Fale conosco pelo WhatsApp">
        </a>
    `;
    document.body.insertAdjacentHTML('beforeend', waHtml);
}

/**
 * Injeta o formulário de contato nos placeholders.
 * Chamada após o carregamento do DOM.
 */
function renderContactForm() {
    const placeholders = document.querySelectorAll('#contact-form-placeholder');
    if (!placeholders.length) return;

    const formHtml = `
          <form id="contact-form" class="contact-form" action="https://formsubmit.co/marcos.onn@gmail.com" method="POST">
            <div class="row">
              <div class="col-lg-12">
                <fieldset>
                  <label for="name">Nome Completo</label>
                  <input type="text" name="name" id="name" placeholder="Seu Nome..." autocomplete="on" required>
                </fieldset>
              </div>
              <div class="col-lg-12">
                <fieldset>
                  <label for="email">E-mail</label>
                  <input type="email" name="email" id="email" placeholder="Seu E-mail..." required>
                </fieldset>
              </div>
              <div class="col-lg-12">
                <fieldset>
                  <label for="celular">Celular (com DDD)</label>
                  <input type="tel" name="celular" id="celular" placeholder="Ex: (11) 91234-5678" autocomplete="on" required>
                </fieldset>
              </div>
              <div class="col-lg-12">
                <fieldset>
                  <label for="subject">Assunto</label>
                  <input type="text" name="subject" id="subject" placeholder="Assunto..." autocomplete="on">
                  <input type="hidden" name="_captcha" value="false">
                </fieldset>
              </div>
              <div class="col-lg-12">
                <fieldset>
                  <label for="message">Mensagem</label>
                  <textarea name="message" id="message" placeholder="Sua Mensagem"></textarea>
                </fieldset>
              </div>
              <div class="col-lg-12">
                <fieldset>
                  <button type="submit" id="form-submit" class="orange-button">Enviar Mensagem</button>
                </fieldset>
              </div>
            </div>
          </form>
    `;

    placeholders.forEach(el => {
        el.innerHTML = formHtml;
    });

    // Re-inicia o listener do form de contato apos a injecao do HTML
    if (typeof initSharedContactForm === 'function') {
        initSharedContactForm();
    }
}
