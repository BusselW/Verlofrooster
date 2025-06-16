// js/machtigingen.js

/**
 * Beheert gebruikersmachtigingen en de zichtbaarheid van UI-elementen
 * door middel van SharePoint REST API calls.
 * Haalt SharePoint context (web URL, gebruiker info) ook via REST API.
 * Maakt globale variabelen en functies beschikbaar op het 'window' object.
 */

// DECLAREER HIER DE GLOBALE VARIABELEN EENMALIG
let spWebAbsoluteUrl = '';
let huidigeGebruiker = { 
    loginNaam: null, 
    normalizedUsername: null,
    Id: null, 
    Title: null,
    Email: null,
    isSiteAdmin: false,
    sharePointGroepen: []
};

// De variabelen voor Beheer en andere contexten worden hier ook gedeclareerd maar niet geëxporteerd.
// Andere scripts kunnen `window.spWebAbsoluteUrl` en `window.huidigeGebruiker` gebruiken.
let spWebAbsoluteUrlBeheer = '';
let huidigeGebruikerBeheer = { loginNaam: null, Id: null, Title: null };


const GEDEFINIEERDE_SITE_URL = "/sites/MulderT/CustomPW/Verlof/"; // Pas aan indien nodig

// Definieer de mapping van UI secties naar vereiste SharePoint groepen
window.UI_SECTION_PERMISSIONS = {
    "BeheerHeader": ["1. Sharepoint beheer", "1.1. Mulder MT"],
    "AdminInstellingen": ["1. Sharepoint beheer", "1.1. Mulder MT"],
};

// Globale initialisatie promise voor andere scripts om op te wachten
let resolveMachtigingenPromise;
let rejectMachtigingenPromise;
window.machtigingenInitializationPromise = new Promise((resolve, reject) => {
    resolveMachtigingenPromise = resolve;
    rejectMachtigingenPromise = reject;
});


/**
 * Initialiseert de SharePoint context (web URL, huidige gebruiker) via REST API.
 * Zet window.spWebAbsoluteUrl en window.huidigeGebruiker.
 * Resolves/rejects window.machtigingenInitializationPromise.
 */
