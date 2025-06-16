/**
 * UI Utilities for the Verlofrooster Applicatie
 * Provides common UI functions like spinners, toast notifications and other UI helpers 
 */

// Create spinner overlay if it doesn't exist
(() => {
    // Create spinner overlay if it doesn't exist in DOM
    if (!document.getElementById('global-spinner-overlay')) {
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'global-spinner-overlay';
        spinnerOverlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 hidden';
        
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'bg-white p-5 rounded-lg shadow-lg flex flex-col items-center';
        
        const spinner = document.createElement('div');
        spinner.className = 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500';
        
        const message = document.createElement('div');
        message.id = 'spinner-message';
        message.className = 'text-gray-700 font-medium mt-3';
        message.innerText = 'Laden...';
        
        spinnerContainer.appendChild(spinner);
        spinnerContainer.appendChild(message);
        spinnerOverlay.appendChild(spinnerContainer);
        
        document.body.appendChild(spinnerOverlay);
    }
})();

/**
 * Shows a loading spinner overlay with custom message
 * @param {string} message - Message to display under the spinner
 */
window.showSpinner = function(message = 'Laden...') {
    const overlay = document.getElementById('global-spinner-overlay');
    const messageEl = document.getElementById('spinner-message');
    
    if (overlay && messageEl) {
        messageEl.innerText = message;
        overlay.classList.remove('hidden');
    } else {
        console.error('[UI Utilities] Spinner elementen niet gevonden in DOM');
    }
};

/**
 * Hides the spinner overlay
 */
window.hideSpinner = function() {
    const overlay = document.getElementById('global-spinner-overlay');
    
    if (overlay) {
        overlay.classList.add('hidden');
    } else {
        console.error('[UI Utilities] Spinner element niet gevonden in DOM');
    }
};

/**
 * Shows a toast notification
 * @param {string} message - Message to display in the toast
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in ms to show the toast
 */
window.showToast = function(message, type = 'info', duration = 3000) {
    // Remove any existing toasts to avoid stacking
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast-notification fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out`;
    
    // Set toast color based on type
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            toast.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500', 'text-white');
            break;
        default: // info
            toast.classList.add('bg-blue-500', 'text-white');
    }
    
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('translate-y-0', 'opacity-100');
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
};

// Add minimal CSS for UI utilities if needed
(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .toast-notification {
            transform: translateY(10px);
            opacity: 0;
        }
    `;
    document.head.appendChild(styleElement);
})();

/**
 * Shows a notification within a modal context.
 * Placeholder - actual implementation needs to be confirmed.
 * @param {string} message - Message to display.
 * @param {'success'|'error'|'info'} type - Type of notification.
 * @param {number|false} [autoHideDelay=7000] - Delay for auto-hide.
 */
window.toonModalNotificatie = function(message, type = 'info', autoHideDelay = 7000) {
    // Placeholder implementation - this function's actual body
    // should be in ui_utilities.js and might interact with modal-specific DOM elements.
    // For now, let's log to console to indicate it was called.
    console.log(`[toonModalNotificatie Placeholder] Type: ${type}, Message: ${message}, AutoHide: ${autoHideDelay}`);
    
    // Example: If you have a generic modal notification element you can update it here.
    // const modalNotificationElement = document.getElementById('generic-modal-notification-area');
    // if (modalNotificationElement) {
    //     modalNotificationElement.textContent = message;
    //     modalNotificationElement.className = `notification ${type}`;
    //     modalNotificationElement.style.display = 'block';
    //     if (autoHideDelay) {
    //         setTimeout(() => { modalNotificationElement.style.display = 'none'; }, autoHideDelay);
    //     }
    // } else {
    //     // Fallback or error if no generic modal notification area is defined
    //     window.showToast(message, type, autoHideDelay || 5000);
    // }
};

// Log that UI utilities are loaded
console.log("[UI Utilities] UI hulpfuncties (spinner, toast, toonModalNotificatie) zijn geladen en beschikbaar.");
