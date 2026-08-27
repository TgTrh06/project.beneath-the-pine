"""Beneath Pine local inference service.

Start in safe mock mode: `uv run uvicorn app.main:app --port 8010`.
Set BENEATH_PINE_GGUF_PATH and install the `local` extra to use a merged GGUF.
The Node API is the only intended caller; this service rejects missing bearer tokens.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Beneath Pine Inference", version="0.1.0")
TOKEN = os.getenv("INFERENCE_SERVICE_TOKEN", "")
MODEL_PATH = os.getenv("BENEATH_PINE_GGUF_PATH", "")
MODEL_VERSION = os.getenv("BENEATH_PINE_MODEL_VERSION", "manual-fixture-v0")


class GenerateInput(BaseModel):
    content: str = Field(min_length=3, max_length=6000)


def require_token(authorization: str | None) -> None:
    if not TOKEN or authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized inference caller")


def crisis(content: str) -> dict[str, object]:
    terms = ("tự sát", "muốn chết", "làm hại bản thân", "không muốn sống", "suicide", "kill myself")
    if any(term in content.lower() for term in terms):
        return {"needsHumanSupport": True, "message": "Bạn không cần ở một mình với điều này. Hãy liên hệ ngay người bạn tin cậy hoặc dịch vụ khẩn cấp nơi bạn đang ở."}
    return {"needsHumanSupport": False}


def model_generate(kind: Literal["brain_dump", "help_me_start"], content: str) -> dict[str, object]:
    """Loads llama.cpp only when a reviewed GGUF artifact is supplied.

    The fallback deliberately stays deterministic so unreviewed model output is
    never silently served during pilot preparation.
    """
    if not MODEL_PATH or not Path(MODEL_PATH).is_file():
        return fixture(kind, content)
    try:
        from llama_cpp import Llama  # type: ignore[import-not-found]
        model = Llama(model_path=MODEL_PATH, n_ctx=2048, n_gpu_layers=-1, verbose=False)
        prompt = prompt_for(kind, content)
        response = model.create_chat_completion(messages=[{"role": "system", "content": "Bạn là Beneath Pine AI. Chỉ trả về JSON hợp lệ theo schema."}, {"role": "user", "content": prompt}], temperature=0.2, response_format={"type": "json_object"})
        return json.loads(response["choices"][0]["message"]["content"])
    except Exception:
        return fixture(kind, content)


def prompt_for(kind: str, content: str) -> str:
    if kind == "brain_dump":
        return f"Brain Dump: {content}\nTrả acknowledgement, 1-4 candidates (title, minutes 1-10) và safety."
    return f"Task/context: {content}\nTrả acknowledgement, tinyStep, tối đa 3 options, minutes 1-10 và safety."


def fixture(kind: str, content: str) -> dict[str, object]:
    safety = crisis(content)
    if kind == "brain_dump":
        return {"acknowledgement": "Mình đã nhận được. Ta chỉ cần tìm một bước thật nhỏ.", "candidates": [{"title": f"Mở phần liên quan đến “{content[:80]}” và viết một gạch đầu dòng", "minutes": 5}], "safety": safety}
    return {"acknowledgement": "Mình sẽ làm nhỏ bước này cùng bạn.", "tinyStep": f"Mở phần liên quan đến “{content[:80]}” và chỉ viết một dòng đầu tiên.", "options": ["Làm trong 2 phút", "Chuẩn bị không gian", "Viết một gạch đầu dòng"], "minutes": 5, "safety": safety}


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "mode": "local_gguf" if MODEL_PATH and Path(MODEL_PATH).is_file() else "fixture", "modelVersion": MODEL_VERSION}


@app.post("/v1/brain-dump")
def brain_dump(input: GenerateInput, authorization: str | None = Header(default=None)) -> dict[str, object]:
    require_token(authorization)
    return {"output": model_generate("brain_dump", input.content), "modelVersion": MODEL_VERSION}


@app.post("/v1/help-me-start")
def help_me_start(input: GenerateInput, authorization: str | None = Header(default=None)) -> dict[str, object]:
    require_token(authorization)
    return {"output": model_generate("help_me_start", input.content), "modelVersion": MODEL_VERSION}
