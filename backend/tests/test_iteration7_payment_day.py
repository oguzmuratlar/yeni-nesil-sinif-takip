"""
Iteration 7 Tests - Payment Day Feature
Tests for:
1. GET /api/monthly-program-detailed - payment_day field returns student's payment_freq value
2. Verify payment_day is read-only (comes from student profile, not editable in monthly program)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPaymentDayFeature:
    """Tests for payment_day field in monthly program"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_monthly_program_returns_payment_day_field(self):
        """Test that monthly-program-detailed endpoint returns payment_day field"""
        response = requests.get(
            f"{BASE_URL}/api/monthly-program-detailed?month=2026-01",
            headers=self.headers
        )
        assert response.status_code == 200, f"API call failed: {response.text}"
        
        data = response.json()
        assert "students" in data, "Response should have 'students' field"
        
        # Check that at least one student has payment_day field
        if len(data["students"]) > 0:
            student = data["students"][0]
            assert "payment_day" in student, "Student record should have 'payment_day' field"
            print(f"✓ Student '{student['student_name']}' has payment_day: '{student['payment_day']}'")
    
    def test_payment_day_matches_student_payment_freq(self):
        """Test that payment_day in monthly program matches student's payment_freq"""
        # Get students list
        students_response = requests.get(
            f"{BASE_URL}/api/students",
            headers=self.headers
        )
        assert students_response.status_code == 200
        students = students_response.json()
        
        # Create a map of student_id -> payment_freq
        student_payment_freq_map = {s["id"]: s.get("payment_freq", "") for s in students}
        
        # Get monthly program data
        program_response = requests.get(
            f"{BASE_URL}/api/monthly-program-detailed?month=2026-01",
            headers=self.headers
        )
        assert program_response.status_code == 200
        program_data = program_response.json()
        
        # Verify payment_day matches payment_freq for each student
        mismatches = []
        for program_student in program_data["students"]:
            student_id = program_student["student_id"]
            payment_day = program_student.get("payment_day", "")
            expected_payment_freq = student_payment_freq_map.get(student_id, "")
            
            if payment_day != expected_payment_freq:
                mismatches.append({
                    "student_name": program_student["student_name"],
                    "payment_day": payment_day,
                    "expected_payment_freq": expected_payment_freq
                })
        
        assert len(mismatches) == 0, f"Payment day mismatches found: {mismatches}"
        print(f"✓ All {len(program_data['students'])} students have matching payment_day and payment_freq")
    
    def test_payment_day_values_exist(self):
        """Test that students have payment_day values (not all empty)"""
        response = requests.get(
            f"{BASE_URL}/api/monthly-program-detailed?month=2026-01",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        students_with_payment_day = [s for s in data["students"] if s.get("payment_day")]
        
        print(f"✓ Found {len(students_with_payment_day)} students with payment_day values")
        
        # List unique payment days
        unique_days = set(s.get("payment_day") for s in data["students"] if s.get("payment_day"))
        print(f"✓ Unique payment days: {sorted(unique_days)}")
        
        # At least some students should have payment_day
        assert len(students_with_payment_day) > 0, "At least some students should have payment_day values"
    
    def test_payment_status_filter_empty_option(self):
        """Test that payment_status can be empty and filtered"""
        response = requests.get(
            f"{BASE_URL}/api/monthly-program-detailed?month=2026-01",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Count students with empty vs non-empty payment_status
        empty_status = [s for s in data["students"] if not s.get("payment_status")]
        filled_status = [s for s in data["students"] if s.get("payment_status")]
        
        print(f"✓ Students with empty payment_status: {len(empty_status)}")
        print(f"✓ Students with filled payment_status: {len(filled_status)}")
        
        # Verify payment_status field exists in response
        if len(data["students"]) > 0:
            assert "payment_status" in data["students"][0], "Student should have payment_status field"


class TestStudentPaymentFreq:
    """Tests for student payment_freq field (source of payment_day)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_student_has_payment_freq_field(self):
        """Test that student model has payment_freq field"""
        response = requests.get(
            f"{BASE_URL}/api/students",
            headers=self.headers
        )
        assert response.status_code == 200
        
        students = response.json()
        if len(students) > 0:
            student = students[0]
            assert "payment_freq" in student, "Student should have payment_freq field"
            print(f"✓ Student '{student['name']}' has payment_freq: '{student.get('payment_freq')}'")
    
    def test_create_student_with_payment_freq(self):
        """Test creating a student with payment_freq value"""
        import uuid
        test_id = str(uuid.uuid4())[:8]
        
        # Create student with payment_freq
        create_response = requests.post(
            f"{BASE_URL}/api/students",
            headers=self.headers,
            json={
                "name": f"TEST_PaymentDay_{test_id}",
                "parent_name": "Test Parent",
                "phone": "5551234567",
                "level": "8",
                "payment_freq": "20"  # Payment on 20th of month
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        created_student = create_response.json()
        assert created_student["payment_freq"] == "20", "payment_freq should be '20'"
        print(f"✓ Created student with payment_freq='20'")
        
        # Cleanup - delete test student
        delete_response = requests.delete(
            f"{BASE_URL}/api/students/{created_student['id']}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"✓ Cleaned up test student")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
