// Pages/js/meldingZittingsvrij_logic.js

/**
 * Logica voor de Pages/meldingZittingsvrij.aspx pagina.
 * Beheert het formulier voor het melden van incidenteel zittingvrij,
 * inclusief permissiecontrole (inline), data validatie en opslaan naar SharePoint.
 * * Vereist:
 * - ../js/configLijst.js (voor getLijstConfig)
 * - ../js/machtigingen.js (voor SharePoint context, createSPListItem, getLijstItemsAlgemeen, en de initialisatie promise)
 */

// Globale variabelen voor de pagina
let spWebAbsoluteUrlPagina = ''; // SharePoint site URL, gezet vanuit machtigingen.js context
let huidigeGebruikerPagina = null; // Info over de ingelogde gebruiker, gezet vanuit machtigingen.js context
let geselecteerdeMedewerker = {
    gebruikersnaam: null, // Will store the FULL CLAIMS username (e.g., i:0#.w|org\BusselW) for SP submission
    displayName: null    // Weergegeven naam (bijv. Voornaam Achternaam) voor weergave
};
let alleMedewerkersVoorLookup = []; // Cache voor medewerkerslijst voor de autocomplete

// Definieer de vereiste beheerdersgroepen lokaal voor deze pagina
const VEREISTE_BEHEER_GROEPEN_ZITTINGVRIJ = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars", "2.3. Senioren beoordelen"];

// DOM Referenties
const domRefsMeldingZV = {
    appBody: document.body,
    form: document.getElementById('zittingvrij-form'),
    // Hidden fields for SharePoint submission
    titleInput: document.getElementById('form-titel'),
    medewerkerIDInput: document.getElementById('MedewerkerID'),
    // Display fields
    medewerkerDisplayInput: document.getElementById('form-medewerker-display'),
    gebruikersnaamInput: document.getElementById('form-gebruikersnaam'),
    gebruikersnaamStatus: null, // Wordt dynamisch aangemaakt indien nodig
    // Date and time fields
    startDatumInput: document.getElementById('form-start-datum'),
    startTijdInput: document.getElementById('form-start-tijd'),
    eindDatumInput: document.getElementById('form-eind-datum'),
    eindTijdInput: document.getElementById('form-eind-tijd'),
    // Other fields
    opmerkingTextarea: document.getElementById('form-opmerking'),
    // Recurring fields
    terugkerendCheckbox: document.getElementById('form-terugkerend'),
    recurringFieldsContainer: document.getElementById('recurring-fields-container'),
    terugkeerPatroonSelect: document.getElementById('form-terugkeerpatroon'),
    terugkerendTotInput: document.getElementById('form-terugkerend-tot'),
    // Buttons
    annulerenButton: document.getElementById('annuleren-button'),
    indienenButton: document.getElementById('indienen-button'),
    // Status
    statusBerichtDiv: document.getElementById('status-bericht'),
    currentYearSpan: document.getElementById('current-year')
};

/**
 * Utility functie om SharePoint claims prefix van loginnaam te verwijderen.
 * @param {string} loginNaam - De volledige SharePoint loginnaam.
 * @returns {string} De genormaliseerde loginnaam.
 */

/**
 * Toont een notificatie bericht aan de gebruiker BINNEN DE MODAL.
 * @param {string} berichtHTML - Het te tonen bericht (kan HTML bevatten).
 * @param {'success'|'error'|'info'} type - Het type notificatie.
 * @param {number|false} [autoHideDelay=7000] - Vertraging in ms voor auto-hide, of false om niet automatisch te verbergen.
 */
