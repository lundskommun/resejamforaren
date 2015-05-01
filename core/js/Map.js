/*
 * Copyright (C) 2013 City of Lund (Lunds kommun)
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

app.Map = L.Class.extend({
    
    layers: [],
    
    initialize: function(options) {
        options = options || {};
        $.extend(true, this, options);
//        this.defineProjs();
        
        // class constructor
    },
    
//    defineProjs: function() {
//      Proj4.defs["EPSG:3021"] = "+proj=tmerc +lat_0=0 +lon_0=15.8062845294444 +k=1.00000561024+x_0=1500064.274 +y_0=-667.711 +ellps=GRS80 +units=m";
////        Proj4.defs["EPSG:3021"] = "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs";
////        Proj4.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
//      Proj4.defs["EPSG:3857"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
//      Proj4.defs["EPSG:900913"] = Proj4.defs["EPSG:3857"];
//      Proj4.defs["GOOGLE"] = Proj4.defs["EPSG:3857"];
//    },
    
    drawMap: function() {
        var mapOptions = {
                zoom: 13,
                minZoom: 3,
                maxZoom: 18,
                layers: [],
                attributionControl: false,
                center: [
//                       66, 18
                    55.7091,
                    13.20102
                ]
        };
        var osmLayer = L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
                minZoom: this.minZoom,
                maxZoom: this.maxZoom
        });
        this.map = L.map('map', mapOptions);
        app.map = this.map;

        var attributionControl = new L.Control.Attribution({
            prefix: false
        });
        attributionControl.addTo(this.map);
        osmLayer.addTo(this.map);
//        this.map.locate({
//            'setView': true,
//            'maxZoom': 13
//        });
        
        return this.map;
    },
    
    setBeginMarker: function (position) {
        var latlng = new L.LatLng(position[0], position[1]);

        var icon = new L.Icon({
            iconUrl: '/img/pin_begin.png',
            shadowUrl: '/img/pin_shadow.png',
            iconAnchor: [6, 26]
        });

        if (this.beginMarker == null) {
            this.beginMarker = new L.Marker(latlng, {
                icon: icon
            });
            this.beginMarker.addTo(this.map);
        } else {
            this.beginMarker.setLatLng(latlng);
        }

        this.clearPaths();
        this.fitContents();
    },

    setEndMarker: function(position) {
        var latlng = new L.LatLng(position[0], position[1]);
        var icon = new L.Icon({
            iconUrl: '/img/pin_end.png',
            shadowUrl: '/img/pin_shadow.png',
            iconAnchor: [
                6,
                26
            ]
        });

        if(this.endMarker == null) {
            this.endMarker = new L.Marker(latlng, {
                icon: icon
            });
            this.endMarker.addTo(this.map);
        } else {
            this.endMarker.setLatLng(latlng);
        }

        this.clearPaths();
        this.fitContents();
    },
    
    pageLoading: function(show) {
        show = show || false;
        
        var self = this;
        
        if (this.pageLoadingInProgress) {
            return false;
        }
        this.pageLoadingInProgress = true;
        
        var bg = $(".loading-bg");
        if (show) {
            if (!bg.length) {
                bg = $('<div class="loading-bg" />');
                $('body').append(bg);
            }
            if (!this.spinnerPage) {
                this.spinnerPage = new Spinner({
                    radius: 30,
                    length: 20,
                    width: 10
                });
                $(this.spinnerPage.el).css("z-index", 2000);
            }
            setTimeout(function() {
                self.spinnerPage.spin($('#map')[0]);
            }, 250);
            
            bg.show();
            setTimeout(function() {
                $(self.spinnerPage.el).addClass("show");
                bg.addClass("show");
                self.pageLoadingInProgress = false;
            }, 10);
        }
        else {
            this.spinnerPage.stop();
            bg.removeClass("show");
            setTimeout(function() {
                self.pageLoadingInProgress = false;
                bg.hide();
            }, 500);
        }
    },
    
    mapLoading: function(show) {
        return false;
//      show = show || false;
//      
//      var self = this;
//      
//      if (this.mapLoadingInProgress) {
//          return false;
//      }
//      this.mapLoadingInProgress = true;
//      
//      var bg = $(".loading-bg");
//      if (show) {
//          if (!bg.length) {
//              bg = $('<div class="loading-bg" />');
//              $('#map').append(bg);           
//          }
//          if (!this.spinner) {
//              this.spinner = new Spinner({
//                  radius: 30,
//                  length: 20,
//                  width: 10
//              });
//              $(this.spinner.el).css("z-index", 2000);
//          }
//          setTimeout(function() {
//              self.spinner.spin($('#map')[0]);
//          }, 250);
//          
//          bg.show();
//          setTimeout(function() {
//              $(self.spinner.el).addClass("show");
//              bg.addClass("show");
//              self.mapLoadingInProgress = false;
//          }, 10);
//      }
//      else {
//          if (this.spinner) {
//              this.spinner.stop();
//              bg.removeClass("show");
//              setTimeout(function() {
//                  self.mapLoadingInProgress = false;
//                  bg.hide();
//              }, 500);                
//          }
//      }
    },

    fitContents: function() {
        var bounds = new L.LatLngBounds();

        if (this.beginMarker != null) {
            bounds.extend(this.beginMarker.getLatLng());
        }

        if (this.endMarker != null) {
            bounds.extend(this.endMarker.getLatLng());
        }

        for (var k = 0; k < this.layers.length; k++) {
            bounds.extend(this.layers[k].getBounds());
        }

        this.map.fitBounds(bounds);
    },

    addPath: function(polyline) {
        this.map.addLayer(polyline);
        this.layers.push(polyline);
    },

    clearPaths: function() {
        var map = this.map; // local declaration to move it into the callbacks scope
        $.each(this.layers, function(i, val) {
            map.removeLayer(val);
        });
    },
    
    clearMarkers: function() {
        if (app.searchInst.markerStart) {
            this.map.removeLayer(app.searchInst.markerStart);
            app.searchInst.markerStart = null;
        }
        if (app.searchInst.markerEnd) {
            this.map.removeLayer(app.searchInst.markerEnd);
            app.searchInst.markerEnd = null;
        }
    },
    
    CLASS_NAME: "app.Map"
});