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
