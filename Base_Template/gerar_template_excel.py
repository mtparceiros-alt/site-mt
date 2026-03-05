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
        # ✅ FIX #8: Poppins não existe no Google Sheets — usar Arial como primária
        'primary': 'Arial',
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
        'docs':   r"C:\Users\Marcos.PC_M1\Documents\site_mt\assets\docs\template_mt_parceiros.xlsx",
        'json_data': r"C:\Users\Marcos.PC_M1\Documents\site_mt\empreendimentos.json",
        'assets': r"C:\Users\Marcos.PC_M1\Documents\site_mt\assets\images"
    },
    'company': {
        'name': 'MT Parceiros',
        'phone': '(11) 96036-4355',
        'email': 'mtparceiros@gmail.com',
        'website': 'mtparceiros-alt.github.io/site-mt'
    },
    'map': {
        'inicio': {
            'nome':      'E23',
            'm_entrada':  'C35',
            'd_inicial':  'Z35',
            'm_evolucao': 'G35',
            'm_parcela':  'K35'
        },
        'simulador': {
            'nome':              'D9',
            'imovel':            'G8',
            'renda':             'E13',
            'fgts':              'E24',
            'entrada':           'E14',
            'dividas':           'E17',
            'carteira':          'E26',
            'potencial':         'E29',
            'subsidio_federal':  'E30',
            'subsidio_estadual': 'G30',
            'poder':             'E31',
            'parcela':           'E33'
        },
        'laudo': {
            'renda':    'C12',
            'potencial':'C16',
            'subsidio': 'C20',
            'fgts':     'C24',
            'poder':    'E12',
            'parcela':  'E16'
        }
    }
}

# ==========================================
# 1. SETUP WORKBOOK & FORMATOS GLOBAIS
# ==========================================
def setup_workbook(workbook):
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']
    formats = {}

    formats['title']    = workbook.add_format({'font_name': f, 'font_size': 24, 'bold': True,  'font_color': c['dark']})
    formats['subtitle'] = workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True,  'font_color': c['text_gray']})
    formats['label']    = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray']})

    formats['kpi_value']        = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['dark'],       'num_format': 'R$ #,##0.00'})
    formats['kpi_value_orange'] = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['orange_cta'], 'num_format': 'R$ #,##0.00'})

    formats['tbl_header'] = workbook.add_format({'font_name': f, 'font_size': 10, 'bg_color': c['dark'],  'font_color': c['white'], 'bold': True, 'align': 'center', 'valign': 'vcenter'})
    formats['tbl_cell']   = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter'})
    formats['tbl_money']  = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00', 'align': 'right', 'valign': 'vcenter'})

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

    formats['bg_default'] = workbook.add_format({'bg_color': c['bg_page']})
    formats['bg_card']    = workbook.add_format({'bg_color': c['bg_card']})

    formats['bar_flat']    = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left'})
    formats['bar_orange']  = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left', 'font_color': c['orange_cta']})
    formats['bar_success'] = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left', 'font_color': c['success']})
    formats['bar_danger']  = workbook.add_format({'font_name': f, 'font_size': 12, 'valign': 'vcenter', 'align': 'left', 'font_color': c['danger']})
    formats['bar_label']   = workbook.add_format({'font_name': f, 'font_size': 10, 'valign': 'vcenter', 'align': 'right', 'font_color': c['dark']})

    formats['dash_title']     = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'font_color': c['text_gray'], 'align': 'center'})
    formats['dash_val_green'] = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['success'],    'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['success']})
    formats['dash_val_orange']= workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['orange_cta']})

    return formats


