from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS, cross_origin
import sqlite3
from simsopt.mhd import Vmec
import matplotlib
import matplotlib.pyplot as plt
import io, shutil
import os
from vmecPlot2 import main as vmecPlot2_main
import base64
import plotly
import plotly.graph_objects as go
import json
import numpy as np
from time import time
import tempfile
from pdf2image import convert_from_path

# Set the backend to 'Agg' to disable GUI
matplotlib.use("Agg")

app = Flask(__name__)
CORS(app)

def _run_vmec_plots(input_file: str, basename: str, figures_folder: str):
    """
    Calls vmecPlot2.main(...) to write its PDFs into figures_folder,
    then returns a list of full paths to those files.
    """
    # Ensure empty temp folder
    if os.path.exists(figures_folder):
        shutil.rmtree(figures_folder)
    os.makedirs(figures_folder, exist_ok=True)

    # vmecPlot2 will write:
    #   <figures_folder>/<basename>_VMECparams.pdf
    #   <figures_folder>/<basename>_VMECsurfaces.pdf
    vmecPlot2_main(input_file, name=basename, figures_folder=figures_folder, savefig=True)

    files = []
    for suffix in ("_VMECparams.pdf", "_VMECsurfaces.pdf"):
        path = os.path.join(figures_folder, f"{basename}{suffix}")
        if os.path.isfile(path):
            files.append(path)
    return files

nphi = 71
this_path = os.path.dirname(os.path.realpath(__file__))
input_vmec_file = os.path.join(this_path, 'input.nfp2_QA')
stel = Vmec(input_vmec_file, verbose=False)

# Connect to SQLite database
def connect_db():
    return sqlite3.connect("nfp2_combined.db")  # Path to your SQLite database file

