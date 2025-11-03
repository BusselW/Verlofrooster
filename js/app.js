/**
 * @file app.js
 * @description Main application entry point and bootstrap
 * Handles all imports, global setup, and React rendering
 */

// =============================================================================
// GLOBAL SETUP - React CDN Verification
// =============================================================================

console.log('🚀 Application starting...');

if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('❌ CRITICAL: React or ReactDOM not loaded from CDN!');
    console.error('Check verlofRooster.aspx <head> section for correct script tags');
    throw new Error('React/ReactDOM dependencies missing');
}

window.React = React;
window.ReactDOM = ReactDOM;
console.log('✅ React and ReactDOM available globally');

// =============================================================================
// IMPORTS - Core Components
// =============================================================================

import { ErrorBoundary } from './core/ErrorBoundary.js';
import UserRegistrationCheck from './components/UserRegistrationCheck.js';
import RoosterApp from './core/roosterApp.js';

// =============================================================================
// IMPORTS - Side Effect Modules (Register Window Globals)
// =============================================================================

import TooltipManager from './ui/tooltipbar.js';
import { roosterHandleiding, openHandleiding } from './tutorial/roosterHandleiding.js';
import { roosterTutorial } from './tutorial/roosterTutorialOrange.js';

// =============================================================================
// REACT HOOKS
// =============================================================================

const { useState, useCallback, createElement: h } = React;

// =============================================================================
// COMPONENT - Main Application Wrapper
// =============================================================================

/**
 * MainAppWrapper Component
 * Validates user before rendering main application
 */
const MainAppWrapper = () => {
    const [appData, setAppData] = useState(null);

    const handleUserValidated = useCallback((isValid, currentUser, userPermissions) => {
        // Check if user validation was successful
        if (!isValid) {
            console.error('❌ User validation failed');
            // Could show error UI here if needed
            return;
        }
        
        console.log('✅ User validated successfully:', currentUser?.Title);
        setAppData((previous) => {
            if (previous?.currentUser?.Id === currentUser?.Id) {
                return previous;
            }
            return { currentUser, userPermissions };
        });
    }, [setAppData]);

    // Render RoosterApp directly after validation (no unnecessary wrapper)
    return h(UserRegistrationCheck, { onUserValidated: handleUserValidated },
        appData ? h(RoosterApp, { 
            isUserValidated: true,
            currentUser: appData.currentUser, 
            userPermissions: appData.userPermissions 
        }) : null
    );
};

// =============================================================================
// INITIALIZATION - Application Bootstrap
// =============================================================================

/**
 * Initialize Application
 * Sets up React root and renders the app with error handling
 */
const initializeApp = () => {
    console.log('🎨 Initializing React application...');
    
    // Verify DOM is ready and root element exists
    const container = document.getElementById('root');
    if (!container) {
        console.error('❌ CRITICAL: Root element #root not found in DOM!');
        console.error('Ensure verlofRooster.aspx contains <div id="root"></div>');
        
        // Show user-friendly error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <div style="text-align: center; padding: 2rem; max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #dc2626;">Applicatie kon niet worden geladen</h1>
                    <p style="color: #6b7280; margin-bottom: 1.5rem;">Er is een technisch probleem opgetreden tijdens het initialiseren van de applicatie.</p>
                    <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background-color: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        Pagina Vernieuwen
                    </button>
                </div>
            </div>
        `;
        return;
    }

    try {
        // Create React 18 root
        const root = ReactDOM.createRoot(container);

        // Render application with ErrorBoundary wrapper
        root.render(
            h(ErrorBoundary, null,
                h(MainAppWrapper)
            )
        );

        console.log('✅ React root created and application rendered');
    } catch (error) {
        console.error('❌ CRITICAL: Failed to render React application:', error);
        
        // Show user-friendly error
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <div style="text-align: center; padding: 2rem; max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                    <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #dc2626;">Render fout</h1>
                    <p style="color: #6b7280; margin-bottom: 0.5rem;">De applicatie kon niet worden gestart.</p>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem;">${error.message}</p>
                    <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background-color: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        Pagina Vernieuwen
                    </button>
                </div>
            </div>
        `;
        throw error; // Re-throw for console visibility
    }
};

// =============================================================================
// GLOBAL FUNCTIONS - Register Tutorial Functions
// =============================================================================

window.startTutorial = roosterTutorial;
window.openHandleiding = openHandleiding;
console.log('✅ Tutorial functions registered globally');

// =============================================================================
// EXECUTION - Start Application
// =============================================================================

try {
    initializeApp();
} catch (error) {
    console.error('❌ FATAL ERROR: Application failed to initialize:', error);
    console.error('Stack trace:', error.stack);
    
    // Attempt to show error to user if initializeApp didn't handle it
    const container = document.getElementById('root');
    if (container && !container.innerHTML) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <div style="text-align: center; padding: 2rem; max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">💥</div>
                    <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #dc2626;">Fatale Fout</h1>
                    <p style="color: #6b7280; margin-bottom: 1.5rem;">De applicatie kon niet worden gestart. Neem contact op met de beheerder als dit probleem blijft bestaan.</p>
                    <details style="text-align: left; margin-bottom: 1.5rem; padding: 1rem; background-color: #fee2e2; border-radius: 8px; font-size: 0.875rem;">
                        <summary style="cursor: pointer; font-weight: 600; color: #991b1b;">Technische details</summary>
                        <pre style="margin-top: 0.5rem; overflow-x: auto; color: #7f1d1d;">${error.message}\n\n${error.stack}</pre>
                    </details>
                    <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background-color: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        Pagina Vernieuwen
                    </button>
                </div>
            </div>
        `;
    }
}