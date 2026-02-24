# ============================================================
#  corrigir_ponto.py — MT Parceiros
#  Utilitário para corrigir coordenadas manualmente no cache.
# ============================================================
import json, os

ARQUIVO_CACHE = "coords_cache.json"

def carregar_cache():
    if os.path.exists(ARQUIVO_CACHE):
        with open(ARQUIVO_CACHE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def salvar_cache(cache):
    with open(ARQUIVO_CACHE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def main():
    cache = carregar_cache()
    
    print("=" * 50)
    print("  MT Parceiros — Corretor de Coordenadas")
    print("=" * 50)
    print("\nInstruções:")
    print("1. Vá ao Google Maps e encontre o local exato.")
    print("2. Clique com o botão direito no local e copie as coordenadas (ex: -23.123, -46.456).")
    print("3. Cole o endereço EXATAMENTE como está no Excel e as coordenadas abaixo.\n")

    endereco = input("Digite o ENDEREÇO (exatamente como no Excel): ").strip()
    if not endereco: return

    coords_str = input("Cole as COORDENADAS (Lat, Lng): ").strip()
    try:
        lat_str, lng_str = coords_str.replace(" ", "").split(",")
        lat = float(lat_str)
        lng = float(lng_str)
        
        cache[endereco] = {"lat": lat, "lng": lng}
        salvar_cache(cache)
        
        print(f"\n✅ Sucesso! O endereço '{endereco}' foi fixado em {lat}, {lng}.")
        print("Agora, basta rodar o 'sync_cms.py' para atualizar o site.")
        
    except Exception as e:
        print(f"\n❌ Erro no formato das coordenadas. Use o formato: -23.55, -46.63")

if __name__ == "__main__":
    main()
