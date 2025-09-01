# BiziWit Backend (Node.js, Express, MongoDB)

API server powering admin features like Custom Report Requests and Megatrend Whitepaper Submissions.

## Tech
- Node.js + Express
- MongoDB + Mongoose
- Helmet, CORS, Morgan
- Nodemon for dev

## Setup
1. Install dependencies
```bash
npm install
```

2. Configure environment
```bash
copy .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
```
Update `.env` values as needed:
- `PORT` (default 4000)
- `CORS_ORIGIN` (e.g., http://localhost:5173 for Vite)
- `MONGODB_URI` (default local instance)

3. Run
```bash
npm run dev
# or
npm start
```
Server will start at: http://localhost:4000

## Endpoints
- Health: `GET /health`

### Custom Report Requests
- List: `GET /api/custom-reports?q=&status=&limit=&offset=`
- Create: `POST /api/custom-reports`
- Read: `GET /api/custom-reports/:id`
- Update: `PATCH /api/custom-reports/:id`
- Delete: `DELETE /api/custom-reports/:id`

Body example (create/update):
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Acme Inc",
  "industry": "Retail",
  "requirements": "Need weekly trend analysis",
  "deadline": "2025-09-30",
  "status": "new",
  "notes": ""
}
```

### Megatrend Submissions (Whitepaper)
- List: `GET /api/megatrend-submissions?q=&limit=&offset=`
- Create: `POST /api/megatrend-submissions`
- Delete: `DELETE /api/megatrend-submissions/:id`

Body example (create):
```json
{
  "megatrendId": 1,
  "megatrendTitle": "AI Everywhere",
  "name": "John Smith",
  "email": "john@example.com",
  "company": "Globex",
  "role": "Analyst",
  "agreed": true
}
```

## Notes
- Add authentication/authorization middleware before production.
- Consider rate limiting and request validation (e.g., zod/celebrate) for stricter inputs.
