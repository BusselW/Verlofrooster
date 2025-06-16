// js/meldingVerlof_logic.js

/**
 * Logica voor de Verlof aanvragen functionaliteit, specifiek wanneer deze
 * binnen een modal wordt geladen vanuit het hoofd verlofrooster.
 * 
 * Features:
 * - Automatische medewerker context detectie
 * - Super-user functionaliteit (voor anderen verlof aanvragen)
 * - Gewone gebruikers (alleen voor zichzelf)
 * - Datum selectie integratie met FAB en contextmenu
 * - Debugging en test functies
 */

// Globale variabelen specifiek voor de verlofmodal context
let spWebAbsoluteUrlVerlof; // Wordt gezet bij initialisatie van de modal
let huidigeGebruikerVerlofContext = { // Wordt gevuld bij het openen van de modal
    loginNaam: "", // Volledige SharePoint loginnaam (bijv. i:0#.w|domein\gebruiker)
    displayName: "", // Weergavenaam (bijv. Achternaam, Voornaam (Afdeling))
    normalizedUsername: "", // Gebruikersnaam zonder prefix (bijv. domein\gebruiker of gebruiker)
    email: "", // Zorg dat dit veld gevuld wordt bij initialisatie!
    id: null, // SharePoint User ID
    medewerkerNaamVolledig: "" // Veld voor "Voornaam Achternaam"
};
let verlofVakantieRedenId = null; // ID van de "Verlof/vakantie" reden uit de Verlofredenen lijst

// --- Configuration for Email Logic ---
const verlofEmailDebugMode = false; // SET TO true FOR DEBUGGING (all mails to debugRecipient)
const verlofEmailDebugRecipient = "w.van.bussel@om.nl";
// --- End Configuration ---

/**
 * Haalt een X-RequestDigest op, nodig voor POST/PUT/DELETE operaties.
 * @returns {Promise<string>} De request digest waarde.
 */
async function getRequestDigestVerlof() {
    if (!spWebAbsoluteUrlVerlof) {
        console.error("[MeldingVerlof] SharePoint site URL (spWebAbsoluteUrlVerlof) is niet ingesteld.");
        throw new Error('SharePoint site URL is niet geconfigureerd voor request digest.');
    }
    console.log("[MeldingVerlof] Ophalen Request Digest van:", `${spWebAbsoluteUrlVerlof}/_api/contextinfo`);
    const response = await fetch(`${spWebAbsoluteUrlVerlof}/_api/contextinfo`, {
        method: 'POST',
        headers: { 'Accept': 'application/json;odata=verbose' }
    });
    if (!response.ok) {
        const errorTekst = await response.text().catch(() => "Onbekende serverfout");
        console.error("[MeldingVerlof] Fout bij ophalen request digest:", response.status, errorTekst);
        throw new Error(`Kon request digest niet ophalen: ${response.status} - ${errorTekst.substring(0, 100)}`);
    }
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
}

/**
 * Toont een notificatie in de verlofmodal.
 * @param {string} berichtHTML - De HTML van het bericht.
 * @param {string} type - Het type notificatie (success, error, warning, info).
 * @param {number|boolean} autoHideDelay - Vertraging in ms voor auto-verbergen, of false om niet te verbergen.
 */
function toonNotificatieInVerlofModal(berichtHTML, type = 'info', autoHideDelay = 7000) {
    // Probeer eerst de modal-specifieke notificatiefunctie
    if (typeof toonModalNotificatie === 'function') {
        toonModalNotificatie(berichtHTML, type, autoHideDelay);
    } else if (typeof toonNotificatie === 'function') {
        // Fallback naar globale notificatiefunctie
        toonNotificatie(berichtHTML, type);
    } else {
        // Laatste fallback: console log
        console.log(`[MeldingVerlof] ${type.toUpperCase()}: ${berichtHTML}`);
    }
}

/**
 * Initialiseert het verlofaanvraagformulier in de modal.
 * @param {Date} geselecteerdeDatum - De datum die geselecteerd is voor het verlof.
 * @param {Object} medewerkerContext - Context van de medewerker voor wie het verlof wordt aangevraagd.
 * @param {Object} itemData - Optioneel: bestaande verlofgegevens voor bewerkingsmodus.
 */
