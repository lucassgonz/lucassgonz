#!/usr/bin/env node
// Draws the terminal-style profile cards in ./assets.
//
//   node scripts/generate.mjs          all cards; the GitHub card needs GH_TOKEN (the Action provides it)
//   node scripts/generate.mjs --mock   all cards with fake GitHub numbers, into ./preview (for local previews only)
//
// assets/banner.svg (the typing terminal) is hand-made and not touched by this script.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOCK = process.argv.includes('--mock');
const OUT = join(ROOT, MOCK ? 'preview' : 'assets');
const LOGIN = process.env.PROFILE_USER || process.env.GITHUB_REPOSITORY_OWNER || 'lucassgonz';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

// ------------------------------------------------------------------ content (from the résumé)

const links = [
  { label: 'email', value: 'lucasgdeveloper@gmail.com', color: 'coral', file: 'btn-email.svg' },
  { label: 'linkedin', value: 'in/devlucasgonz', color: 'blue', file: 'btn-linkedin.svg' },
];

const highlights = [
  { value: '3+ yrs', lines: ['building production', 'APIs & automations'], color: 'green' },
  { value: '20+', lines: ['automations', 'in production'], color: 'blue' },
  { value: '13+', lines: ['software projects', 'led'], color: 'purple' },
  { value: '2nd', lines: ['Huawei ICT Global', 'Final · Shenzhen 2025'], color: 'amber' },
];

const career = [
  { dates: '2026.2 — now', org: 'IFCE', role: 'Technologist Degree in Artificial Intelligence', color: 'purple', now: true,
    note: 'undergraduate studies in AI, started in the 2nd semester of 2026' },
  { dates: 'Jun 2026 — now', org: 'OpenWorks', role: 'Integrations Developer', color: 'green', now: true,
    note: '3 lead-gen automations in production (HubSpot, Apollo, Serper) · AI agents' },
  { dates: 'Jul 2025 — Jun 2026', org: 'Accodal', role: 'Low-Code & Integrations Developer', color: 'coral',
    note: '20+ automations for hiring, HR and invoicing · Zoho CRM, Stripe, n8n' },
  { dates: 'Sep 2024 — Nov 2025', org: 'LAPISCO', role: 'Volunteer Researcher, AI lab', color: 'teal',
    note: 'AcneApp: computer vision for skin classification from selfies' },
  { dates: 'Mar 2024 — Feb 2025', org: 'Polo de Inovação IFCE', role: 'Junior Software Developer', color: 'blue',
    note: 'REST endpoints in Python and JavaScript · core developer of Giselle' },
  { dates: 'Feb 2024 — Dec 2025', org: 'Apple Developer Academy', role: 'iOS Developer & Team Lead', color: 'purple',
    note: 'Scrum Master for a team of 4 · native iOS apps in Swift and SwiftUI' },
  { dates: 'Aug 2023 — Feb 2026', org: 'Huawei ICT Academy', role: 'Computing Mentor & Web Developer', color: 'amber',
    note: 'coached 2 national finalist teams · attendance system for ~200 students' },
];

const projects = [
  { name: 'Sonara', kind: 'llm · vector search', color: 'purple', award: true,
    desc: 'AI recruitment engine with vector search and LLM-driven candidate profiling.',
    chip: '3rd place · Hack-Nation Global AI Hackathon' },
  { name: 'PlantAI', kind: 'computer vision · openEuler', color: 'green', award: false,
    desc: 'Cloud-native agricultural diagnostics using computer vision. Lead architect.',
    chip: 'Huawei ICT Competition · national phase' },
  { name: 'Cashew Care', kind: 'iot · ai', color: 'coral', award: true,
    desc: 'IoT and AI platform for real-time crop diagnostics.',
    chip: '3rd place · Huawei Developer Competition LATAM' },
  { name: 'Giselle', kind: 'nlp · botpress', color: 'blue', award: false,
    desc: 'Conversational agent for early screening of depressive symptoms in older adults.',
    chip: 'Polo de Inovação IFCE · EMBRAPII' },
];

