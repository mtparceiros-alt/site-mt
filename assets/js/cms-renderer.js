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

    // 🏆 Ordenação Automática: Menor para o Maior Valor
    var dadosOrdenados = [...EMPREENDIMENTOS].sort(function(a, b) {
        return getPrecoNumerico(a.preco) - getPrecoNumerico(b.preco);
    });

    var dados = dadosOrdenados.slice(0, limite || 6);
    var html = '';

    dados.forEach(function (emp) {
        html += '<div class="item text-center item-slide">';
        html += '    <a href="property-details.html" class="schedule-visit-link img-hover-wrap" data-emp-nome="' + escapeHtml(emp.nome) + '" title="' + escapeHtml(emp.lazer) + '">';
        html += '      <img src="' + emp.imagem + '" alt="' + escapeHtml(emp.nome) + '" class="property-image" loading="lazy">';
        html += '      <span class="view-details-tag"><i class="fas fa-search"></i> Ver Detalhes</span>';
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
        html += '    <div class="main-button mt-2">';
        html += '      <a href="simulador.html" class="d-flex justify-content-center align-items-center" style="gap:8px; background:#1e1e1e; color:#fff; padding:10px 15px; border-radius:12px; font-weight:600; text-decoration:none; transition: all 0.3s ease;">';
        html += '        <img src="assets/images/bola_laranja.gif" alt="IA" style="width:24px; height:24px; border-radius:50%;">';
        html += '        Simular Aprovação';
        html += '      </a>';
        html += '    </div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// ── Renderizar Lista Completa com Filtros (properties.html) ──
function renderListaCompleta(containerId) {
    var container = document.querySelector(containerId);
    if (!container || typeof EMPREENDIMENTOS === 'undefined') return;

    // 🏆 Ordenação Automática: Menor para o Maior Valor
    // Garantimos que o cliente veja as opções mais acessíveis primeiro.
    var listaOrdenada = [...EMPREENDIMENTOS].sort(function(a, b) {
        return getPrecoNumerico(a.preco) - getPrecoNumerico(b.preco);
    });

    var html = '';

    listaOrdenada.forEach(function (emp) {
        // Determinar a categoria CSS para o filtro Isotope
        var categoriaCSS = classificarCategoria(emp.entrega);

        html += '<div class="col-lg-4 col-md-6 align-self-center mb-30 properties-items col-md-6 ' + categoriaCSS + '">';
        html += '  <div class="item text-center">';
        html += '    <a href="property-details.html" class="schedule-visit-link img-hover-wrap" data-emp-nome="' + escapeHtml(emp.nome) + '" title="' + escapeHtml(emp.lazer) + '">';
        html += '      <img src="' + emp.imagem + '" alt="' + escapeHtml(emp.nome) + '" class="property-image" loading="lazy">';
        html += '      <span class="view-details-tag"><i class="fas fa-search"></i> Ver Detalhes</span>';
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
        html += '    <div class="main-button mt-2">';
        html += '      <a href="simulador.html" class="d-flex justify-content-center align-items-center" style="gap:8px; background:#1e1e1e; color:#fff; padding:10px 15px; border-radius:12px; font-weight:600; text-decoration:none; transition: all 0.3s ease;">';
        html += '        <img src="assets/images/bola_laranja.gif" alt="IA" style="width:24px; height:24px; border-radius:50%;">';
        html += '        Simular Financiamento';
        html += '      </a>';
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
 * Converte o texto de preço (ex: "235mil" ou "1.5 milhões") em um número 
 * comparável para fins de ordenação.
 */
function getPrecoNumerico(precoStr) {
    if (!precoStr) return Infinity;
    
    // Normalizar: remover "R$", pontos, espaços e vírgulas
    var str = String(precoStr).toLowerCase()
        .replace(/r\$/g, '')
        .replace(/\./g, '')
        .replace(/\s+/g, '')
        .replace(/,/g, '.'); // converte vírgula decimal para ponto decimal

    // Casos de Milhões (Ex: "1.5milhões" ou "8milhões")
    if (str.includes('milh')) {
        var num = parseFloat(str.match(/[\d.]+/)[0]);
        // Se tiver extra (ex: "1 milhão e 500mil" -> "1.500.000")
        // Mas a planilha exporta como "8 milhões e 500mil" 
        // Vamos tentar capturar o 'mil' se existir depois do milhão
        var extraMil = 0;
        if (str.includes('mil') && str.indexOf('milh') < str.indexOf('mil')) {
             // Tenta pegar o que está entre o milhão e o mil
             var posMilhao = str.indexOf('milh');
             var posMil = str.indexOf('mil');
             var trechoExtra = str.substring(posMilhao + 6, posMil);
             var extraMatch = trechoExtra.match(/\d+/);
             if (extraMatch) extraMil = parseFloat(extraMatch[0]) * 1000;
        }
        return (num * 1000000) + extraMil;
    }

    // Casos de Mil (Ex: "235mil")
    if (str.includes('mil')) {
        var match = str.match(/[\d.]+/);
        return match ? parseFloat(match[0]) * 1000 : Infinity;
    }

    // Apenas números puros na string
    var apenasNumeros = str.match(/[\d.]+/);
    if (apenasNumeros) {
        var n = parseFloat(apenasNumeros[0]);
        // Se for um número pequeno (ex: 235), assume que o usuário quis dizer 'mil'
        return n < 5000 ? n * 1000 : n;
    }

    return Infinity; // "Sob Consulta", etc.
}

/**
 * Classifica a categoria CSS para o filtro Isotope.
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


