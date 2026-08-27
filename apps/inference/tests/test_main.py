import os

os.environ["INFERENCE_SERVICE_TOKEN"] = "test-token-which-is-long-enough"
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
headers = {"Authorization": "Bearer test-token-which-is-long-enough"}


def test_brain_dump_contract_shape():
    response = client.post("/v1/brain-dump", headers=headers, json={"content": "Tôi đang kẹt bài báo cáo"})
    assert response.status_code == 200
    assert response.json()["output"]["candidates"][0]["minutes"] == 5


def test_rejects_unauthenticated_callers():
    assert client.post("/v1/help-me-start", json={"content": "Viết email"}).status_code == 401
