"""
Backend API Tests for New Features - Tutoring Center Management System
Tests: Student Groups, Group Lessons, Group Planned Lessons, All Planned Lessons
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStudentGroups:
    """Student Group endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_student_groups(self, auth_token):
        """Test getting all student groups"""
        response = requests.get(
            f"{BASE_URL}/api/student-groups",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            group = data[0]
            assert "id" in group
            assert "name" in group
            assert "branch_id" in group
            assert "level" in group
            assert "student_ids" in group
            assert "teacher_id" in group
            print(f"✓ Found {len(data)} student groups")
    
    def test_get_groups_by_student(self, auth_token):
        """Test getting groups for a specific student"""
        # Get a student who is in a group
        groups_response = requests.get(
            f"{BASE_URL}/api/student-groups",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        groups = groups_response.json()
        
        if len(groups) > 0 and len(groups[0].get("student_ids", [])) > 0:
            student_id = groups[0]["student_ids"][0]
            response = requests.get(
                f"{BASE_URL}/api/student-groups/by-student/{student_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            # Verify student is in returned groups
            for group in data:
                assert student_id in group["student_ids"]
            print(f"✓ Student {student_id} is in {len(data)} groups")
        else:
            pytest.skip("No groups with students found")
    
    def test_get_teacher_groups(self, auth_token):
        """Test getting groups for a specific teacher"""
        # Get a teacher who has groups
        groups_response = requests.get(
            f"{BASE_URL}/api/student-groups",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        groups = groups_response.json()
        
        if len(groups) > 0 and groups[0].get("teacher_id"):
            teacher_id = groups[0]["teacher_id"]
            response = requests.get(
                f"{BASE_URL}/api/teacher-groups/{teacher_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            # Verify all groups belong to this teacher
            for group in data:
                assert group["teacher_id"] == teacher_id
            print(f"✓ Teacher {teacher_id} has {len(data)} groups")
        else:
            pytest.skip("No groups with teachers found")
    
    def test_add_student_to_group(self, auth_token):
        """Test adding a student to a group"""
        # Get a group and a student not in it
        groups_response = requests.get(
            f"{BASE_URL}/api/student-groups",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        groups = groups_response.json()
        
        students_response = requests.get(
            f"{BASE_URL}/api/students",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        students = students_response.json()
        
        if len(groups) > 0 and len(students) > 0:
            group = groups[0]
            # Find a student not in this group
            student_to_add = None
            for student in students:
                if student["id"] not in group.get("student_ids", []):
                    student_to_add = student
                    break
            
            if student_to_add:
                response = requests.post(
                    f"{BASE_URL}/api/student-groups/{group['id']}/add-student?student_id={student_to_add['id']}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                assert response.status_code == 200
                assert "message" in response.json()
                print(f"✓ Added student {student_to_add['name']} to group {group['name']}")
                
                # Remove the student to clean up
                requests.post(
                    f"{BASE_URL}/api/student-groups/{group['id']}/remove-student?student_id={student_to_add['id']}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
            else:
                pytest.skip("All students already in group")
        else:
            pytest.skip("No groups or students found")
    
    def test_remove_student_from_group(self, auth_token):
        """Test removing a student from a group"""
        # Get a group with students
        groups_response = requests.get(
            f"{BASE_URL}/api/student-groups",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        groups = groups_response.json()
        
        if len(groups) > 0:
            group = groups[0]
            if len(group.get("student_ids", [])) > 0:
                student_id = group["student_ids"][0]
                
                # Remove student
                response = requests.post(
                    f"{BASE_URL}/api/student-groups/{group['id']}/remove-student?student_id={student_id}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                assert response.status_code == 200
                assert "message" in response.json()
                print(f"✓ Removed student from group {group['name']}")
                
                # Add back to clean up
                requests.post(
                    f"{BASE_URL}/api/student-groups/{group['id']}/add-student?student_id={student_id}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
            else:
                pytest.skip("Group has no students")
        else:
            pytest.skip("No groups found")


class TestAllPlannedLessons:
    """All Planned Lessons endpoint tests (for Monthly Program)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_all_planned_lessons(self, auth_token):
        """Test getting all planned lessons with enriched data"""
        response = requests.get(
            f"{BASE_URL}/api/all-planned-lessons",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            pl = data[0]
            # Verify enriched fields
            assert "student_name" in pl
            assert "teacher_name" in pl
            assert "branch_name" in pl
            assert "student_id" in pl
            assert "teacher_id" in pl
            assert "branch_id" in pl
            print(f"✓ Found {len(data)} planned lessons with enriched data")
        else:
            print("✓ No planned lessons found (empty list is valid)")
    
    def test_get_all_planned_lessons_by_month(self, auth_token):
        """Test filtering planned lessons by month"""
        response = requests.get(
            f"{BASE_URL}/api/all-planned-lessons?month=2026-01",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned lessons are for the specified month
        for pl in data:
            assert pl.get("month") == "2026-01"
        print(f"✓ Month filter working - found {len(data)} lessons for 2026-01")


class TestGroupLessons:
    """Group Lesson entry tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_create_group_lesson(self, auth_token):
        """Test creating a lesson for all students in a group"""
        # Get a group with students who have courses
        groups_response = requests.get(
            f"{BASE_URL}/api/student-groups",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        groups = groups_response.json()
        
        if len(groups) > 0:
            group = groups[0]
            if len(group.get("student_ids", [])) > 0:
                response = requests.post(
                    f"{BASE_URL}/api/group-lessons",
                    headers={"Authorization": f"Bearer {auth_token}"},
                    params={
                        "group_id": group["id"],
                        "branch_id": group["branch_id"],
                        "date": "2026-01-25",
                        "number_of_lessons": 1
                    }
                )
                assert response.status_code == 200
                data = response.json()
                assert "message" in data
                assert "count" in data
                print(f"✓ Created group lesson for {data['count']} students")
            else:
                pytest.skip("Group has no students")
        else:
            pytest.skip("No groups found")


class TestGroupPlannedLessons:
    """Group Planned Lesson tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_create_group_planned_lesson(self, auth_token):
        """Test creating planned lessons for all students in a group"""
        # Get a group with students who have courses
        groups_response = requests.get(
            f"{BASE_URL}/api/student-groups",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        groups = groups_response.json()
        
        if len(groups) > 0:
            group = groups[0]
            if len(group.get("student_ids", [])) > 0:
                response = requests.post(
                    f"{BASE_URL}/api/group-planned-lessons",
                    headers={"Authorization": f"Bearer {auth_token}"},
                    json={
                        "group_id": group["id"],
                        "dates": "5, 12, 19, 26",
                        "number_of_lessons": 1,
                        "month": "2026-02"
                    }
                )
                assert response.status_code == 200
                data = response.json()
                assert "message" in data
                assert "count" in data
                print(f"✓ Created group planned lessons for {data['count']} students")
            else:
                pytest.skip("Group has no students")
        else:
            pytest.skip("No groups found")


class TestStudentCourses:
    """Student Course CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_student_courses(self, auth_token):
        """Test getting all student courses"""
        response = requests.get(
            f"{BASE_URL}/api/student-courses",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            course = data[0]
            assert "id" in course
            assert "student_id" in course
            assert "teacher_id" in course
            assert "branch_id" in course
            assert "lesson_type_id" in course
            assert "price" in course
            print(f"✓ Found {len(data)} student courses")
    
    def test_get_student_courses_by_student(self, auth_token):
        """Test filtering courses by student"""
        # Get a student with courses
        courses_response = requests.get(
            f"{BASE_URL}/api/student-courses",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        courses = courses_response.json()
        
        if len(courses) > 0:
            student_id = courses[0]["student_id"]
            response = requests.get(
                f"{BASE_URL}/api/student-courses?student_id={student_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            # Verify all courses belong to this student
            for course in data:
                assert course["student_id"] == student_id
            print(f"✓ Student {student_id} has {len(data)} courses")
        else:
            pytest.skip("No courses found")
    
    def test_create_and_delete_student_course(self, auth_token):
        """Test creating and deleting a student course"""
        # Get required IDs
        students_response = requests.get(
            f"{BASE_URL}/api/students",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        students = students_response.json()
        
        teachers_response = requests.get(
            f"{BASE_URL}/api/teachers",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        teachers = teachers_response.json()
        
        branches_response = requests.get(
            f"{BASE_URL}/api/branches",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        branches = branches_response.json()
        
        lesson_types_response = requests.get(
            f"{BASE_URL}/api/lesson-types",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        lesson_types = lesson_types_response.json()
        
        if len(students) > 0 and len(teachers) > 0 and len(branches) > 0 and len(lesson_types) > 0:
            # Create course
            create_response = requests.post(
                f"{BASE_URL}/api/student-courses",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "student_id": students[0]["id"],
                    "teacher_id": teachers[0]["id"],
                    "branch_id": branches[0]["id"],
                    "lesson_type_id": lesson_types[0]["id"],
                    "price": 300
                }
            )
            assert create_response.status_code == 200
            course = create_response.json()
            assert course["price"] == 300
            print(f"✓ Created student course with price 300")
            
            # Delete course
            delete_response = requests.delete(
                f"{BASE_URL}/api/student-courses/{course['id']}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert delete_response.status_code == 200
            print(f"✓ Deleted student course")
        else:
            pytest.skip("Missing required data")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
