// ── DADOS DE EXEMPLO ──
let materiais = [
  { id: 1, codigo: 'MP001', nome: 'Malha 100% Algodão',      categoria: 'Tecido',    unidade: 'kg', qtd: 340,  qtdMin: 50,  obs: '' },
  { id: 2, codigo: 'MP002', nome: 'Percal 100% Algodão',     categoria: 'Tecido',    unidade: 'm',  qtd: 520,  qtdMin: 100, obs: '' },
  { id: 3, codigo: 'MP003', nome: 'Percal 100% Poliéster',   categoria: 'Tecido',    unidade: 'm',  qtd: 180,  qtdMin: 100, obs: '' },
  { id: 4, codigo: 'MP004', nome: 'Linha Branca',            categoria: 'Linha',     unidade: 'm',  qtd: 1200, qtdMin: 200, obs: '' },
  { id: 5, codigo: 'MP005', nome: 'Linha Colorida',          categoria: 'Linha',     unidade: 'm',  qtd: 80,   qtdMin: 100, obs: 'Estoque baixo' },
  { id: 6, codigo: 'MP006', nome: 'Elástico 2cm',            categoria: 'Elástico',  unidade: 'm',  qtd: 80,   qtdMin: 50,  obs: '' },
  { id: 7, codigo: 'MP007', nome: 'Embalagem Plástica',      categoria: 'Embalagem', unidade: 'un', qtd: 15,   qtdMin: 50,  obs: 'Reposição urgente' },
  { id: 8, codigo: 'MP008', nome: 'Etiqueta NhLençois',      categoria: 'Etiqueta',  unidade: 'un', qtd: 500,  qtdMin: 100, obs: '' },
];

let editandoId    = null;
let entradaId     = null;

// ── INICIALIZA ──
document.addEventListener('DOMContentLoaded', () => {
  atualizarResumo();
  renderTabela();
  atualizarData();
  atualizarLabels();
});

// ── ATUALIZA RESUMO ──
function atualizarResumo() {
  const total = materiais.length;
  const critico = materiais.filter(m => getStatus(m).tipo === 'critico').length;
  const baixo = materiais.filter(m => getStatus(m).tipo === 'baixo').length;
  const ok = total - critico - baixo;

  document.getElementById('total-materiais').textContent = total;
  document.getElementById('total-ok').textContent = ok;
  document.getElementById('total-baixo').textContent = baixo;
  document.getElementById('total-critico').textContent = critico;
}

// ── STATUS DO ESTOQUE ──
function getStatus(m) {
  if (m.qtd <= 0) return { tipo: 'critico', badge: 'badge-red', label: 'Sem Estoque' };
  if (m.qtd <= m.qtdMin * .5) return { tipo: 'critico', badge: 'badge-red',    label: 'Crítico' };
  if (m.qtd <= m.qtdMin) return { tipo: 'baixo',   badge: 'badge-orange', label: 'Baixo' };
  return { tipo: 'ok',      badge: 'badge-green',  label: 'Normal' };
}

// ── LABEL DA UNIDADE ──
function labelUnidade(un) {
  if (un === 'kg') return 'Quilo (kg)';
  if (un === 'm') return 'Metro (m)';
  return 'Unidade (un)';
}

// ── RENDERIZA TABELA ──
function renderTabela() {
  const tbody = document.getElementById('tabela-body');
  const info = document.getElementById('pag-info');
  const pesq = document.getElementById('pesquisa').value.toLowerCase();
  const unidade = document.getElementById('filtro-unidade').value;
  const status = document.getElementById('filtro-status').value;

  const lista =materiais.filter(m => {
    const textoOk = m.nome.toLowerCase().includes(pesq)
    || m.codigo.toLowerCase().includes(pesq)
    || m.categoria.toLowerCase().includes(pesq);
    const unidadeOk = unidade === 'todos' || m.unidade === unidade;
    const statusOk = status === 'todos' || getStatus(m).tipo === status;
    return textoOk && unidadeOk && statusOk;
  });

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          Nenhum material encontrado
        </td>
      </tr>`;
    info.textContent = 'Nenhum resultado';
    return;
  }

  tbody.innerHTML = lista.map(m => {
    const st  = getStatus(m);
    const cls = st.tipo === 'critico' ? 'td-crit' : st.tipo === 'baixo' ? 'td-low' : 'td-ok';
    return `
      <tr>
        <td class="td-code">${m.codigo}</td>
        <td>
          <strong>${m.nome}</strong>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${m.categoria}</div>
        </td>
        <td><span class="td-un">${labelUnidade(m.unidade)}</span></td>
        <td class="${cls}">${m.qtd % 1 === 0 ? m.qtd : m.qtd.toFixed(2)} ${m.unidade}</td>
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

  info.textContent = `Mostrando ${lista.length} de ${materiais.length} materiais`;
}

