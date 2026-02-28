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
    ws_data.set_column('C:E', 15)  # Preco, Area, Quartos
    ws_data.set_column('F:F', 20)  # Bairro
    ws_data.set_column('G:G', 15)  # Entrega
    ws_data.set_column('H:I', 50)  # Diferenciais, Lazer
    ws_data.set_column('J:J', 40)  # Imagem_URL
    
    # Instrução para o Usuário/Analista (Linha 1)
    ws_data.merge_range('A1:J1', '💡 IMPORTANTE: Esta tabela (Table_Empreendimentos) é a fonte de dados primária. Use "Atualizar Tudo" se conectada a fontes externas.', formats['label'])
    ws_data.set_row(0, 30)

    # Preparar Dados para a Tabela
    # Estrutura: ID | Nome | Preço | Área | Quartos | Bairro | Entrega | Diferenciais | Lazer | Imagem_URL
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
        
        # Se a chave preço contém apenas texto (ex: itens de lazer), tentamos buscar na chave entrega (ex: "205mil")
        if not any(char.isdigit() for char in preco_cru):
            preco_cru = str(emp.get('entrega', '0'))
            
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

        # Adicionar linha de dados
        table_data.append([
            i + 1,                                  # ID (Chave Primária)
            emp.get('nome', 'N/A'),                 # Nome
            preco_num,                              # Preço Numérico
            emp.get('area', ''),                    # Área
            emp.get('quartos', ''),                 # Quartos
            emp.get('bairro', ''),                  # Bairro
            emp.get('entrega', ''),                 # Entrega
            emp.get('diferenciais', ''),            # Diferenciais
            emp.get('lazer', ''),                   # Lazer
            emp.get('imagem', '')                   # Imagem URL
        ])
        
    num_rows = len(table_data)
    num_cols = len(table_data[0]) if num_rows > 0 else 10
    
    # Criar a Tabela Excel Oficial
    # A tabela começa na A3 para deixar espaço de respiro
    end_row = 2 + num_rows
    table_range = f'A3:J{end_row}'
    
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
            {'header': 'Imagem_URL'}
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
        worksheet.merge_range(cell_range, '', fmt)
        worksheet.write_formula(target_cell, f'=HYPERLINK("#\'{name}\'!A1", "{name}")', fmt)
    
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
    
    # Colunas de Conteúdo
    worksheet.set_column('C:C', 25)
    worksheet.set_column('E:E', 25)
    worksheet.set_column('G:G', 25)
    worksheet.set_column('I:I', 25)
    worksheet.set_column('K:K', 25)
    
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
    fmt_card_orange_sub = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border']})
    
    # Card 2 (Informativo - Escuro)
    fmt_card_blue_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'], 'bg_color': c['dark'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['dark']})
    fmt_card_blue_val = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['dark'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_blue_sub = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border']})
    
    # Card 3 (Sucesso - Verde)
    fmt_card_green_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'], 'bg_color': c['success'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['success']})
    fmt_card_green_val = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['success'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_green_sub = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border']})

    # Aviso de Isenção
    ws_start.set_row(28, 15)
    fmt_aviso = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['dark'], 'align': 'center', 'valign': 'vcenter'})
    ws_start.merge_range('C29:K29', '⚠️ Valores estimados para fins de consultoria. MT Parceiros | (11) 96036-4355', fmt_aviso)

    # Card 1 (Inicia em C34)
    ws_start.merge_range('C34:E34', 'MENSAIS DA ENTRADA', fmt_card_orange_title)
    ws_start.merge_range('C35:E35', 0, fmt_card_orange_val) # m_entrada
    ws_start.merge_range('C36:E36', '36x (Parcelas)', fmt_card_orange_sub)
    
    # Card 2 (Inicia em G34)
    ws_start.merge_range('G34:I34', 'EVOLUÇÃO OBRA', fmt_card_blue_title)
    ws_start.merge_range('G35:I35', 0, fmt_card_blue_val) # m_evolucao
    ws_start.merge_range('G36:I36', 'Média mensal', fmt_card_blue_sub)
    
    # Card 3 (Inicia em K34)
    ws_start.merge_range('K34:L34', 'PARCELA FINANCIAMENTO', fmt_card_green_title)
    ws_start.merge_range('K35:L35', 0, fmt_card_green_val) # m_parcela
    ws_start.merge_range('K36:L36', 'Após a entrega (até 35 anos)', fmt_card_green_sub)
    
    # Documentos
    ws_start.set_row(39, 30)
    ws_start.merge_range('C40:K40', 'Documentação Necessária', workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center'}))
    ws_start.merge_range('C41:K41', 'Separe estes documentos para acelerar sua aprovação com a Caixa:', workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'align': 'center'}))
    
    fmt_doc_box = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'bg_color': c['white'], 'border': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter', 'text_wrap': True})
    
    docs = ['RG e CPF', 'Certidão de Estado Civil', 'Comprovante de Renda (3 meses)', 'Comprovante de Residência', 'Extrato FGTS', 'Declaração IRPF']
    # Distribuir docs no grid intercalado C, E, G, I, K...
    # Linha 1 de documentos (43)
    ws_start.write('C43', docs[0], fmt_doc_box)
    ws_start.write('E43', docs[1], fmt_doc_box)
    ws_start.write('G43', docs[2], fmt_doc_box)
    # Linha 2 de documentos (45)
    ws_start.write('C45', docs[3], fmt_doc_box)
    ws_start.write('E45', docs[4], fmt_doc_box)
    ws_start.write('G45', docs[5], fmt_doc_box)
    
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
    ws_laudo.write('C6', '📊 ANÁLISE EXECUTIVA (Algoritmo IA)', formats['subtitle'])
    ws_laudo.write('C7', 'Laudo de Crédito', formats['title'])
    
    fmt_ia_desc = workbook.add_format({'font_name': f, 'font_size': 9, 'italic': True, 'font_color': c['text_gray'], 'text_wrap': True})
    ws_laudo.merge_range('C8:K8', 'Esta análise foi gerada por algoritmo proprietário MT Parceiros, com base nos parâmetros reais da CAIXA e regras MCMV 2025.', fmt_ia_desc)
    
    # [SPRINT 3] CYCLE TIME — Linha do Tempo da Jornada
    fmt_cycle_base = workbook.add_format({'font_name': f, 'font_size': 8, 'align': 'center', 'valign': 'vcenter', 'font_color': c['text_gray'], 'bg_color': '#F8FAFC', 'border': 1, 'border_color': '#E2E8F0'})
    fmt_cycle_active = workbook.add_format({'font_name': f, 'font_size': 8, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'font_color': c['white'], 'bg_color': c['orange_cta'], 'border': 1, 'border_color': c['orange_cta']})
    
    # Jornada na direita (I, J, K)
    ws_laudo.write('I6', 'JORNADA:', formats['label'])
    ws_laudo.write('J6', 'Simulação', fmt_cycle_active)
    ws_laudo.write('K6', 'Contrato', fmt_cycle_base)
    
    # Campo de Nome Dinâmico 
    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['orange_cta']})
    ws_laudo.write_formula('C10', '="Simulação preparada para: " & \'Educação Financeira\'!C9', fmt_personalized)
    
    # ---------------------------------------------------------
    # PARTE 1: CARTÕES KPI
    # ---------------------------------------------------------
    fmt_card_label = workbook.add_format({'font_name': f, 'font_size': 9, 'font_color': c['text_gray'], 'bg_color': c['bg_card'], 'top': 1, 'right': 1, 'border_color': c['border']})
    fmt_card_value = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['dark'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_value_highlight = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_left_normal = workbook.add_format({'left': 5, 'left_color': c['border'], 'bg_color': c['bg_card'], 'top': 1, 'bottom': 1, 'border_color': c['border']})
    fmt_card_left_highlight = workbook.add_format({'left': 5, 'left_color': c['orange_cta'], 'bg_color': c['bg_card'], 'top': 1, 'bottom': 1, 'border_color': c['border']})
    
    # KPIs principais conectadas ao Simulador (Coluna E)
    kpis = [
        (11, 2, 'RENDA FAMILIAR', f"='Educação Financeira'!${CONFIG['map']['simulador']['renda']}", False),
        (15, 2, 'CRÉDITO CAIXA MAX', f"='Educação Financeira'!${CONFIG['map']['simulador']['potencial']}", False),
        (19, 2, 'SUBSÍDIO ESTIMADO', f"='Educação Financeira'!${CONFIG['map']['simulador']['subsidio']}", False),
        (23, 2, 'SALDO FGTS', f"='Educação Financeira'!${CONFIG['map']['simulador']['fgts']}", False),
        (11, 6, 'PODER DE COMPRA TOTAL', f"='Educação Financeira'!${CONFIG['map']['simulador']['poder']}", True),
        (15, 6, 'PARCELA PROJETADA', f"='Educação Financeira'!${CONFIG['map']['simulador']['parcela']}", True), 
        (19, 6, 'COMPROMETIMENTO', f"=('Educação Financeira'!${CONFIG['map']['simulador']['parcela']} / 'Educação Financeira'!${CONFIG['map']['simulador']['renda']})", True)
    ]
    
    for row, col, label, formula, is_highlight in kpis:
        ws_laudo.set_row(row, 15)
        ws_laudo.set_row(row+1, 30)
        fmt_left = fmt_card_left_highlight if is_highlight else fmt_card_left_normal
        ws_laudo.merge_range(row, col-1, row+1, col-1, '', fmt_left)
        ws_laudo.merge_range(row, col, row, col+1, f"  {label}", fmt_card_label)
        fmt_val = fmt_card_value_highlight if is_highlight else fmt_card_value
        if 'REPT' not in formula and '%' not in label and 'COMPROMETIMENTO' not in label:
             ws_laudo.write_formula(row+1, col, formula, fmt_val)
        elif 'COMPROMETIMENTO' in label:
             fmt_pct = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': '0%'})
             ws_laudo.write_formula(row+1, col, formula, fmt_pct)

    # ---------------------------------------------------------
    # PARTE 2: STATUS E SCORE
    # ---------------------------------------------------------
    ws_laudo.write('I24', 'Status da Análise:', formats['label'])
    formula_status = '=IF(\'Educação Financeira\'!E33/\'Educação Financeira\'!E13 <= 0.30, "Aprovação Provável", "Risco de Parcelamento")'
    fmt_status = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['border']})
    ws_laudo.merge_range('I25:K26', '', fmt_status)
    ws_laudo.write_formula('I25', formula_status, fmt_status)
    
    # Score IA (Lógica refinada para o novo grid)
    ws_laudo.merge_range('C28:E28', 'SEU SCORE MT PARCEIROS', formats['subtitle'])
    formula_score = (
        "=MIN(100, "
        "MIN(40, MAX(0, 40-((('Educação Financeira'!E33/'Educação Financeira'!E13)-0.25)*200))) + "
        "MIN(30, 'Educação Financeira'!E24/50000*30) + "
        'IF(\'Educação Financeira\'!E26="SIM",30,10))'
    )
    fmt_score_big = workbook.add_format({'font_name': f, 'font_size': 36, 'bold': True, 'bg_color': c['dark'], 'font_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'border': 2, 'border_color': c['orange_cta']})
    ws_laudo.merge_range('C29:E30', '', fmt_score_big)
    ws_laudo.write_formula('C29', formula_score, fmt_score_big)
    
    # ---------------------------------------------------------
    # PARTE 3: GRÁFICOS REPT (In-Cell)
    # ---------------------------------------------------------
    ws_laudo.write('C33', '1. ANÁLISE DE COMPOSIÇÃO DE COMPRA', formats['subtitle'])
    ws_laudo.set_row(32, 25)
    
    # Barras de Composição (Referenciando outputs do simulador)
    ws_laudo.write('C35', 'Financiamento', formats['bar_label'])
    ws_laudo.write_formula('E35', "='Educação Financeira'!E29", formats['tbl_money'])
    ws_laudo.write_formula('G35', '=IF(E35>0, REPT("█", INT(MIN(20, E35/20000))), "")', formats['bar_flat'])
 
    ws_laudo.write('C37', 'Subsídio Gov.', formats['bar_label'])
    ws_laudo.write_formula('E37', "='Educação Financeira'!E30", formats['tbl_money'])
    ws_laudo.write_formula('G37', '=IF(E37>0, REPT("█", INT(MIN(20, E37/5000))), "")', formats['bar_orange'])
 
    ws_laudo.write('C39', 'FGTS + Próprios', formats['bar_label'])
    ws_laudo.write_formula('E39', "='Educação Financeira'!E24", formats['tbl_money'])
    ws_laudo.write_formula('G39', '=IF(E39>0, REPT("█", INT(MIN(20, E39/5000))), "")', formats['bar_success'])
 
    # Risco e Renda
    ws_laudo.write('I33', '2. RISCO E SAÚDE FINANCEIRA', formats['subtitle'])
    ws_laudo.write('I35', 'Comprometimento:', formats['bar_label'])
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
    ws_simul.merge_range('C7:E8', 'Educação Financeira', formats['title'])
    
    ws_simul.write('G7', 'IMÓVEL SELECIONADO:', formats['label'])
    fmt_drop = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'border': 1, 'border_color': c['orange_cta'], 'locked': False, 'bg_color': '#FFF8F6', 'align': 'center'})
    ws_simul.merge_range('G8:I8', 'Selecione um Imóvel...', fmt_drop)
    
    # [CORREÇÃO G-SHEETS] Escrever a lista de imóveis na Coluna Z oculta
    ws_simul.set_column('Z:Z', None, None, {'hidden': True})
    for i in range(num_empreendimentos):
        ws_simul.write_formula(f'Z{i+2}', f"='System Data'!B{i+4}") # Nome do Imóvel na System Data
    
    ws_simul.data_validation('G6', {'validate': 'list', 'source': f"=$Z$2:$Z${num_empreendimentos+1}"})
    
    # Preço Oculto para Cálculo (Z1)
    ws_simul.write_formula('Z1', "=IFERROR(VLOOKUP(G6,Table_Empreendimentos[[Nome]:[Preço]],2,FALSE),0)", formats['tbl_money'])
    
    # Nome do Cliente
    ws_simul.write('C8', 'NOME DO CLIENTE:', formats['label'])
    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['orange_cta']})
    ws_simul.merge_range('C9:E9', "='Início'!E23", fmt_personalized) # simulador.nome
    
    # Textos de Ajuda
    fmt_help = workbook.add_format({'font_name': f, 'font_size': 9, 'italic': True, 'font_color': c['text_gray'], 'text_wrap': True})
    ws_simul.merge_range('C10:I10', 'Nosso algoritmo aplica as regras oficiais da CAIXA para calcular seu crédito máximo e subsídio MCMV.', fmt_help)
    ws_simul.set_row(9, 25)

    # --- BLOCO 1: RENDA ---
    ws_simul.write('C12', '1. DADOS DE ENTRADA (Sua Renda)', formats['subtitle'])
    ws_simul.write('C13', 'Renda Bruta Familiar:', formats['label'])
    ws_simul.write(CONFIG['map']['simulador']['renda'], 8000, formats['input_money'])
    ws_simul.write_formula('G13', f'=IF({CONFIG["map"]["simulador"]["renda"]}>0, REPT("█", INT(MIN(20, {CONFIG["map"]["simulador"]["renda"]}/1000))), "")', formats['bar_success'])

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
    ws_simul.write_formula('E29', '=MAX(0, (E13*0.30)*150)', formats['tbl_money'])
    
    ws_simul.write('C30', 'Subsídio MCMV Estimado:', formats['label'])
    ws_simul.write_formula('E30', '=IF(E13<=2640, 55000, IF(E13<=4400, 35000, 0))', formats['tbl_money'])
    
    ws_simul.write('C31', 'PODER DE COMPRA TOTAL:', formats['subtitle'])
    ws_simul.write_formula('E31', '=E29 + E30 + E24', formats['kpi_value_orange'])

    ws_simul.write('C33', 'PARCELA PROJETADA (Fixa):', formats['label'])
    ws_simul.write_formula('E33', '=E13 * 0.28', formats['tbl_money'])
    
    # Status Box 
    ws_simul.merge_range('G29:I31', '', formats['bg_card'])
    formula_status_sim = '=IF(E22/E13 > 0.4, "⚠️ ALERTA: Comprometimento Alto", "✅ SAUDÁVEL: Perfil Positivo")'
    fmt_status_sim = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True, 'border': 2, 'border_color': c['border']})
    ws_simul.write_formula('G29', formula_status_sim, fmt_status_sim)

    
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
    ws_fluxo.write_formula('D8', '="Plano Mensal para: " & \'Início\'!C22', fmt_personalized)
    
    # -------------------------------------------------------------
    # DASHBOARD INTERATIVO (Topo)
    # -------------------------------------------------------------
    fmt_dash_title = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'font_color': c['text_gray'], 'align': 'center'})
    fmt_dash_val_green = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['success'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['success']})
    fmt_dash_val_orange = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['orange_cta']})
    
    ws_fluxo.merge_range('C9:E9', '💰 TOTAL APORTADO (Real)', fmt_dash_title)
    # Soma de D (Aporte) + E (Throughput) se B for "Sim"
    # Como as linhas vão até ~100
    ws_fluxo.merge_range('C10:E11', '=SUMIF(B13:B100, "Sim", D13:D100) + SUMIF(B13:B100, "Sim", E13:E100)', fmt_dash_val_green)
    
    ws_fluxo.merge_range('F9:G9', '⏳ SALDO DEVEDOR (Restante)', formats['dash_title'])
    # Meta em E31.
    formula_meta_total = f"('Educação Financeira'!${CONFIG['map']['simulador']['poder']})"
    ws_fluxo.merge_range('F10:G11', f"={formula_meta_total} - (SUMIF(B13:B100, \"Sim\", D13:D100) + SUMIF(B13:B100, \"Sim\", E13:E100))", fmt_dash_val_orange)
    
    # -------------------------------------------------------------
    # TABELA DE FLUXO E CHECKBOXES
    # -------------------------------------------------------------
    headers = ['✅ Pago?', 'Mês / Ano', 'Aporte Mensal', 'Extra (Throughput)', 'Saldo Acumulado', 'Referência Meta', 'Status']
    start_row = 11
    
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
        
        # Coluna D: Aporte Mensal
        formula_aporte = f"=MAX(0, 'Educação Financeira'!$E$33 * 0.5)"
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
        
        # Coluna G: Meta Constante
        ws_fluxo.write_formula(row, 6, f"={formula_meta_total}", fmt_meta_col)
        
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
    ws_bi.write_formula(1, 5, "='Educação Financeira'!$G$6")
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
    
    # --- Passo 1 Execução: Infraestrutura ---
    ws_data = workbook.add_worksheet('System Data')
    ws_data.hide() # Oculto para o cliente, ativado apenas para motor de dados
    build_system_data(workbook, ws_data, empreendimentos, formats)
    
    ws_bi = workbook.add_worksheet('_BI_Export')
    build_bi_export(workbook, ws_bi, empreendimentos)
    
    # --- Passo 2 Execução: UX/UI e Abas Base ---
    # Incluindo 'Início' como a primeira aba (Landing Page)
    tabs_principais = ['Início', 'Laudo de Crédito', 'Educação Financeira', 'Fluxo Mensal']
    
    for tab_name in tabs_principais:
        ws = workbook.add_worksheet(tab_name)
        setup_worksheet_layout(ws, formats)
        build_global_navigation(workbook, ws, tab_name, formats)
        
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
            build_global_footer(workbook, ws, 40, formats)
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
