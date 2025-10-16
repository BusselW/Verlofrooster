/**
 * beheerCentrumN.js - Core functionality for the new beheerCentrum page
 * 
 * This module contains the core functionality for the beheerCentrum page,
 * including:
 * - SharePoint connection setup
 * - User authentication
 * - Theme management
 * - Core utility functions
 */

// Import modules
import { setSharePointContext, laadGebruikersInstellingen } from './userManager.js';

// Core React setup with 'h' pragma
const { createElement: h, Fragment, useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

// Global state
let sharePointContext = {
    siteUrl: '',
    requestDigest: ''
};

// Global configuration mapping for SharePoint lists
const LIJST_CONFIGURATIE = {
    'Medewerkers': 'Medewerkers',
    'DagenIndicators': 'DagenIndicators', 
    'keuzelijstFuncties': 'keuzelijstFuncties',
    'Verlofredenen': 'Verlofredenen',
    'Teams': 'Teams',
    'Seniors': 'Seniors',
    'UrenPerWeek': 'UrenPerWeek',
    'IncidenteelZittingVrij': 'IncidenteelZittingVrij',
    'CompensatieUren': 'CompensatieUren'
};

/**
 * Initialize SharePoint connection and get user context
 */
async function initialiseerSharePointVerbinding() {
    try {
        // Get site URL from global configuration
        const siteUrl = CONFIG_GLOBAL?.SITE_URL || window.location.origin;
        
        // Get request digest for SharePoint REST API calls
        const digestResponse = await fetch(`${siteUrl}/_api/contextinfo`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!digestResponse.ok) {
            throw new Error('Kon geen verbinding maken met SharePoint');
        }
        
        const digestData = await digestResponse.json();
        const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
        
        // Update global context
        sharePointContext = {
            siteUrl,
            requestDigest
        };
        
        // Update context in user manager module
        setSharePointContext(sharePointContext);
        
        console.log('SharePoint verbinding succesvol opgezet');
        
        // Load current user info
        await laadHuidigeGebruiker();
        
        // Load user settings (theme, etc.)
        await laadGebruikersInstellingen();
        
        return true;
    } catch (error) {
        console.error('Fout bij initialiseren SharePoint verbinding:', error);
        toonNotificatie('Er is een fout opgetreden bij het verbinden met SharePoint.', 'error');
        
        return false;
    }
}

/**
 * Load current user information
 */
async function laadHuidigeGebruiker() {
    try {
        const response = await fetch(`${sharePointContext.siteUrl}/_api/web/currentuser`, {
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!response.ok) {
            throw new Error('Kon gebruikersinformatie niet ophalen');
        }
        
        const userData = await response.json();
        const currentUser = userData.d;
        
        // Update UI with user info
        document.getElementById('huidige-gebruiker').textContent = 
            currentUser.Title || currentUser.LoginName || 'Onbekende gebruiker';
        
        // Update connection status
        document.getElementById('verbinding-status').textContent = 'Verbonden';
        document.getElementById('verbinding-status').classList.add('status-connected');
        
        return currentUser;
    } catch (error) {
        console.error('Fout bij ophalen gebruikersinformatie:', error);
        document.getElementById('huidige-gebruiker').textContent = 'Niet ingelogd';
        document.getElementById('verbinding-status').textContent = 'Niet verbonden';
        document.getElementById('verbinding-status').classList.add('status-error');
        
        return null;
    }
}

/**
 * Apply theme to the page
 * @param {string} theme - 'light' or 'dark'
 */
function pasThemaToe(theme) {
    const isDarkTheme = theme === 'dark';
    const body = document.body;
    
    if (isDarkTheme) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    }
    
    console.log(`${isDarkTheme ? 'Donker' : 'Licht'} thema toegepast`);
}

/**
 * Show notification to the user
 * @param {string} message - Notification message
 * @param {string} type - 'success', 'error', or 'warning'
 * @param {number} duration - Time in ms before auto-hiding (0 for no auto-hide)
 */
function toonNotificatie(message, type = 'success', duration = 3000) {
    const notificatie = document.getElementById('globale-notificatie');
    const bericht = document.getElementById('notificatie-bericht');
    
    // Update notification content
    bericht.textContent = message;
    
    // Set notification type
    notificatie.classList.remove('success', 'error', 'warning');
    notificatie.classList.add(type);
    
    // Show notification
    notificatie.classList.remove('hidden');
    
    // Auto-hide if duration is specified
    if (duration > 0) {
        setTimeout(() => {
            verbergNotificatie();
        }, duration);
    }
}

/**
 * Hide the notification
 */
function verbergNotificatie() {
    const notificatie = document.getElementById('globale-notificatie');
    notificatie.classList.add('hidden');
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function toonLaden(message = 'Laden...') {
    const laden = document.getElementById('globale-loading');
    const bericht = document.getElementById('loading-bericht');
    
    bericht.textContent = message;
    laden.classList.remove('hidden');
}

/**
 * Hide loading overlay
 */
function verbergLaden() {
    const laden = document.getElementById('globale-loading');
    laden.classList.add('hidden');
}

/**
 * Main App Component using React
 */
function App() {
    const [isLoading, setIsLoading] = useState(true);
    
    // Component did mount
    useEffect(() => {
        // Initialize app
        const initApp = async () => {
            try {
                // Connect to SharePoint
                const connected = await initialiseerSharePointVerbinding();
                
                if (!connected) {
                    toonNotificatie('Er is een probleem met de verbinding. Probeer de pagina te herladen.', 'error', 0);
                }
                
                // Set current year in footer
                document.getElementById('huidig-jaar').textContent = new Date().getFullYear();
                
                // Initialize with default theme
                pasThemaToe('light');
                
            } catch (error) {
                console.error('Fout bij initialiseren app:', error);
                toonNotificatie('Er is een fout opgetreden bij het laden van de applicatie.', 'error', 0);
            } finally {
                setIsLoading(false);
            }
        };
        
        initApp();
    }, []);
    
    // Render main app content
    return h(Fragment, null, 
        h('div', { className: 'app-content' },
            isLoading 
                ? h('div', { className: 'loading-indicator' }, 'Applicatie wordt geladen...')
                : h('div', { className: 'content-card' },
                    h('div', { className: 'card-header' },
                        h('h2', null, 'Beheercentrum')
                    ),
                    h('div', { className: 'card-body' },
                        h('p', null, 'Welkom bij het nieuwe Beheercentrum')
                    )
                )
        )
    );
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Set current year in footer
  document.getElementById('huidig-jaar').textContent = new Date().getFullYear();
  
  // Initialize user info
  initializeUserInfo();
  
  // Initialize theme
  initializeTheme();
  
  // Initialize React components
  initializeReactApp();
});

// Get current user info
async function initializeUserInfo() {
  try {
    const currentUser = await getCurrentUser();
    document.getElementById('huidige-gebruiker').textContent = currentUser.Title || currentUser.DisplayName || 'Onbekende gebruiker';
    document.getElementById('verbinding-status').textContent = 'Verbonden';
    document.getElementById('verbinding-status').classList.add('connected');
  } catch (error) {
    console.error('Error loading user info:', error);
    document.getElementById('huidige-gebruiker').textContent = 'Gebruiker niet geladen';
    document.getElementById('verbinding-status').textContent = 'Niet verbonden';
    document.getElementById('verbinding-status').classList.add('disconnected');
  }
}

// Initialize theme based on user preference
function initializeTheme() {
  const savedTheme = localStorage.getItem('beheercentrum-theme');
  if (savedTheme === 'dark') {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
}

// Helper function to show notifications
function toonNotificatie(message, type = 'info', duration = 5000) {
  const notificatieElement = document.getElementById('globale-notificatie');
  const berichtElement = document.getElementById('notificatie-bericht');
  
  berichtElement.textContent = message;
  notificatieElement.className = `notification-item ${type}`;
  
  // Show notification
  notificatieElement.classList.remove('hidden');
  
  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => {
      verbergNotificatie();
    }, duration);
  }
}

