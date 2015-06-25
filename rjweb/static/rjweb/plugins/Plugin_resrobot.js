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

app.plugin.Plugin_resrobot = app.Plugin.extend({

		name: "Plugin_resrobot",
		type: "public",
		copyright: '<a href="http://www.trafiklab.se/api/resrobot-sok-resa/licens">Trafiklab</a>',
		
		key: config.ResRobotKey,
		
		options: {
			radius: 2000,
			styles: {
				"walk": {
					color: "#0089d1",
					dashArray: "1,10"
				},
				"public": {
					dashArray: "3,20"
				}
			},
			/**
			 * Complementary plugins used for calculating parts of the trip
			 */
			walkStraightLine: true,
			plugins: {
				walk: "Plugin_mqWalk"
			}
		},
		
		getWalk: function(start, end) {
			var pluginInst = new app.plugin[this.options.plugins.walk];
			var deferred = pluginInst.calculate(start, end, {}, {
					walkStraightLine: this.options.walkStraightLine
			});
			return deferred;
		},
		
		getStation: function(latLng) {
			var radius = this.options.radius;
			var url = "https://api.trafiklab.se/samtrafiken/resrobot/StationsInZone?key="+this.key+"&centerX="+latLng.lng+"&centerY="+latLng.lat+"&radius="+radius+"&coordSys=WGS84&apiVersion=2.1",
				deferred = $.Deferred();
			$.ajax({
				url: app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
				type: "GET",
				dataType: "text",
				context: this,
				success: function(resp) {
					resp = utils.xmlToJson(resp);
					if (!resp || !resp.stationsinzoneresult || !resp.stationsinzoneresult.location || !resp.stationsinzoneresult.location.length) {
						deferred.reject(1, "No station found", this);
					}
					var arr = resp.stationsinzoneresult.location || [];
					if (arr.length) {
						var t = arr[0];
						var station = {
							name: t.name,
							id: t._id,
							lng: parseFloat(t._x),
							lat: parseFloat(t._y)
						};
						deferred.resolve(station);
					}
				},
				error: function(a, text, b) {
					deferred.reject(1, "No response", this);
				}
			});
			return deferred;
		},
		
		getRoute: function(startId, endId) {
			//var date = "2014-04-21",
			var time = "08:00";
			var d = new Date();
			var date = d.toISOString();
			date = date.split("T")[0];
			
			var deferred = $.Deferred(),
				self = this,
				url = "https://api.trafiklab.se/samtrafiken/resrobot/Search.json?apiVersion=2.1&fromId="+startId+"&toId="+endId+"&coordSys=WGS84&date="+date+"&time="+time+"&searchType=F&mode1=false&walkSpeed=1.38889&key="+this.key;
			
			$.ajax({
				url: app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
				type: "GET",
				dataType: "json",
				context: this,
				success: function(resp) {
					
					// 1. Create an arr of latLngs.
					
					if (!resp.timetableresult) {
						deferred.reject(1, "Invalid response from resrobot", this);
						return;
					}
					var latLng = null,
						arr = resp.timetableresult.ttitem,
						latLngArr = [],
						tripLength = 0;
	//				$.each(arr, function(i, val) {
					var arrSeg = arr[0].segment;
					
					// Calculate time
					if (!arrSeg.length) {
						deferred.reject(1, "No route was found", this);
						return;
					}
					var dateDeparture = new Date(arrSeg[0].departure.datetime),
						dateArrival = new Date(arrSeg[arrSeg.length-1].arrival.datetime);
					var timeSec = (dateArrival - dateDeparture) / 1000;
					
					// Calculate distance
					var tripLength = 0;
					$.each(arrSeg, function(j, valSeg) {
						if (valSeg.departure.location) {
							latLngArr.push(L.latLng(valSeg.departure.location["@y"], valSeg.departure.location["@x"]));
							latLngArr.push(L.latLng(valSeg.arrival.location["@y"], valSeg.arrival.location["@x"]));
						}
//						tripLength += parseFloat(valSeg.segmentid.distance || 0);
					});
	//				});
					// Append arrival coordinates only at final destination (otherwise we will double-store coordinates).
	//				var valSeg = arr[arr.length-1][arr[arr.length-1].length-1];
	//				latLngArr.push(L.latLng(valSeg.arrival.location["@y"], valSeg.arrival.location["@x"]));
				
					// 2. Create tableData object.
					var tableData = app.Plugin.getTypeResult();
					
					tableData.time = parseInt(timeSec);
					tableData.distance = tripLength;
					
					deferred.resolve(latLngArr, tableData);
				},
				error: function() {
					deferred.reject(1, "Felaktigt svar", this);
				},
				complete: function() {}
			});
			return deferred;
		},
		
		calculate: function(startLatLng, endLatLng, callbacks, options) {
			var onSuccess = callbacks.onSuccess, // required
			// Optional arguments
				onError = callbacks.onError || function() {},
				onComplete = callbacks.onComplete || function() {};
			options = options || {};
			
			var self = this,
				deferred1 = this.getStation(startLatLng),
				deferred2 = this.getStation(endLatLng);
			$.when(deferred1, deferred2).done(function(stationStart, stationEnd) {
				
				// Get route from stationStart to stationEnd
				self.getRoute(stationStart.id, stationEnd.id).fail(onError).always(onComplete)
					.done(function(latLngArr, tableData) {
						var lineDict = {
							"public": latLngArr,
							"walk": []
						};
						
						
						var pubArr = lineDict["public"];
						var firstItem = pubArr[0].length ? pubArr[0][0] : pubArr[0],
							lastItem = pubArr[pubArr.length-1].length ? pubArr[pubArr.length-1][pubArr[pubArr.length-1].length-1] : pubArr[pubArr.length-1];
						/*
                        $.when(
								self.getWalk(startLatLng, firstItem),
								self.getWalk(lastItem, endLatLng))
									.fail(onError).done(function(walk1, walk2) {
										// Update table data with the walk added
										var tData1 = walk1[1],
											tData2 = walk2[1];
										var walkTime = tData1.time + tData2.time;
										tableData.time += walkTime;
										tableData.distance += (tData1.distance + tData2.distance);
										
										lineDict.walk.push(walk1[0].walk);
										lineDict.walk.push(walk2[0].walk);
										onSuccess(lineDict, tableData, self);
										onComplete();
						});
						*/
                        onSuccess(lineDict, tableData, self);
                        onComplete();
					});
			}).fail(onError);
			
		}
		
});