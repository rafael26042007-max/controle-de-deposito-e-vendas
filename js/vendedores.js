// API_URL herdado de app.js

// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let vendedores = [];
let editandoId = null;

// ── Helper API ──────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {})
    }
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = 'login.html'; return null; }
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}`);
  }
  return res.json();
}

// ── Carrega vendedores da API ────────────────────────────────
async function carregarVendedores() {
  try {
    const data = await api('/vendedores');
    if (!data) return;
    vendedores = data;
    renderTabela();
    atualizarResumo();
  } catch (e) {
    console.error('Erro ao carregar vendedores:', e.message);
  }
}

// ── INICIALIZA ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  carregarVendedores();

  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) fecharModal();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });
});

// ── ATUALIZA RESUMO ──────────────────────────────────────────
function atualizarResumo() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('total-vendedores', vendedores.length);
  set('total-ativos',   vendedores.filter(v => v.status === 'ativo').length);
  set('total-inativos', vendedores.filter(v => v.status !== 'ativo').length);
}

// ── RENDERIZA TABELA ─────────────────────────────────────────
function renderTabela() {
  const tbody  = document.getElementById('tabela-body');
  const info   = document.getElementById('pag-info');
  const pesq   = (document.getElementById('pesquisa')?.value || '').toLowerCase();
  const status = document.getElementById('filtro-status')?.value || 'todos';

  const lista = vendedores.filter(v => {
    const textoOk = v.nome.toLowerCase().includes(pesq)
      || (v.codigo || '').toLowerCase().includes(pesq)
      || (v.email  || '').toLowerCase().includes(pesq)
      || (v.telefone || '').includes(pesq);
    const statusOk = status === 'todos' || v.status === status;
    return textoOk && statusOk;
  });

  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhum vendedor encontrado
        </td>
      </tr>`;
    if (info) info.textContent = 'Nenhum resultado';
    return;
  }

  tbody.innerHTML = lista.map(v => `
    <tr>
      <td class="td-code">${v.codigo || '—'}</td>
      <td>
        <strong>${v.nome}</strong>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Vendedor</div>
      </td>
      <td>${v.telefone || '—'}</td>
      <td>${v.email || '—'}</td>
      <td style="font-weight:700;color:var(--accent)">${v.comissao}%</td>
      <td>
        <span class="badge ${v.status === 'ativo' ? 'badge-green' : 'badge-muted'}">
          ${v.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button class="btn-action" onclick="abrirModal(${v.id})">✏️ Editar</button>
          <button class="btn-action ${v.status === 'ativo' ? 'desativar' : 'ativar'}"
                  onclick="alternarStatus(${v.id})">
            ${v.status === 'ativo' ? '⏸ Desativar' : '▶ Ativar'}
          </button>
        </div>
      </td>
    </tr>`).join('');

  if (info) info.textContent = `Mostrando ${lista.length} de ${vendedores.length} vendedores`;
}

// ── MODAL ────────────────────────────────────────────────────
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Vendedor' : '➕ Novo Vendedor';

  if (id) {
    const v = vendedores.find(x => x.id === id);
    if (!v) return;
    document.getElementById('f-codigo').value   = v.codigo   || '';
    document.getElementById('f-nome').value     = v.nome;
    document.getElementById('f-telefone').value = v.telefone || '';
    document.getElementById('f-email').value    = v.email    || '';
    document.getElementById('f-comissao').value = v.comissao;
    document.getElementById('f-status').value   = v.status;
  } else {
    document.getElementById('f-codigo').value   = gerarCodigo();
    document.getElementById('f-nome').value     = '';
    document.getElementById('f-telefone').value = '';
    document.getElementById('f-email').value    = '';
    document.getElementById('f-comissao').value = '5';
    document.getElementById('f-status').value   = 'ativo';
  }

  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR (POST / PUT) ──────────────────────────────────────
async function salvar() {
  const nome = document.getElementById('f-nome').value.trim();
  if (!nome) { alert('Preencha o nome do vendedor.'); return; }

  const payload = {
    codigo:   document.getElementById('f-codigo').value,
    nome,
    telefone: document.getElementById('f-telefone').value.trim(),
    email:    document.getElementById('f-email').value.trim(),
    comissao: parseFloat(document.getElementById('f-comissao').value) || 0,
    status:   document.getElementById('f-status').value,
  };

  try {
    if (editandoId) {
      await api(`/vendedores/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/vendedores', { method: 'POST', body: JSON.stringify(payload) });
    }
    fecharModal();
    await carregarVendedores();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
}

// ── ALTERNAR STATUS (PATCH) ──────────────────────────────────
async function alternarStatus(id) {
  try {
    await api(`/vendedores/${id}/status`, { method: 'PATCH' });
    await carregarVendedores();
  } catch (e) {
    alert('Erro ao alterar status: ' + e.message);
  }
}

// ── UTILITÁRIOS ──────────────────────────────────────────────
function gerarCodigo() {
  const num = String(vendedores.length + 1).padStart(3, '0');
  return `V${num}`;
}

function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