# Modified API endpoint to support pagination and search
@app.route("/api/configs", methods=["GET"])
@cross_origin()
def get_configs():
    # Get query parameters for pagination and search
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=500, type=int)

    # Existing individual search parameters
    search_rbc_0_0 = request.args.get("search_rbc_0_0", default="", type=str)
    search_rbc_1_0 = request.args.get("search_rbc_1_0", default="", type=str)
    search_rbc_m1_1 = request.args.get("search_rbc_m1_1", default="", type=str)
    search_rbc_0_1 = request.args.get("search_rbc_0_1", default="", type=str)
    search_rbc_1_1 = request.args.get("search_rbc_1_1", default="", type=str)
    search_zbs_0_0 = request.args.get("search_zbs_0_0", default="", type=str)
    search_zbs_1_0 = request.args.get("search_zbs_1_0", default="", type=str)
    search_zbs_m1_1 = request.args.get("search_zbs_m1_1", default="", type=str)
    search_zbs_0_1 = request.args.get("search_zbs_0_1", default="", type=str)
    search_zbs_1_1 = request.args.get("search_zbs_1_1", default="", type=str)

    search_quasisymmetry = request.args.get("search_quasisymmetry", default="", type=str)
    search_quasiisodynamic = request.args.get("search_quasiisodynamic", default="", type=str)
    search_rotational_transform = request.args.get("search_rotational_transform", default="", type=str)
    search_inverse_aspect_ratio = request.args.get("search_inverse_aspect_ratio", default="", type=str)
    search_mean_local_magnetic_shear= request.args.get("search_mean_local_magnetic_shear", default="", type=str)
    search_vacuum_magnetic_well= request.args.get("search_vacuum_magnetic_well", default="", type=str)
    search_maximum_elongation = request.args.get("search_maximum_elongation ", default="", type=str)
    search_r_mirror_ratio= request.args.get("search_r_mirror_ratio", default="", type=str)
    search_number_of_field_periods_nfp = request.args.get("search_number_of_field_periods_nfp", default="", type=str)
    search_timestamp= request.args.get("search_timestamp", default="", type=str)

    # Get filter parameters from MUI DataGrid
    filter_value = request.args.get("filter", default="", type=str)
    filter_field = request.args.get("filter_field", default="", type=str)

    offset = (page - 1) * limit

    conn = connect_db()
    cursor = conn.cursor()

    # Base queries
    count_query = "SELECT COUNT(*) FROM stellarators_combined"
    data_query = """
    SELECT id, rbc_0_0, rbc_1_0, rbc_m1_1, rbc_0_1, rbc_1_1,
        zbs_0_0, zbs_1_0, zbs_m1_1, zbs_0_1, zbs_1_1,
        quasisymmetry,
        quasiisodynamic,
        rotational_transform,
        inverse_aspect_ratio,
        mean_local_magnetic_shear,
        vacuum_magnetic_well,
        maximum_elongation,
        mirror_ratio,
        number_of_field_periods_nfp,
        timestamp
    FROM stellarators_combined
    """
    where_clauses = []
    where_clauses.append("convergence = 1")
    params = []

    # Existing individual search parameters (AND logic)
    if search_rbc_0_0:
        where_clauses.append("rbc_0_0 LIKE ?")
        params.append(f"%{search_rbc_0_0}%")
    if search_rbc_1_0:
        where_clauses.append("rbc_1_0 LIKE ?")
        params.append(f"%{search_rbc_1_0}%")
    if search_rbc_m1_1:
        where_clauses.append("rbc_m1_1 LIKE ?")
        params.append(f"%{search_rbc_m1_1}%")
    if search_rbc_0_1:
        where_clauses.append("rbc_0_1 LIKE ?")
        params.append(f"%{search_rbc_0_1}%")
    if search_rbc_1_1:
        where_clauses.append("rbc_1_1 LIKE ?")
        params.append(f"%{search_rbc_1_1}%")

    if search_zbs_0_0:
        where_clauses.append("zbs_0_0 LIKE ?")
        params.append(f"%{search_zbs_0_0}%")
    if search_zbs_1_0:
        where_clauses.append("zbs_1_0 LIKE ?")
        params.append(f"%{search_zbs_1_0}%")
    if search_zbs_m1_1:
        where_clauses.append("zbs_m1_1 LIKE ?")
        params.append(f"%{search_zbs_m1_1}%")
    if search_zbs_0_1:
        where_clauses.append("zbs_0_1 LIKE ?")
        params.append(f"%{search_zbs_0_1}%")
    if search_zbs_1_1:
        where_clauses.append("zbs_1_1 LIKE ?")
        params.append(f"%{search_zbs_1_1}%")

    if search_quasisymmetry:
        where_clauses.append("quasisymmetry LIKE ?")
        params.append(f"%{search_quasisymmetry}%")
    if search_quasiisodynamic:
        where_clauses.append("quasiisodynamic LIKE ?")
        params.append(f"%{search_quasiisodynamic}%")
    if search_rotational_transform:
        where_clauses.append("rotational_transform LIKE ?")
        params.append(f"%{search_rotational_transform}%")
    if search_inverse_aspect_ratio:
        where_clauses.append("inverse_aspect_ratio LIKE ?")
        params.append(f"%{search_inverse_aspect_ratio}%")
    if search_mean_local_magnetic_shear:
        where_clauses.append("mean_local_magnetic_shear LIKE ?")
        params.append(f"%{search_mean_local_magnetic_shear}%")
    if search_vacuum_magnetic_well:
        where_clauses.append("vacuum_magnetic_well LIKE ?")
        params.append(f"%{search_vacuum_magnetic_well}%")
    if search_maximum_elongation:
        where_clauses.append("maximum_elongation LIKE ?")
        params.append(f"%{search_maximum_elongation}%")
    if search_r_mirror_ratio:
        where_clauses.append("mirror_ratio LIKE ?")
        params.append(f"%{search_r_mirror_ratio}%")
    if search_number_of_field_periods_nfp:
        where_clauses.append("number_of_field_periods_nfp LIKE ?")
        params.append(f"%{search_number_of_field_periods_nfp}%")
    if search_timestamp:
        where_clauses.append("timestamp LIKE ?")
        params.append(f"%{search_timestamp}%")

    # Apply the DataGrid filter
    allowed_fields = {
        "rbc_0_0",
        "rbc_1_0",
        "rbc_m1_1",
        "rbc_0_1",
        "rbc_1_1",
        "zbs_0_0",
        "zbs_1_0",
        "zbs_m1_1",
        "zbs_0_1",
        "zbs_1_1",
        "quasisymmetry",
        "quasiisodynamic",
        "rotational_transform",
        "inverse_aspect_ratio",
        "mean_local_magnetic_shear",
        "vacuum_magnetic_well",
        "maximum_elongation",
        "mirror_ratio",
        "number_of_field_periods_nfp",
        "timestamp",
    }
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
                "id":                             row[0],
                "rbc_0_0":                       row[1],
                "rbc_1_0":                       row[2],
                "rbc_m1_1":                      row[3],
                "rbc_0_1":                       row[4],
                "rbc_1_1":                       row[5],
                "zbs_0_0":                       row[6],
                "zbs_1_0":                       row[7],
                "zbs_m1_1":                      row[8],
                "zbs_0_1":                       row[9],
                "zbs_1_1":                       row[10],
                "quasisymmetry":                 row[11],
                "quasiisodynamic":               row[12],
                "rotational_transform":          row[13],
                "inverse_aspect_ratio":          row[14],
                "mean_local_magnetic_shear":     row[15],
                "vacuum_magnetic_well":          row[16],
                "maximum_elongation":            row[17],
                "mirror_ratio":                  row[18],
                "number_of_field_periods_nfp":  row[19],
                "timestamp":                     row[20],
        
            } for row in rows
        ],
        "totalPages": totalPages,
        "count": count
    }
    jsonified_data = jsonify(data)
    return jsonified_data

