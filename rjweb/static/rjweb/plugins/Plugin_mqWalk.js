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

app.plugin.Plugin_mqWalk = app.Plugin.extend({
	
	name: "Plugin_mqWalk",
	type: "walk",
	copyright: '<a href="//www.mapquestapi.com/">MapQuest, Inc.</a>',
	
	options: {
		style: {
			weight: 5,
			dashArray: "5,15"
		},
		walkKcalPerHour: 345,
		key: config.MapQuestKey
	},
	
	energyFromTime: function(tableData, sec) {
		var kcalPerHour = this.options.walkKcalPerHour;
		tableData.kcalYear = sec / 60 / 60 * kcalPerHour * app.Plugin.options.tripsPerYear;    //kcal per year
		tableData.kgChok = tableData.kcalYear / 5450; // kg per year
	},
	
	calculate: function(startLatLng, endLatLng, callbacks, options) {
		var onSuccess = callbacks.onSuccess, // required
		// Optional arguments
			onError = callbacks.onError || function() {},
			onComplete = callbacks.onComplete || function() {};
		options = options || {};
		
		var mqJson = JSON.stringify({
			locations: [
	        {
	        	latLng: {
					lat: startLatLng.lat,
					lng: startLatLng.lng
				}
	        },
	        {
	        	latLng: {
	        		lat: endLatLng.lat,
	        		lng: endLatLng.lng
	        	},
	        	type: "s"
	        }],
	        options: {
	        	unit: "k",
	        	routeType: "pedestrian",
	        	doReverseGeocode: false,
	        	narrativeType: "none",
	        	locale: "en_GB",
	        	generalize: 2,
                walkingSpeed: app.Plugin.options.walkSpeed   / 1.6 // 1.6 km per mile
	        }
		});
		
		if (options.walkStraightLine) {
			// Just make a straight line from start to destination
			var walk = [startLatLng, endLatLng];
			var tableData = app.Plugin.getTypeResult();
			tableData.distance = utils.getLength(walk);
			tableData.time = tableData.distance / 1000 / app.Plugin.options.walkSpeed * 60 * 60; // hours -> sec
			this.energyFromTime(tableData, tableData.time);
			deferred.resolve({"walk": walk}, tableData, self);
		}
		else {
			var deferred = $.Deferred(),
				self = this,
				url = "http://open.mapquestapi.com/directions/v2/route?key="+this.options.key+"&json="+mqJson+"&inFormat=json";
			
			$.ajax({
				url: url,
				type: "GET",
				dataType: "jsonp",
				context: this,
				success: function(resp) {
					if (resp.info.statuscode > 0) {
						deferred.reject(1, resp.info.messages);
						return;
					} 
					var R = resp.route;
					var arr = R.shape.shapePoints || [],
						latLngArr = [];
					for (var i=0,len=arr.length; i<len; i+=2) {
						latLngArr.push( L.latLng(arr[i], arr[i+1]) );
					}
					var tableData = app.Plugin.getTypeResult();
					
					tableData.distance = R.distance * 1000;
					tableData.time = (tableData.distance / app.Plugin.options.walkSpeed * 60 * 60)/1000; // convert to seconds							
					tableData.costPerTrip = 0;
					tableData.costPerYear = tableData.costPerTrip * app.Plugin.options.tripsPerYear;
					tableData.co2PerTrip = 0;
					tableData.co2PerYear = 0;
					
					this.energyFromTime(tableData, tableData.time);
					
					var lineDict = {"walk": latLngArr};
					deferred.resolve(lineDict, tableData, self);
				}
			}).fail(onError).always(onComplete);
		}
		deferred.done(onSuccess);
		onComplete();
		return deferred;
	}
	
});