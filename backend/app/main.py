from fastapi import FastAPI

app = FastAPI(
    title="AI Smart Attendance System",
    version="1.0.0",
    description="Enterprise AI Smart Attendance Management System",
)


@app.get("/health")
async def health_check():
    return {
        "success": True,
        "message": "Smart Attendance API is running",
    }