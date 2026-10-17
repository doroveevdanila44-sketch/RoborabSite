import base64, pathlib
root = pathlib.Path(__file__).parent
a = root / 'assets'
def b64(p, mime): return f"data:{mime};base64," + base64.b64encode((a / p).read_bytes()).decode()
names = ['c-fit', 'c-tax', 'c-build', 'c-booking', 'c-seo', 'phone-human', 'phone-pink', 'roborab', 'sofa', 'm-phone-human', 'm-phone-pink', 'appicon']
vars_ = "\n".join(f"  --img-{n}:url({b64(n + '.webp', 'image/webp')});" for n in names)
src = (root / 'src' / 'index.src.html').read_text()
src = src.replace('{{ASSET_VARS}}', vars_)
src = src.replace('{{VIDEO_CALL}}', b64('call.mp4', 'video/mp4')).replace('{{VIDEO_AVATARS}}', b64('avatars.mp4', 'video/mp4'))
out = root / 'dist'; out.mkdir(exist_ok=True)
# полноценный документ: без doctype и viewport телефон открывает десктопную раскладку
HEAD = '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
(out / 'index.html').write_text(HEAD + src + '\n</html>\n')
print(len(src) / 1e6, 'MB')

import base64
icon='data:image/webp;base64,'+base64.b64encode((root/'assets'/'appicon.webp').read_bytes()).decode()
(out/'chat.html').write_text((root/'src'/'chat.src.html').read_text().replace('{{ICON}}',icon))
