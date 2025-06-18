/* filepath: k/pages/js/meldingZiekte_logic.js */
/**
 * Logica voor de Ziek/Beter melden functionaliteit, specifiek wanneer deze
 * binnen een modal wordt geladen vanuit het hoofd verlofrooster.
 * Gebaseerd op de structuur van meldingVerlof_logic.js voor consistentie.
 */

// Globale variabelen specifiek voor de ziekmelding modal context
let spWebAbsoluteUrlZiekmelding; // Wordt gezet bij initialisatie van de modal
let huidigeGebruikerZiekmeldingContext = { // Wordt gevuld bij het openen van de modal
    loginNaam: "", // Volledige SharePoint loginnaam (bijv. i:0#.w|domein\gebruiker)
    displayName: "", // Weergavenaam (bijv. Achternaam, Voornaam (Afdeling))
    normalizedUsername: "", // Gebruikersnaam zonder prefix (bijv. domein\gebruiker of gebruiker)
    email: "", // Zorg dat dit veld gevuld wordt bij initialisatie!
    id: null, // SharePoint User ID
    medewerkerNaamVolledig: "" // Veld voor "Voornaam Achternaam"
};
let ziekteRedenId = null; // ID van de "Ziekte" reden uit de Verlofredenen lijst

// --- Configuration for Email Logic ---
const ziekteEmailMode = 1; // 0=off, 1=seniors get email, 9=debug mode (w.van.bussel only)
const ziekteEmailDebugRecipient = "w.van.bussel@om.nl";
// --- End Configuration ---

/**
 * Haalt een X-RequestDigest op, nodig voor POST/PUT/DELETE operaties.
 * @returns {Promise<string>} De request digest waarde.
 */
async function getRequestDigestZiekmelding() {
    if (!spWebAbsoluteUrlZiekmelding) {
        console.error("[MeldingZiekte] SharePoint site URL (spWebAbsoluteUrlZiekmelding) is niet ingesteld.");
        throw new Error('SharePoint site URL is niet geconfigureerd voor request digest.');
    }
    console.log("[MeldingZiekte] Ophalen Request Digest van:", `${spWebAbsoluteUrlZiekmelding}/_api/contextinfo`);
    const response = await fetch(`${spWebAbsoluteUrlZiekmelding}/_api/contextinfo`, {
        method: 'POST',
        headers: { 'Accept': 'application/json;odata=verbose' }
    });
    if (!response.ok) {
        const errorTekst = await response.text().catch(() => "Onbekende serverfout");
        console.error("[MeldingZiekte] Fout bij ophalen request digest:", response.status, errorTekst);
        throw new Error(`Kon request digest niet ophalen: ${response.status} - ${errorTekst.substring(0, 100)}`);
    }
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
}

/**
 * Toont een notificatie in de ziekmelding modal.
 * @param {string} berichtHTML - De HTML van het bericht.
 * @param {string} type - Het type notificatie (success, error, warning, info).
 * @param {number|boolean} autoHideDelay - Vertraging in ms voor auto-verbergen, of false om niet te verbergen.
 */
function toonNotificatieInZiekmeldingModal(berichtHTML, type = 'info', autoHideDelay = 7000) {
    // Probeer eerst de modal-specifieke notificatiefunctie
    if (typeof toonModalNotificatie === 'function') {
        toonModalNotificatie(berichtHTML, type, autoHideDelay);
    } else if (typeof toonNotificatie === 'function') {
        // Fallback naar globale notificatiefunctie
        toonNotificatie(berichtHTML, type);
    } else {
        // Laatste fallback: console log
        console.log(`[MeldingZiekte] ${type.toUpperCase()}: ${berichtHTML}`);
    }
}

/**
 * Initialiseert het ziekmeldingformulier in de modal.
 * @param {Object} medewerkerContext - Context van de medewerker voor wie de ziekmelding wordt gemeld.
 * @param {Date} geselecteerdeDatum - De datum die geselecteerd is voor de ziekmelding.
 * @param {Object} itemData - Optioneel: bestaande ziekmelding gegevens voor bewerkingsmodus.
 */
