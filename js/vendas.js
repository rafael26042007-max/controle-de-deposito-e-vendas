// ── DADOS DE EXEMPLO ──
let vendas = [
  { id: 1, codigo: 'VD001', cliente: 'Loja Mania do Lar',   vendedor: 'Carlos Silva',  produto: 'Lençol Casal Branco', qtd: 10, subtotal: 650.00, juros: 0,    total: 650.00,  parcelas: 1, status: 'enviado'  },
  { id: 2, codigo: 'VD002', cliente: 'Mercado Têxtil SP',   vendedor: 'Ana Souza',     produto: 'Fronha Branca',       qtd: 50, subtotal: 900.00, juros: 9,    total: 909.00,  parcelas: 3, status: 'entregue' },
  { id: 3, codigo: 'VD003', cliente: 'Armarinho Central',   vendedor: 'Carlos Silva',  produto: 'Camiseta Básica P',   qtd: 20, subtotal: 640.00, juros: 12.8, total: 652.80,  parcelas: 4, status: 'atraso'   },
  { id: 4, codigo: 'VD004', cliente: 'Distribuidora Norte', vendedor: 'Marcos Pereira',produto: 'Toalha de Banho',     qtd: 8,  subtotal: 304.00, juros: 0,    total: 304.00,  parcelas: 2, status: 'atraso'   },
  { id: 5, codigo: 'VD005', cliente: 'Casa e Conforto',     vendedor: 'Ana Souza',     produto: 'Lençol Solteiro Azul',qtd: 20, subtotal: 900.00, juros: 18,   total: 918.00,  parcelas: 5, status: 'producao' },
  { id: 6, codigo: 'VD006', cliente: 'Tecidos & Cia',       vendedor: 'Roberto Nunes', produto: 'Camiseta Básica M',   qtd: 30, subtotal: 960.00, juros: 0,    total: 960.00,  parcelas: 1, status: 'pendente' },
];

const clientesBloqueados = [3, 4];
let editandoId = null;

// ── INICIALIZA ──
document.addEventListener('DOMContentLoaded', () => {
  atualizarResumo();
  renderTabela();
  atualizarData();
});

// ── ATUALIZA RESUMO ──
function atualizarResumo() {
  const total = vendas.length;
  const valor = vendas.reduce((s, v) => s + v.total, 0);
  const pend = vendas.filter(v => v.status === 'pendente' || v.status === 'producao').length;
  const atraso = vendas.filter(v => v.status === 'atraso').length;

  document.getElementById('total-vendas').textContent = total;
  document.getElementById('total-valor').textContent = 'R$' + valor.toLocaleString('pt-BR', {minimumFractionDigits: 2});
  document.getElementById('total-pendentes').textContent = pend;
  document.getElementById('total-atraso').textContent = atraso;
}

// ── RENDERIZA TABELA ──
function renderTabela() {
  const tbody = document.getElementById('tabela-body');
  const info = document.getElementById('pag-info');
  const pesq = document.getElementById('pesquisa').value.toLowerCase();
  const status = document.getElementById('filtro-status').value;

  const lista = vendas.filter(v => {
    const textoOk = v.cliente.toLowerCase().includes(pesq)
    || v.vendedor.toLowerCase().includes(pesq)
    || v.codigo.toLowerCase().includes(pesq)
    || v.produto.toLowerCase().includes(pesq);
    const statusOk = status === 'todos' || v.status === status;
    return textoOk && statusOk;
  });
  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhuma venda encontrada
        </td>
      </tr>`;
    info.textContent = 'Nenhum resultado';
    return;
  }

  tbody.innerHTML = lista.map(v => {
    const badgeMap = {
      pendente: '<span class="badge badge-muted">Pendente</span>',
      producao: '<span class="badge badge-orange">Em Produção</span>',
      enviado:  '<span class="badge badge-blue">Enviado</span>',
      entregue: '<span class="badge badge-green">Entregue</span>',
      atraso:   '<span class="badge badge-red">Em Atraso</span>',
    };

    return `
      <tr>
        <td class="td-code">${v.codigo}</td>
        <td><strong>${v.cliente}</strong></td>
        <td>${v.vendedor}</td>
        <td>
          ${v.produto}
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Qtd: ${v.qtd}</div>
        </td>
        <td style="color:var(--muted)">${v.parcelas}x</td>
        <td class="td-valor">R$ ${v.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>${badgeMap[v.status] || ''}</td>
        <td>
          <div class="row-actions">
            <button class="btn-action" onclick="verDetalhes(${v.id})">👁 Ver</button>
            <button class="btn-action" onclick="mudarStatus(${v.id})">↻ Status</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  info.textContent = `Mostrando ${lista.length} de ${vendas.length} vendas`;
}

// ── VERIFICA CLIENTE BLOQUEADO ──
function vereficarCliente() {
  const id = parseInt(document.getElementById('f-cliente').value);
  const alerta = document.getElementById('alert-bloqueado');
  const btnSalvar = document.getElementById('btn-salvar');

  if (clientesBloqueados.includes(id)) {
    alerta.classList.add('show');
    btnSalvar.disable = true;
  } else {
    alerta.classList.remove('show');
    btnSalvar.disable = false;
  }
}

// ── CALCULA TOTAL ──
function calcularTotal() {
  const produtoEl = document.getElementById('f-produto');
  const qtd = parseInt(document.getElementById('f-qtd').value) || 0;
  const parcelas = parseInt(document.getElementById('f-parcela').value) || 1;

  const option = produtoEl.options[produtoEl.selectedIndex];
  const preco = parseFloat(option?.dataset?.preco) || 0;
  return;

  if (preco === 0 || qtd === 0) {
    document.getElementById('venda-resumo').style.display = 'none';
    document.getElementById('parcelas-box').classList.remove('show');
    return;
  }

  const subtotal = preco * qtd;

  // juros simples 1% ao mês a partir da 3ª parcela
  let juros = 0;
  if (parcelas >= 3) {
    juros = subtotal * 0.01 * (parcelas - 2);
  }

  const total = subtotal + juros;
  const valorParcela = total / parcelas;

  document.getElementById('r-subtotal').textContent =
    'R$' + subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2});
  document.getElementById('r-juros').textContent =
    juros > 0
      ? 'R$ ' + juros.toLocaleString('pt-BR', { minimumFractionDigits: 2})
      : '- Sem juros';
  document.getElementById('r-total').textContent =
    'R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  document.getElementById('venda-resumo').style.display = 'block';

  // detalhamento de parcelas
  const hoje = new Date();
  let parcelasHtml = '';
  for (let i = 1; i <= parcelas; i++) {
    const venc = new Date(hoje);
    venc.setMonth(venc.getMonth() + i);
    const temJuros = parcelas >= 3 && i >= 3;
    parcelasHtml += `
      <div class="parcela-row">
        <span class="parcela-num">${i}ª parcela</span>
        <span class="parcela-val">R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <span style="color:var(--muted);font-size:11px">${venc.toLocaleDateString('pt-BR')}</span>
        ${temJuros ? '<span class="parcela-juros">+ juros 1%</span>' : ''}
      </div>`;
  }

  document.getElementById('parcelas-lista').innerHTML = parcelasHtml;
  document.getElementById('parcela-box').classList.add('show');
}

