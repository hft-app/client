// Import dependencies
self.importScripts(
	'scripts/idb.js',
	'scripts/pwa.min.js',
	'scripts/elements.min.js',
	'scripts/controller.js',
	'scripts/table.js',
	'scripts/handler/home.js',
	'scripts/handler/core.js',
	'scripts/module/frame.js',
	'scripts/module/courses.js',
	'scripts/module/lectures.js',
	'scripts/module/list.js',
	'scripts/module/error.js',
);

// Setup controller and service
const controller = new Controller(Launcher.test); // will be cache version
const service = new PWA(controller);
