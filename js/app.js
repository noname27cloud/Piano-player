import { AudioPlayer } from "./audioPlayer.js";

const interactiveModeBtn = document.getElementById("interactiveModeBtn");
const preparedModeBtn = document.getElementById("preparedModeBtn");
const interactiveButtons = document.getElementById("interactiveButtons");
const preparedButtons = document.getElementById("preparedButtons");
const pianoKeys = document.querySelectorAll(".key");

const recordButton = document.getElementById("recordBtn");
const stopRecordButton = document.getElementById("stopRecordingBtn");
const downloadBtn = document.getElementById("downloadBtn");

const pressedKeys = new Set();
const player = new AudioPlayer();
let currentMode = "interactive";
let itFirstSwitch = true;

let isRecording = false;
let startTime = 0;
let recordedNotes = [];
let recordInterval;
let isTouchDevice = false;

downloadBtn.disabled = true;
downloadBtn.style.opacity = "0.5";
downloadBtn.style.cursor = "not-allowed";

const keyToNoteMap = {
  q: "C3",
  2: "C#3",
  w: "D3",
  3: "D#3",
  e: "E3",
  r: "F3",
  5: "F#3",
  t: "G3",
  6: "G#3",
  y: "A3",
  7: "A#3",
  u: "B3",
  i: "C4",
  9: "C#4",
  o: "D4",
  0: "D#4",
  p: "E4",
  z: "F3",
  s: "F#4",
  x: "G4",
  d: "G#4",
  c: "A4",
  f: "A#4",
  v: "B4",
  b: "C5",
  h: "C#5",
  n: "D5",
  j: "D#5",
  m: "E5",
};

// Switching between interactive and prepared modes
interactiveModeBtn.addEventListener("click", () => switchMode(true));
preparedModeBtn.addEventListener("click", () => switchMode(false));

function switchMode(isInteractive) {
  if (!itFirstSwitch) {
    if (!isInteractive && currentMode === "interactive") {
      const confirmation = confirm(
        "Do you really want to switch to prepared mode? All unsaved recordings will be deleted."
      );
      if (!confirmation) return;
    }
    if (isInteractive && currentMode === "prepared") {
      const confirmation = confirm(
        "Do you really want to switch to interactive mode? All loaded files will not be saved."
      );
      if (!confirmation) return;
    }
  }

  interactiveButtons.style.display = isInteractive ? "block" : "none";
  preparedButtons.style.display = isInteractive ? "none" : "block";
  interactiveModeBtn.classList.toggle("active", isInteractive);
  preparedModeBtn.classList.toggle("active", !isInteractive);
  resetMode();
  currentMode = isInteractive ? "interactive" : "prepared";
  itFirstSwitch = false;
}

// Reset the mode elements
function resetMode() {
  if (currentMode === "interactive") {
    recordedNotes = [];
    isRecording = false;
    startTime = 0;
    clearInterval(recordInterval);

    recordButton.textContent = "Record";
    recordButton.disabled = false;
    recordButton.style.opacity = "1";
    recordButton.classList.remove("active");
    recordButton.style.cursor = "pointer";

    stopRecordButton.disabled = false;
    stopRecordButton.style.opacity = "1";

    downloadBtn.disabled = true;
    downloadBtn.style.opacity = "0.5";
    downloadBtn.classList.remove("active");
    downloadBtn.style.cursor = "not-allowed";

    pressedKeys.clear();
    pianoKeys.forEach((key) => key.classList.remove("active"));
  } else {
    stopPlayback();
    loadedNotes = [];
    playbackIndex = 0;
    fileInput.value = "";
    progressBar.value = 0;
    playBtn.textContent = "Play";
    playbackSpeed = 1.0;
    speedControl.value = 1.0;
  }
}

// Keyboard event handlers
document.addEventListener("keydown", (event) => handleKeyPress(event, true));
document.addEventListener("keyup", (event) => handleKeyPress(event, false));

function handleKeyPress(event, isPressed) {
  if (event.repeat) return;

  const note = keyToNoteMap[event.key.toLowerCase()];
  if (!note) return;

  const keyElement = document.querySelector(
    `.key[data-key="${event.key.toLowerCase()}"]`
  );
  if (!keyElement) return;

  if (isPressed && !pressedKeys.has(note)) {
    player.playNote(note);
    pressedKeys.add(note);

    if (isRecording) {
      recordedNotes.push({
        key: note,
        startTime: performance.now() - startTime,
        duration: 0,
      });
    }
  } else if (!isPressed) {
    pressedKeys.delete(note);

    if (isRecording) {
      updateNoteDuration(note);
    }
  }

  keyElement?.classList.toggle("active", isPressed);
}

