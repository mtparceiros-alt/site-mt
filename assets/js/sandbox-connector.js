/* ================================================================
   SANDBOX CONNECTOR — v13 (Integração Sandbox → Simulador)
   
   Responsável por:
   - Receber os dados do MT_Core (via SandboxConnector.init(data))
   - Popular os Flip Cards (val-entrada, val-obra, val-prestacao)
   - Renderizar o carrossel de imóveis e o mapa Leaflet
   - Gerar o link do WhatsApp com o Dossiê completo
   
   Ativação: Chamado em index-logic.js → updateSimResults()
   Dependências: empreendimentos.js, Leaflet.js, FontAwesome
   ================================================================ */

const SandboxConnector = {

    /* Estado interno */
    dadosRecebidos: null,
    imovelSelecionado: null,
    currentIndex: 0,
    sugestoes: [], // 🎯 NOVO: Armazena os 3 melhores matches
    slideInterval: null,
    isManual: false,
    lMap: null,

    /* Lista de documentos necessários */
    docs: [
        { id: "rg",    nome: "RG e CPF",              desc: "Foto frente e verso (RG, CNH ou digital).", icon: "fa-id-card"       },
        { id: "res",   nome: "Comprovante de Residência", desc: "Conta de luz/água emitida nos últimos 60 dias.", icon: "fa-map-marker-alt" },
        { id: "civil", nome: "Estado Civil",           desc: "Certidão de nascimento ou casamento.",  icon: "fa-ring"           },
        { id: "renda", nome: "Comprovante de Renda",   desc: "3 últimos holerites ou declaração de IR.", icon: "fa-briefcase"   }
    ],

    /* ------------------------------------------------------------------
       INIT — Ponto de entrada chamado pelo index-logic.js
    ------------------------------------------------------------------ */
    init: function(coreData) {
        this.dadosRecebidos = coreData;

        // 1. Flip Cards → dados reais
        this.popularFluxoPagamento();

        // 2. Imóvel → carrossel + mapa
        if (typeof EMPREENDIMENTOS !== 'undefined' && EMPREENDIMENTOS.length > 0) {
            // 🎯 NOVO: Limita sugestões automáticas aos 3 melhores imóveis
            this.sugestoes = this.findTopMatches(3); 
            this.popularSelectEmpreendimentos();
            this.createDots();
            
            const melhor = this.sugestoes[0] || 0;
            this.currentIndex = melhor;
            this.renderProperty(EMPREENDIMENTOS[melhor]);
            this.updateDots(melhor);
            this.startAutoSlide();
        }

        // 3. Documentação + WhatsApp
        this.renderDocsGrid();
        this.atualizarLinkWhatsapp();

        // 4. Fix Leaflet (renderiza depois que a div fica visível)
        setTimeout(() => {
            if (this.lMap) this.lMap.invalidateSize();
        }, 350);
    },

    /* ------------------------------------------------------------------
       MÓDULO 1 — Popular Flip Cards com dados reais do MT_Core
    ------------------------------------------------------------------ */
    popularFluxoPagamento: function() {
        const d = this.dadosRecebidos;
        if (!d) return;

        // 🏆 Novo: Tratamento para Imóvel Pronto (sem fluxo de obras)
        const statusObj = this.imovelSelecionado && window.MT_Utils && window.MT_Utils.getStatusEntrega 
            ? window.MT_Utils.getStatusEntrega(this.imovelSelecionado.entrega) 
            : { status: 'planta' };

        const avisoPronto = document.getElementById('sandbox-fluxo-pagamento-aviso');
        const cardsFluxo  = document.getElementById('sandbox-cards-fluxo');
        const avisoParcela = document.getElementById('aviso-pronto-parcela');


        if (statusObj.status === 'pronto') {
            if (avisoPronto) avisoPronto.style.setProperty('display', 'block', 'important');
            if (cardsFluxo)  cardsFluxo.style.setProperty('display', 'none', 'important');
            if (avisoParcela) {
                avisoParcela.innerHTML = `Financiado estimado: <strong style="color:var(--accent);">${this.fmt(d.parcelaPosChaves)}</strong>/mês`;
            }
            return; 
        } else {
            if (avisoPronto) avisoPronto.style.setProperty('display', 'none', 'important');
            if (cardsFluxo)  cardsFluxo.style.setProperty('display', 'block', 'important');
        }

        const eModoMercado = d.foraDoMCMV || d.excedeTeto;

        const pEnt   = d.parcelaEntrada || 0;
        const pObra  = d.evolucaoMedia  || 350;
        const pBanco = eModoMercado
            ? (d.sbpe ? d.sbpe.parcela : d.parcelaPosChaves)
            : (d.parcelaPosChaves || 0);
        
        // IDs NEON v2.1
        this.setElText('flip-entrada-val', this.fmt(pEnt));
        this.setElText('flip-obras-val', this.fmt(pObra));
        this.setElText('flip-bancario-val', this.fmt(pBanco));

        // --- 🏆 NOVO: Popular Card de Enquadramento 2026 ---
        const labelEl = document.getElementById('enquadramento-label');
        if (labelEl) {
            const perfil = d.perfilEnquadramento || "R2V";
            const itbiBadge = document.getElementById('itbi-badge');
            
            let label = "R2V / HabitaÃ§Ã£o Livre";
            let showItbi = false;

            if (perfil === "HIS-1") {
                label = "HIS-1 / EconÃ´mico";
                showItbi = true;
            } else if (perfil === "HIS-2") {
                label = "HIS-2 / IntermediÃ¡rio";
                showItbi = true;
            } else if (perfil === "HMP") {
                label = "HMP / Mercado Popular";
            }

            labelEl.innerText = label;
            if (itbiBadge) itbiBadge.style.display = showItbi ? 'flex' : 'none';
        }
    },

    /* ------------------------------------------------------------------
       MÓDULO 2 — Carrossel de Imóveis
    ------------------------------------------------------------------ */
    popularSelectEmpreendimentos: function() {
        const select = document.getElementById('select-catalogo');
        if (!select) return;
        select.innerHTML = '<option value="auto">🔥 Auto-Seleção Inteligente (IA)</option>';
        EMPREENDIMENTOS.forEach((emp, i) => {
            select.innerHTML += `<option value="${i}">${emp.nome} — ${emp.bairro || emp.local || "São Paulo"}</option>`;
        });
    },

    renderProperty: function(imovel) {
        if (!imovel) return;
        this.imovelSelecionado = imovel;

        const img   = document.getElementById('property-match-img');
        const nome  = document.getElementById('property-match-title');
        const preco = document.getElementById('property-match-price');

        if (img) {
            const finalImg = imovel.imagem || imovel.imgUrl;
            if (img.tagName === 'IMG') img.src = finalImg;
            else img.style.backgroundImage = `url('${finalImg}')`;
        }
        if (nome)  nome.innerText  = imovel.nome;
        if (preco) preco.innerText = imovel.preco;

        /* 💡 CORREÇÃO: Blindagem contra crashes de Leaflet (Mapa) */
        try { this.calcMatch(imovel); }             catch(e) { console.error("Erro calcMatch:", e); }
        try { this.initMap(imovel); }               catch(e) { console.warn("Mapa Leaflet pausado/erro:", e); }
        try { this.renderEstrategia(imovel); }      catch(e) { console.error("Erro renderEstrategia:", e); }
        try { this.atualizarLinkWhatsapp(); }       catch(e) { console.error("Erro atualizarLinkWhatsapp:", e); }

        // 🏆 Novo: Força atualização do fluxo financeiro para o imóvel selecionado
        this.popularFluxoPagamento();
    },

    calcMatch: function(imovel) {
        const d = this.dadosRecebidos;
        if (!d || !imovel) return;

        const precoImovel = this.parsePreco(imovel.preco);
        const poder = d.foraDoMCMV || d.excedeTeto
            ? (d.sbpe ? d.sbpe.poder : d.poder)
            : (d.poderMCMV || d.poder || 0);

        const badge = document.getElementById('prop-match');
        if (!badge) return;

        if (poder >= precoImovel) {
            badge.textContent = 'Match: Alto ✅';
            badge.style.background = 'linear-gradient(45deg, #198754, #20c997)';
        } else {
            const pct = Math.max(0, (poder / precoImovel) * 100).toFixed(0);
            badge.textContent = `Aprovado Parcial (${pct}%)`;
            badge.style.background = 'linear-gradient(45deg, #f35525, #ff8a65)';
        }
    },

    /* 💡 CORREÇÃO: Cálculo Dinâmico do GAP baseado no Poder de Compra real */
    // --- MÉTODO DE RENDERIZAÇÃO DE ESTRATÉGIAS (DOUGLAS/IA) ---
    renderEstrategia: function(imovel) {
        const painel = document.getElementById('estrategia-painel');
        if (!painel || !imovel) return;

        const d = this.dadosRecebidos;
        const precoNum = this.parsePreco(imovel.preco);
        
        // --- 📊 CÁLCULO DE VALORIZAÇÃO PATRIMONIAL (DINÂMICO) ---
        // Baseamos a projeção em +30% (média de valorização de obra em SP)
        const lucroEstimado = precoNum * 0.30;
        const lucroFmt = lucroEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Template do Box de Valorização (Prioridade Visual Emerald)
        const boxValorizacao = `
            <div class="strategy-box verde">
                <div class="strategy-icon"><i class="fas fa-chart-line"></i></div>
                <div class="strategy-info">
                    <h6>Projeção de Valorização</h6>
                    <p>Patrimônio cresce aprox. <strong>${lucroFmt}</strong> até a entrega (+30%).</p>
                </div>
            </div>`;

        // --- ⚖️ ANÁLISE DE PODER DE COMPRA VS PREÇO ---
        // Soma todas as fontes de recurso (FGTS, Subsídio, Potencial, Saldo Entrada)
        const poder = d ? (d.foraDoMCMV || d.excedeTeto 
            ? (d.sbpe ? d.sbpe.poder : d.poder) 
            : ((d.subsidio || 0) + (d.fgts || 0) + (d.entrada || 0) + (d.potencial || 0) + (d.saldoEntrada || 0))) 
            : 0;
        
        const gap = poder - precoNum;

        // Injeta o conteúdo dinâmico baseado no Match Financeiro
        if (gap >= 0) {
            // CASO A: APROVAÇÃO TOTAL (Sobra de Caixa)
            painel.innerHTML = `
                <div class="strategy-header"><i class="fas fa-check-circle me-1"></i> APROVADO!</div>
                ${boxValorizacao}
                <div class="strategy-box verde">
                    <div class="strategy-icon"><i class="fas fa-coins"></i></div>
                    <div class="strategy-info">
                        <h6>Sobra Financeira</h6>
                        <p>Margem de segurança para amortizar.</p>
                    </div>
                </div>`;
        } else {
            // CASO B: GAP FINANCEIRO (Estratégias de Correção)
            painel.innerHTML = `
                <div class="strategy-header"><i class="fas fa-exclamation-triangle me-1"></i> GAP DE R$ ${Math.abs(gap).toLocaleString('pt-BR')}</div>
                ${boxValorizacao}
                <div class="strategy-box azul">
                    <div class="strategy-icon"><i class="fas fa-users-cog"></i></div>
                    <div class="strategy-info">
                        <h6>Composição de Renda</h6>
                        <p>Resolver o saldo devedor com parentes.</p>
                    </div>
                </div>
                <div class="strategy-box dourado">
                    <div class="strategy-icon"><i class="fas fa-sliders-h"></i></div>
                    <div class="strategy-info">
                        <h6>Ajuste de Entrada</h6>
                        <p>Parcelar até a data de entrega.</p>
                    </div>
                </div>`;
        }
    },

    calcularMesesRestantes: function(entregaStr) {
        if (!entregaStr || entregaStr.toLowerCase().includes('pronto')) return 1;
        const partes = entregaStr.split('/');
        if (partes.length !== 2) return 36;
        const mesesMap = { Jan:0, Fev:1, Mar:2, Abr:3, Mai:4, Jun:5, Jul:6, Ago:7, Set:8, Out:9, Nov:10, Dez:11 };
        const mAlvo = mesesMap[partes[0].trim()] ?? 0;
        const aAlvo = parseInt(partes[1].trim());
        const hoje  = new Date();
        const dAlvo = new Date(aAlvo, mAlvo, 1);
        const meses = (dAlvo.getFullYear() - hoje.getFullYear()) * 12 + (dAlvo.getMonth() - hoje.getMonth());
        return meses > 0 ? meses : 1;
    },

    createDots: function() {
        const c = document.getElementById('carousel-dots');
        if (!c || !this.sugestoes) return;
        c.innerHTML = '';
        
        // 🎯 Itera sobre o Top 3 apenas
        this.sugestoes.forEach((idxOriginal, i) => {
            const d = document.createElement('div');
            d.className = 'dot' + (i === 0 ? ' active' : '');
            d.onclick = () => this.changeSlide(idxOriginal, true);
            c.appendChild(d);
        });
    },

    updateDots: function(idx) {
        if (!this.sugestoes) return;
        // 🎯 Traduz o índice original para o índice das "sugestões"
        const dotIdx = this.sugestoes.indexOf(idx);
        document.querySelectorAll('#carousel-dots .dot').forEach((d, i) => {
            d.classList.toggle('active', i === dotIdx);
        });
    },

    changeSlide: function(idx, userAction) {
        if (typeof EMPREENDIMENTOS === 'undefined') return;
        if (userAction) {
            this.isManual = true;
            clearInterval(this.slideInterval);
        }
        this.currentIndex = idx;
        this.updateDots(idx);
        this.renderProperty(EMPREENDIMENTOS[idx]);
    },

    startAutoSlide: function() {
        clearInterval(this.slideInterval);
        if (!this.sugestoes || this.sugestoes.length <= 1) return;
        this.slideInterval = setInterval(() => {
            if (!this.isManual) {
                // 🎯 Rotaciona de forma circular dentro do array Top 3
                const currentPos = this.sugestoes.indexOf(this.currentIndex);
                const nextPos = (currentPos + 1) % this.sugestoes.length;
                const nextIdx = this.sugestoes[nextPos];
                this.changeSlide(nextIdx, false);
            }
        }, 5000);
    },

    selecionarImovelManual: function(val) {
        if (val === 'auto') {
            this.isManual = false;
            // 🎯 Utiliza o primeiro do ranking
            const melhor = this.findTopMatches(3)[0] || 0;
            this.changeSlide(melhor, true);
            setTimeout(() => { this.isManual = false; this.startAutoSlide(); }, 100);
        } else {
            this.changeSlide(parseInt(val), true);
        }
    },

    findTopMatches: function(qtd = 3) {
        if (typeof EMPREENDIMENTOS === 'undefined' || EMPREENDIMENTOS.length === 0) return [0];
        
        const d = this.dadosRecebidos;
        const perfilCliente = (d && d.perfilEnquadramento) ? d.perfilEnquadramento : "R2V";

        /**
         * 🎯 PODER DE COMPRA REAL (Fase 3.2 — Ajuste Pirituba):
         * O cálculo agora soma Financiamento + Subsídio + FGTS + Entrada + PARCELAMENTO.
         * Isso reflete 100% o que é mostrado no Dossiê (Barra Laranja).
         */
        const poder = d ? (d.foraDoMCMV || d.excedeTeto 
            ? (d.sbpe ? d.sbpe.poder : d.poder) 
            : ((d.poderMCMV || d.poder || 0) + (d.saldoEntrada || 0))) : 0;

        /**
         * 🎯 IA: Deduz a categoria social do imóvel pelo preço (Decreto SP 2026)
         * Esta categorização é necessária pois a base EMPREENDIMENTOS não 
         * possui a tag de categoria nativa.
         * 📈 Tetos oficiais: HIS-1 (R$ 276k), HIS-2 (R$ 383k), HMP (R$ 537k)
         */
        const getSocialCategory = (precoStr) => {
            const p = this.parsePreco(precoStr);
            if (p <= 276101) return "HIS-1";
            if (p <= 383636) return "HIS-2";
            if (p <= 537672) return "HMP";
            return "R2V";
        };

        // 🎯 1ª Passagem: Filtro Rígido (Conformidade Bancária 2026)
        let lista = EMPREENDIMENTOS.map((emp, i) => {
            return { index: i, precoNum: this.parsePreco(emp.preco) };
        }).filter(item => {
            const emp = EMPREENDIMENTOS[item.index];
            
            // 1. Status e Preço Real
            const s = window.MT_Utils && window.MT_Utils.getStatusEntrega ? window.MT_Utils.getStatusEntrega(emp.entrega) : { status: 'planta' };
            if (s.status === 'pronto') return false;
            if (item.precoNum <= 0) return false;
            if (emp.preco && (emp.preco.toLowerCase().includes('aguarde') || emp.preco.toLowerCase().includes('breve'))) return false;

            // 2. Poder de Compra
            if (poder < item.precoNum) return false;

            // 3. Filtro Social (Fase 3)
            const catImovel = getSocialCategory(emp.preco);
            if (perfilCliente === "HIS-2" && catImovel === "HIS-1") return false;
            if (perfilCliente === "HMP" && (catImovel === "HIS-1" || catImovel === "HIS-2")) return false;
            if (perfilCliente === "R2V" && catImovel !== "R2V") return false;

            return true;
        });

        /**
         * 🔄 VÁLVULA DE ESCAPE (Fase 3.1 — Estabilidade do Carrossel): 
         * Se o filtro social bancário (HIS-1, HIS-2, HMP) for restritivo demais 
         * e sobrar menos de 3 imóveis, fazemos uma 2ª passagem.
         * Nela, priorizamos apenas a VIABILIDADE FINANCEIRA (Poder de Compra Real)
         * para garantir que o carrossel tenha 3 opções e continue girando.
         */
        if (lista.length < qtd) {
            const adicionais = EMPREENDIMENTOS.map((emp, i) => {
                return { index: i, precoNum: this.parsePreco(emp.preco) };
            }).filter(item => {
                const emp = EMPREENDIMENTOS[item.index];
                if (lista.some(l => l.index === item.index)) return false;

                const s = window.MT_Utils && window.MT_Utils.getStatusEntrega ? window.MT_Utils.getStatusEntrega(emp.entrega) : { status: 'planta' };
                if (s.status === 'pronto') return false;
                if (item.precoNum <= 0) return false;
                if (poder < item.precoNum) return false;

                return true;
            });
            lista = [...lista, ...adicionais];
        }

        // 🎯 Ordena: menor diferença (melhor match financeiro) primeiro
        lista.sort((a, b) => {
            const diffA = Math.abs(a.precoNum - poder);
            const diffB = Math.abs(b.precoNum - poder);
            return diffA - diffB;
        });

        // 🎯 Retorna apenas os índices do Top 3
        return lista.slice(0, qtd).map(item => item.index);
    },

    mudarAba: function(aba) {
        const btnCard  = document.getElementById('tab-card');
        const btnMapa  = document.getElementById('tab-mapa');
        const viewCard = document.getElementById('view-card');
        const viewMapa = document.getElementById('view-mapa');
        if (!btnCard || !viewCard) return;

        if (aba === 'card') {
            btnCard.classList.add('active');    btnMapa.classList.remove('active');
            viewCard.classList.remove('d-none'); viewMapa.classList.add('d-none');
        } else {
            btnMapa.classList.add('active');    btnCard.classList.remove('active');
            viewMapa.classList.remove('d-none'); viewCard.classList.add('d-none');
            setTimeout(() => { if (this.lMap) this.lMap.invalidateSize(); }, 60);
        }
    },

    /* 💡 CORREÇÃO: Formatação de coordenadas para travar erros do Leaflet Map */
    initMap: function(imovel) {
        const mapEl = document.getElementById('map');
        if (!mapEl || typeof L === 'undefined') return;

        // Constrói o array [lat, lng] a partir das chaves corretas do banco
        const coords = [imovel.lat || imovel.coords_lat, imovel.lng || imovel.coords_lng];


        // Segurança Mar/2026: Evita erro "Map container is already initialized" se perdermos a referência
        if (mapEl._leaflet_id && !this.lMap) {
            delete mapEl._leaflet_id; // Força limpeza de referência órfã
        }

        if (this.lMap) {
            this.lMap.setView(coords, 14);
            this.lMap.eachLayer(layer => {
                if (layer instanceof L.Marker) this.lMap.removeLayer(layer);
            });
        } else {
            this.lMap = L.map('map', { zoomControl: false }).setView(coords, 14);
            
            /** 
             * 🎨 PADRÃO VISUAL: CARTO VOYAGER (Light Premium)
             * Removida a máscara 'dark_all' para melhorar a legibilidade e leveza.
             * IMPORTANTE: Se o mapa aparecer escuro, verifique se existem arquivos .min.js 
             * antigos na pasta assets/js que estão bloqueando a atualização.
             */
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap © CartoDB'
            }).addTo(this.lMap);
            L.control.zoom({ position: 'bottomright' }).addTo(this.lMap);
        }

        L.marker(coords).addTo(this.lMap)
            .bindPopup(`<div class="mini-popup">
                <img src="${imovel.imagem || imovel.imgUrl}" style="width:100%;height:70px;object-fit:cover;border-radius:4px;margin-bottom:4px;">
                <strong>${imovel.nome}</strong><br>
                <span style="color:#f35525;">${imovel.preco}</span>
            </div>`);
    },

    /* ------------------------------------------------------------------
       MÓDULO 3 — Grid de Documentos
    ------------------------------------------------------------------ */
    renderDocsGrid: function() {
        const grid = document.getElementById('docs-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this.docs.forEach(doc => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-3';
            col.innerHTML = `
                <div class="doc-item-card" onclick="this.classList.toggle('success'); SandboxConnector.atualizarLinkWhatsapp();">
                    <div class="doc-badge">PENDENTE</div>
                    <div class="doc-icon"><i class="fas ${doc.icon}"></i></div>
                    <div class="doc-info">
                        <h6 class="mb-0">${doc.nome}</h6>
                        <p class="small mb-0">${doc.desc}</p>
                    </div>
                </div>`;
            grid.appendChild(col);
        });
    },

    /* ------------------------------------------------------------------
       MÓDULO 3 — Link do WhatsApp com Dossiê Completo
    ------------------------------------------------------------------ */
    atualizarLinkWhatsapp: function() {
        const d = this.dadosRecebidos;
        if (!d) return;

        /* Docs marcados como separados */
        const selecionados = [];
        document.querySelectorAll('.doc-item-card.success h6').forEach(el => {
            selecionados.push('✅ ' + el.innerText.trim());
        });

        /* Nome do cliente */
        const nomeInput = document.getElementById('name');
        const nomeCliente = nomeInput ? (nomeInput.value.trim() || 'Cliente') : 'Cliente';

        /* Vínculo empregatício */
        let vinculo = 'N/D';
        if (d.vinculo)          vinculo = d.vinculo.toUpperCase();
        else if (d.tipoRenda)   vinculo = d.tipoRenda.toUpperCase();

        /* FGTS bruto do campo do formulário */
        const fgtsEl = document.getElementById('fgts') || document.getElementById('slider-fgts');
        let fgtsBruto = fgtsEl ? parseFloat((fgtsEl.value || '0').replace(/\D/g, '')) || 0 : (d.fgts || 0);

        /* Renda */
        const renda = d.renda || 0;

        /* Faixa MCMV */
        const faixa = d.faixaMCMV ? `Faixa ${d.faixaMCMV}` : 'SBPE/Mercado';

        /* Parcelas */
        const eModoMercado = d.foraDoMCMV || d.excedeTeto;
        const pBanco = eModoMercado ? (d.sbpe ? d.sbpe.parcela : d.parcelaPosChaves) : (d.parcelaPosChaves || 0);

        let text = `🚀 *Dossiê de Viabilidade IA — MT Parceiros*\n`
            + `Olá! Sou *${nomeCliente}* e acabei de gerar minha análise IA.\n\n`
            + `👤 *Perfil Financeiro:*\n`
            + `• Renda Familiar: *${this.fmt(renda)}*\n`
            + `• Vínculo: *${vinculo}*\n`
            + `• FGTS Disponível: *${this.fmt(fgtsBruto)}*\n`
            + `• Enquadramento: *${faixa}*\n\n`;

        if (this.imovelSelecionado) {
            text += `🏢 *Imóvel de Interesse:*\n`
                + `• ${this.imovelSelecionado.nome} — ${this.imovelSelecionado.local}\n`
                + `• Valor: *${this.imovelSelecionado.preco}*\n\n`;
        }

        text += `💰 *Condições Pré-Aprovadas (IA):*\n`
            + `• Entrada à construtora: *${this.fmt(d.parcelaEntrada)}/mês*\n`
            + `• Prestação após chaves: *${this.fmt(pBanco)}/mês*\n\n`;

        if (selecionados.length > 0) {
            text += `📄 *Documentos Já Separados:*\n${selecionados.join('\n')}\n\n`;
        }

        text += `Poderia analisar meu perfil com um Especialista?`;

        const numero = (window.MT_Utils && window.MT_Utils.WHATSAPP_NUMBER) 
            ? window.MT_Utils.WHATSAPP_NUMBER 
            : '5511960364355';
        const url = `https://wa.me/${numero}?text=${encodeURIComponent(text)}`;
        const btn = document.getElementById('whatsapp-btn');
        if (btn) btn.href = url;
    },

    /* ------------------------------------------------------------------
       UTILITÁRIOS
    ------------------------------------------------------------------ */
    fmt: function(v) {
        return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    parsePreco: function(s) {
        if (!s) return 0;
        let pText = s.toLowerCase();

        // 🛡️ Segurança: Ignora textos que não representam um valor real
        if (pText.includes('aguarde') || pText.includes('breve') || pText.includes('consulta')) return 0;

        let num = parseInt(s.replace(/[^\d]/g, ''), 10);
        
        // Versão robusta
        if (pText.includes('milhão') || pText.includes('milhões')) {
            // Separar os números pelo formato do texto. Ex: "1milhão e 500mil" 
            let partes = pText.match(/\d+/g);
            if(partes && partes.length >= 2) {
                return (parseInt(partes[0]) * 1000000) + (parseInt(partes[1]) * 1000);
            } else if (partes && partes.length === 1) {
                return parseInt(partes[0]) * 1000000;
            }
        } else if (pText.includes('mil')) {
            num *= 1000;
        }
        
        return isNaN(num) ? 0 : num;
    }

}; /* FIM SandboxConnector */

/* 💡 CORREÇÃO MAR/2026: Anexa ao 'window' para que o index-logic.js consiga chamá-lo (evita crash do const) */
window.SandboxConnector = SandboxConnector;

/* Expõe toggleFlip globalmente para os onclick nos Flip Cards */
function toggleFlip(el) {
    el.classList.toggle('flipped');
}
