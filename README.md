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

### Running the Backend
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

Go To the reactFrontend Directory:
```sh
cd ../frontend/reactfrontend
```


Install dependencies:

```sh
npm install
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