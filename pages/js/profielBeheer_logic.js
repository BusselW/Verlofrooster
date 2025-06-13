// Pages/JS/profielBeheer_logic.js

/**
 * Logica voor de profielBeheer.html pagina (nieuwe gebruiker registratie / eerste setup).
 * Beheert het stapsgewijze proces voor het instellen van persoonlijke informatie,
 * rooster voorkeuren en het standaard werkrooster.
 */

const PROFIELBEHEER_SITE_URL = "/sites/MulderT/CustomPW/Verlof/"; // Aanpassen indien nodig

let spWebAbsoluteUrlProfielBeheer = '';
let huidigeGebruikerProfielBeheer = {
    loginNaam: null,
    normalizedUsername: null,
    Id: null, // SharePoint User ID
    Title: null, // SharePoint Display Name
    Email: null,
    medewerkerDataSP: null, 
    gebruikersInstellingenSP: null, 
    werkroosterDataSP: null 
};

let huidigeStap = 1; 
const TOTAAL_STAPPEN = 3;

let alleTeamsProfielBeheer = [];
let alleFunctiesProfielBeheer = [];
let alleDagenIndicatorsProfielBeheer = [];

const domProfielBeheerRefs = {
    appBody: document.body,
    stepIndicator1: document.getElementById('step-indicator-1'), 
    stepIndicator2: document.getElementById('step-indicator-2'), 
    stepIndicator3: document.getElementById('step-indicator-3'), 
    step1Content: document.getElementById('step-1-content'), 
    step2Content: document.getElementById('step-2-content'), 
    step3Content: document.getElementById('step-3-content'), 
    nextStep1Button: document.getElementById('next-step-1-button'), 
    prevStep2Button: document.getElementById('prev-step-2-button'), 
    nextStep2Button: document.getElementById('next-step-2-button'), 
    prevStep3Button: document.getElementById('prev-step-3-button'), 
    completeRegistrationButton: document.getElementById('complete-registration-button'),
    persoonlijkeInfoForm: document.getElementById('persoonlijke-info-form'),
    pgProfilePic: document.getElementById('pg-profile-pic'),
    pgVoornaamInput: document.getElementById('pg-voornaam'),
    pgAchternaamInput: document.getElementById('pg-achternaam'),
    pgUsernameInput: document.getElementById('pg-username'), 
    pgEmailInput: document.getElementById('pg-email'),       
    pgTelefoonInput: document.getElementById('pg-telefoon'),
    pgGeboortedatumInput: document.getElementById('pg-geboortedatum'),
    pgTeamSelect: document.getElementById('pg-team'),         
    pgFunctieSelect: document.getElementById('pg-functie'),   
    persoonlijkeInfoStatusBericht: document.getElementById('persoonlijke-info-status-bericht'),
    roosterInstellingenForm: document.getElementById('rooster-instellingen-form'),
    instThemaSelect: document.getElementById('inst-thema'),
    instEigenTeamCheckbox: document.getElementById('inst-eigen-team'),
    instWeekendenCheckbox: document.getElementById('inst-weekenden'),
    instellingenStatusBericht: document.getElementById('instellingen-status-bericht'),
    standaardWerkdagenEditContainer: document.getElementById('standaard-werkdagen-edit-container'),
    werkdagenEditFormProfiel: document.getElementById('werkdagen-edit-form-profiel'), 
    werkroosterStatusBericht: document.getElementById('werkrooster-status-bericht'),
    globalStartTimeInput: document.getElementById('global-start-time'),
    globalEndTimeInput: document.getElementById('global-end-time'),    
    applyGlobalTimeButton: document.getElementById('apply-global-time-button'),
    currentYearSpan: document.getElementById('current-year'),
    pageTitleHeader: document.querySelector('#page-banner h1'),
};

const DAGEN_VAN_DE_WEEK_PROFIEL = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];

// --- Hulpfuncties ---

function formatDuurAlsTekst(duurMs) {
    if (duurMs === null || duurMs <= 0) return "0.00";
    const duurUren = duurMs / (1000 * 60 * 60);
    return duurUren.toFixed(2);
}

// --- Status Bericht Functies ---
/**
 * Toont een statusbericht voor een specifieke sectie in profielbeheer.
 * @param {HTMLElement} statusElement - Het DOM element voor het statusbericht.
 * @param {string} bericht - Het bericht om te tonen.
 * @param {'info'|'success'|'error'} [type='info'] - Het type bericht.
 * @param {boolean} [autoVerberg=true] - Of het bericht automatisch verborgen moet worden.
 * @param {string} sectieNaam - Naam van de sectie voor logging.
 */
function toonSectieStatusProfielBeheer(statusElement, bericht, type = 'info', autoVerberg = true, sectieNaam = "Algemeen") {
    if (statusElement) {
        statusElement.innerHTML = bericht;
        // Basisstijl, thema-specifieke kleuren worden toegevoegd op basis van 'type'
        statusElement.className = 'status-message mt-4 p-3 text-sm rounded-lg border'; 
        
        switch (type) {
            case 'success':
                statusElement.classList.add('bg-green-100', 'border-green-400', 'text-green-700', 'dark:bg-green-700/30', 'dark:text-green-200', 'dark:border-green-600');
                break;
            case 'error':
                statusElement.classList.add('bg-red-100', 'border-red-400', 'text-red-700', 'dark:bg-red-700/30', 'dark:text-red-200', 'dark:border-red-600');
                break;
            case 'info':
            default:
                statusElement.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700', 'dark:bg-blue-700/30', 'dark:text-blue-200', 'dark:border-blue-600');
                break;
        }
        statusElement.classList.remove('hidden');

        // Vorige timeout clearen als die bestaat
        if (statusElement.timeoutId) {
            clearTimeout(statusElement.timeoutId);
        }

        if (autoVerberg) {
            statusElement.timeoutId = setTimeout(() => {
                if (statusElement) statusElement.classList.add('hidden');
            }, 7000); // Verberg na 7 seconden
        }
    } else {
        console.warn(`[ProfielBeheer] Status element voor sectie '${sectieNaam}' niet gevonden. Bericht: ${bericht}`);
        // Fallback naar een algemene alert als het DOM element niet bestaat
        if (type === 'error') alert(`FOUT (${sectieNaam}): ${bericht}`);
        else alert(`INFO (${sectieNaam}): ${bericht}`);
    }
}

function toonStap1StatusBericht(bericht, type = 'info', autoVerberg = true) { 
    toonSectieStatusProfielBeheer(domProfielBeheerRefs.persoonlijkeInfoStatusBericht, bericht, type, autoVerberg, "Stap 1: Pers. Info"); 
}
function toonStap2StatusBericht(bericht, type = 'info', autoVerberg = true) { 
    toonSectieStatusProfielBeheer(domProfielBeheerRefs.instellingenStatusBericht, bericht, type, autoVerberg, "Stap 2: Rooster Inst."); 
}
function toonStap3StatusBericht(bericht, type = 'info', autoVerberg = true) { 
    toonSectieStatusProfielBeheer(domProfielBeheerRefs.werkroosterStatusBericht, bericht, type, autoVerberg, "Stap 3: Werkrooster"); 
}

/**
 * Toont een algemeen statusbericht (gebruikt het status element van de huidige actieve stap indien mogelijk).
 * @param {string} bericht - Het bericht om te tonen.
 * @param {'info'|'success'|'error'} [type='info'] - Het type bericht.
 * @param {boolean} [autoVerberg=true] - Of het bericht automatisch verborgen moet worden.
 */
