from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Usuario(Base):
  __tablename__ = "usuarios"
  id      = Column(Integer, primary_key=True, index=True)
  codigo  = Column(String(20))                               # ← adiciona aqui
  nome    = Column(String(100), nullable=False)
  usuario = Column(String(50), unique=True, nullable=False)
  senha   = Column(String(200), nullable=False)
  perfil  = Column(String(20), nullable=False, default="vendedor")
  status  = Column(String(20), default="ativo")              # ← adiciona aqui

class Produto(Base):
    __tablename__ = "produtos"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20))
    nome = Column(String(100), nullable=False)
    categoria = Column(String(50))
    unidade = Column(String(20))
    preco = Column(Numeric(10, 2))
    qtd = Column(Integer, default=0)
    qtd_min = Column(Integer, default=10)
    cor = Column(String(50))
    obs = Column(String(200))

class MateriaPrima(Base):
    __tablename__ = "materias_primas"
    id        = Column(Integer, primary_key=True, index=True)
    codigo    = Column(String(20))
    nome      = Column(String(150), nullable=False)
    categoria = Column(String(50))
    unidade   = Column(String(5))
    qtd       = Column(Numeric(10, 2), default=0)
    qtd_min   = Column(Numeric(10, 2), default=0)
    obs       = Column(String(300))

class Vendedor(Base):
    __tablename__ = "vendedores"
    id       = Column(Integer, primary_key=True, index=True)
    codigo   = Column(String(20))
    nome     = Column(String(150), nullable=False)
    telefone = Column(String(20))
    email    = Column(String(100))
    comissao = Column(Numeric(5, 2), default=5)
    status   = Column(String(20), default='ativo')

class Venda(Base):
  __tablename__ = "vendas"
  id          = Column(Integer, primary_key=True, index=True)
  codigo      = Column(String(20))
  cliente_id  = Column(Integer, ForeignKey("clientes.id"))
  vendedor_id = Column(Integer, ForeignKey("vendedores.id"))
  produto_id  = Column(Integer, ForeignKey("produtos.id"), nullable=True)   # legado
  qtd         = Column(Integer, nullable=True)                               # legado
  subtotal    = Column(Numeric(10, 2), default=0)
  juros       = Column(Numeric(10, 2), default=0)
  total       = Column(Numeric(10, 2), default=0)
  parcelas    = Column(Integer, default=1)
  status      = Column(String(20), default='pendente')
  data        = Column(String(50))

class VendaItem(Base):
  __tablename__ = "venda_itens"
  id         = Column(Integer, primary_key=True, index=True)
  venda_id   = Column(Integer, ForeignKey("vendas.id", ondelete="CASCADE"))
  produto_id = Column(Integer, ForeignKey("produtos.id"))
  qtd        = Column(Integer, nullable=False)
  preco_unit = Column(Numeric(10, 2), nullable=False)
  subtotal   = Column(Numeric(10, 2), nullable=False)

class NotaFiscal(Base):
    __tablename__ = "notas_fiscais"
    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"))
    numero = Column(String(50))
    data = Column(DateTime, server_default=func.now())

class Cliente(Base):
    __tablename__ = "clientes"
    id        = Column(Integer, primary_key=True, index=True)
    codigo    = Column(String(20))
    nome      = Column(String(150), nullable=False)
    telefone  = Column(String(20))
    email     = Column(String(100))
    documento = Column(String(30))
    cidade    = Column(String(100))
    estado    = Column(String(2))
    status    = Column(String(20), default='ativo')
    atraso    = Column(Integer, default=0)
    obs       = Column(String(300))

class Producao(Base):
  __tablename__ = "producoes"
  id         = Column(Integer, primary_key=True, index=True)
  produto_id = Column(Integer, ForeignKey("produtos.id"))
  qtd        = Column(Integer, nullable=False)
  data       = Column(String(50))
  obs        = Column(String(500))
