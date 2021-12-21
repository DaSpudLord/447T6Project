const MATCH_WHITESPACE = /\s+/; // Regexp that matches whitespace



function random(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(random(Math.ceil(min), Math.floor(max))); }

function toLocaleString(value) { return value ? value.toLocaleString() : "[Unavailable]"; }
function toLocaleRatio(value, max) { return value && max ? Math.round(value / max * 100) : "??"; }



function removeAllChildren(parent)
{
	while (parent.firstChild)
		parent.removeChild(parent.firstChild);
}



const TAB_ACTIVE_CLASS = "tab-active";

function tabClickSelect(button, all_tab_containers_class, target_tab_container_id)
{ return tabClick(button, document.getElementsByClassName(all_tab_containers_class), document.getElementById(target_tab_container_id)); }
function tabClick(button, all_tab_containers, target_tab_container)
{
	if (button.classList.contains(TAB_ACTIVE_CLASS))
		return;

	for (let i = 0; i < all_tab_containers.length; i++)
	{
		if (all_tab_containers[i] === target_tab_container)
			continue;
		all_tab_containers[i].hidden = true;
	}

	let buttons = button.parentElement.children;
	for (let i = 0; i < buttons.length; i++)
	{
		if (buttons[i] === button)
			continue;
		if (buttons[i].tagName != "BUTTON")
			continue;
		buttons[i].classList.remove(TAB_ACTIVE_CLASS);
	}

	button.classList.add(TAB_ACTIVE_CLASS);
	if (target_tab_container !== null)
		target_tab_container.hidden = false;
}



/*
 * Returns an L.tileLayer() of the specified type from Mapbox.
 * This is a convenience method that handles setting all the proper settings for the tiles
 */
function getMapboxTiles(map_type)
{
	return L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{type}/tiles/{z}/{x}/{y}?access_token={token}",
		{
			attribution: "Map data &copy;<a href='https://openstreetmap.org/copyright'>OpenStreetMap</a> contributors, Imagery &copy;<a href='https://www.mapbox.com/'>Mapbox</a>",
			type: map_type,
			tileSize: 512,
			zoomOffset: -1,
			token: "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw", // I'm pretty sure this is the professor's API key... should we get our own?
		});
}



//const REGION_TYPES = ["Country", "State", "County"];
const REGION_TYPES = {
	"country": 0,
	"state": 1,
	"county": 2,
};

// Get various properties of a region geoJSON object. These should make future refactorings easier
function getRegionFipsCode(region) { return region.fips; }
function getRegionShortName(region)
{
	switch (getRegionType(region))
	{
		case 0:
			return region.country;
		case 1:
			return region.state;
		default:
			return null;
	}
}
function getRegionName(region) { return region.name; }
function getRegionType(region) { return REGION_TYPES[region.level]; }
function getRegionTypeText(region) { return region.level.charAt(0).toUpperCase() + region.level.slice(1); }
function getRegionPopulation(region) { return region.population; }
function getRegionCases(region) { return region.actuals.cases; }
function getRegionDeaths(region) { return region.actuals.deaths; }
function getRegionVaccinations(region) { return region.actuals.vaccinationsCompleted; }
function getRegionParentName(region) { return region.parent; }
function getRegionHasParent(region) { return region.level != "country"; }
function getRegionLastUpdated(region) { return region.lastUpdatedDate; }
function getRegionHistory(region) { return []; }
function getRegionGeoJSON(region)// { return region; }
{
	if ("geo" in region)
		return region.geo;
	let geos;// = __getRegionDataForType(getRegionType(region)).geo.features;
	switch (getRegionType(region))
	{
		case 0:
			region.geo = COUNTRIES.geo;
			return region.geo;
		case 1:
			geos = STATES.geo.features;
			break;
		case 2:
			geos = COUNTIES.geo.features;
			break;
		default:
			console.warn("Unknown region type " + getRegionType(region));
			return null;
	}

	for (let i = 0; i < geos.length; i++)
	{
		if (regionMatchesGeo(region, geos[i]))
		{
			region.geo = geos[i]; // cache this result
			if (!("region" in region.geo.properties))
				region.geo.properties.region = region;
			return region.geo;
		}
	}
	return null;
}
function getRegionFromGeoJSON(feature)
{
	if (!("properties" in feature))
		return COUNTRIES.regions[0]; // country
	if ("region" in feature.properties)
		return feature.properties.region;
	let regions;
	if ("county" in feature.properties)
	{
		regions = COUNTIES.regions;
	} else if ("state" in feature)
	{
		regions = STATES.regions;
	} else
	{
		return COUNTRIES.regions[0];
	}

	for (let i = 0; i < regions.length; i++)
	{
		if (regionMatchesGeo(regions[i], feature))
		{
			feature.region = regions[i]; // cache this result
			if (!("geo" in feature.region))
				feature.region.geo = feature;
			return feature.region;
		}
	}
	return null;
}