async function initializeZiekmeldingModal(medewerkerContext, geselecteerdeDatum, itemData = null) {
    const isEditMode = itemData !== null;
    console.log(`[MeldingZiekte] Initialiseren formulier. Modus: ${isEditMode ? 'Bewerken' : 'Nieuw'}.`);

    spWebAbsoluteUrlZiekmelding = window.spWebAbsoluteUrl;
    if (!spWebAbsoluteUrlZiekmelding) {
        toonNotificatieInZiekmeldingModal("Kritieke fout: Serverlocatie onbekend.", "error", false);
        return;
    }

    // Bepaal voor wie de ziekmelding wordt gemeld
    let targetMedewerkerContext;
    const isSuperUser = isUserSuperUser();
    console.log('[MeldingZiekte] Initialisatie context:', {
        isSuperUser,
        medewerkerContext: medewerkerContext,
        currentUser: window.huidigeGebruiker,
        isEdit: isEditMode,
        'medewerkerContext type': typeof medewerkerContext,
        'medewerkerContext properties': medewerkerContext ? Object.keys(medewerkerContext) : null
    });
    
    if (isSuperUser && medewerkerContext && 
        medewerkerContext.normalizedUsername !== window.huidigeGebruiker.normalizedUsername &&
        medewerkerContext.Username !== window.huidigeGebruiker.normalizedUsername &&
        medewerkerContext.loginNaam !== window.huidigeGebruiker.loginNaam) {
        // Super-user meldt ziekte voor een andere medewerker
        targetMedewerkerContext = medewerkerContext;
        console.log('[MeldingZiekte] Super-user meldt ziekte voor andere medewerker:', targetMedewerkerContext);
    } else {
        // Gewone gebruiker OF super-user meldt ziekte voor zichzelf
        targetMedewerkerContext = window.huidigeGebruiker;
        console.log('[MeldingZiekte] Ziekmelding wordt gemeld voor de ingelogde gebruiker:', targetMedewerkerContext);
    }
    
    huidigeGebruikerZiekmeldingContext = targetMedewerkerContext;
    
    if (!huidigeGebruikerZiekmeldingContext || !(huidigeGebruikerZiekmeldingContext.normalizedUsername || huidigeGebruikerZiekmeldingContext.loginNaam)) {
        toonNotificatieInZiekmeldingModal("Gebruikersinformatie kon niet worden geladen.", "error", false);
        return;
    }
    
    // --- Velden ophalen ---
    const medewerkerDisplayVeld = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerSelectVeld = document.getElementById('ModalMedewerkerSelect');
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay');
    const verborgenMedewerkerIdVeld = document.getElementById('MedewerkerID');

    // Configureer UI op basis van gebruikersrechten
    if (isSuperUser) {
        // Super-user: toon dropdown, verberg readonly veld
        console.log('[MeldingZiekte] Configureer UI voor super-user');
        if (medewerkerDisplayVeld) {
            medewerkerDisplayVeld.classList.add('hidden');
        }
        if (medewerkerSelectVeld) {
            medewerkerSelectVeld.classList.remove('hidden');
            await populateEmployeeDropdownZiekmelding(medewerkerSelectVeld, targetMedewerkerContext);
        }
    } else {
        // Gewone gebruiker: toon readonly veld, verberg dropdown
        console.log('[MeldingZiekte] Configureer UI voor gewone gebruiker');
        if (medewerkerDisplayVeld) {
            medewerkerDisplayVeld.classList.remove('hidden');
            // Zorg dat het veld zichtbaar en readonly is
            medewerkerDisplayVeld.style.display = '';
            medewerkerDisplayVeld.readOnly = true;
        }
        if (medewerkerSelectVeld) {
            medewerkerSelectVeld.classList.add('hidden');
        }
    }

    const titleInput = document.getElementById('Title');
    const aanvraagTijdstipInput = document.getElementById('AanvraagTijdstip');
    
    const startDatePicker = document.getElementById('ModalStartDatePicker');
    const endDatePicker = document.getElementById('ModalEndDatePicker');
    const startTimePicker = document.getElementById('ModalStartTimePicker');
    const endTimePicker = document.getElementById('ModalEndTimePicker');
    const omschrijvingTextarea = document.getElementById('ModalOmschrijving');
    
    // === KRITIEKE DEBUG INFORMATIE ===
    console.log('[MeldingZiekte] === DEBUGGING START ===');
    console.log('[MeldingZiekte] Fields aanwezig:', {
        ModalMedewerkerDisplay: !!medewerkerDisplayVeld,
        ModalMedewerkerIDDisplay: !!medewerkerIdDisplayVeld,
        MedewerkerID: !!verborgenMedewerkerIdVeld
    });
    console.log('[MeldingZiekte] Current context:', huidigeGebruikerZiekmeldingContext);
    console.log('[MeldingZiekte] Available alleMedewerkers:', window.alleMedewerkers ? window.alleMedewerkers.length : 'not available');
    
    if (!medewerkerDisplayVeld) {
        console.error('[MeldingZiekte] KRITIEKE FOUT: ModalMedewerkerDisplay veld niet gevonden!');
        return;
    }

    // === INVULLEN VAN MEDEWERKER INFORMATIE ===
    let foundEmployee = null;
    let displayName = '';
    let medewerkerId = '';
    
    if (!window.alleMedewerkers || window.alleMedewerkers.length === 0) {
        console.error('[MeldingZiekte] KRITIEKE FOUT: alleMedewerkers niet beschikbaar!');
        // Probeer alsnog met fallback waarden
        if (huidigeGebruikerZiekmeldingContext && huidigeGebruikerZiekmeldingContext.Title) {
            displayName = huidigeGebruikerZiekmeldingContext.Title;
            medewerkerId = huidigeGebruikerZiekmeldingContext.normalizedUsername || 'Onbekend';
            console.log('[MeldingZiekte] Fallback waarden gebruikt');
        }
    } else {
        // Zoek de medewerker in de lijst met verbeterde matching logica
        console.log('[MeldingZiekte] Searching for employee in Medewerkers list...');
        
        // Probeer verschillende methoden om de gebruiker te matchen
        const searchTerms = [
            huidigeGebruikerZiekmeldingContext.normalizedUsername,
            huidigeGebruikerZiekmeldingContext.loginNaam,
            huidigeGebruikerZiekmeldingContext.Username,
            // Remove domain prefix if present (i:0#.w|domain\user -> domain\user)
            huidigeGebruikerZiekmeldingContext.loginNaam ? huidigeGebruikerZiekmeldingContext.loginNaam.replace(/^i:0#\.w\|/, '') : null,
            // Extract just username part (domain\user -> user)
            huidigeGebruikerZiekmeldingContext.normalizedUsername ? huidigeGebruikerZiekmeldingContext.normalizedUsername.split('\\').pop() : null
        ].filter(term => term); // Remove null/undefined values
        
        console.log('[MeldingZiekte] Search terms for employee matching:', searchTerms);
        console.log('[MeldingZiekte] Available employee usernames:', window.alleMedewerkers.map(m => ({ Username: m.Username, Naam: m.Naam })));
        
        // Try exact matches first
        for (const searchTerm of searchTerms) {
            foundEmployee = window.alleMedewerkers.find(m => m.Username === searchTerm);
            if (foundEmployee) {
                console.log(`[MeldingZiekte] Found employee with exact match for "${searchTerm}":`, foundEmployee);
                break;
            }
        }
        
        // If no exact match, try partial matches
        if (!foundEmployee) {
            console.log('[MeldingZiekte] No exact match found, trying partial matches...');
            for (const searchTerm of searchTerms) {
                foundEmployee = window.alleMedewerkers.find(m => 
                    m.Username && (
                        m.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        searchTerm.toLowerCase().includes(m.Username.toLowerCase())
                    )
                );
                if (foundEmployee) {
                    console.log(`[MeldingZiekte] Found employee with partial match for "${searchTerm}":`, foundEmployee);
                    break;
                }
            }
        }
        
        if (foundEmployee) {
            // Gebruik specifiek het 'Naam' veld uit de Medewerkers lijst voor volledige naam
            displayName = foundEmployee.Naam;
            // Gebruik specifiek het 'Username' veld uit de Medewerkers lijst voor MedewerkerID  
            medewerkerId = foundEmployee.Username;
            
            console.log('[MeldingZiekte] Successfully matched employee:');
            console.log('[MeldingZiekte] - Naam field (for display):', displayName);
            console.log('[MeldingZiekte] - Username field (for ID):', medewerkerId);
        } else {
            console.warn('[MeldingZiekte] Employee not found in Medewerkers list after all matching attempts');
        }
    }
    
    // Fallback naar context eigenschappen indien niet gevonden in Medewerkers lijst
    if (!displayName || !medewerkerId) {
        console.warn('[MeldingZiekte] Employee not found in Medewerkers lijst, using fallback values');
        
        if (!displayName) {
            displayName = huidigeGebruikerZiekmeldingContext.Title || 
                         huidigeGebruikerZiekmeldingContext.displayName || 
                         huidigeGebruikerZiekmeldingContext.Naam ||
                         huidigeGebruikerZiekmeldingContext.normalizedUsername || 
                         'Onbekende gebruiker';
            console.log('[MeldingZiekte] Using fallback display name:', displayName);
        }
        
        if (!medewerkerId) {
            medewerkerId = huidigeGebruikerZiekmeldingContext.normalizedUsername || 
                          huidigeGebruikerZiekmeldingContext.loginNaam || 
                          huidigeGebruikerZiekmeldingContext.Username || 
                          'Onbekend';
            console.log('[MeldingZiekte] Using fallback medewerker ID:', medewerkerId);
        }
    }
    
    // Vul de velden in op basis van UI configuratie
    console.log('[MeldingZiekte] === INVULLEN VAN VELDEN ===');
    console.log('[MeldingZiekte] Te gebruiken waarden:', { displayName, medewerkerId, isSuperUser });
    
    if (!isSuperUser) {
        // Gewone gebruiker: vul readonly velden in
        if (medewerkerDisplayVeld) {
            medewerkerDisplayVeld.value = displayName || 'Onbekende gebruiker';
            console.log('[MeldingZiekte] ✓ ModalMedewerkerDisplay ingevuld voor gewone gebruiker:', medewerkerDisplayVeld.value);
        }
        if (medewerkerIdDisplayVeld) {
            medewerkerIdDisplayVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingZiekte] ✓ ModalMedewerkerIDDisplay ingevuld:', medewerkerIdDisplayVeld.value);
        }
        if (verborgenMedewerkerIdVeld) {
            verborgenMedewerkerIdVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingZiekte] ✓ MedewerkerID hidden field ingevuld:', verborgenMedewerkerIdVeld.value);
        }
    } else {
        // Super-user: dropdown is al gevuld, initiële waarden zetten
        if (medewerkerIdDisplayVeld) {
            medewerkerIdDisplayVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingZiekte] ✓ ModalMedewerkerIDDisplay ingevuld voor super-user:', medewerkerIdDisplayVeld.value);
        }
        if (verborgenMedewerkerIdVeld) {
            verborgenMedewerkerIdVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingZiekte] ✓ MedewerkerID hidden field ingevuld voor super-user:', verborgenMedewerkerIdVeld.value);
        }
    }
    
    console.log('[MeldingZiekte] === INVULLEN VOLTOOID ===');

    if (isEditMode) {
        // --- BEWERK MODUS ---
        titleInput.value = itemData.Title || `Ziekmelding Bewerken`;
        aanvraagTijdstipInput.value = new Date(itemData.AanvraagTijdstip || Date.now()).toISOString();
        
        startDatePicker.value = new Date(itemData.StartDatum).toISOString().split('T')[0];
        startTimePicker.value = new Date(itemData.StartDatum).toTimeString().slice(0, 5);
        endDatePicker.value = new Date(itemData.EindDatum).toISOString().split('T')[0];
        endTimePicker.value = new Date(itemData.EindDatum).toTimeString().slice(0, 5);
        
        omschrijvingTextarea.value = itemData.Omschrijving || '';

        // Laad redenen en selecteer de juiste
        await laadZiekteRedenId(itemData.RedenId);
    } else {
        // --- NIEUW MODUS ---
        const vandaag = new Date();
        const datumString = vandaag.toLocaleDateString('nl-NL');
        titleInput.value = `Ziekmelding ${displayName} - ${datumString}`;
        aanvraagTijdstipInput.value = vandaag.toISOString();
        
        // Use selected date range from context menu or FAB
        let initStartDatum, initEindDatum;
        
        if (window.ziekmeldingModalStartDate && window.ziekmeldingModalEndDate) {
            // Use dates from selection (context menu or other selection)
            initStartDatum = new Date(window.ziekmeldingModalStartDate);
            initEindDatum = new Date(window.ziekmeldingModalEndDate);
            console.log('[MeldingZiekte] Using selected date range:', { start: initStartDatum, end: initEindDatum });
        } else if (geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum)) {
            // Use passed date as both start and end
            initStartDatum = new Date(geselecteerdeDatum);
            initEindDatum = new Date(geselecteerdeDatum);
            console.log('[MeldingZiekte] Using passed date:', initStartDatum);
        } else {
            // Fallback to today
            initStartDatum = new Date();
            initEindDatum = new Date();
            console.log('[MeldingZiekte] Using fallback (today):', initStartDatum);
        }

        const initStartDatumISO = initStartDatum.toISOString().split('T')[0];
        const initEindDatumISO = initEindDatum.toISOString().split('T')[0];

        startDatePicker.value = initStartDatumISO;
        endDatePicker.value = initEindDatumISO;
        startTimePicker.value = "09:00";
        endTimePicker.value = "17:00";
        omschrijvingTextarea.value = '';

        // Clear the global date variables after use
        window.ziekmeldingModalStartDate = null;
        window.ziekmeldingModalEndDate = null;

        // Laad redenen zonder een specifieke selectie
        await laadZiekteRedenId();
    }

    console.log("[MeldingZiekte] Gebruikersinfo en datums ingesteld voor ziekmelding modal.");
}

