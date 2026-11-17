// API_URL herdado de app.js
// ── Auth guard + perfil guard ────────────────────────────────
{
  const _t = localStorage.getItem('token');
  if (!_t) window.location.href = 'login.html';
  // BUG-FIX: apenas admin e producao podem acessar esta página
  const _p = localStorage.getItem('perfil');
  if (!['admin', 'producao'].includes(_p)) window.location.href = 'dashboard.html';
}

// ── Auth guard ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ── Receitas: produto_id → ingredientes ─────────────────────
// ATENÇÃO: materia_id deve corresponder aos IDs reais do banco
const RECEITAS = {
  1: [ { materia_id: 1, qtd: 3   }, { materia_id: 2, qtd: 4 }, { materia_id: 4, qtd: 1   } ],
  2: [ { materia_id: 1, qtd: 2   }, { materia_id: 2, qtd: 3 }, { materia_id: 4, qtd: 1   } ],
  3: [ { materia_id: 1, qtd: 0.5 }, { materia_id: 2, qtd: 1 }                               ],
  4: [ { materia_id: 1, qtd: 1.5 }, { materia_id: 2, qtd: 2 }, { materia_id: 3, qtd: 0.5 } ],
  5: [ { materia_id: 1, qtd: 1.8 }, { materia_id: 2, qtd: 2 }, { materia_id: 3, qtd: 0.5 } ],
};

let produtos   = [];
let materiais  = [];
let produtoAtual  = null;
let podeProduzir  = false;

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
document.addEventListener('DOMContentLoaded', async () => {
  atualizarData();
  await carregarDados();
  await renderHistorico();
});

// ── CARREGA PRODUTOS, MATÉRIAS E HISTÓRICO ───────────────────
async function carregarDados() {
  try {
    const [prods, mats] = await Promise.all([
      api('/produtos'),
      api('/materias'),
    ]);

    produtos  = prods  || [];
    materiais = (mats  || []).map(m => ({ ...m, qtdMin: m.qtd_min ?? 0 }));

    // Popula select de produtos — só os que têm receita cadastrada
    const sel = document.getElementById('sel-produto');
    if (sel) {
      sel.innerHTML = '<option value="">Selecione o produto...</option>'
        + produtos
            .filter(p => RECEITAS[p.id])
            .map(p => `<option value="${p.id}">${p.nome}</option>`)
            .join('');
    }
  } catch (e) {
    console.error('Erro ao carregar dados:', e.message);
  }
}

// ── SELECIONA PRODUTO ────────────────────────────────────────
function selecionarProduto() {
  const id = parseInt(document.getElementById('sel-produto').value);

  if (!id) {
    document.getElementById('produto-info').classList.remove('show');
    document.getElementById('lista-receita').innerHTML = '';
    produtoAtual = null;
    return;
  }

  const prod      = produtos.find(p => p.id === id);
  const receita   = RECEITAS[id];
  if (!prod || !receita) return;

  produtoAtual = { ...prod, ingredientes: receita };

  document.getElementById('pib-nome').textContent = prod.nome;
  document.getElementById('pib-sub').textContent  =
    `Estoque atual: ${prod.qtd ?? 0} unidades`;
  document.getElementById('produto-info').classList.add('show');

  renderReceita();
  simularProducao();
}

// ── RENDERIZA RECEITA ────────────────────────────────────────
function renderReceita() {
  if (!produtoAtual) return;
  const lista = document.getElementById('lista-receita');
  if (!lista) return;

  lista.innerHTML = produtoAtual.ingredientes.map(ing => {
    const mat = materiais.find(m => m.id === ing.materia_id);
    if (!mat) return `<div class="receita-item"><div class="receita-nome">Matéria ${ing.materia_id} não encontrada</div></div>`;
    const ok = parseFloat(mat.qtd) >= ing.qtd;
    return `
      <div class="receita-item">
        <div>
          <div class="receita-nome">${mat.nome}</div>
          <div class="receita-qtd">${ing.qtd} ${mat.unidade} por unidade</div>
        </div>
        <div class="${ok ? 'receita-estoque-ok' : 'receita-estoque-low'}">
          Disponível: ${mat.qtd} ${mat.unidade}
        </div>
      </div>`;
  }).join('');
}

