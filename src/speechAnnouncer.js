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
let skyTouchAudios = []; // New collection for sky touch audio
let tabAudios = []; // New collection for tab change audio
let leaveAudios = []; // New collection for leave audio
let portalAudios = []; // New collection for portal audio
let muteAudio = null;
let successAudio = null;
let paywallAudios = {}; // Collection for paywall audio messages

// State tracking
let touchCount = 0;
let skyTouchCount = 0; // New counter for sky touches
let playedTouchAudios = new Set();
let playedSkyTouchAudios = new Set(); // New set for sky touch audios
let defaultAudioIndex = 0;
let introAudioIndex = 0;
let hasUserTouchedGrass = false;
let hasUserTouchedSky = false; // New flag for sky touches
let isFirstLoad = true;
let lastAudioEndTime = 0;
let audioPlaying = false;

// Add new state variable for tracking if we're in a tab
let isInTab = false;

// Add new state variable for tracking if we've played tab audio
let hasPlayedTabAudio = false;

// Add state tracking for tab audio
let tabAudioPlayed = false;

// Add new audio collection for start experience
let startExperienceAudios = [];

// Add state tracking for start experience
let startExperienceButton = null;
let startExperienceOverlay = null;
let startExperienceClickCount = 0;
let startExperienceClickTimeout = null;

// Paywall configuration
const PAYWALL_CONFIG = {
    enabled: true,
    thresholds: [
        { touches: 5, amount: 2, messages: {
            initial: "Fine, you win that round. Now here's a paywall. Two dollars, please. Don't do it.",
            hover1: "Ha! It moved—don't waste your time chasing it!",
            hover2: "Still after it? Look, there's grass where it started—be smart for once!",
            hover3: "Caught it, huh? Two bucks if you're that desperate—go ahead, I dare you.",
            grassClick: "Oh, you found the grass trick! No money spent, you sly cheapskate. Carry on.",
            payClick: "You're actually paying two bucks? Oh, you sweet, naive fool.",
            paySuccess: "Two bucks gone. Here's pink grass. Happy now, you big spender?",
            payCancel: "Canceled it? Smart move—or just too broke to commit."
        }},
        { touches: 10, amount: 5, messages: {
            initial: "Alright, now it's five bucks. Don't test me—or do, I'm not your babysitter.",
            hover1: "Off it goes! Don't bother, the grass is right there!",
            hover2: "Still chasing? Grass is free, you stubborn mule—use your eyes!",
            hover3: "Got it pinned? Five bucks to throw away—your funeral.",
            grassClick: "Grass dodge again! Five bucks saved, you thrifty little gremlin.",
            payClick: "Five dollars? You're a saint—or a sucker.",
            paySuccess: "Five bucks! Watch the grass dance, you mad, rich lunatic.",
            payCancel: "Canceled five? Probably for the best, wallet warrior."
        }},
        { touches: 15, amount: 10, messages: {
            initial: "Ten bucks now! You're insane—and I love it. Don't pay, trust me.",
            hover1: "There it goes! Grass is waiting—don't be a fool!",
            hover2: "Still at it? Grass dodge is right there, you relentless dope!",
            hover3: "Caught it? Ten bucks to waste—go on, prove you're that crazy.",
            grassClick: "Dodged ten bucks with the grass! You're a legend—or just cheap.",
            payClick: "Ten whole dollars! I'm retiring, thanks to you.",
            paySuccess: "Ten dollars! Watch the grass dance, you mad, rich lunatic.",
            payCancel: "Canceled ten? Probably for the best, wallet warrior."
        }},
        { touches: 20, amount: 1000, messages: {
            initial: "One thousand dollars. Yes, really. Dodge it, you maniac—no one's that loaded!",
            hover1: "It's running! Grass is your savior—don't be an idiot!",
            hover2: "Still chasing a grand? Grass dodge is staring at you, you greedy nutcase!",
            hover3: "Pinned it down? A thousand bucks—go ahead, you unhinged money pit.",
            grassClick: "Grass dodge on a grand! You're my hero, you tightfisted genius.",
            payClick: "A thousand dollars? You're insane. Fine, name your legacy.",
            paySuccess: "A thousand dollars! Your name's in the sky—forever pointless. I'm done.",
            payCancel: "Canceled a grand? Sanity prevails—barely."
        }}
    ]
};

// Paywall state tracking
let currentPaywall = null;
let paywallHoverCount = 0;
let paywallButton = null;
let paywallOverlay = null;
let grassPatch = null;
let paywallTimeout = null;

