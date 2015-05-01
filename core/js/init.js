
$(document).ready(function() {
	
	/**
	 * Set options for jquery ajax
	 */
	$.ajaxSetup({timeout: 7000});
	
	app.ws = app.ws[location.host];
	if (!app.ws) {
		console.log("No web services defined for this host (set in in app.js)");
	}
	
	app.mapInst = new app.Map();
	
//	var show = false;
//	$("body").click(function() {
//		show = !show;
//		app.mapInst.mapLoading(show);
//	});
	var map = app.mapInst.drawMap();
	
	app.searchInst = new app.Search(map);
	
	app.geoCoderInst = new app.GeoCoder(map, {});
	
	app.searchTripInst = new app.SearchTrip(map);
	
//	var inst = new app.SearchTrip(map);
//	inst.tableLoading("all", true);
	
//	55.71628170645908
//	lng: 13.227195739746094
	
//	var start = L.latLng([55.71628, 13.22719]),
//		end = L.latLng([55.70312, 13.22307]);
//	
//	var plugin = new app.plugins.plugin_skanetrafiken();
//	plugin.calculate(start, end, function(data) {
//		
//	});
	
});