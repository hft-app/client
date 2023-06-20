// Import dependencies
self.importScripts(
	'/hft-app-client/scripts/idb.js',
	'/hft-app-client/scripts/pwa.min.js',
	'/hft-app-client/scripts/elements.min.js',
	'/hft-app-client/scripts/controller.js',
	'/hft-app-client/scripts/table.js',
	'/hft-app-client/scripts/handler/home.js',
	'/hft-app-client/scripts/handler/core.js',
	'/hft-app-client/scripts/module/frame.js',
	'/hft-app-client/scripts/module/courses.js',
	'/hft-app-client/scripts/module/lectures.js',
	'/hft-app-client/scripts/module/list.js',
	'/hft-app-client/scripts/module/error.js',
);

// Setup controller and service
const controller = new Controller(Launcher.test); // will be cache version
const service = new PWA(controller);
