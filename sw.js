// Import dependencies (paths must start with '/' because the Launcher prepends the repo path without trailing '/')
self.importScripts(
	'/scripts/idb.js',
	'/scripts/pwa.js',
	'/scripts/elements.min.js',
	'/scripts/controller.js',
	'/scripts/table.js',
	'/scripts/handler/start.js',
	'/scripts/handler/core.js',
	'/scripts/module/frame.js',
	'/scripts/module/courses.js',
	'/scripts/module/lectures.js',
	'/scripts/module/list.js',
	'/scripts/module/error.js',
);

// Setup controller
const controller = new Controller(self.launcher?.version ?? 'isolated');
