/**
 * cms-renderer.js — MT Parceiros CMS
 * Renderiza os cartões de imóveis a partir dos dados de empreendimentos.js
 * 
 * USO:
 *   - Na index.html:       renderDestaques('#destaques-container', 6)
 *   - Na properties.html:  renderListaCompleta('#properties-container')
 */

// ── Renderizar Destaques (index.html) ────────────────────────
function renderDestaques(containerId, limite) {
    var container = document.querySelector(containerId);
    if (!container || typeof EMPREENDIMENTOS === 'undefined') return;

    var dados = EMPREENDIMENTOS.slice(0, limite || 6);
    var html = '';

    dados.forEach(function (emp) {
        html += '<div class="item text-center item-slide">';
        html += '    <a href="#!" class="schedule-visit-link" data-emp-nome="' + escapeHtml(emp.nome) + '" title="' + escapeHtml(emp.lazer) + '">';
        html += '      <img src="' + emp.imagem + '" alt="' + escapeHtml(emp.nome) + '" loading="lazy">';
        html += '    </a>';
        html += '    <span class="category">' + escapeHtml(emp.nome) + '</span>';
        html += '    <h6>A partir de: R$ ' + escapeHtml(emp.preco) + '</h6>';
        html += '    <ul class="text-start">';
        html += '      <li>Bairro: <span>' + escapeHtml(emp.bairro) + '</span></li>';
        html += '      <li>Quartos: <span>' + escapeHtml(emp.quartos) + '</span></li>';
        html += '      <li>Área: <span>' + escapeHtml(emp.area) + '</span></li>';
        html += '      <li>Diferenciais: <span>' + escapeHtml(emp.diferenciais) + '</span></li>';
        html += '      <li>Entrega: <span>' + escapeHtml(emp.entrega) + '</span></li>';
        html += '    </ul>';
        html += '    <div class="main-button">';
        html += '      <a href="#!" class="schedule-visit-link" data-emp-nome="' + escapeHtml(emp.nome) + '">Agende uma visita</a>';
        html += '    </div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// ── Renderizar Lista Completa com Filtros (properties.html) ──
function renderListaCompleta(containerId) {
    var container = document.querySelector(containerId);
    if (!container || typeof EMPREENDIMENTOS === 'undefined') return;

    var html = '';

    EMPREENDIMENTOS.forEach(function (emp) {
        // Determinar a categoria CSS para o filtro Isotope
        var categoriaCSS = classificarCategoria(emp.entrega);

        html += '<div class="col-lg-4 col-md-6 align-self-center mb-30 properties-items col-md-6 ' + categoriaCSS + '">';
        html += '  <div class="item text-center">';
        html += '    <a href="#!" class="schedule-visit-link" data-emp-nome="' + escapeHtml(emp.nome) + '" title="' + escapeHtml(emp.lazer) + '">';
        html += '      <img src="' + emp.imagem + '" alt="' + escapeHtml(emp.nome) + '" loading="lazy">';
        html += '    </a>';
        html += '    <span class="category">' + escapeHtml(emp.nome) + '</span>';
        html += '    <h6>A partir de: R$ ' + escapeHtml(emp.preco) + '</h6>';
        html += '    <ul class="text-start">';
        html += '      <li>Bairro: <span>' + escapeHtml(emp.bairro) + '</span></li>';
        html += '      <li>Quartos: <span>' + escapeHtml(emp.quartos) + '</span></li>';
        html += '      <li>Área: <span>' + escapeHtml(emp.area) + '</span></li>';
        html += '      <li>Diferenciais: <span>' + escapeHtml(emp.diferenciais) + '</span></li>';
        html += '      <li>Entrega: <span>' + escapeHtml(emp.entrega) + '</span></li>';
        html += '    </ul>';
        html += '    <div class="main-button">';
        html += '      <a href="#!" class="schedule-visit-link" data-emp-nome="' + escapeHtml(emp.nome) + '">Agende uma visita</a>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    });

    container.innerHTML = html;

    // ── Reinicializar Isotope DEPOIS dos cartões existirem ──
    if (typeof Isotope !== 'undefined') {
        var iso = new Isotope(container, {
            itemSelector: '.properties-items',
            layoutMode: 'masonry'
        });

        // Recalcular layout quando cada imagem carregar (corrige alturas)
        var images = container.querySelectorAll('img');
        var loadedCount = 0;
        var totalImages = images.length;

        function onImageLoaded() {
            loadedCount++;
            // Recalcular a cada imagem carregada para evitar sobreposição imediata
            iso.layout();
        }

        images.forEach(function (img) {
            if (img.complete) {
                onImageLoaded();
            } else {
                img.addEventListener('load', onImageLoaded);
                img.addEventListener('error', onImageLoaded);
            }
        });

        // Garantia extra: Recalcular após 2 segundos caso algo falhe
        setTimeout(function () { iso.layout(); }, 2000);

        // Reconectar os botões de filtro
        var filtersElem = document.querySelector('.properties-filter');
        if (filtersElem) {
            filtersElem.addEventListener('click', function (event) {
                if (!event.target.matches('a')) return;
                var filterValue = event.target.getAttribute('data-filter');
                iso.arrange({ filter: filterValue });
                filtersElem.querySelector('.is_active').classList.remove('is_active');
                event.target.classList.add('is_active');
                event.preventDefault();
            });
        }
    }
}

// ── Funções Auxiliares ───────────────────────────────────────

/**
 * Classifica a categoria CSS para o filtro Isotope.
 * Usa a mesma lógica de classes do site original:
 *   - 'adv' = Lançamento
 *   - 'str' = Em Obras
 *   - 'rac' = Pronto
 */
function classificarCategoria(entrega) {
    if (!entrega) return 'str';
    var texto = entrega.toLowerCase();
    if (texto.indexOf('lançamento') !== -1 || texto.indexOf('lancamento') !== -1) {
        return 'adv';
    }
    if (texto.indexOf('pronto') !== -1) {
        return 'rac';
    }
    // Se tem data futura, é "Em Obras"
    return 'str';
}

/**
 * Escapa caracteres HTML para evitar injeção de código.
 */
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}