async function initializeVerlofModalForm(geselecteerdeDatum, medewerkerContext, itemData = null) {
    const isEditMode = itemData !== null;
    console.log(`[MeldingVerlof] Initialiseren formulier. Modus: ${isEditMode ? 'Bewerken' : 'Nieuw'}.`);

    spWebAbsoluteUrlVerlof = window.spWebAbsoluteUrl;
    if (!spWebAbsoluteUrlVerlof) {
        toonNotificatieInVerlofModal("Kritieke fout: Serverlocatie onbekend.", "error", false);
        return;
    }    // Bepaal voor wie het verlof wordt aangevraagd
    let targetMedewerkerContext;
    const isSuperUser = isUserSuperUser();
      console.log('[MeldingVerlof] Initialisatie context:', {
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
        // Super-user vraagt verlof aan voor een andere medewerker
        targetMedewerkerContext = medewerkerContext;
        console.log('[MeldingVerlof] Super-user vraagt verlof aan voor andere medewerker:', targetMedewerkerContext);
    } else {
        // Gewone gebruiker OF super-user vraagt verlof voor zichzelf aan
        targetMedewerkerContext = window.huidigeGebruiker;
        console.log('[MeldingVerlof] Verlof wordt aangevraagd voor de ingelogde gebruiker:', targetMedewerkerContext);
    }
    
    huidigeGebruikerVerlofContext = targetMedewerkerContext;
    
    if (!huidigeGebruikerVerlofContext || !(huidigeGebruikerVerlofContext.normalizedUsername || huidigeGebruikerVerlofContext.loginNaam)) {
        toonNotificatieInVerlofModal("Gebruikersinformatie kon niet worden geladen.", "error", false);
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
        console.log('[MeldingVerlof] Configureer UI voor super-user');
        if (medewerkerDisplayVeld) {
            medewerkerDisplayVeld.classList.add('hidden');
        }
        if (medewerkerSelectVeld) {
            medewerkerSelectVeld.classList.remove('hidden');
            await populateEmployeeDropdown(medewerkerSelectVeld, targetMedewerkerContext);
        }
    } else {
        // Gewone gebruiker: toon readonly veld, verberg dropdown
        console.log('[MeldingVerlof] Configureer UI voor gewone gebruiker');
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
    console.log('[MeldingVerlof] === DEBUGGING START ===');
    console.log('[MeldingVerlof] Fields aanwezig:', {
        ModalMedewerkerDisplay: !!medewerkerDisplayVeld,
        ModalMedewerkerIDDisplay: !!medewerkerIdDisplayVeld,
        MedewerkerID: !!verborgenMedewerkerIdVeld
    });
    console.log('[MeldingVerlof] Current context:', huidigeGebruikerVerlofContext);
    console.log('[MeldingVerlof] Available alleMedewerkers:', window.alleMedewerkers ? window.alleMedewerkers.length : 'not available');
    
    if (!medewerkerDisplayVeld) {
        console.error('[MeldingVerlof] KRITIEKE FOUT: ModalMedewerkerDisplay veld niet gevonden!');
        return;
    }
      // === INVULLEN VAN MEDEWERKER INFORMATIE ===
    let foundEmployee = null;
    let displayName = '';
    let medewerkerId = '';
    
    if (!window.alleMedewerkers || window.alleMedewerkers.length === 0) {
        console.error('[MeldingVerlof] KRITIEKE FOUT: alleMedewerkers niet beschikbaar!');
        // Probeer alsnog met fallback waarden
        if (huidigeGebruikerVerlofContext && huidigeGebruikerVerlofContext.Title) {
            displayName = huidigeGebruikerVerlofContext.Title;
            medewerkerId = huidigeGebruikerVerlofContext.normalizedUsername || 'Onbekend';
            console.log('[MeldingVerlof] Fallback waarden gebruikt');
        }
    } else {
        // Zoek de medewerker in de lijst met verbeterde matching logica
        console.log('[MeldingVerlof] Searching for employee in Medewerkers list...');
        
        // Probeer verschillende methoden om de gebruiker te matchen
        const searchTerms = [
            huidigeGebruikerVerlofContext.normalizedUsername,
            huidigeGebruikerVerlofContext.loginNaam,
            huidigeGebruikerVerlofContext.Username,
            // Remove domain prefix if present (i:0#.w|domain\user -> domain\user)
            huidigeGebruikerVerlofContext.loginNaam ? huidigeGebruikerVerlofContext.loginNaam.replace(/^i:0#\.w\|/, '') : null,
            // Extract just username part (domain\user -> user)
            huidigeGebruikerVerlofContext.normalizedUsername ? huidigeGebruikerVerlofContext.normalizedUsername.split('\\').pop() : null
        ].filter(term => term); // Remove null/undefined values
        
        console.log('[MeldingVerlof] Search terms for employee matching:', searchTerms);
        console.log('[MeldingVerlof] Available employee usernames:', window.alleMedewerkers.map(m => ({ Username: m.Username, Naam: m.Naam })));
        
        // Try exact matches first
        for (const searchTerm of searchTerms) {
            foundEmployee = window.alleMedewerkers.find(m => m.Username === searchTerm);
            if (foundEmployee) {
                console.log(`[MeldingVerlof] Found employee with exact match for "${searchTerm}":`, foundEmployee);
                break;
            }
        }
        
        // If no exact match, try partial matches
        if (!foundEmployee) {
            console.log('[MeldingVerlof] No exact match found, trying partial matches...');
            for (const searchTerm of searchTerms) {
                foundEmployee = window.alleMedewerkers.find(m => 
                    m.Username && (
                        m.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        searchTerm.toLowerCase().includes(m.Username.toLowerCase())
                    )
                );
                if (foundEmployee) {
                    console.log(`[MeldingVerlof] Found employee with partial match for "${searchTerm}":`, foundEmployee);
                    break;
                }
            }
        }
        
        if (foundEmployee) {
            // Gebruik specifiek het 'Naam' veld uit de Medewerkers lijst voor volledige naam
            displayName = foundEmployee.Naam;
            // Gebruik specifiek het 'Username' veld uit de Medewerkers lijst voor MedewerkerID  
            medewerkerId = foundEmployee.Username;
            
            console.log('[MeldingVerlof] Successfully matched employee:');
            console.log('[MeldingVerlof] - Naam field (for display):', displayName);
            console.log('[MeldingVerlof] - Username field (for ID):', medewerkerId);
        } else {
            console.warn('[MeldingVerlof] Employee not found in Medewerkers list after all matching attempts');
        }
    }
    
    // Fallback naar context eigenschappen indien niet gevonden in Medewerkers lijst
    if (!displayName || !medewerkerId) {
        console.warn('[MeldingVerlof] Employee not found in Medewerkers lijst, using fallback values');
        
        if (!displayName) {
            displayName = huidigeGebruikerVerlofContext.Title || 
                         huidigeGebruikerVerlofContext.displayName || 
                         huidigeGebruikerVerlofContext.Naam ||
                         huidigeGebruikerVerlofContext.normalizedUsername || 
                         'Onbekende gebruiker';
            console.log('[MeldingVerlof] Using fallback display name:', displayName);
        }
        
        if (!medewerkerId) {
            medewerkerId = huidigeGebruikerVerlofContext.normalizedUsername || 
                          huidigeGebruikerVerlofContext.loginNaam || 
                          huidigeGebruikerVerlofContext.Username || 
                          'Onbekend';
            console.log('[MeldingVerlof] Using fallback medewerker ID:', medewerkerId);
        }
    }
    
    // Vul de velden in op basis van UI configuratie
    console.log('[MeldingVerlof] === INVULLEN VAN VELDEN ===');
    console.log('[MeldingVerlof] Te gebruiken waarden:', { displayName, medewerkerId, isSuperUser });
    
    if (!isSuperUser) {
        // Gewone gebruiker: vul readonly velden in
        if (medewerkerDisplayVeld) {
            medewerkerDisplayVeld.value = displayName || 'Onbekende gebruiker';
            console.log('[MeldingVerlof] ✓ ModalMedewerkerDisplay ingevuld voor gewone gebruiker:', medewerkerDisplayVeld.value);
        }
        if (medewerkerIdDisplayVeld) {
            medewerkerIdDisplayVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingVerlof] ✓ ModalMedewerkerIDDisplay ingevuld:', medewerkerIdDisplayVeld.value);
        }
        if (verborgenMedewerkerIdVeld) {
            verborgenMedewerkerIdVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingVerlof] ✓ MedewerkerID hidden field ingevuld:', verborgenMedewerkerIdVeld.value);
        }
    } else {
        // Super-user: dropdown is al gevuld, initiële waarden zetten
        if (medewerkerIdDisplayVeld) {
            medewerkerIdDisplayVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingVerlof] ✓ ModalMedewerkerIDDisplay ingevuld voor super-user:', medewerkerIdDisplayVeld.value);
        }
        if (verborgenMedewerkerIdVeld) {
            verborgenMedewerkerIdVeld.value = medewerkerId || 'Onbekend';
            console.log('[MeldingVerlof] ✓ MedewerkerID hidden field ingevuld voor super-user:', verborgenMedewerkerIdVeld.value);
        }
    }
    
    console.log('[MeldingVerlof] === INVULLEN VOLTOOID ===');

    if (isEditMode) {
        // --- BEWERK MODUS ---
        titleInput.value = itemData.Title || `Verlofaanvraag Bewerken`;
        aanvraagTijdstipInput.value = new Date(itemData.AanvraagTijdstip || Date.now()).toISOString();
        
        startDatePicker.value = new Date(itemData.StartDatum).toISOString().split('T')[0];
        startTimePicker.value = new Date(itemData.StartDatum).toTimeString().slice(0, 5);
        endDatePicker.value = new Date(itemData.EindDatum).toISOString().split('T')[0];
        endTimePicker.value = new Date(itemData.EindDatum).toTimeString().slice(0, 5);
        
        omschrijvingTextarea.value = itemData.Omschrijving || '';

        // Laad redenen en selecteer de juiste
        await laadVerlofVakantieRedenId(itemData.RedenId);
    } else {
        // --- NIEUW MODUS ---
        const vandaag = new Date();
        const datumString = vandaag.toLocaleDateString('nl-NL');
        titleInput.value = `Verlofaanvraag ${displayName} - ${datumString}`;
        aanvraagTijdstipInput.value = vandaag.toISOString();
        
        // Use selected date range from context menu or FAB
        let initStartDatum, initEindDatum;
        
        if (window.verlofModalStartDate && window.verlofModalEndDate) {
            // Use dates from selection (context menu or other selection)
            initStartDatum = new Date(window.verlofModalStartDate);
            initEindDatum = new Date(window.verlofModalEndDate);
            console.log('[MeldingVerlof] Using selected date range:', { start: initStartDatum, end: initEindDatum });
        } else if (geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum)) {
            // Use passed date as both start and end
            initStartDatum = new Date(geselecteerdeDatum);
            initEindDatum = new Date(geselecteerdeDatum);
            console.log('[MeldingVerlof] Using passed date:', initStartDatum);
        } else {
            // Fallback to today
            initStartDatum = new Date();
            initEindDatum = new Date();
            console.log('[MeldingVerlof] Using fallback (today):', initStartDatum);
        }

        const initStartDatumISO = initStartDatum.toISOString().split('T')[0];
        const initEindDatumISO = initEindDatum.toISOString().split('T')[0];

        startDatePicker.value = initStartDatumISO;
        endDatePicker.value = initEindDatumISO;
        startTimePicker.value = "09:00";
        endTimePicker.value = "17:00";
        omschrijvingTextarea.value = '';

        // Clear the global date variables after use
        window.verlofModalStartDate = null;
        window.verlofModalEndDate = null;

        // Laad redenen zonder een specifieke selectie
        await laadVerlofVakantieRedenId();
    }    
    console.log("[MeldingVerlof] Gebruikersinfo en datums ingesteld voor verlofmodal.");
}

