# -*- coding: utf-8 -*-
"""Статические страницы для каждого языка (SEO/GEO): запускать после build.py.
dist/index.html -> английская версия, dist/<код>/index.html -> остальные.
Картинки и словарь выносятся во внешние файлы, чтобы страница весила килобайты, а не мегабайты."""
import asyncio, re, json, hashlib, os, pathlib, shutil, html as H
from playwright.async_api import async_playwright
from PIL import Image
root = pathlib.Path(__file__).parent
dist = root / 'dist'
SITE = os.environ.get('SITE_URL', 'https://roborab.vercel.app').rstrip('/')
T_KEY = 'РОБОРАБ: внедрение искусственного интеллекта в бизнес-процессы'
D_KEY = 'РОБОРАБ внедряет ИИ-агентов в бизнес-процессы: фитнес-CRM, налоговый агент, строй-учёт, букинг-CRM, SEO и GEO. Диагностика в чате бесплатна.'
LOCALE = {'en': 'en_US', 'en-GB': 'en_GB', 'ru': 'ru_RU', 'es': 'es_ES', 'fr': 'fr_FR', 'zh': 'zh_CN', 'de': 'de_DE', 'it': 'it_IT', 'pt': 'pt_PT', 'tr': 'tr_TR', 'ja': 'ja_JP', 'ko': 'ko_KR', 'uk': 'uk_UA', 'pl': 'pl_PL', 'nl': 'nl_NL', 'cs': 'cs_CZ', 'sv': 'sv_SE', 'ro': 'ro_RO', 'el': 'el_GR', 'id': 'id_ID', 'vi': 'vi_VN', 'kk': 'kk_KZ', 'hi': 'hi_IN', 'th': 'th_TH', 'ar': 'ar_AR', 'bg': 'bg_BG', 'hr': 'hr_HR', 'sk': 'sk_SK', 'sl': 'sl_SI', 'hu': 'hu_HU', 'fi': 'fi_FI', 'da': 'da_DK', 'nb': 'nb_NO', 'lt': 'lt_LT', 'lv': 'lv_LV', 'et': 'et_EE', 'ca': 'ca_ES', 'af': 'af_ZA', 'ms': 'ms_MY', 'fil': 'fil_PH', 'he': 'he_IL', 'fa': 'fa_IR', 'ur': 'ur_PK', 'bn': 'bn_BD', 'ta': 'ta_IN', 'te': 'te_IN', 'mr': 'mr_IN', 'be': 'be_BY', 'az': 'az_AZ', 'uz': 'uz_UZ', 'ka': 'ka_GE', 'hy': 'hy_AM', 'sr': 'sr_RS', 'sw': 'sw_KE'}
import hashlib
def AV(n): return hashlib.md5(open(pathlib.Path(__file__).parent/'assets'/(n+'.webp'),'rb').read()).hexdigest()[:8]
IMG = ['roborab-en', 'brain', 'c-fit', 'c-tax', 'c-build', 'c-booking', 'c-seo', 'c-frank', 'roborab', 'sofa', 'appicon', 's1', 's2', 's3', 'p1', 'p2', 'p3', 't1', 't2', 't3', 'h1', 'h2', 'h3', 'h4', 'n1', 'n2', 'm1', 'm2', 'm3', 'g1', 'g2', 'g3']
CLEAN = """() => {
  ['html', '.hero', '.hero .ht', '.hero .ht .ml', '.word', '.sofa', '.banner', '.down'].forEach(s => document.querySelectorAll(s).forEach(e => e.removeAttribute('style')));
  document.documentElement.classList.remove('tb');
  var l = document.querySelector('.lang'); if (l) l.remove();
  [...document.querySelectorAll('style')].filter(s => s.textContent.indexOf('.lang{position') >= 0).forEach(s => s.remove());
  var js = [...document.scripts].filter(s => s.textContent.indexOf('window.I18N=') >= 0)[0];
  var code = js ? js.textContent : '';
  if (js) { js.setAttribute('src', '/i18n.js?v=__V__'); js.textContent = ''; }
  return code;
}"""

def slug(cfg, l): return cfg['paths'][l]

_src = (root / 'src' / 'index.src.html').read_text()
PRODUCTS = [(re.search(r'<h3>(.*?)</h3>', sec, re.S).group(1), re.search(r'<p class="tag">(.*?)</p>', sec, re.S).group(1)) for sec in re.findall(r'<section class="product[^"]*" id="[^"]+">.*?(?=<section|</main>)', _src, flags=re.S)]

FAQS = re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', _src, flags=re.S)

