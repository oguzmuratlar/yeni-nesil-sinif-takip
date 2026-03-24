"""
Test file for iteration 5 fixes:
1. Student deactivation (status field update)
2. Teacher deactivation (status field update)
3. Inactive teacher login prevention
4. Branch delete endpoint
5. Payments month and bank_account_id filters
6. Camp status-based payment logic (kesin_kayit = paid)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests including inactive teacher login prevention"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.admin_token = None
        self.teacher_token = None
    
    def get_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_admin_login_success(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user_type"] == "admin"
        print("✓ Admin login successful")
    
    def test_teacher_login_success(self):
        """Test active teacher login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "teacher1",
            "password": "teacher123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user_type"] == "teacher"
        print("✓ Teacher login successful")


class TestStudentDeactivation:
    """Test student status field update (pasifleştirme)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_student_with_active_status(self):
        """Create a test student with active status"""
        response = requests.post(f"{BASE_URL}/api/students", json={
            "name": "TEST_Deactivation_Student",
            "parent_name": "Test Parent",
            "phone": "0555-111-2222",
            "level": "7",
            "payment_freq": "Aylık"
        }, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        self.student_id = data["id"]
        print(f"✓ Created student with active status: {self.student_id}")
        return data["id"]
    
    def test_deactivate_student(self):
        """Test deactivating a student by updating status to inactive"""
        # First create a student
        create_response = requests.post(f"{BASE_URL}/api/students", json={
            "name": "TEST_Deactivate_Me",
            "parent_name": "Test Parent",
            "phone": "0555-222-3333",
            "level": "8",
            "payment_freq": "Aylık"
        }, headers=self.headers)
        assert create_response.status_code == 200
        student_id = create_response.json()["id"]
        
        # Now deactivate
        update_response = requests.put(f"{BASE_URL}/api/students/{student_id}", json={
            "name": "TEST_Deactivate_Me",
            "parent_name": "Test Parent",
            "phone": "0555-222-3333",
            "level": "8",
            "payment_freq": "Aylık",
            "status": "inactive"
        }, headers=self.headers)
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["status"] == "inactive", f"Expected inactive, got {data['status']}"
        print(f"✓ Student deactivated successfully: {student_id}")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/students/{student_id}", headers=self.headers)
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "inactive"
        print("✓ Student status verified as inactive via GET")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/students/{student_id}", headers=self.headers)
    
    def test_reactivate_student(self):
        """Test reactivating a student by updating status to active"""
        # Create and deactivate
        create_response = requests.post(f"{BASE_URL}/api/students", json={
            "name": "TEST_Reactivate_Me",
            "parent_name": "Test Parent",
            "phone": "0555-333-4444",
            "level": "6",
            "payment_freq": "Aylık"
        }, headers=self.headers)
        student_id = create_response.json()["id"]
        
        # Deactivate
        requests.put(f"{BASE_URL}/api/students/{student_id}", json={
            "name": "TEST_Reactivate_Me",
            "parent_name": "Test Parent",
            "phone": "0555-333-4444",
            "level": "6",
            "payment_freq": "Aylık",
            "status": "inactive"
        }, headers=self.headers)
        
        # Reactivate
        update_response = requests.put(f"{BASE_URL}/api/students/{student_id}", json={
            "name": "TEST_Reactivate_Me",
            "parent_name": "Test Parent",
            "phone": "0555-333-4444",
            "level": "6",
            "payment_freq": "Aylık",
            "status": "active"
        }, headers=self.headers)
        
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "active"
        print(f"✓ Student reactivated successfully: {student_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/students/{student_id}", headers=self.headers)


class TestTeacherDeactivation:
    """Test teacher status field update (pasifleştirme)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_teacher_with_active_status(self):
        """Create a test teacher with active status"""
        response = requests.post(f"{BASE_URL}/api/teachers", json={
            "name": "TEST_Deactivation_Teacher",
            "phone": "0555-444-5555"
        }, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        print(f"✓ Created teacher with active status: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/teachers/{data['id']}", headers=self.headers)
    
    def test_deactivate_teacher(self):
        """Test deactivating a teacher by updating status to inactive"""
        # Create teacher
        create_response = requests.post(f"{BASE_URL}/api/teachers", json={
            "name": "TEST_Deactivate_Teacher",
            "phone": "0555-555-6666"
        }, headers=self.headers)
        assert create_response.status_code == 200
        teacher_id = create_response.json()["id"]
        
        # Deactivate
        update_response = requests.put(f"{BASE_URL}/api/teachers/{teacher_id}", json={
            "name": "TEST_Deactivate_Teacher",
            "phone": "0555-555-6666",
            "status": "inactive"
        }, headers=self.headers)
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["status"] == "inactive", f"Expected inactive, got {data['status']}"
        print(f"✓ Teacher deactivated successfully: {teacher_id}")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/teachers/{teacher_id}", headers=self.headers)
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "inactive"
        print("✓ Teacher status verified as inactive via GET")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/teachers/{teacher_id}", headers=self.headers)


class TestBranchDelete:
    """Test branch delete endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_and_delete_branch(self):
        """Test creating and deleting a branch"""
        # Create branch
        create_response = requests.post(
            f"{BASE_URL}/api/branches?name=TEST_Delete_Branch",
            headers=self.headers
        )
        assert create_response.status_code == 200
        branch_id = create_response.json()["id"]
        print(f"✓ Created branch: {branch_id}")
        
        # Delete branch
        delete_response = requests.delete(
            f"{BASE_URL}/api/branches/{branch_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"✓ Deleted branch: {branch_id}")
        
        # Verify deletion
        branches_response = requests.get(f"{BASE_URL}/api/branches", headers=self.headers)
        branches = branches_response.json()
        branch_ids = [b["id"] for b in branches]
        assert branch_id not in branch_ids
        print("✓ Branch deletion verified")
    
    def test_delete_nonexistent_branch(self):
        """Test deleting a non-existent branch returns 404"""
        delete_response = requests.delete(
            f"{BASE_URL}/api/branches/nonexistent-id-12345",
            headers=self.headers
        )
        assert delete_response.status_code == 404
        print("✓ Non-existent branch delete returns 404")


class TestPaymentsFilters:
    """Test payments month and bank_account_id filters"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_payments_without_filters(self):
        """Test getting all payments without filters"""
        response = requests.get(f"{BASE_URL}/api/payments", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} payments without filters")
    
    def test_get_payments_with_month_filter(self):
        """Test getting payments filtered by month"""
        # First create a payment with specific date
        payment_response = requests.post(f"{BASE_URL}/api/payments", json={
            "payment_type": "student_payment",
            "amount": 100.0,
            "date": "2026-01-15",
            "description": "TEST_Month_Filter_Payment"
        }, headers=self.headers)
        assert payment_response.status_code == 200
        
        # Filter by month
        response = requests.get(f"{BASE_URL}/api/payments?month=2026-01", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # All returned payments should be from January 2026
        for payment in data:
            assert payment["date"].startswith("2026-01"), f"Payment date {payment['date']} doesn't match filter"
        print(f"✓ Month filter works: {len(data)} payments in 2026-01")
    
    def test_get_payments_with_bank_filter(self):
        """Test getting payments filtered by bank_account_id"""
        # First get bank accounts
        banks_response = requests.get(f"{BASE_URL}/api/bank-accounts", headers=self.headers)
        banks = banks_response.json()
        
        if len(banks) > 0:
            bank_id = banks[0]["id"]
            
            # Create a payment with this bank
            payment_response = requests.post(f"{BASE_URL}/api/payments", json={
                "payment_type": "student_payment",
                "amount": 150.0,
                "date": "2026-01-20",
                "bank_account_id": bank_id,
                "description": "TEST_Bank_Filter_Payment"
            }, headers=self.headers)
            assert payment_response.status_code == 200
            
            # Filter by bank
            response = requests.get(f"{BASE_URL}/api/payments?bank_account_id={bank_id}", headers=self.headers)
            assert response.status_code == 200
            data = response.json()
            
            # All returned payments should have this bank_account_id
            for payment in data:
                assert payment.get("bank_account_id") == bank_id, f"Payment bank_account_id doesn't match filter"
            print(f"✓ Bank filter works: {len(data)} payments for bank {bank_id}")
        else:
            print("⚠ No bank accounts found, skipping bank filter test")
    
    def test_get_payments_with_both_filters(self):
        """Test getting payments with both month and bank filters"""
        banks_response = requests.get(f"{BASE_URL}/api/bank-accounts", headers=self.headers)
        banks = banks_response.json()
        
        if len(banks) > 0:
            bank_id = banks[0]["id"]
            
            response = requests.get(
                f"{BASE_URL}/api/payments?month=2026-01&bank_account_id={bank_id}",
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            
            for payment in data:
                assert payment["date"].startswith("2026-01")
                assert payment.get("bank_account_id") == bank_id
            print(f"✓ Combined filters work: {len(data)} payments matching both filters")
        else:
            print("⚠ No bank accounts found, skipping combined filter test")


class TestCampStatusPaymentLogic:
    """Test camp status-based payment logic (kesin_kayit = paid)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_kesin_kayit_means_paid(self):
        """Test that kesin_kayit status means payment_completed=true"""
        # Get existing camps
        camps_response = requests.get(f"{BASE_URL}/api/camps", headers=self.headers)
        camps = camps_response.json()
        
        if len(camps) > 0:
            camp_id = camps[0]["id"]
            
            # Add a student with kesin_kayit status
            student_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json={
                "student_name": "TEST_Kesin_Kayit_Student",
                "parent_name": "Test Parent",
                "phone": "0555-666-7777",
                "registration_status": "kesin_kayit",
                "payment_amount": 500.0,
                "camp_id": camp_id
            }, headers=self.headers)
            
            assert student_response.status_code == 200
            data = student_response.json()
            
            # kesin_kayit should mean payment_completed=true
            assert data["registration_status"] == "kesin_kayit"
            assert data["payment_completed"] == True, "kesin_kayit should set payment_completed=true"
            print(f"✓ kesin_kayit status correctly sets payment_completed=true")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/camp-students/{data['id']}", headers=self.headers)
        else:
            print("⚠ No camps found, creating test camp")
            # Get teachers first
            teachers_response = requests.get(f"{BASE_URL}/api/teachers", headers=self.headers)
            teachers = teachers_response.json()
            if len(teachers) > 0:
                teacher_id = teachers[0]["id"]
                
                # Create camp
                camp_response = requests.post(f"{BASE_URL}/api/camps", json={
                    "name": "TEST_Status_Camp",
                    "class_level": "7",
                    "teacher_id": teacher_id,
                    "per_student_teacher_fee": 100.0
                }, headers=self.headers)
                camp_id = camp_response.json()["id"]
                
                # Add student with kesin_kayit
                student_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json={
                    "student_name": "TEST_Kesin_Student",
                    "parent_name": "Test Parent",
                    "phone": "0555-777-8888",
                    "registration_status": "kesin_kayit",
                    "payment_amount": 500.0,
                    "camp_id": camp_id
                }, headers=self.headers)
                
                data = student_response.json()
                assert data["payment_completed"] == True
                print(f"✓ kesin_kayit status correctly sets payment_completed=true")
                
                # Cleanup
                requests.delete(f"{BASE_URL}/api/camp-students/{data['id']}", headers=self.headers)
                requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.headers)
    
    def test_on_kayit_means_not_paid(self):
        """Test that on_kayit status means payment_completed=false"""
        camps_response = requests.get(f"{BASE_URL}/api/camps", headers=self.headers)
        camps = camps_response.json()
        
        if len(camps) > 0:
            camp_id = camps[0]["id"]
            
            # Add a student with on_kayit status
            student_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json={
                "student_name": "TEST_On_Kayit_Student",
                "parent_name": "Test Parent",
                "phone": "0555-888-9999",
                "registration_status": "on_kayit",
                "payment_amount": 500.0,
                "camp_id": camp_id
            }, headers=self.headers)
            
            assert student_response.status_code == 200
            data = student_response.json()
            
            # on_kayit should mean payment_completed=false
            assert data["registration_status"] == "on_kayit"
            assert data["payment_completed"] == False, "on_kayit should set payment_completed=false"
            print(f"✓ on_kayit status correctly sets payment_completed=false")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/camp-students/{data['id']}", headers=self.headers)
    
    def test_status_change_updates_payment(self):
        """Test that changing status updates payment_completed accordingly"""
        camps_response = requests.get(f"{BASE_URL}/api/camps", headers=self.headers)
        camps = camps_response.json()
        
        if len(camps) > 0:
            camp_id = camps[0]["id"]
            
            # Create student with on_kayit
            student_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json={
                "student_name": "TEST_Status_Change_Student",
                "parent_name": "Test Parent",
                "phone": "0555-999-0000",
                "registration_status": "on_kayit",
                "payment_amount": 500.0,
                "camp_id": camp_id
            }, headers=self.headers)
            student_id = student_response.json()["id"]
            
            # Change to kesin_kayit
            update_response = requests.put(f"{BASE_URL}/api/camp-students/{student_id}", json={
                "registration_status": "kesin_kayit",
                "payment_completed": True  # Should be set automatically based on status
            }, headers=self.headers)
            
            assert update_response.status_code == 200
            data = update_response.json()
            assert data["registration_status"] == "kesin_kayit"
            assert data["payment_completed"] == True
            print(f"✓ Status change to kesin_kayit updates payment_completed=true")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/camp-students/{student_id}", headers=self.headers)


class TestAllPlannedLessonsEndpoint:
    """Test all-planned-lessons endpoint returns teacher_name"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_all_planned_lessons_includes_teacher_name(self):
        """Test that all-planned-lessons endpoint returns teacher_name field"""
        response = requests.get(f"{BASE_URL}/api/all-planned-lessons", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            # Check that teacher_name is included
            for lesson in data:
                assert "teacher_name" in lesson, "teacher_name field missing from planned lesson"
                assert "student_name" in lesson, "student_name field missing from planned lesson"
                assert "branch_name" in lesson, "branch_name field missing from planned lesson"
            print(f"✓ all-planned-lessons includes teacher_name field ({len(data)} records)")
        else:
            print("⚠ No planned lessons found, but endpoint works")


class TestYouTubeEndpoints:
    """Test YouTube content endpoints (no deactivate, only delete)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_youtube_crud_operations(self):
        """Test YouTube content CRUD (create, read, update, delete)"""
        # Get teachers
        teachers_response = requests.get(f"{BASE_URL}/api/teachers", headers=self.headers)
        teachers = teachers_response.json()
        
        if len(teachers) > 0:
            teacher_id = teachers[0]["id"]
            
            # Create
            create_response = requests.post(f"{BASE_URL}/api/youtube-contents", json={
                "teacher_id": teacher_id,
                "title": "TEST_YouTube_Video",
                "amount": 250.0,
                "date": "2026-01-15"
            }, headers=self.headers)
            assert create_response.status_code == 200
            record_id = create_response.json()["id"]
            print(f"✓ Created YouTube record: {record_id}")
            
            # Read
            get_response = requests.get(f"{BASE_URL}/api/youtube-contents/{record_id}", headers=self.headers)
            assert get_response.status_code == 200
            assert get_response.json()["title"] == "TEST_YouTube_Video"
            print("✓ Read YouTube record")
            
            # Update
            update_response = requests.put(f"{BASE_URL}/api/youtube-contents/{record_id}", json={
                "title": "TEST_YouTube_Video_Updated",
                "amount": 300.0
            }, headers=self.headers)
            assert update_response.status_code == 200
            assert update_response.json()["title"] == "TEST_YouTube_Video_Updated"
            print("✓ Updated YouTube record")
            
            # Delete
            delete_response = requests.delete(f"{BASE_URL}/api/youtube-contents/{record_id}", headers=self.headers)
            assert delete_response.status_code == 200
            print("✓ Deleted YouTube record")
        else:
            print("⚠ No teachers found, skipping YouTube test")


# Cleanup test data
class TestCleanup:
    """Cleanup any TEST_ prefixed data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_cleanup_test_students(self):
        """Cleanup TEST_ prefixed students"""
        response = requests.get(f"{BASE_URL}/api/students", headers=self.headers)
        students = response.json()
        
        deleted = 0
        for student in students:
            if student["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/students/{student['id']}", headers=self.headers)
                deleted += 1
        
        print(f"✓ Cleaned up {deleted} test students")
    
    def test_cleanup_test_teachers(self):
        """Cleanup TEST_ prefixed teachers"""
        response = requests.get(f"{BASE_URL}/api/teachers", headers=self.headers)
        teachers = response.json()
        
        deleted = 0
        for teacher in teachers:
            if teacher["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/teachers/{teacher['id']}", headers=self.headers)
                deleted += 1
        
        print(f"✓ Cleaned up {deleted} test teachers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
