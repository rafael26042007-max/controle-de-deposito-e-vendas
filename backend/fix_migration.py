from database import engine
from sqlalchemy import text
import models

with engine.connect() as conn:
  conn.execute(text("ALTER TABLE vendas ADD COLUMN IF NOT EXISTS data VARCHAR(50);"))
  conn.commit()
  print("Coluna data adicionada em vendas!")

models.Base.metadata.create_all(bind=engine)
print("Pronto!")
