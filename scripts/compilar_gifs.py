import os
import sys
from PIL import Image

src_iniciais = r"C:\Users\danin\Downloads\gerados_ate_agora\poses-iniciais"
src_finais = r"C:\Users\danin\Downloads\gerados_ate_agora\poses-finais"
out_dir = r"C:\Users\danin\Downloads\gerados_ate_agora\gifs_gerados"

os.makedirs(out_dir, exist_ok=True)

exercicios = [
    "crossover-cabo",
    "elevacao-pelvica-unilateral",
    "face-pull-cabo",
    "leg-press-horizontal",
    "remada-unilateral-halter",
    "rotacao-tronco-maquina",
    "supino-reto-maquina"
]

print("--- COMPILANDO GIFS DISPONIVEIS ---")
for name in exercicios:
    p_start = os.path.join(src_iniciais, f"{name}.png")
    p_end = os.path.join(src_finais, f"{name}-end.png")
    
    if os.path.exists(p_start) and os.path.exists(p_end):
        img_start = Image.open(p_start)
        img_end = Image.open(p_end)
        
        def to_white_bg_rgb(im):
            if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                alpha = im.convert('RGBA')
                bg = Image.new("RGBA", alpha.size, (255, 255, 255, 255))
                bg.paste(alpha, mask=alpha)
                return bg.convert("RGB")
            return im.convert("RGB")

        f1 = to_white_bg_rgb(img_start)
        f2 = to_white_bg_rgb(img_end)
        
        out_path = os.path.join(out_dir, f"{name}.gif")
        
        f1.save(
            out_path,
            save_all=True,
            append_images=[f2],
            duration=650,
            loop=0,
            optimize=True
        )
        print(f"[OK] Gerado com sucesso: {name}.gif ({os.path.getsize(out_path)} bytes)")
    else:
        print(f"[ERRO] Nao encontrado par para: {name}")

print("--- FIM DO PROCESSAMENTO ---")
