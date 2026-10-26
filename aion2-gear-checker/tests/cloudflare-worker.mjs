// Offline integration smoke tests with mocked public NCSOFT endpoints.
// Run: node tests/cloudflare-worker.mjs from aion2-gear-checker
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const code = await readFile(new URL('../_worker.js', import.meta.url), 'utf8');
const worker = (await import('data:text/javascript;base64,' +
  Buffer.from(code).toString('base64'))).default;
const id = 'GXf_uDNlKcYJYIHNvVUVBbBYQmXHGspXUlVENSk2RAc=';
const visits = [];
const sampleNode = { boardId: 71, row: 1, col: 1, type: 'Start', name: 'Start',
  open: 1, grade: 'Unique', effectList: [] };

globalThis.fetch = async input => {
  const url = new URL(input);
  visits.push(url);
  let payload;
  if (url.hostname === 'api-search.plaync.com') {
    payload = { list: [
      { name: '<em>Taty</em>', serverId: 1305, characterId: encodeURIComponent(id), level: 45 },
      { name: 'Tatya', serverId: 1305, characterId: 'SOME_OTHER_CHARACTER_ID=', level: 45 },
      { name: '<em>Taty</em>', serverId: 1301, characterId: 'OTHER_SERVER_CHARACTER_ID=' },
    ] };
  } else if (url.pathname.endsWith('/info')) {
    payload = { profile: { characterName: 'Taty', className: 'Cleric',
      serverId: 1305, characterLevel: 45 },
      daevanion: { boardList: [71, 72, 73, 74, 76].map(id => ({ id, name: 'Board ' + id,
        openNodeCount: 1, totalNodeCount: 80 })) } };
  } else if (url.pathname.endsWith('/equipment')) {
    payload = { equipment: { equipmentList: [
      { id: 110730097, slotPos: 0, slotPosName: 'MainHand',
        name: 'Sample Mace', enchantLevel: 15, exceedLevel: 3 }
    ] }, skill: { skillList: [] }, petwing: {} };
  } else if (url.pathname.endsWith('/equipment/item')) {
    payload = { name: 'Sample Mace', icon: 'https://example.org/item.png',
      subStats: [{ name: 'Might', value: 30 }] };
  } else if (url.pathname.endsWith('/daevanion/detail')) {
    payload = { nodeList: Array.from({length:225}, (_, index) => ({
      ...sampleNode, nodeId: index + 710001, col: index % 15 + 1,
      row: Math.floor(index / 15) + 1
    })), openSkillEffectList: [], openStatEffectList: [] };
  } else {
    throw new Error('Unexpected upstream request: ' + url);
  }
  return new Response(JSON.stringify(payload), {status:200,
    headers: {'content-type':'application/json'}});
};

const env = { ASSETS: {fetch: () => new Response('static') } };
const ctx = { waitUntil() {} };
async function call(path) {
  const result = await worker.fetch(new Request('https://demo.pages.dev' + path), env, ctx);
  return {status:result.status, body:await result.json(), headers:result.headers};
}

assert.equal(await (await worker.fetch(new Request('https://demo.pages.dev/index.html'), env, ctx)).text(), 'static');

const health = await call('/api/health');
assert.equal(health.status,200);
assert.equal(health.body.region, 'eu');
assert.equal(health.body.ok, true);
assert.equal((await call('/api/search?serverId=9999&name=Taty')).status,400);
assert.equal((await call('/api/search?serverId=1305&name=%3Cscript%3E')).status,400);

const matches = await call('/api/search?serverId=1305&name=Taty');
assert.equal(matches.status,200);
assert.equal(matches.body.characters.length,1);
assert.equal(matches.body.characters[0].name,'Taty');
assert.equal(matches.body.characters[0].characterId,id);

const profile = await call('/api/character?serverId=1305&characterId='+encodeURIComponent(id));
assert.equal(profile.status,200);
assert.equal(profile.body.region,'eu');
assert.equal(profile.body.info.profile.characterName,'Taty');
assert.equal(profile.body.equipment.equipment.equipmentList.length,1);
assert.equal(profile.body.items['0'].subStats[0].name, 'Might');
assert.equal(Object.keys(profile.body.daevanionBoards).length,5);
assert.equal(profile.body.daevanionBoards['71'].nodeList.length,225);
assert.equal(profile.body.itemErrors.length,0);
assert.equal(profile.body.boardErrors.length,0);
assert.equal(profile.body.partial,false);
assert.equal(profile.headers.get('access-control-allow-origin'),'*');

assert.equal(visits.filter(v=>v.hostname === 'api-search.plaync.com').length,1);
assert.equal(visits.filter(v=>v.pathname.endsWith('/daevanion/detail')).length,5);
assert.equal(visits.filter(v=>v.pathname.endsWith('/equipment/item')).length,1);
console.log('PASS: Cloudflare Pages Worker, EU name search, Gear, item details, 5 boards, CORS.');
