from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database import get_db
from datetime import datetime
import models

router = APIRouter(prefix="/vendas", tags=["vendas"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class VendaItemSchema(BaseModel):
  produto_id: int
  qtd:        int
  preco_unit: float

class VendaSchema(BaseModel):
  cliente_id:  int
  vendedor_id: int
  itens:       List[VendaItemSchema]
  juros:       float = 0
  parcelas:    int   = 1
  status:      str   = 'pendente'

# ── Helpers ───────────────────────────────────────────────────────────────────

def _resumo_produto(itens_db, db):
  """Retorna nome resumido do(s) produto(s) e qtd total."""
  if not itens_db:
    return "—", 0
  nomes = []
  qtd_total = 0
  for it in itens_db:
    p = db.query(models.Produto).filter(models.Produto.id == it.produto_id).first()
    nomes.append(p.nome if p else f"Produto {it.produto_id}")
    qtd_total += it.qtd
  if len(nomes) == 1:
    return nomes[0], qtd_total
  return f"{nomes[0]} (+{len(nomes)-1})", qtd_total

# ── Rotas ─────────────────────────────────────────────────────────────────────

@router.get("/")
def listar(db: Session = Depends(get_db)):
  vendas = db.query(models.Venda).all()
  resultado = []
  for v in vendas:
    c  = db.query(models.Cliente).filter(models.Cliente.id  == v.cliente_id).first()
    ve = db.query(models.Vendedor).filter(models.Vendedor.id == v.vendedor_id).first()

    # Itens novos (VendaItem)
    itens_db = db.query(models.VendaItem).filter(models.VendaItem.venda_id == v.id).all()

    if itens_db:
      # Venda com múltiplos itens
      nome_prod, qtd_total = _resumo_produto(itens_db, db)
      itens_out = []
      for it in itens_db:
        p = db.query(models.Produto).filter(models.Produto.id == it.produto_id).first()
        itens_out.append({
          "id":         it.id,
          "produto_id": it.produto_id,
          "produto":    p.nome if p else "—",
          "qtd":        it.qtd,
          "preco_unit": float(it.preco_unit),
          "subtotal":   float(it.subtotal),
        })
    else:
      # Venda legado (campo produto_id direto)
      p = db.query(models.Produto).filter(models.Produto.id == v.produto_id).first() if v.produto_id else None
      nome_prod = p.nome if p else "—"
      qtd_total = v.qtd or 0
      itens_out = [{
        "id":         None,
        "produto_id": v.produto_id,
        "produto":    nome_prod,
        "qtd":        qtd_total,
        "preco_unit": float(v.subtotal / qtd_total) if qtd_total else 0,
        "subtotal":   float(v.subtotal),
      }] if v.produto_id else []

    resultado.append({
      "id":             v.id,
      "codigo":         v.codigo,
      "cliente_id":     v.cliente_id,
      "cliente":        c.nome if c else "—",
      "cliente_status": c.status if c else "ativo",
      "vendedor_id":    v.vendedor_id,
      "vendedor":       ve.nome if ve else "—",
      "produto":        nome_prod,
      "qtd":            qtd_total,
      "itens":          itens_out,
      "subtotal":       float(v.subtotal),
      "juros":          float(v.juros),
      "total":          float(v.total),
      "parcelas":       v.parcelas,
      "status":         v.status,
      "data":           v.data or "—",
    })
  return resultado

@router.post("/")
def criar(dados: VendaSchema, db: Session = Depends(get_db)):
  if not dados.itens:
    raise HTTPException(400, "A venda deve ter pelo menos um item")

  c = db.query(models.Cliente).filter(models.Cliente.id == dados.cliente_id).first()
  if c and c.status == 'bloqueado':
    raise HTTPException(400, "Cliente bloqueado")

  # Calcula subtotal a partir dos itens
  subtotal = sum(it.preco_unit * it.qtd for it in dados.itens)
  juros    = dados.juros
  total    = subtotal + juros

  count  = db.query(models.Venda).count()
  codigo = f"VD{str(count + 1).zfill(3)}"

  v = models.Venda(
    codigo      = codigo,
    data        = datetime.now().strftime("%d/%m/%Y %H:%M"),
    cliente_id  = dados.cliente_id,
    vendedor_id = dados.vendedor_id,
    produto_id  = None,  # multi-item: não usa campo legado
    qtd         = None,
    subtotal    = subtotal,
    juros       = juros,
    total       = total,
    parcelas    = dados.parcelas,
    status      = dados.status,
  )
  db.add(v)
  db.flush()   # garante v.id antes de criar os itens

  for it in dados.itens:
    item = models.VendaItem(
      venda_id   = v.id,
      produto_id = it.produto_id,
      qtd        = it.qtd,
      preco_unit = it.preco_unit,
      subtotal   = it.preco_unit * it.qtd,
    )
    db.add(item)

  db.commit()
  db.refresh(v)
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
  # VendaItem usa ondelete=CASCADE no FK, mas garantimos aqui também
  db.query(models.VendaItem).filter(models.VendaItem.venda_id == id).delete()
  db.delete(v); db.commit()
  return {"ok": True}