// Mouse and touch event handlers for piano keys
pianoKeys.forEach((key) => {
  key.addEventListener("touchstart", (event) => {
    isTouchDevice = true;
    handleMousePress(event, true);
  });
  key.addEventListener("touchend", (event) => handleMousePress(event, false));
});

pianoKeys.forEach((key) => {
  key.addEventListener("mousedown", (event) => {
    if (isTouchDevice) return;
    handleMousePress(event, true);
  });
  key.addEventListener("mouseup", (event) => handleMousePress(event, false));
  key.addEventListener("mouseleave", () => key.classList.remove("active"));
});
pianoKeys.forEach((key) => {
  key.addEventListener("pointerdown", (event) => handleMousePress(event, true));
  key.addEventListener("pointerup", (event) => handleMousePress(event, false));
  key.addEventListener("pointerleave", () => key.classList.remove("active"));
});

function handleMousePress(event, isPressed) {
  const note = event.currentTarget.dataset.note;

  if (isPressed && !pressedKeys.has(note)) {
    player.playNote(note);
    pressedKeys.add(note);

    if (isRecording) {
      recordedNotes.push({
        key: note,
        startTime: performance.now() - startTime,
        duration: 0,
      });
    }
  } else if (!isPressed) {
    pressedKeys.delete(note);

    if (isRecording) {
      updateNoteDuration(note);
    }
  }

  event.currentTarget.classList.toggle("active", isPressed);
}

// Recording functions
recordButton.addEventListener("click", startRecording);
stopRecordButton.addEventListener("click", stopRecording);
downloadBtn.addEventListener("click", downloadRecording);

function startRecording() {
  if (isRecording) return;

  isRecording = true;
  recordedNotes = [];
  startTime = performance.now();

  recordButton.textContent = "🔴 0:00";
  recordButton.disabled = true;
  recordButton.style.opacity = "0.5";
  recordButton.classList.add("active");
  recordButton.style.cursor = "not-allowed";

  downloadBtn.disabled = true;
  downloadBtn.style.opacity = "0.5";
  downloadBtn.classList.remove("active");
  downloadBtn.style.cursor = "not-allowed";

  startRecordingTimer();
}

function stopRecording() {
  if (!isRecording) return;

  isRecording = false;
  clearInterval(recordInterval);

  recordButton.textContent = "Record";
  recordButton.disabled = false;
  recordButton.style.opacity = "1";
  recordButton.classList.remove("active");
  recordButton.style.cursor = "pointer";

  if (recordedNotes.length > 0) {
    downloadBtn.disabled = false;
    downloadBtn.style.opacity = "1";
    downloadBtn.style.cursor = "pointer";
  } else {
    downloadBtn.disabled = true;
    downloadBtn.style.opacity = "0.5";
    downloadBtn.style.cursor = "not-allowed";
  }
}

function startRecordingTimer() {
  let seconds = 0;
  let isDotVisible = true;

  recordInterval = setInterval(() => {
    seconds++;
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    const formattedTime = `${minutes}:${sec.toString().padStart(2, "0")}`;

    isDotVisible = !isDotVisible;
    recordButton.textContent = `${
      isDotVisible ? "🔴" : "⚪️"
    } ${formattedTime}`;
  }, 1000);
}

// Update note duration
function updateNoteDuration(note) {
  for (let i = recordedNotes.length - 1; i >= 0; i--) {
    if (recordedNotes[i].key === note && recordedNotes[i].duration === 0) {
      recordedNotes[i].duration =
        performance.now() - startTime - recordedNotes[i].startTime;
      break;
    }
  }
}

