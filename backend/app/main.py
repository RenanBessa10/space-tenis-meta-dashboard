from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .meta_router import router as meta_router


app = FastAPI(title="Space Tênis Meta Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta_router)


@app.get("/")
def read_root() -> dict:
    return {"message": "Space Tênis Meta Dashboard API"}
