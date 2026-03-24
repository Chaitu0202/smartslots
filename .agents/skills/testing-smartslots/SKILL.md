# Testing SmartSlots Application

## Overview
SmartSlots is a full-stack app with a FastAPI backend (OR-Tools constraint solver) and React+Vite frontend.

## Local Setup

### Backend
```bash
cd smartslots-backend
poetry install
poetry run fastapi dev app/main.py --port 8000
```
- Backend auto-creates SQLite DB on first run
- Delete `smartslots.db` to reset all data

### Frontend
```bash
cd smartslots-frontend
npm install
npm run dev -- --port 5173
```
- If port 5173 is busy, Vite auto-selects 5174+. Check terminal output.

## Test Data Seeding
After backend starts, seed data via API in this order (dependencies matter):
1. Register user (`POST /api/auth/register`) with role `super_admin`
2. Login (`POST /api/auth/login`) to get JWT token
3. Create college (`POST /api/colleges`)
4. Create department (`POST /api/departments`) with `college_id`
5. Generate time slots (`POST /api/timeslots/generate-default?college_id=X`) - creates 48 slots (8 periods x 6 days)
6. Create teachers (`POST /api/teachers`) with `department_id`
7. Create subjects (`POST /api/subjects`) with `department_id` and `hours_per_week`
8. Create room (`POST /api/rooms`) with `college_id`
9. Create section (`POST /api/sections`) with `department_id`
10. Create assignments (`POST /api/assignments`) linking teacher + subject + section

## Known Issues & Workarounds

### passlib/bcrypt Compatibility
- passlib's CryptContext with bcrypt 4.1+ may raise `ValueError: password cannot be longer than 72 bytes`
- Workaround: Use direct `bcrypt.checkpw()` / `bcrypt.hashpw()` instead of passlib

### JWT `sub` Claim Must Be String
- `python-jose` requires `sub` to be a string per JWT spec
- If `user.id` (integer) is passed directly, token decode fails with `JWTClaimsError: Subject must be a string`
- Fix: `str(user.id)` when encoding, `int(sub)` when decoding

## Key Test Flows

### Timetable Generation (Core Feature)
1. Navigate to Timetables page
2. Click "Generate Timetable"
3. Select department, academic year, semester
4. Click Generate - solver runs OR-Tools optimization
5. Verify: card appears with status "Draft" and a score > 0
6. Click eye icon to view grid - verify color-coded entries with no clashes

### AI Assistant
1. Navigate to AI Assistant page
2. Type natural language constraint (e.g. "No classes after 4 PM on Friday")
3. Click send - verify parsed result shows confidence score and description

## Devin Secrets Needed
No external secrets required for local testing. The app uses a hardcoded dev secret key.
