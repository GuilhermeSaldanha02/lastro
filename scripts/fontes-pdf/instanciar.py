# lastro · gera os cortes ESTÁTICOS que o PDF usa (SDD.md §10.4).
#
#   python scripts/fontes-pdf/instanciar.py <pasta-de-saida>
#   node   scripts/fontes-pdf/embutir.mjs   <pasta-de-saida>
#
# POR QUE ISTO EXISTE. As três famílias do app são VARIÁVEIS e o
# @react-pdf/renderer não interpola eixo: ele abre a instância padrão do
# arquivo e pronto. No caso da Fraunces isso é desastroso — o `wght` dela
# tem default 900 e o `opsz` default 9, então registrar o .ttf variável
# direto renderiza Black em óptica de texto miúdo, nada parecido com a
# tela (medido em 2026-09-03, portão visual do PDF).
#
# A saída é fiel ao que o app resolve em runtime: os eixos vêm de
# `src/app/layout.tsx` (axes declarados) e os pesos de `src/app/tokens.css`
# (--lastro-peso-normal 400, --lastro-peso-medio 500, --lastro-peso-forte
# 600, que é o que `.doc__veredito` usa em sistema.css).
#
# Requer: Python + fontTools (`pip install fonttools`) e rede.
import os
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

DEST = sys.argv[1] if len(sys.argv) > 1 else "scripts/fontes-pdf/saida"
os.makedirs(DEST, exist_ok=True)

BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl/"
FONTES = {
    "fraunces.ttf": BASE + "fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf",
    "archivo.ttf": BASE + "archivo/Archivo%5Bwdth%2Cwght%5D.ttf",
    "bricolage.ttf": BASE + "bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf",
}

# Latin básico + acentuação PT-BR/ES + a pontuação que o parecer usa
# (travessão, aspas curvas, meio-ponto, grau, sinal de menos tipográfico).
UNIS = (
    "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,"
    "U+2018-201E,U+2020-2022,U+2026,U+2030,U+2039-203A,"
    "U+2044,U+2212,U+2013-2014,U+00B7,U+00B0,U+00D7"
)

# (origem, saída, coordenadas). Só 4 cortes: cada um tem consumidor real
# em documento-parecer.tsx. Corte sem consumidor é peso morto no bundle.
CORTES = [
    ("fraunces.ttf", "Fraunces-Veredito.ttf", {"opsz": 48, "wght": 600, "SOFT": 0, "WONK": 1}),
    ("bricolage.ttf", "Bricolage-Normal.ttf", {"opsz": 14, "wdth": 100, "wght": 400}),
    ("archivo.ttf", "Archivo-Medio.ttf", {"wdth": 100, "wght": 500}),
    ("archivo.ttf", "Archivo-Forte.ttf", {"wdth": 100, "wght": 600}),
]


def baixar():
    for nome, url in FONTES.items():
        caminho = os.path.join(DEST, nome)
        if os.path.exists(caminho):
            continue
        print(f"baixando {nome}…")
        urllib.request.urlretrieve(url, caminho)


def cortar():
    for origem, saida, coords in CORTES:
        fonte = TTFont(os.path.join(DEST, origem))
        eixos = {a.axisTag for a in fonte["fvar"].axes}
        usar = {k: v for k, v in coords.items() if k in eixos}
        estatica = instancer.instantiateVariableFont(fonte, usar, inplace=False, optimize=True)

        tmp = os.path.join(DEST, "_tmp.ttf")
        estatica.save(tmp)

        opcoes = subset.Options()
        opcoes.layout_features = ["kern", "liga", "tnum", "onum", "calt", "ccmp"]
        opcoes.notdef_outline = True
        opcoes.recalc_bounds = True
        f2 = subset.load_font(tmp, opcoes)
        s = subset.Subsetter(options=opcoes)
        s.populate(unicodes=subset.parse_unicodes(UNIS))
        s.subset(f2)
        destino = os.path.join(DEST, saida)
        subset.save_font(f2, destino, opcoes)
        f2.close()
        try:
            os.remove(tmp)  # Windows trava o arquivo enquanto houver handle
        except PermissionError:
            pass
        print(f"{saida:26s} {os.path.getsize(destino) // 1024:3d} KB  eixos: {usar}")


baixar()
cortar()
print(f"\npronto. agora: node scripts/fontes-pdf/embutir.mjs {DEST}")