// ── ATUALIZA LABELS DINÂMICOS ──
function atualizarLabels() {
  const unidade = document.getElementById('f-unidade')?.value || 'un';
  const sufixo = unidade === 'kg' ? '(kg)' : unidade === 'm' ? '(m)' : '(un)';
  const label = document.getElementById('label-qtd');
  const labelMin = document.getElementById('label-min');
  if (label) label.textContent = `Quantidade inicial ${sufixo}`
  if (labelMin) labelMin.textContent = `Quantidade Mínima ${sufixo}`;
}

// ── MODAL CADASTRO ──
function abrirModal(id = null) {
  editandoId = id;
  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Material' : '➕ Nova Matéria-Prima';

  if (id) {
    const m = materiais.find(x => x.id === id);
    document.getElementById('f-codigo').value = m.codigo;
    document.getElementById('f-nome').value = m.nome;
    document.getElementById('f-categoria').value = m.categoria;
    document.getElementById('f-unidade').value = m.unidade;
    document.getElementById('f-qtd').value = m.qtd;
    document.getElementById('f-qtdMin').value = m.qtdMin;
    document.getElementById('f-obs').value = m.obs;
  } else {
    document.getElementById('f-codigo').value = gerarCodigo();
    document.getElementById('f-nome').value = '';
    document.getElementById('f-categoria').value = 'Tecido';
    document.getElementById('f-unidade').value = 'kg';
    document.getElementById('f-qtd').value = '';
    document.getElementById('f-qtd-min').value = '';
    document.getElementById('f-obs').value = '';
  }

  atualizarLabels();
  document.getElementById('modal').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}

// ── SALVAR ──
function salvar() {
  const nome = document.getElementById('f-nome').value.trim();
  if (!nome) {alert('Preencha o nome do material'); return; }

  const dados = {
    codigo: document.getElementById('f-codigo').value,
    nome,
    categoria: document.getElementById('f-categoria').value,
    unidade: document.getElementById('f-unidade').value,
    qtd: parseFloat(document.getElementById('f-qtd').value) || 0,
    qtdMin: parseFloat(document.getElementById('f-qtd-min').value) || 0,
    obs: document.getElementById('f-obs').value.trim(),
  };

  if (editandoId) {
    const idx = materiais.findIndex(m => m.id === editandoId);
    materiais[idx] = {...materiais[idx], ...dados};
  } else {
    dados.id = Date.now();
    materiais.push(dados);
  }

  fecharModal();
  atualizarResumo();
  renderTabela();
}

// ── MODAL ENTRADA ──
function abrirEntrada(id) {
  entradaId = id;
  const m = materiais.find(x => x.id === id);
  document.getElementById('nome-entrada').textContent = m.nome;
  document.getElementById('entrada-atual').textContent =
    `Estoque atual: ${m.qtd} ${m.unidade}`;
  document.getElementById('label-entrada').textContent =
    `Quantidade Entrando (${m.unidade})`;
  document.getElementById('f-entrada').value = '';
  document.getElementById('f-entrada-obs').value = '';
  document.getElementById('f-entrada').step = m.unidade === 'un' ? '1' : '0.01';
  document.getElementById('modal-entrada').classList.add('show');
}

function fecharEntrada() {
  document.getElementById('modal-entrada').classList.remove('show');
  entradaId = null;
}

function confirmarEntrada() {
  const qtd = parseFloat(document.getElementById('f-entrada').value);
  if (!qtd || qtd <= 0) { alert('Informe uma quantidade válida.'); return; }

  const m =materiais.find(x => x.id === entradaId);
  m.qtd = parseFloat((m.qtd + qtd).toFixed(2));

  fecharEntrada();
  atualizarResumo();
  renderTabela();
  alert(`✅ Entrada confirmada!\n\n+${qtd} ${m.unidade} de ${m.nome}\nNovo estoque: ${m.qtd} ${m.unidade}`);
}

// ── GERAR CÓDIGO ──
function gerarCodigo() {
  const num = String(materiais.length + 1).padStart(3, '0');
  return `MP${num}`;
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

// ── FECHA MODAIS CLICANDO FORA ──
document.getElementById('modal').addEventListener('click', function (e) {
  if (e.target === this) fecharEntrada();
});

// ── FECHA COM ESC ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { fecharModal(); fecharEntrada(); }
});

// ── ATUALIZA LABELS AO MUDAR UNIDADE ──
document.getElementById('f-unidade')?.addEventListener('change', atualizarLabels);
