import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5-5';

export const METADATA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'speaker', 'series', 'scripture', 'scriptureBook', 'topics', 'description', 'artMood'],
  properties: {
    title: { type: 'string', description: 'Sermon title, 3–8 words, title case. Use the preacher\'s own title if stated, otherwise write one that captures the central idea.' },
    speaker: { type: 'string', description: 'Full name with title as the church uses it, e.g. "Pastor Josh Eldridge", "Pastor Christine Disibio", or a guest such as "Dr. Lynn Lucas".' },
    series: { type: ['string', 'null'], description: 'Series name only if the preacher explicitly names an ongoing series; otherwise null.' },
    scripture: { type: 'string', description: 'Primary passage(s), e.g. "Ephesians 3:14–21" or "Acts 8:4-8; John 4". Empty string if none.' },
    scriptureBook: { type: 'string', description: 'Book of the primary passage, e.g. "Ephesians". Empty string if none.' },
    topics: { type: 'array', items: { type: 'string' }, description: '3 to 4 short Title Case topic tags.' },
    description: { type: 'string', description: '1–3 sentences, third person, present tense, in the voice of the existing entries.' },
    artMood: { type: 'string', description: 'One clause describing a background scene and palette for a typographic graphic, no people, no text, e.g. "a smoldering, just-extinguished flame and drifting embers, charcoal black with deep orange and smoke".' },
  },
};

export const BOUNDS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['start', 'end', 'confidence', 'note'],
  properties: {
    start: { type: 'integer', description: 'Seconds into the recording where the preacher begins the sermon.' },
    end: { type: 'integer', description: 'Seconds into the recording where the sermon ends.' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    note: { type: 'string', description: 'One sentence on what marks the start and end.' },
  },
};

export function buildMetadataPrompt(transcript, { date, knownSeries = [], knownSpeakers = [], examples = [] }) {
  const system = [
    'You catalog Sunday sermons for Cornerstone Church (East Longmeadow, MA, a Foursquare church) from auto-generated captions. Captions contain misheard words; infer names and scripture references from context.',
    '',
    `Known speakers: ${knownSpeakers.join('; ')}. Pastor Josh Eldridge is the lead pastor and preaches most weeks. If the transcript introduces a guest by name, use that name with the title the host uses.`,
    `Known series names (reuse exactly if the preacher refers to one): ${knownSeries.join('; ')}. Only assign a series when the preacher explicitly names one; otherwise null.`,
    '',
    'Match the house style of these existing entries (title length, topic style, description voice):',
    ...examples,
  ].join('\n');
  const user = `Sermon date: ${date}\n\nTranscript:\n${transcript}`;
  return { system, user };
}

export function buildBoundsPrompt(timedTranscript) {
  const system = [
    'You are given a timestamped auto-caption transcript of a full church livestream (roughly two hours): pre-service, worship songs, welcome and announcements, offering, kids dismissal, the sermon, and a closing response.',
    'Find the sermon only. `start` is the moment the preacher begins the message: their first words when they take the stage, including any opening greeting or prayer that leads straight into the teaching. Exclude the host\'s introduction of the preacher, announcements, and singing.',
    '`end` is the last sentence of the message before a closing song, altar call music, or dismissal begins. Include a closing prayer only if it flows directly from the message with no music.',
    'Timestamps are [H:MM:SS]; report `start` and `end` as integer seconds from the beginning of the recording. Use the timestamp of the line where the change happens.',
  ].join('\n');
  return { system, user: `Transcript:\n${timedTranscript}` };
}

async function askJSON({ system, user }, schema, maxTokens) {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { effort: 'high', format: { type: 'json_schema', schema } },
  });
  if (res.stop_reason === 'refusal') throw new Error(`Claude declined: ${res.stop_details?.explanation || 'no explanation'}`);
  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(text);
}

export async function extractMetadata(transcript, ctx) {
  const meta = await askJSON(buildMetadataPrompt(transcript, ctx), METADATA_SCHEMA, 4000);
  return { ...meta, series: meta.series || null };
}

export async function findSermonBounds(timedTranscript) {
  return askJSON(buildBoundsPrompt(timedTranscript), BOUNDS_SCHEMA, 2000);
}