function toonAlgemeenStatusBerichtProfiel(bericht, type = 'info', autoVerberg = true) {
    let targetElement = null;

    // Bepaal het doel-element op basis van de huidige actieve stap
    // en controleer of het element daadwerkelijk zichtbaar is (offsetParent is niet null)
    if (huidigeStap === 1 && domProfielBeheerRefs.persoonlijkeInfoStatusBericht && domProfielBeheerRefs.persoonlijkeInfoStatusBericht.offsetParent !== null) {
        targetElement = domProfielBeheerRefs.persoonlijkeInfoStatusBericht;
    } else if (huidigeStap === 2 && domProfielBeheerRefs.instellingenStatusBericht && domProfielBeheerRefs.instellingenStatusBericht.offsetParent !== null) {
        targetElement = domProfielBeheerRefs.instellingenStatusBericht;
    } else if (huidigeStap === 3 && domProfielBeheerRefs.werkroosterStatusBericht && domProfielBeheerRefs.werkroosterStatusBericht.offsetParent !== null) {
        targetElement = domProfielBeheerRefs.werkroosterStatusBericht;
    } else {
        // Fallback naar het statusbericht van de eerste stap als geen ander actief is,
        // of als het een algemene melding is voordat stappen goed zijn geïnitialiseerd.
        // Controleer of de elementen bestaan voordat ze worden toegewezen.
        if (domProfielBeheerRefs.persoonlijkeInfoStatusBericht) {
            targetElement = domProfielBeheerRefs.persoonlijkeInfoStatusBericht;
        } else if (domProfielBeheerRefs.instellingenStatusBericht) {
            targetElement = domProfielBeheerRefs.instellingenStatusBericht;
        } else if (domProfielBeheerRefs.werkroosterStatusBericht) {
            targetElement = domProfielBeheerRefs.werkroosterStatusBericht;
        }
    }
    
    if (!targetElement) {
        console.warn(`[ProfielBeheer] Geen geldig status element gevonden voor algemeen bericht. Bericht: ${bericht}`);
        // Fallback naar alert als geen passend status element beschikbaar is
        if (type === 'error') alert(`ALGEMENE FOUT: ${bericht}`);
        else alert(`ALGEMENE INFO: ${bericht}`);
        return;
    }
    toonSectieStatusProfielBeheer(targetElement, bericht, type, autoVerberg, "Algemeen Profielbeheer");
}


// --- Navigatie & UI Updates voor Stappen ---
function updateStepUI() {
    console.log(`[ProfielBeheer] Bijwerken UI naar stap: ${huidigeStap}`);
    const stepIndicators = [domProfielBeheerRefs.stepIndicator1, domProfielBeheerRefs.stepIndicator2, domProfielBeheerRefs.stepIndicator3];
    const stepContents = [domProfielBeheerRefs.step1Content, domProfielBeheerRefs.step2Content, domProfielBeheerRefs.step3Content];

    stepIndicators.forEach((indicator, index) => {
        if (indicator) {
            const stapNummer = index + 1;
            indicator.classList.remove('active', 'completed');
            if (stapNummer < huidigeStap) {
                indicator.classList.add('completed');
            } else if (stapNummer === huidigeStap) {
                indicator.classList.add('active');
            }
        } else {
            console.warn(`[ProfielBeheer] Stap indicator ${index + 1} niet gevonden in DOM.`);
        }
    });

    stepContents.forEach((content, index) => {
        if (content) {
            // Zorg ervoor dat de 'active' class correct wordt beheerd
            if ((index + 1) === huidigeStap) {
                content.classList.add('active');
                content.classList.remove('hidden'); // Verwijder 'hidden' als het actief is
            } else {
                content.classList.remove('active');
                content.classList.add('hidden'); // Voeg 'hidden' toe als het niet actief is
            }
        } else {
            console.warn(`[ProfielBeheer] Stap content ${index + 1} niet gevonden in DOM.`);
        }
    });

    // Update paginatitel in banner
    if (domProfielBeheerRefs.pageTitleHeader) {
        if (huidigeStap === 1) domProfielBeheerRefs.pageTitleHeader.textContent = "Profiel Setup: Persoonlijke Info";
        else if (huidigeStap === 2) domProfielBeheerRefs.pageTitleHeader.textContent = "Profiel Setup: Rooster Weergave";
        else if (huidigeStap === 3) domProfielBeheerRefs.pageTitleHeader.textContent = "Profiel Setup: Werkrooster";
    }
}

function gaNaarVolgendeStap() {
    if (huidigeStap < TOTAAL_STAPPEN) {
        if (huidigeStap === 1) { // Stap 1 is nu Persoonlijke Info
            if (!valideerPersoonlijkeInfoForm()) {
                // toonStap1StatusBericht wordt al in valideerPersoonlijkeInfoForm aangeroepen bij fout
                return; // Blijf op de huidige stap als validatie faalt
            }
        } else if (huidigeStap === 2) { // Stap 2 is nu Rooster Instellingen
            // Validatie voor stap 2 (Rooster Instellingen) is niet strikt nodig hier voor 'volgende',
            // omdat wijzigingen direct worden opgeslagen.
        }
        // Voor Stap 3 is er geen "Volgende" knop, alleen "Voltooien".

        huidigeStap++;
        updateStepUI();

        // Laad data voor de nieuwe actieve stap indien nodig
        if (huidigeStap === 2) {
            // Data voor Stap 2 (RoosterSetup) is als het goed is al geladen tijdens initiële pagina load
            // via laadInitiëlePaginaData -> laadEnPasThemaToeProfiel en vulStap2RoosterInstellingen.
            console.log("[ProfielBeheer] Naar stap 2 gegaan (Rooster Setup). Data zou al geladen moeten zijn.");
            // Als de UI voor stap 2 nog niet gevuld is, doe dat hier.
            if (domProfielBeheerRefs.instThemaSelect && domProfielBeheerRefs.instThemaSelect.options.length <=1) { // <=1 omdat er een default "Licht Thema" kan zijn
                 // laadEnPasThemaToeProfiel() en vulStap2RoosterInstellingen() zouden al gelopen moeten zijn.
                 // Dit is meer een vangnet of herinnering.
                 console.warn("[ProfielBeheer] Stap 2 UI lijkt niet volledig geïnitialiseerd, her-initialiseren.");
                 laadEnPasThemaToeProfiel().then(vulStap2RoosterInstellingen);
            }
        } else if (huidigeStap === 3) {
            // Roep de functie aan die data laadt en UI vult voor stap 3
            if (typeof laadEnVulStap3Werkrooster === 'function') {
                laadEnVulStap3Werkrooster();
            } else {
                console.error("[ProfielBeheer] Functie laadEnVulStap3Werkrooster niet gevonden.");
            }
        }
    }
}

function gaNaarVorigeStap() {
    if (huidigeStap > 1) {
        huidigeStap--;
        updateStepUI();
    }
}

