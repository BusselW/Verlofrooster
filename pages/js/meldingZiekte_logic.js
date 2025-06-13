// Rooster/pages/js/meldingZiekte_logic.js

/**
 * Logica voor de Ziek/Beter melden functionaliteit, specifiek wanneer deze
 * binnen een modal wordt geladen vanuit het hoofd verlofrooster.
 * Deze code is grotendeels gebaseerd op MeldingZiekte_logic.js, maar aangepast
 * voor ziekmeldingen.
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

/**
 * Utility functie om SharePoint claims prefix van loginnaam te verwijderen.
 * @param {string} loginNaam - De volledige SharePoint loginnaam.
 * @returns {string} De genormaliseerde loginnaam.
 */

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
        const errorTekst = await response.text().catch(()=>"Onbekende serverfout");
        console.error("[MeldingZiekte] Fout bij ophalen request digest:", response.status, errorTekst);
        throw new Error(`Kon request digest niet ophalen: ${response.status} - ${errorTekst.substring(0,100)}`);
    }
    const data = await response.json();
    console.log("[MeldingZiekte] Request Digest succesvol opgehaald.");
    return data.d.GetContextWebInformation.FormDigestValue;
}

/**
 * Diagnosticeert potentiële thema-gerelateerde problemen in de modal
 * en toont deze in de console.
 */
function diagnoseThemeIssues() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    console.log("[MeldingZiekte] Thema diagnose:");
    console.log(`- Document body heeft dark-theme class: ${isDarkTheme}`);
    
    const cssVariables = [
        '--table-header-bg-beheer',
        '--main-text-color-beheer',
        '--table-row-border-beheer',
        '--background-color',
        '--text-color'
    ];
    
    const testElement = document.createElement('div');
    document.body.appendChild(testElement);
    
    console.log("- CSS variabelen gecontroleerd op test element:");
    cssVariables.forEach(variable => {
        const value = getComputedStyle(testElement).getPropertyValue(variable);
        console.log(`  ${variable}: "${value}"`);
    });
    
    document.body.removeChild(testElement);
    
    // Controleer modal styling
    const modalElement = document.querySelector('.modal-content');
    if (modalElement) {
        console.log("- Modal element styling:");
        const modalBg = getComputedStyle(modalElement).backgroundColor;
        const modalText = getComputedStyle(modalElement).color;
        console.log(`  backgroundColor: "${modalBg}"`);
        console.log(`  color: "${modalText}"`);
    } else {
        console.log("- Geen modal element gevonden voor styling diagnose");
    }

    // Controleer of CSS geladen is
    const cssLink = document.getElementById('ziekte-melding-styles');
    console.log(`- Ziekte CSS is geladen: ${cssLink !== null}`);
    if (cssLink) {
        console.log(`  href: ${cssLink.href}`);
    }
}

/**
 * Toont een notificatie bericht aan de gebruiker BINNEN DE MODAL.
 * Verbeterde versie met betere thema-ondersteuning.
 * @param {string} berichtHTML - Het te tonen bericht (kan HTML bevatten).
 * @param {'success'|'error'|'info'} type - Het type notificatie.
 * @param {number|false} [autoHideDelay=7000] - Vertraging in ms voor auto-hide, of false om niet automatisch te verbergen.
 */
