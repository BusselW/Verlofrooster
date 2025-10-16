/**
 * modalLayouts.js - Modal layout configurations for different form types
 * This file defines reusable modal layout configurations that can be used across different forms.
 */

/**
 * Base modal configuration template
 */
export const baseModalConfig = {
    // Modal size options: 'small', 'medium', 'large', 'xlarge', 'full'
    width: 'medium',
    
    // Modal height options: 'auto', 'small', 'medium', 'large', 'full'
    height: 'auto',
    
    // Header configuration
    header: {
        showIcon: true,
        showCloseButton: true,
        gradient: 'primary', // 'primary', 'success', 'warning', 'error', 'info', 'none'
        textColor: 'inverse' // 'primary', 'secondary', 'inverse'
    },
    
    // Body configuration
    body: {
        padding: 'default', // 'none', 'small', 'default', 'large'
        background: 'surface', // 'canvas', 'surface', 'transparent'
        scrollable: true
    },
    
    // Footer configuration
    footer: {
        show: true,
        alignment: 'right', // 'left', 'center', 'right', 'space-between'
        padding: 'default', // 'none', 'small', 'default', 'large'
        background: 'surface', // 'canvas', 'surface', 'transparent'
        sticky: true // Whether footer sticks to bottom
    },
    
    // Animation configuration
    animation: {
        enter: 'slideIn', // 'fadeIn', 'slideIn', 'scaleIn', 'none'
        exit: 'slideOut', // 'fadeOut', 'slideOut', 'scaleOut', 'none'
        duration: 'normal' // 'fast', 'normal', 'slow'
    },
    
    // Backdrop configuration
    backdrop: {
        show: true,
        blur: true,
        dismissible: true // Whether clicking backdrop closes modal
    }
};

/**
 * Employee form modal configuration
 */
export const employeeFormConfig = {
    ...baseModalConfig,
    width: 'large',
    header: {
        ...baseModalConfig.header,
        showIcon: true,
        gradient: 'primary'
    },
    specialSections: {
        // Autocomplete section for new employees
        autocomplete: {
            show: true,
            title: 'Zoek Medewerker',
            icon: '🔍',
            background: 'info', // 'primary', 'success', 'warning', 'error', 'info'
            searchPlaceholder: 'Type om te zoeken naar medewerkers...',
            helpText: 'Zoek een bestaande medewerker om gegevens automatisch in te vullen'
        },
        // Toggle section configuration
        toggleSection: {
            background: 'neutral', // 'primary', 'success', 'warning', 'error', 'info', 'neutral'
            icon: '⚙️',
            layout: 'cards' // 'list', 'cards', 'compact'
        }
    }
};

/**
 * Standard form modal configuration (for simple CRUD forms)
 */
export const standardFormConfig = {
    ...baseModalConfig,
    width: 'medium',
    header: {
        ...baseModalConfig.header,
        gradient: 'none',
        textColor: 'primary'
    }
};

/**
 * Settings form modal configuration
 */
export const settingsFormConfig = {
    ...baseModalConfig,
    width: 'large',
    header: {
        ...baseModalConfig.header,
        gradient: 'info',
        showIcon: true
    },
    specialSections: {
        toggleSection: {
            background: 'primary',
            icon: '⚙️',
            layout: 'compact'
        }
    }
};

/**
 * Confirmation modal configuration
 */
export const confirmationModalConfig = {
    ...baseModalConfig,
    width: 'small',
    height: 'auto',
    header: {
        ...baseModalConfig.header,
        gradient: 'warning',
        showIcon: true
    },
    footer: {
        ...baseModalConfig.footer,
        alignment: 'right'
    },
    animation: {
        enter: 'scaleIn',
        exit: 'scaleOut',
        duration: 'fast'
    }
};

/**
 * View-only modal configuration (for displaying information)
 */
export const viewModalConfig = {
    ...baseModalConfig,
    width: 'medium',
    header: {
        ...baseModalConfig.header,
        gradient: 'none',
        textColor: 'primary'
    },
    footer: {
        show: false
    },
    body: {
        ...baseModalConfig.body,
        padding: 'large'
    }
};

/**
 * Wizard modal configuration (for multi-step forms)
 */
export const wizardModalConfig = {
    ...baseModalConfig,
    width: 'xlarge',
    height: 'large',
    header: {
        ...baseModalConfig.header,
        gradient: 'primary',
        showIcon: true
    },
    footer: {
        ...baseModalConfig.footer,
        alignment: 'space-between', // For prev/next buttons
        sticky: true
    },
    specialSections: {
        stepper: {
            show: true,
            position: 'header', // 'header', 'body', 'sidebar'
            style: 'progress' // 'dots', 'progress', 'numbered'
        }
    }
};

/**
 * Full screen modal configuration (for complex interfaces)
 */
export const fullscreenModalConfig = {
    ...baseModalConfig,
    width: 'full',
    height: 'full',
    header: {
        ...baseModalConfig.header,
        gradient: 'primary',
        showIcon: true
    },
    footer: {
        show: false
    },
    body: {
        ...baseModalConfig.body,
        padding: 'none'
    },
    backdrop: {
        show: false,
        blur: false,
        dismissible: false
    }
};

/**
 * Get modal configuration by type
 * @param {string} type - Modal type identifier
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Complete modal configuration
 */
export function getModalConfig(type, overrides = {}) {
    const configs = {
        employee: employeeFormConfig,
        standard: standardFormConfig,
        settings: settingsFormConfig,
        confirmation: confirmationModalConfig,
        view: viewModalConfig,
        wizard: wizardModalConfig,
        fullscreen: fullscreenModalConfig
    };
    
    const baseConfig = configs[type] || standardFormConfig;
    
    // Deep merge configuration with overrides
    return deepMerge(baseConfig, overrides);
}

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

/**
 * Modal width mappings in CSS
 */
export const modalWidths = {
    small: '400px',
    medium: '600px',
    large: '800px',
    xlarge: '1200px',
    full: '100vw'
};

/**
 * Modal height mappings in CSS
 */
export const modalHeights = {
    auto: 'auto',
    small: '400px',
    medium: '600px',
    large: '800px',
    full: '100vh'
};