function toonNotificatieInZittingVrijModal(berichtHTML, type = 'info', autoHideDelay = 7000) {
    const modalNotificationArea = document.getElementById('modal-notification-area');
    if (!modalNotificationArea) {
        console.warn("[MeldingZittingsvrij] Notificatiegebied (#modal-notification-area) niet gevonden in modal voor bericht:", berichtHTML);
        if (typeof window.toonModalNotificatie === 'function') {
            window.toonModalNotificatie(berichtHTML.replace(/<[^>]*>?/gm, ''), type, autoHideDelay);
        } else {
            console.log(`[MeldingZittingsvrij ModalNotificatie] Type: ${type}, Bericht: ${berichtHTML}`);
        }
        return;
    }
    console.log(`[MeldingZittingsvrij ModalNotificatie] Type: ${type}, Bericht: ${berichtHTML}`);
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
 * Initialiseert de pagina: thema, context, permissies, en event listeners.
 */
async function initializePaginaMeldingZV() {
    console.log("[MeldingZittingsvrij] Initialiseren pagina...");
    if (domRefsMeldingZV.currentYearSpan) updateJaarInFooterMeldingZV();
    initializeThemaMeldingZV();

    // Check if we're in a modal context
    const isInModal = window.parent !== window.self || document.getElementById('modal-placeholder') || window.location.href.includes('modal');

    if (isInModal) {
        console.log("[MeldingZittingsvrij] Running in modal context");
        // In modal context, we get the selected employee from the modal globals
        if (window.zittingVrijModalGeselecteerdeMedewerker && window.zittingVrijModalGeselecteerdeMedewerker.gebruikersnaam) {
            geselecteerdeMedewerker = { ...window.zittingVrijModalGeselecteerdeMedewerker };
            console.log("[MeldingZittingsvrij] Geselecteerde medewerker uit modal context:", geselecteerdeMedewerker);
        }

        // Skip permissions check and machtigingen initialization in modal context
        await initializeModalContextMeldingZV();
        haalMedewerkerGegevensUitUrlMeldingZV();
        vulFormulierInitieelInMeldingZV();
        koppelEventListenersMeldingZV();
        console.log("[MeldingZittingsvrij] Modal initialisatie voltooid.");
        return;
    }

    // Regular page context - do full initialization
    // Wacht tot machtigingen.js klaar is met zijn initialisatie
    if (window.machtigingenInitializationPromise) {
        try {
            console.log("[MeldingZittingsvrij] Wachten op voltooiing initialisatie van machtigingen.js...");
            await window.machtigingenInitializationPromise;
            console.log("[MeldingZittingsvrij] Machtigingen.js initialisatie voltooid.");
        } catch (error) {
            console.error("[MeldingZittingsvrij] Fout tijdens wachten op machtigingen.js initialisatie:", error);
            toonStatusBerichtMeldingZV("Kritische fout: Kan basis-afhankelijkheden niet laden. Probeer de pagina te vernieuwen.", "error", false);
            if (domRefsMeldingZV.form) domRefsMeldingZV.form.classList.add('hidden');
            if (domRefsMeldingZV.indienenButton) domRefsMeldingZV.indienenButton.disabled = true;
            return;
        }
    } else {
        console.error("[MeldingZittingsvrij] Machtigingen.js initialisatie promise (window.machtigingenInitializationPromise) niet gevonden. Kan niet veilig doorgaan.");
        toonStatusBerichtMeldingZV("Kritische fout: Initialisatie van afhankelijkheden is onvolledig (Promise).", "error", false);
        // Verberg formulier en deactiveer knoppen als de promise er niet is
        if (domRefsMeldingZV.form) domRefsMeldingZV.form.classList.add('hidden');
        if (domRefsMeldingZV.indienenButton) domRefsMeldingZV.indienenButton.disabled = true;
        return;
    }

    const contextOK = await initializeContextEnPermissiesPaginaMeldingZV();
    if (!contextOK) {
        // initializeContextEnPermissiesPaginaMeldingZV toont al een bericht en verbergt het formulier.
        return;
    }

    haalMedewerkerGegevensUitUrlMeldingZV();
    vulFormulierInitieelInMeldingZV();
    koppelEventListenersMeldingZV();
    console.log("[MeldingZittingsvrij] Pagina initialisatie voltooid.");
}

/**
 * Initialiseert de modal context (gebruikt globale context van main app).
 */
async function initializeModalContextMeldingZV() {
console.log("[MeldingZittingsvrij] initializeModalContextMeldingZV aangeroepen - delegeert naar nieuwe initializeZittingsvrijModalForm");
initializeThemaMeldingZV(); // Pas thema toe zoals op de standalone pagina

// Haal de geselecteerde medewerker gegevens op uit de globale variabele gezet door verlofroosterModal_logic.js
const medewerkerContext = {
    loginNaam: window.zittingVrijModalGeselecteerdeMedewerker?.gebruikersnaam || window.huidigeGebruiker?.loginNaam,
    displayName: window.zittingVrijModalGeselecteerdeMedewerker?.displayName || window.huidigeGebruiker?.displayName,
    normalizedUsername: window.trimLoginNaamPrefix(window.zittingVrijModalGeselecteerdeMedewerker?.gebruikersnaam) || window.huidigeGebruiker?.normalizedUsername,
    medewerkerNaamVolledig: window.zittingVrijModalGeselecteerdeMedewerker?.displayName || window.huidigeGebruiker?.medewerkerNaamVolledig
};

// Get selected date if available
const geselecteerdeDatum = window.geselecteerdeDatum instanceof Date ? window.geselecteerdeDatum : new Date();

// Check if we have valid medewerker context before initializing
if (medewerkerContext.loginNaam && medewerkerContext.displayName) {
    // Call the new initialization function
    await initializeZittingsvrijModalForm(geselecteerdeDatum, medewerkerContext);
} else {
    console.warn("[MeldingZittingsvrij] Geen medewerker context gevonden in window.zittingVrijModalGeselecteerdeMedewerker. Medewerker velden blijven leeg/bewerkbaar.");
    // Optioneel: maak velden bewerkbaar als er geen context is, of toon een fout.
    // Voor nu, laten we de standaard gedrag (leeg/bewerkbaar) toe.
    setMedewerkerInFormulier("", "", false); // Maak velden leeg en bewerkbaar
}

// Vul de rest van het formulier initieel in (datums, etc.)
vulFormulierInitieelInMeldingZV();

// Koppel event listeners specifiek voor de modal interactie
    // Koppel event listeners specifiek voor de modal interactie
    koppelEventListenersMeldingZV();

    // Update het jaartal in de footer (indien de footer wordt meegekopieerd)
    if (domRefsMeldingZV.currentYearSpan) {
        updateJaarInFooterMeldingZV();
    }

    console.log("[MeldingZittingsvrij] Modal context initialisatie voltooid.");
}
/**
 * Initialiseert het Zittingsvrij modal formulier met correcte datums/tijden en gebruikersgegevens.
 * Wordt aangeroepen vanuit verlofroosterModal_logic.js bij het openen van de modal.
 * @param {Date} geselecteerdeDatum - De initieel geselecteerde datum vanuit het verlofrooster.
 * @param {Object} medewerkerContext - De context van de geselecteerde medewerker.
 */
async function initializeZittingsvrijModalForm(geselecteerdeDatum, medewerkerContext) {
    console.log("[MeldingZittingsvrij] Start initialisatie formulier voor zittingsvrij modal. Context:", medewerkerContext);

    // Verkrijg SharePoint context
    spWebAbsoluteUrlPagina = window.spWebAbsoluteUrl;
    if (!spWebAbsoluteUrlPagina) {
        console.error("[MeldingZittingsvrij] SharePoint site URL (window.spWebAbsoluteUrl) is niet beschikbaar.");
        toonNotificatieInZittingVrijModal("Kritieke fout: Serverlocatie onbekend. Kan formulier niet initialiseren.", "error", false);
        return;
    }

    // Stel huidige medewerker in
    huidigeGebruikerPagina = medewerkerContext || window.huidigeGebruiker;
    if (!huidigeGebruikerPagina || !huidigeGebruikerPagina.normalizedUsername) {
        console.error("[MeldingZittingsvrij] Onvolledige medewerkercontext voor initialisatie:", huidigeGebruikerPagina);
        toonNotificatieInZittingVrijModal("Gebruikersinformatie kon niet worden geladen. Probeer het later opnieuw.", "error", false);
        return;
    }

    // Stel geselecteerde medewerker in (deze wordt gebruikt bij verzenden)
    geselecteerdeMedewerker.gebruikersnaam = medewerkerContext.loginNaam;
    geselecteerdeMedewerker.displayName = medewerkerContext.medewerkerNaamVolledig || medewerkerContext.displayName;

    // Re-initialiseer DOM referenties voor modal context (belangrijkste formulier elementen)
    // Het is belangrijk deze referenties opnieuw op te halen in de modal context
    domRefsMeldingZV.form = document.querySelector('#modal-content form') || document.getElementById('zittingvrij-form');
    domRefsMeldingZV.startDatumInput = document.querySelector('#form-start-datum');
    domRefsMeldingZV.startTijdInput = document.querySelector('#form-start-tijd');
    domRefsMeldingZV.eindDatumInput = document.querySelector('#form-eind-datum');
    domRefsMeldingZV.eindTijdInput = document.querySelector('#form-eind-tijd');
    domRefsMeldingZV.medewerkerDisplayInput = document.querySelector('#form-medewerker-display');
    domRefsMeldingZV.gebruikersnaamInput = document.querySelector('#form-gebruikersnaam');
    domRefsMeldingZV.medewerkerIDInput = document.querySelector('#MedewerkerID');
    domRefsMeldingZV.indienenButton = document.querySelector('#indienen-button');
    domRefsMeldingZV.annulerenButton = document.querySelector('#annuleren-button');

    // Log de gevonden elementen voor debugging
    console.log("[MeldingZittingsvrij] DOM elementen gevonden:", {
        form: !!domRefsMeldingZV.form,
        startDatum: !!domRefsMeldingZV.startDatumInput,
        startTijd: !!domRefsMeldingZV.startTijdInput,
        eindDatum: !!domRefsMeldingZV.eindDatumInput,
        eindTijd: !!domRefsMeldingZV.eindTijdInput
    });    // Vul medewerkergegevens in het formulier met de geselecteerde medewerker uit de medewerkerContext
    if (domRefsMeldingZV.medewerkerDisplayInput && medewerkerContext) {
        // Gebruik de medewerker display naam of volledige naam uit de medewerkerContext
        domRefsMeldingZV.medewerkerDisplayInput.value = medewerkerContext.medewerkerNaamVolledig || medewerkerContext.displayName;
        domRefsMeldingZV.medewerkerDisplayInput.readOnly = true; // Maak dit veld read-only omdat medewerker al geselecteerd is
        console.log(`[MeldingZittingsvrij] Display naam ingevuld: ${domRefsMeldingZV.medewerkerDisplayInput.value}`);
    }
    
    if (domRefsMeldingZV.gebruikersnaamInput && medewerkerContext) {
        // Gebruik de genormaliseerde gebruikersnaam uit de medewerkerContext
        domRefsMeldingZV.gebruikersnaamInput.value = medewerkerContext.normalizedUsername;
        domRefsMeldingZV.gebruikersnaamInput.readOnly = true; // Maak dit veld read-only omdat medewerker al geselecteerd is
        console.log(`[MeldingZittingsvrij] Gebruikersnaam ingevuld: ${domRefsMeldingZV.gebruikersnaamInput.value}`);
    }
    
    if (domRefsMeldingZV.medewerkerIDInput && medewerkerContext) {
        // Zet de volledige login naam (claims) in het verborgen medewerker ID veld voor gebruik bij verzending
        domRefsMeldingZV.medewerkerIDInput.value = medewerkerContext.loginNaam;
        console.log(`[MeldingZittingsvrij] Medewerker ID (volledige claims) ingevuld: ${domRefsMeldingZV.medewerkerIDInput.value}`);
        
        // Update ook de globale geselecteerdeMedewerker voor achterwaartse compatibiliteit
        geselecteerdeMedewerker.gebruikersnaam = medewerkerContext.loginNaam;
        geselecteerdeMedewerker.displayName = medewerkerContext.medewerkerNaamVolledig || medewerkerContext.displayName;
    }

    // Stel initiele datum/tijd in
    vulFormulierInitieelInMeldingZV(geselecteerdeDatum);

    // Koppel event listeners voor formulier functionaliteit
    koppelEventListenersMeldingZV();

    // Verberg de standaard modal actieknoppen (we gebruiken de form knoppen)
    if (window.domRefsLogic && window.domRefsLogic.modalActionsContainer) {
        window.domRefsLogic.modalActionsContainer.classList.add('hidden');
    }

    console.log("[MeldingZittingsvrij] Initialisatie formulier voltooid");
}

/**
 * Vult de formulier velden met initiele waarden.
 * @param {Date} geselecteerdeDatum - Optionele datum vanuit het rooster.
 */
function vulFormulierInitieelInMeldingZV(geselecteerdeDatum) {
    const nu = new Date();
    const vandaagISO = nu.toISOString().split('T')[0];

    // Gebruik geselecteerde datum of vandaag
    const datumVoorFormulier = (geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum))
        ? geselecteerdeDatum.toISOString().split('T')[0]
        : vandaagISO;

    console.log(`[MeldingZittingsvrij] Formulier wordt gevuld met datum: ${datumVoorFormulier}`);

    // Stel de datum en tijd in
    if (domRefsMeldingZV.startDatumInput) {
        domRefsMeldingZV.startDatumInput.value = datumVoorFormulier;
    }

    if (domRefsMeldingZV.eindDatumInput) {
        domRefsMeldingZV.eindDatumInput.value = datumVoorFormulier;
    }

    // Standaard tijden: 09:00 en 17:00
    if (domRefsMeldingZV.startTijdInput) {
        domRefsMeldingZV.startTijdInput.value = "09:00";
    }

    if (domRefsMeldingZV.eindTijdInput) {
        domRefsMeldingZV.eindTijdInput.value = "17:00";
    }
}

