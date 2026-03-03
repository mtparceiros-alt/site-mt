import xlsxwriter
import os
import json
from datetime import datetime

# ==========================================
# CONFIGURAÇÕES GLOBAIS E IDENTIDADE VISUAL
# ==========================================
CONFIG = {
    'colors': {
        'orange_cta': '#f35525',
        'dark': '#1a1a2e',
        'white': '#FFFFFF',
        'bg_light': '#fafafa',
        'bg_page': '#f4f5f7',
        'bg_card': '#ffffff',
        'border': '#eeeeee',
        'text_gray': '#7a7a7a',
        'success': '#27ae60',
        'warning': '#f39c12',
        'danger': '#e74c3c'
    },
    'fonts': {
        'primary': 'Poppins',
        'fallback': 'Calibri'
    },
    'layout': {
        'row_height_default': 20,
        'col_width_default': 15,
        'col_width_spacer': 2,
        'nav_height_main': 45,
        'nav_height_sub': 30
    },
    'paths': {
        'output': r"C:\Users\Marcos.PC_M1\Documents\site_mt\Base_Template\template_mt_parceiros.xlsx",
        'docs': r"C:\Users\Marcos.PC_M1\Documents\site_mt\assets\docs\template_mt_parceiros.xlsx",
        'json_data': r"C:\Users\Marcos.PC_M1\Documents\site_mt\empreendimentos.json",
        'assets': r"C:\Users\Marcos.PC_M1\Documents\site_mt\assets\images"
    },
    'company': {
        'name': 'MT Parceiros',
        'phone': '(11) 96036-4355',
        'email': 'mtparceiros@gmail.com',
        'website': 'mtparceiros-alt.github.io/site-mt'
    },
    # MAPEAMENTO DE ENDEREÇOS (Fonte de Verdade para o JS)
    'map': {
        'inicio': {
            'nome': 'E23',
            'm_entrada': 'C35',
            'd_inicial': 'Z35', # Nova célula para Entrada em Espécie do Simulador Web
            'm_evolucao': 'G35',
            'm_parcela': 'K35'
        },
        'simulador': {
            'nome': 'D9',
            'imovel': 'G8',
            'renda': 'E13',
            'fgts': 'E24',
            'entrada': 'E14', # Nova célula para entrada em dinheiro explícita
            'dividas': 'E17',
            'carteira': 'E26',
            'potencial': 'E29',
            'subsidio': 'E30',
            'poder': 'E31',
            'parcela': 'E33'
        },
        'laudo': {
            'renda': 'C12',
            'potencial': 'C16',
            'subsidio': 'C20',
            'fgts': 'C24',
            'poder': 'E12',
            'parcela': 'E16'
        }
    }
}

# ==========================================
# 1. SETUP WORKBOOK & FORMATOS GLOBAIS
# ==========================================
def setup_workbook(workbook):
    """
    Configura os formatos globais reutilizáveis em toda a planilha,
    garantindo consistência visual (DRY).
    """
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']
    
    formats = {}
    
    # Textos e Títulos
    formats['title'] = workbook.add_format({'font_name': f, 'font_size': 24, 'bold': True, 'font_color': c['dark']})
    formats['subtitle'] = workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': c['text_gray']})
    formats['label'] = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray']})
    
    # Valores KPI
    formats['kpi_value'] = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['dark'], 'num_format': 'R$ #,##0.00'})
    formats['kpi_value_orange'] = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['orange_cta'], 'num_format': 'R$ #,##0.00'})
    
    # Tabelas
    formats['tbl_header'] = workbook.add_format({'font_name': f, 'font_size': 10, 'bg_color': c['dark'], 'font_color': c['white'], 'bold': True, 'align': 'center', 'valign': 'vcenter'})
    formats['tbl_cell'] = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter'})
    formats['tbl_money'] = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00', 'align': 'right', 'valign': 'vcenter'})
    
    # Inputs (Células destravadas para o usuário) - Estilo Claro (Original)
    formats['input_money'] = workbook.add_format({
        'font_name': f, 'font_size': 12, 'bold': True, 'bg_color': c['white'], 
        'font_color': c['dark'], 'border': 1, 'border_color': c['orange_cta'], 
        'num_format': 'R$ #,##0.00', 'align': 'right', 'locked': False
    })
    formats['input_pct'] = workbook.add_format({
        'font_name': f, 'font_size': 12, 'bold': True, 'bg_color': c['white'], 
        'font_color': c['dark'], 'border': 1, 'border_color': c['orange_cta'], 
        'num_format': '0%', 'align': 'center', 'locked': False
    })
    
    # Fundo Padrão (Clean / Dashboard Style)
    formats['bg_default'] = workbook.add_format({'bg_color': c['bg_page']})
    formats['bg_card'] = workbook.add_format({'bg_color': c['bg_card']})
    
    # Formatos de Barras (REPT/Graph)
    formats['bar_flat'] = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left'})
    formats['bar_orange'] = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left', 'font_color': c['orange_cta']})
    formats['bar_success'] = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left', 'font_color': c['success']})
    formats['bar_danger'] = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left', 'font_color': c['danger']})
    formats['bar_label'] = workbook.add_format({'font_name': f, 'font_size': 10, 'valign': 'vcenter', 'align': 'right', 'font_color': c['dark']})

    # Dashboard / Fluxo Mensal
    formats['dash_title'] = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'font_color': c['text_gray'], 'align': 'center'})
    formats['dash_val_green'] = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['success'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['success']})
    formats['dash_val_orange'] = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['orange_cta']})

    return formats


