// Service Worker — NhLençois ERP
const CACHE = 'nhlencois-v4';

// Arquivos do app para cache offline
const APP_FILES = [
  './',
  './index.html',
  './html/login.html',
  './html/dashboard.html',
  './html/produtos.html',
  './html/materia.html',
  './html/vendedores.html',
  './html/clientes.html',
  './html/producao.html',
  './html/vendas.html',
  './html/encomendas.html',
  './html/notas.html',
  './html/usuarios.html',
  './html/configuracoes.html',
  './css/style.css',
  './css/dashboard.css',
  './css/mobile.css',
  './css/produtos.css',
  './css/materia.css',
  './css/vendedores.css',
  './css/clientes.css',
  './css/producao.css',
  './css/vendas.css',
  './css/encomendas.css',
  './css/notas.css',
  './css/usuarios.css',
  './css/configuracoes.css',
  './js/app.js',
  './js/encomendas.js',
  './js/dashboard.js',
  './js/mobile.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png',
];

// Instala, pré-carrega e ativa imediatamente
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting())
  );
});

// Ativa e remove caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Estratégia: network-first com cache: "no-cache" para arquivos do app
// (sempre pergunta ao servidor se o arquivo mudou — igual ao pregão)
// API Render/Supabase: direto na rede, sem cache
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // APIs: nunca cacheia dados
  if (url.hostname.includes('onrender.com') || url.hostname.includes('supabase')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'Sem conexão' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Arquivos do próprio app: network-first com revalidação
  // cache: "no-cache" = sempre confirma com o servidor se mudou (ETag/304)
  // Se offline, usa a cópia salva
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  const fresh = e.request.mode === 'navigate'
    ? fetch(e.request.url, { cache: 'no-cache', credentials: 'include' })
    : fetch(e.request, { cache: 'no-cache' });

  e.respondWith(
    fresh
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
