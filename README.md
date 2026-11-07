# РОБОРАБ

Русскоязычная витрина [roborab.com](https://roborab.com/). Форма и кнопки ведут в [РОБОРАБ AI](https://roborabaichat.vercel.app/).

- `src/pieces/` — разметка, стили и скрипты актуальной витрины.
- `assets/` — исходные изображения, `design/` — дизайн-система.
- `dist/` — статические файлы, которые Vercel публикует из `main`.

После изменения исходников пересоберите и закоммитьте `dist/` вместе с ними. Для сборки нужны Python 3 и Pillow.

```sh
python3 -m pip install Pillow
sh make.sh
python3 -m http.server --directory dist 8000
```

Старые языковые адреса, включая `/ru/`, перенаправляют на главную в Vercel.
