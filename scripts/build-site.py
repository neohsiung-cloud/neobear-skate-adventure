from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'_site'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
for name in ['index.html','style.css','game.js','model.js','multi-skin.js','rounded-box.js','skateboard.js','stance.js','music.js','celebration.js','ASSETS.json']:
 shutil.copy2(ROOT/name,OUT/name)
for name in ['assets','vendor']:shutil.copytree(ROOT/name,OUT/name)
(OUT/'.nojekyll').touch()
print('Static game built:',sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file()),'bytes')
