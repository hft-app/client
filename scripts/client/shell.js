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

// Defer the install prompt and bind it to corresponding links
window.addEventListener('beforeinstallprompt', e => {
	document.querySelectorAll('a[href="/launcher/kb/install"]').forEach(a => a.addEventListener('click', click => {
		click.preventDefault();
		e.prompt();
	}, {once: true}))
});

// Register share handler
const shareData = {
	title: "HFT App",
	url: "https://hft-app.de",
};
document.querySelectorAll('a[href="SHARE"]').forEach(a => {
	a.href = 'whatsapp://send?text=https://hft-app.de';
	a.addEventListener('click', e => {
		if(navigator.canShare(shareData)) {
			navigator.share(shareData);
			e.preventDefault();
		}
	});
});

/**
 * Set the body height to window.outerHeight when starting from homescreen.
 * This is very important because 100vh and 100dvh are both too short on Safari but too long on Chrome.
 * As failsafe, the default is set to be 100svh in CSS.
 */
if(window.matchMedia('(display-mode: standalone)').matches) document.body.style.height = window.outerHeight+'px';
