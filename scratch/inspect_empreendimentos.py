import os
import pandas as pd

path = r'C:\Users\Marcos.PC_M1\Documents\site_mt\Empreendimentos.xlsx'
print('exists', os.path.exists(path))
if os.path.exists(path):
    xl = pd.ExcelFile(path)
    print('sheets', xl.sheet_names)
    for s in xl.sheet_names:
        df = pd.read_excel(path, sheet_name=s)
        print('\nSHEET', s)
        print('rows', len(df), 'cols', len(df.columns))
        print(df.head(10).to_string())
        print('columns', list(df.columns))