function toonNotificatieInZiekmeldingModal(berichtHTML, type = 'info', autoHideDelay = 7000) {
    const modalNotificationArea = document.getElementById('modal-notification-area'); // ID binnen de modal
    if (!modalNotificationArea) {
        console.warn("[MeldingZiekte] Notificatiegebied (#modal-notification-area) niet gevonden in modal voor bericht:", berichtHTML);
        // Fallback naar een globale notificatie indien beschikbaar, of log simpelweg.
        if (typeof window.toonModalNotificatie === 'function') { // Gebruik de globale modal notificatie functie
            window.toonModalNotificatie(berichtHTML.replace(/<[^>]*>?/gm, ''), type, autoHideDelay);
        } else {
            console.log(`[MeldingZiekte ModalNotificatie] Type: ${type}, Bericht: ${berichtHTML}`);
        }
        return;
    }

    console.log(`[MeldingZiekte ModalNotificatie] Type: ${type}, Bericht: ${berichtHTML}`);
    
    // Clean existing classes
    modalNotificationArea.className = 'notification-area';
    
    // Set type-specific class
    modalNotificationArea.classList.add(type);
    
    // Set content
    modalNotificationArea.innerHTML = berichtHTML;
    
    // Make visible
    modalNotificationArea.style.display = 'block';

    // Clear any previous timers
    if (modalNotificationArea.timeoutId) {
        clearTimeout(modalNotificationArea.timeoutId);
    }

    // Set auto-hide if requested
    if (autoHideDelay !== false && autoHideDelay > 0) {
        modalNotificationArea.timeoutId = setTimeout(() => {
            if (modalNotificationArea) {
                modalNotificationArea.style.display = 'none';
            }
        }, autoHideDelay);
    }
}

/**
 * Preview functie die potentiële ontvangers toont voordat het formulier wordt verzonden.
 * @param {Object} medewerkerContext - De context van de huidige medewerker.
 */
