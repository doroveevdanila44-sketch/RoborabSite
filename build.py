"""Собирает русскоязычную витрину из src/pieces в dist."""
from base64 import b64encode
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
BRAND = 'РОБОРАБ'
TITLE = 'РОБОРАБ (RoboRab) | Консалтинг и внедрение ИИ для бизнеса и профессий'
DESCRIPTION = (
    'РОБОРАБ (RoboRab) внедряет ИИ в бизнес-процессы и профессии. '
    'Готовые решения, разработка под задачу и бесплатная диагностика в чате.'
)
ABOUT = (
    'РОБОРАБ (RoboRab) внедряет искусственный интеллект в бизнес-процессы и профессии. '
    'Наша команда настраивает готовые решения из каталога и разрабатывает инструменты с нуля под вашу задачу. '
    'Подключаем таблицы, базы данных и 1С. Диагностика в чате бесплатна.'
)
CHAT = 'https://roborabaichat.vercel.app/?lang=ru'
ORG = {'@id': HOME + '#organization'}
WEBSITE = {'@id': HOME + '#website'}


def read_piece(name):
    return (ROOT / 'src' / 'pieces' / name).read_text(encoding='utf-8')


def read_products(markup):
    details = json.loads(read_piece('solutions.json'))
    products = {}
    for key, section in re.findall(r'<section class="product[^"]*" id="([^"]+)">(.*?)</section>', markup, re.S):
        name, tag = re.search(r'<h3>(.*?)</h3><p class="tag">(.*?)</p>', section, re.S).groups()
        features = re.search(r'<ul class="feats[^"]*">(.*?)</ul>', section, re.S)[1]
        status = re.search(r'<span class="product-status">(.*?)</span>', section)
        product = details[key]
        path = '/solutions/' + product['slug']
        products[key] = {
            **product, 'path': path, 'url': SITE + path, 'name': html.unescape(name),
            'tag': html.unescape(tag), 'chat': html.unescape(re.search(r'<a class="btn" href="([^"]+)"', section)[1]),
            'status': html.unescape(status[1]) if status else '',
            'features': [html.unescape(re.sub(r'</?strong>', '', item))
                         for item in re.findall(r'<li>(.*?)</li>', features, re.S)],
        }
    if products.keys() != details.keys():
        raise ValueError('Карточки каталога и данные страниц решений должны совпадать')
    return list(products.values())


def service(product):
    return {'@type': 'Service', '@id': product['url'] + '#service', 'name': product['title'],
            'alternateName': product['name'], 'url': product['url'],
            'description': product['description'], 'provider': ORG}


def schema(title, description, url, products, product=None, faq=()):
    graph = [
        {'@type': 'Organization', **ORG, 'name': BRAND, 'alternateName': 'RoboRab',
         'url': HOME, 'logo': HOME + 'assets/appicon.webp', 'description': ABOUT,
         'contactPoint': {'@type': 'ContactPoint', 'url': CHAT,
                          'contactType': 'Консультация по внедрению', 'availableLanguage': 'ru'}},
        {'@type': 'WebSite', **WEBSITE, 'name': BRAND, 'alternateName': 'RoboRab',
         'url': HOME, 'inLanguage': 'ru', 'publisher': ORG},
    ]
    main_service = service(product) if product else {
        '@type': 'Service', '@id': HOME + '#service', 'name': 'Внедрение ИИ в бизнес-процессы и профессии',
        'serviceType': 'Внедрение ИИ-агентов',
        'url': HOME, 'description': ABOUT, 'provider': ORG,
        'hasOfferCatalog': {
            '@type': 'OfferCatalog', 'name': 'Готовые решения РОБОРАБ',
            'itemListElement': [{'@type': 'Offer', 'itemOffered': service(item)}
                                for item in products if not item['status']],
        },
    }
    page = {'@type': 'WebPage', '@id': url + '#page', 'url': url, 'name': title,
            'description': description, 'inLanguage': 'ru', 'isPartOf': WEBSITE,
            'about': {'@id': main_service['@id']}}
    if not product:
        page['about'] = [ORG, page['about']]
    if product:
        page['mainEntity'] = {'@id': main_service['@id']}
        page['breadcrumb'] = {'@id': url + '#breadcrumbs'}
        graph.append({
            '@type': 'BreadcrumbList', **page['breadcrumb'],
            'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': BRAND, 'item': HOME},
                {'@type': 'ListItem', 'position': 2, 'name': product['title'], 'item': url},
            ],
        })
    elif faq:
        page['@type'] = ['WebPage', 'FAQPage']
        page['mainEntity'] = [
            {'@type': 'Question', 'name': question,
             'acceptedAnswer': {'@type': 'Answer', 'text': answer}}
            for question, answer in faq
        ]
    graph.extend([page, main_service])
    return json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('<', '\\u003c')


