
// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

const perfil = localStorage.getItem('perfil') || 'admin';
const nome   = localStorage.getItem('nome')   || 'Usuário';

// ── Helper API ──────────────────────────────────────────────
async function api(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = 'login.html';
    return null;
  }
  if (!res.ok) throw new Error(`Erro ${res.status} em ${path}`);
  return res.json();
}

// ── Utilitários ─────────────────────────────────────────────
function moeda(val) {
  return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function badgeVenda(status) {
  const mapa = {
    pendente:  ['badge-red',    'Pendente'],
    producao:  ['badge-orange', 'Produção'],
    enviado:   ['badge-blue',   'Enviado'],
    entregue:  ['badge-green',  'Entregue'],
    cancelado: ['badge-red',    'Cancelado'],
  };
  const s = (status || '').toLowerCase();
  const [cls, label] = mapa[s] || ['badge-blue', status || '—'];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Data atual na topbar ─────────────────────────────────────
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ── Nome do usuário ──────────────────────────────────────────
function atualizarUsuario() {
  const titulo = document.querySelector('.page-title');
  if (titulo) titulo.textContent = `${saudacao()}, ${nome} 👋`;

  const sidebarNome = document.querySelector('.sidebar-user-name');
  if (sidebarNome) sidebarNome.textContent = nome;

  const sidebarRole = document.querySelector('.sidebar-user-role');
  if (sidebarRole) {
    const labels = { admin: 'Admin', vendedor: 'Vendedor', financeiro: 'Financeiro' };
    sidebarRole.textContent = labels[perfil] || perfil;
  }
}

// ── Métricas ─────────────────────────────────────────────────
function preencherMetricas(produtos, vendas, vendedores) {
  const cards = document.querySelectorAll('.metric-card');

  // Card 0 — Produtos em estoque
  if (cards[0] && produtos) {
    const total = produtos.length;
    const baixo = produtos.filter(p => {
      const est = p.qtd     ?? 0;
      const min = p.qtd_min ?? 0;
      return min > 0 && est <= min;
    }).length;
    cards[0].querySelector('.metric-val').textContent = total;
    cards[0].querySelector('.metric-sub').textContent =
      baixo > 0 ? `${baixo} produto${baixo > 1 ? 's' : ''} com estoque baixo` : 'Estoque normalizado';
  }

  // Card 1 — Vendas do mês
  if (cards[1] && vendas) {
    const agora = new Date();
    const doMes = vendas.filter(v => {
      // data vem como "13/11/2026 10:00" (dd/mm/yyyy HH:MM)
      const raw = v.data || '';
      const [dmy] = raw.split(' ');
      const [dd, mm, yyyy] = (dmy || '').split('/').map(Number);
      if (!yyyy) return false;
      return (mm - 1) === agora.getMonth() && yyyy === agora.getFullYear();
    });
    const totalMes = doMes.reduce((s, v) => s + (v.total || 0), 0);
    cards[1].querySelector('.metric-val').textContent = moeda(totalMes);
    cards[1].querySelector('.metric-sub').textContent =
      `${doMes.length} venda${doMes.length !== 1 ? 's' : ''} no mês`;
  }

  // Card 2 — Vendedores ativos
  if (cards[2] && vendedores) {
    const ativos = vendedores.filter(v => v.status === 'ativo').length;
    cards[2].querySelector('.metric-val').textContent = ativos;
    cards[2].querySelector('.metric-sub').textContent =
      `${ativos} ativo${ativos !== 1 ? 's' : ''}`;
  }

  // Card 3 — Parcelas em atraso (calculado das vendas se endpoint não existir)
  if (cards[3]) {
    let atrasadas = 0;
    if (vendas) {
      atrasadas = vendas.filter(v =>
        v.status === 'atraso'
      ).length;
    }
    cards[3].querySelector('.metric-val').textContent = atrasadas;
    cards[3].querySelector('.metric-sub').textContent =
      atrasadas > 0 ? `${atrasadas} venda${atrasadas !== 1 ? 's' : ''} com atraso` : 'Sem atrasos';
  }
}

// ── Tabela últimas vendas ────────────────────────────────────
function preencherUltimasVendas(vendas) {
  const tbody = document.getElementById('tbody-vendas');
  if (!tbody) return;

  if (!vendas || !vendas.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1.5rem">Nenhuma venda registrada</td></tr>';
    return;
  }

  // data vem como "13/11/2026 10:00" — converte para timestamp comparável
  function dataTs(v) {
    const raw = v.data || '';
    const [dmy] = raw.split(' ');
    const [dd, mm, yyyy] = (dmy || '').split('/').map(Number);
    return yyyy ? new Date(yyyy, mm - 1, dd).getTime() : 0;
  }

  const ultimas = [...vendas]
    .sort((a, b) => dataTs(b) - dataTs(a))
    .slice(0, 5);

  tbody.innerHTML = ultimas.map(v => `
    <tr>
      <td>${v.cliente_nome || v.cliente || '—'}</td>
      <td>${v.vendedor_nome || v.vendedor || '—'}</td>
      <td>${moeda(v.total || 0)}</td>
      <td>${badgeVenda(v.status)}</td>
    </tr>
  `).join('');
}

// ── Alertas ──────────────────────────────────────────────────
function preencherAlertas(produtos) {
  const body  = document.getElementById('alertas-body');
  const badge = document.getElementById('badge-alertas');
  if (!body) return;
  const alertas = [];

  if (produtos) {
    produtos
      .filter(p => {
        const est = p.qtd     ?? 0;
        const min = p.qtd_min ?? 0;
        return min > 0 && est <= min;
      })
      .slice(0, 5)
      .forEach(p => {
        const est = p.qtd     ?? 0;
        const min = p.qtd_min ?? 0;
        const critico = est <= Math.floor(min * 0.5);
        alertas.push({
          ico:   critico ? '🔴' : '🟡',
          titulo: p.nome,
          sub:   `Estoque ${critico ? 'crítico' : 'baixo'} — apenas ${est} unidade${est !== 1 ? 's' : ''}`,
          info:  `Produto · Estoque mínimo: ${min}`
        });
      });
  }

  if (badge) {
    badge.textContent = alertas.length;
    badge.style.display = alertas.length > 0 ? '' : 'none';
  }

  if (!alertas.length) {
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted)">Sem alertas no momento ✅</div>';
    return;
  }

  body.innerHTML = alertas.map(a => `
    <div class="alert-item">
      <div class="alert-ico">${a.ico}</div>
      <div class="alert-body">
        <div class="alert-title">${a.titulo}</div>
        <div class="alert-sub">${a.sub}</div>
        <div class="alert-time">${a.info}</div>
      </div>
    </div>
  `).join('');
}

// ── Tabela estoque baixo ─────────────────────────────────────
function preencherEstoqueBaixo(produtos) {
  const tbody = document.getElementById('tbody-estoque-baixo');
  if (!tbody) return;

  if (!produtos) return;

  const baixo = produtos
    .filter(p => {
      const est = p.qtd     ?? 0;
      const min = p.qtd_min ?? 0;
      return min > 0 && est <= min;
    })
    .sort((a, b) => {
      const rA = (a.qtd ?? 0) / Math.max(a.qtd_min ?? 1, 1);
      const rB = (b.qtd ?? 0) / Math.max(b.qtd_min ?? 1, 1);
      return rA - rB; // mais críticos primeiro
    });

  if (!baixo.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:1.5rem">Nenhum produto com estoque baixo 🎉</td></tr>';
    return;
  }

  tbody.innerHTML = baixo.slice(0, 10).map(p => {
    const est = p.qtd     ?? 0;
    const min = p.qtd_min ?? 0;
    const critico = est <= Math.floor(min * 0.5);
    const cor   = critico ? 'var(--red)' : 'var(--accent)';
    const badge = critico
      ? '<span class="badge badge-red">Crítico</span>'
      : '<span class="badge badge-orange">Baixo</span>';
    return `
      <tr>
        <td style="color:var(--muted);font-family:monospace">${p.codigo || '—'}</td>
        <td>${p.nome || '—'}</td>
        <td>${p.categoria || '—'}</td>
        <td style="color:${cor};font-weight:700">${est}</td>
        <td style="color:var(--muted)">${min}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join('');
}

// ── Logout ───────────────────────────────────────────────────
document.querySelector('.sidebar-user-exit')?.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

// ── Init ─────────────────────────────────────────────────────
atualizarData();
atualizarUsuario();

(async () => {
  const [resProdutos, resVendas, resVendedores] = await Promise.allSettled([
    api('/produtos'),
    api('/vendas'),
    api('/vendedores'),
  ]);

  const produtos    = resProdutos.status    === 'fulfilled' ? resProdutos.value    : null;
  const vendas      = resVendas.status      === 'fulfilled' ? resVendas.value      : null;
  const vendedores  = resVendedores.status  === 'fulfilled' ? resVendedores.value  : null;

  preencherMetricas(produtos, vendas, vendedores);
  preencherUltimasVendas(vendas);
  preencherAlertas(produtos);
  preencherEstoqueBaixo(produtos);
})();
