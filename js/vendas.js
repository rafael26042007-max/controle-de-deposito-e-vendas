// API_URL herdado de app.js

// ── Auth guard + perfil guard ────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';
// BUG-FIX: apenas admin e vendedor podem acessar esta página
const _perfil = localStorage.getItem('perfil');
if (!['admin', 'vendedor'].includes(_perfil)) window.location.href = 'dashboard.html';

let vendas   = [];
let carrinho = [];   // [{produto_id, produto, preco_unit, qtd, subtotal}]

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
  carregarVendas();

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

// ── CARREGA VENDAS ──────────────────────────────────────────
async function carregarVendas() {
  try {
    const data = await api('/vendas');
    if (!data) return;
    vendas = data;
    atualizarResumo();
    renderTabela();
  } catch (e) {
    console.error('Erro ao carregar vendas:', e.message);
  }
}

// ── RESUMO ──────────────────────────────────────────────────
function atualizarResumo() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const total  = vendas.length;
  const valor  = vendas.reduce((s, v) => s + v.total, 0);
  const pend   = vendas.filter(v => v.status === 'pendente' || v.status === 'producao').length;
  const atraso = vendas.filter(v => v.status === 'atraso').length;

  set('total-vendas',    total);
  set('total-valor',     'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  set('total-pendentes', pend);
  set('total-atraso',    atraso);
}

