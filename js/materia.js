// API_URL herdado de app.js

// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let materiais = [];
let editandoId = null;
let entradaId  = null;

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

// ── Normaliza snake_case → camelCase ────────────────────────
function normalizar(m) {
  return { ...m, qtdMin: m.qtd_min ?? 0 };
}

// ── INICIALIZA ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  carregarMateriais();
  atualizarLabels();

  document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) fecharModal();
  });
  document.getElementById('modal-entrada')?.addEventListener('click', function(e) {
    if (e.target === this) fecharEntrada();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { fecharModal(); fecharEntrada(); }
  });
  document.getElementById('f-unidade')?.addEventListener('change', atualizarLabels);
});

// ── CARREGA MATERIAIS ────────────────────────────────────────
async function carregarMateriais() {
  try {
    const data = await api('/materias');
    if (!data) return;
    materiais = data.map(normalizar);
    atualizarResumo();
    renderTabela();
  } catch (e) {
    console.error('Erro ao carregar materiais:', e.message);
  }
}

// ── ATUALIZA RESUMO ──────────────────────────────────────────
function atualizarResumo() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const total   = materiais.length;
  const critico = materiais.filter(m => getStatus(m).tipo === 'critico').length;
  const baixo   = materiais.filter(m => getStatus(m).tipo === 'baixo').length;
  const ok      = total - critico - baixo;
  set('total-materiais', total);
  set('total-ok',        ok);
  set('total-baixo',     baixo);
  set('total-critico',   critico);
}

// ── STATUS DO ESTOQUE ────────────────────────────────────────
function getStatus(m) {
  if (m.qtd <= 0)              return { tipo: 'critico', badge: 'badge-red',    label: 'Sem Estoque' };
  if (m.qtd <= m.qtdMin * 0.5) return { tipo: 'critico', badge: 'badge-red',    label: 'Crítico'    };
  if (m.qtd <= m.qtdMin)       return { tipo: 'baixo',   badge: 'badge-orange', label: 'Baixo'      };
  return                              { tipo: 'ok',      badge: 'badge-green',  label: 'Normal'     };
}

// ── LABEL DA UNIDADE ─────────────────────────────────────────
function labelUnidade(un) {
  if (un === 'kg') return 'Quilo (kg)';
  if (un === 'm')  return 'Metro (m)';
  return 'Unidade (un)';
}

// ── RENDERIZA TABELA ─────────────────────────────────────────
function renderTabela() {
  const tbody   = document.getElementById('tabela-body');
  const info    = document.getElementById('pag-info');
  const pesq    = (document.getElementById('pesquisa')?.value || '').toLowerCase();
  const unidade = document.getElementById('filtro-unidade')?.value || 'todos';
  const status  = document.getElementById('filtro-status')?.value  || 'todos';

  const lista = materiais.filter(m => {
    const textoOk   = m.nome.toLowerCase().includes(pesq)
      || (m.codigo    || '').toLowerCase().includes(pesq)
      || (m.categoria || '').toLowerCase().includes(pesq);
    const unidadeOk = unidade === 'todos' || m.unidade === unidade;
    const statusOk  = status  === 'todos' || getStatus(m).tipo === status;
    return textoOk && unidadeOk && statusOk;
  });

  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhum material encontrado
        </td>
      </tr>`;
    if (info) info.textContent = 'Nenhum resultado';
    return;
  }

  tbody.innerHTML = lista.map(m => {
    const st  = getStatus(m);
    const cls = st.tipo === 'critico' ? 'td-crit' : st.tipo === 'baixo' ? 'td-low' : 'td-ok';
    return `
      <tr>
        <td class="td-code">${m.codigo || '—'}</td>
        <td>
          <strong>${m.nome}</strong>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${m.categoria || ''}</div>
        </td>
        <td><span class="td-un">${labelUnidade(m.unidade)}</span></td>
        <td class="${cls}">${m.qtd % 1 === 0 ? m.qtd : Number(m.qtd).toFixed(2)} ${m.unidade}</td>
        <td style="color:var(--muted)">${m.qtdMin} ${m.unidade}</td>
        <td><span class="badge ${st.badge}">${st.label}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn-action" onclick="abrirEntrada(${m.id})">📥 Entrada</button>
            <button class="btn-action" onclick="abrirModal(${m.id})">✏️ Editar</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (info) info.textContent = `Mostrando ${lista.length} de ${materiais.length} materiais`;
}

