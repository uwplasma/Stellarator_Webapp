from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS, cross_origin  # Import this
import sqlite3
from qsc import Qsc
import matplotlib
import matplotlib.pyplot as plt
import io
import base64


# Set the backend to 'Agg' to disable GUI
matplotlib.use("Agg")

app = Flask(__name__)
CORS(app)

# Connect to SQLite database
def connect_db():
    return sqlite3.connect("dbsqlite.db")  # Path to your SQLite database file


# Function to fetch configurations from the SQLite database
def fetch_configs():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, iota, axis_length FROM good_data"
    )
    rows = cursor.fetchall()
    conn.close()
    return rows


# Function to safely access attributes
def get_attr(obj, attr_name, default=None):
    return getattr(obj, attr_name, default)


# Function to determine the order automatically based on available parameters
def determine_order(config):
    _, _, _, _, _, _, _, _, _, B2c, p2, _, _ = config  # Ignore extra columns

    if B2c is None and p2 is None:
        return "r1"
    elif B2c is not None and p2 is None:
        return "r2"
    elif B2c is not None and p2 is not None:
        return "r3"
    return "r1"  # Default to r1 if detection fails


# Function to generate a base64-encoded image of the plot
def generate_plot(config):
    # Extract the config parameters (ignore the last two columns with _ placeholders)
    config_id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, _, _ = config

    # Determine the appropriate order
    order = determine_order(config)

    # Build the configuration parameters based on the order
    config_params = {
        "rc": [1, rc1, rc2, rc3],
        "zs": [0, zs1, zs2, zs3],
        "nfp": nfp,
        "etabar": etabar,
        "order": order,
    }

    # Add higher-order parameters conditionally
    if order in ("r2", "r3"):
        config_params["B2c"] = B2c
    if order == "r3":
        config_params["p2"] = p2

    # Create the Qsc object based on the configuration
    stel = Qsc(**config_params)

    # Generate the plot and save it to a BytesIO buffer
    plt.figure()
    stel.plot()  # This should create a figure without requiring ax
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png")
    plt.close()

    # Convert the buffer content to a base64 string
    buffer.seek(0)
    img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
    buffer.close()

    return img_data


@app.route("/api/configs", methods=["GET"])
@cross_origin()
def get_configs():
    configs = fetch_configs()
    # Convert from tuple to dictionary or any serializable format
    data = [
        {
            "id": row[0],
            "rc1": row[1],
            "rc2": row[2],
            "rc3": row[3],
            "zs1": row[4],
            "zs2": row[5],
            "zs3": row[6],
            "nfp": row[7],
            "etabar": row[8]

        }
        for row in configs
    ]
    return jsonify(data)


# New API endpoint for plot data for the React app
@app.route("/api/plot/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_api(config_id):
    configs = fetch_configs()
    selected_config = next((config for config in configs if config[0] == config_id), None)
    if not selected_config:
        return jsonify({"error": "Configuration not found"}), 404

    plot_data = generate_plot(selected_config)
    return jsonify({"plot_data": plot_data})



@app.route("/api/plot/<int:config_id>")
@cross_origin()
def plot(config_id):
    # Fetch the specific configuration
    configs = fetch_configs()
    selected_config = next(config for config in configs if config[0] == config_id)

    # Generate the plot as a base64-encoded image
    plot_data = generate_plot(selected_config)
    return render_template("plot.html", plot_data=plot_data)


if __name__ == "__main__":
    app.run(debug=True)
