// Rooster/pages/js/meldingZiekte_logic.js

/**
 * Logica voor de Ziek/Beter melden functionaliteit, specifiek wanneer deze
 * binnen een modal wordt geladen vanuit het hoofd verlofrooster.
 * Gebaseerd op de structuur van meldingVerlof_logic.js voor consistentie.
 */

// Globale variabelen specifiek voor de ziekmelding modal context
let spWebAbsoluteUrlZiekmelding;
let geselecteerdeMedewerkerContextZiekmelding = {}; // Context for the employee the sick report is for
let alleMedewerkersDataCache = []; // Cache for employee data, similar to verlof logic
let ziekteRedenId = null; // ID for "Ziekte" reason

// Helper to normalize user objects consistently
const normalizeUserObject = (userObj) => {
    if (!userObj) return null;
    
    console.log("[MeldingZiekte] Normalizing user object:", userObj);
    console.log("[MeldingZiekte] trimLoginNaamPrefix available:", typeof window.trimLoginNaamPrefix);
    
    // Prioritize properties typically available from getAlleMedewerkers cache if merging
    const loginName = userObj.LoginName || userObj.loginNaam || userObj.Account;
    const account = userObj.Account || userObj.loginNaam || userObj.LoginName;
    const email = userObj.Email || userObj.email;
    const spUID = userObj.Id || userObj.id; // SharePoint User ID

    // Normalize the Username field by removing SharePoint claims prefix if present
    const rawUsername = userObj.Username || userObj.normalizedUsername || account || loginName;
    const normalizedUsername = window.trimLoginNaamPrefix ? window.trimLoginNaamPrefix(rawUsername) : rawUsername;
    
    console.log("[MeldingZiekte] Raw username:", rawUsername, "-> Normalized:", normalizedUsername);

    // For display name, prefer VolledigeNaam from cache, then DisplayName, then context's displayName
    let displayName = userObj.VolledigeNaam || userObj.DisplayName || userObj.displayName || userObj.medewerkerNaamVolledig;
    if (!displayName && normalizedUsername) { // Fallback to normalizedUsername if no display name found
        displayName = normalizedUsername;
    }

    const result = {
        // Keep original fields first, then overwrite with normalized values
        ...userObj,
        loginNaam: normalizedUsername, // Use normalized username for loginNaam
        Account: normalizedUsername, // Use normalized username for Account
        displayName: displayName,
        // Ensure normalizedUsername is always properly normalized
        normalizedUsername: normalizedUsername,
        email: email,
        Id: spUID, // SharePoint User ID
        VolledigeNaam: userObj.VolledigeNaam || displayName, // Ensure VolledigeNaam is populated
        DisplayName: userObj.DisplayName || displayName // Ensure DisplayName is populated
    };
    
    console.log("[MeldingZiekte] Normalized result:", result);
    return result;
};


/**
 * Haalt een X-RequestDigest op.
 * @returns {Promise<string>} De request digest waarde.
 */
async function getRequestDigestZiekmelding() {
    if (!spWebAbsoluteUrlZiekmelding) {
        console.error("[MeldingZiekte] SharePoint site URL (spWebAbsoluteUrlZiekmelding) is niet ingesteld.");
        throw new Error('SharePoint site URL is niet geconfigureerd voor request digest.');
    }
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
 * Diagnosticeert thema-gerelateerde problemen.
 */
function diagnoseThemeIssuesZiekmelding() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    console.log("[MeldingZiekte] Thema diagnose:");
    console.log(`- Document body heeft dark-theme class: ${isDarkTheme}`);
    const cssLink = document.getElementById('ziekte-melding-styles'); // Ensure this ID is on your <link> tag
    console.log(`- Ziekte CSS is geladen: ${cssLink !== null}`);
    if (cssLink) console.log(`  href: ${cssLink.href}`);
}

/**
 * Toont een notificatie bericht BINNEN DE MODAL.
 * @param {string} berichtHTML - Het te tonen bericht.
 * @param {'success'|'error'|'info'|'warning'} type - Type notificatie.
 * @param {number|false} [autoHideDelay=7000] - Vertraging voor auto-hide.
 */