def document(title, description, url, structured_data, body, stylesheet, script=None):
    head = read_piece('head.html').replace('{{TITLE}}', html.escape(title)).replace(
        '{{DESCRIPTION}}', html.escape(description))
    og_image = HOME + 'assets/og.jpg'
    properties = {
        'og:type': 'website', 'og:site_name': BRAND, 'og:title': title, 'og:description': description,
        'og:url': url, 'og:image': og_image, 'og:image:width': '1200', 'og:image:height': '630',
        'og:locale': 'ru_RU',
    }
    head += ''.join(f'<meta property="{name}" content="{html.escape(value)}">\n' for name, value in properties.items())
    names = {
        'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description,
        'twitter:image': og_image, 'robots': 'index,follow,max-image-preview:large',
    }
    if url == HOME:
        names.update({
            'yandex-verification': os.environ.get('YANDEX_VERIFICATION'),
            'google-site-verification': os.environ.get('GOOGLE_SITE_VERIFICATION'),
            'msvalidate.01': os.environ.get('MSVALIDATE_01'),
        })
    head += ''.join(f'<meta name="{name}" content="{html.escape(value)}">\n' for name, value in names.items() if value)
    head += f'<link rel="canonical" href="{html.escape(url)}">\n'
    head += '<link rel="icon" type="image/png" sizes="96x96" href="/favicon.png">\n'
    head += '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n'
    head += f'<link rel="stylesheet" href="{stylesheet}">\n'
    head += f'<script type="application/ld+json">{structured_data}</script>\n'
    if script:
        head += f'<script src="{script}" defer></script>\n'
    return (
        '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        f'{head}</head>\n{body}</body></html>\n'
    )


def product_page(product, links):
    p = {key: html.escape(value) for key, value in product.items() if isinstance(value, str)}
    features = '\n'.join(f'        <li>{html.escape(item)}</li>' for item in product['features'])
    badge = f'    <span class="product-status">{p["status"]}</span>\n' if p['status'] else ''
    feature_heading = 'Что планируем' if p['status'] else 'Возможности'
    example_heading = 'Пример работы после запуска' if p['status'] else 'Как это выглядит в работе'
    return f"""<body>
<main class="c solution-page">
  <nav aria-label="Навигация"><a class="lnk" href="/">РОБОРАБ</a> <a class="lnk" href="/#solutions">Все решения</a></nav>
  <article>
{badge}    <h1>{p['title']}</h1>
    <p class="intro-copy">{p['description']}</p>
    <section>
      <h2>Кому подходит</h2>
      <p>{p['audience']}</p>
    </section>
    <section>
      <h2>{feature_heading}</h2>
      <ul>
{features}
      </ul>
    </section>
    <section>
      <h2>{example_heading}</h2>
      <p>{p['example']}</p>
    </section>
    <a class="btn" href="{p['chat']}">Обсудить задачу в чате</a>
  </article>
  <nav class="solution-links" aria-label="Другие решения РОБОРАБ">
    <ul>
{links}
    </ul>
  </nav>
</main>
"""


def solution_links(products):
    return '\n'.join(
        f'            <li><a class="lnk" href="{item["path"]}">{html.escape(item["title"])}</a></li>'
        for item in products
    )


def write_text_exports(out, products, faq):
    catalog = []
    lines = [f'# {BRAND}', f'> {ABOUT}', f'[Официальный сайт]({HOME})', '## Каталог решений']
    for item in products:
        link = f'[{item["title"]}]({item["url"]})'
        if item['status']:
            link += f' ({item["status"]})'
        catalog.append(f'- {link}: {item["tag"]}')
        features = '\n'.join(f'- {feature}' for feature in item['features'])
        lines.extend([
            f'### {link}', item['description'], item['audience'], features, item['example'],
        ])
    (out / 'llms.txt').write_text(
        f'# {BRAND}\n\n> {ABOUT}\n\n## Основное\n\n'
        f'- [Сайт РОБОРАБ]({HOME}): каталог, описание работы и ответы на вопросы.\n'
        f'- [Обзор решений и FAQ]({HOME}llms-full.txt): текстовая версия.\n'
        f'- [Чат для диагностики]({CHAT}): отправить описание задачи.\n'
        '\n## Когда подходит РОБОРАБ\n\n'
        '- Если фитнес-клубу нужно вести клиентов, абонементы и расписание в одной CRM.\n'
        '- Если финансовая команда сравнивает налоговые прогнозы по нескольким юрлицам.\n'
        '- Если компания хочет автоматизировать рабочий процесс или подключить агента к таблицам, базам данных и 1С.\n'
        '\n## Каталог решений\n\n' + '\n'.join(catalog) + '\n', encoding='utf-8')
    lines.append('## Частые вопросы')
    for question, answer in faq:
        lines.extend([f'### {question}', answer])
    lines.append(f'[Обсудить задачу в чате]({CHAT})')
    (out / 'llms-full.txt').write_text('\n\n'.join(lines) + '\n', encoding='utf-8')


