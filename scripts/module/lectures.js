class Lectures {	
	constructor(handler) {
		this.handler = handler;
		this.icon = 'clock';
	}
	
	// Build timetable
	async process(request) {
		const lectures = await this.handler.controller.idb.lectures.all(lecture => lecture.start >= this.handler.today);
		this.days = [];
		this.hasLectures = false;
		
		// Set and get color seed
		if(request.GET.has('repaint')) await this.handler.controller.idb.state.put(Math.floor(Math.random() * 101), 'seed');
		var seed = await this.handler.controller.idb.state.get('seed') || 36;
		
		// Create timetable for the next 3 weeks
		for(let i=0; i<21; i++) {
			const start = new Date();
			start.setDate(start.getDate() + i);
			start.setHours(0,0,0);
			const end = new Date()
			end.setDate(end.getDate() + i);
			end.setHours(23,59,59);
			
			// Filter lectures for current day
			let today = lectures.filter(lecture => lecture.start >= start && lecture.end <= end);
			today.sort(function(a,b){
				let fa = a.title.toLowerCase();
				let fb = b.title.toLowerCase();

				if (fa < fb) return -1;
				if (fa > fb) return 1;
				return 0;
			});
			
			// Calculate color hash
			today.forEach(async lecture => {
				var hash = 1;
				for(var i=0; i<lecture.title.length; i++) hash = (hash * lecture.title.charCodeAt(i) + seed) % 359;
				lecture.color = 'hsl('+hash+'deg 70% 40%)';
			});
			
			// Add day to timetable
			if(today.length > 0) this.hasLectures = true;
			this.days.push({
				table: new Table(today).render(),
				date: start,
			});
		}
	}
}