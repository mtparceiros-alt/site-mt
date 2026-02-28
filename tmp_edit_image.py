from PIL import Image, ImageDraw, ImageFont
import os

def create_header_image():
    base_dir = r"c:\Users\Marcos.PC_M1\Documents\site_mt"
    img_path = os.path.join(base_dir, "Base_Template", "FOTODECAPA.jpg")
    output_path = os.path.join(base_dir, "Base_Template", "FOTODECAPA_HEADER.jpg")
    
    if not os.path.exists(img_path):
        print(f"Erro: {img_path} não encontrado")
        return

    # Info de contato
    contact_text = "📍 mtparceiros@gmail.com   |   📞 (11) 96036-4355   |   🌐 mtparceiros-alt.github.io/site-mt"
    
    # Abrir imagem
    img = Image.open(img_path)
    width, height = img.size
    
    # Criar objeto de desenho
    draw = ImageDraw.Draw(img)
    
    # Tentar carregar uma fonte (Arial ou similar se existir)
    try:
        # No Windows geralmente tem Arial
        font = ImageFont.truetype("arial.ttf", 42) # Aumentado para 42
    except:
        font = ImageFont.load_default()

    # Calcular posição (Top center)
    bbox = draw.textbbox((0, 0), contact_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = 40 # Margem superior maior
    
    # Desenhar uma faixa branca semi-transparente no topo para o "Menu"
    # draw.rectangle([0, 0, width, 120], fill=(255, 255, 255, 200)) 
    
    # Desenhar um retângulo semi-transparente arredondado ou simples por baixo do texto
    # fill=(255, 255, 255, 210) para contraste
    draw.rectangle([0, 0, width, y + text_height + 40], fill=(255, 255, 255, 220))
    
    # Desenhar o texto (Preto/Dark para contraste sobre o branco)
    draw.text((x, y), contact_text, fill=(30, 30, 30), font=font)
    
    # Salvar
    img.save(output_path, quality=98)
    print(f"Salvo: {output_path}")

if __name__ == "__main__":
    create_header_image()