/**
 * Haalt het ID van de "Verlof/vakantie" reden uit de Verlofredenen lijst.
 * @param {string|number} specificRedenId - Optioneel: specifiek reden ID voor bewerkmodus
 */
async function laadVerlofVakantieRedenId(specificRedenId = null) {
    const redenIdInput = document.getElementById('RedenId');
    
    // Als er een specifieke reden ID is opgegeven (bewerkmodus), gebruik die
    if (specificRedenId && redenIdInput) {
        redenIdInput.value = String(specificRedenId);
        console.log("[MeldingVerlof] Specifieke reden ID ingesteld voor bewerkmodus:", specificRedenId);
        return;
    }
    
    if (verlofVakantieRedenId && redenIdInput) { // Als al geladen en input bestaat
        console.log("[MeldingVerlof] ID voor 'Verlof/vakantie' reden al geladen:", verlofVakantieRedenId);
        redenIdInput.value = String(verlofVakantieRedenId); // Ensure it's always a string
        return;
    }
    console.log("[MeldingVerlof] Laden van ID voor verlofreden 'Verlof/vakantie'...");

    const redenenConfigKey = 'Verlofredenen';
    const redenenConfig = typeof window.getLijstConfig === 'function' ? window.getLijstConfig(redenenConfigKey) : null; // Gebruik window.getLijstConfig
    if (!redenenConfig || !(redenenConfig.lijstId || redenenConfig.lijstTitel)) {
        console.error(`[MeldingVerlof] Configuratie voor '${redenenConfigKey}' lijst niet gevonden of incompleet (lijstId/lijstTitel ontbreekt). Controleer of configLijst.js correct is geladen en getLijstConfig werkt.`);
        toonNotificatieInVerlofModal("Kon configuratie voor verlofredenen niet laden.", "error", false);
        verlofVakantieRedenId = null; // Zorg dat het null is bij fout
        if (redenIdInput) redenIdInput.value = ''; // Maak veld leeg
        return;
    }

    // Try to find by exact title
    const filterQuery = `$filter=Title eq 'Verlof/vakantie'`;
    const selectQuery = "$select=ID,Title";

    try {
        if (typeof window.getLijstItemsAlgemeen !== 'function') {
            console.error("[MeldingVerlof] Functie getLijstItemsAlgemeen is niet beschikbaar.");
            throw new Error("Benodigde datafunctie ontbreekt.");
        }
        let redenen = await window.getLijstItemsAlgemeen(redenenConfigKey, selectQuery, filterQuery);

        // If exact match not found, try a wider search
        if (!redenen || redenen.length === 0) {
            console.warn("[MeldingVerlof] Exact match voor 'Verlof/vakantie' niet gevonden, probeer een bredere zoekopdracht...");
            const broaderFilterQuery = `$filter=substringof('Verlof', Title) or substringof('vakantie', Title)`;
            redenen = await window.getLijstItemsAlgemeen(redenenConfigKey, selectQuery, broaderFilterQuery);
        }

        if (redenen && redenen.length > 0) {
            const verlofVakantieReden = redenen[0];
            verlofVakantieRedenId = verlofVakantieReden.ID;
            console.log(`[MeldingVerlof] ID voor 'Verlof/vakantie' succesvol geladen: ${verlofVakantieRedenId} (Title: "${verlofVakantieReden.Title}")`);
            if (redenIdInput) redenIdInput.value = String(verlofVakantieRedenId);
        } else {
            console.warn("[MeldingVerlof] Kon geen redenen vinden die overeenkomen met 'Verlof' of 'vakantie'. Controleer of de Verlofredenen lijst correct is ingesteld.");
            verlofVakantieRedenId = null;
            if (redenIdInput) redenIdInput.value = '';
        }
    } catch (error) {
        console.error('[MeldingVerlof] Fout bij ophalen ID voor verlofreden "Verlof/vakantie":', error);
        toonNotificatieInVerlofModal('Kon standaard reden niet laden. Probeer het later opnieuw.', 'error', false);
        verlofVakantieRedenId = null;
        if (redenIdInput) redenIdInput.value = '';
    }
}

