import { WebHaptics } from 'web-haptics';

// Initialize WebHaptics only on the client side
let hapticsInstance: WebHaptics | null = null;
if (typeof window !== 'undefined') {
    hapticsInstance = new WebHaptics();
}

/**
 * Trigger haptic feedback using WebHaptics.
 * Safeguarded against non-browser environments.
 */
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => {
    if (hapticsInstance) {
        hapticsInstance.trigger(type).catch(() => {
            // Ignore haptic errors (e.g., if user hasn't interacted yet)
        });
    }
};

export const haptic = {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    selection: () => triggerHaptic('selection'),
};

export default haptic;
