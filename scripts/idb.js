/*!
 * idb.js IndexedDB wrapper v3.1
 * Licensed under the MIT license
 * Copyright (c) 2023 Lukas Jans
 * https://github.com/ljans/idb
 */
class IDB {
	
	// Wrap IDBRequest im promise
	promise(request) {
		return new Promise((resolve, reject) => {
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	}
	
	// Constructor
	constructor(tables, config={}) {
		
		// Connect to DB
		const request = indexedDB.open(config.name || 'IDB', config.version || 1);
		this.connection = this.promise(request);
			
		// Perform upgrade
		request.onupgradeneeded = e => {
			const db = request.result;
			
			// Clear old tables
			for(const name of db.objectStoreNames) if(!tables[name]) db.deleteObjectStore(name);
			
			// Create new tables
			for(const [name, options] of Object.entries(tables)) if(!db.objectStoreNames.contains(name)) db.createObjectStore(name, options);
			
			// Bubble upgrade event
			if(config.upgrade) config.upgrade(e);
		}
		
		// Bind table controllers
		for(const name of Object.keys(tables)) this[name] = new this.Table(name, this);
	}
	
	// Table controller
	get Table() {
		return class {
	
			// Constructor
			constructor(name, instance) {
				this.name = name;
				this.instance = instance;
			}
			
			// Perform operation in transaction
			transaction(operation) {
				return this.instance.connection.then(db => {
					
					// Retrieve operation result
					const transaction = db.transaction(this.name, 'readwrite');
					const table = transaction.objectStore(this.name);
					const result = operation(table);
					
					// Return promise or wrap IDBRequest in promise
					return result instanceof Promise ? result : this.instance.promise(result);
				});
			}	
			
			// Read data by index
			get(index) {
				return this.transaction(table => table.get(index));
			}
			
			// Write data by index
			put(value, index) {
				return this.transaction(table => table.put(value, index));
			}
			
			// Delete data by index
			delete(index) {
				return this.transaction(table => table.delete(index));
			}
			
			// Clear all data
			clear() {
				return this.transaction(table => table.clear());
			}
			
			// Read all data
			all(filter) {
				return this.transaction(table => new Promise((resolve, reject) => {
					const rows = [];
					const request = table.openCursor();
					request.onerror = () => reject(request.error);
					
					// Iterate over cursor values
					request.onsuccess = () => {
						const cursor = request.result;
						if(cursor) {
							rows.push(cursor.value);
							cursor.continue();
						} else resolve(filter ? rows.filter(filter) : rows);
					}
				}));
			}
		}
	}
}