from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models
from auth import verificar_senha, criar_token

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    usuario: str
    senha: str

@router.post("/login")
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(
        models.Usuario.usuario == dados.usuario
    ).first()
    if not user or not verificar_senha(dados.senha, user.senha):
        raise HTTPException(status_code=401, detail="Usuario ou senha incorretos")
    token = criar_token({"sub": user.usuario, "perfil": user.perfil})
    return {"token": token, "perfil": user.perfil, "nome": user.nome}
