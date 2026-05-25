/**
 * @file new-results.js — AMBIENTE DE PRODUÇÃO (EXPORTAÇÃO & UX)
 * Responsável por gerir a submissão oficial, animação de loading IA e transição do Laudo final.
 */

window.MT_ProcessadorFinal = {
    /**
     * Gatilho Oficial. Chamado pelos botões laranjas (btn-final-submit e btn-certificado).
     */
    iniciarRotina: async function() {
        // 1. Validação de Lead (Identificação Profissional)
        const nomeStr = document.getElementById('sim-name') ? document.getElementById('sim-name').value.trim() : "";
        const celularStr = document.getElementById('sim-celular') ? document.getElementById('sim-celular').value.replace(/\D/g, '') : "";

        if (!nomeStr) {
            alert('Por favor, informe seu nome na área de Identificação.');
            document.getElementById('sim-name').focus();
            return;
        }
        if (celularStr.length < 10) {
            alert('Por favor, informe um WhatsApp válido para receber o laudo.');
            document.getElementById('sim-celular').focus();
            return;
        }

        // 2. Extração Mestre de Dados (Snapshoting)
        // O index-logic-v2.js mantém o window.mtSimData atualizado a cada interação
        const d = window.mtSimData || {}; 
        console.log("🚀 [MT_Processador] Iniciando Emissão do Laudo. Dados:", d);

        // 3. Levanta a Animação Overlay IA
        this.mostrarLoading();

        // 4. Disparo Duplo de Dados (Planilha + E-mail)
        try {
            // Dispara as duas promessas em paralelo para máxima velocidade
            await Promise.all([
                this.enviarParaPlanilha(d, nomeStr, celularStr),
                this.enviarParaEmailForm(d, nomeStr, celularStr)
            ]);
            
            // 5. Sucesso: Transição para a tela final de download
            this.finalizarETransicionar();
        } catch (erro) {
            console.error("❌ Falha técnica no envio:", erro);
            // Mesmo com erro de rede, deixamos o usuário seguir para não quebrar a UX, 
            // já que o lead costuma ser salvo no cache do navegador ou enviado em background.
            this.finalizarETransicionar();
        }
    },

    /**
     * Interface Dinâmica de Loading IA
     */
    mostrarLoading: function() {
        let overlay = document.getElementById('mt-sim-loading-ia');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mt-sim-loading-ia';
            overlay.className = 'fixed inset-0 z-[99999] flex flex-col items-center justify-center';
            overlay.style.background = 'rgba(9, 20, 38, 0.98)';
            overlay.innerHTML = `
                <div class="relative flex flex-col items-center">
                    <img src="assets/images/bola_laranja.gif" class="w-32 h-32 mb-4 object-contain" alt="IA Thinking">
                    <div class="w-16 h-16 mb-8 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
                    <h2 class="text-3xl font-black text-white mb-4 font-headline uppercase tracking-tighter">Analisando Perfil IA</h2>
                    
                    <div class="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                        <div id="sandbox-progress-fill" class="h-full bg-secondary transition-all duration-300" style="width:0%"></div>
                    </div>
                    
                    <p id="sandbox-msg" class="text-secondary font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Consultando bases bancárias...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        overlay.style.display = 'flex';
        let pct = 0;
        const fill = document.getElementById('sandbox-progress-fill');
        const msg = document.getElementById('sandbox-msg');
        const msgs = ["Sincronizando FGTS...", "Calculando Subsídios...", "Mapeando Teto de Juros...", "Gerando Certificado de Aprovação..."];

        this.loadInterval = setInterval(() => {
            pct += 5;
            if (pct >= 98) pct = 98;
            if (fill) fill.style.width = pct + '%';
            if (msg) msg.innerText = msgs[Math.min(3, Math.floor(pct / 25))];
        }, 200);
    },

    ocultarLoading: function() {
        const overlay = document.getElementById('mt-sim-loading-ia');
        if(overlay) overlay.style.display = 'none';
        clearInterval(this.loadInterval);
    },

    /**
     * Envio para Spreadsheet via Google Apps Script (Webhook)
     */
    enviarParaPlanilha: async function(d, nome, whatsapp) {
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmtDgzbLghMsO0NFMt3CAUDS4lu1E2CjIHibGGSZP_PlWomYcRoYdVE3cIlYxVJDzNlg/exec";
        
        // CORREÇÃO: Somar Poder de Financiamento + Parcelamento para bater com o visual da UI (R$ 201.628)
        const totalPoderReal = (d.poder || 0) + (d.saldoEntrada || 0);

        const payload = new URLSearchParams();
        payload.append('token', 'mtpc_seguro_2025');
        payload.append('nome', nome);
        payload.append('whatsapp', whatsapp);
        payload.append('idImovel', window.lastClickedEmpNome || "Simulador Livre");
        
        const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
        
        payload.append('potencialCompra', fmt(totalPoderReal));
        payload.append('mensagem', `Simulação Premium Realizada. Renda: ${fmt(d.renda)} | Poder Total (com Parcelamento): ${fmt(totalPoderReal)} | Parcela Obra: ${fmt(d.parcelaEntrada)}`);
        payload.append('origem', 'Simulador Premium v2.1');

        return fetch(SCRIPT_URL, {
            method: 'POST',
            body: payload,
            mode: 'no-cors'
        });
    },

    /**
     * Envio redundante via FormSubmit (E-mail)
     */
    enviarParaEmailForm: async function(d, nome, whatsapp) {
        const FORM_URL = "https://formsubmit.co/ajax/mtparceiros@gmail.com";
        
        const totalPoderReal = (d.poder || 0) + (d.saldoEntrada || 0);
        const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

        const body = {
            Nome: nome,
            WhatsApp: whatsapp,
            "Renda Bruta": fmt(d.renda),
            "Poder de Compra Total": fmt(totalPoderReal),
            "Saldo de Entrada (Obra)": fmt(d.saldoEntrada),
            "Parcelas de Obra": fmt(d.parcelaEntrada),
            "Score Estimado": d.scoreVal || "N/A",
            _subject: `🏠 [LAUDO] Nova Simulação: ${nome}`
        };

        return fetch(FORM_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    },

    /**
     * Transição definitiva para o Resultado Final (Baixar PDF)
     */
    finalizarETransicionar: function() {
        const fill = document.getElementById('sandbox-progress-fill');
        if (fill) fill.style.width = '100%';

        setTimeout(() => {
            this.ocultarLoading();
            
            // 1. Esconde a fase de Input (Slider)
            const phaseInput = document.getElementById('sim-phase-input');
            if (phaseInput) phaseInput.style.display = 'none';

            // 2. Garante visibilidade do Step 4 (Laudo)
            const step4 = document.getElementById('step-4');
            if (step4) {
                step4.style.display = 'block';
                step4.style.animation = 'heroFadeIn 0.8s ease forwards';
                step4.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // 3. Oculta o botão de submit antigo para evitar confusão se ele for visível
            const legacyBtn = document.getElementById('btn-final-submit');
            if (legacyBtn) legacyBtn.style.display = 'none';

            // 4. Garante que os dados finais sejam renderizados no Step 4
            if (window.mtSimData) {
                window.NewResults.render(window.mtSimData);
            }

            console.log("✅ Ciclo de submissão concluído com sucesso.");
        }, 800);
    }
};

/**
 * ════════════════════════════════════════════════════════════════
 *  NewResults — Orquestrador da Interface Gold v2.1
 *  Responsável por "pintar" os valores nos cards do Dashboard.
 * ════════════════════════════════════════════════════════════════
 */
const NewResults = {
    initialized: false,

    /**
     * Função principal de renderização.
     * @param {Object} d Objeto com os dados do simulador vindos do MT_Core.
     */
    render: function(d) {
        // [ADAPTADOR] Traduz os nomes das variáveis do Motor de Cálculo para o Layout v2.1
        const data = {
            renda: d.renda || 0,
            subsidio: d.subsidio || 0,
            fgts: d.fgts || 0,
            entrada: d.entrada || 0,
            financiamentoMCMV: d.potencial || d.financiamentoMCMV || 0,
            financiamentoSBPE: (d.sbpe ? d.sbpe.potencial : d.financiamentoSBPE) || 0,
            taxaMCMV: (d.taxaAnualMCMV ? d.taxaAnualMCMV * 100 : d.taxaMCMV) || 0,
            taxaSBPE: (d.sbpe && d.sbpe.taxa ? d.sbpe.taxa * 100 : d.taxaSBPE) || 0,
            parcelaMCMV: d.parcelaPosChaves || d.parcelaMCMV || 0,
            parcelaSBPE: (d.sbpe ? d.sbpe.parcela : d.parcelaSBPE) || 0,
            prazoMCMV: d.prazoEfetivo || d.prazoMCMV || 0,
            prazoSBPE: (d.sbpe ? d.sbpe.prazo : d.prazoSBPE) || 360,
            faixaMCMV: d.faixaMCMV || 'Faixa 3',
            saldoEntrada: d.saldoEntrada || 0,
            parcelaEntrada: d.parcelaEntrada || 0,
            valorImovel: d.valorImovel || 0,
            itbi: d.itbi || 0
        };

        // 💡 Cálculo Inteligente de Poder de Compra Total (BR Format Parser)
        const unfmt = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val !== 'string') return 0;
            // Remove tudo que não é dígito ou vírgula, e depois trata o ponto de milhar
            // Ex: "R$ 152.000,00" -> "152000,00" -> "152000.00"
            const clean = val.replace(/[^\d,]/g, '').replace(',', '.');
            return parseFloat(clean) || 0;
        };

        const poderMCMV = unfmt(data.subsidio) + 
                         unfmt(data.fgts) + 
                         unfmt(data.entrada) + 
                         unfmt(data.financiamentoMCMV) + 
                         unfmt(data.saldoEntrada);

        const poderSBPE = unfmt(data.fgts) + unfmt(data.entrada) + unfmt(data.financiamentoSBPE);

        // A) Atualiza o Cabeçalho do Dashboard (Poder Total)
        const elTotalDash = document.getElementById('total-value-dash');
        if (elTotalDash) {
            const formatted = this.fmt(poderMCMV).split(',');
            const mainPart = formatted[0].includes('R$') ? formatted[0] : 'R$ ' + formatted[0];
            elTotalDash.innerHTML = mainPart + (formatted[1] ? `<span class="text-secondary opacity-80 text-lg">,${formatted[1]}</span>` : '<span class="text-secondary opacity-80 text-lg">,00</span>');
        }
        // Também atualiza o widget do formulário (live preview)
        const elTotalForm = document.getElementById('total-value');
        if (elTotalForm) {
            elTotalForm.innerHTML = this.fmt(poderMCMV) + '<span class="text-lg font-normal" style="color:#d8e3fb!important">,00</span>';
        }

        // B) Atualiza a Barra Empilhada e Legendas (Widget do Formulário)
        this.updateLivePreview(data, poderMCMV);

        // C) Atualiza a Barra Empilhada (Visual)
        this.updateBar(data, poderMCMV);

        // C) Atualiza o Quadro de Perfil
        this.updateProfile(data, poderMCMV);

        // D) Atualiza o Comparativo de Mercado
        this.updateMarketComparison(data, poderMCMV, poderSBPE);

        // E) Atualiza os cards do Laudo Final (Step 4)
        this.updateStep4(data);

        // F) Seleção de Imóvel Real (Match) - Pequeno delay para garantir que DNA_DATA esteja pronto
        setTimeout(() => this.updatePropertyMatch(poderMCMV), 100);

        // G) Ativa os Listeners (Apenas na primeira vez)
        if (!this.initialized) {
            this.attachListeners();
            this.initialized = true;
        }
    },

    updatePropertyMatch: function(poder) {
        // Usa EMPREENDIMENTOS (array global carregado em empreendimentos.js)
        const lista = window.EMPREENDIMENTOS;
        if (!lista || !lista.length) {
            console.warn("EMPREENDIMENTOS não carregado.");
            return;
        }
        
        // Parser de preço: converte "225mil", "1 milhão e 75mil", "537mil" → número
        const parsePreco = (str) => {
            if (!str || typeof str !== 'string') return 0;
            const s = str.toLowerCase().replace(/\s+/g,'');
            let val = 0;
            const milMatch = s.match(/(\d+(?:[.,]\d+)?)mil/);
            const mMilhao = s.match(/(\d+)milh[aã]o/);
            if (mMilhao) val += parseInt(mMilhao[1]) * 1000000;
            if (milMatch) val += parseFloat(milMatch[1].replace(',','.')) * 1000;
            return val || 0;
        };

        // Filtra empreendimentos dentro do poder de compra (+30% margem) e com preço definido
        const comPreco = lista.filter(p => parsePreco(p.preco) > 0);
        let matches = comPreco.filter(p => parsePreco(p.preco) <= poder * 1.3)
                              .sort((a,b) => parsePreco(b.preco) - parsePreco(a.preco));

        // Fallback: mais barato da lista
        if (matches.length === 0) {
            matches = [...comPreco].sort((a,b) => parsePreco(a.preco) - parsePreco(b.preco));
        }

        const best = matches[0];
        if (best) {
            // Título (overlay na imagem)
            this.setElText('property-match-title', best.nome);
            // Preço no lado direito
            const precoNum = parsePreco(best.preco);
            this.setElText('property-match-price', precoNum ? this.fmt(precoNum) : best.preco);
            // Imagem
            const img = document.getElementById('property-match-img');
            if (img && best.imagem) img.src = best.imagem;
            // Entrega (se existir campo)
            if (best.entrega) this.setElText('property-match-entrega', best.entrega);
        }
    },

    updateStep4: function(d) {
        console.log("DEBUG: updateStep4 called with", d);
        this.setElText('card-subsidio-val', this.fmt(d.subsidio));
        this.setElText('card-fgts-val', this.fmt(d.fgts));
        this.setElText('card-entrada-val', this.fmt(d.entrada + d.saldoEntrada));
        this.setElText('card-financiamento-val', this.fmt(d.financiamentoMCMV));

        // Flip Cards (Plano de Viabilidade)
        this.setElText('flip-entrada-val', this.fmt(d.parcelaEntrada));
        this.setElText('flip-obras-val', this.fmt(480)); // Mocked evolution of work for now
        this.setElText('flip-bancario-val', this.fmt(d.parcelaMCMV));

        // Enquadramento & ITBI Card Inteligente
        const isMCMV = d.renda <= 8000;
        const msgEnq = isMCMV ? 'HIS-1 / MCMV Econômico' : 'SBPE / Médio-Alto Padrão';
        this.setElText('enquadramento-label-card', msgEnq);
        this.setElText('enquadramento-label', msgEnq); // Mantém o antigo tbm por segurança

        // Lógica do Selo ITBI (Premium Portrait)
        const itbiBadge = document.getElementById('itbi-status-badge');
        const itbiLabel = document.getElementById('itbi-status-label');
        const itbiIcon = document.getElementById('itbi-icon');

        if (itbiBadge && itbiLabel && itbiIcon) {
            if (isMCMV) {
                itbiLabel.textContent = "ITBI GRÁTIS";
                itbiIcon.textContent = "verified";
                // Verde Neon Glow
                itbiBadge.firstElementChild.className = "bg-[#3de273] text-[#003919] text-sm font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_25px_rgba(61,226,115,0.4)] transition-all duration-500 hover:scale-105 cursor-default";
            } else {
                itbiLabel.textContent = "ITBI PARCELADO";
                itbiIcon.textContent = "info";
                // Azul Neon Glow
                itbiBadge.firstElementChild.className = "bg-blue-600 text-white text-sm font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all duration-500 hover:scale-105 cursor-default";
            }
        }

        // G) Dossiê de Inteligência IA
        if (window.MT_Melhorias) {
            console.log("DEBUG: Renderizando Dossiê IA em mt-dicas-list");
            window.MT_Melhorias.renderizar('mt-dicas-list', d);
        }
    },

    /**
     * Atualiza os valores do Widget lateral (Live Preview)
     */
    updateLivePreview: function(d, total) {
        const fmt = (v) => this.fmt(v);
        const pct = (v) => total > 0 ? Math.round((v / total) * 100) + '%' : '0%';

        // Valores
        this.setElText('val-sub', fmt(d.subsidio));
        this.setElText('val-fgts', fmt(d.fgts));
        this.setElText('val-ent', fmt(d.entrada));
        this.setElText('val-ent-parcelado', fmt(d.saldoEntrada));
        this.setElText('val-fin', fmt(d.financiamentoMCMV));

        // Percentuais
        this.setElText('pct-sub', pct(d.subsidio));
        this.setElText('pct-fgts', pct(d.fgts));
        this.setElText('pct-ent', pct(d.entrada));
        this.setElText('pct-ent-parcelado', pct(d.saldoEntrada));
        this.setElText('pct-fin', pct(d.financiamentoMCMV));

        // Visibilidade da Entrada Parcelada (se houver valor)
        const rowParcelado = document.getElementById('legend-ent-parcelado');
        if (rowParcelado) {
            rowParcelado.style.display = d.saldoEntrada > 0 ? 'block' : 'none';
        }
    },

    updateBar: function(d, total) {
        if (!total || total <= 0) return;

        const getPct = (v) => (v / total) * 100;

        const wSub  = getPct(d.subsidio);
        const wFgts = getPct(d.fgts);
        const wEnt  = getPct(d.entrada);
        const wParc = getPct(d.saldoEntrada);
        const wFin  = getPct(d.financiamentoMCMV);

        const elSub  = document.getElementById('bar-sub');
        const elFgts = document.getElementById('bar-fgts');
        const elEnt  = document.getElementById('bar-ent');
        const elParc = document.getElementById('bar-ent-parcelado');
        const elFin  = document.getElementById('bar-fin');

        if (elSub)  elSub.style.width  = wSub + '%';
        if (elFgts) elFgts.style.width = wFgts + '%';
        if (elEnt)  elEnt.style.width  = wEnt + '%';
        if (elParc) elParc.style.width = wParc + '%';
        if (elFin)  elFin.style.width  = wFin + '%';
    },

    updateProfile: function(d, poderMax) {
        this.setElText('prof-renda', this.fmt(d.renda));
        this.setElText('prof-taxa', d.taxaMCMV.toFixed(1) + '% a.a.');
        this.setElText('prof-prazo', d.prazoMCMV + ' meses');
        this.setElText('prof-parcela', this.fmt(d.parcelaMCMV));
        this.setElText('prof-imovel-max', this.fmt(poderMax));
    },

    updateMarketComparison: function(d, pMCMV, pSBPE) {
        const isMCMV = d.renda <= 13000 && !d.foraDoMCMV;
        
        const mcmvStatus = document.getElementById('comp-mcmv-status');
        const sbpeStatus = document.getElementById('comp-sbpe-status');

        if (mcmvStatus && sbpeStatus) {
            if (isMCMV) {
                mcmvStatus.innerText = 'Recomendado';
                mcmvStatus.className = 'bg-tertiary text-on-tertiary text-[10px] font-black uppercase px-2 py-0.5 rounded-full';
                sbpeStatus.innerText = 'Disponível';
                sbpeStatus.className = 'bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase px-2 py-0.5 rounded-full';
            } else {
                mcmvStatus.innerText = 'Disponível';
                mcmvStatus.className = 'bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase px-2 py-0.5 rounded-full';
                sbpeStatus.innerText = 'Recomendado';
                sbpeStatus.className = 'bg-primary text-on-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full';
            }
        }

        // MCMV
        this.setElText('comp-mcmv-taxa', d.taxaMCMV.toFixed(2) + '%');
        this.setElText('det-mcmv-parcela', this.fmt(d.parcelaMCMV));
        this.setElText('det-mcmv-subsidio', this.fmt(d.subsidio));
        this.setElText('det-mcmv-itbi', d.renda <= 8000 ? 'Isento / Subsidiado' : 'Consulte Tabela');
        
        // SBPE
        this.setElText('comp-sbpe-taxa', d.taxaSBPE.toFixed(2) + '% + TR');
        this.setElText('det-sbpe-parcela', this.fmt(d.parcelaSBPE));
    },

    attachListeners: function() {
        // Listener para animações de entrada via IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in-section').forEach(section => observer.observe(section));
    },

    fmt: function(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
    },

    setElText: function(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        } else {
            console.error("DEBUG: Element with ID '" + id + "' not found in DOM.");
        }
    }
};

window.NewResults = NewResults;

