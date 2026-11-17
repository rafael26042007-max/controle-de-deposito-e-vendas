from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/vendedores", tags=["vendedores"])

class VendedorSchema(BaseModel):
  codigo:   Optional[str] = None
  nome:     str
  telefone: Optional[str] = None
  email:    Optional[str] = None
  comissao: float = 5
  status:   str = 'ativo'

@router.get("/")
def listar(db: Session = Depends(get_db)):
  return db.query(models.Vendedor).all()

@router.post("/")
def criar(dados: VendedorSchema, db: Session = Depends(get_db)):
  v = models.Vendedor(**dados.dict())
  db.add(v); db.commit(); db.refresh(v)
  return v

@router.put("/{id}")
def atualizar(id: int, dados: VendedorSchema, db: Session = Depends(get_db)):
  v = db.query(models.Vendedor).filter(models.Vendedor.id == id).first()
  if not v: raise HTTPException(404, "Vendedor não encontrado")
  for k, val in dados.dict().items(): setattr(v, k, val)
  db.commit(); db.refresh(v)
  return v

@router.patch("/{id}/status")
def alternar_status(id: int, db: Session = Depends(get_db)):
  v = db.query(models.Vendedor).filter(models.Vendedor.id == id).first()
  if not v: raise HTTPException(404, "Vendedor não encontrado")
  v.status = 'inativo' if v.status == 'ativo' else 'ativo'
  db.commit(); db.refresh(v)
  return v

@router.delete("/{id}")
def deletar(id: int, db: Session = Depends(get_db)):
  v = db.query(models.Vendedor).filter(models.Vendedor.id == id).first()
  if not v: raise HTTPException(404, "Vendedor não encontrado")

  # BUG-FIX: verifica vendas vinculadas antes de deletar
  vendas = db.query(models.Venda).filter(models.Venda.vendedor_id == id).count()
  if vendas:
    raise HTTPException(
        status_code=400,
        detail=f"Vendedor possui {vendas} venda(s) vinculada(s). Não pode ser excluído."
    )

  db.delete(v); db.commit()
  return {"ok": True}
