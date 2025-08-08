/*!
 * CHANGE: Added the 'c' date formatter
 *
 * Luniverse Elements v3.8
 * ECMAScript 2017 template processor
 * Licensed under the MIT license
 * Copyright (c) 2021 Lukas Jans
 * https://github.com/ljans/elements
 */
class Elements {
	
	// Configure tag enclosing
	get open() { return this.escape(this.config.open || this.constructor.open || '{{'); }
	get close() { return this.escape(this.config.close || this.constructor.close || '}}'); }
	set open(open) { this.config.open = open; }
	set close(close) { this.config.close = close; }
	
	// Constructor
	constructor(config={}) {
		this.config = config;
	}
	
	/*
	 * Search named context in path.
	 * All levels of the path have to be checked, because rendering at a lower level ignores nested content.
	 * (A high-level section may contain a low-level section that was previously skipped)
	 */
	context(name, path) {
		traversal: for(let context of path) {
			
			// Use the local context
			if(name == '.') return context;
			
			// Match context against name
			for(const level of name.split('.')) {
				
				/*
				 * If the value of this context is null on purpose, directly trigger 
				 * inverted sections instead of searching for the context on a higher level.
				 */
				if(context == null) return;
				
				// Check the next level
				context = context[level];
				
				// Continue path traversal at mismatch
				if(typeof context == 'undefined') continue traversal;
				
			// Return fully matched context
			} return context;
		}
	}
	
	// Escape regex pattern
	escape(pattern) {
		return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	
	// Check whether value is considered empty
	isEmpty(value) {
		if(value instanceof Function || value instanceof Date) return false;
		if(value instanceof Array) return !value.length;
		if(value instanceof Object) return !Object.getOwnPropertyNames(value).length;
		return !value;
	}
	
	// Static renderer
	static render(template, data) {
		return new this().render(template, data);
	}
	
	// Render data
	render(template, data={}) {
		const result = this.renderRecursive(template, [data]);
		return this.renderComments(result);
	}
	
	// Remove comments
	renderComments(template) {
		const pattern = new RegExp(this.open+'!.+?'+this.close, 'g');
		return template.replace(pattern, '');
	}
	
	/*
	 * This method renders all sections in the current level.
	 * It searches the path for the named context.
	 * If the found context meets the section's condition, it is used to render the content.
	 * Otherwise, the section is deleted.
	 * Nested sections are ignored for now, but will get recursively rendered later.
	 */
	renderSections(template, path) {
		const pattern = new RegExp(this.open+'(\\^|#)(.+?)'+this.close+'((?:\\s|\\S)+?)'+this.open+'\/\\2'+this.close, 'g');
		return template.replace(pattern, ($null, type, name, content) => {
			
			// Search the named context
			const context = this.context(name, path);
			
			// Render a regular section using its non-empty context for the next level
			if(type == '#' && !this.isEmpty(context)) return this.renderRecursive(content, path, context);
			
			// Render an inverted section with an empty context in the same level
			if(type == '^' && this.isEmpty(context)) return this.renderRecursive(content, path);
			
			// Delete a regular section with empty context or an inverted section with non-empty context
			return '';
		});	
	}
	
	/*
	 * This method renders all placeholders.
	 * It searches the path for the named context.
	 * If the found context is scalar, it is used as replacement.
	 * Otherwise, the placeholder is ignored.
	 */
	renderPlaceholders(template, path) {
		const pattern = new RegExp(this.open+'([\\w\\.]+?)'+this.close, 'g');
		return template.replace(pattern, (raw, name) => {
			
			// Search the named context
			const context = this.context(name, path);
			
			// Render scalar value
			if(typeof context == 'string' || typeof context == 'number') return context;
			
			// Ignore placeholder without context
			return raw;
		});
	}
	
	/*
	 * This method renders the data recursively.
	 * It checks for the data type and passes it to subsequent renderers.
	 * If a context is passed, it is used as next level.
	 * Use a variadic function to support passing no context (neither null nor undefined).
	 * This results in an empty array, otherwise the context is the arrays first and only element.
	 */
	renderRecursive(template, path, ...context) {
		
		// Fork the path (otherwise it's global)
		const fork = path.slice(0);
		
		// Use the passed context as next level
		if(context.length) fork.unshift(context[0]);
		
		// Invoke lambda
		if(fork[0] instanceof Function) return fork[0](template);
		
		// Render array
		if(fork[0] instanceof Array && fork[0].length) return this.renderArray(template, fork);
		
		// Render date
		if(fork[0] instanceof Date) return this.renderDate(template, fork);
		
		/*
		 * At this point, fork[0] is a scalar or an object and has to be checked against placeholders and sections.
		 * - A scalar may occur as placeholder or conditional section (both times only '.' possible)
		 * - An object may occur as section or container for scalar values
		 */
		template = this.renderSections(template, fork);
		template = this.renderPlaceholders(template, fork);
		return template;
	}
	
	/*
	 * This method maps an array on a template.
	 * The template is rendered recursively with each item.
	 */
	renderArray(template, path) {
		return path[0].map(item => this.renderRecursive(template, path, item)).join('');
	}
	
	// Render date
	renderDate(template, path) {
		const d = path[0];
		return this.renderRecursive(template, path, {
			d: d.getDate().toString().padStart(2, 0),
			j: d.getDate(),
			w: d.getDay(),
			m: (d.getMonth() + 1).toString().padStart(2, 0),
			n: d.getMonth() + 1,
			Y: d.getFullYear(),
			G: d.getHours(),
			H: d.getHours().toString().padStart(2, 0),
			i: d.getMinutes().toString().padStart(2, 0),
			s: d.getSeconds().toString().padStart(2, 0),
			c: d.toISOString(),
		});
	}
}