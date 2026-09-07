class Courses {
	constructor(handler) {
		this.handler = handler;
	}
	
	async process(request) {
		
		// Update course enrollments, timetable interval and other settings
		if(request.GET.has('submit')) {
			var enrollments = {};
			var fitBodyHeight = false;
			for(var [key, value] of request.POST) {
				if(key == 'timetableStartOption' || key == 'timetableEndOption') {
					await this.handler.controller.idb.state.put(value, key);
					continue;
				}
				if(key == 'fitBodyHeight') {
					fitBodyHeight = true;
					continue;
				}
				var [subject, course] = key.split('/');
				if(!enrollments[subject]) enrollments[subject] = [];
				enrollments[subject].push(course);
			}
			await this.handler.controller.idb.state.put(enrollments, 'enrollments');
			await this.handler.controller.idb.state.put(fitBodyHeight, 'fitBodyHeight');
			await this.handler.controller.refresh(true);
			return Response.redirect('/lectures');
		}
		
		// Setup timetable interval options
		var timetableStartOption = await this.handler.controller.idb.state.get('timetableStartOption');
		var timetableEndOption = await this.handler.controller.idb.state.get('timetableEndOption');
		this.timetableStartOptions = [];
		this.timetableEndOptions = [];
		for(var key in this.handler.controller.timetableStartOptions) {
			this.timetableStartOptions.push({
				key: key,
				selected: key == timetableStartOption,
			});
		}
		for(var key in this.handler.controller.timetableEndOptions) {
			this.timetableEndOptions.push({
				key: key,
				selected: key == timetableEndOption,
			});
		}
		
		// List subjects with courses
		var enrollments = await this.handler.controller.idb.state.get('enrollments');
		this.subjects = await this.handler.controller.idb.subjects.all();
		this.subjects.forEach(subject => {
			subject.courses.forEach(course => {
				course.subject = subject.id;
				
				// Check for enrollment
				if(!enrollments) return;
				var enrollment = enrollments[subject.id];
				if(!enrollment) return;
				for(var check of enrollment) {
					if(check == course.id) course.enrolled = true;
				}
			});
		});
	}
}