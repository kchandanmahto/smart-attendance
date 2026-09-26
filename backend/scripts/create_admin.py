import sys
from pathlib import Path

sys.path.append(
    str(Path(__file__).resolve().parents[1])
)

from sqlalchemy import select

from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models import Organization, Role, User


ADMIN_EMAIL = "admin@smartattendance.com"
ADMIN_PASSWORD = "Admin@12345"


def create_admin():

    db = SessionLocal()

    try:

        # ==================================================
        # ORGANIZATION
        # ==================================================

        organization = db.scalar(
            select(Organization).where(
                Organization.code == "DEFAULT"
            )
        )

        if not organization:

            organization = Organization(
                name="Default Organization",
                code="DEFAULT",
                email=ADMIN_EMAIL,
            )

            db.add(organization)
            db.flush()


        # ==================================================
        # SUPER ADMIN ROLE
        # ==================================================

        role = db.scalar(
            select(Role).where(
                Role.name == "SUPER_ADMIN"
            )
        )

        if not role:

            raise RuntimeError(
                "SUPER_ADMIN role not found. "
                "Run RBAC seed first."
            )


        # ==================================================
        # CHECK NEW ADMIN
        # ==================================================

        existing = db.scalar(
            select(User).where(
                User.email == ADMIN_EMAIL
            )
        )

        if existing:

            existing.password_hash = hash_password(
                ADMIN_PASSWORD
            )

            existing.organization_id = organization.id
            existing.role_id = role.id
            existing.is_active = True

            db.commit()

            print("Admin already exists.")
            print("Admin password has been reset.")
            print(f"Email: {ADMIN_EMAIL}")
            print(f"Password: {ADMIN_PASSWORD}")

            return


        # ==================================================
        # MIGRATE OLD INVALID EMAIL
        # ==================================================

        old_admin = db.scalar(
            select(User).where(
                User.email == "admin@smartattendance.local"
            )
        )

        if old_admin:

            old_admin.email = ADMIN_EMAIL
            old_admin.password_hash = hash_password(
                ADMIN_PASSWORD
            )
            old_admin.organization_id = organization.id
            old_admin.role_id = role.id
            old_admin.is_active = True

            db.commit()

            print("Existing admin account migrated.")
            print(f"Email: {ADMIN_EMAIL}")
            print(f"Password: {ADMIN_PASSWORD}")

            return


        # ==================================================
        # CREATE ADMIN
        # ==================================================

        admin = User(
            organization_id=organization.id,
            role_id=role.id,
            email=ADMIN_EMAIL,
            password_hash=hash_password(
                ADMIN_PASSWORD
            ),
            first_name="System",
            last_name="Administrator",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully.")
        print(f"Email: {ADMIN_EMAIL}")
        print(f"Password: {ADMIN_PASSWORD}")


    except Exception:

        db.rollback()
        raise

    finally:

        db.close()


if __name__ == "__main__":
    create_admin()