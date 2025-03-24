import * as THREE from "three";

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

// Audio collections
let defaultAudios = [];
let touchAudios = [];
let introAudios = [];
let reloadAudios = [];
let muteAudio = null;
let successAudio = null;

// State tracking
let touchCount = 0;
let playedTouchAudios = new Set(); // Keep track of touch audios already played
let defaultAudioIndex = 0;  // Keep track of which default audio to play next
let introAudioIndex = 0;    // Keep track of which intro audio to play next
let hasUserTouchedGrass = false;  // Flag to know if user has interacted with the grass
let isFirstLoad = true;     // Flag to identify first load vs reload
let lastAudioEndTime = 0;   // Track when the last audio ended
let audioPlaying = false;   // Track if an audio is currently playing

// Load state from localStorage if available
function loadState() {
    try {
        const savedState = localStorage.getItem('touchgrass_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            touchCount = state.touchCount || 0;
            playedTouchAudios = new Set(state.playedTouchAudios || []);
            defaultAudioIndex = state.defaultAudioIndex || 0;
            introAudioIndex = state.introAudioIndex || 0;
            hasUserTouchedGrass = state.hasUserTouchedGrass || false;
            isFirstLoad = false; // If we're loading state, this isn't the first load
            
            console.log(`Loaded state: touchCount=${touchCount}, defaultIndex=${defaultAudioIndex}, introIndex=${introAudioIndex}, hasUserTouchedGrass=${hasUserTouchedGrass}`);
            console.log(`Played touch audios: ${Array.from(playedTouchAudios).join(',')}`);
        }
    } catch (error) {
        console.error('Failed to load state from localStorage:', error);
    }
}

// Save state to localStorage
function saveState() {
    try {
        const state = {
            touchCount: touchCount,
            playedTouchAudios: Array.from(playedTouchAudios),
            defaultAudioIndex: defaultAudioIndex,
            introAudioIndex: introAudioIndex,
            hasUserTouchedGrass: hasUserTouchedGrass
        };
        localStorage.setItem('touchgrass_state', JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save state to localStorage:', error);
    }
}

// Function to handle a touch event
async function handleTouch() {
    // If this is the first touch, mark that user has touched grass
    if (!hasUserTouchedGrass) {
        hasUserTouchedGrass = true;
        saveState();
    }
    
    touchCount++;
    console.log(`Touch count: ${touchCount}`);
    saveState();
    
    // Play a touch audio if available
    await playTouchAudio();
}

// Function to play the next appropriate audio based on state
async function playNextAppropriateAudio() {
    if (isMuted) return;
    
    const now = Date.now();
    
    // If audio is already playing, don't do anything
    if (audioPlaying) return;
    
    // If it's the first load and user hasn't touched grass yet, play intro audio
    if (!hasUserTouchedGrass && introAudios.length > 0) {
        await playIntroAudio();
    } 
    // If it's been more than 3 seconds since last audio and user has touched grass, play a default audio
    else if (hasUserTouchedGrass && now - lastAudioEndTime > 3000 && defaultAudios.length > 0) {
        await playDefaultAudio();
    }
}

// Function to play an intro audio
async function playIntroAudio() {
    if (!soundsLoaded || introAudios.length === 0 || isMuted) return;
    
    try {
        // Stop any currently playing audio
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
        
        // Clear any scheduled next audio
        if (nextAudioTimeoutId) {
            clearTimeout(nextAudioTimeoutId);
            nextAudioTimeoutId = null;
        }
        
        audioPlaying = true;
        
        // Get the next intro audio
        currentAudio = introAudios[introAudioIndex];
        currentAudio.currentTime = 0;
        
        // Set up the event listener for ended event before playing
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        console.log(`Playing intro audio ${introAudioIndex}`);
        await currentAudio.play();
        
        // Move to the next intro audio in the sequence
        introAudioIndex = (introAudioIndex + 1) % introAudios.length;
        saveState();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // If this was the last intro audio, move camera and trigger touch
        if (introAudioIndex === 0) {
            // Get the camera and controls from the window object
            const camera = window.fluffyGrass?.camera;
            const controls = window.fluffyGrass?.orbitControls;
            
            if (camera && controls) {
                // Disable controls temporarily
                controls.enabled = false;
                
                // Store initial position
                const startPosition = camera.position.clone();
                const startTarget = controls.target.clone();
                
                // Calculate end position (closer to grass)
                const endPosition = new THREE.Vector3(-5, 8, -5);
                const endTarget = new THREE.Vector3(0, 0, 0);
                
                // Animation duration in milliseconds
                const duration = 3000;
                const startTime = Date.now();
                
                // Animate camera movement
                const animateCamera = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Smooth easing function
                    const easeProgress = progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    // Interpolate position and target
                    camera.position.lerpVectors(startPosition, endPosition, easeProgress);
                    controls.target.lerpVectors(startTarget, endTarget, easeProgress);
                    
                    // Update controls
                    controls.update();
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateCamera);
                    } else {
                        // Re-enable controls
                        controls.enabled = true;
                        
                        // Trigger touch event after camera movement
                        setTimeout(() => {
                            handleTouch();
                        }, 500);
                    }
                };
                
                animateCamera();
            }
        } else {
            // Schedule the next audio check
            nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
        }
        
    } catch (error) {
        console.error('Failed to play intro audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
    }
}

