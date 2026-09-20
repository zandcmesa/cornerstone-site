import base64, json, subprocess, sys, urllib.request

KEY = json.load(open('/Users/mesa/.claude.json'))['mcpServers']['nanobanana']['env']['GEMINI_API_KEY']
MODEL = 'gemini-3-pro-image'
OUT = 'images/sermons'

STYLE = (
  'Bold typographic sermon graphic for a modern church, 16:9. The ONLY text in the image is the title, '
  'rendered exactly, spelled exactly: "{title}". Heavy condensed sans-serif or expressive display lettering, '
  'large, filling most of the frame, stacked on multiple lines, slightly tilted or overlapping for energy. '
  'Background: {mood}. Gritty printed texture, subtle grain, high contrast, cinematic lighting. '
  'Dark-leaning palette that reads well on a near-black website. '
  'No QR codes, no logos, no people, no faces, no extra words, no scripture references, no watermarks.'
)

JOBS = [
  ('1', 'The Dynamite Power You Keep Quenching', 'a smoldering, just-extinguished flame and drifting embers, charcoal black with deep orange and smoke'),
  ('2', 'Known in Heaven, Feared in Hell', 'a split composition, luminous pale gold sky above and deep crimson-black below, dramatic and confrontational'),
  ('3', 'Strengthened in Your Innermost Being', 'deep indigo and teal, a soft glowing core of light at the center like a heartbeat, quiet strength'),
]

def gen(name, title, mood):
  body = {
    'contents': [{'parts': [{'text': STYLE.format(title=title, mood=mood)}]}],
    'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '16:9', 'imageSize': '1K'}},
  }
  req = urllib.request.Request(
    f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}',
    data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
  d = json.load(urllib.request.urlopen(req, timeout=180))
  for p in d['candidates'][0]['content']['parts']:
    if 'inlineData' in p:
      png = f'{OUT}/{name}.png'
      open(png, 'wb').write(base64.b64decode(p['inlineData']['data']))
      subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', png, '--out', f'{OUT}/{name}.jpg'], capture_output=True)
      subprocess.run(['rm', png])
      print('wrote', f'{OUT}/{name}.jpg'); return
  print('no image for', name, json.dumps(d)[:400])

if __name__ == '__main__':
  only = set(sys.argv[1:])
  for name, title, mood in JOBS:
    if not only or name in only:
      gen(name, title, mood)