def ld(l, cfg, T, Dsc, t):
    url = SITE + slug(cfg, l)
    org = {'@type': 'Organization', '@id': SITE + '/#org', 'name': 'ROBORAB' if l != 'ru' else 'РОБОРАБ', 'url': SITE + '/', 'logo': SITE + '/assets/appicon.webp'}
    site = {'@type': 'WebSite', '@id': SITE + '/#site', 'url': SITE + '/', 'name': 'ROBORAB', 'inLanguage': l, 'publisher': {'@id': SITE + '/#org'}}
    page = {'@type': 'WebPage', '@id': url + '#page', 'url': url, 'name': T, 'description': Dsc, 'inLanguage': l, 'isPartOf': {'@id': SITE + '/#site'}, 'about': {'@id': SITE + '/#org'}}
    svc = {'@type': 'Service', 'name': T, 'provider': {'@id': SITE + '/#org'}, 'serviceType': 'AI agents for business processes', 'inLanguage': l}
    svc['hasOfferCatalog'] = {'@type': 'OfferCatalog', 'name': t('Выбрать готовое решение в каталоге ниже'), 'itemListElement': [
        {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': H.unescape(t(n)), 'description': H.unescape(t(dsc)), 'provider': {'@id': SITE + '/#org'}}} for n, dsc in PRODUCTS]}
    faq = {'@type': 'FAQPage', 'inLanguage': l, 'mainEntity': [{'@type': 'Question', 'name': H.unescape(t(q)), 'acceptedAnswer': {'@type': 'Answer', 'text': H.unescape(t(a))}} for q, a in FAQS]}
    org['description'] = Dsc; org['availableLanguage'] = l
    return json.dumps({'@context': 'https://schema.org', '@graph': [org, site, page, svc, faq]}, ensure_ascii=False)

def head_extra(l, cfg, langs, T, Dsc, t):
    url = SITE + slug(cfg, l)
    alts = ''.join(f'<link rel="alternate" hreflang="{"en-US" if c == "en" else c}" href="{SITE}{slug(cfg, c)}">' for c in langs)
    alts += f'<link rel="alternate" hreflang="x-default" href="{SITE}/">'
    other = ''.join(f'<meta property="og:locale:alternate" content="{LOCALE.get(c, c)}">' for c in langs if c != l)
    return (f'<link rel="canonical" href="{url}">{alts}'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="ROBORAB"><meta property="og:title" content="{H.escape(T)}">'
            f'<meta property="og:description" content="{H.escape(Dsc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}/assets/og.jpg">'
            f'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="{LOCALE.get(l, l)}">{other}'
            f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{H.escape(T)}"><meta name="twitter:description" content="{H.escape(Dsc)}"><meta name="twitter:image" content="{SITE}/assets/og.jpg">'
            f'<meta name="robots" content="index,follow,max-image-preview:large"><link rel="icon" type="image/webp" href="/assets/appicon.webp"><link rel="apple-touch-icon" href="/assets/appicon.webp">'
            f'<link rel="preload" as="image" href="/assets/sofa.webp?v={AV("sofa")}"><link rel="preload" as="image" href="/assets/{"roborab" if l == "ru" else "roborab-en"}.webp?v={AV("roborab" if l == "ru" else "roborab-en")}">'
            f'<script type="application/ld+json">{ld(l, cfg, T, Dsc, t)}</script>')

async def main():
    index_html = (dist / 'index.html').read_text(); chat_html = (dist / 'chat.html').read_text()
    tmp = dist / '_pre_src.html'; tmp.write_text(index_html)
    out_pages = {}; i18n_code = ''
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 1440, 'height': 900})).new_page()
        await pg.goto(tmp.as_uri()); await pg.wait_for_timeout(800)
        cfg = await pg.evaluate('I18N.cfg'); langs = list(dict.fromkeys(cfg['order'] + ['ru']))
        names = cfg['names']
        for l in langs:
            await pg.evaluate(f"I18N.set('{l}',false)"); await pg.wait_for_timeout(250)
            dic = await pg.evaluate(f"I18N.dict('{l}')") if l != 'ru' else {}
            t = (lambda k, d=dic: d.get(k, k)) if l != 'ru' else (lambda k: k)
            T, Dsc = t(T_KEY), t(D_KEY)
            code = await pg.evaluate(CLEAN)
            if code and not i18n_code: i18n_code = code
            out_pages[l] = (await pg.evaluate('document.documentElement.outerHTML'), T, Dsc, t)
        await b.close()
    tmp.unlink()
    v = hashlib.md5(i18n_code.encode()).hexdigest()[:8]
    (dist / 'i18n.js').write_text(i18n_code)
    (dist / 'assets').mkdir(exist_ok=True)
    for n in IMG: shutil.copy(root / 'assets' / f'{n}.webp', dist / 'assets' / f'{n}.webp')
    # og-картинка 1200x630: слово и диван на белом
    og = Image.new('RGB', (1200, 630), 'white'); w = Image.open(root / 'assets' / 'roborab-en.webp').convert('RGB'); s = Image.open(root / 'assets' / 'sofa.webp').convert('RGB')
    w.thumbnail((560, 400)); s.thumbnail((560, 400)); og.paste(w, (30, 115)); og.paste(s, (610, 115)); og.save(dist / 'assets' / 'og.jpg', quality=88)
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for l, (doc, T, Dsc, t) in out_pages.items():
        d = doc
        d = re.sub(r'<meta name="claude:[^>]*>', '', d)
        d = re.sub(r'<html[^>]*>', f'<html lang="{l}" dir="{"rtl" if l in ("ar", "he", "fa", "ur") else "ltr"}" data-pl="{l}">', d, 1)
        d = re.sub(r'<title>.*?</title>', '<title>' + H.escape(T) + '</title>', d, 1, flags=re.S)
        d = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="' + H.escape(Dsc, quote=True) + '">', d, 1)
        d = re.sub(r'--img-([a-z0-9-]+):url\(data:image/webp;base64,[A-Za-z0-9+/=]+\)', lambda m: '--img-%s:url(/assets/%s.webp?v=%s)' % (m.group(1), m.group(1), AV(m.group(1))), d)
        d = d.replace('/i18n.js?v=__V__', f'/i18n.js?v={v}')
        d = d.replace('href="chat.html', 'href="/chat.html').replace('action="chat.html"', 'action="/chat.html"')
        for nm in ('yandex-verification', 'google-site-verification', 'msvalidate.01'):
            val = os.environ.get(nm.upper().replace('-', '_').replace('.', '_'))
            if val: d = d.replace('</head>', f'<meta name="{nm}" content="{H.escape(val)}"></head>', 1)
        d = d.replace('</head>', head_extra(l, cfg, langs, T, Dsc, t) + '</head>', 1)
        d = '<!doctype html>\n' + d
        path = dist / ('index.html' if l == 'en' else slug(cfg, l).strip('/') + '/index.html')
        path.parent.mkdir(parents=True, exist_ok=True); path.write_text(d)
        sitemap.append(f'<url><loc>{SITE}{slug(cfg, l)}</loc>' + ''.join(f'<xhtml:link rel="alternate" hreflang="{"en-US" if c == "en" else c}" href="{SITE}{slug(cfg, c)}"/>' for c in langs) + f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/></url>')
    sitemap.append('</urlset>'); (dist / 'sitemap.xml').write_text('\n'.join(sitemap))
    (dist / 'robots.txt').write_text(''.join(f'User-agent: {b}\nAllow: /\nDisallow: /chat.html\n\n' for b in ['*', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Yandex', 'YandexBot', 'YandexAdditional']) + f'Sitemap: {SITE}/sitemap.xml\n')
    en = out_pages['en']
    llms = [f'# ROBORAB', '', f'> {en[2]}', '', 'ROBORAB deploys AI agents into B2B business processes. The diagnosis in the chat is free; implementation is priced individually.', '', '## Products', '- Fitness CRM: clients, memberships, schedules, trainer payouts', '- Tax agent: group-of-companies taxes, actuals from 1C, forecasts and scenarios', '- Construction accounting: sites, materials and costs', '- Booking CRM: hotel booking requests in one window', '- SEO and GEO: setup, analytics, admin panels', '', '## Languages']
    llms += [f'- [{names[c]}]({SITE}{slug(cfg, c)})' for c in langs]
    (dist / 'llms.txt').write_text('\n'.join(llms) + '\n\n## Full text\n- [llms-full.txt](' + SITE + '/llms-full.txt)\n')
    body = re.search(r'<main.*?</main>', en[0], flags=re.S).group(0)
    body = re.sub(r'<(script|style)\b.*?</\1>', '', body, flags=re.S)
    body = re.sub(r'</(h[1-6]|p|li|div|section|a|button)>', '\\n', body); body = H.unescape(re.sub(r'<[^>]+>', ' ', body))
    body = '\n'.join(x for x in (re.sub(r'[ \t]+', ' ', y).strip() for y in body.split('\n')) if x and x not in ('×', 'Learn more', 'Start', 'Choose a solution ↓') and not x.isdigit())
    (dist / 'llms-full.txt').write_text('# ROBORAB: full page text (English)\n\n' + body + '\n')
    # чат: внешний словарь, без индексации
    c = chat_html
    jsm = [m for m in re.finditer(r'<script>\n\(function\(\)\{\n  var D=', c)]
    if jsm:
        a = jsm[0].start(); e = c.index('</script>', a) + len('</script>')
        c = c[:a] + f'<script src="/i18n.js?v={v}"></script>' + c[e:]
    c = c.replace('</head>', '<meta name="robots" content="noindex"></head>', 1)
    (dist / 'chat.html').write_text(c)
    print('pages', len(out_pages), 'i18n.js', len(i18n_code) // 1024, 'KB', 'index', (dist / 'index.html').stat().st_size // 1024, 'KB', 'chat', len(c) // 1024, 'KB')
asyncio.run(main())
