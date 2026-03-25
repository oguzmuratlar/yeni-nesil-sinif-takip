"""
Test file for Iteration 6 features:
1. GET /api/branches/{id}/teachers - Returns only active teachers assigned to that branch
2. GET /api/monthly-program-detailed?month=2026-03 - Detailed monthly program data
3. PUT /api/monthly-program-notes/{student_id}?month=X&note=X - Save notes
4. GET /api/teacher-balance/{id}?month=2026-03 - Month-based filtering
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBranchTeachers:
    """Test GET /api/branches/{id}/teachers - Returns only active teachers assigned to branch"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and fetch branches"""
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get branches
        branches_res = requests.get(f"{BASE_URL}/api/branches", headers=self.headers)
        assert branches_res.status_code == 200
        self.branches = branches_res.data if hasattr(branches_res, 'data') else branches_res.json()
        
        # Get all teachers
        teachers_res = requests.get(f"{BASE_URL}/api/teachers", headers=self.headers)
        assert teachers_res.status_code == 200
        self.teachers = teachers_res.json()
    
    def test_branch_teachers_endpoint_exists(self):
        """Test that the endpoint exists and returns 200"""
        if not self.branches:
            pytest.skip("No branches available")
        
        branch_id = self.branches[0]["id"]
        response = requests.get(f"{BASE_URL}/api/branches/{branch_id}/teachers", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Branch teachers endpoint returns 200")
    
    def test_branch_teachers_returns_list(self):
        """Test that endpoint returns a list"""
        if not self.branches:
            pytest.skip("No branches available")
        
        branch_id = self.branches[0]["id"]
        response = requests.get(f"{BASE_URL}/api/branches/{branch_id}/teachers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: Branch teachers returns list with {len(data)} teachers")
    
    def test_branch_teachers_only_active(self):
        """Test that only active teachers are returned"""
        if not self.branches:
            pytest.skip("No branches available")
        
        branch_id = self.branches[0]["id"]
        response = requests.get(f"{BASE_URL}/api/branches/{branch_id}/teachers", headers=self.headers)
        assert response.status_code == 200
        teachers = response.json()
        
        for teacher in teachers:
            assert teacher.get("status") == "active", f"Found inactive teacher: {teacher.get('name')}"
        
        print(f"PASS: All {len(teachers)} teachers are active")


class TestMonthlyProgramDetailed:
    """Test GET /api/monthly-program-detailed - Detailed monthly program data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_monthly_program_detailed_endpoint_exists(self):
        """Test that endpoint exists and returns 200"""
        response = requests.get(f"{BASE_URL}/api/monthly-program-detailed?month=2026-03", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Monthly program detailed endpoint returns 200")
    
    def test_monthly_program_detailed_structure(self):
        """Test response structure has required fields"""
        response = requests.get(f"{BASE_URL}/api/monthly-program-detailed?month=2026-03", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "month" in data, "Missing 'month' field"
        assert "students" in data, "Missing 'students' field"
        assert "branches" in data, "Missing 'branches' field"
        assert "teachers" in data, "Missing 'teachers' field"
        assert "teacher_totals" in data, "Missing 'teacher_totals' field"
        
        assert data["month"] == "2026-03", f"Month mismatch: {data['month']}"
        assert isinstance(data["students"], list), "students should be a list"
        assert isinstance(data["branches"], list), "branches should be a list"
        assert isinstance(data["teachers"], list), "teachers should be a list"
        
        print(f"PASS: Monthly program detailed has correct structure")
        print(f"  - {len(data['students'])} students")
        print(f"  - {len(data['branches'])} branches")
        print(f"  - {len(data['teachers'])} teachers")
    
    def test_monthly_program_detailed_student_fields(self):
        """Test that student records have required fields"""
        response = requests.get(f"{BASE_URL}/api/monthly-program-detailed?month=2026-03", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if not data["students"]:
            pytest.skip("No students in monthly program")
        
        student = data["students"][0]
        required_fields = ["student_id", "student_name", "parent_name", "account_name", 
                          "courses", "note", "payment_status", "payment_date", 
                          "total_payment", "branch_details", "teacher_earnings"]
        
        for field in required_fields:
            assert field in student, f"Missing field '{field}' in student record"
        
        print(f"PASS: Student records have all required fields")
    
    def test_monthly_program_admin_only(self):
        """Test that only admins can access this endpoint"""
        # Login as teacher
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "teacher1",
            "password": "teacher123"
        })
        if response.status_code != 200:
            pytest.skip("Teacher login not available")
        
        teacher_token = response.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        response = requests.get(f"{BASE_URL}/api/monthly-program-detailed?month=2026-03", headers=teacher_headers)
        assert response.status_code == 403, f"Expected 403 for teacher, got {response.status_code}"
        print("PASS: Monthly program detailed is admin-only")


class TestMonthlyProgramNotes:
    """Test PUT /api/monthly-program-notes/{student_id} - Save notes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and a student ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get a student
        students_res = requests.get(f"{BASE_URL}/api/students", headers=self.headers)
        assert students_res.status_code == 200
        students = students_res.json()
        self.student_id = students[0]["id"] if students else None
    
    def test_update_note(self):
        """Test updating a note"""
        if not self.student_id:
            pytest.skip("No students available")
        
        test_note = "TEST_Note_Iteration6"
        response = requests.put(
            f"{BASE_URL}/api/monthly-program-notes/{self.student_id}?month=2026-03&note={test_note}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Note updated successfully")
    
    def test_update_payment_status(self):
        """Test updating payment status"""
        if not self.student_id:
            pytest.skip("No students available")
        
        response = requests.put(
            f"{BASE_URL}/api/monthly-program-notes/{self.student_id}?month=2026-03&payment_status=Ödendi",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Payment status updated successfully")
    
    def test_update_payment_date(self):
        """Test updating payment date"""
        if not self.student_id:
            pytest.skip("No students available")
        
        response = requests.put(
            f"{BASE_URL}/api/monthly-program-notes/{self.student_id}?month=2026-03&payment_date=2026-03-15",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Payment date updated successfully")
    
    def test_verify_note_persisted(self):
        """Test that note is persisted and returned in monthly program"""
        if not self.student_id:
            pytest.skip("No students available")
        
        # Set a unique note
        unique_note = "TEST_Verify_Persistence_Note"
        requests.put(
            f"{BASE_URL}/api/monthly-program-notes/{self.student_id}?month=2026-03&note={unique_note}",
            headers=self.headers
        )
        
        # Fetch monthly program and verify
        response = requests.get(f"{BASE_URL}/api/monthly-program-detailed?month=2026-03", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        student_found = False
        for student in data["students"]:
            if student["student_id"] == self.student_id:
                student_found = True
                assert student.get("note") == unique_note, f"Note not persisted: {student.get('note')}"
                break
        
        if student_found:
            print("PASS: Note persisted and returned in monthly program")
        else:
            print("SKIP: Student not found in monthly program (may not have active courses)")


class TestTeacherBalanceMonthFilter:
    """Test GET /api/teacher-balance/{id}?month=YYYY-MM - Month-based filtering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and teacher ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get teachers
        teachers_res = requests.get(f"{BASE_URL}/api/teachers", headers=self.headers)
        assert teachers_res.status_code == 200
        teachers = teachers_res.json()
        self.teacher_id = teachers[0]["id"] if teachers else None
    
    def test_teacher_balance_without_month(self):
        """Test teacher balance without month filter (all time)"""
        if not self.teacher_id:
            pytest.skip("No teachers available")
        
        response = requests.get(f"{BASE_URL}/api/teacher-balance/{self.teacher_id}", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "teacher_id" in data
        assert "lesson_earnings" in data
        assert "camp_earnings" in data
        assert "youtube_earnings" in data
        assert "total_earnings" in data
        assert "total_paid" in data
        assert "balance" in data
        
        print(f"PASS: Teacher balance without month filter works")
        print(f"  - Total earnings: {data['total_earnings']}")
        print(f"  - Balance: {data['balance']}")
    
    def test_teacher_balance_with_month_filter(self):
        """Test teacher balance with month filter"""
        if not self.teacher_id:
            pytest.skip("No teachers available")
        
        response = requests.get(f"{BASE_URL}/api/teacher-balance/{self.teacher_id}?month=2026-03", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("month") == "2026-03", f"Month not returned: {data.get('month')}"
        
        # When month filter is applied, camp_earnings should be 0 (camps are not month-specific)
        assert data.get("camp_earnings") == 0, f"Camp earnings should be 0 with month filter: {data.get('camp_earnings')}"
        
        print(f"PASS: Teacher balance with month filter works")
        print(f"  - Month: {data['month']}")
        print(f"  - Lesson earnings: {data['lesson_earnings']}")
        print(f"  - Camp earnings: {data['camp_earnings']} (should be 0)")
    
    def test_teacher_balance_month_filter_response_structure(self):
        """Test that month filter response has correct structure"""
        if not self.teacher_id:
            pytest.skip("No teachers available")
        
        response = requests.get(f"{BASE_URL}/api/teacher-balance/{self.teacher_id}?month=2026-03", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["teacher_id", "month", "lesson_earnings", "camp_earnings", 
                          "youtube_earnings", "total_earnings", "total_paid", "balance",
                          "payments", "camp_earnings_details", "youtube_earnings_details"]
        
        for field in required_fields:
            assert field in data, f"Missing field '{field}' in response"
        
        print("PASS: Teacher balance response has all required fields")


class TestTeacherLogin:
    """Test teacher login and access"""
    
    def test_teacher_login(self):
        """Test teacher1 can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "teacher1",
            "password": "teacher123"
        })
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        
        data = response.json()
        assert data.get("user_type") == "teacher"
        assert data.get("teacher_id") is not None
        
        print(f"PASS: Teacher login works, teacher_id: {data.get('teacher_id')}")
    
    def test_teacher_can_access_own_balance(self):
        """Test teacher can access their own balance"""
        # Login as teacher
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "teacher1",
            "password": "teacher123"
        })
        if response.status_code != 200:
            pytest.skip("Teacher login not available")
        
        data = response.json()
        teacher_id = data.get("teacher_id")
        token = data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access own balance
        response = requests.get(f"{BASE_URL}/api/teacher-balance/{teacher_id}", headers=headers)
        assert response.status_code == 200, f"Teacher cannot access own balance: {response.text}"
        
        print("PASS: Teacher can access own balance")
    
    def test_teacher_can_access_balance_with_month_filter(self):
        """Test teacher can access balance with month filter"""
        # Login as teacher
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "teacher1",
            "password": "teacher123"
        })
        if response.status_code != 200:
            pytest.skip("Teacher login not available")
        
        data = response.json()
        teacher_id = data.get("teacher_id")
        token = data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access balance with month filter
        response = requests.get(f"{BASE_URL}/api/teacher-balance/{teacher_id}?month=2026-03", headers=headers)
        assert response.status_code == 200, f"Teacher cannot access balance with month filter: {response.text}"
        
        data = response.json()
        assert data.get("month") == "2026-03"
        
        print("PASS: Teacher can access balance with month filter")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
