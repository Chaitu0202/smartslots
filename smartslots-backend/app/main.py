from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.routers import (
    auth, colleges, departments, teachers, subjects,
    rooms, sections, timeslots, assignments, constraints,
    timetables, dashboard, ai,
)

app = FastAPI(title="SmartSlots API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth.router)
app.include_router(colleges.router)
app.include_router(departments.router)
app.include_router(teachers.router)
app.include_router(subjects.router)
app.include_router(rooms.router)
app.include_router(sections.router)
app.include_router(timeslots.router)
app.include_router(assignments.router)
app.include_router(constraints.router)
app.include_router(timetables.router)
app.include_router(dashboard.router)
app.include_router(ai.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
