"""
seed_admin.py — Cria o primeiro usuário administrador.

Uso:
    cd backend
    python seed_admin.py

    # ou com credenciais customizadas:
    python seed_admin.py --usuario admin --senha minhasenha --nome "João Admin"
"""
import sys
import os
import argparse

# adiciona o diretório atual ao path para importar os módulos do projeto
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import Usuario
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def main():
    parser = argparse.ArgumentParser(description="Cria o primeiro admin do sistema")
    parser.add_argument("--usuario", default="admin",         help="Nome de usuário (padrão: admin)")
    parser.add_argument("--senha",   default="admin123",      help="Senha (padrão: admin123)")
    parser.add_argument("--nome",    default="Administrador", help="Nome completo")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        total = db.query(Usuario).count()
        if total > 0:
            print(f"⚠️  Já existem {total} usuário(s) cadastrado(s).")
            print("   Use a tela de Usuários no sistema para adicionar mais.")
            return

        u = Usuario(
            codigo  = "U001",
            nome    = args.nome,
            usuario = args.usuario,
            senha   = pwd_context.hash(args.senha),
            perfil  = "admin",
            status  = "ativo",
        )
        db.add(u)
        db.commit()

        print("✅ Usuário admin criado com sucesso!")
        print(f"   Usuário : {args.usuario}")
        print(f"   Senha   : {args.senha}")
        print(f"   Perfil  : admin")
        print()
        print("⚠️  IMPORTANTE: troque a senha após o primeiro login!")

    finally:
        db.close()

if __name__ == "__main__":
    main()