async function previewVerlofNotificationRecipients(medewerkerContext) {
    console.log("[MeldingZiekte] Voorvertoning van e-mail ontvangers...");
    
    if (!spWebAbsoluteUrlVerlof) {
        console.error("[MeldingZiekte] SharePoint site URL niet beschikbaar voor e-mailvoorvertoning.");
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



/**
 * Genereert een spinner SVG voor gebruik in loading states.
 * @returns {string} HTML string voor spinner SVG.
 */
function getSpinnerSvg() {
    return '<div class="spinner mr-2 inline-block"></div>';
}

/**
 * Voegt dynamisch een CSS link element toe voor de ziekmelding styling.
 * Moet aangeroepen worden bij het initialiseren van de modal.
 */
function laadZiekmeldingCSS() {
    const cssId = 'ziekte-melding-styles';
    // Controleer of de stylesheet al is toegevoegd
    if (!document.getElementById(cssId)) {
        console.log("[MeldingZiekte] CSS styling wordt geladen...");
        const baseUrl = spWebAbsoluteUrlZiekmelding || window.spWebAbsoluteUrl || '';
        const head = document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = `${baseUrl}/css/meldingZiekte_styles.css`;
        link.media = 'all';
        head.appendChild(link);
    }
}

/**
 * Voegt dynamisch een style element toe aan de <head> voor ziekmeldingsformulier styling
 * Gebruikt inline CSS omdat het laden van externe CSS bestanden problematisch kan zijn.
 */
function laadZiekmeldingInlineCSS() {
    const styleId = 'ziekte-melding-inline-styles';
    
    // Controleer of de stylesheet al is toegevoegd
    if (!document.getElementById(styleId)) {
        console.log("[MeldingZiekte] Inline CSS styling wordt toegevoegd...");
        
        const head = document.getElementsByTagName('head')[0];
        const style = document.createElement('style');
        style.id = styleId;
        style.type = 'text/css';
        
        // Inline CSS regels
        style.textContent = `
/* Base modal styling specifiek voor ziekmeldingen */
.ziekte-modal {
    max-width: 600px;
    border-radius: 8px;
}

/* Form styling */
.ziekte-form-group {
    margin-bottom: 1rem;
}

.ziekte-form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.ziekte-form-group input,
.ziekte-form-group textarea,
.ziekte-form-group select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.ziekte-form-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.ziekte-form-col {
    flex: 1;
}

/* Notification area styling */
#modal-notification-area {
    border-radius: 4px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
}

/* Licht thema */
body:not(.dark-theme) .ziekte-modal {
    background-color: #ffffff;
    color: #333333;
    border: 1px solid #e0e0e0;
}

body:not(.dark-theme) .ziekte-form-group input,
body:not(.dark-theme) .ziekte-form-group textarea,
body:not(.dark-theme) .ziekte-form-group select {
    background-color: #ffffff;
    color: #333333;
    border-color: #d0d0d0;
}

body:not(.dark-theme) .ziekte-form-group input:focus,
body:not(.dark-theme) .ziekte-form-group textarea:focus,
body:not(.dark-theme) .ziekte-form-group select:focus {
    border-color: #4a86e8;
    outline: none;
    box-shadow: 0 0 0 2px rgba(74, 134, 232, 0.2);
}

body:not(.dark-theme) #modal-action-button {
    background-color: #4a86e8;
    color: white;
}

body:not(.dark-theme) #modal-action-button:hover {
    background-color: #3a76d8;
}

/* Donker thema */
body.dark-theme .ziekte-modal {
    background-color: #2d2d2d;
    color: #e0e0e0;
    border: 1px solid #444444;
}

body.dark-theme .ziekte-form-group label {
    color: #e0e0e0;
}

body.dark-theme .ziekte-form-group input,
body.dark-theme .ziekte-form-group textarea,
body.dark-theme .ziekte-form-group select {
    background-color: #3a3a3a;
    color: #e0e0e0;
    border-color: #555555;
}

body.dark-theme .ziekte-form-group input:focus,
body.dark-theme .ziekte-form-group textarea:focus,
body.dark-theme .ziekte-form-group select:focus {
    border-color: #6a9eee;
    outline: none;
    box-shadow: 0 0 0 2px rgba(106, 158, 238, 0.2);
}

body.dark-theme #modal-action-button {
    background-color: #6a9eee;
    color: white;
}

body.dark-theme #modal-action-button:hover {
    background-color: #5a8ede;
}

/* Date and time pickers */
.ziekte-date-time-container {
    display: flex;
    gap: 0.5rem;
}

.ziekte-date-container {
    flex: 3;
}

.ziekte-time-container {
    flex: 2;
}

/* Notifications */
.notification-area.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    padding: 10px;
    margin-bottom: 15px;
}

.notification-area.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    padding: 10px;
    margin-bottom: 15px;
}

.notification-area.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
    padding: 10px;
    margin-bottom: 15px;
}

body.dark-theme .notification-area.success {
    background-color: rgba(40, 167, 69, 0.2);
    color: #8fd19e;
    border-color: rgba(40, 167, 69, 0.4);
}

body.dark-theme .notification-area.error {
    background-color: rgba(220, 53, 69, 0.2);
    color: #ea868f;
    border-color: rgba(220, 53, 69, 0.4);
}

body.dark-theme .notification-area.info {
    background-color: rgba(23, 162, 184, 0.2);
    color: #6edff6;
    border-color: rgba(23, 162, 184, 0.4);
}

/* Spinner animation for loading states */
.spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
        `;
        
        head.appendChild(style);
        console.log("[MeldingZiekte] Inline CSS styling toegevoegd aan <head>");
    } else {
        console.log("[MeldingZiekte] Inline CSS styling is al aanwezig.");
    }
}

/**
 * Past thema styling toe op de modal elementen.
 */
function applyThemeToDynamicModal() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const modalContent = document.querySelector('.modal-content');
    const modalTitle = document.querySelector('.modal-title');
    const modalBody = document.querySelector('.modal-body');
    const modalFooter = document.querySelector('.modal-footer');
    const actionButton = document.getElementById('modal-action-button');
    const cancelButton = document.getElementById('modal-cancel-button');

    if (!modalContent) {
        console.warn("[MeldingZiekte] Modal elementen niet gevonden voor thema toepassing.");
        return;
    }

    // Voeg specifieke klasse voor ziekmelding modal toe
    modalContent.classList.add('ziekte-modal');

    // Pas formulier elementen classes toe
    const formGroups = modalBody.querySelectorAll('.form-group');
    formGroups.forEach(group => group.classList.add('ziekte-form-group'));

    const datumTijdRows = modalBody.querySelectorAll('.datum-tijd-row');
    datumTijdRows.forEach(row => {
        row.classList.add('ziekte-form-row');
        // Voeg container classes toe aan datum en tijd containers
        const datumContainer = row.querySelector('.datum-container');
        const tijdContainer = row.querySelector('.tijd-container');
        if (datumContainer) datumContainer.classList.add('ziekte-date-container');
        if (tijdContainer) tijdContainer.classList.add('ziekte-time-container');
    });

    if (isDarkTheme) {
        console.log("[MeldingZiekte] Donker thema toegepast op modal.");
    } else {
        console.log("[MeldingZiekte] Licht thema toegepast op modal.");
    }
}

/**
 * Initialiseert het ziekmeldingsformulier wanneer het in een modal wordt geladen.
 * @param {string} typeMelding - Momenteel alleen 'ziek', kan uitgebreid worden.
 * @param {Object} medewerkerContext - De context van de huidige medewerker.
 * @param {Date} [geselecteerdeDatum=new Date()] - De initieel geselecteerde datum.
 * @param {string} [siteUrl] - De SharePoint site URL (optioneel, valt terug op window.spWebAbsoluteUrl).
 */
async function initializeZiekModalForm(typeMelding, medewerkerContext, geselecteerdeDatum = new Date(), siteUrl = null) {
    console.log("[MeldingZiekte] Initialiseren van ziekmelding modal formulier. Type:", typeMelding);

    // Set the site URL first
    spWebAbsoluteUrlZiekmelding = siteUrl || window.spWebAbsoluteUrl || window._spPageContextInfo?.webAbsoluteUrl;
    
    if (!spWebAbsoluteUrlZiekmelding) {
        console.error("[MeldingZiekte] SharePoint site URL is niet beschikbaar. Controleer de initialisatie.");
        toonNotificatieInZiekmeldingModal("Kritieke fout: Serverlocatie onbekend. Kan formulier niet initialiseren.", "error", false);
        return false;
    }

    console.log("[MeldingZiekte] Gebruikte site URL:", spWebAbsoluteUrlZiekmelding);

    try {
        // Voeg inline CSS toe voor de ziekmelding styling
        laadZiekmeldingInlineCSS();
        
        // Initialiseer gebruikers info en vorm elementen
        await initializeModalGebruikersInfoEnThemaVoorZiekte(geselecteerdeDatum, medewerkerContext);
        await laadZiekteRedenId();
        
        // Pas thema styling toe op de modal elementen
        applyThemeToDynamicModal();
        
        // Diagnose eventuele thema-problemen
        diagnoseThemeIssues();
        
        console.log("[MeldingZiekte] Modal formulier succesvol geïnitialiseerd.");
        return true;
    } catch (error) {
        console.error("[MeldingZiekte] Fout bij initialiseren modal formulier:", error);
        toonNotificatieInZiekmeldingModal("Er is een fout opgetreden bij het laden van het formulier. Probeer het later opnieuw.", "error", false);
        return false;
    }
}

/**
 * Initialiseert gebruikersinformatie en thema voor de ziekmelding modal.
 */
async function initializeModalGebruikersInfoEnThemaVoorZiekte(geselecteerdeDatum, medewerkerContext) {
    console.log("[MeldingZiekte] Start initialisatie gebruikersinfo en thema voor ziekmelding modal. Context:", medewerkerContext);
    
    // spWebAbsoluteUrlZiekmelding should already be set by initializeZiekModalForm
    if (!spWebAbsoluteUrlZiekmelding) {
        console.error("[MeldingZiekte] SharePoint site URL is niet ingesteld. Initialiseer eerst via initializeZiekModalForm.");
        toonNotificatieInZiekmeldingModal("Kritieke fout: Serverlocatie onbekend. Kan formulier niet initialiseren.", "error", false);
        return;
    }

    huidigeGebruikerZiekmeldingContext = medewerkerContext || window.huidigeGebruiker;

    // More defensive validation - check what properties actually exist
    if (!huidigeGebruikerZiekmeldingContext) {
        console.error("[MeldingZiekte] Geen gebruikerscontext beschikbaar:", huidigeGebruikerZiekmeldingContext);
        toonNotificatieInZiekmeldingModal("Gebruikersinformatie kon niet worden geladen. Probeer het later opnieuw.", "error", false);
        return;
    }

    // Log what we actually have
    console.log("[MeldingZiekte] Beschikbare gebruikerscontext eigenschappen:", Object.keys(huidigeGebruikerZiekmeldingContext));

    // Set fallback values for missing properties
    if (!huidigeGebruikerZiekmeldingContext.displayName) {
        huidigeGebruikerZiekmeldingContext.displayName = huidigeGebruikerZiekmeldingContext.medewerkerNaamVolledig || 
                                                          huidigeGebruikerZiekmeldingContext.loginNaam || 
                                                          'Onbekende gebruiker';
    }
    
    if (!huidigeGebruikerZiekmeldingContext.normalizedUsername) {
        huidigeGebruikerZiekmeldingContext.normalizedUsername = window.trimLoginNaamPrefix(
            huidigeGebruikerZiekmeldingContext.loginNaam || huidigeGebruikerZiekmeldingContext.MedewerkerID || ''
        );
    }

    console.log(`[MeldingZiekte] Huidige gebruiker voor modal: ${huidigeGebruikerZiekmeldingContext.displayName} (Genormaliseerd: ${huidigeGebruikerZiekmeldingContext.normalizedUsername})`);

    const medewerkerDisplayElement = document.getElementById('MedewerkerDisplay');
    const medewerkerIdElement = document.getElementById('MedewerkerID');
    const titleElement = document.getElementById('Title');
    const aanvraagTijdstipElement = document.getElementById('AanvraagTijdstip');

    if (medewerkerDisplayElement) medewerkerDisplayElement.value = huidigeGebruikerZiekmeldingContext.displayName;
    if (medewerkerIdElement) medewerkerIdElement.value = huidigeGebruikerZiekmeldingContext.normalizedUsername;

    const vandaag = new Date();
    const datumString = vandaag.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (titleElement) titleElement.value = `Ziekmelding ${huidigeGebruikerZiekmeldingContext.displayName} - ${datumString}`;
    if (aanvraagTijdstipElement) aanvraagTijdstipElement.value = vandaag.toISOString();

    // Standaard datum en tijd instellen
    const startDatePicker = document.getElementById('StartDatePicker');
    const endDatePicker = document.getElementById('EndDatePicker');
    const startTimePicker = document.getElementById('StartTimePicker');
    const endTimePicker = document.getElementById('EndTimePicker');

    const initDatum = geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum) ? new Date(geselecteerdeDatum) : new Date();
    const initDatumISO = initDatum.toISOString().split('T')[0];

    if (startDatePicker) startDatePicker.value = initDatumISO;
    if (endDatePicker) endDatePicker.value = initDatumISO; // Standaard ook vandaag, gebruiker kan aanpassen
    if (startTimePicker) startTimePicker.value = "09:00";
    if (endTimePicker) endTimePicker.value = "17:00";

    console.log("[MeldingZiekte] Gebruikersinfo en standaard datums ingesteld voor ziekmelding modal.");
}