const stack = [
  ['languages', 'green', ['Python', 'JavaScript', 'Node.js', 'Java', 'Swift']],
  ['backend', 'blue', ['Express.js', 'REST APIs', 'Webhooks', 'Microservices']],
  ['data', 'teal', ['PostgreSQL', 'MySQL', 'Supabase', 'Airtable']],
  ['automation', 'coral', ['n8n', 'Make', 'Zapier']],
  ['ai', 'purple', ['Claude', 'LLM agents', 'RAG', 'Function calling', 'PyTorch', 'TensorFlow']],
  ['crm', 'amber', ['HubSpot', 'Zoho CRM', 'Apollo.io', 'Serper', 'Stripe API']],
  ['frontend', 'blue', ['React.js', 'SwiftUI']],
  ['devops', 'green', ['Docker', 'Git', 'Linux', 'openEuler', 'Huawei Cloud']],
];

const curiosities = [
  ['award', 'amber', '2nd Prize at the Huawei ICT Competition Global Final, Shenzhen 2025'],
  ['ai', 'purple', 'In my free time I like to explore new AI features'],
  ['chess', 'blue', 'I play chess'],
  ['kitchen', 'coral', 'And I like to cook'],
  ['speaks', 'green', 'Portuguese (native) · English (C1) · Spanish (basic)'],
];

// ------------------------------------------------------------------ drawing helpers

const C = {
  bg: '#15171c', bar: '#22252c', line: '#2b2f37', text: '#e6e6e6', mute: '#9198a1', faint: '#636b75',
  green: '#7ee787', amber: '#f2c66d', blue: '#79c0ff', purple: '#d2a8ff', coral: '#ff7b72', teal: '#56d4dd',
};
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace";
const col = (c) => C[c] || c;
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = rgb(col(a)), B = rgb(col(b)); return '#' + A.map((v, i) => Math.round(v * (1 - t) + B[i] * t).toString(16).padStart(2, '0')).join(''); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const monoW = (s, size) => [...String(s)].length * size * 0.602;
const fmt = (n) => n.toLocaleString('en-US');

function T(x, y, s, { size = 14, weight = 400, fill = C.text, mono = true, anchor = 'start' } = {}) {
  return `<text x="${Math.round(x * 10) / 10}" y="${y}" class="${mono ? 'm' : 's'}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
}

function wrap(text, max) {
  const out = []; let line = '';
  for (const w of text.split(' ')) { if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? `${line} ${w}` : w; }
  return line ? [...out, line] : out;
}

// A terminal window like the banner: title bar, traffic lights, and a prompt with the command.
function win(h, title, cmd, body, { css = '', label = title, right = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="${h}" viewBox="0 0 880 ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs><clipPath id="w"><rect width="880" height="${h}" rx="14"/></clipPath><style>.s{font-family:${SANS}}.m{font-family:${MONO}}${css}</style></defs>
<g clip-path="url(#w)"><rect width="880" height="${h}" fill="${C.bg}"/><rect width="880" height="40" fill="${C.bar}"/></g>
<circle cx="26" cy="20" r="6.5" fill="#ff5f57"/><circle cx="48" cy="20" r="6.5" fill="#febc2e"/><circle cx="70" cy="20" r="6.5" fill="#28c840"/>
${T(440, 25, title, { size: 12, fill: '#8b8f98', anchor: 'middle' })}
<text x="30" y="76" class="m" font-size="15"><tspan fill="${C.green}">~ $</tspan><tspan fill="${C.text}"> ${esc(cmd)}</tspan></text>
${right ? T(850, 76, right, { size: 12, fill: C.faint, anchor: 'end' }) : ''}
${body}
</svg>
`;
}

function tile(x, y, w, h, color) {
  const c = col(color);
  return `<rect x="${x}" y="${y + 5}" width="${w}" height="${h}" rx="12" fill="${mix(c, '#000000', 0.65)}"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${mix(c, C.bg, 0.86)}" stroke="${c}" stroke-opacity="0.45" stroke-width="1.2"/>`;
}

function star(cx, cy, r, fill) {
  const p = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r * 0.45 : r; p.push(`${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`); }
  return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
}

function chip(x, y, text, color, { size = 12, h = 24, icon = false } = {}) {
  const c = col(color), iw = icon ? size + 4 : 0, w = Math.round(monoW(text, size) + 22 + iw);
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${mix(c, C.bg, 0.85)}" stroke="${c}" stroke-opacity="0.4"/>`;
  if (icon) s += star(x + 11 + size / 2 - 1, y + h / 2, size / 2, c);
  s += T(x + 11 + iw, y + h / 2 + size * 0.36, text, { size, fill: mix(c, '#ffffff', 0.35) });
  return { s, w };
}

