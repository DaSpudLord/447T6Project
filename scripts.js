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