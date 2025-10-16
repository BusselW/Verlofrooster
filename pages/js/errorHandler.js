// errorHandler.js - Centralized error handling for VERLI applications
// Provides consistent error handling, logging, and user feedback

/**
 * Error types for categorization
 */
export const ErrorTypes = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    PERMISSION: 'permission',
    SHAREPOINT: 'sharepoint',
    GENERAL: 'general'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Main error handler class
 */
export class VERLIErrorHandler {
    constructor() {
        this.errorLog = [];
        this.onError = null;
        this.notifications = [];
        this.debug = false;
    }

    /**
     * Set debug mode
     * @param {boolean} enabled 
     */
    setDebugMode(enabled) {
        this.debug = enabled;
    }

    /**
     * Set error callback
     * @param {Function} callback 
     */
    setErrorCallback(callback) {
        this.onError = callback;
    }

    /**
     * Handle an error
     * @param {Error|string} error 
     * @param {string} type 
     * @param {string} severity 
     * @param {Object} context 
     */
    handleError(error, type = ErrorTypes.GENERAL, severity = ErrorSeverity.MEDIUM, context = {}) {
        const errorInfo = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            error: error,
            message: typeof error === 'string' ? error : error.message,
            type,
            severity,
            context,
            stack: error.stack || null,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log to console if debug mode
        if (this.debug) {
            console.error('VERLI Error:', errorInfo);
        }

        // Add to error log
        this.errorLog.push(errorInfo);

        // Keep only last 100 errors
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }

        // Show user notification
        this.showUserNotification(errorInfo);

        // Call error callback if set
        if (this.onError) {
            this.onError(errorInfo);
        }

        return errorInfo;
    }

    /**
     * Handle SharePoint API errors
     * @param {Error} error 
     * @param {string} operation 
     * @param {string} listName 
     */
    handleSharePointError(error, operation, listName) {
        let message = 'Er is een fout opgetreden bij het verwerken van de gegevens.';
        let type = ErrorTypes.SHAREPOINT;
        let severity = ErrorSeverity.MEDIUM;

        // Parse SharePoint error messages
        if (error.message) {
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                message = 'U bent niet geautoriseerd om deze actie uit te voeren.';
                type = ErrorTypes.AUTHENTICATION;
                severity = ErrorSeverity.HIGH;
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                message = 'U heeft geen rechten om deze actie uit te voeren.';
                type = ErrorTypes.PERMISSION;
                severity = ErrorSeverity.HIGH;
            } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                message = `De lijst '${listName}' kon niet worden gevonden.`;
                type = ErrorTypes.SHAREPOINT;
                severity = ErrorSeverity.HIGH;
            } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
                message = 'De verzonden gegevens zijn ongeldig.';
                type = ErrorTypes.VALIDATION;
                severity = ErrorSeverity.MEDIUM;
            } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
                message = 'Er is een serverfout opgetreden. Probeer het later opnieuw.';
                type = ErrorTypes.SHAREPOINT;
                severity = ErrorSeverity.HIGH;
            }
        }

        return this.handleError(error, type, severity, {
            operation,
            listName,
            userMessage: message
        });
    }

    /**
     * Handle validation errors
     * @param {Array} validationErrors 
     * @param {string} context 
     */
    handleValidationErrors(validationErrors, context) {
        const message = 'Er zijn validatiefouten gevonden in het formulier.';
        return this.handleError(message, ErrorTypes.VALIDATION, ErrorSeverity.MEDIUM, {
            validationErrors,
            context
        });
    }

    /**
     * Handle network errors
     * @param {Error} error 
     * @param {string} url 
     */
    handleNetworkError(error, url) {
        let message = 'Er is een netwerkfout opgetreden.';
        
        if (!navigator.onLine) {
            message = 'U bent offline. Controleer uw internetverbinding.';
        } else if (error.message.includes('timeout')) {
            message = 'De verbinding is verlopen. Probeer het opnieuw.';
        } else if (error.message.includes('Failed to fetch')) {
            message = 'Kan geen verbinding maken met de server.';
        }

        return this.handleError(error, ErrorTypes.NETWORK, ErrorSeverity.HIGH, {
            url,
            userMessage: message
        });
    }

    /**
     * Show user notification
     * @param {Object} errorInfo 
     */
    showUserNotification(errorInfo) {
        const notification = {
            id: errorInfo.id,
            type: 'error',
            title: this.getErrorTitle(errorInfo.type),
            message: errorInfo.context.userMessage || this.getDefaultErrorMessage(errorInfo.type),
            severity: errorInfo.severity,
            timestamp: errorInfo.timestamp,
            autoClose: errorInfo.severity === ErrorSeverity.LOW ? 5000 : 0
        };

        this.notifications.push(notification);
        this.displayNotification(notification);
    }

    /**
     * Get error title based on type
     * @param {string} type 
     * @returns {string}
     */
    getErrorTitle(type) {
        const titles = {
            [ErrorTypes.NETWORK]: 'Netwerkfout',
            [ErrorTypes.VALIDATION]: 'Validatiefout',
            [ErrorTypes.AUTHENTICATION]: 'Authenticatiefout',
            [ErrorTypes.PERMISSION]: 'Toegangsfout',
            [ErrorTypes.SHAREPOINT]: 'SharePoint Fout',
            [ErrorTypes.GENERAL]: 'Algemene Fout'
        };
        return titles[type] || titles[ErrorTypes.GENERAL];
    }

    /**
     * Get default error message based on type
     * @param {string} type 
     * @returns {string}
     */
    getDefaultErrorMessage(type) {
        const messages = {
            [ErrorTypes.NETWORK]: 'Er is een netwerkfout opgetreden. Controleer uw internetverbinding.',
            [ErrorTypes.VALIDATION]: 'De ingevoerde gegevens zijn ongeldig.',
            [ErrorTypes.AUTHENTICATION]: 'U moet zich opnieuw aanmelden.',
            [ErrorTypes.PERMISSION]: 'U heeft geen rechten om deze actie uit te voeren.',
            [ErrorTypes.SHAREPOINT]: 'Er is een probleem met SharePoint. Probeer het later opnieuw.',
            [ErrorTypes.GENERAL]: 'Er is een onbekende fout opgetreden.'
        };
        return messages[type] || messages[ErrorTypes.GENERAL];
    }

    /**
     * Display notification to user
     * @param {Object} notification 
     */
    displayNotification(notification) {
        // Create notification element
        const notificationElement = document.createElement('div');
        notificationElement.className = `verli-notification verli-notification-${notification.type} verli-notification-${notification.severity}`;
        notificationElement.innerHTML = `
            <div class="verli-notification-header">
                <h4 class="verli-notification-title">${notification.title}</h4>
                <button class="verli-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="verli-notification-content">${notification.message}</div>
        `;

        // Add to page
        let container = document.getElementById('verli-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'verli-notifications';
            container.className = 'verli-notifications-container';
            document.body.appendChild(container);
        }

        container.appendChild(notificationElement);

        // Auto-remove if specified
        if (notification.autoClose) {
            setTimeout(() => {
                notificationElement.remove();
            }, notification.autoClose);
        }
    }

    /**
     * Generate unique error ID
     * @returns {string}
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get error log
     * @returns {Array}
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Get error statistics
     * @returns {Object}
     */
    getErrorStatistics() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            recent: this.errorLog.slice(-10)
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }
}

