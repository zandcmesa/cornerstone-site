import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadEventsJs() {
  const src = fs.readFileSync(new URL('../js/events.js', import.meta.url), 'utf8');
  const window = {};
  const document = { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} };
  vm.runInNewContext(src, { window, document, console });
  return window.PCO_UI;
}

test('linkify escapes html and turns bare urls into links', () => {
  const ui = loadEventsJs();
  const out = ui.linkify('Tickets: https://events.humanitix.com/a-night?h=abc&t=1 <script>alert(1)</script>');
  assert.ok(!out.includes('<script>'), 'script tag escaped');
  assert.ok(out.includes('&lt;script&gt;'));
  assert.ok(out.includes('<a href="https://events.humanitix.com/a-night?h=abc&amp;t=1" target="_blank" rel="noopener">'));
});

test('paragraphs splits on blank lines and keeps single line breaks', () => {
  const ui = loadEventsJs();
  assert.equal(ui.paragraphs('One\ntwo\n\nThree'), '<p>One<br>two</p><p>Three</p>');
  assert.equal(ui.paragraphs(''), '');
});
