import json
import urllib.request
import urllib.parse
from datetime import datetime

appId = "MT_Parceiros_Painel-648008619"
accessKey = "V2-FFYvs-GBkzF-I59pp-D2xku-AXrF3-jZI3L-mVNW3-UdKGo"
url = f"https://www.appsheet.com/api/v2/apps/{appId}/tables/LEADS/Action"

payload = {
    "Action": "Add",
    "Properties": { "Locale": "pt-BR", "Timezone": "E. South America Standard Time" },
    "Rows": [{
        "ID_LEAD": f"L-{int(datetime.now().timestamp() * 1000)}",
        "DATA_ENTRADA": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "NOME_CLIENTE": "Teste Data Formato BR com Potencial Zero",
        "WHATSAPP": "65999999999",
        "STATUS_VENDA": "Novo",
        "ULTIMA_INTERACAO": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "OBSERVACOES": "Origem: Terminal",
        "POTENCIAL_COMPRA": 0 
    }]
}

headers = {
    "ApplicationAccessKey": accessKey,
    "Content-Type": "application/json"
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        print(f"Status Coode: {response.getcode()}")
        print(f"Response: {result}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {str(e)}")
