class Controller {
	
	// IDB table definition
	get tables() {
		return {
			lectures: { autoIncrement: true },
			tips: { autoIncrement: true },
			subjects: { autoIncrement: true },
			state: {},
		};
	}
	
	/**
	 * Cache definition
	 * Paths start with '/' because:
	 * - the names of cached ressources will start with '/' anyhow (due to the browser)
	 * - it avoids confusion that fetching from cache using caches.match therefore only works for paths starting with '/'
	 * - the app might be installed from a subdirectory like /launcher which would result in different paths otherwise
	 */
	get cachedFiles() {
		return [
			'/fontawesome/css/fontawesome.min.css',
			'/fontawesome/css/solid.min.css',
			'/fontawesome/css/regular.min.css',
			'/fontawesome/webfonts/fa-solid-900.ttf',
			'/fontawesome/webfonts/fa-solid-900.woff2',
			'/fontawesome/webfonts/fa-regular-400.ttf',
			'/fontawesome/webfonts/fa-regular-400.woff2',
			
			'/scripts/client/courses.js',
			'/scripts/client/lectures.js',
			'/scripts/client/lu.min.js',
			'/scripts/client/shell.js',
			
			'/styles/main.css',
			
			'/expressions/de.json',
			
			'/templates/_courses.html',
			'/templates/_events.html',
			'/templates/_lectures.html',
			'/templates/_meals.html',
			'/templates/_tips.html',
			'/templates/_error.html',
			'/templates/shell.html',
			
			'/launcher/meta.html',
			
			'/sws/bootstrap.min.css',
			'/sws/frame.html',
			'/sws/jquery-3.2.1.min.js',
			'/sws/js.cookie-3.js',
			'/sws/project.css',
			'/sws/project.min.js',
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
		this.server = '/server/';
		
		// Setup handlers
		this.requestHandlers = [
			new StartHandler(this),
			new CoreHandler(this),
		];
		
		// Setup PWA
		this.pwa = new PWA(this);
	
		// Setup IDB
		this.idb = new IDB(this.tables, {
			name: 'hft-app',
			version: 8,
		});
	}
	
	// Render template
	async renderTemplate(page, data) {
		const content = await this.fetch('/templates/_'+page+'.html').then(response => response.text());
		const shell = await this.fetch('/templates/shell.html').then(response => response.text());
		const meta = await this.fetch('/launcher/meta.html').then(response => response.text());
		const cooked = shell.replace('{{>content}}', content).replace('{{>meta}}', meta);
		
		// Render html
		return Elements.render(cooked, data);
	}
	
	// Throw unknown errors or redirect to known error page
	async exceptionHandler(exception) {
		if(!this.errors[exception]) throw exception;
		return Response.redirect('/error/'+exception);
	}
	
	// Request filter (as hook for auto-refresh)
	async requestFilter(data) {
		const checked = await this.idb.state.get('checked');
		if(!checked || new Date() - checked > 15*60*1000) {
			await this.idb.state.put(new Date(), 'checked');
			
			// Only refresh when online, wait for data on initial refresh
			if(navigator.onLine) {
				if(!checked) await this.refresh();
				else this.refresh();
			}
		}
		return data;
	}
	
	// Response filter
	async responseFilter(response) {
		
		// Return native response
		if(response instanceof Response) return response;
		
		// Return html wrapped in response
		if(response) {
			const language = await this.fetch('/expressions/de.json').then(response => response.json());
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
		var enrollments = await this.idb.state.get('enrollments');
		if(enrollments !== undefined) payload.append('enrollments', JSON.stringify(enrollments));
		const result = await this.query(payload);
		
		// Clear all tables but state
		for(let name in this.tables) {
			if(name == 'state') continue;
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
		
		// Restore cached enrollments (for switch from web to app or after reset)
		if(result.enrollments) {
			await this.idb.state.put(result.enrollments, 'enrollments');
			await this.idb.state.put('lectures', 'page');
		}
		
		// Store refresh timestamp
		await this.idb.state.put(new Date(), 'refreshed');
	}
	
	/* Fetch a resource
	 * It has to be ensured that all app resources are cached.
	 * Only while caching, the Launcher serves them from the app repo, pretending it's the requested (fake) path.
	 * They cannot be retrieved from a network fetch (with relative path) afterwards.
	 */
	async fetch(url) {
		return this.pwa.fetch(new Request(url));
	}
	
	// Query API
	async query(data) {
		
		// Check connection
		if(!navigator.onLine) throw 'offline';
		
		// Add version
		data.append('version', this.cacheVersion);
		
		// Perform request
		let response = await fetch(this.server+'get.php', {
			method: 'POST',
			body: data,
		});
		response = await response.json();
		
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