/**
 * Koppelt event listeners aan formulier elementen.
 */
function koppelEventListenersMeldingZV() {
    console.log("[MeldingZittingsvrij] Koppelen van event listeners...");

    // Synchroniseer einddatum met startdatum
    if (domRefsMeldingZV.startDatumInput) {
        domRefsMeldingZV.startDatumInput.addEventListener('change', (e) => {
            console.log(`[MeldingZittingsvrij] Startdatum gewijzigd naar: ${e.target.value}`);
            if (domRefsMeldingZV.eindDatumInput) {
                domRefsMeldingZV.eindDatumInput.value = e.target.value;
                console.log(`[MeldingZittingsvrij] Einddatum gesynchroniseerd naar: ${e.target.value}`);
            }
        });
    }

    // Annuleren knop sluit de modal
    if (domRefsMeldingZV.annulerenButton) {
        domRefsMeldingZV.annulerenButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("[MeldingZittingsvrij] Annuleren knop geklikt");
            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }
        });
    }

    // Formulier submit handler
    if (domRefsMeldingZV.form) {
        domRefsMeldingZV.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("[MeldingZittingsvrij] Formulier submit event");
            await handleZittingsvrijModalFormSubmit();
        });
    }
}

/**
 * Valideert het zittingsvrij formulier.
 * @returns {boolean} True als valide, anders false.
 */
