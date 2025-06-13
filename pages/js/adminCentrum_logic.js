// Pages/JS/adminCentrum_logic.js

/**
 * Logica voor de adminCentrum.html pagina.
 * Beheert geavanceerde instellingen en mogelijk het Foutenlogboek.
 */

// Globale variabelen
let spWebAbsoluteUrlAdmin = '';
let huidigeGebruikerAdmin = { loginNaam: null, Id: null, Title: null };
// let actieveAdminTabId = 'algemeen'; // Indien tabs gebruikt worden

// DOM Referenties
const domAdminRefs = {
    appBody: document.body,
    // tabButtons: document.querySelectorAll('.tab-button'), // Indien tabs gebruikt
    // tabContentContainer: document.getElementById('admin-content-container'), // Indien tabs gebruikt
    algemeenStatusBericht: document.getElementById('admin-status-bericht-algemeen'),
    currentYearSpan: document.getElementById('current-year'),

    // Foutenlogboek
    foutenlogboekTabelBody: document.getElementById('foutenlogboek-tabel-body'),
    foutenlogboekStatus: document.getElementById('foutenlogboek-status'),
    
    // Modal (generiek voor admin taken)
    adminModal: document.getElementById('admin-modal'),
    adminModalTitle: document.getElementById('admin-modal-title'),
    adminModalForm: document.getElementById('admin-modal-form'),
    adminModalFieldsContainer: document.getElementById('admin-modal-fields-container'),
    adminModalStatus: document.getElementById('admin-modal-status'),
    adminModalCloseX: document.getElementById('admin-modal-close-x'),
    adminModalCancelButton: document.getElementById('admin-modal-cancel-button'),
    adminModalSaveButton: document.getElementById('admin-modal-save-button'),
};

// Mapping voor Foutenlogboek (indien bewerkbaar gemaakt wordt)
const foutenlogboekConfig = {
    lijstNaamSP: 'FoutenLogboek', // Moet overeenkomen met configLijst.js
    velden: [
        { label: 'ID', interneNaam: 'ID', type: 'readonly', tabelWeergave: true },
        { label: 'Titel', interneNaam: 'Title', type: 'text', verplicht: true, tabelWeergave: true },
        { label: 'FoutBeschrijving', interneNaam: 'FoutBeschrijving', type: 'textarea', verplicht: false, tabelWeergave: true },
        { label: 'FoutCode', interneNaam: 'FoutCode', type: 'text', verplicht: false, tabelWeergave: true },
        { label: 'Behandelplan', interneNaam: 'Behandelplan', type: 'textarea', verplicht: false, tabelWeergave: true }
        // Voeg hier eventueel 'Status' toe als Choice, of andere relevante velden uit FoutenLogboek
    ],
    pk: 'ID'
};


// --- Initialisatie & Context ---
async function initializeAdminContext() {
    console.log("[AdminCentrum] Initialiseren context...");
    if (window.opener && window.opener.spWebAbsoluteUrl && window.opener.huidigeGebruiker) {
        spWebAbsoluteUrlAdmin = window.opener.spWebAbsoluteUrl;
        huidigeGebruikerAdmin = JSON.parse(JSON.stringify(window.opener.huidigeGebruiker));
    } else if (window.parent && window.parent !== window && window.parent.spWebAbsoluteUrl && window.parent.huidigeGebruiker) {
        spWebAbsoluteUrlAdmin = window.parent.spWebAbsoluteUrl;
        huidigeGebruikerAdmin = JSON.parse(JSON.stringify(window.parent.huidigeGebruiker));
    } else {
        try {
            const webResponse = await fetch(`/_api/web?$select=Url`, { headers: { 'Accept': 'application/json;odata=verbose' } });
            if (!webResponse.ok) throw new Error('Kan web URL niet ophalen');
            const webData = await webResponse.json();
            spWebAbsoluteUrlAdmin = webData.d.Url;
            const userResponse = await fetch(`${spWebAbsoluteUrlAdmin}/_api/web/currentuser?$select=LoginName,Title,Id`, { headers: { 'Accept': 'application/json;odata=verbose' } });
            if (!userResponse.ok) throw new Error('Kan gebruiker info niet ophalen');
            const userData = await userResponse.json();
            huidigeGebruikerAdmin = { loginNaam: userData.d.LoginName, Id: userData.d.Id, Title: userData.d.Title };
        } catch (error) {
            console.error("[AdminCentrum] Kritische fout bij ophalen context:", error);
            toonAdminAlgemeenStatusBericht("Kan geen verbinding maken met de server. Probeer later opnieuw.", "error", false);
            return false;
        }
    }
    console.log("[AdminCentrum] Context geïnitialiseerd:", spWebAbsoluteUrlAdmin, huidigeGebruikerAdmin.loginNaam);
    return true;
}

