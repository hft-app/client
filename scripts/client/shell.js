// Check all touch gestures
window.addEventListener('touchmove', e => {
	var check = e.target;
	
	// Disable zooming
	if(e.touches.length > 1) return e.preventDefault();
	
	// Check if the touch happens inside the wrapper
	while(check !== document.body) {
		if(check.classList.contains('wrapper')) return;
		check = check.parentNode;
	}
	
	// Cancel the scroll for all elements outside the wrapper
	e.preventDefault();
}, {passive: false}); // Required to cancel the event

// Bind the listener for the refresh button
$('header .refresh').on('click', function(){
	this.classList.add('fa-spin');
});
