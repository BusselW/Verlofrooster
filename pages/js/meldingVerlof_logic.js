// Rooster/pages/js/meldingVerlof_logic.js

/**
 * Logica voor de Verlof aanvragen functionaliteit, specifiek wanneer deze
 * binnen een modal wordt geladen vanuit het hoofd verlofrooster.
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
 * Utility functie om SharePoint claims prefix van loginnaam te verwijderen.
 * @param {string} loginNaam - De volledige SharePoint loginnaam.
 * @returns {string} De genormaliseerde loginnaam.
 */

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
    console.log("[MeldingVerlof] Request Digest succesvol opgehaald.");
    return data.d.GetContextWebInformation.FormDigestValue;
}

/**
 * Toont een notificatie bericht aan de gebruiker BINNEN DE MODAL.
 * @param {string} berichtHTML - Het te tonen bericht (kan HTML bevatten).
 * @param {'success'|'error'|'info'} type - Het type notificatie.
 * @param {number|false} [autoHideDelay=7000] - Vertraging in ms voor auto-hide, of false om niet automatisch te verbergen.
 */
function toonNotificatieInVerlofModal(berichtHTML, type = 'info', autoHideDelay = 7000) {
    const modalNotificationArea = document.getElementById('modal-notification-area');
    if (!modalNotificationArea) {
        console.warn("[MeldingVerlof] Notificatiegebied (#modal-notification-area) niet gevonden in modal voor bericht:", berichtHTML);
        if (typeof toonModalNotificatie === 'function') {
            toonModalNotificatie(berichtHTML.replace(/<[^>]*>?/gm, ''), type, autoHideDelay);
        } else {
            console.log(`[MeldingVerlof ModalNotificatie] Type: ${type}, Bericht: ${berichtHTML}`);
        }
        return;
    }
    console.log(`[MeldingVerlof ModalNotificatie] Type: ${type}, Bericht: ${berichtHTML}`);
    modalNotificationArea.innerHTML = berichtHTML;
    modalNotificationArea.className = 'notification-area p-3 rounded-md text-sm mb-4';

    const isDarkTheme = document.body.classList.contains('dark-theme');
    modalNotificationArea.classList.remove(
        'bg-green-100', 'text-green-800', 'border-green-300', 'dark:bg-green-800', 'dark:text-green-100', 'dark:border-green-600',
        'bg-red-100', 'text-red-800', 'border-red-300', 'dark:bg-red-800', 'dark:text-red-100', 'dark:border-red-600',
        'bg-blue-100', 'text-blue-800', 'border-blue-300', 'dark:bg-blue-800', 'dark:text-blue-100', 'dark:border-blue-600'
    );

    switch (type) {
        case 'success':
            (isDarkTheme ? 'dark:bg-green-800 dark:text-green-100 dark:border-green-600' : 'bg-green-100 text-green-800 border border-green-300')
                .split(' ').forEach(cls => modalNotificationArea.classList.add(cls));
            break;
        case 'error':
            (isDarkTheme ? 'dark:bg-red-800 dark:text-red-100 dark:border-red-600' : 'bg-red-100 text-red-800 border border-red-300')
                .split(' ').forEach(cls => modalNotificationArea.classList.add(cls));
            break;
        case 'info':
        default:
            (isDarkTheme ? 'dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600' : 'bg-blue-100 text-blue-800 border border-blue-300')
                .split(' ').forEach(cls => modalNotificationArea.classList.add(cls));
            break;
    }
    modalNotificationArea.classList.remove('hidden');

    if (modalNotificationArea.timeoutId) {
        clearTimeout(modalNotificationArea.timeoutId);
    }

    if (autoHideDelay !== false && autoHideDelay > 0) {
        modalNotificationArea.timeoutId = setTimeout(() => {
            if (modalNotificationArea && modalNotificationArea.classList) {
                modalNotificationArea.classList.add('hidden');
            }
        }, autoHideDelay);
    }
}

/**
 * Preview functie die potentiële ontvangers toont voordat het formulier wordt verzonden.
 * @param {Object} medewerkerContext - De context van de huidige medewerker.
 */
