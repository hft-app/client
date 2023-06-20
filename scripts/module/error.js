class Error {
	constructor(handler) {
		this.handler = handler;
	}
	
	async process(request) {
		this.error = this.handler.controller.errors[request.params[2]];
		this.exception = request.params[2];
	}
}