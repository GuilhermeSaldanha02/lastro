import os
import glob
from PIL import Image

brain_dir = r"C:\Users\danin\.gemini\antigravity-ide\brain\f3fc4171-c774-433d-b8db-e2371c070c79"
finais_dir = r"C:\Users\danin\Downloads\gerados_ate_agora\poses-finais"
iniciais_dir = r"C:\Users\danin\Downloads\gerados_ate_agora\poses-iniciais"
out_gifs_dir = r"C:\Users\danin\Downloads\gerados_ate_agora\gifs_gerados"

os.makedirs(finais_dir, exist_ok=True)
os.makedirs(out_gifs_dir, exist_ok=True)

mappings = {
    "belt_squat_end": "belt-squat-end.png",
    "cadeira_flexora_end": "cadeira-flexora-sentada-end.png",
    "cadeira_unilateral_end": "cadeira-flexora-unilateral-end.png",
    "flexora_cabo_end": "flexora-unilateral-cabo-end.png",
    "leg_press_uni_end": "leg-press-unilateral-end.png",
    "panturrilha_pe_end": "panturrilha-em-pe-end.png"
}

print("=== 1. CONVERTENDO E SALVANDO AS 6 NOVAS POSES FINAIS ===")
for prefix, target_name in mappings.items():
    matches = glob.glob(os.path.join(brain_dir, f"{prefix}*.jpg")) + glob.glob(os.path.join(brain_dir, f"{prefix}*.png"))
    if matches:
        # Pega o arquivo mais recente gerado
        latest = max(matches, key=os.path.getmtime)
        img = Image.open(latest).convert("RGB")
        
        target_finais = os.path.join(finais_dir, target_name)
        target_iniciais = os.path.join(iniciais_dir, target_name)
        
        img.save(target_finais, "PNG", optimize=True)
        img.save(target_iniciais, "PNG", optimize=True)
        print(f"[OK] Salvo {target_name} a partir de {os.path.basename(latest)}")
    else:
        print(f"[ERRO] Nao encontrado arquivo para {prefix}")

print("\n=== 2. COMPILANDO TODOS OS 13 GIFS ANIMADOS ===")

todos_exercicios = [
    "belt-squat",
    "cadeira-flexora-sentada",
    "cadeira-flexora-unilateral",
    "crossover-cabo",
    "elevacao-pelvica-unilateral",
    "face-pull-cabo",
    "flexora-unilateral-cabo",
    "leg-press-horizontal",
    "leg-press-unilateral",
    "panturrilha-em-pe",
    "remada-unilateral-halter",
    "rotacao-tronco-maquina",
    "supino-reto-maquina"
]

def to_white_bg(im):
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        alpha = im.convert('RGBA')
        bg = Image.new("RGBA", alpha.size, (255, 255, 255, 255))
        bg.paste(alpha, mask=alpha)
        return bg.convert("RGB")
    return im.convert("RGB")

for name in todos_exercicios:
    p_start = os.path.join(iniciais_dir, f"{name}.png")
    p_end = os.path.join(finais_dir, f"{name}-end.png")
    
    if os.path.exists(p_start) and os.path.exists(p_end):
        img_start = to_white_bg(Image.open(p_start))
        img_end = to_white_bg(Image.open(p_end))
        
        # Redimensionar se necessário para consistência (1024x1024)
        if img_end.size != img_start.size:
            img_end = img_end.resize(img_start.size, Image.Resampling.LANCZOS)
            
        out_gif = os.path.join(out_gifs_dir, f"{name}.gif")
        
        # Gera GIF fluido em loop (700ms por pose)
        img_start.save(
            out_gif,
            save_all=True,
            append_images=[img_end],
            duration=700,
            loop=0,
            optimize=True
        )
        print(f"[GIF OK] {name}.gif ({os.path.getsize(out_gif)} bytes)")
    else:
        print(f"[GIF FALHA] Nao encontrado: {name}")

print("\n=== CONCLUIDO COM SUCESSO ===")
