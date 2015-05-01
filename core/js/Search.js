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

app.Search = L.Class.extend({

    features: [],

    initialize: function(map, options) {
        var self = this;
        
        this.map = map;
        
        options = options || {};
        $.extend(true, this, options);
        
        this.addSearchPins();

        this.enableAC();

        this.bindEvents();
    },
    
    geolocateOptions: {
        apiKey: config.MapQuestKey
    },

    geolocate: function(q, onSuccess) {
        if (this.isSearching) {
            return false;
        }
        this.isSearching = true;
        $('#searchButton').prop("disabled", true);
        app.mapInst.mapLoading(true);
        
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
        var self = this;

        var bones = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote: config.AddressSearchUrl
        });

        bones.initialize();

        $('#beginAddress').typeahead(
            {
                minLength: 3
            },
            {
                name: 'bones',
                templates: {
                    suggestion: function (x) {
                        return '<p><span class="rj-suggestion-street">' + x.primary + '</span> <span class="rj-suggestion-city">' + x.secondary + '</span></p>';
                    }
                },
                source: bones.ttAdapter()
            }
        );

        $('#beginAddress').on('typeahead:selected', function (evt, suggestion, dataset) {
            $('#beginAddress').typeahead('val', suggestion.primary + ', ' + suggestion.secondary);
            var latLng = new L.LatLng(suggestion.location[0], suggestion.location[1]);
            self.clearTable();
            app.mapInst.clearPaths();
            self.addMarker("start", latLng);
            if (self.markerStart && self.markerEnd) {
                $("#searchButton").data("calculate", true).text("Jämför"); // We are ready to compare now
                var fg = L.featureGroup([self.markerStart, self.markerEnd]);
                self.map.fitBounds(fg.getBounds(), {
                    padding: [50, 50]
                });
                self.map.invalidateSize();
            }
            else if (self.markerStart || self.markerEnd) {
                var marker = self.markerStart || self.markerEnd;
                self.map.setView(marker.getLatLng(), 15);
            }
        });

        $('#endAddress').typeahead(
            {
                minLength: 3
            },
            {
                name: 'bones',
                templates: {
                    suggestion: function (x) {
                        return '<p><span class="rj-suggestion-street">' + x.primary + '</span> <span class="rj-suggestion-city">' + x.secondary + '</span></p>';
                    }
                },
                source: bones.ttAdapter()
            }
        );

        $('#endAddress').on('typeahead:selected', function (evt, suggestion, dataset) {
            $('#endAddress').typeahead('val', suggestion.primary + ', ' + suggestion.secondary);
            var latLng = new L.LatLng(suggestion.location[0], suggestion.location[1]);
            self.clearTable();
            app.mapInst.clearPaths();
            self.addMarker("end", latLng);
            if (self.markerStart && self.markerEnd) {
                $("#searchButton").data("calculate", true).text("Jämför"); // We are ready to compare now
                var fg = L.featureGroup([self.markerStart, self.markerEnd]);
                self.map.fitBounds(fg.getBounds(), {
                    padding: [50, 50]
                });
                self.map.invalidateSize();
            }
            else if (self.markerStart || self.markerEnd) {
                var marker = self.markerStart || self.markerEnd;
                self.map.setView(marker.getLatLng(), 15);
            }
        });

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
                }
                $(".dragpin").remove();
                self.addSearchPins();
            }
        });
    },
    
    CLASS_NAME: "app.Search"
});