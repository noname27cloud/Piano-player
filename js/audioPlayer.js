export class AudioPlayer {
  constructor() {
    this.audioContext = this.getCrossBrowserAudioContext();
    this.samples = {};
    this.loadSamples();
  }

  getCrossBrowserAudioContext() {
    const AudioContextCrossBrowser =
      window.AudioContext || window.webkitAudioContext;
    return AudioContextCrossBrowser ? new AudioContextCrossBrowser() : null;
  }

  loadSamples() {
    const fileNames = ["C3", "C4", "C5"];
    const audioExtension = this.getSupportedAudioExtension();

    Promise.all(
      fileNames.map((fileName) =>
        this.loadSample(`./samples/${fileName}.${audioExtension}`)
      )
    ).then((audioBuffers) => {
      fileNames.forEach((note, index) => {
        this.samples[note] = audioBuffers[index];
      });
    });
  }

  getSupportedAudioExtension() {
    const audioElement = document.createElement("audio");
    if (audioElement.canPlayType("audio/mpeg")) return "mp3";
    if (audioElement.canPlayType("audio/ogg")) return "ogg";
    return "mp3";
  }

  loadSample(url) {
    return fetch(url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => this.audioContext.decodeAudioData(buffer));
  }

  playTone(noteName, noteValue) {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.samples[noteName];

    if (source.detune) {
      source.detune.value = noteValue * 100;
    } else {
      source.playbackRate.value = 2 ** (noteValue / 12);
    }

    source.connect(this.audioContext.destination);
    this.audioContext.resume().then(() => {
      source.start(0);
    });
  }

  playNote(noteName) {
    if (!this.audioContext) return;

    let baseSample = "C4";
    let noteValue = 0;

    if (
      [
        "C3",
        "C#3",
        "D3",
        "D#3",
        "E3",
        "F3",
        "F#3",
        "G3",
        "G#3",
        "A3",
        "A#3",
        "B3",
      ].includes(noteName)
    ) {
      baseSample = "C3";
    } else if (
      [
        "C4",
        "C#4",
        "D4",
        "D#4",
        "E4",
        "F4",
        "F#4",
        "G4",
        "G#4",
        "A4",
        "A#4",
        "B4",
      ].includes(noteName)
    ) {
      baseSample = "C4";
    } else if (
      [
        "C5",
        "C#5",
        "D5",
        "D#5",
        "E5",
        "F5",
        "F#5",
        "G5",
        "G#5",
        "A5",
        "A#5",
        "B5",
      ].includes(noteName)
    ) {
      baseSample = "C5";
    }

    const noteOffsets = {
      C3: 0,
      "C#3": 1,
      D3: 2,
      "D#3": 3,
      E3: 4,
      F3: 5,
      "F#3": 6,
      G3: 7,
      "G#3": 8,
      A3: 9,
      "A#3": 10,
      B3: 11,
      C4: 0,
      "C#4": 1,
      D4: 2,
      "D#4": 3,
      E4: 4,
      F4: 5,
      "F#4": 6,
      G4: 7,
      "G#4": 8,
      A4: 9,
      "A#4": 10,
      B4: 11,
      C5: 0,
      "C#5": 1,
      D5: 2,
      "D#5": 3,
      E5: 4,
      F5: 5,
      "F#5": 6,
      G5: 7,
      "G#5": 8,
      A5: 9,
      "A#5": 10,
      B5: 11,
    };

    noteValue = noteOffsets[noteName];

    this.playTone(baseSample, noteValue);
  }
}
