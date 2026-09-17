// ── DADOS DE EXEMPLO ──
let produtos = [
  { id: 1, codigo: 'LC001', nome: 'Lençol Casal Branco', categoria: 'Lençóis', preco: 65.00, qtd: 48, qtdMin: 10, cor: 'Branco', obs: '100% algodão' },
  { id: 2, codigo: 'LS002', nome: 'Lençol Solteiro Azul', categoria: 'Lençóis', preco: 45.00, qtd: 3, qtdMin: 10, cor: 'Azul', obs: '' },
  { id: 3, codigo: 'FR003', nome: 'Fronha Branca', categoria: 'Fronhas', preco: 18.00, qtd: 120, qtdMin: 20, cor: 'Branco', obs: 'Par' },
  { id: 4, codigo: 'CB004', nome: 'Camiseta Básica P', categoria: 'Camisetas', preco: 32.00, qtd: 35, qtdMin: 15, cor: 'Branco', obs: 'Tamanho P' },
  { id: 5, codigo: 'CB005', nome: 'Camiseta Básica M', categoria: 'Camisetas', preco: 32.00, qtd: 3, qtdMin: 15, cor: 'Branco', obs: 'Tamanho M' },
  { id: 6, codigo: 'TB006', nome: 'Toalha de Banho', categoria: 'Toalhas', preco: 38.00, qtd: 7, qtdMin: 10, cor: 'Bege', obs: '' },
];

let produtosFiltrados = [...produtos];
let editandoId = null;


// ── INICIALIZAÇÃO ──
document.addEventListener('DOMContentLoaded', () => {
  renderTabela();
  atualizarData();

  const modal = document.getElementById('modal');

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === this) {
        fecharModal();
      }
    });
  }
});


// ── RENDERIZA TABELA ──
function renderTabela() {
  const tbody = document.getElementById('tabela-body');
  const info = document.getElementById('pag-info');

  if (!tbody || !info) return;

  if (produtosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--muted)">
          📦 Nenhum produto encontrado
        </td>
      </tr>`;

    info.textContent = 'Nenhum produto encontrado';
    return;
  }

  tbody.innerHTML = produtosFiltrados.map(p => {
    const status = getStatus(p.qtd, p.qtdMin);

    return `
      <tr>
        <td class="td-code">${p.codigo}</td>

        <td>
          <strong>${p.nome}</strong>
          ${p.cor ? `<br><small style="color:var(--muted)">${p.cor}</small>` : ''}
        </td>

        <td>${p.categoria}</td>

        <td class="td-price">
          R$ ${p.preco.toFixed(2)}
        </td>

        <td class="${status.cls}">
          ${p.qtd}
        </td>

        <td style="color:var(--muted)">
          ${p.qtdMin}
        </td>

        <td>
          <span class="badge ${status.badge}">
            ${status.label}
          </span>
        </td>

        <td>
          <div class="row-actions">
            <button
              class="btn-action btn-edit"
              onclick="editarProduto(${p.id})"
              title="Editar">
              ✏️
            </button>

            <button
              class="btn-action btn-delete"
              onclick="deletarProduto(${p.id})"
              title="Excluir">
              🗑️
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  info.textContent =
    `Mostrando ${produtosFiltrados.length} de ${produtos.length} produtos`;
}


// ── STATUS DO ESTOQUE ──
function getStatus(qtd, qtdMin) {

  if (qtd === 0) {
    return {
      label: 'Sem estoque',
      cls: 'critico',
      badge: 'badge-critical'
    };
  }

  if (qtd < qtdMin / 2) {
    return {
      label: 'Crítico',
      cls: 'critico',
      badge: 'badge-critical'
    };
  }

  if (qtd < qtdMin) {
    return {
      label: 'Baixo',
      cls: 'baixo',
      badge: 'badge-low'
    };
  }

  return {
    label: 'Normal',
    cls: 'normal',
    badge: 'badge-ok'
  };
}


// ── FILTRO POR TEXTO ──
function filtrar(q) {
  q = q.toLowerCase();

  produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(q) ||
    p.codigo.toLowerCase().includes(q) ||
    p.categoria.toLowerCase().includes(q)
  );

  renderTabela();
}