/**
 * Controleert of de huidige gebruiker lid is van super-user groepen (kan voor anderen verlof aanvragen)
 */
function isUserPrivilegedGroup() {
    if (!window.huidigeGebruiker || !window.huidigeGebruiker.sharePointGroepen) {
        console.log('[MeldingVerlof] Geen SharePoint groepsinformatie beschikbaar, gebruiker is geen super-user');
        return false;
    }

    const privilegedGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars", "2.3. Senioren beoordelen"];
    const hasPrivilegedAccess = window.huidigeGebruiker.sharePointGroepen.some(groep => 
        privilegedGroups.some(privilegedGroup => 
            groep.toLowerCase().includes(privilegedGroup.toLowerCase())
        )
    );
    
    console.log('[MeldingVerlof] Gebruiker groepslidmaatschap check:', {
        userGroups: window.huidigeGebruiker.sharePointGroepen,
        privilegedGroups: privilegedGroups,
        hasPrivilegedAccess: hasPrivilegedAccess
    });
    
    return hasPrivilegedAccess;
}

/**
 * Controleert of de gebruiker een super-user is die voor anderen mag aanvragen
 */
function isUserSuperUser() {
    return isUserPrivilegedGroup();
}

/**
 * Controleert of de gebruiker verlof voor zichzelf mag aanvragen
 * Iedereen mag voor zichzelf verlof aanvragen (zowel gewone gebruikers als super-users)
 */