/**
 * Global error handler instance
 */
export const errorHandler = new VERLIErrorHandler();

/**
 * Utility function to wrap async functions with error handling
 * @param {Function} fn 
 * @param {string} context 
 * @returns {Function}
 */
export function withErrorHandling(fn, context = '') {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            errorHandler.handleError(error, ErrorTypes.GENERAL, ErrorSeverity.MEDIUM, {
                context,
                functionName: fn.name
            });
            throw error;
        }
    };
}

/**
 * Utility function to wrap SharePoint operations
 * @param {Function} fn 
 * @param {string} operation 
 * @param {string} listName 
 * @returns {Function}
 */
export function withSharePointErrorHandling(fn, operation, listName) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            errorHandler.handleSharePointError(error, operation, listName);
            throw error;
        }
    };
}

/**
 * Add CSS for notifications
 */
function addNotificationStyles() {
    if (document.getElementById('verli-error-styles')) return;

    const style = document.createElement('style');
    style.id = 'verli-error-styles';
    style.textContent = `
        .verli-notifications-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        }

        .verli-notification {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            margin-bottom: 10px;
            pointer-events: auto;
            border-left: 4px solid #dc3545;
            animation: slideIn 0.3s ease-out;
        }

        .verli-notification-error {
            border-left-color: #dc3545;
        }

        .verli-notification-warning {
            border-left-color: #ffc107;
        }

        .verli-notification-info {
            border-left-color: #17a2b8;
        }

        .verli-notification-success {
            border-left-color: #28a745;
        }

        .verli-notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px 8px;
            border-bottom: 1px solid #eee;
        }

        .verli-notification-title {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #333;
        }

        .verli-notification-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .verli-notification-close:hover {
            color: #666;
        }

        .verli-notification-content {
            padding: 8px 16px 12px;
            font-size: 13px;
            color: #666;
            line-height: 1.4;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .verli-notification-critical {
            border-left-color: #dc3545;
            border-left-width: 6px;
        }

        .verli-notification-high {
            border-left-width: 5px;
        }

        .verli-notification-medium {
            border-left-width: 4px;
        }

        .verli-notification-low {
            border-left-width: 3px;
        }
    `;
    document.head.appendChild(style);
}

// Initialize notification styles when module loads
addNotificationStyles();

// Set up global error handler
window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, ErrorTypes.GENERAL, ErrorSeverity.MEDIUM, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, ErrorTypes.GENERAL, ErrorSeverity.MEDIUM, {
        type: 'unhandledrejection'
    });
});

console.log('✅ VERLI Error Handler loaded successfully');