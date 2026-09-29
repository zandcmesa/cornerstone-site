import fs from 'node:fs';
import path from 'node:path';

const { PCO_APP_ID, PCO_SECRET } = process.env;
if (!PCO_APP_ID || !PCO_SECRET) { console.error('Missing PCO_APP_ID / PCO_SECRET'); process.exit(1); }
const AUTH = 'Basic ' + Buffer.from(`${PCO_APP_ID}:${PCO_SECRET}`).toString('base64');
const BASE = 'https://api.planningcenteronline.com';

async function getAll(url) {
  const data = [], included = [];
  let next = url;
  while (next) {
    const res = await fetch(next, { headers: { Authorization: AUTH } });
    if (!res.ok) throw new Error(`${res.status} for ${next}`);
    const json = await res.json();
    data.push(...json.data);
    if (json.included) included.push(...json.included);
    next = json.links && json.links.next;
  }
  return { data, included };
}

const until = new Date(Date.now() + 120 * 86400000).toISOString();
const jobs = {
  'calendar-instances': `${BASE}/calendar/v2/event_instances?filter=future&include=event&order=starts_at&per_page=100&where[starts_at][lte]=${until}`,
  'signups': `${BASE}/registrations/v2/signups?where[archived]=false&include=signup_times,signup_location&per_page=100`,
  'groups': `${BASE}/groups/v2/groups?include=group_type,location,enrollment&order=name&per_page=100`,
  'group-types': `${BASE}/groups/v2/group_types?per_page=100`,
};

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');
fs.mkdirSync(dir, { recursive: true });
for (const [name, url] of Object.entries(jobs)) {
  const out = await getAll(url);
  if (name === 'groups') {
    for (const g of out.data) {
      delete g.attributes.contact_email;
      if (!g.attributes.public_church_center_web_url) { g.attributes.description = ''; g.attributes.description_as_plain_text = ''; }
    }
  }
  fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(out, null, 1));
  console.log(name, out.data.length, 'records');
}