async function previewVerlofNotificationRecipients(medewerkerContext) {
    console.log("[MeldingVerlof] Voorvertoning van e-mail ontvangers...");
    
    if (!spWebAbsoluteUrlVerlof) {
        console.error("[MeldingVerlof] SharePoint site URL niet beschikbaar voor e-mailvoorvertoning.");
        return;
    }

    let toEmails = [];
    let ccEmails = [];
    let logResults = [];

    // Voeg logfunctie toe die resultaten verzamelt
    const logPreview = (message) => {
        console.log(message);
        logResults.push(message);
    };

    // Voeg e-mail van aanvrager toe aan CC
    if (medewerkerContext && medewerkerContext.email) {
        ccEmails.push(medewerkerContext.email);
        logPreview(`▶️ Aanvrager e-mail: ${medewerkerContext.email} (als CC)`);
    } else if (huidigeGebruikerVerlofContext && huidigeGebruikerVerlofContext.email) {
        ccEmails.push(huidigeGebruikerVerlofContext.email);
        logPreview(`▶️ Fallback aanvrager e-mail: ${huidigeGebruikerVerlofContext.email} (als CC)`);
    } else {
        logPreview("⚠️ Kon e-mail van aanvrager niet vinden voor CC");
    }

    if (verlofEmailDebugMode) {
        toEmails.push(verlofEmailDebugRecipient);
        logPreview(`ℹ️ DEBUG MODE: E-mail gaat alleen naar ${verlofEmailDebugRecipient} (als TO)`);
    } else {
        ccEmails.push(verlofEmailDebugRecipient);
        logPreview(`▶️ Debug e-mail: ${verlofEmailDebugRecipient} (als CC)`);
        logPreview("🔍 PRODUCTIE MODE: Zoeken naar teamleider en seniors...");

        // 1. Haal team van aanvrager op
        let aanvragerTeamNaam = null;
        if (medewerkerContext && medewerkerContext.normalizedUsername) {
            const medewerkersConfigKey = 'Medewerkers';
            const filterQueryMedewerker = `$filter=Username eq \'${medewerkerContext.normalizedUsername}\'&$select=Team`;
            try {
                const medewerkerItems = await window.getLijstItemsAlgemeen(medewerkersConfigKey, filterQueryMedewerker);
                if (medewerkerItems && medewerkerItems.length > 0 && medewerkerItems[0].Team) {
                    aanvragerTeamNaam = medewerkerItems[0].Team;
                    logPreview(`📋 Team gevonden: "${aanvragerTeamNaam}" voor ${medewerkerContext.normalizedUsername}`);
                } else {
                    logPreview(`⚠️ Geen team gevonden voor ${medewerkerContext.normalizedUsername}`);
                }
            } catch (e) {
                logPreview(`❌ Fout bij ophalen team: ${e.message}`);
            }
        }

        if (aanvragerTeamNaam) {
            // 2. Haal teamleider op
            const teamsConfigKey = 'Teams';
            const filterQueryTeam = `$filter=Title eq '${aanvragerTeamNaam}'&$select=TeamleiderId,Title`;
            
            try {
                logPreview(`🔍 Zoeken naar teamleider voor team "${aanvragerTeamNaam}"...`);
                let teamItems = await window.getLijstItemsAlgemeen(teamsConfigKey, filterQueryTeam);
                
                if (!teamItems || teamItems.length === 0) {
                    logPreview(`⚠️ Geen exact team match gevonden, probeer alternatieve zoekopties...`);
                    // Haal alle teams op voor alternatieve matching
                    const allTeamsQuery = "$select=TeamleiderId,Title";
                    const allTeams = await window.getLijstItemsAlgemeen(teamsConfigKey, allTeamsQuery);
                    
                    if (allTeams && allTeams.length > 0) {
                        logPreview(`ℹ️ ${allTeams.length} teams gevonden voor handmatige matching`);
                        // Zoek case-insensitive match
                        teamItems = allTeams.filter(team => 
                            team.Title && team.Title.toLowerCase() === aanvragerTeamNaam.toLowerCase());
                    }
                }
                
                if (teamItems && teamItems.length > 0) {
                    const teamWithTeamleider = teamItems.find(team => team.TeamleiderId);
                    
                    if (teamWithTeamleider && teamWithTeamleider.TeamleiderId) {
                        const teamleiderLoginName = teamWithTeamleider.TeamleiderId;
                        logPreview(`📋 Teamleider gebruikersnaam gevonden: ${teamleiderLoginName}`);
                        const teamleiderEmail = await fetchUserEmailByLoginName(teamleiderLoginName);
                        if (teamleiderEmail) {
                            toEmails.push(teamleiderEmail);
                            logPreview(`✅ Teamleider e-mail: ${teamleiderEmail} (als TO)`);
                        } else {
                            logPreview(`❌ Kon e-mail voor teamleider ${teamleiderLoginName} niet vinden`);
                        }
                    } else {
                        logPreview("⚠️ Geen TeamleiderId veld gevonden in team data");
                    }
                } else {
                    logPreview(`❌ Kon geen team vinden met naam "${aanvragerTeamNaam}"`);
                }
            } catch (e) {
                logPreview(`❌ Fout bij ophalen teamleider: ${e.message}`);
            }

            // 3. Haal seniors op
            const seniorsConfigKey = 'Seniors';
            const filterQuerySeniors = `$filter=Team eq \'${aanvragerTeamNaam}\'&$select=MedewerkerID`; 
            try {
                logPreview(`🔍 Zoeken naar seniors voor team "${aanvragerTeamNaam}"...`);
                const seniorItems = await window.getLijstItemsAlgemeen(seniorsConfigKey, filterQuerySeniors);
                if (seniorItems && seniorItems.length > 0) {
                    logPreview(`📋 ${seniorItems.length} seniors gevonden`);
                    for (const senior of seniorItems) {
                        if (senior.MedewerkerID) {
                            logPreview(`ℹ️ Senior gebruikersnaam: ${senior.MedewerkerID}`);
                            const seniorEmail = await fetchUserEmailByLoginName(senior.MedewerkerID);
                            if (seniorEmail) {
                                toEmails.push(seniorEmail);
                                logPreview(`✅ Senior e-mail: ${seniorEmail} (als TO)`);
                            } else {
                                logPreview(`❌ Kon e-mail voor senior ${senior.MedewerkerID} niet vinden`);
                            }
                        }
                    }
                } else {
                    logPreview(`⚠️ Geen seniors gevonden voor team "${aanvragerTeamNaam}"`);
                }
            } catch (e) {
                logPreview(`❌ Fout bij ophalen seniors: ${e.message}`);
            }
        }

        if (toEmails.length === 0) {
            logPreview(`⚠️ Geen teamleiders of seniors gevonden, ${verlofEmailDebugRecipient} wordt gebruikt als TO`);
            toEmails.push(verlofEmailDebugRecipient);
        }
    }

    // Verwijder duplicaten
    toEmails = [...new Set(toEmails.filter(email => email))];
    ccEmails = [...new Set(ccEmails.filter(email => email))];
    
    // Verwijder ccEmails die al in toEmails staan
    ccEmails = ccEmails.filter(email => !toEmails.includes(email));
    
    logPreview("\n📧 SAMENVATTING E-MAIL ONTVANGERS 📧");
    logPreview(`TO (${toEmails.length}): ${toEmails.join(", ")}`);
    logPreview(`CC (${ccEmails.length}): ${ccEmails.join(", ")}`);
    
    // Toon een samenvatting op de console met duidelijke formatting
    console.log("%c📧 E-MAIL ONTVANGERS VOORVERTONING 📧", "font-size: 14px; font-weight: bold; color: blue;");
    console.log("%cAAN:", "font-weight: bold;", toEmails.join(", "));
    console.log("%cCC:", "font-weight: bold;", ccEmails.join(", "));
    
    return { toEmails, ccEmails, logs: logResults };
}

