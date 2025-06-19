/**
 * Central configuration for application paths
 * This handles different environments and path construction
 */
window.appPaths = (function() {
    // Helper to get clean base URL (without duplicated domains)
    function getCleanBaseUrl() {
        if (!window.spWebAbsoluteUrl) {
            return 'https://som.org.om.local/sites/MulderT/CustomPW/Verlof';
        }
        
        // Remove protocol and domain if it's an absolute URL
        let url = window.spWebAbsoluteUrl;
        
        // Check if URL already contains the domain name
        if (url.includes('//')) {
            // Extract just the path portion after the domain
            const urlParts = url.split('/');
            if (urlParts.length >= 3) {
                // Remove protocol and domain, keep only the path
                url = '/' + urlParts.slice(3).join('/');
            }
        }
        
        // If we're left with just a path, add the domain
        if (url.startsWith('/')) {
            return 'https://som.org.om.local' + url;
        }
        
        return url;
    }
    
    // Base paths for different environments
    const paths = {
        // Root URL for SharePoint site (cleaned to prevent duplication)
        baseUrl: getCleanBaseUrl(),
        
        // Application structure
        segments: {
            cpw: '/CPW',            // Document library (note: case sensitive)
            rooster: '/rooster',    // Main application folder
            pages: '/pages',        // Pages subfolder
            css: '/css',            // CSS subfolder
            js: '/js',              // JS subfolder
            img: '/img'             // Images subfolder
        },
        
        // API paths
        apiPaths: {
            listBase: ''            // Empty means use baseUrl for list operations
        },
        
        // File extensions
        extensions: {
            css: '.css',
            js: '.js',
            aspx: '.aspx'
        }
    };
    
    // Helper to normalize paths and prevent double slashes
    function normalizePath(path) {
        // First, fix any protocol-specific double slashes
        let normalizedPath = path;
        
        // Protect the protocol double slash
        if (normalizedPath.startsWith('http://')) {
            normalizedPath = 'http://' + normalizedPath.substring(7).replace(/\/+/g, '/');
        } else if (normalizedPath.startsWith('https://')) {
            normalizedPath = 'https://' + normalizedPath.substring(8).replace(/\/+/g, '/');
        } else {
            normalizedPath = normalizedPath.replace(/\/+/g, '/');
        }
        
        return normalizedPath;
    }
    
    // Log configuration for debugging
    console.log('[appPaths] Initialized with baseUrl:', paths.baseUrl);
    
    return {
        /**
         * Get the full URL for a CSS file
         * @param {string} cssName - Name of CSS file without extension
         * @returns {string} Full URL to the CSS file
         */
        getCssUrl: function(cssName) {
            const url = normalizePath(
                `${paths.baseUrl}${paths.segments.cpw}${paths.segments.rooster}${paths.segments.pages}${paths.segments.css}/${cssName}${paths.extensions.css}`
            );
            console.log(`[appPaths] Generated CSS URL: ${url}`);
            return url;
        },
        
        /**
         * Get the full URL for a JavaScript file
         * @param {string} jsName - Name of JS file without extension
         * @returns {string} Full URL to the JS file
         */
        getJsUrl: function(jsName) {
            return normalizePath(
                `${paths.baseUrl}${paths.segments.cpw}${paths.segments.rooster}${paths.segments.js}/${jsName}${paths.extensions.js}`
            );
        },
        
        /**
         * Get the full URL for a page
         * @param {string} pageName - Name of page without extension
         * @returns {string} Full URL to the page
         */
        getPageUrl: function(pageName) {
            return normalizePath(
                `${paths.baseUrl}${paths.segments.cpw}${paths.segments.rooster}${paths.segments.pages}/${pageName}${paths.extensions.aspx}`
            );
        },
        
        /**
         * Get the root path for API calls to SharePoint lists
         * @returns {string} The base URL for API calls
         */
        getApiUrl: function() {
            return paths.apiPaths.listBase ? 
                normalizePath(`${paths.baseUrl}${paths.apiPaths.listBase}`) : 
                paths.baseUrl;
        },
        
        /**
         * Get a custom path using segments
         * @param {string[]} segments - Array of path segments
         * @returns {string} Normalized custom path
         */
        getCustomPath: function(segments) {
            return normalizePath([paths.baseUrl, ...segments].join('/'));
        },
        
        /**
         * Update base URL if needed
         * @param {string} newBaseUrl - New base URL to use
         */
        setBaseUrl: function(newBaseUrl) {
            paths.baseUrl = newBaseUrl;
        },
        
        /**
         * Get the main application (rooster) URL
         * @returns {string} URL to the main application folder
         */
        getAppUrl: function() {
            return normalizePath(`${paths.baseUrl}${paths.segments.cpw}${paths.segments.rooster}/`);
        }
    };
})();