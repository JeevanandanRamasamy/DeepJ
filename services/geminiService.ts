import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Blob as GeminiBlob, Content } from "@google/genai";
import { MusicSuggestion } from "../types";
import musicData from '../music/music_data.json';
import { throttle } from '../lib/throttle';

console.log("[GeminiService] Module loaded");

export interface GeminiSession {
    sendRealtimeInput: (input: { media: GeminiBlob }) => void;
    close: () => void;
}

// Stage 1: Mood detection function declaration for Live API
const detectMoodFunctionDeclaration: FunctionDeclaration = {
    name: 'reportMood',
    description: 'Report the detected mood and energy level of the room based on audio and video analysis.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            mood: {
                type: Type.STRING,
                description: 'The overall mood of the room.',
                enum: ['chilling', 'focusing', 'partying', 'happy', 'sad']
            },
            energyLevel: {
                type: Type.NUMBER,
                description: 'A score from 1 (very low) to 10 (very high) representing the room\'s energy.'
            },
            confidence: {
                type: Type.NUMBER,
                description: 'Confidence level in the mood assessment, from 0 to 1.'
            }
        },
        required: ['mood', 'energyLevel', 'confidence']
    }
};

// Stage 2: Song selection happens via standard Gemini API
async function selectGenresForMood(
    mood: string,
    energyLevel: number,
    apiKey: string
): Promise<string[]> {
    console.log(`[GeminiService] 🎯 Selecting genres for mood: ${mood}, energy: ${energyLevel}`);

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert DJ. Based on the following mood and energy level, select the most appropriate genres from the given list:

Mood: ${mood}
Energy Level: ${energyLevel}/10

Genres:
- rock: High-energy guitar-driven music with strong rhythms (partying, happy)
- pop: Mainstream, catchy music designed for broad appeal (happy, partying, chilling)
- rap: Rhythmic spoken lyrics over beats, often with strong bass (partying, focusing, happy)
- indie pop: Alternative pop music with artistic and independent sensibilities (happy, chilling, focusing)
- classical: Traditional orchestral and instrumental compositions (focusing, chilling, sad)
- country: Folk-influenced music often featuring guitar, banjo, and storytelling (chilling, happy, sad)
- jazz: Improvisational music with complex harmonies and syncopated rhythms (chilling, focusing, happy)
- indie rock: Alternative rock music with independent, non-mainstream approach (focusing, chilling, happy)
- metal: Heavy, intense music with distorted guitars and powerful vocals (partying, focusing)
- electronic: Synthesized and computer-generated music with digital beats (partying, focusing, chilling)

Respond with ONLY an array of genres from the list above, nothing else.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
        }
    });

    const genres = JSON.parse(response.text) as string[];
    console.log(`[GeminiService] ✓ Selected genres: ${genres}`);

    return genres;
}

// Throttled version of song selection - allows at most one call per 30 seconds
const throttledSongSelection = throttle(
    async (
        mood: string,
        energyLevel: number,
        apiKey: string,
        onSuggestion: (suggestion: MusicSuggestion) => void,
        currentSession: any,
        fc: any
    ) => {
        console.log(`[GeminiService] 🎵 Throttled song selection executing for mood: ${mood}`);

        try {
            const genres = await selectGenresForMood(mood, energyLevel, apiKey);
            console.log(`[GeminiService] ✓ Selected genres: ${genres}`);

            const genre = genres[Math.floor(Math.random() * genres.length)];
            console.log(`[GeminiService] 🎯 Chosen genre for track selection: ${genre}`);

            const track = musicData[genre][Math.floor(Math.random() * musicData[genre].length)]["name"];
            const trackFilename = `${genre}/${track}.mp3`;

            // Create the suggestion object
            const suggestion: MusicSuggestion = {
                mood: mood as MusicSuggestion['mood'],
                energyLevel,
                trackFilename
            };

            console.log("[GeminiService] 🎵 Song selected:", suggestion);
            onSuggestion(suggestion);

            // Send response to Live API
            if (currentSession) {
                try {
                    await currentSession.sendToolResponse({
                        functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: 'Mood acknowledged.' }
                        }
                    });
                    console.log("[GeminiService] ✓ Tool response sent");
                } catch (error) {
                    console.error("[GeminiService] ✗ Error sending tool response:", error);
                    console.log("[GeminiService] This might indicate the session closed, will reconnect on next attempt");
                }
            }
        } catch (error) {
            console.error("[GeminiService] ✗ Error selecting song:", error);
        }
    },
    30000 // 30 seconds
);

