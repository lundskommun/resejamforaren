app.plugin.Plugin_skanetrafiken = app.Plugin.extend({
	
		name: "Plugin_skanetrafiken",
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
			plugins: {
				walk: "Plugin_walk"
			}
		},
		
		getNearestStation: function(e, n) {
			var r = this.options.radius;
			var url = "http://www.labs.skanetrafiken.se/v2.2/neareststation.asp?x="+n+"&y="+e+"&R="+r;
			return $.ajax({
				url: app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
				type: "GET",
				dataType: "text",
				error: function(a, text, c) {
					deferred.reject(1, "Felaktigt svar");
				}
			});
		},
		
		getNearestStations: function(e1, n1, e2, n2) {
			var self = this,
				deferred = $.Deferred();
			
			var jqxhr1 = this.getNearestStation(e1, n1),
				jqxhr2 = this.getNearestStation(e2, n2);
			$.when(jqxhr1, jqxhr2).done(function(done1, done2) {
				var json1 = utils.xmlToJson(done1[0]),
					json2 = utils.xmlToJson(done2[0]);
				
				var obj1 = json1.Envelope.Body.GetNearestStopAreaResponse.GetNearestStopAreaResult,
					obj2 = json2.Envelope.Body.GetNearestStopAreaResponse.GetNearestStopAreaResult;
				
				if (!obj1.NearestStopAreas || !obj2.NearestStopAreas || !obj1.NearestStopAreas.NearestStopArea || !obj2.NearestStopAreas.NearestStopArea) {
					deferred.reject(1, "Hittade ingen station inom 2 km från start- eller slutpunkten", self);
					return;
				}
				
				var startStopAreas = obj1.NearestStopAreas.NearestStopArea;
				var obj1 = startStopAreas instanceof Array ? startStopAreas[0] : startStopAreas;
				var startId = parseInt( obj1.Id );
				
				var endStopAreas = obj2.NearestStopAreas.NearestStopArea;
				var obj2 = endStopAreas instanceof Array ? endStopAreas[0] : endStopAreas;
				var endId = parseInt( obj2.Id );
				
//				// Debug
//				for (var i=0,len=endStopAreas.length; i<len; i++) {
//					var o = endStopAreas[i];
//					var p = utils.project("EPSG:3021", "EPSG:4326", o.Y, o.X);
//					var marker = L.marker([p[1], p[0]]);
//					app.map.addLayer(marker);
//				}
				// Debug end
				
				var startLatLngArr = utils.project("EPSG:3021", "EPSG:4326", obj1.Y, obj1.X),
					endLatLngArr = utils.project("EPSG:3021", "EPSG:4326", obj2.Y, obj2.X);
				
				var startStation = {
						lat: startLatLngArr[1],
						lng: startLatLngArr[0],
						id: startId
					},
					endStation = {
						lat: endLatLngArr[1],
						lng: endLatLngArr[0],
						id: endId
				};
				deferred.resolve(startStation, endStation);
			});
			return deferred;
		},
		
		getResult: function(startId, endId) {
			var self = this,
				deferred = $.Deferred();
			
//			var date = new Date();
//			var month = date.getMonth() + 1;
//			month = month < 10 ? "0"+month : month;
//			var day = date.getDate() + 1;
//			day = day < 10 ? "0"+day : day;
//			var dateString = date.getFullYear() + "-" + month + "-" + day;
			
			var url = "http://www.labs.skanetrafiken.se/v2.2/resultspage.asp?cmdaction=previous&selPointFr=0|"+startId+"|0&selPointTo=0|"+endId+"|0&NoOf=1&FirstStart=2013-12-02%208:00";
			$.ajax({
				url: app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
				type: "GET",
				dataType: "text",
				error: function(a, text, c) {
					deferred.reject(1, "Felaktigt svar");
				}
			}).done(function(xml) {
				var data = utils.xmlToJson(xml);
				var journeyResult = data.Envelope.Body.GetJourneyResponse.GetJourneyResult;
				var journeyKey = journeyResult.JourneyResultKey,
					j = journeyResult.Journeys.Journey || {};
				
				var calcOptions = app.Plugin.options;
				
				var distM = parseInt(j.Distance || 0);
				var startDate = new Date(j.DepDateTime),
					endDate = new Date(j.ArrDateTime);
				var timeSec = (endDate - startDate) / 1000; // ms to s
				
				var costPerMonth = parseFloat( j.Prices.PriceInfo[6].Price ); // 6 -> cost of monthly card
				var costPerTrip = costPerMonth * 12 / calcOptions.tripsPerYear;
				
				var dataOut = {
						time: timeSec, 
						distance: distM, // meters
						costPerTrip: costPerTrip, // SEK
						costPerYear: costPerMonth * 12, // SEK
						co2PerTrip: j.CO2value, // kg
						co2PerYear: j.CO2value * calcOptions.tripsPerYear, // kg
						kcalAr: null,
						kcalChok: null
				}
				
				deferred.resolve(journeyKey, j.SequenceNo, dataOut);
			});
			return deferred;
		},
		
		rtToWgs: function(east, north) {
			return proj4("+proj=tmerc +lat_0=0 +lon_0=15.8062845294444 +k=1.00000561024+x_0=1500064.274 +y_0=-667.711 +ellps=GRS80 +units=m", "EPSG:4326", [east, north]);
		},
		
		/**
		 * This method is a very hacky way of parsing the xml.
		 * It is used because I could not manage to parse the XML
		 * with either $.parseXml or utils.xmlToJson (according to
		 * some validation sites the xml is invalid).
		 * One note – xmlToJson works but cuts the line in half.
		 * 
		 * The function also converts each coordinate from rt90 to wgs84.
		 */
		extractCoordsFromXml: function(xml) {
			var lineDict = {
					"walk": [],
					"public": []
			};
			if (!xml || !xml.length) {
				return lineDict;
			}
			var coordsArr = xml.split(/<Coords>/g),
				coordsSeg,
				coords, coordsWgs,
				project = utils.project,
				transpType,
				xSeg,
				yArr,
				ySeg,
				arrRt, xRt, yRt,
				arrWgs,
				marker,
				outArr,
				shouldBeWalk = false;
			for (var i=0,len=coordsArr.length; i<len; i++) {
				outArr = [];
				coordsSegOrg = coordsArr[i];
				coordsSeg = coordsSegOrg.substring(0, coordsSegOrg.search(/<\/Coords>/g) || coordsSegOrg.length-1);
				
				if (shouldBeWalk === true) {
					transpType = "walk";
				}
				else {
					transpType = "public";
				}
				
				// Decide for next loop – beautiful hack, indeed maybe.
				if (coordsSegOrg.toUpperCase().indexOf("<NAME>GÅNG</NAME>") > -1) {
					shouldBeWalk = true;
				}
				else {
					shouldBeWalk = false;
				}
				
				xArr = coordsSeg.split("<X>");
				for (var j=0,jlen=xArr.length; j<jlen; j++) {
					xSeg = xArr[j];
					yArr = xSeg.split("<Y>");
					xRt = parseInt(xSeg.substring(0, xSeg.search("</X>")));
					yRt = parseInt(xSeg.substring(xSeg.search("<Y>")+3, xSeg.search("</Y>")));
					if (!xRt || !yRt) {
						continue;
					}
					arrWgs = this.rtToWgs(yRt, xRt);
					outArr.push( L.latLng([arrWgs[1], arrWgs[0]]) );
				}
				if (outArr.length) {
					lineDict[transpType].push(outArr);					
				}
			}
			
			return lineDict;
		},
		
		getRoute: function(journeyKey, cid) {
			var self = this,
				deferred = $.Deferred();
			var url = "http://www.labs.skanetrafiken.se/v2.2/journeypath.asp?cf="+journeyKey+"&id="+cid;
			
			$.ajax({
				url: app.ws.proxy ? app.ws.proxy + encodeURIComponent(url) : url,
				type: "GET",
				dataType: "text",
				error: function(a, text, c) {
					deferred.reject(1, "Felaktigt svar");
				}
			}).done(function(xml) {
				var data = utils.xmlToJson(xml);
				var xmlResult = data.Envelope.Body.GetJourneyPathResponse.GetJourneyPathResult.ResultXML;
				var lineDict = self.extractCoordsFromXml(xmlResult);
				deferred.resolve(lineDict);
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
			var onSuccess = callbacks.onSuccess, // required
			// Optional arguments
				onError = callbacks.onError || function() {},
				onComplete = callbacks.onComplete || function() {};
			options = options || {};
			
			var self = this;
			
			/**
			 * 1. Get nearest station within 1000 m from:
			 * 		a) starting point
			 * 		b) destination point
			 */
			
			var start3021 = utils.project("EPSG:4326", "EPSG:3021", startLatLng.lng, startLatLng.lat),
				end3021 = utils.project("EPSG:4326", "EPSG:3021", endLatLng.lng, endLatLng.lat);
			
			this.getNearestStations( parseInt(start3021[0]), parseInt(start3021[1]), parseInt(end3021[0]), parseInt(end3021[1]))
				.fail(onError)
				.done(function(startStation, endStation) {
					/**
					 * 2. Get journeyKey and id for one trip result between these place ids.
					 */
					self.getResult(startStation.id, endStation.id)
						.fail(onError)
						.done(function(journeyKey, cid, dataOut) {
							var tableData = app.Plugin.getTypeResult(); // The final result returned at the end
							$.extend(tableData, dataOut);
							/**
							 * 3 a) Get the route from start station to end station.
							 * 3 b) Get the walk from start –> departure station and arrival station -> destination.
							 */
							self.getRoute(journeyKey, cid)
								.fail(onError)
								.done(function(lineDict) {
									onSuccess(lineDict, tableData, self);
									
//									var latLngArr = [], latLng,
//										startLatLng = L.latLng([startStation.lat, startStation.lng]),
//										endLatLng = L.latLng([endStation.lat, endStation.lng]);
//									for (var i=0,len=_latLngArr.length; i<len; i++) {
//										latLng = _latLngArr[i];
//									}
									
//									var latLngArrWalk1 = [L.latLng(startLatLng.lat, startLatLng.lng), latLngArr[0]],
//										latLngArrWalk2 = [latLngArr[latLngArr.length-1], L.latLng(endLatLng.lat, endLatLng.lng)];
									
									
									var pubArr = lineDict["public"];
									var firstItem = pubArr[0].length ? pubArr[0][0] : pubArr[0],
										lastItem = pubArr[pubArr.length-1].length ? pubArr[pubArr.length-1][pubArr[pubArr.length-1].length-1] : pubArr[pubArr.length-1];
									$.when(self.getWalk(startLatLng, firstItem),
											self.getWalk(lastItem, endLatLng))
												.fail(onError)
												.done(function(walk1, walk2) {
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
							});
					});
					
			});
		}
});