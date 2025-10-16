/**
 * @file uiPermissions.js
 * @description Utility functies voor het beheren van UI-elementen op basis van gebruikersrechten.
 * Deze module biedt eenvoudige functies om elementen te tonen/verbergen en
 * toegang tot pagina's te controleren op basis van gebruikersrechten.
 */

import { hasAccessToSection, isUserInGroup, isUserInAnyGroup } from '../services/permissionService.js';

/**
 * Verbergt of toont een element op basis van toegangsrechten voor een gedeelte
 * @param {string|HTMLElement} elementSelector - CSS selector of HTML element
 * @param {string} section - Het gedeelte waarvoor toegang gecontroleerd moet worden
 * @param {boolean} hideIfNoAccess - True = verberg als geen toegang, False = toon als geen toegang
 */
export async function toggleElementBySection(elementSelector, section, hideIfNoAccess = true) {
    try {
        const element = typeof elementSelector === 'string' 
            ? document.querySelector(elementSelector) 
            : elementSelector;

        if (!element) {
            console.warn(`Element niet gevonden: ${elementSelector}`);
            return;
        }

        const hasAccess = await hasAccessToSection(section);
        
        if (hideIfNoAccess) {
            // Verberg element als gebruiker geen toegang heeft
            element.style.display = hasAccess ? '' : 'none';
        } else {
            // Toon element alleen als gebruiker geen toegang heeft
            element.style.display = hasAccess ? 'none' : '';
        }

        // Voeg data attributen toe voor debugging
        element.setAttribute('data-permission-section', section);
        element.setAttribute('data-has-access', hasAccess.toString());

    } catch (error) {
        console.error(`Fout bij toggleElementBySection voor ${section}:`, error);
    }
}

/**
 * Verbergt of toont een element op basis van groepslidmaatschap
 * @param {string|HTMLElement} elementSelector - CSS selector of HTML element
 * @param {string|Array<string>} groups - Groepsnaam of array van groepsnamen
 * @param {boolean} hideIfNotMember - True = verberg als niet lid, False = toon als niet lid
 */
export async function toggleElementByGroup(elementSelector, groups, hideIfNotMember = true) {
    try {
        const element = typeof elementSelector === 'string' 
            ? document.querySelector(elementSelector) 
            : elementSelector;

        if (!element) {
            console.warn(`Element niet gevonden: ${elementSelector}`);
            return;
        }

        const groupArray = Array.isArray(groups) ? groups : [groups];
        const isMember = await isUserInAnyGroup(groupArray);
        
        if (hideIfNotMember) {
            // Verberg element als gebruiker geen lid is
            element.style.display = isMember ? '' : 'none';
        } else {
            // Toon element alleen als gebruiker geen lid is
            element.style.display = isMember ? 'none' : '';
        }

        // Voeg data attributen toe voor debugging
        element.setAttribute('data-permission-groups', groupArray.join(','));
        element.setAttribute('data-is-member', isMember.toString());

    } catch (error) {
        console.error(`Fout bij toggleElementByGroup voor groepen ${groups}:`, error);
    }
}

/**
 * Maakt een element klikbaar of onklikbaar op basis van toegangsrechten
 * @param {string|HTMLElement} elementSelector - CSS selector of HTML element
 * @param {string} section - Het gedeelte waarvoor toegang gecontroleerd moet worden
 * @param {string} disabledClass - CSS class om toe te voegen als disabled (optioneel)
 */
export async function toggleElementEnabledBySection(elementSelector, section, disabledClass = 'disabled') {
    try {
        const element = typeof elementSelector === 'string' 
            ? document.querySelector(elementSelector) 
            : elementSelector;

        if (!element) {
            console.warn(`Element niet gevonden: ${elementSelector}`);
            return;
        }

        const hasAccess = await hasAccessToSection(section);
        
        if (hasAccess) {
            element.removeAttribute('disabled');
            element.classList.remove(disabledClass);
            element.style.pointerEvents = '';
            element.style.opacity = '';
        } else {
            element.setAttribute('disabled', 'disabled');
            element.classList.add(disabledClass);
            element.style.pointerEvents = 'none';
            element.style.opacity = '0.5';
        }

        // Voeg data attributen toe voor debugging
        element.setAttribute('data-permission-section', section);
        element.setAttribute('data-has-access', hasAccess.toString());

    } catch (error) {
        console.error(`Fout bij toggleElementEnabledBySection voor ${section}:`, error);
    }
}

/**
 * Voegt een waarschuwing toe aan een element als de gebruiker geen toegang heeft
 * @param {string|HTMLElement} elementSelector - CSS selector of HTML element
 * @param {string} section - Het gedeelte waarvoor toegang gecontroleerd moet worden
 * @param {string} warningMessage - Waarschuwingsbericht om te tonen
 */
