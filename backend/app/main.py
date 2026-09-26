from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    attendance_router,
    attendance_policy_router,
    auth_router,
    audit_log_router,
    course_router,
    dashboard_router,
    department_router,
    face_router,
    holiday_router,
    live_attendance_router,
    report_router,
    section_router,
    student_router,
)


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="AI Smart Attendance Management System",
    description="Enterprise-level Smart Attendance Management API",
    version="1.0.0",
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],

    allow_credentials=True,

    allow_methods=[
        "*",
    ],

    allow_headers=[
        "*",
    ],
)


# ==========================================================
# API ROUTERS
# ==========================================================

API_PREFIX = "/api/v1"


app.include_router(
    auth_router,
    prefix=API_PREFIX,
)

app.include_router(
    student_router,
    prefix=API_PREFIX,
)

app.include_router(
    department_router,
    prefix=API_PREFIX,
)

app.include_router(
    course_router,
    prefix=API_PREFIX,
)

app.include_router(
    section_router,
    prefix=API_PREFIX,
)

app.include_router(
    face_router,
    prefix=API_PREFIX,
)

app.include_router(
    attendance_router,
    prefix=API_PREFIX,
)

app.include_router(
    attendance_policy_router,
    prefix=API_PREFIX,
)

app.include_router(
    holiday_router,
    prefix=API_PREFIX,
)

app.include_router(
    report_router,
    prefix=API_PREFIX,
)

app.include_router(
    dashboard_router,
    prefix=API_PREFIX,
)

app.include_router(
    audit_log_router,
    prefix=API_PREFIX,
)

app.include_router(
    live_attendance_router,
    prefix=API_PREFIX,
)


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI Smart Attendance API is running",
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
    }