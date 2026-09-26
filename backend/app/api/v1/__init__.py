from app.api.v1.attendance import (
    router as attendance_router,
)
from app.api.v1.attendance_policies import (
    router as attendance_policy_router,
)
from app.api.v1.auth import (
    router as auth_router,
)
from app.api.v1.audit_logs import (
    router as audit_log_router,
)
from app.api.v1.courses import (
    router as course_router,
)
from app.api.v1.dashboard import (
    router as dashboard_router,
)
from app.api.v1.departments import (
    router as department_router,
)
from app.api.v1.face import (
    router as face_router,
)
from app.api.v1.holidays import (
    router as holiday_router,
)
from app.api.v1.live_attendance import (
    router as live_attendance_router,
)
from app.api.v1.reports import (
    router as report_router,
)
from app.api.v1.sections import (
    router as section_router,
)
from app.api.v1.students import (
    router as student_router,
)


__all__ = [
    "attendance_router",
    "attendance_policy_router",
    "auth_router",
    "audit_log_router",
    "course_router",
    "dashboard_router",
    "department_router",
    "face_router",
    "holiday_router",
    "live_attendance_router",
    "report_router",
    "section_router",
    "student_router",
]