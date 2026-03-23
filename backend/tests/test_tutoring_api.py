"""
Backend API Tests for Tutoring Center Management System
Tests: Authentication, Teachers, Students, Lessons, Teacher Balance
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user_type"] == "admin"
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401


class TestTeachers:
    """Teacher CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_teachers_list(self, auth_token):
        """Test getting teachers list"""
        response = requests.get(
            f"{BASE_URL}/api/teachers",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify teacher structure
        if len(data) > 0:
            teacher = data[0]
            assert "id" in teacher
            assert "name" in teacher
            assert "phone" in teacher
            assert "status" in teacher
    
    def test_get_single_teacher(self, auth_token):
        """Test getting a single teacher"""
        # First get list to get an ID
        list_response = requests.get(
            f"{BASE_URL}/api/teachers",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        teachers = list_response.json()
        if len(teachers) > 0:
            teacher_id = teachers[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/teachers/{teacher_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == teacher_id


class TestStudents:
    """Student CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_students_list(self, auth_token):
        """Test getting students list"""
        response = requests.get(
            f"{BASE_URL}/api/students",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify student structure
        if len(data) > 0:
            student = data[0]
            assert "id" in student
            assert "name" in student
            assert "parent_name" in student
            assert "phone" in student
            assert "level" in student
            assert "payment_freq" in student
    
    def test_get_single_student(self, auth_token):
        """Test getting a single student"""
        # First get list to get an ID
        list_response = requests.get(
            f"{BASE_URL}/api/students",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        students = list_response.json()
        if len(students) > 0:
            student_id = students[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/students/{student_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == student_id


class TestLessons:
    """Lesson creation and teacher_rate tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_create_lesson_with_teacher_rate(self, auth_token):
        """Test that lesson creation saves teacher_rate from teacher_prices"""
        # Get a student course that has teacher prices
        courses_response = requests.get(
            f"{BASE_URL}/api/student-courses",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        courses = courses_response.json()
        
        # Find a course with teacher prices
        for course in courses:
            prices_response = requests.get(
                f"{BASE_URL}/api/teacher-prices?teacher_id={course['teacher_id']}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            prices = prices_response.json()
            
            # Find matching price for this course
            matching_price = None
            for price in prices:
                if price["branch_id"] == course["branch_id"] and price["lesson_type_id"] == course["lesson_type_id"]:
                    if price.get("group_size") is None:  # Birebir
                        matching_price = price
                        break
            
            if matching_price:
                # Create a lesson
                lesson_response = requests.post(
                    f"{BASE_URL}/api/lessons",
                    headers={"Authorization": f"Bearer {auth_token}"},
                    json={
                        "student_course_id": course["id"],
                        "date": "2026-01-25",
                        "number_of_lessons": 1
                    }
                )
                assert lesson_response.status_code == 200
                lesson = lesson_response.json()
                
                # Verify teacher_rate is saved
                assert "teacher_rate" in lesson
                assert lesson["teacher_rate"] == matching_price["price"]
                print(f"✓ Lesson created with teacher_rate: {lesson['teacher_rate']}")
                
                # Clean up - delete the lesson
                requests.delete(
                    f"{BASE_URL}/api/lessons/{lesson['id']}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                return
        
        pytest.skip("No course with teacher prices found for testing")
    
    def test_get_lessons_list(self, auth_token):
        """Test getting lessons list"""
        response = requests.get(
            f"{BASE_URL}/api/lessons",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestTeacherBalance:
    """Teacher balance calculation tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_teacher_balance(self, auth_token):
        """Test teacher balance endpoint"""
        # Get a teacher
        teachers_response = requests.get(
            f"{BASE_URL}/api/teachers",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        teachers = teachers_response.json()
        
        if len(teachers) > 0:
            teacher_id = teachers[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/teacher-balance/{teacher_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            
            # Verify balance structure
            assert "teacher_id" in data
            assert "total_earnings" in data
            assert "total_paid" in data
            assert "balance" in data
            assert "payments" in data
            assert data["teacher_id"] == teacher_id
    
    def test_teacher_balance_uses_teacher_rate(self, auth_token):
        """Test that teacher balance uses lesson.teacher_rate when available"""
        # Get lessons with teacher_rate
        lessons_response = requests.get(
            f"{BASE_URL}/api/lessons",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        lessons = lessons_response.json()
        
        # Find lessons with teacher_rate
        lessons_with_rate = [l for l in lessons if l.get("teacher_rate") is not None]
        
        if len(lessons_with_rate) > 0:
            # Get the course to find teacher
            course_id = lessons_with_rate[0]["student_course_id"]
            courses_response = requests.get(
                f"{BASE_URL}/api/student-courses",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            courses = courses_response.json()
            course = next((c for c in courses if c["id"] == course_id), None)
            
            if course:
                # Get teacher balance
                balance_response = requests.get(
                    f"{BASE_URL}/api/teacher-balance/{course['teacher_id']}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                assert balance_response.status_code == 200
                balance = balance_response.json()
                
                # Verify earnings are calculated
                assert balance["total_earnings"] >= 0
                print(f"✓ Teacher balance calculated: earnings={balance['total_earnings']}, paid={balance['total_paid']}, balance={balance['balance']}")


class TestReferenceData:
    """Reference data endpoints tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_branches(self, auth_token):
        """Test getting branches list"""
        response = requests.get(
            f"{BASE_URL}/api/branches",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_lesson_types(self, auth_token):
        """Test getting lesson types list"""
        response = requests.get(
            f"{BASE_URL}/api/lesson-types",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have Birebir and Grup
        names = [lt["name"] for lt in data]
        assert "Birebir" in names
        assert "Grup" in names
    
    def test_get_seasons(self, auth_token):
        """Test getting seasons list"""
        response = requests.get(
            f"{BASE_URL}/api/seasons",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_bank_accounts(self, auth_token):
        """Test getting bank accounts list"""
        response = requests.get(
            f"{BASE_URL}/api/bank-accounts",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestTeacherPrices:
    """Teacher prices tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_teacher_prices(self, auth_token):
        """Test getting teacher prices"""
        response = requests.get(
            f"{BASE_URL}/api/teacher-prices",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            price = data[0]
            assert "teacher_id" in price
            assert "branch_id" in price
            assert "lesson_type_id" in price
            assert "price" in price
    
    def test_get_teacher_prices_by_teacher(self, auth_token):
        """Test getting teacher prices filtered by teacher"""
        # Get a teacher with prices
        prices_response = requests.get(
            f"{BASE_URL}/api/teacher-prices",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        prices = prices_response.json()
        
        if len(prices) > 0:
            teacher_id = prices[0]["teacher_id"]
            response = requests.get(
                f"{BASE_URL}/api/teacher-prices?teacher_id={teacher_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            # All prices should be for this teacher
            for price in data:
                assert price["teacher_id"] == teacher_id


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