function getHistoryDate(history) { return "UN/KN/OWN"; }
function getHistoryCases(history) { return randomInt(0, 10000); }
function getHistoryDeaths(history) { return randomInt(0, 1000); }
function getHistoryVaccinations(history) { return randomInt(0, 10000); }

function regionMatchesGeo(region, geo)
{ return getRegionName(region) == geo.properties.NAME || getRegionFipsCode(region) == ("COUNTY" in geo.properties ? geo.properties.STATE + geo.properties.COUNTY : geo.properties.STATE); }



var COUNTRIES = null;
var STATES = null;
var COUNTIES = null;

var COUNTRIES_FETCH = null;
var STATES_FETCH = null;
var COUNTIES_FETCH = null;

function fetchCountriesThen(action)
{
	if (COUNTRIES)
	{
		action(COUNTRIES.regions);
	} else
	{
		if (!COUNTRIES_FETCH)
		{
			let url = window.location + "api/countries";
			console.log("Fetching country data from " + url);
			COUNTRIES_FETCH = window.fetch(url).then(function(response)
			{
				console.log("Received country data.");
				return response.json();
			});
		}
		COUNTRIES_FETCH.then(function(response)
		{
			COUNTRIES = response;
			action(COUNTRIES.regions);
			COUNTRIES_FETCH = null;
		});
	}
}

function fetchStatesThen(action)
{
	if (STATES)
	{
		action(STATES.regions);
	} else
	{
		if (!STATES_FETCH)
		{
			let url = window.location + "api/states";
			console.log("Fetching state data from " + url);
			STATES_FETCH = window.fetch(url).then(function (response) {
				console.log("Received state data.");
				return response.json();
			});
		}

		STATES_FETCH.then(function(response)
		{
			STATES = response;
			action(STATES.regions);
			STATES_FETCH = null;
		});
	}
}

function fetchCountiesThen(action)
{
	if (COUNTIES)
	{
		action(COUNTIES.regions);
	} else
	{
		if (!COUNTIES_FETCH) {
			let url = window.location + "api/counties";
			console.log("Fetching county data from " + url + "...");
			COUNTIES_FETCH = window.fetch(url).then(function (response) {
				console.log("Received county data.");
				return response.json();
			});
		}

		COUNTIES_FETCH.then(function(response)
		{
			COUNTIES = response;
			action(COUNTIES.regions);
			COUNTIES_FETCH = null;
		});
	}
}

function __forRegionInList(list, filter, action, notfound = null)
{
	for (let i = 0; i < list.length; i++)
	{
		if (filter(list[i]))
		{
			action(list[i]);
			return;
		}
	}
	if (notfound)
		notfound();
}
function __forRegionInListByProperty(list, getproperty, value, action, notfound = null)
{ __forRegionInList(list, (region) => getproperty(region) == value, action, notfound); }
function __forRegionInListByFips(list, fips, action, notfound = null)
{ __forRegionInListByProperty(list, getRegionFipsCode, fips, action, notfound); }
function __forRegionInListByName(list, name, action, notfound = null)
{ __forRegionInListByProperty(list, getRegionName, name, action, notfound); }

