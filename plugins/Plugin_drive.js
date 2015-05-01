app.plugin.Plugin_drive = app.Plugin.extend({
	
	name: "Plugin_drive",
	type: "drive",
	copyright: '<a href="http://cloudmade.com/">Cloudmade</a>',
	
	options: {
		style: {
			weight: 5,
			dashArray: "5,15"
		},
		key: "651bbaa7f5cf4426aa481bdc794cbf4d"
	},
	
	calculate: function(startLatLng, endLatLng, callbacks, options) {
		var onSuccess = callbacks.onSuccess, // required
		// Optional arguments
			onError = callbacks.onError || function() {},
			onComplete = callbacks.onComplete || function() {};
		options = options || {};

		var deferred = $.Deferred(),
			self = this,
			url = "http://routes.cloudmade.com/"+this.options.key+"/api/0.3/" + startLatLng.lat + "," + startLatLng.lng + "," + endLatLng.lat + "," + endLatLng.lng + "/car.js?units=km";

		$.ajax({
			url: app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
			type: "GET",
			dataType: "json",
			context: this,
			success: function(resp) {
				var latLngArr = $.map(resp.route_geometry || [], function(val) {
					return L.latLng(val[0], val[1]);
				});
				var tableData = app.Plugin.getTypeResult();
				
				if (parseInt(resp.status) !== 0) {
					deferred.reject(1, resp.status_message);
					return;
				}
				
				var t = resp.route_summary,
                	walkTime = 5*60; // 5 min added (walk to and from parking)
                tableData.time = Math.round(t.total_time);
                tableData.distance = t.total_distance;
                tableData.costPerTrip = t.total_distance * 4 / 1000;
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