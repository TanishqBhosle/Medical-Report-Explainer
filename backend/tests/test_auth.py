def test_register_and_login(client):
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "testpatient@example.com",
            "password": "StrongPassword123!",
            "display_name": "Test Patient"
        }
    )
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testpatient@example.com"

    # Duplicate registration should be rejected
    dup_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "testpatient@example.com",
            "password": "AnotherPassword123!"
        }
    )
    assert dup_res.status_code == 400
    assert dup_res.json()["error"]["code"] == "EMAIL_ALREADY_EXISTS"

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "testpatient@example.com",
            "password": "StrongPassword123!"
        }
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Invalid password login
    bad_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "testpatient@example.com",
            "password": "WrongPassword!"
        }
    )
    assert bad_res.status_code == 401
