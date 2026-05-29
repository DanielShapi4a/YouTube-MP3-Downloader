// Web Audio API Retro Synthwave Melody Synthesizer

class CarTuneSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private nodes: AudioNode[] = [];
  private intervalId: any = null;

  // Polyphonic / rhythmic retro sequence matching the song's vibe
  public play(title: string, artist: string) {
    if (this.isPlaying) {
      this.stop();
    }

    try {
      // Initialize AudioContext safely on user action
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.isPlaying = true;

      // Create a master volume control
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime); // keep comfortable volume
      masterGain.connect(this.ctx.destination);
      this.nodes.push(masterGain);

      // Create a warm lowpass filter for synthwave texture
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(800, this.ctx.currentTime);
      lowpass.Q.setValueAtTime(4, this.ctx.currentTime);
      lowpass.connect(masterGain);
      this.nodes.push(lowpass);

      // Sub-Bass drone node
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = "sawtooth";
      // Determine root note from title/artist length
      const rootChar = (title.length + artist.length) % 12;
      const bassFreqs = [55.00, 58.27, 65.41, 73.42, 82.41, 87.31, 98.00, 110.0]; // A1, A#1, C2, etc
      const rootFreq = bassFreqs[rootChar % bassFreqs.length];

      bassOsc.frequency.setValueAtTime(rootFreq, this.ctx.currentTime);
      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      bassOsc.connect(bassGain);
      bassGain.connect(lowpass);
      bassOsc.start();
      this.nodes.push(bassOsc, bassGain);

      // Simple Arpeggiator pattern
      const chords = [
        [1, 1.2, 1.5, 1.8], // Major 7ish spacing
        [1, 1.18, 1.5, 1.78], // Minor 7ish spacing
        [1, 1.25, 1.5, 1.9] // Lydian feel
      ];
      const selectedChord = chords[(title.length) % chords.length];
      let step = 0;

      const triggerArpeggio = () => {
        if (!this.ctx || this.ctx.state === "closed" || !this.isPlaying) return;

        const now = this.ctx.currentTime;
        const multiplier = selectedChord[step % selectedChord.length];
        const pitch = rootFreq * 4 * multiplier; // High octave arpeggios

        // Oscillator for lead
        const leadOsc = this.ctx.createOscillator();
        leadOsc.type = "triangle";
        leadOsc.frequency.setValueAtTime(pitch, now);

        // Add interesting frequency glide (retro pitch sweep)
        leadOsc.frequency.exponentialRampToValueAtTime(pitch * 0.98, now + 0.15);

        // Individual note envelope
        const leadGain = this.ctx.createGain();
        leadGain.gain.setValueAtTime(0.0, now);
        leadGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        leadOsc.connect(leadGain);
        leadGain.connect(lowpass);
        leadOsc.start(now);
        leadOsc.stop(now + 0.4);

        step++;
      };

      // Trigger chord notes rhythmically
      triggerArpeggio();
      this.intervalId = setInterval(triggerArpeggio, 250);

    } catch (e) {
      console.error("Audio Synthesis initialization failed:", e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.nodes.forEach(node => {
      try {
        (node as any).stop?.();
        node.disconnect();
      } catch (err) {}
    });
    this.nodes = [];

    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const SynthPlayer = new CarTuneSynthesizer();