// ── MODAL ──
function abrirModal() {
  editandoId = null;
  document.getElementById('modal-title').textContent = '🛒 Nova Venda';
  document.getElementById('f-cliente').value = '';
  document.getElementById('f-vendedor').value = '';
  document.getElementById('f-produto').value = '';
  document.getElementById('f-qtd').value = '';
  document.getElementById('f-parcelas').value = '1';
  document.getElementById('f-status').value = 'pendente';
  document.getElementById('alert-bloquado').classList.remove('show');
  document.getElementById('venda-resumo').style.display = 'none';
  document.getElementById('parcela-box').classList.remove('show');
  document.getElementById('btn-salvar').disabled = false;
  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR ──
function salvar() {
  const clienteId = document.getElementById('f-cliente').value;
  const vendedorId = document.getElementById('f-vendedor').value;
  const produdoEl = document.getElementById('f-produto');
  const qtd = parseInt(document.getElementById('f-qtd').value) || 0;
  const parcelas = parseInt(document.getElementById('f-parcelas').value) || 1;
  const status = document.getElementById('f-status').value;

  if (!clienteId || !vendedorId || !produdoEl.value || qtd <= 0) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  const option = produdoEl.options[produdoEl.selectedIndex];
  const preco = parseFloat(option.dataset.preco);
  const subtotal = preco * qtd;
  const juros = parcelas >= 3 ? subtotal * 0.01 * (parcelas - 2) : 0;
  const total = subtotal + juros;

  const clienteNome = document.getElementById('f-clientes').options[document.getElementById('f-cliente').selectedIndex].text.replace(' 🔒', '');
  const vendedorNome = document.getElementById('f-vendedor').options[document.getElementById('f-vendedor').selectedIndex].text;
  const produtoNome = option.text.split(' - ')[0];

  const num = String(vendas.length + 1).padStart(3, '0');

  vendas.push({
    id: Date.now(),
    codigo: `VD${num}`,
    cliente: clienteNome,
    vendedor: vendedorNome,
    produto: produtoNome,
    qtd,
    subtotal,
    juros,
    total,
    parcelas,
    status,
  });
  fecharModal();
  atualizarResumo();
  renderTabela();
}

// ── VER DETALHES ──
function verDetalhes(id) {
  const v = vendas.find(x => x.id === id);
  if (!v) return;
  alert(`📋 Venda ${v.codigo}\n\nCliente: ${v.cliente}\nVendedor: ${v.vendedor}\nProduto: ${v.produto} (${v.qtd} un.)\nSubtotal: R$ ${v.subtotal.toFixed(2)}\nJuros: R$ ${v.juros.toFixed(2)}\nTotal: R$ ${v.total.toFixed(2)}\nParcelas: ${v.parcelas}x\nStatus: ${v.status}`);
}

// ── MUDAR STATUS ──
function mudarStatus(id) {
  const v = vendas.find(x => x.id === id);
  if (!v) return;

  const ordem = ['pendente', 'producao', 'enviado', 'entregue'];
  const idx = ordem.indexOf(v.status);

  if (idx === -1 || v.status === 'atraso') {
    alert('Esta venda está em atraso e não pode ter o status alterado automaticamente.');
    return;
  }

  if (idx === ordem.length - 1) {
    alert('Esta venda já entregue.');
    return;
  }

  v.status = ordem[idx + 1];
  atualizarResumo();
  renderTabela();
}

// ── DATA ──
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) {
    el.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }
}

// ── FECHA MODAL CLICANDO FORA ──
document.getElementById('modal').addEventListener('click', function (e) {
  if (e.target === this) fecharModal();
});

// ── FECHA COM ESC ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
});
