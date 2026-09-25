from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission


PERMISSIONS = {
    "user:create": "Create users",
    "user:read": "View users",
    "user:update": "Update users",
    "user:delete": "Delete users",

    "student:create": "Create students",
    "student:read": "View students",
    "student:update": "Update students",
    "student:delete": "Delete students",

    "attendance:create": "Create attendance",
    "attendance:read": "View attendance",
    "attendance:update": "Update attendance",
    "attendance:delete": "Delete attendance",

    "report:read": "View reports",
    "report:export": "Export reports",

    "face_enrollment:create": "Create face enrollment",
    "face_enrollment:read": "View face enrollment",

    "recognition:start": "Start recognition",
    "recognition:stop": "Stop recognition",

    "dashboard:read": "View dashboard",

    "organization:read": "View organization",
    "organization:update": "Update organization",

    "audit_log:read": "View audit logs",
}


ROLES = {
    "SUPER_ADMIN": "Full system access",
    "ADMIN": "Administrative access",
    "TEACHER": "Teacher access",
    "STUDENT": "Student access",
}


ROLE_PERMISSIONS = {
    "SUPER_ADMIN": list(PERMISSIONS.keys()),

    "ADMIN": [
        "user:create",
        "user:read",
        "user:update",
        "user:delete",

        "student:create",
        "student:read",
        "student:update",
        "student:delete",

        "attendance:create",
        "attendance:read",
        "attendance:update",
        "attendance:delete",

        "report:read",
        "report:export",

        "face_enrollment:create",
        "face_enrollment:read",

        "recognition:start",
        "recognition:stop",

        "dashboard:read",

        "organization:read",

        "audit_log:read",
    ],

    "TEACHER": [
        "student:read",

        "attendance:create",
        "attendance:read",
        "attendance:update",

        "report:read",
        "report:export",

        "face_enrollment:create",
        "face_enrollment:read",

        "recognition:start",
        "recognition:stop",

        "dashboard:read",
    ],

    "STUDENT": [
        "student:read",
        "attendance:read",
        "dashboard:read",
    ],
}


def seed_rbac(db: Session) -> None:

    permission_objects = {}

    for name, description in PERMISSIONS.items():

        permission = db.scalar(
            select(Permission).where(
                Permission.name == name
            )
        )

        if permission is None:
            permission = Permission(
                name=name,
                description=description,
            )

            db.add(permission)

        permission_objects[name] = permission

    db.flush()

    role_objects = {}

    for name, description in ROLES.items():

        role = db.scalar(
            select(Role).where(
                Role.name == name
            )
        )

        if role is None:
            role = Role(
                name=name,
                description=description,
            )

            db.add(role)

        role_objects[name] = role

    db.flush()

    for role_name, permission_names in ROLE_PERMISSIONS.items():

        role = role_objects[role_name]

        existing_permissions = {
            permission_id
            for permission_id, in db.execute(
                select(
                    RolePermission.permission_id
                ).where(
                    RolePermission.role_id == role.id
                )
            ).all()
        }

        for permission_name in permission_names:

            permission = permission_objects[permission_name]

            if permission.id not in existing_permissions:

                db.add(
                    RolePermission(
                        role_id=role.id,
                        permission_id=permission.id,
                    )
                )

    db.commit()