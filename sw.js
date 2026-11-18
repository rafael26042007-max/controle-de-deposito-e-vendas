// Service Worker — NhLençois ERP
const CACHE = 'nhlencois-v1';

// Arquivos estáticos para cache offline
const STATIC = [
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
  './css/notas.css',
  './css/usuarios.css',
  './css/configuracoes.css',
  './js/app.js',
  './js/dashboard.js',
  './js/mobile.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png',
];

// Instala e pré-carrega os arquivos estáticos
// NÃO chama skipWaiting() aqui — o app decide quando atualizar
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
});

// Recebe mensagem da página para ativar a nova versão
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Ativa e remove caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: network-first para API, cache-first para estáticos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Requisições à API: sempre tenta network; se falhar, retorna erro (sem cache de dados)
  if (url.hostname.includes('onrender.com') || url.hostname.includes('supabase')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: 'Sem conexão' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // Arquivos estáticos: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Armazena no cache somente respostas válidas
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
