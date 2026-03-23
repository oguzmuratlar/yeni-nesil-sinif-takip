import requests
import sys
import json
from datetime import datetime

class TutoringCenterAPITester:
    def __init__(self, base_url="https://quirky-ride-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_type = None
        self.teacher_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"message": "Success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_init_data(self):
        """Test data initialization"""
        print("\n🔧 Testing Data Initialization...")
        result = self.run_test(
            "Initialize Data",
            "POST",
            "init-data",
            200
        )
        return result is not None

    def test_login(self, username="admin", password="admin123"):
        """Test login functionality"""
        print(f"\n🔐 Testing Login with {username}...")
        result = self.run_test(
            f"Login as {username}",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        
        if result:
            self.token = result.get('access_token')
            self.user_type = result.get('user_type')
            self.teacher_id = result.get('teacher_id')
            print(f"   Token received: {self.token[:20]}...")
            print(f"   User type: {self.user_type}")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        print("\n👤 Testing Auth Me...")
        result = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return result is not None

    def test_students_crud(self):
        """Test student CRUD operations"""
        print("\n👨‍🎓 Testing Student Operations...")
        
        # Get students
        students = self.run_test(
            "Get Students",
            "GET",
            "students",
            200
        )
        
        if students is None:
            return False

        # Create student
        student_data = {
            "name": "Test Öğrenci",
            "parent_name": "Test Veli",
            "phone": "555-1234567",
            "level": "9. Sınıf",
            "payment_freq": "Aylık",
            "notes": "Test öğrencisi"
        }
        
        created_student = self.run_test(
            "Create Student",
            "POST",
            "students",
            200,
            data=student_data
        )
        
        if not created_student:
            return False
            
        student_id = created_student.get('id')
        
        # Get specific student
        self.run_test(
            "Get Specific Student",
            "GET",
            f"students/{student_id}",
            200
        )
        
        # Update student
        updated_data = student_data.copy()
        updated_data['name'] = "Updated Test Öğrenci"
        
        self.run_test(
            "Update Student",
            "PUT",
            f"students/{student_id}",
            200,
            data=updated_data
        )
        
        # Delete student
        self.run_test(
            "Delete Student",
            "DELETE",
            f"students/{student_id}",
            200
        )
        
        return True

    def test_teachers_crud(self):
        """Test teacher CRUD operations"""
        print("\n👩‍🏫 Testing Teacher Operations...")
        
        # Get teachers
        teachers = self.run_test(
            "Get Teachers",
            "GET",
            "teachers",
            200
        )
        
        if teachers is None:
            return False

        # Create teacher
        teacher_data = {
            "name": "Test Öğretmen",
            "phone": "555-7654321"
        }
        
        created_teacher = self.run_test(
            "Create Teacher",
            "POST",
            "teachers",
            200,
            data=teacher_data
        )
        
        if not created_teacher:
            return False
            
        teacher_id = created_teacher.get('id')
        
        # Get specific teacher
        self.run_test(
            "Get Specific Teacher",
            "GET",
            f"teachers/{teacher_id}",
            200
        )
        
        # Update teacher
        updated_data = teacher_data.copy()
        updated_data['name'] = "Updated Test Öğretmen"
        
        self.run_test(
            "Update Teacher",
            "PUT",
            f"teachers/{teacher_id}",
            200,
            data=updated_data
        )
        
        # Delete teacher
        self.run_test(
            "Delete Teacher",
            "DELETE",
            f"teachers/{teacher_id}",
            200
        )
        
        return True

    def test_reference_data(self):
        """Test reference data endpoints"""
        print("\n📚 Testing Reference Data...")
        
        self.run_test("Get Branches", "GET", "branches", 200)
        self.run_test("Get Lesson Types", "GET", "lesson-types", 200)
        self.run_test("Get Seasons", "GET", "seasons", 200)
        self.run_test("Get Bank Accounts", "GET", "bank-accounts", 200)
        
        return True

    def test_lesson_operations(self):
        """Test lesson-related operations"""
        print("\n📖 Testing Lesson Operations...")
        
        self.run_test("Get Student Courses", "GET", "student-courses", 200)
        self.run_test("Get Lessons", "GET", "lessons", 200)
        self.run_test("Get Planned Lessons", "GET", "planned-lessons", 200)
        self.run_test("Get Teacher Prices", "GET", "teacher-prices", 200)
        
        return True

    def test_payment_operations(self):
        """Test payment operations"""
        print("\n💰 Testing Payment Operations...")
        
        payments = self.run_test("Get Payments", "GET", "payments", 200)
        return payments is not None

    def test_teacher_balance(self):
        """Test teacher balance calculation"""
        print("\n💳 Testing Teacher Balance...")
        
        # First get teachers to find a valid teacher ID
        teachers = self.run_test("Get Teachers for Balance", "GET", "teachers", 200)
        
        if teachers and len(teachers) > 0:
            teacher_id = teachers[0].get('id')
            self.run_test(
                "Get Teacher Balance",
                "GET",
                f"teacher-balance/{teacher_id}",
                200
            )
        else:
            self.log_test("Get Teacher Balance", False, "No teachers found")
        
        return True

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        print("\n🚫 Testing Unauthorized Access...")
        
        # Save current token
        original_token = self.token
        self.token = None
        
        # Try to access protected endpoint without token
        self.run_test(
            "Unauthorized Access",
            "GET",
            "students",
            401
        )
        
        # Restore token
        self.token = original_token
        return True

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Tutoring Center API Tests...")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Initialize data
        self.test_init_data()
        
        # Test login
        if not self.test_login():
            print("❌ Login failed, stopping tests")
            return False
        
        # Test authentication
        self.test_auth_me()
        
        # Test CRUD operations
        self.test_students_crud()
        self.test_teachers_crud()
        
        # Test reference data
        self.test_reference_data()
        
        # Test lesson operations
        self.test_lesson_operations()
        
        # Test payments
        self.test_payment_operations()
        
        # Test teacher balance
        self.test_teacher_balance()
        
        # Test unauthorized access
        self.test_unauthorized_access()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed")
            return False

def main():
    tester = TutoringCenterAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())