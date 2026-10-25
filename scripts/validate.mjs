// Checks the register: unique numbers, matching fingerprints, valid signatures, sound replacements.
// Run by the "Validate and publish certificates" workflow; also runnable locally: node scripts/validate.mjs
import { createHash, createPublicKey, verify } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const canonical = (v) => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
};

const certificates = read('data/certificates.json');
const manifest = read('data/manifest.json');
const keys = new Map(read('data/public-key.json').keys.map((k) => [k.kid, createPublicKey({ key: Buffer.from(k.spki, 'base64'), format: 'der', type: 'spki' })]));

let failures = 0;
const fail = (message) => { failures++; console.error('FAIL ' + message); };
const numbers = new Set();
const entitlementOf = (c) => [c.regNo, c.eventId ?? '-', c.kind].join('|');

if (manifest.count !== certificates.length) fail('manifest.count is ' + manifest.count + ' but there are ' + certificates.length + ' certificates');

// A corrected certificate names the one it replaces. The original stays in the register.
const byNumber = new Map(certificates.map((c) => [c.number, c]));
const replacedBy = new Map();
for (const c of certificates) {
  if (!c.supersedes) continue;
  const old = byNumber.get(c.supersedes);
  if (!old) fail(c.number + ' replaces ' + c.supersedes + ', which is not in the register');
  else {
    if (entitlementOf(old) !== entitlementOf(c)) fail(c.number + ' replaces a certificate for a different person, event or type');
    if (!(c.number > old.number)) fail(c.number + ' must be numbered after the certificate it replaces');
  }
  if (replacedBy.has(c.supersedes)) fail(c.supersedes + ' is replaced more than once (by ' + replacedBy.get(c.supersedes) + ' and ' + c.number + ')');
  replacedBy.set(c.supersedes, c.number);
}

// Everyone has at most one current certificate for each event and type.
const current = new Set();
for (const c of certificates) {
  if (replacedBy.has(c.number)) continue;
  const entitlement = entitlementOf(c);
  if (current.has(entitlement)) fail(c.number + ' duplicates another current certificate for the same person, event and type');
  current.add(entitlement);
}

for (const c of certificates) {
  if (numbers.has(c.number)) fail(c.number + ' appears more than once');
  numbers.add(c.number);
  if (!existsSync('templates/' + c.kind + '.html')) fail(c.number + ' uses a template that does not exist: ' + c.kind);

  const payload = { ...c };
  for (const field of ['digest', 'signature', 'kid', 'key']) delete payload[field];
  const text = canonical(payload);
  if (createHash('sha256').update(text).digest('hex') !== c.digest) fail(c.number + ' does not match its recorded fingerprint');
  const key = keys.get(c.kid);
  if (!key) fail(c.number + ' was signed with an unknown key (' + c.kid + ')');
  else if (!verify(null, Buffer.from(text), key, Buffer.from(c.signature, 'base64'))) fail(c.number + ' has an invalid signature');
}

if (failures) {
  console.error(failures + ' problem(s) found.');
  process.exit(1);
}
console.log('OK: ' + certificates.length + ' certificates verified.');