function canUserRequestLeaveForSelf() {
    // Alle gebruikers mogen voor zichzelf verlof aanvragen
    console.log('[MeldingVerlof] Verlof aanvraag controle: Alle gebruikers mogen voor zichzelf verlof aanvragen');
    return true;
}

/**
 * Vult de medewerker dropdown voor super-users
 * @param {HTMLSelectElement} selectElement - Het dropdown element
 * @param {Object} selectedEmployee - De momenteel geselecteerde medewerker
 */
async function populateEmployeeDropdown(selectElement, selectedEmployee = null) {
    if (!selectElement || !window.alleMedewerkers) {
        console.warn('[MeldingVerlof] Kan dropdown niet vullen: element of data ontbreekt');
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
            updateEmployeeFields(employeeData.Naam, employeeData.Username);
        } else {
            // Clear fields if no selection
            updateEmployeeFields('', '');
        }
    });

    console.log('[MeldingVerlof] Dropdown gevuld met', window.alleMedewerkers.length, 'medewerkers');
}

/**
 * Werkt de medewerker velden bij
 * @param {string} displayName - Naam om weer te geven
 * @param {string} username - Gebruikersnaam/ID
 */
function updateEmployeeFields(displayName, username) {
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay');
    const verborgenMedewerkerIdVeld = document.getElementById('MedewerkerID');
    
    if (medewerkerIdDisplayVeld) {
        medewerkerIdDisplayVeld.value = username;
    }
    if (verborgenMedewerkerIdVeld) {
        verborgenMedewerkerIdVeld.value = username;
    }
    
    console.log('[MeldingVerlof] Medewerker velden bijgewerkt:', { displayName, username });
}