// --- Generieke SharePoint Functies (kunnen gedeeld worden met beheerCentrum_logic.js) ---
// Voor nu, kopieer of importeer de benodigde CRUD functies (getBeheerLijstItems, etc.)
// of maak hier specifieke versies. Voor dit voorbeeld gebruiken we een placeholder.

async function getAdminLijstItems(lijstIdentifier, selectQuery = "", filterQuery = "", expandQuery = "", orderbyQuery = "") {
    if (!spWebAbsoluteUrlAdmin) { console.error("[AdminCentrum] spWebAbsoluteUrlAdmin is niet beschikbaar."); return []; }
    let apiUrlPath;
    const lijstConfigSP = getLijstConfig(lijstIdentifier);
    const lijstGuid = lijstConfigSP ? lijstConfigSP.lijstId : lijstIdentifier;

    if (/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(lijstGuid)) {
        apiUrlPath = `/_api/web/lists(guid'${lijstGuid}')/items`;
    } else {
        apiUrlPath = `/_api/web/lists/getByTitle('${encodeURIComponent(lijstGuid)}')/items`;
    }
    let queryParams = [];
    if (selectQuery) queryParams.push(selectQuery);
    if (filterQuery) queryParams.push(filterQuery);
    if (expandQuery) queryParams.push(expandQuery);
    if (orderbyQuery) queryParams.push(orderbyQuery);
    const apiUrl = `${spWebAbsoluteUrlAdmin}${apiUrlPath}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
    
    const statusElement = domAdminRefs.foutenlogboekStatus; // Of generieker maken
    if(statusElement) toonAdminStatusBericht(statusElement, "Laden...", "info", false);

    try {
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!response.ok) {
            const err = await response.json().catch(()=>({})); 
            console.error(`Fout bij ophalen ${lijstIdentifier}: ${response.status}`, err); 
            if(statusElement) toonAdminStatusBericht(statusElement, `Fout bij laden: ${err.error?.message?.value || response.statusText}`, "error", false);
            return [];
        }
        const data = await response.json(); 
        const itemCount = data.d.results ? data.d.results.length : 0;
        if(statusElement) toonAdminStatusBericht(statusElement, `${itemCount} items geladen.`, "success", true);
        return data.d.results || [];
    } catch (error) { 
        console.error(`Uitzondering bij ophalen ${lijstIdentifier}:`, error); 
        if(statusElement) toonAdminStatusBericht(statusElement, `Netwerkfout: ${error.message}`, "error", false);
        return []; 
    }
}
// TODO: Implementeer create, update, delete functies indien nodig voor Foutenlogboek of andere admin lijsten.

// --- Foutenlogboek Specifieke Functies ---
async function laadFoutenlogboek() {
    const config = foutenlogboekConfig;
    const tabelBody = domAdminRefs.foutenlogboekTabelBody;
    if (!tabelBody) { console.error("Tabel body voor foutenlogboek niet gevonden."); return; }

    tabelBody.innerHTML = `<tr><td colspan="${config.velden.length + 1}" class="text-center p-4 text-gray-400">Laden Foutenlogboek...</td></tr>`;
    
    const selectFields = config.velden.map(v => v.interneNaam);
    if (!selectFields.includes(config.pk)) selectFields.unshift(config.pk);
    const selectQuery = "$select=" + selectFields.filter(Boolean).join(',');
    const orderby = "ID desc"; // Meest recente fouten eerst

    const items = await getAdminLijstItems(config.lijstNaamSP, selectQuery, "", "", orderby);
    
    tabelBody.innerHTML = '';
    if (items.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="${config.velden.length + 1}" class="text-center p-4 text-gray-400">Geen fouten gevonden in het logboek.</td></tr>`;
        return;
    }
    items.forEach(item => createFoutenlogboekDisplayRow(item, tabelBody));
}

