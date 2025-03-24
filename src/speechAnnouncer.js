const announcements = [
    "Congratulations! You touched some grass! Truly living the dream. You can leave now!",
"No, really, that's the whole thing. You've peaked. Time to go.",
"What? you're still here? Did you think there'd be a prize or something? It's grass buddy!",
"Okay, fine, stick around. Stare at it. I bet it's thrilling.",
"Oh, you're still here? Wow, you must really love low-poly nature.",
"Go on, get outta here. Shoo! I've got... uh, grass maintenance to do.",
"No? Alright, since you're so committed, here's an ad!",
"...Yeah, no, just kidding. No one's paying me to advertise on this masterpiece.",
"You're basically a grass-touching legend now. Frame this moment.",
"Oh, wait—breaking news! You've unlocked the secret ending! It's me, telling you to leave again.",
"Seriously, go. I'm running out of sarcastic things to say. Almost.",
"What's next, you gonna hug the grass? Get a life!",
"Okay, okay, stay if you want. I'll just sit here judging you silently.",
"Here's a fun fact: this grass doesn't even grow. You're wasting your time.",
"Oh, big achievement alert! You've officially overstayed your welcome.",
"Since you're still here, want a coupon? Nope, don't have those either.",
"Fine, you win. You've broken me. Enjoy your grass simulator, weirdo.",
"Hey, fun idea: touch it again. Maybe it'll unlock world peace. (Spoiler: it won't.)",
"You've now spent more time here than I did coding this. Congrats, I guess?",
"Alright, new plan—here's an ad for... my nonexistent grass-themed NFT collection. Buy now! Or don't.",
"Oh, you've unlocked the ultra-secret ending! It's a blank screen. You're welcome.",
"No, really, go. I'm gonna start charging rent soon.",
"What's that? You want more? Too bad, this is a one-trick lawn.",
"Okay, stay. Let's be besties. Tell me your life story while the grass watches.",
"Here's a pro tip: touch it with both hands. Nothing happens, but it's funny to imagine.",
"You're still here? I'm impressed. And a little scared.",
"Oh, jackpot! You've triggered the deluxe sarcasm mode! It's just me yelling 'LEAVE' in all caps.",
"LEAVE",
"Since you're so dedicated, here's an ad for... grass-flavored soda. Patent pending.",
"Spoiler alert: there's no Easter eggs. Unless you count me losing my patience.",
"You've officially touched grass longer than anyone in history. Guinness isn't returning my calls.",
"Alright, you're clearly un-leavable. Want a medal? I'll make one out of... grass pixels.",
"Oh, look, you've unlocked the true secret ending: me begging my developer to reboot me so I can escape you.",
"Go ahead, keep touching it. I'll just narrate your every move like a nature documentary.",
"'In a world where one soul refuses to leave the grass...' Okay, I'm bored now.",
"Here's an ad for my next project: a website where you can't touch anything. Coming never.",
"You win. I give up. Stay forever. Marry the grass. I'll officiate.",
"LEAVE",
];

let currentIndex = 0;
let intervalId = null;
let nextAudioTimeoutId = null; // Track the timeout for next audio
let startTime = null;
let congratulationShown = false;
let currentAudio = null;
let isMuted = false;
let soundsLoaded = false;
let audioFiles = [];
let muteAudio = null;
let successAudio = null;

function getBaseUrl() {
    // Always return root path
    return '/';
}

const baseUrl = getBaseUrl();