async function initializeSharePointContextViaAPI() {
    console.log("[Machtigingen] Start initialisatie SharePoint context via API.");
    try {
        let baseUrl = GEDEFINIEERDE_SITE_URL;
        if (!baseUrl.startsWith('http')) {
            baseUrl = window.location.origin + (baseUrl.startsWith('/') ? '' : '/') + baseUrl;
        }
        // Zet de globale `window.spWebAbsoluteUrl`
        window.spWebAbsoluteUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        console.log("[Machtigingen] SharePoint site URL ingesteld op:", window.spWebAbsoluteUrl);

        const userResponse = await fetch(`${window.spWebAbsoluteUrl}_api/web/currentuser?$select=LoginName,Title,Id,Email,IsSiteAdmin`, {
            method: 'GET',
            headers: { 'Accept': 'application/json;odata=verbose' }
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error(`[Machtigingen] Fout bij ophalen gebruikersinformatie: ${userResponse.status} ${userResponse.statusText}`, errorText);
            throw new Error(`HTTP error ${userResponse.status} bij ophalen huidige gebruiker.`);
        }
        const userData = await userResponse.json();
        
        // Zet het globale `window.huidigeGebruiker` object
        window.huidigeGebruiker = {
            loginNaam: userData.d.LoginName,
            normalizedUsername: window.trimLoginNaamPrefix(userData.d.LoginName),
            Id: userData.d.Id,
            Title: userData.d.Title,
            Email: userData.d.Email,
            isSiteAdmin: userData.d.IsSiteAdmin,
            sharePointGroepen: [] 
        };
        console.log("[Machtigingen] Basis gebruikersinfo opgehaald:", window.huidigeGebruiker.Title, window.huidigeGebruiker.loginNaam);

        window.huidigeGebruiker.sharePointGroepen = await getGebruikerSharePointGroepenViaAPI();

        console.log("[Machtigingen] Context init VOLTOOID. Globals (spWebAbsoluteUrl, huidigeGebruiker) zijn nu gezet.");
        
        if (resolveMachtigingenPromise) resolveMachtigingenPromise(); // Resolve de promise NA het zetten van globals
        return true;
    } catch (error) {
        console.error("[Machtigingen] Kritische fout bij initialiseren SharePoint context via API:", error);
        if (!window.spWebAbsoluteUrl) window.spWebAbsoluteUrl = GEDEFINIEERDE_SITE_URL.endsWith('/') ? GEDEFINIEERDE_SITE_URL : GEDEFINIEERDE_SITE_URL + '/';
        if (rejectMachtigingenPromise) rejectMachtigingenPromise(error); // Reject de promise bij fout
        return false;
    }
}

/**
 * Haalt de SharePoint groepen op waar de huidige gebruiker lid van is.
 * @returns {Promise<string[]>} Een array met de namen van de groepen.
 */
async function getGebruikerSharePointGroepenViaAPI() {
    if (!window.spWebAbsoluteUrl || !window.huidigeGebruiker || !window.huidigeGebruiker.loginNaam) {
        console.warn("[Machtigingen] Kan groepen niet ophalen: context (URL/loginNaam) niet volledig.");
        return [];
    }
    const apiUrl = `${window.spWebAbsoluteUrl.replace(/\/$/, "")}/_api/web/currentuser/groups`;
    try {
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[Machtigingen] Fout bij ophalen gebruikersgroepen: ${response.status}`, errorData.error?.message?.value);
            return [];
        }
        const data = await response.json();
        const groupTitles = data.d.results.map(group => group.Title);
        console.log("[Machtigingen] Gebruikersgroepen opgehaald via API:", groupTitles);
        return groupTitles;
    } catch (error) {
        console.error("[Machtigingen] Uitzondering bij ophalen gebruikersgroepen:", error);
        return [];
    }
}
window.getGebruikerSharePointGroepenViaAPI = getGebruikerSharePointGroepenViaAPI;

/**
 * Normalizes SharePoint dates in data responses to ensure proper handling
 * @param {Array} items - The SharePoint items to process
 * @param {Array} dateFields - Array of field names containing dates to normalize
 * @returns {Array} - The processed items with normalized dates
 */
function normalizeSharePointDates(items, dateFields = ['StartDatum', 'EindDatum']) {
    if (!Array.isArray(items) || items.length === 0) return items;
    
    console.log(`[Machtigingen] Normalizing dates for ${items.length} items on fields:`, dateFields);
    
    return items.map(item => {
        const processedItem = {...item};
        
        dateFields.forEach(field => {
            if (processedItem[field]) {
                const dateObj = new Date(processedItem[field]);
                
                if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1970) {
                    processedItem[field] = dateObj.toISOString();
                } else {
                    console.warn(`[Machtigingen] Invalid date found in field ${field}:`, processedItem[field]);
                    processedItem[field] = null;
                }
            }
        });
        
        return processedItem;
    });
}
window.normalizeSharePointDates = normalizeSharePointDates;

/**
 * Haalt items op uit een SharePoint lijst via REST API.
 */
async function getLijstItemsAlgemeen(lijstConfigKey, selectQuery = "", filterQuery = "", expandQuery = "", orderbyQuery = "") {
    if (!window.spWebAbsoluteUrl) { return []; }
    const lijstConfig = typeof window.getLijstConfig === 'function' ? window.getLijstConfig(lijstConfigKey) : null;
    if (!lijstConfig || !lijstConfig.lijstId) { 
        console.error(`[getLijstItemsAlgemeen] Lijstconfiguratie (met lijstId) niet gevonden voor '${lijstConfigKey}'. Controleer configLijst.js.`);
        return []; 
    }
    const lijstId = lijstConfig.lijstId;
    let apiUrlPath = `/_api/web/lists(guid'${lijstId}')/items`;
    let queryParams = [];
    if (selectQuery) queryParams.push(selectQuery);
    if (filterQuery) queryParams.push(filterQuery);
    if (expandQuery) queryParams.push(expandQuery);
    if (orderbyQuery) queryParams.push(orderbyQuery);
    const baseApiUrl = window.spWebAbsoluteUrl.replace(/\/$/, "");
    const apiUrl = `${baseApiUrl}${apiUrlPath}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;    try {
        console.log(`[getLijstItemsAlgemeen] Fetching from ${apiUrl}`);
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json;odata=verbose' } });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[getLijstItemsAlgemeen] SharePoint API error (${response.status}):`, errorText);
            const errorData = JSON.parse(errorText);
            const spErrorMessage = errorData?.error?.message?.value || `Serverfout: ${response.status}`;
            throw new Error(spErrorMessage);
        }
        
        const data = await response.json();
        console.log(`[getLijstItemsAlgemeen] Successfully loaded ${data.d.results.length} items from ${lijstConfigKey}`);
        return data.d.results;
    } catch (error) {
        console.error(`[getLijstItemsAlgemeen] Error loading data from ${lijstConfigKey}:`, error);
        return [];
    }
}
window.getLijstItemsAlgemeen = getLijstItemsAlgemeen;

/**
 * Haalt een X-RequestDigest op.
 */
async function getRequestDigestGlobally() { 
    if (!window.spWebAbsoluteUrl) throw new Error("Web absolute URL niet beschikbaar voor Request Digest.");
    const apiUrl = `${window.spWebAbsoluteUrl.replace(/\/$/, "")}/_api/contextinfo`;
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Accept': 'application/json;odata=verbose' } });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Machtigingen] Fout bij ophalen Request Digest: ${response.status}`, errorText);
        throw new Error("Kon Request Digest niet ophalen.");
    }
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
}
window.getRequestDigestGlobally = getRequestDigestGlobally;

