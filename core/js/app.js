var app = {
		
		// Namespace for plugins
		plugin: {},
		
		copyright: 'Implementation by Lantmäteriet, Lunds kommun. Image from <a href="http://en.memory-alpha.org/wiki/Starfleet_insignia">Memory Alpha</a>.',
		
		event: $("<div />"),
		
		ws: {
			"localhost": {
				proxy: "http://localhost/cgi-bin/proxy.py?url="				
			},
			"91.123.201.52": {
				proxy: "http://91.123.201.52/cgi-bin/rj/ws/proxy.py?url=" 
			}
		}
};