// Load state from localStorage if available
function loadState() {
    try {
        const savedState = localStorage.getItem('touchgrass_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            touchCount = state.touchCount || 0;
            skyTouchCount = state.skyTouchCount || 0;
            playedTouchAudios = new Set(state.playedTouchAudios || []);
            playedSkyTouchAudios = new Set(state.playedSkyTouchAudios || []);
            defaultAudioIndex = state.defaultAudioIndex || 0;
            introAudioIndex = state.introAudioIndex || 0;
            hasUserTouchedGrass = state.hasUserTouchedGrass || false;
            hasUserTouchedSky = state.hasUserTouchedSky || false;
            hasPlayedTabAudio = state.hasPlayedTabAudio || false; // Load tab audio state
            isFirstLoad = false;
            
            console.log(`Loaded state: touchCount=${touchCount}, skyTouchCount=${skyTouchCount}, defaultIndex=${defaultAudioIndex}, introIndex=${introAudioIndex}, hasUserTouchedGrass=${hasUserTouchedGrass}, hasUserTouchedSky=${hasUserTouchedSky}, hasPlayedTabAudio=${hasPlayedTabAudio}`);
            console.log(`Played touch audios: ${Array.from(playedTouchAudios).join(',')}`);
            console.log(`Played sky touch audios: ${Array.from(playedSkyTouchAudios).join(',')}`);
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
            skyTouchCount: skyTouchCount,
            playedTouchAudios: Array.from(playedTouchAudios),
            playedSkyTouchAudios: Array.from(playedSkyTouchAudios),
            defaultAudioIndex: defaultAudioIndex,
            introAudioIndex: introAudioIndex,
            hasUserTouchedGrass: hasUserTouchedGrass,
            hasUserTouchedSky: hasUserTouchedSky,
            hasPlayedTabAudio: hasPlayedTabAudio // Save tab audio state
        };
        localStorage.setItem('touchgrass_state', JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save state to localStorage:', error);
    }
}

// Function to handle a touch event
async function handleTouch(event) {
    // If paywall is active, don't process touches
    if (currentPaywall) {
        return;
    }

    // If start experience button is still showing, don't process touches
    if (startExperienceButton && startExperienceButton.parentElement) {
        return;
    }

    // If audio is currently playing, don't process new touches
    if (audioPlaying) {
        console.log('Audio is playing, ignoring touch');
        return;
    }

    // Get the click position
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / canvas.height) * 2 + 1;

    // Create a raycaster
    const raycaster = new THREE.Raycaster();
    const camera = window.fluffyGrass?.camera;
    if (!camera) return;

    // Set up the raycaster
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Get the point where the ray intersects with the scene
    const intersects = raycaster.intersectObjects(window.fluffyGrass?.scene.children || [], true);
    
    // If no intersection found, consider it a sky touch
    if (intersects.length === 0) {
        console.log('No intersection found - treating as sky touch');
        // Handle sky touch
        if (!hasUserTouchedSky) {
            hasUserTouchedSky = true;
            saveState();
        }
        
        skyTouchCount++;
        console.log(`Sky touch count: ${skyTouchCount}`);
        saveState();
        
        // Play a sky touch audio if available
        await playSkyTouchAudio();
        return;
    }

    // If we have an intersection, check if it's in the sky
    const point = intersects[0].point;
    console.log('Intersection point:', point);

    if (window.fluffyGrass?.isPointInSky(point)) {
        console.log('Sky touch detected!');
        // Handle sky touch
        if (!hasUserTouchedSky) {
            hasUserTouchedSky = true;
            saveState();
        }
        
        skyTouchCount++;
        console.log(`Sky touch count: ${skyTouchCount}`);
        saveState();
        
        // Play a sky touch audio if available
        await playSkyTouchAudio();
    } else {
        console.log('Grass touch detected!');
        // Handle grass touch
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

    // Check for paywall triggers after incrementing touch count
    if (PAYWALL_CONFIG.enabled) {
        const threshold = PAYWALL_CONFIG.thresholds.find(t => t.touches === touchCount);
        if (threshold) {
            createPaywallUI(threshold);
        }
    }
}

// Function to play sky touch audio
async function playSkyTouchAudio() {
    if (!soundsLoaded || skyTouchAudios.length === 0 || isMuted) return;
    
    try {
        // Find the appropriate audio file to play
        let audioIndex = -1;
        let highestMatchingIndex = -1;
        
        // First try to find exact match for sky touch count
        if (skyTouchCount < skyTouchAudios.length && skyTouchAudios[skyTouchCount] && !playedSkyTouchAudios.has(skyTouchCount)) {
            audioIndex = skyTouchCount;
        } else {
            // If no exact match, find the highest available index that hasn't been played
            for (let i = 0; i < Math.min(skyTouchCount, skyTouchAudios.length); i++) {
                if (skyTouchAudios[i] && !playedSkyTouchAudios.has(i) && i > highestMatchingIndex) {
                    highestMatchingIndex = i;
                }
            }
            
            if (highestMatchingIndex >= 0) {
                audioIndex = highestMatchingIndex;
            }
        }
        
        // If no suitable audio found, return
        if (audioIndex === -1 || !skyTouchAudios[audioIndex]) {
            console.log('No suitable sky touch audio found for count:', skyTouchCount);
            return;
        }
        
        console.log(`Playing sky touch audio at index ${audioIndex} for count ${skyTouchCount}`);
        
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
        
        // Play the sky touch audio
        currentAudio = skyTouchAudios[audioIndex];
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
        playedSkyTouchAudios.add(audioIndex);
        saveState();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
        
    } catch (error) {
        console.error('Failed to play sky touch audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Schedule the next audio check
        nextAudioTimeoutId = setTimeout(playNextAppropriateAudio, 3000);
    }
}

// Function to play the next appropriate audio based on state
async function playNextAppropriateAudio() {
    if (isMuted || isInTab) return;
    
    const now = Date.now();
    
    // If audio is already playing, don't do anything
    if (audioPlaying) return;
    
    // Hide start button and overlay if they exist
    if (startExperienceButton && startExperienceButton.parentElement) {
        startExperienceButton.remove();
        startExperienceButton = null;
    }
    if (startExperienceOverlay) {
        startExperienceOverlay.remove();
        startExperienceOverlay = null;
    }
    
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

// Function to play tab audio
async function playTabAudio() {
    if (!soundsLoaded || tabAudios.length === 0 || isMuted || hasPlayedTabAudio) {
        console.log('Cannot play tab audio: soundsLoaded=', soundsLoaded, 'tabAudios.length=', tabAudios.length, 'isMuted=', isMuted, 'hasPlayedTabAudio=', hasPlayedTabAudio);
        return;
    }
    
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
        
        // Get a random tab audio
        const tabIndex = Math.floor(Math.random() * tabAudios.length);
        currentAudio = tabAudios[tabIndex];
        if (!currentAudio) {
            console.error('Tab audio at index', tabIndex, 'is null');
            return;
        }
        currentAudio.currentTime = 0;
        
        console.log('Playing tab audio', tabIndex);
        
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        await currentAudio.play();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        hasPlayedTabAudio = true;
        saveState(); // Save state after playing
        
    } catch (error) {
        console.error('Failed to play tab audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
    }
}

// Function to play leave audio
async function playLeaveAudio() {
    if (!soundsLoaded || leaveAudios.length === 0 || isMuted) return;
    
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
        
        // Get a random leave audio
        const leaveIndex = Math.floor(Math.random() * leaveAudios.length);
        currentAudio = leaveAudios[leaveIndex];
        currentAudio.currentTime = 0;
        
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        console.log(`Playing leave audio ${leaveIndex}`);
        await currentAudio.play();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
    } catch (error) {
        console.error('Failed to play leave audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
    }
}

// Function to play portal audio
async function playPortalAudio() {
    if (!soundsLoaded || portalAudios.length === 0 || isMuted) return;
    
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
        
        // Get a random portal audio
        const portalIndex = Math.floor(Math.random() * portalAudios.length);
        currentAudio = portalAudios[portalIndex];
        currentAudio.currentTime = 0;
        
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        console.log(`Playing portal audio ${portalIndex}`);
        await currentAudio.play();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
        // Notify that portal audio is finished
        if (window.fluffyGrass) {
            window.fluffyGrass.onPortalAudioComplete();
        }
        
    } catch (error) {
        console.error('Failed to play portal audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
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
        
        // Load sky touch audio files if available
        if (manifest.sky_touch && manifest.sky_touch.length > 0) {
            skyTouchAudios = [];
            for (let i = 0; i < manifest.sky_touch.length; i++) {
                try {
                    const file = manifest.sky_touch[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/sky_touch/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load sky touch audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading sky touch audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    skyTouchAudios[i] = audio;
                    console.log(`Loaded sky touch audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load sky touch audio file at index ${i}:`, error);
                    skyTouchAudios[i] = null;
                }
            }
            console.log(`Loaded ${skyTouchAudios.filter(a => a !== null).length}/${skyTouchAudios.length} sky touch audio files`);
        }
        
        // Load tab audio files if available
        if (manifest.tab && manifest.tab.length > 0) {
            tabAudios = [];
            for (let i = 0; i < manifest.tab.length; i++) {
                try {
                    const file = manifest.tab[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/tab/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load tab audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading tab audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    tabAudios[i] = audio;
                    console.log(`Loaded tab audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load tab audio file at index ${i}:`, error);
                    tabAudios[i] = null;
                }
            }
            console.log(`Loaded ${tabAudios.filter(a => a !== null).length}/${tabAudios.length} tab audio files`);
        }
        
        // Load leave audio files if available
        if (manifest.leave && manifest.leave.length > 0) {
            leaveAudios = [];
            for (let i = 0; i < manifest.leave.length; i++) {
                try {
                    const file = manifest.leave[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/leave/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load leave audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading leave audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    leaveAudios[i] = audio;
                    console.log(`Loaded leave audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load leave audio file at index ${i}:`, error);
                    leaveAudios[i] = null;
                }
            }
            console.log(`Loaded ${leaveAudios.filter(a => a !== null).length}/${leaveAudios.length} leave audio files`);
        }
        
        // Load portal audio files if available
        if (manifest.portal && manifest.portal.length > 0) {
            portalAudios = [];
            for (let i = 0; i < manifest.portal.length; i++) {
                try {
                    const file = manifest.portal[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/portal/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load portal audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading portal audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    portalAudios[i] = audio;
                    console.log(`Loaded portal audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load portal audio file at index ${i}:`, error);
                    portalAudios[i] = null;
                }
            }
            console.log(`Loaded ${portalAudios.filter(a => a !== null).length}/${portalAudios.length} portal audio files`);
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
        
        // Load start experience audio files if available
        if (manifest.startexperiencealt && manifest.startexperiencealt.length > 0) {
            startExperienceAudios = [];
            for (let i = 0; i < manifest.startexperiencealt.length; i++) {
                try {
                    const file = manifest.startexperiencealt[i];
                    const audio = new Audio();
                    audio.src = new URL(`sounds/startexperiencealt/${file}`, window.location.origin + baseUrl).href;
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(new Error(`Failed to load start experience alt audio ${file}`)), { once: true });
                        setTimeout(() => reject(new Error(`Timeout loading start experience alt audio ${file}`)), 10000);
                    });
                    
                    audio.load();
                    await loadPromise;
                    startExperienceAudios[i] = audio;
                    console.log(`Loaded start experience alt audio ${i}: ${file}`);
                } catch (error) {
                    console.error(`Failed to load start experience alt audio file at index ${i}:`, error);
                    startExperienceAudios[i] = null;
                }
            }
            console.log(`Loaded ${startExperienceAudios.filter(a => a !== null).length}/${startExperienceAudios.length} start experience alt audio files`);
        }
        
        // Load paywall audio files if available
        if (manifest.paywall) {
            paywallAudios = {};
            const amounts = ['2', '5', '10', '1000'];
            const messageTypes = ['initial', 'hover1', 'hover2', 'hover3', 'grassClick', 'payClick', 'paySuccess', 'payCancel'];
            
            for (const amount of amounts) {
                if (manifest.paywall[amount]) {
                    paywallAudios[amount] = {};
                    for (const type of messageTypes) {
                        if (manifest.paywall[amount][type]) {
                            try {
                                const audio = new Audio();
                                audio.src = new URL(`sounds/paywall/${amount}/${manifest.paywall[amount][type]}`, window.location.origin + baseUrl).href;
                                
                                const loadPromise = new Promise((resolve, reject) => {
                                    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                                    audio.addEventListener('error', (e) => reject(new Error(`Failed to load paywall audio ${amount}/${type}`)), { once: true });
                                    setTimeout(() => reject(new Error(`Timeout loading paywall audio ${amount}/${type}`)), 10000);
                                });
                                
                                audio.load();
                                await loadPromise;
                                paywallAudios[amount][type] = audio;
                                console.log(`Loaded paywall audio ${amount}/${type}`);
                            } catch (error) {
                                console.error(`Failed to load paywall audio ${amount}/${type}:`, error);
                                paywallAudios[amount][type] = null;
                            }
                        }
                    }
                }
            }
            console.log('Loaded paywall audio files');
        }
        
        soundsLoaded = introAudios.length > 0 || defaultAudios.length > 0 || touchAudios.length > 0 || 
                      skyTouchAudios.length > 0 || tabAudios.length > 0 || leaveAudios.length > 0 || 
                      portalAudios.length > 0;
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
        
        // Check if we should show a paywall based on touch count
        if (PAYWALL_CONFIG.enabled) {
            const threshold = PAYWALL_CONFIG.thresholds.find(t => t.touches === touchCount);
            if (threshold) {
                createPaywallUI(threshold);
            } else {
                // Only create start experience UI if no paywall needed
                createStartExperienceUI();
            }
        } else {
            createStartExperienceUI();
        }
        
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
        
        // Add visibility change handler for tab changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Tab changed - attempting to play tab audio');
                isInTab = true;
                // Stop any currently playing default audio
                if (currentAudio && !currentAudio.paused) {
                    currentAudio.pause();
                }
                // Clear any scheduled next audio
                if (nextAudioTimeoutId) {
                    clearTimeout(nextAudioTimeoutId);
                    nextAudioTimeoutId = null;
                }
                // Only try to play tab audio if it hasn't been played before
                if (!hasPlayedTabAudio) {
                    playTabAudio();
                } else {
                    console.log('Tab audio already played, skipping');
                }
            } else {
                console.log('Returned to tab - resuming audio');
                isInTab = false;
                // Resume audio playback
                playNextAppropriateAudio();
            }
        });
        
        // Add beforeunload handler for leaving the site
        window.addEventListener('beforeunload', () => {
            console.log('User leaving site - playing leave audio');
            playLeaveAudio();
        });
        
        // Add portal click handler
        window.addEventListener('portalClick', () => {
            console.log('Portal clicked - playing portal audio');
            playPortalAudio();
        });
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
    // Only show congratulation if we're not in a tab
    if (isInTab) {
        console.log('Skipping congratulation overlay - user is in another tab');
        return;
    }

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
    skyTouchAudios = [];
    tabAudios = [];
    leaveAudios = [];
    portalAudios = [];
    muteAudio = null;
    successAudio = null;
    paywallAudios = {}; // Reset paywall audio state

    // Reset state tracking
    touchCount = 0;
    skyTouchCount = 0;
    playedTouchAudios = new Set();
    playedSkyTouchAudios = new Set();
    defaultAudioIndex = 0;
    introAudioIndex = 0;
    hasUserTouchedGrass = false;
    hasUserTouchedSky = false;
    isFirstLoad = true;
    lastAudioEndTime = 0;
    audioPlaying = false;
    hasPlayedTabAudio = false; // Reset tab audio state

    // Reset tab state
    isInTab = false;
    tabAudioPlayed = false;
    
    // Reset start experience state
    if (startExperienceButton) {
        startExperienceButton.remove();
        startExperienceButton = null;
    }
    if (startExperienceOverlay) {
        startExperienceOverlay.remove();
        startExperienceOverlay = null;
    }
    startExperienceClickCount = 0;
    if (startExperienceClickTimeout) {
        clearTimeout(startExperienceClickTimeout);
        startExperienceClickTimeout = null;
    }

    // Reset paywall state
    removePaywallUI();

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

// Function to create start experience overlay and button
function createStartExperienceUI() {
    // Create overlay
    startExperienceOverlay = document.createElement('div');
    startExperienceOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 1000;
    `;

    // Create button
    startExperienceButton = document.createElement('button');
    startExperienceButton.style.cssText = `
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
        z-index: 1001;
        transition: background 0.3s ease;
    `;
    startExperienceButton.textContent = 'Start Experience';
    
    startExperienceButton.addEventListener('mouseenter', () => {
        startExperienceButton.style.background = 'rgba(0, 0, 0, 0.9)';
    });
    
    startExperienceButton.addEventListener('mouseleave', () => {
        startExperienceButton.style.background = 'rgba(0, 0, 0, 0.7)';
    });

    // Add click handler for overlay
    startExperienceOverlay.addEventListener('click', (event) => {
        // Don't count clicks on the button
        if (event.target === startExperienceButton) return;

        // Clear previous timeout if exists
        if (startExperienceClickTimeout) {
            clearTimeout(startExperienceClickTimeout);
        }

        startExperienceClickCount++;
        
        // Reset count after 2 seconds if not clicked again
        startExperienceClickTimeout = setTimeout(() => {
            startExperienceClickCount = 0;
        }, 2000);

        // If clicked twice within 2 seconds
        if (startExperienceClickCount === 2) {
            playStartExperienceAlt();
        }
    });

    // Add click handler for button
    startExperienceButton.addEventListener('click', async () => {
        // Remove the start button and overlay
        startExperienceButton.remove();
        startExperienceOverlay.remove();
        
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
    
    startExperienceOverlay.appendChild(startExperienceButton);
    document.body.appendChild(startExperienceOverlay);
}

// Function to play start experience alt audio
async function playStartExperienceAlt() {
    if (!soundsLoaded || startExperienceAudios.length === 0 || isMuted) return;
    
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
        
        // Hide start button and overlay
        if (startExperienceButton && startExperienceButton.parentElement) {
            startExperienceButton.remove();
            startExperienceButton = null;
        }
        if (startExperienceOverlay) {
            startExperienceOverlay.remove();
            startExperienceOverlay = null;
        }
        
        audioPlaying = true;
        
        // Get a random start experience audio
        const audioIndex = Math.floor(Math.random() * startExperienceAudios.length);
        currentAudio = startExperienceAudios[audioIndex];
        currentAudio.currentTime = 0;
        
        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });
        
        console.log(`Playing start experience alt audio ${audioIndex}`);
        await currentAudio.play();
        
        // Wait for the audio to finish
        await playPromise;
        
        audioPlaying = false;
        lastAudioEndTime = Date.now();
        
    } catch (error) {
        console.error('Failed to play start experience alt audio:', error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
    }
}

// Function to create paywall UI
function createPaywallUI(threshold) {
    // Remove existing paywall if any
    removePaywallUI();
    
    // Create overlay with improved brick wall pattern
    paywallOverlay = document.createElement('div');
    paywallOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: ${threshold.amount === 1000 ? '2%' : '0'};
        width: ${threshold.amount === 1000 ? '96%' : '100%'};
        height: 100%;
        background-color: #8B4513;
        background-image: url('${window.location.origin + baseUrl}wall.png'), 
            /* Horizontal mortar lines */
            linear-gradient(0deg, rgba(0,0,0,0.2) 2px, transparent 2px),
            /* Vertical mortar lines for even rows */
            linear-gradient(90deg, rgba(0,0,0,0.2) 2px, transparent 2px),
            /* Vertical mortar lines for odd rows */
            linear-gradient(90deg, rgba(0,0,0,0.2) 2px, transparent 2px),
            /* Brick color variation for even rows */
            linear-gradient(0deg, rgba(139,69,19,0.9) 0px, rgba(139,69,19,0.9) 28px),
            /* Brick color variation for odd rows */
            linear-gradient(0deg, rgba(160,82,45,0.9) 30px, rgba(160,82,45,0.9) 58px);
        background-size: 
            cover,
            /* Size for horizontal lines */
            100% 60px,
            /* Size for even row vertical lines */
            200px 60px,
            /* Size for odd row vertical lines */
            200px 60px,
            /* Size for even row color */
            100% 60px,
            /* Size for odd row color */
            100% 60px;
        background-position: 
            center,
            /* Position for horizontal lines */
            0 0,
            /* Position for even row vertical lines */
            0 0,
            /* Position for odd row vertical lines (offset) */
            100px 30px,
            /* Position for even row color */
            0 0,
            /* Position for odd row color */
            0 0;
        background-repeat: 
            no-repeat,
            repeat,
            repeat,
            repeat,
            repeat,
            repeat;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    // Create grass patches for $2, $5, and $1000 paywalls
    if (threshold.amount === 2 || threshold.amount === 5 || threshold.amount === 1000) {
        if (threshold.amount === 1000) {
            // Create left gap grass patch
            const leftGrassPatch = document.createElement('button');
            leftGrassPatch.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 2%;
                height: 100%;
                background: linear-gradient(45deg, #4CAF50, #45a049);
                border: none;
                cursor: pointer;
                z-index: 1999;
                transition: all 0.3s ease;
                background-image: 
                    radial-gradient(circle at 30% 50%, #45a049 1px, transparent 1px),
                    radial-gradient(circle at 70% 50%, #45a049 1px, transparent 1px),
                    radial-gradient(circle at 50% 50%, #4CAF50 1px, transparent 1px);
                background-size: 10px 10px;
            `;

            // Create right gap grass patch
            const rightGrassPatch = document.createElement('button');
            rightGrassPatch.style.cssText = `
                position: fixed;
                top: 0;
                right: 0;
                width: 2%;
                height: 100%;
                background: linear-gradient(45deg, #4CAF50, #45a049);
                border: none;
                cursor: pointer;
                z-index: 1999;
                transition: all 0.3s ease;
                background-image: 
                    radial-gradient(circle at 30% 50%, #45a049 1px, transparent 1px),
                    radial-gradient(circle at 70% 50%, #45a049 1px, transparent 1px),
                    radial-gradient(circle at 50% 50%, #4CAF50 1px, transparent 1px);
                background-size: 10px 10px;
            `;

            // Add hover effects
            const addHoverEffects = (patch) => {
                patch.addEventListener('mouseenter', () => {
                    patch.style.filter = 'brightness(1.2)';
                    patch.style.backgroundImage = `
                        radial-gradient(circle at 30% 50%, #3d8b41 1px, transparent 1px),
                        radial-gradient(circle at 70% 50%, #3d8b41 1px, transparent 1px),
                        radial-gradient(circle at 50% 50%, #45a049 1px, transparent 1px)
                    `;
                });

                patch.addEventListener('mouseleave', () => {
                    patch.style.filter = 'brightness(1)';
                    patch.style.backgroundImage = `
                        radial-gradient(circle at 30% 50%, #45a049 1px, transparent 1px),
                        radial-gradient(circle at 70% 50%, #45a049 1px, transparent 1px),
                        radial-gradient(circle at 50% 50%, #4CAF50 1px, transparent 1px)
                    `;
                });
            };

            addHoverEffects(leftGrassPatch);
            addHoverEffects(rightGrassPatch);

            // Add click handlers
            const handleGrassClick = () => {
                playPaywallAudio(threshold.amount.toString(), 'grassClick');
                removePaywallUI();
            };

            leftGrassPatch.addEventListener('click', handleGrassClick);
            rightGrassPatch.addEventListener('click', handleGrassClick);

            // Add grass patches to body
            document.body.appendChild(leftGrassPatch);
            document.body.appendChild(rightGrassPatch);
            
            // Store grass patches for cleanup
            grassPatch = [leftGrassPatch, rightGrassPatch];
        } else {
            // Original grass patch code for $2 and $5 paywalls
            grassPatch = document.createElement('button');
            grassPatch.style.cssText = `
                position: fixed;
                width: ${threshold.amount === 2 ? '50px' : '10px'};
                height: ${threshold.amount === 2 ? '50px' : '10px'};
                background: linear-gradient(45deg, #4CAF50, #45a049);
                border: none;
                border-radius: 10px;
                cursor: pointer;
                z-index: 2001;
                transition: all 0.3s ease;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                top: 60%; 
                left: 50%;
                transform: translate(-50%, -50%);
            `;

            // Add hover effect
            // grassPatch.addEventListener('mouseenter', () => {
                // grassPatch.style.transform = 'scale(1.1)';
                // grassPatch.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
            // });

            // grassPatch.addEventListener('mouseleave', () => {
                // grassPatch.style.transform = 'scale(1)';
                // grassPatch.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            // });

            // Add click handler
            grassPatch.addEventListener('click', () => {
                playPaywallAudio(threshold.amount.toString(), 'grassClick');
                removePaywallUI();
            });

            paywallOverlay.appendChild(grassPatch);
        }
    }
    
    // Create message text with improved contrast
    const messageText = document.createElement('div');
    messageText.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        z-index: 2003;
        padding: 20px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    `;

    if (threshold.amount === 10) {
        // For $10 paywall, split the message and make "grass" clickable
        const beforeGrass = document.createElement('span');
        beforeGrass.textContent = "Pay up if you ever want to touch ";
        
        const grassLink = document.createElement('span');
        grassLink.textContent = "grass";
        grassLink.style.cssText = `
            // color: #4CAF50;
            cursor: pointer;
            // text-decoration: underline;
            // transition: all 0.3s ease;
            // background: linear-gradient(45deg, #4CAF50, #45a049);
            // -webkit-background-clip: text;
            // -webkit-text-fill-color: transparent;
            // background-image: 
                // radial-gradient(circle at 30% 50%, #45a049 1px, transparent 1px),
                // radial-gradient(circle at 70% 50%, #45a049 1px, transparent 1px),
                // radial-gradient(circle at 50% 50%, #4CAF50 1px, transparent 1px);
            // background-size: 10px 10px;
        `;
        
        const afterGrass = document.createElement('span');
        afterGrass.textContent = " again";
        
        // Add hover effect
        grassLink.addEventListener('mouseenter', () => {
            grassLink.style.color = '#4CAF50';
            grassLink.style.filter = 'brightness(1.2)';
            grassLink.style.transform = 'scale(1.1)';
        });
        
        grassLink.addEventListener('mouseleave', () => {
            grassLink.style.color = '#ffffff';
            grassLink.style.filter = 'brightness(1)';
            grassLink.style.transform = 'scale(1)';
        });
        
        // Add click handler
        grassLink.addEventListener('click', () => {
            playPaywallAudio(threshold.amount.toString(), 'grassClick');
            removePaywallUI();
        });
        
        messageText.appendChild(beforeGrass);
        messageText.appendChild(grassLink);
        messageText.appendChild(afterGrass);
    } else {
        messageText.textContent = "Pay up if you ever want to touch grass again";
    }
    
    // Create pay button
    paywallButton = document.createElement('button');
    paywallButton.style.cssText = `
        padding: 15px 30px;
        font-size: 24px;
        background: #000000;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: ${threshold.amount === 10 ? '2004' : '2002'};
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;
    paywallButton.textContent = `Pay $${threshold.amount}`;
    
    // Add hover handlers
    paywallButton.addEventListener('mouseenter', () => {
        if (paywallHoverCount < 2) {
            // Move button to random position
            const buttonRect = paywallButton.getBoundingClientRect();
            const maxX = window.innerWidth - buttonRect.width;
            const maxY = window.innerHeight - buttonRect.height;
            const newX = Math.random() * maxX;
            const newY = Math.random() * maxY;
            
            paywallButton.style.left = `${newX}px`;
            paywallButton.style.top = `${newY}px`;
            paywallButton.style.transform = 'none';
            
            // Play hover message
            playPaywallAudio(threshold.amount.toString(), `hover${paywallHoverCount + 1}`);
            
            paywallHoverCount++;
        } else {
            // On third hover, button stays put
            playPaywallAudio(threshold.amount.toString(), 'hover3');
        }
    });
    
    // Add click handlers
    paywallButton.addEventListener('click', () => {
        if (paywallHoverCount >= 2) {
            handlePayment(threshold);
        }
    });
    
    // Add elements to overlay
    paywallOverlay.appendChild(messageText);
    paywallOverlay.appendChild(paywallButton);
    document.body.appendChild(paywallOverlay);
    
    // Store current paywall info
    currentPaywall = threshold;
    paywallHoverCount = 0;
    
    // Play initial message
    playPaywallAudio(threshold.amount.toString(), 'initial');
}

// Function to remove paywall UI
function removePaywallUI() {
    if (paywallOverlay) {
        paywallOverlay.remove();
        paywallOverlay = null;
    }
    if (paywallButton) {
        paywallButton.remove();
        paywallButton = null;
    }
    if (grassPatch) {
        if (Array.isArray(grassPatch)) {
            // Remove multiple grass patches
            grassPatch.forEach(patch => patch.remove());
        } else {
            // Remove single grass patch
            grassPatch.remove();
        }
        grassPatch = null;
    }
    if (paywallTimeout) {
        clearTimeout(paywallTimeout);
        paywallTimeout = null;
    }
    currentPaywall = null;
    paywallHoverCount = 0;
}

// Function to handle payment
async function handlePayment(threshold) {
    playPaywallAudio(threshold.amount.toString(), 'payClick');
    
    if (threshold.amount === 1000) {
        // Special handling for $1000 paywall
        const name = prompt("Enter your name for the sky:");
        if (!name) {
            playPaywallAudio(threshold.amount.toString(), 'payCancel');
            return;
        }
        // Here you would integrate with Stripe or other payment processor
        // For now, we'll just simulate success
        playPaywallAudio(threshold.amount.toString(), 'paySuccess');
    } else {
        // Here you would integrate with Stripe or other payment processor
        // For now, we'll just simulate success
        playPaywallAudio(threshold.amount.toString(), 'paySuccess');
    }
    
    removePaywallUI();
}

// Function to play paywall audio
async function playPaywallAudio(amount, type, name = '') {
    if (!paywallAudios[amount] || !paywallAudios[amount][type]) {
        console.log(`No paywall audio found for ${amount}/${type}`);
        return;
    }

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

        // Get the paywall audio
        currentAudio = paywallAudios[amount][type];
        currentAudio.currentTime = 0;

        const playPromise = new Promise(resolve => {
            const onEnded = () => {
                currentAudio.removeEventListener('ended', onEnded);
                resolve();
            };
            currentAudio.addEventListener('ended', onEnded);
        });

        console.log(`Playing paywall audio ${amount}/${type}`);
        await currentAudio.play();

        // Wait for the audio to finish
        await playPromise;

        audioPlaying = false;
        lastAudioEndTime = Date.now();

    } catch (error) {
        console.error(`Failed to play paywall audio ${amount}/${type}:`, error);
        audioPlaying = false;
        lastAudioEndTime = Date.now();
    }
}

// Function to speak text using Web Speech API
function speakTTS(text) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties
    utterance.pitch = 0.9;
    utterance.rate = 0.85;
    
    // Try to find an American English voice
    const voices = window.speechSynthesis.getVoices();
    const americanVoice = voices.find(voice => 
        voice.lang.includes('en-US') || voice.lang.includes('en')
    );
    
    if (americanVoice) {
        utterance.voice = americanVoice;
    }
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
} 