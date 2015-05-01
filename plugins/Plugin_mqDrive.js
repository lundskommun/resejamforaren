app.plugin.Plugin_mqDrive = app.Plugin.extend({
	
	name: "Plugin_mqDrive",
	type: "drive",
	copyright: '<a href="//www.mapquestapi.com/">MapQuest, Inc.</a>',
	
	options: {
		style: {
			weight: 5,
			dashArray: "5,15"
		},
		key: "Fmjtd%7Cluu22l01n9%2Caa%3Do5-5ftw1"
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
	        	routeType: "shortest",
	        	doReverseGeocode: false,
	        	narrativeType: "none",
	        	locale: "en_GB",
	        	generalize: 30,
	        	drivingStyle: 2  // 1: cautious, 2: normal, 3: aggressive
	        }
		}
		);
		
		var deferred = $.Deferred(),
			self = this,
			url = "http://www.mapquestapi.com/directions/v2/route?key="+this.options.key+"&json="+mqJson+"&inFormat=json";

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
                tableData.costPerTrip = tableData.distance * 4 / 1000;
                tableData.costPerYear = tableData.costPerTrip * 440;
                tableData.co2PerTrip = tableData.distance/1000 * 0.206 + 0.041; // m->km
                tableData.co2PerYear = 440 * tableData.co2PerTrip;
                tableData.kcalYear = walkTime * 5.83;    //kcal per year
                tableData.kgChok = tableData.kcalYear / 5600; // kg per year
				
				var lineDict = {"drive": latLngArr};
				deferred.resolve(lineDict, tableData, self);
			}
		}).fail(onError).always(onComplete);
		
		
		deferred.done(onSuccess);
		onComplete();
		
		
	}
	
});