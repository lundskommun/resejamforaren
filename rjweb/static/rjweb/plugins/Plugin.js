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

app.Plugin = L.Class.extend({
	
	name: null, // same as the class name
	type: null,
	copyright: null,
	
	options: {
		styles: {}
	},
	
	initialize: function() {}
	
});

/**
 * Static properties and methods
 */

app.Plugin.options = {
	walkSpeed: 5, // km/h   Affects the calc of energy (kcal)
	bikeSpeed: 18, // km/h
	tripsPerYear: 440 // number of trips per year (incl. return)
};


app.Plugin.getTypeResult = function() {
	return {
		time: null, // seconds
		distance: null, // meters
		costPerTrip: null, // SEK
		costPerYear: null, // SEK
		co2PerTrip: null, // kg
		co2PerYear: null, // kg
		kcalYear: null, // kcal per year
		kgChok: null,  //chocolate per year
		copyright: null
	}
};
app.Plugin.getTypePath = function() {
	return {
		coords: typeof coords !== 'undefined' ? coords : [ ],
		color: typeof color !== 'undefined' ? color : 'black',
		pattern: typeof pattern !== 'undefined' ? pattern : null				
	}
};
