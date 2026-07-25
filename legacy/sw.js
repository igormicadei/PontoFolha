/* Ponto & Folha — service worker: app offline após a 1ª visita */
const CACHE='pontofolha-v13';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  // app: cache-first (funciona offline); atualização chega quando o cache é renovado por nova versão do sw
  if(u.origin===location.origin){
    e.respondWith(
      caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{
        const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return res;
      }))
    );
    return;
  }
  // fontes do Google: cache oportunista (visual completo offline)
  if(u.hostname.endsWith('fonts.googleapis.com')||u.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
        const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return res;
      }).catch(()=>r))
    );
  }
  // BrasilAPI: sempre rede (o app já guarda os feriados no localStorage)
});
