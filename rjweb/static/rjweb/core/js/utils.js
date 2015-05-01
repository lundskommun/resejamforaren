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

var utils = {
	
		round: function(val, nbrOfDecimals) {
			var exp = Math.pow(10, nbrOfDecimals || 0);
			return Math.round(val * exp) / exp;
		},
		
		log: function(msg) {
			if (window.console) {
				console.log(msg);
			}
		},
		
		/**
		 * Notify user about something, error or success.
		 * @param text {String} The message
		 * @param msgType {String} The message type (affects only the color of the msg)
		 * 		"success"|"error"
		 * @param options {Object}
		 * @returns {jQuery tag}
		 */
		notify: function(text, msgType, options) {
			options = options || {};
			
			options.parent = options.parent || $(".result-box");
			switch(msgType) {
			case "success":
				msgType = "alert-success";
				break;
			case "error":
				msgType = "alert-danger";
				break;
			}
			var msg = $('<div class="alert '+msgType+' alert-dismissable"> <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+text+'</div>');
			msg.css({
				"margin": "0",
				"margin-top": ".5em"
			});
			$(".alert").remove();
			options.parent.before(msg);
			return msg;
		},
		
		getLength: function(arrLatLng) {
			var dist = 0, i;
			for (i=0,len=arrLatLng.length-1; i<len; i++) {
				dist += arrLatLng[i].distanceTo(arrLatLng[i+1]);
			}
			return dist; // in meters
		},
		
		xmlToJson: function(xml) {
			var x2js = new X2JS();
			return x2js.xml_str2json(xml);
		},
		
		project: function(fromEpsg, toEpsg, e, n) {
			fromEpsg = fromEpsg.toUpperCase();
			toEpsg = toEpsg.toUpperCase();
			
			if (fromEpsg === "EPSG:3021") {
				fromEpsg = "+proj=tmerc +lat_0=0 +lon_0=15.8062845294444 +k=1.00000561024+x_0=1500064.274 +y_0=-667.711 +ellps=GRS80 +units=m";
			}
			else if (!proj4.defs[toEpsg]) {
				toEpsg = this.projDefs[toEpsg];
			}
			return proj4(fromEpsg, toEpsg, [e, n]);
			
		},
		
		projDefs: {
			"EPSG:4326": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs",
			"EPSG:3857": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs",
			"EPSG:3008": "+proj=tmerc +lat_0=0 +lon_0=13.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
			"EPSG:3006": "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
			"EPSG:3021": "+proj=tmerc +lat_0=0 +lon_0=15.8062845294444 +k=1.00000561024+x_0=1500064.274 +y_0=-667.711 +ellps=GRS80 +units=m"
		}
};