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

app.SearchTrip = L.Class.extend({

	initialize: function(map, options) {
		var self = this;
		this.map = map;
		this.sortArr(this.providers, "priority");
	},
	
	sortArr: function(arr, prop) {
		arr.sort(function(a, b) {
			var aVal = a[prop],
				bVal = b[prop];
			if (aVal === bVal) {
				return 0;
			}
			else if (aVal > bVal) {
				return 1;
			}
			else {
				return -1;
			}
		});
	},
	
	_getServiceProviders: function(data) {
		var providers = this.providers,
			i, t, st, s, Plugin, done,
			selectedProviders = $.extend({}, this._serviceTypes); // Store selected transport types
		data.map = this.map;
		for (i=0,len=providers.length; i<len; i++) {
			t = providers[i];
			Plugin = app.plugin[t.name];
		
			if (selectedProviders.hasOwnProperty(t.type) && (!t.condition || t.condition && t.condition(data) === true)) {
				// The plugin is OK to use – select it for use!
				selectedProviders[t.type] = new Plugin;
			}
			
			// Check if we have all required service providers.
			done = true;
			for (s in selectedProviders) {
				if (!selectedProviders[s]) {
					done = false;
					break;
				}
			}
			if (done === true) {
				return selectedProviders; // All required providers found!
			}
		}
		utils.log("Not all required service types found");
		return selectedProviders;
	},
	
	loading: function(show) {
		show = show || false;
		app.mapInst.mapLoading(show);
		if (show === false) {
			this.tableLoading("all", show);
		}
	},
	
	tableLoading: function(type, show) {
		show = show || false;
		
		var td;
		
		// Fetch the spinner's parent (<td>-tag(s))
		if (type==="all") {
			var reqString = "";
			for (var t in this.serviceTypesConfig) {
				var index = this.serviceTypesConfig[t].index;
				reqString += ("td:eq("+index+"),");
			}
			reqString = reqString.substring(0, reqString.length-1);
			td = $("#results-table tr:eq(4)").find(reqString);
		}
		else {
			var index = this.serviceTypesConfig[type].index;
			td = $("#results-table tr:eq(4)").find("td:eq("+(index)+")");			
		}
		
		// -- Show or hide --
		if (show === true) {
			td.each(function() {
				var tag = $(this);
				if (tag.find(".spinner").length === 0) {
					var spinner = new Spinner({
						radius: 7,
						length: 5,
						width: 2
					});
					spinner.spin(tag[0]);
					tag.data("spinner", spinner);
				}
			});
		}
		else {
			td.each(function() {
				var tag = $(this);
				var spinner = tag.data("spinner");
				if (spinner && spinner.el) {
					$(spinner.el).remove();				
					tag.data("spinner", null); // clean up
				}
			});
		}
		
	},
	
	
	search: function(fromLatLng, toLatLng) {
		app.mapInst.clearPaths();
		app.searchInst.clearTable();
		
		this.errors = {}; // reset error messages
		
		app.searchInst.isSearching = true;
		this.loading(true);
		$("#searchButton").button('loading');
		
		var selectedProviders = this._getServiceProviders({
			fromLatLng: fromLatLng,
			toLatLng: toLatLng
		});
		this.nbrRequested = 0;
		for (var type in selectedProviders) {
			this.requestProvider(selectedProviders[type], fromLatLng, toLatLng);
		}
	},
	
	displayResult: function(obj) {
		var tableData = obj.tableData,
			index = this.serviceTypesConfig[obj.type].index,
			keyArr = [], key; // Store the order of the keys (corresponds to table's order).
		for (key in tableData) {
			keyArr.push(key);
		}
		
		$("#results-table").find("tr").each(function(i) {
			if (i===0) return true; // continue
			key = keyArr[i-1];
			$(this).find("td:eq("+index+")").html( tableData[key] || "-" );
		});
		
		// Add hover func for chocolate
		$("#results-table").find("tr:eq(8)").find("td").each(function() {
			$(this).popover("destroy");
			var val = parseFloat($(this).text());
			if (val) {
				$(this).popover({
					trigger: "hover",
					placement: "top",
					html: true,
					container: "body",
					content: '<img src="img/choklad.png"></img><p style="font-size: 1.2em;">Kalorier mätt i choklad per år: '+$(this).text()+'</p>'
				});				
			}
		});
		
		// Add line(s) to the map
		for (var type in obj.lines) {
			app.mapInst.addPath(obj.lines[type]);			
		}
	},
	
	
	// Counter for service requests
	nbrRequested: 0,
	checkRequestDone: function() {
		if (this.nbrRequested === 0) {
			// All services have responded with success
			app.searchInst.isSearching = false;
			this.loading(false);
			$("#searchButton").button('reset');
			$('#searchButton').data("calculate", false).text("Rensa");
		}
	},
	
	prepareTableData: function(tableData) {
		var out = $.extend({}, tableData); // clone object
		
		
		out.time = out.time ? utils.round(out.time / 60, 0) : "-"; // convert from sec into minutes
		out.distance = out.distance ? utils.round(out.distance / 1000, 1) + " km" : "-"; // convert from m to km
		out.costPerTrip = out.costPerTrip ? utils.round(out.costPerTrip, 1) + " kr" : "-";
		out.costPerYear = out.costPerYear ? utils.round(out.costPerYear, 0) + " kr" : "-";
		out.co2PerTrip = out.co2PerTrip !== null ? utils.round(out.co2PerTrip, 2) + " kg" : "-";
		out.co2PerYear = out.co2PerYear !== null ? utils.round(out.co2PerYear, 1) + " kg" : "-";
		out.kcalYear = out.kcalYear ? utils.round(out.kcalYear, 0) + " kcal" : "-";
		out.kgChok = out.kgChok ? utils.round(out.kgChok, 1) + " kg" : "-";
		
		
		if (out.time > 60) {
			var mins = out.time % 60;
			out.time = parseInt(out.time / 60)+" h " + mins + " min";
		}
		else {
			out.time = out.time + " min";
		}
		
		return out;
	},
	
	requestProvider: function(plugin, fromLatLng, toLatLng) {
		var self = this;
		
		this.nbrRequested += 1;
		self.tableLoading(plugin.type, true);
		plugin.calculate(fromLatLng, toLatLng, {
			onSuccess: function(lineDict, tableData, thePlugin) {
				// On success
				
				var latLngArr, theType,
					polyLines = {};
				
				function createLine(_latLngArr, _type) {
					if (!_type) return null;
					
					var pluginStyle = thePlugin.options.styles[_type] || {},
						typeStyle = self.serviceTypesConfig[_type].style;
					var style = $.extend({}, typeStyle, pluginStyle);
					style.smoothFactor = 1.0;
					return L.polyline(_latLngArr, style);
				};
				
				var theLine;
				
				// ---------- Create the polyline(s) ---------------
				for (theType in lineDict) {
					
					latLngArr = lineDict[theType];
					if (!latLngArr.length) {
						continue;
					}
					if (latLngArr[0].length) {
						// This is a 2D-array – we need to make a featuregroup of polylines.
						var _arr = [];
						$.each(latLngArr, function(i, _latLngArr) {
							_arr.push( createLine(_latLngArr, theType) );
						});
						theLine = L.featureGroup(_arr);
					}
					else {
						// This is a 1D-array – we just need to create one polyline.
						theLine = createLine(latLngArr, theType);
					}
					polyLines[theType] = theLine;
				}
				
				// ---------- Prepare table data ---------------
				tableData = self.prepareTableData(tableData);
				tableData.copyright = thePlugin.copyright || "-";
				
				if (!tableData.distance || tableData.distance === "-") {
					// Calculate distance from line(s) instead but add "cirka" before.
					var latLngArr, len = 0;
					for (var theType in lineDict) {
						latLngArr = lineDict[theType];
						if (latLngArr.length && latLngArr[0].length) {
							$.each(latLngArr, function(i, _latLngArr) {
								len += utils.getLength(_latLngArr);
							});
						}
						else {
							len += utils.getLength(latLngArr);						
						}
					}
					tableData.distance = "≈ " + utils.round(len/1000) + " km";
				}
				
				self.displayResult({
					type: thePlugin.type,
					lines: polyLines,
					tableData: tableData
				});
				self.tableLoading(thePlugin.type, false);
				self.nbrRequested -= 1;
				self.checkRequestDone();
			},
			onError: this.onError,
			onComplete: function() {
				self.onComplete();
			}
		});
	},
	
	onError: function(errorCode, msg, plugin) {
		var self = app.searchTripInst;
		
		var type;
		switch(plugin ? plugin.type : "") {
		case "public":
			type = "Kollektivtrafiken";
			break;
		case "walk":
			type = "Gångvägen";
			break;
		case "bike":
			type = "Cykelvägen";
			break;
		case "drive":
			type = "Körvägen med bil";
			break;
		default:
			type = "Närmaste vägen";
		}
		self.errors.messages = self.errors.messages || [];
		self.errors.types = self.errors.types || [];
		self.errors.messages.push(msg);
		self.errors.types.push(type);
		
		self.nbrRequested -= 1;
		self.checkRequestDone();
		self.onComplete();
		
	},
	
	onComplete: function() {
		var self = app.searchTripInst;
		if ($.isEmptyObject(self.errors) === false) {
			var msg = self.errors.types.join(", ") + " kunde inte beräknas: - " + self.errors.messages.join("\n - ");
			utils.log(msg);
			utils.notify(msg, "error");
			self.errors = {};
		}
	},
	
	/**
	 * Configuration of the transportation types:
	 * 	- index (the transport type's index in the table, starting with 0)
	 * 	- style (style of the path drawn on map)
	 *			Note! The style can be overridden by individual plugin's style.
	 */
	serviceTypesConfig: {
		"public": {
			index: 3, // the transport type's index in the table (0,1,2 or 3)
			style: {
				color: "#068AC9",
				weight: 5,
				opacity: .7
			}
		},
		"drive": {
			index: 2,
			style: {
				color: "#D10000",
				weight: 6,
				opacity: .7,
				dashArray: "5,10",
				lineCap: "square",
				lineJoin: "square"
			}
		},
		"bike": {
			index: 1,
			style: {
				color: "#399E00",
				weight: 5,
				opacity: .7
			}
		},
		"walk": {
			index: 0,
			style: {
				color: "#FFC01D",
				weight: 5,
				opacity: .7,
				dashArray: "3,10"
			}
		}
	},
	
	/**
	 * This object defines which provider types to use.
	 * By commenting out some types these will not be
	 * calculated.
	 */
	_serviceTypes: {
		"public": null,
		"drive": null,
		"bike": null,
		"walk": null 
	},
	
	providers: [
	           {
	        	   type: "public",
	        	   name: "Plugin_resrobot",
	        	   priority: 3,
	        	   condition: function(data) {
	        		   return true;
	        	   }
	           },
	           {
	        	   type: "public",
	        	   name: "Plugin_skanetrafiken_lund",
	        	   priority: 1,
	        	   condition: function(data) {
	        		   var	bounds = data.map.getBounds(),
	        		   		pluginExtent = L.latLngBounds(L.latLng([55.31415, 12.42041]), L.latLng([56.58764, 14.60606]));
	        		   if (pluginExtent.contains(data.fromLatLng) && pluginExtent.contains(data.toLatLng)) {
	        			   return true;
	        		   }
        			   return false;
	        	   }
	           },
			   {
	        	   type: "public",
	        	   name: "Plugin_jamtland_lund",
	        	   priority: 2,
	        	   condition: function(data) {
	        		   var	bounds = data.map.getBounds(),
	        		   		pluginExtent = L.latLngBounds(L.latLng([62.601148, 13.178941]), L.latLng([63.770563, 16.079332]));
	        		   if (pluginExtent.contains(data.fromLatLng) && pluginExtent.contains(data.toLatLng)) {
	        			   return true;
	        		   }
        			   return false;
	        	   }
	           },
			   {
	        	   type: "public",
	        	   name: "Plugin_blekingetrafiken_lund",
	        	   priority: 2,
	        	   condition: function(data) {
	        		   var	bounds = data.map.getBounds(),
	        		   		pluginExtent = L.latLngBounds(L.latLng([55.948125, 14.238521]), L.latLng([56.561830, 16.269790]));
	        		   if (pluginExtent.contains(data.fromLatLng) && pluginExtent.contains(data.toLatLng)) {
	        			   return true;
	        		   }
        			   return false;
	        	   }
	           },
               {
	        	   type: "public",
	        	   name: "Plugin_hallandstrafiken_lund",
	        	   priority: 2,
	        	   condition: function(data) {
	        		   var	bounds = data.map.getBounds(),
	        		   		pluginExtent = L.latLngBounds(L.latLng([56.513368, 12.633315]), L.latLng([56.941305, 13.358413]));
	        		   if (pluginExtent.contains(data.fromLatLng) && pluginExtent.contains(data.toLatLng)) {
	        			   return true;
	        		   }
        			   return false;
	        	   }
	           },
	           {
	        	   type: "drive",
	        	   name: "Plugin_mqDrive",
	        	   priority: 1
	           },
	           {
	        	   type: "bike",
	        	   name: "Plugin_mqBike",
	        	   priority: 1
	           },
	           {
	        	   type: "walk",
	        	   name: "Plugin_mqWalk",
	        	   priority: 1
	           }
	],
	
	
	CLASS_NAME: "app.SearchTrip"

});