// ── ATUALIZA LABELS DINÂMICOS ────────────────────────────────
function atualizarLabels() {
  const unidade = document.getElementById('f-unidade')?.value || 'un';
  const sufixo  = unidade === 'kg' ? '(kg)' : unidade === 'm' ? '(m)' : '(un)';
  const label    = document.getElementById('label-qtd');
  const labelMin = document.getElementById('label-min');
  if (label)    label.textContent    = `Quantidade inicial ${sufixo}`;
  if (labelMin) labelMin.textContent = `Quantidade Mínima ${sufixo}`;
}

// ── MODAL CADASTRO ───────────────────────────────────────────
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Material' : '➕ Nova Matéria-Prima';

  if (id) {
    const m = materiais.find(x => x.id === id);
    if (!m) return;
    document.getElementById('f-codigo').value   = m.codigo    || '';
    document.getElementById('f-nome').value     = m.nome;
    document.getElementById('f-categoria').value= m.categoria || 'Tecido';
    document.getElementById('f-unidade').value  = m.unidade;
    document.getElementById('f-qtd').value      = m.qtd;
    document.getElementById('f-qtd-min').value  = m.qtdMin;
    document.getElementById('f-obs').value      = m.obs       || '';
  } else {
    document.getElementById('f-codigo').value   = gerarCodigo();
    document.getElementById('f-nome').value     = '';
    document.getElementById('f-categoria').value= 'Tecido';
    document.getElementById('f-unidade').value  = 'kg';
    document.getElementById('f-qtd').value      = '';
    document.getElementById('f-qtd-min').value  = '';
    document.getElementById('f-obs').value      = '';
  }

  atualizarLabels();
  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR (POST / PUT) ──────────────────────────────────────
async function salvar() {
  const nome = document.getElementById('f-nome').value.trim();
  if (!nome) { alert('Preencha o nome do material.'); return; }

  const payload = {
    codigo:    document.getElementById('f-codigo').value,
    nome,
    categoria: document.getElementById('f-categoria').value,
    unidade:   document.getElementById('f-unidade').value,
    qtd:       parseFloat(document.getElementById('f-qtd').value)     || 0,
    qtd_min:   parseFloat(document.getElementById('f-qtd-min').value) || 0,
    obs:       document.getElementById('f-obs').value.trim(),
  };

  try {
    if (editandoId) {
      await api(`/materias/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/materias', { method: 'POST', body: JSON.stringify(payload) });
    }
    fecharModal();
    await carregarMateriais();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
}

// ── MODAL ENTRADA ────────────────────────────────────────────
function abrirEntrada(id) {
  entradaId = id;
  const m = materiais.find(x => x.id === id);
  if (!m) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('nome-entrada',    m.nome);
  set('entrada-atual',   `Estoque atual: ${m.qtd} ${m.unidade}`);
  set('label-entrada',   `Quantidade Entrando (${m.unidade})`);
  document.getElementById('f-entrada').value     = '';
  document.getElementById('f-entrada-obs').value = '';
  document.getElementById('f-entrada').step      = m.unidade === 'un' ? '1' : '0.01';
  document.getElementById('modal-entrada').classList.add('show');
}

function fecharEntrada() {
  document.getElementById('modal-entrada').classList.remove('show');
  entradaId = null;
}

async function confirmarEntrada() {
  const qtd = parseFloat(document.getElementById('f-entrada').value);
  if (!qtd || qtd <= 0) { alert('Informe uma quantidade válida.'); return; }
  const obs = document.getElementById('f-entrada-obs').value.trim();
  const m   = materiais.find(x => x.id === entradaId);

  try {
    await api(`/materias/${entradaId}/entrada`, {
      method: 'PATCH',
      body: JSON.stringify({ quantidade: qtd, obs })
    });
    fecharEntrada();
    await carregarMateriais();
    const novo = materiais.find(x => x.id === (m?.id ?? entradaId));
    alert(`✅ Entrada confirmada!\n\n+${qtd} ${m?.unidade || ''} de ${m?.nome || ''}\nNovo estoque: ${novo?.qtd ?? '—'} ${m?.unidade || ''}`);
  } catch (e) {
    alert('Erro ao registrar entrada: ' + e.message);
  }
}

// ── GERAR CÓDIGO ─────────────────────────────────────────────
function gerarCodigo() {
  const num = String(materiais.length + 1).padStart(3, '0');
  return `MP${num}`;
}

// ── DATA ─────────────────────────────────────────────────────
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
