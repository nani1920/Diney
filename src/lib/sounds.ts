import { toast } from 'react-hot-toast';

export const playNotificationChime = () => {
    try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Notification sound blocked:", error);
                toast.error("Enable sounds for order alerts", { 
                    id: 'audio-blocked',
                    duration: 5000 
                });
            });
        }
    } catch (e) {
        console.warn('Audio playback not supported', e);
    }
};

export const playUserReadyChime = () => {
    try {
        const audio = new Audio('/user-notification.mp3');
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.warn("User chime blocked:", error));
        }
    } catch (e) {
        console.warn('Audio playback not supported', e);
    }
};

export const playAlertChime = () => {
    try {
        const audio = new Audio('/alert.mp3');
        audio.volume = 1.0;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Alert sound blocked:", error);
                toast.error("Click anywhere to enable alert sounds", { 
                    id: 'audio-blocked',
                    duration: 5000 
                });
            });
        }
    } catch (e) {
        console.warn('Audio playback not supported', e);
    }
};

export const triggerReadyVibration = () => {
    try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            // High-intensity triple pulse: 300ms, 100ms pause, 300ms, 100ms pause, 600ms long pulse
            navigator.vibrate([300, 100, 300, 100, 600]);
        }
    } catch (e) {
        console.warn('Ready vibration failed:', e);
    }
};

export const triggerStatusVibration = () => {
    try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            // Simple single pulse for status transitions
            navigator.vibrate(200);
        }
    } catch (e) {
        console.warn('Status vibration failed:', e);
    }
};