/**
 * Maakt een nieuw item aan in een SharePoint lijst.
 */
async function createSPListItem(lijstConfigKey, itemData) { 
    if (!window.spWebAbsoluteUrl) throw new Error("Web absolute URL niet beschikbaar voor item creatie.");
    const requestDigest = await getRequestDigestGlobally();
    const lijstConfig = typeof window.getLijstConfig === 'function' ? window.getLijstConfig(lijstConfigKey) : null;
    if (!lijstConfig || !lijstConfig.lijstId || !lijstConfig.lijstTitel) {
        throw new Error(`Lijstconfiguratie (met lijstId en lijstTitel) niet gevonden voor '${lijstConfigKey}' via window.getLijstConfig. Controleer configLijst.js`);
    }
    itemData.__metadata = { "type": `SP.Data.${lijstConfig.lijstTitel.replace(/\s+/g, '_')}ListItem` };
    const apiUrl = `${window.spWebAbsoluteUrl.replace(/\/$/, "")}/_api/web/lists(guid'${lijstConfig.lijstId}')/items`;
    console.log(`[Machtigingen] createSPListItem - API call naar: ${apiUrl} voor lijst: ${lijstConfig.lijstTitel}`, itemData);
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest
        },
        body: JSON.stringify(itemData)
    });
    if (!response.ok && response.status !== 201) { 
        const errorData = await response.json().catch(() => ({ "error": { "message": { "value": "Onbekende serverfout bij parsen error response."}} }));
        const spErrorMessage = errorData.error?.message?.value || `HTTP error ${response.status}`;
        console.error(`[Machtigingen] Fout bij aanmaken item in ${lijstConfig.lijstTitel} (${response.status}): ${spErrorMessage}`);
        throw new Error(spErrorMessage);
    }
    console.log(`[Machtigingen] Item succesvol aangemaakt in ${lijstConfig.lijstTitel}. Status: ${response.status}`);
    return response.status === 201 ? await response.json() : null;
}
window.createSPListItem = createSPListItem;

/**
 * Controleert of de gebruiker lid is van ten minste één van de vereiste groepen.
 */
window.heeftGebruikerMachtiging = function(gedeelteNaam, gebruikersGroepen) { 
    if (!gedeelteNaam || typeof gedeelteNaam !== 'string') {
        console.warn(`[Machtigingen] Ongeldige gedeelteNaam voor heeftGebruikerMachtiging: ${gedeelteNaam}`);
        return false;
    }
    if (!window.UI_SECTION_PERMISSIONS || typeof window.UI_SECTION_PERMISSIONS !== 'object') {
        console.error("[Machtigingen] UI_SECTION_PERMISSIONS is niet gedefinieerd of geen object.");
        return false;
    }
    const vereisteGroepenVoorGedeelte = window.UI_SECTION_PERMISSIONS[gedeelteNaam];
    if (!vereisteGroepenVoorGedeelte || !Array.isArray(vereisteGroepenVoorGedeelte) || vereisteGroepenVoorGedeelte.length === 0) {
        console.log(`[Machtigingen] Geen machtigingsregel gedefinieerd of lege regel voor sectie: ${gedeelteNaam}. Toegang standaard geweigerd.`);
        return false; 
    }
    if (!gebruikersGroepen || !Array.isArray(gebruikersGroepen)) {
        console.warn(`[Machtigingen] Ongeldige of lege gebruikersGroepen array voor heeftGebruikerMachtiging: ${JSON.stringify(gebruikersGroepen)}`);
        return false;
    }
    return vereisteGroepenVoorGedeelte.some(vereisteGroep => 
        gebruikersGroepen.some(userGroup => userGroup.toLowerCase() === vereisteGroep.toLowerCase())
    );
};

