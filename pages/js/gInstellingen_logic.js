// Pages/JS/gInstellingen_logic.js

/**
 * Logica voor de gInstellingen.html pagina.
 * Beheert het laden en opslaan van gebruikersspecifieke instellingen en
 * het weergeven en bewerken van persoonlijke gegevens en werkroosterinformatie.
 */

const GINSTELLINGEN_SITE_URL = "/sites/MulderT/CustomPW/Verlof/"; // Pas aan indien nodig!

let spWebAbsoluteUrlInstellingen = ''; // Dynamisch gevuld
let huidigeGebruikerInstellingen = {
    loginNaam: null,
    normalizedUsername: null,
    Id: null, // SharePoint User ID
    Title: null, // SharePoint Display Name
    Email: null,
    medewerkerData: null, // Object met gegevens uit de 'Medewerkers' lijst
    gebruikersInstellingenSP: null, // Object met gegevens uit de 'gebruikersInstellingen' lijst (wordt direct bijgewerkt)
    urenPerWeekActueel: null, // Huidig geldige werkrooster item uit 'UrenPerWeek'
    alleUrenPerWeekHistorie: [] // Array met alle werkrooster items voor de gebruiker
};
let alleDagenIndicatorsData = []; 
let alleTeamsGInstellingen = [];
let alleFunctiesGInstellingen = [];


const domInstellingenRefs = {
    appBody: document.body,
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    // Tab "Mijn Profiel"
    pgNaamInput: document.getElementById('pg-naam'),
    pgUsernameInput: document.getElementById('pg-username'),
    pgEmailInput: document.getElementById('pg-email'),
    pgGeboortedatumInput: document.getElementById('pg-geboortedatum'),
    pgTeamInput: document.getElementById('pg-team'),
    pgFunctieInput: document.getElementById('pg-functie'),
    pgProfielFoto: document.getElementById('pg-profile-pic'),
    opslaanPersoonlijkeGegevensKnop: document.getElementById('opslaan-persoonlijke-gegevens-knop'),
    persoonlijkeGegevensStatusBericht: document.getElementById('persoonlijke-gegevens-status-bericht'),
    // Tab "Mijn Werktijden"
    werkdagenDisplayContainer: document.getElementById('werkdagen-display-container'),
    werkdagenTabelBody: document.getElementById('werkdagen-tabel-body'),
    roosterGeldigVanaf: document.getElementById('rooster-geldig-vanaf'),
    wijzigWerkroosterKnop: document.getElementById('wijzig-werkrooster-knop'),
    werkroosterEditFormContainer: document.getElementById('werkrooster-edit-form-container'),
    werkroosterWijzigingsdatumInput: document.getElementById('werkrooster-wijzigingsdatum'),
    globalStartTimeInput: document.getElementById('global-start-time-ginst'),
    globalEndTimeInput: document.getElementById('global-end-time-ginst'),
    applyGlobalTimeButton: document.getElementById('apply-global-time-button-ginst'),
    werkroosterInputRows: document.getElementById('werkrooster-input-rows'),
    opslaanWerkroosterKnop: document.getElementById('opslaan-werkrooster-knop'),
    annuleerWerkroosterKnop: document.getElementById('annuleer-werkrooster-knop'),
    werkroosterStatusBericht: document.getElementById('werkrooster-status-bericht'),
    // Tab "Instellingen"
    instellingenForm: document.getElementById('rooster-instellingen-form'),
    instThemaSelect: document.getElementById('inst-thema'),
    instEigenTeamCheckbox: document.getElementById('inst-eigen-team'),
    instWeekendenCheckbox: document.getElementById('inst-weekenden'),
    opslaanInstellingenButton: document.getElementById('opslaan-instellingen-button'),
    instellingenStatusBericht: document.getElementById('instellingen-status-bericht'),
    // Algemeen
    currentYearSpan: document.getElementById('current-year'),
    pageTitleHeader: document.querySelector('#page-banner h1'),
};

const DAGEN_VAN_DE_WEEK_GINST_EDIT = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
const DAGEN_VAN_DE_WEEK_DISPLAY = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];

// --- Hulpfuncties ---

// --- Status Bericht Functies ---
function toonSectieStatusBerichtGInst(statusElement, bericht, type = 'info', autoVerberg = true, sectieNaam = "Algemeen") {
    if (statusElement) {
        statusElement.innerHTML = bericht;
        statusElement.className = 'status-message mt-4 p-3 text-sm rounded-lg border';
        switch (type) {
            case 'success': statusElement.classList.add('bg-green-100', 'border-green-400', 'text-green-700', 'dark:bg-green-700/30', 'dark:text-green-200', 'dark:border-green-600'); break;
            case 'error': statusElement.classList.add('bg-red-100', 'border-red-400', 'text-red-700', 'dark:bg-red-700/30', 'dark:text-red-200', 'dark:border-red-600'); break;
            default: statusElement.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700', 'dark:bg-blue-700/30', 'dark:text-blue-200', 'dark:border-blue-600'); break;
        }
        statusElement.classList.remove('hidden');
        if (autoVerberg) {
            if (statusElement.timeoutId) clearTimeout(statusElement.timeoutId);
            statusElement.timeoutId = setTimeout(() => {
                if (statusElement) statusElement.classList.add('hidden');
            }, 7000);
        }
    } else {
        console.warn(`[gInstellingen] Status element voor sectie '${sectieNaam}' niet gevonden. Bericht: ${bericht}`);
        if (type === 'error') alert(`FOUT (${sectieNaam}): ${bericht}`);
        else alert(`INFO (${sectieNaam}): ${bericht}`);
    }
}
function toonPersoonlijkeGegevensStatus(bericht, type = 'info', autoVerberg = true) { toonSectieStatusBerichtGInst(domInstellingenRefs.persoonlijkeGegevensStatusBericht, bericht, type, autoVerberg, "Mijn Profiel"); }
function toonWerkroosterStatus(bericht, type = 'info', autoVerberg = true) { toonSectieStatusBerichtGInst(domInstellingenRefs.werkroosterStatusBericht, bericht, type, autoVerberg, "Mijn Werktijden"); }
function toonInstellingenTabStatus(bericht, type = 'info', autoVerberg = true) { toonSectieStatusBerichtGInst(domInstellingenRefs.instellingenStatusBericht, bericht, type, autoVerberg, "Instellingen"); }
function toonAlgemeenStatusBerichtGInst(bericht, type = 'info', autoVerberg = true) {
    let actieveStatusElement = domInstellingenRefs.instellingenStatusBericht; 
    if (domInstellingenRefs.tabContents) {
        domInstellingenRefs.tabContents.forEach(content => {
            if (content.classList.contains('active')) {
                const statusInTab = content.querySelector('.status-message');
                if (statusInTab) actieveStatusElement = statusInTab;
            }
        });
    }
    toonSectieStatusBerichtGInst(actieveStatusElement, bericht, type, autoVerberg, "Algemeen gInstellingen");
}