function createFoutenlogboekDisplayRow(item, tabelBody) {
    const config = foutenlogboekConfig;
    const tr = document.createElement('tr');
    tr.dataset.id = item[config.pk];

    config.velden.forEach(veldDef => {
        if (veldDef.tabelWeergave === false) return; 

        const td = document.createElement('td');
        td.className = 'align-top py-2 px-3 text-sm';
        let displayValue = item[veldDef.interneNaam];
        td.textContent = displayValue === null || displayValue === undefined ? '' : displayValue;
        tr.appendChild(td);
    });

    const actiesTd = document.createElement('td');
    actiesTd.className = 'space-x-1 whitespace-nowrap py-2 px-3';
    const viewButton = document.createElement('button');
    viewButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    viewButton.title = "Details Bekijken";
    viewButton.className = 'view-button bg-sky-500 hover:bg-sky-600 text-white p-1.5 rounded text-xs shadow';
    viewButton.addEventListener('click', () => openAdminModalForFoutItem(item, true)); // true for readonly
    
    // Optioneel: Bewerk knop als fouten bewerkt mogen worden
    // const editButton = ...
    // editButton.addEventListener('click', () => openAdminModalForFoutItem(item, false));

    actiesTd.appendChild(viewButton);
    // actiesTd.appendChild(editButton);
    tr.appendChild(actiesTd);

    tabelBody.appendChild(tr);
}

function openAdminModalForFoutItem(item, isReadonly) {
    huidigeBewerkingsItemId = item ? item[foutenlogboekConfig.pk] : null; // Voor adminCentrum, niet per se 'bewerken'

    domAdminRefs.adminModalTitle.textContent = isReadonly ? `Details Fout ID: ${huidigeBewerkingsItemId}` : `Fout ID: ${huidigeBewerkingsItemId} Bewerken`;
    domAdminRefs.adminModalFieldsContainer.innerHTML = ''; 

    foutenlogboekConfig.velden.forEach(veldDef => {
        const div = document.createElement('div');
        div.className = 'mb-3';
        const label = document.createElement('label');
        label.htmlFor = `admin-modal-${veldDef.interneNaam}`;
        label.textContent = veldDef.label;
        label.className = 'block text-sm font-medium text-gray-300 mb-1';
        
        let inputElement;
        if (isReadonly || veldDef.type === 'readonly') {
            inputElement = document.createElement('p');
            inputElement.id = `admin-modal-${veldDef.interneNaam}`;
            inputElement.textContent = item ? (item[veldDef.interneNaam] || 'N.v.t.') : 'N.v.t.';
            inputElement.className = 'mt-1 text-sm text-gray-400 bg-gray-700 p-2 rounded-md min-h-[38px]'; // Stijl als readonly veld
             if (veldDef.type === 'textarea') inputElement.classList.add('whitespace-pre-wrap'); // Behoud newlines
        } else {
            // Implementeer input velden zoals in beheerCentrum_logic.js indien bewerken nodig is
            // Voor nu, focus op readonly view
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            // ... (volledige input creatie logica)
            inputElement.value = item ? (item[veldDef.interneNaam] || '') : '';
            inputElement.className = 'input-class w-full';
            if (veldDef.verplicht) inputElement.required = true;
        }
        
        div.appendChild(label);
        div.appendChild(inputElement);
        domAdminRefs.adminModalFieldsContainer.appendChild(div);
    });

    domAdminRefs.adminModalStatus.textContent = '';
    domAdminRefs.adminModalStatus.classList.add('hidden');
    domAdminRefs.adminModalSaveButton.classList.toggle('hidden', isReadonly); // Verberg Opslaan knop in readonly modus
    domAdminRefs.adminModalCancelButton.textContent = isReadonly ? "Sluiten" : "Annuleren";
    domAdminRefs.adminModal.classList.remove('hidden');
    void domAdminRefs.adminModal.offsetWidth;
    domAdminRefs.adminModal.querySelector('div > div').classList.remove('opacity-0', 'scale-95');
    domAdminRefs.adminModal.querySelector('div > div').classList.add('opacity-100', 'scale-100');
}