# ==========================================
# 2. MOTOR DE DADOS (POWER QUERY READY)
# ==========================================
def build_system_data(workbook, ws_data, empreendimentos, formats):
    """
    [Power Query / Power Pivot]
    Cria a tabela relacional 'System Data' formatada como Tabela Oficial do Excel.
    Isso permite ingestão direta via Dados > Obter Dados > De Tabela/Intervalo no Power BI.
    """
    ws_data.hide()
    # Configurar visual da aba de dados
    ws_data.set_tab_color(CONFIG['colors']['dark'])
    ws_data.set_column('A:A', 10)  # ID
    ws_data.set_column('B:B', 35)  # Nome
    ws_data.set_column('J:J', 20)  # Imagem_URL
    ws_data.set_column('K:K', 15)  # Status (Pronto/Obra)
    ws_data.set_column('L:L', 10)  # Prazo (Meses)
    
    # Instrução para o Usuário/Analista (Linha 1)
    ws_data.merge_range('A1:J1', '💡 IMPORTANTE: Esta tabela (Table_Empreendimentos) é a fonte de dados primária. Use "Atualizar Tudo" se conectada a fontes externas.', formats['label'])
    ws_data.set_row(0, 30)

    # Preparar Dados para a Tabela
    # Estrutura: ID | Nome | Preço | Área | Quartos | Bairro | Entrega | Diferenciais | Lazer | Imagem_URL | Status | Prazo
    table_data = []
    
    # Inserir dados do JSON ou criar Demos if empty
    if not empreendimentos:
        empreendimentos = [
            {'nome': 'Residencial Demo 1', 'preco': '250.000', 'area': '45m²', 'quartos': '2', 'bairro': 'Centro', 'entrega': 'Dez/25', 'diferenciais': 'Piscina', 'lazer': 'Churrasqueira', 'imagem': 'img1.jpg'},
            {'nome': 'Residencial Demo 2', 'preco': '320.000', 'area': '55m²', 'quartos': '3', 'bairro': 'Sul', 'entrega': 'Pronto', 'diferenciais': 'Varanda', 'lazer': 'Academia', 'imagem': 'img2.jpg'}
        ]

    for i, emp in enumerate(empreendimentos):
        # Limpeza avançada de preços (Resolve o problema do JSON desestruturado com 'mil' em 'entrega')
        preco_cru = str(emp.get('preco', '0'))
        entrega_cru = str(emp.get('entrega', '0'))
        
        # Heurística: Se 'entrega' contém 'mil', prioriza ela como fonte de preço (mais confiável)
        # Isso resolve casos onde 'preco' contém endereços (ex: "R. Dr Antônio Bento, 182")
        if 'mil' in entrega_cru.lower():
            preco_cru = entrega_cru
        elif not any(char.isdigit() for char in preco_cru):
            preco_cru = entrega_cru
            
        preco_cru = preco_cru.lower().replace('r$', '').replace('a partir de', '').strip()
        
        try:
            if 'mil' in preco_cru:
                # ex: "205mil" -> 205.0 -> 205000.0
                numeros = ''.join(filter(lambda x: x.isdigit() or x == '.', preco_cru.replace('mil', '')))
                preco_num = float(numeros) * 1000
            else:
                # ex: "250.000,00" -> 250000.00
                numeros = ''.join(filter(lambda x: x.isdigit() or x == '.', preco_cru.replace('.', '').replace(',', '.')))
                preco_num = float(numeros)
        except Exception:
            preco_num = 0

        # Limpar nome (remover quebras de linha que corrompem dropdowns)
        nome_limpo = emp.get('nome', 'N/A').replace('\n', ' ').replace('\r', ' ').strip()

        # Determinar Status e Prazo da obra
        entrega_str = str(emp.get('entrega', 'Pronto'))
        if 'pronto' in entrega_str.lower() or entrega_str.strip() == '':
            status_obra = 'Pronto'
            prazo_meses = 0
        else:
            status_obra = 'Obra'
            prazo_meses = 24  # Prazo padrão estimado de obra

        # Adicionar linha de dados (12 colunas completas incluindo Status_Obra e Prazo_Meses)
        table_data.append([
            i + 1,                                  # ID (Chave Primária)
            nome_limpo,                             # Nome (sem quebras de linha)
            preco_num,                              # Preço Numérico
            emp.get('area', ''),                    # Área
            emp.get('quartos', ''),                 # Quartos
            emp.get('bairro', ''),                  # Bairro
            emp.get('entrega', ''),                 # Entrega
            emp.get('diferenciais', ''),            # Diferenciais
            emp.get('lazer', ''),                   # Lazer
            emp.get('imagem', ''),                  # Imagem URL
            status_obra,                            # Status_Obra (Pronto/Obra)
            prazo_meses                             # Prazo_Meses (0 ou 24)
        ])
        
    num_rows = len(table_data)
    num_cols = len(table_data[0]) if num_rows > 0 else 10
    
    # Criar a Tabela Excel Oficial
    # A tabela começa na A3 para deixar espaço de respiro
    end_row = 2 + num_rows
    table_range = f'A3:L{end_row}'
    
    ws_data.add_table(table_range, {
        'data': table_data,
        'name': 'Table_Empreendimentos',
        'style': 'Table Style Medium 2', # Estilo dark agradável do Excel
        'columns': [
            {'header': 'ID'},
            {'header': 'Nome'},
            {'header': 'Preço', 'format': formats['tbl_money']},
            {'header': 'Área'},
            {'header': 'Quartos'},
            {'header': 'Bairro'},
            {'header': 'Entrega'},
            {'header': 'Diferenciais'},
            {'header': 'Lazer'},
            {'header': 'Imagem_URL'},
            {'header': 'Status_Obra'},
            {'header': 'Prazo_Meses'}
        ]
    })
    
    # Tabela Simulação Base para Relacionamento (Dicionário VLOOKUP nativo do Excel se Power Pivot não for usado)
    # Útil para ancorar referências externas.
    sim_row = end_row + 4
    ws_data.write(sim_row, 0, 'Parâmetros Internos', formats['subtitle'])
    ws_data.add_table(f'A{sim_row+2}:B{sim_row+6}', {
        'data': [
            ['Renda_Base', 8500],
            ['FGTS_Base', 30000],
            ['Entrada_Base', 15000],
            ['Prazo_Meses', 420]
        ],
        'name': 'Table_Params',
        'header_row': False
    })

# ==========================================
# 3. INTERFACE GERAL (HEADER, FOOTER, UX)
# ==========================================
def insert_image_safe(worksheet, cell, image_path, options, formats):
    """
    [UX/UI - Fallback]
    Tenta inserir uma imagem. Se o arquivo não existir (ex: erro de caminho),
    insere uma caixa de texto (shape) cinza como placeholder contendo 'Icon'.
    Evita quebra silenciosa da interface.
    """
    if os.path.exists(image_path):
        worksheet.insert_image(cell, image_path, options)
    else:
        # Extrair proporções estimadas (aproximadas para simular o ícone)
        w = options.get('x_scale', 1) * 50
        h = options.get('y_scale', 1) * 50
        worksheet.insert_textbox(cell, 'IMG', {
            'width': w, 'height': h,
            'fill': {'color': CONFIG['colors']['border']},
            'line': {'color': CONFIG['colors']['text_gray']},
            'font': {'name': CONFIG['fonts']['primary'], 'size': 8, 'color': CONFIG['colors']['text_gray']},
            'align': {'vertical': 'middle', 'horizontal': 'center'}
        })

def build_global_navigation(workbook, worksheet, active_tab_name, formats):
    """
    [Design & UX]
    Cria o Cabeçalho Global (Nav) presente em todas as abas visíveis.
    Implementa a separação em "Sub-header" e "Main Nav" baseada no CSS do site.
    """
    c = CONFIG['colors']
    
    # --- Linha 1: Sub-header (Redes Sociais / Infos Estáticas) ---
    contact_info = f"📍 {CONFIG['company']['email']} | 📞 {CONFIG['company']['phone']} | 🌐 {CONFIG['company']['website']}"
    
    fmt_subheader = workbook.add_format({
        'bg_color': c['white'], 'font_name': CONFIG['fonts']['primary'], 
        'font_size': 9, 'font_color': c['text_gray'],
        'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'bottom_color': c['border']
    })
    
    # Criar formato específico para o Início (Sem fundo para não tapar a imagem, negrito para visibilidade)
    fmt_subheader_start = workbook.add_format({
        'font_name': CONFIG['fonts']['primary'], 'font_size': 10, 'bold': True, 'font_color': c['dark'],
        'align': 'center', 'valign': 'vcenter'
    })
    
    if active_tab_name == 'Início':
        worksheet.set_row(0, 45) # Altura para a faixa superior
    else:
        worksheet.set_row(0, CONFIG['layout']['nav_height_sub'])
        worksheet.merge_range('B1:L1', contact_info, fmt_subheader)

    # --- Linha 3: Main Nav (Abas de Navegação) ---
    worksheet.set_row(2, CONFIG['layout']['nav_height_main'])
    
    fmt_link_inactive = workbook.add_format({
        'font_name': CONFIG['fonts']['primary'], 'font_size': 11, 'bold': True, 
        'font_color': c['dark'], 'bg_color': c['white'], 
        'align': 'center', 'valign': 'vcenter'
    })
    # Tab Ativa recebe a cor Laranja CTA do site
    fmt_link_active = workbook.add_format({
        'font_name': CONFIG['fonts']['primary'], 'font_size': 11, 'bold': True, 
        'font_color': c['orange_cta'], 'bg_color': c['white'], 
        'align': 'center', 'valign': 'vcenter', 'bottom': 3, 'bottom_color': c['orange_cta']
    })

    # Definição das posições das abas no menu (Utilizando grid intercalado)
    tabs = [
        ('Laudo de Crédito', 'C3:D3'), 
        ('Educação Financeira', 'E3:F3'), 
        ('Fluxo Mensal', 'G3:H3')
    ]
    
    for name, cell_range in tabs:
        fmt = fmt_link_active if name == active_tab_name else fmt_link_inactive
        target_cell = cell_range.split(':')[0]
        # Correção da fórmula HYPERLINK para ser compatível com Google Sheets e Excel
        # Removendo a aspa simples extra e ajustando o sinal de exclamação
        worksheet.merge_range(cell_range, '', fmt)
        formula = f'=HYPERLINK("#\'{name}\'!A1", "{name}")'
        worksheet.write_formula(target_cell, formula, fmt)
    
    # Botão "CTA" CENTRALIZADO (Linha 4)
    fmt_cta = workbook.add_format({
        'bg_color': c['dark'], 'font_color': c['white'], 'font_name': CONFIG['fonts']['primary'],
        'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['dark'],
        'font_size': 11
    })
    worksheet.set_row(3, 35) # Altura maior para o botão Portal
    worksheet.merge_range('B4:L4', '', fmt_cta)
    worksheet.write_url('B4', f"https://{CONFIG['company']['website']}", fmt_cta, string='PORTAL MT PARCEIROS')
    
    # Respiro (Linha 2 - Row index 1)
    worksheet.set_row(1, 10)

