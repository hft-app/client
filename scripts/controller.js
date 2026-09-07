class Controller {
	
	// IDB table definition
	get tables() {
		return {
			lectures: { autoIncrement: true },
			tips: { autoIncrement: true },
			subjects: { autoIncrement: true },
			events: { autoIncrement: true },
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
			'/fonts/EuclidCircularA-Regular.ttf',
			'/fonts/EuclidCircularA-Semibold.ttf',
			'/fonts/HFT45-Bold.ttf',
			'/fonts/la-solid-900.woff2',
			
			'/scripts/client/courses.js',
			'/scripts/client/lectures.js',
			'/scripts/client/lu.min.js',
			'/scripts/client/shell.js',
			
			'/styles/main.css',
			'/styles/line-awesome.css',
			
			'/expressions/de.json',
			
			'/templates/_courses.html',
			'/templates/_events.html',
			'/templates/_lectures.html',
			'/templates/_meals.html',
			'/templates/_tips.html',
			'/templates/_error.html',
			'/templates/_welcome.html',
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
	
	// Timetable intervals (ordered!)
	get timetableStartOptions() {
		return {
			TODAY: () => {},
			START_OF_WEEK: date => {
				var daysSinceMonday = (date.getDay() + 6) % 7;
				date.setDate(date.getDate() - daysSinceMonday);
			},
			START_OF_MONTH: date => date.setDate(1),
			START_OF_SEMESTER: date => {
				if(date.getMonth() < 2) date.setFullYear(date.getFullYear() - 1);// January and February
				if(1 < date.getMonth() && date.getMonth() < 8) date.setMonth(2, 1);// March to August
				else date.setMonth(8, 1);
			},
		};
	}
	get timetableEndOptions() {
		return {
			IN_4_WEEKS: date => date.setDate(date.getDate() + 4*7 - 1),
			END_OF_WEEK: date => {
				var daysUntilSunday = (7 - date.getDay()) % 7;
				date.setDate(date.getDate() + daysUntilSunday);
			},
			END_OF_MONTH: date => date.setMonth(date.getMonth() + 1, 0),
			END_OF_SEMESTER: date => {
				if(date.getMonth() > 7) date.setFullYear(date.getFullYear() + 1);// September to December
				if(1 < date.getMonth() && date.getMonth() < 8) date.setMonth(8, 0);// March to August
				else date.setMonth(2, 0);
			},
		};
	}
	
	// Constructor
	constructor(version) {
		this.cacheVersion = version;
		this.server = '/server/';
		
		// Setup handlers (ordered!)
		this.requestHandlers = [
			new StartHandler(this),
			new CoreHandler(this),
		];
		
		// Setup PWA
		this.pwa = new PWA(this);
	
		// Setup IDB
		this.idb = new IDB(this.tables, {
			name: 'hft-app',
			version: 9,
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
			
			// Synchronous refresh (to prevent duplicate entries) that is enforced at the very first time
			await this.refresh(!checked);
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
	async refresh(force) {
		
		// Soft check for connection (Safari launches with the value from closing last time)
		if(!navigator.onLine) {
			if(force) throw 'offline';
			return;
		}
		
		// Prepare request
		var payload = new FormData();
		payload.append('version', this.cacheVersion);
		var enrollments = await this.idb.state.get('enrollments');
		if(enrollments !== undefined) payload.append('enrollments', JSON.stringify(enrollments));
		
		// Perform request
		try {
			const response = await fetch(this.server+'get.php', {
				method: 'POST',
				body: payload,
			});
			var result = await response.json();
			if(!result.status || result.status != 'OK') throw result.error || 'invalidResponse';
		} catch(e) {
			if(force) throw e;
			return;
		}
		
		// Clear all tables but state
		for(let name in this.tables) {
			if(name == 'state') continue;
			await this.idb[name].clear();
			
			// Refill tables
			if(result[name]) for(let object of result[name]) {
				
				// Cast date objects
				for(let index in object) if((
					(name == 'lectures' && index == 'start') ||
					(name == 'lectures' && index == 'end') ||
					(name == 'events' && index == 'start') ||
					(name == 'events' && index == 'end')
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