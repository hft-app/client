class Lectures {	
	constructor(handler) {
		this.handler = handler;
		this.icon = 'clock';
	}
	
	// Build timetable
	async process(request) {
		const lectures = await this.handler.controller.idb.lectures.all();
		this.days = [];
		this.hasLectures = false;
		
		// Check enrollments
		const enrollments = await this.handler.controller.idb.state.get('enrollments') || {};
		this.hasEnrollments = Object.keys(enrollments).length > 0;
		
		// Check last refresh
		const refreshed = await this.handler.controller.idb.state.get('refreshed');
		this.hasRefreshed = refreshed && new Date() - refreshed < 14*24*60*60*1000;
		
		// Check semester
		var today = new Date();
		this.summer = Math.abs(today.getMonth() - 7) < 3;
		
		// Set and get color seed
		if(request.GET.has('repaint')) await this.handler.controller.idb.state.put(Math.floor(Math.random() * 101), 'seed');
		var seed = await this.handler.controller.idb.state.get('seed') || 36;
		
		// Load timetable interval option
		var startOption = await this.handler.controller.idb.state.get('timetableStartOption');
		var startLambda = this.handler.controller.timetableStartOptions[startOption];
		if(!startLambda) startLambda = Object.values(this.handler.controller.timetableStartOptions)[0];
		var endOption = await this.handler.controller.idb.state.get('timetableEndOption');
		var endLambda = this.handler.controller.timetableEndOptions[endOption];
		if(!endLambda) endLambda = Object.values(this.handler.controller.timetableEndOptions)[0];
		
		// Setup timetable interval
		var currentDayStart = new Date();
		currentDayStart.setHours(0,0,0,0);
		startLambda(currentDayStart);
		var lastDayEnd = new Date();
		lastDayEnd.setHours(23,59,59,999);
		endLambda(lastDayEnd);
		
		// Iterate over each day in the timetable interval
		do {
			var currentDayEnd = new Date(currentDayStart.getTime());
			currentDayEnd.setHours(23,59,59,999);
			
			// Filter lectures for current day by title (such that for a given course selection the random colors stay the same on each day)
			let currentDay = lectures.filter(lecture => lecture.start >= currentDayStart && lecture.end <= currentDayEnd);
			currentDay.sort(function(a,b){
				let fa = a.title.toLowerCase();
				let fb = b.title.toLowerCase();

				if (fa < fb) return -1;
				if (fa > fb) return 1;
				return 0;
			});
			
			// Calculate color hash
			currentDay.forEach(async lecture => {
				var hash = 1;
				for(var i=0; i<lecture.title.length; i++) hash = (hash * lecture.title.charCodeAt(i) + seed) % 359;
				lecture.color = 'hsl('+hash+'deg 70% 40%)';
			});
			
			// Add day to timetable
			if(currentDay.length > 0) this.hasLectures = true;
			this.days.push({
				table: new Table(currentDay).render(),
				date: new Date(currentDayStart.getTime()),// Each day needs its own copy
			});
			
			// Repeat for the next day until the end is reached
			currentDayStart.setDate(currentDayStart.getDate() + 1);
		} while(currentDayStart < lastDayEnd);
	}
}