from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database import get_db
from datetime import datetime
import models

router = APIRouter(prefix="/producao", tags=["producao"])

class DeducaoItem(BaseModel):
  materia_id: int
  qtd: float

class ProducaoSchema(BaseModel):
  produto_id: int
  qtd: int
  deducoes: List[DeducaoItem]

@router.get("/")
def listar(db: Session = Depends(get_db)):
  prods = db.query(models.Producao).order_by(models.Producao.id.desc()).all()
  resultado = []
  for p in prods:
    produto = db.query(models.Produto).filter(models.Produto.id == p.produto_id).first()
    resultado.append({
      "id": p.id,
      "produto": produto.nome if produto else "—",
      "qtd": p.qtd,
      "data": p.data,
      "obs": p.obs,
    })
  return resultado

@router.post("/")
def confirmar(dados: ProducaoSchema, db: Session = Depends(get_db)):
  # Valida estoque de cada matéria-prima
  for d in dados.deducoes:
    mat = db.query(models.MateriaPrima).filter(models.MateriaPrima.id == d.materia_id).first()
    if not mat:
      raise HTTPException(404, f"Matéria-prima {d.materia_id} não encontrada")
    if float(mat.qtd or 0) < d.qtd:
      raise HTTPException(400, f"Estoque insuficiente de {mat.nome}: disponível {mat.qtd}, necessário {d.qtd}")

  # Deduz materiais
  nomes_usados = []
  for d in dados.deducoes:
    mat = db.query(models.MateriaPrima).filter(models.MateriaPrima.id == d.materia_id).first()
    mat.qtd = float(mat.qtd) - d.qtd
    nomes_usados.append(f"{d.qtd} {mat.unidade or ''} {mat.nome}")

  # Adiciona ao estoque do produto
  produto = db.query(models.Produto).filter(models.Produto.id == dados.produto_id).first()
  if produto:
    produto.qtd = int(produto.qtd or 0) + dados.qtd

  # Salva histórico
  p = models.Producao(
    produto_id=dados.produto_id,
    qtd=dados.qtd,
    data=datetime.now().strftime("%d/%m/%Y %H:%M"),
    obs=", ".join(nomes_usados)
  )
  db.add(p)
  db.commit()
  return {"ok": True}
