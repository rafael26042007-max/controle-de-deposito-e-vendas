from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/clientes", tags=["clientes"])

class ClienteSchema(BaseModel):
  codigo:    Optional[str] = None
  nome:      str
  telefone:  Optional[str] = None
  email:     Optional[str] = None
  documento: Optional[str] = None
  cidade:    Optional[str] = None
  estado:    Optional[str] = None
  status:    str = 'ativo'
  atraso:    int = 0
  obs:       Optional[str] = None

@router.get("/")
def listar(db: Session = Depends(get_db)):
  return db.query(models.Cliente).all()

@router.post("/")
def criar(dados: ClienteSchema, db: Session = Depends(get_db)):
  c = models.Cliente(**dados.dict())
  db.add(c); db.commit(); db.refresh(c)
  return c

@router.put("/{id}")
def atualizar(id: int, dados: ClienteSchema, db: Session = Depends(get_db)):
  c = db.query(models.Cliente).filter(models.Cliente.id == id).first()
  if not c: raise HTTPException(404, "Cliente não encontrado")
  for k, v in dados.dict().items(): setattr(c, k, v)
  db.commit(); db.refresh(c)
  return c

@router.patch("/{id}/status")
def alternar_status(id: int, db: Session = Depends(get_db)):
  c = db.query(models.Cliente).filter(models.Cliente.id == id).first()
  if not c: raise HTTPException(404, "Cliente não encontrado")
  c.status = 'bloqueado' if c.status == 'ativo' else 'ativo'
  db.commit(); db.refresh(c)
  return c

@router.delete("/{id}")
def deletar(id: int, db: Session = Depends(get_db)):
  c = db.query(models.Cliente).filter(models.Cliente.id == id).first()
  if not c: raise HTTPException(404, "Cliente não encontrado")
  db.delete(c); db.commit()
  return {"ok": True}
