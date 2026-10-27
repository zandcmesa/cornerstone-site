import fs from 'node:fs';
import { parseRecutComment } from './sermon-lib.mjs';

const r = parseRecutComment(process.env.COMMENT_BODY || '', process.env.PR_TITLE || '');
const lines = r.error ? `error=${r.error}\n` : `date=${r.date}\nstart=${r.start}\nend=${r.end}\n`;
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, lines);
else process.stdout.write(lines);