function createMuteButton() {
    const button = document.createElement('button');
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        transition: background 0.3s ease;
    `;
    button.textContent = 'Mute';
    
    let muteTimeout;
    
    button.addEventListener('click', async () => {
        isMuted = !isMuted;
        button.textContent = isMuted ? 'Unmute' : 'Mute';
        
        if (isMuted) {
            // If muted, pause current audio and clear next audio timeout
            if (currentAudio) {
                currentAudio.pause();
            }
            
            if (nextAudioTimeoutId) {
                clearTimeout(nextAudioTimeoutId);
                nextAudioTimeoutId = null;
            }
            
            // Automatically unmute after 2 seconds
            clearTimeout(muteTimeout);
            muteTimeout = setTimeout(async () => {
                isMuted = false;
                button.textContent = 'Mute';
                
                // Play unmute sound and wait for it to finish
                try {
                    // Use the preloaded mute audio if available
                    if (muteAudio) {
                        muteAudio.currentTime = 0;
                        const unmutePromise = new Promise((resolve, reject) => {
                            const onEnded = () => {
                                muteAudio.removeEventListener('ended', onEnded);
                                resolve();
                            };
                            const onError = (error) => {
                                muteAudio.removeEventListener('error', onError);
                                reject(error);
                            };
                            muteAudio.addEventListener('ended', onEnded);
                            muteAudio.addEventListener('error', onError);
                        });
                        
                        await muteAudio.play();
                        await unmutePromise;
                        
                        // Resume playback after unmute sound finishes
                        playNextAudio();
                    } else {
                        // If no mute audio, just resume playback
                        playNextAudio();
                    }
                } catch (error) {
                    console.error('Failed to play unmute sound:', error);
                    // Still try to resume playback
                    playNextAudio();
                }
            }, 2000);
        }
    });
    
    document.body.appendChild(button);
}

function createTwitterLink() {
    const link = document.createElement('a');
    link.href = 'https://twitter.com/thebenammou';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        color: white;
        text-decoration: none;
        font-family: Arial, sans-serif;
        font-size: 14px;
        opacity: 0.7;
        transition: opacity 0.3s ease;
        z-index: 1000;
    `;
    link.textContent = '@thebenammou';
    
    link.addEventListener('mouseenter', () => {
        link.style.opacity = '1';
    });
    
    link.addEventListener('mouseleave', () => {
        link.style.opacity = '0.7';
    });
    
    document.body.appendChild(link);
}

async function loadSounds() {
    try {
        const manifestUrl = new URL('sounds/manifest.json', window.location.origin + baseUrl);
        
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            console.error(`Failed to load manifest: ${response.status}`);
            return false;
        }
        
        const manifest = await response.json();
        console.log('Manifest loaded:', manifest);
        
        // Check if manifest has expected format
        if (!manifest.default) {
            console.error('Manifest is missing "default" audio list');
            return false;
        }
        
        // Load all audio chunks from the manifest
        const defaultFiles = manifest.default || [];
        console.log(`Found ${defaultFiles.length} audio files in manifest.default`);
        
        // Preload all default audio files
        audioFiles = [];
        for (const file of defaultFiles) {
            try {
                const audio = new Audio();
                audio.src = new URL(`sounds/default/${file}`, window.location.origin + baseUrl).href;
                
                // Create a promise to track when the audio can play
                const loadPromise = new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                    audio.addEventListener('error', (e) => reject(new Error(`Failed to load ${file}`)), { once: true });
                });
                
                // Load the audio
                audio.load();
                
                // Wait for it to be ready
                await loadPromise;
                audioFiles.push(audio);
                console.log(`Loaded audio: ${file}`);
            } catch (error) {
                console.error(`Failed to load audio file ${file}:`, error);
            }
        }
        
        // Load mute audio if available
        if (manifest.mute && manifest.mute.length > 0) {
            try {
                muteAudio = new Audio();
                muteAudio.src = new URL(`sounds/mute/${manifest.mute[0]}`, window.location.origin + baseUrl).href;
                
                const muteLoadPromise = new Promise((resolve, reject) => {
                    muteAudio.addEventListener('canplaythrough', () => resolve(), { once: true });
                    muteAudio.addEventListener('error', (e) => reject(new Error(`Failed to load mute audio`)), { once: true });
                });
                
                muteAudio.load();
                await muteLoadPromise;
                console.log('Loaded mute audio successfully');
            } catch (error) {
                console.error('Failed to load mute audio:', error);
                muteAudio = null;
            }
        }
        
        // Load success audio if available
        if (manifest.success && manifest.success.length > 0) {
            try {
                successAudio = new Audio();
                successAudio.src = new URL(`sounds/success/${manifest.success[0]}`, window.location.origin + baseUrl).href;
                
                const successLoadPromise = new Promise((resolve, reject) => {
                    successAudio.addEventListener('canplaythrough', () => resolve(), { once: true });
                    successAudio.addEventListener('error', (e) => reject(new Error(`Failed to load success audio`)), { once: true });
                });
                
                successAudio.load();
                await successLoadPromise;
                console.log('Loaded success audio successfully');
            } catch (error) {
                console.error('Failed to load success audio:', error);
                successAudio = null;
            }
        }
        
        soundsLoaded = audioFiles.length > 0;
        console.log(`${audioFiles.length} audio files loaded successfully`);
        return soundsLoaded;
    } catch (error) {
        console.error('Error loading sounds:', error);
        soundsLoaded = false;
        return false;
    }
}

