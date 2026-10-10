// ── DADOS DE EXEMPLO ──
let notas = [
  {
    id: 1, codigo: 'NF-ABC123456', codigoVenda: 'VD001',
    cliente: 'Loja Mania do Lar', vendedor: 'Carlos Silva',
    produto: 'Lençol Casal Branco', qtd: 10,
    subtotal: 650.00, juros: 0, total: 650.00, parcelas: 1,
    data: '06/10/2026 08:30'
  },
  {
    id: 2, codigo: 'NF-DEF789012', codigoVenda: 'VD002',
    cliente: 'Mercado Têxtil SP', vendedor: 'Ana Souza',
    produto: 'Fronha Branca', qtd: 50,
    subtotal: 900.00, juros: 9.00, total: 909.00, parcelas: 3,
    data: '06/10/2026 10:15'
  },
  {
    id: 3, codigo: 'NF-GHI345678', codigoVenda: 'VD003',
    cliente: 'Armarinho Central', vendedor: 'Carlos Silva',
    produto: 'Camiseta Básica P', qtd: 20,
    subtotal: 640.00, juros: 12.80, total: 652.80, parcelas: 4,
    data: '07/10/2026 09:00'
  },
  {
    id: 4, codigo: 'NF-JKL901234', codigoVenda: 'VD004',
    cliente: 'Distribuidora Norte', vendedor: 'Marcos Pereira',
    produto: 'Toalha de Banho', qtd: 8,
    subtotal: 304.00, juros: 0, total: 304.00, parcelas: 2,
    data: '07/10/2026 14:20'
  },
  {
    id: 5, codigo: 'NF-MNO567890', codigoVenda: 'VD005',
    cliente: 'Casa e Conforto', vendedor: 'Ana Souza',
    produto: 'Lençol Solteiro Azul', qtd: 20,
    subtotal: 900.00, juros: 18.00, total: 918.00, parcelas: 5,
    data: '08/10/2026 11:45'
  },
  {
    id: 6, codigo: 'NF-PQR234567', codigoVenda: 'VD006',
    cliente: 'Tecidos & Cia', vendedor: 'Roberto Nunes',
    produto: 'Camiseta Básica M', qtd: 30,
    subtotal: 960.00, juros: 0, total: 960.00, parcelas: 1,
    data: '10/10/2026 09:30'
  },
];

let notaSelecionada = null;

// ── INICIALIZA ──
document.addEventListener('DOMContentLoaded', () => {
  atualizarResumo();
  renderTabela();
  atualizarData();
});

// ── ATUALIZA RESUMO ──
function atualizarResumo() {
  const total = notas.length;
  const valorTotal = notas.reduce((s, n) => s + n.total, 0);

  const doMes = notas.filter(n => {
    const partes = n.data.split('/');
    const mes = parseInt(partes[1]) - 1;
    const ano = parseInt(partes[2].split(' ')[0]);   // ✅ BUG 1 corrigido: era split('')[0]
    const data = new Date(ano, mes);
    const agora = new Date();
    return data.getMonth() === agora.getMonth()
      && data.getFullYear() === agora.getFullYear();
  }).length;

  const clientesUnicos = new Set(notas.map(n => n.cliente)).size;

  document.getElementById('total-notas').textContent = total;
  document.getElementById('total-valor').textContent = 'R$ ' + valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById('total-mes').textContent = doMes;
  document.getElementById('total-clientes-nf').textContent = clientesUnicos;
}

