from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask import send_file
import io
import csv
import os
from flask_cors import CORS, cross_origin
import sqlite3
try:
    from essos.fields import near_axis as Qsc
    essos_found = True
    print("essos.field.near_axis found")
except Exception as e:
    from qsc import Qsc
    essos_found = False
    print(e)
    print("essos.field.near_axis not found, defaulting to qsc.Qsc")
import matplotlib
import matplotlib.pyplot as plt
import io
import base64
import plotly
import plotly.graph_objects as go
import json
import numpy as np
from time import time

# Set the backend to 'Agg' to disable GUI
matplotlib.use("Agg")

app = Flask(__name__)
# Security: Restrict CORS to known origins only
CORS(app, origins=[
    "https://stellarator.physics.wisc.edu",
    "http://localhost:3000",  # Development
    "http://127.0.0.1:3000"   # Development
])


# Security: Add security headers to all responses
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response


nphi = 71

# Connect to SQLite database
def connect_db():
    db_path = os.path.join(os.path.dirname(__file__), "XGStels.db")
    return sqlite3.connect(db_path)  # Path to your SQLite database file  

# Modified API endpoint to support pagination and search
@app.route("/api/configs", methods=["GET"])
@cross_origin()
def get_configs():
    # Get query parameters for pagination and search
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=500, type=int)

    # Security: Enforce pagination bounds to prevent resource exhaustion
    page = max(1, min(page, 10000))  # Page must be between 1 and 10000
    limit = max(1, min(limit, 1000))  # Limit must be between 1 and 1000

    # Existing individual search parameters
    search_rc1 = request.args.get("search_rc1", default="", type=str)
    search_rc2 = request.args.get("search_rc2", default="", type=str)
    search_rc3 = request.args.get("search_rc3", default="", type=str)
    search_zs1 = request.args.get("search_zs1", default="", type=str)
    search_zs2 = request.args.get("search_zs2", default="", type=str)
    search_zs3 = request.args.get("search_zs3", default="", type=str)
    search_nfp = request.args.get("search_nfp", default="", type=str)
    search_etabar = request.args.get("search_etabar", default="", type=str)
    search_B2c = request.args.get("search_B2c", default="", type=str)
    search_p2 = request.args.get("search_p2", default="", type=str)
    search_iota = request.args.get("search_iota", default="", type=str)
    search_beta= request.args.get("search_beta", default="", type=str)
    search_DMerc_times_r2= request.args.get("search_DMerc_times_r2", default="", type=str)
    search_min_L_grad_B= request.args.get("search_min_L_grad_B", default="", type=str)
    search_r_singularity= request.args.get("search_r_singularity", default="", type=str)
    search_B20_variation= request.args.get("search_B20_variation", default="", type=str)
    search_id = request.args.get("search_id", default="", type=str)

    # Range filter parameters (min/max for sliders)
    iota_min = request.args.get("iota_min", default=None, type=float)
    iota_max = request.args.get("iota_max", default=None, type=float)
    beta_min = request.args.get("beta_min", default=None, type=float)
    beta_max = request.args.get("beta_max", default=None, type=float)
    r_singularity_min = request.args.get("r_singularity_min", default=None, type=float)
    r_singularity_max = request.args.get("r_singularity_max", default=None, type=float)
    etabar_min = request.args.get("etabar_min", default=None, type=float)
    etabar_max = request.args.get("etabar_max", default=None, type=float)
    B2c_min = request.args.get("B2c_min", default=None, type=float)
    B2c_max = request.args.get("B2c_max", default=None, type=float)
    rc1_min = request.args.get("rc1_min", default=None, type=float)
    rc1_max = request.args.get("rc1_max", default=None, type=float)
    rc2_min = request.args.get("rc2_min", default=None, type=float)
    rc2_max = request.args.get("rc2_max", default=None, type=float)
    zs1_min = request.args.get("zs1_min", default=None, type=float)
    zs1_max = request.args.get("zs1_max", default=None, type=float)
    zs2_min = request.args.get("zs2_min", default=None, type=float)
    zs2_max = request.args.get("zs2_max", default=None, type=float)

    # Get filter parameters from MUI DataGrid
    filter_value = request.args.get("filter", default="", type=str)
    filter_field = request.args.get("filter_field", default="", type=str)

    offset = (page - 1) * limit

    conn = connect_db()
    cursor = conn.cursor()

    # Base queries
    count_query = "SELECT COUNT(*) FROM XGStels"
    data_query = "SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, iota, beta, DMerc_times_r2, min_L_grad_B, r_singularity, B20_variation FROM XGStels"
    where_clauses = []
    params = []

    # Search by ID (partial matching)
    if search_id:
        where_clauses.append("CAST(id AS TEXT) LIKE ?")
        params.append(f"%{search_id}%")

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
    if search_B2c:
        where_clauses.append("B2c LIKE ?")
        params.append(f"%{search_B2c}%")
    if search_p2:
        where_clauses.append("p2 LIKE ?")
        params.append(f"%{search_p2}%")
    if search_iota:
        where_clauses.append("iota LIKE ?")
        params.append(f"%{search_iota}%")
    if search_beta:
        where_clauses.append("beta LIKE ?")
        params.append(f"%{search_beta}%")
    if search_DMerc_times_r2:
        where_clauses.append("DMerc_times_r2 LIKE ?")
        params.append(f"%{search_DMerc_times_r2}%")
    if search_min_L_grad_B:
        where_clauses.append("min_L_grad_B LIKE ?")
        params.append(f"%{search_min_L_grad_B}%")
    if search_r_singularity:
        where_clauses.append("r_singularity LIKE ?")
        params.append(f"%{search_r_singularity}%")
    if search_B20_variation:
        where_clauses.append("B20_variation LIKE ?")
        params.append(f"%{search_B20_variation}%")

    # Range filters (min/max from sliders)
    if iota_min is not None:
        where_clauses.append("iota >= ?")
        params.append(iota_min)
    if iota_max is not None:
        where_clauses.append("iota <= ?")
        params.append(iota_max)
    if beta_min is not None:
        where_clauses.append("beta >= ?")
        params.append(beta_min)
    if beta_max is not None:
        where_clauses.append("beta <= ?")
        params.append(beta_max)
    if r_singularity_min is not None:
        where_clauses.append("r_singularity >= ?")
        params.append(r_singularity_min)
    if r_singularity_max is not None:
        where_clauses.append("r_singularity <= ?")
        params.append(r_singularity_max)
    if etabar_min is not None:
        where_clauses.append("etabar >= ?")
        params.append(etabar_min)
    if etabar_max is not None:
        where_clauses.append("etabar <= ?")
        params.append(etabar_max)
    if B2c_min is not None:
        where_clauses.append("B2c >= ?")
        params.append(B2c_min)
    if B2c_max is not None:
        where_clauses.append("B2c <= ?")
        params.append(B2c_max)
    if rc1_min is not None:
        where_clauses.append("rc1 >= ?")
        params.append(rc1_min)
    if rc1_max is not None:
        where_clauses.append("rc1 <= ?")
        params.append(rc1_max)
    if rc2_min is not None:
        where_clauses.append("rc2 >= ?")
        params.append(rc2_min)
    if rc2_max is not None:
        where_clauses.append("rc2 <= ?")
        params.append(rc2_max)
    if zs1_min is not None:
        where_clauses.append("zs1 >= ?")
        params.append(zs1_min)
    if zs1_max is not None:
        where_clauses.append("zs1 <= ?")
        params.append(zs1_max)
    if zs2_min is not None:
        where_clauses.append("zs2 >= ?")
        params.append(zs2_min)
    if zs2_max is not None:
        where_clauses.append("zs2 <= ?")
        params.append(zs2_max)

    # Apply the DataGrid filter
    allowed_fields = {"rc1", "rc2", "rc3", "zs1", "zs2", "zs3", "nfp", "etabar", "B2c", "p2", "iota", "beta", "DMerc_times_r2", "min_L_grad_B", "r_singularity", "B20_variation"}
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
                "etabar": row[8],
                "B2c": row[9],
                "p2": row[10],
                "iota": np.abs(row[11]),
                "beta": row[12],
                "DMerc_times_r2": row[13],
                "min_L_grad_B": row[14],
                "r_singularity": row[15],
                "B20_variation": row[16]
            } for row in rows
        ],
        "totalPages": totalPages,
        "count": count
    }
    jsonified_data = jsonify(data)
    return jsonified_data


