"""Собирает русскоязычную витрину из src/pieces в dist."""
import hashlib
import html
import json
import os
from pathlib import Path
import re
import shutil
from tempfile import TemporaryDirectory

from PIL import Image

ROOT = Path(__file__).resolve().parent
SITE = os.environ.get('SITE_URL', 'https://www.roborab.com').rstrip('/')
HOME = SITE + '/'
ROBOTS = (
    '*', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User',
    'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended',
    'CCBot', 'Yandex', 'YandexBot', 'YandexAdditional',
)


def read_piece(name):
    return (ROOT / 'src' / 'pieces' / name).read_text(encoding='utf-8')


def structured_data(title, description, products, faq):
    org = {'@id': HOME + '#org'}
    site = {'@id': HOME + '#site'}
    graph = [
        {'@type': 'Organization', **org, 'name': 'РОБОРАБ', 'url': HOME,
         'logo': HOME + 'assets/appicon.webp', 'description': description,
         'availableLanguage': 'ru'},
        {'@type': 'WebSite', **site, 'name': 'РОБОРАБ', 'url': HOME,
         'inLanguage': 'ru', 'publisher': org},
        {'@type': 'WebPage', '@id': HOME + '#page', 'url': HOME,
         'name': title, 'description': description, 'inLanguage': 'ru',
         'isPartOf': site, 'about': org},
        {'@type': 'Service', 'name': title, 'provider': org, 'inLanguage': 'ru',
         'serviceType': 'Внедрение ИИ-агентов в бизнес-процессы',
         'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': 'Готовые решения',
                             'itemListElement': [
             {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': name,
              'description': tag, 'provider': org}} for name, tag in products
         ]}},
        {'@type': 'FAQPage', 'inLanguage': 'ru', 'mainEntity': [
            {'@type': 'Question', 'name': question,
             'acceptedAnswer': {'@type': 'Answer', 'text': answer}}
            for question, answer in faq
        ]},
    ]
    return json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False)


def build(out):
    head = read_piece('head.html')
    title = html.unescape(re.search(r'<title>(.*?)</title>', head)[1])
    description = html.unescape(re.search(r'<meta name="description" content="([^"]+)"', head)[1])
    body = read_piece('body.html')
    for piece in ('products', 'faq', 'form', 'lb', 'stores'):
        body = body.replace('{{' + piece.upper() + '}}', read_piece(piece + '.html'))
    products = [
        (html.unescape(name), html.unescape(tag))
        for name, tag in re.findall(r'<h3>(.*?)</h3><p class="tag">(.*?)</p>', body, re.S)
    ]
    faq = [
        (html.unescape(question), html.unescape(answer))
        for question, answer in re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', body, re.S)
    ]

    css = '\n'.join(read_piece(name) for name in ('new.css', 'css_dialogs.css', 'css_dl.css', 'css_theme.css'))
    js = '\n'.join(read_piece(name) for name in ('js_dialogs.js', 'new.js'))
    assets = out / 'assets'
    assets.mkdir()
    image_vars = []
    for name in sorted(set(re.findall(r'var\(--img-([a-z0-9-]+)\b', css + body))):
        filename = name + '.webp'
        data = (ROOT / 'assets' / filename).read_bytes()
        (assets / filename).write_bytes(data)
        version = hashlib.sha256(data).hexdigest()[:8]
        image_vars.append(f'  --img-{name}:url(/assets/{filename}?v={version});')
    css = css.replace('{{ASSET_VARS}}', '\n'.join(image_vars))

    og = Image.new('RGB', (1200, 630), '#6a2cf0')
    with Image.open(assets / 'appicon.webp') as icon, Image.open(assets / 'gor.webp') as mascot:
        icon = icon.resize((320, 320), Image.Resampling.LANCZOS)
        mascot.thumbnail((510, 520))
        og.paste(icon, (150, 155))
        og.paste(mascot, (680, 630 - mascot.height), mascot)
    og.save(assets / 'og.jpg', quality=88)

    meta = {
        'og:type': 'website', 'og:site_name': 'РОБОРАБ', 'og:title': title,
        'og:description': description, 'og:url': HOME, 'og:image': HOME + 'assets/og.jpg',
        'og:image:width': '1200', 'og:image:height': '630', 'og:locale': 'ru_RU',
    }
    head += ''.join(f'<meta property="{name}" content="{html.escape(value)}">\n' for name, value in meta.items())
    meta = {
        'twitter:card': 'summary_large_image', 'twitter:title': title,
        'twitter:description': description, 'twitter:image': HOME + 'assets/og.jpg',
        'robots': 'index,follow,max-image-preview:large',
        'yandex-verification': os.environ.get('YANDEX_VERIFICATION'),
        'google-site-verification': os.environ.get('GOOGLE_SITE_VERIFICATION'),
        'msvalidate.01': os.environ.get('MSVALIDATE_01'),
    }
    head += ''.join(f'<meta name="{name}" content="{html.escape(value)}">\n' for name, value in meta.items() if value)
    head += f'<link rel="canonical" href="{html.escape(HOME)}">\n'
    head += '<link rel="icon" type="image/webp" href="/assets/appicon.webp">\n'
    head += '<link rel="apple-touch-icon" href="/assets/appicon.webp">\n'
    schema = structured_data(title, description, products, faq)
    head += f'<script type="application/ld+json">{schema}</script>\n'
    document = (
        '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        f"{head}<script>document.documentElement.classList.add('js')</script>\n"
        f'<style>\n{css}</style>\n</head>\n{body}<script>\n{js}\n</script>\n</body></html>\n'
    )
    (out / 'index.html').write_text(document, encoding='utf-8')
    (out / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'  <url><loc>{html.escape(HOME)}</loc></url>\n</urlset>\n', encoding='utf-8')
    (out / 'robots.txt').write_text(
        ''.join(f'User-agent: {bot}\nAllow: /\nDisallow: /chat.html\n\n' for bot in ROBOTS)
        + f'Sitemap: {HOME}sitemap.xml\n', encoding='utf-8')

    catalog = '\n'.join(f'- {name} — {tag}' for name, tag in products)
    (out / 'llms.txt').write_text(
        f'# РОБОРАБ\n\n> {description}\n\n## Готовые решения\n\n{catalog}\n\n'
        f'## Подробнее\n\n- [Полный текст сайта]({HOME}llms-full.txt)\n', encoding='utf-8')
    text = re.search(r'<main\b.*?</main>', body, re.S)[0]
    text = re.sub(r'</(?:h[1-6]|p|li|div|section|a|button|summary)>', '\n', text)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', text))
    lines = (' '.join(line.split()) for line in text.splitlines())
    (out / 'llms-full.txt').write_text(
        '# РОБОРАБ\n\n' + '\n'.join(line for line in lines if line and line != '×') + '\n',
        encoding='utf-8')


if __name__ == '__main__':
    with TemporaryDirectory(dir=ROOT) as temp:
        output = Path(temp) / 'dist'
        output.mkdir()
        build(output)
        dist = ROOT / 'dist'
        if dist.exists():
            shutil.rmtree(dist)
        output.rename(dist)
