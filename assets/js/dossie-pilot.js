/**
 * DOSSIÊ DO INVESTIDOR - MÓDULO PILOT (PILOT/CO-PILOT)
 * Arquitetura Modular: assets/js/dossie-pilot.js
 * Responsável por: Assistente mobile, progresso da jornada e status de documentos.
 * MT_LOG (V10.0): As ações do Pilot direcionam o lead para a conversão final.
 */

const DossiePilot = {
    currentStep: 1,

    /**
     * Sincroniza o assistente flutuante (Pilot) com o estado atual do dossiê.
     */
    syncSmartFloater: function() {
        const floater = document.getElementById('mt-mobile-pilot');
        if (!floater) return;

        const ds = window.docState || {};
        const allChecked = ds.id && ds.residencia && ds.civil && ds.renda;
        
        const currentProperty = document.getElementById('main-match-title')?.innerText || '';
        const propertySelected = currentProperty !== 'Apto 2 Dorms' && 
                               currentProperty !== 'Escolha um Imóvel' && 
                               currentProperty !== 'Selecione um empreendimento' &&
                               currentProperty !== 'Aguardando Escolha' &&
                               currentProperty.trim() !== '' || 
                               currentProperty === 'A ser definido';
        
        const label = document.getElementById('pilot-step-label');
        const msg = document.getElementById('pilot-step-msg');
        const btn = document.getElementById('pilot-btn-label');

        if (!propertySelected) {
            this.currentStep = 1;
            if (label) label.innerText = "Passo 1: Poder de Compra";
            if (msg) msg.innerText = "Escolha um imóvel para ver a análise.";
            if (btn) btn.innerText = "Ver Imóveis"; 
        } else if (!allChecked) {
            this.currentStep = 2;
            if (label) label.innerText = "Passo 2: Documentação";
            if (msg) msg.innerText = "Seu perfil está quase pronto!";
            if (btn) btn.innerText = "Checklist";
        } else {
            this.currentStep = 3;
            const statusLabel = document.getElementById('ps-badge-text')?.innerText || 'Pronto';
            if (label) label.innerText = "Passo 3: Aprovação";
            if (msg) msg.innerText = `Status: ${statusLabel}`;
            if (btn) btn.innerText = "Finalizar";
        }
    },

    /**
     * Gerencia a interação com o Pilot (Clique no balão).
     * MT_LOG: Integração com o Aprovador Universal - Direciona o usuário
     * estrategicamente para o botão final de emissão no Passo 3.
     */
    handlePilotInteraction: function() {
        if (this.currentStep === 1) {
            // Rola para o checklist
            const check = document.getElementById('step-1-checklist');
            if (check) check.scrollIntoView({ behavior: 'smooth' });
        } else if (this.currentStep === 2) {
            // Abre a gaveta de imóveis (ou modal em mobile)
            if (window.openPortfolioModal) window.openPortfolioModal();
        } else {
            // Rola para o CTA final
            const cta = document.getElementById('btn-whatsapp-final');
            if (cta) cta.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * Renderiza o portfólio simplificado dentro do Pilot (Mobile).
     */
    renderPilotPortfolio: function(filterQuery = "") {
        const pilotGrid = document.getElementById('pilot-portfolio-grid');
        if (!pilotGrid) return;
        
        const topMatch = EMPREENDIMENTOS[0];
        const list = EMPREENDIMENTOS.slice(0, 4);
        
        let html = `
        <div class="mb-6 pt-2">
            <p class="text-primary font-bold text-[8px] uppercase tracking-[0.2em] mb-1">Perfil Recomendado</p>
            <h4 class="text-white font-bold text-xl mb-1">${topMatch.nome}</h4>
            <div class="flex items-center gap-2 text-tertiary">
                 <span class="material-symbols-outlined text-[14px]">check_circle</span>
                 <span class="text-[10px] font-medium">Lazer completo</span>
            </div>
            <div class="h-px bg-white/10 w-full my-6"></div>
            ${!filterQuery ? '<p class="text-white/40 font-bold text-[8px] uppercase tracking-wider mb-4">Sugestões de Patrimônio:</p>' : ''}
        </div>`;

        list.forEach((emp, idx) => {
            const dna = window.getPropertyDNA ? window.getPropertyDNA(emp.nome) : { valor: 9.2 };
            const projection = window.MT_Utils && window.MT_Utils.calculateFutureValue ? window.MT_Utils.calculateFutureValue(emp.nome, dna.valor) : { lucroFmt: "Consultar" };
            const isMaster = !filterQuery && idx === 0;

            const priceFmt = window.MT_Utils.formatCurrency(DossieEngine.parsePreco(emp.preco));

            html += `
            <div class="glass-card p-4 rounded-xl cursor-pointer hover:border-primary/50 transition-all group relative" onclick="selectProperty('${emp.nome.replace(/'/g, "\\'")}'); document.getElementById('mt-mobile-pilot').classList.remove('expanded');">
                ${isMaster ? '<span class="absolute -top-2 -left-2 bg-primary text-on-primary text-[8px] font-bold px-2 py-1 rounded-md z-10 shadow-lg">RECOMENDAÇÃO MASTER</span>' : ''}
                <img src="${emp.imagem}" class="w-full h-24 object-cover rounded-lg mb-3 grayscale group-hover:grayscale-0 transition-all" onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop'">
                <h5 class="text-xs font-bold truncate text-white">${emp.nome}</h5>
                <p class="text-[10px] text-outline mb-2">${emp.bairro}</p>
                <div class="flex justify-between items-center border-t border-white/5 pt-2">
                    <span class="text-[10px] text-tertiary font-bold">${priceFmt}</span>
                    <span class="text-[9px] text-primary">+ ${projection.lucroFmt} Lucro</span>
                </div>
            </div>`;
        });

        html += `
        <div class="glass-card p-6 rounded-xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all group cursor-pointer" 
             onclick="selectProperty('A ser definido')">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-primary text-3xl">add_home</span>
            </div>
            <div class="text-center">
                <p class="text-xs font-bold uppercase text-white">Outras Opções</p>
                <p class="text-[9px] text-outline mt-1">Não encontrou o imóvel ideal? Fale com um especialista.</p>
            </div>
        </div>`;

        pilotGrid.innerHTML = html;
    }
};

// Exportar globalmente
window.DossiePilot = DossiePilot;
