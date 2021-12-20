import os
import sqlite3

#import click
import flask
from flask import Flask;



def create_app(test_config = None):
	app = Flask(__name__, instance_relative_config=True)
	app.config.from_mapping(SECRET_KEY = "dev", DATABASE = os.path.join(app.instance_path, "db.sqlite"))

	if (test_config is None):
		app.config.from_pyfile("config.py", silent=True)
	else:
		app.config.from_mapping(test_config)

	try:
		os.makedirs(app.instance_path)
	except OSError:
		pass

	app.teardown_appcontext(close_db)

	@app.route("/")
	def app_main():
		return flask.render_template("main.html")

	@app.route("/data")
	def app_loaddata():
		return flask.jsonify({})

	return app



def get_db():
	if ("db" not in flask.g):
		flask.g.db = sqlite3.connect(flask.current_app.config["DATABASE"], detect_types = sqlite3.PARSE_DECLTYPES)
		flask.g.db.row_factory = sqlite3.Row

	return g.db

def close_db(e = None):
	db = flask.g.pop("db", None)
	if (db is not None):
		db.close()