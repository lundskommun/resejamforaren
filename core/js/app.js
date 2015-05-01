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

var app = {
		
		// Namespace for plugins
		plugin: {},
		
		event: $("<div />"),
		
		ws: {
			"localhost": {
				proxy: "http://localhost/cgi-bin/proxy.py?url="				
			},
			"91.123.201.52": {
				proxy: "http://91.123.201.52/cgi-bin/rj/ws/proxy.py?url=" 
			},
            "localhost:63342": {
                proxy: ""
            }
		}
};
