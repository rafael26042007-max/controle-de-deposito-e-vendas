// ── DADOS DE EXEMPLO ──
let clientes = [
  { id: 1, codigo: 'C001', nome: 'Loja Mania do Lar',    telefone: '(47) 3333-1111', email: 'mania@email.com',    cidade: 'Blumenau',    estado: 'SC', documento: '12.345.678/0001-99', atraso: 0, status: 'ativo',     obs: '' },
  { id: 2, codigo: 'C002', nome: 'Mercado Têxtil SP',    telefone: '(11) 4444-2222', email: 'textilsp@email.com', cidade: 'São Paulo',   estado: 'SP', documento: '98.765.432/0001-11', atraso: 0, status: 'ativo',     obs: 'Cliente atacadista' },
  { id: 3, codigo: 'C003', nome: 'Armarinho Central',    telefone: '(47) 5555-3333', email: 'armarin@email.com',  cidade: 'Joinville',   estado: 'SC', documento: '11.222.333/0001-44', atraso: 3, status: 'bloqueado', obs: '' },
  { id: 4, codigo: 'C004', nome: 'Distribuidora Norte',  telefone: '(47) 6666-4444', email: 'dnorte@email.com',   cidade: 'Itajaí',      estado: 'SC', documento: '55.666.777/0001-88', atraso: 2, status: 'bloqueado', obs: '' },
  { id: 5, codigo: 'C005', nome: 'Casa e Conforto',      telefone: '(41) 7777-5555', email: 'casacon@email.com',  cidade: 'Curitiba',    estado: 'PR', documento: '22.333.444/0001-55', atraso: 0, status: 'ativo',     obs: '' },
  { id: 6, codigo: 'C006', nome: 'Tecidos & Cia',        telefone: '(48) 8888-6666', email: 'tecia@email.com',    cidade: 'Florianópolis',estado: 'SC', documento: '33.444.555/0001-66', atraso: 1, status: 'ativo',     obs: 'Paga somente à vista' },
];

let editandoId = null;

// ── INICIALIZA ──
document.addEventListener('DOMContentLoaded', () => {
  renderTabela();
  atualizarResumo();
  atualizarData();
})

// ── ATUALIZA RESUMO ──
function renderTabela() {
  document.getElementById('total-clientes').textContent = clientes.length;
  document.getElementById('total-ativos').textContent = clientes.filter(c => c.status === 'ativo').length;
  document.getElementById('total-bloqueados').textContent = clientes.filter(c => c.status === 'bloqueado').length;
  document.getElementById('total-atraso').textContent = clientes.filter(c => c.status > c.atraso).length;
}

// ── RENDERIZA TABELA ──
function  rederTabela() {
  const  tbody = document.getElementById('tabela-body');
  const  info = document.getElementById('pag-info');
  const  pesq = document.getElementById('pesquisa').value.toLowerCase();
  const  status = document.getElementById('filtro-status').value;

  const lista = clientes.filter(c => {
    const textoOk = c.nome.toLowerCase().includes(pesq)
      || c.codigo.toLowerCase().includes(pesq)
      || c.telefone.includes(pesq)
      || c.cidade.toLowerCase().includes(pesq)
    const statusOk = status === 'todos' || c.status === status;
    return textoOk && statusOk;
  });

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhum cliente encontrado
        </td>
      </tr>`;
    info.textContent = 'Nenhum resultado';
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
      ? `<button class="btn-action bloquear" onclick="alternarStatus(${c.id})">🔒 Bloquear</button>`
      : `<button class="btn-action desbloquear" onclick="alternarStatus(${c.id})">🔓 Desbloquear</button>`;

    return `
      <tr>
        <td class="td-code">${c.codigo}</td>
        <td>
          <strong>${c.nome}</strong>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${c.cidade} — ${c.estado}</div>
        </td>
        <td>${c.telefone || '—'}</td>
        <td>${c.cidade}/${c.estado}</td>
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

  info.textContent = `Mostrando ${lista.length} de ${clientes.length} Clientes`;
}

// ── MODAL ──
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Cliente' : '➕ Novo Cliente';

  if (id) {
    const c = clientes.find(x => x.id === id);
    document.getElementById('f-codigo').value = c.codigo;
    document.getElementById('f-nome').value = c.nome;
    document.getElementById('f-telefone').value = c.telefone;
    document.getElementById('f-email').value = c.email;
    document.getElementById('f-documento').value = c.documento;
    document.getElementById('f-cidade').value = c.cidade;
    document.getElementById('f-estado').value = c.estado;
    document.getElementById('f-status').value = c.status;
    document.getElementById('f-obs').value = c.obs;
  } else {
    document.getElementById('f-codigo').value = gerarCodigo();
    document.getElementById('f-nome').value = '';
    document.getElementById('f-telefone').value = '';
    document.getElementById('f-email').value = '';
    document.getElementById('f-documento').value = '';
    document.getElementById('f-cidade').value = '';
    document.getElementById('f-estado').value = '';
    document.getElementById('f-status').value = 'ativo';
    document.getElementById('f-obs').value = '';
  }
  document.getElementById('modal').classList.add('show');
}
function  fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR ──
function salvar() {
  const nome = document.getElementById('f-nome').value.trim();

  if (!nome) {
    alert('Preencha o nome do cliente.');
    return;
  }
  const dados = {
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

  if (editandoId) {
    const idx = clientes.findIndex(c => c.id === editandoId);
    clientes[idx] = { ...clientes[idx], ...dados};
  }
}
