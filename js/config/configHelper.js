/**
 * @file configHelper.js
 * @description Helper functions for working with the application configuration.
 * Provides compatibility between appConfiguratie and getLijstConfig interfaces.
 */

// Immediately-invoked function expression to avoid polluting the global scope
(function() {
    // Create a fallback appConfiguratie if it doesn't exist
    if (typeof window.appConfiguratie === "undefined") {
        console.warn("Creating fallback appConfiguratie object because it was not found");
        window.appConfiguratie = {
            instellingen: {
                debounceTimer: 300,
                siteUrl: ""  // Empty site URL will cause graceful fallbacks
            }
        };
    }

    /**
     * Gets the configuration for a specific list, using either getLijstConfig or appConfiguratie
     * @param {string} lijstNaam - The name of the list to get configuration for
     * @returns {object|null} The list configuration or null if not found
     */
    function getListConfig(lijstNaam) {
        // Try the new getLijstConfig function first
        if (typeof window.getLijstConfig === 'function') {
            const config = window.getLijstConfig(lijstNaam);
            if (config) {
                return config;
            }
        }
        
        // Fall back to the old appConfiguratie object
        if (window.appConfiguratie && window.appConfiguratie[lijstNaam]) {
            return window.appConfiguratie[lijstNaam];
        }
        
        // Return null if configuration not found
        console.warn(`Configuration for list ${lijstNaam} not found in either appConfiguratie or getLijstConfig`);
        return null;
    }

    /**
     * Gets the site URL from configuration
     * @returns {string} The SharePoint site URL or an empty string if not found
     */
    function getSiteUrl() {
        return window.appConfiguratie?.instellingen?.siteUrl || "";
    }

    // Expose functions to global scope
    window.ConfigHelper = {
        getListConfig,
        getSiteUrl
    };
})();