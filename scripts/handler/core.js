class CoreHandler {
	
	// Constructor
	constructor(controller) {
		this.controller = controller;
		
		// Setup time
		this.today = new Date();
		this.today.setHours(0,0,0,0);
		
		// Setup modules
		this.modules = {
			'events': new Frame('https://www.hft-stuttgart.de/veranstaltungen#c142', 'calendar-days'),
			'lectures': new Lectures(this),
			'meals': new Frame('https://sws2.maxmanager.xyz/', 'utensils'),
			'tips': new List(this, 'tips', 'lightbulb'),
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
		
		// Auto refresh
		const checked = await this.controller.idb.state.get('checked');
		if(!checked || new Date() - checked > 15*60*1000) {
			await this.controller.idb.state.put(new Date(), 'checked');
			if(navigator.onLine) await controller.refresh();
		}
		
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