from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Usuario
from passlib.context import CryptContext

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── HELPERS ──
def hash_senha(senha: str) -> str:
  return pwd_context.hash(senha)

def verificar_senha(senha: str, hash: str) -> bool:
  return pwd_context.verify(senha, hash)

def gerar_codigo(db: Session) -> str:
  count = db.query(Usuario).count()
  return f"U{str(count + 1).zfill(3)}"


# ── SCHEMAS ──
class UsuarioBase(BaseModel):
  nome:    str
  usuario: str
  perfil:  str = "vendedor"   # admin | vendedor | producao
  status:  str = "ativo"      # ativo | inativo

class UsuarioCreate(UsuarioBase):
  senha: str

class UsuarioUpdate(UsuarioBase):
  senha: Optional[str] = None   # None = manter senha atual

class UsuarioOut(UsuarioBase):
  id:     int
  codigo: str

  class Config:
    from_attributes = True

class LoginIn(BaseModel):
  usuario: str
  senha:   str
  perfil:  str


# ── GET /usuarios ── listar todos
@router.get("/", response_model=List[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
  return db.query(Usuario).order_by(Usuario.id).all()


# ── POST /usuarios/login ── (antes do /{id} para não colidir com a rota dinâmica)
@router.post("/login")
def login(dados: LoginIn, db: Session = Depends(get_db)):
  u = db.query(Usuario).filter(
    Usuario.usuario == dados.usuario,
    Usuario.perfil  == dados.perfil,
    Usuario.status  == "ativo"
  ).first()

  if not u or not verificar_senha(dados.senha, u.senha):
    raise HTTPException(status_code=401, detail="Credenciais inválidas")

  return {
    "ok": True,
    "usuario": {
      "id":      u.id,
      "codigo":  u.codigo,
      "nome":    u.nome,
      "usuario": u.usuario,
      "perfil":  u.perfil,
      "status":  u.status,
    }
  }


# ── GET /usuarios/{id} ── buscar um
@router.get("/{usuario_id}", response_model=UsuarioOut)
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
  u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
  if not u:
    raise HTTPException(status_code=404, detail="Usuário não encontrado")
  return u


# ── POST /usuarios ── criar
@router.post("/", response_model=UsuarioOut, status_code=201)
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
  if db.query(Usuario).filter(Usuario.usuario == dados.usuario).first():
    raise HTTPException(status_code=400, detail=f"Usuário '{dados.usuario}' já existe")

  u = Usuario(
    codigo  = gerar_codigo(db),
    nome    = dados.nome,
    usuario = dados.usuario,
    senha   = hash_senha(dados.senha),
    perfil  = dados.perfil,
    status  = dados.status,
  )
  db.add(u)
  db.commit()
  db.refresh(u)
  return u


# ── PUT /usuarios/{id} ── atualizar
@router.put("/{usuario_id}", response_model=UsuarioOut)
def atualizar_usuario(usuario_id: int, dados: UsuarioUpdate, db: Session = Depends(get_db)):
  u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
  if not u:
    raise HTTPException(status_code=404, detail="Usuário não encontrado")

  # impede remover o último admin ativo
  if u.perfil == "admin":
    outros_admins = db.query(Usuario).filter(
      Usuario.perfil == "admin",
      Usuario.status == "ativo",
      Usuario.id     != usuario_id
    ).count()
    if outros_admins == 0 and (dados.perfil != "admin" or dados.status != "ativo"):
      raise HTTPException(
        status_code=400,
        detail="Não é possível alterar o único administrador ativo"
      )

  # verifica duplicado de nome de usuário
  dup = db.query(Usuario).filter(
    Usuario.usuario == dados.usuario,
    Usuario.id      != usuario_id
  ).first()
  if dup:
    raise HTTPException(status_code=400, detail=f"Usuário '{dados.usuario}' já existe")

  u.nome    = dados.nome
  u.usuario = dados.usuario
  u.perfil  = dados.perfil
  u.status  = dados.status
  if dados.senha:
    u.senha = hash_senha(dados.senha)

  db.commit()
  db.refresh(u)
  return u


# ── DELETE /usuarios/{id} ── excluir
@router.delete("/{usuario_id}", status_code=204)
def excluir_usuario(usuario_id: int, db: Session = Depends(get_db)):
  u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
  if not u:
    raise HTTPException(status_code=404, detail="Usuário não encontrado")

  # impede excluir o último admin ativo
  if u.perfil == "admin" and u.status == "ativo":
    count = db.query(Usuario).filter(
      Usuario.perfil == "admin",
      Usuario.status == "ativo"
    ).count()
    if count <= 1:
      raise HTTPException(
        status_code=400,
        detail="Não é possível excluir o único administrador ativo"
      )

  db.delete(u)
  db.commit()