/**
 * Haalt het ID van de "Ziekte" reden uit de Verlofredenen lijst.
 * @param {string|number} specificRedenId - Optioneel: specifiek reden ID voor bewerkmodus
 */
async function laadZiekteRedenId(specificRedenId = null) {
    const redenIdInput = document.getElementById('RedenId');
    
    // Als er een specifieke reden ID is opgegeven (bewerkmodus), gebruik die
    if (specificRedenId && redenIdInput) {
        redenIdInput.value = String(specificRedenId);
        console.log("[MeldingZiekte] Specifieke reden ID ingesteld voor bewerkmodus:", specificRedenId);
        return;
    }
    
    if (ziekteRedenId && redenIdInput) { // Als al geladen en input bestaat
        console.log("[MeldingZiekte] ID voor 'Ziekte' reden al geladen:", ziekteRedenId);
        redenIdInput.value = String(ziekteRedenId); // Ensure it's always a string
        return;
    }
    console.log("[MeldingZiekte] Laden van ID voor verlofreden 'Ziekte'...");

    const redenenConfigKey = 'Verlofredenen';
    const redenenConfig = typeof window.getLijstConfig === 'function' ? window.getLijstConfig(redenenConfigKey) : null;
    if (!redenenConfig || !(redenenConfig.lijstId || redenenConfig.lijstTitel)) {
        console.error(`[MeldingZiekte] Configuratie voor '${redenenConfigKey}' lijst niet gevonden of incompleet (lijstId/lijstTitel ontbreekt). Controleer of configLijst.js correct is geladen en getLijstConfig werkt.`);
        toonNotificatieInZiekmeldingModal("Kon configuratie voor verlofredenen niet laden.", "error", false);
        ziekteRedenId = null; // Zorg dat het null is bij fout
        if (redenIdInput) redenIdInput.value = ''; // Maak veld leeg
        return;
    }

    // Try to find by exact title
    const filterQuery = `$filter=Title eq 'Ziekte'`;
    const selectQuery = "$select=ID,Title";

    try {
        if (typeof window.getLijstItemsAlgemeen !== 'function') {
            console.error("[MeldingZiekte] Functie getLijstItemsAlgemeen is niet beschikbaar.");
            throw new Error("Benodigde datafunctie ontbreekt.");
        }
        let redenen = await window.getLijstItemsAlgemeen(redenenConfigKey, selectQuery, filterQuery);

        // If exact match not found, try a wider search
        if (!redenen || redenen.length === 0) {
            console.warn("[MeldingZiekte] Exact match voor 'Ziekte' niet gevonden, probeer een bredere zoekopdracht...");
            const broaderFilterQuery = `$filter=substringof('Ziekte', Title)`;
            redenen = await window.getLijstItemsAlgemeen(redenenConfigKey, selectQuery, broaderFilterQuery);
        }

        if (redenen && redenen.length > 0) {
            const ziekteReden = redenen[0];
            ziekteRedenId = ziekteReden.ID;
            console.log(`[MeldingZiekte] ID voor 'Ziekte' succesvol geladen: ${ziekteRedenId} (Title: "${ziekteReden.Title}")`);
            if (redenIdInput) redenIdInput.value = String(ziekteRedenId);
        } else {
            console.warn("[MeldingZiekte] Kon geen redenen vinden die overeenkomen met 'Ziekte'. Controleer of de Verlofredenen lijst correct is ingesteld.");
            ziekteRedenId = null;
            if (redenIdInput) redenIdInput.value = '';
        }
    } catch (error) {
        console.error('[MeldingZiekte] Fout bij ophalen ID voor verlofreden "Ziekte":', error);
        toonNotificatieInZiekmeldingModal('Kon standaard reden niet laden. Probeer het later opnieuw.', 'error', false);
        ziekteRedenId = null;
        if (redenIdInput) redenIdInput.value = '';
    }
}

