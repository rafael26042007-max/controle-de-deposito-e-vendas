// ── MATÉRIA-PRIMA DISPONÍVEL ──
let materiais = [
  { id: 1, nome: 'Tecido Algodão',    unidade: 'm',  qtd: 340 },
  { id: 2, nome: 'Linha Branca',      unidade: 'm',  qtd: 1200 },
  { id: 3, nome: 'Elástico 2cm',      unidade: 'm',  qtd: 80 },
  { id: 4, nome: 'Embalagem Plástica',unidade: 'un', qtd: 15 },
];

// ── RECEITAS DE PRODUÇÃO ──
const receitas = {
  1: { nome: 'Lençol Casal Branco',  estoque: 48, ingredientes: [ { id: 1, qtd: 3 }, { id: 2, qtd: 4 }, { id: 4, qtd: 1 } ] },
  2: { nome: 'Lençol Solteiro Azul', estoque: 3,  ingredientes: [ { id: 1, qtd: 2 }, { id: 2, qtd: 3 }, { id: 4, qtd: 1 } ] },
  3: { nome: 'Fronha Branca',        estoque: 120,ingredientes: [ { id: 1, qtd: 0.5 }, { id: 2, qtd: 1 } ] },
  4: { nome: 'Camiseta Básica P',    estoque: 35, ingredientes: [ { id: 1, qtd: 1.5 }, { id: 2, qtd: 2 }, { id: 3, qtd: 0.5 } ] },
  5: { nome: 'Camiseta Básica M',    estoque: 3,  ingredientes: [ { id: 1, qtd: 1.8 }, { id: 2, qtd: 2 }, { id: 3, qtd: 0.5 } ] },
};

let historico = [];
let produtoAtual = null;
let podeProduzir = false;

// ── INICIALIZA ──
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  renderHistorico();
});

// ── SELECIONA PRODUTO ──
function selecionarProduto() {
  const id = document.getElementById('sel-produto').value;

  if (!id) {
    document.getElementById('produto-info').classList.remove('show');
    document.getElementById('lista-receita').innerHTML = '';
    produtoAtual = null;
    return;
  }

  produtoAtual = { id: parseInt(id), ...receitas[id] };

  document.getElementById('pib-nome').textContent = produtoAtual.nome;
  document.getElementById('pib-sub').textContent =
    `Estoque atual: ${produtoAtual.estoque} unidades`;
  document.getElementById('produto-info').classList.add('show');

  renderReceita();
  simularProducao();
}

// ── RENDERIZA RECEITA ──
function renderReceita() {
  if (!produtoAtual) return;

  const lista = document.getElementById('lista-receita');

  lista.innerHTML = produtoAtual.ingredientes.map(ing => {
    const mat = materiais.find(m => m.id === ing.id);
    const temSuficiente = mat.qtd >= ing.qtd;
    return `
      <div class="receita-item">
        <div>
          <div class="receita-nome">${mat.nome}</div>
          <div class="receita-qtd">${ing.qtd} ${mat.unidade} por unidade</div>
        </div>
        <div class="${temSuficiente ? 'receita-estoque-ok' : 'receita-estoque-low'}">
          Disponível: ${mat.qtd} ${mat.unidade}
        </div>
      </div>`;
  }).join('');
}

// ── SIMULA PRODUÇÃO ──
function simularProducao() {
  if (!produtoAtual) return;

  const qtd = parseInt(document.getElementById('qtd-produzir').value) || 0;
  const resultDiv = document.getElementById('simulacao-result');
  const alertDiv  = document.getElementById('alert-insuf');
  const btnConf   = document.getElementById('btn-confirmar');

  if (qtd <= 0) {
    resultDiv.innerHTML = '';
    alertDiv.classList.remove('show');
    btnConf.disabled = true;
    podeProduzir = false;
    return;
  }

  let temTudo = true;
  const linhas = produtoAtual.ingredientes.map(ing => {
    const mat = materiais.find(m => m.id === ing.id);
    const necessario = ing.qtd * qtd;
    const suficiente = mat.qtd >= necessario;
    if (!suficiente) temTudo = false;
    return `
      <div class="sim-row">
        <span class="sim-label">${mat.nome}</span>
        <span class="${suficiente ? 'sim-ok' : 'sim-err'}">
          ${necessario} ${mat.unidade} ${suficiente ? '✓' : '✗ Insuficiente'}
        </span>
      </div>`;
  }).join('');

  resultDiv.innerHTML = `
    <div class="simulacao-box">
      ${linhas}
      <div class="sim-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:8px">
        <span class="sim-label">Unidades a produzir</span>
        <span class="sim-total">+${qtd} unidades</span>
      </div>
    </div>`;

  podeProduzir = temTudo;
  alertDiv.classList.toggle('show', !temTudo);
  btnConf.disabled = !temTudo;
}

// ── CONFIRMA PRODUÇÃO ──
function confirmarProducao() {
  if (!produtoAtual || !podeProduzir) return;

  const qtd = parseInt(document.getElementById('qtd-produzir').value);

  // baixa automática de matéria-prima
  produtoAtual.ingredientes.forEach(ing => {
    const mat = materiais.find(m => m.id === ing.id);
    mat.qtd -= ing.qtd * qtd;
  });

  // adiciona ao estoque do produto
  receitas[produtoAtual.id].estoque += qtd;
  produtoAtual.estoque += qtd;

  // salva no histórico
  historico.unshift({
    produto: produtoAtual.nome,
    qtd,
    data: new Date().toLocaleString('pt-BR'),
    materiais: produtoAtual.ingredientes.map(ing => {
      const mat = materiais.find(m => m.id === ing.id);
      return `${ing.qtd * qtd}${mat.unidade} ${mat.nome}`;
    }).join(', ')
  });

  // atualiza tela
  document.getElementById('pib-sub').textContent =
    `Estoque atual: ${produtoAtual.estoque} unidades`;
  document.getElementById('qtd-produzir').value = '';
  document.getElementById('simulacao-result').innerHTML = '';
  document.getElementById('alert-insuf').classList.remove('show');
  document.getElementById('btn-confirmar').disabled = true;

  renderReceita();
  renderHistorico();

  alert(`✅ Produção confirmada!\n\n+${qtd} unidades de ${produtoAtual.nome} adicionadas ao estoque.`);
}

// ── RENDERIZA HISTÓRICO ──
function renderHistorico() {
  const lista = document.getElementById('historico-lista');
  const total = document.getElementById('hist-total');

  total.textContent = `${historico.length} registro${historico.length !== 1 ? 's' : ''}`;

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
        <div class="hist-sub">${h.materiais}</div>
      </div>
      <div class="hist-right">
        <div class="hist-qtd">+${h.qtd} un.</div>
        <div class="hist-data">${h.data}</div>
      </div>
    </div>`).join('');
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
