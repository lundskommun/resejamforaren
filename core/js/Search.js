/**
 * @constructor
 */

app.Search = L.Class.extend({

    searchFieldFrom: $("#beginAddress"),
    searchFieldTo: $("#endAddress"),
    
    features: [],

    initialize: function(map, options) {
        var self = this;
        
        this.map = map;
        
        options = options || {};
        $.extend(true, this, options);
        
        this.addSearchPins();
        if (this.acOptions) {
            this.enableAC();
        }
        
        this.bindEvents();
    },
    
    geolocateOptions: {
        apiKey: "Fmjtd%7Cluu22l01n9%2Caa%3Do5-5ftw1" //"3056090d8be74a20adb39f94338ff9dc"
    },
    
//    processQuery: function(q) {
//      q = $.trim(q);
////        if (q.length <= 1) {
////            return false;
////        }
//      var compsIn = q.split(" "),
//          compsOut = [];
//      
//      // Trim whitespace for all components
//      for (var i=0,len=compsIn.length; i<len; i++) {
//          compsOut.push( $.trim(compsIn[i]) );
//      }
//      var nbr = compsOut[compsOut.length-1],
//          streetName = compsOut.slice(0, compsOut.length-1);
//      try {
//          nbr = parseInt(nbr);
//      }
//      catch(e) {
//          nbr = 1;
//      }
//      var address = streetName + " " + nbr;
//      return address;
//      
//    },
    
    /**
     * @q {String}
     * @latLng {L.LatLng}
     */
//    geolocate: function(q, onSuccess) {
//      if (this.isSearching) {
//          return false;
//      }
//      this.isSearching = true;
//      $('#searchButton, #clearButton').prop("disabled", true);
//      app.mapInst.mapLoading(true);
//      
////        [country=Germany][street=Karlstr.][city=Leinfelden-Echterdingen][zip=70771][housenumber=12]
//      
//      // Make ajax call to geolocate service
//      $.ajax({
//          url: app.ws.proxy + encodeURIComponent("http://beta.geocoding.cloudmade.com/v3/" + this.geolocateOptions.apiKey + "/api/geo.location.search.2?format=json&source=OSM&enc=UTF-8&limit=1&q="+q), // &country=Sweden&locale=se
//          type: "GET",
//          context: this,
//          dataType: "json",
//          success: function(data) {
//              if (data && data.status && data.status.success) {
//                  var arr = data.places || [],
//                      t, p, latLng;
//                  for (var i=0,len=arr.length; i<len; i++) {
//                      t = arr[i];
////                        if (t.country.toUpperCase() === "SWEDEN") {
//                      p = t.position;
//                      latLng = L.latLng([p.lat, p.lon]);
//                      onSuccess(latLng);  
//                      return;
//                  }
//              }
//              utils.log("No matching addresses found");
//          },
//          error: function() {},
//          complete: function() {
//              this.isSearching = false;
//              var ready = this.isReadyForCalc();
//              app.mapInst.mapLoading(false);
//          }
//      });
//    },
    
    geolocate: function(q, onSuccess) {
        if (this.isSearching) {
            return false;
        }
        this.isSearching = true;
        $('#searchButton').prop("disabled", true);
        app.mapInst.mapLoading(true);
        
//      [country=Germany][street=Karlstr.][city=Leinfelden-Echterdingen][zip=70771][housenumber=12]
        
        // Make ajax call to geolocate service
        $.ajax({
            url: app.ws.proxy + encodeURIComponent("http://www.mapquestapi.com/geocoding/v1/address?inFormat=json&key="
                    +this.geolocateOptions.apiKey+"&location="+q+"&callback=renderGeocode&outFormat=json"),
            type: "GET",
            context: this,
            dataType: "json",
            success: function(data) {
                if (data && data.status && data.status.success) {
                    var arr = data.places || [],
                        t, p, latLng;
                    for (var i=0,len=arr.length; i<len; i++) {
                        t = arr[i];
//                      if (t.country.toUpperCase() === "SWEDEN") {
                        p = t.position;
                        latLng = L.latLng([p.lat, p.lon]);
                        onSuccess(latLng);  
                        return;
                    }
                }
                utils.log("No matching addresses found");
            },
            error: function() {},
            complete: function() {
                this.isSearching = false;
                var ready = this.isReadyForCalc();
                app.mapInst.mapLoading(false);
            }
        });
    },
    
    
    /**
     * Bind button click events.
     */
    bindEvents: function() {
        var self = this;
        $("#beginAddress, #endAddress").on("change", function() {
            var entry = $(this);
            var type = entry.attr("id") === "beginAddress" ? "start" : "end", // endAddress
                q = entry.val();
            if (q.length >= 2) {
                // Geolocate address and move marker to new position (if location found)
                app.mapInst.mapLoading(true);
                self.onEntryLoading(entry, true);
                app.geoCoderInst.getLocation(q, function(latLng) {
                    self.clearTable();
                    app.mapInst.clearPaths();
                    
                    self.addMarker(type, latLng);
                    if (self.markerStart && self.markerEnd) {
                        $("#searchButton").data("calculate", true).text("Jämför"); // We are ready to compare now
                        var fg = L.featureGroup([self.markerStart, self.markerEnd]);
                        self.map.fitBounds( fg.getBounds(), {
                            padding: [50, 50]
                        });
                        self.map.invalidateSize();
                    }
                    else if (self.markerStart || self.markerEnd) {
                        var marker = self.markerStart || self.markerEnd;
                        self.map.setView(marker.getLatLng(), 15);
                    }
                }, function() {
                    // on error
                    var marker = type === "start" ? self.markerStart : self.markerEnd;
                    if (marker) {
                        self.map.removeLayer(marker);
                    }
                }, function() {
                    app.mapInst.mapLoading(false);
                    self.onEntryLoading(entry, false);
                });
                
            }
        });
        
        $('#searchButton').data("calculate", true); // Start as caclulate button
        $('#searchButton').on("click", function() {
            var isBtnCalc = $(this).data("calculate");
            if (isBtnCalc) {
                self.calculate();
            }
            else {
                // Clean all
                $(this).data("calculate", true).text("Jämför");
                self.clearAll();
                app.mapInst.clearMarkers();
            }
            return false;
        });
    },
    
    enableAC: function() {
        this.searchFieldFrom.typeahead(this.acOptions);
    },
    
    
    onSearchResult: function(data) {
        utils.log('onSearchResult for ' + data['transportId'] + ': ' + data);

        // Update the results table
        updateSearchResults(data['transportId'], data);

        // First, iterate over all paths
        for (var i = 0; i < data.paths.length; i++) {
            var coords = data.paths[i].coords.map(
                function (coord) {
                    return new L.LatLng(coord.lat, coord.lng);
                }
            );

            var polyLine = new L.Polyline(coords, {
                'color': data.paths[i].color,
                'dashArray': data.paths[i].pattern
            });

            app.mapInst.addPath(polyLine);
        }
    },
    
    clearTable: function() {
        $('#results-table tr:gt(0)').find("td").text("");       
    },
    
    clearSearch: function() {
        this.clearTable();
        $("#beginAddress, #endAddress").val(null);
    },
    
    clearAll: function() {
        if (app.searchInst.isSearching) {
            return false;
        }
        
        $(".alert").remove();
        
        // Clear the map
        app.mapInst.clearPaths();
        
        // Clear the result table (it will be filled with new data)
        app.searchInst.clearSearch();
    },
    
    isReadyForCalc: function() {
        $('#searchButton').prop("disabled", true); // set as disabled from scratch (may change)
        
        if (!this.markerStart || !this.markerEnd) {
            return "marker_not_set";
        }
        else if (this.isSearching) {
            return "is_searching";
        }
        else {
            $('#searchButton').prop("disabled", false); // enable buttons (=ready for calculation)
            return true;
        }
    },
    
    /**
     * Calculate paths. 
     */
    calculate: function() {
        if (app.searchInst.isSearching) {
            return false;
        }
        if (this.markerStart && this.markerEnd) {
            var self = app.searchInst;
            utils.log("Calculating");
            app.searchTripInst.search(this.markerStart.getLatLng(), this.markerEnd.getLatLng());
        }
    },
    
    onSearchButtonClicked: function() {

        // Initiates searches for all transports available
        for (var k = 0; k < transportIds.length; k++) {
            var transportId = transportIds[k];
            utils.log('  working transport id ' + transportId);
            var q = 'transportId=' + transportId + '&beginPosition=' + beginPosition + '&endPosition=' + endPosition;
            SM.increase();
            $.getJSON('/api/search?' + q).done(onSearchResult).always(function() { SM.decrease(); })
        }
    },
    
    onEntryLoading: function(entry, show) {
        if (show === true) {
            if (entry.data("spinner")) {
                return false;
            }
            // Show
            var spinner = new Spinner({
                radius: 5,
                length: 5,
                width: 2
            });
            entry.prop("disabled", true);
            spinner.spin(entry.parent()[0]);
            $(spinner.el).css("z-index", 2000);
            entry.data("spinner", spinner);         
        }
        else {
            // Hide
            var s = entry.data("spinner");
            if (s) {
                s.stop();
                $(s.el).remove();
            }
            entry.data("spinner", null);
            entry.prop("disabled", false);              
        }
    },
    
    onMarkerPositioned: function(marker) {
        var self = this;
        
        app.mapInst.clearPaths();
        this.clearTable();
        $('#searchButton').data("calculate", true).text("Jämför");
        
        var isStartPin = marker.options.icon.options.iconUrl.search(/pin_begin/gi) !== -1;
        var entry = isStartPin ? $("#beginAddress") : $("#endAddress");
        entry.val(" "); // " " instead of null removes watermark text while loading
        this.onEntryLoading(entry, true);
        
        $("#searchButton").button('reset');
        $(".alert").remove();
        this.isSearching = false;
        
        app.geoCoderInst.getAddress(marker.getLatLng(), function(address) {
            // on success
            address = $.trim(address);
            entry.val(address.length ? address : "");
            self.onEntryLoading(entry, false);
        }, function() {}, function() {
            app.mapInst.mapLoading(false);
            self.onEntryLoading(entry, false);
        });
    },
    
    addMarker: function(type, latLng) {
        var iconUrl, marker;
        var self = this;
        
        type = type.toLowerCase();
        
        switch(type) {
        case "start":
            iconUrl = "img/pin_begin.png";
            marker = this.markerStart;
            break;
        case "end":
            iconUrl = "img/pin_end.png";
            marker = this.markerEnd;
            break;
        }
        if (marker) {
            this.map.removeLayer(marker);
            marker = null;
        }
        
        var theIcon = L.icon({
            iconUrl: iconUrl,
            iconRetinaUrl: iconUrl,
            iconSize: [16, 27],
            iconAnchor: [8, 27]
//          popupAnchor: [-3, -76],
//          shadowUrl: 'my-icon-shadow.png',
//          shadowRetinaUrl: 'my-icon-shadow@2x.png',
//          shadowSize: [68, 95],
//          shadowAnchor: [22, 94]
        });
        marker = L.marker(latLng, {icon: theIcon, draggable: true});
        marker.addTo(this.map);
        
        /*
         * Calculate paths on:
         *  - dragend
         *  - addmarker (drag icon from outside)
         *  - press button "Jämför"
         */
        marker.on("dragend", function(e) {
            self.onMarkerPositioned(e.target);
//          self.calculate();
        });
        
        if (type === "start") {
            this.markerStart = marker;
        }
        else if (type === "end") {
            this.markerEnd = marker;
        }
        return marker;
    },
    
    addSearchPins: function() {
        var self = this;
        var imgStart = $("<img id='pinbegin' class='dragpin' src='img/pin_begin.png' />"),
            imgEnd = $("<img id='pinend' class='dragpin' src='img/pin_end.png' />");
        $("#pinbegin-td").append(imgStart);
        $("#pinend-td").append(imgEnd);
        
        imgStart.add(imgEnd).draggable({
            stop: function(e, ui) {
                // Reset pins position after drag
                var imgH = $(this).height(),
                    imgW = $(this).width();
                var pImg = $(this).offset();
                var pMap = $("#map").offset();
                var left = pImg.left - pMap.left + imgW/2,
                    top = pImg.top - pMap.top + imgH;
                var latLng = self.map.containerPointToLatLng([left, top]);
                
                var type = $(this).attr("id") === "pinbegin" ? "start" : "end";
                
                // check if marker is within bounds of map
                if (left > 0 && left <= $("#map").width() && top > 0 && top <= $("#map").height()) {
                    var marker = self.addMarker(type, latLng);
                    self.onMarkerPositioned(marker);
//                  self.calculate();
                }
                $(".dragpin").remove();
                self.addSearchPins();
            }
        });
    },
    
    /**
     * Options API: https://github.com/twitter/typeahead.js
     */
//  acOptions: {
//      remote: 'http://open.mapquestapi.com/nominatim/v1/search?q=%QUERY',
//      cache: true,
//      wildcard: "%QUERY",
//      copyright: '<p>Map data © OpenStreetMap contributors</p><p>Nominatim Search Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>'
//    },
    
    
    CLASS_NAME: "app.Search"

});