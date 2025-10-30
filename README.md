
# Stellarator Webapp

## Project Overview

This project is a full-stack web application that displays and plots quasi-symmetric stellarator configurations. The frontend is built using React, while the backend is powered by Flask. The application retrieves configuration data from an SQLite database and uses Matplotlib for visualization.

## Key Files

### Backend

- `routes.py`: Defines API routes and handles logic for fetching and processing data.
  - `/api/configs`: Fetches paginated and searchable configuration data from the database.
- `XGStels.db`: SQLite database storing stellarator configuration data.
- `requirements.txt`: Lists the Python dependencies required for the backend.

### Frontend

- `App.js`: Main React component handling routing and data fetching.
- `components/Table.js`: Displays the interactive table of stellarator configurations.
- `components/Plot.js`: Handles rendering of stellarator plots.
- `package.json`: Manages frontend dependencies and scripts.

## How It Works

### Backend (Flask)

1. **Data Retrieval**: Queries `XGStels.db` for configuration data.
2. **Pagination & Search**: Supports filtering and paginated results through query parameters.
3. **API Response**: Sends JSON data to the frontend.

### Frontend (React)

1. **Fetch Configurations**: Calls `/api/configs` to retrieve paginated data.
2. **Interactive Table**: Uses React components to display and filter configurations.
3. **Plot Visualization**: Fetches and displays plots generated using Matplotlib.

## Usage

It would be beneficial to have a venv folder to store the Python dependencies

### Running the Backend
Ensure You are in the Stellarator_Webapp directory

Go to the Backend Directory:

```sh
cd app/backend
```

Install dependencies:

```sh
pip install -r requirements.txt
```

Start the Flask server:

```sh
python3 routes.py
```

The backend will be available at [http://127.0.0.1:5000/](http://127.0.0.1:5000/).

### Running the Frontend
Ensure You are in the Stellarator_Webapp directory

Go To the reactFrontend Directory:
```sh
cd app/frontend/reactfrontend
```


Install dependencies:

```sh
npm install
```

Fix Vulnerabilities:
```sh
npm audit --production
```

Start the React development server:

```sh
npm start
```

Access the application at [http://localhost:3000/](http://localhost:3000/).

## API Endpoint Details

### `/api/configs` (GET)

Retrieves stellarator configurations with support for pagination and search.

#### Query Parameters:

- `page` (int): Page number (default: 1)
- `limit` (int): Number of records per page (default: 500)
- `search_rc1`, `search_rc2`, etc. (string): Search filters for configuration attributes.

## Technologies Used

- **Frontend**: React, JavaScript, HTML, CSS
- **Backend**: Flask, SQLite, Python
- **Data Visualization**: Matplotlib
- **State Management**: React Hooks
- **API Handling**: Flask-RESTful, Flask-CORS
```
 


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

