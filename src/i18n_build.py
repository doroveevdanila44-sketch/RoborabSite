# -*- coding: utf-8 -*-
import json, importlib.util, pathlib, re
def _load(path, name):
    sp = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
def make(root):
    src = pathlib.Path(root) / 'src'
    en_m = _load(src / 'i18n.en.py', 'i18n_en'); zh_m = _load(src / 'i18n.zh.py', 'i18n_zh')
    keys = list(en_m.EN) + ['Замена сотрудника или функции', 'Способы оплаты', 'и другие', 'МИР']
    EN = dict(en_m.EN); EN['Замена сотрудника или функции'] = 'Employee or function replacement'; EN['Способы оплаты'] = 'Payment methods'; EN['и другие'] = 'and others'; EN['МИР'] = 'MIR'
    D, HT, META, NAMES, SORT = {}, {}, {}, {}, {}
    D['en'] = EN; HT['en'] = {'top': en_m.HTML['top'], 'bot': en_m.HTML['bot']}
    META['en'] = dict(hi='Hello, {n}! I am the ROBORAB AI agent.', hi0='Hello! I am the ROBORAB AI agent.',
        known=' You are interested in the product «{p}». I will ask a few questions to understand your task.',
        unk=' I will ask a few questions to understand what you need.',
        q=['What does your company do?', 'What task or process do you want to automate?', 'How many people will use the tool?', 'Thank you, that is enough for a first understanding. Once the chat is connected, the conversation will continue here.'],
        mp='Hello, I am interested in the details of the product «{p}»', m3='Hello, I want to calculate the cost of replacing an employee or a function in my company')
    NAMES['en'] = 'English (US)'
    D['en-GB'] = {k: v.replace('customizes', 'customises') for k, v in EN.items()}
    HT['en-GB'] = HT['en']; META['en-GB'] = META['en']; NAMES['en-GB'] = 'English (UK)'
    zh = dict(zh_m.ZH); zh['Способы оплаты'] = '支付方式'; zh['и другие'] = '及其他'; zh['МИР'] = 'MIR'; D['zh'] = zh; HT['zh'] = {'top': zh_m.HTML['top'], 'bot': zh_m.HTML['bot']}
    META['zh'] = dict(hi='你好，{n}！我是 ROBORAB AI 助手。', hi0='你好！我是 ROBORAB AI 助手。',
        known='您对产品“{p}”感兴趣。我会问几个问题来了解您的任务。', unk='我会问几个问题来了解您的需求。',
        q=['您的公司是做什么的？', '您想自动化哪项任务或流程？', '有多少人会使用这个工具？', '谢谢，这些已足够初步了解。聊天接入后，对话将在此继续。'],
        mp='您好，我对产品“{p}”的详情感兴趣', m3='您好，我想核算替代公司一名员工或职能的费用')
    NAMES['zh'] = '中文'
    META['ru'] = dict(hi='Здравствуйте, {n}! Я агент РОБОРАБ AI.', hi0='Здравствуйте! Я агент РОБОРАБ AI.',
        known=' Вы интересуетесь продуктом «{p}». Задам несколько вопросов, чтобы понять вашу задачу.',
        unk=' Задам несколько вопросов, чтобы понять, что вам нужно.',
        q=['Чем занимается ваша компания?', 'Какую задачу или процесс вы хотите автоматизировать?', 'Сколько человек будут пользоваться инструментом?', 'Спасибо, этого достаточно для первого понимания. Когда чат будет подключён, здесь продолжится диалог.'],
        mp='Здравствуйте, меня заинтересовали подробности по продукту «{p}»', m3='')
    NAMES['ru'] = 'Русский'; SORT['ru'] = 'Russian'
    for f in sorted((src / 'langs').glob('*.txt')):
        code = f.stem; meta = {}; nums = {}
        for line in f.read_text().split('\n'):
            if line.startswith('@'):
                k, _, v = line[1:].partition(' '); meta[k] = v
            elif re.match(r'^\d+\|', line):
                n, _, v = line.partition('|'); nums[int(n)] = v
        d = {}
        for i, k in enumerate(keys, 1):
            d[k] = nums.get(i, EN[k])
        D[code] = d; HT[code] = {'top': meta['top'], 'bot': meta['bot']}
        META[code] = dict(hi=meta['hi'], hi0=meta['hi0'], known=meta['known'], unk=meta['unk'], q=[meta['q1'], meta['q2'], meta['q3'], meta['q4']], mp=meta['mp'], m3=meta['m3'])
        NAMES[code] = meta['name']; SORT[code] = meta['sort']
    top = ['en', 'en-GB', 'es', 'fr', 'zh']
    rest = sorted([c for c in NAMES if c not in top], key=lambda c: SORT[c])
    order = top + rest
    cfg = dict(order=order, top=len(top), names=NAMES, ru_t={})
    js = (src / 'i18n.src.js').read_text()
    for tag, obj in (('/*D*/{}', D), ('/*HT*/{}', HT), ('/*META*/{}', META), ('/*CFG*/{}', cfg), ('/*EXTRA*/{}', {'title': {'РОБОРАБ': 'ROBORAB', 'РОБОРАБ AI': 'ROBORAB AI'}})):
        js = js.replace(tag, json.dumps(obj, ensure_ascii=False))
    return '<script>\n' + js + '\n</script>'
