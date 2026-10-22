import io
from app.models.user import User
from app.core.security import get_password_hash, create_access_token


def test_health_endpoints(client):
    live_res = client.get("/api/v1/health/live")
    assert live_res.status_code == 200
    assert live_res.json()["status"] == "healthy"

    ready_res = client.get("/api/v1/health/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "ready"


def test_cross_user_isolation(client, db_session):
    # Create User A
    user_a = User(
        email="usera@example.com",
        password_hash=get_password_hash("Pass123!"),
        status="active"
    )
    # Create User B
    user_b = User(
        email="userb@example.com",
        password_hash=get_password_hash("Pass123!"),
        status="active"
    )
    db_session.add_all([user_a, user_b])
    db_session.commit()

    token_a = create_access_token(user_a.id)
    token_b = create_access_token(user_b.id)

    # User A uploads a synthetic report
    synthetic_pdf = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
    upload_res = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token_a}"},
        files={"file": ("blood_report.pdf", io.BytesIO(synthetic_pdf), "application/pdf")},
        data={"consent_to_processing": "true"}
    )
    assert upload_res.status_code == 202
    report_id = upload_res.json()["report_id"]

    # User A can access the report
    get_a = client.get(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert get_a.status_code == 200

    # User B CANNOT access User A's report (returns 404 to avoid leaking existence)
    get_b = client.get(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert get_b.status_code == 404
    assert get_b.json()["error"]["code"] == "RESOURCE_NOT_FOUND"

    # User B cannot delete User A's report
    del_b = client.delete(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert del_b.status_code == 404
