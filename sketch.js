let sheet;
let synth;
let audio_state;
let mic, fft;
let canvas_height = 600;
let canvas_width = 600;

function setup() {
	createCanvas(canvas_height, canvas_height);
	sheet = new Sheet();
	//mimics the autoplay policy
	getAudioContext().suspend();

	synth = new p5.MonoSynth();
	//This won't play until the context has resumed
	synth.play('A5', .5, 0, 0.2);

	mic = new p5.AudioIn();
	mic.start();
	fft = new p5.FFT(0, 4096);
	fft.setInput(mic);
}

function note_to_freq (note) {
	let note_as_A440 = note - 9;
	return 440 * pow(2, note_as_A440 / 12);
}

function draw() {
	clear();
	sheet.draw();
	if (audio_state != getAudioContext().state) {
		console.log(getAudioContext().state);
		audio_state = getAudioContext().state;
	}

	let spectrum = fft.analyze();

	let upper_half = new Field(new p5.Vector(0, canvas_height / 2), new p5.Vector(canvas_width, -canvas_height / 2));
	let lower_half = new Field(new p5.Vector(0, canvas_height), new p5.Vector(canvas_width, -canvas_height / 2));

	//draw raw spectrum
	noStroke();
	fill(128, 128, 128, 128);
	draw_spectrum(upper_half, spectrum);

	//draw energy of frequencies of notes
	stroke(0, 0, 0, 128);
	let note_of_max_energy = analyze_fft(lower_half);
	sheet.show_note(note_of_max_energy);
}

function draw_spectrum(draw_field, spectrum) {
	//range of values from which to transform to the rectangle specified by draw_field
	let spectrum_origin = new p5.Vector(0, 0);
	let spectrum_unit = new p5.Vector(spectrum.length, 256);

	beginShape();
	let mapped = draw_field.map(0, 0, spectrum_origin, spectrum_unit);
	vertex(mapped.x, mapped.y);
	for (i = 0; i < spectrum.length; i++) {
		mapped = draw_field.map(i, spectrum[i], spectrum_origin, spectrum_unit);
		vertex(mapped.x, mapped.y);
	}
	mapped = draw_field.map(spectrum.length, 0, spectrum_origin, spectrum_unit);
	vertex(mapped.x, mapped.y);
	endShape();
}

function analyze_fft (
	draw_field = null,
	note_max = 36,
	note_min = -24,
	note_step = .05,
) {
	//range of values from which to transform to the rectangle specified by draw_field
	let energy_origin = new p5.Vector(note_to_freq(note_min), 0);
	let energy_unit = new p5.Vector(note_to_freq(note_max) - note_to_freq(note_min), 256);

	let max_energy = -1;
	let note_of_max_energy = -1; //maximally intense frequency
	let mapped;
	if (draw_field) {
		beginShape();
		mapped = draw_field.map(note_to_freq(note_min), 0, energy_origin, energy_unit);
		vertex(mapped.x, mapped.y);
	}
	for (let note = note_min; note <= note_max; note += note_step) {
		let freq = note_to_freq(note);
		let energy = fft.getEnergy(freq);
		if (energy > max_energy) {
			max_energy = energy;
			note_of_max_energy = note;
		}
		if (draw_field) {
			mapped = draw_field.map(freq, energy, energy_origin, energy_unit);
			vertex(mapped.x, mapped.y);
		}
	}
	if (draw_field) {
		mapped = draw_field.map(note_to_freq(note_max), 0, energy_origin, energy_unit);
		vertex(mapped.x, mapped.y);
		endShape();
	}

	if (draw_field) {
		let mapped = draw_field.map(note_to_freq(note_of_max_energy), max_energy, energy_origin, energy_unit);
		ellipse(mapped.x, mapped.y, 10, 10);
	}

	return note_of_max_energy;
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

function keyPressed() {
	userStartAudio();
	if (keyIsDown(64 + 14)) { //'N'
		sheet.advance();
	} else if (keyIsDown(64 + 13)) { //'M'
		audio_toggle();
	} else if (keyIsDown(64 + 1)) { //'A'
		synth.play('A5', 1, 0, 2);
	} else if (keyIsDown(64 + 3)) { //'C'
		sheet.clear();
	}
}
