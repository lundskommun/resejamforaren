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
