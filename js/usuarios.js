// API_URL herdado de app.js

// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let usuarios = [];
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

// ── INICIALIZA ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  carregarUsuarios();

  document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) fecharModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });
});

// ── CARREGA USUÁRIOS ─────────────────────────────────────────
async function carregarUsuarios() {
  try {
    const data = await api('/usuarios');
    if (!data) return;
    usuarios = data;
    atualizarResumo();
    renderTabela();
  } catch (e) {
    console.error('Erro ao carregar usuários:', e.message);
  }
}

// ── ATUALIZA RESUMO ──────────────────────────────────────────
function atualizarResumo() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('total-usuarios', usuarios.length);
  set('total-ativos',   usuarios.filter(u => u.status === 'ativo').length);
  set('total-inativos', usuarios.filter(u => u.status === 'inativo').length);
  set('total-admins',   usuarios.filter(u => u.perfil === 'admin').length);
}

// ── RENDERIZA TABELA ─────────────────────────────────────────
function renderTabela() {
  const tbody  = document.getElementById('tabela-body');
  const info   = document.getElementById('pag-info');
  const pesq   = (document.getElementById('pesquisa')?.value || '').toLowerCase();
  const perfil = document.getElementById('filtro-perfil')?.value || 'todos';
  const status = document.getElementById('filtro-status')?.value || 'todos';

  const lista = usuarios.filter(u => {
    const textoOk  = u.nome.toLowerCase().includes(pesq)
      || u.usuario.toLowerCase().includes(pesq)
      || (u.codigo || '').toLowerCase().includes(pesq);
    const perfilOk = perfil === 'todos' || u.perfil === perfil;
    const statusOk = status === 'todos' || u.status === status;
    return textoOk && perfilOk && statusOk;
  });

  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhum usuário encontrado
        </td>
      </tr>`;
    if (info) info.textContent = 'Nenhum resultado';
    return;
  }

  const badgePerfil = {
    admin:    '<span class="badge badge-blue">Admin</span>',
    vendedor: '<span class="badge badge-green">Vendedor</span>',
    producao: '<span class="badge badge-orange">Produção</span>',
  };

  tbody.innerHTML = lista.map(u => `
    <tr>
      <td class="td-code">${u.codigo || '—'}</td>
      <td><strong>${u.nome}</strong></td>
      <td style="color:var(--muted)">${u.usuario}</td>
      <td>${badgePerfil[u.perfil] || u.perfil}</td>
      <td>${u.status === 'ativo'
        ? '<span class="badge badge-green">Ativo</span>'
        : '<span class="badge badge-muted">Inativo</span>'}</td>
      <td>
        <div class="row-actions">
          <button class="btn-action" onclick="abrirModal(${u.id})">✏️ Editar</button>
          <button class="btn-action btn-danger" onclick="excluir(${u.id})">🗑 Excluir</button>
        </div>
      </td>
    </tr>`).join('');

  if (info) info.textContent = `Mostrando ${lista.length} de ${usuarios.length} usuários`;
}

// ── MODAL ────────────────────────────────────────────────────
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Usuário' : '➕ Novo Usuário';

  const senhaHint = document.getElementById('senha-hint');

  if (id) {
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    document.getElementById('f-nome').value    = u.nome;
    document.getElementById('f-usuario').value = u.usuario;
    document.getElementById('f-senha').value   = '';
    document.getElementById('f-perfil').value  = u.perfil;
    document.getElementById('f-status').value  = u.status;
    if (senhaHint) senhaHint.textContent = 'Deixe em branco para manter a senha atual.';
  } else {
    document.getElementById('f-nome').value    = '';
    document.getElementById('f-usuario').value = '';
    document.getElementById('f-senha').value   = '';
    document.getElementById('f-perfil').value  = 'vendedor';
    document.getElementById('f-status').value  = 'ativo';
    if (senhaHint) senhaHint.textContent = '';
  }

  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR (POST / PUT) ──────────────────────────────────────
async function salvar() {
  const nome    = document.getElementById('f-nome').value.trim();
  const usuario = document.getElementById('f-usuario').value.trim();
  const senha   = document.getElementById('f-senha').value;
  const perfil  = document.getElementById('f-perfil').value;
  const status  = document.getElementById('f-status').value;

  if (!nome || !usuario) {
    alert('Preencha nome e usuário.');
    return;
  }
  if (!editandoId && !senha) {
    alert('Informe a senha para o novo usuário.');
    return;
  }

  const payload = { nome, usuario, perfil, status };
  if (senha) payload.senha = senha;

  try {
    if (editandoId) {
      await api(`/usuarios/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/usuarios', { method: 'POST', body: JSON.stringify(payload) });
    }
    fecharModal();
    await carregarUsuarios();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
}

// ── EXCLUIR ──────────────────────────────────────────────────
async function excluir(id) {
  const u = usuarios.find(x => x.id === id);
  if (!confirm(`Excluir usuário "${u?.nome}"? Esta ação não pode ser desfeita.`)) return;

  try {
    await api(`/usuarios/${id}`, { method: 'DELETE' });
    await carregarUsuarios();
  } catch (e) {
    alert('Erro ao excluir: ' + e.message);
  }
}

// ── DATA ─────────────────────────────────────────────────────
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
