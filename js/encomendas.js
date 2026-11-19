// API_URL herdado de app.js

// ── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let encomendas = [];
let editandoId = null;
let clienteAvulso = false;

// ── Helper API ───────────────────────────────────────────────
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

// ── Helpers de exibição ──────────────────────────────────────
function fmtData(d) {
  if (!d) return '—';
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a}`;
}
function fmtMoeda(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtMedidas(e) {
  const p = [
    e.largura    ? `${e.largura}cm` : null,
    e.comprimento? `${e.comprimento}cm` : null,
    e.altura     ? `${e.altura}cm` : null,
  ].filter(Boolean);
  return p.length ? p.join(' × ') : '—';
}
function badgeStatus(s) {
  const map = {
    pendente:  ['badge-pendente',  '⏳ Pendente'],
    producao:  ['badge-producao',  '🏭 Em Produção'],
    pronto:    ['badge-pronto',    '✅ Pronto'],
    entregue:  ['badge-entregue',  '📦 Entregue'],
    cancelado: ['badge-cancelado', '❌ Cancelado'],
  };
  const [cls, txt] = map[s] || ['badge-pendente', s];
  return `<span class="badge ${cls}">${txt}</span>`;
}
function prazoClass(prazo, status) {
  if (status === 'entregue' || status === 'cancelado') return '';
  if (!prazo) return '';
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const d = new Date(prazo + 'T00:00:00');
  return d < hoje ? 'prazo-vencido' : '';
}
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (!el) return;
  const opts = { weekday:'long', day:'numeric', month:'long', year:'numeric' };
  el.textContent = new Date().toLocaleDateString('pt-BR', opts);
}

// ── INICIALIZA ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  carregarTudo();

  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) fecharModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });
});

// ── CARREGA DADOS ────────────────────────────────────────────
async function carregarTudo() {
  try {
    const [enc, clientes, produtos] = await Promise.all([
      api('/encomendas').catch(() => []),
      api('/clientes').catch(() => []),
      api('/produtos').catch(() => []),
    ]);

    encomendas = enc || [];
    atualizarResumo();
    renderTabela();

    // Popula selects do modal
    const selCli = document.getElementById('f-cliente');
    selCli.innerHTML = '<option value="">Selecione o cliente...</option>';
    (clientes || []).forEach(c => {
      selCli.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });

    const selProd = document.getElementById('f-produto');
    selProd.innerHTML = '<option value="">Selecione o produto...</option>';
    (produtos || []).forEach(p => {
      selProd.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
    });

  } catch (e) {
    console.error('Erro ao carregar encomendas:', e.message);
  }
}

// ── RESUMO ───────────────────────────────────────────────────
function atualizarResumo() {
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  document.getElementById('res-total').textContent     = encomendas.length;
  document.getElementById('res-pendentes').textContent = encomendas.filter(e => ['pendente','producao'].includes(e.status)).length;
  document.getElementById('res-prontos').textContent   = encomendas.filter(e => e.status === 'pronto').length;
  document.getElementById('res-entregues').textContent = encomendas.filter(e => {
    if (e.status !== 'entregue') return false;
    const d = new Date(e.data_entrega || e.updated_at || '');
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).length;
}

// ── RENDER TABELA ────────────────────────────────────────────
function renderTabela() {
  const busca  = document.getElementById('pesquisa').value.toLowerCase();
  const filtro = document.getElementById('filtro-status').value;

  let lista = encomendas.filter(e => {
    const matchStatus = filtro === 'todos' || e.status === filtro;
    const matchBusca  = !busca ||
      (e.cliente_nome || '').toLowerCase().includes(busca) ||
      (e.produto_nome || '').toLowerCase().includes(busca) ||
      (e.codigo       || '').toLowerCase().includes(busca);
    return matchStatus && matchBusca;
  });

  const tbody = document.getElementById('tabela-body');
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2rem 0">Nenhuma encomenda encontrada.</td></tr>`;
    document.getElementById('pag-info').textContent = '0 encomendas';
    return;
  }

  tbody.innerHTML = lista.map(e => {
    const pClass = prazoClass(e.prazo, e.status);
    return `<tr>
      <td class="td-code">${e.codigo || '—'}</td>
      <td>${e.cliente_nome || e.cliente_avulso || '—'}</td>
      <td>${e.produto_nome || '—'}</td>
      <td style="font-size:12px;color:var(--muted2)">${fmtMedidas(e)}</td>
      <td>${e.quantidade || 1}</td>
      <td class="${pClass}">${fmtData(e.prazo)}</td>
      <td>${fmtMoeda(e.valor)}</td>
      <td>${badgeStatus(e.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-sm btn-editar" onclick="abrirEditar(${e.id})">✏️ Editar</button>
          <button class="btn-sm btn-excluir" onclick="excluir(${e.id})">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('pag-info').textContent =
    `${lista.length} encomenda${lista.length !== 1 ? 's' : ''}`;
}

// ── TOGGLE CLIENTE AVULSO ────────────────────────────────────
function toggleAvulso() {
  clienteAvulso = !clienteAvulso;
  document.getElementById('f-cliente').style.display       = clienteAvulso ? 'none' : 'block';
  document.getElementById('f-cliente-avulso').style.display = clienteAvulso ? 'block' : 'none';
  const link = document.querySelector('.toggle-avulso');
  link.textContent = clienteAvulso ? '↩ Usar cliente cadastrado' : '➕ Cliente não cadastrado';
}

// ── MODAL ────────────────────────────────────────────────────
function abrirModal() {
  editandoId = null;
  clienteAvulso = false;
  document.getElementById('modal-titulo').textContent = '📋 Nova Encomenda';
  document.getElementById('btn-salvar').textContent   = '✓ Salvar Encomenda';
  limparForm();
  document.getElementById('modal').classList.add('show');
}

function abrirEditar(id) {
  const enc = encomendas.find(e => e.id === id);
  if (!enc) return;
  editandoId = id;
  document.getElementById('modal-titulo').textContent = '✏️ Editar Encomenda';
  document.getElementById('btn-salvar').textContent   = '✓ Salvar Alterações';

  // Decide se é cliente avulso
  if (enc.cliente_avulso && !enc.cliente_id) {
    clienteAvulso = true;
    document.getElementById('f-cliente').style.display        = 'none';
    document.getElementById('f-cliente-avulso').style.display = 'block';
    document.getElementById('f-cliente-avulso').value         = enc.cliente_avulso;
    document.querySelector('.toggle-avulso').textContent = '↩ Usar cliente cadastrado';
  } else {
    clienteAvulso = false;
    document.getElementById('f-cliente').style.display        = 'block';
    document.getElementById('f-cliente-avulso').style.display = 'none';
    document.getElementById('f-cliente').value = enc.cliente_id || '';
    document.querySelector('.toggle-avulso').textContent = '➕ Cliente não cadastrado';
  }

  document.getElementById('f-produto').value     = enc.produto_id    || '';
  document.getElementById('f-largura').value     = enc.largura       || '';
  document.getElementById('f-comprimento').value = enc.comprimento   || '';
  document.getElementById('f-altura').value      = enc.altura        || '';
  document.getElementById('f-quantidade').value  = enc.quantidade    || 1;
  document.getElementById('f-prazo').value       = enc.prazo         || '';
  document.getElementById('f-valor').value       = enc.valor         || '';
  document.getElementById('f-status').value      = enc.status        || 'pendente';
  document.getElementById('f-obs').value         = enc.observacoes   || '';

  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
}

function limparForm() {
  ['f-cliente','f-produto','f-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });
  ['f-cliente-avulso','f-largura','f-comprimento','f-altura','f-prazo','f-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-quantidade').value = 1;
  document.getElementById('f-valor').value = '';
  // Reset toggle avulso
  document.getElementById('f-cliente').style.display        = 'block';
  document.getElementById('f-cliente-avulso').style.display = 'none';
  document.querySelector('.toggle-avulso').textContent = '➕ Cliente não cadastrado';
}

// ── SALVAR ───────────────────────────────────────────────────
async function salvar() {
  const btn = document.getElementById('btn-salvar');

  // Monta payload
  const payload = {
    produto_id:   parseInt(document.getElementById('f-produto').value)    || null,
    largura:      parseFloat(document.getElementById('f-largura').value)   || null,
    comprimento:  parseFloat(document.getElementById('f-comprimento').value) || null,
    altura:       parseFloat(document.getElementById('f-altura').value)    || null,
    quantidade:   parseInt(document.getElementById('f-quantidade').value)  || 1,
    prazo:        document.getElementById('f-prazo').value                 || null,
    valor:        parseFloat(document.getElementById('f-valor').value)     || null,
    status:       document.getElementById('f-status').value,
    observacoes:  document.getElementById('f-obs').value.trim()            || null,
  };

  if (clienteAvulso) {
    payload.cliente_avulso = document.getElementById('f-cliente-avulso').value.trim() || null;
    payload.cliente_id = null;
  } else {
    payload.cliente_id = parseInt(document.getElementById('f-cliente').value) || null;
    payload.cliente_avulso = null;
  }

  // Validação mínima
  if (!payload.produto_id) { alert('Selecione um produto.'); return; }
  if (!payload.cliente_id && !payload.cliente_avulso) { alert('Informe o cliente.'); return; }
  if (!payload.prazo) { alert('Informe o prazo de entrega.'); return; }
  if (!payload.valor) { alert('Informe o valor total.'); return; }

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    let enc;
    if (editandoId) {
      enc = await api(`/encomendas/${editandoId}`, {
        method: 'PUT', body: JSON.stringify(payload)
      });
      // Atualiza lista local
      const idx = encomendas.findIndex(e => e.id === editandoId);
      if (idx !== -1) encomendas[idx] = enc;
    } else {
      enc = await api('/encomendas', { method: 'POST', body: JSON.stringify(payload) });
      encomendas.unshift(enc);
    }

    // Se acabou de marcar como entregue → gera venda automática
    if (payload.status === 'entregue') {
      await gerarVendaAutomatica(enc).catch(err =>
        console.warn('Venda automática falhou:', err.message)
      );
    }

    atualizarResumo();
    renderTabela();
    fecharModal();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = editandoId ? '✓ Salvar Alterações' : '✓ Salvar Encomenda';
  }
}

// ── GERA VENDA AUTOMÁTICA ────────────────────────────────────
async function gerarVendaAutomatica(enc) {
  // Só gera se o status anterior não era entregue (evita duplicatas)
  const anterior = encomendas.find(e => e.id === enc.id);
  if (anterior && anterior.status === 'entregue') return;

  const payload = {
    cliente_id:    enc.cliente_id    || null,
    cliente_avulso: enc.cliente_avulso || null,
    produto_id:    enc.produto_id,
    quantidade:    enc.quantidade,
    valor_total:   enc.valor,
    origem:        'encomenda',
    encomenda_id:  enc.id,
    status:        'entregue',
  };
  await api('/vendas', { method: 'POST', body: JSON.stringify(payload) });
}

// ── EXCLUIR ──────────────────────────────────────────────────
async function excluir(id) {
  const enc = encomendas.find(e => e.id === id);
  const nome = enc ? (enc.cliente_nome || enc.cliente_avulso || 'esta encomenda') : 'esta encomenda';
  if (!confirm(`Excluir encomenda de "${nome}"?`)) return;
  try {
    await api(`/encomendas/${id}`, { method: 'DELETE' });
    encomendas = encomendas.filter(e => e.id !== id);
    atualizarResumo();
    renderTabela();
  } catch (e) {
    alert('Erro ao excluir: ' + e.message);
  }
}
