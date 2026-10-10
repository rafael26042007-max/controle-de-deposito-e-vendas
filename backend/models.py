from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base

# ── USUÁRIOS ──
class Usuario(Base):
  __tablename__ = "usuarios"
  id = Column(Integer, primary_key=True, index=True)
  username = Column(String(50), unique=True, nullable=False)
  senha_hash = Column(String(255), nullable=False)
  perfil = Column(String(20), nullable=False)  # admin, vendedor, producao
  ativo = Column(Boolean, default=True)

# ── PRODUTOS ──
class Produto(Base):
  __tablename__ = "produtos"
  id = Column(Integer, primary_key=True, index=True)
  codigo = Column(String(50), unique=True, nullable=False)
  nome = Column(String(150), nullable=False)
  categoria = Column(String(50))
  unidade = Column(String(20), default='un')
  preco_venda = Column(Numeric(12, 2), default=0)
  quantidade = Column(Numeric(12, 2), default=0)
  estoque_minimo = Column(Numeric(12, 2), default=0)
  ativo = Column(Boolean, default=True)
  criado_em = Column(DateTime, server_default=func.now())

# ── MATÉRIA-PRIMA ──
class Materia(Base):
  __tablename__ = "materias"
  id = Column(Integer, primary_key=True, index=True)
  codigo = Column(String(50), unique=True, nullable=False)
  nome = Column(String(150), nullable=False)
  unidade = Column(String(20), nullable=False)
  quantidade = Column(Numeric(12, 2), default=0)
  estoque_minimo = Column(Numeric(12, 2), default=0)
  ativo = Column(Boolean, default=True)

# ── VENDEDORES ──
class Vendedor(Base):
  __tablename__ = "vendedores"
  id = Column(Integer, primary_key=True, index=True)
  codigo = Column(String(50), unique=True, nullable=False)
  nome = Column(String(150), nullable=False)
  telefone = Column(String(20))
  email = Column(String(100))
  comissao = Column(Numeric(5, 2), default=0)
  ativo = Column(Boolean, default=True)

# ── CLIENTES ──
class Cliente(Base):
  __tablename__ = "clientes"
  id = Column(Integer, primary_key=True, index=True)
  codigo = Column(String(50), unique=True, nullable=False)
  nome = Column(String(150), nullable=False)
  telefone = Column(String(20))
  email = Column(String(100))
  cidade = Column(String(100))
  bloqueado = Column(Boolean, default=False)

# ── VENDAS ──
class Venda(Base):
  __tablename__ = "vendas"
  id = Column(Integer, primary_key=True, index=True)
  codigo = Column(String(50), unique=True, nullable=False)
  cliente_id = Column(Integer, ForeignKey("clientes.id"))
  vendedor_id = Column(Integer, ForeignKey("vendedores.id"))
  produto_id = Column(Integer, ForeignKey("produtos.id"))
  quantidade = Column(Numeric(12, 2))
  subtotal = Column(Numeric(12, 2))
  juros = Column(Numeric(12, 2), default=0)
  total = Column(Numeric(12, 2))
  parcelas = Column(Integer, default=1)
  status = Column(String(20), default='pendente')
  criado_em = Column(DateTime, server_default=func.now())

# ── NOTAS FISCAIS ──
class NotaFiscal(Base):
  __tablename__ = "notas_fiscais"
  id = Column(Integer, primary_key=True, index=True)
  codigo = Column(String(50), unique=True, nullable=False)
  venda_id = Column(Integer, ForeignKey("vendas.id"))
  criado_em = Column(DateTime, server_default=func.now())
