/**
 * @file NotificationSystem.js
 * @description Modern notification/toast system for user feedback
 * Replaces alert(), confirm(), and prompt() with better UX
 * Following coding instructions from CLAUDE.md
 */

const { createElement: h, useState, useEffect } = React;

/**
 * Notification types with their styling
 */
const NOTIFICATION_TYPES = {
    success: {
        icon: 'fas fa-check-circle',
        color: '#10b981',
        bgColor: '#ecfdf5',
        borderColor: '#10b981'
    },
    error: {
        icon: 'fas fa-exclamation-triangle',
        color: '#ef4444',
        bgColor: '#fef2f2',
        borderColor: '#ef4444'
    },
    warning: {
        icon: 'fas fa-exclamation-circle',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        borderColor: '#f59e0b'
    },
    info: {
        icon: 'fas fa-info-circle',
        color: '#3b82f6',
        bgColor: '#eff6ff',
        borderColor: '#3b82f6'
    }
};

/**
 * Global notification state management
 */
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.nextId = 1;
        this.listeners = [];
    }

    /**
     * Add a new notification
     * @param {string} message - The notification message
     * @param {string} type - The notification type (success, error, warning, info)
     * @param {number} duration - Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
     * @param {string} title - Optional title for the notification
     * @returns {number} - The notification ID
     */
    show(message, type = 'info', duration = 5000, title = null) {
        const notification = {
            id: this.nextId++,
            message,
            type,
            title,
            duration,
            timestamp: Date.now(),
            dismissed: false
        };

        this.notifications.push(notification);
        this.notifyListeners();

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification.id);
            }, duration);
        }

        console.log('📢 Notification created:', notification);
        return notification.id;
    }

    /**
     * Show success notification
     * @param {string} message - The success message
     * @param {string} title - Optional title
     * @param {number} duration - Auto-dismiss duration
     * @returns {number} - The notification ID
     */
    success(message, title = null, duration = 4000) {
        return this.show(message, 'success', duration, title);
    }

    /**
     * Show error notification
     * @param {string} message - The error message
     * @param {string} title - Optional title
     * @param {number} duration - Auto-dismiss duration (0 = manual dismiss)
     * @returns {number} - The notification ID
     */
    error(message, title = null, duration = 0) {
        return this.show(message, 'error', duration, title);
    }

    /**
     * Show warning notification
     * @param {string} message - The warning message
     * @param {string} title - Optional title
     * @param {number} duration - Auto-dismiss duration
     * @returns {number} - The notification ID
     */
    warning(message, title = null, duration = 6000) {
        return this.show(message, 'warning', duration, title);
    }

    /**
     * Show info notification
     * @param {string} message - The info message
     * @param {string} title - Optional title
     * @param {number} duration - Auto-dismiss duration
     * @returns {number} - The notification ID
     */
    info(message, title = null, duration = 5000) {
        return this.show(message, 'info', duration, title);
    }

    /**
     * Dismiss a notification
     * @param {number} id - The notification ID to dismiss
     */
    dismiss(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notifyListeners();
        console.log('📢 Notification dismissed:', id);
    }

    /**
     * Clear all notifications
     */
    clear() {
        this.notifications = [];
        this.notifyListeners();
        console.log('📢 All notifications cleared');
    }

    /**
     * Get all active notifications
     * @returns {Array} - Array of notification objects
     */
    getNotifications() {
        return this.notifications.filter(n => !n.dismissed);
    }

    /**
     * Add a listener for notification changes
     * @param {Function} listener - Callback function to call when notifications change
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Remove a listener
     * @param {Function} listener - The listener to remove
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    /**
     * Notify all listeners of notification changes
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.getNotifications());
            } catch (error) {
                console.error('Error in notification listener:', error);
            }
        });
    }
}

// Create global instance
const NotificationManagerInstance = new NotificationManager();

/**
 * Individual notification component
 */
