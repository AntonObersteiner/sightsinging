function note_to_freq (note) {
	let note_as_A440 = note - 9;
	return 440 * pow(2, note_as_A440 / 12);
}
function freq_to_note (freq) {
	return log(freq / 440) / log(2) * 12 + 9;
}

function AudioAnalyzer (
	//these are more buckets than recommended by the documentation,
	//but I am only interested in the lower frequencies and need a lot of resolution there
	//and it seems not to cause problems (recommended are 16 to 1024)
	buckets = 4096,
	smoothing = 0, //∈[0, 1]
) {
	this.mic = new p5.AudioIn();
	this.mic.start();

	this.fft = new p5.FFT(smoothing, buckets);
	this.fft.setInput(this.mic);

	//what level of energy in relation to the loudest frequency must a lower note reach to be interpreted as the fundamental
	//TODO: compare with general noise level, not 0
	this.fundamental_threshhold = .7;

	this.note_min = -24;
	this.note_max = 36;
	this.note_step = .05;

	//what frequency plots to draw and where to draw them
	this.show = {
		"raw": new Field(new p5.Vector(0, canvas_height / 2), new p5.Vector(canvas_width, -canvas_height / 2)), //upper half
		"notes": new Field(new p5.Vector(0, canvas_height), new p5.Vector(canvas_width, -canvas_height / 2)), //lower half
	};

	this.read_fundamental_threshhold();
}

AudioAnalyzer.prototype.read_fundamental_threshhold = function () {
	fundamental_threshhold = +document.getElementById("fundamental_threshhold").value / 100;
	document.getElementById("fundamental_threshhold_label_text").innerHTML = "" + round(100 * fundamental_threshhold) + "%";
}

AudioAnalyzer.prototype.draw = function () {
	this.spectrum = this.fft.analyze();

	if (this.show["raw"]) {
		//draw raw spectrum
		noStroke();
		fill(170, 128);
		this.draw_spectrum();
	}

	//draw energy of frequencies of notes
	if (this.show["notes"])
		stroke(0, 0, 0, 64);
	let note_of_max_energy = this.analyze_fft();
	sheet.show_note(note_of_max_energy);
}

AudioAnalyzer.prototype.draw_spectrum = function () {
	let draw_field = this.show["raw"];
	//range of values from which to transform to the rectangle specified by draw_field
	let spectrum_origin = new p5.Vector(0, 0);
	let spectrum_unit = new p5.Vector(this.spectrum.length, 256);

	beginShape();
	let mapped = draw_field.map(0, 0, spectrum_origin, spectrum_unit);
	vertex(mapped.x, mapped.y);
	for (i = 0; i < this.spectrum.length; i++) {
		mapped = draw_field.map(i, this.spectrum[i], spectrum_origin, spectrum_unit);
		vertex(mapped.x, mapped.y);
	}
	mapped = draw_field.map(this.spectrum.length, 0, spectrum_origin, spectrum_unit);
	vertex(mapped.x, mapped.y);
	endShape();
}

AudioAnalyzer.prototype.analyze_fft = function (
	note_max = 36,
	note_min = -24,
	note_step = .05,
) {
	let draw_field = this.show["notes"];
	//range of values from which to transform to the rectangle specified by draw_field
	let energy_origin = new p5.Vector(note_to_freq(this.note_min), 0);
	let energy_unit = new p5.Vector(note_to_freq(this.note_max) - note_to_freq(this.note_min), 256);

	let max_energy = -1;
	let note_of_max_energy = -1; //maximally intense frequency
	let mapped;
	if (draw_field) {
		beginShape();
		mapped = draw_field.map(note_to_freq(this.note_min), 0, energy_origin, energy_unit);
		vertex(mapped.x, mapped.y);
	}
	for (let note = this.note_min; note <= this.note_max; note += note_step) {
		let freq = note_to_freq(note);
		let energy = this.fft.getEnergy(freq);
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
		mapped = draw_field.map(note_to_freq(this.note_max), 0, energy_origin, energy_unit);
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
		if (freq_to_note(freq_fundamental) < this.note_min)
			break;
		let energy_fundmental = this.fft.getEnergy(freq_fundamental);
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
