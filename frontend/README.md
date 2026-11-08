# VeritasBrand Frontend (React + Vite)

    npm install
    npm run dev

Backend: https://veritasbrand-backend.onrender.com (set in src/api.js).
The first request can take ~50s while the free Render server wakes up.

## Files
- src/api.js: the 3 endpoints (register, upload, status)
- src/App.jsx: auth screens, sidebar nav, dashboard, upload, approve/reject
- src/styles.css: all styling

## Things to confirm with the backend dev
1. Upload multipart field name (assumed `file`).
2. Status body shape (assumed `{ "status": "APPROVED" }`).
3. Register response should include the new user's `id`.
4. There is no login or list-documents endpoint, so login and the dashboard list are kept in localStorage on this device.
