from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/produtos", tags=["produtos"])

class ProdutoSchema(BaseModel):
  codigo: Optional[str] = None
  nome: str
  categoria: Optional[str] = None
  unidade: Optional[str] = None
  preco: float
  qtd: int = 0
  qtd_min: int = 10
  cor: Optional[str] = None
  obs: Optional[str] = None

@router.get("/")
def listar(db: Session = Depends(get_db)):
  return db.query(models.Produto).all()

@router.post("/")
def criar(dados: ProdutoSchema, db: Session = Depends(get_db)):
  p = models.Produto(**dados.dict())
  db.add(p)
  db.commit()
  db.refresh(p)
  return p

@router.put("/{id}")
def atualizar(id: int, dados: ProdutoSchema, db: Session = Depends(get_db)):
  p = db.query(models.Produto).filter(models.Produto.id == id).first()
  if not p:
    raise HTTPException(status_code=404, detail="Produto não encontrado")
  for k, v in dados.dict().items():
    setattr(p, k, v)
  db.commit()
  db.refresh(p)
  return p

@router.delete("/{id}")
def deletar(id: int, db: Session = Depends(get_db)):
  p = db.query(models.Produto).filter(models.Produto.id == id).first()
  if not p:
    raise HTTPException(status_code=404, detail="Produto não encontrado")
  db.delete(p)
  db.commit()
  return {"ok": True}