function toonNotificatieInZiekmeldingModal(berichtHTML, type = 'info', autoHideDelay = 7000) {
    const modalNotificationArea = document.getElementById('modal-notification-area');
    if (!modalNotificationArea) {
        console.warn("[MeldingZiekte] Notificatiegebied (#modal-notification-area) niet gevonden. Bericht:", berichtHTML);
        // Fallback to a global modal notification if available
        if (typeof window.toonModalNotificatie === 'function') {
            window.toonModalNotificatie(berichtHTML.replace(/<[^>]*>?/gm, ''), type, autoHideDelay);
        } else {
            console.log(`[MeldingZiekte Notificatie] Type: ${type}, Bericht: ${berichtHTML}`);
        }
        return;
    }
    modalNotificationArea.className = 'notification-area p-3 my-3 rounded-md text-sm'; // Tailwind classes
    modalNotificationArea.innerHTML = ''; // Clear previous content

    let bgColor, textColor, borderColor;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-100'; textColor = 'text-green-700'; borderColor = 'border-green-400';
            break;
        case 'error':
            bgColor = 'bg-red-100'; textColor = 'text-red-700'; borderColor = 'border-red-400';
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; borderColor = 'border-blue-400';
            break;
    }
    modalNotificationArea.classList.add(bgColor, textColor, borderColor, 'border');
    
    // Dark theme adjustments
    if (document.body.classList.contains('dark-theme')) {
        switch (type) {
            case 'success':
                bgColor = 'dark:bg-green-700'; textColor = 'dark:text-green-100'; borderColor = 'dark:border-green-500';
                break;
            case 'error':
                bgColor = 'dark:bg-red-700'; textColor = 'dark:text-red-100'; borderColor = 'dark:border-red-500';
                break;
            case 'info':
            default:
                bgColor = 'dark:bg-blue-700'; textColor = 'dark:text-blue-100'; borderColor = 'dark:border-blue-500';
                break;
        }
        modalNotificationArea.classList.add(bgColor, textColor, borderColor);
    }


    modalNotificationArea.innerHTML = berichtHTML;
    modalNotificationArea.style.display = 'block';

    if (modalNotificationArea.timeoutId) clearTimeout(modalNotificationArea.timeoutId);
    if (autoHideDelay !== false && autoHideDelay > 0) {
        modalNotificationArea.timeoutId = setTimeout(() => {
            if (modalNotificationArea) modalNotificationArea.style.display = 'none';
        }, autoHideDelay);
    }
}

/**
 * Haalt verlofredenen op en specifiek het ID voor "Ziekte".
 * @returns {Promise<number|null>} ID van de "Ziekte" reden, of null indien niet gevonden.
 */
async function laadZiekteRedenId() {
    if (ziekteRedenId) return ziekteRedenId; // Already loaded

    console.log("[MeldingZiekte] Laden van ID voor verlofreden 'Ziekte'...");
    if (typeof window.getLijstItemsAlgemeen !== 'function') {
        console.error("[MeldingZiekte] Functie getLijstItemsAlgemeen is niet beschikbaar.");
        toonNotificatieInZiekmeldingModal("Kritieke fout: Kan redenen niet laden.", "error", false);
        return null;
    }

    try {
        const redenen = await window.getLijstItemsAlgemeen('Verlofredenen', '$select=Id,Title');
        if (!redenen || redenen.length === 0) {
            console.warn("[MeldingZiekte] Geen verlofredenen gevonden.");
            toonNotificatieInZiekmeldingModal("Configuratiefout: Geen verlofredenen gedefinieerd.", "error", false);
            return null;
        }
        const ziekteRedenObj = redenen.find(r => r.Title && r.Title.toLowerCase() === 'ziekte');
        if (ziekteRedenObj) {
            ziekteRedenId = ziekteRedenObj.Id;
            console.log("[MeldingZiekte] 'Ziekte' reden ID gevonden:", ziekteRedenId);
            // Update hidden field for RedenId
            const redenIdInput = document.getElementById('RedenId'); // Hidden input
            if (redenIdInput) redenIdInput.value = ziekteRedenId;
            // Update display field for Reden
            const redenDisplayInput = document.getElementById('ModalRedenDisplay'); // Readonly display input
            if (redenDisplayInput) redenDisplayInput.value = "Ziekte";

            return ziekteRedenId;
        } else {
            console.error("[MeldingZiekte] Kon 'Ziekte' reden niet vinden in de lijst.");
            toonNotificatieInZiekmeldingModal("Configuratiefout: Reden 'Ziekte' niet gevonden.", "error", false);
            return null;
        }
    } catch (error) {
        console.error("[MeldingZiekte] Fout bij ophalen verlofredenen:", error);
        toonNotificatieInZiekmeldingModal("Fout bij laden configuratie (redenen).", "error", false);
        return null;
    }
}