// /k.zip/pages/js/meldingVerlof_logic.js (VERVANG deze functie)

/**
 * Initialiseert het verlofaanvraagformulier, vult data in voor bewerkingsmodus.
 * @param {Date} geselecteerdeDatum - De initieel geselecteerde datum.
 * @param {Object} medewerkerContext - De context van de huidige medewerker.
 * @param {Object|null} [itemData=null] - De data van het te bewerken item.
 */
async function initializeVerlofModalForm(geselecteerdeDatum, medewerkerContext, itemData = null) {
    const isEditMode = itemData !== null;
    console.log(`[MeldingVerlof] Initialiseren formulier. Modus: ${isEditMode ? 'Bewerken' : 'Nieuw'}.`);

    spWebAbsoluteUrlVerlof = window.spWebAbsoluteUrl;
    if (!spWebAbsoluteUrlVerlof) {
        toonNotificatieInVerlofModal("Kritieke fout: Serverlocatie onbekend.", "error", false);
        return;
    }

    huidigeGebruikerVerlofContext = medewerkerContext || window.huidigeGebruiker;

    if (!huidigeGebruikerVerlofContext || !huidigeGebruikerVerlofContext.normalizedUsername) {
        toonNotificatieInVerlofModal("Gebruikersinformatie kon niet worden geladen.", "error", false);
        return;
    }
    
    // --- Velden invullen ---
    const medewerkerDisplayVeld = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerIdDisplayVeld = document.getElementById('ModalMedewerkerIDDisplay');
    const verborgenMedewerkerIdVeld = document.getElementById('MedewerkerID');
    const titleInput = document.getElementById('Title');
    const aanvraagTijdstipInput = document.getElementById('AanvraagTijdstip');
    
    const startDatePicker = document.getElementById('ModalStartDatePicker');
    const endDatePicker = document.getElementById('ModalEndDatePicker');
    const startTimePicker = document.getElementById('ModalStartTimePicker');
    const endTimePicker = document.getElementById('ModalEndTimePicker');
    const omschrijvingTextarea = document.getElementById('ModalOmschrijving');

    // Vul medewerker info (blijft hetzelfde voor nieuw en bewerken)
    if (medewerkerDisplayVeld) medewerkerDisplayVeld.value = huidigeGebruikerVerlofContext.medewerkerNaamVolledig || huidigeGebruikerVerlofContext.displayName;
    if (medewerkerIdDisplayVeld) medewerkerIdDisplayVeld.value = huidigeGebruikerVerlofContext.normalizedUsername;
    if (verborgenMedewerkerIdVeld) verborgenMedewerkerIdVeld.value = huidigeGebruikerVerlofContext.normalizedUsername;

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
        titleInput.value = `Verlofaanvraag ${medewerkerDisplayVeld.value} - ${datumString}`;
        aanvraagTijdstipInput.value = vandaag.toISOString();
        
        const initDatum = geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum) ? new Date(geselecteerdeDatum) : new Date();
        const initDatumISO = initDatum.toISOString().split('T')[0];

        startDatePicker.value = initDatumISO;
        endDatePicker.value = initDatumISO;
        startTimePicker.value = "09:00";
        endTimePicker.value = "17:00";
        omschrijvingTextarea.value = '';

        // Laad redenen zonder een specifieke selectie
        await laadVerlofVakantieRedenId();
    }
    
    console.log("[MeldingVerlof] Gebruikersinfo en datums ingesteld voor verlofmodal.");
}
    // Preview de e-mail ontvangers direct na initialisatie
    console.log("[MeldingVerlof] Preview van potentiële e-mail ontvangers wordt gestart...");
    await previewVerlofNotificationRecipients(huidigeGebruikerVerlofContext);
}

/**
 * Haalt het ID van de "Verlof/vakantie" reden uit de Verlofredenen lijst.
 */
