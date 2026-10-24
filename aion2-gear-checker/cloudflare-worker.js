/**
 * Daeva Gear EU — minimal read-only AION 2 proxy
 * Install in a free Cloudflare Worker, no secrets or dependencies.
 * Routes: /health, /search?name=, /character?server=&id=, /item?server=&id=&item=&slot=&enchant=
 * Whitelist only Vi.ki's documented public AION 2 JSON API.
 * See https://vi.ki/docs for public API and rate limits.
 */
const UPSTREAM = 'https://aion2.vi.ki/-/aion2/';
const ALLOWED_ORIGINS = new Set([
  'https://kai-022.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);
function respond(obj,status=200,origin='',extra={}) {
  const h=new Headers({
    'content-type':'application/json; charset=utf-8',
    'x-content-type-options':'nosniff',
    'cache-control':'no-store',
    'vary':'Origin',
    ...extra
  });
  if(ALLOWED_ORIGINS.has(origin)){
    h.set('access-control-allow-origin',origin);
    h.set('access-control-allow-methods','GET, OPTIONS');
    h.set('access-control-allow-headers','Accept, Content-Type');
    h.set('access-control-max-age','7200');
  }
  return new Response(JSON.stringify(obj),{status,headers:h});
}
function validId(s,max=256){
  return typeof s==='string' && s.length>0 && s.length<=max && !/[\x00-\x1f\x7f]/.test(s);
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    const origin=request.headers.get('Origin')||'';
    if(request.method==='OPTIONS')return respond({ok:true},200,origin);
    if(request.method!=='GET')return respond({error:'Nur GET-Anfragen erlaubt'},405,origin);
    if(url.pathname==='/health')return respond({ok:true,service:'Daeva Gear EU proxy',upstream:'Vi.ki',note:'Health check does not test the upstream service.'},200,origin);
    if(origin && !ALLOWED_ORIGINS.has(origin))return respond({error:'Origin nicht freigegeben'},403,origin);
    const search = url.pathname==='/search';
    const char = url.pathname==='/character';
    const item = url.pathname==='/item';
    if(!search&&!char&&!item)return respond({error:'Unbekannte Route'},404,origin);
    const q=new URLSearchParams({region:'eu'});
    let route,ttl;
    if(search){
      const name=(url.searchParams.get('name')||'').trim();
      if(name.length<2 || name.length>45 || /[\x00-\x1f\x7f]/.test(name))
        return respond({error:'Charaktername muss 2–45 Zeichen haben'},400,origin);
      q.set('name',name);
      route='search';ttl=120;
    } else {
      const server=url.searchParams.get('server'), id=url.searchParams.get('id');
      if(!validId(server,12)||!/^\d+$/.test(server)||!validId(id))
        return respond({error:'Server-ID oder Charakter-ID fehlt oder ist ungültig'},400,origin);
      q.set('server',server); q.set('id',id);
      if(char){route='character';ttl=180;}
      else {
        const slot=url.searchParams.get('slot'),itemId=url.searchParams.get('item'),enchant=url.searchParams.get('enchant')||'0';
        if(!validId(slot,14)||!/^\d+$/.test(slot)||!validId(itemId,30)||!/^\d+$/.test(itemId)||!/^\d+$/.test(enchant))
          return respond({error:'Gegenstandsparameter fehlen'},400,origin);
        q.set('slot',slot);q.set('item',itemId);q.set('enchant',enchant);
        route='item';ttl=300;
      }
    }
    const target=UPSTREAM+route+'?'+q.toString();
    const cacheKey=new Request(target);
    const cache=caches.default;
    try {
      const cached=await cache.match(cacheKey);
      if(cached) {
        const body=await cached.text();
        return new Response(body,{status:200,headers:{
          'content-type':'application/json; charset=utf-8',
          'cache-control':'no-store',
          'x-cache':'HIT',
          'vary':'Origin',
          ...(ALLOWED_ORIGINS.has(origin)?{'access-control-allow-origin':origin}: {})
        }});
      }
      const response=await fetch(target,{headers:{'Accept':'application/json'}});
      const body=await response.text();
      if(!response.ok)
        return respond({error:'Die öffentliche AION-2-Datenquelle antwortet mit HTTP '+response.status,upstream_status:response.status,ref:body.slice(0,220)},502,origin);
      if(body.length>3_000_000)
        return respond({error:'Antwort der Datenquelle ist zu groß'},502,origin);
      let json;
      try{json=JSON.parse(body);}catch{return respond({error:'Datenquelle hat kein JSON geliefert'},502,origin);}
      if(json && typeof json==='object' && json.error)
        return respond({error:json.error,code:json.code||null,ref:json.ref||null},502,origin);
      const serialized=JSON.stringify(json);
      ctx.waitUntil(cache.put(cacheKey,new Response(serialized,{headers:{
        'content-type':'application/json; charset=utf-8',
        'cache-control':'public,max-age='+ttl
      }})));
      return respond(json,200,origin,{'x-cache':'MISS'});
    } catch (e) {
      return respond({error:'Datenquelle nicht erreichbar',detail:String(e?.message||e).slice(0,180)},502,origin);
    }
  }
};
