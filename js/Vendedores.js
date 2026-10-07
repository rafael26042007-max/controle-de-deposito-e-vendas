// ── DADOS DE EXEMPLO ──
let vendedores = [
  { id: 1, codigo: 'V001', nome: 'Carlos Silva',   telefone: '(47) 99999-1111', email: 'carlos@nhlencois.com',  comissao: 5,   status: 'ativo' },
  { id: 2, codigo: 'V002', nome: 'Ana Souza',       telefone: '(47) 98888-2222', email: 'ana@nhlencois.com',     comissao: 5,   status: 'ativo' },
  { id: 3, codigo: 'V003', nome: 'Marcos Pereira',  telefone: '(47) 97777-3333', email: 'marcos@nhlencois.com',  comissao: 4.5, status: 'ativo' },
  { id: 4, codigo: 'V004', nome: 'Juliana Lima',    telefone: '(47) 96666-4444', email: 'juliana@nhlencois.com', comissao: 5,   status: 'inativo' },
  { id: 5, codigo: 'V005', nome: 'Roberto Nunes',   telefone: '(47) 95555-5555', email: 'roberto@nhlencois.com', comissao: 6,   status: 'ativo' },
];

let editandoId = null;

// ── INICIALIZA ──
document.addEventListener('DOMContentLoaded', () => {
  renderTabela();
  atualizarResumo();
  atualizarData();
});

// ── ATUALIZA RESUMO ──
function atualizarResumo() {
  document.getElementById('total-vendedores').textContent = vendedores.length;
  document.getElementById('total-ativos').textContent =
    vendedores.filter(v => v.status === 'ativo').length;
  document.getElementById('total-inativos').textContent =
    vendedores.filter(v => v.status === 'inativo').length;
}

// ── RENDERIZA TABELA ──
function renderTabela() {
  const tbody  = document.getElementById('tabela-body');
  const info   = document.getElementById('pag-info');
  const pesq   = document.getElementById('pesquisa').value.toLowerCase();
  const status = document.getElementById('filtro-status').value;

  const lista = vendedores.filter(v => {
    const textoOk = v.nome.toLowerCase().includes(pesq)
      || v.codigo.toLowerCase().includes(pesq)
      || v.email.toLowerCase().includes(pesq)
      || v.telefone.includes(pesq);
    const statusOk = status === 'todos' || v.status === status;
    return textoOk && statusOk;
  });

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhum vendedor encontrado
        </td>
      </tr>`;
    info.textContent = 'Nenhum resultado';
    return;
  }

  tbody.innerHTML = lista.map(v => `
    <tr>
      <td class="td-code">${v.codigo}</td>
      <td>
        <strong>${v.nome}</strong>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Vendedor</div>
      </td>
      <td>${v.telefone || '—'}</td>
      <td>${v.email || '—'}</td>
      <td style="font-weight:700;color:var(--accent)">${v.comissao}%</td>
      <td>
        <span class="badge ${v.status === 'ativo' ? 'badge-green' : 'badge-muted'}">
          ${v.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button class="btn-action" onclick="abrirModal(${v.id})">✏️ Editar</button>
          <button class="btn-action ${v.status === 'ativo' ? 'desativar' : 'ativar'}"
                  onclick="alternarStatus(${v.id})">
            ${v.status === 'ativo' ? '⏸ Desativar' : '▶ Ativar'}
          </button>
        </div>
      </td>
    </tr>`).join('');

  info.textContent = `Mostrando ${lista.length} de ${vendedores.length} vendedores`;
}

// ── MODAL ──
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Vendedor' : '➕ Novo Vendedor';

  if (id) {
    const v = vendedores.find(x => x.id === id);
    document.getElementById('f-codigo').value   = v.codigo;
    document.getElementById('f-nome').value     = v.nome;
    document.getElementById('f-telefone').value = v.telefone;
    document.getElementById('f-email').value    = v.email;
    document.getElementById('f-comissao').value = v.comissao;
    document.getElementById('f-status').value   = v.status;
  } else {
    document.getElementById('f-codigo').value   = gerarCodigo();
    document.getElementById('f-nome').value     = '';
    document.getElementById('f-telefone').value = '';
    document.getElementById('f-email').value    = '';
    document.getElementById('f-comissao').value = '5';
    document.getElementById('f-status').value   = 'ativo';
  }

  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR ──
function salvar() {
  const nome = document.getElementById('f-nome').value.trim();

  if (!nome) {
    alert('Preencha o nome do vendedor.');
    return;
  }

  const dados = {
    codigo:   document.getElementById('f-codigo').value,
    nome,
    telefone: document.getElementById('f-telefone').value.trim(),
    email:    document.getElementById('f-email').value.trim(),
    comissao: parseFloat(document.getElementById('f-comissao').value) || 0,
    status:   document.getElementById('f-status').value,
  };

  if (editandoId) {
    const idx = vendedores.findIndex(v => v.id === editandoId);
    vendedores[idx] = { ...vendedores[idx], ...dados };
  } else {
    dados.id = Date.now();
    vendedores.push(dados);
  }

  fecharModal();
  atualizarResumo();
  renderTabela();
}

// ── ALTERNAR STATUS ──
function alternarStatus(id) {
  const v = vendedores.find(x => x.id === id);
  if (!v) return;
  v.status = v.status === 'ativo' ? 'inativo' : 'ativo';
  atualizarResumo();
  renderTabela();
}

// ── GERAR CÓDIGO ──
function gerarCodigo() {
  const num = String(vendedores.length + 1).padStart(3, '0');
  return `V${num}`;
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
