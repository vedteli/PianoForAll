// Virtual Piano Application
// Pure JavaScript using Web Audio API for sound generation

class VirtualPiano {
    constructor() {
        // Audio Context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.5;
        this.isPlaying = false;
        this.currentPlayingScale = null;

        // Playback settings
        this.playbackSpeed = 'normal'; // slow, normal, fast
        this.speedDelays = {
            slow: 800,
            normal: 500,
            fast: 300
        };

        // Piano notes configuration (C4 to B5 - 2 octaves)
        this.notes = [
            // Octave 1
            { name: 'C', frequency: 261.63, isBlack: false, octave: 4 },
            { name: 'C#', frequency: 277.18, isBlack: true, octave: 4 },
            { name: 'D', frequency: 293.66, isBlack: false, octave: 4 },
            { name: 'D#', frequency: 311.13, isBlack: true, octave: 4 },
            { name: 'E', frequency: 329.63, isBlack: false, octave: 4 },
            { name: 'F', frequency: 349.23, isBlack: false, octave: 4 },
            { name: 'F#', frequency: 369.99, isBlack: true, octave: 4 },
            { name: 'G', frequency: 392.00, isBlack: false, octave: 4 },
            { name: 'G#', frequency: 415.30, isBlack: true, octave: 4 },
            { name: 'A', frequency: 440.00, isBlack: false, octave: 4 },
            { name: 'A#', frequency: 466.16, isBlack: true, octave: 4 },
            { name: 'B', frequency: 493.88, isBlack: false, octave: 4 },
            // Octave 2
            { name: 'C', frequency: 523.25, isBlack: false, octave: 5 },
            { name: 'C#', frequency: 554.37, isBlack: true, octave: 5 },
            { name: 'D', frequency: 587.33, isBlack: false, octave: 5 },
            { name: 'D#', frequency: 622.25, isBlack: true, octave: 5 },
            { name: 'E', frequency: 659.25, isBlack: false, octave: 5 },
            { name: 'F', frequency: 698.46, isBlack: false, octave: 5 },
            { name: 'F#', frequency: 739.99, isBlack: true, octave: 5 },
            { name: 'G', frequency: 783.99, isBlack: false, octave: 5 },
            { name: 'G#', frequency: 830.61, isBlack: true, octave: 5 },
            { name: 'A', frequency: 880.00, isBlack: false, octave: 5 },
            { name: 'A#', frequency: 932.33, isBlack: true, octave: 5 },
            { name: 'B', frequency: 987.77, isBlack: false, octave: 5 }
        ];

        // Keyboard mapping
        this.keyboardMap = {
            'a': 0,      // C
            'w': 1,      // C#
            's': 2,      // D
            'e': 3,      // D#
            'd': 4,      // E
            'f': 5,      // F
            't': 6,      // F#
            'g': 7,      // G
            'y': 8,      // G#
            'h': 9,      // A
            'u': 10,     // A#
            'j': 11      // B
        };

        // Scales definition
        this.scales = {
            'C Major': [0, 2, 4, 5, 7, 9, 11, 12],
            'G Major': [7, 9, 11, 12, 14, 16, 18, 19],
            'D Major': [14, 16, 18, 19, 21, 23, 25, 26],
            'A Major': [21, 23, 25, 26, 28, 30, 32, 33],
            'E Major': [4, 6, 8, 9, 11, 13, 15, 16],
            'F Major': [5, 7, 9, 10, 12, 14, 16, 17],
            'A Minor': [21, 23, 24, 26, 28, 29, 31, 33],
            'D Minor': [14, 16, 17, 19, 21, 22, 24, 26],
            'E Minor': [4, 6, 7, 9, 11, 12, 14, 16],
            'C Minor': [0, 2, 3, 5, 7, 8, 10, 12]
        };

        this.selectedScale = null;
        this.scaleName = null;
        this.activeKeyElements = new Map();

        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.renderPiano();
        this.renderScales();
    }

    setupDOM() {
        this.pianoKeyboardElement = document.getElementById('piano-keyboard');
        this.scaleButtonsElement = document.getElementById('scale-buttons');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeDisplay = document.getElementById('volume-display');
        this.playScaleBtn = document.getElementById('play-scale-btn');
        this.stopScaleBtn = document.getElementById('stop-scale-btn');
        this.replayScaleBtn = document.getElementById('replay-scale-btn');
        this.speedSelector = document.getElementById('speed-selector');
        this.currentScaleDisplay = document.getElementById('current-scale');
    }