function cursor(x, y) {
  return `<rect x="${x}" y="${y - 15}" width="9" height="18" fill="${C.text}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/></rect>`;
}
const promptEnd = (y) => `<text x="30" y="${y}" class="m" font-size="15" fill="${C.green}">~ $</text>` + cursor(66, y);

// ------------------------------------------------------------------ cards

function button(l) {
  const lw = monoW(l.label, 12) + 22, W = Math.round(8 + lw + 12 + monoW(l.value, 13) + 18), c = col(l.color);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="38" viewBox="0 0 ${W} 38" role="img" aria-label="${esc(`${l.label}: ${l.value}`)}">
<title>${esc(`${l.label}: ${l.value}`)}</title><style>.m{font-family:${MONO}}</style>
<rect x="0.5" y="0.5" width="${W - 1}" height="37" rx="9" fill="${C.bg}" stroke="${C.line}"/>
<rect x="7" y="7" width="${Math.round(lw)}" height="24" rx="6" fill="${c}"/>
${T(18, 23.5, l.label, { size: 12, weight: 700, fill: C.bg })}
${T(8 + lw + 12, 24, l.value, { size: 13 })}
</svg>
`;
}

function highlightsCard() {
  const w = 184, gap = 16, y = 100, h = 112;
  let b = '';
  highlights.forEach((t, i) => {
    const x = 48 + i * (w + gap);
    b += tile(x, y, w, h, t.color);
    b += T(x + 20, y + 50, t.value, { size: 34, weight: 800, fill: col(t.color) });
    t.lines.forEach((l, k) => (b += T(x + 20, y + 78 + k * 17, l, { size: 12, fill: mix(t.color, '#ffffff', 0.5) })));
  });
  return win(y + h + 34, '~/highlights', 'cat highlights.txt', b,
    { label: `Highlights: ${highlights.map((t) => `${t.value} ${t.lines.join(' ')}`).join('; ')}` });
}

function careerCard() {
  const top = 104, step = 56, gx = 212;
  let b = `<line x1="${gx}" y1="${top + 11}" x2="${gx}" y2="${top + (career.length - 1) * step + 11}" stroke="${C.line}" stroke-width="2"/>`;
  career.forEach((r, i) => {
    const y = top + i * step, c = col(r.color);
    b += T(40, y + 16, r.dates, { size: 12, fill: C.amber });
    if (r.now) b += `<circle cx="${gx}" cy="${y + 11}" r="6" fill="none" stroke="${c}" stroke-width="2"><animate attributeName="r" values="6;15" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.8s" repeatCount="indefinite"/></circle>`;
    b += `<circle cx="${gx}" cy="${y + 11}" r="6" fill="${r.now ? c : C.bg}" stroke="${c}" stroke-width="2.5"/>`;
    b += `<text x="236" y="${y + 16}" class="s" font-size="15" font-weight="700" fill="${C.text}">${esc(r.org)}<tspan font-weight="400" fill="${C.mute}">  ·  ${esc(r.role)}</tspan></text>`;
    b += T(236, y + 37, r.note, { size: 12, fill: C.faint });
  });
  return win(top + career.length * step + 12, '~/career', 'git log --career', b,
    { label: `Experience: ${career.map((r) => `${r.org}, ${r.role} (${r.dates})`).join('; ')}` });
}

function projectsCard() {
  const w = 384, h = 150, gap = 16, y0 = 100;
  let b = '';
  projects.forEach((p, i) => {
    const x = 48 + (i % 2) * (w + gap), y = y0 + Math.floor(i / 2) * (h + gap + 4), c = col(p.color);
    b += tile(x, y, w, h, p.color);
    b += T(x + 20, y + 30, p.kind, { size: 11, weight: 600, fill: c });
    b += T(x + 20, y + 60, p.name, { size: 22, weight: 800, mono: false });
    wrap(p.desc, 50).slice(0, 2).forEach((l, k) => (b += T(x + 20, y + 85 + k * 18, l, { size: 13, fill: C.mute, mono: false })));
    b += chip(x + 20, y + 112, p.chip, p.award ? 'amber' : 'faint', { size: 11, h: 24, icon: p.award }).s;
  });
  return win(y0 + 2 * h + gap + 4 + 34, '~/projects', 'ls ~/projects', b,
    { label: `Projects: ${projects.map((p) => `${p.name}: ${p.desc} (${p.chip})`).join('; ')}` });
}