# ==========================================
# 2. MOTOR DE DADOS
# ==========================================
def build_system_data(workbook, ws_data, empreendimentos, formats):
    ws_data.hide()
    ws_data.set_tab_color(CONFIG['colors']['dark'])
    ws_data.set_column('A:A', 10)
    ws_data.set_column('B:B', 35)
    ws_data.set_column('J:J', 20)
    ws_data.set_column('K:K', 15)
    ws_data.set_column('L:L', 10)

    ws_data.merge_range('A1:J1',
        '💡 IMPORTANTE: Esta tabela é a fonte de dados primária.',
        formats['label'])
    ws_data.set_row(0, 30)

    if not empreendimentos:
        empreendimentos = [
            {'nome': 'Residencial Demo 1', 'preco': '250.000', 'area': '45m²', 'quartos': '2', 'bairro': 'Centro',  'entrega': 'Dez/25',  'diferenciais': 'Piscina',  'lazer': 'Churrasqueira', 'imagem': 'img1.jpg'},
            {'nome': 'Residencial Demo 2', 'preco': '320.000', 'area': '55m²', 'quartos': '3', 'bairro': 'Sul',     'entrega': 'Pronto',  'diferenciais': 'Varanda',  'lazer': 'Academia',      'imagem': 'img2.jpg'}
        ]

    table_data = []
    for i, emp in enumerate(empreendimentos):
        preco_cru   = str(emp.get('preco', '0'))
        entrega_cru = str(emp.get('entrega', '0'))

        if 'mil' in entrega_cru.lower():
            preco_cru = entrega_cru
        elif not any(ch.isdigit() for ch in preco_cru):
            preco_cru = entrega_cru

        preco_cru = preco_cru.lower().replace('r$', '').replace('a partir de', '').strip()

        try:
            if 'mil' in preco_cru:
                nums = ''.join(x for x in preco_cru.replace('mil', '') if x.isdigit() or x == '.')
                preco_num = float(nums) * 1000
            else:
                nums = ''.join(x for x in preco_cru.replace('.', '').replace(',', '.') if x.isdigit() or x == '.')
                preco_num = float(nums)
        except Exception:
            preco_num = 0

        nome_limpo  = emp.get('nome', 'N/A').replace('\n', ' ').replace('\r', ' ').strip()
        entrega_str = str(emp.get('entrega', 'Pronto'))

        if 'pronto' in entrega_str.lower() or entrega_str.strip() == '':
            status_obra = 'Pronto'
            prazo_meses = 0
        else:
            status_obra = 'Obra'
            prazo_meses = 24

        table_data.append([
            i + 1, nome_limpo, preco_num,
            emp.get('area', ''), emp.get('quartos', ''), emp.get('bairro', ''),
            emp.get('entrega', ''), emp.get('diferenciais', ''), emp.get('lazer', ''),
            emp.get('imagem', ''), status_obra, prazo_meses
        ])

    num_rows  = len(table_data)
    end_row   = 2 + num_rows
    table_range = f'A3:L{end_row}'

    # ✅ FIX #9: 'Table Style Medium 2' é ignorado pelo Google Sheets — sem impacto funcional,
    #            mas deixamos para manter compatibilidade com Excel.
    ws_data.add_table(table_range, {
        'data': table_data,
        'name': 'Table_Empreendimentos',
        'style': 'Table Style Medium 2',
        'columns': [
            {'header': 'ID'},
            {'header': 'Nome'},
            {'header': 'Preco', 'format': formats['tbl_money']},  # ✅ FIX: sem acento no header da tabela
            {'header': 'Area'},
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

    sim_row = end_row + 4
    ws_data.write(sim_row, 0, 'Parâmetros Internos', formats['subtitle'])
    ws_data.add_table(f'A{sim_row+2}:B{sim_row+6}', {
        'data': [
            ['Renda_Base',   8500],
            ['FGTS_Base',   30000],
            ['Entrada_Base',15000],
            ['Prazo_Meses',   420]
        ],
        'name': 'Table_Params',
        'header_row': False
    })


# ==========================================
# 3. INTERFACE GERAL
# ==========================================
def insert_image_safe(worksheet, cell, image_path, options, formats):
    # ✅ FIX #4: insert_textbox NÃO existe no xlsxwriter — substituído por write simples
    if os.path.exists(image_path):
        worksheet.insert_image(cell, image_path, options)
    else:
        worksheet.write(cell, '[Imagem indisponível]', formats.get('label'))


def build_global_navigation(workbook, worksheet, active_tab_name, formats):
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']

    contact_info = f"📍 {CONFIG['company']['email']} | 📞 {CONFIG['company']['phone']} | 🌐 {CONFIG['company']['website']}"

    fmt_subheader = workbook.add_format({
        'bg_color': c['white'], 'font_name': f, 'font_size': 9, 'font_color': c['text_gray'],
        'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'bottom_color': c['border']
    })

    if active_tab_name == 'Início':
        worksheet.set_row(0, 45)
    else:
        worksheet.set_row(0, CONFIG['layout']['nav_height_sub'])
        worksheet.merge_range('B1:L1', contact_info, fmt_subheader)

    worksheet.set_row(2, CONFIG['layout']['nav_height_main'])

    fmt_link_inactive = workbook.add_format({
        'font_name': f, 'font_size': 11, 'bold': True,
        'font_color': c['dark'], 'bg_color': c['white'],
        'align': 'center', 'valign': 'vcenter'
    })
    fmt_link_active = workbook.add_format({
        'font_name': f, 'font_size': 11, 'bold': True,
        'font_color': c['orange_cta'], 'bg_color': c['white'],
        'align': 'center', 'valign': 'vcenter', 'bottom': 3, 'bottom_color': c['orange_cta']
    })

    tabs = [
        ('Laudo de Crédito',      'C3:D3'),
        ('Educação Financeira',   'E3:F3'),
        ('Fluxo Mensal',          'G3:H3')
    ]

    for name, cell_range in tabs:
        fmt = fmt_link_active if name == active_tab_name else fmt_link_inactive
        start_cell = cell_range.split(':')[0]
        # ✅ FIX #2: formato de HYPERLINK interno compatível com Google Sheets E Excel
        # Google Sheets aceita "#NomeAba.A1"; Excel aceita "#'NomeAba'!A1"
        # Usamos a versão sem aspas simples que funciona nos dois quando o nome não tem espaço especial
        formula = f'=HYPERLINK("#{name}.A1","{name}")'
        worksheet.merge_range(cell_range, '', fmt)
        worksheet.write_formula(start_cell, formula, fmt)

    fmt_cta = workbook.add_format({
        'bg_color': c['dark'], 'font_color': c['white'], 'font_name': f,
        'bold': True, 'align': 'center', 'valign': 'vcenter',
        'border': 1, 'border_color': c['dark'], 'font_size': 11
    })
    worksheet.set_row(3, 35)
    worksheet.merge_range('B4:L4', '', fmt_cta)
    worksheet.write_url('B4', f"https://{CONFIG['company']['website']}", fmt_cta, string='PORTAL MT PARCEIROS')

    worksheet.set_row(1, 10)


def build_global_footer(workbook, worksheet, start_row, formats):
    worksheet.set_row(start_row, 30)
    fmt_footer = workbook.add_format({
        'font_name': CONFIG['fonts']['primary'], 'font_size': 8, 'font_color': CONFIG['colors']['text_gray'],
        'bg_color': CONFIG['colors']['white'], 'align': 'center', 'valign': 'vcenter',
        'top': 1, 'top_color': CONFIG['colors']['border']
    })
    today_str = datetime.today().strftime("%d/%m/%Y")
    worksheet.merge_range(
        f'B{start_row+1}:L{start_row+1}',
        f"🤖 Simulação gerada por Algoritmo de IA MT Parceiros  •  Gerado em {today_str} • © MT Parceiros",
        fmt_footer
    )


def setup_worksheet_layout(worksheet, formats_ref):
    l = CONFIG['layout']
    worksheet.set_column('A:B', l['col_width_spacer'])
    worksheet.set_column('D:D', l['col_width_spacer'])
    worksheet.set_column('F:F', l['col_width_spacer'])
    worksheet.set_column('H:H', l['col_width_spacer'])
    worksheet.set_column('J:J', l['col_width_spacer'])
    worksheet.set_column('L:L', l['col_width_spacer'])
    worksheet.set_column('C:C', 30)
    worksheet.set_column('E:E', 30)
    worksheet.set_column('G:G', 30)
    worksheet.set_column('I:I', 30)
    worksheet.set_column('K:K', 30)
    worksheet.hide_gridlines(2)
    for r in range(0, 150):
        worksheet.set_row(r, l['row_height_default'], formats_ref['bg_default'])


# ==========================================
# 4. LANDING PAGE
# ==========================================
def build_landing_page(workbook, ws_start, formats):
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']

    ws_start.set_row(0, 45)

    fmt_header_logo = workbook.add_format({
        'font_name': f, 'font_size': 32, 'bold': True, 'font_color': c['orange_cta'],
        'align': 'center', 'valign': 'vcenter'
    })
    ws_start.merge_range('C7:K9',  'MT PARCEIROS', fmt_header_logo)
    ws_start.merge_range('C11:K12','BEM-VINDO À SUA ANÁLISE PERSONALIZADA', formats['title'])
    ws_start.merge_range('C13:K13','🤖 Esta ferramenta utiliza Inteligência Artificial para calcular seu potencial de compra imobiliária.', formats['subtitle'])
    ws_start.set_row(13, 25)

    fmt_ia_card = workbook.add_format({
        'bg_color': c['bg_card'], 'border': 2, 'border_color': c['orange_cta'],
        'text_wrap': True, 'valign': 'vcenter', 'align': 'center',
        'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['dark']
    })
    ws_start.merge_range('C15:K17',
        'ESTA ANÁLISE FOI PREPARADA COM TECNOLOGIA MT PARCEIROS\nCálculos baseados nas regras oficiais da CAIXA (2025)',
        fmt_ia_card)

    ws_start.merge_range('C19:K19', 'COMO COMEÇAR:', formats['subtitle'])
    ws_start.merge_range('C20:K20', '1. Digite seu nome abaixo para personalizar o relatório.', formats['label'])
    ws_start.merge_range('C21:K21', '2. Vá para as abas de análise para conferir seu potencial.', formats['label'])
    ws_start.write('C23', 'SEU NOME:', formats['label'])

    fmt_input_start = workbook.add_format({
        'font_name': f, 'font_size': 16, 'bold': True, 'border': 1, 'border_color': c['orange_cta'],
        'bg_color': c['white'], 'font_color': c['dark'], 'locked': False, 'align': 'center', 'valign': 'vcenter'
    })
    ws_start.write(CONFIG['map']['inicio']['nome'], 'Digite seu nome aqui...', fmt_input_start)

    fmt_btn_iniciar = workbook.add_format({
        'bg_color': c['dark'], 'font_color': c['white'], 'font_name': f,
        'font_size': 14, 'bold': True, 'align': 'center', 'valign': 'vcenter',
        'border': 1, 'border_color': c['dark']
    })
    ws_start.set_row(25, 40)
    # ✅ FIX #3: write_url com 'internal:' não funciona no Google Sheets.
    #            Substituído por merge_range + write_formula com HYPERLINK.
    ws_start.merge_range('C26:K27', '', fmt_btn_iniciar)
    ws_start.write_formula('C26', '=HYPERLINK("#Laudo de Crédito.A1","INICIAR SIMULAÇÃO ▶")', fmt_btn_iniciar)

    # --- Formatos dos Cards ---
    fmt_card_orange_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'],      'bg_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['orange_cta']})
    fmt_card_orange_val   = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'],    'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_orange_sub   = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'],                'bg_color': c['bg_card'],    'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border'], 'text_wrap': True})

    fmt_card_blue_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'], 'bg_color': c['dark'],    'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['dark']})
    fmt_card_blue_val   = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['dark'],  'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_blue_sub   = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'],           'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border'], 'text_wrap': True})

    fmt_card_green_title = workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'font_color': c['white'],   'bg_color': c['success'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['success']})
    fmt_card_green_val   = workbook.add_format({'font_name': f, 'font_size': 22, 'bold': True, 'font_color': c['success'], 'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_green_sub   = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'],             'bg_color': c['bg_card'], 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border'], 'text_wrap': True})

    ws_start.set_row(28, 15)
    fmt_aviso = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['dark'], 'align': 'center', 'valign': 'vcenter'})
    ws_start.merge_range('C29:K29', '⚠️ Valores estimados para fins de consultoria. MT Parceiros | (11) 96036-4355', fmt_aviso)

    # ✅ FIX #1: merge_range + write_formula separados corrompem células no Google Sheets.
    #            A fórmula agora é passada DIRETAMENTE no merge_range (terceiro argumento).
    ws_start.merge_range('C34:E34', 'MENSAIS DA ENTRADA', fmt_card_orange_title)
    ws_start.merge_range('C35:E35', "='Educação Financeira'!E33*0.5", fmt_card_orange_val)
    ws_start.merge_range('C36:E36', '36x (Parcelas Fixas)', fmt_card_orange_sub)

    ws_start.merge_range('G34:I34', 'EVOLUÇÃO OBRA', fmt_card_blue_title)
    ws_start.merge_range('G35:I35', "='Educação Financeira'!E33/2", fmt_card_blue_val)
    ws_start.merge_range('G36:I36', 'Média mensal (Obra)', fmt_card_blue_sub)

    ws_start.merge_range('K34:L34', 'PARCELA FINANCIAMENTO', fmt_card_green_title)
    ws_start.merge_range('K35:L35', "='Educação Financeira'!E33", fmt_card_green_val)
    ws_start.merge_range('K36:L36', 'Após entrega (Parcela Base)', fmt_card_green_sub)

    # ✅ FIX #6: set_column com largura 0 em vez de None para ocultar coluna Z corretamente
    ws_start.write(CONFIG['map']['inicio']['d_inicial'], 15000, formats['input_money'])
    ws_start.set_column('Z:Z', 0, None, {'hidden': True})

    ws_start.set_row(39, 30)
    ws_start.merge_range('C40:K40', 'Documentação Necessária',
        workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center'}))
    ws_start.merge_range('C41:K41', 'Separe estes documentos para acelerar sua aprovação com a Caixa:',
        workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': c['text_gray'], 'align': 'center', 'text_wrap': True}))

    fmt_doc_box = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'bg_color': c['white'], 'border': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter', 'text_wrap': True})

    docs = ['1. RG e CPF do Cliente','2. Certidão Estado Civil','3. Comprovante de Renda',
            '4. Comprovante Residência','5. Extrato FGTS Atual','6. Declaração IRPF + Recibo']
    ws_start.merge_range('C43:E44', docs[0], fmt_doc_box)
    ws_start.merge_range('G43:I44', docs[1], fmt_doc_box)
    ws_start.merge_range('K43:L44', docs[2], fmt_doc_box)
    ws_start.merge_range('C46:E47', docs[3], fmt_doc_box)
    ws_start.merge_range('G46:I47', docs[4], fmt_doc_box)
    ws_start.merge_range('K46:L47', docs[5], fmt_doc_box)

    fmt_btn_whats = workbook.add_format({
        'bg_color': '#25D366', 'font_color': c['white'], 'font_name': f,
        'font_size': 14, 'bold': True, 'align': 'center', 'valign': 'vcenter',
        'border': 1, 'border_color': '#25D366'
    })
    ws_start.set_row(48, 40)
    ws_start.merge_range('C49:K50', '', fmt_btn_whats)
    ws_start.write_url('C49',
        "https://wa.me/5511960364355?text=Ol%C3%A1%2C%20quero%20iniciar%20meu%20atendimento",
        fmt_btn_whats, string='💬 Iniciar Atendimento')


# ==========================================
# 5. LAUDO DE CRÉDITO
# ==========================================
def build_laudo_credito(workbook, ws_laudo, formats):
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']

    ws_laudo.set_row(6, 40)
    ws_laudo.write('C6', '📊 ANÁLISE EXECUTIVA (Algoritmo IA)', formats['subtitle'])
    ws_laudo.write('C7', 'Laudo de Crédito', formats['title'])

    fmt_ia_desc = workbook.add_format({'font_name': f, 'font_size': 9, 'italic': True, 'font_color': c['text_gray'], 'text_wrap': True})
    ws_laudo.merge_range('C8:K8',
        'Esta análise foi gerada por algoritmo proprietário MT Parceiros, com base nos parâmetros reais da CAIXA e regras MCMV 2025.',
        fmt_ia_desc)

    ws_laudo.set_row(8, 20)
    ws_laudo.merge_range('C10:F10', 'Status da Análise:', formats['label'])

    # ✅ FIX #7: fórmula de status com aspas escapadas corretamente
    formula_status = ('=IF(\'Educação Financeira\'!E33/\'Educação Financeira\'!E13<=0.30,'
                      '"Aprovação Provável","Risco de Parcelamento")')
    fmt_status = workbook.add_format({
        'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center', 'valign': 'vcenter',
        'border': 2, 'border_color': c['success'], 'bg_color': '#EBFAEB'
    })
    ws_laudo.merge_range('G10:K10', '', fmt_status)
    ws_laudo.write_formula('G10', formula_status, fmt_status)

    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['dark']})
    ws_laudo.write_formula('C11', '="Simulação preparada para: "&\'Educação Financeira\'!C9', fmt_personalized)

    fmt_card_label          = workbook.add_format({'font_name': f, 'font_size': 9,  'font_color': c['text_gray'],   'bg_color': c['bg_card'], 'top': 1, 'right': 1, 'border_color': c['border']})
    fmt_card_value          = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['dark'],       'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_value_highlight= workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['orange_cta'],'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})
    fmt_card_left_normal    = workbook.add_format({'left': 5, 'left_color': c['border'],     'bg_color': c['bg_card'], 'top': 1, 'bottom': 1, 'border_color': c['border']})
    fmt_card_left_highlight = workbook.add_format({'left': 5, 'left_color': c['orange_cta'], 'bg_color': c['bg_card'], 'top': 1, 'bottom': 1, 'border_color': c['border']})

    sim = CONFIG['map']['simulador']
    kpis = [
        (13, 2, 'RENDA FAMILIAR',        f"='Educação Financeira'!${sim['renda']}",    False),
        (17, 2, 'CRÉDITO CAIXA MAX',     f"='Educação Financeira'!${sim['potencial']}", False),
        (21, 2, 'SALDO FGTS',            f"='Educação Financeira'!${sim['fgts']}",      False),
        (13, 6, 'PODER DE COMPRA TOTAL', f"='Educação Financeira'!${sim['poder']}",     True),
        (17, 6, 'PARCELA PROJETADA',     f"='Educação Financeira'!${sim['parcela']}",   True),
        (21, 6, 'HISTÓRICO CARTEIRA TEXT',f"='Educação Financeira'!${sim['carteira']}", True),
    ]

    for row, col, label, formula, is_highlight in kpis:
        ws_laudo.set_row(row,   15)
        ws_laudo.set_row(row+1, 30)
        fmt_left    = fmt_card_left_highlight if is_highlight else fmt_card_left_normal
        display_lbl = label.replace(' TEXT', '')
        ws_laudo.merge_range(row, col-1, row+1, col-1, '', fmt_left)
        ws_laudo.merge_range(row, col,   row,   col+1,  f"  {display_lbl}", fmt_card_label)
        if 'TEXT' in label:
            fmt_txt = workbook.add_format({'font_name': f, 'font_size': 18, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'], 'bottom': 1, 'right': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter'})
            ws_laudo.write_formula(row+1, col, formula, fmt_txt)
        else:
            ws_laudo.write_formula(row+1, col, formula, fmt_card_value_highlight if is_highlight else fmt_card_value)

    ws_laudo.set_row(25, 25)
    ws_laudo.write('C26', '📋 ENQUADRAMENTO E SUBSÍDIOS', formats['subtitle'])

    fmt_faixa_label  = workbook.add_format({'font_name': f, 'font_size': 9,  'bold': True, 'font_color': c['white'],      'bg_color': c['dark'],       'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['dark']})
    fmt_faixa_value  = workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': c['dark'],       'bg_color': c['bg_card'],    'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border']})
    fmt_sub_fed_label= workbook.add_format({'font_name': f, 'font_size': 9,  'bold': True, 'font_color': c['white'],      'bg_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['orange_cta']})
    fmt_sub_fed_value= workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': c['orange_cta'], 'bg_color': c['bg_card'],    'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border']})
    fmt_sub_est_label= workbook.add_format({'font_name': f, 'font_size': 9,  'bold': True, 'font_color': c['white'],      'bg_color': '#2980b9',       'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': '#2980b9'})
    fmt_sub_est_value= workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': '#2980b9',       'bg_color': c['bg_card'],    'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border']})
    fmt_total_label  = workbook.add_format({'font_name': f, 'font_size': 9,  'bold': True, 'font_color': c['white'],      'bg_color': c['success'],    'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': c['success']})
    fmt_total_value  = workbook.add_format({'font_name': f, 'font_size': 14, 'bold': True, 'font_color': c['success'],    'bg_color': c['bg_card'],    'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00'})

    ws_laudo.merge_range('C27:D27', 'FAIXA MCMV', fmt_faixa_label)
    ws_laudo.merge_range('C28:D28',
        '=IF(\'Educação Financeira\'!E13<=2850,"FAIXA 1",IF(\'Educação Financeira\'!E13<=4700,"FAIXA 2",IF(\'Educação Financeira\'!E13<=8000,"FAIXA 3","FORA DO MCMV")))',
        fmt_faixa_value)

    ws_laudo.merge_range('E27:G27', 'SUBSÍDIO FEDERAL', fmt_sub_fed_label)
    ws_laudo.merge_range('E28:G28',
        '=IF(\'Educação Financeira\'!E13<=2850,"R$ 55.000",IF(\'Educação Financeira\'!E13<=4700,"R$ 35.000","Não se aplica"))',
        fmt_sub_fed_value)

    ws_laudo.merge_range('H27:J27', 'CASA PAULISTA (SP)', fmt_sub_est_label)
    ws_laudo.merge_range('H28:J28',
        '=IF(\'Educação Financeira\'!E13<=4863,"✅ R$ 16.000","❌ Não elegível")',
        fmt_sub_est_value)

    ws_laudo.merge_range('K27:L27', 'TOTAL SUBSÍDIOS', fmt_total_label)
    ws_laudo.merge_range('K28:L28',
        '=IF(\'Educação Financeira\'!E13<=2850,55000,IF(\'Educação Financeira\'!E13<=4700,35000,0))+IF(\'Educação Financeira\'!E13<=4863,16000,0)',
        fmt_total_value)

    ws_laudo.merge_range('C30:E30', 'SEU SCORE MT PARCEIROS', formats['subtitle'])

    # ✅ FIX #7: fórmula do score com aspas duplas escapadas corretamente (sem mistura de aspas)
    formula_score = (
        "=MIN(100,"
        "MIN(40,MAX(0,40-(('Educação Financeira'!E33/'Educação Financeira'!E13-0.25)*200)))+"
        "MIN(30,'Educação Financeira'!E24/50000*30)+"
        "IF('Educação Financeira'!E26=\"SIM\",30,10))"
    )
    fmt_score_big = workbook.add_format({
        'font_name': f, 'font_size': 36, 'bold': True,
        'bg_color': c['dark'], 'font_color': c['orange_cta'],
        'align': 'center', 'valign': 'vcenter',
        'border': 2, 'border_color': c['orange_cta']
    })
    ws_laudo.merge_range('C31:E32', '', fmt_score_big)
    ws_laudo.write_formula('C31', formula_score, fmt_score_big)

    ws_laudo.write('G30', 'JORNADA ATUAL:', formats['label'])
    fmt_cycle_base   = workbook.add_format({'font_name': f, 'font_size': 9, 'align': 'center', 'valign': 'vcenter', 'font_color': c['text_gray'], 'bg_color': '#F8FAFC', 'border': 1, 'border_color': '#E2E8F0'})
    fmt_cycle_active = workbook.add_format({'font_name': f, 'font_size': 9, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'font_color': c['white'], 'bg_color': c['orange_cta'], 'border': 1, 'border_color': c['orange_cta']})
    ws_laudo.merge_range('G31:H32', 'Simulação', fmt_cycle_active)
    ws_laudo.merge_range('I31:J32', 'Contrato',  fmt_cycle_base)
    ws_laudo.merge_range('K31:L32', 'Assinatura',fmt_cycle_base)

    ws_laudo.write('C35', '1. ANÁLISE DE COMPOSIÇÃO DE COMPRA', formats['subtitle'])
    ws_laudo.set_row(34, 25)

    ws_laudo.write('C37', 'Financiamento',  formats['bar_label'])
    ws_laudo.write_formula('E37', "='Educação Financeira'!E29",                                         formats['tbl_money'])
    ws_laudo.write_formula('G37', '=IF(E37>0,REPT("█",INT(MIN(20,E37/20000))),"")',                    formats['bar_flat'])

    ws_laudo.write('C39', 'Subsídio Gov.', formats['bar_label'])
    ws_laudo.write_formula('E39', "='Educação Financeira'!E30",                                         formats['tbl_money'])
    ws_laudo.write_formula('G39', '=IF(E39>0,REPT("█",INT(MIN(20,E39/5000))),"")',                     formats['bar_orange'])

    ws_laudo.write('C41', 'FGTS + Próprios', formats['bar_label'])
    ws_laudo.write_formula('E41', "='Educação Financeira'!E24+'Educação Financeira'!E14",               formats['tbl_money'])
    ws_laudo.write_formula('G41', '=IF(E41>0,REPT("█",INT(MIN(20,E41/5000))),"")',                     formats['bar_success'])

    ws_laudo.write('I35', '2. RISCO E SAÚDE FINANCEIRA', formats['subtitle'])
    ws_laudo.write('I37', 'Comprometimento:', formats['bar_label'])
    ws_laudo.write_formula('I36',
        '=IF(IFERROR(\'Educação Financeira\'!E33/\'Educação Financeira\'!E13,0)>0,'
        'REPT("▓",INT(MIN(30,IFERROR(\'Educação Financeira\'!E33/\'Educação Financeira\'!E13,0)*100))),"") ',
        formats['bar_danger'])
    ws_laudo.write('I38', 'Margem de Segurança:', formats['bar_label'])
    ws_laudo.write_formula('I39',
        '=IF(IFERROR(1-\'Educação Financeira\'!E33/\'Educação Financeira\'!E13,0)>0,'
        'REPT("▓",INT(MIN(30,IFERROR(1-\'Educação Financeira\'!E33/\'Educação Financeira\'!E13,0)*100))),"") ',
        formats['bar_success'])


# ==========================================
# 6. EDUCAÇÃO FINANCEIRA (SIMULADOR)
# ==========================================
def build_educacao_financeira(workbook, ws_simul, formats, num_empreendimentos):
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']

    ws_simul.merge_range('C6:K6', '🧠 SIMULADOR INTELIGENTE (Algoritmo Oficial)', formats['subtitle'])
    ws_simul.write('C7', 'Educação Financeira', formats['title'])
    ws_simul.write('C8', 'NOME DO CLIENTE:', formats['label'])

    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['orange_cta']})
    # ✅ FIX #1: merge_range com fórmula diretamente (não write_formula separado)
    ws_simul.merge_range('C9:E9', "='Início'!E23", fmt_personalized)

    fmt_help = workbook.add_format({'font_name': f, 'font_size': 9, 'italic': True, 'font_color': c['text_gray'], 'text_wrap': True})
    ws_simul.merge_range('C10:K11',
        'Nosso algoritmo aplica as regras oficiais da CAIXA para calcular seu crédito máximo e subsídio MCMV.',
        fmt_help)
    ws_simul.set_row(10, 25)

    sim = CONFIG['map']['simulador']

    ws_simul.write('C12', '1. DADOS DE ENTRADA (Sua Renda)', formats['subtitle'])
    ws_simul.write('C13', 'Renda Bruta Familiar:', formats['label'])
    ws_simul.write(sim['renda'], 8000, formats['input_money'])
    ws_simul.write_formula('G13', f'=IF({sim["renda"]}>0,REPT("█",INT(MIN(20,{sim["renda"]}/1000))),"") ', formats['bar_success'])

    ws_simul.write('C14', 'Entrada em dinheiro:', formats['label'])
    ws_simul.write(sim['entrada'], 15000, formats['input_money'])
    ws_simul.write_formula('G14', f'=IF({sim["entrada"]}>0,REPT("█",INT(MIN(20,{sim["entrada"]}/2000))),"") ', formats['bar_flat'])

    ws_simul.write('C15', '2. COMPROMETIMENTO (Despesas)', formats['subtitle'])
    despesas = [('Aluguel Atual', 1200, 17), ('Alimentação', 800, 18), ('Transporte', 400, 19), ('Outros', 0, 20)]
    for label, default, row in despesas:
        ws_simul.write(f'C{row}', label, formats['label'])
        ws_simul.write(f'E{row}', default, formats['input_money'])
        ws_simul.write_formula(f'G{row}', f'=IF(E{row}>0,REPT("█",INT(MIN(20,E{row}/500))),"") ', formats['bar_danger'])

    ws_simul.write('C22', 'TOTAL DESPESAS:', formats['label'])
    ws_simul.write_formula('E22', '=SUM(E17:E21)', formats['kpi_value'])

    ws_simul.write('C24', 'SALDO FGTS:', formats['label'])
    ws_simul.write(sim['fgts'], 30000, formats['input_money'])
    ws_simul.write_formula('G24', f'=IF({sim["fgts"]}>0,REPT("█",INT(MIN(20,{sim["fgts"]}/2000))),"") ', formats['bar_flat'])

    ws_simul.write('C26', 'TEM CARTEIRA (3+ ANOS)?', formats['label'])
    fmt_input_drop = workbook.add_format({
        'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center',
        'border': 1, 'border_color': c['orange_cta'], 'bg_color': '#FFF8F6', 'font_color': c['dark'], 'locked': False
    })
    ws_simul.write(sim['carteira'], 'SIM', fmt_input_drop)
    ws_simul.data_validation(sim['carteira'], {'validate': 'list', 'source': ['SIM', 'NÃO']})

    ws_simul.write('C28', '3. ANÁLISE DO FINANCIAMENTO (MCMV)', formats['subtitle'])

    ws_simul.write('C29', 'Seu Crédito CAIXA (Max):', formats['label'])
    ws_simul.write_formula('E29',
        '=ROUND(MAX(0,(E13*0.30-E22)*IF(E26="SIM",142,132)),0)',
        formats['tbl_money'])

    ws_simul.write('C30', 'Subsídio Federal (MCMV):', formats['label'])
    ws_simul.write_formula('E30',
        '=IF(E13<=2850,55000,IF(E13<=4700,35000,0))',
        formats['tbl_money'])

    ws_simul.write('G29', 'Subsídio Estadual (Casa Paulista):', formats['label'])
    ws_simul.write_formula(sim['subsidio_estadual'],
        '=IF(E13<=4863,16000,0)',
        formats['tbl_money'])

    ws_simul.write('C31', 'PODER DE COMPRA TOTAL:', formats['subtitle'])
    ws_simul.write_formula('E31', '=E29+E30+G30+E24+E14', formats['kpi_value_orange'])

    ws_simul.write('C33', 'PARCELA PROJETADA (Fixa):', formats['label'])
    ws_simul.write_formula('E33', '=MAX(0,(E13*0.30)-E22)', formats['tbl_money'])

    ws_simul.write('C35', '4. ESCOLHA SEU IMÓVEL (Compare Opções)', formats['subtitle'])
    ws_simul.write('C36', 'IMÓVEL SELECIONADO:', formats['label'])
    fmt_gray_card = workbook.add_format({
        'font_name': f, 'font_size': 11, 'bold': True,
        'border': 1, 'border_color': c['orange_cta'], 'locked': False, 'bg_color': c['bg_page'], 'align': 'center'
    })
    ws_simul.merge_range('E36:F36', 'Selecione um Imóvel...', fmt_gray_card)

    # ✅ FIX #6: largura 0 em vez de None para ocultar coluna Z
    ws_simul.set_column('Z:Z', 0, None, {'hidden': True})
    for i in range(num_empreendimentos):
        ws_simul.write_formula(f'Z{i+60}', f"='System Data'!B{i+4}")
    ws_simul.data_validation('E36', {'validate': 'list', 'source': f"=$Z$60:$Z${num_empreendimentos+59}"})

    ws_simul.write('C38', 'VALOR ESTIMADO:', formats['label'])
    # ✅ FIX #5: VLOOKUP com intervalo explícito — tabelas nomeadas com [] não funcionam no Google Sheets
    ws_simul.write_formula('E38',
        "=IFERROR(VLOOKUP(E36,'System Data'!B4:L200,2,FALSE),0)",
        formats['kpi_value_orange'])

    ws_simul.write('C39', 'BAIRRO / LOCAL:', formats['label'])
    fmt_prop_info = workbook.add_format({'font_name': f, 'font_size': 9, 'font_color': c['text_gray'], 'align': 'center', 'valign': 'vcenter'})
    ws_simul.write_formula('E39',
        "=IFERROR(VLOOKUP(E36,'System Data'!B4:L200,5,FALSE),\"---\")",
        fmt_prop_info)

    ws_simul.write('C40', 'VER NO SITE:', formats['label'])
    fmt_prop_link = workbook.add_format({'font_name': f, 'font_size': 10, 'font_color': '#0000EE', 'underline': True, 'align': 'center', 'valign': 'vcenter'})
    ws_simul.write_formula('E40',
        f'=HYPERLINK("https://{CONFIG["company"]["website"]}","🔗 Abrir Imóvel")',
        fmt_prop_link)

    ws_simul.write_formula('Z1', '=E38', formats['tbl_money'])

    ws_simul.write('C42', '5. PLANEJAMENTO DA CONQUISTA (IA Meta)', formats['subtitle'])
    ws_simul.write('C43', 'Diferença para Entrada (Gap):', formats['label'])
    ws_simul.write_formula('E43', '=MAX(0,E38-E31)', formats['tbl_money'])

    ws_simul.write('C44', 'Minha Reserva Mensal (Aporte):', formats['label'])
    ws_simul.write('E44', 500, formats['input_money'])

    ws_simul.write('C45', 'Aporte Sugerido / Recomendado:', formats['label'])
    ws_simul.write_formula('E45',
        '=IF(E43<=0,0,IF(TRIM(Z3)="Obra",E43/MAX(1,Z4),E44))',
        formats['tbl_money'])

    ws_simul.write('C46', 'Evolução de Obra Estimada (Banco):', formats['label'])
    ws_simul.write_formula('E46',
        '=IF(TRIM(Z3)="Obra",E29*0.0002,0)',
        formats['tbl_money'])

    # ✅ FIX #5: VLOOKUP com intervalo explícito (colunas 10 e 11 = Status_Obra e Prazo_Meses)
    ws_simul.write_formula('Z3',
        "=IFERROR(VLOOKUP(E36,'System Data'!B4:L200,10,FALSE),\"Pronto\")",
        formats['tbl_cell'])
    ws_simul.write_formula('Z4',
        "=IFERROR(VLOOKUP(E36,'System Data'!B4:L200,11,FALSE),1)",
        formats['tbl_cell'])

    whatsapp_url = "https://wa.me/5511960364355?text=Ol%C3%A1%2C%20vi%20na%20minha%20simula%C3%A7%C3%A3o%20que%20tenho%20Perfil%20VIP!"

    formula_ia_msg = (
        f'=IF(E13*0.30<=E22,"⚠️ ALERTA: Suas despesas superam sua margem de crédito. Reduza custos ou aumente a renda.",'
        f'IF(E43<=0,HYPERLINK("{whatsapp_url}","✅ PERFIL VIP: Entrada Coberta! Clique para WhatsApp!"),'
        'IF(TRIM(Z3)="Obra","🏗️ PLANTA: Você precisará de R$ "&TEXT(E45,"#,##0")&" /mês para entrada + R$ "&TEXT(E46,"#,##0")&" /mês (Evolução ao Banco).",'
        '"⏳ POUPANÇA: Guardando "&TEXT(E44,"R$ #,##0")&" /mês, em "&IFERROR(INT(E43/MAX(1,E44)),0)&" meses você conquista seu lar!")))'
    )

    fmt_ia_plan = workbook.add_format({
        'font_name': f, 'font_size': 11, 'bold': True,
        'align': 'center', 'valign': 'vcenter', 'text_wrap': True,
        'border': 2, 'border_color': c['orange_cta'], 'bg_color': c['bg_page']
    })
    ws_simul.merge_range('G43:K46', '', fmt_ia_plan)
    ws_simul.write_formula('G43', formula_ia_msg, fmt_ia_plan)


# ==========================================
# 7. FLUXO MENSAL
# ==========================================
def build_fluxo_mensal(workbook, ws_fluxo, formats):
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']

    ws_fluxo.set_column('A:A', 3)
    ws_fluxo.set_column('B:B', 12)
    ws_fluxo.set_column('C:C', 15)
    ws_fluxo.set_column('D:G', 20)
    ws_fluxo.set_column('H:H', 22)

    ws_fluxo.write('C6', '📅 PROJEÇÃO FINANCEIRA REAL E CONTROLE', formats['subtitle'])
    ws_fluxo.write('C7', 'Fluxo Acumulado e Tracker de Aportes', formats['title'])

    fmt_personalized = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'font_color': c['orange_cta']})
    # ✅ FIX #1: fórmula no merge_range diretamente
    ws_fluxo.merge_range('D8:G8', "='Início'!E23", fmt_personalized)

    fmt_dash_title    = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'font_color': c['text_gray'], 'align': 'center'})
    fmt_dash_val_green = workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['success'],    'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['success']})
    fmt_dash_val_orange= workbook.add_format({'font_name': f, 'font_size': 16, 'bold': True, 'font_color': c['orange_cta'], 'align': 'center', 'valign': 'vcenter', 'num_format': 'R$ #,##0.00', 'border': 2, 'border_color': c['orange_cta']})

    ws_fluxo.merge_range('C9:E9',  '💰 TOTAL APORTADO (Real)',    fmt_dash_title)
    ws_fluxo.merge_range('C10:E11','=SUMIF(B16:B200,"Sim",D16:D200)+SUMIF(B16:B200,"Sim",E16:E200)', fmt_dash_val_green)

    ws_fluxo.merge_range('F9:G9',  '⏳ SALDO DEVEDOR (Restante)', fmt_dash_title)
    ws_fluxo.merge_range('F10:G11',"='Educação Financeira'!$Z$1-(SUMIF(B16:B200,\"Sim\",D16:D200)+SUMIF(B16:B200,\"Sim\",E16:E200))", fmt_dash_val_orange)

    fmt_box_help = workbook.add_format({
        'font_name': f, 'font_size': 9, 'italic': True, 'text_wrap': True,
        'bg_color': '#FDFCFB', 'border': 1, 'border_color': c['border'], 'font_color': c['text_gray']
    })
    ws_fluxo.merge_range('C12:G14',
        "💡 COMO FUNCIONA: Marque 'Sim' na coluna 'Pago?' para confirmar aportes. "
        "O Saldo Acumulado considera apenas valores confirmados, ajudando você a manter o foco na meta.",
        fmt_box_help)
    ws_fluxo.set_row(11, 25)
    ws_fluxo.set_row(12, 25)

    headers = ['✅ Pago?','Mês / Ano','Aporte Mensal','Extra (Throughput)','Saldo Acumulado','Referência Meta','Status']
    start_row = 14
    fmt_header_premium = workbook.add_format({
        'font_name': f, 'font_size': 10, 'bg_color': c['dark'], 'font_color': c['white'],
        'bold': True, 'align': 'center', 'valign': 'vcenter'
    })
    for i, h in enumerate(headers):
        ws_fluxo.write(start_row, 1 + i, h, fmt_header_premium)

    fmt_date     = workbook.add_format({'font_name': f, 'font_size': 11, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['border'], 'num_format': 'mmm/yy'})
    fmt_val      = formats['tbl_money']
    fmt_total_col= workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'bg_color': c['bg_card'], 'font_color': c['dark'], 'border': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00', 'align': 'right', 'valign': 'vcenter'})
    fmt_meta_col = workbook.add_format({'font_name': f, 'font_size': 11, 'bold': True, 'font_color': c['text_gray'], 'border': 1, 'border_color': c['border'], 'num_format': 'R$ #,##0.00', 'align': 'right', 'valign': 'vcenter'})
    fmt_checkbox = workbook.add_format({'font_name': f, 'font_size': 12, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['border'], 'bg_color': c['bg_card'], 'locked': False, 'font_color': c['dark']})
    fmt_status_col= workbook.add_format({'font_name': f, 'font_size': 10, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c['border']})

    meses_projecao = 36
    for r in range(meses_projecao):
        row = start_row + 1 + r
        excel_row = row + 1  # 1-indexed para fórmulas

        ws_fluxo.write(row, 1, 'Não', fmt_checkbox)
        ws_fluxo.data_validation(row, 1, row, 1, {'validate': 'list', 'source': ['Sim', 'Não']})
        ws_fluxo.write_formula(row, 2, f'=EDATE(TODAY(),{r})',  fmt_date)
        ws_fluxo.write_formula(row, 3, "='Educação Financeira'!$E$45", fmt_val)
        ws_fluxo.write_formula(row, 4, f'=IF(MONTH(C{excel_row})=12,\'Educação Financeira\'!$E$13*0.5,0)', fmt_val)

        if r == 0:
            formula_acum = f"='Educação Financeira'!$E$24+IF(B{excel_row}=\"Sim\",D{excel_row}+E{excel_row},0)"
        else:
            formula_acum = f"=F{excel_row-1}+IF(B{excel_row}=\"Sim\",D{excel_row}+E{excel_row},0)"
        ws_fluxo.write_formula(row, 5, formula_acum, fmt_total_col)
        ws_fluxo.write_formula(row, 6, "='Educação Financeira'!$Z$1", fmt_meta_col)
        ws_fluxo.write_formula(row, 7, f'=IF(F{excel_row}>=G{excel_row},"✅ ATINGIDA","⏳ EM CURSO")', fmt_status_col)

    ws_fluxo.conditional_format(f'H{start_row+2}:H{start_row+1+meses_projecao}', {
        'type': 'text', 'criteria': 'begins with', 'value': '✅ ATINGIDA',
        'format': workbook.add_format({'font_color': c['success']})
    })
    ws_fluxo.conditional_format(f'H{start_row+2}:H{start_row+1+meses_projecao}', {
        'type': 'text', 'criteria': 'begins with', 'value': '⏳ EM CURSO',
        'format': workbook.add_format({'font_color': c['warning']})
    })
    ws_fluxo.conditional_format(f'B{start_row+2}:B{start_row+1+meses_projecao}', {
        'type': 'cell', 'criteria': '==', 'value': '"Sim"',
        'format': workbook.add_format({'bg_color': c['success'], 'font_color': c['white'], 'bold': True})
    })


