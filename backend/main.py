import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine
import models
from routers import produtos, clientes, vendedores, materias, vendas, producao, usuarios, auth

app = FastAPI(title="NhLencois API", version="1.0.0")

models.Base.metadata.create_all(bind=engine)

# BUG-FIX: CORS restrito — defina ALLOWED_ORIGINS=http://seudominio.com em produção
_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
  CORSMiddleware,
  allow_origins=allowed_origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(produtos.router)
app.include_router(clientes.router)
app.include_router(vendedores.router)
app.include_router(materias.router)
app.include_router(vendas.router)
app.include_router(producao.router)
app.include_router(usuarios.router)

#app.mount("/", StaticFiles(directory="..", html=True), name="frontend")

@app.get("/api")
def root():
  return {"status": "NhLencois API rodando!"}

# ── Setup inicial: cria o primeiro admin sem precisar de CLI ──────────────────
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from pydantic import BaseModel
from passlib.context import CryptContext as _Ctx
from auth import hash_senha as _hash

class SetupRequest(BaseModel):
  nome:    str = "Administrador"
  usuario: str = "admin"
  senha:   str

@app.get("/setup")
def setup_status(db: Session = Depends(get_db)):
  """Retorna se o sistema já foi configurado (tem usuários)."""
  total = db.query(models.Usuario).count()
  return {"configured": total > 0, "total_usuarios": total}

@app.post("/setup/init")
def setup_init(dados: SetupRequest, db: Session = Depends(get_db)):
  """Cria o primeiro usuário admin. Só funciona quando não existe nenhum usuário."""
  total = db.query(models.Usuario).count()
  if total > 0:
    from fastapi import HTTPException
    raise HTTPException(400, "Sistema já configurado. Use a tela de Usuários.")

  u = models.Usuario(
    codigo  = "U001",
    nome    = dados.nome,
    usuario = dados.usuario,
    senha   = _hash(dados.senha),
    perfil  = "admin",
    status  = "ativo",
  )
  db.add(u)
  db.commit()
  return {"ok": True, "usuario": dados.usuario, "perfil": "admin"}
