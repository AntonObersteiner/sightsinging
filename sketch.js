
function Field (origin = new p5.Vector(0, 0), size = new p5.Vector(600, 200)) {
	this.origin = origin;
	this.size = size;
}
//map from rectangle a, b to the rectangle of the Field
Field.prototype.to_pixels = function (x, y, a = new p5.Vector(0, 0), b = new p5.Vector(1, 1)) {
	return new p5.Vector(
		map(x, a.x, b.x, this.origin.x, this.origin.x + this.size.x),
		map(y, a.y, b.y, this.origin.y, this.origin.y + this.size.y),
	);
}

function Sheet() {
	//pitches in half-tones:
	//0 = C0
	//48 = C4 = c'
	//57 = A4 = a' = 440Hz
	this.notes = [
		0, 1, 2, 3, 4, 5, 6, 7, 9, 11,
		12, 14, 16, 17, 19, 21, 23
	];
	this.accepted_notes = [0, 1, 2, 4, 5, 6, 7, 9, 11, 12];
	this.natural_notes = [0, 2, 4, 5, 7, 9, 11, 12];
	this.drawn_lines = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
	this.length = 12; //how many notes → dividing lengthwise
	this.height = 48; //how many distinct notes → dividing height on plot
	this.lines = 15; //how many classical note lines
	this.show = {
		"plot": new Field(new p5.Vector(10, 10), new p5.Vector(600, 400)),
		"sheet": new Field(new p5.Vector(10, 10), new p5.Vector(600, 200)),
	}
	this.when_full = "step"; //alternative: "jump"
}
//returns {"octave": …, "line": …, "sharp": …}, so that 12 * octave + this.accepted_notes[line] + sharp == note
Sheet.prototype.to_C_major = function (note) {
	let octave = 0;
	while (note >= 12) {
		note -= 12;
		octave += 1;
	}
	while (note < 0) {
		note += 12;
		octave -= 1;
	}

	for (let a = 0; a < this.natural_notes.length; a++) {
		if (this.natural_notes[a] >= note) {
			sharp = (this.natural_notes[a] > note);
			if (sharp && a == 0) {
				//when the note 0 (C) ans possibly its successors
				//are not natural natural notes for some reasons,
				//write as a sharp note of the next octave lower
				octave -= 1;
				a += 12;
			}
			return {
				"octave": octave,
				"line": a - sharp,
				"sharp": note - this.natural_notes[a - sharp],
			};
		}
	}
	console.log("note", note, "in octave", octave, "could not be sorted");
	return null;
}
Sheet.prototype.get_note_code = function (note) {
	in_C = this.to_C_major(note);
	note_name = ["C", "D", "E", "F", "G", "A", "B"][in_C["line"]];
	sharp = (in_C["sharp"] ? '#' : '');
	octave = in_C["octave"] + 4;

	//A and B are categorized as one octave higher
	//because the counting reasonably starts at A
	if (["A", "B"].includes(note_name))
		octave += 1;

	return note_name + sharp + octave;
}
Sheet.prototype.line_relative_to_note = function (pos, note_head, x1, y1, x2, y2) {
	line (
		pos.x + x1 * note_head.x,
		pos.y + y1 * note_head.y,
		pos.x + x2 * note_head.x,
		pos.y + y2 * note_head.y,
	);
}
Sheet.prototype.draw = function () {
	plot_field = this.show["plot"];
	if (plot_field) {
		noFill(); //set fill α to transparent
		beginShape();
		for (let i = 0; i < this.notes.length; i++) {
			note = this.notes[i];

			//convert the sheet info to pixels
			left = plot_field.to_pixels(
				i / this.length,
				1 - note / this.height
			);
			right = plot_field.to_pixels(
				(i + 1) / this.length,
				1 - note / this.height
			);
			vertex(left.x, left.y);
			vertex(right.x, right.y);
		}
		endShape();
	}

	sheet_field = this.show["sheet"];
	if (sheet_field) {
		//music notation lines
		for (let l = 15; l >= 0; l--) {
			if (this.drawn_lines.includes(l)) {
				left = sheet_field.to_pixels(0, 1 - l / 15);
				right = sheet_field.to_pixels(1, 1 - l / 15);
				line(left.x, left.y, right.x, right.y);
			}
		}

		//note heads
		for (let i = 0; i < this.notes.length; i++) {
			note = this.notes[i];
			in_C = this.to_C_major(note);
			height_in_C = 7 * in_C["octave"] + in_C["line"];// + in_C["sharp"] / 2;
			height = 7 + height_in_C / 2;
			pos = sheet_field.to_pixels(
				(i + .7) / this.length,
				1.0 - height / this.lines
			);

			note_head = new p5.Vector(null, .95 * sheet_field.size.y / this.lines);
			note_head.x = 1.5 * note_head.y;

			strokeWeight(1);
			if (
				!this.drawn_lines.includes(
					(14 - floor(height_in_C)) / 2
				) && height_in_C % 2 == 0
			) {
				this.line_relative_to_note(pos, note_head, -0.75, +0.00, +0.75, +0.00);
			}

			//add # in front
			if (in_C["sharp"]) {
				this.line_relative_to_note(pos, note_head, -1.55, +0.90, -1.35, -0.90); // left /
				this.line_relative_to_note(pos, note_head, -1.10, +0.90, -0.90, -0.90); // right /
				this.line_relative_to_note(pos, note_head, -1.65, -0.30, -0.70, -0.30); // upper -
				this.line_relative_to_note(pos, note_head, -1.70, +0.30, -0.75, +0.30); // lower -
			}

			strokeWeight(1.5);
			ellipse(pos.x, pos.y, note_head.x, note_head.y);
		}
		strokeWeight(1);
	}
}
Sheet.prototype.isaccepted = function (new_note) {
	for (let i = 0; i < this.accepted_notes.length; i++) {
		if (new_note == this.accepted_notes[i]) {
			return true;
		}
	}
	return false;
}
//add a new random note from the accepted_notes
Sheet.prototype.advance = function () {
	new_note = floor(random() * 12);
	while (!this.isaccepted(new_note)) {
		if (new_note > this.accepted_notes[0]) {
			new_note--;
		} else {
			new_note++;
		}
	}
	this.notes.push(new_note);

	if (this.notes.length > this.length * .9) {
		if (this.when_full == "jump")
			this.notes = this.notes.slice(floor(this.notes.length / 2));
		else //if (this.when_full == "step")
			this.notes = this.notes.slice(1);
	}
}

let sheet;
let audio_state;
function setup() {
	createCanvas(600, 600);
	sheet = new Sheet();
	//mimics the autoplay policy
	getAudioContext().suspend();
}

function draw() {
	clear();
	sheet.draw();
	if (audio_state != getAudioContext().state) {
		console.log(getAudioContext().state);
		audio_state = getAudioContext().state;
	}
}

function mousePressed() {
	userStartAudio();
	console.log(getAudioContext().state);
	loop();
}

function audio_toggle() {
	if (getAudioContext().state == 'suspended')
		getAudioContext().resume();
	else if (getAudioContext().state == 'running')
		getAudioContext().suspend();
	else
		userStartAudio();
		console.log(getAudioContext().state);
		loop();
}

function keyPressed(){
	if(keyIsDown(64+1)){ //'A'
		sheet.advance();
	}
}
