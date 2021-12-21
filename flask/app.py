import json
import os
import sqlite3

#import click
import flask
from flask import Flask;



STATE_NAMES = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"}



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
	def page_main():
		return flask.render_template("main.html")

	@app.route("/api/counties")
	def api_counties():
		regions = json.load(open("counties.json"))
		
		for region in regions:
			region["name"] = region["county"]
			if (region["state"] in STATE_NAMES):
				region["parent"] = STATE_NAMES[region["state"]]
			else:
				region["parent"] = region["state"]

		return {
			"regions": regions,
			"geo": json.load(open("gz_2010_us_counties.json"))
		}

	@app.route("/api/states")
	def api_states():
		regions = json.load(open("states.json"))

		for region in regions:
			if (region["state"] in STATE_NAMES):
				region["name"] = STATE_NAMES[region["state"]]
			else:
				region["name"] = region["state"]
			region["parent"] = "United States"
		
		return {
			"regions": regions,
			"geo": json.load(open("gz_2010_us_states.json"))
		}

	@app.route("/api/countries")
	def api_countries():
		return {
			"regions": [{
				"fips": 0,
				"name": "United States",
				"level": "country",
				"population": 300000000,
				"actuals": {
					"cases": 3,
					"deaths": 2,
					"vaccinationsCompleted": 1
				},
				"lastUpdatedDate": "2021-12-20"
			}],
			"geo": json.load(open("gz_2010_us_outline.json"))
		}

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