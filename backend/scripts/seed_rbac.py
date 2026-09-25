from app.database.seeds.rbac import seed_rbac
from app.database.session import SessionLocal


def main():
    db = SessionLocal()

    try:
        seed_rbac(db)
        print("RBAC seed completed successfully.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()