/**
 * Controleert of de huidige gebruiker lid is van super-user groepen (kan voor anderen ziekmelding doen)
 */
function isUserPrivilegedGroupZiekmelding() {
    if (!window.huidigeGebruiker || !window.huidigeGebruiker.sharePointGroepen) {
        console.log('[MeldingZiekte] Geen SharePoint groepsinformatie beschikbaar, gebruiker is geen super-user');
        return false;
    }

    const privilegedGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars", "2.3. Senioren beoordelen"];
    const hasPrivilegedAccess = window.huidigeGebruiker.sharePointGroepen.some(groep => 
        privilegedGroups.some(privilegedGroup => 
            groep.toLowerCase().includes(privilegedGroup.toLowerCase())
        )
    );
    
    console.log('[MeldingZiekte] Gebruiker groepslidmaatschap check:', {
        userGroups: window.huidigeGebruiker.sharePointGroepen,
        privilegedGroups: privilegedGroups,
        hasPrivilegedAccess: hasPrivilegedAccess
    });
    
    return hasPrivilegedAccess;
}

/**
 * Controleert of de gebruiker een super-user is die voor anderen mag melden
 */
function isUserSuperUser() {
    return isUserPrivilegedGroupZiekmelding();
}

/**
 * Controleert of de gebruiker ziekmelding voor zichzelf mag doen
 * Iedereen mag voor zichzelf ziekmelding doen (zowel gewone gebruikers als super-users)
 */