// ── RENDERIZA TABELA ──
function renderTabela() {
  const tbody = document.getElementById('tabela-body');
  const info = document.getElementById('pag-info');
  const pesq = document.getElementById('pesquisa').value.toLowerCase();
  const dataIni = document.getElementById('filtro-data-ini').value;
  const dataFim = document.getElementById('filtro-data-fim').value;

  const lista = notas.filter(n => {
    const textoOk = n.codigo.toLowerCase().includes(pesq)
      || n.cliente.toLowerCase().includes(pesq)
      || n.vendedor.toLowerCase().includes(pesq)
      || n.codigoVenda.toLowerCase().includes(pesq);

    let dataOk = true;
    if (dataIni || dataFim) {
      const partes = n.data.split('/');
      const dataNota = new Date(`${partes[2].split(' ')[0]}-${partes[1]}-${partes[0]}`);  // ✅ BUG 2 corrigido: era "parrtes[0]"
      if (dataIni) dataOk = dataOk && dataNota >= new Date(dataIni);
      if (dataFim) dataOk = dataOk && dataNota <= new Date(dataFim);
    }

    return textoOk && dataOk;
  });

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhuma nota fiscal encontrada
        </td>
      </tr>`;
    info.textContent = 'Nenhum resultado';
    return;
  }

  tbody.innerHTML = lista.map(n => `
    <tr>
      <td class="td-nf">${n.codigo}</td>
      <td><strong>${n.cliente}</strong></td>
      <td>${n.vendedor}</td>
      <td>
        ${n.produto}
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Qtd: ${n.qtd}</div>
      </td>
      <td style="color:var(--muted)">${n.parcelas}x</td>
      <td class="td-valor">R$ ${n.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="font-size:12px;color:var(--muted)">${n.data}</td>
      <td>
        <div class="row-actions">
          <button class="btn-action" onclick="verNota(${n.id})">🧾 Ver NF</button>
        </div>
      </td>
    </tr>`).join('');

  info.textContent = `Mostrando ${lista.length} de ${notas.length} notas`;
}

// ── VER NOTA ──
function verNota(id) {
  const n = notas.find(x => x.id === id);
  if (!n) return;

  notaSelecionada = n;

  document.getElementById('nf-codigo').textContent = n.codigo;
  document.getElementById('nf-data').textContent = n.data;
  document.getElementById('nf-venda').textContent = n.codigoVenda;
  document.getElementById('nf-cliente').textContent = n.cliente;
  document.getElementById('nf-vendedor').textContent = n.vendedor;
  document.getElementById('nf-produto').textContent = n.produto;
  document.getElementById('nf-qtd').textContent = n.qtd + ' unidades';
  document.getElementById('nf-parcelas').textContent = n.parcelas + 'x';
  document.getElementById('nf-subtotal').textContent =
    'R$ ' + n.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById('nf-juro').textContent =
    'R$ ' + n.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 });  // ✅ BUG 3 corrigido: era n.juros + 'x' quando zero
  document.getElementById('nf-total').textContent =
    'R$ ' + n.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  document.getElementById('modal').classList.add('show');
}

// ── FECHAR MODAL ──
function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  notaSelecionada = null;
}

// ── IMPRIMIR ──
function imprimirNF() {
  if (!notaSelecionada) return;
  const n = notaSelecionada;
  const conteudo = `
    NhLençois — NOTA FISCAL
    ========================
    Código: ${n.codigo}
    Data:   ${n.data}

    Venda:    ${n.codigoVenda}
    Cliente:  ${n.cliente}
    Vendedor: ${n.vendedor}
    Produto:  ${n.produto}
    Qtd:      ${n.qtd} unidades
    Parcelas: ${n.parcelas}x

    Subtotal: R$ ${n.subtotal.toFixed(2)}
    Juros:    R$ ${n.juros.toFixed(2)}
    TOTAL:    R$ ${n.total.toFixed(2)}
    ========================
    NhLençois — Sistema de Gestão Têxtil
  `;
  const win = window.open('', '_blank');
  win.document.write(`<pre style="font-family:monospace;padding:20px">${conteudo}</pre>`);
  win.print();
  win.close();
}

// ── LIMPAR FILTROS ──
function limparFiltros() {
  document.getElementById('pesquisa').value = '';
  document.getElementById('filtro-data-ini').value = '';
  document.getElementById('filtro-data-fim').value = '';
  renderTabela();
}

// ── DATA ──
function atualizarData() {
  const el = document.getElementById('data-atual');
  if (el) {
    el.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}

// ── FECHA MODAL CLICANDO FORA ──
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) fecharModal();
});

// ── FECHA COM ESC ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
});

// ── ENVIAR NF POR EMAIL ──
function enviarNFPorEmail() {
  if (!notaSelecionada) return;

  const email = document.getElementById('nf-email-destino').value.trim();
  if (!email) {
    alert('Informe o e-mail do cliente.');
    return;
  }

  const n = notaSelecionada;

  const params = {
    codigo:    n.codigo,
    venda:     n.codigoVenda,
    cliente:   n.cliente,
    vendedor:  n.vendedor,
    produto:   n.produto,
    qtd:       n.qtd,
    parcelas:  n.parcelas + 'x',
    subtotal:  'R$ ' + n.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    juros:     'R$ ' + n.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    total:     'R$ ' + n.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    data:      n.data,
    to_email:  email,
  };

  emailjs.send('service_2v33dqa', 'template_ojs8jva', params)
    .then(() => {
      alert('✅ Nota fiscal enviada para ' + email);
      document.getElementById('nf-email-destino').value = '';
    })
    .catch(err => {
      alert('❌ Erro ao enviar: ' + err.text);
    });
}