# Function to fetch configurations from the SQLite database
def fetch_configs():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT id, rbc_0_0, rbc_1_0, rbc_m1_1, rbc_0_1, rbc_1_1,
            zbs_0_0, zbs_1_0, zbs_m1_1, zbs_0_1, zbs_1_1,
            quasisymmetry,
            quasiisodynamic,
            rotational_transform,
            inverse_aspect_ratio,
            mean_local_magnetic_shear,
            vacuum_magnetic_well,
            maximum_elongation,
            mirror_ratio,
            number_of_field_periods_nfp,
            timestamp
        FROM stellarators_combined"""
    )
    rows = cursor.fetchall()
    conn.close()
    return rows

# Function to safely access attributes
def get_attr(obj, attr_name, default=None):
    return getattr(obj, attr_name, default)

# Function to determine the order automatically based on available parameters
# def determine_order(config):
#     _, _, _, _, _, _, _, _, _, B2c, p2, _, _ = config  # Ignore extra columns

#     if B2c is None:
#         return "r1"
#     elif (B2c is not None) and (not essos_found):
#         return "r3"
#     return "r1"  # Default to r1 if detection of B2c fails or using ESSOS

# Modified function to generate plot data for interactive visualization
# def generate_plot(stel, config_id):
#     try:
#         # --------------------------------------------------
#         # Instead of using stel.plot(), use get_boundary() to get the 3D boundary data
#         # --------------------------------------------------
#         r = 0.1  # near-axis radius
        
#         # Try different radii if the default fails
#         radii_to_try = [0.1, 0.05, 0.15, 0.2, 0.025]
#         success = False
        
#         for r in radii_to_try:
#             try:
#                 ntheta = 30  # Poloidal resolution
#                 nphi_plot = stel.nfp*2*20   # Toroidal resolution
#                 ntheta_fourier = 20  # Fourier resolution
#                 mpol = 5  # Number of poloidal modes
#                 ntor = 5  # Number of toroidal modes
                
#                 # Get the boundary data
#                 start_time = time()
#                 x_2D_plot, y_2D_plot, z_2D_plot, R_2D = stel.get_boundary(
#                     r=r, ntheta=ntheta, nphi=nphi_plot, ntheta_fourier=ntheta_fourier,
#                     mpol=mpol, ntor=ntor
#                 )
#                 print(f"Getting boundary data took {time() - start_time:.2f} seconds")
#                 success = True
#                 break  # Break out of the loop if successful
#             except ValueError as e:
#                 if "f(a) and f(b) must have different signs" in str(e):
#                     print(f"Failed with radius {r}, trying next value")
#                     continue
#                 else:
#                     raise  # Re-raise if it's a different ValueError
        
#         if not success:
#             # If all radius values fail, fall back to a simpler visualization
#             # Create a simple plot showing the axis
#             fig = plt.figure(figsize=(10, 8))
#             ax = fig.gca()
#             start_time = time()
#             stel.plot_axis(show=False)
#             print(f"Plotting axis took {time() - start_time:.2f} seconds")
            
#             # Generate static image for the fallback visualization
#             buffer = io.BytesIO()
#             fig.savefig(buffer, format="png", bbox_inches='tight', dpi=150)
#             plt.close(fig)
#             buffer.seek(0)
#             img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
#             buffer.close()
            
#             return {
#                 "image": img_data, 
#                 "interactive_data": None,
#                 "error": "Could not generate 3D boundary visualization for this configuration."
#             }
        
#         # Create a regular matplotlib figure for 3D plotting
#         fig = plt.figure(figsize=(10, 8))
#         ax = fig.add_subplot(111, projection='3d')
        
#         # Get the magnetic field strength on the surface for coloring
#         theta1D = np.linspace(0, 2 * np.pi, ntheta)
#         phi1D = np.linspace(0, 2 * np.pi, nphi_plot)
#         phi2D, theta2D = np.meshgrid(phi1D, theta1D)
#         Bmag = stel.B_mag(r, theta2D, phi2D)
        
#         # Plot the surface with coloring based on magnetic field strength
#         start_time = time()
#         surf = ax.plot_surface(
#             x_2D_plot, y_2D_plot, z_2D_plot,
#             facecolors=plt.cm.viridis(plt.Normalize()(Bmag)),
#             rstride=1, cstride=1, antialiased=False, linewidth=0
#         )
#         print(f"Plotting the surface took {time() - start_time:.2f} seconds")
        
#         # Add a colorbar for reference
#         m = plt.cm.ScalarMappable(cmap=plt.cm.viridis, norm=plt.Normalize(vmin=Bmag.min(), vmax=Bmag.max()))
#         m.set_array([])
#         cbar = plt.colorbar(m, ax=ax, shrink=0.7)
#         cbar.set_label('|B| [T]')
        
#         # Set equal aspect ratio for the 3D plot
#         # This is important for the stellarator to look right
#         ax.set_box_aspect([1, 1, 1])
#         ax.set_axis_off()  # Hide the axes
        
#         # Generate static image for fallback
#         buffer = io.BytesIO()
#         fig.savefig(buffer, format="png", bbox_inches='tight', dpi=150)
#         plt.close(fig)  # Close the figure to free memory
#         buffer.seek(0)
#         img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
#         buffer.close()
        
#         # Create Plotly data for interactive visualization
#         try:
#             # Create Plotly figure directly, not converting from matplotlib
#             # which often has issues with 3D plots
#             start_time = time()
#             plotly_fig = {
#                 "data": [{
#                     "type": "surface",
#                     "x": x_2D_plot.tolist(),
#                     "y": y_2D_plot.tolist(),
#                     "z": z_2D_plot.tolist(),
#                     "surfacecolor": Bmag.tolist(),
#                     "colorscale": "Viridis",
#                     "colorbar": {"title": "|B| [T]"},
#                     "showscale": True
#                 }],
#                 "layout": {
#                     "title": f"Stellarator Configuration {config_id}",
#                     "autosize": True,
#                     "scene": {
#                         "xaxis": {"visible": False},
#                         "yaxis": {"visible": False},
#                         "zaxis": {"visible": False},
#                         "aspectmode": "data"
#                     },
#                     "margin": {"l": 0, "r": 0, "b": 0, "t": 30},
#                     "paper_bgcolor": "rgb(240, 240, 240)"
#                 }
#             }
#             plot_json = json.dumps(plotly_fig)
#             return {"image": img_data, "interactive_data": plot_json}
            
#         except Exception as e:
#             print(f"Error creating Plotly visualization: {e}")
#             return {"image": img_data, "interactive_data": None}
        
#     except Exception as e:
#         print(f"Error generating plot: {e}")
#         return {"image": None, "interactive_data": None, "error": str(e)}
    

# def generate_grid_plot(stel):
#     order = stel.order
#     # Create individual Plotly figures (new approach)
#     try:
#         # List to store all individual plots
#         individual_plots = []
#         phi = stel.phi
        
#         # Helper function to create individual plots
#         def create_individual_plot(title, data=None, y0=False):
#             if data is None:
#                 try:
#                     data = getattr(stel, title)
#                 except AttributeError:
#                     print(f"Attribute {title} not found in Qsc object")
#                     return None
            
#             # Create a standalone figure for this diagnostic
#             fig = go.Figure()
#             fig.add_trace(
#                 go.Scatter(
#                     x=phi, 
#                     y=data,
#                     mode="lines",
#                     name=title
#                 )
#             )
            
#             # Customize layout
#             fig.update_layout(
#                 title=f"{title} vs φ",
#                 xaxis_title="φ",
#                 yaxis_title=title,
#                 height=500,
#                 width=700,
#                 template="plotly_white"
#             )
            
#             # Set y-axis limits if needed
#             if y0:
#                 fig.update_yaxes(rangemode="nonnegative")
#             return {
#                 "name": title,
#                 "figure": fig
#             }
        
#         # Create individual plots for all diagnostics
#         plot_names = [
#             'R0', 'Z0',
#             #, 'R0p', 'Z0p', 'R0pp', 'Z0pp',
#             # 'R0ppp', 'Z0ppp',
#             'curvature', 'torsion', 'sigma', 
#             # 'X1c', 'Y1c', 'Y1s',
#             'elongation', 'L_grad_B'
#         ]
        
#         # Add order-specific plots
#         if order != 'r1' and (not essos_found):
#             plot_names.extend([
#                 'L_grad_grad_B', 'B20',
#                 # 'V1', 'V2', 'V3',
#                 # 'X20', 'X2c', 'X2s', 'Y20', 'Y2c', 'Y2s', 'Z20', 'Z2c', 'Z2s'
#             ])
            
#         # if order == 'r3':
#         #     plot_names.extend(['X3c1', 'Y3c1', 'Y3s1'])
        
#         # Special cases with custom data
#         special_cases = {
#             '1/L_grad_B': stel.inv_L_grad_B,
#             # '1/L_grad_grad_B': stel.grad_grad_B_inverse_scale_length_vs_varphi
#         }
        
#         if order != 'r1' and (not essos_found):
#             special_cases['1/L_grad_grad_B']=stel.grad_grad_B_inverse_scale_length_vs_varphi
        
#         # Create plots for standard attributes and special cases
#         all_plots = [(name, None, name in ['curvature', 'elongation', 'L_grad_B']) for name in plot_names] + \
#                 [(name, data, name == '1/L_grad_B') for name, data in special_cases.items()]

#         for name, data, y0 in all_plots:
#             plot = create_individual_plot(name, data=data, y0=y0)
#             if plot: individual_plots.append(plot)
        
#         # Add singularity radius plot for r2 and r3 orders
#         if order != 'r1' and (not essos_found):
#             data = stel.r_singularity_vs_varphi.copy()
#             data[data > 1e20] = np.nan  # Handle large values
#             plot = create_individual_plot('r_singularity', data=data, y0=True)
#             if plot:
#                 individual_plots.append(plot)
        
#         # Convert all figures to JSON
#         plots_json = {}
#         for plot in individual_plots:
#             try:
#                 plots_json[plot["name"]] = json.dumps(
#                     plot["figure"], 
#                     cls=plotly.utils.PlotlyJSONEncoder
#                 )
#             except Exception as e:
#                 print(f"Error serializing {plot['name']}: {e}")
        
#         return {
#             "image": None,  # Keep the fallback static image
#             "interactive_data": plots_json  # Dictionary of individual plots
#         }
        
#     except Exception as e:
#         print(f"Error creating individual Plotly visualizations: {e}")
        
#         try:
#             # Keep the static image for fallback (existing code)
#             fig = plt.figure(figsize=(14, 7))
#             stel.plot(newfigure=False, show=False)
#             buffer = io.BytesIO()
#             fig.savefig(buffer, format="png", bbox_inches='tight', dpi=150)
#             plt.close(fig)
#             buffer.seek(0)
#             img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
#             buffer.close()
#         except Exception as e:
#             print(f"Error generating plot: {e}")
#             return {"image": None, "interactive_data": None, "error": str(e)}
#         return {"image": img_data, "interactive_data": None}

def get_stel_from_config(config, input_vmec_file):
    """
    Build and return a VMEC object with boundary Fourier‐mode DOFs
    set from the passed-in `config` dict.
    """
    # 1) Load the VMEC equilibrium from your chosen template/input file
    stel = Vmec(input_vmec_file, verbose=False)
    surf = stel.boundary

    # 2) Un‐fix all modes, then re‐fix only the major‐radius m=0,n=0 term
    max_mode = 1   # or whatever you need
    surf.fix_all()
    surf.fixed_range(mmin=0, mmax=max_mode, nmin=-max_mode, nmax=max_mode, fixed=False)
    surf.fix("rc(0,0)")

    # 3) Read the current DOFs (for logging/debug)
    dofs = surf.x.copy()
    print(f"Initial DOFs: {dofs}")

    # 4) Build a new DOF array from your config dict
    #    The ordering here must match how VMEC expects [rc,modes..., zbs,modes..., ...]
    new_dofs = np.array([
        config["rbc_0_0"],
        config["rbc_1_0"],
        config["rbc_m1_1"],
        config["rbc_0_1"],
        config["rbc_1_1"],
        config["zbs_0_0"],
        config["zbs_1_0"],
        config["zbs_m1_1"],
        config["zbs_0_1"],
        config["zbs_1_1"],
    ])

    # 5) Overwrite the VMEC boundary DOFs
    surf.x = new_dofs
    print(f"Applied DOFs from config: {surf.x}")

    # 6) (Optional) run VMEC now and check convergence
    start = time()
    try:
        stel.run()
        print(f"VMEC ran in {time() - start:.2f}s and converged.")
    except Exception as err:
        print(f"VMEC failed after {time() - start:.2f}s: {err}")

    return stel

# Update the API endpoint
@app.route("/api/plot/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_api(config_id):

    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT vmec_input_path FROM stellarators_combined WHERE id = ?", (config_id,))
    row = cur.fetchone()
    if not row:
        return jsonify(error="Config not found"), 404
    input_file = row[0]

    # Create a temporary directory for output PDFs
    tmpdir = tempfile.mkdtemp(prefix="vmec_")
    try:
        basename = f"config_{config_id}"
        # Call vmecPlot2 to generate both PDFs
        vmecPlot2_main(input_file, name=basename, figures_folder=tmpdir, savefig=True)

        # Path to the params PDF
        pdf_path = os.path.join(tmpdir, f"{basename}_VMECparams.pdf")
        if not os.path.isfile(pdf_path):
            return jsonify(error="Params PDF not generated"), 500

        # Convert first page to PNG
        pages = convert_from_path(pdf_path, dpi=150, first_page=1, last_page=1)
        buf = io.BytesIO()
        pages[0].save(buf, format='PNG')
        img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        buf.close()

        return jsonify(image=img_b64)
    finally:
        shutil.rmtree(tmpdir)
@app.route("/api/grid/<int:config_id>", methods=["GET"])
@cross_origin()
def get_plot_grid_api(config_id):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT vmec_input_path FROM stellarators_combined WHERE id = ?", (config_id,))
    row = cur.fetchone()
    if not row:
        return jsonify(error="Config not found"), 404
    input_file = row[0]

    # Create a temporary directory for output PDFs
    tmpdir = tempfile.mkdtemp(prefix="vmec_")
    try:
        basename = f"config_{config_id}"
        # Call vmecPlot2 to generate both PDFs
        vmecPlot2_main(input_file, name=basename, figures_folder=tmpdir, savefig=True)

        # Path to the surfaces PDF
        pdf_path = os.path.join(tmpdir, f"{basename}_VMECsurfaces.pdf")
        if not os.path.isfile(pdf_path):
            return jsonify(error="Surfaces PDF not generated"), 500

        # Convert first page to PNG
        pages = convert_from_path(pdf_path, dpi=150, first_page=1, last_page=1)
        buf = io.BytesIO()
        pages[0].save(buf, format='PNG')
        img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        buf.close()

        return jsonify(image=img_b64)
    finally:
        shutil.rmtree(tmpdir)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)