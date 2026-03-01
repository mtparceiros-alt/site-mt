import openpyxl

def gerar_planilha():
    print("Gerando MT_Parceiros_Painel.xlsx...")
    wb = openpyxl.Workbook()

    # Aba 1: IMOVEIS
    ws1 = wb.active
    ws1.title = "IMOVEIS"
    ws1.append(["ID_IMOVEL", "NOME", "STATUS", "ENDERECO", "LATITUDE", "LONGITUDE", "PRECO_BASE", "URL_IMAGEM", "DESCRICAO"])

    # Aba 2: LEADS
    ws2 = wb.create_sheet(title="LEADS")
    ws2.append(["ID_LEAD", "DATA_ENTRADA", "NOME_CLIENTE", "WHATSAPP", "ID_IMOVEL_INTERESSE", "POTENCIAL_COMPRA", "STATUS_VENDA", "ULTIMA_INTERACAO", "DATA_RETORNO"])

    # Aba 3: INTERACOES
    ws3 = wb.create_sheet(title="INTERACOES")
    ws3.append(["ID_INTERACAO", "ID_LEAD", "DATA_HORA", "CANAL", "NOTAS", "RESULTADO"])

    wb.save("MT_Parceiros_Painel.xlsx")
    print("Planilha gerada com sucesso!")

if __name__ == "__main__":
    gerar_planilha()