# ==========================================
# 8. BI EXPORT
# ==========================================
def build_bi_export(workbook, ws_bi, empreendimentos):
    ws_bi.hide()
    headers = ['Data_Extracao','ID_Simulacao','Cliente_Renda','Cliente_FGTS','Cliente_PoderCompra','Imovel_Nome','VLR_Parcela']
    for col, txt in enumerate(headers):
        ws_bi.write(0, col, txt)
    ws_bi.write_formula(1, 0, '=TODAY()')
    ws_bi.write(1, 1, 'SIM-0001')
    ws_bi.write_formula(1, 2, "='Educação Financeira'!$E$13")
    ws_bi.write_formula(1, 3, "='Educação Financeira'!$E$24")
    ws_bi.write_formula(1, 4, "='Educação Financeira'!$E$31")
    ws_bi.write_formula(1, 5, "='Educação Financeira'!$E$36")
    ws_bi.write_formula(1, 6, "='Educação Financeira'!$E$33")


# ==========================================
# 9. KANBAN
# ==========================================
def build_kanban_sheet(workbook, ws_kanban, formats):
    c = CONFIG['colors']
    f = CONFIG['fonts']['primary']

    ws_kanban.set_tab_color(c['warning'])
    ws_kanban.set_column('A:B', 25)
    ws_kanban.set_column('C:D', 20)
    ws_kanban.set_column('E:E', 30)
    ws_kanban.write('A2', 'GESTÃO DE CLIENTE - BOARD KANBAN', formats['title'])

    headers = ['Tarefa / Documento','Responsável','Concluído?','📅 Prazo','Obs']
    for i, h in enumerate(headers):
        ws_kanban.write(4, i, h, formats['tbl_header'])

    tarefas_base = [
        ['1. RG e CPF do Cliente',      'Cliente',          False],
        ['2. Certidão Estado Civil',     'Cliente',          False],
        ['3. Comprovantes de Renda',     'Cliente',          False],
        ['4. Comprovante Residência',    'Cliente',          False],
        ['5. Extrato FGTS',              'Cliente',          False],
        ['6. Declaração IRPF',           'Cliente',          False],
        ['7. Formulário CAIXA',          'Corretor',         False],
        ['8. Protocolo CEV',             'Correspondente',   False],
    ]

    fmt_celula = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'valign': 'vcenter'})
    fmt_check  = workbook.add_format({'font_name': f, 'font_size': 10, 'border': 1, 'border_color': c['border'], 'align': 'center', 'valign': 'vcenter', 'locked': False})

    for row_idx, tarefa in enumerate(tarefas_base):
        r = row_idx + 5
        ws_kanban.write(r, 0, tarefa[0], fmt_celula)
        ws_kanban.write(r, 1, tarefa[1], fmt_celula)
        ws_kanban.write(r, 2, tarefa[2], fmt_check)
        ws_kanban.write(r, 3, '',        fmt_celula)
        ws_kanban.write(r, 4, '',        fmt_celula)

    ws_kanban.conditional_format(f'C6:C{5+len(tarefas_base)}', {
        'type': 'cell', 'criteria': '==', 'value': True,
        'format': workbook.add_format({'bg_color': c['success'], 'font_color': c['white']})
    })
    ws_kanban.hide()


