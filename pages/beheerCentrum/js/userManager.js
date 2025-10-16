/**
 * userManager.js - Module for handling user-related functionality
 * This module contains functions for user data management, normalization,
 * and settings handling.
 */

// SharePoint context - Will be provided externally in the future
let sharePointContext = {
    siteUrl: '',
    requestDigest: ''
};

// Update SharePoint context when it's set from outside the module
export function setSharePointContext(context) {
    sharePointContext = context;
}

/**
 * Sanitize username by removing SharePoint claim prefixes while preserving domain
 * @param {string} gebruikersnaam - The username to sanitize
 * @returns {string} Sanitized username
 */
export function saneertGebruikersnaam(gebruikersnaam) {
    if (!gebruikersnaam) return '';
    
    let gesaneerd = String(gebruikersnaam).trim();
    
    // Verwijder SharePoint claim prefix indien aanwezig, maar behoud domein\gebruikersnaam formaat
    if (gesaneerd.includes('i:0#.w|')) {
        const delen = gesaneerd.split('i:0#.w|');
        if (delen.length > 1) gesaneerd = delen[1];
    } else if (gesaneerd.includes('|')) {
        const delen = gesaneerd.split('|');
        gesaneerd = delen[delen.length - 1] || gesaneerd;
    }
    
    // Behoud domein\gebruikersnaam formaat voor authenticatie (bijv. "org\busselw")
    // Verwijder niet het domein prefix omdat het nodig is voor login
    
    return gesaneerd.toLowerCase();
}

/**
 * Format username for saving to SharePoint
 * @param {string} gebruikersnaam - The username to format
 * @returns {string} Formatted username
 */
export function formateerGebruikersnaamVoorOpslaan(gebruikersnaam) {
    if (!gebruikersnaam) return '';
    
    const gesaneerd = saneertGebruikersnaam(gebruikersnaam);
    
    // Als het nog geen claim prefix heeft, voeg het toe
    if (!String(gebruikersnaam).includes('i:0#.w|')) {
        return `i:0#.w|${gesaneerd}`;
    }
    
    return gebruikersnaam;
}

/**
 * Get normalized username from SharePoint user data
 * @param {string} inputWaarde - Input username to normalize
 * @returns {Promise<string>} Normalized username
 */
export async function krijgGenormaliseerdGebruikersnaamVanSharePoint(inputWaarde) {
    if (!inputWaarde) return '';
    
    try {
        // Probeer eerst gebruiker te vinden met verschillende methodes
        let gebruikerUrl;
        const gesaneerdInput = saneertGebruikersnaam(inputWaarde);
        
        // Probeer meerdere zoek benaderingen
        const zoekMethodes = [
            `LoginName eq '${encodeURIComponent(formateerGebruikersnaamVoorOpslaan(gesaneerdInput))}'`,
            `Title eq '${encodeURIComponent(inputWaarde)}'`,
            `substringof('${encodeURIComponent(gesaneerdInput)}', LoginName)`,
            `substringof('${encodeURIComponent(inputWaarde)}', Title)`
        ];
        
        for (const zoekMethode of zoekMethodes) {
            gebruikerUrl = `${sharePointContext.siteUrl}/_api/web/siteusers?$filter=${zoekMethode}&$top=1`;
            
            const response = await fetch(gebruikerUrl, { 
                headers: { 'Accept': 'application/json;odata=verbose' } 
            });
            
            if (response.ok) {
                const gebruikerData = await response.json();
                if (gebruikerData.d.results && gebruikerData.d.results.length > 0) {
                    const gebruiker = gebruikerData.d.results[0];
                    console.log('Gevonden gebruiker:', gebruiker);
                    
                    // Return de genormaliseerde gebruikersnaam met domein prefix (bijv. "org\busselw")
                    // Verwijder alleen de SharePoint claim prefix, behoud domein\gebruikersnaam
                    let genormaliseerdGebruikersnaam = saneertGebruikersnaam(gebruiker.LoginName || gebruiker.Title || inputWaarde);
                    
                    // Zorg ervoor dat we domein\gebruikersnaam formaat hebben
                    if (!genormaliseerdGebruikersnaam.includes('\\') && gebruiker.LoginName && gebruiker.LoginName.includes('\\')) {
                        // Extract domein\gebruikersnaam van LoginName indien beschikbaar
                        const loginNaam = saneertGebruikersnaam(gebruiker.LoginName);
                        if (loginNaam.includes('\\')) {
                            genormaliseerdGebruikersnaam = loginNaam;
                        }
                    }
                    
                    return genormaliseerdGebruikersnaam;
                }
            }
        }
        
        // Als geen gebruiker gevonden, return gesaneerde input (behoud domein indien aanwezig)
        console.log('Geen gebruiker gevonden, gebruik gesaneerde input');
        return gesaneerdInput;
        
    } catch (error) {
        console.warn('Fout bij ophalen genormaliseerde gebruikersnaam:', error);
        return saneertGebruikersnaam(inputWaarde);
    }
}

/**
 * Load user settings from SharePoint and apply them
 * @param {Function} themeCallback - Callback function to apply theme when settings are loaded
 * @returns {Promise<Object|null>} User settings or null if not found
 */
export async function laadGebruikersInstellingen(themeCallback) {
    try {
        if (!sharePointContext.siteUrl) {
            console.warn('SharePoint context niet beschikbaar voor gebruikersinstellingen');
            if (themeCallback) themeCallback('light');
            return null;
        }

        const gebruikerResponse = await fetch(`${sharePointContext.siteUrl}/_api/web/currentuser`, {
            headers: { 'Accept': 'application/json;odata=verbose' }
        });

        if (!gebruikerResponse.ok) throw new Error('Kon huidige gebruiker niet ophalen');
        
        const gebruikerData = await gebruikerResponse.json();
        const huidigeGebruiker = gebruikerData.d;
        
        const instellingenUrl = `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('gebruikersInstellingen')/items?$filter=Title eq '${encodeURIComponent(huidigeGebruiker.LoginName)}'&$top=1`;
        
        const instellingenResponse = await fetch(instellingenUrl, {
            headers: { 'Accept': 'application/json;odata=verbose' }
        });

        if (instellingenResponse.ok) {
            const instellingenData = await instellingenResponse.json();
            if (instellingenData.d.results && instellingenData.d.results.length > 0) {
                const gebruikersInstellingen = instellingenData.d.results[0];
                const soortWeergave = gebruikersInstellingen.SoortWeergave;
                console.log('Gebruikersinstellingen geladen:', soortWeergave);
                if (soortWeergave && themeCallback) {
                    themeCallback(soortWeergave);
                    return gebruikersInstellingen;
                }
            }
        }
        
        console.log('Geen gebruikersinstellingen gevonden, standaard lichte thema wordt toegepast');
        if (themeCallback) themeCallback('light');
        return null;
    } catch (error) {
        console.warn('Kon gebruikersinstellingen niet laden:', error);
        if (themeCallback) themeCallback('light');
        return null;
    }
}