function __forEachRegionInList(list, action, filter = null, notfound = null, then = null)
{
	if (filter)
	{
		let found = false;
		for (let i = 0; i < list.length; i++)
		{
			if (filter(list[i]))
			{
				action(list[i]);
				found = true;
			}
		}
		if (found)
		{
			if (then)
				then();
		} else if (notfound)
		{
			notfound();
		}
	} else
	{
		if (list.length == 0)
		{
			if (notfound)
				notfound();
		} else
		{
			for (let i = 0; i < list.length; i++)
				action(list[i]);
			if (then)
				then();
		}
	}
}
function __forEachRegionInListByProperty(list, getproperty, value, action, notfound = null, then = null)
{ __forEachRegionInList(list, action, (region) => getproperty(region) == value, notfound, then); }
function __forEachRegionInListByParentName(list, name, action, notfound = null, then = null)
{ __forEachRegionInListByProperty(list, getRegionParentName, name, action, notfound, then); }

// These functions are all used to search for a certain region,
// possibly querying the database and waiting for a response,
// and then perform some action on the found region(s).
// They can't just return the found region,
// because (in future versions) they might need to query the server and wait for a response.
// For now, they just get their data from a hardcoded list.

function forCountry(fips, action, notfound = null)
{ fetchCountriesThen((countries) => __forRegionInListByFips(countries, fips, action, notfound)); }
function forCountryByName(name, action, notfound = null)
{ fetchCountriesThen((countries) => __forRegionInListByName(countries, name, action, notfound)); }

function forAllCountries(action) { fetchCountriesThen(action); }

function forEachCountry(action, filter = null, notfound = null, then = null)
{ fetchCountriesThen((countries) => __forEachRegionInList(countries, action, filter, notfound, then)); }

function forState(fips, action, notfound = null)
{ fetchStatesThen((states) => __forRegionInListByFips(states, fips, action, notfound)); }
function forStateByName(name, action, notfound = null)
{ fetchStatesThen((states) => __forRegionInListByName(states, name, action, notfound)); }

function forStateParent(state, action, notfound = null) { forCountryByName(getRegionParentName(state), action, notfound); }

function forAllStates(action) { fetchStatesThen(action); }

function forEachState(action, filter = null, notfound = null, then = null)
{ fetchStatesThen((states) => __forEachRegionInList(states, action, filter, notfound, then)); }
function forEachStateInCountry(country, action, notfound = null, then = null)
{ fetchStatesThen((states) => __forEachRegionInListByParentName(states, getRegionName(country), action, notfound, then)); }

function forCounty(fips, action, notfound = null)
{ fetchCountiesThen((counties) => __forRegionInListByFips(counties, fips, action, notfound)); }
function forCountyByName(name, action, notfound = null)
{ fetchCountiesThen((counties) => __forRegionInListByName(counties, name, action, notfound)); }

function forCountyParent(county, action, notfound = null) { forStateByName(getRegionParentName(county), action, notfound); }

function forAllCounties(action) { fetchCountiesThen(action); }

function forEachCounty(action, filter = null, notfound = null, then = null)
{ fetchCountiesThen((counties) => __forEachRegionInList(counties, action, filter, notfound, then)); }
function forEachCountyInState(state, action, notfound = null, then = null)
{ fetchCountiesThen((counties) => __forEachRegionInListByParentName(counties, getRegionName(state), action, notfound, then)); }

function forRegion(fips, action, notfound = null)
{ forCountry(fips, action, () => forState(fips, action, () => forCounty(fips, action, notfound))); }
function forRegionByName(name, action, notfound = null)
{ forCountryByName(name, action, () => forStateByName(name, action, () => forCountyByName(name, action, notfound))); }

function forRegionParent(region, action, notfound = null)
{
	switch (getRegionType(region))
	{
		case 0:
			if (notfound)
				notfound();
			return;
		case 1:
			forStateParent(region, action, notfound);
			return;
		case 2:
			forCountyParent(region, action, notfound);
			return;
		default:
			console.warn("Encountered region of unknown type " + getRegionType(region));
	}
}

function forEachRegionInParent(parent, action, notfound = null, then = null)
{
	switch (getRegionType(parent))
	{
		case 0:
			forEachStateInCountry(parent, action, notfound, then);
			return;
		case 1:
			forEachCountyInState(parent, action, notfound, then);
			return;
		case 2:
			if (notfound)
				notfound();
			return;
		default:
			console.warn("Encountered region of unknown type " + getRegionType(parent));
			if (notfound)
				notfound();
	}
}