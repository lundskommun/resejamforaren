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

app.plugin.Plugin_mqDrive = app.Plugin.extend({
	
	name: "Plugin_mqDrive",
	type: "drive",
	copyright: '<a href="//www.mapquestapi.com/">MapQuest, Inc.</a>',
	
	options: {
		style: {
			weight: 5,
			dashArray: "5,15"
		},
		key: config.MapQuestKey
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
				},
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
	        	doReverseGeocode: false,
	        	narrativeType: "none",
	        	locale: "en_GB",
	        	generalize: 5
	        }
		}
		);
		
		var deferred = $.Deferred(),
			self = this,
			url = "http://open.mapquestapi.com/directions/v2/route?key="+this.options.key+"&json="+mqJson+"&inFormat=json";

		$.ajax({
			url: url, //app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
			dataType: "jsonp",
//			jsonp: "driveCallback",
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
				
				var walkTime = 5*60; // 5 min added (walk to and from parking)
                tableData.time = R.time + walkTime;
                tableData.distance = R.distance*1000;
                tableData.costPerTrip = R.distance / 10.0 * config.PriceDriving;
                tableData.costPerYear = tableData.costPerTrip * app.Plugin.options.tripsPerYear;
                tableData.co2PerTrip = R.distance * 0.206 + 0.041;
                tableData.co2PerYear = tableData.co2PerTrip * app.Plugin.options.tripsPerYear;
                tableData.kcalYear = walkTime / 3600 * 345;
                tableData.kgChok = tableData.kcalYear / 5450; // kg per year
				
				var lineDict = {"drive": latLngArr};
				deferred.resolve(lineDict, tableData, self);
			}
		}).fail(onError).always(onComplete);
		
		
		deferred.done(onSuccess);
		onComplete();
		
		
	}
	
});