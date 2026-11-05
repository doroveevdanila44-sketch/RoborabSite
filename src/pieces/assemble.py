import os
V=os.path.dirname(os.path.abspath(__file__))+'/'
r=lambda n:open(V+n).read()
head=r('head.html').replace('family=Inter:wght@400;500;600;700;800','family=Manrope:wght@300..800&family=Montserrat:ital,wght@1,800;1,900')
form=r('form.html')
for o in ['<option value="Гибрид">Гибрид</option>','<option value="Бесплатный план">Бесплатный план</option>','<option value="Подписка с бизнес-ментором">Подписка с бизнес-ментором</option>']:
    form=form.replace(o,'')
body=r('body.html').replace('{{PRODUCTS}}',r('products.html')).replace('{{FAQ}}',r('faq.html')).replace('{{FORM}}',form).replace('{{LB}}',r('lb.html')).replace('{{STORES}}',r('stores.html'))
css=r('new.css')+'\n'+r('css_dialogs.css')+'\n'+r('css_dl.css')+'\n'+r('css_theme.css')+'\n'
js=r('js_dialogs.js')+'\n'+r('new.js')
doc=head+"<script>document.documentElement.classList.add('js')</script>\n<style>\n"+css+"</style>\n"+body+"<script>\n"+js+"\n</script>\n"+r('tail.html')
open(V+'../index.src.html','w').write(doc)
