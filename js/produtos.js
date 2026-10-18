// API_URL herdado de app.js

// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let produtos = [];
let produtosFiltrados = [];
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

// ── Normaliza snake_case → camelCase ────────────────────────
function normalizar(p) {
  return {
    id:        p.id,
    codigo:    p.codigo   || '',
    nome:      p.nome,
    categoria: p.categoria || '',
    unidade:   p.unidade  || '',
    preco:     p.preco,
    qtd:       p.qtd      ?? 0,
    qtdMin:    p.qtd_min  ?? 10,
    cor:       p.cor      || '',
    obs:       p.obs      || ''
  };
}

// ── Carrega produtos da API ──────────────────────────────────
async function carregarProdutos() {
  try {
    const data = await api('/produtos');
    if (!data) return;
    produtos          = data.map(normalizar);
    produtosFiltrados = [...produtos];
    renderTabela();
    atualizarCards();
  } catch (e) {
    console.error('Erro ao carregar produtos:', e.message);
  }
}

// ── Cards de métricas ────────────────────────────────────────
function atualizarCards() {
  const total   = produtos.length;
  const normal  = produtos.filter(p => getStatus(p.qtd, p.qtdMin).label === 'Normal').length;
  const baixo   = produtos.filter(p => getStatus(p.qtd, p.qtdMin).label === 'Baixo').length;
  const critico = produtos.filter(p => ['Crítico','Sem estoque'].includes(getStatus(p.qtd, p.qtdMin).label)).length;

  const vals = document.querySelectorAll('.stat-chip-val');
  if (vals[0]) vals[0].textContent = total;
  if (vals[1]) vals[1].textContent = normal;
  if (vals[2]) vals[2].textContent = baixo;
  if (vals[3]) vals[3].textContent = critico;
}

// ── INICIALIZAÇÃO ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  carregarProdutos();

  const modal = document.getElementById('modal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) fecharModal(); });
});

// ── RENDERIZA TABELA ─────────────────────────────────────────
function renderTabela() {
  const tbody = document.getElementById('tabela-body');
  const info  = document.getElementById('pag-info');
  if (!tbody || !info) return;

  if (!produtosFiltrados.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">📦 Nenhum produto encontrado</td></tr>`;
    info.textContent = 'Nenhum produto encontrado';
    return;
  }

  tbody.innerHTML = produtosFiltrados.map(p => {
    const s = getStatus(p.qtd, p.qtdMin);
    return `
      <tr>
        <td class="td-code">${p.codigo}</td>
        <td>
          <strong>${p.nome}</strong>
          ${p.cor ? `<br><small style="color:var(--muted)">${p.cor}</small>` : ''}
        </td>
        <td>${p.categoria}</td>
        <td class="td-price">R$ ${Number(p.preco).toFixed(2)}</td>
        <td class="${s.cls}">${p.qtd}</td>
        <td style="color:var(--muted)">${p.qtdMin}</td>
        <td><span class="badge ${s.badge}">${s.label}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn-action btn-edit"   onclick="editarProduto(${p.id})"  title="Editar">✏️</button>
            <button class="btn-action btn-delete" onclick="deletarProduto(${p.id})" title="Excluir">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  info.textContent = `Mostrando ${produtosFiltrados.length} de ${produtos.length} produtos`;
}

// ── STATUS ───────────────────────────────────────────────────
function getStatus(qtd, qtdMin) {
  if (qtd === 0)         return { label: 'Sem estoque', cls: 'critico', badge: 'badge-critical' };
  if (qtd < qtdMin / 2) return { label: 'Crítico',     cls: 'critico', badge: 'badge-critical' };
  if (qtd < qtdMin)     return { label: 'Baixo',        cls: 'baixo',   badge: 'badge-low'      };
  return                        { label: 'Normal',       cls: 'normal',  badge: 'badge-ok'       };
}

// ── FILTROS ──────────────────────────────────────────────────
function filtrar(q) {
  q = q.toLowerCase();
  produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(q) ||
    p.codigo.toLowerCase().includes(q) ||
    p.categoria.toLowerCase().includes(q)
  );
  renderTabela();
}

function filtrarCategoria(cat) {
  produtosFiltrados = cat ? produtos.filter(p => p.categoria === cat) : [...produtos];
  renderTabela();
}

function filtrarStatus(status) {
  produtosFiltrados = produtos.filter(p => {
    if (!status) return true;
    const s = getStatus(p.qtd, p.qtdMin).label.toLowerCase();
    if (status === 'ok')   return s === 'normal';
    if (status === 'low')  return s === 'baixo';
    if (status === 'crit') return s === 'crítico' || s === 'sem estoque';
    return true;
  });
  renderTabela();
}

// ── MODAL ────────────────────────────────────────────────────
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent = id ? '✏️ Editar Produto' : '➕ Novo Produto';

  if (id) {
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    document.getElementById('f-codigo').value    = p.codigo;
    document.getElementById('f-nome').value      = p.nome;
    document.getElementById('f-categoria').value = p.categoria;
    document.getElementById('f-preco').value     = p.preco;
    document.getElementById('f-qtd').value       = p.qtd;
    document.getElementById('f-qtd-min').value   = p.qtdMin;
    document.getElementById('f-cor').value       = p.cor;
    document.getElementById('f-obs').value       = p.obs;
  } else {
    document.getElementById('f-codigo').value    = gerarCodigo();
    document.getElementById('f-nome').value      = '';
    document.getElementById('f-categoria').value = '';
    document.getElementById('f-preco').value     = '';
    document.getElementById('f-qtd').value       = '';
    document.getElementById('f-qtd-min').value   = '10';
    document.getElementById('f-cor').value       = '';
    document.getElementById('f-obs').value       = '';
  }

  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR (POST / PUT) ──────────────────────────────────────
async function salvarProduto() {
  const nome  = document.getElementById('f-nome').value.trim();
  const cat   = document.getElementById('f-categoria').value;
  const preco = parseFloat(document.getElementById('f-preco').value);

  if (!nome || !cat || isNaN(preco)) {
    alert('Preencha os campos obrigatórios: Nome, Categoria e Preço');
    return;
  }

  const payload = {
    codigo:    document.getElementById('f-codigo').value,
    nome,
    categoria: cat,
    preco,
    qtd:     parseInt(document.getElementById('f-qtd').value)     || 0,
    qtd_min: parseInt(document.getElementById('f-qtd-min').value) || 10,
    cor:     document.getElementById('f-cor').value.trim(),
    obs:     document.getElementById('f-obs').value.trim()
  };

  try {
    if (editandoId) {
      await api(`/produtos/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/produtos', { method: 'POST', body: JSON.stringify(payload) });
    }
    fecharModal();
    await carregarProdutos();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
}

function editarProduto(id) { abrirModal(id); }

// ── DELETAR (DELETE) ─────────────────────────────────────────
async function deletarProduto(id) {
  const p = produtos.find(x => x.id === id);
  if (!p || !confirm(`Deseja excluir "${p.nome}"?`)) return;
  try {
    await api(`/produtos/${id}`, { method: 'DELETE' });
    await carregarProdutos();
  } catch (e) {
    alert('Erro ao excluir: ' + e.message);
  }
}

// ── UTILITÁRIOS ──────────────────────────────────────────────
function gerarCodigo() {
  const l = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
  return l[Math.floor(Math.random()*l.length)] + l[Math.floor(Math.random()*l.length)] +
         String(Math.floor(Math.random()*900)+100);
}

function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
