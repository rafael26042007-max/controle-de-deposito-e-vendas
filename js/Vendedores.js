/* ══════════════════════════════════════════════════
   VENDEDORES
══════════════════════════════════════════════════ */


/* ── DADOS TEMPORÁRIOS ── */
/*
   Estes dados são apenas para testar o front-end.

   Quando chegarmos no backend/PostgreSQL,
   esta parte será substituída pela API.
*/

let vendedores = [

  {
    id: 1,
    codigo: "V001",
    nome: "Carlos",
    telefone: "(47) 99999-1111",
    email: "carlos@nhlencois.com",
    status: "ativo"
  },

  {
    id: 2,
    codigo: "V002",
    nome: "Ana",
    telefone: "(47) 98888-2222",
    email: "ana@nhlencois.com",
    status: "ativo"
  },

  {
    id: 3,
    codigo: "V003",
    nome: "Marcos",
    telefone: "(47) 97777-3333",
    email: "marcos@nhlencois.com",
    status: "ativo"
  },

  {
    id: 4,
    codigo: "V004",
    nome: "Juliana",
    telefone: "(47) 96666-4444",
    email: "juliana@nhlencois.com",
    status: "inativo"
  },

  {
    id: 5,
    codigo: "V005",
    nome: "Roberto",
    telefone: "(47) 95555-5555",
    email: "roberto@nhlencois.com",
    status: "ativo"
  }

];


let proximoId = 6;

/* ══════════════════════════════════════════════════
   ELEMENTOS
══════════════════════════════════════════════════ */

const tabela = document.getElementById("tabelaVendedores");
const pesquisa = document.getElementById("pesquisaVendedor");
const filtro = document.getElementById("filtroStatus");
const btnNovo = document.getElementById("btnNovoVendedor");
const modal = document.getElementById("modalVendedor");
const btnFechar = document.getElementById("btnFecharModal");
const btnCancelar = document.getElementById("btnCancelar");
const form = document.getElementById("formVendedor");
const modalTitulo = document.getElementById("modalTitulo");

/* ══════════════════════════════════════════════════
   ATUALIZAR RESUMO
══════════════════════════════════════════════════ */

function atualizarResumo() {

  const total = vendedores.length;

  const ativos = vendedores.filter(
    vendedor => vendedor.status === "ativo"
  ).length;

  const inativos = vendedores.filter(
    vendedor => vendedor.status === "inativo"
  ).length;

  document.getElementById("totalVendedores").textContent = total;
  document.getElementById("totalAtivos").textContent = ativos;
  document.getElementById("totalInativos").textContent = inativos;

}

/* ══════════════════════════════════════════════════
   RENDERIZAR TABELA
══════════════════════════════════════════════════ */

function  rederizarVendedores() {
  tabela.innerHTML = "";

  const termo = pesquisa.value.toLowerCase().trim();
  const statusSelicionado = filtro.value;
  const lista = vendedores.filter(vendedor =>{
    const correspondeTexto =
      vendedor.codigo.toLowerCase().includes(termo)
      ||
      vendedor.codigo.toLowerCase().includes(termo)
      ||
      vendedor.nome.toLowerCase().includes(termo)
      ||
      vendedor.email.toLowerCase().includes(termo)
      ||
      vendedor.telefone.toLowerCase().includes(termo);

  const corresponderStatus =
    StatusSelecionado === "todos"
    ||
    vendedor.status === statusSelicionado;

  return correspondeTexto && corresponderStatus;
  });
  /* SEM RESULTADOS */
if (lista.length === 0) {
  tabela.innerHTML = `
    <tr>
      <td
        colspan="6"
        class="sem-vendedores"
      >
        <div class="sem-ico">🔎</div>
          Nenhum vendedor encontrado.
      </td>
    </tr>
  `;
  return;
}

  /* TABELA */

lista.forEach(vendedor => {
  const linha = document.createElement("tr");

  const statusTexto =
    vendedor.status === "ativo"
      ? "Desativar"
      : "Inativo";

  const botaoStatus =
    vendedor.status === "ativo"
      ? "Desativar"
      : "Ativar";

  const classeBotao =
    vendedor.status === "ativo"
      ? "Desativar"
      : "ativar";

  linha.innerHTML = `
      <td>
        <span class="codigo-vendedor">
          ${vendedor.codigo}
        </span>
      </td>
      <td>
        <div class="nome-vendedor">
          ${vendedor.nome}
        </div>
        <div class="sub-vendedor">
          Vendedor cadastrado
        </div>
      </td>
      <td>
        ${vendedor.telefone || "—"}
      </td>
      <td>
        ${vendedor.email || "—"}
      </td>
      <td>
        <span class="status-badge ${vendedor.status}">${statusTexto}</span>
      </td>
      <td>
        <div class="acoes-vendedor">
          <button class="btn-acao" onclick="editarVendedor(${vendedor.id})">✏️ Editar</button>
          <button
            class="btn-acao ${classeBotao}"
            onclick="alternarStatus(${vendedor.id})"
          >
            ${botaoStatus}
          </button>

        </div>

      </td>
  `;
  tabela.appendChild(linha);
});

}
/* ══════════════════════════════════════════════════
   ABRIR MODAL
══════════════════════════════════════════════════ */

