class Controller {
	
	// IDB table definition
	get tables() {
		return {
			lectures: { autoIncrement: true },
			tips: { autoIncrement: true },
			subjects: { autoIncrement: true },
			server: {},
		};
	}
	
	// Cache definition
	get cachedFiles() {
		return [
			'/hft-app-client/fontawesome/css/fontawesome.min.css',
			'/hft-app-client/fontawesome/css/solid.min.css',
			'/hft-app-client/fontawesome/css/regular.min.css',
			'/hft-app-client/fontawesome/webfonts/fa-solid-900.ttf',
			'/hft-app-client/fontawesome/webfonts/fa-solid-900.woff2',
			'/hft-app-client/fontawesome/webfonts/fa-regular-400.ttf',
			'/hft-app-client/fontawesome/webfonts/fa-regular-400.woff2',
			
			'/hft-app-client/scripts/client/courses.js',
			'/hft-app-client/scripts/client/lu.min.js',
			'/hft-app-client/scripts/client/shell.js',
			
			'/hft-app-client/styles/main.css',
			
			'/hft-app-client/expressions/de.json',
			
			'/hft-app-client/templates/_courses.html',
			'/hft-app-client/templates/_events.html',
			'/hft-app-client/templates/_lectures.html',
			'/hft-app-client/templates/_meals.html',
			'/hft-app-client/templates/_tips.html',
			'/hft-app-client/templates/_error.html',
			'/hft-app-client/templates/shell.html',
			
			'/launcher/meta.html',
		];
	}
	
	// Errors (internal error pages)
	get errors() {
		return {
			offline: {
				title: 'Keine Verbindung',
				info: 'Diese Funktion ist nur online verfügbar.'
			},
			invalidResponse: {
				title: 'Serverfehler',
				info: 'Ungültige Antwort erhalten.'
			},
		}
	}
	
	// Constructor
	constructor(version) {
		this.cacheVersion = version;
		this.server = '/hft-app-server/';
		this.client = '/hft-app-client/';
		
		// Setup handlers
		this.requestHandlers = [
			new HomeHandler(this),
			new CoreHandler(this),
		];
	
		// Connect to DB
		this.idb = new IDB(this.tables);
	}
	
	// Render template
	async renderTemplate(page, data) {
		const content = await this.fetch(this.client+'templates/_'+page+'.html').then(response => response.text());
		const shell = await this.fetch(this.client+'templates/shell.html').then(response => response.text());
		const meta = await this.fetch('/launcher/meta.html').then(response => response.text());
		const cooked = shell.replace('{{>content}}', content).replace('{{>meta}}', meta);
		
		// Render html
		return Elements.render(cooked, data);
	}
	
	// Exception handler
	async exceptionHandler(exception) {
		console.log('internal exception:', exception);
		
		const error = this.errors[exception];
		if(!error) throw exception;
		return Response.redirect('/error/'+exception);
	}
	
	// Response filter
	async responseFilter(response) {
		
		// Return native response
		if(response instanceof Response) return response;
		
		// Return html wrapped in response
		if(response) {
			const language = await this.fetch(this.client+'expressions/de.json').then(response => response.json());
			const translated = new Elements({open: '[[', close: ']]'}).render(response, language);
			return this.wrap(translated);
		}
		
		// Return error
		return Response.error();
	}
	
	// Refresh data
	async refresh() {
		
		// Perform request
		var payload = new FormData();
		var enrollments = await this.idb.server.get('enrollments') || [];
		payload.append('enrollments', JSON.stringify(enrollments));
		const result = await this.query(payload);
		
		// Clear all tables but server
		for(let name in this.tables) {
			if(name == 'server') continue;
			await this.idb[name].clear();
			
			// Refill tables
			if(result[name]) for(let object of result[name]) {
				
				// Cast date objects
				for(let index in object) if((
					(name == 'lectures' && index == 'start') ||
					(name == 'lectures' && index == 'end')
				) && object[index]) object[index] = new Date(object[index]);
				
				// Insert data
				await this.idb[name].put(object);
			}
		}
	}
	
	/* Fetch a resource
	 * App resouces are requested by their relative path in the repository, e.g. /templates/core.html
	 * Therefore they cannot be served from network when inside the launcher.
	 * But they can be served from cache, as the launcher stores them with the appropriate (fake) path.
	 * It has to be ensured that all app resources are cached and other requests like API calls use absolute paths.
	 */
	async fetch(request) {
		return await caches.match(request) || await fetch(request);
	}
	
	// Query API
	async query(data) {
		
		// Check connection
		if(!navigator.onLine) throw 'offline';
		
		// Perform request
		const response = await fetch(this.server+'get.php', {
			method: 'POST',
			body: data,
		}).then(response => response.json());
		
		// Check response
		if(response.status && response.status == 'OK') return response;
		else throw response.error || 'invalidResponse';
	}
	
	// Wrap up html in response
	async wrap(html) {
		return new Response(html, {
			status: 200,
			statusText: 'OK',
			headers: new Headers({
				'Content-Type': 'text/html;charset=UTF-8',
				'Content-Length': html.length,
			}),
		});
	}
}