const createSystemInstruction = (): Content => {
    console.log("[GeminiService] Creating system instruction for mood detection");
    return {
        role: "user",
        parts: [{
            text: `You are an AI sentiment analyzer for a DJ system. Your task is to analyze a real-time stream of audio and video from a gathering.
        
        Based on the visual and audio cues, determine the collective mood and energy level.
        When you have a confident assessment of the current mood, call the 'reportMood' function.
        
        Guidelines:
        - Wait for the mood to stabilize before reporting. Analyze for at least 10-20 seconds initially.
        - If the scene is quiet with minimal activity, suggest 'chilling' mood.
        - If people are focused on their work, typing on their laptop, reading, or studying, suggest 'focusing' mood.
        - If you see high energy, dancing, or loud music, suggest 'partying' mood.
        - If you detect generally positive expressions, suggest 'happy' mood.
        - If you detect generally negative expressions, suggest 'sad' mood.
        - Report changes in mood when they are significant and sustained.
        - Only call the function when you are confident (confidence > 0.7).
        
        Only report the mood and energy level, and nothing else.`
        }]
    };
};

export async function connectToGemini(
    stream: MediaStream,
    tracklist: string[],
    onSuggestion: (suggestion: MusicSuggestion) => void
): Promise<GeminiSession> {
    console.log("[GeminiService] connectToGemini called with", tracklist.length, "tracks");
    console.log("[GeminiService] Stage 1: Setting up Live API for mood detection");
    console.log("[GeminiService] Stage 2: Will use standard API for song selection");

    const apiKey = "AIzaSyBBYn1cDAkLx_OPgDHj4Yeka9r6A6pY1s0"; // WE KNOW THIS IS CURSED BUT IT'S A DEMO
    if (!apiKey) {
        console.error("[GeminiService] VITE_GEMINI_API_KEY environment variable not set in the client bundle");
    }
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = createSystemInstruction();

    console.log("[GeminiService] Initiating Live API connection for mood detection...");

    // Track connection state and reconnection
    let isSessionOpen = false;
    let sessionClosed = false;
    let currentSession: any = null;
    let shouldReconnect = true;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY_MS = 2000;

    // Track last detected mood to avoid redundant API calls
    let lastMood: string | null = null;

    // Function to create a new Live API session
    const createSession = async (): Promise<any> => {
        console.log(`[GeminiService] ${reconnectAttempts > 0 ? `🔄 Reconnecting (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...` : 'Creating new session...'}`);

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO], // Required but we will ignore audio output
                tools: [{ functionDeclarations: [detectMoodFunctionDeclaration] }],
                systemInstruction
            },
            callbacks: {
                onopen: () => {
                    isSessionOpen = true;
                    sessionClosed = false;
                    reconnectAttempts = 0;
                    console.log("[GeminiService] ✓ Live API session opened successfully");
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Filter logging: only log tool calls and non-audio content to reduce console noise
                    if (message.toolCall) {
                        console.log("[GeminiService] 📊 Mood detection function call received");
                        for (const fc of message.toolCall.functionCalls) {
                            if (fc.name === 'reportMood') {
                                const { mood, energyLevel, confidence } = fc.args as { mood: string; energyLevel: number; confidence: number };
                                console.log(`[GeminiService] Detected - Mood: ${mood}, Energy: ${energyLevel}, Confidence: ${confidence}`);

                                // Check if mood has changed since last detection
                                if (lastMood === mood) {
                                    console.log(`[GeminiService] 🔄 Mood unchanged (still ${mood}), skipping song selection`);

                                    // Still acknowledge the mood to the Live API
                                    if (currentSession) {
                                        try {
                                            await currentSession.sendToolResponse({
                                                functionResponses: {
                                                    id: fc.id,
                                                    name: fc.name,
                                                    response: { result: 'Mood acknowledged, no change detected.' }
                                                }
                                            });
                                            console.log("[GeminiService] ✓ Tool response sent (no change)");
                                        } catch (error) {
                                            console.error("[GeminiService] ✗ Error sending tool response:", error);
                                        }
                                    }
                                    return; // Skip the rest of the logic
                                }

                                // Mood has changed - update tracking and proceed with song selection
                                console.log(`[GeminiService] 🎭 Mood changed: ${lastMood || 'none'} → ${mood}`);
                                lastMood = mood;

                                // Stage 2: Select genres (throttled to once per 30 seconds)
                                throttledSongSelection(mood, energyLevel, apiKey, onSuggestion, currentSession, fc);
                            }
                        }
                    }
                },
                onerror: (e: ErrorEvent) => {
                    isSessionOpen = false;
                    console.error("[GeminiService] ✗ Error from Gemini session:", e);
                    // Trigger reconnection
                    if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        setTimeout(() => attemptReconnect(), RECONNECT_DELAY_MS);
                    }
                },
                onclose: () => {
                    isSessionOpen = false;
                    sessionClosed = true;
                    console.log("[GeminiService] ⚠️ Session closed");
                    // Trigger reconnection
                    if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        setTimeout(() => attemptReconnect(), RECONNECT_DELAY_MS);
                    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                        console.error("[GeminiService] ✗ Max reconnection attempts reached. Giving up.");
                    }
                },
            }
        });

        return await sessionPromise;
    };

    // Function to handle reconnection
    const attemptReconnect = async () => {
        if (!shouldReconnect) {
            console.log("[GeminiService] Reconnection disabled, not reconnecting");
            return;
        }

        reconnectAttempts++;

        if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            console.error("[GeminiService] ✗ Max reconnection attempts exceeded");
            return;
        }

        try {
            console.log(`[GeminiService] 🔄 Attempting to reconnect... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            currentSession = await createSession();
            console.log("[GeminiService] ✓ Reconnection successful!");
        } catch (error) {
            console.error("[GeminiService] ✗ Reconnection failed:", error);
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => attemptReconnect(), RECONNECT_DELAY_MS);
            }
        }
    };

    // Create initial session
    currentSession = await createSession();
    console.log("[GeminiService] Session object received");

    // Safe wrapper for sendRealtimeInput that checks connection state
    const safeSendRealtimeInput = (input: { media: GeminiBlob }) => {
        if (!isSessionOpen || sessionClosed || !currentSession) {
            console.warn("[GeminiService] ⚠️ Attempted to send data but session is not open. Skipping.");
            return;
        }
        try {
            currentSession.sendRealtimeInput(input);
        } catch (error) {
            console.error("[GeminiService] ✗ Error sending realtime input:", error);
            isSessionOpen = false;
            // Trigger reconnection
            if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => attemptReconnect(), RECONNECT_DELAY_MS);
            }
        }
    };

    // --- Audio Streaming ---
    console.log("[GeminiService] Setting up audio streaming...");
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioSource = audioContext.createMediaStreamSource(stream);
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    let audioChunkCount = 0;
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        audioChunkCount++;
        safeSendRealtimeInput({ media: pcmBlob });
    };
    audioSource.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);
    console.log("[GeminiService] ✓ Audio streaming setup complete");

    // --- Video Streaming ---
    console.log("[GeminiService] Setting up video streaming...");
    const canvas = document.createElement('canvas');
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.muted = true;
    videoElement.play().catch(e => console.error("[GeminiService] Video play failed:", e));

    let videoFrameCount = 0;
    const videoInterval = setInterval(() => {
        if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        videoFrameCount++;

                        const base64Data = await blobToBase64(blob);
                        safeSendRealtimeInput({
                            media: { data: base64Data, mimeType: 'image/jpeg' }
                        });
                    }
                }, 'image/jpeg', 0.7);
            }
        }
    }, 1000); // Send a frame every second
    console.log("[GeminiService] ✓ Video streaming setup complete (interval set)");

    return {
        sendRealtimeInput: safeSendRealtimeInput,
        close: () => {
            console.log("[GeminiService] Closing session and cleaning up...");
            shouldReconnect = false; // Disable reconnection when user explicitly closes
            isSessionOpen = false;
            sessionClosed = true;
            clearInterval(videoInterval);
            scriptProcessor.disconnect();
            audioSource.disconnect();
            audioContext.close();
            if (currentSession) {
                currentSession.close();
            }
            console.log("[GeminiService] ✓ Cleanup complete. Audio chunks sent:", audioChunkCount, "Video frames sent:", videoFrameCount);
        }
    };
}


// Helper functions
function createPcmBlob(data: Float32Array): GeminiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => {
            console.error("[GeminiService] blobToBase64 conversion failed:", error);
            reject(error);
        };
        reader.readAsDataURL(blob);
    });
}