const NotificationItem = ({ notification, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;

    // Animate in on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsRemoving(true);
        setTimeout(() => {
            onDismiss(notification.id);
        }, 300);
    };

    const notificationStyle = {
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isRemoving ? 0 : (isVisible ? 1 : 0),
        transition: 'all 0.3s ease-in-out',
        marginBottom: '12px',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: typeConfig.bgColor,
        borderLeft: `4px solid ${typeConfig.borderColor}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        maxWidth: '400px',
        minWidth: '300px',
        position: 'relative'
    };

    return h('div', { style: notificationStyle },
        // Icon
        h('div', { 
            style: { 
                color: typeConfig.color,
                fontSize: '18px',
                flexShrink: 0,
                marginTop: '2px'
            }
        },
            h('i', { className: typeConfig.icon })
        ),
        
        // Content
        h('div', { 
            style: { 
                flex: 1,
                minWidth: 0
            }
        },
            // Title (if provided)
            notification.title && h('div', {
                style: {
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '4px',
                    fontSize: '14px'
                }
            }, notification.title),
            
            // Message
            h('div', {
                style: {
                    color: '#374151',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                }
            }, notification.message)
        ),
        
        // Close button
        h('button', {
            onClick: handleDismiss,
            style: {
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                borderRadius: '4px',
                flexShrink: 0,
                marginTop: '-2px'
            },
            onMouseOver: (e) => e.target.style.color = '#374151',
            onMouseOut: (e) => e.target.style.color = '#6b7280',
            title: 'Sluiten'
        },
            h('i', { className: 'fas fa-times' })
        )
    );
};

/**
 * Main notification container component
 */
const NotificationContainer = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Listen for notification changes
        const handleNotificationChange = (updatedNotifications) => {
            setNotifications(updatedNotifications);
        };

        NotificationManagerInstance.addListener(handleNotificationChange);

        // Cleanup listener on unmount
        return () => {
            NotificationManagerInstance.removeListener(handleNotificationChange);
        };
    }, []);

    if (notifications.length === 0) return null;

    const containerStyle = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        pointerEvents: 'none'
    };

    return h('div', { style: containerStyle },
        notifications.map(notification =>
            h(NotificationItem, {
                key: notification.id,
                notification,
                onDismiss: NotificationManagerInstance.dismiss.bind(NotificationManagerInstance),
                style: { pointerEvents: 'auto' }
            })
        )
    );
};

/**
 * Hook for using notifications in React components
 * @returns {Object} - Notification manager methods
 */
const useNotifications = () => {
    return {
        success: NotificationManagerInstance.success.bind(NotificationManagerInstance),
        error: NotificationManagerInstance.error.bind(NotificationManagerInstance),
        warning: NotificationManagerInstance.warning.bind(NotificationManagerInstance),
        info: NotificationManagerInstance.info.bind(NotificationManagerInstance),
        clear: NotificationManagerInstance.clear.bind(NotificationManagerInstance)
    };
};

/**
 * Initialize the notification system
 * Call this once in your main app to render the notification container
 */
const initializeNotificationSystem = () => {
    // Create container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    // Render notification container
    const root = ReactDOM.createRoot(container);
    root.render(h(NotificationContainer));
    
    console.log('📢 Notification system initialized');
};

// Export for use in other modules
window.NotificationSystem = {
    init: initializeNotificationSystem,
    success: NotificationManagerInstance.success.bind(NotificationManagerInstance),
    error: NotificationManagerInstance.error.bind(NotificationManagerInstance),
    warning: NotificationManagerInstance.warning.bind(NotificationManagerInstance),
    info: NotificationManagerInstance.info.bind(NotificationManagerInstance),
    clear: NotificationManagerInstance.clear.bind(NotificationManagerInstance)
};

// Export for ES6 modules
export { NotificationContainer, useNotifications, initializeNotificationSystem };
export default NotificationManagerInstance;

console.log('✅ NotificationSystem loaded successfully');