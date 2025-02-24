import pandas as pd
import sqlite3

# File paths
csv_file = "XGStels.csv"
db_file = "XGStels.db"
table_name = "XGStels"

# Load CSV into a DataFrame
df = pd.read_csv(csv_file)

# Connect to SQLite database (creates it if it doesn't exist)
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

cursor.execute(f"DROP TABLE IF EXISTS {table_name}")

# Recreate the table with AUTOINCREMENT on id
cursor.execute(f"""
CREATE TABLE {table_name} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rc1 REAL,
    rc2 REAL,
    rc3 REAL,
    zs1 REAL,
    zs2 REAL,
    zs3 REAL,
    nfp INTEGER,
    etabar REAL,
    B2c REAL,
    p2 REAL,
    axis_length REAL,
    iota REAL,
    max_elongation REAL,
    min_L_grad_B REAL,
    min_R0 REAL,
    r_singularity REAL,
    L_grad_grad_B REAL,
    B20_variation REAL,
    beta REAL,
    DMerc_times_r2 REAL
);
""")

# Insert data from CSV into the table
df.to_sql(table_name, conn, if_exists="append", index=False)

# Commit and close
conn.commit()
conn.close()

print(f"Database '{db_file}' created successfully with table '{table_name}'")