def build_global_footer(workbook, worksheet, start_row, formats):
    """
    [Design & UX]
    Insere rodapé padronizado em cada aba (Gera data =HOJE()).
    """
    worksheet.set_row(start_row, 30)
    fmt_footer = workbook.add_format({
        'font_name': CONFIG['fonts']['primary'], 'font_size': 8, 'font_color': CONFIG['colors']['text_gray'],
        'bg_color': CONFIG['colors']['white'], 'align': 'center', 'valign': 'vcenter',
        'top': 1, 'top_color': CONFIG['colors']['border']
    })
    today_str = datetime.today().strftime("%d/%m/%Y")
    worksheet.merge_range(f'B{start_row+1}:L{start_row+1}', 
                          f"🤖 Simulação gerada por Algoritmo de IA MT Parceiros  •  Gerado em {today_str} • © MT Parceiros", fmt_footer)

def setup_worksheet_layout(worksheet, formats_ref):
    """
    Configurações base de UX: Ocultar linhas de grade, definir metadados visuais.
    Implementa o grid de colunas finhas para respiro (Google Sheets safe).
    """
    l = CONFIG['layout']
    
    # Grid de Colunas: A (Margin), B (Spacer), C (Content), D (Spacer), E (Content)...
    worksheet.set_column('A:B', l['col_width_spacer'])
    worksheet.set_column('D:D', l['col_width_spacer'])
    worksheet.set_column('F:F', l['col_width_spacer'])
    worksheet.set_column('H:H', l['col_width_spacer'])
    worksheet.set_column('J:J', l['col_width_spacer'])
    worksheet.set_column('L:L', l['col_width_spacer'])
    
    # Colunas de Conteúdo (Expandidas de 25 para 30 para evitar cortes de texto)
    worksheet.set_column('C:C', 30)
    worksheet.set_column('E:E', 30)
    worksheet.set_column('G:G', 30)
    worksheet.set_column('I:I', 30)
    worksheet.set_column('K:K', 30)
    
    worksheet.hide_gridlines(2) # Ocultar linhas de grade da planilha
    
    # Pintar o fundo da área útil como Cinza Claro (Dashboard)
    for r in range(0, 150):
        worksheet.set_row(r, l['row_height_default'], formats_ref['bg_default'])

# ==========================================
# 4. LANDING PAGE (Aba de Boas-Vindas)
# ==========================================
def build_landing_page(workbook, ws_start, formats):
    """
    [UX - Primeira Impressão]
    Cria uma aba de 'Início' remodelada com os dados do simulador web e documentação.
    """
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']
    
    # Limpeza de colunas antigas (herdadas do setup_worksheet_layout)
    # Não precisamos re-setar, mas vamos garantir o respiro
    ws_start.set_row(0, 45) 

    # --- PARTE 1: Cabeçalho Textual (Substituto Seguro para Imagens) ---
    fmt_header_logo = workbook.add_format({
        'font_name': f, 'font_size': 32, 'bold': True, 'font_color': c['orange_cta'], 
        'align': 'center', 'valign': 'vcenter'
    })
    
    # Centralizado no grid C:K - Agora começando na linha 7 (index 6) para evitar o botão CTA na linha 4
    ws_start.merge_range('C7:K9', 'MT PARCEIROS', fmt_header_logo)
    
    ws_start.merge_range('C11:K12', 'BEM-VINDO À SUA ANÁLISE PERSONALIZADA', formats['title'])
    ws_start.merge_range('C13:K13', '🤖 Esta ferramenta utiliza Inteligência Artificial para calcular seu potencial de compra imobiliária.', formats['subtitle'])
    
    ws_start.set_row(13, 25) 
    
    # Card Central IA (Fake Card usando Background)
    fmt_ia_card = workbook.add_format({
        'bg_color': c['bg_card'], 'border': 2, 'border_color': c['orange_cta'],
        'text_wrap': True, 'valign': 'vcenter', 'align': 'center',
        'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['dark']
    })
    ws_start.merge_range('C15:K17', 'ESTA ANÁLISE FOI PREPARADA COM TECNOLOGIA MT PARCEIROS\nCálculos baseados nas regras oficiais da CAIXA (2025)', fmt_ia_card)
    
    # Instruções Centrais
    ws_start.merge_range('C19:K19', 'COMO COMEÇAR:', formats['subtitle'])
    ws_start.merge_range('C20:K20', '1. Digite seu nome abaixo para personalizar o relatório.', formats['label'])
    ws_start.merge_range('C21:K21', '2. Vá para as abas de análise para conferir seu potencial.', formats['label'])
    
    ws_start.write('C23', 'SEU NOME:', formats['label'])
    
    fmt_input_start = workbook.add_format({
        'font_name': f, 'font_size': 16, 'bold': True, 'border': 1, 'border_color': c['orange_cta'],
        'bg_color': c['white'], 'font_color': c['dark'], 'locked': False, 'align': 'center', 'valign': 'vcenter'
    })
    ws_start.write(CONFIG['map']['inicio']['nome'], 'Digite seu nome aqui...', fmt_input_start)
    
    # BOTÃO "INICIAR SIMULAÇÃO"
    fmt_btn_iniciar = workbook.add_format({
        'bg_color': c['dark'], 'font_color': c['white'], 'font_name': f,
        'font_size': 14, 'bold': True, 'align': 'center', 'valign': 'vcenter',
        'border': 1, 'border_color': c['dark']
    })
    ws_start.set_row(25, 40)
    ws_start.merge_range('C26:K27', 'INICIAR SIMULAÇÃO ▶', fmt_btn_iniciar)
    ws_start.write_url('C26', "internal:'Laudo de Crédito'!A1", fmt_btn_iniciar, string='INICIAR SIMULAÇÃO ▶')
    
    # --- ESTILOS DOS CARDS (Definições Premium Flat Design) ---
    # Card 1 (Ação Primária - Laranja)
    fmt_card_orange_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'], 'bg_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['orange_cta']})
    fmt_card_orange_val = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_orange_sub = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border'], 'text_wrap': True})
    
    # Card 2 (Informativo - Escuro)
    fmt_card_blue_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'], 'bg_color': c['dark'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['dark']})
    fmt_card_blue_val = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['dark'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_blue_sub = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border'], 'text_wrap': True})
    
    # Card 3 (Sucesso - Verde)
    fmt_card_green_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'], 'bg_color': c['success'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['success']})
    fmt_card_green_val = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['success'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_green_sub = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border'], 'text_wrap': True})

    # Aviso de Isenção
    ws_start.set_row(28, 15)
    fmt_aviso = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['dark'], 'align': 'center', 'valign': 'vcenter'})
    ws_start.merge_range('C29:K29', '⚠️ Valores estimados para fins de consultoria. MT Parceiros | (11) 96036-4355', fmt_aviso)

    # Card 1 (Inicia em C34) — Fórmula DENTRO do merge_range para não ser sobrescrita
    ws_start.merge_range('C34:E34', 'MENSAIS DA ENTRADA', fmt_card_orange_title)
    ws_start.merge_range('C35:E35', "='Educação Financeira'!E33 * 0.5", fmt_card_orange_val)
    ws_start.merge_range('C36:E36', '36x (Parcelas Fixas)', fmt_card_orange_sub)
    
    # Card 2 (Inicia em G34) — Fórmula DENTRO do merge_range
    ws_start.merge_range('G34:I34', 'EVOLUÇÃO OBRA', fmt_card_blue_title)
    ws_start.merge_range('G35:I35', "='Educação Financeira'!E33 / 2", fmt_card_blue_val)
    ws_start.merge_range('G36:I36', 'Média mensal (Obra)', fmt_card_blue_sub)
    
    # Card 3 (Inicia em K34) — Fórmula DENTRO do merge_range
    ws_start.merge_range('K34:L34', 'PARCELA FINANCIAMENTO', fmt_card_green_title)
    ws_start.merge_range('K35:L35', "='Educação Financeira'!E33", fmt_card_green_val)
    ws_start.merge_range('K36:L36', 'Após entrega (Parcela Base)', fmt_card_green_sub)
    
    # Célula Oculta para Dados do Simulador Web (Sync com Educação Financeira)
    ws_start.write(CONFIG['map']['inicio']['d_inicial'], 15000, formats['input_money'])
    ws_start.set_column('Z:Z', None, None, {'hidden': True})
    ws_start.set_row(39, 30)
    ws_start.merge_range('C40:K40', 'Documentação Necessária', workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center'}))
    ws_start.merge_range('C41:K41', 'Separe estes documentos para acelerar sua aprovação com a Caixa:', workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'align': 'center', 'text_wrap': True}))
    
    fmt_doc_box = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'bg_color': c['white'], 'border': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter', 'text_wrap': True})
    
    docs = ['1. RG e CPF do Cliente', '2. Certidão Estado Civil', '3. Comprovante de Renda', '4. Comprovante Residência', '5. Extrato FGTS Atual', '6. Declaração IRPF + Recibo']
    # Distribuir docs no grid intercalado C, G, K (Espaçamento maior)
    # Linha 1 de documentos (43)
    ws_start.merge_range('C43:E44', docs[0], fmt_doc_box)
    ws_start.merge_range('G43:I44', docs[1], fmt_doc_box)
    ws_start.merge_range('K43:L44', docs[2], fmt_doc_box)
    # Linha 2 de documentos (46)
    ws_start.merge_range('C46:E47', docs[3], fmt_doc_box)
    ws_start.merge_range('G46:I47', docs[4], fmt_doc_box)
    ws_start.merge_range('K46:L47', docs[5], fmt_doc_box)
    
    # WhatsApp Button Layout
    fmt_btn_whats = workbook.add_format({
        'bg_color': '#25D366', 'font_color': c['white'], 'font_name': f,
        'font_size': 14, 'bold': True, 'align': 'center', 'valign': 'vcenter',
        'border': 1, 'border_color': '#25D366'
    })
    ws_start.set_row(48, 40)
    ws_start.merge_range('C49:K50', '💬 Iniciar Atendimento', fmt_btn_whats)
    ws_start.write_url('C49', "https://wa.me/5511960364355?text=Olá,%20quero%20iniciar%20meu%20atendimento", fmt_btn_whats, string='💬 Iniciar Atendimento')

