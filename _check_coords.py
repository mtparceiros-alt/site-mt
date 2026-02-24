import json
with open('empreendimentos.json', encoding='utf-8') as f:
    data = json.load(f)
for e in data:
    print(f"{e['nome'][:40]:<40} | {e['endereco'][:40]:<40} | {e['lat']:.5f}, {e['lng']:.5f}")
