class List {
	constructor(handler, name, icon) {
		this.handler = handler;
		this.name = name;
		this.icon = icon;
	}
	
	// List items
	async process() {
		this.list = await this.handler.controller.idb[this.name].all();
		for(var item of this.list) {
			if(item.href && !item.href.startsWith('/')) item.external = true;
		}
	}
}