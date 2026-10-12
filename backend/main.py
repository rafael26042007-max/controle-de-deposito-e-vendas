from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine
import models
from routers import auth, produtos, clientes, vendedores, materias, vendas, producao
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NhLencois API", version="1.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
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

app.mount("/", StaticFiles(directory="..", html=True), name="frontend")

@app.get("/api")
def root():
  return {"status": "NhLencois API rodando!"}
