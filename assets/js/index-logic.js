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

        document.getElementById('label-renda').textContent = fmt(renda);
        document.getElementById('label-dividas').textContent = fmt(dividas);
        document.getElementById('label-fgts').textContent = fmt(fgts);
        document.getElementById('label-entrada').textContent = fmt(entrada);

        const margem = Math.max(0, (renda * 0.30) - dividas);

        // --- ALGORITMO MINHA CASA MINHA VIDA (MCMV) ---
        // 1. Fator de Financiamento (Progressivo de Acordo com a Taxa de Juros - Tabela Price/SAC)
        // Rendas baixas possuem menor juros (maior fator). Rendas altas vão pro SBPE.
        let fatorFinanc = 210;
        if (renda <= 2640) fatorFinanc = 340;      // Faixa 1 (Taxa ~4.00%)
        else if (renda <= 3200) fatorFinanc = 310;
        else if (renda <= 4400) fatorFinanc = 270; // Faixa 2 (Taxa ~5.50%)
        else if (renda <= 8000) fatorFinanc = 230; // Faixa 3 (Taxa ~7.66%)

        const potencial = margem * fatorFinanc;

        // 2. Subsídio Dinâmico SP (Benefício que o Governo injeta na entrada)
        // Teto de R$ 55.000,00 para rendas mínimas. Zera em R$ 4.400,00.
        let subsidio = 0;
        if (renda > 0 && renda <= 4400) {
            // Regra de três invertida simplificada da Caixa:
            // Renda base limite inferior (ex: R$ 2000) pega quase O MÁXIMO (R$ 55.000). Renda R$ 4400 pega 0.
            const diferencaAteOTeto = 4400 - Math.max(2000, renda); // Se a pessoa ganha 1500, o cálculo trava em 2000 pra dar o teto
            // Cada real a menos que R$ 4400 gera aprox R$ 22.9 de subsídio (2400 * 22.9 = ~55000)
            subsidio = diferencaAteOTeto * 22.91;

            // REGRA PROFISSIONAL: Se não tem dependente, o subsídio cai drasticamente (~70% de redutor)
            if (!temDependentes) {
                subsidio = subsidio * 0.30;
            }
        }

        const poder = Math.ceil((potencial + fgts + entrada + subsidio) / 1000) * 1000;

        document.getElementById('r-margem').textContent = fmt(margem) + '/mês';
        document.getElementById('r-potencial').textContent = fmt(potencial);
        document.getElementById('r-poder').textContent = fmt(poder);

        document.getElementById('h_margem').value = fmt(margem);
        document.getElementById('h_potencial').value = fmt(potencial);
        document.getElementById('h_poder').value = fmt(poder);

        // --- NOVOS CÁLCULOS: OBRA E PÓS-CHAVES ---
        const mesesObra = 36;
        const prazoFinanciamento = 420; // 35 anos

        const parcelaPosChaves = margem; // Parcela base do financiamento

        // Entrada total exigida costuma ser 20% do imóvel
        const valorImovel = poder;
        const entradaMinima = valorImovel * 0.20;
        const recursosProprios = fgts + entrada;
        let saldoEntrada = entradaMinima - recursosProprios;
        if (saldoEntrada < 0) saldoEntrada = 0;

        // ESTRATÉGIA DE VENDAS: Fracionamento do Saldo de Entrada
        // Para não assustar o cliente, usamos o padrão de mercado das construtoras:
        // Ex: 35% do saldo em 36 mensais, 35% em 3 Balões Anuais, 30% na entrega das Chaves.
        let saldoMensais = saldoEntrada * 0.35;
        let parcelaEntrada = saldoMensais / mesesObra;

        let saldoAnuais = saldoEntrada * 0.35;

        const chaves = saldoEntrada * 0.30; // 30% no último mês (Chaves)

        // REGRA DE NEGÓCIO: Mensais da entrada não podem ser menores que R$ 500,00 
        // caso o cliente não tenha dado entrada em dinheiro ou não tenha usado FGTS.
        if (recursosProprios === 0 && parcelaEntrada > 0 && parcelaEntrada < 500) {
            parcelaEntrada = 500;
            saldoMensais = parcelaEntrada * mesesObra;
            // O que foi aumentado nas mensais, descontamos dos Balões Anuais pra equilibrar
            saldoAnuais = saldoEntrada - saldoMensais - chaves;
            if (saldoAnuais < 0) saldoAnuais = 0; // Travas preventivas
        }

        const parcelaAnuais = saldoAnuais / 3; // 3 balões (mês 12, 24 e 36)

        // A evolução de obra (Juros de Obra da Caixa) é progressiva. 
        // A média paga durante a obra costuma ser 50% da parcela cheia.
        const evolucaoMedia = margem / 2;

        const simData = {
            nome: document.getElementById('sim-name').value,
            celular: document.getElementById('sim-celular').value,
            temDependentes,
            renda, dividas, fgts, entrada, margem, potencial, subsidio, poder,
            mesesObra, prazoFinanciamento, parcelaPosChaves, valorImovel, saldoEntrada,
            parcelaEntrada, parcelaAnuais, chaves, evolucaoMedia
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

    ['renda', 'dividas', 'fgts', 'entrada', 'sim-name', 'sim-celular', 'dependentes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateSimResults);
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

        fetch('https://script.google.com/macros/s/AKfycbxuAsqCJPfFO7Gi4B8EGYqzlV1x1_T-aXx36USWUgdFF7gF1Cjv8VAyeeKrRfYDe5LmQw/exec', {
            method: 'POST',
            body: payload,
            mode: 'no-cors' // Impede bloqueios de CORS do Google Workspace no front-end
        }).catch(err => console.error("Erro ao salvar no AppSheet:", err));

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

            recomendarImoveis(data.poder);

            // Preencher os novos cards de Evolução e Parcelas
            document.getElementById('r-parcela-entrada').textContent = fmt(data.parcelaEntrada);
            document.getElementById('r-evolucao').textContent = fmt(data.evolucaoMedia);
            document.getElementById('r-pos-chaves').textContent = fmt(data.parcelaPosChaves);

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
                if (badge) badge.style.display = 'flex';
                // Força a barra a ficar verde, independentemente do "pct" preenchido
                if (progressFill) {
                    progressFill.style.background = 'linear-gradient(90deg, #28a745, #8ce09e)';
                    progressFill.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.6)';
                }
                if (mascot) {
                    mascot.style.filter = 'drop-shadow(0 0 10px rgba(40, 167, 69, 0.6)) hue-rotate(115deg) brightness(0.9)'; // Tint verde escuro na IA
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
                // 1. Fetch template pré-gerado pelo Python
                const response = await fetch('assets/docs/template_mt_parceiros.xlsx');
                if (!response.ok) throw new Error("Template não encontrado no servidor.");
                const arrayBuffer = await response.arrayBuffer();

                // 2. Carregar o Workbook
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(arrayBuffer);

                // 3. Injetar dados na aba Início
                const wsInicio = workbook.getWorksheet('Início');
                if (wsInicio) {
                    wsInicio.getCell('E23').value = d.nome || 'Cliente MT'; // inicio.nome
                    wsInicio.getCell('C35').value = d.parcelaEntrada || 0; // inicio.m_entrada
                    wsInicio.getCell('G35').value = d.evolucaoMedia || 0; // inicio.m_evolucao
                    wsInicio.getCell('K35').value = d.parcelaPosChaves || 0; // inicio.m_parcela
                }

                // 3.5 Remover permanentemente 'System Data' contra leitores independentes (Google Sheets)
                const wsSystem = workbook.getWorksheet('System Data');
                if (wsSystem) {
                    workbook.removeWorksheet(wsSystem.id);
                }

                // 4. Injetar dados na aba Educação Financeira e Restaurar Dropdown
                const wsSimul = workbook.getWorksheet('Educação Financeira');
                if (wsSimul) {
                    wsSimul.getCell('D9').value = d.nome || 'Cliente MT';
                    wsSimul.getCell('E13').value = d.renda || 0;
                    wsSimul.getCell('E24').value = d.fgts || 0;
                    wsSimul.getCell('E14').value = d.entrada || 0;
                    wsSimul.getCell('E26').value = d.carteira ? 'SIM' : 'NÃO';
                    wsSimul.getCell('E17').value = d.dividas || 0;

                    // Restaura a formatação do Dropdown que o ExcelJS apaga durante a cópia da matriz
                    wsSimul.getCell('H5').dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: ['"Educação Financeira"!$Z$2:$Z$25'],
                        showErrorMessage: true,
                        errorTitle: 'Imóvel Inválido',
                        error: 'Por favor, selecione um imóvel da lista suspensa.'
                    };
                }

                // 4.5 Restaurar Dropdowns da aba Fluxo Mensal (ExcelJS pode perdê-los no load/save)
                const wsFluxo = workbook.getWorksheet('Fluxo Mensal');
                if (wsFluxo) {
                    // Coluna B (Pago?), linhas 13 até 48 (36 meses)
                    for (let i = 13; i <= 48; i++) {
                        const cell = wsFluxo.getCell(`B${i}`);
                        cell.dataValidation = {
                            type: 'list',
                            allowBlank: false,
                            formulae: ['"Sim,Não"'], // Lista direta funciona melhor cross-platform no JS
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
                    let p3 = 20;
                    let p4 = Math.min(20, (d.entrada / 20000) * 20);
                    let score = Math.round(Math.min(100, Math.max(0, p1 + p2 + p3 + p4)));
                    if (isNaN(score) || d.renda === 0) score = 0;

                    wsLaudo.getCell('C30').value = score; // Posicionado no grande card de Score
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

    updateSimResults();
}