// --- SharePoint API Functies ---
async function initializeInstellingenContext() {
    const functieNaam = "initializeInstellingenContext_gInstellingen";
    console.log(`[gInstellingen] ${functieNaam} - Initialiseren SharePoint context...`);
    if (!GINSTELLINGEN_SITE_URL || typeof GINSTELLINGEN_SITE_URL !== 'string' || GINSTELLINGEN_SITE_URL.trim() === "") {
        const foutmelding = "Kritische fout: GINSTELLINGEN_SITE_URL is niet correct gedefinieerd.";
        console.error(`[gInstellingen] ${functieNaam} - ${foutmelding}`);
        toonAlgemeenStatusBerichtGInst(foutmelding, "error", false);
        Object.values(domInstellingenRefs).forEach(el => {
            if (el && el.tagName && (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT')) {
                el.disabled = true;
            }
        });
        return false;
    }
    const sitePath = GINSTELLINGEN_SITE_URL.replace(/\/$/, "");
    const basisUrl = window.location.origin;
    try {
        const webApiUrl = `${basisUrl}${sitePath}/_api/web?$select=Url`;
        const webResponse = await fetch(webApiUrl, { headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!webResponse.ok) throw new Error(`Kan web URL niet ophalen (status: ${webResponse.status})`);
        const webData = await webResponse.json();
        spWebAbsoluteUrlInstellingen = webData.d.Url;
        if (!spWebAbsoluteUrlInstellingen.endsWith('/')) spWebAbsoluteUrlInstellingen += '/';
        
        const userApiUrl = `${spWebAbsoluteUrlInstellingen}_api/web/currentuser?$select=LoginName,Title,Id,Email`;
        const userResponse = await fetch(userApiUrl, { headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!userResponse.ok) throw new Error(`Kan gebruiker info niet ophalen (status: ${userResponse.status})`);
        const userData = await userResponse.json();
        huidigeGebruikerInstellingen.loginNaam = userData.d.LoginName;
        huidigeGebruikerInstellingen.normalizedUsername = window.trimLoginNaamPrefix(userData.d.LoginName);
        huidigeGebruikerInstellingen.Id = userData.d.Id;
        huidigeGebruikerInstellingen.Title = userData.d.Title;
        huidigeGebruikerInstellingen.Email = userData.d.Email;
        console.log(`[gInstellingen] ${functieNaam} - Context succesvol.`);
        return true;
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        toonAlgemeenStatusBerichtGInst(`Fout bij laden gebruikersinformatie: ${error.message}.`, "error", false);
        return false;
    }
}

async function haalInstellingenLijstItems(lijstIdentifier, selectQuery = "", filterQuery = "", expandQuery = "", orderbyQuery = "", stil = false) {
    const functieNaam = "haalInstellingenLijstItems_gInstellingen";
    if (!spWebAbsoluteUrlInstellingen) {
        console.error(`[gInstellingen] ${functieNaam}: spWebAbsoluteUrlInstellingen is niet beschikbaar.`);
        if (!stil) toonAlgemeenStatusBerichtGInst(`Fout: Serververbinding niet beschikbaar voor lijst '${lijstIdentifier}'.`, "error", false);
        return [];
    }
    const lijstConfig = typeof getLijstConfig === 'function' ? getLijstConfig(lijstIdentifier) : null;
    if (!lijstConfig) {
        console.error(`[gInstellingen] ${functieNaam}: Kon lijst configuratie niet vinden voor identifier: ${lijstIdentifier}.`);
         if (!stil) toonAlgemeenStatusBerichtGInst(`Configuratiefout voor lijst '${lijstIdentifier}'.`, "error", false);
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
    const apiUrl = `${spWebAbsoluteUrlInstellingen.replace(/\/$/, "")}${apiUrlPath}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
    if (!stil) console.log(`[gInstellingen] Ophalen items voor lijst '${lijstWeergaveNaam}': ${decodeURIComponent(apiUrl)}`);

    try {
        if (!stil) toonAlgemeenStatusBerichtGInst(`Laden data voor '${lijstWeergaveNaam}'...`, "info", true, 10000);
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!response.ok) {
            let errorDetail = `Status: ${response.status} ${response.statusText}. URL: ${apiUrl}`;
            try { const errorData = await response.json(); errorDetail = errorData.error?.message?.value || errorDetail; } catch (e) { /* ignore */ }
            console.error(`[gInstellingen] Fout bij ophalen lijst '${lijstWeergaveNaam}': ${errorDetail}`);
            if (!stil) toonAlgemeenStatusBerichtGInst(`Fout bij laden van lijst '${lijstWeergaveNaam}': ${response.statusText}`, "error", false);
            return [];
        }
        const data = await response.json();
        const itemCount = data.d.results ? data.d.results.length : 0;
        if (!stil && itemCount > 0) toonAlgemeenStatusBerichtGInst(`${itemCount} items geladen voor '${lijstWeergaveNaam}'.`, "success", true);
        else if (!stil && itemCount === 0) toonAlgemeenStatusBerichtGInst(`Geen items gevonden voor '${lijstWeergaveNaam}'.`, "info", true);
        return data.d.results || [];
    } catch (error) {
        console.error(`[gInstellingen] Uitzondering bij ophalen lijst '${lijstWeergaveNaam}':`, error);
        if (!stil) toonAlgemeenStatusBerichtGInst(`Netwerkfout bij laden van lijst '${lijstWeergaveNaam}': ${error.message}.`, "error", false);
        return [];
    }
}

async function getInstellingenRequestDigest() {
    const functieNaam = "getInstellingenRequestDigest_gInstellingen";
    if (!spWebAbsoluteUrlInstellingen) throw new Error("Web absolute URL niet beschikbaar voor Request Digest.");
    const apiUrl = `${spWebAbsoluteUrlInstellingen.replace(/\/$/, "")}/_api/contextinfo`;
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!response.ok) throw new Error(`Kon Request Digest niet ophalen (${response.status})`);
        const data = await response.json();
        return data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        throw error;
    }
}

async function createInstellingenItem(lijstIdentifier, itemData) {
    const functieNaam = "createInstellingenItem_gInstellingen";
    const lijstConfig = typeof getLijstConfig === 'function' ? getLijstConfig(lijstIdentifier) : null;
    if (!lijstConfig) throw new Error(`Configuratie voor lijst '${lijstIdentifier}' niet gevonden.`);
    
    const lijstIdOfTitel = lijstConfig.lijstId || lijstConfig.lijstTitel;
    let apiUrlPath;
    if (/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(lijstIdOfTitel)) {
        apiUrlPath = `/_api/web/lists(guid'${lijstIdOfTitel}')/items`;
    } else {
        apiUrlPath = `/_api/web/lists/getByTitle('${encodeURIComponent(lijstIdOfTitel)}')/items`;
    }
    const listNameForType = lijstConfig.lijstTitel.replace(/\s+/g, '_');
    itemData.__metadata = { "type": `SP.Data.${listNameForType.charAt(0).toUpperCase() + listNameForType.slice(1)}ListItem` };
    
    try {
        const requestDigest = await getInstellingenRequestDigest();
        const apiUrl = `${spWebAbsoluteUrlInstellingen.replace(/\/$/, "")}${apiUrlPath}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Accept': 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': requestDigest },
            body: JSON.stringify(itemData)
        });
        if (!response.ok || response.status !== 201) { 
             const errorText = await response.text();
            throw new Error(`Fout bij aanmaken SP item in '${lijstConfig.lijstTitel}': ${response.statusText}. Details: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        throw error;
    }
}

async function updateInstellingenItem(lijstIdentifier, itemId, itemData) {
    const functieNaam = "updateInstellingenItem_gInstellingen";
    const lijstConfig = typeof getLijstConfig === 'function' ? getLijstConfig(lijstIdentifier) : null;
    if (!lijstConfig) throw new Error(`Configuratie voor lijst '${lijstIdentifier}' niet gevonden.`);
    
    const lijstIdOfTitel = lijstConfig.lijstId || lijstConfig.lijstTitel;
    let apiUrlPath;
     if (/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(lijstIdOfTitel)) {
        apiUrlPath = `/_api/web/lists(guid'${lijstIdOfTitel}')/items(${itemId})`;
    } else {
        apiUrlPath = `/_api/web/lists/getByTitle('${encodeURIComponent(lijstIdOfTitel)}')/items(${itemId})`;
    }
    const listNameForType = lijstConfig.lijstTitel.replace(/\s+/g, '_');
    itemData.__metadata = { "type": `SP.Data.${listNameForType.charAt(0).toUpperCase() + listNameForType.slice(1)}ListItem` };
    
    try {
        const requestDigest = await getInstellingenRequestDigest();
        const apiUrl = `${spWebAbsoluteUrlInstellingen.replace(/\/$/, "")}${apiUrlPath}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Accept': 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': requestDigest, 'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' },
            body: JSON.stringify(itemData)
        });
        if (response.status !== 204) { 
            const errorText = await response.text();
            throw new Error(`Fout bij bijwerken SP item in '${lijstConfig.lijstTitel}': ${response.statusText}. Details: ${errorText}`);
        }
        return true;
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        throw error;
    }
}