def build_laudo_credito(workbook, ws_laudo, formats):
    """
    [UX/UI KPI + Gráficos]
    Aba baseada na régua de 5 segundos. Apresenta o poder de compra total e
    se o crédito está aprovado visualmente.
    """
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']
    
    # Empurrar tudo para baixo (Respiro do Header)
    ws_laudo.set_row(6, 40) # Aumentar altura para o título não cortar
    ws_laudo.write('C6', '📊 ANÁLISE EXECUTIVA (Algoritmo IA)', formats['subtitle'])
    ws_laudo.write('C7', 'Laudo de Crédito', formats['title'])
    
    fmt_ia_desc = workbook.add_format({'font_name': f, 'font_size': 9, 'italic': True, 'font_color': c['text_gray'], 'text_wrap': True})
    ws_laudo.merge_range('C8:K8', 'Esta análise foi gerada por algoritmo proprietário MT Parceiros, com base nos parâmetros reais da CAIXA e regras MCMV 2025.', fmt_ia_desc)
    
    # [NOVO FLUXO 1] Status da Análise no Topo com Respiro
    ws_laudo.set_row(8, 20) # Linha de respiro (9)
    ws_laudo.merge_range('C10:F10', 'Status da Análise:', formats['label'])
    formula_status = '=IF(\'Educação Financeira\'!E33/\'Educação Financeira\'!E13 <= 0.30, "Aprovação Provável", "Risco de Parcelamento")'
    fmt_status = workbook.add_format({
        'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center', 'valign': 'vcenter', 
        'border': 2, 'border_color': c['success'], 'bg_color': '#EBFAEB'
    })
    ws_laudo.merge_range('G10:K10', '', fmt_status)
    ws_laudo.write_formula('G10', formula_status, fmt_status)

    # Campo de Nome Dinâmico - Padronizando Cor para Dark para harmonizar com a linha
    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['dark']})
    ws_laudo.write_formula('C11', '="Simulação preparada para: " & \'Educação Financeira\'!C9', fmt_personalized)
    
    # ---------------------------------------------------------
    # PARTE 1: CARTÕES KPI
    # ---------------------------------------------------------
    fmt_card_label = workbook.add_format({'font_name': f, 'font_size': 9, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'top': 1, 'right': 1, 'border_color': c['border']})
    fmt_card_value = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['dark'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_value_highlight = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_left_normal = workbook.add_format({'left': 5, 'left_color': c['border'], 'bg_color': c['bg_card'], 'top': 1, 'bottom': 1, 'border_color': c['border']})
    fmt_card_left_highlight = workbook.add_format({'left': 5, 'left_color': c['orange_cta'], 'bg_color': c['bg_card'], 'top': 1, 'bottom': 1, 'border_color': c['border']})
    
    # KPIs principais conectadas ao Simulador (Deslocadas para iniciar na linha 13)
    # HISTÓRICO CARTEIRA usa flag 'TEXT' para não aplicar formato monetário em SIM/NÃO
    kpis = [
        (13, 2, 'RENDA FAMILIAR', f"='Educação Financeira'!${CONFIG['map']['simulador']['renda']}", False),
        (17, 2, 'CRÉDITO CAIXA MAX', f"='Educação Financeira'!${CONFIG['map']['simulador']['potencial']}", False),
        (21, 2, 'SUBSÍDIO ESTIMADO', f"='Educação Financeira'!${CONFIG['map']['simulador']['subsidio']}", False),
        (25, 2, 'SALDO FGTS', f"='Educação Financeira'!${CONFIG['map']['simulador']['fgts']}", False),
        (13, 6, 'PODER DE COMPRA TOTAL', f"='Educação Financeira'!${CONFIG['map']['simulador']['poder']}", True),
        (17, 6, 'PARCELA PROJETADA', f"='Educação Financeira'!${CONFIG['map']['simulador']['parcela']}", True), 
        (21, 6, 'HISTÓRICO CARTEIRA TEXT', f"='Educação Financeira'!${CONFIG['map']['simulador']['carteira']}", True)
    ]
    
    for row, col, label, formula, is_highlight in kpis:
        ws_laudo.set_row(row, 15)
        ws_laudo.set_row(row+1, 30)
        fmt_left = fmt_card_left_highlight if is_highlight else fmt_card_left_normal
        ws_laudo.merge_range(row, col-1, row+1, col-1, '', fmt_left)
        # Limpar flag TEXT do label para exibição
        display_label = label.replace(' TEXT', '') if 'TEXT' in label else label
        ws_laudo.merge_range(row, col, row, col+1, f"  {display_label}", fmt_card_label)
        fmt_val = fmt_card_value_highlight if is_highlight else fmt_card_value
        if 'TEXT' in label:
             # Formato texto para campos como HISTÓRICO CARTEIRA (SIM/NÃO)
             fmt_text_val = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter'})
             ws_laudo.write_formula(row+1, col, formula, fmt_text_val)
        elif 'REPT' not in formula and '%' not in label and 'COMPROMETIMENTO' not in label:
             ws_laudo.write_formula(row+1, col, formula, fmt_val)
        elif 'COMPROMETIMENTO' in label:
             fmt_pct = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': '0%'})
             ws_laudo.write_formula(row+1, col, formula, fmt_pct)

    # [NOVO FLUXO 2] Jornada e Score Lado a Lado (Deslocados para linha 30)
    ws_laudo.merge_range('C30:E30', 'SEU SCORE MT PARCEIROS', formats['subtitle'])
    # Score: separadores unificados com vírgula (,) — padrão internacional do xlsxwriter
    formula_score = (
        "=MIN(100, "
        "MIN(40, MAX(0, 40-((('Educação Financeira'!E33/'Educação Financeira'!E13)-0.25)*200))) + "
        "MIN(30, 'Educação Financeira'!E24/50000*30) + "
        'IF(\'Educação Financeira\'!E26="SIM",30,10))'
    )
    fmt_score_big = workbook.add_format({'font_name': f, 'font_size': 36, 'bold': True, 'bg_color': c['dark'], 'font_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'border': 2, 'border_color': c['orange_cta']})
    ws_laudo.merge_range('C31:E32', '', fmt_score_big)
    ws_laudo.write_formula('C31', formula_score, fmt_score_big) # Score posicionado em C31
    
    # Jornada ao lado do Score (3 Caixas: Simulação, Contrato, Assinatura)
    ws_laudo.write('G30', 'JORNADA ATUAL:', formats['label'])
    fmt_cycle_base = workbook.add_format({'font_name': f, 'font_size': 9, 'align': 'center', 'valign': 'vcenter', 'font_color': c['text_gray'], 'bg_color': '#F8FAFC', 'border': 1, 'border_color': '#E2E8F0'})
    fmt_cycle_active = workbook.add_format({'font_name': f, 'font_size': 9, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'font_color': c['white'], 'bg_color': c['orange_cta'], 'border': 1, 'border_color': c['orange_cta']})
    
    ws_laudo.merge_range('G31:H32', 'Simulação', fmt_cycle_active)
    ws_laudo.merge_range('I31:J32', 'Contrato', fmt_cycle_base)
    ws_laudo.merge_range('K31:L32', 'Assinatura', fmt_cycle_base)
    
    # ---------------------------------------------------------
    # PARTE 3: GRÁFICOS REPT (In-Cell) - Deslocados
    # ---------------------------------------------------------
    ws_laudo.write('C35', '1. ANÁLISE DE COMPOSIÇÃO DE COMPRA', formats['subtitle'])
    ws_laudo.set_row(34, 25)
    
    # Barras de Composição
    ws_laudo.write('C37', 'Financiamento', formats['bar_label'])
    ws_laudo.write_formula('E37', "='Educação Financeira'!E29", formats['tbl_money'])
    ws_laudo.write_formula('G37', '=IF(E37>0, REPT("█", INT(MIN(20, E37/20000))), "")', formats['bar_flat'])
 
    ws_laudo.write('C39', 'Subsídio Gov.', formats['bar_label'])
    ws_laudo.write_formula('E39', "='Educação Financeira'!E30", formats['tbl_money'])
    ws_laudo.write_formula('G39', '=IF(E39>0, REPT("█", INT(MIN(20, E39/5000))), "")', formats['bar_orange'])
 
    ws_laudo.write('C41', 'FGTS + Próprios', formats['bar_label'])
    # Sincronia Total: Soma FGTS (E24) + Entrada em Dinheiro (E14)
    ws_laudo.write_formula('E41', "='Educação Financeira'!E24 + 'Educação Financeira'!E14", formats['tbl_money'])
    ws_laudo.write_formula('G41', '=IF(E41>0, REPT("█", INT(MIN(20, E41/5000))), "")', formats['bar_success'])
 
    # Risco e Renda (Direita)
    ws_laudo.write('I35', '2. RISCO E SAÚDE FINANCEIRA', formats['subtitle'])
    ws_laudo.write('I37', 'Comprometimento:', formats['bar_label'])
    formula_risk = "IFERROR('Educação Financeira'!E33 / 'Educação Financeira'!E13, 0)"
    ws_laudo.write_formula('I36', f'=IF({formula_risk}>0, REPT("▓", INT(MIN(30, {formula_risk} * 100))), "")', formats['bar_danger'])
    
    ws_laudo.write('I38', 'Margem de Segurança:', formats['bar_label'])
    formula_safe = "IFERROR(1 - ('Educação Financeira'!E33 / 'Educação Financeira'!E13), 0)"
    ws_laudo.write_formula('I39', f'=IF({formula_safe}>0, REPT("▓", INT(MIN(30, {formula_safe} * 100))), "")', formats['bar_success'])

# ==========================================
# 5. SIMULADOR (Educação Financeira)
# ==========================================
def build_educacao_financeira(workbook, ws_simul, formats, num_empreendimentos):
    """
    [Simulador Interativo & UI Sliders]
    Cria a área de input (bordas laranjas) recriando a experiência visual do site no Excel.
    """
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']
    
    # setup_worksheet_layout já foi chamado no loop principal (Grid C:K)
    
    ws_simul.merge_range('C6:K6', '🧠 SIMULADOR INTELIGENTE (Algoritmo Oficial)', formats['subtitle'])
    ws_simul.write('C7', 'Educação Financeira', formats['title'])
    
    # Campo de Nome Dinâmico (C8 separado para evitar conflito com merge C7:E8)
    ws_simul.write('C8', 'NOME DO CLIENTE:', formats['label'])
    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['orange_cta']})
    ws_simul.merge_range('C9:E9', "='Início'!E23", fmt_personalized) # simulador.nome
    
    # Textos de Ajuda
    fmt_help = workbook.add_format({'font_name': f, 'font_size': 9, 'italic': True, 'font_color': c['text_gray'], 'text_wrap': True})
    ws_simul.merge_range('C10:K11', 'Nosso algoritmo aplica as regras oficiais da CAIXA para calcular seu crédito máximo e subsídio MCMV.', fmt_help)
    ws_simul.set_row(10, 25)

    # --- BLOCO 1: RENDA ---
    ws_simul.write('C12', '1. DADOS DE ENTRADA (Sua Renda)', formats['subtitle'])
    ws_simul.write('C13', 'Renda Bruta Familiar:', formats['label'])
    ws_simul.write(CONFIG['map']['simulador']['renda'], 8000, formats['input_money'])
    ws_simul.write_formula('G13', f'=IF({CONFIG["map"]["simulador"]["renda"]}>0, REPT("█", INT(MIN(20, {CONFIG["map"]["simulador"]["renda"]}/1000))), "")', formats['bar_success'])

    ws_simul.write('C14', 'Entrada em dinheiro:', formats['label'])
    # Injeta um valor padrão numérico para permitir edição manual imediata pelo usuário no Excel
    ws_simul.write(CONFIG['map']['simulador']['entrada'], 15000, formats['input_money']) 
    ws_simul.write_formula('G14', f'=IF({CONFIG["map"]["simulador"]["entrada"]}>0, REPT("█", INT(MIN(20, {CONFIG["map"]["simulador"]["entrada"]}/2000))), "")', formats['bar_flat'])

    # --- BLOCO 2: DESPESAS ---
    ws_simul.write('C15', '2. COMPROMETIMENTO (Despesas)', formats['subtitle'])
    despesas = [('Aluguel Atual', 1200, 17), ('Alimentação', 800, 18), ('Transporte', 400, 19), ('Outros', 0, 20)]
    for label, default, row in despesas:
        ws_simul.write(f'C{row}', label, formats['label'])
        ws_simul.write(f'E{row}', default, formats['input_money'])
        ws_simul.write_formula(f'G{row}', f'=IF(E{row}>0, REPT("█", INT(MIN(20, E{row}/500))), "")', formats['bar_danger'])

    ws_simul.write('C22', 'TOTAL DESPESAS:', formats['label'])
    ws_simul.write_formula('E22', '=SUM(E17:E21)', formats['kpi_value'])
    
    ws_simul.write('C24', 'SALDO FGTS:', formats['label'])
    ws_simul.write(CONFIG['map']['simulador']['fgts'], 30000, formats['input_money'])
    ws_simul.write_formula('G24', f'=IF({CONFIG["map"]["simulador"]["fgts"]}>0, REPT("█", INT(MIN(20, {CONFIG["map"]["simulador"]["fgts"]}/2000))), "")', formats['bar_flat'])

    ws_simul.write('C26', 'TEM CARTEIRA (3+ ANOS)?', formats['label'])
    fmt_input_drop = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center', 'border': 1, 'border_color': c['orange_cta'], 'bg_color': '#FFF8F6', 'font_color': c['dark'], 'locked': False})
    ws_simul.write(CONFIG['map']['simulador']['carteira'], 'SIM', fmt_input_drop)
    ws_simul.data_validation(CONFIG['map']['simulador']['carteira'], {'validate': 'list', 'source': ['SIM', 'NÃO']})

    # --- BLOCO 3: ANALISE MCMV (OUTPUTS - Utilizados pelas outras abas) ---
    ws_simul.write('C28', '3. ANÁLISE DO FINANCIAMENTO (MCMV)', formats['subtitle'])
    
    ws_simul.write('C29', 'Seu Crédito CAIXA (Max):', formats['label'])
    # SAC Real Simplificado: Margem (30%) corrigida pelas taxas reais MCMV (~6.5% - 7% - 8%)
    # n=420 meses. Coeficiente médio ~130 a 140 para SAC na 1a parcela.
    formula_credito_real = '=ROUND(MAX(0, (E13*0.30 - E22) * IF(E26="SIM", 142, 132)), 0)'
    ws_simul.write_formula('E29', formula_credito_real, formats['tbl_money'])

    ws_simul.write('C30', 'Subsídio MCMV Estimado:', formats['label'])
    # Faixas 2025: F1 <= 2850 (55k), F2 <= 4700 (35k), F3 <= 8600 (0)
    # Lógica progressiva simples:
    formula_subsidio = '=IF(E13<=2850, 55000, IF(E13<=4700, 35000, 0))'
    ws_simul.write_formula('E30', formula_subsidio, formats['tbl_money'])
    
    ws_simul.write('C31', 'PODER DE COMPRA TOTAL:', formats['subtitle'])
    # Soma: Financiamento (E29) + Subsídio (E30) + FGTS (E24) + Entrada (E14)
    ws_simul.write_formula('E31', '=E29 + E30 + E24 + E14', formats['kpi_value_orange'])

    ws_simul.write('C33', 'PARCELA PROJETADA (Fixa):', formats['label'])
    # Parcela real baseada na margem de comprometimento (30% da renda menos dívidas)
    ws_simul.write_formula('E33', '=MAX(0, (E13 * 0.30) - E22)', formats['tbl_money'])
    
    # --- BLOCO 4: ESCOLHA DO IMÓVEL (Onde Tudo Começa) ---
    ws_simul.write('C35', '4. ESCOLHA SEU IMÓVEL (Compare Opções)', formats['subtitle'])
    ws_simul.write('C36', 'IMÓVEL SELECIONADO:', formats['label'])
    fmt_gray_card = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'border': 1, 'border_color': c['orange_cta'], 'locked': False, 'bg_color': c['bg_page'], 'align': 'center'})
    ws_simul.merge_range('E36:F36', 'Selecione um Imóvel...', fmt_gray_card)

    # Lista de Imóveis (Coluna Z oculta)
    ws_simul.set_column('Z:Z', None, None, {'hidden': True})
    for i in range(num_empreendimentos):
        ws_simul.write_formula(f'Z{i+60}', f"='System Data'!B{i+4}") 
    ws_simul.data_validation('E36', {'validate': 'list', 'source': f"=$Z$60:$Z${num_empreendimentos+59}"})

    # Detalhes (Reorganizados para leitura vertical)
    ws_simul.write('C38', 'VALOR ESTIMADO:', formats['label'])
    ws_simul.write_formula('E38', '=IFERROR(VLOOKUP(E36, Table_Empreendimentos[[Nome]:[Prazo_Meses]], 2, FALSE), 0)', formats['kpi_value_orange'])
    
    ws_simul.write('C39', 'BAIRRO / LOCAL:', formats['label'])
    fmt_prop_info = workbook.add_format({'font_name': f, 'font_size': 9, 'font_color': c['text_gray'], 'align': 'center', 'valign': 'vcenter'})
    ws_simul.write_formula('E39', '=IFERROR(VLOOKUP(E36, Table_Empreendimentos[[Nome]:[Prazo_Meses]], 5, FALSE), "---")', fmt_prop_info)
    
    ws_simul.write('C40', 'VER NO SITE:', formats['label'])
    fmt_prop_link = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': '#0000EE', 'underline': True, 'align': 'center', 'valign': 'vcenter'})
    ws_simul.write_formula('E40', f'=HYPERLINK("https://{CONFIG["company"]["website"]}", "🔗 Abrir Imóvel")', fmt_prop_link)

    # Preço Oculto Z1 (Referência Principal para IA baseada no Valor Estimado E38)
    ws_simul.write_formula('Z1', "=E38", formats['tbl_money'])
    
    # --- BLOCO 5: PLANEJAMENTO DA CONQUISTA (Conclusão IA) ---
    ws_simul.write('C42', '5. PLANEJAMENTO DA CONQUISTA (IA Meta)', formats['subtitle'])
    
    # Diferença para Entrada (Gap)
    formula_gap = "=MAX(0, E38 - E31)" # Preço Imóvel (E38) - Poder de Compra
    ws_simul.write('C43', 'Diferença para Entrada (Gap):', formats['label'])
    ws_simul.write_formula('E43', formula_gap, formats['tbl_money'])
    
    ws_simul.write('C44', 'Minha Reserva Mensal (Aporte):', formats['label'])
    ws_simul.write('E44', 500, formats['input_money']) # Input do usuário
    
    # Aporte Sugerido (Referência para o Fluxo Mensal)
    ws_simul.write('C45', 'Aporte Sugerido / Recomendado:', formats['label'])
    formula_aporte_sug = '=IF(E43<=0, 0, IF(TRIM(Z3)="Obra", E43/MAX(1, Z4), E44))'
    ws_simul.write_formula('E45', formula_aporte_sug, formats['tbl_money'])

    # NOVO: Evolução de Obra Estimada (Paga ao Banco)
    ws_simul.write('C46', 'Evolução de Obra Estimada (Banco):', formats['label'])
    # Média estimada de 0.02% do valor financiado (E29) por mês durante a obra
    formula_evol_obra = '=IF(TRIM(Z3)="Obra", E29 * 0.0002, 0)'
    ws_simul.write_formula('E46', formula_evol_obra, formats['tbl_money'])

    # Lógica Inteligente Z3 e Z4 (Status e Prazo)
    ws_simul.write_formula('Z3', "=IFERROR(VLOOKUP(E36, Table_Empreendimentos[[Nome]:[Prazo_Meses]], 10, FALSE), \"Pronto\")", formats['tbl_cell'])
    ws_simul.write_formula('Z4', "=IFERROR(VLOOKUP(E36, Table_Empreendimentos[[Nome]:[Prazo_Meses]], 11, FALSE), 1)", formats['tbl_cell'])
    
    # Mensagem IA Dinâmica (Reativa ao Crédito Real e ao Perfil de Obra)
    whatsapp_url = "https://wa.me/5511960364355?text=Olá,%20vi%20na%20minha%20simulação%20que%20tenho%20Perfil%20VIP!%20Quero%20fechar%20negócio."
    
    formula_ia_msg = (
        f'=IF(E13*0.30 <= E22, "⚠️ ALERTA: Suas despesas superam sua margem de crédito. Reduza seus custos ou aumente a renda para o banco aprovar.", '
        f'IF(E43<=0, HYPERLINK("{whatsapp_url}", "✅ PERFIL VIP: Entrada Coberta! Clique aqui para falar no WhatsApp!"), '
        'IF(TRIM(Z3)="Obra", "🏗️ PLANTA: Você precisará de R$ " & TEXT(E45, "#,##0") & " /mês para a entrada + R$ " & TEXT(E46, "#,##0") & " /mês (Evolução ao Banco).", '
        '"⏳ POUPANÇA: Guardando " & TEXT(E44, "R$ #,##0") & " /mês, em " & IFERROR(INT(E43/MAX(1, E44)), 0) & " meses você conquista seu lar!"))) '
    )
    
    fmt_ia_plan = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True, 'border': 2, 'border_color': c['orange_cta'], 'bg_color': c['bg_page']})
    ws_simul.merge_range('G43:K46', '', fmt_ia_plan) # Expandido para cobrir 4 linhas devido ao novo campo
    ws_simul.write_formula('G43', formula_ia_msg, fmt_ia_plan)
    
