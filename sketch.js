let sheet;
let synth;
let audio_state;
function setup() {
	createCanvas(600, 600);
	sheet = new Sheet();
	//mimics the autoplay policy
	getAudioContext().suspend();

	synth = new p5.MonoSynth();
	//This won't play until the context has resumed
	synth.play('A5', .5, 0, 0.2);
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