/**
 * Haalt het ID van de "Ziekte" reden uit de Verlofredenen lijst.
 */
async function laadZiekteRedenId() {
    const redenIdInput = document.getElementById('RedenId');
    if (ziekteRedenId && redenIdInput) {
        console.log("[MeldingZiekte] ID voor 'Ziekte' reden al geladen:", ziekteRedenId);
        redenIdInput.value = String(ziekteRedenId);
        return;
    }
    console.log("[MeldingZiekte] Laden van ID voor verlofreden 'Ziekte'...");

    // Change this line - use the configuration key instead of the config object
    const filterQuery = `$filter=Title eq 'Ziekte'`;
    const selectQuery = "$select=ID,Title";
    
    try {
        // Use 'Verlofredenen' as the configuration key, not the config object
        const redenen = await window.getLijstItemsAlgemeen('Verlofredenen', `${selectQuery}&${filterQuery}`);
        if (redenen && redenen.length > 0) {
            ziekteRedenId = redenen[0].ID;
            if (redenIdInput) {
                redenIdInput.value = String(ziekteRedenId);
                console.log("[MeldingZiekte] ID voor 'Ziekte' reden succesvol geladen:", ziekteRedenId, "als string:", redenIdInput.value);
            }
            
            if (redenen.length > 1) {
                console.info(`[MeldingZiekte] Meerdere verlofredenen gevonden (${redenen.length}), eerste wordt gebruikt:`, 
                    redenen.map(r => `ID:${r.ID}, Title:${r.Title}`).join(', '));
            }
        } else {
            console.warn("[MeldingZiekte] Verlofreden 'Ziekte' niet gevonden in de lijst. Kan ID niet instellen.");
            toonNotificatieInZiekmeldingModal("Standaard reden 'Ziekte' kon niet worden gevonden. Controleer de configuratie.", "error", false);
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
 * Valideert het ziekmeldingsformulier.
 * @returns {boolean} True als valide, anders false.
 */
function valideerZiekmeldingFormulier() {
    const startDatePicker = document.getElementById('StartDatePicker');
    const startTimePicker = document.getElementById('StartTimePicker');
    const endDatePicker = document.getElementById('EndDatePicker');
    const endTimePicker = document.getElementById('EndTimePicker');

    if (!startDatePicker || !startTimePicker || !endDatePicker || !endTimePicker) {
        console.error("[MeldingZiekte] Een of meer validatievelden niet gevonden in modal.");
        toonNotificatieInZiekmeldingModal("Fout: Formulier validatie kan niet worden uitgevoerd (elementen missen).", "error", false);
        return false;
    }

    if (!startDatePicker.value || !startTimePicker.value || !endDatePicker.value || !endTimePicker.value) {
        toonNotificatieInZiekmeldingModal('Vul alle verplichte datum- en tijdvelden (*) in.', 'error', false);
        return false;
    }

    const startDateTime = new Date(`${startDatePicker.value}T${startTimePicker.value}`);
    const endDateTime = new Date(`${endDatePicker.value}T${endTimePicker.value}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toonNotificatieInZiekmeldingModal('Ongeldige datum of tijd ingevoerd.', 'error', false);
        return false;
    }

    if (endDateTime < startDateTime) { // Kan gelijk zijn als het om 1 dag gaat.
        toonNotificatieInZiekmeldingModal('De einddatum en -tijd mogen niet voor de startdatum en -tijd liggen.', 'error', false);
        return false;
    }
    return true;
}

/**
 * Verwerkt het verzenden van het ziekmeldingsformulier.
 * Wordt aangeroepen door de actieknop van de generieke modal.
 * @param {HTMLFormElement} formElement - Het formulier element uit de modal.
 * @param {Object} medewerkerContext - De context van de huidige medewerker.
 * @param {Date} geselecteerdeDatum - De initieel geselecteerde datum (kan relevant zijn).
 * @returns {Promise<boolean>} True als succesvol, anders false.
 */
async function handleZiekmeldingFormulierVerzenden(formElement, medewerkerContext, geselecteerdeDatum) {
    console.log("[MeldingZiekte] Ziekmelding formulierverwerking gestart...");
    const submitButton = document.getElementById('modal-action-button'); // De generieke modal actieknop

    if (!valideerZiekmeldingFormulier()) {
        return false; // Validatie mislukt
    }
    if (!ziekteRedenId) {
        toonNotificatieInZiekmeldingModal("Fout: De standaard reden 'Ziekte' kon niet worden geladen. Kan melding niet opslaan.", "error", false);
        return false;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = (typeof getSpinnerSvg === 'function' ? getSpinnerSvg() : '') + 'Bezig met indienen...';
    }
    toonNotificatieInZiekmeldingModal('Bezig met indienen van uw ziekmelding...', 'info', false);

    // Velden uit het formulier halen
    const startDatePicker = document.getElementById('StartDatePicker');
    const startTimePicker = document.getElementById('StartTimePicker');
    const endDatePicker = document.getElementById('EndDatePicker');
    const endTimePicker = document.getElementById('EndTimePicker');
    const omschrijvingTextarea = document.getElementById('Omschrijving');
    
    // Verborgen velden die al gevuld zouden moeten zijn
    const titleInput = document.getElementById('Title');
    const medewerkerDisplayInput = document.getElementById('MedewerkerDisplay');
    const medewerkerIdInput = document.getElementById('MedewerkerID');
    const aanvraagTijdstipInput = document.getElementById('AanvraagTijdstip');
    const statusInput = document.getElementById('Status');
    const redenIdInput = document.getElementById('RedenId'); // Moet gevuld zijn met ziekteRedenId
    const redenInput = document.getElementById('Reden');     // Moet "Ziekte" bevatten

    // Combineer datum en tijd en zet naar ISO string voor verborgen velden
    const startDateTime = new Date(`${startDatePicker.value}T${startTimePicker.value}`);
    const endDateTime = new Date(`${endDatePicker.value}T${endTimePicker.value}`);
    
    const startDatumElement = document.getElementById('StartDatum');
    const eindDatumElement = document.getElementById('EindDatum');
    
    if (startDatumElement) startDatumElement.value = startDateTime.toISOString();
    if (eindDatumElement) eindDatumElement.value = endDateTime.toISOString();

    if (typeof window.getLijstConfig !== 'function') {
        toonNotificatieInZiekmeldingModal('Fout: Systeemfunctie voor configuratie niet beschikbaar.', 'error', false);
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Melding Indienen';
        }
        return false;
    }

    const verlofLijstConfig = window.getLijstConfig('Verlof'); // Ziekmeldingen gaan ook naar de Verlof lijst
    if (!verlofLijstConfig || !verlofLijstConfig.lijstId || !verlofLijstConfig.lijstTitel) {
        toonNotificatieInZiekmeldingModal('Fout: Ziekmelding kan niet worden verwerkt (configuratie ontbreekt).', 'error', false);
        console.error("[MeldingZiekte] Configuratie voor 'Verlof' lijst niet gevonden of incompleet.");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Melding Indienen';
        }
        return false;
    }

    const listNameForMetadata = verlofLijstConfig.lijstTitel.replace(/\s+/g, '_');
    const formDataPayload = {
        __metadata: { type: `SP.Data.${listNameForMetadata}ListItem` },
        Title: titleInput ? titleInput.value : '',
        Medewerker: medewerkerDisplayInput ? medewerkerDisplayInput.value : '',
        MedewerkerID: medewerkerIdInput ? medewerkerIdInput.value : '',
        AanvraagTijdstip: aanvraagTijdstipInput ? aanvraagTijdstipInput.value : '',
        StartDatum: startDatumElement ? startDatumElement.value : '',
        EindDatum: eindDatumElement ? eindDatumElement.value : '',
        Omschrijving: omschrijvingTextarea ? omschrijvingTextarea.value : '',
        Reden: redenInput ? redenInput.value : 'Ziekte', // Zou "Ziekte" moeten zijn
        RedenId: redenIdInput ? redenIdInput.value : '', // ID van "Ziekte"
        Status: statusInput ? statusInput.value : 'Nieuw'  // "Nieuw"
    };

    console.log('[MeldingZiekte] Voor te bereiden payload voor SharePoint (Verlof lijst):', JSON.stringify(formDataPayload, null, 2));

    try {
        // Gebruik de globale createSPListItem functie
        if (typeof window.createSPListItem !== 'function') {
            throw new Error("Functie createSPListItem is niet beschikbaar. Controleer of machtigingen.js correct geladen is.");
        }
        await window.createSPListItem('Verlof', formDataPayload); // Gebruik de lijstConfigKey "Verlof"

        console.log("[MeldingZiekte] Ziekmelding succesvol opgeslagen in SharePoint.");
        toonNotificatieInZiekmeldingModal('Ziekmelding succesvol ingediend!', 'success');
        
        if (formElement) formElement.reset(); // Reset het formulier binnen de modal

        // Roep de initialisatiefunctie opnieuw aan om velden te resetten naar default
        // (inclusief de gebruikersnaam en de titel)
        await initializeModalGebruikersInfoEnThemaVoorZiekte(geselecteerdeDatum, medewerkerContext);
        await laadZiekteRedenId(); // Zorg dat RedenId opnieuw wordt ingesteld in het verborgen veld

        // Sluit de modal na succes
        setTimeout(() => {
            if (typeof window.closeModal === 'function') window.closeModal(); // Gebruik de globale closeModal
            // Optioneel: ververs de hoofd rooster data
            if (typeof window.laadInitiëleData === 'function') {
                window.laadInitiëleData(false); 
            }
        }, 2000); 

        return true;

    } catch (error) {
        console.error('[MeldingZiekte] Fout bij indienen ziekmelding:', error);
        toonNotificatieInZiekmeldingModal(`Fout bij indienen: ${error.message}. Probeer het opnieuw.`, 'error', false);
        return false;
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Melding Indienen';
        }
    }
}

/**
 * Initialiseert het ziekmeldingsformulier wanneer het in een modal wordt geladen.
 * Deze functie wordt aangeroepen vanuit verlofroosterModal_logic.js.
 * @param {string} typeMelding - Momenteel alleen 'ziek', kan uitgebreid worden.
 * @param {Object} medewerkerContext - De context van de huidige medewerker.
 * @param {Date} [geselecteerdeDatum=new Date()] - De initieel geselecteerde datum.
 * @param {string} [siteUrl] - De SharePoint site URL (optioneel, valt terug op window.spWebAbsoluteUrl).
 */
async function initializeZiekModalForm(typeMelding, medewerkerContext, geselecteerdeDatum = new Date(), siteUrl = null) {
    console.log(`[MeldingZiekte] Start initialisatie. Type: ${typeMelding}, Datum:`, geselecteerdeDatum);
    
    // Stel eerst de site URL in met meerdere fallbacks
    spWebAbsoluteUrlZiekmelding = siteUrl || 
                                window.spWebAbsoluteUrl || 
                                window._spPageContextInfo?.webAbsoluteUrl ||
                                window._spPageContextInfo?.siteAbsoluteUrl ||
                                (window.configLijst?.siteUrl);
    
    if (!spWebAbsoluteUrlZiekmelding) {
        console.error(`[MeldingZiekte] Geen enkele bron voor SharePoint site URL beschikbaar! Controleer initialisatie.`);
        console.log(`[MeldingZiekte] window.spWebAbsoluteUrl: ${window.spWebAbsoluteUrl}, _spPageContextInfo:`, window._spPageContextInfo);
        toonNotificatieInZiekmeldingModal("Kritieke configuratiefout. Kan formulier niet laden.", "error", false);
        return false;
    }
    
    console.log(`[MeldingZiekte] SharePoint site URL: ${spWebAbsoluteUrlZiekmelding}`);

    try {
        // Voeg inline CSS toe voor de ziekmelding styling
        laadZiekmeldingInlineCSS();
        
        // Initialiseer gebruikersinfo en standaardwaarden
        await initializeModalGebruikersInfoEnThemaVoorZiekte(geselecteerdeDatum, medewerkerContext);
        
        // Laad het ID van de verlofreden "Ziekte"
        await laadZiekteRedenId();

        // Pas thema toe op de formulierelementen binnen de modal
        applyThemeToDynamicModal();
        
        // Diagnose eventuele thema-problemen
        diagnoseThemeIssues();

        console.log(`[MeldingZiekte] Initialisatie voltooid.`);
        return true;
    } catch (error) {
        console.error(`[MeldingZiekte] Fout bij initialiseren: ${error.message}`);
        toonNotificatieInZiekmeldingModal("Er is een fout opgetreden bij het initialiseren. Probeer het later opnieuw.", "error", false);
        return false;
    }
}

// Exporteer de initialisatiefunctie zodat deze vanuit verlofroosterModal_logic.js kan worden aangeroepen
window.initializeZiekModalForm = initializeZiekModalForm;
// Exporteer ook de submit handler
window.handleZiekmeldingFormulierVerzenden = handleZiekmeldingFormulierVerzenden;

console.log("Rooster/pages/js/meldingZiekte_logic.js geladen.");