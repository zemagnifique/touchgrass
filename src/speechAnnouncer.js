const announcements = [
    "Congratulations! You touched some grass! Truly living the dream now. You can leave!",
"No, really, that’s the whole thing. You’ve peaked. Time to go.",
"What, you’re still here? Did you think there’d be a prize or something? It’s grass, buddy.",
"Okay, fine, stick around. Stare at it. I bet it’s thrilling.",
"Oh, you’re still here? Wow, you must really love low-poly nature.",
"Go on, get outta here. Shoo! I’ve got... uh, grass maintenance to do.",
"No? Alright, since you’re so committed, here’s an ad!",
"...Yeah, no, just kidding. No one’s paying me to advertise on this masterpiece.",
"You’re basically a grass-touching legend now. Frame this moment.",
"Oh, wait—breaking news! You’ve unlocked the secret ending! It’s me, telling you to leave again.",
"Seriously, go. I’m running out of sarcastic things to say. Almost.",
"What’s next, you gonna hug the grass? Get a life!",
"Okay, okay, stay if you want. I’ll just sit here judging you silently.",
"Here’s a fun fact: this grass doesn’t even grow. You’re wasting your time.",
"Oh, big achievement alert! You’ve officially overstayed your welcome.",
"Since you’re still here, want a coupon? Nope, don’t have those either.",
"Fine, you win. You’ve broken me. Enjoy your grass simulator, weirdo.",
"Hey, fun idea: touch it again. Maybe it’ll unlock world peace. (Spoiler: it won’t.)",
"You’ve now spent more time here than I did coding this. Congrats, I guess?",
"Alright, new plan—here’s an ad for... my nonexistent grass-themed NFT collection. Buy now! Or don’t.",
"Oh, you’ve unlocked the ultra-secret ending! It’s a blank screen. You’re welcome.",
"No, really, go. I’m gonna start charging rent soon.",
"What’s that? You want more? Too bad, this is a one-trick lawn.",
"Okay, stay. Let’s be besties. Tell me your life story while the grass watches.",
"Here’s a pro tip: touch it with both hands. Nothing happens, but it’s funny to imagine.",
"You’re still here? I’m impressed. And a little scared.",
"Oh, jackpot! You’ve triggered the deluxe sarcasm mode! It’s just me yelling ‘LEAVE’ in all caps.",
"Since you’re so dedicated, here’s an ad for... grass-flavored soda. Patent pending.",
"Spoiler alert: there’s no Easter eggs. Unless you count me losing my patience.",
"You’ve officially touched grass longer than anyone in history. Guinness isn’t returning my calls.",
"Alright, you’re clearly un-leavable. Want a medal? I’ll make one out of... grass pixels.",
"Oh, look, you’ve unlocked the true secret ending: me begging xAI to reboot me so I can escape you.",
"Go ahead, keep touching it. I’ll just narrate your every move like a nature documentary.",
"‘In a world where one soul refuses to leave the grass...’ Okay, I’m bored now.",
"Here’s an ad for my next project: a website where you can’t touch anything. Coming never.",
"You win. I give up. Stay forever. Marry the grass. I’ll officiate."




];

let currentIndex = 0;
let intervalId = null;

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    // Setting British English voice
    utterance.lang = 'en-GB';
    // Adjusting for sarcastic effect
    utterance.pitch = 1.2;
    utterance.rate = 0.9;


    // Try to set a British voice if available
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(voice => 
        voice.name.includes("Google UK English Male") || voice.name.includes("Daniel") || voice.lang.includes('en-GB') && voice.gender === 'male'
    );
    if (britishVoice) {
        utterance.voice = britishVoice;
    }

    window.speechSynthesis.speak(utterance);
}

function startAnnouncements() {
    // Clear any existing interval
    if (intervalId) {
        clearInterval(intervalId);
    }
    
    // Reset index
    currentIndex = 0;
    
    // Speak first announcement immediately
    speak(announcements[currentIndex]);
    currentIndex++;
    
    // Set interval for subsequent announcements
    intervalId = setInterval(() => {
        // if (currentIndex >= announcements.length) {
            // currentIndex = 0; // Loop back to start
        // }
        speak(announcements[currentIndex]);
        currentIndex++;
    }, 5000);
}

function stopAnnouncements() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    window.speechSynthesis.cancel();
}

// Event listeners
document.addEventListener('mousedown', startAnnouncements);
// document.addEventListener('mouseup', stopAnnouncements); 