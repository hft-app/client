// Enable reactions
$('.lecture').map(lecture => {
	
	// Require lecturer, start and end
	if(!lecture.dataset.lecturer || !lecture.dataset.start || !lecture.dataset.end) return;
	
	// Show reaction menu
	$(lecture).on('click', e => {
		
		// Hide all open reaction menus
		$('.reactions').toggleClass('active', false);
		
		// Show the current reaction menu if the lecture is ongoing
		var now = new Date();
		var start = new Date(lecture.dataset.start);
		var end = new Date(lecture.dataset.end);
		if(now < start || end < now) return;
		$('.reactions', lecture).toggleClass('active', true);
		
		// Add listener to hide the current reaction menu
		document.body.addEventListener('click', () => {
			$('.reactions', lecture).toggleClass('active', false);
		}, {once: true});
		
		// Do not close the current reaction menu immediately
		e.stopPropagation();
	});
	
	// Perform reactions
	$('.reaction', lecture).map(reaction => {
		$(reaction).on('click', async e => {
			
			// Remove selection
			$('.reaction', lecture).toggleClass('active', false);
			
			// Do not bubble to the lecture onclick
			e.stopPropagation();
			
			// Check connection
			if(!navigator.onLine) return document.location = '/error/offline';
			
			// Prepare request
			var data = new FormData();
			data.append('type', reaction.dataset.type);
			data.append('lecturer', lecture.dataset.lecturer);
			
			// Perform request
			try {
				var response = await fetch('/server/reactions/post.php', {
					method: 'POST',
					body: data,
				});
				var result = await response.json();
				if(result.status != 'OK') throw 'status not OK';
			} catch(e) {
				return document.location = '/launcher/error/?from=react&code='+e;
			}
			
			// Show selection
			$(reaction).toggleClass('active', true);
		});
	});
});
