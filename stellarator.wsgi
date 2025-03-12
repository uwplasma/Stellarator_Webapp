import sys
sys.path.insert(0, '/opt/stellarator_venv/lib/python3.11/site-packages')
sys.path.insert(0, '/opt/stellarator_webapp')

from app.backend import app as application
