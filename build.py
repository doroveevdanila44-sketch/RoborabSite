import base64, pathlib
root = pathlib.Path(__file__).parent
a = root / 'assets'
def b64(p, mime): return f"data:{mime};base64," + base64.b64encode((a / p).read_bytes()).decode()
names = ['roborab-en', 'brain', 'c-fit', 'c-tax', 'c-build', 'c-booking', 'c-seo', 'roborab', 'sofa', 'appicon', 's1', 's2', 's3', 'p1', 'p2', 'p3', 't1', 't2', 't3', 'h1', 'h2', 'h3', 'h4', 'n1', 'n2', 'm1', 'm2', 'm3', 'g1', 'g2', 'g3']
vars_ = "\n".join(f"  --img-{n}:url({b64(n + '.webp', 'image/webp')});" for n in names)
src = (root / 'src' / 'index.src.html').read_text()
import sys; sys.path.insert(0, str(root / 'src')); import i18n_build
I18N = i18n_build.make(root)
src = src.replace('{{ASSET_VARS}}', vars_).replace('{{I18N}}', I18N)
out = root / 'dist'; out.mkdir(exist_ok=True)
# полноценный документ: без doctype и viewport телефон открывает десктопную раскладку
HEAD = '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
(out / 'index.html').write_text(HEAD + src + '\n</html>\n')
print(len(src) / 1e6, 'MB')

import base64
icon='data:image/webp;base64,'+base64.b64encode((root/'assets'/'appicon.webp').read_bytes()).decode()
(out/'chat.html').write_text((root/'src'/'chat.src.html').read_text().replace('{{ICON}}',icon).replace('{{I18N}}',I18N))
