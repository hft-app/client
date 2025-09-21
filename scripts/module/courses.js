class Courses {
	constructor(handler) {
		this.handler = handler;
	}
	
	async process(request) {
		
		// Update course enrollments
		if(request.GET.has('submit')) {
			var enrollments = {};
			for(var [key, value] of request.POST) {
				var [subject, course] = key.split('/');
				if(!enrollments[subject]) enrollments[subject] = [];
				enrollments[subject].push(course);
			}
			await this.handler.controller.idb.state.put(enrollments, 'enrollments');
			await this.handler.controller.refresh(true);
			return Response.redirect('/lectures');
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