# ==========================================
# 6. RELATÓRIO: FLUXO MENSAL
# ==========================================
def build_fluxo_mensal(workbook, ws_fluxo, formats):
    """
    [Relatório Tabela + Gráfico de Área]
    Cria a projeção financeira mês a mês (24 meses padrão de obra).
    Inclui lógica cumulativa nativa em fórmulas do Excel e gráficos de evolução.
    """
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']
    
    # 6.1 Setup da Aba
    ws_fluxo.set_column('A:A', 3)
    ws_fluxo.set_column('B:B', 12)  # Checkbox Pago
    ws_fluxo.set_column('C:C', 15)  # Mês
    ws_fluxo.set_column('D:G', 20)  # Valores
    ws_fluxo.set_column('H:H', 22)  # Status Cumulativo
    
    ws_fluxo.write('C6', '📅 PROJEÇÃO FINANCEIRA REAL E CONTROLE', formats['subtitle'])
    ws_fluxo.write('C7', 'Fluxo Acumulado e Tracker de Aportes', formats['title'])
    
    # Campo de Nome Dinâmico 
    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['orange_cta']})
    ws_fluxo.write_formula('D8', '="Plano Mensal para: " & \'Início\'!E23', fmt_personalized)
    
    # -------------------------------------------------------------
    # DASHBOARD INTERATIVO (Topo)
    # -------------------------------------------------------------
    fmt_dash_title = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'font_color': c['text_gray'], 'align': 'center'})
    fmt_dash_val_green = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['success'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['success']})
    fmt_dash_val_orange = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['orange_cta']})
    
    ws_fluxo.merge_range('C9:E9', '💰 TOTAL APORTADO (Real)', fmt_dash_title)
    # Soma de D (Aporte) + E (Extra) se B for "Sim". Range aumentado até 200 para segurança.
    ws_fluxo.merge_range('C10:E11', '=SUMIF(B16:B200, "Sim", D16:D200) + SUMIF(B16:B200, "Sim", E16:E200)', fmt_dash_val_green)
    
    ws_fluxo.merge_range('F9:G9', '⏳ SALDO DEVEDOR (Restante)', formats['dash_title'])
    # Meta em E31.
    formula_meta_total = f"('Educação Financeira'!${CONFIG['map']['simulador']['poder']})"
    ws_fluxo.merge_range('F10:G11', f"='Educação Financeira'!$Z$1 - (SUMIF(B16:B200, \"Sim\", D16:D200) + SUMIF(B16:B200, \"Sim\", E16:E200))", fmt_dash_val_orange)
    
    # 6.2 EXPLICAÇÃO DA LÓGICA (Pedido do Usuário)
    fmt_box_help = workbook.add_format({'font_name': f, 'font_size': 9, 'italic': True, 'text_wrap': True, 'bg_color': '#FDFCFB', 'border': 1, 'border_color': c['border'], 'font_color': c['text_gray']})
    expl_text = (
        "💡 COMO FUNCIONA: Esta tabela monitora sua jornada financeira até a entrega das chaves. "
        "Marque 'Sim' na coluna 'Pago?' sempre que realizar um investimento. O Saldo Acumulado "
        "considera apenas os valores confirmados, ajudando você a manter o foco na meta final de crédito."
    )
    ws_fluxo.merge_range('C12:G14', expl_text, fmt_box_help)
    ws_fluxo.set_row(11, 25)
    ws_fluxo.set_row(12, 25)

    # -------------------------------------------------------------
    # TABELA DE FLUXO E CHECKBOXES
    # -------------------------------------------------------------
    headers = ['✅ Pago?', 'Mês / Ano', 'Aporte Mensal', 'Extra (Throughput)', 'Saldo Acumulado', 'Referência Meta', 'Status']
    start_row = 14
    
    # Cabeçalho Laranja Premium
    fmt_header_premium = workbook.add_format({'font_name': f, 'font_size': 10, 'bg_color': c['dark'], 'font_color': c['white'], 'bold': True, 'align': 'center', 'valign': 'vcenter'})
    
    for i, h in enumerate(headers):
        ws_fluxo.write(start_row, 1 + i, h, fmt_header_premium)

    fmt_date = workbook.add_format({'font_name': f, 'font_size': 11, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['border'], 'num_format': 'mmm/yy'})
    fmt_val = formats['tbl_money']
    fmt_total_col = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'bg_color': c['bg_card'], 'font_color': c['dark'], 'border': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00', 'align': 'right', 'valign': 'vcenter'})
    fmt_meta_col = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'font_color': c['text_gray'], 'border': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00', 'align': 'right', 'valign': 'vcenter'})
    
    # Formato do Checkbox Desbloqueado (para cliente poder clicar mesmo com planilha protegida)
    fmt_checkbox = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['border'], 'bg_color': c['bg_card'], 'locked': False, 'font_color': c['dark']})
    
    meses_projecao = 36 # Expandido levemente pro cliente ter mais horizonte
    for r in range(meses_projecao):
        row = start_row + 1 + r
        
        # Coluna B: Dropdown Sim/Não Desbloqueado
        ws_fluxo.write(row, 1, 'Não', fmt_checkbox)
        ws_fluxo.data_validation(row, 1, row, 1, {'validate': 'list', 'source': ['Sim', 'Não']})
        
        # Coluna C: Data (EDATE)
        ws_fluxo.write_formula(row, 2, f'=EDATE(TODAY(), {r})', fmt_date)
        
        # Coluna D: Aporte Mensal (Referenciando a inteligência da Seção 5 da Educação Financeira)
        formula_aporte = f"='Educação Financeira'!$E$45"
        ws_fluxo.write_formula(row, 3, formula_aporte, fmt_val)
        
        # Coluna E: Throughput
        formula_thru = f'=IF(MONTH(C{row+1})=12, \'Educação Financeira\'!$E$13 * 0.5, 0)'
        ws_fluxo.write_formula(row, 4, formula_thru, fmt_val)
        
        # Coluna F: Saldo Acumulado
        if r == 0:
            formula_acum = f"='Educação Financeira'!$E$24 + IF(B{row+1}=\"Sim\", D{row+1} + E{row+1}, 0)" # FGTS Inicial
        else:
            formula_acum = f"=F{row} + IF(B{row+1}=\"Sim\", D{row+1} + E{row+1}, 0)"
        ws_fluxo.write_formula(row, 5, formula_acum, fmt_total_col)
        
        # Coluna G: Meta Constante (Valor do Imóvel Selecionado)
        ws_fluxo.write_formula(row, 6, "='Educação Financeira'!$Z$1", fmt_meta_col)
        
        # Coluna H: Status
        formula_status = f'=IF(F{row+1}>=G{row+1}, "✅ ATINGIDA", "⏳ EM CURSO")'
        fmt_status_col = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['border']})
        ws_fluxo.write_formula(row, 7, formula_status, fmt_status_col)
        
    # Formatação Condicional de Status da Meta Visual (Verde/Amarelo)
    ws_fluxo.conditional_format(f'H{start_row+2}:H{start_row+1+meses_projecao}', {
        'type': 'text', 'criteria': 'begins with', 'value': '✅ ATINGIDA',
        'format': workbook.add_format({'font_color': c['success']})
    })
    ws_fluxo.conditional_format(f'H{start_row+2}:H{start_row+1+meses_projecao}', {
        'type': 'text', 'criteria': 'begins with', 'value': '⏳ EM CURSO',
        'format': workbook.add_format({'font_color': c['warning']})
    })
    
    # Formatação Condicional do 'Pago?' ("Sim" vira Verde Escuro Positivo)
    ws_fluxo.conditional_format(f'B{start_row+2}:B{start_row+1+meses_projecao}', {
        'type': 'cell', 'criteria': '==', 'value': '"Sim"',
        'format': workbook.add_format({'bg_color': c['success'], 'font_color': c['white'], 'bold': True})
    })