// Download recording
function downloadRecording() {
  const recording = {
    name: "My Song",
    duration: recordedNotes.length
      ? Math.max(...recordedNotes.map((n) => n.startTime + n.duration))
      : 0,
    notes: recordedNotes,
  };

  const blob = new Blob([JSON.stringify(recording, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${recording.name}.json`;
  link.click();
  downloadBtn.classList.add("active");
  downloadBtn.style.cursor = "pointer";
}

//Prepared Mode elements
const fileInput = document.getElementById("fileInput");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const speedControl = document.getElementById("speed");
const progressBar = document.getElementById("progressBar");

let loadedNotes = [];
let playbackIndex = 0;
let playbackStartTime = 0;
let isPlaying = false;
let playbackTimeout;
let playbackSpeed = 1;

fileInput.addEventListener("change", handleFileUpload);
playBtn.addEventListener("click", togglePlayPause);
stopBtn.addEventListener("click", stopPlayback);
speedControl.addEventListener("input", updateSpeed);

//Read choose file
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const jsonData = JSON.parse(e.target.result);
      if (validateRecording(jsonData)) {
        loadedNotes = jsonData.notes;
        resetPlayback();
      } else {
        alert("Invalid file format or incorrect timing!");
      }
    } catch {
      alert("Error parsing the file!");
    }
  };
  reader.readAsText(file);
}

//Validate JSON file
function validateRecording(jsonData) {
  if (
    typeof jsonData !== "object" ||
    !jsonData ||
    typeof jsonData.name !== "string" ||
    typeof jsonData.duration !== "number" ||
    jsonData.duration < 0 ||
    !Array.isArray(jsonData.notes) ||
    jsonData.notes.length === 0
  ) {
    alert("Invalid file format!");
    return false;
  }

  const validKeys = new Set(Object.values(keyToNoteMap));
  let maxEndTime = 0;
  for (let i = 1; i < jsonData.notes.length; i++) {
    if (jsonData.notes[i].startTime < jsonData.notes[i - 1].startTime) {
      alert("Invalid file format!");
      return false;
    }
  }

  for (const note of jsonData.notes) {
    if (
      typeof note !== "object" ||
      typeof note.key !== "string" ||
      !validKeys.has(note.key) ||
      typeof note.startTime !== "number" ||
      note.startTime < 0 ||
      typeof note.duration !== "number" ||
      note.duration < 0
    ) {
      alert("Invalid file format!");
      return false;
    }
    const noteEndTime = note.startTime + note.duration;
    maxEndTime = Math.max(maxEndTime, noteEndTime);
  }

  if (maxEndTime > jsonData.duration) {
    alert("Invalid file format!");
    return false;
  }

  return true;
}

//change button play/pause
function togglePlayPause() {
  if (isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  if (loadedNotes.length === 0) return;
  isPlaying = true;
  playBtn.textContent = "Pause";
  playbackStartTime =
    performance.now() - (loadedNotes[playbackIndex]?.startTime || 0);
  scheduleNextNote();
}

function pausePlayback() {
  isPlaying = false;
  playBtn.textContent = "Play";
  clearTimeout(playbackTimeout);
}

function stopPlayback() {
  isPlaying = false;
  playbackIndex = 0;
  playBtn.textContent = "Play";
  clearTimeout(playbackTimeout);
  resetPlayback();
}

function scheduleNextNote() {
  if (!isPlaying || playbackIndex >= loadedNotes.length) {
    stopPlayback();
    return;
  }

  const currentNote = loadedNotes[playbackIndex];
  const adjustedStartTime = currentNote.startTime / playbackSpeed;
  const timeOffset =
    adjustedStartTime - (performance.now() - playbackStartTime);

  playbackTimeout = setTimeout(() => {
    playNoteFromPlayback(currentNote);
    playbackIndex++;
    progressBar.value = playbackIndex / loadedNotes.length;
    scheduleNextNote();
  }, Math.max(timeOffset, 0));
}

function playNoteFromPlayback(note) {
  const keyElement = document.querySelector(`.key[data-note="${note.key}"]`);
  if (keyElement) {
    keyElement.classList.add("active");
    setTimeout(
      () => keyElement.classList.remove("active"),
      note.duration / playbackSpeed
    );
  }
  player.playNote(note.key);
}
//Speed
function updateSpeed() {
  let newSpeed = parseFloat(this.value);
  if (newSpeed < 0.5) {
    newSpeed = 0.5;
    this.value = 0.5;
  } else if (newSpeed > 2) {
    newSpeed = 2;
    this.value = 2;
  }

  playbackSpeed = newSpeed;
  if (isPlaying) {
    pausePlayback();
    startPlayback();
  }
}

function resetPlayback() {
  progressBar.value = 0;
  playbackIndex = 0;
}
