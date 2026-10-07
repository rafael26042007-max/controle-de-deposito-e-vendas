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
  const parcelas
}
