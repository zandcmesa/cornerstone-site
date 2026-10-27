import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardSpecs, buildBumperArgs, buildAssembleArgs, longDate, leadIn, TIMING } from './sermon-edit.mjs';

test('longDate spells the month out', () => {
  assert.equal(longDate('2026-10-25'), 'October 25, 2026');
  assert.equal(longDate('2027-01-03'), 'January 3, 2027');
});

test('cardSpecs puts series, title and speaker/date on the intro and drops the series line when null', () => {
  const withSeries = cardSpecs({ title: 'Get Out of the Tube', speaker: 'Pastor Josh Eldridge', date: '2026-10-25', series: 'Seek First the Kingdom' });
  assert.deepEqual(withSeries.intro.lines.map(l => l.text), ['SEEK FIRST THE KINGDOM', 'Get Out of the Tube', 'PASTOR JOSH ELDRIDGE   ·   OCTOBER 25, 2026']);
  const noSeries = cardSpecs({ title: 'T', speaker: 'S', date: '2026-10-25', series: null });
  assert.deepEqual(noSeries.intro.lines.map(l => l.text), ['T', 'S   ·   OCTOBER 25, 2026']);
  assert.match(withSeries.outro.lines[0].text, /cornerstonechurchma\.com/);
  assert.match(withSeries.outro.lines[1].text, /SUNDAYS 10:00AM/);
});

test('buildBumperArgs renders finite intro and outro clips from the plate, logo, card and bed', () => {
  const assets = { plate: 'p.mp4', logo: 'l.png', bed: 'b.wav' };
  const intro = buildBumperArgs({ kind: 'intro', output: 'i.mp4', assets, card: 'ci.png' });
  assert.ok(!intro.includes('-stream_loop'));
  assert.deepEqual(intro.slice(3, 7), ['-t', '8', '-i', 'p.mp4']);
  assert.match(intro[intro.indexOf('-filter_complex') + 1], /fade=t=in:st=0:d=1\.2/);
  assert.equal(intro.at(-1), 'i.mp4');
  const outro = buildBumperArgs({ kind: 'outro', output: 'o.mp4', assets, card: 'co.png' });
  assert.deepEqual(outro.slice(3, 9), ['-ss', '2', '-t', '7', '-i', 'p.mp4']);
  assert.match(outro[outro.indexOf('-filter_complex') + 1], /fade=t=out:st=5\.8:d=1\.2/);
});

test('buildAssembleArgs places the crossfades from the sermon length and delays the sermon audio by the lead-in', () => {
  const plan = buildAssembleArgs({ intro: 'i.mp4', input: 'in.mp4', outro: 'o.mp4', output: 'out.mp4', duration: 3116 });
  assert.equal(plan.leadIn, TIMING.intro - TIMING.xfade);
  assert.equal(plan.leadIn, leadIn());
  const filter = plan.args[plan.args.indexOf('-filter_complex') + 1];
  assert.match(filter, /xfade=transition=fade:duration=1:offset=7\[v1\]/);
  assert.match(filter, /xfade=transition=fade:duration=1:offset=3122\[v\]/);
  assert.match(filter, /adelay=7000\|7000\[sa\]/);
  assert.match(filter, /adelay=3122000\|3122000\[oa\]/);
  assert.equal(plan.total, 3122 + TIMING.outro);
  assert.equal(plan.args.at(-1), 'out.mp4');
  assert.ok(plan.args.includes('h264_videotoolbox'));
});
