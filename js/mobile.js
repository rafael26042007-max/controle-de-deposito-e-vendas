// ── mobile.js — hamburger menu + preferências de fonte + PWA ──

// ── Bloqueia DevTools para perfis não-admin ────────────────────
// (roda imediatamente, antes de qualquer outra coisa)
(function bloquearDevtools() {
  const perfil = localStorage.getItem('perfil');
  if (perfil === 'admin') return; // admins podem usar DevTools normalmente

  // Bloqueia F12 / Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+U
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12') {
      e.preventDefault(); e.stopImmediatePropagation(); return false;
    }
    if (e.ctrlKey && e.shiftKey && ['I','J','C','K'].includes(e.key.toUpperCase())) {
      e.preventDefault(); e.stopImmediatePropagation(); return false;
    }
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault(); e.stopImmediatePropagation(); return false;
    }
  }, true); // capture = true → captura antes do site processar

  // Bloqueia clique direito (inspecionar elemento)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  }, true);
})();

// ── Aplica tamanho de fonte salvo ──────────────────────────────
(function applyFont() {
  const f = localStorage.getItem('fontSize') || 'md';
  document.documentElement.dataset.font = f;
})();

// ── Sidebar mobile ─────────────────────────────────────────────
function openSidebar() {
  document.querySelector('.sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
  document.body.style.overflow = '';
}
function toggleSidebar() {
  const open = document.querySelector('.sidebar')?.classList.contains('open');
  open ? closeSidebar() : openSidebar();
}

// Fecha sidebar ao redimensionar para desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeSidebar();
});

// ── Registra Service Worker + detecta atualizações ────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../sw.js').then(reg => {

      // ── Quando uma nova versão do SW termina de instalar ──
      function aoInstalar(worker) {
        worker.addEventListener('statechange', () => {
          // 'installed' + controllerchange = nova versão esperando ativação
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            mostrarBannerAtualizacao(worker);
          }
        });
      }

      // SW já estava esperando quando a página carregou
      if (reg.waiting) {
        mostrarBannerAtualizacao(reg.waiting);
      }

      // Nova versão encontrada enquanto a página estava aberta
      reg.addEventListener('updatefound', () => {
        if (reg.installing) aoInstalar(reg.installing);
      });

      // Verifica por atualizações a cada 30 minutos
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);

    }).catch(() => {});

    // Quando o SW ativo muda (após SKIP_WAITING) → recarrega a página
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

// ── Banner de atualização disponível ──────────────────────────
function mostrarBannerAtualizacao(worker) {
  // Injeta o banner se ainda não existir
  if (!document.getElementById('update-banner')) {
    const el = document.createElement('div');
    el.id = 'update-banner';
    el.innerHTML = `
      <span class="upd-ico">🔄</span>
      <span class="upd-txt">Nova versão disponível!</span>
      <button class="upd-btn" id="btn-atualizar">Atualizar</button>
      <button class="upd-close" id="btn-fechar-banner" title="Fechar">✕</button>
    `;
    document.body.appendChild(el);

    document.getElementById('btn-atualizar').addEventListener('click', () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
      document.getElementById('update-banner').remove();
    });

    document.getElementById('btn-fechar-banner').addEventListener('click', () => {
      document.getElementById('update-banner').remove();
    });
  }
  // Torna visível (pode ter sido criado antes)
  document.getElementById('update-banner')?.classList.add('show');
}