// ── SIMULA PRODUÇÃO ──────────────────────────────────────────
function simularProducao() {
  if (!produtoAtual) return;

  const qtd      = parseInt(document.getElementById('qtd-produzir').value) || 0;
  const resultDiv = document.getElementById('simulacao-result');
  const alertDiv  = document.getElementById('alert-insuf');
  const btnConf   = document.getElementById('btn-confirmar');

  if (qtd <= 0) {
    if (resultDiv) resultDiv.innerHTML = '';
    alertDiv?.classList.remove('show');
    if (btnConf) btnConf.disabled = true;
    podeProduzir = false;
    return;
  }

  let temTudo = true;
  const linhas = produtoAtual.ingredientes.map(ing => {
    const mat        = materiais.find(m => m.id === ing.materia_id);
    if (!mat) return '';
    const necessario = ing.qtd * qtd;
    const suficiente = parseFloat(mat.qtd) >= necessario;
    if (!suficiente) temTudo = false;
    return `
      <div class="sim-row">
        <span class="sim-label">${mat.nome}</span>
        <span class="${suficiente ? 'sim-ok' : 'sim-err'}">
          ${necessario} ${mat.unidade} ${suficiente ? '✓' : '✗ Insuficiente'}
        </span>
      </div>`;
  }).join('');

  if (resultDiv) resultDiv.innerHTML = `
    <div class="simulacao-box">
      ${linhas}
      <div class="sim-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:8px">
        <span class="sim-label">Unidades a produzir</span>
        <span class="sim-total">+${qtd} unidades</span>
      </div>
    </div>`;

  podeProduzir = temTudo;
  alertDiv?.classList.toggle('show', !temTudo);
  if (btnConf) btnConf.disabled = !temTudo;
}

// ── CONFIRMA PRODUÇÃO (POST) ─────────────────────────────────
async function confirmarProducao() {
  if (!produtoAtual || !podeProduzir) return;

  const qtd = parseInt(document.getElementById('qtd-produzir').value);
  const deducoes = produtoAtual.ingredientes.map(ing => ({
    materia_id: ing.materia_id,
    qtd: ing.qtd * qtd,
  }));

  const payload = {
    produto_id: produtoAtual.id,
    qtd,
    deducoes,
  };

  try {
    await api('/producao', { method: 'POST', body: JSON.stringify(payload) });

    // Recarrega dados para refletir novo estoque
    await carregarDados();
    await renderHistorico();

    // Atualiza card do produto selecionado
    const prod = produtos.find(p => p.id === produtoAtual.id);
    if (prod) {
      produtoAtual = { ...produtoAtual, ...prod };
      document.getElementById('pib-sub').textContent =
        `Estoque atual: ${prod.qtd ?? 0} unidades`;
    }

    document.getElementById('qtd-produzir').value = '';
    document.getElementById('simulacao-result').innerHTML = '';
    document.getElementById('alert-insuf')?.classList.remove('show');
    if (document.getElementById('btn-confirmar')) document.getElementById('btn-confirmar').disabled = true;
    podeProduzir = false;

    renderReceita();
    alert(`✅ Produção confirmada!\n\n+${qtd} unidades de ${produtoAtual.nome} adicionadas ao estoque.`);
  } catch (e) {
    alert('Erro ao confirmar produção: ' + e.message);
  }
}

// ── RENDERIZA HISTÓRICO (GET) ────────────────────────────────
async function renderHistorico() {
  const lista  = document.getElementById('historico-lista');
  const totEl  = document.getElementById('hist-total');
  if (!lista) return;

  try {
    const historico = await api('/producao') || [];
    if (totEl) totEl.textContent = `${historico.length} registro${historico.length !== 1 ? 's' : ''}`;

    if (historico.length === 0) {
      lista.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--muted)">
          <div style="font-size:36px;margin-bottom:10px">🏭</div>
          <div>Nenhuma produção registrada ainda</div>
        </div>`;
      return;
    }

    lista.innerHTML = historico.map(h => `
      <div class="hist-row">
        <div class="hist-ico">🏭</div>
        <div class="hist-info">
          <div class="hist-nome">${h.produto}</div>
          <div class="hist-sub">${h.obs || '—'}</div>
        </div>
        <div class="hist-right">
          <div class="hist-qtd">+${h.qtd} un.</div>
          <div class="hist-data">${h.data || '—'}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    console.error('Erro ao carregar histórico:', e.message);
  }
}

// ── DATA ─────────────────────────────────────────────────────
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
