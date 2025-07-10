// js/debug_utilities.js

/**
 * Debug utilities for diagnosing SharePoint data loading issues.
 * Only activated when Ctrl+Shift+D is pressed.
 */

(function() {
    let debugPanelVisible = false;
    
    /**
     * Initialize debug utilities
     */
    function initializeDebugUtilities() {
        console.log("[DebugUtilities] Initializing debug utilities...");
        
        // Add keyboard shortcut listener
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                toggleDebugMode();
            }
        });
        
        // Initialize debug panel elements
        const debugToggle = document.getElementById('debug-toggle');
        const debugPanel = document.getElementById('debug-panel');
        const debugPanelClose = document.getElementById('debug-panel-close');
        const debugRefresh = document.getElementById('debug-refresh');
        
        if (debugToggle) {
            debugToggle.addEventListener('click', () => toggleDebugPanel());
        }
        
        if (debugPanelClose) {
            debugPanelClose.addEventListener('click', () => hideDebugPanel());
        }
        
        if (debugRefresh) {
            debugRefresh.addEventListener('click', () => refreshDebugData());
        }
    }
    
    /**
     * Toggle debug mode (show/hide debug button)
     */
    function toggleDebugMode() {
        const debugToggle = document.getElementById('debug-toggle');
        if (debugToggle) {
            debugToggle.classList.toggle('hidden');
            console.log("[DebugUtilities] Debug mode toggled");
            
            if (!debugToggle.classList.contains('hidden')) {
                updateDebugInfo();
            }
        }
    }
    
    /**
     * Show debug panel
     */
    function showDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.classList.remove('hidden');
            debugPanelVisible = true;
            updateDebugInfo();
        }
    }
    
    /**
     * Hide debug panel
     */
    function hideDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.classList.add('hidden');
            debugPanelVisible = false;
        }
    }
    
    /**
     * Toggle debug panel visibility
     */
    function toggleDebugPanel() {
        if (debugPanelVisible) {
            hideDebugPanel();
        } else {
            showDebugPanel();
        }
    }
    
    /**
     * Update debug information display
     */
    function updateDebugInfo() {
        const sharepointUrlDiv = document.getElementById('debug-sharepoint-url');
        const dataStatusDiv = document.getElementById('debug-data-status');
        const configStatusDiv = document.getElementById('debug-config-status');
        const authStatusDiv = document.getElementById('debug-auth-status');
        
        if (sharepointUrlDiv) {
            const mockStatus = (window.mockData && window.mockData.isEnabled && window.mockData.isEnabled()) ? ' (MOCK MODE)' : '';
            sharepointUrlDiv.innerHTML = `<strong>SP URL:</strong> ${window.spWebAbsoluteUrl || 'Not set'}${mockStatus}`;
        }
        
        if (authStatusDiv) {
            const authStatus = window.huidigeGebruiker ? 
                `${window.huidigeGebruiker.Title || 'Unknown'} (${window.huidigeGebruiker.normalizedUsername || 'No username'})` : 
                'Not authenticated';
            authStatusDiv.innerHTML = `<strong>User:</strong> ${authStatus}`;
        }
        
        if (configStatusDiv) {
            const configCount = window.sharepointLijstConfiguraties ? Object.keys(window.sharepointLijstConfiguraties).length : 0;
            configStatusDiv.innerHTML = `<strong>Lists Config:</strong> ${configCount} configured`;
        }
        
        if (dataStatusDiv) {
            let dataInfo = '';
            if (typeof window.alleMedewerkers !== 'undefined') {
                dataInfo += `MW:${window.alleMedewerkers.length} `;
            }
            if (typeof window.alleVerlofItems !== 'undefined') {
                dataInfo += `VL:${window.alleVerlofItems.length} `;
            }
            if (typeof window.alleTeams !== 'undefined') {
                dataInfo += `TM:${window.alleTeams.length} `;
            }
            dataStatusDiv.innerHTML = `<strong>Data:</strong> ${dataInfo || 'Not loaded'}`;
        }
    }
    
    /**
     * Refresh debug data and reload information
     */
    async function refreshDebugData() {
        console.log("[DebugUtilities] Refreshing debug data...");
        
        // Test SharePoint connectivity
        if (typeof window.testSharePointConnectivity === 'function') {
            const isConnected = await window.testSharePointConnectivity();
            console.log(`[DebugUtilities] SharePoint connectivity: ${isConnected ? 'OK' : 'FAILED'}`);
        }
        
        // Validate configurations
        if (typeof window.validateAllLijstConfigs === 'function') {
            const configsValid = window.validateAllLijstConfigs();
            console.log(`[DebugUtilities] Configurations valid: ${configsValid}`);
        }
        
        // Try to reload data
        if (typeof window.laadInitiëleData === 'function') {
            try {
                await window.laadInitiëleData(false, true);
                console.log("[DebugUtilities] Data reload completed");
            } catch (error) {
                console.error("[DebugUtilities] Data reload failed:", error);
            }
        }
        
        updateDebugInfo();
    }
    
    /**
     * Export debug functions to global scope for console access
     */
    window.debugUtilities = {
        show: showDebugPanel,
        hide: hideDebugPanel,
        toggle: toggleDebugPanel,
        refresh: refreshDebugData,
        update: updateDebugInfo
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDebugUtilities);
    } else {
        initializeDebugUtilities();
    }
    
    console.log("[DebugUtilities] Debug utilities loaded. Press Ctrl+Shift+D to toggle debug mode.");
})();