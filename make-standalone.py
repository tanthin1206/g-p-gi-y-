"""Bundle the photo-free workshop into one offline HTML file."""
from pathlib import Path
import base64
import re
project=Path(__file__).resolve().parent
dist=project/'dist'
html=(dist/'index.html').read_text(encoding='utf-8')
css_names=('style.css','workshop.css','viewport.css','home.css')
css='\n'.join((dist/name).read_text(encoding='utf-8') for name in css_names)
css=re.sub(r'@import\s+url\([^;]+;','',css)
css=css.replace("'Be Vietnam Pro',sans-serif", "'Be Vietnam Pro','Segoe UI',Arial,sans-serif")
links=''.join(f'<link rel="stylesheet" href="{name}">' for name in css_names)
html=html.replace(links,'<style>\n'+css+'\n</style>')
bootstrap='function saveProgress(key,value){try{localStorage.setItem(key,value)}catch{}}\n'
js_names=('app.js','workshop.js','folding.js','paper3d.js','viewport.js','home.js','tangram-model.js','tangram-engine.js','boat-lesson.js','session-state.js','music.js')
code='\n'.join((dist/name).read_text(encoding='utf-8') for name in js_names)
code=bootstrap+code.replace('localStorage.setItem(','saveProgress(')
assert '</script' not in code.lower()
scripts=''.join(f'<script src="{name}"></script>' for name in js_names)
html=html.replace(scripts,'<script>\n'+code+'\n</script>')
for page in (113,114,115):
    filename=f'assets/thumbnails/activity-{page}.png'
    data=base64.b64encode((dist/filename).read_bytes()).decode('ascii')
    html=html.replace(f'src="{filename}"',f'src="data:image/png;base64,{data}"')
audio_data=base64.b64encode((dist/'assets/audio/background.mp3').read_bytes()).decode('ascii')
html=html.replace('assets/audio/background.mp3','data:audio/mpeg;base64,'+audio_data)
assert not re.search(r'<script[^>]+src=|<link[^>]+stylesheet|assets/page-|assets/thumbnails/|fonts.googleapis|data:image/jpeg|BOOK_ASSETS',html)
assert html.count('data:image/png;base64,')==3
output=project/'Bai-28-Tao-hinh.html'
output.write_text(html,encoding='utf-8')
(project/'index.html').write_text(html,encoding='utf-8')
print(f'{output.name}\n{output.stat().st_size:,} bytes; 3 cartoon thumbnails embedded; no textbook photos.')
