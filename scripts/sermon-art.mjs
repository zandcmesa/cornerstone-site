import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { generateImage as artlistGenerate } from './artlist.mjs';

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image';

export function buildArtPrompt(title, mood) {
  return 'Bold typographic sermon graphic for a modern church, 16:9. The ONLY text in the image is the title, ' +
    `rendered exactly, spelled exactly: "${title}". Heavy condensed sans-serif or expressive display lettering, ` +
    'large, filling most of the frame, stacked on multiple lines, slightly tilted or overlapping for energy. ' +
    `Background: ${mood}. Gritty printed texture, subtle grain, high contrast, cinematic lighting. ` +
    'Dark-leaning palette that reads well on a near-black website. ' +
    'No QR codes, no logos, no people, no faces, no extra words, no scripture references, no watermarks.';
}

export async function generateArt({ title, mood, outJpg }) {
  if (fs.existsSync(outJpg)) return outJpg;
  const png = outJpg.replace(/\.jpg$/, '.png');
  if (process.env.ARTLIST_REFRESH_TOKEN) {
    await artlistGenerate({ prompt: buildArtPrompt(title, mood), outPng: png });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-q:v', '4', outJpg]);
    fs.unlinkSync(png);
    return outJpg;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('neither ARTLIST_REFRESH_TOKEN nor GEMINI_API_KEY is set');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildArtPrompt(title, mood) }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9', imageSize: '1K' } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const d = await res.json();
  const part = (d.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
  if (!part) throw new Error(`Gemini returned no image: ${JSON.stringify(d).slice(0, 300)}`);
  fs.writeFileSync(png, Buffer.from(part.inlineData.data, 'base64'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-q:v', '4', outJpg]);
  fs.unlinkSync(png);
  return outJpg;
}