// Hide notification
function verbergNotificatie() {
  const notificatieElement = document.getElementById('globale-notificatie');
  notificatieElement.classList.add('hidden');
}

// Initialize React app
function initializeReactApp() {
  const { createElement: h } = React;
  const { createRoot } = ReactDOM;
  
  // Simple placeholder component
  const App = () => {
    return h('div', { className: 'content-card' },
      h('div', { className: 'card-header' }, 
        h('h2', {}, 'Welkom bij het Beheercentrum')
      ),
      h('div', { className: 'card-body' },
        h('p', {}, 'De modules worden geladen...')
      )
    );
  };
  
  // Render the React app
  const root = createRoot(document.getElementById('react-root'));
  root.render(h(App));
}

// Mock function to get current user
async function getCurrentUser() {
  // In a real app, this would call SharePoint API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        Title: 'Demo Gebruiker',
        Email: 'demo.gebruiker@example.com',
        DisplayName: 'Demo Gebruiker'
      });
    }, 1000);
  });
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Render React app to the container
    const rootElement = document.getElementById('react-root');
    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(h(App));
    }
});

// Export functions and constants for use in other modules
export {
    initialiseerSharePointVerbinding,
    laadHuidigeGebruiker,
    pasThemaToe,
    toonNotificatie,
    verbergNotificatie,
    toonLaden,
    verbergLaden,
    LIJST_CONFIGURATIE,
    sharePointContext
};