@app.route("/api/ranges", methods=["GET"])
@cross_origin()
def get_ranges():
    """Get min/max ranges for all numeric parameters (for slider bounds)"""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            MIN(iota), MAX(iota),
            MIN(beta), MAX(beta),
            MIN(r_singularity), MAX(r_singularity),
            MIN(etabar), MAX(etabar),
            MIN(B2c), MAX(B2c),
            MIN(rc1), MAX(rc1),
            MIN(rc2), MAX(rc2),
            MIN(zs1), MAX(zs1),
            MIN(zs2), MAX(zs2)
        FROM XGStels
    """)
    row = cursor.fetchone()
    conn.close()

    return jsonify({
        "iota": {"min": row[0], "max": row[1]},
        "beta": {"min": row[2], "max": row[3]},
        "r_singularity": {"min": row[4], "max": row[5]},
        "etabar": {"min": row[6], "max": row[7]},
        "B2c": {"min": row[8], "max": row[9]},
        "rc1": {"min": row[10], "max": row[11]},
        "rc2": {"min": row[12], "max": row[13]},
        "zs1": {"min": row[14], "max": row[15]},
        "zs2": {"min": row[16], "max": row[17]}
    })


@app.route("/api/scatter", methods=["GET"])
@cross_origin()
def get_scatter_data():
    """Get lightweight data for scatter plots (sampled configs, plottable fields)"""
    # Limit points per NFP for performance (default 2000 per NFP = 10k total max)
    max_per_nfp = request.args.get("limit", default=2000, type=int)
    max_per_nfp = max(100, min(max_per_nfp, 10000))  # Bound between 100-10000

    conn = connect_db()
    cursor = conn.cursor()

    # Group by NFP for easier frontend processing
    result = {1: [], 2: [], 3: [], 4: [], 5: []}

    # Fetch sampled data for each NFP separately for better distribution
    for nfp_val in [1, 2, 3, 4, 5]:
        cursor.execute("""
            SELECT id, nfp, iota, beta, r_singularity, etabar, B2c, rc1, rc2, zs1, zs2
            FROM XGStels
            WHERE nfp = ?
            ORDER BY RANDOM()
            LIMIT ?
        """, (nfp_val, max_per_nfp))

        rows = cursor.fetchall()
        for row in rows:
            config_id, nfp, iota, beta, r_sing, etabar, B2c, rc1, rc2, zs1, zs2 = row
            result[nfp_val].append({
                "id": config_id,
                "iota": abs(iota) if iota else 0,
                "beta": beta or 0,
                "r_singularity": r_sing or 0,
                "etabar": etabar or 0,
                "B2c": B2c or 0,
                "rc1": rc1 or 0,
                "rc2": rc2 or 0,
                "zs1": zs1 or 0,
                "zs2": zs2 or 0
            })

    conn.close()
    return jsonify(result)


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

    if B2c is None:
        return "r1"
    elif (B2c is not None) and (not essos_found):
        return "r3"
    return "r1"  # Default to r1 if detection of B2c fails or using ESSOS

# Modified function to generate plot data for interactive visualization
def generate_plot(stel, config_id):
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
                ntheta = 30  # Poloidal resolution
                nphi_plot = stel.nfp*2*20   # Toroidal resolution
                ntheta_fourier = 20  # Fourier resolution
                mpol = 5  # Number of poloidal modes
                ntor = 5  # Number of toroidal modes
                
                # Get the boundary data
                start_time = time()
                x_2D_plot, y_2D_plot, z_2D_plot, R_2D = stel.get_boundary(
                    r=r, ntheta=ntheta, nphi=nphi_plot, ntheta_fourier=ntheta_fourier,
                    mpol=mpol, ntor=ntor
                )
                print(f"Getting boundary data took {time() - start_time:.2f} seconds")
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
            start_time = time()
            stel.plot_axis(show=False)
            print(f"Plotting axis took {time() - start_time:.2f} seconds")
            
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
        phi1D = np.linspace(0, 2 * np.pi, nphi_plot)
        phi2D, theta2D = np.meshgrid(phi1D, theta1D)
        Bmag = stel.B_mag(r, theta2D, phi2D)
        
        # Plot the surface with coloring based on magnetic field strength
        start_time = time()
        surf = ax.plot_surface(
            x_2D_plot, y_2D_plot, z_2D_plot,
            facecolors=plt.cm.viridis(plt.Normalize()(Bmag)),
            rstride=1, cstride=1, antialiased=False, linewidth=0
        )
        print(f"Plotting the surface took {time() - start_time:.2f} seconds")
        
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
            start_time = time()
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
        print(f"Error generating plot: {e}")  # Log full error server-side
        return {"image": None, "interactive_data": None, "error": "Failed to generate visualization"}
    

def generate_grid_plot(stel):
    order = stel.order
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
            'R0', 'Z0',
            #, 'R0p', 'Z0p', 'R0pp', 'Z0pp',
            # 'R0ppp', 'Z0ppp',
            'curvature', 'torsion', 'sigma', 
            # 'X1c', 'Y1c', 'Y1s',
            'elongation', 'L_grad_B'
        ]
        
        # Add order-specific plots
        if order != 'r1' and (not essos_found):
            plot_names.extend([
                'L_grad_grad_B', 'B20',
                # 'V1', 'V2', 'V3',
                # 'X20', 'X2c', 'X2s', 'Y20', 'Y2c', 'Y2s', 'Z20', 'Z2c', 'Z2s'
            ])
            
        # if order == 'r3':
        #     plot_names.extend(['X3c1', 'Y3c1', 'Y3s1'])
        
        # Special cases with custom data
        special_cases = {
            '1/L_grad_B': stel.inv_L_grad_B,
            # '1/L_grad_grad_B': stel.grad_grad_B_inverse_scale_length_vs_varphi
        }
        
        if order != 'r1' and (not essos_found):
            special_cases['1/L_grad_grad_B']=stel.grad_grad_B_inverse_scale_length_vs_varphi
        
        # Create plots for standard attributes and special cases
        all_plots = [(name, None, name in ['curvature', 'elongation', 'L_grad_B']) for name in plot_names] + \
                [(name, data, name == '1/L_grad_B') for name, data in special_cases.items()]

        for name, data, y0 in all_plots:
            plot = create_individual_plot(name, data=data, y0=y0)
            if plot: individual_plots.append(plot)
        
        # Add singularity radius plot for r2 and r3 orders
        if order != 'r1' and (not essos_found):
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
            "image": None,  # Keep the fallback static image
            "interactive_data": plots_json  # Dictionary of individual plots
        }
        
    except Exception as e:
        print(f"Error creating individual Plotly visualizations: {e}")
        
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
        except Exception as e:
            print(f"Error generating plot: {e}")  # Log full error server-side
            return {"image": None, "interactive_data": None, "error": "Failed to generate visualization"}
        return {"image": img_data, "interactive_data": None}

def get_stel_from_config(config):
    """
    Create a new Qsc instance from a database config row.

    Note: We create a fresh instance per request to ensure thread-safety.
    The previous approach of reusing global instances and mutating them
    caused race conditions under concurrent load.
    """
    _, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, _, _ = config
    order = determine_order(config)
    config_params = {
        "rc": [1, rc1, rc2, rc3],
        "zs": [0, zs1, zs2, zs3],
        "nfp": nfp,
        "etabar": etabar,
        "order": order,
        "nphi": nphi,
    }
    if B2c is not None:
        config_params["B2c"] = B2c
    else:
        config_params["B2c"] = 1
    if p2 is not None:
        config_params["p2"] = p2
    else:
        config_params["p2"] = -1

    start_time = time()
    # Create a fresh Qsc instance for thread-safety
    stel = Qsc(**config_params)
    print(f"Creating Qsc object took {time() - start_time:.2f} seconds")
    return stel

# Update the API endpoint
@app.route("/api/plot/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_api(config_id):
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, axis_length, iota FROM XGStels WHERE id = ?", (config_id,)
    )
    selected_config = cursor.fetchone()
    conn.close()
    if not selected_config:
        return jsonify({"error": "Configuration not found"}), 404

    start_time = time()
    plot_result = generate_plot(get_stel_from_config(selected_config), selected_config)
    print(f"Generating plot took {time() - start_time:.2f} seconds")
    return jsonify({
        "plot_data": plot_result["image"],
        "interactive_data": plot_result["interactive_data"]
    })
@app.route("/api/grid/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_grid_api(config_id):
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, axis_length, iota FROM XGStels WHERE id = ?", (config_id,)
    )
    selected_config = cursor.fetchone()
    conn.close()
    if not selected_config:
        return jsonify({"error": "Configuration not found"}), 404
    start_time = time()
    plot_result = generate_grid_plot(get_stel_from_config(selected_config))
    print(f"Generating grid plot took {time() - start_time:.2f} seconds")
    return jsonify({
        "plot_data": plot_result["image"],
        "interactive_data": plot_result["interactive_data"]
    })

@app.route("/api/download/<int:config_id>", methods=["GET"])
@cross_origin()
def download_config(config_id):
    """Download a single configuration as JSON or CSV"""

    # Get the format from query param (default to JSON)
    file_format = request.args.get("format", "json").lower()

    # Connect to database and fetch the configuration
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT id, rc1, rc2, rc3, zs1, zs2, zs3, nfp, etabar, B2c, p2, 
        iota, beta, DMerc_times_r2, min_L_grad_B, r_singularity, 
        B20_variation FROM XGStels WHEre id = ?""",
        (config_id,)
    )
    row = cursor.fetchone()
    conn.close()

    # If config not found, return error
    if not row:
        return jsonify({"error": "Configuration not found"}), 404
    
    # Column names (must match SELECT order)
    columns = ["id", "rc1", "rc2", "rc3", "zs1", "zs2", "zs3", "nfp",                                            
                "etabar", "B2c", "p2", "iota", "beta", "DMerc_times_r2",                                          
                "min_L_grad_B", "r_singularity", "B20_variation"]

    # Create a dictionary from the row
    config_data = dict(zip(columns, row))

    if file_format == "csv":
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        writer.writerow(config_data)

        # Convert to bytes for download
        mem_file = io.BytesIO()
        mem_file.write(output.getvalue().encode('utf-8'))
        mem_file.seek(0)

        return send_file(
             mem_file,
             mimetype='text/csv',
             as_attachment=True,
             download_name=f'stellarator_config_{config_id}.csv'
        )
    elif file_format == "txt":
        # Create plain text key-value format
        output = io.StringIO()
        for key, value in config_data.items():
            output.write(f"{key}: {value}\n")

        mem_file = io.BytesIO()
        mem_file.write(output.getvalue().encode('utf-8'))
        mem_file.seek(0)

        return send_file(
            mem_file,
            mimetype='text/plain',
            as_attachment=True,
            download_name=f'stellarator_config_{config_id}.txt'
        )
    else:
        # Return JSON as downloadable file
        json_str = json.dumps(config_data, indent=2)
        mem_file = io.BytesIO()
        mem_file.write(json_str.encode('utf-8'))
        mem_file.seek(0)

        return send_file(
            mem_file,
            mimetype='application/json',
            as_attachment=True,
            download_name=f'stellarator_config_{config_id}.json'
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)