function stackCard() {
  const top = 112, step = 36;
  let b = T(30, 102, '{', { size: 15, fill: C.mute });
  stack.forEach(([key, color, items], i) => {
    const y = top + i * step;
    b += T(56, y + 17, `"${key}":`, { size: 13, fill: col(color) });
    let x = 200;
    for (const it of items) { const r = chip(x, y, it, color); b += r.s; x += r.w + 8; }
  });
  b += T(30, top + stack.length * step + 14, '}', { size: 15, fill: C.mute });
  return win(top + stack.length * step + 40, '~/stack', 'cat stack.json', b,
    { label: `Stack: ${stack.map(([k, , it]) => `${k}: ${it.join(', ')}`).join('; ')}` });
}

function curiositiesCard() {
  const top = 112, step = 32;
  let b = '';
  curiosities.forEach(([key, color, text], i) => {
    const y = top + i * step;
    b += chip(30, y - 17, key, color, { size: 12, h: 24 }).s;
    b += T(138, y, text, { size: 15, mono: false });
  });
  b += promptEnd(top + curiosities.length * step + 14);
  return win(top + curiosities.length * step + 40, '~/curiosities', 'cat curiosities.txt', b,
    { label: `Curiosities: ${curiosities.map(([, , t]) => t).join('; ')}` });
}

// ------------------------------------------------------------------ live GitHub card

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const niceDate = (iso, y = false) => { const [yy, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}${y ? ' ' + yy : ''}`; };
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function githubCard(s) {
  const today = new Date().toISOString().slice(0, 10);
  const cols = [
    { v: fmt(s.lastYear), l: 'contributions, last year', c: 'green' },
    { v: `${s.current} ${s.current === 1 ? 'day' : 'days'}`, l: 'current streak', c: 'purple' },
    { v: `${s.longest} days`, l: 'longest streak', c: 'amber' },
    { v: fmt(s.repos), l: 'public repos', c: 'blue' },
  ];
  let b = '';
  const cw = 784 / 4;
  cols.forEach((t, i) => {
    const x = 48 + i * cw;
    if (i) b += `<line x1="${x - 12}" y1="104" x2="${x - 12}" y2="156" stroke="${C.line}" stroke-width="1.5"/>`;
    b += T(x, 136, t.v, { size: 28, weight: 800, fill: col(t.c) });
    b += T(x, 158, t.l, { size: 12, fill: C.mute });
  });

  const weeks = s.weeks.slice(-26).map((w) => w.filter((d) => d.date <= today));
  const days = weeks.flat(), sum = days.reduce((a, d) => a + d.count, 0);
  const nz = days.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = (p) => nz[Math.floor(p * (nz.length - 1))] ?? 0, th = [q(0.25), q(0.5), q(0.75)];
  const lvl = (c) => (c === 0 ? 0 : c <= th[0] ? 1 : c <= th[1] ? 2 : c <= th[2] ? 3 : 4);
  const ramp = ['#21262d', '#0e4429', '#006d32', '#26a641', '#39d353'];
  const cell = 22, gap = 5, gw = weeks.length * (cell + gap) - gap, X = Math.round((880 - gw) / 2) + 16, Y = 214;
  ['Mon', 'Wed', 'Fri'].forEach((d, k) => (b += T(X - 44, Y + (1 + 2 * k) * (cell + gap) + 15, d, { size: 11, fill: C.faint })));
  let last = -9;
  weeks.forEach((wk, wi) => {
    const first = wk.find((d) => d.date.endsWith('-01')) || (wi === 0 ? wk[0] : null);
    if (first && wi - last >= 3) { b += T(X + wi * (cell + gap), Y - 10, MONTHS[Number(first.date.slice(5, 7)) - 1], { size: 11, fill: C.mute }); last = wi; }
    for (const d of wk) {
      const row = new Date(d.date + 'T00:00:00Z').getUTCDay();
      b += `<rect class="c" style="animation-delay:${wi * 20}ms" x="${X + wi * (cell + gap)}" y="${Y + row * (cell + gap)}" width="${cell}" height="${cell}" rx="5" fill="${ramp[lvl(d.count)]}"/>`;
    }
  });
  const fy = Y + 7 * (cell + gap) + 22;
  b += T(X, fy, `${fmt(sum)} contributions in the last ${weeks.length} weeks`, { size: 12, fill: C.mute });
  const lx = X + gw - 5 * 16 - 36;
  b += T(lx - 8, fy, 'less', { size: 11, fill: C.faint, anchor: 'end' });
  ramp.forEach((c, k) => (b += `<rect x="${lx + k * 16}" y="${fy - 11}" width="12" height="12" rx="3" fill="${c}"/>`));
  b += T(lx + 5 * 16 + 4, fy, 'more', { size: 11, fill: C.faint });

  return win(fy + 26, `${s.login} — github`, 'gh stats', b, {
    right: `redrawn nightly · ${niceDate(today, true)}`,
    css: '.c{animation:f .5s ease-out both}@keyframes f{from{opacity:0}to{opacity:1}}',
    label: `GitHub stats for ${s.login}: ${s.lastYear} contributions in the last year, ${s.current}-day current streak, ${s.longest}-day longest streak, ${s.repos} public repos.`,
  });
}

function summarize(login, repos, weeks, allDays) {
  const today = new Date().toISOString().slice(0, 10);
  const days = [...allDays.entries()].filter(([d]) => d <= today).sort(([a], [b]) => (a < b ? -1 : 1));
  let run = 0, longest = 0;
  for (const [, c] of days) { run = c > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let i = days.length - 1, current = 0;
  if (i >= 0 && days[i][1] === 0) i--; // no contributions yet today doesn't break the streak
  while (i >= 0 && days[i][1] > 0) { current++; i--; }
  const lastYear = weeks.flat().filter((d) => d.date <= today).reduce((a, d) => a + d.count, 0);
  return { login, repos, weeks, lastYear, current, longest };
}

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-cards' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API: ${JSON.stringify(json.errors || json)}`);
  return json.data;
}

