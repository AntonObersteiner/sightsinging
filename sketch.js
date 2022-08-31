let sheet;
let synth;
let audio_state;
let mic, fft;
let canvas_height = 600;
let canvas_width = 600;
//what level of energy in relation to the loudest frequency must a lower note reach to be interpreted as the fundamental
//TODO: compare with general noise level, not 0
let fundamental_threshhold = .7;

function read_fundamental_threshhold() {
	fundamental_threshhold = +document.getElementById("fundamental_threshhold").value / 100;
	document.getElementById("fundamental_threshhold_label_text").innerHTML = "" + round(100 * fundamental_threshhold) + "%";
}


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
	//these are more buckets than recommended by the documentation,
	//but I am only interested in the lower frequencies and need a lot of resolution there
	//and it seems not to cause problems (recommended are 16 to 1024)
	let buckets = 4096;
	let smoothing = 0; //∈[0, 1]
	fft = new p5.FFT(smoothing, buckets);
	fft.setInput(mic);

	read_fundamental_threshhold();
}

function note_to_freq (note) {
	let note_as_A440 = note - 9;
	return 440 * pow(2, note_as_A440 / 12);
}
function freq_to_note (freq) {
	return log(freq / 440) / log(2) * 12 + 9;
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
	fill(170, 128);
	draw_spectrum(upper_half, spectrum);

	//draw energy of frequencies of notes
	stroke(0, 0, 0, 64);
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

	let note_result = note_of_max_energy;
	//often, overtones are louder than the actual fundamental,
	//so try to find fundamentals of the found overtone in note_of_max_energy
	let freq_of_max_energy = note_to_freq(note_of_max_energy);
	for (let overtone = 2; overtone < 10; overtone++) {
		//test this potential fundamental
		let freq_fundamental = freq_of_max_energy / overtone;
		//check if frequency is lower than lowest expected note
		if (freq_to_note(freq_fundamental) < note_min)
			break;
		let energy_fundmental = fft.getEnergy(freq_fundamental);
		if (energy_fundmental >= max_energy * fundamental_threshhold) {
			note_result = freq_to_note(freq_fundamental);
		}
	}

	if (draw_field) {
		let mapped = draw_field.map(note_to_freq(note_result), max_energy, energy_origin, energy_unit);
		ellipse(mapped.x, mapped.y, 10, 10);
	}

	return note_result;
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