// --- Thema Functies (Tab "Instellingen") ---
function pasThemaKlassenToe(thema) {
    const isLichtThema = thema === 'light';
    if (domInstellingenRefs.appBody) {
        domInstellingenRefs.appBody.classList.toggle('light-theme', isLichtThema);
        domInstellingenRefs.appBody.classList.toggle('dark-theme', !isLichtThema);
        console.log(`[gInstellingen] Thema klassen op body bijgewerkt naar: ${thema}`);
    }
}

async function slaRoosterInstellingDirectOp(instellingNaam, waarde) {
    const functieNaam = "slaRoosterInstellingDirectOp_gInstellingen";
    if (!huidigeGebruikerInstellingen.normalizedUsername) {
        toonInstellingenTabStatus("Kan instelling niet opslaan, gebruikersinfo ontbreekt.", "error", false);
        console.error(`[gInstellingen] ${functieNaam} - NormalizedUsername ontbreekt`);
        return;
    }
    toonInstellingenTabStatus("Bezig met opslaan van voorkeur...", "info", true);

    let dataVoorOpslag = { Title: huidigeGebruikerInstellingen.normalizedUsername };
    dataVoorOpslag[instellingNaam] = waarde;

    if (!huidigeGebruikerInstellingen.gebruikersInstellingenSP) {
        huidigeGebruikerInstellingen.gebruikersInstellingenSP = { Title: huidigeGebruikerInstellingen.normalizedUsername };
    }
    huidigeGebruikerInstellingen.gebruikersInstellingenSP[instellingNaam] = waarde;

    try {
        const bestaandeItems = await haalInstellingenLijstItems("gebruikersInstellingen", "$select=ID", `$filter=Title eq '${huidigeGebruikerInstellingen.normalizedUsername}'`, "", "", true);
        if (bestaandeItems && bestaandeItems.length > 0) {
            const itemId = bestaandeItems[0].ID;
            huidigeGebruikerInstellingen.gebruikersInstellingenSP.ID = itemId;
            await updateInstellingenItem("gebruikersInstellingen", itemId, dataVoorOpslag);
        } else {
            const nieuwItem = await createInstellingenItem("gebruikersInstellingen", dataVoorOpslag);
            if (nieuwItem && nieuwItem.d) huidigeGebruikerInstellingen.gebruikersInstellingenSP.ID = nieuwItem.d.ID;
        }
        toonInstellingenTabStatus("Voorkeur opgeslagen!", "success", true);
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        toonInstellingenTabStatus(`Fout bij opslaan voorkeur: ${error.message}`, "error", false);
    }
}

async function laadEnPasThemaToe() {
    const functieNaam = "laadEnPasThemaToe_gInstellingen";
    console.log(`[gInstellingen] ${functieNaam} - Start.`);
    let actiefThema = localStorage.getItem('gInstellingenThema') || 'light';
    pasThemaKlassenToe(actiefThema);
    if (domInstellingenRefs.instThemaSelect) domInstellingenRefs.instThemaSelect.value = actiefThema;

    if (!huidigeGebruikerInstellingen.normalizedUsername) {
        console.warn(`[gInstellingen] ${functieNaam} - Kan instellingen niet ophalen van SP: normalizedUsername ontbreekt.`);
        vulRoosterInstellingenTabMetDefaults(actiefThema);
        return;
    }
    try {
        const instellingenItems = await haalInstellingenLijstItems("gebruikersInstellingen", "$select=ID,Title,soortWeergave,EigenTeamWeergeven,WeekendenWeergeven", `$filter=Title eq '${huidigeGebruikerInstellingen.normalizedUsername}'`, "", "", true);
        if (instellingenItems && instellingenItems.length > 0) {
            huidigeGebruikerInstellingen.gebruikersInstellingenSP = instellingenItems[0];
            const inst = huidigeGebruikerInstellingen.gebruikersInstellingenSP;
            actiefThema = inst.soortWeergave || actiefThema;
            pasThemaKlassenToe(actiefThema);
            localStorage.setItem('gInstellingenThema', actiefThema);
            if (domInstellingenRefs.instThemaSelect) domInstellingenRefs.instThemaSelect.value = actiefThema;
            if (domInstellingenRefs.instEigenTeamCheckbox) domInstellingenRefs.instEigenTeamCheckbox.checked = inst.EigenTeamWeergeven || false;
            if (domInstellingenRefs.instWeekendenCheckbox) domInstellingenRefs.instWeekendenCheckbox.checked = (inst.WeekendenWeergeven === null || inst.WeekendenWeergeven === undefined) ? true : inst.WeekendenWeergeven;
            console.log(`[gInstellingen] ${functieNaam} - Instellingen geladen van SP.`);
        } else {
            console.log(`[gInstellingen] ${functieNaam} - Geen bestaande instellingen in SP.`);
            vulRoosterInstellingenTabMetDefaults(actiefThema);
            huidigeGebruikerInstellingen.gebruikersInstellingenSP = {
                Title: huidigeGebruikerInstellingen.normalizedUsername,
                soortWeergave: actiefThema,
                EigenTeamWeergeven: domInstellingenRefs.instEigenTeamCheckbox.checked,
                WeekendenWeergeven: domInstellingenRefs.instWeekendenCheckbox.checked
            };
        }
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        vulRoosterInstellingenTabMetDefaults(actiefThema);
    }
}

function vulRoosterInstellingenTabMetDefaults(huidigThema = 'light') {
    if (domInstellingenRefs.instThemaSelect) domInstellingenRefs.instThemaSelect.value = huidigThema;
    if (domInstellingenRefs.instEigenTeamCheckbox) domInstellingenRefs.instEigenTeamCheckbox.checked = false;
    if (domInstellingenRefs.instWeekendenCheckbox) domInstellingenRefs.instWeekendenCheckbox.checked = true;
    pasThemaKlassenToe(huidigThema);
}

// --- Data Laden & UI Vullen (voor de Tabs) ---
function vulRoosterInstellingenTab() {
    console.log("[gInstellingen] Vullen UI voor Rooster Instellingen Tab en koppelen listeners.");
    if (domInstellingenRefs.instThemaSelect) {
        domInstellingenRefs.instThemaSelect.addEventListener('change', (event) => {
            const nieuwThema = event.target.value;
            pasThemaKlassenToe(nieuwThema);
            localStorage.setItem('gInstellingenThema', nieuwThema);
            slaRoosterInstellingDirectOp('soortWeergave', nieuwThema);
        });
    }
    if (domInstellingenRefs.instEigenTeamCheckbox) {
        domInstellingenRefs.instEigenTeamCheckbox.addEventListener('change', (event) => {
            slaRoosterInstellingDirectOp('EigenTeamWeergeven', event.target.checked);
        });
    }
    if (domInstellingenRefs.instWeekendenCheckbox) {
        domInstellingenRefs.instWeekendenCheckbox.addEventListener('change', (event) => {
            slaRoosterInstellingDirectOp('WeekendenWeergeven', event.target.checked);
            vulWerkdagenDisplayEnEditForm(); 
        });
    }
    if (domInstellingenRefs.opslaanInstellingenButton) {
        domInstellingenRefs.opslaanInstellingenButton.classList.add('hidden');
    }
}

