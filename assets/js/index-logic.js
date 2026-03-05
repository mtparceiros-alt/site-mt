/**
 * index-logic.js - MT Parceiros
 * Lógica específica para a página inicial (Highlights, Mapa, Simulador).
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Renderiza os itens de destaque via CMS
    if (typeof renderDestaques === 'function') {
        renderDestaques('#destaques-container', 12);

        // Inicializa o Owl Carousel após a renderização
        setTimeout(function () {
            if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
                $('#destaques-container').owlCarousel({
                    items: 3,
                    loop: true,
                    dots: true,
                    nav: true,
                    margin: 30,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    autoplayHoverPause: true,
                    navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
                    responsive: {
                        0: { items: 1 },
                        768: { items: 2 },
                        1200: { items: 3 }
                    }
                });
            }
        }, 500);
    }

    // 2. Inicializa o Mapa (Leaflet)
    initHomeMap();

    // 4. Inicializa o Simulador
    initHomeSimulator();
});

function initHomeMap() {
    if (window.MT_Utils && window.MT_Utils.initMap) {
        window.MT_Utils.initMap('map');
    }
}

function initHomeSimulator() {
    const simForm = document.getElementById('simulator-form');
    if (!simForm) return;

    const wppNumber = '5511960364355';
    const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

    function updateSimResults() {
        const renda = parseFloat(document.getElementById('renda').value) || 0;
        const dividas = parseFloat(document.getElementById('dividas').value) || 0;
        const fgts = parseFloat(document.getElementById('fgts').value) || 0;
        const entrada = parseFloat(document.getElementById('entrada').value) || 0;
        const temDependentes = document.getElementById('dependentes').checked;
        const idade = parseInt(document.getElementById('idade').value) || 30;
        const vinculo = (document.querySelector('input[name="vinculo"]:checked') || {}).value || 'clt';

        document.getElementById('label-renda').textContent = fmt(renda);
        document.getElementById('label-dividas').textContent = fmt(dividas);
        document.getElementById('label-fgts').textContent = fmt(fgts);
        document.getElementById('label-entrada').textContent = fmt(entrada);
        document.getElementById('label-idade').textContent = idade + ' anos';

        // --- VÍNCULO: Condicional de campos ---
        const cltWrap = document.getElementById('clt3anos').closest('.sim-input-wrap');
        if (cltWrap) cltWrap.style.display = vinculo === 'clt' ? '' : 'none';

        // Label dinâmico da renda conforme vínculo
        const rendaLabel = document.querySelector('.group-renda .sim-label-hover');
        const rendaSlider = document.getElementById('renda');
        if (rendaLabel && rendaSlider) {
            const labels = {
                clt: '💰 Renda Bruta Familiar',
                autonomo: '💰 Renda Média Mensal (6 meses)',
                mei: '💰 Faturamento Mensal Médio',
                aposentado: '💰 Benefício Mensal INSS'
            };
            const tooltip = rendaLabel.querySelector('.sim-tooltip');
            const tooltipHTML = tooltip ? tooltip.outerHTML : '';
            rendaLabel.innerHTML = (labels[vinculo] || labels.clt) + ' ' + tooltipHTML;

            // MEI: limitar slider a R$ 6.750
            if (vinculo === 'mei') {
                rendaSlider.max = '6750';
                if (parseFloat(rendaSlider.value) > 6750) rendaSlider.value = '6750';
            } else {
                rendaSlider.max = '30000';
            }
        }

        // --- VÍNCULO: Cards visuais ---
        document.querySelectorAll('.sim-vinculo-card').forEach(function (card) {
            card.classList.toggle('active', card.dataset.vinculo === vinculo);
        });

        // --- CHAMADA DA INTELIGÊNCIA CENTRALIZADA ---
        const clt3anos = document.getElementById('clt3anos').checked;
        const ePrimeiroImovel = document.getElementById('primeiroImovel').checked;

        const d = window.MT_Core.calculateMCMV(renda, dividas, fgts, entrada, temDependentes, clt3anos, ePrimeiroImovel, idade, vinculo);

        // --- BADGE DE PRAZO DINÂMICO ---
        const badgePrazo = document.getElementById('badge-prazo');
        if (badgePrazo) {
            const prazoAnos = Math.floor(d.prazoEfetivo / 12);
            const prazoMeses = d.prazoEfetivo % 12;
            badgePrazo.textContent = 'Prazo máximo: ' + prazoAnos + ' anos' + (prazoMeses > 0 ? ' e ' + prazoMeses + ' meses' : '');
            badgePrazo.style.color = prazoAnos < 25 ? '#ff6b6b' : (prazoAnos < 35 ? '#ffa502' : '#2ed573');
        }

        const temRecursos = (fgts + entrada) > 0;
        const eMercado = (d.excedeTeto || d.foraDoMCMV) && (renda > 0 || temRecursos);

        // --- A) TÍTULO DINÂMICO COM TOOLTIP ---
        const titulo = document.getElementById('sim-results-title');
        if (titulo) {
            if (eMercado) {
                titulo.innerHTML = 'Resultados Estimados de Mercado <span class="sim-info-icon">ℹ️</span>';
                titulo.title = 'Mercado (SBPE/SFH): Financiamento convencional sem os limites do MCMV. Taxas a partir de 9.5% a.a., sem subsídio governamental. Ideal para quem tem capital próprio elevado.';
            } else {
                titulo.innerHTML = 'Resultados Estimados MCMV <span class="sim-info-icon">ℹ️</span>';
                titulo.title = 'Minha Casa Minha Vida: Programa habitacional do governo com taxas reduzidas e subsídios para famílias de renda até R$ 12.000.';
            }
        }

        // --- B) VALORES DOS CARDS (MCMV ou Mercado) ---
        if (eMercado) {
            document.getElementById('r-margem').textContent = fmt(d.margem) + '/mês';
            document.getElementById('r-potencial').textContent = fmt(d.sbpe.potencial);
            document.getElementById('r-poder').textContent = fmt(d.sbpe.poder);
        } else {
            document.getElementById('r-margem').textContent = fmt(d.margem) + '/mês';
            document.getElementById('r-potencial').textContent = fmt(d.potencial);
            document.getElementById('r-poder').textContent = fmt(d.poder);
        }

        // --- C) DESCRIÇÕES CONTEXTUAIS ---
        const descMargem = document.getElementById('desc-margem');
        const descPotencial = document.getElementById('desc-potencial');
        const descPoder = document.getElementById('desc-poder');
        if (eMercado) {
            if (descMargem) descMargem.innerHTML = '<strong>Margem de Segurança:</strong> 30% da sua renda bruta menos dívidas. Este cálculo vale para qualquer modalidade de financiamento (MCMV ou Mercado).';
            if (descPotencial) descPotencial.innerHTML = '<strong>Capacidade Bancária (Mercado):</strong> Valor máximo que o banco financia pela modalidade SBPE/SFH, com taxa de 9.5% a.a. e prazo de 30 anos. Sem limite de teto governamental.';
            if (descPoder) descPoder.innerHTML = '<strong>Poder de Compra (Mercado):</strong> Financiamento de mercado + FGTS + Entrada. Sem subsídio do governo, porém sem limite de valor do imóvel. Ideal para quem tem capital próprio elevado.';
        } else {
            if (descMargem) descMargem.innerHTML = '<strong>Margem de Segurança:</strong> Este valor representa 30% da sua renda mensal bruta, já subtraindo suas dívidas atuais. É o limite máximo que o banco permite comprometer.' + (d.custoMIP > 0 ? ' <em>(Seguros MIP+DFI: ~' + fmt(d.custoMIP + d.custoDFI) + '/mês descontados)</em>' : '');
            if (descPotencial) descPotencial.innerHTML = '<strong>Capacidade Bancária MCMV:</strong> Valor máximo que o banco disponibiliza. Calculado via sistema SAC com taxa de ' + (d.taxaAnualMCMV * 100).toFixed(1) + '% a.a. no prazo de ' + Math.floor(d.prazoEfetivo / 12) + ' anos pelo programa Minha Casa Minha Vida.' + (d.vinculo === 'mei' ? ' <em>(Renda considerada: ' + fmt(d.rendaConsiderada) + ')</em>' : '');
            if (descPoder) descPoder.innerHTML = '<strong>Poder de Compra MCMV:</strong> É a soma de tudo: Financiamento + FGTS + Entrada + Subsídio (' + fmt(d.subsidio) + '). Limitado ao teto da ' + d.faixaMCMV + '.';
        }

        document.getElementById('h_margem').value = fmt(d.margem);
        document.getElementById('h_potencial').value = eMercado ? fmt(d.sbpe.potencial) : fmt(d.potencial);
        document.getElementById('h_poder').value = eMercado ? fmt(d.sbpe.poder) : fmt(d.poder);

        // --- D) BOTÃO CTA — REPOSICIONAMENTO VIA DOM ---
        const btnWrapper = document.getElementById('sim-btn-wrapper');
        const grid = document.querySelector('.sim-results-grid');
        const ctaArea = document.getElementById('sim-comp-cta-area');
        if (btnWrapper && grid && ctaArea) {
            if (eMercado && d.excedeTeto) {
                // Move botão para depois do comparativo
                ctaArea.appendChild(btnWrapper);
            } else {
                // Devolve ao grid
                grid.appendChild(btnWrapper);
            }
            btnWrapper.style.display = 'flex';
        }

        // --- E) COMPARATIVO MCMV vs SBPE ---
        // Só mostra quando excedeTeto (há duas opções reais: MCMV e SBPE)
        // Quando foraDoMCMV sem excedeTeto, NÃO mostra (só SBPE existe)
        const comparativo = document.getElementById('sim-comparativo');
        if (comparativo) {
            if ((d.excedeTeto || d.faixaMCMV === "Faixa 4") && (renda > 0 || temRecursos)) {
                comparativo.style.display = 'block';

                // --- AJUSTE DINÂMICO DE TÍTULO (Bug 2 Fix) ---
                const tituloComp = document.querySelector('.sim-comparativo-titulo');
                if (tituloComp) {
                    tituloComp.innerHTML = d.excedeTeto ?
                        '💡 Seus recursos superam o limite do MCMV. Veja suas opções:' :
                        '💡 Há uma alternativa do Mercado (SBPE) com taxa menor. Compare:';
                }

                // Lado MCMV
                document.getElementById('comp-mcmv-poder').textContent = fmt(d.poder);
                document.getElementById('comp-mcmv-subsidio').textContent = fmt(d.subsidio);
                document.getElementById('comp-mcmv-taxa').textContent = (d.taxaAnualMCMV * 100).toFixed(1) + '%';
                document.getElementById('comp-mcmv-parcela').textContent = fmt(d.parcelaPosChaves);
                // Lado SBPE
                document.getElementById('comp-sbpe-poder').textContent = fmt(d.sbpe.poder);
                document.getElementById('comp-sbpe-taxa').textContent = (d.sbpe.taxa * 100).toFixed(1) + '%';
                document.getElementById('comp-sbpe-parcela').textContent = fmt(d.sbpe.parcela);
            } else {
                comparativo.style.display = 'none';
            }
        }

        const simData = {
            nome: document.getElementById('sim-name').value,
            celular: document.getElementById('sim-celular').value,
            temDependentes,
            renda, dividas, fgts, entrada,
            ...d // Mescla todos os resultados calculados pelo Core
        };

        window.mtSimData = simData;

        // --- LÓGICA DA BARRA DE PROGRESSO INTELIGENTE ---
        function updateProgressBar() {
            let progress = 0;
            const nomeStr = document.getElementById('sim-name').value.trim();
            const celularStr = document.getElementById('sim-celular').value.replace(/\D/g, '');

            if (nomeStr.length >= 3) progress += 15;
            if (celularStr.length >= 10) progress += 15;

            if (renda > 0) progress += 25;
            if (dividas > 0) progress += 15;
            if (fgts > 0) progress += 15;

            // Entrada não é estritamente obrigatória, mas recompensa quem preenche. 
            // Se dependentes for checado, podemos dar 15.
            if (entrada > 0 || temDependentes) progress += 15;

            progress = Math.min(100, progress);

            const fill = document.getElementById('sim-progress-fill');
            const pctText = document.getElementById('sim-progress-pct');
            const mascot = document.getElementById('sim-ia-mascot');
            const msg = document.getElementById('sim-progress-msg');

            if (fill && pctText) {
                fill.style.width = progress + '%';
                pctText.textContent = progress + '%';

                if (progress > 0) {
                    mascot.style.opacity = '1';
                } else {
                    mascot.style.opacity = '0';
                }

                if (progress === 100) {
                    fill.style.background = 'linear-gradient(90deg, #28a745, #8ce09e)';
                    fill.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.6)';
                    pctText.style.color = '#28a745';
                    msg.innerHTML = 'Perfil 100% Qualificado para Análise ⭐';
                    msg.style.color = '#28a745';
                } else {
                    fill.style.background = 'linear-gradient(90deg, #f35525, #ffa07a)';
                    fill.style.boxShadow = '0 0 15px rgba(243, 85, 37, 0.6)';
                    pctText.style.color = '#f35525';
                    if (progress >= 50) {
                        msg.innerHTML = 'Análise em andamento... complete os dados!';
                        msg.style.color = 'rgba(255,255,255,0.9)';
                    } else {
                        msg.innerHTML = 'Aguardando dados iniciais...';
                        msg.style.color = 'rgba(255,255,255,0.7)';
                    }
                }
            }
        }
        updateProgressBar();

        return simData;
    }

    ['renda', 'dividas', 'fgts', 'entrada', 'sim-name', 'sim-celular', 'dependentes', 'clt3anos', 'primeiroImovel', 'idade'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateSimResults);
    });

    // Listener para radio buttons de vínculo
    document.querySelectorAll('input[name="vinculo"]').forEach(radio => {
        radio.addEventListener('change', updateSimResults);
    });

    simForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const nomeStr = document.getElementById('sim-name').value.trim();
        const celularStr = document.getElementById('sim-celular').value.replace(/\D/g, '');
        if (!nomeStr) { alert('Por favor, informe seu nome na área de Identificação.'); return; }
        if (celularStr.length < 10) { alert('Por favor, informe um WhatsApp válido.'); return; }

        const data = updateSimResults();
        const btnSubmit = document.getElementById('btn-final-submit');
        btnSubmit.innerHTML = 'Processando... ⚡';
        btnSubmit.disabled = true;

        // 1. Ativar a "Cortina" de Processamento IA
        const overlay = document.getElementById('sim-loading-overlay');
        if (overlay) overlay.classList.add('is-processing');

        // 2. Envio silencioso do formulário via Fetch
        const fd = new FormData(simForm);

        // 2.A Envio para Planilha Mestre (Webhook Apps Script)
        const payload = new URLSearchParams();
        payload.append('nome', data.nome);
        payload.append('email', data.email || '');
        payload.append('whatsapp', celularStr);
        payload.append('idImovel', window.lastClickedEmpNome || ""); // Se houver um imóvel selecionado
        const formatCurrencySafe = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
        payload.append('potencialCompra', formatCurrencySafe(data.poder));
        payload.append('mensagem', `Simulação MCMV Realizada. Renda: ${formatCurrencySafe(data.renda)} | Poder: ${formatCurrencySafe(data.poder)}`);
        payload.append('origem', 'Simulador MCMV (Site)');

        fetch('https://script.google.com/macros/s/AKfycbzmtDgzbLghMsO0NFMt3CAUDS4lu1E2CjIHibGGSZP_PlWomYcRoYdVE3cIlYxVJDzNlg/exec', {
            method: 'POST',
            body: payload,
            mode: 'no-cors' // Impede bloqueios de CORS do Google Workspace no front-end
        }).catch(err => console.error("Erro ao salvar no AppSheet via Webhook:", err));

        // 2.B Envio original para e-mail (FormSubmit)
        fetch('https://formsubmit.co/mtparceiros@gmail.com', {
            method: 'POST',
            body: fd,
            mode: 'no-cors' // Crucial para formulários do FormSubmit não causarem refresh/redirect
        }).catch(() => { });

        // 3. Montar Link do WhatsApp
        const btnWpp = document.getElementById('btn-wpp');
        if (window.MT_Utils) {
            btnWpp.href = window.MT_Utils.getWhatsAppLink('SIMULADOR', {
                nome: data.nome,
                dependentes: data.temDependentes ? 'Sim' : 'Não',
                renda: data.renda,
                dividas: data.dividas,
                margem: data.margem,
                potencial: data.potencial,
                poder: data.poder
            });
        } else {
            const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
            const msgWpp = [
                '🏠 *NOVA SIMULAÇÃO — MT Parceiros*',
                '━━━━━━━━━━━━━━━━━━━',
                '👤 Cliente: ' + data.nome,
                '👨‍👩‍👧‍👦 Dependentes: ' + (data.temDependentes ? 'Sim' : 'Não'),
                '💰 Renda: ' + fmt(data.renda),
                '💳 Dívidas: ' + fmt(data.dividas),
                '━━━━━━━━━━━━━━━━━━━',
                '📊 Parcela: ' + fmt(data.margem) + '/mês',
                '🏦 Financiamento: ' + fmt(data.potencial),
                '🏡 Poder Total: ' + fmt(data.poder),
                '━━━━━━━━━━━━━━━━━━━',
                'MT Parceiros | (11) 96036-4355'
            ].join('\n');
            btnWpp.href = 'https://wa.me/5511960364355?text=' + encodeURIComponent(msgWpp);
        }

        // 4. Experiência de Loading (3 Segundos)
        setTimeout(() => {
            const dashboard = document.getElementById('sim-dashboard');
            if (dashboard) dashboard.style.display = 'none';

            // G7: Usar poder correto para recomendações
            const poderEfetivo = (data.foraDoMCMV || data.excedeTeto) ?
                (data.sbpe ? data.sbpe.poder : data.poderReal) : data.poder;
            recomendarImoveis(poderEfetivo);

            // SUBTÍTULO: Mostra qual valor de imóvel está sendo detalhado
            const planoSub = document.getElementById('plano-subtitulo');
            if (planoSub) {
                const modalidade = (data.foraDoMCMV || data.excedeTeto) ? 'Mercado (SBPE)' : 'MCMV';
                planoSub.innerHTML = 'Para um imóvel de <strong>' + fmt(data.valorImovel) + '</strong> (' + modalidade + '), este é o fluxo estimado de pagamento:';
            }

            // G5+G6: Plano de Pagamento inteligente
            const cardEntrada = document.getElementById('card-entrada');
            const cardEvolucao = document.getElementById('card-evolucao');
            const cardPosChaves = document.getElementById('card-pos-chaves');
            const planoAvista = document.getElementById('plano-avista');
            const planoTimeline = document.getElementById('plano-timeline');

            if (data.parcelaPosChaves === 0 && data.parcelaEntrada === 0) {
                // CENÁRIO: PAGAMENTO À VISTA
                if (cardEntrada) cardEntrada.style.display = 'none';
                if (cardEvolucao) cardEvolucao.style.display = 'none';
                if (cardPosChaves) cardPosChaves.style.display = 'none';
                if (planoTimeline) planoTimeline.style.display = 'none';
                if (planoAvista) {
                    planoAvista.style.display = 'block';
                    const avistaMsg = document.getElementById('plano-avista-msg');
                    if (avistaMsg) {
                        avistaMsg.innerHTML = 'Seus recursos de <strong>' + fmt((data.fgts || 0) + (data.entrada || 0)) +
                            '</strong> cobrem o valor total do imóvel de <strong>' + fmt(data.valorImovel) +
                            '</strong>.<br>Sem financiamento bancário, sem juros, sem parcelas mensais.';
                    }
                }
            } else {
                if (planoAvista) planoAvista.style.display = 'none';
                if (planoTimeline) planoTimeline.style.display = 'block';
                // G5: Esconder card entrada se R$ 0
                if (data.parcelaEntrada === 0) {
                    if (cardEntrada) cardEntrada.style.display = 'none';
                } else {
                    if (cardEntrada) cardEntrada.style.display = '';
                    document.getElementById('r-parcela-entrada').textContent = fmt(data.parcelaEntrada);
                }
                if (cardEvolucao) cardEvolucao.style.display = '';
                if (cardPosChaves) cardPosChaves.style.display = '';
                document.getElementById('r-evolucao').textContent = fmt(data.evolucaoMedia);
                document.getElementById('r-pos-chaves').textContent = fmt(data.parcelaPosChaves);
            }

            // G8: Label prazo conforme modalidade
            const labelPrazo = document.getElementById('label-prazo-pos');
            if (labelPrazo) {
                const prazoAnosPos = Math.floor(d.prazoEfetivo / 12);
                labelPrazo.textContent = 'Após receber as chaves (até ' + prazoAnosPos + ' anos)';
            }

            const step4 = document.getElementById('step-4');
            if (step4) {
                step4.style.display = 'block';
                step4.style.animation = 'heroFadeIn 0.8s ease forwards';
            }
            document.getElementById('wpp-box').style.display = 'flex';

            document.getElementById('simulador').scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Remover a cortina (fade out)
            if (overlay) {
                overlay.classList.add('is-hidden');
            }

            // FEEDBACK VISUAL DE APROVAÇÃO
            const comprometimento = data.parcelaPosChaves + data.dividas;
            const isAprovado = (data.renda > 0) && (comprometimento <= (data.renda * 0.35));
            const badge = document.getElementById('sim-approval-badge');
            const progressFill = document.getElementById('sim-progress-fill');
            const mascot = document.getElementById('sim-ia-mascot');

            if (isAprovado) {
                if (badge) {
                    badge.style.display = 'flex';
                    if (data.foraDoMCMV) {
                        badge.style.background = 'rgba(0, 86, 179, 0.15)';
                        badge.style.borderColor = 'rgba(0, 86, 179, 0.3)';
                        badge.querySelector('span').style.color = '#0056b3';
                        badge.querySelector('span').style.textShadow = '0 0 5px rgba(0, 86, 179, 0.4)';
                        badge.querySelector('span').textContent = 'Análise Concluída: Perfil SBPE/Mercado 🏦';
                    } else {
                        badge.style.background = 'rgba(40, 167, 69, 0.15)';
                        badge.style.borderColor = 'rgba(40, 167, 69, 0.3)';
                        badge.querySelector('span').style.color = '#28a745';
                        badge.querySelector('span').style.textShadow = '0 0 5px rgba(40, 167, 69, 0.4)';
                        badge.querySelector('span').textContent = 'Análise Concluída: Crédito Pré-Aprovado ⭐';
                    }
                }

                if (progressFill) {
                    progressFill.style.background = data.foraDoMCMV ? 'linear-gradient(90deg, #0056b3, #66b2ff)' : 'linear-gradient(90deg, #28a745, #8ce09e)';
                    progressFill.style.boxShadow = data.foraDoMCMV ? '0 0 15px rgba(0, 86, 179, 0.6)' : '0 0 15px rgba(40, 167, 69, 0.6)';
                }
                if (mascot) {
                    mascot.style.filter = data.foraDoMCMV ?
                        'drop-shadow(0 0 10px rgba(0, 86, 179, 0.6)) hue-rotate(200deg) brightness(0.9)' :
                        'drop-shadow(0 0 10px rgba(40, 167, 69, 0.6)) hue-rotate(115deg) brightness(0.9)';
                }
            } else {
                if (badge) badge.style.display = 'none';
            }

        }, 3000);
    });

    function recomendarImoveis(poderDeCompra) {
        const container = document.getElementById('sim-match-container');
        if (!container) return;
        container.innerHTML = '';

        if (typeof EMPREENDIMENTOS === 'undefined' || !Array.isArray(EMPREENDIMENTOS)) {
            container.innerHTML = '<div style="text-align:center; padding: 20px;"><h6>Análise Concluída!</h6><p>Fale com nosso corretor.</p></div>';
            return;
        }

        const parsePreco = (s) => {
            if (!s) return Infinity;
            let num = parseInt(s.replace(/[^\d]/g, ''), 10);
            if (s.toLowerCase().includes('mil')) num *= 1000;
            return num || Infinity;
        };

        const limite = poderDeCompra;
        let matches = EMPREENDIMENTOS.filter(emp => parsePreco(emp.preco) <= limite);
        matches.sort((a, b) => parsePreco(b.preco) - parsePreco(a.preco));
        matches = matches.slice(0, 3);

        if (matches.length > 0) {
            matches.forEach(emp => {
                const card = document.createElement('div');
                card.className = 'sim-match-card';
                card.innerHTML = `
                <div class="sim-match-img schedule-visit-link" data-emp-nome="${emp.nome}" style="background-image: url('${emp.imagem}'); cursor: pointer;"></div>
                <div class="sim-match-info">
                  <h6>${emp.nome}</h6>
                  <p class="sim-match-price">A partir de R$ ${emp.preco}</p>
                  <a href="#" class="sim-btn-agendar schedule-visit-link" data-emp-nome="${emp.nome}">ℹ️ Mais informações</a>
                </div>
              `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<div style="text-align:center; padding: 20px;"><h6>Oportunidades exclusivas!</h6><p>Fale com nosso corretor para opções sob medida.</p></div>';
        }
    }

    // --- NOVA FUNCIONALIDADE: EXPORTAR PARA PLANILHA DINÂMICA ---
    const btnDownload = document.getElementById('btn-download-planilha');
    if (btnDownload) {
        btnDownload.addEventListener('click', async function () {
            if (!window.mtSimData || typeof ExcelJS === 'undefined') {
                alert("Aguarde a simulação ou recarregue a página.");
                return;
            }
            const d = window.mtSimData;

            btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando seu Laudo Avançado...';
            btnDownload.disabled = true;

            try {
                // 1. Fetch template pré-gerado pelo Python (com cache-buster para evitar versões antigas)
                const response = await fetch(`assets/docs/template_mt_parceiros.xlsx?v=${new Date().getTime()}`);
                if (!response.ok) throw new Error("Template não encontrado no servidor.");
                const arrayBuffer = await response.arrayBuffer();

                // 2. Carregar o Workbook
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(arrayBuffer);

                // 3. Injetar dados na aba Início (Apenas o Nome, os cards usam fórmulas)
                const wsInicio = workbook.getWorksheet('Início');
                if (wsInicio) {
                    wsInicio.getCell('E23').value = d.nome || 'Cliente MT'; // inicio.nome
                    wsInicio.getCell('Z35').value = d.entrada || 0; // inicio.d_inicial (Sync Oculto)
                    // REMOVIDO: Sobrescrever C35, G35, K35 com números quebra o recalculo no Excel.
                }

                // 3.5 MANTIDO: 'System Data' é essencial para as fórmulas de VLOOKUP e Validação
                // Removido o comando de deletar para evitar erros #REF!

                // 4. Injetar dados na aba Educação Financeira e Restaurar Dropdown
                const wsSimul = workbook.getWorksheet('Educação Financeira');
                if (wsSimul) {
                    wsSimul.getCell('D9').value = d.nome || 'Cliente MT';
                    wsSimul.getCell('E13').value = d.renda || 0;
                    wsSimul.getCell('E24').value = d.fgts || 0;

                    // Injeta como valor numérico para permitir edição manual posterior no Excel
                    wsSimul.getCell('E14').value = d.entrada || 0;

                    wsSimul.getCell('E26').value = d.carteira ? 'SIM' : 'NÃO';
                    wsSimul.getCell('E17').value = d.dividas || 0;

                    // Restaura a formatação do Dropdown que o ExcelJS apaga durante a cópia da matriz
                    // No novo layout o seletor fica em E36 e a lista em Z60:Z85
                    wsSimul.getCell('E36').dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: [`'Educação Financeira'!$Z$60:$Z$${60 + (typeof EMPREENDIMENTOS !== 'undefined' ? EMPREENDIMENTOS.length : 25)}`],
                        showErrorMessage: true,
                        errorTitle: 'Imóvel Inválido',
                        error: 'Por favor, selecione um imóvel da lista suspensa.'
                    };
                }

                // 4.5 Restaurar Dropdowns da aba Fluxo Mensal (Offset corrigido para linha 16)
                const wsFluxo = workbook.getWorksheet('Fluxo Mensal');
                if (wsFluxo) {
                    // Coluna B (Pago?), linhas 16 até 51 (36 meses)
                    for (let i = 16; i <= 51; i++) {
                        const cell = wsFluxo.getCell(`B${i}`);
                        cell.dataValidation = {
                            type: 'list',
                            allowBlank: false,
                            formulae: ['"Sim,Não"'],
                            showErrorMessage: true,
                            errorTitle: 'Valor Inválido',
                            error: 'Escolha Sim ou Não.'
                        };
                    }
                }

                // 5. Injetar Outputs Explícitos no Laudo de Crédito (Bypass de Fórmulas lazy)
                // REMOVIDO: Agora o Laudo usa fórmulas nativas que se conectam à Educação Financeira.
                // Injetamos apenas o Score IA se for um valor não calculável facilmente por fórmulas simples.
                const wsLaudo = workbook.getWorksheet('Laudo de Crédito');
                if (wsLaudo) {
                    // Lógica do Score IA MT (Calculamos aqui e injetamos o resultado final)
                    const comprometimento = (d.parcelaPosChaves + (d.dividas || 0));
                    let p1 = Math.min(35, Math.max(0, 35 - ((comprometimento / (d.renda || 1)) - 0.30) * 200));
                    let p2 = Math.min(25, (d.fgts / 50000) * 25);
                    const comprometimentoPct = (comprometimento / Math.max(1, d.renda)) * 100;
                    // Se compromete até 25% = 20 pontos. Zera gradualmente até chegar aos 40% de comprometimento.
                    let p3 = Math.max(0, Math.min(20, (1 - (comprometimentoPct - 25) / 15) * 20));
                    let p4 = Math.min(20, (d.entrada / 20000) * 20);
                    let score = Math.round(Math.min(100, Math.max(0, p1 + p2 + p3 + p4)));
                    if (isNaN(score) || d.renda === 0) score = 0;

                    wsLaudo.getCell('C31').value = score; // Posicionado CORRETAMENTE no merge C31:E32
                }

                // 5. Gerar novo Buffer e Download
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;

                // Formatação segura de nome de arquivo (Evita perder a extensão .xlsx no Windows)
                let safeName = d.nome ? d.nome.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : "Cliente";
                if (!safeName) safeName = "Cliente";
                a.download = `Laudo_MT_Parceiros_${safeName}.xlsx`;

                document.body.appendChild(a);
                a.click();

                // Cleanup preventivo: aguardar 5 segundos para revogar o Blob
                // Um delay de 100ms pode forçar o navegador a usar o UUID do Blob como nome do arquivo.
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    btnDownload.innerHTML = '<i class="fas fa-check"></i> Planilha Baixada com Sucesso!';

                    setTimeout(() => {
                        btnDownload.innerHTML = '<i class="fas fa-file-excel"></i> Baixar Planilha de Controle de Valores';
                        btnDownload.disabled = false;
                    }, 4000);
                }, 5000);

            } catch (error) {
                console.error("Erro ao gerar a planilha (ExcelJS):", error);
                alert("Oops! Houve um problema ao preparar a sua planilha personalizada.\nVerifique se o template existe na pasta assets/docs.");
                btnDownload.innerHTML = '<i class="fas fa-file-excel"></i> Baixar Planilha de Controle de Valores';
                btnDownload.disabled = false;
            }
        });
    }

    // --- NOVA FUNCIONALIDADE: CARDS EXPANSÍVEIS (ACCORDION) ---
    document.querySelectorAll('.sim-glow-card').forEach(card => {
        card.addEventListener('click', function () {
            const isActive = this.classList.contains('active');

            // Fecha todos os outros cards
            document.querySelectorAll('.sim-glow-card').forEach(c => c.classList.remove('active'));

            // Se o clicado não estava ativo, abre ele
            if (!isActive) {
                this.classList.add('active');
            }
        });
    });

    // --- TOOLTIPS: TAP TOGGLE PARA MOBILE ---
    document.querySelectorAll('.sim-label-hover').forEach(label => {
        label.addEventListener('click', function (e) {
            e.stopPropagation();
            const wasActive = this.classList.contains('tooltip-active');
            // Fecha todos os tooltips
            document.querySelectorAll('.sim-label-hover').forEach(l => l.classList.remove('tooltip-active'));
            // Abre o clicado (se não estava aberto)
            if (!wasActive) {
                this.classList.add('tooltip-active');
            }
        });
    });
    // Fechar tooltip ao tocar fora
    document.addEventListener('click', function () {
        document.querySelectorAll('.sim-label-hover').forEach(l => l.classList.remove('tooltip-active'));
    });

    // --- PROTEÇÃO DE INTERFACE (ANTI-COPY) ---
    const simSection = document.getElementById('simulador');
    if (simSection) {
        // 1. Bloqueia Clique Direito apenas no simulador
        simSection.addEventListener('contextmenu', e => e.preventDefault());

        // 2. Bloqueia atalhos de inspeção (F12, Ctrl+Shift+I, Ctrl+U)
        simSection.addEventListener('keydown', function (e) {
            if (
                e.keyCode === 123 || // F12
                (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
                (e.ctrlKey && e.keyCode === 85) // Ctrl+U (Ver código fonte)
            ) {
                e.preventDefault();
                return false;
            }
        });
    }

    updateSimResults();
}