function canUserReportSickForSelf() {
    // Alle gebruikers mogen voor zichzelf ziekmelding doen
    console.log('[MeldingZiekte] Ziekmelding controle: Alle gebruikers mogen voor zichzelf ziekmelding doen');
    return true;
}

/**
 * Vult de medewerker dropdown voor super-users
 * @param {HTMLSelectElement} selectElement - Het dropdown element
 * @param {Object} selectedEmployee - De momenteel geselecteerde medewerker
 */
async function populateEmployeeDropdownZiekmelding(selectElement, selectedEmployee = null) {
    if (!selectElement || !window.alleMedewerkers) {
        console.warn('[MeldingZiekte] Kan dropdown niet vullen: element of data ontbreekt');
        return;
    }

    // Clear existing options (except first default option)
    selectElement.innerHTML = '<option value="">Selecteer medewerker...</option>';

    // Add all employees to dropdown
    window.alleMedewerkers.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.Username;
        option.textContent = employee.Naam;
        option.dataset.employeeData = JSON.stringify(employee);
        
        // Select current employee if this matches
        if (selectedEmployee && (
            employee.Username === selectedEmployee.normalizedUsername ||
            employee.Username === selectedEmployee.Username ||
            employee.Naam === selectedEmployee.Title ||
            employee.Naam === selectedEmployee.displayName
        )) {
            option.selected = true;
        }
        
        selectElement.appendChild(option);
    });

    // Add event listener for dropdown changes
    selectElement.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value && selectedOption.dataset.employeeData) {
            const employeeData = JSON.parse(selectedOption.dataset.employeeData);
            updateEmployeeFieldsZiekmelding(employeeData.Naam, employeeData.Username);
        } else {
            // Clear fields if no selection
            updateEmployeeFieldsZiekmelding('', '');
        }
    });

    console.log('[MeldingZiekte] Dropdown gevuld met', window.alleMedewerkers.length, 'medewerkers');
}

/**
 * Werkt de medewerker velden bij
 * @param {string} displayName - Naam om weer te geven
 * @param {string} username - Gebruikersnaam/ID
 */
