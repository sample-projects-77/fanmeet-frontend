# FanMeet Frontend

React.js frontend application for FanMeet platform.

## Features

- User Authentication
  - Login page
  - Signup page (Fan and Creator registration)
  - JWT token management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (copy from `.env.example`):
```env
REACT_APP_API_URL=http://localhost:5000
```
   - For local development: `http://localhost:5000`
   - For remote server: `http://your-server-url:5000`
   - **Note:** The `/api` suffix is automatically appended, so don't include it in the URL

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

**Important:** If you change the `.env` file, you must restart the development server for changes to take effect.

## API Integration

The frontend connects to the FanMeet backend API. Make sure the backend is running on port 5000 (or update the API URL in `.env`).

### Available Endpoints Used:
- `POST /api/auth/login` - User login
- `POST /api/auth/fans/register` - Fan registration
- `POST /api/auth/creators/register` - Creator registration

## Project Structure

```
fanmeet_frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Login.css
│   │   ├── Signup.js
│   │   └── Signup.css
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```