# ==========================================
# 10. PROTEÇÃO
# ==========================================
def apply_protection(worksheet):
    worksheet.protect('', {
        'objects': True, 'scenarios': True,
        'format_cells': False, 'format_columns': False, 'format_rows': False,
        'insert_columns': False, 'insert_rows': False, 'insert_hyperlinks': False,
        'delete_columns': False, 'delete_rows': False,
        'select_locked_cells': True, 'sort': False,
        'autofilter': True, 'pivot_tables': False, 'select_unlocked_cells': True,
    })


# ==========================================
# MAIN
# ==========================================
def create_excel_template():
    output_path = CONFIG['paths']['output']
    json_path   = CONFIG['paths']['json_data']

    empreendimentos = []
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as fh:
            empreendimentos = json.load(fh)

    workbook = xlsxwriter.Workbook(output_path)
    formats  = setup_workbook(workbook)

    tabs_principais = ['Início', 'Laudo de Crédito', 'Educação Financeira', 'Fluxo Mensal']
    worksheets = {}

    for tab_name in tabs_principais:
        ws = workbook.add_worksheet(tab_name)
        worksheets[tab_name] = ws
        setup_worksheet_layout(ws, formats)
        build_global_navigation(workbook, ws, tab_name, formats)

    ws_data = workbook.add_worksheet('System Data')
    ws_data.hide()
    build_system_data(workbook, ws_data, empreendimentos, formats)

    ws_bi = workbook.add_worksheet('_BI_Export')
    build_bi_export(workbook, ws_bi, empreendimentos)

    for tab_name in tabs_principais:
        ws = worksheets[tab_name]
        if tab_name == 'Início':
            build_landing_page(workbook, ws, formats)
            build_global_footer(workbook, ws, 60, formats)
            apply_protection(ws)
        elif tab_name == 'Laudo de Crédito':
            build_laudo_credito(workbook, ws, formats)
            build_global_footer(workbook, ws, 40, formats)
            apply_protection(ws)
        elif tab_name == 'Educação Financeira':
            build_educacao_financeira(workbook, ws, formats, len(empreendimentos))
            build_global_footer(workbook, ws, 50, formats)
            apply_protection(ws)
        elif tab_name == 'Fluxo Mensal':
            build_fluxo_mensal(workbook, ws, formats)
            build_global_footer(workbook, ws, 65, formats)
            apply_protection(ws)

    ws_kanban = workbook.add_worksheet('Kanban')
    build_kanban_sheet(workbook, ws_kanban, formats)
    apply_protection(ws_kanban)

    try:
        workbook.close()
        print("✅ Template MT Parceiros gerado com sucesso!")
        print(f"   Salvo em: {output_path}")

        docs_path = CONFIG['paths']['docs']
        import shutil
        if os.path.exists(os.path.dirname(docs_path)):
            shutil.copy2(output_path, docs_path)
            print(f"   Sincronizado em: {docs_path}")
        else:
            print(f"   ⚠️  Pasta de destino não encontrada: {docs_path}")
    except Exception as e:
        print(f"❌ Erro ao salvar: {e}")


if __name__ == '__main__':
    create_excel_template()