async function laadTeamEnFunctieOpties() {
    const functieNaam = "laadTeamEnFunctieOpties_gInstellingen";
    console.log(`[gInstellingen] ${functieNaam} - Start.`);
    try {
        const [teamsData, functiesData] = await Promise.all([
            haalInstellingenLijstItems("Teams", "$select=ID,Title,Naam,Actief", "$filter=Actief eq 1", "", "$orderby=Naam asc", true),
            haalInstellingenLijstItems("keuzelijstFuncties", "$select=ID,Title", "", "", "$orderby=Title asc", true)
        ]);
        alleTeamsGInstellingen = teamsData || [];
        alleFunctiesGInstellingen = functiesData || [];

        if (domInstellingenRefs.pgTeamInput && domInstellingenRefs.pgTeamInput.tagName === 'SELECT') {
            domInstellingenRefs.pgTeamInput.innerHTML = '<option value="">Selecteer een team...</option>';
            alleTeamsGInstellingen.forEach(team => {
                const option = document.createElement('option');
                option.value = team.Naam || team.Title;
                option.textContent = team.Naam || team.Title;
                domInstellingenRefs.pgTeamInput.appendChild(option);
            });
        }
        if (domInstellingenRefs.pgFunctieInput && domInstellingenRefs.pgFunctieInput.tagName === 'SELECT') {
            domInstellingenRefs.pgFunctieInput.innerHTML = '<option value="">Selecteer een functie...</option>';
            alleFunctiesGInstellingen.forEach(functie => {
                const option = document.createElement('option');
                option.value = functie.Title;
                option.textContent = functie.Title;
                domInstellingenRefs.pgFunctieInput.appendChild(option);
            });
        }
        if (huidigeGebruikerInstellingen.medewerkerData) {
            if (domInstellingenRefs.pgTeamInput && domInstellingenRefs.pgTeamInput.tagName === 'SELECT' && huidigeGebruikerInstellingen.medewerkerData.Team) {
                domInstellingenRefs.pgTeamInput.value = huidigeGebruikerInstellingen.medewerkerData.Team;
            }
            if (domInstellingenRefs.pgFunctieInput && domInstellingenRefs.pgFunctieInput.tagName === 'SELECT' && huidigeGebruikerInstellingen.medewerkerData.Functie) {
                domInstellingenRefs.pgFunctieInput.value = huidigeGebruikerInstellingen.medewerkerData.Functie;
            }
        }
        console.log(`[gInstellingen] ${functieNaam} - Teams en functies geladen.`);
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        toonPersoonlijkeGegevensStatus("Fout bij laden team/functie opties.", "error", false);
    }
}

function stelProfielfotoIn() {
    const functieNaam = "stelProfielfotoIn_gInstellingen";
    const profielFotoElement = domInstellingenRefs.pgProfielFoto;
    if (!profielFotoElement) {
        console.warn(`[gInstellingen] ${functieNaam} - Profielfoto element (pg-profile-pic) niet gevonden.`);
        return;
    }
    const loginNaamVoorFoto = huidigeGebruikerInstellingen.loginNaam;

    if (typeof window.getProfilePhotoUrl === 'function' && loginNaamVoorFoto) {
        const photoUrl = window.getProfilePhotoUrl({ Username: loginNaamVoorFoto }, 'M');
        profielFotoElement.src = photoUrl;
        console.log(`[gInstellingen] ${functieNaam} - Profielfoto URL via getProfilePhotoUrl: ${profielFotoElement.src}`);
    } else {
        genererInitialenProfielfoto();
        if (typeof window.getProfilePhotoUrl !== 'function') console.warn(`[gInstellingen] ${functieNaam} - getProfilePhotoUrl functie niet beschikbaar. Initialen worden gebruikt.`);
        else if (!loginNaamVoorFoto) console.warn(`[gInstellingen] ${functieNaam} - LoginNaam ontbreekt voor getProfilePhotoUrl. Initialen worden gebruikt.`);
    }
    profielFotoElement.onerror = function() {
        this.src = '../Icoon/default-profile.svg';
        this.alt = 'Standaard profielicoon';
        console.warn(`[gInstellingen] ${functieNaam} - Fout bij laden profielfoto, standaardicoon wordt gebruikt.`);
    };
}

