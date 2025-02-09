class StartHandler {

	constructor(controller) {
		this.controller = controller;
	}
	
	get pattern() {
		return /^(start|refresh)\/?$/;
	}
	
	async process(request) {
		
		// Manual refresh
		if(request.params[1] == 'refresh') await this.controller.refresh();
		
		// Redirect to course selection page
		const page = await this.controller.idb.state.get('page') || 'courses';
		return Response.redirect('/'+page);
	}
}