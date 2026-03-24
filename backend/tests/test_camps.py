"""
Test suite for Camps module
Tests: Camp CRUD, Camp Students CRUD, Teacher Camp Access, Teacher Balance with Camp Earnings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCampsModule:
    """Tests for Camps module - Admin and Teacher functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.admin_token = None
        self.teacher_token = None
        self.teacher_id = None
        self.test_camp_id = None
        self.test_student_id = None
        
    def get_admin_token(self):
        """Get admin authentication token"""
        if self.admin_token:
            return self.admin_token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.admin_token = data["access_token"]
        return self.admin_token
    
    def get_teacher_token(self):
        """Get teacher authentication token"""
        if self.teacher_token:
            return self.teacher_token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "teacher1",
            "password": "teacher123"
        })
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        data = response.json()
        self.teacher_token = data["access_token"]
        self.teacher_id = data["teacher_id"]
        return self.teacher_token
    
    def admin_headers(self):
        return {"Authorization": f"Bearer {self.get_admin_token()}"}
    
    def teacher_headers(self):
        return {"Authorization": f"Bearer {self.get_teacher_token()}"}
    
    # ============= AUTH TESTS =============
    
    def test_admin_login(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user_type"] == "admin"
        print("PASS: Admin login successful")
    
    def test_teacher_login(self):
        """Test teacher login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "teacher1",
            "password": "teacher123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user_type"] == "teacher"
        assert data["teacher_id"] is not None
        print("PASS: Teacher login successful")
    
    # ============= ADMIN CAMP CRUD TESTS =============
    
    def test_admin_get_camps_list(self):
        """Test admin can get camps list"""
        response = requests.get(f"{BASE_URL}/api/camps", headers=self.admin_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin got {len(data)} camps")
    
    def test_admin_get_camps_with_completed(self):
        """Test admin can get camps including completed ones"""
        response = requests.get(f"{BASE_URL}/api/camps?include_completed=true", headers=self.admin_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin got {len(data)} camps (including completed)")
    
    def test_admin_create_camp(self):
        """Test admin can create a new camp"""
        # First get a teacher ID
        teachers_response = requests.get(f"{BASE_URL}/api/teachers", headers=self.admin_headers())
        assert teachers_response.status_code == 200
        teachers = teachers_response.json()
        assert len(teachers) > 0, "No teachers found"
        teacher_id = teachers[0]["id"]
        
        # Create camp
        camp_data = {
            "name": "TEST_Yaz Fen Kampı",
            "class_level": "8",
            "teacher_id": teacher_id,
            "per_student_teacher_fee": 200.0
        }
        response = requests.post(f"{BASE_URL}/api/camps", json=camp_data, headers=self.admin_headers())
        assert response.status_code == 200, f"Create camp failed: {response.text}"
        data = response.json()
        assert data["name"] == camp_data["name"]
        assert data["class_level"] == camp_data["class_level"]
        assert data["teacher_id"] == teacher_id
        assert data["per_student_teacher_fee"] == 200.0
        assert data["status"] == "active"
        self.test_camp_id = data["id"]
        print(f"PASS: Admin created camp: {data['name']}")
        return data["id"]
    
    def test_admin_get_single_camp(self):
        """Test admin can get a single camp"""
        # Get existing camp
        camps_response = requests.get(f"{BASE_URL}/api/camps", headers=self.admin_headers())
        camps = camps_response.json()
        if len(camps) == 0:
            pytest.skip("No camps to test")
        
        camp_id = camps[0]["id"]
        response = requests.get(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == camp_id
        print(f"PASS: Admin got camp: {data['name']}")
    
    def test_admin_update_camp(self):
        """Test admin can update a camp"""
        # Create a test camp first
        camp_id = self.test_admin_create_camp()
        
        # Update camp
        update_data = {
            "name": "TEST_Updated Fen Kampı",
            "per_student_teacher_fee": 250.0
        }
        response = requests.put(f"{BASE_URL}/api/camps/{camp_id}", json=update_data, headers=self.admin_headers())
        assert response.status_code == 200, f"Update camp failed: {response.text}"
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["per_student_teacher_fee"] == 250.0
        print(f"PASS: Admin updated camp: {data['name']}")
        
        # Cleanup - delete the test camp
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
    
    def test_admin_complete_camp(self):
        """Test admin can mark camp as completed"""
        # Create a test camp first
        camp_id = self.test_admin_create_camp()
        
        # Complete camp
        response = requests.put(f"{BASE_URL}/api/camps/{camp_id}/complete", headers=self.admin_headers())
        assert response.status_code == 200
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["status"] == "completed"
        print(f"PASS: Admin completed camp: {data['name']}")
        
        # Cleanup - delete the test camp
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
    
    def test_admin_delete_camp_without_participants(self):
        """Test admin can delete camp without participants"""
        # Create a test camp first
        camp_id = self.test_admin_create_camp()
        
        # Delete camp
        response = requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
        assert response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
        assert get_response.status_code == 404
        print("PASS: Admin deleted camp without participants")
    
    # ============= ADMIN CAMP STUDENT TESTS =============
    
    def test_admin_get_camp_students(self):
        """Test admin can get camp students"""
        # Get existing camp
        camps_response = requests.get(f"{BASE_URL}/api/camps", headers=self.admin_headers())
        camps = camps_response.json()
        if len(camps) == 0:
            pytest.skip("No camps to test")
        
        camp_id = camps[0]["id"]
        response = requests.get(f"{BASE_URL}/api/camps/{camp_id}/students", headers=self.admin_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin got {len(data)} camp students")
    
    def test_admin_add_camp_student(self):
        """Test admin can add student to camp"""
        # Create a test camp first
        camp_id = self.test_admin_create_camp()
        
        # Add student
        student_data = {
            "camp_id": camp_id,
            "student_name": "TEST_Mehmet Öz",
            "parent_name": "Fatma Öz",
            "phone": "0533 222 3344",
            "registration_status": "on_kayit",
            "payment_amount": 600.0,
            "payment_completed": False,
            "notes": "Test student"
        }
        response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json=student_data, headers=self.admin_headers())
        assert response.status_code == 200, f"Add student failed: {response.text}"
        data = response.json()
        assert data["student_name"] == student_data["student_name"]
        assert data["parent_name"] == student_data["parent_name"]
        assert data["payment_completed"] == False
        self.test_student_id = data["id"]
        print(f"PASS: Admin added camp student: {data['student_name']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/camp-students/{data['id']}", headers=self.admin_headers())
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
        return data["id"]
    
    def test_admin_update_camp_student(self):
        """Test admin can update camp student"""
        # Create camp and student
        camp_id = self.test_admin_create_camp()
        student_data = {
            "camp_id": camp_id,
            "student_name": "TEST_Update Student",
            "parent_name": "Parent Name",
            "phone": "0533 111 2222",
            "registration_status": "on_kayit",
            "payment_amount": 500.0,
            "payment_completed": False
        }
        create_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json=student_data, headers=self.admin_headers())
        student_id = create_response.json()["id"]
        
        # Update student
        update_data = {
            "registration_status": "kesin_kayit",
            "payment_completed": True
        }
        response = requests.put(f"{BASE_URL}/api/camp-students/{student_id}", json=update_data, headers=self.admin_headers())
        assert response.status_code == 200, f"Update student failed: {response.text}"
        data = response.json()
        assert data["registration_status"] == "kesin_kayit"
        assert data["payment_completed"] == True
        print(f"PASS: Admin updated camp student payment status")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/camp-students/{student_id}", headers=self.admin_headers())
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
    
    def test_admin_toggle_payment_status(self):
        """Test admin can toggle payment status"""
        # Create camp and student
        camp_id = self.test_admin_create_camp()
        student_data = {
            "camp_id": camp_id,
            "student_name": "TEST_Toggle Payment",
            "parent_name": "Parent",
            "phone": "0533 333 4444",
            "registration_status": "kesin_kayit",
            "payment_amount": 500.0,
            "payment_completed": False
        }
        create_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json=student_data, headers=self.admin_headers())
        student_id = create_response.json()["id"]
        
        # Toggle to True
        response = requests.put(f"{BASE_URL}/api/camp-students/{student_id}", json={"payment_completed": True}, headers=self.admin_headers())
        assert response.status_code == 200
        assert response.json()["payment_completed"] == True
        
        # Toggle back to False
        response = requests.put(f"{BASE_URL}/api/camp-students/{student_id}", json={"payment_completed": False}, headers=self.admin_headers())
        assert response.status_code == 200
        assert response.json()["payment_completed"] == False
        print("PASS: Admin toggled payment status successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/camp-students/{student_id}", headers=self.admin_headers())
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
    
    def test_admin_delete_camp_student(self):
        """Test admin can delete camp student"""
        # Create camp and student
        camp_id = self.test_admin_create_camp()
        student_data = {
            "camp_id": camp_id,
            "student_name": "TEST_Delete Student",
            "parent_name": "Parent",
            "phone": "0533 555 6666",
            "registration_status": "on_kayit",
            "payment_amount": 500.0,
            "payment_completed": False
        }
        create_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json=student_data, headers=self.admin_headers())
        student_id = create_response.json()["id"]
        
        # Delete student
        response = requests.delete(f"{BASE_URL}/api/camp-students/{student_id}", headers=self.admin_headers())
        assert response.status_code == 200
        
        # Verify deleted
        students_response = requests.get(f"{BASE_URL}/api/camps/{camp_id}/students", headers=self.admin_headers())
        students = students_response.json()
        assert not any(s["id"] == student_id for s in students)
        print("PASS: Admin deleted camp student")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
    
    def test_admin_cannot_delete_camp_with_participants(self):
        """Test admin cannot delete camp with participants"""
        # Create camp and student
        camp_id = self.test_admin_create_camp()
        student_data = {
            "camp_id": camp_id,
            "student_name": "TEST_Block Delete",
            "parent_name": "Parent",
            "phone": "0533 777 8888",
            "registration_status": "on_kayit",
            "payment_amount": 500.0,
            "payment_completed": False
        }
        create_response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json=student_data, headers=self.admin_headers())
        student_id = create_response.json()["id"]
        
        # Try to delete camp - should fail
        response = requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
        assert response.status_code == 400
        assert "participants" in response.json()["detail"].lower()
        print("PASS: Admin cannot delete camp with participants")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/camp-students/{student_id}", headers=self.admin_headers())
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
    
    # ============= TEACHER CAMP ACCESS TESTS =============
    
    def test_teacher_get_own_camps(self):
        """Test teacher can only see their own camps"""
        self.get_teacher_token()  # Get teacher token and teacher_id
        
        response = requests.get(f"{BASE_URL}/api/camps", headers=self.teacher_headers())
        assert response.status_code == 200
        data = response.json()
        
        # All camps should belong to this teacher
        for camp in data:
            assert camp["teacher_id"] == self.teacher_id, f"Teacher sees camp not assigned to them"
        print(f"PASS: Teacher sees only their {len(data)} camps")
    
    def test_teacher_get_camp_students_readonly(self):
        """Test teacher can view camp students (read-only)"""
        self.get_teacher_token()
        
        # Get teacher's camps
        camps_response = requests.get(f"{BASE_URL}/api/camps", headers=self.teacher_headers())
        camps = camps_response.json()
        
        if len(camps) == 0:
            pytest.skip("Teacher has no camps")
        
        camp_id = camps[0]["id"]
        response = requests.get(f"{BASE_URL}/api/camps/{camp_id}/students", headers=self.teacher_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Teacher viewed {len(data)} camp students")
    
    def test_teacher_cannot_create_camp(self):
        """Test teacher cannot create camps"""
        self.get_teacher_token()
        
        camp_data = {
            "name": "TEST_Teacher Camp",
            "class_level": "6",
            "teacher_id": self.teacher_id,
            "per_student_teacher_fee": 100.0
        }
        response = requests.post(f"{BASE_URL}/api/camps", json=camp_data, headers=self.teacher_headers())
        assert response.status_code == 403
        print("PASS: Teacher cannot create camps")
    
    def test_teacher_cannot_add_camp_student(self):
        """Test teacher cannot add students to camps"""
        self.get_teacher_token()
        
        # Get teacher's camps
        camps_response = requests.get(f"{BASE_URL}/api/camps", headers=self.teacher_headers())
        camps = camps_response.json()
        
        if len(camps) == 0:
            pytest.skip("Teacher has no camps")
        
        camp_id = camps[0]["id"]
        student_data = {
            "camp_id": camp_id,
            "student_name": "TEST_Unauthorized",
            "parent_name": "Parent",
            "phone": "0533 999 0000",
            "registration_status": "on_kayit",
            "payment_amount": 500.0,
            "payment_completed": False
        }
        response = requests.post(f"{BASE_URL}/api/camps/{camp_id}/students", json=student_data, headers=self.teacher_headers())
        assert response.status_code == 403
        print("PASS: Teacher cannot add camp students")
    
    def test_teacher_cannot_access_other_teacher_camp(self):
        """Test teacher cannot access another teacher's camp"""
        self.get_teacher_token()
        
        # Get all teachers
        teachers_response = requests.get(f"{BASE_URL}/api/teachers", headers=self.admin_headers())
        teachers = teachers_response.json()
        
        # Find another teacher
        other_teacher = next((t for t in teachers if t["id"] != self.teacher_id), None)
        if not other_teacher:
            pytest.skip("No other teacher to test")
        
        # Create camp for other teacher
        camp_data = {
            "name": "TEST_Other Teacher Camp",
            "class_level": "5",
            "teacher_id": other_teacher["id"],
            "per_student_teacher_fee": 100.0
        }
        create_response = requests.post(f"{BASE_URL}/api/camps", json=camp_data, headers=self.admin_headers())
        camp_id = create_response.json()["id"]
        
        # Teacher tries to access
        response = requests.get(f"{BASE_URL}/api/camps/{camp_id}", headers=self.teacher_headers())
        assert response.status_code == 403
        print("PASS: Teacher cannot access other teacher's camp")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/camps/{camp_id}", headers=self.admin_headers())
    
    # ============= TEACHER BALANCE TESTS =============
    
    def test_teacher_balance_includes_camp_earnings(self):
        """Test teacher balance includes camp earnings"""
        self.get_teacher_token()
        
        response = requests.get(f"{BASE_URL}/api/teacher-balance/{self.teacher_id}", headers=self.teacher_headers())
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "lesson_earnings" in data
        assert "camp_earnings" in data
        assert "total_earnings" in data
        assert "camp_earnings_details" in data
        
        # Verify calculation
        assert data["total_earnings"] == data["lesson_earnings"] + data["camp_earnings"]
        print(f"PASS: Teacher balance - Lesson: {data['lesson_earnings']}, Camp: {data['camp_earnings']}, Total: {data['total_earnings']}")
    
    def test_camp_earnings_calculation(self):
        """Test camp earnings = paid_students × per_student_fee"""
        self.get_teacher_token()
        
        # Get teacher's camps
        camps_response = requests.get(f"{BASE_URL}/api/camps?include_completed=true", headers=self.teacher_headers())
        camps = camps_response.json()
        
        if len(camps) == 0:
            pytest.skip("Teacher has no camps")
        
        # Calculate expected earnings
        expected_earnings = 0
        for camp in camps:
            students_response = requests.get(f"{BASE_URL}/api/camps/{camp['id']}/students", headers=self.teacher_headers())
            students = students_response.json()
            paid_count = len([s for s in students if s["payment_completed"]])
            expected_earnings += paid_count * camp["per_student_teacher_fee"]
        
        # Get actual balance
        balance_response = requests.get(f"{BASE_URL}/api/teacher-balance/{self.teacher_id}", headers=self.teacher_headers())
        balance_data = balance_response.json()
        
        assert balance_data["camp_earnings"] == expected_earnings, f"Expected {expected_earnings}, got {balance_data['camp_earnings']}"
        print(f"PASS: Camp earnings calculation correct: {expected_earnings}₺")
    
    def test_teacher_camp_earnings_endpoint(self):
        """Test dedicated teacher camp earnings endpoint"""
        self.get_teacher_token()
        
        response = requests.get(f"{BASE_URL}/api/teacher-camp-earnings/{self.teacher_id}", headers=self.teacher_headers())
        assert response.status_code == 200
        data = response.json()
        
        assert "total_camp_earnings" in data
        assert "camp_details" in data
        assert isinstance(data["camp_details"], list)
        print(f"PASS: Teacher camp earnings endpoint - Total: {data['total_camp_earnings']}₺")
    
    def test_teacher_cannot_access_other_teacher_balance(self):
        """Test teacher cannot access another teacher's balance"""
        self.get_teacher_token()
        
        # Get all teachers
        teachers_response = requests.get(f"{BASE_URL}/api/teachers", headers=self.admin_headers())
        teachers = teachers_response.json()
        
        # Find another teacher
        other_teacher = next((t for t in teachers if t["id"] != self.teacher_id), None)
        if not other_teacher:
            pytest.skip("No other teacher to test")
        
        response = requests.get(f"{BASE_URL}/api/teacher-balance/{other_teacher['id']}", headers=self.teacher_headers())
        assert response.status_code == 403
        print("PASS: Teacher cannot access other teacher's balance")
    
    # ============= EXISTING CAMP DATA VERIFICATION =============
    
    def test_existing_camp_data(self):
        """Verify existing camp data - Yaz Matematik Kampı"""
        response = requests.get(f"{BASE_URL}/api/camps", headers=self.admin_headers())
        assert response.status_code == 200
        camps = response.json()
        
        # Find the existing camp
        yaz_kamp = next((c for c in camps if "Yaz Matematik" in c["name"]), None)
        if not yaz_kamp:
            pytest.skip("Yaz Matematik Kampı not found")
        
        assert yaz_kamp["class_level"] == "7"
        assert yaz_kamp["per_student_teacher_fee"] == 150
        assert yaz_kamp["paid_count"] >= 1
        print(f"PASS: Existing camp verified - {yaz_kamp['name']}, {yaz_kamp['paid_count']} paid")
    
    def test_existing_camp_student_data(self):
        """Verify existing camp student - Ali Veli"""
        response = requests.get(f"{BASE_URL}/api/camps", headers=self.admin_headers())
        camps = response.json()
        
        yaz_kamp = next((c for c in camps if "Yaz Matematik" in c["name"]), None)
        if not yaz_kamp:
            pytest.skip("Yaz Matematik Kampı not found")
        
        students_response = requests.get(f"{BASE_URL}/api/camps/{yaz_kamp['id']}/students", headers=self.admin_headers())
        students = students_response.json()
        
        ali_veli = next((s for s in students if "Ali Veli" in s["student_name"]), None)
        if not ali_veli:
            pytest.skip("Ali Veli not found")
        
        assert ali_veli["registration_status"] == "kesin_kayit"
        assert ali_veli["payment_completed"] == True
        assert ali_veli["payment_amount"] == 500
        print(f"PASS: Existing student verified - {ali_veli['student_name']}, payment: {ali_veli['payment_completed']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
