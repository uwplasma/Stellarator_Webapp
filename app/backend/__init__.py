from flask import Flask

app = Flask(__name__)

from Website.Stellarator_Webapp.app.backend import routes