// Function to play a default audio
async function playDefaultAudio() {
    if (!soundsLoaded || defaultAudios.length === 0 || isMuted) return;
    
    try {
        // Stop any currently playing audio
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
        
        // Clear any scheduled next audio
        if (nextAudioTimeoutId) {
            clearTimeout(nextAudioTimeoutId);
            nextAudioTimeoutId = null;
        }
        
        audioPlaying = true;
        
        // Get the next default audio
        currentAudio = defaultAudios[defaultAudioIndex];
        currentAudio.currentTime = 0;
        
        // Set up the event listener for ended event before playing
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        console.log(`Playing default audio ${defaultAudioIndex}`);
        await currentAudio.play();
        
        // Move to the next default audio in the sequence
        defaultAudioIndex = (defaultAudioIndex + 1) % defaultAudios.length;
        saveState();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
        
    } catch (error) {
        console.error('Failed to play default audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
    }
}

// Function to play a reload audio
async function playReloadAudio() {
    if (!soundsLoaded || reloadAudios.length === 0 || isMuted) return;
    
    try {
        // Stop any currently playing audio
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
        
        // Clear any scheduled next audio
        if (nextAudioTimeoutId) {
            clearTimeout(nextAudioTimeoutId);
            nextAudioTimeoutId = null;
        }
        
        audioPlaying = true;
        
        // Get a random reload audio
        const reloadIndex = Math.floor(Math.random() * reloadAudios.length);
        currentAudio = reloadAudios[reloadIndex];
        currentAudio.currentTime = 0;
        
        // Set up the event listener for ended event before playing
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        console.log(`Playing reload audio ${reloadIndex}`);
        await currentAudio.play();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
        
    } catch (error) {
        console.error('Failed to play reload audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
    }
}

// Function to play touch audio based on touch count
async function playTouchAudio() {
    if (!soundsLoaded || touchAudios.length === 0 || isMuted) return;
    
    try {
        // Find the appropriate audio file to play
        // We want the highest index that's ≤ touchCount and hasn't been played before
        let audioIndex = -1;
        let highestMatchingIndex = -1;
        
        // First try to find exact match for touch count
        if (touchCount < touchAudios.length && touchAudios[touchCount] && !playedTouchAudios.has(touchCount)) {
            audioIndex = touchCount;
        } else {
            // If no exact match, find the highest available index that hasn't been played
            for (let i = 0; i < Math.min(touchCount, touchAudios.length); i++) {
                if (touchAudios[i] && !playedTouchAudios.has(i) && i > highestMatchingIndex) {
                    highestMatchingIndex = i;
                }
            }
            
            if (highestMatchingIndex >= 0) {
                audioIndex = highestMatchingIndex;
            }
        }
        
        // If no suitable audio found, return
        if (audioIndex === -1 || !touchAudios[audioIndex]) {
            console.log('No suitable touch audio found for touch count:', touchCount);
            return;
        }
        
        console.log(`Playing touch audio at index ${audioIndex} for touch count ${touchCount}`);
        
        // Stop any currently playing audio
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
        
        // Clear any scheduled next audio
        if (nextAudioTimeoutId) {
            clearTimeout(nextAudioTimeoutId);
            nextAudioTimeoutId = null;
        }
        
        audioPlaying = true;
        
        // Play the touch audio
        currentAudio = touchAudios[audioIndex];
        currentAudio.currentTime = 0;
        
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        await currentAudio.play();
        
        // Mark this audio as played
        playedTouchAudios.add(audioIndex);
        saveState();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
        
    } catch (error) {
        console.error('Failed to play touch audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
    }
}

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
                        playNextAppropriateAudio();
                    } else {
                        // If no mute audio, just resume playback
                        playNextAppropriateAudio();
                    }
                } catch (error) {
                    console.error('Failed to play unmute sound:', error);
                    // Still try to resume playback
                    playNextAppropriateAudio();
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
        // Load saved state
        loadState();
        
        const manifestUrl = new URL('sounds/manifest.json', window.location.origin + baseUrl);
        
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            console.error(`Failed to load manifest: ${response.status}`);
            return false;
        }
        
        const manifest = await response.json();
        console.log('Manifest loaded:', manifest);
        
        // Load intro audio files if available
        if (manifest.intro && manifest.intro.length > 0) {
            introAudios = [];
            for (let i = 0; i < manifest.intro.length; i++) {
                try {
                    const file = manifest.intro[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/intro/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load intro audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading intro audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    introAudios[i] = audio;
                    console.log(`Loaded intro audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load intro audio file at index ${i}:`, error);
                    introAudios[i] = null;
                }
            }
            console.log(`Loaded ${introAudios.filter(a => a !== null).length}/${introAudios.length} intro audio files`);
        }
        
        // Load default audio files if available
        if (manifest.default && manifest.default.length > 0) {
            defaultAudios = [];
            for (let i = 0; i < manifest.default.length; i++) {
                try {
                    const file = manifest.default[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/default/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load default audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading default audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    defaultAudios[i] = audio;
                    console.log(`Loaded default audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load default audio file at index ${i}:`, error);
                    defaultAudios[i] = null;
                }
            }
            console.log(`Loaded ${defaultAudios.filter(a => a !== null).length}/${defaultAudios.length} default audio files`);
        }
        
        // Load touch audio files if available
        if (manifest.touch && manifest.touch.length > 0) {
            touchAudios = [];
            for (let i = 0; i < manifest.touch.length; i++) {
                try {
                    const file = manifest.touch[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/touch/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load touch audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading touch audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    touchAudios[i] = audio;
                    console.log(`Loaded touch audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load touch audio file at index ${i}:`, error);
                    touchAudios[i] = null;
                }
            }
            console.log(`Loaded ${touchAudios.filter(a => a !== null).length}/${touchAudios.length} touch audio files`);
        }
        
        // Load reload audio files if available
        if (manifest.reload && manifest.reload.length > 0) {
            reloadAudios = [];
            for (let i = 0; i < manifest.reload.length; i++) {
                try {
                    const file = manifest.reload[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/reload/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load reload audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading reload audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    reloadAudios[i] = audio;
                    console.log(`Loaded reload audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load reload audio file at index ${i}:`, error);
                    reloadAudios[i] = null;
                }
            }
            console.log(`Loaded ${reloadAudios.filter(a => a !== null).length}/${reloadAudios.length} reload audio files`);
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
        
        soundsLoaded = introAudios.length > 0 || defaultAudios.length > 0 || touchAudios.length > 0;
        return soundsLoaded;
    } catch (error) {
        console.error('Error loading sounds:', error);
        soundsLoaded = false;
        return false;
    }
}

async function startAnnouncements() {
    // Remove the mousedown event listener since we want to start automatically
    document.removeEventListener('mousedown', startAnnouncements);
    
    // Create UI elements immediately
    createMuteButton();
    createTwitterLink();
    
    // Try to load sounds first
    const success = await loadSounds();
    
    if (success) {
        startTime = Date.now();
        lastAudioEndTime = startTime;
        
        // Set up touch event listener for grass interaction
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.addEventListener('click', handleTouch);
            console.log('Added touch handler to canvas');
        } else {
            // Fallback to document if canvas not found
            document.addEventListener('click', handleTouch);
            console.log('Canvas not found, added touch handler to document');
        }
        
        // Create a start button
        const startButton = document.createElement('button');
        startButton.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 15px 30px;
            font-size: 18px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
            transition: background 0.3s ease;
        `;
        startButton.textContent = 'Start Experience';
        
        startButton.addEventListener('mouseenter', () => {
            startButton.style.background = 'rgba(0, 0, 0, 0.9)';
        });
        
        startButton.addEventListener('mouseleave', () => {
            startButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        
        startButton.addEventListener('click', async () => {
            // Remove the start button
            startButton.remove();
            
            // Check if this is a reload or first load
            if (!isFirstLoad && reloadAudios.length > 0) {
                // Play reload audio first
                await playReloadAudio();
            } else {
                // Start intro audio immediately
                await playNextAppropriateAudio();
            }
            
            // Set up congratulation check
            const checkCongratulation = setInterval(async () => {
                if (!congratulationShown && Date.now() - startTime >= 60 * 60 * 1000) {
                    // 60 minutes have passed
                    clearInterval(checkCongratulation);
                    congratulationShown = true;
                    await createCongratulationOverlay();
                }
            }, 1000); // Check every second
        });
        
        document.body.appendChild(startButton);
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

// Remove the mousedown event listener since we want to start automatically
// document.addEventListener('mousedown', startAnnouncements);

// Start announcements immediately when the script loads
startAnnouncements();

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

// Function to reset all state and local storage
function resetAllState() {
    // Clear all audio state
    currentIndex = 0;
    intervalId = null;
    nextAudioTimeoutId = null;
    startTime = null;
    congratulationShown = false;
    currentAudio = null;
    isMuted = false;
    soundsLoaded = false;

    // Reset audio collections
    defaultAudios = [];
    touchAudios = [];
    introAudios = [];
    reloadAudios = [];
    muteAudio = null;
    successAudio = null;

    // Reset state tracking
    touchCount = 0;
    playedTouchAudios = new Set();
    defaultAudioIndex = 0;
    introAudioIndex = 0;
    hasUserTouchedGrass = false;
    isFirstLoad = true;
    lastAudioEndTime = 0;
    audioPlaying = false;

    // Clear localStorage
    localStorage.removeItem('touchgrass_state');

    // Stop any playing audio
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Clear any scheduled timeouts
    if (nextAudioTimeoutId) {
        clearTimeout(nextAudioTimeoutId);
        nextAudioTimeoutId = null;
    }

    // Clear any intervals
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    // Cancel any speech synthesis
    window.speechSynthesis.cancel();

    console.log('All state has been reset');
}

// Add reset function to window for easy access
window.resetTouchGrassState = resetAllState; 