    setupEventListeners() {
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e));

        // Piano key clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('piano-key')) {
                const noteIndex = parseInt(e.target.dataset.noteIndex);
                this.playNote(noteIndex);
                this.animateKey(e.target);
            }
        });

        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Scale buttons
        this.playScaleBtn.addEventListener('click', () => this.playSelectedScale());
        this.stopScaleBtn.addEventListener('click', () => this.stopPlayback());
        this.replayScaleBtn.addEventListener('click', () => this.playSelectedScale());
        this.speedSelector.addEventListener('change', (e) => this.handleSpeedChange(e));
    }

    renderPiano() {
        this.pianoKeyboardElement.innerHTML = '';
        this.activeKeyElements.clear();

        this.notes.forEach((note, index) => {
            const keyElement = document.createElement('div');
            keyElement.className = `piano-key ${note.isBlack ? 'black' : 'white'}`;
            keyElement.dataset.noteIndex = index;
            
            // Display note name
            if (note.octave === 4) {
                keyElement.textContent = note.name;
            } else {
                keyElement.textContent = `${note.name}\n${note.octave}`;
            }
            
            keyElement.title = `${note.name}${note.octave} (${note.frequency.toFixed(2)}Hz)`;
            this.pianoKeyboardElement.appendChild(keyElement);
            this.activeKeyElements.set(index, keyElement);
        });
    }

    renderScales() {
        this.scaleButtonsElement.innerHTML = '';

        Object.keys(this.scales).forEach(scaleName => {
            const btn = document.createElement('button');
            btn.className = 'scale-btn';
            btn.textContent = scaleName;
            btn.addEventListener('click', () => this.selectScale(scaleName));
            this.scaleButtonsElement.appendChild(btn);
        });
    }

    selectScale(scaleName) {
        // Update UI
        document.querySelectorAll('.scale-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Store selected scale
        this.scaleName = scaleName;
        this.selectedScale = this.scales[scaleName];
        
        // Update display
        const noteNames = this.selectedScale.map((idx, i) => {
            if (i < this.selectedScale.length - 1) {
                return this.notes[idx].name;
            }
            return this.notes[idx].name;
        }).join(' → ');
        
        this.currentScaleDisplay.textContent = `${scaleName}: ${noteNames}`;
    }

    playSelectedScale() {
        if (!this.selectedScale) {
            alert('Please select a scale first!');
            return;
        }

        this.isPlaying = true;
        this.updatePlaybackUI();
        this.playScale();
    }

    async playScale() {
        const delay = this.speedDelays[this.playbackSpeed];

        for (const noteIndex of this.selectedScale) {
            if (!this.isPlaying) break;

            // Play note
            this.playNote(noteIndex);
            
            // Animate key
            const keyElement = this.activeKeyElements.get(noteIndex);
            if (keyElement) {
                this.animateKey(keyElement);
            }

            // Wait before next note
            await this.sleep(delay);
        }

        this.isPlaying = false;
        this.updatePlaybackUI();
    }

    playNote(noteIndex) {
        const note = this.notes[noteIndex];
        const now = this.audioContext.currentTime;
        
        // Create oscillator
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        // Connect
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        // Configure
        osc.frequency.value = note.frequency;
        osc.type = 'sine'; // Piano-like sine wave
        
        // Envelope (ADSR-like)
        gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        
        // Play
        osc.start(now);
        osc.stop(now + 1.0);
    }

    animateKey(keyElement) {
        keyElement.classList.add('active');
        setTimeout(() => {
            keyElement.classList.remove('active');
        }, 100);
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        if (this.keyboardMap.hasOwnProperty(key)) {
            e.preventDefault();
            const noteIndex = this.keyboardMap[key];
            this.playNote(noteIndex);
            
            const keyElement = this.activeKeyElements.get(noteIndex);
            if (keyElement) {
                this.animateKey(keyElement);
            }
        }
    }

    handleVolumeChange(e) {
        this.masterVolume = parseInt(e.target.value) / 100;
        this.volumeDisplay.textContent = `${e.target.value}%`;
        
        // Update slider background gradient
        const percentage = e.target.value;
        e.target.style.setProperty('--slider-percentage', `${percentage}%`);
    }

    handleSpeedChange(e) {
        this.playbackSpeed = e.target.value;
    }

    stopPlayback() {
        this.isPlaying = false;
        this.updatePlaybackUI();
    }

    updatePlaybackUI() {
        this.playScaleBtn.disabled = this.isPlaying;
        this.stopScaleBtn.disabled = !this.isPlaying;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize piano when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const piano = new VirtualPiano();
});
