import json
import urllib.request
import urllib.parse
from datetime import datetime

# URL do Webhook do Marcos
webhook_url = "https://script.google.com/macros/s/AKfycbzmtDgzbLghMsO0NFMt3CAUDS4lu1E2CjIHibGGSZP_PlWomYcRoYdVE3cIlYxVJDzNlg/exec"

payload = {
    "nome": "TESTE_FINAL_ANTIGRAVITY",
    "whatsapp": "65123456789",
    "email": "sucesso@antigravity.ai",
    "mensagem": "Se você está vendo isso no celular, a automação está 100%!",
    "origem": "Simulador IA (Teste Externo)",
    "idImovel": "",
    "potencialCompra": "R$ 500.000"
}

data = urllib.parse.urlencode(payload).encode('utf-8')
req = urllib.request.Request(webhook_url, data=data, method='POST')

print(f"Enviando teste para: {webhook_url}")

try:
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        print(f"Status: {response.getcode()}")
        print(f"Resposta do Servidor: {result}")
except Exception as e:
    print(f"Erro no teste: {str(e)}")