/**
 * Past UI elementen aan op basis van gebruikersmachtigingen.
 */
async function pasUIMachtigingenToe() {
    if (!window.huidigeGebruiker || !window.huidigeGebruiker.loginNaam || !window.huidigeGebruiker.sharePointGroepen) {
        console.warn("[Machtigingen] pasUIMachtigingenToe: Wachten op volledige initialisatie van huidigeGebruiker (incl. groepen)...");
        return; 
    }
    console.log("[Machtigingen] Toepassen UI machtigingen met groepen:", window.huidigeGebruiker.sharePointGroepen);

    try {
        const beheerButton = document.getElementById('beheer-centrum-button'); 
        const adminInstellingenButton = document.getElementById('admin-instellingen-button');

        if (beheerButton) {
            beheerButton.classList.toggle('hidden', !window.heeftGebruikerMachtiging("BeheerHeader", window.huidigeGebruiker.sharePointGroepen));
        } else { console.warn("[Machtigingen] Element 'beheer-centrum-button' niet gevonden."); }

        if (adminInstellingenButton) {
            adminInstellingenButton.classList.toggle('hidden', !window.heeftGebruikerMachtiging("AdminInstellingen", window.huidigeGebruiker.sharePointGroepen));
        } else { console.warn("[Machtigingen] Element 'admin-instellingen-button' niet gevonden."); }
        
        console.log("[Machtigingen] UI machtigingen succesvol toegepast.");

    } catch (error) {
        console.error("[Machtigingen] Fout bij het toepassen van UI machtigingen:", error);
    }
}

/**
 * Verwijdert een item uit een SharePoint lijst
 */
window.deleteSPListItem = async function(lijstConfigKey, itemId) {
    const config = getLijstConfig(lijstConfigKey);
    if (!config) {
        throw new Error(`Configuratie voor lijst '${lijstConfigKey}' niet gevonden`);
    }
    
    const itemUrl = `${window.spWebAbsoluteUrl}/_api/web/lists/getbytitle('${config.lijstTitel}')/items(${itemId})`;
    
    try {
        const digest = await getRequestDigestGlobally();
        
        const response = await fetch(itemUrl, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'X-RequestDigest': digest,
                'IF-MATCH': '*'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok && response.status !== 204) {
            throw new Error(`Fout bij verwijderen: ${response.status} ${response.statusText}`);
        }
        
        console.log(`[Machtigingen] Item ${itemId} succesvol verwijderd uit ${lijstConfigKey}`);
        return true;
        
    } catch (error) {
        console.error(`[Machtigingen] Fout bij verwijderen item uit ${lijstConfigKey}:`, error);
        throw error;
    }
};

/**
 * Hoofd initialisatiefunctie voor machtigingen.js.
 */
async function initializeMachtigingen() {
    console.log("[Machtigingen] DOM geladen. Starten met initialisatie SharePoint context...");
    const contextInitialized = await initializeSharePointContextViaAPI(); 
    
    if (contextInitialized) {
        console.log("[Machtigingen] SharePoint context succesvol geïnitialiseerd. UI machtigingen worden nu toegepast.");
        await pasUIMachtigingenToe(); 
    } else {
        console.error("[Machtigingen] Initialisatie SharePoint context MISLUKT. UI machtigingen worden mogelijk niet correct toegepast.");
    }
}

document.addEventListener('DOMContentLoaded', initializeMachtigingen);
console.log("js/machtigingen.js geladen en wacht op DOMContentLoaded.");