async function laadVerlofVakantieRedenId() {
    const redenIdInput = document.getElementById('RedenId');
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
            // Use the first match or a specific one if we found multiple
            verlofVakantieRedenId = redenen[0].ID;
            if (redenIdInput) {
                redenIdInput.value = String(verlofVakantieRedenId); // Ensure it's a string
                console.log("[MeldingVerlof] ID voor verlofreden succesvol geladen:", verlofVakantieRedenId, "als string:", redenIdInput.value);
            }
            
            // If we found multiple, log them for debugging purposes
            if (redenen.length > 1) {
                console.info(`[MeldingVerlof] Meerdere verlofredenen gevonden (${redenen.length}), eerste wordt gebruikt:`, 
                    redenen.map(r => `ID:${r.ID}, Title:${r.Title}`).join(', '));
            }
        } else {
            console.warn("[MeldingVerlof] Geen geschikte verlofreden gevonden in de lijst. Kan ID niet instellen.");
            toonNotificatieInVerlofModal("Standaard reden 'Verlof/vakantie' kon niet worden gevonden. Controleer de configuratie.", "error", false);
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
 * Valideert het verlofaanvraagformulier.
 * @returns {boolean} True als valide, anders false.
 */
function valideerVerlofModalFormulier() {
    const startDatePicker = document.getElementById('ModalStartDatePicker');
    const startTimePicker = document.getElementById('ModalStartTimePicker');
    const endDatePicker = document.getElementById('ModalEndDatePicker');
    const endTimePicker = document.getElementById('ModalEndTimePicker');

    if (!startDatePicker || !startTimePicker || !endDatePicker || !endTimePicker) {
        console.error("[MeldingVerlof] Een of meer validatievelden niet gevonden in modal.");
        toonNotificatieInVerlofModal("Fout: Formulier validatie kan niet worden uitgevoerd (elementen missen).", "error", false);
        return false;
    }

    if (!startDatePicker.value || !startTimePicker.value || !endDatePicker.value || !endTimePicker.value) {
        toonNotificatieInVerlofModal('Vul alle verplichte datum- en tijdvelden (*) in.', 'error', false);
        return false;
    }

    const startDateTime = new Date(`${startDatePicker.value}T${startTimePicker.value}`);
    const endDateTime = new Date(`${endDatePicker.value}T${endTimePicker.value}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toonNotificatieInVerlofModal('Ongeldige datum of tijd ingevoerd.', 'error', false);
        return false;
    }

    if (endDateTime <= startDateTime) {
        toonNotificatieInVerlofModal('De einddatum en -tijd moeten na de startdatum en -tijd liggen.', 'error', false);
        return false;
    }
    return true;
}

// /k.zip/pages/js/meldingVerlof_logic.js (VERVANG deze functie)

/**
 * Verwerkt het verzenden van het verlofaanvraagformulier.
 * @param {HTMLFormElement} formElement - Het formulier element uit de modal.
 * @param {Object} medewerkerContext - De context van de huidige medewerker.
 * @param {Date} geselecteerdeDatum - De initieel geselecteerde datum.
 * @param {number|null} [itemId=null] - Het ID van het item als we in bewerkingsmodus zijn.
 * @returns {Promise<boolean>} True als succesvol, anders false.
 */
async function handleVerlofModalFormSubmit(formElement, medewerkerContext, geselecteerdeDatum, itemId = null) {
    const isEditMode = itemId !== null;
    console.log(`[MeldingVerlof] Formulierverwerking gestart. Modus: ${isEditMode ? 'Update' : 'Create'}, Item ID: ${itemId}`);
    
    const submitButton = document.getElementById('modal-action-button');

    if (!valideerVerlofModalFormulier()) return false;
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = (typeof getSpinnerSvg === 'function' ? getSpinnerSvg() : '') + (isEditMode ? 'Opslaan...' : 'Indienen...');
    }
    toonNotificatieInVerlofModal(isEditMode ? 'Wijzigingen opslaan...' : 'Aanvraag indienen...', 'info', false);

    // Verzamel data uit het formulier
    const startDateTime = new Date(`${document.getElementById('ModalStartDatePicker').value}T${document.getElementById('ModalStartTimePicker').value}`).toISOString();
    const endDateTime = new Date(`${document.getElementById('ModalEndDatePicker').value}T${document.getElementById('ModalEndTimePicker').value}`).toISOString();
    const redenIdValue = document.getElementById('RedenId').value;
    const redenText = document.querySelector('#verlof-reden option:checked')?.textContent || "Verlof/vakantie";

    const formDataPayload = {
        StartDatum: startDateTime,
        EindDatum: endDateTime,
        RedenId: redenIdValue,
        Reden: redenText,
        Omschrijving: document.getElementById('ModalOmschrijving').value,
        Status: 'Nieuw', // Bij bewerken altijd terug naar 'Nieuw' voor herbeoordeling
    };

    if (!isEditMode) {
        // Voeg deze velden alleen toe bij het aanmaken, ze veranderen niet bij bewerken.
        formDataPayload.Title = document.getElementById('Title').value;
        formDataPayload.Medewerker = document.getElementById('ModalMedewerkerDisplay').value;
        formDataPayload.MedewerkerID = document.getElementById('MedewerkerID').value;
        formDataPayload.AanvraagTijdstip = new Date().toISOString();
    }
    
    try {
        if (isEditMode) {
            await window.updateSPListItem('Verlof', itemId, formDataPayload);
            toonNotificatieInVerlofModal('Verlofaanvraag succesvol bijgewerkt.', 'success');
        } else {
            await window.createSPListItem('Verlof', formDataPayload);
            toonNotificatieInVerlofModal('Verlofaanvraag succesvol ingediend.', 'success');
        }

        // Ververs rooster en sluit modal
        if (typeof window.laadInitiëleData === 'function') {
            await window.laadInitiëleData(false);
        }
        closeModal();
        return true;

    } catch (error) {
        console.error('[MeldingVerlof] Fout bij opslaan verlofaanvraag:', error);
        toonNotificatieInVerlofModal(`Fout bij opslaan: ${error.message}.`, 'error', false);
        return false;
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? 'Wijzigingen Opslaan' : 'Aanvraag Indienen';
        }
    }
}
    try {
        if (typeof window.createSPListItem !== 'function') {
            throw new Error("Functie createSPListItem is niet beschikbaar.");
        }
        await window.createSPListItem(verlofLijstConfigKey, formDataPayload);

        console.log("[MeldingVerlof] Verlofaanvraag succesvol opgeslagen in SharePoint.");
        toonNotificatieInVerlofModal('Verlofaanvraag succesvol ingediend!', 'success');

        // Send email notification
        try {
            // Geef de volledige medewerkerContext mee, zodat we de teamnaam kunnen ophalen
            await sendVerlofNotificationEmail(formDataPayload, medewerkerContext); 
            console.log("[MeldingVerlof] E-mailnotificatie proces gestart/voltooid.");
        } catch (emailError) {
            console.error("[MeldingVerlof] Fout bij verzenden e-mailnotificatie:", emailError);
            // Optional: Notify user that email sending failed, but request was saved.
            // toonNotificatieInVerlofModal('Verlofaanvraag opgeslagen, maar e-mailnotificatie kon niet worden verzonden.', 'warning', 5000);
        }

        if (formElement) formElement.reset();
        await initializeVerlofModalForm(geselecteerdeDatum, medewerkerContext);

        setTimeout(() => {
            const pDirektLink = "https://sap-portal.p-direkt.rijksweb.nl/irj/portal/medewerker/verlofwerktijd/verlofregistreren";
            const berichtHTML = `Vergeet niet om je verlofaanvraag ook in <a href=\\"${pDirektLink}\\" target=\\"_blank\\" title=\\"Open P-Direkt in een nieuw tabblad\\" class=\\"text-blue-600 dark:text-blue-400 hover:underline\\">P-Direkt</a> te registreren!`;
            if (typeof toonModalNotificatie === 'function') {
                toonModalNotificatie(berichtHTML, 'info', 15000);
            } else {
                toonNotificatieInVerlofModal(berichtHTML, 'info', 15000);
            }
        }, 500);
        return true;

    } catch (error) {
        console.error('[MeldingVerlof] Fout bij indienen verlofaanvraag:', error);
        toonNotificatieInVerlofModal(`Fout bij indienen: ${error.message}. Probeer het opnieuw.`, 'error', false);
        return false;
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Aanvraag Indienen';
        }
    }
}

/**
 * Haalt het e-mailadres van een gebruiker op basis van loginnaam.
 * @param {string} loginName De loginnaam van de gebruiker (bijv. \'i:0#.w|domein\\\\gebruiker\').
 * @returns {Promise<string|null>} Het e-mailadres of null als niet gevonden/fout.
 */
async function fetchUserEmailByLoginName(loginName) {
    if (!loginName) {
        console.warn("[MeldingVerlof] Geen loginName opgegeven voor fetchUserEmailByLoginName.");
        return null;
    }
    if (!spWebAbsoluteUrlVerlof) {
        console.error("[MeldingVerlof] SharePoint site URL niet beschikbaar voor fetchUserEmailByLoginName.");
        return null;
    }

    // Probeer te normaliseren als de naam niet in het juiste formaat is
    let normalizedLogin = loginName;
    
    // Check if loginName has claims-based prefix (i:0#.w|), if not add it
    if (!loginName.startsWith('i:0#.w|') && !loginName.includes('@')) {
        // Assume it's a domain\user format without the claims prefix
        normalizedLogin = `i:0#.w|${loginName}`;
        console.log(`[MeldingVerlof] Login naam geconverteerd naar claims format: ${normalizedLogin}`);
    }

    // Specifieke SharePoint OOTB formattering voor ensureuser
    const encodedLogin = encodeURIComponent(normalizedLogin);
    
    // Probeer eerst met EnsureUser endpoint
    const endpointUrl = `${spWebAbsoluteUrlVerlof}/_api/web/ensureuser('${encodedLogin}')`;
    
    console.log(`[MeldingVerlof] Ophalen e-mail voor login: ${loginName} (genormaliseerd: ${normalizedLogin})`);
    console.log(`[MeldingVerlof] URL-encoded voor API call: ${encodedLogin}`);
    console.log(`[MeldingVerlof] Endpoint URL: ${endpointUrl}`);
    
    try {
        // Eerst request digest ophalen
        const requestDigest = await getRequestDigestVerlof();
        console.log("[MeldingVerlof] RequestDigest opgehaald, lengte:", requestDigest ? requestDigest.length : 0);
        
        // Nu de eigenlijke user lookup
        const response = await fetch(endpointUrl, {
            method: 'POST', // EnsureUser is een POST
            headers: {
                'Accept': 'application/json;odata=verbose',
                'X-RequestDigest': requestDigest
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[MeldingVerlof] HTTP ${response.status} fout bij ophalen gebruiker ${loginName}:`, errorText);
            
            // Als EnsureUser faalt, probeer via getstringfromusername
            console.log("[MeldingVerlof] EnsureUser gefaald, probeer alternatieve methode via _api/SP.Web.CurrentUser...");
            
            // Fallback naar een query op de _api/web/siteusers endpoint met filter op loginname
            // Dit is minder betrouwbaar maar kan soms werken als ensureuser faalt
            const siteUsersUrl = `${spWebAbsoluteUrlVerlof}/_api/web/siteusers?$filter=startswith(LoginName,'${encodedLogin}')&$select=Email,Title,LoginName`;
            const siteUsersResponse = await fetch(siteUsersUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=verbose' }
            });
            
            if (siteUsersResponse.ok) {
                const siteUsersData = await siteUsersResponse.json();
                if (siteUsersData && siteUsersData.d && siteUsersData.d.results && siteUsersData.d.results.length > 0) {
                    const matchedUser = siteUsersData.d.results[0];
                    if (matchedUser.Email) {
                        console.log(`[MeldingVerlof] E-mail gevonden via alternatieve methode: ${matchedUser.Email} (voor ${matchedUser.Title})`);
                        return matchedUser.Email;
                    }
                }
            }
            
            // Als laatste resort, probeer een hardcoded lookup voor bekende gebruikers (voor testen)
            console.log("[MeldingVerlof] Probeer hardcoded lookup als laatste resort");
            if (loginName.toLowerCase().includes('nijburgc')) {
                return "c.nijburg@om.nl";
            } else if (loginName.toLowerCase().includes('busselw')) {
                return "w.van.bussel@om.nl";
            } else if (loginName.toLowerCase().includes('team')) {
                return "teamleider@om.nl";
            } else if (loginName.toLowerCase().includes('senior')) {
                return "senior@om.nl";
            }
            
            return null;
        }
        
        const data = await response.json();
        if (data && data.d && data.d.Email) {
            console.log(`[MeldingVerlof] E-mail succesvol gevonden voor ${loginName}: ${data.d.Email}`);
            return data.d.Email;
        } else {
            console.warn(`[MeldingVerlof] Response bevat geen e-mailadres voor ${loginName}:`, JSON.stringify(data));
            
            // Kijk of er andere bruikbare velden zijn zoals UserPrincipalName
            if (data && data.d && data.d.UserPrincipalName && data.d.UserPrincipalName.includes('@')) {
                console.log(`[MeldingVerlof] UserPrincipalName gevonden, gebruik dit als e-mail: ${data.d.UserPrincipalName}`);
                return data.d.UserPrincipalName;
            }
            
            return null;
        }
    } catch (error) {
        console.error(`[MeldingVerlof] Exception bij ophalen e-mail voor ${loginName}:`, error);
        return null;
    }
}


/**
 * Verstuurt een e-mailnotificatie na een succesvolle verlofaanvraag.
 * @param {Object} verlofData - De data van de ingediende verlofaanvraag.
 * @param {Object} aanvragerContext - De context van de aanvrager (voor teaminfo).
 */
async function sendVerlofNotificationEmail(verlofData, aanvragerContext) {
    if (!spWebAbsoluteUrlVerlof) {
        console.error("[MeldingVerlof] SharePoint site URL (spWebAbsoluteUrlVerlof) is niet ingesteld. Kan e-mail niet versturen.");
        throw new Error("SharePoint site URL is niet geconfigureerd voor e-mailverzending.");
    }

    let toEmails = [];
    let ccEmails = [];

    // Voeg e-mail van aanvrager toe aan CC
    if (aanvragerContext && aanvragerContext.email) {
        ccEmails.push(aanvragerContext.email);
        console.log(`[MeldingVerlof] Aanvrager e-mail toegevoegd aan CC: ${aanvragerContext.email}`);
    } else if (huidigeGebruikerVerlofContext && huidigeGebruikerVerlofContext.email) {
        // Fallback als aanvragerContext.email niet beschikbaar is
        console.warn("[MeldingVerlof] aanvragerContext.email niet beschikbaar, fallback naar huidigeGebruikerVerlofContext.email voor CC.");
        ccEmails.push(huidigeGebruikerVerlofContext.email);
        console.log(`[MeldingVerlof] Fallback aanvrager e-mail toegevoegd aan CC: ${huidigeGebruikerVerlofContext.email}`);
    } else {
        console.warn("[MeldingVerlof] Kon e-mail van aanvrager niet vinden voor CC.");
    }
    
    if (verlofEmailDebugMode) {
        // In debug mode, send email only to debug recipient
        toEmails.push(verlofEmailDebugRecipient);
        console.log(`[MeldingVerlof] DEBUG MODE: E-mail wordt alleen naar ${verlofEmailDebugRecipient} gestuurd.`);
    } else {
        // In production mode, add debug recipient to CC
        ccEmails.push(verlofEmailDebugRecipient);
        console.log(`[MeldingVerlof] Debug e-mail toegevoegd aan CC: ${verlofEmailDebugRecipient}`);
        console.log("[MeldingVerlof] PRODUCTIE MODE: E-mailadressen ophalen voor teamleider en seniors.");

        // 1. Haal team van aanvrager op
        let aanvragerTeamNaam = null;
        if (aanvragerContext && aanvragerContext.normalizedUsername) {
            const medewerkersConfigKey = 'Medewerkers';
            const filterQueryMedewerker = `$filter=Username eq \'${aanvragerContext.normalizedUsername}\'&$select=Team`;
            try {
                const medewerkerItems = await window.getLijstItemsAlgemeen(medewerkersConfigKey, filterQueryMedewerker);
                if (medewerkerItems && medewerkerItems.length > 0 && medewerkerItems[0].Team) {
                    aanvragerTeamNaam = medewerkerItems[0].Team;
                    console.log(`[MeldingVerlof] Team van aanvrager (${aanvragerContext.normalizedUsername}): ${aanvragerTeamNaam}`);
                } else {
                    console.warn(`[MeldingVerlof] Kon team voor aanvrager ${aanvragerContext.normalizedUsername} niet vinden.`);
                }
            } catch (e) {
                console.error(`[MeldingVerlof] Fout bij ophalen team voor aanvrager: ${e}`);
            }
        } else {
            console.warn("[MeldingVerlof] Geen aanvragerContext of username beschikbaar om team op te halen.");
        }

        if (aanvragerTeamNaam) {
            // 2. Haal teamleider op
            const teamsConfigKey = 'Teams';
            
            // More detailed logging for debugging
            console.log(`[MeldingVerlof] Zoeken naar teamleider voor team '${aanvragerTeamNaam}' via lijst '${teamsConfigKey}'`);
            
            // Exact match op Title, probeer ook met variaties in hoofdlettergebruik
            const filterQueryTeam = `$filter=Title eq '${aanvragerTeamNaam}'&$select=TeamleiderId,Title`;
            
            try {
                console.log(`[MeldingVerlof] Teams query: ${filterQueryTeam}`);
                let teamItems = await window.getLijstItemsAlgemeen(teamsConfigKey, filterQueryTeam);
                
                // Als exact match niet werkt, probeer een meer flexibele zoekopdracht
                if (!teamItems || teamItems.length === 0) {
                    console.log(`[MeldingVerlof] Geen exact match voor team '${aanvragerTeamNaam}', probeer alternatieve zoekmethoden...`);
                    
                    // Poging 1: substringof voor gedeeltelijke overeenkomsten
                    const filterQueryTeamAlt1 = `$filter=substringof('${aanvragerTeamNaam}', Title)&$select=TeamleiderId,Title`;
                    console.log(`[MeldingVerlof] Teams alternatieve query 1: ${filterQueryTeamAlt1}`);
                    teamItems = await window.getLijstItemsAlgemeen(teamsConfigKey, filterQueryTeamAlt1);
                    
                    // Poging 2: Haal alle teams op en filter clientside als de eerste pogingen niet werken
                    if (!teamItems || teamItems.length === 0) {
                        console.log("[MeldingVerlof] Alternatieve query 1 gefaald, haal alle teams op voor clientside filtering");
                        const allTeamsQuery = "$select=TeamleiderId,Title";
                        const allTeams = await window.getLijstItemsAlgemeen(teamsConfigKey, allTeamsQuery);
                        
                        if (allTeams && allTeams.length > 0) {
                            console.log(`[MeldingVerlof] ${allTeams.length} teams opgehaald voor clientside filtering`);
                            
                            // Log alle gevonden teams voor debug doeleinden
                            allTeams.forEach((team, idx) => {
                                console.log(`[MeldingVerlof] Team ${idx+1}: Title='${team.Title}', TeamleiderId=${team.TeamleiderId || 'leeg'}`);
                            });
                            
                            // Zoek case-insensitive match
                            teamItems = allTeams.filter(team => 
                                team.Title && aanvragerTeamNaam && 
                                team.Title.toLowerCase() === aanvragerTeamNaam.toLowerCase());
                            
                            if (teamItems.length === 0) {
                                // Probeer contains match als laatste resort
                                teamItems = allTeams.filter(team => 
                                    team.Title && aanvragerTeamNaam && 
                                    (team.Title.toLowerCase().includes(aanvragerTeamNaam.toLowerCase()) || 
                                     aanvragerTeamNaam.toLowerCase().includes(team.Title.toLowerCase())));
                            }
                        }
                    }
                }
                
                if (teamItems && teamItems.length > 0) {
                    console.log(`[MeldingVerlof] ${teamItems.length} team(s) gevonden:`);
                    teamItems.forEach((team, idx) => {
                        console.log(`[MeldingVerlof] Gevonden team ${idx+1}: Title='${team.Title}', TeamleiderId=${team.TeamleiderId || 'leeg'}`);
                    });
                    
                    // Gebruik de eerste match met een geldige TeamleiderId
                    const teamWithTeamleider = teamItems.find(team => team.TeamleiderId);
                    
                    if (teamWithTeamleider && teamWithTeamleider.TeamleiderId) {
                        const teamleiderLoginName = teamWithTeamleider.TeamleiderId;
                        console.log(`[MeldingVerlof] Teamleider login naam gevonden: ${teamleiderLoginName}`);
                        const teamleiderEmail = await fetchUserEmailByLoginName(teamleiderLoginName);
                        if (teamleiderEmail) {
                            toEmails.push(teamleiderEmail);
                            console.log(`[MeldingVerlof] Teamleider e-mail succesvol toegevoegd aan TO: ${teamleiderEmail}`);
                        } else {
                            console.warn(`[MeldingVerlof] Kon e-mail voor teamleider ${teamleiderLoginName} niet vinden.`);
                        }
                    } else {
                        console.warn(`[MeldingVerlof] Geen TeamleiderId gevonden in de ${teamItems.length} teams.`);
                    }
                } else {
                     console.warn(`[MeldingVerlof] Kon teamleider voor team '${aanvragerTeamNaam}' niet vinden.`);
                }
            } catch (e) {
                console.error(`[MeldingVerlof] Fout bij ophalen teamleider: ${e}`);
            }

            // 3. Haal seniors op
            const seniorsConfigKey = 'Seniors';
            // Aanname: Seniors.Team matcht met Teams.Title (en dus Medewerkers.Team)
            const filterQuerySeniors = `$filter=Team eq \'${aanvragerTeamNaam}\'&$select=MedewerkerID`; 
            try {
                const seniorItems = await window.getLijstItemsAlgemeen(seniorsConfigKey, filterQuerySeniors);
                if (seniorItems && seniorItems.length > 0) {
                    console.log(`[MeldingVerlof] ${seniorItems.length} seniors gevonden voor team '${aanvragerTeamNaam}'.`);
                    for (const senior of seniorItems) {
                        if (senior.MedewerkerID) {
                            console.log(`[MeldingVerlof] Senior login naam gevonden: ${senior.MedewerkerID}`);
                            const seniorEmail = await fetchUserEmailByLoginName(senior.MedewerkerID);
                            if (seniorEmail) {
                                toEmails.push(seniorEmail);
                                console.log(`[MeldingVerlof] Senior e-mail succesvol toegevoegd aan TO: ${seniorEmail}`);
                            } else {
                                console.warn(`[MeldingVerlof] Kon e-mail voor senior ${senior.MedewerkerID} niet vinden.`);
                            }
                        } else {
                            console.warn("[MeldingVerlof] Senior zonder MedewerkerID gevonden, wordt overgeslagen.");
                        }
                    }
                } else {
                    console.warn(`[MeldingVerlof] Geen seniors gevonden voor team '${aanvragerTeamNaam}'.`);
                }
            } catch (e) {
                console.error(`[MeldingVerlof] Fout bij ophalen seniors: ${e}`);
            }
        }
        
        if (toEmails.length === 0) {
            console.warn("[MeldingVerlof] Geen TO ontvangers gevonden voor e-mail (teamleider/seniors).");
            // Als er geen teamleiders of seniors gevonden zijn, gebruik de debug ontvanger als fallback
            console.log(`[MeldingVerlof] Gebruik debug ontvanger ${verlofEmailDebugRecipient} als fallback TO ontvanger`);
            toEmails.push(verlofEmailDebugRecipient);
        }
    }
    
    // Verwijder duplicaten en maak uniek
    toEmails = [...new Set(toEmails.filter(email => email))]; // Filter null/lege emails
    ccEmails = [...new Set(ccEmails.filter(email => email))];
    
    // Check of verlofEmailDebugRecipient al in toEmails zit, zo ja verwijder uit ccEmails
    if (toEmails.includes(verlofEmailDebugRecipient)) {
        ccEmails = ccEmails.filter(email => email !== verlofEmailDebugRecipient);
    }
    
    console.log(`[MeldingVerlof] Definitieve lijst e-mail ontvangers - TO (${toEmails.length}): ${toEmails.join(', ')}`);
    console.log(`[MeldingVerlof] Definitieve lijst e-mail ontvangers - CC (${ccEmails.length}): ${ccEmails.join(', ')}`);

    if (toEmails.length === 0 && ccEmails.length === 0) {
        console.warn("[MeldingVerlof] Geen TO of CC ontvangers voor e-mail. Verzenden wordt overgeslagen.");
        return; // Sla verzenden over als er helemaal geen ontvangers zijn.
    }
     if (toEmails.length === 0 && ccEmails.length > 0) {
        // Als er geen TO is, maar wel CC, stuur dan naar de eerste CC als TO, en de rest als CC.
        // Dit is een SharePoint eigenaardigheid; SendEmail vereist minstens één TO.
        console.warn("[MeldingVerlof] Geen TO ontvangers, eerste CC wordt als TO gebruikt.");
        toEmails.push(ccEmails.shift()); 
    }


    const medewerkerNaam = verlofData.Medewerker || "Onbekende Medewerker";
    const startDatum = new Date(verlofData.StartDatum);
    const eindDatum = new Date(verlofData.EindDatum);
    
    // Format dates and times for display
    const startDatumStr = startDatum.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const eindDatumStr = eindDatum.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const startTijdStr = startDatum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const eindTijdStr = eindDatum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    
    // Calculate number of days (including partial days)
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const durationInDays = (eindDatum - startDatum) / millisecondsPerDay;
    const aantalDagen = durationInDays < 0.95 ? 
                        durationInDays.toFixed(1) + " dag" : 
                        Math.ceil(durationInDays) + " dagen";
    
    // Get optional comment
    const opmerkingen = verlofData.Omschrijving && verlofData.Omschrijving.trim() ? 
                        verlofData.Omschrijving.trim() : 
                        "geen";
    
    // Get reason for leave
    const verlofReden = verlofData.Reden || "Verlof/vakantie";

    const subject = `Verlofaanvraag ${medewerkerNaam}`;
    const body = `
        <div style="font-family: Arial, sans-serif; font-size: 10pt;">
            <p>Hoooooi,</p>
            
            <p>${medewerkerNaam} heeft een verlofaanvraag ingediend. Hij/Zij staat in de CC, zodat die ook meteen op de hoogte is.</p>
            
            <p>Hier zijn de details van de aanvraag:</p>
            <ul>
                <li><strong>Aanvraag door:</strong> ${medewerkerNaam}</li>
                <li><strong>Wanneer:</strong> Van ${startDatumStr} ${startTijdStr} tot en met ${eindDatumStr} ${eindTijdStr}</li>
                <li><strong>Hoeveel:</strong> ${aantalDagen}</li>
                <li><strong>Wat voor verlof:</strong> ${verlofReden}</li>
                <li><strong>Eventuele opmerkingen:</strong> ${opmerkingen}</li>
            </ul>
            
            <p><a href="https://som.org.om.local/sites/MulderT/CustomPW/Verlof/CPW/Rooster/verlofrooster.aspx">Klik hier</a> om door te gaan naar het verlofrooster.</p>
            
            <p>Met vriendelijke groet,</p>
            
            <p>V. Rooster<br>
            Administratief medewerker<br>
            Openbaar ministerie</p>
        </div>
    `;

    const emailPayload = {
        'properties': {
            '__metadata': { 'type': 'SP.Utilities.EmailProperties' },
            'To': { 'results': toEmails },
            'CC': { 'results': ccEmails },
            'Subject': subject,
            'Body': body,
            'AdditionalHeaders': {
                '__metadata': { 'type': 'Collection(SP.KeyValue)' },
                'results': [
                    {
                        '__metadata': { 'type': 'SP.KeyValue' },
                        'Key': 'content-type',
                        'Value': 'text/html',
                        'ValueType': 'Edm.String'
                    }
                ]
            }
        }
    };

    const requestDigest = await getRequestDigestVerlof();
    const apiUrl = `${spWebAbsoluteUrlVerlof}/_api/SP.Utilities.Utility.SendEmail`;

    console.log("[MeldingVerlof] Voorbereiden e-mailverzending. To:", toEmails, "CC:", ccEmails, "Payload:", JSON.stringify(emailPayload, null, 2));

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest
        },
        body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: { value: "Onbekende serverfout bij e-mailverzending." } } }));
        const errorMessage = errorData.error?.message?.value || `HTTP ${response.status} - ${response.statusText}`;
        console.error(`[MeldingVerlof] Fout bij verzenden e-mail via SP REST API: ${errorMessage}`, errorData);
        throw new Error(`Kon e-mail niet verzenden: ${errorMessage}`);
    }

    console.log("[MeldingVerlof] E-mail succesvol verzonden via SP REST API.");
}


// Exporteer de initialisatiefunctie zodat deze vanuit verlofroosterModal_logic.js kan worden aangeroepen
window.initializeVerlofModalForm = initializeVerlofModalForm;
// Exporteer ook de submit handler
window.handleVerlofModalFormSubmit = handleVerlofModalFormSubmit;
// Exporteer de previewfunctie zodat deze handmatig kan worden aangeroepen
window.previewVerlofNotificationRecipients = previewVerlofNotificationRecipients;

console.log("Rooster/pages/js/meldingVerlof_logic.js geladen met uitgebreide e-mail logica en debug mode.");
