/*
 * Copyright (C) 2015 City of Lund (Lunds kommun)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
	
	var map = app.mapInst.drawMap();
	
	app.searchInst = new app.Search(map);
	
	app.geoCoderInst = new app.GeoCoder(map, {});
	
	app.searchTripInst = new app.SearchTrip(map);

});