formats_global_ref = {}

def build_bi_export(workbook, ws_bi, empreendimentos):
    """
    [Power BI / Modelagem Estrela]
    Aba oculta com dados transpostos/flat, sem mesclagens, 
    100% otimizada para ser a Fato de um dashboard em Power BI.
    """
    ws_bi.hide()
    
    headers = ['Data_Extracao', 'ID_Simulacao', 'Cliente_Renda', 'Cliente_FGTS', 'Cliente_PoderCompra', 'Imovel_Nome', 'VLR_Parcela']
    
    # Escrever cabeçalhos limpos
    for col, txt in enumerate(headers):
        ws_bi.write(0, col, txt)
        
    # Como as métricas dependem dos inputs na aba Educação Financeira, 
    # conectamos essas células via fórmula estruturada.
    # Exemplo mockando a linha 1 exportando a simulação atual.
    
    ws_bi.write_formula(1, 0, '=TODAY()')
    ws_bi.write(1, 1, 'SIM-0001')
    
    # Os valores reais virão via referência depois que criarmos as abas.
    # Deixaremos referências estáticas por enquanto para criar a cola.
    ws_bi.write_formula(1, 2, "='Educação Financeira'!$E$13")
    ws_bi.write_formula(1, 3, "='Educação Financeira'!$E$24")
    ws_bi.write_formula(1, 4, "='Educação Financeira'!$E$31")
    ws_bi.write_formula(1, 5, "='Educação Financeira'!$E$36")
    ws_bi.write_formula(1, 6, "='Educação Financeira'!$E$33")


