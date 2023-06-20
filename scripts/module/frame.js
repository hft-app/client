class Frame {
	constructor(url, icon) {
		this.url = url;
		this.name = 'frame';
		this.icon = icon;
	}
	
	async process() {
		this.online = navigator.onLine;
	}
}