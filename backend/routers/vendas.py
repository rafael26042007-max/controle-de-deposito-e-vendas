from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from datetime import datetime
import models

router = APIRouter(prefix="/vendas", tags=["vendas"])

class VendaSchema(BaseModel):
  cliente_id:  int
  vendedor_id: int
  produto_id:  int
  qtd:         int
  subtotal:    float
  juros:       float = 0
  total:       float
  parcelas:    int = 1
  status:      str = 'pendente'

@router.get("/")
def listar(db: Session = Depends(get_db)):
  vendas = db.query(models.Venda).all()
  resultado = []
  for v in vendas:
    c  = db.query(models.Cliente).filter(models.Cliente.id == v.cliente_id).first()
    ve = db.query(models.Vendedor).filter(models.Vendedor.id == v.vendedor_id).first()
    p  = db.query(models.Produto).filter(models.Produto.id == v.produto_id).first()
    resultado.append({
      "id": v.id, "codigo": v.codigo,
      "cliente_id": v.cliente_id,   "cliente": c.nome if c else "—",
      "cliente_status": c.status if c else "ativo",
      "vendedor_id": v.vendedor_id, "vendedor": ve.nome if ve else "—",
      "produto_id": v.produto_id,   "produto": p.nome if p else "—",
      "qtd": v.qtd,
      "subtotal": float(v.subtotal), "juros": float(v.juros), "total": float(v.total),
      "parcelas": v.parcelas, "status": v.status,
      "data": v.data or "—",
    })
  return resultado

@router.post("/")
def criar(dados: VendaSchema, db: Session = Depends(get_db)):
  c = db.query(models.Cliente).filter(models.Cliente.id == dados.cliente_id).first()
  if c and c.status == 'bloqueado':
    raise HTTPException(400, "Cliente bloqueado")
  count = db.query(models.Venda).count()
  codigo = f"VD{str(count + 1).zfill(3)}"
  v = models.Venda(
    codigo=codigo,
    data=datetime.now().strftime("%d/%m/%Y %H:%M"),
    **dados.dict()
  )
  db.add(v); db.commit(); db.refresh(v)
  return {"id": v.id, "codigo": v.codigo}

@router.patch("/{id}/status")
def avancar_status(id: int, db: Session = Depends(get_db)):
  v = db.query(models.Venda).filter(models.Venda.id == id).first()
  if not v: raise HTTPException(404, "Venda não encontrada")
  ordem = ['pendente', 'producao', 'enviado', 'entregue']
  if v.status == 'atraso':
    raise HTTPException(400, "Venda em atraso não pode ser avançada")
  idx = ordem.index(v.status) if v.status in ordem else -1
  if idx == -1 or idx == len(ordem) - 1:
    raise HTTPException(400, "Status não pode ser avançado")
  v.status = ordem[idx + 1]
  db.commit(); db.refresh(v)
  return {"id": v.id, "status": v.status}

@router.delete("/{id}")
def deletar(id: int, db: Session = Depends(get_db)):
  v = db.query(models.Venda).filter(models.Venda.id == id).first()
  if not v: raise HTTPException(404, "Venda não encontrada")
  db.delete(v); db.commit()
  return {"ok": True}
