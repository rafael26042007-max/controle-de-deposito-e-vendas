// ── mobile.js — hamburger menu + preferências de fonte + PWA ──

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

// ── Registra Service Worker (PWA) ──────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // O scope é relativo à localização do SW (raiz do repo no GitHub Pages)
    const swPath = '../sw.js';
    navigator.serviceWorker.register(swPath)
      .catch(() => {}); // silencia erro se SW não estiver disponível
  });
}