export async function addAccessWarning(elementSelector, section, warningMessage = 'U heeft geen toegang tot deze functie') {
    try {
        const element = typeof elementSelector === 'string' 
            ? document.querySelector(elementSelector) 
            : elementSelector;

        if (!element) {
            console.warn(`Element niet gevonden: ${elementSelector}`);
            return;
        }

        const hasAccess = await hasAccessToSection(section);
        
        if (!hasAccess) {
            element.title = warningMessage;
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.NotificationSystem) {
                    window.NotificationSystem.warning(warningMessage, 'Toegang beperkt');
                } else {
                    alert(warningMessage);
                }
            }, true);
        }

    } catch (error) {
        console.error(`Fout bij addAccessWarning voor ${section}:`, error);
    }
}

/**
 * Controleert toegang en toont een foutpagina of omleidingsbericht als geen toegang
 * @param {string} section - Het gedeelte waarvoor toegang gecontroleerd moet worden
 * @param {string} redirectUrl - URL om naar om te leiden als geen toegang (optioneel)
 * @param {string} errorMessage - Foutbericht om te tonen (optioneel)
 * @returns {Promise<boolean>} True als toegang toegestaan
 */
export async function enforcePageAccess(section, redirectUrl = null, errorMessage = null) {
    try {
        const hasAccess = await hasAccessToSection(section);
        
        if (!hasAccess) {
            const message = errorMessage || `U heeft geen toegang tot deze pagina. Vereiste rechten: ${section}`;
            
            if (redirectUrl) {
                if (window.NotificationSystem) {
                    window.NotificationSystem.error(message, 'Toegang geweigerd');
                    // Give time for notification to show before redirect
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 2000);
                } else {
                    alert(message);
                    window.location.href = redirectUrl;
                }
            } else {
                // Toon error op huidige pagina
                document.body.innerHTML = `
                    <div style="
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        flex-direction: column;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f8f9fa;
                    ">
                        <div style="
                            text-align: center;
                            padding: 2rem;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            max-width: 500px;
                        ">
                            <h2 style="color: #dc3545; margin-bottom: 1rem;">Toegang Geweigerd</h2>
                            <p style="margin-bottom: 1.5rem; color: #6c757d;">${message}</p>
                            <button onclick="history.back()" style="
                                background: #007bff;
                                color: white;
                                border: none;
                                padding: 0.5rem 1rem;
                                border-radius: 4px;
                                cursor: pointer;
                            ">Terug</button>
                        </div>
                    </div>
                `;
            }
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`Fout bij enforcePageAccess voor ${section}:`, error);
        return false;
    }
}

/**
 * Initialiseert permissie-gebaseerde UI voor alle elementen met data-permission attributen
 * Gebruik data-permission-section="sectionName" om automatisch rechten te controleren
 * Gebruik data-permission-action="hide|disable|warn" om de actie te specificeren
 */
export async function initializePagePermissions() {
    try {
        // Zoek alle elementen met permission attributen
        const elementsWithPermissions = document.querySelectorAll('[data-permission-section]');
        
        for (const element of elementsWithPermissions) {
            const section = element.getAttribute('data-permission-section');
            const action = element.getAttribute('data-permission-action') || 'hide';
            const warningMessage = element.getAttribute('data-permission-warning');
            
            if (!section) continue;
            
            switch (action.toLowerCase()) {
                case 'hide':
                    await toggleElementBySection(element, section, true);
                    break;
                case 'disable':
                    await toggleElementEnabledBySection(element, section);
                    break;
                case 'warn':
                    await addAccessWarning(element, section, warningMessage);
                    break;
                default:
                    console.warn(`Onbekende permission action: ${action}`);
            }
        }
        
        console.log(`Permissies geïnitialiseerd voor ${elementsWithPermissions.length} elementen`);
    } catch (error) {
        console.error('Fout bij initialiseren pagina permissies:', error);
    }
}

/**
 * Wrapper functie om gemakkelijk een functie uit te voeren alleen als de gebruiker toegang heeft
 * @param {string} section - Het gedeelte waarvoor toegang gecontroleerd moet worden
 * @param {Function} callback - Functie om uit te voeren als toegang toegestaan
 * @param {Function} errorCallback - Functie om uit te voeren als geen toegang (optioneel)
 */
export async function executeWithPermission(section, callback, errorCallback = null) {
    try {
        const hasAccess = await hasAccessToSection(section);
        
        if (hasAccess) {
            await callback();
        } else {
            if (errorCallback) {
                await errorCallback();
            } else {
                if (window.NotificationSystem) {
                    window.NotificationSystem.error(`U heeft geen toegang tot deze functie. Vereiste rechten: ${section}`, 'Toegang geweigerd');
                } else {
                    alert(`U heeft geen toegang tot deze functie. Vereiste rechten: ${section}`);
                }
            }
        }
    } catch (error) {
        console.error(`Fout bij executeWithPermission voor ${section}:`, error);
    }
}

// Export alle functies
export default {
    toggleElementBySection,
    toggleElementByGroup,
    toggleElementEnabledBySection,
    addAccessWarning,
    enforcePageAccess,
    initializePagePermissions,
    executeWithPermission
};

console.log("UI Permissions module loaded successfully.");