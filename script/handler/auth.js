class AuthHandler {
	
	constructor(controller) {
		this.controller = controller;
	}
	
	get pattern() {
		return /^(login|logout)\/?$/;
	}
	
	async process(request) {
		switch(request.params[1]) {
		
			// Login
			case 'login': {
				const data = {};
				try {
					
					// Perform request
					if(request.POST.has('submit')) {
						const result = await fetch(this.controller.server+'auth.php', {
							method: 'POST',
							body: request.POST,
						}).then(response => response.json());
						
						// Server error
						if(result.error) throw result.error;
						
						// Handle login result
						if(result.login) {
							await IDB.server.put(result.device, 'device');
							await IDB.server.put(result.username, 'username');
							await IDB.server.put(result.displayname, 'displayname');
							await this.controller.refresh();
							return Response.redirect('/');
						} else data.failed = true;
					}
				
				// Error handling
				} catch(error) {
					data.error = error;
				}
				
				// Render template
				let template = await this.controller.fetch('/template/login.html').then(response => response.text());
				template = Elements.render(template, data);
				
				// Render language
				const lang = await this.controller.fetch('/lang/de.json').then(response => response.json());
				return new Elements({open: '[[', close: ']]'}).render(template, lang);
			}
			
			// Logout
			case 'logout': {
				await this.controller.query('logout');
				await this.controller.logout();
				
				// Relaunch
				return Response.redirect('/');
			}
		}
	}
}