def build(out):
    source_assets = ROOT / 'assets'
    assets = out / 'assets'
    assets.mkdir()

    def webp_url(name):
        filename = name + '.webp'
        data = (source_assets / filename).read_bytes()
        (assets / filename).write_bytes(data)
        version = hashlib.sha256(data).hexdigest()[:8]
        return f'/assets/{filename}?v={version}'

    pair_svg = read_piece('industry-pair.svg')
    for key, filename in (('SERVER', 'industry-server.webp'), ('APP_ICON', 'appicon.webp')):
        encoded = b64encode((source_assets / filename).read_bytes()).decode('ascii')
        pair_svg = pair_svg.replace('{{' + key + '}}', 'data:image/webp;base64,' + encoded)
    pair_data = pair_svg.encode('utf-8')
    (assets / 'industry-pair.svg').write_bytes(pair_data)
    pair_version = hashlib.sha256(pair_data).hexdigest()[:8]

    products_markup = read_piece('products.html')
    products = read_products(products_markup)
    faq_markup = read_piece('faq.html').replace('{{ABOUT}}', html.escape(ABOUT))
    faq = [
        (html.unescape(question), html.unescape(answer))
        for question, answer in re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', faq_markup, re.S)
    ]
    body = read_piece('body.html')
    pieces = {
        'PRODUCTS': products_markup, 'FAQ': faq_markup, 'FORM': read_piece('form.html'),
        'LB': read_piece('lb.html'), 'STORES': read_piece('stores.html'),
        'DIAGNOSTIC_PHONE': webp_url('diagnostic-phone'),
        'INDUSTRY_PAIR': f'/assets/industry-pair.svg?v={pair_version}',
    }
    for name, piece in pieces.items():
        body = body.replace('{{' + name + '}}', piece)

    css = '\n'.join(read_piece(name) for name in ('new.css', 'css_dialogs.css', 'css_dl.css', 'css_theme.css'))
    js = '\n'.join(read_piece(name) for name in ('js_dialogs.js', 'new.js'))
    image_vars = []
    for name in sorted(set(re.findall(r'var\(--img-([a-z0-9-]+)\b', css + body))):
        image_vars.append(f'  --img-{name}:url({webp_url(name)});')
    css = css.replace('{{ASSET_VARS}}', '\n'.join(image_vars))

    og = Image.new('RGB', (1200, 630), '#141414')
    with Image.open(assets / 'appicon.webp') as icon:
        icon.resize((96, 96), Image.Resampling.LANCZOS).save(out / 'favicon.png', optimize=True)
        icon.resize((180, 180), Image.Resampling.LANCZOS).save(out / 'apple-touch-icon.png', optimize=True)
        icon.save(out / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
        og.paste(icon.resize((400, 400), Image.Resampling.LANCZOS), (400, 115))
    og.save(assets / 'og.jpg', quality=88)

    (assets / 'site.css').write_text(css, encoding='utf-8')
    (assets / 'site.js').write_text(js, encoding='utf-8')
    css_url = '/assets/site.css?v=' + hashlib.sha256(css.encode()).hexdigest()[:8]
    js_url = '/assets/site.js?v=' + hashlib.sha256(js.encode()).hexdigest()[:8]
    (out / 'index.html').write_text(
        document(TITLE, DESCRIPTION, HOME, schema(TITLE, DESCRIPTION, HOME, products, faq=faq),
                 body, css_url, js_url), encoding='utf-8')

    (out / 'solutions').mkdir()
    for item in products:
        title = f'{item["title"]} — {BRAND}'
        other_links = solution_links(other for other in products if other is not item)
        (out / 'solutions' / (item['slug'] + '.html')).write_text(
            document(title, item['description'], item['url'],
                     schema(title, item['description'], item['url'], products, product=item),
                     product_page(item, other_links), css_url), encoding='utf-8')

    urls = [HOME, *(item['url'] for item in products)]
    urls_xml = ''.join(f'  <url><loc>{html.escape(url)}</loc></url>\n' for url in urls)
    (out / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{urls_xml}</urlset>\n', encoding='utf-8')
    (out / 'robots.txt').write_text(
        f'User-agent: *\nAllow: /\n\nSitemap: {HOME}sitemap.xml\n', encoding='utf-8')
    write_text_exports(out, products, faq)


if __name__ == '__main__':
    with TemporaryDirectory(dir=ROOT) as temp:
        output = Path(temp) / 'dist'
        output.mkdir()
        build(output)
        dist = ROOT / 'dist'
        if dist.exists():
            shutil.rmtree(dist)
        output.rename(dist)
