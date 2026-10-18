// API_URL herdado de app.js

// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let clientes = [];
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

// ── Carrega clientes da API ──────────────────────────────────
async function carregarClientes() {
  try {
    const data = await api('/clientes');
    if (!data) return;
    clientes = data;
    atualizarResumo();
    renderTabela();
  } catch (e) {
    console.error('Erro ao carregar clientes:', e.message);
  }
}

// ── INICIALIZA ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  carregarClientes();

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
  set('total-clientes',   clientes.length);
  set('total-ativos',     clientes.filter(c => c.status === 'ativo').length);
  set('total-bloqueados', clientes.filter(c => c.status === 'bloqueado').length);
  set('total-atraso',     clientes.filter(c => c.atraso > 0).length);
}

// ── RENDERIZA TABELA ─────────────────────────────────────────
function renderTabela() {
  const tbody  = document.getElementById('tabela-body');
  const info   = document.getElementById('pag-info');
  const pesq   = (document.getElementById('pesquisa')?.value || '').toLowerCase();
  const status = document.getElementById('filtro-status')?.value || 'todos';

  const lista = clientes.filter(c => {
    const textoOk = c.nome.toLowerCase().includes(pesq)
      || (c.codigo   || '').toLowerCase().includes(pesq)
      || (c.telefone || '').includes(pesq)
      || (c.cidade   || '').toLowerCase().includes(pesq);
    const statusOk = status === 'todos' || c.status === status;
    return textoOk && statusOk;
  });

  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhum cliente encontrado
        </td>
      </tr>`;
    if (info) info.textContent = 'Nenhum resultado';
    return;
  }

  tbody.innerHTML = lista.map(c => {
    const badgeStatus = c.status === 'ativo'
      ? '<span class="badge badge-green">Ativo</span>'
      : '<span class="badge badge-red">Bloqueado</span>';

    const atrasoHtml = c.atraso > 0
      ? `<span class="atraso-chip">⚠ ${c.atraso} parcela${c.atraso > 1 ? 's' : ''} em atraso</span>`
      : '<span style="color:var(--muted);font-size:12px">Nenhuma</span>';

    const btnStatus = c.status === 'ativo'
      ? `<button class="btn-action bloquear"     onclick="alternarStatus(${c.id})">🔒 Bloquear</button>`
      : `<button class="btn-action desbloquear"  onclick="alternarStatus(${c.id})">🔓 Desbloquear</button>`;

    return `
      <tr>
        <td class="td-code">${c.codigo || '—'}</td>
        <td>
          <strong>${c.nome}</strong>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${c.cidade || ''} — ${c.estado || ''}</div>
        </td>
        <td>${c.telefone || '—'}</td>
        <td>${c.cidade || '—'}/${c.estado || '—'}</td>
        <td>${atrasoHtml}</td>
        <td>${badgeStatus}</td>
        <td>
          <div class="row-actions">
            <button class="btn-action" onclick="abrirModal(${c.id})">✏️ Editar</button>
            ${btnStatus}
          </div>
        </td>
      </tr>`;
  }).join('');

  if (info) info.textContent = `Mostrando ${lista.length} de ${clientes.length} clientes`;
}

// ── MODAL ────────────────────────────────────────────────────
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Cliente' : '➕ Novo Cliente';

  if (id) {
    const c = clientes.find(x => x.id === id);
    if (!c) return;
    document.getElementById('f-codigo').value    = c.codigo    || '';
    document.getElementById('f-nome').value      = c.nome;
    document.getElementById('f-telefone').value  = c.telefone  || '';
    document.getElementById('f-email').value     = c.email     || '';
    document.getElementById('f-documento').value = c.documento || '';
    document.getElementById('f-cidade').value    = c.cidade    || '';
    document.getElementById('f-estado').value    = c.estado    || '';
    document.getElementById('f-status').value    = c.status;
    document.getElementById('f-obs').value       = c.obs       || '';
  } else {
    document.getElementById('f-codigo').value    = gerarCodigo();
    document.getElementById('f-nome').value      = '';
    document.getElementById('f-telefone').value  = '';
    document.getElementById('f-email').value     = '';
    document.getElementById('f-documento').value = '';
    document.getElementById('f-cidade').value    = '';
    document.getElementById('f-estado').value    = '';
    document.getElementById('f-status').value    = 'ativo';
    document.getElementById('f-obs').value       = '';
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
  if (!nome) { alert('Preencha o nome do cliente.'); return; }

  const payload = {
    codigo:    document.getElementById('f-codigo').value,
    nome,
    telefone:  document.getElementById('f-telefone').value.trim(),
    email:     document.getElementById('f-email').value.trim(),
    documento: document.getElementById('f-documento').value.trim(),
    cidade:    document.getElementById('f-cidade').value.trim(),
    estado:    document.getElementById('f-estado').value,
    status:    document.getElementById('f-status').value,
    obs:       document.getElementById('f-obs').value.trim(),
  };

  try {
    if (editandoId) {
      await api(`/clientes/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/clientes', { method: 'POST', body: JSON.stringify(payload) });
    }
    fecharModal();
    await carregarClientes();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
}

// ── ALTERNAR STATUS (PATCH) ──────────────────────────────────
async function alternarStatus(id) {
  try {
    await api(`/clientes/${id}/status`, { method: 'PATCH' });
    await carregarClientes();
  } catch (e) {
    alert('Erro ao alterar status: ' + e.message);
  }
}

// ── UTILITÁRIOS ──────────────────────────────────────────────
function gerarCodigo() {
  const num = String(clientes.length + 1).padStart(3, '0');
  return `C${num}`;
}

function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