// --- Status Berichten ---
function toonAdminAlgemeenStatusBericht(bericht, type = 'info', autoHide = true) {
    if (domAdminRefs.algemeenStatusBericht) {
        // Implementatie vergelijkbaar met beheerCentrum
        domAdminRefs.algemeenStatusBericht.textContent = bericht;
        domAdminRefs.algemeenStatusBericht.className = 'mt-4 p-3 text-sm rounded-lg';
        switch (type) {
            case 'success': domAdminRefs.algemeenStatusBericht.classList.add('bg-green-600', 'text-green-100'); break;
            case 'error': domAdminRefs.algemeenStatusBericht.classList.add('bg-red-600', 'text-red-100'); break;
            default: domAdminRefs.algemeenStatusBericht.classList.add('bg-blue-600', 'text-blue-100'); break;
        }
        domAdminRefs.algemeenStatusBericht.classList.remove('hidden');
        if (autoHide) setTimeout(() => domAdminRefs.algemeenStatusBericht.classList.add('hidden'), 5000);
    }
}
function toonAdminStatusBericht(statusElement, bericht, type = 'info', autoHide = true) {
    if (statusElement) {
        statusElement.textContent = bericht;
        statusElement.className = 'mt-3 text-sm p-2 rounded-md'; // Reset
         switch (type) {
            case 'success': statusElement.classList.add('bg-green-700', 'text-green-100'); break;
            case 'error': statusElement.classList.add('bg-red-700', 'text-red-100'); break;
            default: statusElement.classList.add('bg-blue-700', 'text-blue-100'); break;
        }
        statusElement.classList.remove('hidden');
        if (autoHide) setTimeout(() => statusElement.classList.add('hidden'), 3000);
    }
}
function toonAdminModalStatus(bericht, type = 'info', autoHide = true) {
    if (domAdminRefs.adminModalStatus) {
        // Implementatie vergelijkbaar met beheerCentrum
        domAdminRefs.adminModalStatus.textContent = bericht;
        domAdminRefs.adminModalStatus.className = 'mt-3 text-sm p-2 rounded-md';
         switch (type) {
            case 'success': domAdminRefs.adminModalStatus.classList.add('bg-green-700', 'text-green-100'); break;
            case 'error': domAdminRefs.adminModalStatus.classList.add('bg-red-700', 'text-red-100'); break;
            default: domAdminRefs.adminModalStatus.classList.add('bg-blue-700', 'text-blue-100'); break;
        }
        domAdminRefs.adminModalStatus.classList.remove('hidden');
        if (autoHide) setTimeout(() => domAdminRefs.adminModalStatus.classList.add('hidden'), 4000);
    }
}


// --- Event Listeners ---
function initAdminEventListeners() {
    // Modal knoppen
    if(domAdminRefs.adminModalCloseX) domAdminRefs.adminModalCloseX.addEventListener('click', closeAdminModal);
    if(domAdminRefs.adminModalCancelButton) domAdminRefs.adminModalCancelButton.addEventListener('click', closeAdminModal);
    // if(domAdminRefs.adminModalSaveButton) domAdminRefs.adminModalSaveButton.addEventListener('click', saveAdminModalData); // Indien bewerken geïmplementeerd wordt

    if (domAdminRefs.adminModal) {
        domAdminRefs.adminModal.addEventListener('click', (event) => {
            if (event.target === domAdminRefs.adminModal) { closeAdminModal(); }
        });
    }
}

function closeAdminModal() {
    if(domAdminRefs.adminModal) {
        const modalContent = domAdminRefs.adminModal.querySelector('div > div');
        modalContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            domAdminRefs.adminModal.classList.add('hidden');
        }, 200);
    }
}

// --- Hoofd Initialisatie ---
async function initializeAdminCentrum() {
    console.log("[AdminCentrum] Initialiseren pagina...");
    if (domAdminRefs.currentYearSpan) {
        domAdminRefs.currentYearSpan.textContent = new Date().getFullYear();
    }
    
    const opgeslagenThema = localStorage.getItem('verlofroosterThema');
    if (opgeslagenThema === 'light') {
        domAdminRefs.appBody.classList.add('light-theme');
    }

    const contextOK = await initializeAdminContext();
    if (!contextOK) return;

    initAdminEventListeners();
    await laadFoutenlogboek(); // Laad de data voor het foutenlogboek
    
    console.log("[AdminCentrum] Pagina initialisatie voltooid.");
}

// Start de initialisatie
if (typeof getLijstConfig === 'function' && typeof sharepointLijstConfiguraties !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeAdminCentrum);
} else {
    const configIntervalAdmin = setInterval(() => {
        if (typeof getLijstConfig === 'function' && typeof sharepointLijstConfiguraties !== 'undefined') {
            clearInterval(configIntervalAdmin);
            document.addEventListener('DOMContentLoaded', initializeAdminCentrum);
        }
    }, 100);
    setTimeout(() => {
        if (typeof getLijstConfig !== 'function') {
            clearInterval(configIntervalAdmin);
            console.error("[AdminCentrum] configLijst.js niet geladen.");
            if(domAdminRefs.algemeenStatusBericht) toonAdminAlgemeenStatusBericht("Kritische fout: Configuratie ontbreekt.", "error", false);
        }
    }, 5000);
}

console.log("Pages/JS/adminCentrum_logic.js geladen.");
