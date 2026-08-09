from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
MEDIA_ROOT = ROOT / "assets" / "media"
OUT = ROOT / "data" / "media.js"
VALID = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".webm"}

items=[]
for path in MEDIA_ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in VALID:
        continue
    rel=path.relative_to(ROOT).as_posix()
    name=path.name
    m=re.match(r"(?P<y>\d{4})_(?P<m>\d{1,2})_(?P<d>\d{1,3})", name)
    if m:
        y=int(m.group('y')); mo=int(m.group('m')); d=int(m.group('d'))
        if d>31: d=int(str(d).lstrip('0') or '0')
        date=f"{d:02d}/{mo:02d}/{y}"
        sort=f"{y:04d}-{mo:02d}-{d:02d}-{name}"
    else:
        y=mo=d=None; date="Tương lai"; sort="9999-"+name
    kind="video" if path.suffix.lower() in {".mp4",".mov",".webm"} else "image"
    items.append({"src":rel,"filename":name,"type":kind,"year":y,"month":mo,"day":d,"date":date,"sort":sort})
items.sort(key=lambda x:x['sort'])
OUT.write_text("// AUTO-GENERATED FILE.\n// Run: python tools/build-media-manifest.py\n\nwindow.MEDIA_LIBRARY = "+json.dumps(items,ensure_ascii=False,indent=2)+";\n",encoding="utf-8")
print(f"Generated {OUT} with {len(items)} media files.")