function valideerZittingsvrijModalFormulier() {
    console.log("[MeldingZittingsvrij] Validatie van formulier gestart");

    // Controleer of verplichte velden zijn ingevuld
    if (!domRefsMeldingZV.startDatumInput || !domRefsMeldingZV.startTijdInput ||
        !domRefsMeldingZV.eindDatumInput || !domRefsMeldingZV.eindTijdInput) {
        console.error("[MeldingZittingsvrij] Verplichte velden niet gevonden in DOM");
        toonNotificatieInZittingVrijModal("Fout: Formulier validatie kan niet worden uitgevoerd (velden ontbreken).", "error", false);
        return false;
    }

    if (!domRefsMeldingZV.startDatumInput.value || !domRefsMeldingZV.startTijdInput.value ||
        !domRefsMeldingZV.eindDatumInput.value || !domRefsMeldingZV.eindTijdInput.value) {
        toonNotificatieInZittingVrijModal('Vul alle verplichte datum- en tijdvelden in.', 'error', false);
        return false;
    }

    // Controleer of einddatum/tijd na startdatum/tijd ligt
    const startDateTime = new Date(`${domRefsMeldingZV.startDatumInput.value}T${domRefsMeldingZV.startTijdInput.value}`);
    const endDateTime = new Date(`${domRefsMeldingZV.eindDatumInput.value}T${domRefsMeldingZV.eindTijdInput.value}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toonNotificatieInZittingVrijModal('Ongeldige datum of tijd ingevoerd.', 'error', false);
        return false;
    }

    if (endDateTime <= startDateTime) {
        toonNotificatieInZittingVrijModal('De einddatum en -tijd moeten na de startdatum en -tijd liggen.', 'error', false);
        return false;
    }

    return true;
}

/**
 * Verwerkt het verzenden van het zittingsvrij formulier vanuit de modal.
 */
async function handleZittingsvrijModalFormSubmit() {
    console.log("[MeldingZittingsvrij] Formulier verzending gestart");

    if (!valideerZittingsvrijModalFormulier()) {
        return false;
    }

    const submitButton = domRefsMeldingZV.indienenButton;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = (typeof getSpinnerSvg === 'function' ? getSpinnerSvg() : '') + 'Bezig met indienen...';
    }

    toonNotificatieInZittingVrijModal('Bezig met indienen van uw zittingsvrij melding...', 'info', false);

    // Bouw de data op voor SharePoint verzending
    const startDateTime = new Date(`${domRefsMeldingZV.startDatumInput.value}T${domRefsMeldingZV.startTijdInput.value}`);
    const endDateTime = new Date(`${domRefsMeldingZV.eindDatumInput.value}T${domRefsMeldingZV.eindTijdInput.value}`);

    const medewerkerDisplayInput = domRefsMeldingZV.medewerkerDisplayInput ? domRefsMeldingZV.medewerkerDisplayInput.value : geselecteerdeMedewerker.displayName;
    const medewerkerIdInput = domRefsMeldingZV.medewerkerIDInput ? domRefsMeldingZV.medewerkerIDInput.value : geselecteerdeMedewerker.gebruikersnaam;

    // Bereid titel voor
    const vandaag = new Date();
    const datumString = vandaag.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const itemTitle = `Zittingsvrij ${medewerkerDisplayInput} - ${datumString}`;

    // Haal lijstconfiguratie op
    const zittingVrijLijstConfig = typeof window.getLijstConfig === 'function' ?
        window.getLijstConfig("IncidenteelZittingVrij") : null;

    if (!zittingVrijLijstConfig || !zittingVrijLijstConfig.lijstTitel) {
        toonNotificatieInZittingVrijModal('Fout: Zittingsvrij kan niet worden verwerkt (configuratie ontbreekt).', 'error', false);
        console.error("[MeldingZittingsvrij] Configuratie voor 'IncidenteelZittingVrij' lijst niet gevonden.");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Opslaan';
        }
        return false;
    }

    // Bereid de SharePoint ListItem data voor
    const listNameForMetadata = zittingVrijLijstConfig.lijstTitel.replace(/\s+/g, '_');
    const formDataPayload = {
        __metadata: { type: `SP.Data.${listNameForMetadata}ListItem` },
        Title: itemTitle,
        Gebruikersnaam: medewerkerIdInput, // Dit moet de volledige claims naam zijn
        ZittingsVrijeDagTijd: startDateTime.toISOString(),
        ZittingsVrijeDagTijdEind: endDateTime.toISOString(),
        Opmerking: domRefsMeldingZV.opmerkingTextarea ? domRefsMeldingZV.opmerkingTextarea.value : ""
    };

    // Voeg terugkerende opties toe indien nodig
    if (domRefsMeldingZV.terugkerendCheckbox && domRefsMeldingZV.terugkerendCheckbox.checked) {
        formDataPayload.Terugkerend = true;

        if (domRefsMeldingZV.terugkeerPatroonSelect) {
            formDataPayload.TerugkeerPatroon = domRefsMeldingZV.terugkeerPatroonSelect.value;
        }

        if (domRefsMeldingZV.terugkerendTotInput && domRefsMeldingZV.terugkerendTotInput.value) {
            formDataPayload.TerugkerendTot = new Date(domRefsMeldingZV.terugkerendTotInput.value).toISOString();
        }
    }

    console.log("[MeldingZittingsvrij] Data voor SharePoint:", formDataPayload);

    try {
        if (typeof window.createSPListItem !== 'function') {
            throw new Error("Functie createSPListItem is niet beschikbaar.");
        }

        await window.createSPListItem('IncidenteelZittingVrij', formDataPayload);

        console.log("[MeldingZittingsvrij] Zittingsvrij succesvol opgeslagen in SharePoint.");
        toonNotificatieInZittingVrijModal('Zittingsvrij melding succesvol ingediend!', 'success');

        // Wacht even en sluit dan de modal
        setTimeout(() => {
            if (typeof window.closeModal === 'function') {
                window.closeModal();

                // Herlaad de data in het hoofdscherm indien mogelijk
                if (window.Laadinitiele) {
                    console.log("[MeldingZittingsvrij] Hoofdscherm data wordt ververst");
                    window.Laadinitiele(true);
                }
            }
        }, 1500);

        return true;
    } catch (error) {
        console.error('[MeldingZittingsvrij] Fout bij indienen zittingsvrij:', error);
        toonNotificatieInZittingVrijModal(`Fout bij indienen: ${error.message}. Probeer het opnieuw.`, 'error', false);
        return false;
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Opslaan';
        }
    }
}

/**
 * Toont een statusbericht aan de gebruiker.
 */
function toonStatusBerichtMeldingZV(bericht, type = 'info', autoVerbergen = true) {
    if (!domRefsMeldingZV.statusBerichtDiv) {
        console.warn("[MeldingZittingsvrij] Status bericht div niet gevonden.");
        return;
    }

    domRefsMeldingZV.statusBerichtDiv.textContent = bericht;
    domRefsMeldingZV.statusBerichtDiv.className = 'mt-6 p-4 text-sm rounded-lg border';

    switch (type) {
        case 'success':
            domRefsMeldingZV.statusBerichtDiv.classList.add('status-success', 'bg-green-100', 'border-green-400', 'text-green-700', 'dark:bg-green-700', 'dark:text-green-100', 'dark:border-green-600');
            break;
        case 'error':
            domRefsMeldingZV.statusBerichtDiv.classList.add('status-error', 'bg-red-100', 'border-red-400', 'text-red-700', 'dark:bg-red-700', 'dark:text-red-100', 'dark:border-red-600');
            break;
        case 'info':
        default:
            domRefsMeldingZV.statusBerichtDiv.classList.add('status-info', 'bg-blue-100', 'border-blue-400', 'text-blue-700', 'dark:bg-blue-700', 'dark:text-blue-100', 'dark:border-blue-600');
            break;
    }
    domRefsMeldingZV.statusBerichtDiv.classList.remove('hidden');

    if (autoVerbergen) {
        setTimeout(() => {
            if (domRefsMeldingZV.statusBerichtDiv) {
                domRefsMeldingZV.statusBerichtDiv.classList.add('hidden');
            }
        }, 7000);
    }
}

/**
 * Werkt het jaartal in de footer bij.
 */
function updateJaarInFooterMeldingZV() {
    if (domRefsMeldingZV.currentYearSpan) {
        domRefsMeldingZV.currentYearSpan.textContent = new Date().getFullYear();
    }
}

// Wacht tot de DOM geladen is en de afhankelijke scripts.
// document.addEventListener('DOMContentLoaded', initializePaginaMeldingZV);
// ^^^ GECOMMENTEERD: Initialisatie voor modal gebeurt nu via initializeModalContextMeldingZV aangeroepen door verlofroosterModal_logic.js

// -- Legacy exports, still needed for compatibility --
window.initializeModalContextMeldingZV = initializeModalContextMeldingZV;

// -- New exports for improved modal handling --
window.initializeZittingsvrijModalForm = initializeZittingsvrijModalForm;
window.handleZittingsvrijModalFormSubmit = handleZittingsvrijModalFormSubmit;

console.log("[MeldingZittingsvrij] meldingZittingsvrij_logic.js geladen met verbeterde modal integratie.");