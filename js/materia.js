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
