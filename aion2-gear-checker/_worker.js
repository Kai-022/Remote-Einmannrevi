/* Cloudflare Pages Worker, public read-only AION 2 EU gear profile importer.
 * Output dir/root: aion2-gear-checker, route /api/* via _routes.json.
 * Only known NCSOFT API endpoints, no arbitrary URL proxy.
 */
const NC = "https://aion2.plaync.com/api/character/";
const SEARCH = "https://api-search.plaync.com/aion2global/search/v2/character";
const TIMEOUT_MS = 14000;
const MAX_JSON = 2000000;

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function answer(payload, status = 200, age = 0) {
  return new Response(JSON.stringify(payload), {
    status, headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
      "cache-control": age ? "public, max-age=" + age : "no-store",
    }
  });
}
function euServer(raw) {
  if (!/^\d{4}$/.test(String(raw || ""))) throw new ApiError(400, "Bitte einen EU-Server auswählen.");
  const id = Number(raw);
  if (!((id >= 1301 && id <= 1323) || (id >= 2301 && id <= 2323)))
    throw new ApiError(400, "Unbekannter EU-Server.");
  return id;
}
function cleanName(raw) {
  const name = String(raw ?? "").trim().normalize("NFKC");
  if (name.length < 2 || name.length > 45 || /[\u0000-\u001f<>]/.test(name))
    throw new ApiError(400, "Bitte einen Charakternamen (2–45 Zeichen) eingeben.");
  return name;
}
function decodeId(value) {
  let id = String(value || "");
  try { id = decodeURIComponent(id); } catch { throw new ApiError(400, "Ungültige Charakter-ID."); }
  if (!/^[A-Za-z0-9_+=/-]{8,256}$/.test(id)) throw new ApiError(400, "Ungültige Charakter-ID.");
  return id;
}
function queryUrl(base, params) {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url;
}
function displayName(name) {
  return String(name || "").replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').trim().normalize("NFKC");
}
const norm = s => String(s || "").trim().normalize("NFKC").toLocaleLowerCase("en-US");