const CAL = 'contributionCalendar { weeks { contributionDays { date contributionCount } } }';
async function fetchStats(login) {
  const { user } = await gql(`query($login: String!) { user(login: $login) { login
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    contributionsCollection { contributionYears ${CAL} } } }`, { login });
  if (!user) throw new Error(`GitHub user "${login}" not found`);
  const allDays = new Map();
  for (const y of user.contributionsCollection.contributionYears) {
    const d = await gql(`query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) {
      contributionsCollection(from: $from, to: $to) { ${CAL} } } }`, { login, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` });
    for (const w of d.user.contributionsCollection.contributionCalendar.weeks) for (const x of w.contributionDays) allDays.set(x.date, x.contributionCount);
  }
  const weeks = user.contributionsCollection.contributionCalendar.weeks.map((w) => w.contributionDays.map((x) => ({ date: x.date, count: x.contributionCount })));
  for (const w of weeks) for (const x of w) allDays.set(x.date, x.count);
  return summarize(user.login, user.repositories.totalCount, weeks, allDays);
}

function mockStats() {
  let seed = 42; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const today = new Date().toISOString().slice(0, 10), allDays = new Map();
  for (let i = 500; i >= 0; i--) { const d = addDays(today, -i); allDays.set(d, rnd() < (i < 40 ? 1 : 0.6) ? Math.ceil(rnd() ** 2 * 14) : 0); }
  let start = addDays(today, -364); start = addDays(start, -new Date(start + 'T00:00:00Z').getUTCDay());
  const weeks = [];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    if (new Date(d + 'T00:00:00Z').getUTCDay() === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ date: d, count: allDays.get(d) });
  }
  return summarize(LOGIN, 41, weeks, allDays);
}

// ------------------------------------------------------------------ main

await mkdir(OUT, { recursive: true });
const files = {
  'highlights.svg': highlightsCard(),
  'career.svg': careerCard(),
  'projects.svg': projectsCard(),
  'stack.svg': stackCard(),
  'curiosities.svg': curiositiesCard(),
};
for (const l of links) files[l.file] = button(l);
const stats = MOCK ? mockStats() : TOKEN ? await fetchStats(LOGIN) : null;
if (stats) files['github.svg'] = githubCard(stats);
else console.warn('No GH_TOKEN: skipped github.svg (the GitHub Action draws it).');
for (const [name, svg] of Object.entries(files)) await writeFile(join(OUT, name), svg);
console.log(`Wrote ${Object.keys(files).join(', ')} to ${OUT}`);
