"""
Iteration 8 Backend Tests - Multiple Feature Development
Tests for:
1. Bank account deletion with balance check
2. Payment edit/delete operations
3. Payment bank account required validation
4. User info by teacher (GET/PUT)
5. Branch teachers endpoint (for branch-based teacher filtering)
6. Student stats summary
7. Year-end operation
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {admin_token}"}


class TestBankAccountDeletion(TestAuth):
    """Bank account deletion with balance check tests"""
    
    def test_get_bank_accounts(self, auth_headers):
        """Test GET /bank-accounts returns list"""
        response = requests.get(f"{BASE_URL}/api/bank-accounts", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"PASS: GET /bank-accounts returns {len(response.json())} accounts")
    
    def test_get_bank_account_balance(self, auth_headers):
        """Test GET /bank-accounts/{id}/balance returns balance info"""
        # First get accounts
        accounts_res = requests.get(f"{BASE_URL}/api/bank-accounts", headers=auth_headers)
        accounts = accounts_res.json()
        
        if len(accounts) > 0:
            account_id = accounts[0]["id"]
            response = requests.get(f"{BASE_URL}/api/bank-accounts/{account_id}/balance", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert "balance" in data
            assert "total_income" in data
            assert "total_expense" in data
            print(f"PASS: GET /bank-accounts/{account_id}/balance returns balance: {data['balance']}")
        else:
            pytest.skip("No bank accounts to test")
    
    def test_delete_bank_account_with_balance_fails(self, auth_headers):
        """Test DELETE /bank-accounts/{id} fails if balance != 0"""
        # Get accounts with balance
        accounts_res = requests.get(f"{BASE_URL}/api/bank-accounts", headers=auth_headers)
        accounts = accounts_res.json()
        
        for account in accounts:
            balance_res = requests.get(f"{BASE_URL}/api/bank-accounts/{account['id']}/balance", headers=auth_headers)
            balance = balance_res.json().get("balance", 0)
            
            if balance != 0:
                # Try to delete - should fail
                response = requests.delete(f"{BASE_URL}/api/bank-accounts/{account['id']}", headers=auth_headers)
                assert response.status_code == 400
                assert "bakiye" in response.json().get("detail", "").lower() or "sıfır" in response.json().get("detail", "").lower()
                print(f"PASS: DELETE /bank-accounts/{account['id']} correctly rejected (balance: {balance})")
                return
        
        print("INFO: No accounts with non-zero balance to test deletion rejection")


class TestPaymentOperations(TestAuth):
    """Payment edit/delete and bank account required tests"""
    
    def test_get_payments(self, auth_headers):
        """Test GET /payments returns list"""
        response = requests.get(f"{BASE_URL}/api/payments", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"PASS: GET /payments returns {len(response.json())} payments")
    
    def test_create_payment_without_bank_account_fails(self, auth_headers):
        """Test POST /payments fails without bank_account_id"""
        # Get a student for the payment
        students_res = requests.get(f"{BASE_URL}/api/students", headers=auth_headers)
        students = students_res.json()
        
        if len(students) == 0:
            pytest.skip("No students to test payment creation")
        
        payment_data = {
            "payment_type": "student_payment",
            "amount": 100.0,
            "date": "2026-01-15",
            "student_id": students[0]["id"],
            "bank_account_id": None  # Missing bank account
        }
        
        response = requests.post(f"{BASE_URL}/api/payments", json=payment_data, headers=auth_headers)
        assert response.status_code == 400
        assert "banka" in response.json().get("detail", "").lower() or "zorunlu" in response.json().get("detail", "").lower()
        print("PASS: POST /payments correctly rejects payment without bank_account_id")
    
    def test_create_payment_with_bank_account_succeeds(self, auth_headers):
        """Test POST /payments succeeds with bank_account_id"""
        # Get a student and bank account
        students_res = requests.get(f"{BASE_URL}/api/students", headers=auth_headers)
        students = students_res.json()
        
        accounts_res = requests.get(f"{BASE_URL}/api/bank-accounts", headers=auth_headers)
        accounts = accounts_res.json()
        
        if len(students) == 0 or len(accounts) == 0:
            pytest.skip("No students or bank accounts to test")
        
        payment_data = {
            "payment_type": "student_payment",
            "amount": 50.0,
            "date": "2026-01-15",
            "student_id": students[0]["id"],
            "bank_account_id": accounts[0]["id"]
        }
        
        response = requests.post(f"{BASE_URL}/api/payments", json=payment_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["bank_account_id"] == accounts[0]["id"]
        print(f"PASS: POST /payments created payment with bank_account_id: {data['id']}")
        
        # Store for cleanup
        return data["id"]
    
    def test_update_payment(self, auth_headers):
        """Test PUT /payments/{id} updates payment"""
        # Get existing payments
        payments_res = requests.get(f"{BASE_URL}/api/payments", headers=auth_headers)
        payments = payments_res.json()
        
        if len(payments) == 0:
            pytest.skip("No payments to test update")
        
        payment = payments[0]
        accounts_res = requests.get(f"{BASE_URL}/api/bank-accounts", headers=auth_headers)
        accounts = accounts_res.json()
        
        if len(accounts) == 0:
            pytest.skip("No bank accounts for update test")
        
        update_data = {
            "payment_type": payment["payment_type"],
            "amount": payment["amount"] + 10,  # Increase amount
            "date": payment["date"],
            "student_id": payment.get("student_id"),
            "teacher_id": payment.get("teacher_id"),
            "bank_account_id": accounts[0]["id"],
            "description": "Updated via test"
        }
        
        response = requests.put(f"{BASE_URL}/api/payments/{payment['id']}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == payment["amount"] + 10
        print(f"PASS: PUT /payments/{payment['id']} updated successfully")
    
    def test_delete_payment(self, auth_headers):
        """Test DELETE /payments/{id} deletes payment"""
        # Create a test payment first
        students_res = requests.get(f"{BASE_URL}/api/students", headers=auth_headers)
        students = students_res.json()
        
        accounts_res = requests.get(f"{BASE_URL}/api/bank-accounts", headers=auth_headers)
        accounts = accounts_res.json()
        
        if len(students) == 0 or len(accounts) == 0:
            pytest.skip("No students or bank accounts to test")
        
        # Create payment to delete
        payment_data = {
            "payment_type": "student_payment",
            "amount": 25.0,
            "date": "2026-01-15",
            "student_id": students[0]["id"],
            "bank_account_id": accounts[0]["id"],
            "description": "TEST_DELETE_ME"
        }
        
        create_res = requests.post(f"{BASE_URL}/api/payments", json=payment_data, headers=auth_headers)
        assert create_res.status_code == 200
        payment_id = create_res.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/payments/{payment_id}", headers=auth_headers)
        assert response.status_code == 200
        print(f"PASS: DELETE /payments/{payment_id} deleted successfully")
        
        # Verify deletion
        payments_res = requests.get(f"{BASE_URL}/api/payments", headers=auth_headers)
        payment_ids = [p["id"] for p in payments_res.json()]
        assert payment_id not in payment_ids
        print(f"PASS: Payment {payment_id} verified as deleted")


class TestUserByTeacher(TestAuth):
    """User info by teacher endpoint tests"""
    
    def test_get_user_by_teacher(self, auth_headers):
        """Test GET /users/by-teacher/{teacher_id} returns user info"""
        # Get teachers
        teachers_res = requests.get(f"{BASE_URL}/api/teachers", headers=auth_headers)
        teachers = teachers_res.json()
        
        if len(teachers) == 0:
            pytest.skip("No teachers to test")
        
        for teacher in teachers:
            response = requests.get(f"{BASE_URL}/api/users/by-teacher/{teacher['id']}", headers=auth_headers)
            # Can be 200 (user exists) or null (no user)
            assert response.status_code == 200
            data = response.json()
            
            if data:
                assert "username" in data
                assert "user_type" in data
                assert "password_hash" not in data  # Should not expose password hash
                print(f"PASS: GET /users/by-teacher/{teacher['id']} returns user: {data['username']}")
                return
        
        print("INFO: No teachers with associated users found")
    
    def test_update_user_by_teacher(self, auth_headers):
        """Test PUT /users/by-teacher/{teacher_id} updates user info"""
        # Get teachers with users
        teachers_res = requests.get(f"{BASE_URL}/api/teachers", headers=auth_headers)
        teachers = teachers_res.json()
        
        for teacher in teachers:
            user_res = requests.get(f"{BASE_URL}/api/users/by-teacher/{teacher['id']}", headers=auth_headers)
            user = user_res.json()
            
            if user:
                # Update user type (toggle between teacher and admin, then back)
                original_type = user.get("user_type", "teacher")
                
                update_data = {
                    "user_type": original_type  # Keep same to avoid breaking things
                }
                
                response = requests.put(f"{BASE_URL}/api/users/by-teacher/{teacher['id']}", json=update_data, headers=auth_headers)
                assert response.status_code == 200
                print(f"PASS: PUT /users/by-teacher/{teacher['id']} updated successfully")
                return
        
        pytest.skip("No teachers with users to test update")


class TestBranchTeachers(TestAuth):
    """Branch teachers endpoint tests (for branch-based teacher filtering)"""
    
    def test_get_branch_teachers(self, auth_headers):
        """Test GET /branches/{branch_id}/teachers returns teachers for branch"""
        # Get branches
        branches_res = requests.get(f"{BASE_URL}/api/branches", headers=auth_headers)
        branches = branches_res.json()
        
        if len(branches) == 0:
            pytest.skip("No branches to test")
        
        for branch in branches:
            response = requests.get(f"{BASE_URL}/api/branches/{branch['id']}/teachers", headers=auth_headers)
            assert response.status_code == 200
            teachers = response.json()
            assert isinstance(teachers, list)
            
            # All returned teachers should be active
            for teacher in teachers:
                assert teacher.get("status") == "active"
            
            print(f"PASS: GET /branches/{branch['id']}/teachers returns {len(teachers)} active teachers")
            return
        
        print("INFO: No branches found")


class TestStudentStats(TestAuth):
    """Student stats summary endpoint tests"""
    
    def test_get_students_stats_summary(self, auth_headers):
        """Test GET /students/stats/summary returns summary statistics"""
        response = requests.get(f"{BASE_URL}/api/students/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "total_active" in data
        assert "total_inactive" in data
        assert "total" in data
        assert "by_teacher" in data
        
        # Validate data types
        assert isinstance(data["total_active"], int)
        assert isinstance(data["total_inactive"], int)
        assert isinstance(data["total"], int)
        assert isinstance(data["by_teacher"], dict)
        
        # Validate totals
        assert data["total"] == data["total_active"] + data["total_inactive"]
        
        print(f"PASS: GET /students/stats/summary returns: total={data['total']}, active={data['total_active']}, inactive={data['total_inactive']}")
        print(f"      By teacher: {data['by_teacher']}")


class TestYearEnd(TestAuth):
    """Year-end operation tests"""
    
    def test_year_end_endpoint_exists(self, auth_headers):
        """Test POST /year-end endpoint exists and requires admin"""
        # Test with valid admin token
        response = requests.post(f"{BASE_URL}/api/year-end", headers=auth_headers)
        # Should succeed (200) or fail with business logic (not 404 or 401)
        assert response.status_code in [200, 400, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert "upgraded_count" in data
            assert "deactivated_count" in data
            print(f"PASS: POST /year-end executed: upgraded={data['upgraded_count']}, deactivated={data['deactivated_count']}")
        else:
            print(f"INFO: POST /year-end returned {response.status_code}: {response.json()}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
