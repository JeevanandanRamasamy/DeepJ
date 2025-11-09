import type { PlaybackState, Prompt } from '../types';
import type { AudioChunk, GoogleGenAI, LiveMusicFilteredPrompt, LiveMusicServerMessage, LiveMusicSession } from '@google/genai';
import { decode, decodeAudioData } from './audio';
import { throttle } from './throttle';

export class LiveMusicHelper extends EventTarget {

    private ai: GoogleGenAI;
    private model: string;

    private session: LiveMusicSession | null = null;
    private sessionPromise: Promise<LiveMusicSession> | null = null;

    private connectionError = true;

    private filteredPrompts = new Set<string>();
    private nextStartTime = 0;
    private bufferTime = 2;

    public readonly audioContext: AudioContext;
    public extraDestination: AudioNode | null = null;

    private outputNode: GainNode;
    private playbackState: PlaybackState = 'stopped';

    private prompts: Map<string, Prompt>;

    constructor(ai: GoogleGenAI, model: string) {
        super();
        this.ai = ai;
        this.model = model;
        this.prompts = new Map();
        this.audioContext = new AudioContext({ sampleRate: 48000 });
        this.outputNode = this.audioContext.createGain();
    }

    private getSession(): Promise<LiveMusicSession> {
        if (!this.sessionPromise) this.sessionPromise = this.connect();
        return this.sessionPromise;
    }

    private async connect(): Promise<LiveMusicSession> {
        this.sessionPromise = this.ai.live.music.connect({
            model: this.model,
            callbacks: {
                onmessage: async (e: LiveMusicServerMessage) => {
                    if (e.setupComplete) {
                        this.connectionError = false;
                    }
                    if (e.filteredPrompt) {
                        this.filteredPrompts = new Set([...this.filteredPrompts, e.filteredPrompt.text!])
                        this.dispatchEvent(new CustomEvent<LiveMusicFilteredPrompt>('filtered-prompt', { detail: e.filteredPrompt }));
                    }
                    if (e.serverContent?.audioChunks) {
                        await this.processAudioChunks(e.serverContent.audioChunks);
                    }
                },
                onerror: () => {
                    this.connectionError = true;
                    this.stop();
                    this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
                },
                onclose: () => {
                    this.connectionError = true;
                    this.stop();
                    this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
                },
            },
        });
        return this.sessionPromise;
    }

    private setPlaybackState(state: PlaybackState) {
        this.playbackState = state;
        this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
    }

    private async processAudioChunks(audioChunks: AudioChunk[]) {
        if (this.playbackState === 'paused' || this.playbackState === 'stopped') return;
        const audioBuffer = await decodeAudioData(
            decode(audioChunks[0].data!),
            this.audioContext,
            48000,
            2,
        );
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        if (this.nextStartTime === 0) {
            this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
            setTimeout(() => {
                this.setPlaybackState('playing');
            }, this.bufferTime * 1000);
        }
        if (this.nextStartTime < this.audioContext.currentTime) {
            this.setPlaybackState('loading');
            this.nextStartTime = 0;
            return;
        }
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
    }

    public get activePrompts() {
        return Array.from(this.prompts.values())
            .filter((p) => {
                return !this.filteredPrompts.has(p.text) && p.weight !== 0;
            })
    }

    public readonly setWeightedPrompts = throttle(async (prompts: Map<string, Prompt>) => {
        console.log('[LiveMusicHelper] 🎼 setWeightedPrompts called with:', Array.from(prompts.values()).map(p => p.text));
        this.prompts = prompts;

        if (this.activePrompts.length === 0) {
            console.log('[LiveMusicHelper] ⚠️ No active prompts, pausing');
            this.dispatchEvent(new CustomEvent('error', { detail: 'There needs to be one active prompt to play.' }));
            this.pause();
            return;
        }

        // store the prompts to set later if we haven't connected yet
        // there should be a user interaction before calling setWeightedPrompts
        if (!this.session) {
            console.log('[LiveMusicHelper] ⏸️ No session yet, prompts will be set when play() is called');
            return;
        }

        const weightedPrompts = this.activePrompts.map((p) => {
            return { text: p.text, weight: p.weight };
        });
        console.log('[LiveMusicHelper] 📤 Sending weighted prompts to Lyria:', weightedPrompts);
        try {
            await this.session.setWeightedPrompts({
                weightedPrompts,
            });
            console.log('[LiveMusicHelper] ✅ Prompts successfully sent to Lyria session');
        } catch (e: any) {
            console.error('[LiveMusicHelper] ❌ Error setting prompts:', e);
            this.dispatchEvent(new CustomEvent('error', { detail: e.message }));
            this.pause();
        }
    }, 200);

    public async play() {
        this.setPlaybackState('loading');
        this.session = await this.getSession();
        await this.setWeightedPrompts(this.prompts);
        this.audioContext.resume();
        this.session.play();
        this.outputNode.connect(this.audioContext.destination);
        if (this.extraDestination) this.outputNode.connect(this.extraDestination);
        this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
    }

    public pause() {
        if (this.session) this.session.pause();
        this.setPlaybackState('paused');
        this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
        this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        this.nextStartTime = 0;
        this.outputNode = this.audioContext.createGain();
    }

    public stop() {
        if (this.session) this.session.stop();
        this.setPlaybackState('stopped');
        this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
        this.nextStartTime = 0;
        this.session = null;
        this.sessionPromise = null;
    }

    public async playPause() {
        switch (this.playbackState) {
            case 'playing':
                return this.pause();
            case 'paused':
            case 'stopped':
                return this.play();
            case 'loading':
                return this.stop();
        }
    }

}