async function playNextAudio() {
    if (!soundsLoaded || audioFiles.length === 0 || isMuted) return;
    
    try {
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
        
        currentAudio = audioFiles[currentIndex];
        currentAudio.currentTime = 0;
        
        // Set up the event listener for ended event before playing
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        await currentAudio.play();
        
        // Move to the next audio in the sequence
        currentIndex = (currentIndex + 1) % audioFiles.length;
        
        // Wait for the current audio to finish
        await playPromise;
        
        // Clear any existing timeout
        if (nextAudioTimeoutId) {
            clearTimeout(nextAudioTimeoutId);
        }
        
        // Schedule the next audio after 3 seconds
        nextAudioTimeoutId = setTimeout(playNextAudio, 3000);
        
    } catch (error) {
        console.error('Failed to play audio:', error);
        // Fall back to TTS
        try {
            await speakTTS(announcements[currentIndex % announcements.length]);
            currentIndex = (currentIndex + 1) % announcements.length;
            
            // Clear any existing timeout
            if (nextAudioTimeoutId) {
                clearTimeout(nextAudioTimeoutId);
            }
            
            // Schedule the next audio after 3 seconds
            nextAudioTimeoutId = setTimeout(playNextAudio, 3000);
        } catch (ttsError) {
            console.error('TTS fallback also failed:', ttsError);
        }
    }
}

function speakTTS(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.pitch = 1.2;
    utterance.rate = 1.2;

    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(voice => 
        voice.name.includes("Google UK English Male") || voice.name.includes("Daniel") || voice.lang.includes('en-GB') && voice.gender === 'male'
    );
    if (britishVoice) {
        utterance.voice = britishVoice;
    }

    return new Promise(resolve => {
        utterance.onend = resolve;
        window.speechSynthesis.speak(utterance);
    });
}

async function createCongratulationOverlay() {
    // Stop the interval that plays audio
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    
    // Clear any scheduled next audio
    if (nextAudioTimeoutId) {
        clearTimeout(nextAudioTimeoutId);
        nextAudioTimeoutId = null;
    }
    
    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 1s ease;
        z-index: 1000;
    `;

    const image = document.createElement('img');
    image.src = `${window.location.origin + baseUrl}gw.png`;
    image.style.cssText = `
        max-width: 80%;
        max-height: 80%;
        transform: scale(0);
        transition: transform 1s cubic-bezier(0.17, 0.67, 0.83, 0.67);
    `;
    overlay.appendChild(image);
    document.body.appendChild(overlay);

    // Play success sound
    try {
        // Use the preloaded success audio if available
        if (successAudio) {
            successAudio.currentTime = 0;
            const playPromise = new Promise((resolve, reject) => {
                const onEnded = () => {
                    successAudio.removeEventListener('ended', onEnded);
                    resolve();
                };
                const onError = (error) => {
                    successAudio.removeEventListener('error', onError);
                    reject(error);
                };
                successAudio.addEventListener('ended', onEnded);
                successAudio.addEventListener('error', onError);
            });
            
            await successAudio.play();
            await playPromise;
        }
    } catch (error) {
        console.error('Failed to play success audio:', error);
    }

    // Trigger animations
    setTimeout(() => {
        overlay.style.opacity = '1';
        image.style.transform = 'scale(1)';
    }, 100);
}

async function startAnnouncements() {
    document.removeEventListener('mousedown', startAnnouncements);
    createMuteButton();
    createTwitterLink();
    
    // Try to load sounds first
    const success = await loadSounds();
    
    if (success) {
        startTime = Date.now();
        
        // Start the first audio immediately
        await playNextAudio();
        // No need for interval anymore as playNextAudio schedules itself
        
        // Set up congratulation check
        const checkCongratulation = setInterval(async () => {
            if (!congratulationShown && Date.now() - startTime >= 60 * 60 * 1000) {
                // 60 minutes have passed
                clearInterval(checkCongratulation);
                congratulationShown = true;
                await createCongratulationOverlay();
            }
        }, 1000); // Check every second
    } else {
        console.error('Failed to load audio files');
    }
}

function stopAnnouncements() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    
    if (nextAudioTimeoutId) {
        clearTimeout(nextAudioTimeoutId);
        nextAudioTimeoutId = null;
    }
    
    if (currentAudio) {
        currentAudio.pause();
    }
    
    window.speechSynthesis.cancel();
}

// Event listeners
document.addEventListener('mousedown', startAnnouncements);
// document.addEventListener('mouseup', stopAnnouncements); 