async function officialJson(endpoint, params) {
  const url = queryUrl(endpoint, params);
  if (!((url.origin === "https://aion2.plaync.com" && url.pathname.startsWith("/api/character/")) ||
        (url.origin === "https://api-search.plaync.com" && url.pathname === "/aion2global/search/v2/character")))
    throw new ApiError(500, "Nicht erlaubte Datenquelle.");
  let r;
  try {
    r = await fetch(url.toString(), {
      method: "GET", headers: { accept: "application/json" },
      redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS),
      cf: { cacheEverything: true, cacheTtl: 90 }
    });
  } catch {
    throw new ApiError(502, "Die offiziellen NCSOFT-Daten sind momentan nicht erreichbar.");
  }
  if (!r.ok) {
    if (r.status === 404) throw new ApiError(404, "Dieser Charakter oder Eintrag wurde nicht gefunden.");
    if (r.status === 429) throw new ApiError(503, "NCSOFT begrenzt die Anfragen. Bitte erneut versuchen.");
    throw new ApiError(502, "NCSOFT antwortet mit HTTP " + r.status + ".");
  }
  if (Number(r.headers.get("content-length") || 0) > MAX_JSON)
    throw new ApiError(502, "NCSOFT hat zu viele Daten geliefert.");
  const raw = await r.text();
  if (raw.length > MAX_JSON) throw new ApiError(502, "Antwort von NCSOFT zu groß.");
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("shape");
    return data;
  } catch {
    throw new ApiError(502, "NCSOFT hat kein gültiges JSON geliefert.");
  }
}
async function searchCharacter(params) {
  const serverId = euServer(params.get("serverId"));
  const name = cleanName(params.get("name"));
  const d = await officialJson(SEARCH, {
    keyword: name, serverId, region: "eu", localeInfo: "en-US", page: 1, size: 100
  });
  const rows = Array.isArray(d.list) ? d.list : [];
  const found = [], seen = new Set();
  for (const row of rows.slice(0, 100)) {
    if (!row || typeof row !== "object" || String(row.serverId) !== String(serverId)) continue;
    const fullName = displayName(row.name);
    if (norm(fullName) !== norm(name)) continue;
    let characterId;
    try { characterId = decodeId(row.characterId); } catch { continue; }
    if (seen.has(characterId)) continue;
    seen.add(characterId);
    found.push({
      serverId, characterId, name: fullName,
      className: String(row.className || ""), level: Number(row.level || 0)
    });
    if (found.length >= 20) break;
  }
  return { region: "eu", serverId: String(serverId), characters: found };
}
function boundedNum(value, lo, hi) {
  const v = Number(value);
  return Number.isInteger(v) && v >= lo && v <= hi ? v : null;
}
async function characterData(params) {
  const serverId = euServer(params.get("serverId"));
  const characterId = decodeId(params.get("characterId"));
  const base = { region: "eu", lang: "en", serverId, characterId };
  const [info, equipment] = await Promise.all([
    officialJson(NC + "info", base),
    officialJson(NC + "equipment", base)
  ]);
  const profile = info.profile;
  if (!profile || typeof profile !== "object" || !profile.characterName)
    throw new ApiError(404, "Kein öffentliches Charakterprofil gefunden.");
  if (profile.serverId != null && String(profile.serverId) !== String(serverId))
    throw new ApiError(409, "Profil gehört zu einem anderen EU-Server.");
  const slots = equipment?.equipment?.equipmentList;
  if (!Array.isArray(slots) || slots.length > 80)
    throw new ApiError(502, "NCSOFT hat keine gültige Gear-Liste geliefert.");

  const tasks = [], items = {}, daevanionBoards = {}, itemErrors = [], boardErrors = [];
  const boardList = Array.isArray(info?.daevanion?.boardList) ? info.daevanion.boardList : [];
  // Prioritize complete Boards over item-tooltip details when the source rate-limits.
  for (const board of boardList.slice(0, 5)) {
    const id = boundedNum(board?.id ?? board?.boardId, 1, 10000);
    if (id === null) continue;
    tasks.push({ type: "board", id, endpoint: NC + "daevanion/detail",
                 params: { ...base, boardId: id } });
  }
  for (const slot of slots) {
    if (!slot || typeof slot !== "object") continue;
    const id = boundedNum(slot.id, 1, Number.MAX_SAFE_INTEGER);
    const pos = boundedNum(slot.slotPos, 0, 999);
    const enchant = boundedNum(slot.enchantLevel ?? 0, 0, 100);
    const exceed = boundedNum(slot.exceedLevel ?? 0, 0, 100);
    if ([id, pos, enchant, exceed].some(v => v === null)) continue;
    tasks.push({ type: "item", id: pos, endpoint: NC + "equipment/item",
                 params: { ...base, id, slotPos: pos, enchantLevel: enchant, exceedLevel: exceed } });
  }

  let nextAt = Date.now(), cursor = 0;
  async function pace() {
    const now = Date.now(), delay = Math.max(0, nextAt - now);
    nextAt = Math.max(nextAt, now) + 850;
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  }
  await Promise.all(Array.from({ length: Math.min(3, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      await pace();
      try {
        const detail = await officialJson(task.endpoint, task.params);
        if (task.type === "board") daevanionBoards[String(task.id)] = detail;
        else items[String(task.id)] = detail;
      } catch (error) {
        const list = task.type === "board" ? boardErrors : itemErrors;
        list.push({
          [task.type === "board" ? "boardId" : "slotPos"]: task.id,
          reason: error instanceof ApiError ? error.message : "Abruf fehlgeschlagen"
        });
      }
    }
  }));
  return {
    version: 1, generatedAt: new Date().toISOString(),
    profileUrl: "https://aion2.plaync.com/en-us/characters/" + serverId +
      "/" + encodeURIComponent(characterId) + "?region=eu",
    region: "eu", serverId: String(serverId), characterId,
    info, equipment, items, daevanionBoards, itemErrors, boardErrors,
    partial: !!(itemErrors.length || boardErrors.length),
    source: "NCSOFT public EU data via Cloudflare Pages"
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204, headers: {
        "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "accept, content-type"
      }
    });
    if (request.method !== "GET") return answer({ error: "Nur GET-Anfragen sind erlaubt." }, 405);
    if (url.search.length > 1200) return answer({ error: "Anfrage zu lang." }, 400);
    try {
      if (url.pathname === "/api/health")
        return answer({ ok: true, region: "eu", service: "aion2-character-proxy",
                        timestamp: new Date().toISOString() });
      if (url.pathname === "/api/search")
        return answer(await searchCharacter(url.searchParams), 200, 30);
      if (url.pathname === "/api/character") {
        const cache = typeof caches === "undefined" ? null : caches.default;
        if (cache) {
          const hit = await cache.match(request);
          if (hit) return hit;
        }
        const result = await characterData(url.searchParams);
        const response = answer(result, 200, result.partial ? 0 : 120);
        if (cache && !result.partial) ctx.waitUntil(cache.put(request, response.clone()));
        return response;
      }
      return answer({ error: "Unbekannte API-Route." }, 404);
    } catch (error) {
      if (error instanceof ApiError) return answer({ error: error.message }, error.status);
      return answer({ error: "Abruf vorübergehend nicht möglich." }, 502);
    }
  }
};
