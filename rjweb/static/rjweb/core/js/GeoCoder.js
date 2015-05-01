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

app.GeoCoder = L.Class.extend({

	options: {
		apiKey: config.MapQuestKey,
		bboxPriority: [12.60726, 55.30014, 14.68950, 56.52899],
		bboxRestrict: [12.60726, 55.30014, 14.68950, 56.52899]  // All search results outside this bbox will be discarded
	},

	searchFieldFrom: $("#beginAddress"),
	searchFieldTo: $("#endAddress"),
	
	features: [],
	
	initialize: function(map, options) {
		options = options || {};
		
		this.map = map;
		$.extend(true, this.options, options);
		var bb = this.options.bboxRestrict;
		if (bb) {
			this.options.bboxRestrict = L.latLngBounds(L.latLng(bb[1], bb[0]), L.latLng(bb[3], bb[2]));
		}
	},

	getLocation: function(q, onFound, onFail, onComplete) {
		q = q || "";
		onFail = onFail || function() {};
		onComplete = onComplete || function() {};
		
		var bbox = "";
		if (this.options.bboxPriority) {
			var bb = this.options.bboxPriority;
			bbox = [bb[3], bb[0], bb[1], bb[2]].join(",");
		}
		
		var city = null,
			street = q;
		q = q.split(",");
		if (q.length > 1) {
			street = $.trim(q[0]);
			city = $.trim(q[1]);
		}
		
		
		var url = "http://open.mapquestapi.com/geocoding/v1/address";
		$.ajax({
			url: url, //app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
			context: this,
			data: {
				key: this.options.apiKey,
				street: street,
				county: "Skåne län",
				country: "Sweden",
				city: city || "",
				callback: "callback",
				outFormat: "json",
				maxResults: 10,
				boundingBox: bbox,
				thumbMaps: false
			},
			jsonp: "callback",
			dataType: "jsonp",
			success: function(resp) {
				if (resp.info.statuscode > 0) {
					console.log("An error occurred while locating the address");
				}
				var locations = resp.results[0].locations;
				for (var i=0,len=locations.length; i<len; i++) {
					var latLng = locations[i].latLng;
					latLng = L.latLng(latLng.lat, latLng.lng);
					var bboxRestrict = this.options.bboxRestrict;
					if (bboxRestrict && bboxRestrict.contains(latLng)) {
						onFound( latLng );					
					}					
				}
			},
			error: function(a, text, c) {
				onFail();
			},
			complete: function() {
				onComplete();
			}
		});
	},

	getAddress: function(latLng, onFound, onFail, onComplete) {
		onFail = onFail || function() {};
		onComplete = onComplete || function() {};
		
		var url = "http://open.mapquestapi.com/geocoding/v1/reverse";

		$.ajax({
			url: url,
			data: {
				key: this.options.apiKey,
				callback: "callback",
				location: latLng.lat+","+latLng.lng,
				outputFormat: "json",
				thumbMaps: false
			},
			callback: "callback",
			context: this,
			dataType: "jsonp",
			success: function(resp) {
				if (resp.info.statuscode > 0) {
					onFail();
				}
				var loc = resp.results[0].locations[0];
				var street = loc.street,
					city = loc.adminArea5;
				var streetArr = street.split(" ");
				var nbr = null;

                try {
					nbr = parseInt(streetArr[0]);
					nbr = nbr.toString();
				}
				catch(e) {
					nbr = "";
				}

				if (nbr.length && nbr !== "NaN") {
					var street = [];
					for (var i=1,len=streetArr.length; i<len; i++) {
						street.push(streetArr[i]);
					}
					street = street.join(" ");
					street = street + " " + nbr;
				}

                var finalAddress = "";

                if (street && city) {
                    finalAddress = street + ", " + city;
                } else if (street) {
                    finalAddress = street;
                } else {
                    finalAddress = city;
                }
				onFound(finalAddress);
			},
			error: function(a, text, c) {
				onFail();
			},
			complete: function() {
				onComplete();
				app.mapInst.mapLoading(false);
				
			}
		});
	},

	CLASS_NAME: "app.GeoCoder"

});
		