# ==========================================
# 7. KANBAN OCULTO (Gestão de Tarefas)
# ==========================================
def build_kanban_sheet(workbook, ws_kanban, formats):
    """
    [Ferramenta Consultor]
    Cria uma aba Kanban (A FAZER, EM ANDAMENTO, CONCLUÍDO) para 
    acompanhamento dos documentos do cliente (RG, CPF, Holerite etc).
    """
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']
    
    ws_kanban.set_tab_color(c['warning']) # Tab amarela pra destacar, mas fica oculta por padrão
    
    ws_kanban.set_column('A:B', 25)
    ws_kanban.set_column('C:D', 20)
    ws_kanban.set_column('E:E', 30)
    
    ws_kanban.write('A2', 'GESTÃO DE CLIENTE - BOARD KANBAN', formats['title'])
    
    headers = ['Tarefa / Documento', 'Responsável', 'Concluído?', '📅 Prazo', 'Obs']
    for i, h in enumerate(headers):
        ws_kanban.write(4, i, h, formats['tbl_header'])
        
    tarefas_base = [
        ['1. RG e CPF do Cliente', 'Cliente', False],
        ['2. Certidão Estado Civil', 'Cliente', False],
        ['3. Comprovantes de Renda', 'Cliente', False],
        ['4. Comprovante Residência', 'Cliente', False],
        ['5. Extrato FGTS', 'Cliente', False],
        ['6. Declaração IRPF', 'Cliente', False],
        ['7. Formulário CAIXA', 'Corretor', False],
        ['8. Protocolo CEV', 'Correspondente', False]
    ]
    
    fmt_celula = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'valign': 'vcenter'})
    fmt_check = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter', 'locked': False})
    
    for row_idx, tarefa in enumerate(tarefas_base):
        r = row_idx + 5
        ws_kanban.write(r, 0, tarefa[0], fmt_celula)
        ws_kanban.write(r, 1, tarefa[1], fmt_celula)
        # Coluna C: Boolean (Simulado para que o G-Sheets converta em Checkbox)
        ws_kanban.write(r, 2, tarefa[2], fmt_check)
        ws_kanban.write(r, 3, '', fmt_celula)
        ws_kanban.write(r, 4, '', fmt_celula)
        
    # Formatação Condicional (Google Sheets: Verde se for TRUE)
    ws_kanban.conditional_format(f'C6:C{5+len(tarefas_base)}', {
        'type': 'cell', 'criteria': '==', 'value': True,
        'format': workbook.add_format({'bg_color': c['success'], 'font_color': c['white']})
    })

    ws_kanban.hide() # Fica oculto por padrão (Ferramenta Interna)

