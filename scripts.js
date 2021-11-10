function random(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(random(Math.ceil(min), Math.floor(max))); }



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
		if (buttons[i].tagName != "BUTTON")
			continue;
		if (buttons[i] === button)
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
			token: "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
		});
}



const REGION_TYPES = ["Country", "State", "County"];

// Get various properties of a region geoJSON object. These should make future refactorings easier
function getRegionFipsCode(region) { return region.properties.fips; }
function getRegionName(region) { return region.properties.name; }
function getRegionType(region) { return region.properties.type; }
function getRegionTypeText(region) { return REGION_TYPES[region.properties.type]; }
function getRegionCases(region) { return randomInt(0, 10000); }
function getRegionDeaths(region) { return randomInt(0, 1000); }
function getRegionVaccinations(region) { return randomInt(0, 10000); }
function getRegionParentFipsCode(region) { return region.properties.parent_fips; }
function getRegionParentName(region) { return region.properties.parent_name; }
function getRegionHasParent(region) { return "parent_fips" in region.properties; }
function getRegionGeoJSON(region) { return region; }



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

function __forAllRegionsInList(list, action, filter = null, notfound = null)
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
		if (!found && notfound)
			notfound();
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
		}
	}
}
function __forAllRegionsInListByProperty(list, getproperty, value, action, notfound = null)
{ __forAllRegionsInList(list, action, (region) => getproperty(region) == value, notfound); }
function __forAllRegionsInListByParentFips(list, fips, action, notfound = null)
{ __forAllRegionsInListByProperty(list, getRegionParentFipsCode, fips, action, notfound); }
function __forAllRegionsInListByParentName(list, name, action, notfound = null)
{ __forAllRegionsInListByProperty(list, getRegionParentName, name, action, notfound); }

// These functions are all used to search for a certain region,
// possibly querying the database and waiting for a response,
// and then perform some action on the found region(s).
// They can't just return the found region,
// because (in future versions) they might need to query the server and wait for a response.
// For now, they just get their data from a hardcoded list.

function forCountry(fips, action, notfound = null) { __forRegionInListByFips(COUNTRIES.features, fips, action, notfound); }
function forCountryByName(name, action, notfound = null) { __forRegionInListByName(COUNTRIES.features, name, action, notfound); }

function forState(fips, action, notfound = null) { __forRegionInListByFips(STATES.features, fips, action, notfound); }
function forStateByName(name, action, notfound = null) { __forRegionInListByName(STATES.features, name, action, notfound); }

function forStateParent(state, action, notfound = null) { forCountryByName(getRegionParentName(state), action, notfound); }

function forAllStates(action, filter = null, notfound = null) { __forAllRegionsInList(STATES.features, action, filter, notfound); }
function forAllStatesInCountry(country, action, notfound = null) { forAllStatesInCountryByName(getRegionName(country), action, notfound); }
function forAllStatesInCountryByFips(fips, action, notfound = null) { __forAllRegionsInListByParentFips(STATES.features, fips, action, notfound); }
function forAllStatesInCountryByName(name, action, notfound = null) { __forAllRegionsInListByParentName(STATES.features, name, action, notfound); }

function forCounty(fips, action, notfound = null) { __forRegionInListByFips(COUNTIES.features, fips, action, notfound); }
function forCountyByName(name, action, notfound = null) { __forRegionInListByName(COUNTIES.features, name, action, notfound); }

function forCountyParent(county, action, notfound = null) { forState(getRegionParentFipsCode(county), action, notfound); }

function forAllCounties(action, filter = null, notfound = null) { __forAllRegionsInList(COUNTIES.features, action, filter, notfound); }
function forAllCountiesInState(state, action, notfound = null) { forAllCountiesInStateByFips(getRegionFipsCode(state), action, notfound); }
function forAllCountiesInStateByFips(fips, action, notfound = null) { __forAllRegionsInListByParentFips(COUNTIES.features, fips, action, notfound); }
function forAllCountiesInStateByName(name, action, notfound = null) { __forAllRegionsInListByParentName(COUNTIES.features, name, action, notfound); }

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

function forAllRegionsInParent(parent, action, notfound = null)
{
	switch (getRegionType(parent))
	{
		case 0:
			forAllStatesInCountry(parent, action, notfound);
			return;
		case 1:
			forAllCountiesInState(parent, action, notfound);
			return;
		case 2:
			if (notfound)
				notfound();
			return;
		default:
			console.warn("Encountered region of unknown type " + getRegionType(parent));
	}
}