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

app.plugin.Plugin_skanetrafiken_lund = app.Plugin.extend({
	
		name: "Plugin_skanetrafiken_lund",
		type: "public",
		copyright: '<a href="http://www.labs.skanetrafiken.se">Skånetrafiken</a>',
		
		options: {
			radius: 2000,
			styles: {
				"walk": {
					color: "#0089d1",
					dashArray: "3,10"
				}
			},
			
			/**
			 * Complementary plugins used for calculating parts of the trip
			 */
			walkStraightLine: true,
			walkKcalPerHour: 345,
			plugins: {
				walk: "Plugin_walk"
			}
		},
		
		rtToWgs: function(east, north) {
			return window.proj4("+proj=tmerc +lat_0=0 +lon_0=15.8062845294444 +k=1.00000561024+x_0=1500064.274 +y_0=-667.711 +ellps=GRS80 +units=m", "EPSG:4326", [east, north]);
		},
		
		wgsToRt: function(east, north) {
			return window.proj4("EPSG:4326", "+proj=tmerc +lat_0=0 +lon_0=15.8062845294444 +k=1.00000561024+x_0=1500064.274 +y_0=-667.711 +ellps=GRS80 +units=m", [east, north]);
		},
		
		energyFromTime: function(tableData, sec) {
			var kcalPerHour = this.options.walkKcalPerHour;
			tableData.kcalYear = sec / 60 / 60 * kcalPerHour * app.Plugin.options.tripsPerYear;    //kcal per year
			tableData.kgChok = tableData.kcalYear / 5600; // kg per year
		},
		
		getRoute: function(startLatLng, endLatLng) {
			var self = this,
				deferred = $.Deferred();
			
			var arrRtStart = this.wgsToRt(startLatLng.lng, startLatLng.lat),
				arrRtEnd = this.wgsToRt(endLatLng.lng, endLatLng.lat);
			var url = "http://kartor.lund.se/Skanetrafiken/?fromX="+parseInt(arrRtStart[0])+"&fromY="+parseInt(arrRtStart[1])+"&toX="+parseInt(arrRtEnd[0])+"&toY="+parseInt(arrRtEnd[1]);
			
			$.ajax({
				url: app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
				type: "GET",
				dataType: "text",
				error: function(a, text, c) {
					deferred.reject(1, "Start- och slutpunkt ligger för nära varandra – eller annat fel");
				}
			}).done(function(xml) {
				var resp = utils.xmlToJson(xml);
				var t = resp.Result,
					calcOptions = app.Plugin.options;
				
				var priceYear = parseInt(t.PrisManad) * 12;
				var tableData = {};
				tableData.time = parseFloat(t.Tid) * 60;
				tableData.distance = parseInt(t.Langd);
				tableData.costPerTrip = priceYear / calcOptions.tripsPerYear;
				tableData.costPerYear = priceYear;
				tableData.co2PerTrip = parseFloat(t.CO2.replace(",", "."));
				tableData.co2PerYear = tableData.co2PerTrip * calcOptions.tripsPerYear;

				// Make the lineDict
				var arr = t.JourneyPath.Part,
					t = {},
					type,
					lineDict = {},
					latLngArr,
					doProj = self.rtToWgs;
				for (var i=0,len=arr.length; i<len; i++) {
					latLngArr = [];
					t = arr[i];
					
					
					// Add coordinates to the latLngArr
					var p;
					$.each(t.Coords.Coord, function(i, val) {
						p = doProj(parseInt(val.Y), parseInt(val.X));
						latLngArr.push(L.latLng(p[1], p[0]));
					});
					
					type = t.Line.Name || "";
					if (type.search(/gång/i) > -1) {
						type = "walk";
					}
					else {
						type = "public";
					}
					lineDict[type] = lineDict[type] || [];
					lineDict[type].push(latLngArr);
				}
				
				// Calculate energy and chocolate consumption from the walk path(s)
				var walkArrs = lineDict.walk,
					walkLen = 0;
				$.each(walkArrs, function(i, val) {
					for (var i=0,len=walkArrs.length; i<len; i++) {
						walkLen += utils.getLength( walkArrs[i] );
					}
				});
				var walkSpeedKmH = calcOptions.walkSpeed;
				var walkTimeSec = walkLen / 1000 / walkSpeedKmH * 60 * 60;
				self.energyFromTime(tableData, walkTimeSec);
				
				deferred.resolve(lineDict, tableData);
			});
			return deferred;
		},
		
		getWalk: function(start, end) {
			var pluginInst = new app.plugin[this.options.plugins.walk];
			var deferred = pluginInst.calculate(start, end, {}, {
					walkStraightLine: this.options.walkStraightLine
			});
			return deferred;
		},
		
		calculate: function(startLatLng, endLatLng, callbacks, options) {
			var self = this;
			
			var onSuccess = callbacks.onSuccess, // required
				onError = callbacks.onError || function() {},
				onComplete = callbacks.onComplete || function() {};
			options = options || {};
			
			this.getRoute(startLatLng, endLatLng)
				.fail(onError)
				.done(function(lineDict, tableData) {
					onSuccess(lineDict, tableData, self);
			});
		}
});