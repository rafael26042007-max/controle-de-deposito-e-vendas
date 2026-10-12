from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/materias", tags=["materias"])

class MateriaSchema(BaseModel):
  codigo:    Optional[str] = None
  nome:      str
  categoria: Optional[str] = None
  unidade:   str = 'un'
  qtd:       float = 0
  qtd_min:   float = 0
  obs:       Optional[str] = None

class EntradaSchema(BaseModel):
  quantidade: float
  obs:        Optional[str] = None

@router.get("/")
def listar(db: Session = Depends(get_db)):
  return db.query(models.MateriaPrima).all()

@router.post("/")
def criar(dados: MateriaSchema, db: Session = Depends(get_db)):
  m = models.MateriaPrima(**dados.dict())
  db.add(m); db.commit(); db.refresh(m)
  return m

@router.put("/{id}")
def atualizar(id: int, dados: MateriaSchema, db: Session = Depends(get_db)):
  m = db.query(models.MateriaPrima).filter(models.MateriaPrima.id == id).first()
  if not m: raise HTTPException(404, "Material não encontrado")
  for k, v in dados.dict().items(): setattr(m, k, v)
  db.commit(); db.refresh(m)
  return m

@router.patch("/{id}/entrada")
def entrada(id: int, dados: EntradaSchema, db: Session = Depends(get_db)):
  m = db.query(models.MateriaPrima).filter(models.MateriaPrima.id == id).first()
  if not m: raise HTTPException(404, "Material não encontrado")
  m.qtd = float(m.qtd) + dados.quantidade
  db.commit(); db.refresh(m)
  return m

@router.delete("/{id}")
def deletar(id: int, db: Session = Depends(get_db)):
  m = db.query(models.MateriaPrima).filter(models.MateriaPrima.id == id).first()
  if not m: raise HTTPException(404, "Material não encontrado")
  db.delete(m); db.commit()
  return {"ok": True}
