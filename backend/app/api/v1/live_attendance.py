from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.services.attendance_service import AttendanceService
from app.services.audit_service import AuditService
from app.services.face_service import FaceService
from app.services.websocket_manager import manager


router = APIRouter(
    prefix="/live",
    tags=["Live Attendance"],
)


def authenticate_websocket(
    token: str,
    db: Session,
) -> User | None:
    """
    Validate JWT token and return active user.
    """

    try:
        payload = decode_access_token(token)

        if payload.get("type") != "access":
            return None

        user_id = UUID(
            str(payload["sub"])
        )

    except (
        InvalidTokenError,
        KeyError,
        ValueError,
        TypeError,
    ):
        return None

    user = db.scalar(
        select(User).where(
            User.id == user_id,
            User.is_active.is_(True),
        )
    )

    return user


@router.websocket(
    "/attendance"
)
async def live_attendance(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    Real-time attendance WebSocket.

    Client sends:

        {
            "type": "frame",
            "image": "<base64-image>"
        }

    Server responds with recognition/attendance event.
    """

    db = SessionLocal()

    user = None
    organization_id = None

    try:
        # ----------------------------------------------------
        # AUTHENTICATION
        # ----------------------------------------------------

        user = authenticate_websocket(
            token,
            db,
        )

        if not user:
            await websocket.close(
                code=1008,
                reason="Invalid or expired token",
            )
            return

        organization_id = str(
            user.organization_id
        )

        # ----------------------------------------------------
        # CONNECT
        # ----------------------------------------------------

        await manager.connect(
            organization_id,
            websocket,
        )

        await manager.send_personal(
            websocket,
            {
                "type": "connection",
                "success": True,
                "message": "Live attendance connected",
            },
        )

        # ----------------------------------------------------
        # LIVE LOOP
        # ----------------------------------------------------

        while True:

            message = await websocket.receive_json()

            message_type = message.get(
                "type"
            )

            # ------------------------------------------------
            # PING
            # ------------------------------------------------

            if message_type == "ping":

                await manager.send_personal(
                    websocket,
                    {
                        "type": "pong",
                        "success": True,
                    },
                )

                continue

            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------

            if message_type == "status":

                await manager.send_personal(
                    websocket,
                    {
                        "type": "status",
                        "success": True,
                        "connections": manager.count(
                            organization_id
                        ),
                    },
                )

                continue

            # ------------------------------------------------
            # FRAME
            # ------------------------------------------------

            if message_type != "frame":

                await manager.send_personal(
                    websocket,
                    {
                        "type": "error",
                        "success": False,
                        "message": (
                            "Unsupported message type"
                        ),
                    },
                )

                continue

            image_data = message.get(
                "image"
            )

            if not image_data:

                await manager.send_personal(
                    websocket,
                    {
                        "type": "recognition",
                        "success": False,
                        "matched": False,
                        "attendance_marked": False,
                        "message": (
                            "Image data is required"
                        ),
                    },
                )

                continue

            # ------------------------------------------------
            # DECODE BASE64 IMAGE
            # ------------------------------------------------

            import base64

            try:
                if "," in image_data:
                    image_data = image_data.split(
                        ",",
                        1,
                    )[1]

                image_bytes = base64.b64decode(
                    image_data,
                    validate=True,
                )

            except Exception:

                await manager.send_personal(
                    websocket,
                    {
                        "type": "recognition",
                        "success": False,
                        "matched": False,
                        "attendance_marked": False,
                        "message": (
                            "Invalid base64 image"
                        ),
                    },
                )

                continue

            if not image_bytes:

                await manager.send_personal(
                    websocket,
                    {
                        "type": "recognition",
                        "success": False,
                        "matched": False,
                        "attendance_marked": False,
                        "message": (
                            "Empty image"
                        ),
                    },
                )

                continue

            # ------------------------------------------------
            # FACE RECOGNITION
            # ------------------------------------------------

            recognition = FaceService.recognize(
                db=db,
                organization_id=user.organization_id,
                image_bytes=image_bytes,
            )

            if not recognition.get(
                "matched",
                False,
            ):

                await manager.send_personal(
                    websocket,
                    {
                        "type": "recognition",
                        "success": True,
                        "matched": False,
                        "attendance_marked": False,
                        "message": recognition.get(
                            "message",
                            "Face not recognized",
                        ),
                    },
                )

                continue

            student_id = recognition.get(
                "student_id"
            )

            if not student_id:

                await manager.send_personal(
                    websocket,
                    {
                        "type": "recognition",
                        "success": False,
                        "matched": False,
                        "attendance_marked": False,
                        "message": (
                            "Student ID missing "
                            "from recognition result"
                        ),
                    },
                )

                continue

            # ------------------------------------------------
            # AUTOMATIC ATTENDANCE
            # ------------------------------------------------

            attendance, created = (
                AttendanceService.mark_automatic(
                    db=db,
                    organization_id=(
                        user.organization_id
                    ),
                    student_id=UUID(
                        str(student_id)
                    ),
                    confidence_score=(
                        recognition.get(
                            "confidence_score"
                        )
                    ),
                )
            )

            # ------------------------------------------------
            # AUDIT LOG
            # ------------------------------------------------

            if created:

                AuditService.create(
                    db=db,
                    organization_id=(
                        user.organization_id
                    ),
                    user_id=user.id,
                    action="ATTENDANCE_MARKED",
                    entity_type="Attendance",
                    entity_id=attendance.id,
                    description=(
                        "Attendance automatically "
                        "marked through live "
                        "face recognition"
                    ),
                )

                db.commit()

            # ------------------------------------------------
            # LIVE EVENT
            # ------------------------------------------------

            event = {
                "type": "attendance",
                "success": True,
                "matched": True,
                "attendance_marked": created,
                "message": (
                    "Attendance marked successfully"
                    if created
                    else (
                        "Attendance already marked "
                        "for today"
                    )
                ),
                "recognition": recognition,
                "attendance": {
                    "id": str(
                        attendance.id
                    ),
                    "student_id": str(
                        attendance.student_id
                    ),
                    "attendance_date": (
                        str(
                            attendance.attendance_date
                        )
                    ),
                    "status": (
                        attendance.status
                    ),
                    "source": (
                        attendance.source
                    ),
                    "check_in_time": (
                        attendance.check_in_time.isoformat()
                        if attendance.check_in_time
                        else None
                    ),
                    "confidence_score": (
                        float(
                            attendance.confidence_score
                        )
                        if attendance.confidence_score
                        is not None
                        else None
                    ),
                    "verification_method": (
                        attendance.verification_method
                    ),
                },
            }

            # Send event to every dashboard/camera
            # connected to this organization.
            await manager.broadcast(
                organization_id,
                event,
            )

    except WebSocketDisconnect:

        if organization_id:
            manager.disconnect(
                organization_id,
                websocket,
            )

    except Exception as exc:

        if organization_id:
            manager.disconnect(
                organization_id,
                websocket,
            )

        try:
            await websocket.close(
                code=1011,
                reason="Internal server error",
            )
        except Exception:
            pass

        print(
            "Live attendance WebSocket error:",
            repr(exc),
        )

    finally:

        if organization_id:
            manager.disconnect(
                organization_id,
                websocket,
            )

        db.close()
        