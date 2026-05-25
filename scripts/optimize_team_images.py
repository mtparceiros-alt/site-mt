import os
from PIL import Image

def optimize_images():
    base_dir = r"c:\Users\Marcos.PC_M1\Documents\site_mt\assets\images\equipe"
    files = [f for f in os.listdir(base_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    print(f"Encontrados {len(files)} arquivos para otimização.")
    
    for filename in files:
        filepath = os.path.join(base_dir, filename)
        new_filename = os.path.splitext(filename)[0] + ".webp"
        new_filepath = os.path.join(base_dir, new_filename)
        
        try:
            with Image.open(filepath) as img:
                print(f"Processando {filename} (tamanho original: {img.size})...")
                
                # Redimensionar se for muito grande (max 1000px)
                max_size = 1000
                if max(img.size) > max_size:
                    ratio = max_size / max(img.size)
                    new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                    print(f"  -> Redimensionado para {new_size}")
                
                # Salvar como webp
                img.save(new_filepath, "WEBP", quality=80)
                
                old_size = os.path.getsize(filepath) / 1024
                new_size_kb = os.path.getsize(new_filepath) / 1024
                print(f"  -> Salvo como {new_filename} ({old_size:.1f}KB -> {new_size_kb:.1f}KB)")
                
        except Exception as e:
            print(f"Erro ao processar {filename}: {e}")

if __name__ == "__main__":
    optimize_images()