// Test functies voor debugging
window.forceVulVerlofVelden = function() {
    console.log('=== FORCE FILL VERLOF VELDEN ===');
    
    const medewerkerDisplayVeld = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay');
    const verborgenMedewerkerIdVeld = document.getElementById('MedewerkerID');
    
    if (!medewerkerDisplayVeld) {
        console.error('Verlof modal is niet open of ModalMedewerkerDisplay veld niet gevonden');
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

window.debugMedewerkerMatching = function() {
    console.log('=== DEBUG MEDEWERKER MATCHING ===');
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

// Exporteer de initialisatiefunctie zodat deze vanuit verlofroosterModal_logic.js kan worden aangeroepen
window.initializeVerlofModalForm = initializeVerlofModalForm;

// Test functies voor debugging
window.testSuperUserStatus = function() {
    console.log('=== SUPER USER STATUS TEST ===');
    const isSuperUser = isUserSuperUser();
    const canRequest = canUserRequestLeaveForSelf();
    
    console.log('Current user:', window.huidigeGebruiker);
    console.log('Is super-user:', isSuperUser);
    console.log('Can request leave for self:', canRequest);
    console.log('SharePoint groups:', window.huidigeGebruiker?.sharePointGroepen);
    
    return { isSuperUser, canRequest };
};

// Test functie om veld zichtbaarheid te controleren
window.testVeldZichtbaarheid = function() {
    console.log('=== VELD ZICHTBAARHEID TEST ===');
    
    const medewerkerDisplayVeld = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerSelectVeld = document.getElementById('ModalMedewerkerSelect');
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay');
    
    console.log('Modal status:', {
        'ModalMedewerkerDisplay': {
            exists: !!medewerkerDisplayVeld,
            hidden: medewerkerDisplayVeld?.classList.contains('hidden'),
            display: medewerkerDisplayVeld?.style.display,
            value: medewerkerDisplayVeld?.value
        },
        'ModalMedewerkerSelect': {
            exists: !!medewerkerSelectVeld,
            hidden: medewerkerSelectVeld?.classList.contains('hidden'),
            display: medewerkerSelectVeld?.style.display,
            value: medewerkerSelectVeld?.value
        },
        'ModalMedewerkerIDDisplay': {
            exists: !!medewerkerIdDisplayVeld,
            value: medewerkerIdDisplayVeld?.value
        }
    });
    
    const isSuperUser = isUserSuperUser ? isUserSuperUser() : 'functie niet beschikbaar';
    console.log('User type:', { isSuperUser });
    
    return { isSuperUser };
};

// Emergency functie om medewerker velden zichtbaar te maken
window.toonMedewerkerVelden = function() {
    console.log('=== FORCE SHOW MEDEWERKER VELDEN ===');
    
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

console.log("Rooster/pages/js/meldingVerlof_logic.js geladen - verlofvelden automatische invulling en super-user functionaliteit geïmplementeerd.");