// ── FILTRO POR CATEGORIA ──
function filtrarCategoria(cat) {
  produtosFiltrados = cat
    ? produtos.filter(p => p.categoria === cat)
    : [...produtos];

  renderTabela();
}


// ── FILTRO POR STATUS ──
function filtrarStatus(status) {

  produtosFiltrados = produtos.filter(p => {

    if (!status) return true;

    const s = getStatus(p.qtd, p.qtdMin)
      .label
      .toLowerCase();

    if (status === 'ok') {
      return s === 'normal';
    }

    if (status === 'low') {
      return s === 'baixo';
    }

    if (status === 'crit') {
      return s === 'crítico' || s === 'sem estoque';
    }

    return true;
  });

  renderTabela();
}


// ── MODAL ──
function abrirModal(id = null) {

  editandoId = id;

  document.getElementById('modal-title').textContent =
    id ? '✏️ Editar Produto' : '➕ Novo Produto';

  if (id) {

    const p = produtos.find(x => x.id === id);

    if (!p) return;

    document.getElementById('f-codigo').value = p.codigo;
    document.getElementById('f-nome').value = p.nome;
    document.getElementById('f-categoria').value = p.categoria;
    document.getElementById('f-preco').value = p.preco;
    document.getElementById('f-qtd').value = p.qtd;
    document.getElementById('f-qtd-min').value = p.qtdMin;
    document.getElementById('f-cor').value = p.cor;
    document.getElementById('f-obs').value = p.obs;

  } else {

    document.getElementById('f-codigo').value = gerarCodigo();
    document.getElementById('f-nome').value = '';
    document.getElementById('f-categoria').value = '';
    document.getElementById('f-preco').value = '';
    document.getElementById('f-qtd').value = '';
    document.getElementById('f-qtd-min').value = '10';
    document.getElementById('f-cor').value = '';
    document.getElementById('f-obs').value = '';
  }

  document.getElementById('modal').classList.add('show');
}


// ── FECHAR MODAL ──
function fecharModal() {
  document.getElementById('modal').classList.remove('show');
  editandoId = null;
}


// ── SALVAR ──
function salvarProduto() {

  const nome =
    document.getElementById('f-nome').value.trim();

  const cat =
    document.getElementById('f-categoria').value;

  const preco =
    parseFloat(document.getElementById('f-preco').value);

  if (!nome || !cat || isNaN(preco)) {
    alert('Preencha os campos obrigatórios: Nome, Categoria e Preço');
    return;
  }

  const dados = {
    codigo: document.getElementById('f-codigo').value,
    nome: nome,
    categoria: cat,
    preco: preco,
    qtd: parseInt(document.getElementById('f-qtd').value) || 0,
    qtdMin: parseInt(document.getElementById('f-qtd-min').value) || 10,
    cor: document.getElementById('f-cor').value.trim(),
    obs: document.getElementById('f-obs').value.trim()
  };

  // EDITAR PRODUTO
  if (editandoId) {

    const idx = produtos.findIndex(p => p.id === editandoId);

    if (idx !== -1) {
      produtos[idx] = {
        ...produtos[idx],
        ...dados
      };
    }

  } else {

    // NOVO PRODUTO
    dados.id = Date.now();
    produtos.push(dados);
  }

  produtosFiltrados = [...produtos];

  renderTabela();
  fecharModal();
}


// ── EDITAR ──
function editarProduto(id) {
  abrirModal(id);
}


// ── DELETAR ──
function deletarProduto(id) {

  const p = produtos.find(x => x.id === id);

  if (!p) return;

  if (confirm(`Deseja excluir "${p.nome}"?`)) {

    produtos = produtos.filter(x => x.id !== id);

    produtosFiltrados = [...produtos];

    renderTabela();
  }
}


// ── GERAR CÓDIGO ──
function gerarCodigo() {

  const letras = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';

  const prefix =
    letras[Math.floor(Math.random() * letras.length)] +
    letras[Math.floor(Math.random() * letras.length)];

  const num =
    String(Math.floor(Math.random() * 900) + 100);

  return prefix + num;
}


// ── DATA ──
function atualizarData() {

  const el = document.getElementById('data-atual');

  if (el) {

    el.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
