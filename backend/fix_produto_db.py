# Atualiza models.py e recria tabela produtos
import sqlalchemy as sa
from database import engine, Base
import models

# Reescreve Produto no models.py com os campos certos
content = open('models.py', encoding='utf-8').read()
novo = '''class Produto(Base):
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
    obs = Column(String(200))'''

# Substitui o bloco antigo do Produto
import re
content = re.sub(
  r'class Produto\(Base\):.*?(?=class \w|\Z)',
  novo + '\n\n',
  content,
  flags=re.DOTALL
)
open('models.py', 'w', encoding='utf-8').write(content)
print('models.py atualizado')

# Recria só a tabela produtos
with engine.connect() as conn:
  conn.execute(sa.text("DROP TABLE IF EXISTS produtos CASCADE"))
  conn.commit()

from sqlalchemy import inspect
import models as m
m.Base.metadata.create_all(bind=engine)
print('Tabela produtos recriada!')
