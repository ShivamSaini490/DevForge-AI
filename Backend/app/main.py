from fastapi import FastAPI

from app.api.router import api_router

app = FastAPI(
    title="DevForge AI",
    version="0.1.0",
)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}


app.include_router(api_router, prefix="/api")