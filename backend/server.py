from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class UserType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # "admin" or "teacher"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    user_type: str  # "admin" or "teacher"
    teacher_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    user_type: str
    teacher_id: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    teacher_id: Optional[str] = None

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_name: str
    phone: str
    level: str  # sınıf
    payment_freq: str  # ödeme sıklığı
    notes: Optional[str] = None
    status: str = "active"
    bank_account_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    name: str
    parent_name: str
    phone: str
    level: str
    payment_freq: str
    notes: Optional[str] = None
    bank_account_id: Optional[str] = None

class Teacher(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    status: str = "active"
    season_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeacherCreate(BaseModel):
    name: str
    phone: str
    season_id: Optional[str] = None

class Branch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

class LessonType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

class Season(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str = "active"
    is_current: bool = False

class BankAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bank_name: str
    iban: str
    holder_name: str
    is_legal: bool = False

class BankAccountCreate(BaseModel):
    bank_name: str
    iban: str
    holder_name: str
    is_legal: bool = False

class TeacherBranch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    branch_id: str
    season_id: Optional[str] = None

class TeacherPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    branch_id: str
    lesson_type_id: str
    price: float  # For birebir, this is the price. For group, base price
    group_size: Optional[int] = None  # 1, 2, 3, 4 for group lessons
    season_id: Optional[str] = None

class TeacherPriceCreate(BaseModel):
    teacher_id: str
    branch_id: str
    lesson_type_id: str
    price: float
    group_size: Optional[int] = None
    season_id: Optional[str] = None

class StudentGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    branch_id: str
    level: str  # sınıf
    student_ids: List[str]  # öğrenci ID listesi
    teacher_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentGroupCreate(BaseModel):
    name: str
    branch_id: str
    level: str
    student_ids: List[str]
    teacher_id: Optional[str] = None

class StudentCourse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    branch_id: str
    lesson_type_id: str
    price: float
    season_id: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCourseCreate(BaseModel):
    student_id: str
    teacher_id: str
    branch_id: str
    lesson_type_id: str
    price: float
    season_id: Optional[str] = None

class Lesson(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_course_id: str
    date: str
    number_of_lessons: int
    season_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LessonCreate(BaseModel):
    student_course_id: str
    date: str
    number_of_lessons: int
    season_id: Optional[str] = None

class PlannedLesson(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_course_id: str
    dates: str  # Comma-separated dates
    number_of_lessons: int
    messaged: bool = False
    month: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlannedLessonCreate(BaseModel):
    student_course_id: str
    dates: str  # Comma-separated dates
    number_of_lessons: int
    messaged: bool = False
    month: str

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_type: str  # "student_payment", "teacher_payment", "expense"
    amount: float
    date: str
    student_id: Optional[str] = None
    teacher_id: Optional[str] = None
    bank_account_id: Optional[str] = None
    description: Optional[str] = None
    expense_category: Optional[str] = None  # "Kira", "Reklam", etc.
    season_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    payment_type: str
    amount: float
    date: str
    student_id: Optional[str] = None
    teacher_id: Optional[str] = None
    bank_account_id: Optional[str] = None
    description: Optional[str] = None
    expense_category: Optional[str] = None
    season_id: Optional[str] = None

# ============= AUTH HELPERS =============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

# ============= AUTH ROUTES =============

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token = create_access_token(data={"sub": user["username"]})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type=user["user_type"],
        teacher_id=user.get("teacher_id")
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Only admins can create users
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")
    
    # Check if username exists
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        user_type=user_data.user_type,
        teacher_id=user_data.teacher_id
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user

# ============= STUDENT ROUTES =============

@api_router.get("/students", response_model=List[Student])
async def get_students(current_user: User = Depends(get_current_user)):
    if current_user.user_type == "admin":
        students = await db.students.find({}, {"_id": 0}).to_list(1000)
    else:
        # Teachers only see their students
        student_courses = await db.student_courses.find(
            {"teacher_id": current_user.teacher_id},
            {"_id": 0}
        ).to_list(1000)
        student_ids = list(set([sc["student_id"] for sc in student_courses]))
        students = await db.students.find(
            {"id": {"$in": student_ids}},
            {"_id": 0}
        ).to_list(1000)
    
    for student in students:
        if isinstance(student.get('created_at'), str):
            student['created_at'] = datetime.fromisoformat(student['created_at'])
    return students

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: User = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if teacher has access
    if current_user.user_type == "teacher":
        course = await db.student_courses.find_one({
            "student_id": student_id,
            "teacher_id": current_user.teacher_id
        })
        if not course:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    return Student(**student)

@api_router.post("/students", response_model=Student)
async def create_student(student_data: StudentCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create students")
    
    student = Student(**student_data.model_dump())
    doc = student.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.students.insert_one(doc)
    return student

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_data: StudentCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update students")
    
    existing = await db.students.find_one({"id": student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_data.model_dump()
    await db.students.update_one({"id": student_id}, {"$set": update_data})
    
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Student(**updated)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete students")
    
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

# ============= TEACHER ROUTES =============

@api_router.get("/teachers", response_model=List[Teacher])
async def get_teachers(current_user: User = Depends(get_current_user)):
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    for teacher in teachers:
        if isinstance(teacher.get('created_at'), str):
            teacher['created_at'] = datetime.fromisoformat(teacher['created_at'])
    return teachers

@api_router.get("/teachers/{teacher_id}", response_model=Teacher)
async def get_teacher(teacher_id: str, current_user: User = Depends(get_current_user)):
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if isinstance(teacher.get('created_at'), str):
        teacher['created_at'] = datetime.fromisoformat(teacher['created_at'])
    return Teacher(**teacher)

@api_router.post("/teachers", response_model=Teacher)
async def create_teacher(teacher_data: TeacherCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create teachers")
    
    teacher = Teacher(**teacher_data.model_dump())
    doc = teacher.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.teachers.insert_one(doc)
    return teacher

@api_router.put("/teachers/{teacher_id}", response_model=Teacher)
async def update_teacher(teacher_id: str, teacher_data: TeacherCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update teachers")
    
    existing = await db.teachers.find_one({"id": teacher_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_data = teacher_data.model_dump()
    await db.teachers.update_one({"id": teacher_id}, {"$set": update_data})
    
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Teacher(**updated)

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete teachers")
    
    result = await db.teachers.delete_one({"id": teacher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}

# ============= BRANCH ROUTES =============

@api_router.get("/branches", response_model=List[Branch])
async def get_branches():
    branches = await db.branches.find({}, {"_id": 0}).to_list(1000)
    return branches

@api_router.post("/branches", response_model=Branch)
async def create_branch(name: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create branches")
    
    branch = Branch(name=name)
    await db.branches.insert_one(branch.model_dump())
    return branch

# ============= LESSON TYPE ROUTES =============

@api_router.get("/lesson-types", response_model=List[LessonType])
async def get_lesson_types():
    lesson_types = await db.lesson_types.find({}, {"_id": 0}).to_list(1000)
    return lesson_types

# ============= SEASON ROUTES =============

@api_router.get("/seasons", response_model=List[Season])
async def get_seasons():
    seasons = await db.seasons.find({}, {"_id": 0}).to_list(1000)
    return seasons

@api_router.post("/seasons", response_model=Season)
async def create_season(name: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create seasons")
    
    season = Season(name=name)
    await db.seasons.insert_one(season.model_dump())
    return season

# ============= BANK ACCOUNT ROUTES =============

@api_router.get("/bank-accounts", response_model=List[BankAccount])
async def get_bank_accounts(current_user: User = Depends(get_current_user)):
    accounts = await db.bank_accounts.find({}, {"_id": 0}).to_list(1000)
    return accounts

@api_router.post("/bank-accounts", response_model=BankAccount)
async def create_bank_account(account_data: BankAccountCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create bank accounts")
    
    account = BankAccount(**account_data.model_dump())
    await db.bank_accounts.insert_one(account.model_dump())
    return account

# ============= STUDENT COURSE ROUTES =============

@api_router.get("/student-courses", response_model=List[StudentCourse])
async def get_student_courses(student_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if student_id:
        query["student_id"] = student_id
    
    if current_user.user_type == "teacher":
        query["teacher_id"] = current_user.teacher_id
    
    courses = await db.student_courses.find(query, {"_id": 0}).to_list(1000)
    for course in courses:
        if isinstance(course.get('created_at'), str):
            course['created_at'] = datetime.fromisoformat(course['created_at'])
    return courses

@api_router.post("/student-courses", response_model=StudentCourse)
async def create_student_course(course_data: StudentCourseCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create student courses")
    
    course = StudentCourse(**course_data.model_dump())
    doc = course.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.student_courses.insert_one(doc)
    return course

@api_router.put("/student-courses/{course_id}", response_model=StudentCourse)
async def update_student_course(course_id: str, course_data: StudentCourseCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update student courses")
    
    existing = await db.student_courses.find_one({"id": course_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = course_data.model_dump()
    await db.student_courses.update_one({"id": course_id}, {"$set": update_data})
    
    updated = await db.student_courses.find_one({"id": course_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return StudentCourse(**updated)

@api_router.delete("/student-courses/{course_id}")
async def delete_student_course(course_id: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete student courses")
    
    result = await db.student_courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

# ============= LESSON ROUTES =============

@api_router.get("/lessons", response_model=List[Lesson])
async def get_lessons(student_course_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if student_course_id:
        query["student_course_id"] = student_course_id
    
    lessons = await db.lessons.find(query, {"_id": 0}).to_list(1000)
    for lesson in lessons:
        if isinstance(lesson.get('created_at'), str):
            lesson['created_at'] = datetime.fromisoformat(lesson['created_at'])
    return lessons

@api_router.post("/lessons", response_model=Lesson)
async def create_lesson(lesson_data: LessonCreate, current_user: User = Depends(get_current_user)):
    # Check if user has access to this course
    course = await db.student_courses.find_one({"id": lesson_data.student_course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.user_type == "teacher" and course["teacher_id"] != current_user.teacher_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    lesson = Lesson(**lesson_data.model_dump())
    doc = lesson.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.lessons.insert_one(doc)
    return lesson

@api_router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, current_user: User = Depends(get_current_user)):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Check access
    course = await db.student_courses.find_one({"id": lesson["student_course_id"]}, {"_id": 0})
    if current_user.user_type == "teacher" and course["teacher_id"] != current_user.teacher_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.lessons.delete_one({"id": lesson_id})
    return {"message": "Lesson deleted successfully"}

# ============= PLANNED LESSON ROUTES =============

@api_router.get("/planned-lessons", response_model=List[PlannedLesson])
async def get_planned_lessons(
    student_course_id: Optional[str] = None,
    month: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if student_course_id:
        query["student_course_id"] = student_course_id
    if month:
        query["month"] = month
    
    planned = await db.planned_lessons.find(query, {"_id": 0}).to_list(1000)
    for pl in planned:
        if isinstance(pl.get('created_at'), str):
            pl['created_at'] = datetime.fromisoformat(pl['created_at'])
    return planned

@api_router.post("/planned-lessons", response_model=PlannedLesson)
async def create_planned_lesson(planned_data: PlannedLessonCreate, current_user: User = Depends(get_current_user)):
    course = await db.student_courses.find_one({"id": planned_data.student_course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.user_type == "teacher" and course["teacher_id"] != current_user.teacher_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    planned = PlannedLesson(**planned_data.model_dump())
    doc = planned.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.planned_lessons.insert_one(doc)
    return planned

@api_router.put("/planned-lessons/{planned_id}", response_model=PlannedLesson)
async def update_planned_lesson(planned_id: str, planned_data: PlannedLessonCreate, current_user: User = Depends(get_current_user)):
    existing = await db.planned_lessons.find_one({"id": planned_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Planned lesson not found")
    
    course = await db.student_courses.find_one({"id": planned_data.student_course_id}, {"_id": 0})
    if current_user.user_type == "teacher" and course["teacher_id"] != current_user.teacher_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = planned_data.model_dump()
    await db.planned_lessons.update_one({"id": planned_id}, {"$set": update_data})
    
    updated = await db.planned_lessons.find_one({"id": planned_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return PlannedLesson(**updated)

@api_router.delete("/planned-lessons/{planned_id}")
async def delete_planned_lesson(planned_id: str, current_user: User = Depends(get_current_user)):
    planned = await db.planned_lessons.find_one({"id": planned_id}, {"_id": 0})
    if not planned:
        raise HTTPException(status_code=404, detail="Planned lesson not found")
    
    course = await db.student_courses.find_one({"id": planned["student_course_id"]}, {"_id": 0})
    if current_user.user_type == "teacher" and course["teacher_id"] != current_user.teacher_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.planned_lessons.delete_one({"id": planned_id})
    return {"message": "Planned lesson deleted successfully"}

# ============= PAYMENT ROUTES =============

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(current_user: User = Depends(get_current_user)):
    if current_user.user_type == "admin":
        payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    else:
        # Teachers only see their payments
        payments = await db.payments.find(
            {"teacher_id": current_user.teacher_id},
            {"_id": 0}
        ).to_list(1000)
    
    for payment in payments:
        if isinstance(payment.get('created_at'), str):
            payment['created_at'] = datetime.fromisoformat(payment['created_at'])
    return payments

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create payments")
    
    payment = Payment(**payment_data.model_dump())
    doc = payment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.payments.insert_one(doc)
    return payment

# ============= TEACHER PRICE ROUTES =============

@api_router.get("/teacher-prices", response_model=List[TeacherPrice])
async def get_teacher_prices(teacher_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if teacher_id:
        query["teacher_id"] = teacher_id
    
    prices = await db.teacher_prices.find(query, {"_id": 0}).to_list(1000)
    return prices

@api_router.post("/teacher-prices", response_model=TeacherPrice)
async def create_teacher_price(price_data: TeacherPriceCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can set teacher prices")
    
    price = TeacherPrice(**price_data.model_dump())
    await db.teacher_prices.insert_one(price.model_dump())
    return price

# ============= TEACHER BALANCE ROUTE =============

@api_router.get("/teacher-balance/{teacher_id}")
async def get_teacher_balance(teacher_id: str, current_user: User = Depends(get_current_user)):
    # Teachers can only see their own balance
    if current_user.user_type == "teacher" and current_user.teacher_id != teacher_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all lessons for this teacher
    courses = await db.student_courses.find({"teacher_id": teacher_id}, {"_id": 0}).to_list(1000)
    course_ids = [c["id"] for c in courses]
    
    lessons = await db.lessons.find(
        {"student_course_id": {"$in": course_ids}},
        {"_id": 0}
    ).to_list(10000)
    
    # Calculate earnings based on teacher prices
    total_earnings = 0
    for lesson in lessons:
        course = next((c for c in courses if c["id"] == lesson["student_course_id"]), None)
        if course:
            # Get teacher price for this course
            teacher_price = await db.teacher_prices.find_one({
                "teacher_id": teacher_id,
                "branch_id": course["branch_id"],
                "lesson_type_id": course["lesson_type_id"]
            }, {"_id": 0})
            
            if teacher_price:
                # If it's a group lesson, check group_size
                if teacher_price.get("group_size"):
                    # Find matching group size price
                    group_price = await db.teacher_prices.find_one({
                        "teacher_id": teacher_id,
                        "branch_id": course["branch_id"],
                        "lesson_type_id": course["lesson_type_id"],
                        "group_size": teacher_price.get("group_size")
                    }, {"_id": 0})
                    if group_price:
                        total_earnings += group_price["price"] * lesson["number_of_lessons"]
                else:
                    total_earnings += teacher_price["price"] * lesson["number_of_lessons"]
    
    # Get payments made to teacher
    payments = await db.payments.find(
        {"teacher_id": teacher_id, "payment_type": "teacher_payment"},
        {"_id": 0}
    ).to_list(1000)
    
    total_paid = sum([p["amount"] for p in payments])
    balance = total_earnings - total_paid
    
    return {
        "teacher_id": teacher_id,
        "total_earnings": total_earnings,
        "total_paid": total_paid,
        "balance": balance,
        "payments": payments
    }

# ============= STUDENT GROUP ROUTES =============

@api_router.get("/student-groups", response_model=List[StudentGroup])
async def get_student_groups(current_user: User = Depends(get_current_user)):
    groups = await db.student_groups.find({}, {"_id": 0}).to_list(1000)
    for group in groups:
        if isinstance(group.get('created_at'), str):
            group['created_at'] = datetime.fromisoformat(group['created_at'])
    return groups

@api_router.post("/student-groups", response_model=StudentGroup)
async def create_student_group(group_data: StudentGroupCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create groups")
    
    group = StudentGroup(**group_data.model_dump())
    doc = group.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.student_groups.insert_one(doc)
    return group

@api_router.put("/student-groups/{group_id}", response_model=StudentGroup)
async def update_student_group(group_id: str, group_data: StudentGroupCreate, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update groups")
    
    existing = await db.student_groups.find_one({"id": group_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Group not found")
    
    update_data = group_data.model_dump()
    await db.student_groups.update_one({"id": group_id}, {"$set": update_data})
    
    updated = await db.student_groups.find_one({"id": group_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return StudentGroup(**updated)

@api_router.delete("/student-groups/{group_id}")
async def delete_student_group(group_id: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete groups")
    
    result = await db.student_groups.delete_one({"id": group_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Group deleted successfully"}

# ============= GROUP LESSON ENTRY =============

@api_router.post("/group-lessons")
async def create_group_lesson(
    group_id: str,
    branch_id: str,
    date: str,
    number_of_lessons: int,
    current_user: User = Depends(get_current_user)
):
    # Get group
    group = await db.student_groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check access
    if current_user.user_type == "teacher" and group.get("teacher_id") != current_user.teacher_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create lesson for each student in the group
    created_lessons = []
    for student_id in group["student_ids"]:
        # Find student course
        course = await db.student_courses.find_one({
            "student_id": student_id,
            "branch_id": branch_id,
            "teacher_id": group.get("teacher_id")
        }, {"_id": 0})
        
        if course:
            lesson = Lesson(
                student_course_id=course["id"],
                date=date,
                number_of_lessons=number_of_lessons
            )
            doc = lesson.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.lessons.insert_one(doc)
            created_lessons.append(lesson)
    
    return {"message": f"Created {len(created_lessons)} lessons for group", "count": len(created_lessons)}

# ============= INIT DATA ROUTE =============

@api_router.post("/init-data")
async def init_data():
    # Check if data already exists
    existing_user = await db.users.find_one({})
    if existing_user:
        return {"message": "Data already initialized"}
    
    # Create default branches
    branches = [
        Branch(name="Matematik"),
        Branch(name="Fen Bilimleri"),
        Branch(name="Türkçe"),
        Branch(name="İngilizce")
    ]
    for branch in branches:
        await db.branches.insert_one(branch.model_dump())
    
    # Create lesson types
    lesson_types = [
        LessonType(name="Birebir"),
        LessonType(name="Grup")
    ]
    for lt in lesson_types:
        await db.lesson_types.insert_one(lt.model_dump())
    
    # Create default season
    season = Season(name="2024-2025", is_current=True)
    await db.seasons.insert_one(season.model_dump())
    
    # Create admin user
    admin_user = User(
        username="admin",
        password_hash=get_password_hash("admin123"),
        user_type="admin"
    )
    doc = admin_user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"message": "Data initialized successfully"}

# ============= INCLUDE ROUTER =============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
