export const playNotificationChime = () => {
    try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => {
            console.warn('Audio play failed:', e);
        });
    } catch (e) {
        console.warn('Audio playback not supported', e);
    }
};