// --- SharePoint API Functies ---
async function initializeProfielBeheerContext() {
    console.log("[ProfielBeheer] Initialiseren SharePoint context...");
    if (!PROFIELBEHEER_SITE_URL || typeof PROFIELBEHEER_SITE_URL !== 'string' || PROFIELBEHEER_SITE_URL.trim() === "") {
        const foutmelding = "[ProfielBeheer] Kritische fout: PROFIELBEHEER_SITE_URL is niet correct gedefinieerd.";
        console.error(foutmelding);
        toonAlgemeenStatusBerichtProfiel(foutmelding, "error", false);
        if (domProfielBeheerRefs.nextStep1Button) domProfielBeheerRefs.nextStep1Button.disabled = true;
        if (domProfielBeheerRefs.nextStep2Button) domProfielBeheerRefs.nextStep2Button.disabled = true;
        if (domProfielBeheerRefs.completeRegistrationButton) domProfielBeheerRefs.completeRegistrationButton.disabled = true;
        return false;
    }
    const sitePath = PROFIELBEHEER_SITE_URL.replace(/\/$/, "");
    const basisUrl = window.location.origin;
    try {
        const webApiUrl = `${basisUrl}${sitePath}/_api/web?$select=Url`;
        const webResponse = await fetch(webApiUrl, { headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!webResponse.ok) throw new Error(`Kan web URL niet ophalen (status: ${webResponse.status})`);
        const webData = await webResponse.json();
        spWebAbsoluteUrlProfielBeheer = webData.d.Url;
        if (!spWebAbsoluteUrlProfielBeheer.endsWith('/')) spWebAbsoluteUrlProfielBeheer += '/';
        
        const userApiUrl = `${spWebAbsoluteUrlProfielBeheer}_api/web/currentuser?$select=LoginName,Title,Id,Email`;
        const userResponse = await fetch(userApiUrl, { headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!userResponse.ok) throw new Error(`Kan gebruiker info niet ophalen (status: ${userResponse.status})`);
        const userData = await userResponse.json();
        huidigeGebruikerProfielBeheer.loginNaam = userData.d.LoginName;
        huidigeGebruikerProfielBeheer.normalizedUsername = window.trimLoginNaamPrefix(userData.d.LoginName);
        huidigeGebruikerProfielBeheer.Id = userData.d.Id;
        huidigeGebruikerProfielBeheer.Title = userData.d.Title;
        huidigeGebruikerProfielBeheer.Email = userData.d.Email;
        console.log(`[ProfielBeheer] Context succesvol. Gebruiker: ${huidigeGebruikerProfielBeheer.Title} (${huidigeGebruikerProfielBeheer.normalizedUsername})`);
        return true;
    } catch (error) {
        console.error("[ProfielBeheer] Fout bij ophalen context:", error);
        toonAlgemeenStatusBerichtProfiel(`Fout bij laden gebruikersinformatie: ${error.message}. Controleer de console.`, "error", false);
        if (domProfielBeheerRefs.nextStep1Button) domProfielBeheerRefs.nextStep1Button.disabled = true;
        if (domProfielBeheerRefs.nextStep2Button) domProfielBeheerRefs.nextStep2Button.disabled = true;
        if (domProfielBeheerRefs.completeRegistrationButton) domProfielBeheerRefs.completeRegistrationButton.disabled = true;
        return false;
    }
}

async function haalProfielBeheerLijstItems(lijstIdentifier, selectQuery = "", filterQuery = "", expandQuery = "", orderbyQuery = "", stil = false) {
    if (!spWebAbsoluteUrlProfielBeheer) {
        console.error(`[ProfielBeheer] haalProfielBeheerLijstItems: spWebAbsoluteUrlProfielBeheer is niet beschikbaar. Kan lijst '${lijstIdentifier}' niet ophalen.`);
        if (!stil && typeof toonAlgemeenStatusBerichtProfiel === 'function') {
            toonAlgemeenStatusBerichtProfiel(`Fout: Serververbinding niet beschikbaar voor lijst '${lijstIdentifier}'.`, "error", false);
        } else if (!stil) {
            alert(`Fout: Serververbinding niet beschikbaar voor lijst '${lijstIdentifier}'.`);
        }
        return [];
    }

    const lijstConfig = typeof getLijstConfig === 'function' ? getLijstConfig(lijstIdentifier) : null;
    if (!lijstConfig) {
        console.error(`[ProfielBeheer] Kon lijst configuratie niet vinden voor identifier: ${lijstIdentifier} via getLijstConfig.`);
        if (!stil && typeof toonAlgemeenStatusBerichtProfiel === 'function') {
            toonAlgemeenStatusBerichtProfiel(`Configuratiefout voor lijst '${lijstIdentifier}'. Controleer configLijst.js.`, "error", false);
        } else if (!stil) {
            alert(`Configuratiefout voor lijst '${lijstIdentifier}'.`);
        }
        return [];
    }

    const lijstIdOfTitel = lijstConfig.lijstId || lijstConfig.lijstTitel;
    const lijstWeergaveNaam = lijstConfig.lijstTitel || lijstIdentifier;

    let apiUrlPath;
    if (/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(lijstIdOfTitel)) { 
        apiUrlPath = `/_api/web/lists(guid'${lijstIdOfTitel}')/items`;
    } else {
        apiUrlPath = `/_api/web/lists/getByTitle('${encodeURIComponent(lijstIdOfTitel)}')/items`;
    }

    let queryParams = [];
    if (selectQuery) queryParams.push(selectQuery);
    if (filterQuery) queryParams.push(filterQuery);
    if (expandQuery) queryParams.push(expandQuery);
    if (orderbyQuery) queryParams.push(orderbyQuery);

    const apiUrl = `${spWebAbsoluteUrlProfielBeheer.replace(/\/$/, "")}${apiUrlPath}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
    if (!stil) console.log(`[ProfielBeheer] Ophalen items voor lijst '${lijstWeergaveNaam}': ${decodeURIComponent(apiUrl)}`);

    try {
        if (!stil && typeof toonAlgemeenStatusBerichtProfiel === 'function') {
            toonAlgemeenStatusBerichtProfiel(`Laden data voor '${lijstWeergaveNaam}'...`, "info", true, 10000);
        }
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: { value: `HTTP error ${response.status}`}}}));
            const spErrorMessage = errorData.error?.message?.value || `HTTP error ${response.status}`;
            console.error(`[ProfielBeheer] Fout bij ophalen lijst '${lijstWeergaveNaam}': ${spErrorMessage}`);
            if (!stil && typeof toonAlgemeenStatusBerichtProfiel === 'function') {
                toonAlgemeenStatusBerichtProfiel(`Fout bij laden van lijst '${lijstWeergaveNaam}': ${spErrorMessage}`, "error", false);
            } else if (!stil) {
                alert(`Fout bij laden van lijst '${lijstWeergaveNaam}': ${spErrorMessage}`);
            }
            return [];
        }
        const data = await response.json();
        const itemCount = data.d.results ? data.d.results.length : 0;
        if (!stil && typeof toonAlgemeenStatusBerichtProfiel === 'function') {
            if (itemCount > 0) toonAlgemeenStatusBerichtProfiel(`${itemCount} items geladen voor '${lijstWeergaveNaam}'.`, "success", true);
            else if (itemCount === 0 && !filterQuery) toonAlgemeenStatusBerichtProfiel(`Geen items gevonden in '${lijstWeergaveNaam}'.`, "info", true);
        }
        
        return data.d.results || [];
    } catch (error) {
        console.error(`[ProfielBeheer] Uitzondering bij ophalen lijst '${lijstWeergaveNaam}':`, error);
        if (!stil && typeof toonAlgemeenStatusBerichtProfiel === 'function') {
            toonAlgemeenStatusBerichtProfiel(`Netwerkfout bij laden van lijst '${lijstWeergaveNaam}': ${error.message}`, "error", false);
        } else if (!stil) {
            alert(`Netwerkfout bij laden van lijst '${lijstWeergaveNaam}': ${error.message}`);
        }
        return [];
    }
}

async function getProfielBeheerRequestDigest() {
    if (!spWebAbsoluteUrlProfielBeheer) throw new Error("Web absolute URL niet beschikbaar voor Request Digest.");
    const apiUrl = `${spWebAbsoluteUrlProfielBeheer.replace(/\/$/, "")}/_api/contextinfo`;
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Accept': 'application/json;odata=verbose' } });
    if (!response.ok) {
        const errorText = await response.text().catch(() => "Onbekende serverfout bij ophalen digest.");
        console.error(`[ProfielBeheer] Fout bij ophalen Request Digest: ${response.status}`, errorText);
        throw new Error(`Kon Request Digest niet ophalen (${response.status}). Details: ${errorText.substring(0,500)}`);
    }
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
}

async function createProfielBeheerSPItem(lijstIdentifier, itemData) {
    const lijstConfig = typeof getLijstConfig === 'function' ? getLijstConfig(lijstIdentifier) : null;
    if (!lijstConfig || !lijstConfig.lijstTitel) {
        console.error(`[ProfielBeheer] Ongeldige lijstconfiguratie voor identifier: ${lijstIdentifier}`);
        throw new Error(`Ongeldige lijstconfiguratie voor '${lijstIdentifier}'.`);
    }

    const lijstIdOfTitel = lijstConfig.lijstId || lijstConfig.lijstTitel;
    let apiUrlPath;
    if (/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(lijstIdOfTitel)) {
        apiUrlPath = `/_api/web/lists(guid'${lijstIdOfTitel}')/items`;
    } else {
        apiUrlPath = `/_api/web/lists/getByTitle('${encodeURIComponent(lijstIdOfTitel)}')/items`;
    }
    
    let listNameForType = lijstConfig.lijstTitel.replace(/\s+/g, ''); 
    listNameForType = listNameForType.replace(/[^a-zA-Z0-9]/g, ''); 
    const metadataType = `SP.Data.${listNameForType.charAt(0).toUpperCase() + listNameForType.slice(1)}ListItem`;
    itemData.__metadata = { "type": metadataType };

    const requestDigest = await getProfielBeheerRequestDigest();
    const apiUrl = `${spWebAbsoluteUrlProfielBeheer.replace(/\/$/, "")}${apiUrlPath}`;
    console.log(`[ProfielBeheer] createProfielBeheerSPItem - API POST naar: ${apiUrl}`, JSON.stringify(itemData, null, 2));
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest
        },
        body: JSON.stringify(itemData)
    });
    if (!response.ok || response.status !== 201) { 
        const errorDataText = await response.text();
        let spErrorMessage = `HTTP error ${response.status}`;
        try {
            const errorDataJson = JSON.parse(errorDataText);
            spErrorMessage = errorDataJson.error?.message?.value || spErrorMessage;
        } catch (e) {
            spErrorMessage = `${spErrorMessage} - Response: ${errorDataText.substring(0,200)}`;
        }
        console.error(`[ProfielBeheer] Fout bij aanmaken item in '${lijstConfig.lijstTitel}' (status ${response.status}): ${spErrorMessage}`);
        throw new Error(`Fout bij aanmaken SP item in '${lijstConfig.lijstTitel}': ${spErrorMessage}`);
    }
    console.log(`[ProfielBeheer] Item succesvol aangemaakt in '${lijstConfig.lijstTitel}'. Status: ${response.status}`);
    const responseData = await response.json();
    return responseData; 
}

async function updateProfielBeheerSPItem(lijstIdentifier, itemId, itemData) {
    const lijstConfig = typeof getLijstConfig === 'function' ? getLijstConfig(lijstIdentifier) : null;
     if (!lijstConfig || !lijstConfig.lijstTitel) {
        console.error(`[ProfielBeheer] Ongeldige lijstconfiguratie voor identifier: ${lijstIdentifier}`);
        throw new Error(`Ongeldige lijstconfiguratie voor '${lijstIdentifier}'.`);
    }

    const lijstIdOfTitel = lijstConfig.lijstId || lijstConfig.lijstTitel;
    let apiUrlPath;
     if (/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(lijstIdOfTitel)) {
        apiUrlPath = `/_api/web/lists(guid'${lijstIdOfTitel}')/items(${itemId})`;
    } else {
        apiUrlPath = `/_api/web/lists/getByTitle('${encodeURIComponent(lijstIdOfTitel)}')/items(${itemId})`;
    }

    let listNameForType = lijstConfig.lijstTitel.replace(/\s+/g, '');
    listNameForType = listNameForType.replace(/[^a-zA-Z0-9]/g, '');
    const metadataType = `SP.Data.${listNameForType.charAt(0).toUpperCase() + listNameForType.slice(1)}ListItem`;
    itemData.__metadata = { "type": metadataType };

    const requestDigest = await getProfielBeheerRequestDigest();
    const apiUrl = `${spWebAbsoluteUrlProfielBeheer.replace(/\/$/, "")}${apiUrlPath}`;
    console.log(`[ProfielBeheer] updateProfielBeheerSPItem - API MERGE naar: ${apiUrl}`, JSON.stringify(itemData, null, 2));
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE'
        },
        body: JSON.stringify(itemData)
    });
    if (response.status !== 204) { 
        const errorDataText = await response.text();
        let spErrorMessage = `HTTP error ${response.status}`;
        try {
            const errorDataJson = JSON.parse(errorDataText);
            spErrorMessage = errorDataJson.error?.message?.value || spErrorMessage;
        } catch (e) {
             spErrorMessage = `${spErrorMessage} - Response: ${errorDataText.substring(0,200)}`;
        }
        console.error(`[ProfielBeheer] Fout bij bijwerken item in '${lijstConfig.lijstTitel}' (status ${response.status}): ${spErrorMessage}`);
        throw new Error(`Fout bij bijwerken SP item in '${lijstConfig.lijstTitel}': ${spErrorMessage}`);
    }
    console.log(`[ProfielBeheer] Item succesvol bijgewerkt in '${lijstConfig.lijstTitel}'. Status: ${response.status}`);
    return true;
}

// --- Thema Functies (Nu voor Stap 2) ---
function pasThemaKlassenToeProfiel(thema) {
    const isLichtThema = thema === 'light';
    if (domProfielBeheerRefs.appBody) {
        domProfielBeheerRefs.appBody.classList.toggle('light-theme', isLichtThema);
        domProfielBeheerRefs.appBody.classList.toggle('dark-theme', !isLichtThema);
        console.log(`[ProfielBeheer] Thema klassen op body bijgewerkt naar: ${thema}`);
    }
}

async function slaStap2InstellingDirectOp(instellingNaam, waarde) {
    if (!huidigeGebruikerProfielBeheer.normalizedUsername) {
        console.warn("[ProfielBeheer] Kan instelling niet direct opslaan: normalizedUsername ontbreekt.");
        toonStap2StatusBericht("Kan instelling niet opslaan, gebruikersinfo ontbreekt.", "error", false);
        return;
    }

    toonStap2StatusBericht("Bezig met opslaan van voorkeur...", "info", true);

    let dataVoorOpslag = { Title: huidigeGebruikerProfielBeheer.normalizedUsername };
    dataVoorOpslag[instellingNaam] = waarde;

    if (!huidigeGebruikerProfielBeheer.gebruikersInstellingenSP) {
        huidigeGebruikerProfielBeheer.gebruikersInstellingenSP = { Title: huidigeGebruikerProfielBeheer.normalizedUsername };
    }
    huidigeGebruikerProfielBeheer.gebruikersInstellingenSP[instellingNaam] = waarde;

    try {
        if (!huidigeGebruikerProfielBeheer.gebruikersInstellingenSP.ID) {
            const bestaandeItems = await haalProfielBeheerLijstItems("gebruikersInstellingen", "$select=ID", `$filter=Title eq '${huidigeGebruikerProfielBeheer.normalizedUsername}'`, "", "", true);
            if (bestaandeItems && bestaandeItems.length > 0) {
                huidigeGebruikerProfielBeheer.gebruikersInstellingenSP.ID = bestaandeItems[0].ID;
            }
        }

        if (huidigeGebruikerProfielBeheer.gebruikersInstellingenSP.ID) {
            await updateProfielBeheerSPItem("gebruikersInstellingen", huidigeGebruikerProfielBeheer.gebruikersInstellingenSP.ID, dataVoorOpslag);
        } else {
            const nieuwItem = await createProfielBeheerSPItem("gebruikersInstellingen", dataVoorOpslag);
            if(nieuwItem && nieuwItem.d) huidigeGebruikerProfielBeheer.gebruikersInstellingenSP.ID = nieuwItem.d.ID;
        }
        toonStap2StatusBericht("Voorkeur opgeslagen!", "success", true);
    } catch (error) {
        console.error(`[ProfielBeheer] Fout bij direct opslaan instelling '${instellingNaam}':`, error);
        toonStap2StatusBericht(`Fout bij opslaan voorkeur: ${error.message}`, "error", false);
    }
}

async function laadEnPasThemaToeProfiel() { 
    console.log("[ProfielBeheer] Start laadEnPasThemaToeProfiel (voor Stap 2).");
    let actiefThema = localStorage.getItem('verlofroosterThema') || 'light';
    pasThemaKlassenToeProfiel(actiefThema);
    if (domProfielBeheerRefs.instThemaSelect) domProfielBeheerRefs.instThemaSelect.value = actiefThema;

    if (!huidigeGebruikerProfielBeheer.normalizedUsername) {
        console.warn("[ProfielBeheer] Kan instellingen niet ophalen van SP: normalizedUsername ontbreekt.");
        vulStap2RoosterInstellingenMetDefaults(actiefThema); 
        return;
    }
    try {
        const instellingenItems = await haalProfielBeheerLijstItems("gebruikersInstellingen", "$select=ID,Title,soortWeergave,EigenTeamWeergeven,WeekendenWeergeven", `$filter=Title eq '${huidigeGebruikerProfielBeheer.normalizedUsername}'`, "", "", true);
        if (instellingenItems && instellingenItems.length > 0) {
            huidigeGebruikerProfielBeheer.gebruikersInstellingenSP = instellingenItems[0];
            const inst = huidigeGebruikerProfielBeheer.gebruikersInstellingenSP;
            actiefThema = inst.soortWeergave || actiefThema;
            pasThemaKlassenToeProfiel(actiefThema);
            localStorage.setItem('verlofroosterThema', actiefThema);
            if (domProfielBeheerRefs.instThemaSelect) domProfielBeheerRefs.instThemaSelect.value = actiefThema;
            if (domProfielBeheerRefs.instEigenTeamCheckbox) domProfielBeheerRefs.instEigenTeamCheckbox.checked = inst.EigenTeamWeergeven || false;
            if (domProfielBeheerRefs.instWeekendenCheckbox) domProfielBeheerRefs.instWeekendenCheckbox.checked = (inst.WeekendenWeergeven === null || inst.WeekendenWeergeven === undefined) ? true : inst.WeekendenWeergeven;
        } else {
            vulStap2RoosterInstellingenMetDefaults(actiefThema);
        }
    } catch (error) {
        console.error("[ProfielBeheer] Fout bij ophalen instellingen van SP:", error);
        vulStap2RoosterInstellingenMetDefaults(actiefThema);
    }
}

function vulStap2RoosterInstellingenMetDefaults(huidigThema = 'light') { 
    if (domProfielBeheerRefs.instThemaSelect) domProfielBeheerRefs.instThemaSelect.value = huidigThema;
    if (domProfielBeheerRefs.instEigenTeamCheckbox) domProfielBeheerRefs.instEigenTeamCheckbox.checked = false;
    if (domProfielBeheerRefs.instWeekendenCheckbox) domProfielBeheerRefs.instWeekendenCheckbox.checked = true;
    pasThemaKlassenToeProfiel(huidigThema);
}

// --- Data Laden & UI Vullen voor Stappen ---
function vulStap2RoosterInstellingen() { 
    console.log("[ProfielBeheer] Vullen UI voor Stap 2 (Rooster Instellingen) en koppelen listeners.");
    if (domProfielBeheerRefs.instThemaSelect) {
        domProfielBeheerRefs.instThemaSelect.addEventListener('change', (event) => {
            const nieuwThema = event.target.value;
            pasThemaKlassenToeProfiel(nieuwThema);
            localStorage.setItem('verlofroosterThema', nieuwThema);
            slaStap2InstellingDirectOp('soortWeergave', nieuwThema);
        });
    }
    if (domProfielBeheerRefs.instEigenTeamCheckbox) {
        domProfielBeheerRefs.instEigenTeamCheckbox.addEventListener('change', (event) => {
            slaStap2InstellingDirectOp('EigenTeamWeergeven', event.target.checked);
        });
    }
    if (domProfielBeheerRefs.instWeekendenCheckbox) {
        domProfielBeheerRefs.instWeekendenCheckbox.addEventListener('change', (event) => {
            slaStap2InstellingDirectOp('WeekendenWeergeven', event.target.checked);
        });
    }
}

async function laadEnVulStap1PersoonlijkeInfo() { 
    console.log("[ProfielBeheer] Start laden en vullen Stap 1: Persoonlijke Informatie.");
    toonStap1StatusBericht("Vul uw persoonlijke gegevens in.", "info", false);

    if (!huidigeGebruikerProfielBeheer.normalizedUsername || !huidigeGebruikerProfielBeheer.Email) {
        toonStap1StatusBericht("Basis gebruikersinformatie ontbreekt. Kan formulier niet volledig voorinvullen.", "error", false);
    }

    if (domProfielBeheerRefs.pgUsernameInput) domProfielBeheerRefs.pgUsernameInput.value = huidigeGebruikerProfielBeheer.normalizedUsername || '';
    if (domProfielBeheerRefs.pgEmailInput) domProfielBeheerRefs.pgEmailInput.value = huidigeGebruikerProfielBeheer.Email || '';
    if (domProfielBeheerRefs.pgVoornaamInput) domProfielBeheerRefs.pgVoornaamInput.value = '';
    if (domProfielBeheerRefs.pgAchternaamInput) domProfielBeheerRefs.pgAchternaamInput.value = '';
    if (domProfielBeheerRefs.pgGeboortedatumInput) domProfielBeheerRefs.pgGeboortedatumInput.value = '';

    try {
        const [teamsData, functiesData] = await Promise.all([
            haalProfielBeheerLijstItems("Teams", "$select=ID,Title,Naam,Actief", "$filter=Actief eq 1", "", "$orderby=Naam asc", true),
            haalProfielBeheerLijstItems("keuzelijstFuncties", "$select=ID,Title", "", "", "$orderby=Title asc", true)
        ]);
        alleTeamsProfielBeheer = teamsData || [];
        alleFunctiesProfielBeheer = functiesData || [];

        if (domProfielBeheerRefs.pgTeamSelect) {
            domProfielBeheerRefs.pgTeamSelect.innerHTML = '<option value="">Selecteer een team...</option>';
            alleTeamsProfielBeheer.forEach(team => {
                const option = document.createElement('option');
                option.value = team.Naam || team.Title;
                option.textContent = team.Naam || team.Title;
                domProfielBeheerRefs.pgTeamSelect.appendChild(option);
            });
        } else { console.warn("[ProfielBeheer] pgTeamSelect niet gevonden"); }

        if (domProfielBeheerRefs.pgFunctieSelect) {
            domProfielBeheerRefs.pgFunctieSelect.innerHTML = '<option value="">Selecteer een functie...</option>';
            alleFunctiesProfielBeheer.forEach(functie => {
                const option = document.createElement('option');
                option.value = functie.Title;
                option.textContent = functie.Title;
                domProfielBeheerRefs.pgFunctieSelect.appendChild(option);
            });
        } else { console.warn("[ProfielBeheer] pgFunctieSelect niet gevonden"); }
        
        if (teamsData.length > 0 && functiesData.length > 0) {
            toonStap1StatusBericht("Selectieopties voor team en functie geladen.", "success", true);
        } else {
            toonStap1StatusBericht("Kon niet alle selectieopties laden. Controleer de console.", "warning", false);
        }
    } catch (error) {
        console.error("[ProfielBeheer] Fout bij laden team/functie opties:", error);
        toonStap1StatusBericht("Fout bij laden selectieopties.", "error", false);
    }
    stelProfielfotoInProfiel();
}

function stelProfielfotoInProfiel() {
    const profielFotoElement = domProfielBeheerRefs.pgProfilePic;
    if (!profielFotoElement) {
        console.warn("[ProfielBeheer] Profielfoto element (pg-profile-pic) niet gevonden.");
        return;
    }

    if (huidigeGebruikerProfielBeheer.loginNaam && spWebAbsoluteUrlProfielBeheer) {
        const accountName = encodeURIComponent(huidigeGebruikerProfielBeheer.loginNaam);
        const photoUrl = `${spWebAbsoluteUrlProfielBeheer.replace(/\/$/, "")}/_layouts/15/userphoto.aspx?size=M&accountname=${accountName}`;
        
        profielFotoElement.src = photoUrl;
        console.log("[ProfielBeheer] Poging tot laden profielfoto via URL:", photoUrl);

        profielFotoElement.onerror = function() {
            console.warn("[ProfielBeheer] Fout bij laden SharePoint profielfoto via userphoto.aspx, fallback naar initialen.");
            genererInitialenProfielfoto(); 
        };
         profielFotoElement.onload = function() {
            if (profielFotoElement.naturalWidth <= 1 && profielFotoElement.naturalHeight <= 1) { 
                console.warn("[ProfielBeheer] Geladen profielfoto lijkt een placeholder te zijn, fallback naar initialen.");
                genererInitialenProfielfoto();
            } else {
                console.log("[ProfielBeheer] Profielfoto succesvol geladen via userphoto.aspx.");
            }
        };
    } else {
        console.log("[ProfielBeheer] Loginnaam of site URL niet beschikbaar voor getProfilePhotoUrl, fallback naar initialen.");
        genererInitialenProfielfoto();
    }
}

function genererInitialenProfielfoto() {
    const profielFotoElement = domProfielBeheerRefs.pgProfilePic;
    if (!profielFotoElement) return;
    const voornaam = domProfielBeheerRefs.pgVoornaamInput ? domProfielBeheerRefs.pgVoornaamInput.value : '';
    const achternaam = domProfielBeheerRefs.pgAchternaamInput ? domProfielBeheerRefs.pgAchternaamInput.value : '';
    let initialen = "";
    if (voornaam && achternaam) initialen = `${voornaam.charAt(0)}${achternaam.charAt(0)}`.toUpperCase();
    else if (huidigeGebruikerProfielBeheer.Title) {
        const parts = huidigeGebruikerProfielBeheer.Title.split(/[\s,]+/);
        if (parts.length >= 2) initialen = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
        else if (parts.length === 1 && parts[0].length >= 2) initialen = parts[0].substring(0,2).toUpperCase();
        else if (parts.length === 1 && parts[0].length === 1) initialen = parts[0].toUpperCase();
    }
    if (!initialen && huidigeGebruikerProfielBeheer.normalizedUsername) initialen = huidigeGebruikerProfielBeheer.normalizedUsername.substring(0,2).toUpperCase();
    if (!initialen) initialen = "GE";
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 100;
    const context = canvas.getContext('2d');
    const isDarkTheme = domProfielBeheerRefs.appBody.classList.contains('dark-theme');
    context.fillStyle = isDarkTheme ? 'var(--gray-700, #374151)' : 'var(--gray-200, #e5e7eb)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = isDarkTheme ? 'var(--gray-100, #f3f4f6)' : 'var(--gray-800, #1f2937)';
    context.font = `bold ${initialen.length === 1 ? 50 : 40}px Inter, sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(initialen, canvas.width / 2, canvas.height / 2 + 2);
    profielFotoElement.src = canvas.toDataURL();
    profielFotoElement.alt = `Initialen: ${initialen}`;
    console.log("[ProfielBeheer] Profielfoto ingesteld met initialen:", initialen);
}

function valideerPersoonlijkeInfoForm() {
    let isValide = true;
    toonStap1StatusBericht("", "info", true); 

    const voornaam = domProfielBeheerRefs.pgVoornaamInput.value.trim();
    const achternaam = domProfielBeheerRefs.pgAchternaamInput.value.trim();
    const team = domProfielBeheerRefs.pgTeamSelect.value;
    const functie = domProfielBeheerRefs.pgFunctieSelect.value;
    const geboortedatum = domProfielBeheerRefs.pgGeboortedatumInput.value;

    if (!voornaam) { toonStap1StatusBericht("Voornaam is een verplicht veld.", "error", false); domProfielBeheerRefs.pgVoornaamInput.focus(); isValide = false; }
    else if (!achternaam) { toonStap1StatusBericht("Achternaam is een verplicht veld.", "error", false); domProfielBeheerRefs.pgAchternaamInput.focus(); isValide = false; }
    else if (!team) { toonStap1StatusBericht("Team is een verplicht veld.", "error", false); domProfielBeheerRefs.pgTeamSelect.focus(); isValide = false; }
    else if (!functie) { toonStap1StatusBericht("Functie is een verplicht veld.", "error", false); domProfielBeheerRefs.pgFunctieSelect.focus(); isValide = false; }
    
    if (geboortedatum) {
        const geboorteDatumObj = new Date(geboortedatum);
        const vandaag = new Date();
        vandaag.setHours(0,0,0,0);
        if (isNaN(geboorteDatumObj.getTime())) {
            toonStap1StatusBericht("Ongeldige geboortedatum ingevoerd.", "error", false);
            domProfielBeheerRefs.pgGeboortedatumInput.focus();
            isValide = false;
        } else if (geboorteDatumObj >= vandaag) {
            toonStap1StatusBericht("Geboortedatum moet in het verleden liggen.", "error", false);
            domProfielBeheerRefs.pgGeboortedatumInput.focus();
            isValide = false;
        }
    }
    return isValide;
}

async function laadEnVulStap3Werkrooster() {
    console.log("[ProfielBeheer] Start laden en vullen Stap 3: Werkrooster.");
    toonStap3StatusBericht("Bezig met laden van werkrooster configuratie...", "info", false);
    try {
        const dagenIndicatorsData = await haalProfielBeheerLijstItems("DagenIndicators", "$select=ID,Title,Beschrijving", "", "", "$orderby=Title asc", true);
        alleDagenIndicatorsProfielBeheer = dagenIndicatorsData || []; 
        
        genereerWerkroosterEditFormProfiel();
        koppelGlobaleTijdListener();
        toonStap3StatusBericht("Werkrooster formulier is klaar.", "success", true);
    } catch (error) {
        console.error("[ProfielBeheer] Fout bij laden werkrooster configuratie:", error);
        toonStap3StatusBericht("Fout bij laden werkrooster configuratie.", "error", false);
    }
}

function genereerWerkroosterEditFormProfiel() {
    const container = domProfielBeheerRefs.werkdagenEditFormProfiel;
    if (!container) { console.error("[ProfielBeheer] Container werkdagenEditFormProfiel niet gevonden."); return; }
    
    // Verwijder alleen de rijen, laat de header (die nu in HTML staat) intact.
    const rijen = container.querySelectorAll('.werkrooster-edit-row');
    rijen.forEach(rij => rij.remove());
    // Als de placeholder "Werkrooster invoervelden worden hier geladen..." nog bestaat, verwijder die ook.
    const placeholderText = container.querySelector('.text-center.py-8.italic');
    if (placeholderText) {
        placeholderText.remove();
    }


    DAGEN_VAN_DE_WEEK_PROFIEL.forEach(dag => {
        const rijDiv = document.createElement('div');
        rijDiv.className = 'werkrooster-edit-row grid grid-cols-1 md:grid-cols-6 gap-x-3 gap-y-2 items-center p-2.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 mb-1';

        const dagLabelSpan = document.createElement('span');
        dagLabelSpan.className = 'dag-label text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-1';
        dagLabelSpan.textContent = dag;
        rijDiv.appendChild(dagLabelSpan);

        const startInput = document.createElement('input');
        startInput.type = 'time'; startInput.id = `profiel-${dag.toLowerCase()}-start`;
        startInput.className = 'form-input w-full text-xs md:col-span-1';
        rijDiv.appendChild(startInput);

        const eindInput = document.createElement('input');
        eindInput.type = 'time'; eindInput.id = `profiel-${dag.toLowerCase()}-eind`;
        eindInput.className = 'form-input w-full text-xs md:col-span-1';
        rijDiv.appendChild(eindInput);

        const vrijeDagContainer = document.createElement('div');
        vrijeDagContainer.className = "flex justify-center items-center md:col-span-1";
        const vrijeDagCheckbox = document.createElement('input');
        vrijeDagCheckbox.type = 'checkbox'; vrijeDagCheckbox.id = `profiel-${dag.toLowerCase()}-vrij`;
        vrijeDagCheckbox.className = 'form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-800';
        vrijeDagContainer.appendChild(vrijeDagCheckbox);
        rijDiv.appendChild(vrijeDagContainer);
        
        const berekendeSoortSpan = document.createElement('span');
        berekendeSoortSpan.id = `profiel-${dag.toLowerCase()}-berekende-soort`;
        berekendeSoortSpan.className = 'text-xs text-center text-gray-500 dark:text-gray-400 md:col-span-1 italic';
        rijDiv.appendChild(berekendeSoortSpan);

        const totaalUrenSpan = document.createElement('span');
        totaalUrenSpan.id = `profiel-${dag.toLowerCase()}-totaal-uren`;
        totaalUrenSpan.className = 'text-xs text-center text-gray-700 dark:text-gray-300 md:col-span-1 font-medium';
        totaalUrenSpan.textContent = "0.00";
        rijDiv.appendChild(totaalUrenSpan);

        const updateDagLogica = () => {
            const isVrij = vrijeDagCheckbox.checked;
            let soortDagBerekend = "Niet Werkzaam"; 
            let dagTotaalMs = 0;
            startInput.disabled = isVrij; eindInput.disabled = isVrij;

            if (isVrij) {
                startInput.value = ''; eindInput.value = '';
                soortDagBerekend = "VVD";
            } else {
                const startTijd = startInput.value; const eindTijd = eindInput.value;
                if (startTijd && eindTijd) {
                    const startUur = parseInt(startTijd.split(':')[0]);
                    const startMin = parseInt(startTijd.split(':')[1]);
                    const eindUur = parseInt(eindTijd.split(':')[0]);
                    const eindMin = parseInt(eindTijd.split(':')[1]);
                    
                    const startMoment = new Date(1970, 0, 1, startUur, startMin);
                    const eindMoment = new Date(1970, 0, 1, eindUur, eindMin);
                    
                    if (eindMoment > startMoment) { 
                        dagTotaalMs = eindMoment.getTime() - startMoment.getTime();
                        const duurUren = dagTotaalMs / (1000 * 60 * 60);

                        if (startUur <= 10 && eindUur >= 14 && duurUren >= 7) soortDagBerekend = "Normaal";
                        else if (eindUur < 13 || (eindUur === 13 && eindMin === 0)) soortDagBerekend = "VVM";
                        else if (startUur >= 13) soortDagBerekend = "VVO";
                        else if (duurUren > 0) soortDagBerekend = "Normaal"; 
                        else soortDagBerekend = "Minimaal"; 
                        
                    } else if (eindMoment < startMoment) soortDagBerekend = "Tijd Fout";
                    else soortDagBerekend = "Minimaal"; 
                } else if (startTijd || eindTijd) soortDagBerekend = "Onvolledig";
            }
            berekendeSoortSpan.textContent = soortDagBerekend;
            totaalUrenSpan.textContent = formatDuurAlsTekst(dagTotaalMs);

            const isFoutief = ["Tijd Fout", "Onvolledig", "Minimaal"].includes(soortDagBerekend);
            berekendeSoortSpan.classList.toggle("text-red-500", isFoutief);
            berekendeSoortSpan.classList.toggle("dark:text-red-400", isFoutief);
            berekendeSoortSpan.classList.toggle("font-semibold", isFoutief);
            berekendeSoortSpan.classList.toggle("italic", !isFoutief);
            berekendeSoortSpan.classList.toggle("text-gray-500", !isFoutief && soortDagBerekend !== "VVD" && soortDagBerekend !== "VVM" && soortDagBerekend !== "VVO" && soortDagBerekend !== "Normaal");
            berekendeSoortSpan.classList.toggle("dark:text-gray-400", !isFoutief && soortDagBerekend !== "VVD" && soortDagBerekend !== "VVM" && soortDagBerekend !== "VVO" && soortDagBerekend !== "Normaal");
        };

        vrijeDagCheckbox.addEventListener('change', updateDagLogica);
        startInput.addEventListener('change', updateDagLogica);
        eindInput.addEventListener('change', updateDagLogica);
        
        updateDagLogica(); 
        container.appendChild(rijDiv);
    });
}

function koppelGlobaleTijdListener() {
    if (domProfielBeheerRefs.applyGlobalTimeButton && domProfielBeheerRefs.globalStartTimeInput && domProfielBeheerRefs.globalEndTimeInput) {
        domProfielBeheerRefs.applyGlobalTimeButton.addEventListener('click', () => {
            const globalStart = domProfielBeheerRefs.globalStartTimeInput.value;
            const globalEnd = domProfielBeheerRefs.globalEndTimeInput.value;

            if (!globalStart || !globalEnd) {
                toonStap3StatusBericht("Vul aub zowel globale start- als eindtijd in.", "error");
                return;
            }
            if (globalEnd <= globalStart) {
                toonStap3StatusBericht("Globale eindtijd moet na starttijd liggen.", "error");
                return;
            }

            DAGEN_VAN_DE_WEEK_PROFIEL.forEach(dag => {
                const vrijeDagCheckbox = document.getElementById(`profiel-${dag.toLowerCase()}-vrij`);
                const startInput = document.getElementById(`profiel-${dag.toLowerCase()}-start`);
                const eindInput = document.getElementById(`profiel-${dag.toLowerCase()}-eind`);

                if (vrijeDagCheckbox && !vrijeDagCheckbox.checked && startInput && eindInput) {
                    startInput.value = globalStart;
                    eindInput.value = globalEnd;
                    const changeEvent = new Event('change'); 
                    startInput.dispatchEvent(changeEvent); 
                }
            });
            toonStap3StatusBericht("Globale tijden toegepast op niet-vrije dagen.", "success");
        });
    } else {
        console.warn("[ProfielBeheer] Globale tijd instellingselementen niet volledig gevonden in DOM refs.");
    }
}


function valideerEnVerzamelWerkroosterData() {
    toonStap3StatusBericht("", "info", true);
    const nu = new Date();
    const ingangsdatumVandaag = new Date(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate())).toISOString();

    const roosterData = {
        Title: `Werkrooster ${huidigeGebruikerProfielBeheer.normalizedUsername} (initieel)`,
        MedewerkerID: huidigeGebruikerProfielBeheer.normalizedUsername,
        Ingangsdatum: ingangsdatumVandaag,
        VeranderingsDatum: null
    };
    let isValide = true;

    DAGEN_VAN_DE_WEEK_PROFIEL.forEach(dag => {
        const vrijeDagCheckbox = document.getElementById(`profiel-${dag.toLowerCase()}-vrij`);
        const startInput = document.getElementById(`profiel-${dag.toLowerCase()}-start`);
        const eindInput = document.getElementById(`profiel-${dag.toLowerCase()}-eind`);
        const berekendeSoortSpan = document.getElementById(`profiel-${dag.toLowerCase()}-berekende-soort`);
        const totaalUrenSpan = document.getElementById(`profiel-${dag.toLowerCase()}-totaal-uren`);

        const isVrij = vrijeDagCheckbox ? vrijeDagCheckbox.checked : false;
        const startVal = startInput ? startInput.value : null;
        const eindVal = eindInput ? eindInput.value : null;
        let soortDagDefinitief = berekendeSoortSpan ? berekendeSoortSpan.textContent : "Niet Werkzaam";
        let dagTotaalTekst = totaalUrenSpan ? totaalUrenSpan.textContent : "0.00";

        if (isVrij) {
            soortDagDefinitief = "VVD";
            roosterData[`${dag}Start`] = null;
            roosterData[`${dag}Eind`] = null;
            dagTotaalTekst = "0.00";
        } else {
            if (soortDagDefinitief === "Tijd Fout" || soortDagDefinitief === "Onvolledig" || soortDagDefinitief === "Minimaal") {
                toonStap3StatusBericht(`Controleer de ingevoerde tijden voor ${dag}. Huidige status: ${soortDagDefinitief}.`, "error", false);
                isValide = false;
                soortDagDefinitief = "Niet Werkzaam"; 
                dagTotaalTekst = "0.00";
            } else if (soortDagDefinitief === "Normaal" || soortDagDefinitief === "VVM" || soortDagDefinitief === "VVO") {
                if (!startVal || !eindVal) {
                    toonStap3StatusBericht(`Voor ${dag} (${soortDagDefinitief}): vul start- en eindtijd in.`, "error", false);
                    isValide = false;
                    soortDagDefinitief = "Niet Werkzaam";
                    dagTotaalTekst = "0.00";
                }
                // dagTotaalTekst wordt al gezet door updateDagLogica via de span.
            } else { 
                soortDagDefinitief = "Niet Werkzaam";
                dagTotaalTekst = "0.00";
            }
            roosterData[`${dag}Start`] = startVal || null;
            roosterData[`${dag}Eind`] = eindVal || null;
        }
        roosterData[`${dag}Soort`] = soortDagDefinitief;
        roosterData[`${dag}Totaal`] = dagTotaalTekst;
    });

    return isValide ? roosterData : null;
}


// --- Voltooien Registratie ---
async function handleRegistratieVoltooien() {
    console.log("[ProfielBeheer] Starten met voltooien registratie...");
    toonAlgemeenStatusBerichtProfiel("Bezig met verwerken van uw registratie...", "info", false);
    if (domProfielBeheerRefs.completeRegistrationButton) domProfielBeheerRefs.completeRegistrationButton.disabled = true;

    const roosterInstellingenData = {
        Title: huidigeGebruikerProfielBeheer.normalizedUsername,
        soortWeergave: domProfielBeheerRefs.instThemaSelect.value,
        EigenTeamWeergeven: domProfielBeheerRefs.instEigenTeamCheckbox.checked,
        WeekendenWeergeven: domProfielBeheerRefs.instWeekendenCheckbox.checked,
        ID: huidigeGebruikerProfielBeheer.gebruikersInstellingenSP?.ID
    };

    if (!valideerPersoonlijkeInfoForm()) {
        toonAlgemeenStatusBerichtProfiel("Controleer de persoonlijke informatie (Stap 1).", "error", false);
        if (domProfielBeheerRefs.completeRegistrationButton) domProfielBeheerRefs.completeRegistrationButton.disabled = false;
        huidigeStap = 1; updateStepUI(); return;
    }
    const geboortedatumValue = domProfielBeheerRefs.pgGeboortedatumInput.value;
    const persoonlijkeInfoData = {
        Title: `${domProfielBeheerRefs.pgAchternaamInput.value.trim()}, ${domProfielBeheerRefs.pgVoornaamInput.value.trim()}`,
        Naam: `${domProfielBeheerRefs.pgVoornaamInput.value.trim()} ${domProfielBeheerRefs.pgAchternaamInput.value.trim()}`,
        Username: huidigeGebruikerProfielBeheer.normalizedUsername,
        E_x002d_mail: huidigeGebruikerProfielBeheer.Email,
        Telefoonnummer: domProfielBeheerRefs.pgTelefoonInput.value.trim() || null,
        Geboortedatum: geboortedatumValue ? new Date(Date.UTC(
            parseInt(geboortedatumValue.split('-')[0]),
            parseInt(geboortedatumValue.split('-')[1]) - 1, 
            parseInt(geboortedatumValue.split('-')[2])
        )).toISOString() : null,
        Team: domProfielBeheerRefs.pgTeamSelect.value,
        Functie: domProfielBeheerRefs.pgFunctieSelect.value,
        Actief: true, Verbergen: false, Horen: true 
    };

    const werkroosterData = valideerEnVerzamelWerkroosterData();
    if (!werkroosterData) {
        toonAlgemeenStatusBerichtProfiel("Controleer de werkrooster informatie (Stap 3).", "error", false);
        if (domProfielBeheerRefs.completeRegistrationButton) domProfielBeheerRefs.completeRegistrationButton.disabled = false;
        huidigeStap = 3; updateStepUI(); return;
    }
    
    try {
        if (roosterInstellingenData.ID) {
            await updateProfielBeheerSPItem("gebruikersInstellingen", roosterInstellingenData.ID, roosterInstellingenData);
        } else { 
            const bestaandeInstellingenItems = await haalProfielBeheerLijstItems("gebruikersInstellingen", "$select=ID", `$filter=Title eq '${huidigeGebruikerProfielBeheer.normalizedUsername}'`, "", "", true);
            if (bestaandeInstellingenItems && bestaandeInstellingenItems.length > 0) {
                 await updateProfielBeheerSPItem("gebruikersInstellingen", bestaandeInstellingenItems[0].ID, roosterInstellingenData);
            } else {
                const nieuwInstItem = await createProfielBeheerSPItem("gebruikersInstellingen", roosterInstellingenData);
                 if(nieuwInstItem && nieuwInstItem.d) huidigeGebruikerProfielBeheer.gebruikersInstellingenSP = nieuwInstItem.d;
            }
        }
        toonAlgemeenStatusBerichtProfiel("Rooster instellingen verwerkt...", "info", true, 1500);

        const bestaandeMedewerkerItems = await haalProfielBeheerLijstItems("Medewerkers", "$select=ID", `$filter=Username eq '${huidigeGebruikerProfielBeheer.normalizedUsername}'`, "", "", true);
        if (bestaandeMedewerkerItems && bestaandeMedewerkerItems.length > 0) {
            await updateProfielBeheerSPItem("Medewerkers", bestaandeMedewerkerItems[0].ID, persoonlijkeInfoData);
        } else {
            await createProfielBeheerSPItem("Medewerkers", persoonlijkeInfoData);
        }
        toonAlgemeenStatusBerichtProfiel("Persoonlijke informatie opgeslagen...", "info", true, 1500);

        await createProfielBeheerSPItem("UrenPerWeek", werkroosterData);
        toonAlgemeenStatusBerichtProfiel("Werkrooster opgeslagen...", "info", true, 1500);

        toonAlgemeenStatusBerichtProfiel("Registratie succesvol voltooid! U wordt doorgestuurd.", "success", false);
        setTimeout(() => { window.location.href = "../verlofRooster.aspx"; }, 4000);

    } catch (error) {
        console.error("[ProfielBeheer] Fout tijdens voltooien registratie:", error);
        toonAlgemeenStatusBerichtProfiel(`Fout bij opslaan gegevens: ${error.message}. Probeer het opnieuw.`, "error", false);
    } finally {
        if (domProfielBeheerRefs.completeRegistrationButton) domProfielBeheerRefs.completeRegistrationButton.disabled = false;
    }
}

// --- Initialisatie Functies ---
async function laadInitiëlePaginaData() {
    await laadEnVulStap1PersoonlijkeInfo(); 
    await laadEnPasThemaToeProfiel();    
    vulStap2RoosterInstellingen();       
}

function koppelNavigatieEventListeners() {
    console.log("[ProfielBeheer] Koppelen navigatie event listeners.");
    if (domProfielBeheerRefs.nextStep1Button) {
        domProfielBeheerRefs.nextStep1Button.addEventListener('click', () => {
            if (valideerPersoonlijkeInfoForm()) { 
                gaNaarVolgendeStap();
            }
        });
    }
    if (domProfielBeheerRefs.prevStep2Button) {
        domProfielBeheerRefs.prevStep2Button.addEventListener('click', gaNaarVorigeStap);
    }
    if (domProfielBeheerRefs.nextStep2Button) {
        domProfielBeheerRefs.nextStep2Button.addEventListener('click', () => {
            gaNaarVolgendeStap();
            if (huidigeStap === 3) {
                laadEnVulStap3Werkrooster(); 
            }
        });
    }
    if (domProfielBeheerRefs.prevStep3Button) {
        domProfielBeheerRefs.prevStep3Button.addEventListener('click', gaNaarVorigeStap);
    }
    if (domProfielBeheerRefs.completeRegistrationButton) {
        domProfielBeheerRefs.completeRegistrationButton.addEventListener('click', handleRegistratieVoltooien);
    }
}

function updateJaarInFooterProfiel() {
    if (domProfielBeheerRefs.currentYearSpan) {
        domProfielBeheerRefs.currentYearSpan.textContent = new Date().getFullYear();
    }
}

async function initializeProfielBeheerPagina() {
    console.log("[ProfielBeheer] Start initialisatie profielbeheer pagina...");
    updateJaarInFooterProfiel();
    updateStepUI(); 

    const contextOK = await initializeProfielBeheerContext();
    if (!contextOK) {
        toonAlgemeenStatusBerichtProfiel("Initialisatie van gebruikerscontext is mislukt. Kan niet doorgaan.", "error", false);
        if(domProfielBeheerRefs.nextStep1Button) domProfielBeheerRefs.nextStep1Button.disabled = true;
        if(domProfielBeheerRefs.nextStep2Button) domProfielBeheerRefs.nextStep2Button.disabled = true;
        if(domProfielBeheerRefs.completeRegistrationButton) domProfielBeheerRefs.completeRegistrationButton.disabled = true;
        return;
    }
    
    await laadInitiëlePaginaData(); 
    koppelNavigatieEventListeners(); 
    console.log("[ProfielBeheer] Pagina initialisatie voltooid.");
}

function probeerInitialisatieProfielBeheer() {
    if (typeof getLijstConfig === 'function' && typeof sharepointLijstConfiguraties !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log("[ProfielBeheer] DOMContentLoaded event fired.");
                initializeProfielBeheerPagina();
            });
        } else { 
            console.log("[ProfielBeheer] DOM al geladen, directe initialisatie.");
            initializeProfielBeheerPagina();
        }
        return true;
    }
    return false; 
}

if (!probeerInitialisatieProfielBeheer()) {
    let intervalTellerProfiel = 0;
    const maxPogingenProfiel = 50; 
    const configIntervalProfiel = setInterval(() => {
        intervalTellerProfiel++;
        if (probeerInitialisatieProfielBeheer() || intervalTellerProfiel >= maxPogingenProfiel) {
            clearInterval(configIntervalProfiel);
            if (intervalTellerProfiel >= maxPogingenProfiel && typeof getLijstConfig !== 'function') {
                console.error("[ProfielBeheer] Kritische fout: configLijst.js of getLijstConfig functie niet geladen na maximale pogingen.");
                toonAlgemeenStatusBerichtProfiel("Kritische fout: Applicatieconfiguratie kon niet geladen worden. Probeer de pagina te vernieuwen.", "error", false);
            } else if (typeof getLijstConfig === 'function') {
                 console.log("[ProfielBeheer] configLijst.js en functies zijn nu beschikbaar na interval check.");
            }
        }
    }, 100);
}

console.log("Pages/JS/profielBeheer_logic.js geladen met bijgewerkte staplogica.");
