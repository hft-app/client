class Events {
	constructor(handler) {
		this.handler = handler;
		this.icon = 'calendar-days';
	}
	
	isOnSameDay(date1, date2) {
		return date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear();
	}
	hasTime(date) {
		return date.getHours() != 0 || date.getMinutes() != 0;
	}
	hasSameTime(date1, date2) {
		return date1.getHours() == date2.getHours() && date1.getMinutes() == date2.getMinutes();
	}
	
	// List events
	async process() {
		var today = new Date();
		today.setHours(0,0,0,0);
		
		// Select only upcoming or current events
		this.events = (await this.handler.controller.idb.events.all(event => event.end >= today || event.start >= today)).map(event => {
						
			// Add time range
			event.range = this.isOnSameDay(event.start, today) ? 'Heute ' : Elements.render('{{j}}. [[date.F.{{n}}]] ', event.start);
			if(this.hasTime(event.start)) event.range+= Elements.render('{{H}}:{{i}} Uhr ', event.start);
			if(event.end) {
				var showDate = !this.isOnSameDay(event.start, event.end);
				var showTime = this.hasTime(event.end) && !this.hasSameTime(event.start, event.end);
				if(showDate || showTime) event.range+= '&ndash; ';
				if(showDate) event.range+= this.isOnSameDay(event.end, today) ? 'Heute ' : Elements.render('{{j}}. [[date.F.{{n}}]] ', event.end);
				if(showTime) event.range+= Elements.render('{{H}}:{{i}} Uhr', event.end);
			}
			return event;
			
		// Sort ascending by start, end
		}).sort((a,b) => {
			if(a.start == b.start) {
				if(a.end && b.end) return a.end - b.end;
				else return 0;
			} else return a.start - b.start;
		});
	}
}