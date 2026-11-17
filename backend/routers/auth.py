from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth import verificar_senha, criar_token

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    usuario: str
    senha:   str
    perfil:  Optional[str] = None   # admin | vendedor | producao

@router.post("/login")
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(
        models.Usuario.usuario == dados.usuario
    ).first()

    # senha incorreta ou usuário não existe
    if not user or not verificar_senha(dados.senha, user.senha):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")

    # BUG-FIX: rejeita usuários inativos
    if user.status != "ativo":
        raise HTTPException(status_code=403, detail="Usuário inativo. Fale com o administrador.")

    # BUG-FIX: valida perfil selecionado na tela de login
    if dados.perfil and user.perfil != dados.perfil:
        raise HTTPException(
            status_code=403,
            detail=f"Usuário '{dados.usuario}' não tem perfil '{dados.perfil}'"
        )

    token = criar_token({"sub": user.usuario, "perfil": user.perfil})
    return {"token": token, "perfil": user.perfil, "nome": user.nome}
