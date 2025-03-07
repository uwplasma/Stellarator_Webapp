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
import os
from flask import send_file

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

def fetch_configs_dict():
    configs = fetch_configs()
    # Assume config[0] is the unique configuration id
    return {config[0]: config for config in configs}

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
    

def generate_grid_plot(config):
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
        # Keep the static image for fallback (existing code)
        fig = plt.figure(figsize=(14, 7))
        stel.plot(newfigure=False, show=False)
        buffer = io.BytesIO()
        fig.savefig(buffer, format="png", bbox_inches='tight', dpi=150)
        plt.close(fig)
        buffer.seek(0)
        img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        buffer.close()
        
        # Create individual Plotly figures (new approach)
        try:
            # List to store all individual plots
            individual_plots = []
            phi = stel.phi
            
            # Helper function to create individual plots
            def create_individual_plot(title, data=None, y0=False):
                if data is None:
                    try:
                        data = getattr(stel, title)
                    except AttributeError:
                        print(f"Attribute {title} not found in Qsc object")
                        return None
                
                # Create a standalone figure for this diagnostic
                fig = go.Figure()
                fig.add_trace(
                    go.Scatter(
                        x=phi, 
                        y=data,
                        mode="lines",
                        name=title
                    )
                )
                
                # Customize layout
                fig.update_layout(
                    title=f"{title} vs φ",
                    xaxis_title="φ",
                    yaxis_title=title,
                    height=500,
                    width=700,
                    template="plotly_white"
                )
                
                # Set y-axis limits if needed
                if y0:
                    fig.update_yaxes(rangemode="nonnegative")
                
                return {
                    "name": title,
                    "figure": fig
                }
            
            # Create individual plots for all diagnostics
            plot_names = [
                'R0', 'Z0', 'R0p', 'Z0p', 'R0pp', 'Z0pp',
                'R0ppp', 'Z0ppp', 'curvature', 'torsion', 'sigma', 
                'X1c', 'Y1c', 'Y1s', 'elongation', 'L_grad_B'
            ]
            
            # Add order-specific plots
            if order != 'r1':
                plot_names.extend([
                    'L_grad_grad_B', 'B20', 'V1', 'V2', 'V3',
                    'X20', 'X2c', 'X2s', 'Y20', 'Y2c', 'Y2s', 'Z20', 'Z2c', 'Z2s'
                ])
                
            if order == 'r3':
                plot_names.extend(['X3c1', 'Y3c1', 'Y3s1'])
            
            # Special cases with custom data
            special_cases = {
                '1/L_grad_B': stel.inv_L_grad_B,
                '1/L_grad_grad_B': stel.grad_grad_B_inverse_scale_length_vs_varphi
            }
            
            # Create plots for standard attributes
            for name in plot_names:
                plot = create_individual_plot(name, y0=(name in ['curvature', 'elongation', 'L_grad_B']))
                if plot:
                    individual_plots.append(plot)
            
            # Create plots for special cases
            for name, data in special_cases.items():
                plot = create_individual_plot(name, data=data, y0=(name == '1/L_grad_B'))
                if plot:
                    individual_plots.append(plot)
            
            # Add singularity radius plot for r2 and r3 orders
            if order != 'r1':
                data = stel.r_singularity_vs_varphi.copy()
                data[data > 1e20] = np.nan  # Handle large values
                plot = create_individual_plot('r_singularity', data=data, y0=True)
                if plot:
                    individual_plots.append(plot)
            
            # Convert all figures to JSON
            plots_json = {}
            for plot in individual_plots:
                try:
                    plots_json[plot["name"]] = json.dumps(
                        plot["figure"], 
                        cls=plotly.utils.PlotlyJSONEncoder
                    )
                except Exception as e:
                    print(f"Error serializing {plot['name']}: {e}")
            
            return {
                "image": img_data,  # Keep the fallback static image
                "interactive_data": plots_json  # Dictionary of individual plots
            }
            
        except Exception as e:
            print(f"Error creating individual Plotly visualizations: {e}")
            return {"image": img_data, "interactive_data": None}
        
    except Exception as e:
        print(f"Error generating plot: {e}")
        return {"image": None, "interactive_data": None, "error": str(e)}

# Update the API endpoint
@app.route("/api/plot/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_api(config_id):
    print(f"Searching for boundary file for config_id={config_id}")
    
    configs_dict = fetch_configs_dict()
    selected_config = configs_dict.get(config_id)
    if not selected_config:
        return jsonify({"error": "Configuration not found"}), 404
    
    json_path = f"precomputed/boundary/json/{config_id}.json"
    png_path = f"precomputed/boundary/png/{config_id}.png"
    
    if os.path.exists(json_path) and os.path.exists(png_path):
        print(f"File found for config_id={config_id}. Returning precomputed data.")
        with open(json_path, "r") as f:
            interactive_data = f.read()
        
        with open(png_path, "rb") as f:
            plot_data = base64.b64encode(f.read()).decode("utf-8")
        
        return jsonify({
            "plot_data": plot_data,
            "interactive_data": interactive_data
        })
    else:
        print(f"No precomputed file found for config_id={config_id}. Generating on-the-fly.")
        plot_result = generate_plot(selected_config)
        return jsonify({
            "plot_data": plot_result.get("image"),
            "interactive_data": plot_result.get("interactive_data")
        })

@app.route("/api/grid/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_grid_api(config_id):
    print(f"Searching for diagnostic file for config_id={config_id}")
    
    # Use the O(1) dictionary lookup here too
    configs_dict = fetch_configs_dict()
    selected_config = configs_dict.get(config_id)
    if not selected_config:
        return jsonify({"error": "Configuration not found"}), 404
    
    png_path = f"precomputed/diagnostics/png/{config_id}.png"
    json_dir = f"precomputed/diagnostics/json/{config_id}"
    
    if os.path.exists(png_path) and os.path.exists(json_dir):
        print(f"File found for config_id={config_id}. Returning precomputed data.")
        with open(png_path, "rb") as f:
            plot_data = base64.b64encode(f.read()).decode("utf-8")
        
        # Use ThreadPoolExecutor to read JSON files in parallel
        import concurrent.futures
        
        def read_json_file(filename):
            name = filename.replace(".json", "")
            with open(os.path.join(json_dir, filename), "r") as f:
                return name, f.read()
        
        interactive_data = {}
        json_files = [f for f in os.listdir(json_dir) if f.endswith(".json")]
        
        # Only use ThreadPool if there are enough files to make it worthwhile
        if len(json_files) > 5:  
            with concurrent.futures.ThreadPoolExecutor(max_workers=min(10, len(json_files))) as executor:
                for name, content in executor.map(read_json_file, json_files):
                    interactive_data[name] = content
        else:
            # For small number of files, sequential is fine
            for filename in json_files:
                name, content = read_json_file(filename)
                interactive_data[name] = content
        
        return jsonify({
            "plot_data": plot_data,
            "interactive_data": interactive_data
        })
    else:
        print(f"No precomputed file found for config_id={config_id}. Generating on-the-fly.")
        plot_result = generate_grid_plot(selected_config)
        return jsonify({
            "plot_data": plot_result.get("image"),
            "interactive_data": plot_result.get("interactive_data")
        })

if __name__ == "__main__":
    app.run(debug=True)