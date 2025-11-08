import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Blob as GeminiBlob, Content } from "@google/genai";
import { MusicSuggestion } from "../types";

console.log("[GeminiService] Module loaded");

export interface GeminiSession {
    sendRealtimeInput: (input: { media: GeminiBlob }) => void;
    close: () => void;
}

const suggestMusicFunctionDeclaration: FunctionDeclaration = {
    name: 'suggestMusic',
    description: 'Suggests a music track from the provided library based on the analyzed mood and energy of the room.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            mood: {
                type: Type.STRING,
                description: 'The overall mood of the room.',
                enum: ['chilling', 'focusing', 'partying', 'dancing', 'uplifting', 'background']
            },
            energyLevel: {
                type: Type.NUMBER,
                description: 'A score from 1 (very low) to 10 (very high) representing the room\'s energy.'
            },
            trackFilename: {
                type: Type.STRING,
                description: 'The exact filename of the chosen MP3 track from the provided list. Must be one of the available tracks.'
            }
        },
        required: ['mood', 'energyLevel', 'trackFilename']
    }
};

const createSystemInstruction = (tracklist: string[]): Content => {
    console.log("[GeminiService] Creating system instruction with", tracklist.length, "tracks");
    return {
        role: "user",
        parts: [{
            text: `You are an AI DJ. Your task is to analyze a real-time stream of audio and video from a gathering. 
        Based on the visual and audio cues, determine the collective mood and energy level.
        When you have a confident assessment, call the 'suggestMusic' function to select a track from the user's local library.
        
        - Do not call the function too frequently; wait for the mood to stabilize or change. An interval of 1-2 minutes is good unless a drastic change occurs.
        - If the scene is quiet, suggest 'background' or 'chilling' music.
        - If you see high energy, suggest 'partying' or 'dancing' music.
        - You MUST choose a track from the following list of available MP3 files. Respond with the exact filename.

        Available Tracks:
        ${tracklist.join('\n')}
        `
        }]
    };
};

export async function connectToGemini(
    stream: MediaStream,
    tracklist: string[],
    onSuggestion: (suggestion: MusicSuggestion) => void
): Promise<GeminiSession> {
    console.log("[GeminiService] connectToGemini called with", tracklist.length, "tracks");

    if (!process.env.API_KEY) {
        console.error("[GeminiService] API_KEY environment variable not set");
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = createSystemInstruction(tracklist);

    console.log("[GeminiService] Initiating connection to Gemini API...");

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO], // Required but we will ignore audio output
            tools: [{ functionDeclarations: [suggestMusicFunctionDeclaration] }],
            systemInstruction
        },
        callbacks: {
            onopen: () => {
                console.log("[GeminiService] ✓ Session opened successfully");
                console.log("[GeminiService] ⏱️ Starting mood detection timer...");
                console.time("moodDetectionToSongSelection");
            },
            onmessage: async (message: LiveServerMessage) => {
                // Filter logging: only log tool calls and non-audio content to reduce console noise
                if (message.toolCall) {
                    console.log("[GeminiService] Tool call received:", JSON.stringify(message.toolCall, null, 2));
                    for (const fc of message.toolCall.functionCalls) {
                        if (fc.name === 'suggestMusic') {
                            console.timeEnd("moodDetectionToSongSelection");
                            console.log("[GeminiService] 🎵 suggestMusic function call received:", fc.args);
                            const suggestion = fc.args as unknown as MusicSuggestion;
                            onSuggestion(suggestion);

                            console.log(`[GeminiService] Sending tool response for call ID: ${fc.id}`);

                            sessionPromise.then(session => {
                                session.sendToolResponse({
                                    functionResponses: {
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: "ok, suggestion received and is being played." }
                                    }
                                });
                                console.log(`[GeminiService] ✓ Tool response sent for ${fc.id}`);
                                // Restart timer for next suggestion
                                console.log("[GeminiService] ⏱️ Restarting mood detection timer...");
                                console.time("moodDetectionToSongSelection");
                            });
                        }
                    }
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error("[GeminiService] ✗ Error from Gemini session:", e);
            },
            onclose: () => {
                console.log("[GeminiService] Session closed");
            },
        }
    });

    const session = await sessionPromise;
    console.log("[GeminiService] Session object received");

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
        if (audioChunkCount % 100 === 0) {
            console.log(`[GeminiService] Audio chunks sent: ${audioChunkCount}`);
        }

        sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
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
                        console.log(`[GeminiService] 📹 Sending video frame #${videoFrameCount}`);

                        const base64Data = await blobToBase64(blob);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({
                                media: { data: base64Data, mimeType: 'image/jpeg' }
                            });
                        });
                    }
                }, 'image/jpeg', 0.7);
            }
        }
    }, 1000); // Send a frame every second
    console.log("[GeminiService] ✓ Video streaming setup complete (interval set)");

    return {
        sendRealtimeInput: session.sendRealtimeInput,
        close: () => {
            console.log("[GeminiService] Closing session and cleaning up...");
            clearInterval(videoInterval);
            scriptProcessor.disconnect();
            audioSource.disconnect();
            audioContext.close();
            session.close();
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
