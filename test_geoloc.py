from sync_cms import consultar_viacep, geocodificar_nominatim
import time

# Endereço de teste com CEP
endereco = "Avenida Itaberaba, 1234"
bairro = "Freguesia do Ó"
cep = "02734-000"

print("=" * 50)
print("  MT Parceiros — TESTE DE GEOLOCALIZAÇÃO")
print("=" * 50)

print(f"\n1. Testando ViaCEP para: {cep}")
cep_info = consultar_viacep(cep)
if cep_info:
    print(f"   ✅ Sucesso: {cep_info['logradouro']}, {cep_info['bairro']}")
else:
    print("   ❌ Falha ao consultar CEP")

print(f"\n2. Testando Nominatim com dados estruturados do CEP...")
lat, lng, tipo = geocodificar_nominatim(endereco, bairro, cep_info)

if lat:
    print(f"\n✅ RESULTADO FINAL:")
    print(f"   Tipo: {tipo}")
    print(f"   Coordenadas: {lat}, {lng}")
    print(f"   Link: https://www.google.com/maps?q={lat},{lng}")
else:
    print("\n❌ Falha na geocodificação.")