# ==========================================
# 8. PROTEÇÃO MESTRE DA PLANILHA
# ==========================================
def apply_protection(worksheet):
    """
    [Segurança]
    Protege a aba para não quebrarem fórmulas e UX.
    As células desbloqueadas foram explicitamente definidas em setup_workbook com {'locked': False}.
    """
    # Protege a sheet com opções padrão, sem senha para travar UI apenas contra esbarrão
    worksheet.protect('', {
        'objects':               True,
        'scenarios':             True,
        'format_cells':          False, # Nao deixar formatar
        'format_columns':        False,
        'format_rows':           False,
        'insert_columns':        False,
        'insert_rows':           False,
        'insert_hyperlinks':     False,
        'delete_columns':        False,
        'delete_rows':           False,
        'select_locked_cells':   True,
        'sort':                  False,
        'autofilter':            True,  # Permitir se houver
        'pivot_tables':          False,
        'select_unlocked_cells': True,
    })


# ==========================================
# MAIN EXECUTION
# ==========================================
def create_excel_template():
    c = CONFIG['paths']
    output_path = c['output']
    json_path = c['json_data']
    
    empreendimentos = []
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            empreendimentos = json.load(f)

    # Inicializar Workbook
    workbook = xlsxwriter.Workbook(output_path)
    
    # Configurar Formatos Globais
    global formats_global_ref
    formats = setup_workbook(workbook)
    formats_global_ref = formats
    
    # --- Passo 1 Execução: UX/UI e Abas Base (VISÍVEIS PRIMEIRO) ---
    # Criamos as abas visíveis ANTES das ocultas para que xlsxwriter permita o hide()
    # (xlsxwriter exige pelo menos uma aba visível antes de ocultar sheets)
    tabs_principais = ['Início', 'Laudo de Crédito', 'Educação Financeira', 'Fluxo Mensal']
    worksheets = {}  # Guardar referências para preenchimento posterior
    
    for tab_name in tabs_principais:
        ws = workbook.add_worksheet(tab_name)
        worksheets[tab_name] = ws
        setup_worksheet_layout(ws, formats)
        build_global_navigation(workbook, ws, tab_name, formats)
    
    # --- Passo 2 Execução: Infraestrutura (OCULTA) ---
    ws_data = workbook.add_worksheet('System Data')
    ws_data.hide()
    build_system_data(workbook, ws_data, empreendimentos, formats)
    
    ws_bi = workbook.add_worksheet('_BI_Export')
    build_bi_export(workbook, ws_bi, empreendimentos)
    
    # --- Passo 3 Execução: Conteúdo das Abas Visíveis ---
    for tab_name in tabs_principais:
        ws = worksheets[tab_name]
        
        # Aplicaremos as funções específicas de conteúdo
        if tab_name == 'Início':
            build_landing_page(workbook, ws, formats)
            # Rodapé empurrado para a linha 60 para não corromper os novos botões duplos de navegação (L.54)
            build_global_footer(workbook, ws, 60, formats)
            apply_protection(ws)

        elif tab_name == 'Laudo de Crédito':
            build_laudo_credito(workbook, ws, formats)
            build_global_footer(workbook, ws, 40, formats)
            apply_protection(ws) # Bloqueia toda a aba (dashboard puro visualização)
            
        elif tab_name == 'Educação Financeira':
            build_educacao_financeira(workbook, ws, formats, len(empreendimentos))
            build_global_footer(workbook, ws, 50, formats)
            apply_protection(ws) # Bloqueia toda a aba EXCETO os inputs ('locked': False)
            
        elif tab_name == 'Fluxo Mensal':
            build_fluxo_mensal(workbook, ws, formats)
            build_global_footer(workbook, ws, 65, formats)
            apply_protection(ws) # Bloqueia toda a aba
            
    # --- Passo 3: Abas de Apoio (Ocultas ou Internas) ---
    ws_kanban = workbook.add_worksheet('Kanban')
    build_kanban_sheet(workbook, ws_kanban, formats)
    apply_protection(ws_kanban)
            
    # Fechar para salvar em Base_Template
    try:
        workbook.close()
        print(f"Template Avançado MT Parceiros criado com sucesso!")
        print(f"Salvo em 1: {output_path}")
        
        # [AUTOMAÇÃO] Copiar para a pasta assets/docs do site para que o download web reflita a mudança na hora
        docs_path = CONFIG['paths']['docs']
        import shutil
        shutil.copy2(output_path, docs_path)
        print(f"Sincronizado em 2: {docs_path}")
        
    except Exception as e:
        print(f"Erro crítico ao salvar/sincronizar: {e}")

if __name__ == '__main__':
    create_excel_template()
