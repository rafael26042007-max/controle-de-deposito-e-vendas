"""
seed_admin.py — Cria o primeiro usuário administrador.

Uso básico (usa o banco configurado no .env ou padrão):
    cd backend
    python seed_admin.py

Uso com SQLite local (sem precisar de MySQL/PostgreSQL):
    python seed_admin.py --sqlite

Uso com banco customizado:
    python seed_admin.py --db-url mysql+pymysql://user:pass@host/banco

Credenciais customizadas:
    python seed_admin.py --usuario rafael --senha minhasenha --nome "Rafael"
"""
import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_engine(db_url: str):
    return create_engine(db_url)

def main():
    parser = argparse.ArgumentParser(description="Cria o primeiro admin do sistema")
    parser.add_argument("--usuario",  default="admin",         help="Nome de usuário (padrão: admin)")
    parser.add_argument("--senha",    default="admin123",      help="Senha (padrão: admin123)")
    parser.add_argument("--nome",     default="Administrador", help="Nome completo")
    parser.add_argument("--sqlite",   action="store_true",     help="Usa SQLite local (sem precisar de MySQL)")
    parser.add_argument("--db-url",   default=None,            help="URL do banco (substitui .env)")
    args = parser.parse_args()

    # ── Define URL do banco ───────────────────────────────────────────────────
    if args.sqlite:
        db_url = "sqlite:///./nhlencois_local.db"
        print("🗄️  Usando SQLite local: backend/nhlencois_local.db")
    elif args.db_url:
        db_url = args.db_url
    else:
        # tenta carregar do .env, igual ao database.py
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/nhlencois")

    # ── Conecta e cria tabelas se não existirem ───────────────────────────────
    engine = get_engine(db_url)

    # importa os models DEPOIS de definir o engine para evitar conflito
    import models
    models.Base.metadata.create_all(bind=engine)

    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        total = db.query(models.Usuario).count()
        if total > 0:
            print(f"⚠️  Já existem {total} usuário(s) cadastrado(s).")
            print("   Use a tela de Usuários no sistema para adicionar mais.")
            return

        u = models.Usuario(
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

    except Exception as e:
        db.rollback()
        print(f"❌ Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
