from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS, cross_origin
import sqlite3
from qsc import Qsc
import matplotlib
import matplotlib.pyplot as plt
import io
import base64
import plotly
import plotly.graph_objects as go
import json
import numpy as np  # Add this import

# Set the backend to 'Agg' to disable GUI
matplotlib.use("Agg")

app = Flask(__name__)
CORS(app)

# Connect to SQLite database
def connect_db():
    return sqlite3.connect("XGStels.db")  # Path to your SQLite database file

# Modified API endpoint to support pagination and search
@app.route("/api/configs", methods=["GET"])
@cross_origin()
def get_configs():
    # Get query parameters for pagination and search
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=500, type=int)

    # Existing individual search parameters
    search_rc1 = request.args.get("search_rc1", default="", type=str)
    search_rc2 = request.args.get("search_rc2", default="", type=str)
    search_rc3 = request.args.get("search_rc3", default="", type=str)
    search_zs1 = request.args.get("search_zs1", default="", type=str)
    search_zs2 = request.args.get("search_zs2", default="", type=str)
    search_zs3 = request.args.get("search_zs3", default="", type=str)
    search_nfp = request.args.get("search_nfp", default="", type=str)
    search_etabar = request.args.get("search_etabar", default="", type=str)

    # Get filter parameters from MUI DataGrid
    filter_value = request.args.get("filter", default="", type=str)
    filter_field = request.args.get("filter_field", default="", type=str)

    offset = (page - 1) * limit

    conn = connect_db()
    cursor = conn.cursor()

    # Base queries
    count_query = "SELECT COUNT(*) FROM XGStels"
    data_query = "SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar FROM XGStels"
    where_clauses = []
    params = []

    # Existing individual search parameters (AND logic)
    if search_rc1:
        where_clauses.append("rc1 LIKE ?")
        params.append(f"%{search_rc1}%")
    if search_rc2:
        where_clauses.append("rc2 LIKE ?")
        params.append(f"%{search_rc2}%")
    if search_rc3:
        where_clauses.append("rc3 LIKE ?")
        params.append(f"%{search_rc3}%")
    if search_zs1:
        where_clauses.append("zs1 LIKE ?")
        params.append(f"%{search_zs1}%")
    if search_zs2:
        where_clauses.append("zs2 LIKE ?")
        params.append(f"%{search_zs2}%")
    if search_zs3:
        where_clauses.append("zs3 LIKE ?")
        params.append(f"%{search_zs3}%")
    if search_nfp:
        where_clauses.append("nfp LIKE ?")
        params.append(f"%{search_nfp}%")
    if search_etabar:
        where_clauses.append("etabar LIKE ?")
        params.append(f"%{search_etabar}%")

    # Apply the DataGrid filter
    allowed_fields = {"rc1", "rc2", "rc3", "zs1", "zs2", "zs3", "nfp", "etabar"}
    if filter_field and filter_field in allowed_fields and filter_value:
        where_clauses.append(f"{filter_field} LIKE ?")
        params.append(f"%{filter_value}%")

    # Combine the WHERE clause if needed
    if where_clauses:
        clause = " WHERE " + " AND ".join(where_clauses)
        count_query += clause
        data_query += clause

    # First, get total count
    cursor.execute(count_query, params)
    count = cursor.fetchone()[0]
    totalPages = max(1, -(-count // limit))  # Ceiling division

    # Query the paginated records
    data_query += " LIMIT ? OFFSET ?"
    cursor.execute(data_query, params + [limit, offset])
    rows = cursor.fetchall()
    conn.close()

    data = {
        "configs": [
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
            } for row in rows
        ],
        "totalPages": totalPages,
        "count": count
    }
    return jsonify(data)

# Function to fetch configurations from the SQLite database
def fetch_configs():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, axis_length, iota FROM XGStels"
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

# Modified function to generate plot data for interactive visualization
def generate_plot(config):
    # Extract the config parameters
    config_id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, _, _ = config

    # Determine the appropriate order
    order = determine_order(config)

    # Build the configuration parameters
    config_params = {
        "rc": [1, rc1, rc2, rc3],
        "zs": [0, zs1, zs2, zs3],
        "nfp": nfp,
        "etabar": etabar,
        "order": order,
    }
    if order in ("r2", "r3") and B2c is not None:
        config_params["B2c"] = B2c
    if order == "r3" and p2 is not None:
        config_params["p2"] = p2

    # Create the Qsc object
    stel = Qsc(**config_params)
    
    try:
        # --------------------------------------------------
        # Instead of using stel.plot(), use get_boundary() to get the 3D boundary data
        # --------------------------------------------------
        r = 0.1  # near-axis radius
        
        # Try different radii if the default fails
        radii_to_try = [0.1, 0.05, 0.15, 0.2, 0.025]
        success = False
        
        for r in radii_to_try:
            try:
                ntheta = 80  # poloidal resolution
                nphi = 300   # Increase toroidal resolution
                
                # Get the boundary data
                x_2D_plot, y_2D_plot, z_2D_plot, R_2D = stel.get_boundary(
                    r=r, ntheta=ntheta, nphi=nphi, ntheta_fourier=20
                )
                success = True
                break  # Break out of the loop if successful
            except ValueError as e:
                if "f(a) and f(b) must have different signs" in str(e):
                    print(f"Failed with radius {r}, trying next value")
                    continue
                else:
                    raise  # Re-raise if it's a different ValueError
        
        if not success:
            # If all radius values fail, fall back to a simpler visualization
            # Create a simple plot showing the axis
            fig = plt.figure(figsize=(10, 8))
            ax = fig.gca()
            stel.plot_axis(show=False)
            
            # Generate static image for the fallback visualization
            buffer = io.BytesIO()
            fig.savefig(buffer, format="png", bbox_inches='tight', dpi=150)
            plt.close(fig)
            buffer.seek(0)
            img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
            buffer.close()
            
            return {
                "image": img_data, 
                "interactive_data": None,
                "error": "Could not generate 3D boundary visualization for this configuration."
            }
        
        # Create a regular matplotlib figure for 3D plotting
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')
        
        # Get the magnetic field strength on the surface for coloring
        theta1D = np.linspace(0, 2 * np.pi, ntheta)
        phi1D = np.linspace(0, 2 * np.pi, nphi)
        phi2D, theta2D = np.meshgrid(phi1D, theta1D)
        Bmag = stel.B_mag(r, theta2D, phi2D)
        
        # Plot the surface with coloring based on magnetic field strength
        surf = ax.plot_surface(
            x_2D_plot, y_2D_plot, z_2D_plot,
            facecolors=plt.cm.viridis(plt.Normalize()(Bmag)),
            rstride=1, cstride=1, antialiased=False, linewidth=0
        )
        
        # Add a colorbar for reference
        m = plt.cm.ScalarMappable(cmap=plt.cm.viridis, norm=plt.Normalize(vmin=Bmag.min(), vmax=Bmag.max()))
        m.set_array([])
        cbar = plt.colorbar(m, ax=ax, shrink=0.7)
        cbar.set_label('|B| [T]')
        
        # Set equal aspect ratio for the 3D plot
        # This is important for the stellarator to look right
        ax.set_box_aspect([1, 1, 1])
        ax.set_axis_off()  # Hide the axes
        
        # Generate static image for fallback
        buffer = io.BytesIO()
        fig.savefig(buffer, format="png", bbox_inches='tight', dpi=150)
        plt.close(fig)  # Close the figure to free memory
        buffer.seek(0)
        img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        buffer.close()
        
        # Create Plotly data for interactive visualization
        try:
            # Create Plotly figure directly, not converting from matplotlib
            # which often has issues with 3D plots
            import plotly.graph_objects as go
            
            colorscale = [[0, 'blue'], [0.5, 'green'], [1, 'red']]
            
            plotly_fig = {
                "data": [{
                    "type": "surface",
                    "x": x_2D_plot.tolist(),
                    "y": y_2D_plot.tolist(),
                    "z": z_2D_plot.tolist(),
                    "surfacecolor": Bmag.tolist(),
                    "colorscale": "Viridis",
                    "colorbar": {"title": "|B| [T]"},
                    "showscale": True
                }],
                "layout": {
                    "title": f"Stellarator Configuration {config_id}",
                    "autosize": True,
                    "scene": {
                        "xaxis": {"visible": False},
                        "yaxis": {"visible": False},
                        "zaxis": {"visible": False},
                        "aspectmode": "data"
                    },
                    "margin": {"l": 0, "r": 0, "b": 0, "t": 30},
                    "paper_bgcolor": "rgb(240, 240, 240)"
                }
            }
            
            plot_json = json.dumps(plotly_fig)
            return {"image": img_data, "interactive_data": plot_json}
            
        except Exception as e:
            print(f"Error creating Plotly visualization: {e}")
            return {"image": img_data, "interactive_data": None}
        
    except Exception as e:
        print(f"Error generating plot: {e}")
        return {"image": None, "interactive_data": None, "error": str(e)}

# Update the API endpoint
@app.route("/api/plot/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_api(config_id):
    configs = fetch_configs()
    selected_config = next((config for config in configs if config[0] == config_id), None)
    if not selected_config:
        return jsonify({"error": "Configuration not found"}), 404

    plot_result = generate_plot(selected_config)
    return jsonify({
        "plot_data": plot_result["image"],
        "interactive_data": plot_result["interactive_data"]
    })

if __name__ == "__main__":
    app.run(debug=True)