function updateEmployeeFieldsZiekmelding(displayName, username) {
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay');
    const verborgenMedewerkerIdVeld = document.getElementById('MedewerkerID');
    
    if (medewerkerIdDisplayVeld) {
        medewerkerIdDisplayVeld.value = username;
    }
    if (verborgenMedewerkerIdVeld) {
        verborgenMedewerkerIdVeld.value = username;
    }
    
    console.log('[MeldingZiekte] Medewerker velden bijgewerkt:', { displayName, username });
}

/**
 * Verzend de ziekmelding naar SharePoint
 */
async function submitZiekmelding(event) {
    if (event) event.preventDefault();
    console.log("[MeldingZiekte] Poging tot opslaan ziekmelding...");

    // Validatie
    const startDatePicker = document.getElementById('ModalStartDatePicker');
    if (!startDatePicker || !startDatePicker.value) {
        toonNotificatieInZiekmeldingModal("Startdatum is verplicht.", "error");
        return;
    }    // Prepare data structure matching the working version
    const titleInput = document.getElementById('Title');
    const medewerkerDisplayInput = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerIdInput = document.getElementById('MedewerkerID');
    const aanvraagTijdstipInput = document.getElementById('AanvraagTijdstip');
    const startTimePicker = document.getElementById('ModalStartTimePicker');
    const endTimePicker = document.getElementById('ModalEndTimePicker');
    const endDatePicker = document.getElementById('ModalEndDatePicker');
    const omschrijvingTextarea = document.getElementById('ModalOmschrijving');

    // Combineer datum en tijd EERST voordat we formData maken
    const startDateTime = new Date(`${startDatePicker.value}T${startTimePicker?.value || '09:00'}:00`);
    const endDateTime = new Date(`${endDatePicker?.value || startDatePicker.value}T${endTimePicker?.value || '17:00'}:00`);

    // Create form data structure that matches working version exactly
    const formData = {
        Title: titleInput?.value || `Ziekmelding ${new Date().toLocaleDateString('nl-NL')}`,
        Medewerker: medewerkerDisplayInput?.value || 'Onbekende Medewerker', // This field was missing!
        MedewerkerID: medewerkerIdInput?.value,
        AanvraagTijdstip: aanvraagTijdstipInput?.value || new Date().toISOString(),
        StartDatum: startDateTime.toISOString(),
        EindDatum: endDateTime.toISOString(),
        Omschrijving: omschrijvingTextarea?.value || '',
        Reden: 'Ziekte',
        RedenId: ziekteRedenId ? String(ziekteRedenId) : '', // Ensure string conversion
        Status: 'Nieuw'
    };

    // Verwijder lege velden
    Object.keys(formData).forEach(key => {
        if (formData[key] === null || formData[key] === undefined || formData[key] === '') {
            delete formData[key];
        }
    });    // SharePoint metadata - use the pattern from working version
    const verlofListConfig = typeof window.getLijstConfig === 'function' ? window.getLijstConfig('Verlof') : null;
    if (!verlofListConfig) {
        throw new Error('Kon configuratie voor Verlof lijst niet vinden');
    }
    
    // Use the exact same pattern as the working version: underscore replacement
    const listNameForMetadata = verlofListConfig.lijstTitel.replace(/\s+/g, '_');
    formData.__metadata = { type: `SP.Data.${listNameForMetadata}ListItem` };

    console.log("[MeldingZiekte] Voorbereide data voor SharePoint:", JSON.stringify(formData, null, 2));

    const submitButton = document.getElementById('modal-action-button') || document.getElementById('submitZiekmeldingBtnStandalone');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Opslaan...';
    }

    try {        const digest = await getRequestDigestZiekmelding();
        const verlofListConfig = typeof window.getLijstConfig === 'function' ? window.getLijstConfig('Verlof') : null;
        if (!verlofListConfig) {
            throw new Error('Kon configuratie voor Verlof lijst niet vinden');
        }
        const lijstNaam = verlofListConfig.lijstTitel;

        const response = await fetch(`${spWebAbsoluteUrlZiekmelding.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstNaam}')/items`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': digest
            },
            body: JSON.stringify(formData)
        });

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Melding Opslaan';
        }

        if (response.ok) {
            const responseData = await response.json();
            console.log("[MeldingZiekte] Ziekmelding succesvol opgeslagen:", responseData);
            toonNotificatieInZiekmeldingModal("Ziekmelding succesvol opgeslagen.", "success");
            if (typeof window.refreshCalendarData === 'function') {
                window.refreshCalendarData();
            }
            if (typeof closeModal === 'function') closeModal();
        } else {
            const errorData = await response.json().catch(() => ({ error: { message: { value: "Onbekende serverfout bij opslaan." } } }));
            const errorMessage = errorData.error && errorData.error.message ? errorData.error.message.value : `Fout ${response.status}: ${response.statusText}`;
            console.error("[MeldingZiekte] Fout bij opslaan ziekmelding:", errorMessage, errorData);
            toonNotificatieInZiekmeldingModal(`Fout bij opslaan: ${errorMessage}`, "error", false);
        }
    } catch (error) {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Melding Opslaan';
        }
        console.error("[MeldingZiekte] Kritieke fout bij opslaan ziekmelding:", error);
        toonNotificatieInZiekmeldingModal(`Kritieke fout: ${error.message}`, "error", false);
    }
}