function abrirModal() {
  modal.classList.add("show");
}
/* ══════════════════════════════════════════════════
   FECHAR MODAL
══════════════════════════════════════════════════ */

function fecharModal() {
  modal.classList.remove("show");
  form.reset();

  document.getElementById("vendedorId").value = "";
  modalTitulo.textContent = "Novo Vendedor";
}
/* ══════════════════════════════════════════════════
   NOVO VENDEDOR
══════════════════════════════════════════════════ */
btnNovo.addEventListener("click", () => {
  form.reset();

  document.getElementById("vendedorId").value = "";
  modalTitulo.textContent = "Novo Vendedor";
  abrirModal();
})
/* ══════════════════════════════════════════════════
   EDITAR
══════════════════════════════════════════════════ */
function  editarVendedor(id) {
  const vendedor = vendedores.find(item => item.id === id);

  if (!vendedor) {
    return;
  }

  document.getElementById("vendedorId").value = vendedor.id;
  document.getElementById("codigo").value = vendedor.id;
  document.getElementById("nome").value = vendedor.id;
  document.getElementById("telefone").value = vendedor.id;
  document.getElementById("email").value = vendedor.id;
  document.getElementById("status").value = vendedor.id;

  modalTitulo.textContent = "Editar Vendedor";

  abrirModal();
}
/* ══════════════════════════════════════════════════
   SALVAR
══════════════════════════════════════════════════ */

form.addEventListener(
  "submit",
  event => {
    event.preventDefault();
    const id = document.getElementById("vendedorId").value;
    const codigo = document.getElementById("codigo").value.trim();
    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();
    const status = document.getElementById("status").value;

    /* VALIDAÇÃO */
    if (!codigo || !nome) {
      alert("Preencha o código e o nome do vendedor.");
      return;
    }
    /* EDITAR */

    if (id) {
      const vendedor =
        vendedores.find(
          item => item.id === Number(id)
        );

      if (vendedor) {
        vendedor.codigo = codigo;
        vendedor.nome = nome;
        vendedor.telefone = telefone;
        vendedor.email = email;
        vendedor.status = status;
      }
    }

    /* NOVO */
    else {
      vendedores.push({
        id: proximoId++,
        codigo,
        nome,
        telefone,
        email,
        status
      });
    }
    fecharModal();
    atualizarResumo();
    rederizarVendedores();
  }
);
/* ══════════════════════════════════════════════════
   ATIVAR / DESATIVAR
══════════════════════════════════════════════════ */
function alternarStatus(id) {
  const  vendedor = vendedores.find(item => item.id === id);

  if (!vendedor) {
    return;
  }

  vendedor.status = vendedor.status === "ativo"
    ? "inativo"
    : "ativo";

  atualizarResumo();
  rederizarVendedores();
}
/* ══════════════════════════════════════════════════
   PESQUISA
══════════════════════════════════════════════════ */
pesquisa.addEventListener("input", rederizarVendedores);

/* ══════════════════════════════════════════════════
   FILTRO
══════════════════════════════════════════════════ */
filtro.addEventListener("change", rederizarVendedores);

/* ══════════════════════════════════════════════════
   FECHAR MODAL
══════════════════════════════════════════════════ */
btnFechar.addEventListener("click", fecharModal);

btnCancelar.addEventListener("click", fecharModal);

/* ══════════════════════════════════════════════════
   CLICAR FORA DO MODAL
══════════════════════════════════════════════════ */
modal.addEventListener("click", event => {
  if (event.target === modal) {
    fecharModal();
  }
});

/* ══════════════════════════════════════════════════
   ESC PARA FECHAR
══════════════════════════════════════════════════ */
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("show")) {
    fecharModal();
  }
});

/* ══════════════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════════════ */
atualizarResumo();
rederizarVendedores();
