class CoreHandler {
	
	// Constructor
	constructor(controller) {
		this.controller = controller;
		
		// Setup modules
		this.modules = {
			'events': new Frame('https://www.hft-stuttgart.de/veranstaltungen#c142', 'calendar-days'),
			'lectures': new Lectures(this),
			'meals': new Frame('/sws/frame.html', 'utensils'),
			'tips': new List(this, 'tips', 'link'),
			'courses': new Courses(this),
			'error': new Error(this),
		};
	}
	
	// URL pattern
	get pattern() {
		return new RegExp('^(' + Object.keys(this.modules).join('|') + ')(?:\/(.+))?\/?$');
	}
	
	// Process request
	async process(request) {
		
		// Load page and module
		const page = request.params[1];
		const module = this.modules[page];
		
		// Process request
		const result = await module.process(request);
		if(result instanceof Response) return result;
		
		// Setup data
		const data = {
			version: this.controller.cacheVersion,
			page: page,
			module: module,
		}
		
		// Setup tabs
		data.tabs = [];
		for(var name in this.modules) {
			this.modules[name].name = name;
			this.modules[name].active = name == page;
			if(data.tabs.length < 4) data.tabs.push(this.modules[name]);
		}
		
		// Remember visitable page
		if(page != 'error') await this.controller.idb.state.put(page, 'page');	
		
		// Render template
		return await this.controller.renderTemplate(page, data);
	}
}