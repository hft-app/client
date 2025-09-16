class Table {
	
	// Construct with lectures
	constructor(lectures=[]) {
		
		// Sort lectures by start ASC, end DESC
		this.lectures = lectures.sort((a,b) => {
			const startDiff = a.start - b.start;
			if(startDiff !== 0) return startDiff;
			return b.end - a.end;
		});
		
		// Setup grid
		this.grid = [this.newColumn()];
		
		// Place lectures
		for(const lecture of this.lectures) this.place(lecture);
		
		// Stretch lectures
		this.stretch();
	}
	
	// Setup a new blank column
	newColumn() {
		const column = [];
		for(var i=0; i<44; i++) column[i] = null;
		return column;
	}
	
	// Calculate the nearest 15-minute-slot for the start and end of a lecture
	getStartAndEndRow(lecture) {
		const morning = new Date(lecture.start);
		morning.setHours(8,0,0);
		return [
			Math.round((lecture.start - morning) / (60 * 15 * 1000)),
			Math.round((lecture.end - morning) / (60 * 15 * 1000)),
		];
	}
	
	// Place lecture
	place(lecture) {
		const [start, end] = this.getStartAndEndRow(lecture);
		
		// Place the element in the leftmost possible col
		let placeIn = null;
		for(let colIndex=0; colIndex<this.grid.length; colIndex++) {
			const col = this.grid[colIndex];
			let free = true;
			
			// Check if enough rows in the current col are free
			for(let rowIndex=start; rowIndex<end; rowIndex++) {
				if(col[rowIndex]) free = false;
			}
			if(free) {
				placeIn = colIndex;
				break;
			}
		}
		
		// Start a new col if neccessary
		if(placeIn == null) {
			placeIn = this.grid.length;
			this.grid.push(this.newColumn());
		}
		
		// Occupy the cells
		for(let rowIndex=start; rowIndex<end; rowIndex++) this.grid[placeIn][rowIndex] = lecture;
	}
	
	// Stretch lectures to fill up empty space
	stretch() {
		for(let y=0; y<44; y++) {
			for(let x=0; x<this.grid.length; x++) {
				const cell = this.grid[x][y];
				
				// Ignore empty space and already stretched lectures
				if(!cell || cell.stretched) continue;
				
				// Let each col reduce the remaining possible colspan to its needs
				let colspan = this.grid.length - x;
				for(let dy=0; this.grid[x][y+dy] && this.grid[x][y+dy] == cell; dy++) {
					for(let dx=1; dx<colspan; dx++) {
						if(this.grid[x+dx][y+dy]) {
							colspan = dx;
							break;
						}
					}
				}
				
				// Stretch the lecture into the empty space
				cell.stretched = true;
				for(let dy=0; this.grid[x][y+dy] && this.grid[x][y+dy] == cell; dy++) {
					for(let dx=1; dx<colspan; dx++) {
						this.grid[x+dx][y+dy] = cell;
					}
				}
			}
		}
	}
	
	// Render timetable
	render() {
		let table = '';
		
		// Traverse rows
		for(let y=0; y<44; y++) {
			const type = (y <= 20 && y % 7 < 6) || (y >= 24 && (y-24) % 7 < 6) ? 'block' : '';
			table+= '<tr class="'+type+'">';
		
			// Traverse cols
			for(let x=0; x<this.grid.length; x++) {
				const cell = this.grid[x][y];
				
				// Place an empty cell
				if(!cell) {
					table+= '<td></td>';
					continue;
				}
				
				// Skip an already placed lecture
				if(cell.placed) continue;
				
				// Measure lecture size
				cell.colspan = 1;
				cell.rowspan = 1;
				while(this.grid[x+cell.colspan] && this.grid[x+cell.colspan][y] == cell) cell.colspan++;
				while(this.grid[x][y+cell.rowspan] == cell) cell.rowspan++;
				
				// Place a lecture
				cell.placed = true;
				table+= Elements.render(`
					<td class="occupied" colspan="{{colspan}}" rowspan="{{rowspan}}">
						<div class="lecture" style="background-color: {{color}}"
							{{#lecturer}}data-lecturer="{{.}}"{{/lecturer}}
							{{#start}}data-start="{{c}}"{{/start}}
							{{#end}}data-end="{{c}}"{{/end}}
						>
							<div class="title">
								{{title}}
							</div>
							<div class="time">
								{{#start}}{{H}}:{{i}}{{/start}} &ndash; {{#end}}{{H}}:{{i}} Uhr{{/end}}
							</div>
							<div class="info">
								{{#lecturer}}
									<div class="lecturer data">
										<span class="icon fa-solid fa-user"></span>
										<span>{{.}}</span>
									</div>
								{{/lecturer}}
								{{#room}}
									<div class="room data">
										<span class="icon fa-solid fa-location-dot"></span>
										<span>{{.}}</span>
									</div>
								{{/room}}
							</div>
							<div class="reactions" style="color: {{color}}">
								<div class="reaction" data-type="1">
									<span>🥱</span>
								</div>
								<div class="reaction" data-type="2">
									<span>😊</span>
								</div>
								<div class="reaction" data-type="3">
									<span>🤯</span>
								</div>
							</div>
						</div>
					</td>
				`, cell);
			}
			table+= `</tr>`;
		} return table;
	}
}