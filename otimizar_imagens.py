# ============================================================
#  otimizar_imagens.py — MT Parceiros
#  Comprime e otimiza todas as imagens da pasta imag/
#  - Converte PNG → JPG
#  - Redimensiona para largura máxima de 800px
#  - Comprime JPG com qualidade 82% (ótimo custo-benefício)
#  - Cria backup da pasta original em imag_backup/
# ============================================================
import os
import shutil

try:
    from PIL import Image
except ImportError:
    os.system("pip install Pillow")
    from PIL import Image

PASTA_IMAGENS = "imag"
PASTA_BACKUP  = "imag_backup"
LARGURA_MAX   = 800
QUALIDADE_JPG = 82

def tamanho_legivel(bytes):
    if bytes < 1024:
        return f"{bytes}B"
    elif bytes < 1024 * 1024:
        return f"{bytes/1024:.1f}KB"
    else:
        return f"{bytes/1024/1024:.2f}MB"

def main():
    print("=" * 55)
    print("  MT Parceiros — Otimizador de Imagens v1.0")
    print("=" * 55)

    # Criar backup
    if not os.path.exists(PASTA_BACKUP):
        shutil.copytree(PASTA_IMAGENS, PASTA_BACKUP)
        print(f"\n✅ Backup criado em: {PASTA_BACKUP}/\n")
    else:
        print(f"\n⚠️  Backup já existe em {PASTA_BACKUP}/. Pulando...\n")

    total_antes = 0
    total_depois = 0
    arquivos = sorted(os.listdir(PASTA_IMAGENS))

    for nome_arquivo in arquivos:
        caminho = os.path.join(PASTA_IMAGENS, nome_arquivo)
        if not os.path.isfile(caminho):
            continue

        ext = os.path.splitext(nome_arquivo)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            continue

        tam_antes = os.path.getsize(caminho)
        total_antes += tam_antes

        try:
            img = Image.open(caminho).convert("RGB")

            # Redimensionar se necessário
            if img.width > LARGURA_MAX:
                ratio = LARGURA_MAX / img.width
                nova_altura = int(img.height * ratio)
                img = img.resize((LARGURA_MAX, nova_altura), Image.LANCZOS)

            # Sempre salvar como JPG (converte PNG → JPG)
            nome_sem_ext = os.path.splitext(nome_arquivo)[0]
            novo_nome = nome_sem_ext + ".jpg"
            novo_caminho = os.path.join(PASTA_IMAGENS, novo_nome)

            img.save(novo_caminho, "JPEG", quality=QUALIDADE_JPG, optimize=True)

            # Se era PNG, remova o original
            if ext == '.png' and novo_nome != nome_arquivo:
                os.remove(caminho)

            tam_depois = os.path.getsize(novo_caminho)
            total_depois += tam_depois
            reducao = (1 - tam_depois / tam_antes) * 100

            print(f"  ✅ {nome_arquivo}")
            print(f"     {tamanho_legivel(tam_antes)} → {tamanho_legivel(tam_depois)} (-{reducao:.0f}%)")

        except Exception as e:
            print(f"  ❌ Erro em {nome_arquivo}: {e}")

    reducao_total = (1 - total_depois / total_antes) * 100
    print("\n" + "=" * 55)
    print(f"  📦 Total antes:  {tamanho_legivel(total_antes)}")
    print(f"  📦 Total depois: {tamanho_legivel(total_depois)}")
    print(f"  🚀 Redução:      {reducao_total:.0f}% ({tamanho_legivel(total_antes - total_depois)} economizados)")
    print("=" * 55)
    print(f"\n💡 Backup das originais em: {PASTA_BACKUP}/")
    print("   Rode sync_cms.py para atualizar o site.")

if __name__ == "__main__":
    main()