// ── TABELA ───────────────────────────────────────────────────
function renderTabela() {
  const tbody  = document.getElementById('tabela-body');
  const info   = document.getElementById('pag-info');
  const pesq   = (document.getElementById('pesquisa')?.value || '').toLowerCase();
  const status = document.getElementById('filtro-status')?.value || 'todos';

  const lista = vendas.filter(v => {
    const textoOk = v.cliente.toLowerCase().includes(pesq)
      || v.vendedor.toLowerCase().includes(pesq)
      || v.codigo.toLowerCase().includes(pesq)
      || v.produto.toLowerCase().includes(pesq);
    const statusOk = status === 'todos' || v.status === status;
    return textoOk && statusOk;
  });

  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhuma venda encontrada
        </td>
      </tr>`;
    if (info) info.textContent = 'Nenhum resultado';
    return;
  }

  const badgeMap = {
    pendente: '<span class="badge badge-muted">Pendente</span>',
    producao: '<span class="badge badge-orange">Em Produção</span>',
    enviado:  '<span class="badge badge-blue">Enviado</span>',
    entregue: '<span class="badge badge-green">Entregue</span>',
    atraso:   '<span class="badge badge-red">Em Atraso</span>',
  };

  tbody.innerHTML = lista.map(v => `
    <tr>
      <td class="td-code">${v.codigo}</td>
      <td>
        <strong>${v.cliente}</strong>
        ${v.cliente_status === 'bloqueado' ? ' <span style="color:var(--danger);font-size:11px">🔒</span>' : ''}
      </td>
      <td>${v.vendedor}</td>
      <td>
        ${v.produto}
        <div style="font-size:11px;color:var(--muted);margin-top:2px">
          ${v.itens && v.itens.length > 1 ? v.itens.length + ' itens · ' : ''}Qtd total: ${v.qtd}
        </div>
      </td>
      <td style="color:var(--muted)">${v.parcelas}x</td>
      <td class="td-valor">R$ ${v.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${badgeMap[v.status] || ''}</td>
      <td>
        <div class="row-actions">
          <button class="btn-action" onclick="verDetalhes(${v.id})">👁 Ver</button>
          ${v.status !== 'entregue' && v.status !== 'atraso'
            ? `<button class="btn-action" onclick="mudarStatus(${v.id})">↻ Avançar</button>`
            : ''}
        </div>
      </td>
    </tr>`).join('');

  if (info) info.textContent = `Mostrando ${lista.length} de ${vendas.length} vendas`;
}

// ── MODAL: ABRIR / FECHAR ────────────────────────────────────
async function abrirModal() {
  document.getElementById('modal-title').textContent = '🛒 Nova Venda';
  document.getElementById('venda-resumo').style.display = 'none';

  const parcBox = document.getElementById('parcelas-box');
  if (parcBox) parcBox.classList.remove('show');

  const alertBloq = document.getElementById('alert-bloqueado');
  if (alertBloq) alertBloq.classList.remove('show');

  const btnSalvar = document.getElementById('btn-salvar');
  if (btnSalvar) btnSalvar.disabled = false;

  // Resetar carrinho
  carrinho = [];
  renderCarrinho();

  // Carrega selects em paralelo
  try {
    const [clientes, vendedores, produtos] = await Promise.all([
      api('/clientes'),
      api('/vendedores'),
      api('/produtos'),
    ]);

    const selCliente  = document.getElementById('f-cliente');
    const selVendedor = document.getElementById('f-vendedor');
    const selProduto  = document.getElementById('f-produto');

    if (selCliente && clientes) {
      selCliente.innerHTML = '<option value="">Selecione o cliente...</option>'
        + clientes.map(c =>
            `<option value="${c.id}" data-status="${c.status}">${c.nome}${c.status === 'bloqueado' ? ' 🔒' : ''}</option>`
          ).join('');
    }

    if (selVendedor && vendedores) {
      const ativos = vendedores.filter(v => v.status === 'ativo');
      selVendedor.innerHTML = '<option value="">Selecione o vendedor...</option>'
        + ativos.map(v => `<option value="${v.id}">${v.nome}</option>`).join('');
    }

    if (selProduto && produtos) {
      selProduto.innerHTML = '<option value="">Selecione o produto...</option>'
        + produtos.map(p =>
            `<option value="${p.id}" data-preco="${p.preco}">${p.nome} — R$ ${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>`
          ).join('');
    }
  } catch (e) {
    console.error('Erro ao carregar dados do modal:', e.message);
  }

  document.getElementById('f-qtd').value = '';
  document.getElementById('f-parcelas').value = '1';
  document.getElementById('f-status').value = 'pendente';

  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
}

// ── VERIFICAR CLIENTE BLOQUEADO ──────────────────────────────
function verificarCliente() {
  const sel    = document.getElementById('f-cliente');
  const opt    = sel.options[sel.selectedIndex];
  const bloq   = opt?.dataset?.status === 'bloqueado';
  const alerta = document.getElementById('alert-bloqueado');
  const btn    = document.getElementById('btn-salvar');
  if (alerta) bloq ? alerta.classList.add('show') : alerta.classList.remove('show');
  if (btn) btn.disabled = bloq;
}

// ── CARRINHO ─────────────────────────────────────────────────

function adicionarItem() {
  const selProduto = document.getElementById('f-produto');
  const produtoId  = parseInt(selProduto.value);
  const opt        = selProduto.options[selProduto.selectedIndex];
  const qtd        = parseInt(document.getElementById('f-qtd').value) || 0;

  if (!produtoId) { alert('Selecione um produto.'); return; }
  if (qtd <= 0)   { alert('Informe uma quantidade válida.'); return; }

  const preco   = parseFloat(opt.dataset.preco) || 0;
  const nome    = opt.textContent.split(' — ')[0].trim();

  // Se produto já está no carrinho, incrementa a qtd
  const existente = carrinho.find(it => it.produto_id === produtoId);
  if (existente) {
    existente.qtd      += qtd;
    existente.subtotal  = existente.preco_unit * existente.qtd;
  } else {
    carrinho.push({
      produto_id: produtoId,
      produto:    nome,
      preco_unit: preco,
      qtd:        qtd,
      subtotal:   preco * qtd,
    });
  }

  // Resetar seleção
  selProduto.value = '';
  document.getElementById('f-qtd').value = '';

  renderCarrinho();
  calcularTotal();
}

function removerItem(idx) {
  carrinho.splice(idx, 1);
  renderCarrinho();
  calcularTotal();
}

function renderCarrinho() {
  const vazio  = document.getElementById('carrinho-vazio');
  const tabela = document.getElementById('carrinho-tabela');
  const tbody  = document.getElementById('carrinho-body');

  if (!tbody) return;

  if (carrinho.length === 0) {
    if (vazio)  vazio.style.display  = 'block';
    if (tabela) tabela.style.display = 'none';
    return;
  }

  if (vazio)  vazio.style.display  = 'none';
  if (tabela) tabela.style.display = 'table';

  tbody.innerHTML = carrinho.map((it, i) => `
    <tr>
      <td>${it.produto}</td>
      <td>${it.qtd}</td>
      <td>R$ ${it.preco_unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>R$ ${it.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td><button class="btn-remove-item" onclick="removerItem(${i})" title="Remover">✕</button></td>
    </tr>`).join('');
}

// ── CALCULA TOTAL ────────────────────────────────────────────
function calcularTotal() {
  const parcelas = parseInt(document.getElementById('f-parcelas').value) || 1;
  const resumo   = document.getElementById('venda-resumo');
  const parcBox  = document.getElementById('parcelas-box');

  if (carrinho.length === 0) {
    if (resumo)  resumo.style.display = 'none';
    if (parcBox) parcBox.classList.remove('show');
    return;
  }

  const subtotal = carrinho.reduce((s, it) => s + it.subtotal, 0);
  const juros    = parcelas >= 3 ? subtotal * 0.01 * (parcelas - 2) : 0;
  const total    = subtotal + juros;
  const valParc  = total / parcelas;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('r-subtotal', 'R$ ' + subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  set('r-juros',    juros > 0 ? 'R$ ' + juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '— Sem juros');
  set('r-total',    'R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));

  if (resumo) resumo.style.display = 'block';

  // Parcelas
  const hoje = new Date();
  let html = '';
  for (let i = 1; i <= parcelas; i++) {
    const venc = new Date(hoje);
    venc.setMonth(venc.getMonth() + i);
    html += `
      <div class="parcela-row">
        <span class="parcela-num">${i}ª parcela</span>
        <span class="parcela-val">R$ ${valParc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <span style="color:var(--muted);font-size:11px">${venc.toLocaleDateString('pt-BR')}</span>
        ${parcelas >= 3 && i >= 3 ? '<span class="parcela-juros">+ juros 1%</span>' : ''}
      </div>`;
  }
  const listaEl = document.getElementById('parcelas-lista');
  if (listaEl) listaEl.innerHTML = html;
  if (parcBox) parcBox.classList.add('show');
}

// ── SALVAR (POST) ────────────────────────────────────────────
async function salvar() {
  const clienteId  = parseInt(document.getElementById('f-cliente').value);
  const vendedorId = parseInt(document.getElementById('f-vendedor').value);
  const parcelas   = parseInt(document.getElementById('f-parcelas').value) || 1;
  const status     = document.getElementById('f-status').value;

  if (!clienteId)       { alert('Selecione o cliente.');           return; }
  if (!vendedorId)      { alert('Selecione o vendedor.');          return; }
  if (carrinho.length === 0) { alert('Adicione pelo menos um produto.'); return; }

  const subtotal = carrinho.reduce((s, it) => s + it.subtotal, 0);
  const juros    = parcelas >= 3 ? subtotal * 0.01 * (parcelas - 2) : 0;

  const payload = {
    cliente_id:  clienteId,
    vendedor_id: vendedorId,
    itens:       carrinho.map(it => ({
      produto_id: it.produto_id,
      qtd:        it.qtd,
      preco_unit: it.preco_unit,
    })),
    juros,
    parcelas,
    status,
  };

  try {
    await api('/vendas', { method: 'POST', body: JSON.stringify(payload) });
    fecharModal();
    await carregarVendas();
  } catch (e) {
    alert('Erro ao salvar venda: ' + e.message);
  }
}

// ── MUDAR STATUS (PATCH) ─────────────────────────────────────
async function mudarStatus(id) {
  try {
    await api(`/vendas/${id}/status`, { method: 'PATCH' });
    await carregarVendas();
  } catch (e) {
    alert('Erro ao avançar status: ' + e.message);
  }
}

// ── VER DETALHES ─────────────────────────────────────────────
function verDetalhes(id) {
  const v = vendas.find(x => x.id === id);
  if (!v) return;

  const itensTexto = (v.itens || []).map(it =>
    `  • ${it.produto} × ${it.qtd} = R$ ${it.subtotal.toFixed(2)}`
  ).join('\n') || `  • ${v.produto} × ${v.qtd}`;

  alert(
    `📋 Venda ${v.codigo}\n\n` +
    `Data: ${v.data || '—'}\n` +
    `Cliente: ${v.cliente}\n` +
    `Vendedor: ${v.vendedor}\n\n` +
    `Produtos:\n${itensTexto}\n\n` +
    `Subtotal: R$ ${Number(v.subtotal).toFixed(2)}\n` +
    `Juros: R$ ${Number(v.juros).toFixed(2)}\n` +
    `Total: R$ ${Number(v.total).toFixed(2)}\n` +
    `Parcelas: ${v.parcelas}x\n` +
    `Status: ${v.status}`
  );
}

// ── DATA ─────────────────────────────────────────────────────
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