// Test functies voor debugging - Mirror verlof logic test functions
window.forceVulZiekmeldingVelden = function() {
    console.log('=== FORCE FILL ZIEKMELDING VELDEN ===');
    
    const medewerkerDisplayVeld = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay');
    const verborgenMedewerkerIdVeld = document.getElementById('MedewerkerID');
    
    if (!medewerkerDisplayVeld) {
        console.error('Ziekmelding modal is niet open of ModalMedewerkerDisplay veld niet gevonden');
        return;
    }
    
    let naam = 'Test Gebruiker';
    let username = 'test\\gebruiker';
    
    // Probeer echte waarden als beschikbaar
    if (window.huidigeGebruiker) {
        naam = window.huidigeGebruiker.Title || naam;
        username = window.huidigeGebruiker.normalizedUsername || username;
    }
    
    // Probeer uit Medewerkers lijst
    if (window.alleMedewerkers && window.alleMedewerkers.length > 0) {
        const found = window.alleMedewerkers.find(m => 
            m.Username === window.huidigeGebruiker?.normalizedUsername ||
            m.Username === window.huidigeGebruiker?.loginNaam?.replace(/^i:0#\.w\|/, '')
        );
        
        if (found) {
            naam = found.Naam || naam;
            username = found.Username || username;
            console.log('Gevonden in Medewerkers lijst:', found);
        } else {
            console.log('Niet gevonden in Medewerkers lijst, gebruik fallback waarden');
        }
    }
    
    // Vul velden in
    medewerkerDisplayVeld.value = naam;
    if (medewerkerIdDisplayVeld) medewerkerIdDisplayVeld.value = username;
    if (verborgenMedewerkerIdVeld) verborgenMedewerkerIdVeld.value = username;
    
    console.log('Velden ingevuld:', { naam, username });
    console.log('=== EINDE FORCE FILL ===');
};

window.debugZiekmeldingMedewerkerMatching = function() {
    console.log('=== DEBUG ZIEKMELDING MEDEWERKER MATCHING ===');
    console.log('huidigeGebruiker:', window.huidigeGebruiker);
    console.log('alleMedewerkers count:', window.alleMedewerkers ? window.alleMedewerkers.length : 'not available');
    
    if (window.alleMedewerkers && window.alleMedewerkers.length > 0) {
        console.log('Sample employee:', window.alleMedewerkers[0]);
        window.alleMedewerkers.forEach((emp, index) => {
            console.log(`Employee ${index + 1}: Username="${emp.Username}", Naam="${emp.Naam}"`);
        });
    }
    
    if (window.huidigeGebruiker) {
        const searchTerms = [
            window.huidigeGebruiker.normalizedUsername,
            window.huidigeGebruiker.loginNaam,
            window.huidigeGebruiker.loginNaam ? window.huidigeGebruiker.loginNaam.replace(/^i:0#\.w\|/, '') : null
        ].filter(term => term);
        
        console.log('Search terms:', searchTerms);
        
        searchTerms.forEach(term => {
            const found = window.alleMedewerkers?.find(m => m.Username === term);
            console.log(`Searching for "${term}": ${found ? 'FOUND' : 'NOT FOUND'}`, found);
        });
    }
    console.log('=== END DEBUG ===');
};

window.testZiekmeldingSuperUserStatus = function() {
    console.log('=== ZIEKMELDING SUPER-USER STATUS TEST ===');
    
    const isSuperUser = isUserSuperUser();
    const canReport = canUserReportSickForSelf();
    
    console.log('Current user:', window.huidigeGebruiker);
    console.log('Is super-user:', isSuperUser);
    console.log('Can report sick for self:', canReport);
    console.log('SharePoint groups:', window.huidigeGebruiker?.sharePointGroepen);
    
    return { isSuperUser, canReport };
};

// Emergency functie om medewerker velden zichtbaar te maken
window.toonZiekmeldingMedewerkerVelden = function() {
    console.log('=== FORCE SHOW ZIEKMELDING MEDEWERKER VELDEN ===');
    
    const medewerkerDisplayVeld = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerSelectVeld = document.getElementById('ModalMedewerkerSelect');
    
    if (medewerkerDisplayVeld) {
        medewerkerDisplayVeld.classList.remove('hidden');
        medewerkerDisplayVeld.style.display = '';
        medewerkerDisplayVeld.style.visibility = 'visible';
        console.log('✓ ModalMedewerkerDisplay zichtbaar gemaakt');
    } else {
        console.error('✗ ModalMedewerkerDisplay niet gevonden');
    }
    
    if (medewerkerSelectVeld) {
        medewerkerSelectVeld.classList.add('hidden');
        console.log('✓ ModalMedewerkerSelect verborgen');
    } else {
        console.error('✗ ModalMedewerkerSelect niet gevonden');
    }
    
    // Force vul het veld
    if (medewerkerDisplayVeld && window.huidigeGebruiker) {
        const naam = window.huidigeGebruiker.Title || 'Huidige Gebruiker';
        medewerkerDisplayVeld.value = naam;
        console.log('✓ Veld ingevuld met:', naam);
    }
    
    console.log('=== EINDE FORCE SHOW ===');
};

// Export functions to global window object for modal access
window.initializeZiekmeldingModal = initializeZiekmeldingModal;
window.submitZiekmelding = submitZiekmelding;

console.log("Rooster/pages/js/meldingZiekte_logic.js geladen - ziekmelding velden automatische invulling en super-user functionaliteit geïmplementeerd.");

window.determineZiekteEmailRecipients = function(originalRecipients) {
    switch (ziekteEmailMode) {
        case 0:
            console.log('[MeldingZiekte] Email mode 0: Ziekte emails uitgeschakeld');
            return {
                shouldSend: false,
                recipients: [],
                isDebug: false,
                debugInfo: 'Ziekte emails zijn uitgeschakeld (mode 0)'
            };
            
        case 1:
            console.log('[MeldingZiekte] Email mode 1: Ziekte emails naar seniors');
            return {
                shouldSend: true,
                recipients: originalRecipients,
                isDebug: false,
                debugInfo: `Ziekte emails naar ${originalRecipients.length} seniors`
            };
            
        case 9:
            console.log(`[MeldingZiekte] Email mode 9: Ziekte emails debug mode naar ${ziekteEmailDebugRecipient}`);
            return {
                shouldSend: true,
                recipients: [ziekteEmailDebugRecipient],
                isDebug: true,
                originalRecipients: originalRecipients,
                debugInfo: `Debug mode: ziekte emails naar ${ziekteEmailDebugRecipient}`
            };
            
        default:
            console.warn(`[MeldingZiekte] Onbekende email mode: ${ziekteEmailMode}. Emails uitgeschakeld.`);
            return {
                shouldSend: false,
                recipients: [],
                isDebug: false,
                debugInfo: `Onbekende mode ${ziekteEmailMode} - emails uitgeschakeld`
            };
    }
}

/**
 * Verzend ziekmelding notificatie email
 */
async function verzendZiekteNotificatieEmail(formData, medewerkerContext) {
    try {
        // Get potential recipients
        const seniorsEmails = await getEmailAddressesFromSeniors();
        
        if (!seniorsEmails || seniorsEmails.length === 0) {
            console.warn('[MeldingZiekte] Geen senior email adressen gevonden');
            return;
        }
        
        // Determine if and where to send based on mode
        const emailConfig = determineZiekteEmailRecipients(seniorsEmails);
        
        if (!emailConfig.shouldSend) {
            console.log(`[MeldingZiekte] Email niet verzonden: ${emailConfig.debugInfo}`);
            return;
        }
        
        // Prepare email content
        const subject = `Nieuwe Ziekmelding: ${medewerkerContext.Title || 'Onbekende medewerker'}`;
        const body = `
            <h3>Nieuwe Ziekmelding Ontvangen</h3>
            <table style="border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Medewerker:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${medewerkerContext.Title}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Startdatum:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(formData.StartDatum).toLocaleDateString('nl-NL')}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Einddatum:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(formData.EindDatum).toLocaleDateString('nl-NL')}</td></tr>
            </table>
            <p><em>Deze melding is automatisch gegenereerd door het Verlofrooster systeem.</em></p>
        `;
        
        // Send email via mailSysteem utility
        await verzendEmail(
            emailConfig.recipients,
            subject,
            body,
            emailConfig.isDebug,
            emailConfig.originalRecipients || []
        );
        
        console.log(`[MeldingZiekte] ${emailConfig.debugInfo}`);
        
    } catch (error) {
        console.error('[MeldingZiekte] Fout bij verzenden ziekmelding email:', error);
        // Don't throw - email failure shouldn't break the main process
    }
}

/* Add this to both meldingVerlof_logic.js and meldingZiekte_logic.js */

window.debugFieldPopulation = function() {
    console.log('=== DEBUG FIELD POPULATION ===');
    console.log('Current user context:', window.huidigeGebruiker);
    console.log('alleMedewerkers available:', !!window.alleMedewerkers);
    console.log('alleMedewerkers count:', window.alleMedewerkers?.length);
    
    // Check form fields
    const fields = {
        ModalMedewerkerDisplay: document.getElementById('ModalMedewerkerDisplay'),
        ModalMedewerkerIDDisplay: document.getElementById('ModalMedewerkerIDDisplay'),
        MedewerkerID: document.getElementById('MedewerkerID'),
        ModalStartDatePicker: document.getElementById('ModalStartDatePicker'),
        ModalEndDatePicker: document.getElementById('ModalEndDatePicker')
    };
    
    Object.entries(fields).forEach(([name, element]) => {
        console.log(`${name}:`, {
            exists: !!element,
            value: element?.value,
            visible: element ? !element.classList.contains('hidden') : false
        });
    });
    
    // Check global date variables
    console.log('Global date variables:', {
        verlofModalStartDate: window.verlofModalStartDate,
        verlofModalEndDate: window.verlofModalEndDate,
        ziekmeldingModalStartDate: window.ziekmeldingModalStartDate,
        ziekmeldingModalEndDate: window.ziekmeldingModalEndDate
    });
    
    console.log('=== END DEBUG ===');
};