/**
 * Populeert de medewerker dropdown voor super-users.
 * @param {HTMLSelectElement} selectElement - Het dropdown element.
 * @param {string} defaultSelectedLoginName - De loginnaam die standaard geselecteerd moet zijn.
 */
async function populateMedewerkerDropdownZiekmelding(selectElement, defaultSelectedLoginName) {
    console.log("[MeldingZiekte] Populeren medewerker dropdown...");
    if (!selectElement) {
        console.error("[MeldingZiekte] Dropdown element niet meegegeven.");
        return;
    }

    if (alleMedewerkersDataCache.length === 0) {
        if (typeof window.getAlleMedewerkers === 'function') {
            try {
                // Ensure getAlleMedewerkers returns the expected structure, especially LoginName and Id (SP User ID)
                alleMedewerkersDataCache = await window.getAlleMedewerkers(); 
                console.log("[MeldingZiekte] Alle medewerkers data opgehaald:", alleMedewerkersDataCache.length);
            } catch (error) {
                console.error("[MeldingZiekte] Fout bij ophalen alle medewerkers:", error);
                toonNotificatieInZiekmeldingModal("Kan medewerkerslijst niet laden.", "error");
                return; 
            }
        } else {
            console.error("[MeldingZiekte] window.getAlleMedewerkers functie niet beschikbaar.");
            toonNotificatieInZiekmeldingModal("Kritieke fout: Medewerkersdata onbereikbaar.", "error");
            return; 
        }
    }

    selectElement.innerHTML = '<option value="">Selecteer een medewerker...</option>'; 

    if (!alleMedewerkersDataCache || alleMedewerkersDataCache.length === 0) {
        console.warn("[MeldingZiekte] Geen medewerkersdata beschikbaar voor dropdown.");
        return;
    }

    alleMedewerkersDataCache.sort((a, b) => (a.VolledigeNaam || a.DisplayName || "").localeCompare(b.VolledigeNaam || b.DisplayName || ""));

    alleMedewerkersDataCache.forEach(medewerker => {
        const option = document.createElement('option');
        // Value should be something unique and usable to re-fetch the full object, LoginName is good.
        option.value = medewerker.LoginName || medewerker.Account; 
        option.textContent = medewerker.VolledigeNaam || medewerker.DisplayName || "Naam Onbekend";
        // Store essential data directly on the option for easy retrieval
        option.dataset.spUserId = medewerker.Id; // SharePoint User ID from Medewerkers list (which is SP User ID)
        option.dataset.email = medewerker.Email || "";
        option.dataset.loginName = medewerker.LoginName || medewerker.Account;
        option.dataset.displayName = medewerker.VolledigeNaam || medewerker.DisplayName;


        if (option.value && defaultSelectedLoginName && option.value.toLowerCase() === defaultSelectedLoginName.toLowerCase()) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
    console.log("[MeldingZiekte] Medewerker dropdown gepopuleerd.");
}

/**
 * Werkt de medewerker gerelateerde display en verborgen input velden bij.
 * @param {Object} medewerker - Het genormaliseerde medewerker object.
 */
function updateMedewerkerFieldsZiekmelding(medewerker) {
    const medewerkerDisplayVeld = document.getElementById('ModalMedewerkerDisplay'); 
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay'); 
    const verborgenMedewerkerIdVeld = document.getElementById('MedewerkerID'); 

    if (!medewerker) {
        console.warn("[MeldingZiekte] updateMedewerkerFieldsZiekmelding aangeroepen zonder medewerker object.");
        if (medewerkerDisplayVeld) medewerkerDisplayVeld.value = "Niet gespecificeerd";
        if (medewerkerIdDisplayVeld) medewerkerIdDisplayVeld.value = "";
        if (verborgenMedewerkerIdVeld) verborgenMedewerkerIdVeld.value = "";
        return;
    }    // The medewerker object should already be normalized by the caller (initializeZiekmeldingModal or dropdown change handler)
    const normMedewerker = medewerker; // Assuming medewerker is already a product of normalizeUserObject

    const displayName = normMedewerker.VolledigeNaam || normMedewerker.DisplayName || "Onbekende Medewerker";
    // For MedewerkerID (hidden, for submission) and ModalMedewerkerIDDisplay (visible), use normalizedUsername.
    // This ensures we always submit the properly normalized username (without claims prefix).
    const idForSubmission = normMedewerker.normalizedUsername || normMedewerker.LoginName || normMedewerker.Account || "";

    if (medewerkerDisplayVeld) {
        medewerkerDisplayVeld.value = displayName;
    }
    if (medewerkerIdDisplayVeld) { 
        medewerkerIdDisplayVeld.value = idForSubmission; 
    }
    if (verborgenMedewerkerIdVeld) { 
        verborgenMedewerkerIdVeld.value = idForSubmission; // CRUCIAL CHANGE: Store LoginName/Account, NOT SP User ID
    }

    console.log(`[MeldingZiekte] Medewerker velden bijgewerkt: Display='${displayName}', IDForDisplay='${idForSubmission}', HiddenIDForSubmission='${idForSubmission}' (Normalized from: ${normMedewerker.LoginName || 'N/A'}, SP User ID: ${normMedewerker.Id || 'N/A'})`);
}

/**
 * Initialiseert de ziekmelding modal.
 * @param {Object} context - Kan huidigeGebruiker zijn, of een specifieke medewerkerContext als superuser voor iemand anders aanvraagt.
 * @param {string} siteUrl - SharePoint site URL.
 * @param {boolean} isCurrentUserSupervisor - Geeft aan of de ingelogde gebruiker supervisor rechten heeft.
 * @param {Date} [geselecteerdeDatum=null] - Optionele datum.
 */
async function initializeZiekmeldingModal(context, siteUrl, isCurrentUserSupervisor, geselecteerdeDatum = null) {
    console.log("[MeldingZiekte] Initializing Ziek/Beter Melden Modal (v3)...", { context, siteUrl, isCurrentUserSupervisor, geselecteerdeDatum });
    
    spWebAbsoluteUrlZiekmelding = siteUrl;
    if (!spWebAbsoluteUrlZiekmelding && typeof window !== 'undefined' && window.spWebAbsoluteUrl) {
        spWebAbsoluteUrlZiekmelding = window.spWebAbsoluteUrl;
    }
    if (!spWebAbsoluteUrlZiekmelding) {
        toonNotificatieInZiekmeldingModal("Kritieke fout: Serverlocatie onbekend.", "error", false);
        console.error("[MeldingZiekte] spWebAbsoluteUrlZiekmelding is niet ingesteld!");
        return;
    }

    const ingelogdeGebruiker = normalizeUserObject(window.huidigeGebruiker);
    if (!ingelogdeGebruiker || !(ingelogdeGebruiker.loginNaam || ingelogdeGebruiker.Account)) {
        console.error("[MeldingZiekte] Ingelogde gebruiker (window.huidigeGebruiker) niet gevonden of incompleet.");
        toonNotificatieInZiekmeldingModal("Kan ingelogde gebruiker niet identificeren.", "error", false);
        return;
    }

    let targetMedewerkerVoorContext = normalizeUserObject(context); // De persoon voor wie de melding is.
    if (!targetMedewerkerVoorContext || !(targetMedewerkerVoorContext.loginNaam || targetMedewerkerVoorContext.Account)) {
        console.warn("[MeldingZiekte] Initiële context voor ziekmelding is incompleet, fallback naar ingelogde gebruiker.");
        targetMedewerkerVoorContext = ingelogdeGebruiker;
    }
    
    // Als supervisor voor iemand anders aanvraagt, is targetMedewerkerVoorContext die ander.
    // Anders is het de ingelogde gebruiker zelf.
    if (isCurrentUserSupervisor && targetMedewerkerVoorContext.loginNaam !== ingelogdeGebruiker.loginNaam) {
        console.log("[MeldingZiekte] Supervisor mode: Melding voor", targetMedewerkerVoorContext.displayName);
    } else {
        targetMedewerkerVoorContext = ingelogdeGebruiker; // Default to self if not clearly for another by supervisor
        console.log("[MeldingZiekte] User mode: Melding voor", targetMedewerkerVoorContext.displayName);
    }

    let finalMedewerkerContextForForm; // This will hold the definitive data for the form

    // Attempt to load alleMedewerkersDataCache if not already populated
    if (!alleMedewerkersDataCache || alleMedewerkersDataCache.length === 0) {
        if (typeof window.getAlleMedewerkers === 'function') {
            try {
                alleMedewerkersDataCache = await window.getAlleMedewerkers();
                console.log("[MeldingZiekte] Alle medewerkers data (opnieuw) opgehaald:", alleMedewerkersDataCache.length);
            } catch (error) {
                console.error("[MeldingZiekte] Fout bij ophalen alle medewerkers:", error);
                toonNotificatieInZiekmeldingModal("Kan medewerkerslijst niet laden.", "error");
                // Continue with potentially incomplete context if medewerkers list fails
            }
        } else {
            console.error("[MeldingZiekte] window.getAlleMedewerkers functie niet beschikbaar.");
            toonNotificatieInZiekmeldingModal("Kritieke fout: Medewerkersdata functie onbereikbaar.", "error");
        }
    }
    
    if (alleMedewerkersDataCache && alleMedewerkersDataCache.length > 0 && targetMedewerkerVoorContext) {
        console.log("[MeldingZiekte] Zoeken naar medewerker in cache. Target context:", targetMedewerkerVoorContext);
        let foundEmployee = null;
        const searchValues = [
            targetMedewerkerVoorContext.loginNaam,
            targetMedewerkerVoorContext.Account,
            targetMedewerkerVoorContext.normalizedUsername,
            targetMedewerkerVoorContext.email
        ].filter(Boolean).map(v => String(v).toLowerCase());

        for (const emp of alleMedewerkersDataCache) {
            const normEmp = normalizeUserObject(emp); // Normalize cache entry for consistent access
            const empLoginName = normEmp.LoginName ? String(normEmp.LoginName).toLowerCase() : null;
            const empAccount = normEmp.Account ? String(normEmp.Account).toLowerCase() : null;
            const empEmail = normEmp.Email ? String(normEmp.Email).toLowerCase() : null;

            if ((empLoginName && searchValues.includes(empLoginName)) ||
                (empAccount && searchValues.includes(empAccount)) ||
                (empEmail && searchValues.includes(empEmail))) {
                foundEmployee = normEmp;
                break;
            }
            // Fallback: check if normalizedUsername (which might be just 'username') is part of LoginName/Account
            if (targetMedewerkerVoorContext.normalizedUsername) {
                 const justUsername = targetMedewerkerVoorContext.normalizedUsername.includes('\\\\') ? 
                                      targetMedewerkerVoorContext.normalizedUsername.split('\\\\')[1] : 
                                      targetMedewerkerVoorContext.normalizedUsername;
                 if (justUsername && ( (empLoginName && empLoginName.endsWith(justUsername.toLowerCase())) || (empAccount && empAccount.endsWith(justUsername.toLowerCase())) ) ) {
                    foundEmployee = normEmp;
                    break;
                 }
            }
        }

        if (foundEmployee) {
            console.log("[MeldingZiekte] Medewerker gevonden in alleMedewerkersDataCache:", foundEmployee);
            finalMedewerkerContextForForm = foundEmployee; // Already normalized
        } else {
            console.warn("[MeldingZiekte] Medewerker niet gevonden in alleMedewerkersDataCache. Gebruik van oorspronkelijke (genormaliseerde) context:", targetMedewerkerVoorContext);
            finalMedewerkerContextForForm = targetMedewerkerVoorContext; 
        }
    } else {
        console.warn("[MeldingZiekte] alleMedewerkersDataCache is leeg of target context ontbreekt. Gebruik van oorspronkelijke (genormaliseerde) context.");
        finalMedewerkerContextForForm = targetMedewerkerVoorContext; 
    }

    geselecteerdeMedewerkerContextZiekmelding = finalMedewerkerContextForForm; // Set global context for this modal
    updateMedewerkerFieldsZiekmelding(finalMedewerkerContextForForm);

    // UI Aanpassingen voor supervisor vs. gewone gebruiker    // Verberg altijd de dropdown selector omdat we werken met rooster context
    // De medewerker wordt bepaald door de rooster selectie (voor geprivilegieerden)
    // of is altijd de ingelogde gebruiker (voor reguliere gebruikers)
    const medewerkerDisplayRow = document.getElementById('medewerkerDisplayRow');
    const medewerkerSelectRow = document.getElementById('medewerkerSelectRow');
    
    // Toon altijd de display versie (geen dropdown)
    if (medewerkerDisplayRow) medewerkerDisplayRow.classList.remove('hidden');
    if (medewerkerSelectRow) medewerkerSelectRow.classList.add('hidden');
    
    // Initialiseer datums en tijden
    const begindatumInput = document.getElementById('ModalBegindatum');
    const einddatumInput = document.getElementById('ModalEinddatum');
    const begintijdInput = document.getElementById('ModalBegintijd');
    const eindtijdInput = document.getElementById('ModalEindtijd');
    const heleDagCheckbox = document.getElementById('ModalHeleDag');

    if (geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum)) {
        if (begindatumInput) begindatumInput.value = geselecteerdeDatum.toISOString().split('T')[0];
    } else {
        if (begindatumInput) begindatumInput.value = new Date().toISOString().split('T')[0];
    }
    if (einddatumInput) einddatumInput.value = ''; // Leeg voor "nog ziek"
    if (begintijdInput) begintijdInput.value = '09:00';
    if (eindtijdInput) eindtijdInput.value = '17:00';
    if (heleDagCheckbox) {
        heleDagCheckbox.checked = true;
        toggleTijdveldenZiekmelding(!heleDagCheckbox.checked, begintijdInput, eindtijdInput); // Initial state based on checkbox
        heleDagCheckbox.removeEventListener('change', handleHeleDagCheckboxChangeZiekmelding); // Voorkom duplicaten
        heleDagCheckbox.addEventListener('change', handleHeleDagCheckboxChangeZiekmelding);
    }
    
    // Laad reden ID voor "Ziekte"
    await laadZiekteRedenId();

    // Stel titel en aanvraagtijdstip in (verborgen velden)
    const titleInput = document.getElementById('Title');
    const aanvraagTijdstipInput = document.getElementById('AanvraagTijdstip');
    if (titleInput && finalMedewerkerContextForForm) {
        titleInput.value = `Ziekmelding ${finalMedewerkerContextForForm.displayName || 'Onbekend'} - ${new Date().toLocaleDateString('nl-NL')}`;
    }
    if (aanvraagTijdstipInput) {
        aanvraagTijdstipInput.value = new Date().toISOString();
    }    // Focus op het eerste relevante veld
    if (begindatumInput) {
        begindatumInput.focus();
    }
    console.log("[MeldingZiekte] Initialisatie Ziek/Beter Melden Modal voltooid.");
}

// Event handler for supervisor medewerker selection change
function handleMedewerkerSelectChangeZiekmelding() {
    const selectedLoginName = this.value;
    if (selectedLoginName && alleMedewerkersDataCache) {
        const selectedEmployeeData = alleMedewerkersDataCache.find(
            emp => {
                const normEmp = normalizeUserObject(emp);
                return (normEmp.LoginName && normEmp.LoginName.toLowerCase() === selectedLoginName.toLowerCase()) ||
                       (normEmp.Account && normEmp.Account.toLowerCase() === selectedLoginName.toLowerCase());
            }
        );
        if (selectedEmployeeData) {
            const normalizedSelectedEmployee = normalizeUserObject(selectedEmployeeData); // Ensure it's normalized
            updateMedewerkerFieldsZiekmelding(normalizedSelectedEmployee);
            geselecteerdeMedewerkerContextZiekmelding = normalizedSelectedEmployee; // Update global context
            console.log("[MeldingZiekte] Supervisor selecteerde:", normalizedSelectedEmployee);
        } else {
            const tempContext = normalizeUserObject({ 
                VolledigeNaam: this.options[this.selectedIndex].text, 
                LoginName: selectedLoginName 
            });
            updateMedewerkerFieldsZiekmelding(tempContext);
            geselecteerdeMedewerkerContextZiekmelding = tempContext;
            console.warn(`[MeldingZiekte] Geselecteerde medewerker ${selectedLoginName} niet gevonden in cache na selectie. Gebruik selectie text.`);
        }
    } else if (!selectedLoginName) { // "Selecteer een medewerker..."
         updateMedewerkerFieldsZiekmelding(null); 
         geselecteerdeMedewerkerContextZiekmelding = null;
    }
}

// Event handler for "Hele dag" checkbox
function handleHeleDagCheckboxChangeZiekmelding() {
    const begintijdInput = document.getElementById('ModalBegintijd');
    const eindtijdInput = document.getElementById('ModalEindtijd');
    toggleTijdveldenZiekmelding(!this.checked, begintijdInput, eindtijdInput);
}

/**
 * Toont of verbergt de tijdvelden en maakt ze (niet) required.
 * @param {boolean} showTimes - Of de tijdvelden getoond moeten worden.
 * @param {HTMLInputElement} begintijdInput - Het begintijd input element.
 * @param {HTMLInputElement} eindtijdInput - Het eindtijd input element.
 */
function toggleTijdveldenZiekmelding(showTimes, begintijdInput, eindtijdInput) {
    if (begintijdInput && eindtijdInput) {
        begintijdInput.closest('.form-group').style.display = showTimes ? 'block' : 'none';
        eindtijdInput.closest('.form-group').style.display = showTimes ? 'block' : 'none';
        begintijdInput.required = showTimes;
        eindtijdInput.required = showTimes;
        if (!showTimes) {
            begintijdInput.value = '';
            eindtijdInput.value = '';
        } else {
            // Default times if shown and empty
            if (!begintijdInput.value) begintijdInput.value = '09:00';
            if (!eindtijdInput.value) eindtijdInput.value = '17:00';
        }
    }
}

// ... existing code ...
// Ensure the submitZiekmelding function uses geselecteerdeMedewerkerContextZiekmelding
// and the values from the form, especially the hidden MedewerkerID.

async function submitZiekmelding(event) {
    if (event) event.preventDefault();
    console.log("[MeldingZiekte] Poging tot opslaan ziekmelding...");

    // Validatie (simpel voorbeeld, kan uitgebreid worden)
    const begindatumInput = document.getElementById('ModalBegindatum');
    if (!begindatumInput || !begindatumInput.value) {
        toonNotificatieInZiekmeldingModal("Begindatum is verplicht.", "error");
        return;
    }
    // ... verdere validatie ...

    const formData = new FormData(document.getElementById('ziekmeldenForm'));
    const itemData = {};
    formData.forEach((value, key) => {
        // Special handling for dates to ensure correct ISO format if needed by SharePoint
        if ((key === 'StartDatum' || key === 'EindDatum') && value) {
            itemData[key] = new Date(value).toISOString();
        } else {
            itemData[key] = value;
        }
    });
    
    // Ensure MedewerkerID (LoginName/Account) is correctly sourced from the hidden field
    // The hidden field 'MedewerkerID' should already have the correct LoginName/Account due to updateMedewerkerFieldsZiekmelding
    const medewerkerIdForSubmission = document.getElementById('MedewerkerID').value;
    if (!medewerkerIdForSubmission) {
        toonNotificatieInZiekmeldingModal("Medewerker ID kon niet worden bepaald. Kan niet opslaan.", "error", false);
        console.error("[MeldingZiekte] MedewerkerID voor submissie is leeg/null.");
        return;
    }
    // SharePoint expects MedewerkerId (singular 'Id') to be the SharePoint User ID for a person field.
    // However, our Verlof modal submits the 'Username' (DOMAIN\\user) to a field named 'MedewerkerID'.
    // To maintain consistency with that, we are submitting the LoginName/Account to 'MedewerkerID'.
    // If the SharePoint list "Verlofregistraties" has a Person field actually named "Medewerker" 
    // and expects a SP User ID, then 'itemData.MedewerkerId = geselecteerdeMedewerkerContextZiekmelding.Id;' would be needed.
    // For now, we align with the pattern of submitting LoginName to 'MedewerkerID'.
    itemData.MedewerkerID = medewerkerIdForSubmission;


    // Combine date and time for StartDatum and EindDatum if not 'hele dag'
    const heleDag = document.getElementById('ModalHeleDag').checked;
    const startDatumVal = document.getElementById('ModalBegindatum').value;
    const startTijdVal = document.getElementById('ModalBegintijd').value;
    const eindDatumVal = document.getElementById('ModalEinddatum').value;
    const eindTijdVal = document.getElementById('ModalEindtijd').value;

    if (startDatumVal) {
        itemData.StartDatum = heleDag || !startTijdVal ? 
            new Date(startDatumVal + 'T00:00:00').toISOString() : 
            new Date(startDatumVal + 'T' + startTijdVal + ':00').toISOString();
    } else {
        toonNotificatieInZiekmeldingModal("Startdatum is verplicht.", "error");
        return;
    }

    if (eindDatumVal) {
        itemData.EindDatum = heleDag || !eindTijdVal ? 
            new Date(eindDatumVal + 'T23:59:59').toISOString() : 
            new Date(eindDatumVal + 'T' + eindTijdVal + ':00').toISOString();
    } else {
        delete itemData.EindDatum; // Geen einddatum = nog ziek
    }
    
    itemData.Title = document.getElementById('Title').value || `Ziekmelding ${itemData.MedewerkerID}`;
    itemData.RedenId = parseInt(document.getElementById('RedenId').value, 10);
    itemData.Reden = "Ziekte"; // Fixed for this form
    itemData.Status = "Nieuw"; // Default status
    itemData.Opmerkingen = document.getElementById('ModalOpmerkingen').value;
    itemData.HeleDag = heleDag;


    // Verwijder lege velden die problemen kunnen geven met SharePoint
    for (const key in itemData) {
        if (itemData[key] === null || itemData[key] === undefined || itemData[key] === '') {
            // Uitzondering voor EindDatum, die mag leeg zijn en dan verwijderd worden.
            if (key !== 'EindDatum') {
                 delete itemData[key];
            }
        }
    }
    // Ensure __metadata is set for creating new items
    itemData.__metadata = { type: window.getListItemTypeAlgemeen('Verlofregistraties') };


    console.log("[MeldingZiekte] Voorbereide data voor SharePoint:", JSON.stringify(itemData, null, 2));

    const submitButton = document.getElementById('modal-action-button') || document.getElementById('submitZiekmeldingBtnStandalone');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Opslaan...';
    }

    try {
        const digest = await getRequestDigestZiekmelding();
        const lijstNaam = 'Verlofregistraties'; // Ensure this is the correct list name

        const response = await fetch(`${spWebAbsoluteUrlZiekmelding}/_api/web/lists/getbytitle('${lijstNaam}')/items`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': digest
            },
            body: JSON.stringify(itemData)
        });

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Melding Opslaan'; // Reset button text
        }

        if (response.ok) {
            const responseData = await response.json();
            console.log("[MeldingZiekte] Ziekmelding succesvol opgeslagen:", responseData);
            toonNotificatieInZiekmeldingModal("Ziekmelding succesvol opgeslagen.", "success");
            if (typeof window.refreshCalendarData === 'function') {
                window.refreshCalendarData(); // Refresh main calendar if function exists
            }
            if (typeof closeModal === 'function') closeModal(); // Close modal on success
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

// Export functions to global window object for modal access
window.initializeZiekmeldingModal = initializeZiekmeldingModal;
window.submitZiekmelding = submitZiekmelding;

// Make functions available globally for use by the modal
window.initializeZiekmeldingModal = initializeZiekmeldingModal;
window.submitZiekmelding = submitZiekmelding;

// Attach submit handler if the form exists (e.g. when loaded in modal)
// The main modal logic in verlofroosterModal_logic.js will set up the action button.
// This is a fallback or for standalone testing.
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ziekmeldenForm');
    if (form) {
        form.removeEventListener('submit', submitZiekmelding); // Prevent multiple listeners
        form.addEventListener('submit', submitZiekmelding);
    }
    const standaloneSubmitButton = document.getElementById('submitZiekmeldingBtnStandalone');
    if (standaloneSubmitButton && !document.getElementById('modal-action-button')) { // Only if no modal button
        standaloneSubmitButton.removeEventListener('click', submitZiekmelding);
        standaloneSubmitButton.addEventListener('click', submitZiekmelding);
    }
});