function genererInitialenProfielfoto() {
    const profielFotoElement = domInstellingenRefs.pgProfielFoto;
    if (!profielFotoElement) return;
    const naamVoorInitialen = huidigeGebruikerInstellingen.medewerkerData?.Naam || huidigeGebruikerInstellingen.Title || huidigeGebruikerInstellingen.normalizedUsername || "GE";
    let initialen = "";
    const parts = naamVoorInitialen.split(/[\s,]+/);
    if (parts.length >= 2) initialen = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    else if (parts.length === 1 && parts[0].length >= 2) initialen = parts[0].substring(0,2).toUpperCase();
    else if (parts.length === 1 && parts[0].length === 1) initialen = parts[0].toUpperCase();
    else initialen = "GE";

    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 100;
    const context = canvas.getContext('2d');
    const isDarkTheme = domInstellingenRefs.appBody.classList.contains('dark-theme');
    context.fillStyle = isDarkTheme ? '#4b5563' : '#e5e7eb';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = isDarkTheme ? '#f3f4f6' : '#1f2937';
    context.font = `bold ${initialen.length === 1 ? 50 : 40}px Inter, sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(initialen, canvas.width / 2, canvas.height / 2 + 2);
    profielFotoElement.src = canvas.toDataURL();
    profielFotoElement.alt = `Initialen: ${initialen}`;
}

async function laadGebruikersGegevens() {
    const functieNaam = "laadGebruikersGegevens_gInstellingen";
    if (!huidigeGebruikerInstellingen.normalizedUsername) {
        toonAlgemeenStatusBerichtGInst("Gebruikersinformatie is onvolledig. Kan gegevens niet laden.", "error", false);
        console.error(`[gInstellingen] ${functieNaam} - NormalizedUsername ontbreekt`);
        return;
    }
    toonAlgemeenStatusBerichtGInst("Bezig met laden van uw gegevens...", "info", false);
    try {
        const [medArray, historieArray, indicators] = await Promise.all([
            haalInstellingenLijstItems("Medewerkers", "$select=ID,Title,Naam,Username,E_x002d_mail,Team,Functie,Geboortedatum", `$filter=Username eq '${huidigeGebruikerInstellingen.normalizedUsername}'`, "", "", true),
            haalInstellingenLijstItems("UrenPerWeek", `$select=ID,Ingangsdatum,VeranderingsDatum,${DAGEN_VAN_DE_WEEK_DISPLAY.map(d => `${d}Start,${d}Eind,${d}Soort`).join(',')}`, `$filter=MedewerkerID eq '${huidigeGebruikerInstellingen.normalizedUsername}'`, "", "$orderby=Ingangsdatum desc", true),
            haalInstellingenLijstItems("DagenIndicators", "$select=ID,Title,Beschrijving", "", "", "$orderby=Title asc", true)
        ]);

        if (medArray && medArray.length > 0) huidigeGebruikerInstellingen.medewerkerData = medArray[0];
        else {
            huidigeGebruikerInstellingen.medewerkerData = {
                Naam: huidigeGebruikerInstellingen.Title, Username: huidigeGebruikerInstellingen.normalizedUsername,
                E_x002d_mail: huidigeGebruikerInstellingen.Email, Team: "", Functie: "", Geboortedatum: null
            };
            toonPersoonlijkeGegevensStatus("U bent nog niet als medewerker geregistreerd in het systeem. Vul uw gegevens aan en sla op.", "info", false);
        }

        huidigeGebruikerInstellingen.alleUrenPerWeekHistorie = historieArray || [];
        huidigeGebruikerInstellingen.urenPerWeekActueel = (historieArray || []).find(item => !item.VeranderingsDatum || new Date(item.VeranderingsDatum) > new Date()) || ((historieArray && historieArray.length > 0) ? historieArray[0] : null);
        
        alleDagenIndicatorsData = indicators || [];

        await laadTeamEnFunctieOpties();
        vulPersoonlijkeGegevensTab(); 
        vulRoosterInstellingenTab(); 
        vulWerkdagenDisplayEnEditForm(); 

        toonAlgemeenStatusBerichtGInst("Gegevens succesvol geladen.", "success", true);
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        toonAlgemeenStatusBerichtGInst(`Fout bij het laden van uw gegevens: ${error.message}`, "error", false);
    }
}

function vulPersoonlijkeGegevensTab() {
    console.log("[gInstellingen] Start vulPersoonlijkeGegevensTab.");
    if (huidigeGebruikerInstellingen.medewerkerData) {
        if (domInstellingenRefs.pgNaamInput) domInstellingenRefs.pgNaamInput.value = huidigeGebruikerInstellingen.medewerkerData.Naam || huidigeGebruikerInstellingen.Title || '';
        if (domInstellingenRefs.pgUsernameInput) domInstellingenRefs.pgUsernameInput.value = huidigeGebruikerInstellingen.medewerkerData.Username || huidigeGebruikerInstellingen.loginNaam || '';
        if (domInstellingenRefs.pgEmailInput) domInstellingenRefs.pgEmailInput.value = huidigeGebruikerInstellingen.medewerkerData.E_x002d_mail || huidigeGebruikerInstellingen.Email || '';
        if (domInstellingenRefs.pgGeboortedatumInput && huidigeGebruikerInstellingen.medewerkerData.Geboortedatum) {
            try {
                domInstellingenRefs.pgGeboortedatumInput.value = new Date(huidigeGebruikerInstellingen.medewerkerData.Geboortedatum).toISOString().split('T')[0];
            } catch (e) {
                console.warn("[gInstellingen] Kon Geboortedatum niet parsen:", huidigeGebruikerInstellingen.medewerkerData.Geboortedatum);
                domInstellingenRefs.pgGeboortedatumInput.value = '';
            }
        } else if (domInstellingenRefs.pgGeboortedatumInput) {
             domInstellingenRefs.pgGeboortedatumInput.value = '';
        }
        if (domInstellingenRefs.pgTeamInput && alleTeamsGInstellingen.length > 0) domInstellingenRefs.pgTeamInput.value = huidigeGebruikerInstellingen.medewerkerData.Team || "";
        if (domInstellingenRefs.pgFunctieInput && alleFunctiesGInstellingen.length > 0) domInstellingenRefs.pgFunctieInput.value = huidigeGebruikerInstellingen.medewerkerData.Functie || "";
        stelProfielfotoIn();
    } else {
        if (domInstellingenRefs.pgNaamInput) domInstellingenRefs.pgNaamInput.value = huidigeGebruikerInstellingen.Title || '';
        if (domInstellingenRefs.pgUsernameInput) domInstellingenRefs.pgUsernameInput.value = huidigeGebruikerInstellingen.normalizedUsername || huidigeGebruikerInstellingen.loginNaam || '';
        if (domInstellingenRefs.pgEmailInput) domInstellingenRefs.pgEmailInput.value = huidigeGebruikerInstellingen.Email || '';
        if (domInstellingenRefs.pgGeboortedatumInput) domInstellingenRefs.pgGeboortedatumInput.value = '';
        stelProfielfotoIn();
    }
}

function vulWerkdagenDisplayEnEditForm() {
    const functieNaam = "vulWerkdagenDisplayEnEditForm_gInstellingen";
    console.log(`[gInstellingen] ${functieNaam} - Start.`);
    const tabelBody = domInstellingenRefs.werkdagenTabelBody;
    if (!tabelBody) { console.error(`[gInstellingen] ${functieNaam} - Werkdagen tabel body niet gevonden.`); return; }
    tabelBody.innerHTML = '';

    const rooster = huidigeGebruikerInstellingen.urenPerWeekActueel;
    const geldigVanafElement = domInstellingenRefs.roosterGeldigVanaf;
    const toonWeekenden = huidigeGebruikerInstellingen.gebruikersInstellingenSP?.WeekendenWeergeven !== false;

    if (rooster) {
        console.log(`[gInstellingen] ${functieNaam} - Actueel werkrooster gevonden:`, rooster);
        DAGEN_VAN_DE_WEEK_DISPLAY.forEach(dag => {
            if (!toonWeekenden && (dag === "Zaterdag" || dag === "Zondag")) {
                return;
            }
            const startTijd = rooster[`${dag}Start`];
            const eindTijd = rooster[`${dag}Eind`];
            const soortDag = rooster[`${dag}Soort`];

            const tr = document.createElement('tr');
            const tdDag = document.createElement('td'); tdDag.textContent = dag; tr.appendChild(tdDag);
            const tdTijden = document.createElement('td');
            if (startTijd && eindTijd) tdTijden.textContent = `${startTijd} - ${eindTijd}`;
            else { tdTijden.textContent = 'Niet ingeroosterd'; tdTijden.classList.add('italic', 'text-gray-500', 'dark:text-gray-400'); }
            tr.appendChild(tdTijden);
            const tdSoort = document.createElement('td');
            if (soortDag && soortDag !== 'Werken' && soortDag !== 'Niet Werkzaam') tdSoort.textContent = soortDag;
            else if (startTijd && eindTijd) tdSoort.textContent = 'Werken';
            else tdSoort.textContent = '-';
            tr.appendChild(tdSoort);
            tabelBody.appendChild(tr);
        });
        if (rooster.Ingangsdatum && geldigVanafElement) {
            geldigVanafElement.textContent = `Huidig rooster geldig vanaf: ${new Date(rooster.Ingangsdatum).toLocaleDateString('nl-NL', { timeZone: 'UTC' })}`;
            geldigVanafElement.classList.remove('hidden');
        } else if (geldigVanafElement) { geldigVanafElement.classList.add('hidden'); }
    } else {
        console.log(`[gInstellingen] ${functieNaam} - Geen actueel werkrooster gevonden.`);
        const tr = document.createElement('tr');
        const td = document.createElement('td'); td.colSpan = 3;
        td.className = "py-6 text-center text-gray-500 dark:text-gray-400 italic";
        td.textContent = "Geen standaard werkrooster gevonden.";
        tr.appendChild(td); tabelBody.appendChild(tr);
        if (geldigVanafElement) geldigVanafElement.classList.add('hidden');
    }
    genereerWerkroosterEditFormGInstellingen();
}

function genereerWerkroosterEditFormGInstellingen() {
    const container = domInstellingenRefs.werkroosterInputRows;
    if (!container) { console.error("[gInstellingen] Container werkroosterInputRows niet gevonden."); return; }
    container.innerHTML = ''; // Leegmaken voor herbouw

    // De header is al in de HTML, dus we voegen die hier niet opnieuw toe.

    const rooster = huidigeGebruikerInstellingen.urenPerWeekActueel;

    DAGEN_VAN_DE_WEEK_GINST_EDIT.forEach(dag => {
        const rijDiv = document.createElement('div');
        rijDiv.className = 'werkrooster-edit-row grid grid-cols-1 md:grid-cols-5 gap-x-3 gap-y-2 items-center p-2.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 mb-1';

        const dagLabelSpan = document.createElement('span');
        dagLabelSpan.className = 'dag-label text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-1';
        dagLabelSpan.textContent = dag;
        rijDiv.appendChild(dagLabelSpan);

        const startVal = rooster && rooster[`${dag}Start`] ? rooster[`${dag}Start`] : '';
        const eindVal = rooster && rooster[`${dag}Eind`] ? rooster[`${dag}Eind`] : '';
        const soortDagSP = rooster ? (rooster[`${dag}Soort`] || 'Niet Werkzaam') : 'Niet Werkzaam';

        const startInput = document.createElement('input');
        startInput.type = 'time'; startInput.id = `ginst-${dag.toLowerCase()}-start`;
        startInput.name = `${dag.toLowerCase()}_start`;
        startInput.className = 'form-input w-full text-xs md:col-span-1';
        startInput.value = startVal;
        rijDiv.appendChild(startInput);

        const eindInput = document.createElement('input');
        eindInput.type = 'time'; eindInput.id = `ginst-${dag.toLowerCase()}-eind`;
        eindInput.name = `${dag.toLowerCase()}_tot`;
        eindInput.className = 'form-input w-full text-xs md:col-span-1';
        eindInput.value = eindVal;
        rijDiv.appendChild(eindInput);
        
        const vrijeDagContainer = document.createElement('div');
        vrijeDagContainer.className = "flex justify-center items-center md:col-span-1";
        const vrijeDagCheckbox = document.createElement('input');
        vrijeDagCheckbox.type = 'checkbox'; vrijeDagCheckbox.id = `ginst-${dag.toLowerCase()}-vrij`;
        vrijeDagCheckbox.className = 'form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-800';
        vrijeDagCheckbox.checked = (soortDagSP === "VVD");
        vrijeDagContainer.appendChild(vrijeDagCheckbox);
        rijDiv.appendChild(vrijeDagContainer);
        
        const berekendeSoortSpan = document.createElement('span');
        berekendeSoortSpan.id = `ginst-${dag.toLowerCase()}-berekende-soort`;
        berekendeSoortSpan.className = 'text-xs text-center text-gray-500 dark:text-gray-400 md:col-span-1 italic';
        rijDiv.appendChild(berekendeSoortSpan);

        const updateDagLogica = () => {
            const isVrij = vrijeDagCheckbox.checked;
            let soortDagBerekend = "Niet Werkzaam";
            startInput.disabled = isVrij; eindInput.disabled = isVrij;

            if (isVrij) {
                startInput.value = ''; eindInput.value = '';
                soortDagBerekend = "VVD";
            } else {
                const startTijd = startInput.value; const eindTijd = eindInput.value;
                if (startTijd && eindTijd) {
                    const startMoment = new Date(`1970-01-01T${startTijd}:00Z`);
                    const eindMoment = new Date(`1970-01-01T${eindTijd}:00Z`);
                    const drempel1300 = new Date(`1970-01-01T13:00:00Z`);

                    if (eindMoment.getTime() > startMoment.getTime()) {
                        const duurMs = eindMoment.getTime() - startMoment.getTime();
                        const duurUren = duurMs / (1000 * 60 * 60);

                        if (duurUren >= 7) soortDagBerekend = "Werken";
                        else if (eindMoment.getUTCHours() < 13 || (eindMoment.getUTCHours() === 13 && eindMoment.getUTCMinutes() === 0)) soortDagBerekend = "VVM";
                        else if (startMoment.getUTCHours() >= 13) soortDagBerekend = "VVO";
                        else soortDagBerekend = "Werken"; 
                        
                    } else if (eindMoment.getTime() < startMoment.getTime()) soortDagBerekend = "Tijd Fout";
                    else soortDagBerekend = "Minimaal";
                } else if (startTijd || eindTijd) soortDagBerekend = "Onvolledig";
            }
            berekendeSoortSpan.textContent = soortDagBerekend;
            berekendeSoortSpan.classList.toggle("text-red-500", ["Tijd Fout", "Onvolledig", "Minimaal"].includes(soortDagBerekend));
            berekendeSoortSpan.classList.toggle("dark:text-red-400", ["Tijd Fout", "Onvolledig", "Minimaal"].includes(soortDagBerekend));
            berekendeSoortSpan.classList.toggle("font-semibold", ["Tijd Fout", "Onvolledig", "Minimaal"].includes(soortDagBerekend));
            berekendeSoortSpan.classList.toggle("italic", !["Tijd Fout", "Onvolledig", "Minimaal"].includes(soortDagBerekend));
        };
        vrijeDagCheckbox.addEventListener('change', updateDagLogica);
        startInput.addEventListener('change', updateDagLogica);
        eindInput.addEventListener('change', updateDagLogica);
        updateDagLogica();
        container.appendChild(rijDiv);
    });
}

function valideerEnVerzamelWerkroosterDataGInst() {
    toonWerkroosterStatus("", "info", true);
    const wijzigingsdatumNieuwString = domInstellingenRefs.werkroosterWijzigingsdatumInput ? domInstellingenRefs.werkroosterWijzigingsdatumInput.value : null;
    if (!wijzigingsdatumNieuwString) {
        toonWerkroosterStatus("Wijzigingsdatum voor het nieuwe rooster is verplicht.", "error", false);
        return null;
    }
    const [year, month, day] = wijzigingsdatumNieuwString.split('-').map(Number);
    const nieuweWijzigingsdatumDateUTC = new Date(Date.UTC(year, month - 1, day));
    const vandaagUTC = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    if (nieuweWijzigingsdatumDateUTC < vandaagUTC) {
        toonWerkroosterStatus("Wijzigingsdatum mag niet in het verleden liggen.", "error", false);
        return null;
    }

    const medewerkerNaamVoorTitel = huidigeGebruikerInstellingen.medewerkerData?.Naam || huidigeGebruikerInstellingen.Title || "Onbekend";
    const roosterData = {
        Title: `Werkrooster ${medewerkerNaamVoorTitel} per ${nieuweWijzigingsdatumDateUTC.toLocaleDateString('nl-NL', { timeZone: 'UTC' })}`,
        MedewerkerID: huidigeGebruikerInstellingen.normalizedUsername,
        Ingangsdatum: nieuweWijzigingsdatumDateUTC.toISOString(),
        VeranderingsDatum: null // Dit wordt voor het *oude* item gezet, niet voor het nieuwe.
    };
    let isValide = true;

    DAGEN_VAN_DE_WEEK_GINST_EDIT.forEach(dag => {
        const vrijeDagCheckbox = document.getElementById(`ginst-${dag.toLowerCase()}-vrij`);
        const startInput = document.getElementById(`ginst-${dag.toLowerCase()}-start`);
        const eindInput = document.getElementById(`ginst-${dag.toLowerCase()}-eind`);
        const berekendeSoortSpan = document.getElementById(`ginst-${dag.toLowerCase()}-berekende-soort`);

        const isVrij = vrijeDagCheckbox ? vrijeDagCheckbox.checked : false;
        const startVal = startInput ? startInput.value : null;
        const eindVal = eindInput ? eindInput.value : null;
        let soortDagDefinitief = berekendeSoortSpan ? berekendeSoortSpan.textContent : "Niet Werkzaam";

        if (isVrij) {
            soortDagDefinitief = "VVD";
            roosterData[`${dag}Start`] = null;
            roosterData[`${dag}Eind`] = null;
        } else {
            if (soortDagDefinitief === "Tijd Fout" || soortDagDefinitief === "Onvolledig" || soortDagDefinitief === "Minimaal") {
                toonWerkroosterStatus(`Controleer de tijden voor ${dag}. Huidige status: ${soortDagDefinitief}.`, "error", false);
                isValide = false;
            } else if (soortDagDefinitief === "Werken" || soortDagDefinitief === "VVM" || soortDagDefinitief === "VVO") {
                if (!startVal || !eindVal) {
                    toonWerkroosterStatus(`Voor ${dag} (Soort: ${soortDagDefinitief}): vul zowel start- als eindtijd in.`, "error", false);
                    isValide = false;
                }
            }
            roosterData[`${dag}Start`] = startVal || null;
            roosterData[`${dag}Eind`] = eindVal || null;
        }
        roosterData[`${dag}Soort`] = (soortDagDefinitief === "Tijd Fout" || soortDagDefinitief === "Onvolledig" || soortDagDefinitief === "Minimaal") ? "Niet Werkzaam" : soortDagDefinitief;
    });

    return isValide ? roosterData : null;
}

// --- Event Handlers & Acties ---
async function handlePersoonlijkeGegevensOpslaan() {
    const functieNaam = "handlePersoonlijkeGegevensOpslaan_gInstellingen";
    console.log(`[gInstellingen] ${functieNaam} - Start.`);
    toonPersoonlijkeGegevensStatus("Persoonlijke gegevens opslaan...", "info", false);
    if (domInstellingenRefs.opslaanPersoonlijkeGegevensKnop) domInstellingenRefs.opslaanPersoonlijkeGegevensKnop.disabled = true;

    const nieuweNaam = domInstellingenRefs.pgNaamInput ? domInstellingenRefs.pgNaamInput.value.trim() : (huidigeGebruikerInstellingen.medewerkerData?.Naam || huidigeGebruikerInstellingen.Title);
    const nieuwTeam = domInstellingenRefs.pgTeamInput ? domInstellingenRefs.pgTeamInput.value : (huidigeGebruikerInstellingen.medewerkerData?.Team || null);
    const nieuweFunctie = domInstellingenRefs.pgFunctieInput ? domInstellingenRefs.pgFunctieInput.value : (huidigeGebruikerInstellingen.medewerkerData?.Functie || null);
    const nieuweGeboortedatum = domInstellingenRefs.pgGeboortedatumInput ? domInstellingenRefs.pgGeboortedatumInput.value : null;

    if (!nieuweNaam) {
        toonPersoonlijkeGegevensStatus("Naam is een verplicht veld.", "error", false);
        if (domInstellingenRefs.opslaanPersoonlijkeGegevensKnop) domInstellingenRefs.opslaanPersoonlijkeGegevensKnop.disabled = false;
        return;
    }
    try {
        const medewerkersConfig = typeof getLijstConfig === 'function' ? getLijstConfig("Medewerkers") : null;
        if (!medewerkersConfig) throw new Error("Configuratie voor Medewerkers lijst niet gevonden.");
        
        let medewerkerItemId = huidigeGebruikerInstellingen.medewerkerData ? huidigeGebruikerInstellingen.medewerkerData.ID : null;

        if (!medewerkerItemId) {
            const medArray = await haalInstellingenLijstItems("Medewerkers", "$select=ID", `$filter=Username eq '${huidigeGebruikerInstellingen.normalizedUsername}'`, "", "", true);
            if (medArray && medArray.length > 0) {
                medewerkerItemId = medArray[0].ID;
                if(huidigeGebruikerInstellingen.medewerkerData) huidigeGebruikerInstellingen.medewerkerData.ID = medewerkerItemId;
            } else {
                console.log(`[gInstellingen] ${functieNaam} - Geen bestaand medewerker record. Nieuw item wordt aangemaakt.`);
                const achternaamVoorTitel = nieuweNaam.includes(',') ? nieuweNaam.split(',')[0].trim() : nieuweNaam.split(' ').pop();
                const voornaamVoorTitel = nieuweNaam.includes(',') ? nieuweNaam.substring(nieuweNaam.indexOf(',') + 1).trim() : nieuweNaam.split(' ').slice(0, -1).join(' ');

                const nieuwMedewerkerItemData = {
                    Title: `${achternaamVoorTitel}, ${voornaamVoorTitel || ''}`.trim().replace(/, $/, ''),
                    Naam: nieuweNaam,
                    Username: huidigeGebruikerInstellingen.normalizedUsername,
                    E_x002d_mail: huidigeGebruikerInstellingen.Email,
                    Team: nieuwTeam,
                    Functie: nieuweFunctie,
                    Geboortedatum: nieuweGeboortedatum ? new Date(nieuweGeboortedatum).toISOString() : null,
                    Actief: true, Verbergen: false, Horen: false
                };
                const aangemaaktItem = await createInstellingenItem("Medewerkers", nieuwMedewerkerItemData);
                if (aangemaaktItem && aangemaaktItem.d) {
                    huidigeGebruikerInstellingen.medewerkerData = aangemaaktItem.d;
                    medewerkerItemId = aangemaaktItem.d.ID;
                    toonPersoonlijkeGegevensStatus("Nieuw medewerkerprofiel succesvol aangemaakt en opgeslagen!", "success", true);
                } else { throw new Error("Kon nieuw medewerkerprofiel niet aanmaken of ID niet ontvangen."); }
                 if (domInstellingenRefs.opslaanPersoonlijkeGegevensKnop) domInstellingenRefs.opslaanPersoonlijkeGegevensKnop.disabled = false;
                stelProfielfotoIn();
                return;
            }
        }
        
        const listTitleForType = medewerkersConfig.lijstTitel;
        const typeName = listTitleForType.charAt(0).toUpperCase() + listTitleForType.slice(1).replace(/\s+/g, '_');
        const itemDataVoorUpdate = {
            __metadata: { "type": `SP.Data.${typeName}ListItem` },
            Naam: nieuweNaam,
            Team: nieuwTeam,
            Functie: nieuweFunctie,
            Geboortedatum: nieuweGeboortedatum ? new Date(nieuweGeboortedatum).toISOString() : null
        };
        await updateInstellingenItem("Medewerkers", medewerkerItemId, itemDataVoorUpdate);
        
        if(huidigeGebruikerInstellingen.medewerkerData){
            huidigeGebruikerInstellingen.medewerkerData.Naam = nieuweNaam;
            huidigeGebruikerInstellingen.medewerkerData.Team = nieuwTeam;
            huidigeGebruikerInstellingen.medewerkerData.Functie = nieuweFunctie;
            huidigeGebruikerInstellingen.medewerkerData.Geboortedatum = nieuweGeboortedatum ? new Date(nieuweGeboortedatum).toISOString() : null;
        }
        
        toonPersoonlijkeGegevensStatus("Persoonlijke gegevens succesvol opgeslagen!", "success", true);
        stelProfielfotoIn();
    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        toonPersoonlijkeGegevensStatus(`Fout: ${error.message || "Kon persoonlijke gegevens niet opslaan."}`, "error", false);
    } finally {
        if (domInstellingenRefs.opslaanPersoonlijkeGegevensKnop) domInstellingenRefs.opslaanPersoonlijkeGegevensKnop.disabled = false;
    }
}

async function handleWerkroosterOpslaan() {
    const functieNaam = "handleWerkroosterOpslaan_gInstellingen";
    console.log(`[gInstellingen] ${functieNaam} - Poging tot opslaan werkrooster...`);
    toonWerkroosterStatus("Werkrooster opslaan...", "info", false);
    if (domInstellingenRefs.opslaanWerkroosterKnop) domInstellingenRefs.opslaanWerkroosterKnop.disabled = true;

    const nieuwRoosterData = valideerEnVerzamelWerkroosterDataGInst();
    if (!nieuwRoosterData) {
        if (domInstellingenRefs.opslaanWerkroosterKnop) domInstellingenRefs.opslaanWerkroosterKnop.disabled = false;
        return;
    }

    try {
        const urenConfig = typeof getLijstConfig === 'function' ? getLijstConfig("UrenPerWeek") : null;
        if (!urenConfig) throw new Error("Configuratie voor UrenPerWeek lijst niet gevonden.");

        const nieuweIngangsdatumDate = new Date(nieuwRoosterData.Ingangsdatum);

        if (huidigeGebruikerInstellingen.urenPerWeekActueel && huidigeGebruikerInstellingen.urenPerWeekActueel.ID) {
            const huidigActiefId = huidigeGebruikerInstellingen.urenPerWeekActueel.ID;
            const huidigActiefIngangsdatum = new Date(huidigeGebruikerInstellingen.urenPerWeekActueel.Ingangsdatum);

            if (nieuweIngangsdatumDate > huidigActiefIngangsdatum) {
                 const veranderingsDatumVoorOudRooster = new Date(nieuweIngangsdatumDate);
                 veranderingsDatumVoorOudRooster.setUTCDate(veranderingsDatumVoorOudRooster.getUTCDate() - 1);

                if (veranderingsDatumVoorOudRooster >= huidigActiefIngangsdatum) {
                    const updateData = {
                        __metadata: { "type": `SP.Data.${urenConfig.lijstTitel.replace(/\s+/g, '_')}ListItem` },
                        VeranderingsDatum: veranderingsDatumVoorOudRooster.toISOString()
                    };
                    await updateInstellingenItem("UrenPerWeek", huidigActiefId, updateData);
                }
            }
        }
        await createInstellingenItem("UrenPerWeek", nieuwRoosterData);

        toonAlgemeenStatusBerichtGInst("Werkrooster data herladen...", "info", false);
        const selectVeldenUren = `$select=ID,Ingangsdatum,VeranderingsDatum,${DAGEN_VAN_DE_WEEK_DISPLAY.map(d => `${d}Start,${d}Eind,${d}Soort`).join(',')}`;
        const alleItemsNaUpdate = await haalInstellingenLijstItems("UrenPerWeek", selectVeldenUren, `$filter=MedewerkerID eq '${huidigeGebruikerInstellingen.normalizedUsername}'`, "", "$orderby=Ingangsdatum desc", true);
        huidigeGebruikerInstellingen.alleUrenPerWeekHistorie = alleItemsNaUpdate || [];
        huidigeGebruikerInstellingen.urenPerWeekActueel = (alleItemsNaUpdate || []).find(item => !item.VeranderingsDatum || new Date(item.VeranderingsDatum) > new Date()) || ((alleItemsNaUpdate && alleItemsNaUpdate.length > 0) ? alleItemsNaUpdate[0] : null);

        toonWerkroosterStatus("Nieuw werkrooster succesvol opgeslagen!", "success", true);
        toggleWerkroosterEditModus(false);

    } catch (error) {
        console.error(`[gInstellingen] ${functieNaam} - Fout:`, error);
        toonWerkroosterStatus(`Fout bij opslaan werkrooster: ${error.message}`, "error", false);
    } finally {
        if (domInstellingenRefs.opslaanWerkroosterKnop) domInstellingenRefs.opslaanWerkroosterKnop.disabled = false;
    }
}

function toggleWerkroosterEditModus(bewerken) {
    console.log(`[gInstellingen] Schakelen naar werkrooster edit modus: ${bewerken}`);
    const displayContainer = domInstellingenRefs.werkdagenDisplayContainer;
    const editFormContainer = domInstellingenRefs.werkroosterEditFormContainer;
    const wijzigKnop = domInstellingenRefs.wijzigWerkroosterKnop;

    if (displayContainer && editFormContainer && wijzigKnop) {
        if (bewerken) {
            displayContainer.classList.add('hidden');
            editFormContainer.classList.remove('hidden');
            wijzigKnop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Annuleer Wijziging`;
            wijzigKnop.classList.remove('btn-primary');
            wijzigKnop.classList.add('btn-secondary'); 
            if (domInstellingenRefs.werkroosterWijzigingsdatumInput) {
                const vandaag = new Date();
                // Standaard op vandaag, of morgen als dat de logica moet zijn
                domInstellingenRefs.werkroosterWijzigingsdatumInput.value = vandaag.toISOString().split('T')[0];
                domInstellingenRefs.werkroosterWijzigingsdatumInput.min = vandaag.toISOString().split('T')[0];
            }
            genereerWerkroosterEditFormGInstellingen();
        } else {
            displayContainer.classList.remove('hidden');
            editFormContainer.classList.add('hidden');
            wijzigKnop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Werkrooster Wijzigen`;
            wijzigKnop.classList.remove('btn-secondary');
            wijzigKnop.classList.add('btn-primary');
            vulWerkdagenDisplayEnEditForm(); 
            if (domInstellingenRefs.werkroosterStatusBericht) domInstellingenRefs.werkroosterStatusBericht.classList.add('hidden');
        }
    }
}

// --- UI Hulpprogramma's (Tabs) ---
function initializeTabs() {
    console.log("[gInstellingen] Initialiseren tabs.");
    const urlParams = new URLSearchParams(window.location.search);
    const gevraagdeTab = urlParams.get('tab') || 'profiel';
    if (domInstellingenRefs.tabButtons && domInstellingenRefs.tabButtons.length > 0) {
        domInstellingenRefs.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                activateTab(tabId);
                try {
                    const nieuweUrl = `${window.location.pathname}?tab=${tabId}`;
                    window.history.replaceState({ path: nieuweUrl }, '', nieuweUrl);
                } catch (e) {
                    console.warn("[gInstellingen] history.replaceState niet ondersteund of beperkt.", e);
                }
            });
        });
        const eersteTabId = domInstellingenRefs.tabButtons[0].dataset.tab;
        const initiëleTab = Array.from(domInstellingenRefs.tabButtons).some(btn => btn.dataset.tab === gevraagdeTab) ? gevraagdeTab : eersteTabId;
        activateTab(initiëleTab);
    } else {
        console.warn("[gInstellingen] Tab knoppen niet gevonden in DOM.");
    }
}

function activateTab(tabId) {
    if (domInstellingenRefs.tabButtons) {
        domInstellingenRefs.tabButtons.forEach(btn => {
            const isActief = btn.dataset.tab === tabId;
            btn.classList.toggle('active', isActief);
        });
    }
    if (domInstellingenRefs.tabContents) {
        domInstellingenRefs.tabContents.forEach(content => {
            const isActief = content.id === `tab-content-${tabId}`;
            content.classList.toggle('active', isActief);
            content.classList.toggle('hidden', !isActief);
        });
    }
    console.log(`[gInstellingen] Tab geactiveerd: ${tabId}`);
    if (domInstellingenRefs.persoonlijkeGegevensStatusBericht && tabId !== 'profiel') domInstellingenRefs.persoonlijkeGegevensStatusBericht.classList.add('hidden');
    if (domInstellingenRefs.werkroosterStatusBericht && tabId !== 'werkuren') domInstellingenRefs.werkroosterStatusBericht.classList.add('hidden');
    if (domInstellingenRefs.instellingenStatusBericht && tabId !== 'instellingen') domInstellingenRefs.instellingenStatusBericht.classList.add('hidden');
}

function updateJaarInFooter() {
    if (domInstellingenRefs.currentYearSpan) {
        domInstellingenRefs.currentYearSpan.textContent = new Date().getFullYear();
    }
}

// --- Hoofd Initialisatie Functie ---
async function initializePagina() {
    const functieNaam = "initializePagina_gInstellingen";
    console.log(`[gInstellingen] ${functieNaam} - Start initialisatie...`);
    updateJaarInFooter();
    initializeTabs();

    const lokaalThema = localStorage.getItem('gInstellingenThema');
    pasThemaKlassenToe(lokaalThema === 'dark' ? 'dark' : 'light');

    const contextOK = await initializeInstellingenContext();
    if (!contextOK) return;
    
    await laadEnPasThemaToe(); 
    await laadGebruikersGegevens(); 

    koppelEventListeners();
    console.log(`[gInstellingen] ${functieNaam} - Pagina initialisatie voltooid.`);
}

function koppelEventListeners() {
    console.log("[gInstellingen] Koppelen event listeners.");
    if (domInstellingenRefs.opslaanPersoonlijkeGegevensKnop) {
        domInstellingenRefs.opslaanPersoonlijkeGegevensKnop.addEventListener('click', handlePersoonlijkeGegevensOpslaan);
    }
    if (domInstellingenRefs.wijzigWerkroosterKnop) {
        domInstellingenRefs.wijzigWerkroosterKnop.addEventListener('click', () => {
            const isMomenteelInDisplayModus = !domInstellingenRefs.werkdagenDisplayContainer.classList.contains('hidden');
            toggleWerkroosterEditModus(isMomenteelInDisplayModus);
        });
    }
    if (domInstellingenRefs.opslaanWerkroosterKnop) {
        domInstellingenRefs.opslaanWerkroosterKnop.addEventListener('click', handleWerkroosterOpslaan);
    }
    if (domInstellingenRefs.annuleerWerkroosterKnop) {
        domInstellingenRefs.annuleerWerkroosterKnop.addEventListener('click', () => toggleWerkroosterEditModus(false));
    }
     if (domInstellingenRefs.applyGlobalTimeButton) {
        domInstellingenRefs.applyGlobalTimeButton.addEventListener('click', () => {
            const globalStart = domInstellingenRefs.globalStartTimeInput.value;
            const globalEnd = domInstellingenRefs.globalEndTimeInput.value;
            if (globalStart && globalEnd) {
                DAGEN_VAN_DE_WEEK_GINST_EDIT.forEach(dag => {
                    const startInput = document.getElementById(`ginst-${dag.toLowerCase()}-start`);
                    const eindInput = document.getElementById(`ginst-${dag.toLowerCase()}-eind`);
                    const vrijeDagCheckbox = document.getElementById(`ginst-${dag.toLowerCase()}-vrij`);
                    
                    if (startInput) startInput.value = globalStart;
                    if (eindInput) eindInput.value = globalEnd;
                    if (vrijeDagCheckbox) vrijeDagCheckbox.checked = false; 
                    
                    if (startInput) startInput.dispatchEvent(new Event('change', { bubbles: true }));
                });
                toonWerkroosterStatus("Globale tijden toegepast.", "info", true);
            } else {
                toonWerkroosterStatus("Vul globale start- én eindtijd in.", "error", false);
            }
        });
    }
}

function probeerInitialisatie() {
    if (typeof getLijstConfig === 'function' && typeof sharepointLijstConfiguraties !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializePagina);
        } else {
            initializePagina();
        }
        return true;
    }
    return false;
}
if (!probeerInitialisatie()) {
    let intervalTeller = 0;
    const maxPogingen = 50;
    const configIntervalInstellingen = setInterval(() => {
        intervalTeller++;
        if (probeerInitialisatie() || intervalTeller >= maxPogingen) {
            clearInterval(configIntervalInstellingen);
            if (intervalTeller >= maxPogingen && typeof getLijstConfig !== 'function') {
                console.error("[gInstellingen] Kritische fout: configLijst.js of getLijstConfig functie niet geladen.");
                toonAlgemeenStatusBerichtGInst("Kritische fout: Applicatieconfiguratie kon niet geladen worden.", "error", false);
            }
        }
    }, 100);
}
console.log("Pages/JS/gInstellingen_logic.js geladen met bijgewerkte tab- en werkroosterlogica.");
