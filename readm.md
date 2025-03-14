# Stellarator_Webapp

Flask Stellarator Project Documentation
Project Overview
This project is a Flask-based web application that displays and plots quasi-symmetric stellarator configurations. The data is stored in an SQLite database, and the application uses Matplotlib for generating visualizations of the stellarator configurations.
Folder Structure
- **app**
  - **static**: Contains static files like CSS (`styles.css`) and images (`main.jpg`).
  - **templates**: HTML templates for the web application.
  - **venv**: Python virtual environment.
Key Files
- **`routes.py`**: Main file for defining routes and logic.
  - `/`: Renders the homepage displaying a table of stellarator configurations.
  - `/plot/<config_id>`: Generates and displays a plot for a selected configuration.
- **`dbsqlite.db`**: SQLite database containing the configuration data.
- **`requirements.txt`**: Lists the dependencies needed for the project.
How It Works
1. **Fetch Configurations**: Data is retrieved from `dbsqlite.db` using SQL queries.
2. **Plot Generation**: Using Matplotlib, configurations are plotted and converted to base64 for display.
3. **DataTable Integration**: Interactive table powered by DataTables to view configuration details.
Usage
1. Start the Flask app using `python routes.py`.
2. Access the homepage at `http://127.0.0.1:5001/`.
3. Select a configuration to view the corresponding plot.
Detailed Explanation of routes.py
Overview
The `routes.py` file serves as the core of the Flask application. It defines the routes (URL endpoints) and contains functions for database interaction, configuration processing, and plot generation.
Imports
```python
from flask import Flask, render_template, request, redirect, url_for
import sqlite3
from qsc import Qsc
import matplotlib
import matplotlib.pyplot as plt
import io
import base64
```
- `flask`: Provides core Flask components for building web routes and rendering templates.
- `sqlite3`: Used to connect to and interact with the SQLite database.
- `qsc`: A custom module for processing stellarator configurations (assumed to be part of the project).
- `matplotlib`: Used for generating plots, with the 'Agg' backend to avoid requiring a GUI.
- `io` and `base64`: Convert plots to base64 format so they can be embedded in HTML.
Application Setup
Initializes the Flask app instance:

```python
app = Flask(__name__)
```
Database Connection
```python
def connect_db():
    return sqlite3.connect('dbsqlite.db')
```
- **`connect_db`**: Opens a connection to `dbsqlite.db`, the SQLite database storing configuration data.
Fetching Configurations
```python
def fetch_configs():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, iota, axis_length FROM good_data'
    )
    rows = cursor.fetchall()
    conn.close()
    return rows
```
- **`fetch_configs`**: Retrieves all configuration data from the `good_data` table in the database.
Helper Functions
```python
def get_attr(obj, attr_name, default=None):
    return getattr(obj, attr_name, default)
```
- **`get_attr`**: Safely retrieves an attribute from an object, returning a default value if the attribute doesn’t exist.
Plot Generation
Generates a plot for a given configuration using `Qsc`:

```python
def generate_plot(config):
    # Code to generate plot here
```
- Converts the plot to a base64 string for embedding in HTML.
HTML Templates
base.html
The base template contains the shared structure for all pages, including styles and scripts.
index.html
Displays the homepage with a table of configurations.
plot.html
Displays the plot for a selected configuration.
![image](https://github.com/user-attachments/assets/95b1df72-3088-4a4a-81a4-49016f65f305)
