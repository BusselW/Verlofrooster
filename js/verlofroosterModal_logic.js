/**
 * Beheert de logica voor modals binnen het Verlofrooster,
 * inclusief het dynamisch laden van formulierinhoud en afhandeling van acties.
 * * Afhankelijk van:
 * - globale functies uit machtigingen.js (zoals getLijstConfig, createSPListItem, getRequestDigestGlobally)
 * - globale functies uit ui_utilities.js (zoals toonModalNotificatie, getSpinnerSvg)
 * - globale variabelen zoals window.spWebAbsoluteUrl, window.huidigeGebruiker
 * - de HTML-structuur van de modal placeholder in verlofrooster.aspx
 */

// Globale variabele om de huidige actie callback van de modal op te slaan
window.currentModalActionCallback = null;
// Globale variabele om de context van de medewerker voor de verlofmodal op te slaan
window.verlofModalMedewerkerContext = null;
// Globale variabele voor de geselecteerde medewerker in de zittingvrij modal
window.zittingVrijModalGeselecteerdeMedewerker = { gebruikersnaam: null, displayName: null };

// Helper function to check supervisor status (can be moved to a shared utility like util_auth.js or machtigingen.js if preferred)
function checkCurrentUserSupervisorStatusModalLogic() {
    if (!window.huidigeGebruiker || !window.huidigeGebruiker.sharePointGroepen) {
        // This log is useful for diagnosing permission issues, so it can be kept.
        console.warn("[VerlofroosterModalLogic] Kan supervisor status niet bepalen: huidigeGebruiker of sharePointGroepen niet beschikbaar.");
        return false;
    }
    // Groups that grant supervisor rights for modals, aligned with meldingVerlof_logic.js
    const privilegedGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars", "2.3. Senioren beoordelen"];
    return window.huidigeGebruiker.sharePointGroepen.some(groep =>
        privilegedGroups.some(privilegedGroup =>
            groep.toLowerCase().includes(privilegedGroup.toLowerCase())
        )
    );
}


/**
 * Hulpfunctie om HTML-speciale tekens te escapen.
 * @param {string} str De string om te escapen.
 * @returns {string} De geëscapete string.
 */
function escapeHTML(str) {
    // Zorg ervoor dat de input een string is, anders retourneer een lege string
    if (typeof str !== 'string') return ''; // Corrected: Added return statement
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[match];
    });
}

/**
 * Hulpfunctie om een spinner SVG string te genereren.
 * @returns {string} HTML string voor een SVG spinner.
 */
function getSpinnerSvg() {
    // Retourneert de HTML string voor een SVG-spinner icoon
    return '<svg class="animate-spin h-5 w-5 mr-2 text-white inline-block" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
}

/**
 * Utility functie voor notificaties binnen modals
 */
function toonModalNotificatie(bericht, type = 'info', autoHideDelay = 5000) {
    // This log is a good summary of user-facing notifications, so it can be kept.
    // console.log(`[VerlofroosterModalLogic] Modal notificatie - Type: ${type}, Bericht: ${bericht}`);

    // Probeer eerst het modal notification area te vinden
    const modalNotificationArea = document.getElementById('modal-notification-area');
    if (modalNotificationArea) {
        modalNotificationArea.innerHTML = bericht;
        modalNotificationArea.className = 'notification-area p-3 rounded-md text-sm mb-4';

        // Reset classes
        modalNotificationArea.classList.remove(
            'bg-green-100', 'text-green-800', 'border-green-300', 'dark:bg-green-800', 'dark:text-green-100', 'dark:border-green-600',
            'bg-red-100', 'text-red-800', 'border-red-300', 'dark:bg-red-800', 'dark:text-red-100', 'dark:border-red-600',
            'bg-blue-100', 'text-blue-800', 'border-blue-300', 'dark:bg-blue-800', 'dark:text-blue-100', 'dark:border-blue-600'
        );

        const isDarkTheme = document.body.classList.contains('dark-theme');
        switch (type) {
            case 'success':
                if (isDarkTheme) {
                    modalNotificationArea.classList.add('dark:bg-green-800', 'dark:text-green-100', 'dark:border-green-600');
                } else {
                    modalNotificationArea.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-300');
                }
                break;
            case 'error':
                if (isDarkTheme) {
                    modalNotificationArea.classList.add('dark:bg-red-800', 'dark:text-red-100', 'dark:border-red-600');
                } else {
                    modalNotificationArea.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
                }
                break;
            case 'info':
            default:
                if (isDarkTheme) {
                    modalNotificationArea.classList.add('dark:bg-blue-800', 'dark:text-blue-100', 'dark:border-blue-600');
                } else {
                    modalNotificationArea.classList.add('bg-blue-100', 'text-blue-800', 'border', 'border-blue-300');
                }
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
        return;
    }

    // Fallback naar globale notificatie als modal area niet gevonden wordt
    if (typeof window.toonNotificatie === 'function') {
        window.toonNotificatie(bericht.replace(/<[^>]*>?/gm, ''), type, autoHideDelay);
    } else {
        console.warn("[VerlofroosterModalLogic] Geen modal notification area en geen globale toonNotificatie functie gevonden");
    }
}

/**
 * Hulpfunctie om het donkere thema toe te passen op de modal elementen indien nodig.
 * Leest thema uit localStorage en past 'dark' class toe op de hoofdmodal container,
 * waardoor Tailwind's dark: prefixes in de modal structuur en geladen content activeren.
 */
function applyDarkThemeToModal() {
    const modalContainer = document.getElementById('modal-placeholder'); // De hoofdcontainer van de modal, in verlofrooster.aspx
    const opgeslagenThema = localStorage.getItem('verlofroosterThema') || 'light'; // Fallback naar light

    if (!modalContainer) {
        console.warn("[VerlofModalLogic] Hoofd modal container ('#modal-placeholder') niet gevonden voor thema toepassing. Controleer de openModal functie en de modal placeholder in verlofrooster.aspx.");
        return;
    }

    if (opgeslagenThema === 'dark') {
        modalContainer.classList.add('dark');
    } else {
        modalContainer.classList.remove('dark');
    }
    // console.log(`[VerlofModalLogic] Thema toegepast op modal: ${opgeslagenThema}`); // Removed verbose log

    // Optioneel: Pas specifieke classes toe op modal-body als de content zelf geen achtergrond heeft.
    // De content van meldingZittingsvrij.aspx heeft echter al dark:bg-gray-800 etc.
    // const modalBody = document.getElementById('modal-body-content'); // of 'modal-body' afhankelijk van openModal structuur
    // if (modalBody) {
    //     if (opgeslagenThema === 'dark') {
    //         modalBody.classList.add('dark:bg-gray-800', 'text-gray-200'); // Voorbeeld
    //     } else {
    //         modalBody.classList.remove('dark:bg-gray-800', 'text-gray-200');
    //     }
    // }
}


/**
 * Initialiseert de DOM referenties voor de modal en stelt globale event listeners in.
 * Deze functie moet aangeroepen worden zodra de DOM geladen is (bv. vanuit verlofrooster_logic.js).
 */
function initializeVerlofroosterModals() {
    // Initialiseert de DOM-referenties voor de modal en koppelt globale event listeners.
    // Deze functie wordt aangeroepen zodra de DOM geladen is.
    // console.log("[VerlofroosterModalLogic] Initialiseren modal DOM referenties en event listeners..."); // Removed verbose log

    // Gebruikt eerst de bestaande domRefsLogic als die al bestaat in verlofrooster_logic.js
    if (window.domRefsLogic && window.domRefsLogic.modalPlaceholder) {
        // console.log("[VerlofroosterModalLogic] Hergebruik bestaande DOM referenties van verlofrooster_logic.js"); // Removed verbose log
    } else {
        // Initialiseert nieuwe DOM referenties als ze niet bestaan
        window.domRefsLogic = window.domRefsLogic || {}; // Zorgt ervoor dat domRefsLogic bestaat

        // Modal elementen
        window.domRefsLogic.modalPlaceholder = document.getElementById('modal-placeholder');

        // Controleert of de modal placeholder bestaat voordat child elementen worden gezocht
        if (window.domRefsLogic.modalPlaceholder) {
            window.domRefsLogic.modalDialog = window.domRefsLogic.modalPlaceholder.querySelector('.modal-dialog');
            window.domRefsLogic.modalCard = window.domRefsLogic.modalPlaceholder.querySelector('.modal-card');
            window.domRefsLogic.modalTitle = document.getElementById('modal-title'); // ID blijft gelijk
            window.domRefsLogic.modalContent = document.getElementById('modal-content'); // ID blijft gelijk
            window.domRefsLogic.modalActionsContainer = document.getElementById('modal-actions'); // ID blijft gelijk
            window.domRefsLogic.modalActionButton = document.getElementById('modal-action-button'); // ID blijft gelijk
            window.domRefsLogic.modalCloseButton = document.getElementById('modal-close-button'); // Footer sluitknop
            window.domRefsLogic.modalCloseButtonX = document.getElementById('modal-close-button-x'); // 'X' knop in header
            window.domRefsLogic.modalStepNavigationContainer = document.getElementById('modal-step-navigation-container'); // Voor stappen navigatie
        }
    }

    // Controleert of alle essentiële modal elementen gevonden zijn
    let allElementsFound = true;
    for (const key in window.domRefsLogic) {
        if (!window.domRefsLogic[key] && key !== 'currentModalActionCallback' && key !== 'verlofModalMedewerkerContext' && key !== 'zittingVrijModalGeselecteerdeMedewerker') { // Uitzonderingen voor niet-DOM variabelen
            console.warn(`[VerlofroosterModalLogic] Modal DOM element '${key}' niet gevonden tijdens initialisatie.`);
            allElementsFound = false; // Optioneel: bijhouden of alle kritieke elementen zijn gevonden
        }
    }
    if (!allElementsFound) {
        console.error("[VerlofroosterModalLogic] Niet alle kritieke modal DOM elementen zijn gevonden. Modals werken mogelijk niet correct.");
    }


    // Event listener voor het sluiten van de modal door op de achtergrond te klikken
    if (window.domRefsLogic.modalPlaceholder) {
        window.domRefsLogic.modalPlaceholder.addEventListener('click', function (event) {
            if (event.target === window.domRefsLogic.modalPlaceholder) {
                closeModal();
            }
        });
    }

    // Event listener voor de sluitknop in de footer
    if (window.domRefsLogic.modalCloseButton) {
        window.domRefsLogic.modalCloseButton.addEventListener('click', closeModal);
    }

    // Event listener voor de 'X' sluitknop in de header
    if (window.domRefsLogic.modalCloseButtonX) {
        window.domRefsLogic.modalCloseButtonX.addEventListener('click', closeModal);
    }
    // console.log("[VerlofroosterModalLogic] Modal initialisatie voltooid."); // Removed verbose log
}

/**
 * Opent een generieke modal.
 * @param {string} titel - De titel van de modal.
 * @param {string} contentHtml - De HTML-inhoud voor de modal body.
 * @param {string | null} actionButtonText - Tekst voor de primaire actieknop. Null als geen actieknop.
 * @param {Function | null} actionCallback - Callback functie voor de primaire actieknop.
 * @param {boolean} [showCancelButton=true] - Of de annuleer/sluit knop getoond moet worden.
 * @param {boolean} [showPrevButton=false] - Of een 'Vorige' knop getoond moet worden (voor meerstaps modals).
 * @param {Function | null} [prevButtonCallback=null] - Callback voor de 'Vorige' knop.
 * @param {string} [modalSizeClass='max-w-md'] - Optionele Tailwind class voor modal breedte.
 */
function openModal(titel, contentHtml, actionButtonText, actionCallback, showCancelButton = true, showPrevButton = false, prevButtonCallback = null, modalSizeClass = 'max-w-md') {
    // Opent een generieke modal met de opgegeven titel, inhoud en acties.
    // console.log("[VerlofroosterModalLogic] Openen modal met titel:", titel); // Removed verbose log

    // Controleert of alle benodigde DOM-elementen voor de modal beschikbaar zijn.
    if (!window.domRefsLogic || !window.domRefsLogic.modalPlaceholder || !window.domRefsLogic.modalTitle || !window.domRefsLogic.modalContent || !window.domRefsLogic.modalActionButton || !window.domRefsLogic.modalCloseButton || !window.domRefsLogic.modalActionsContainer || !window.domRefsLogic.modalCard || !window.domRefsLogic.modalStepNavigationContainer) {
        console.error("[VerlofroosterModalLogic] Modal DOM elementen (of domRefsLogic) niet volledig geïnitialiseerd! Roep initializeVerlofroosterModals() eerst globaal aan. Kan modal niet openen.");
        // Toont een foutmelding aan de gebruiker als de modal niet geopend kan worden.
        if (typeof toonModalNotificatie === 'function') {
            toonModalNotificatie("Fout: Modal kan niet worden geopend. Essentiële elementen missen.", "error");
        } else {
            alert("Fout: Modal kan niet worden geopend. Essentiële elementen missen.");
        }
        return;
    }

    // Stelt de titel en inhoud van de modal in.
    window.domRefsLogic.modalTitle.textContent = titel;
    window.domRefsLogic.modalContent.innerHTML = contentHtml;
    window.currentModalActionCallback = null; // Reset de huidige actie callback.

    // Past de grootte van de modal aan.
    const modalDialog = window.domRefsLogic.modalDialog;
    if (modalDialog) {
        // Verwijder eerst alle mogelijke grootte klassen om conflicten te voorkomen.
        modalDialog.classList.remove('max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl');
        modalDialog.classList.add(modalSizeClass); // Voeg de gewenste grootte klasse toe.
    }

    // Configureert de primaire actieknop.
    if (actionButtonText && typeof actionCallback === 'function') {
        window.domRefsLogic.modalActionButton.textContent = actionButtonText;
        window.domRefsLogic.modalActionButton.classList.remove('hidden');
        window.currentModalActionCallback = actionCallback;

        // Zorgt ervoor dat er geen dubbele event listeners zijn.
        window.domRefsLogic.modalActionButton.removeEventListener('click', window.handleModalAction);
        window.handleModalAction = async function() {
    console.log("[handleModalAction] Modal action triggered");
    
    try {
        // Check if we're in verlof edit mode
        if (window.verlofModalBewerkingsmodus && window.verlofModalBewerkItem) {
            console.log("[handleModalAction] Using delete+create edit for verlof");
            return await window.updateVerlofAanvraag();
        }
        
        // Check if it's a new verlof request
        if (document.getElementById('verlof-form')) {
            console.log("[handleModalAction] Creating new verlof request");
            return await window.submitVerlofAanvraag();
        }
          // Check for ziekte forms
        if (document.getElementById('ziekte-form')) {
            console.log("[handleModalAction] Handling ziekte form");
            return await window.submitZiekmelding();
        }
          // Check for compensatie forms
        if (document.getElementById('compensatie-form')) {
            console.log("[handleModalAction] Handling compensatie form");
            return await handleCompensatieFormulierVerzenden();
        }
        
        // Check for zittingsvrij forms
        if (document.getElementById('zittingvrij-form')) {
            console.log("[handleModalAction] Handling zittingsvrij form");
            return await window.handleZittingsvrijModalFormSubmit();
        }
        
        console.warn("[handleModalAction] Unknown modal type");
        return false;
        
    } catch (error) {
        console.error("[handleModalAction] Error:", error);
        toonModalNotificatie(`Fout: ${error.message}`, 'error');
        return false;
    }
};
        window.domRefsLogic.modalActionButton.addEventListener('click', window.handleModalAction);
    } else {
        window.domRefsLogic.modalActionButton.classList.add('hidden');
    }

    // Toont of verbergt de annuleerknop.
    window.domRefsLogic.modalCloseButton.classList.toggle('hidden', !showCancelButton);

    // Configureert de 'Vorige' knop voor stapsgewijze modals.
    window.domRefsLogic.modalStepNavigationContainer.innerHTML = ''; // Maak de container eerst leeg.
    if (showPrevButton && typeof prevButtonCallback === 'function') {
        const prevButton = document.createElement('button');
        prevButton.id = 'modal-prev-step-button';
        prevButton.textContent = 'Vorige';
        // Standaard styling voor de 'Vorige' knop.
        prevButton.className = 'modal-button-secondary py-2 px-4 rounded-lg text-sm shadow hover:shadow-md transition-all';
        // Thema-specifieke styling.
        if (document.body.classList.contains('dark-theme')) {
            prevButton.classList.add('dark:bg-gray-600', 'dark:hover:bg-gray-500', 'dark:text-white');
        } else {
            prevButton.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
        }
        prevButton.addEventListener('click', prevButtonCallback);
        window.domRefsLogic.modalStepNavigationContainer.appendChild(prevButton);
        window.domRefsLogic.modalStepNavigationContainer.classList.remove('hidden');
    } else {
        window.domRefsLogic.modalStepNavigationContainer.classList.add('hidden');
    }

    // Toont of verbergt de actie container op basis van de aanwezige knoppen.
    const hasAction = actionButtonText && typeof actionCallback === 'function';
    const hasPrev = showPrevButton && typeof prevButtonCallback === 'function';
    window.domRefsLogic.modalActionsContainer.classList.toggle('hidden', !hasAction && !showCancelButton && !hasPrev);

    // Maakt de modal zichtbaar met animatie.
    window.domRefsLogic.modalPlaceholder.classList.remove('hidden');
    if (window.domRefsLogic.modalPlaceholder.style) { // Controleer of style object bestaat
        window.domRefsLogic.modalPlaceholder.style.display = 'flex'; // Zorgt voor correcte positionering
        window.domRefsLogic.modalPlaceholder.style.opacity = '1'; // Maak de overlay zichtbaar
        window.domRefsLogic.modalPlaceholder.style.pointerEvents = 'auto'; // Maak de overlay klikbaar
    }

    // Herstel pointer events op sluitknoppen voor het geval ze eerder disabled waren.
    if (window.domRefsLogic.modalCloseButtonX && window.domRefsLogic.modalCloseButtonX.style) {
        window.domRefsLogic.modalCloseButtonX.style.pointerEvents = 'auto';
    }
    if (window.domRefsLogic.modalCloseButton && window.domRefsLogic.modalCloseButton.style) {
        window.domRefsLogic.modalCloseButton.style.pointerEvents = 'auto';
    }

    // Forceert een reflow voor de animatie en maakt de modal kaart zichtbaar.
    void window.domRefsLogic.modalCard.offsetWidth;
    window.domRefsLogic.modalCard.classList.remove('opacity-0', 'scale-95');
    window.domRefsLogic.modalCard.classList.add('opacity-100', 'scale-100');

    // Pas thema toe op de zojuist geladen content
    applyDarkThemeToModal();
}

/**
 * Sluit de actieve modal.
 */
function closeModal() {
    // Sluit de actieve modal en reset de status.
    // console.log("[VerlofroosterModalLogic] Sluiten modal..."); // Removed verbose log
    // Controleert of de benodigde DOM-elementen bestaan.
    if (!window.domRefsLogic || !window.domRefsLogic.modalPlaceholder || !window.domRefsLogic.modalCard) {
        console.error("[VerlofroosterModalLogic] Modal DOM elementen (of domRefsLogic) niet gevonden voor sluiten!");
        return;
    }

    // Start de fade-out animatie.
    window.domRefsLogic.modalCard.classList.add('opacity-0', 'scale-95');
    window.domRefsLogic.modalCard.classList.remove('opacity-100', 'scale-100');

    // Maakt de overlay direct minder zichtbaar.
    if (window.domRefsLogic.modalPlaceholder && window.domRefsLogic.modalPlaceholder.style) {
        window.domRefsLogic.modalPlaceholder.style.opacity = '0';
    }

    // Voorkomt interactie met sluitknoppen tijdens de animatie.
    if (window.domRefsLogic.modalCloseButtonX && window.domRefsLogic.modalCloseButtonX.style) window.domRefsLogic.modalCloseButtonX.style.pointerEvents = 'none';
    if (window.domRefsLogic.modalCloseButton && window.domRefsLogic.modalCloseButton.style) window.domRefsLogic.modalCloseButton.style.pointerEvents = 'none';
    if (window.domRefsLogic.modalPlaceholder && window.domRefsLogic.modalPlaceholder.style) window.domRefsLogic.modalCloseButton.style.pointerEvents = 'none';

    // Wacht tot de animatie voltooid is voordat de modal volledig verborgen wordt.
    setTimeout(() => {
        if (window.domRefsLogic.modalPlaceholder) {
            window.domRefsLogic.modalPlaceholder.classList.add('hidden');
            if (window.domRefsLogic.modalPlaceholder.style) {
                window.domRefsLogic.modalPlaceholder.style.display = 'none'; // Verbergt het element.
                // Herstel opacity en pointer events voor de volgende keer dat de modal geopend wordt.
                window.domRefsLogic.modalPlaceholder.style.opacity = '0'; // Houd het onzichtbaar tot expliciet getoond.
                window.domRefsLogic.modalPlaceholder.style.pointerEvents = 'auto';
            }
        }

        // Herstelt de interactie met sluitknoppen.
        if (window.domRefsLogic.modalCloseButtonX && window.domRefsLogic.modalCloseButtonX.style) window.domRefsLogic.modalCloseButtonX.style.pointerEvents = 'auto';
        if (window.domRefsLogic.modalCloseButton && window.domRefsLogic.modalCloseButton.style) window.domRefsLogic.modalCloseButton.style.pointerEvents = 'auto';

        // Maakt de modal content leeg en reset de titel.
        if (window.domRefsLogic.modalContent) {
            window.domRefsLogic.modalContent.innerHTML = '';
            window.domRefsLogic.modalContent.classList.remove('verlof-modal-body', 'compensatie-modal-body', 'melding-maken-modal-body'); // Verwijder specifieke body classes
        }
        if (window.domRefsLogic.modalTitle) window.domRefsLogic.modalTitle.textContent = 'Modal Titel'; // Reset titel

        // Reset globale modal statussen.
        window.currentModalActionCallback = null;
        window.huidigeRegistratieStap = 1; // Voor registratie modal
        window.registratieFormDataStap1 = {}; // Voor registratie modal        
        if (window.zittingVrijModalGeselecteerdeMedewerker) { // Reset voor zittingvrij modal
            window.zittingVrijModalGeselecteerdeMedewerker = { gebruikersnaam: null, displayName: null };
        }

        // Reset bewerkingsmodus voor alle modals
        window.verlofModalBewerkingsmodus = false;
        window.verlofModalBewerkItem = null;
        window.compensatieModalBewerkingsmodus = false;
        window.compensatieModalBewerkItem = null;
        window.ziekteModalBewerkingsmodus = false;
        window.ziekteModalBewerkItem = null;
        window.zittingvrijModalBewerkingsmodus = false;
        window.zittingvrijModalBewerkItem = null;
    }, 200); // Duur van de animatie.
}

/**
 * Helper function to get a single item by ID from a SharePoint list.
 * Assumes getLijstConfig and getRequestDigestGlobally are available.
 * @param {string} lijstNaam - De key voor de lijst configuratie (e.g., 'Verlof', 'Ziekte').
 * @param {number | string} itemId - The ID of the list item.
 * @returns {Promise<object>} The SharePoint list item data.
 */
async function getSPListItemById(lijstNaam, itemId) {
    // console.log(`[getSPListItemById] Fetching item ${itemId} from list ${lijstNaam}`); // Removed verbose log
    const lijstConfig = getLijstConfig(lijstNaam);
    if (!lijstConfig || !lijstConfig.lijstId) {
        throw new Error(`Lijst configuratie voor '${lijstNaam}' niet gevonden.`);
    }

    const requestDigest = await getRequestDigestGlobally();
    const url = `${window.spWebAbsoluteUrl}/_api/web/lists(guid'${lijstConfig.lijstId}')/items(${itemId})`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Voorkom error als body leeg is
        console.error(`Fout bij ophalen van SharePoint item ${itemId} uit ${lijstNaam}:`, {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData
        });
        throw new Error(`Item ${itemId} ophalen uit ${lijstNaam} mislukt. Server status: ${response.statusText}`);
    }

    const data = await response.json();
    if (data && data.d) {
        return data.d; // The item data is in the 'd' property
    } else {
        throw new Error("Ongeldig response formaat van SharePoint API ontvangen.");
    }
}


/**
 * Opent de juiste modal in bewerkingsmodus voor een gegeven event type en ID.
 * Deze functie wordt aangeroepen vanuit de context menu logica.
 * @param {string} eventType - Het type event ('verlof', 'ziekte', 'compensatie', 'zittingvrij').
 * @param {number | string} eventId - Het ID van het item in de SharePoint lijst.
 */
window.openModalVoorBewerken = async function (eventType, eventId) {
    console.log(`[openModalVoorBewerken] Aangeroepen met eventType: '${eventType}', eventId: '${eventId}'`);

    if (!eventType || !eventId) {
        console.error("[openModalVoorBewerken] eventType of eventId ontbreekt.");
        toonModalNotificatie("Kan item niet bewerken: type of ID ontbreekt.", "error");
        return;
    }

    // Reset alle bewerkingsmodi en item data
    window.verlofModalBewerkingsmodus = false;
    window.verlofModalBewerkItem = null;
    window.ziekteModalBewerkingsmodus = false;
    window.ziekteModalBewerkItem = null;
    window.compensatieModalBewerkingsmodus = false;
    window.compensatieModalBewerkItem = null;
    window.zittingvrijModalBewerkingsmodus = false;
    window.zittingvrijModalBewerkItem = null;

    let lijstNaam;
    let openModalFunctie;

    // Map eventType naar lijstnaam en modal functie
    switch (eventType.toLowerCase()) {
        case 'verlof':
            lijstNaam = 'Verlof';
            openModalFunctie = window.openVerlofAanvraagModal;
            break;
        case 'ziekte':
            lijstNaam = 'Ziekte';
            openModalFunctie = window.openZiekBeterMeldenModal; // Changed from openZiekteModal to match actual function name
            break;
        case 'compensatie':
            lijstNaam = 'CompensatieUren';
            openModalFunctie = window.openCompensatieUrenModal;
            break;
        case 'zittingvrij':
            lijstNaam = 'Zittingsvrij';
            openModalFunctie = window.openZittingVrijModal;
            break;
        default:
            console.error(`[openModalVoorBewerken] Onbekend eventType: ${eventType}`);
            toonModalNotificatie(`Onbekend item type: ${eventType}.`, "error");
            return;
    }

    if (typeof openModalFunctie !== 'function') {
        console.error(`[openModalVoorBewerken] De modal functie voor '${eventType}' is niet gevonden op het window object.`);
        toonModalNotificatie(`Kan de modal voor '${eventType}' niet openen (functie niet gevonden).`, "error");
        return;
    }

    try {
        // Toon een laadindicator
        openModal("Item Laden...", getSpinnerSvg(), null, null, false);

        const itemData = await getSPListItemById(lijstNaam, eventId);
        console.log("[openModalVoorBewerken] Item data succesvol opgehaald:", itemData); 
        
        // Check if ID property exists in both cases (upper or lowercase)
        if (!itemData.ID && !itemData.Id) {
            console.error("[openModalVoorBewerken] Opgehaald item heeft geen ID of Id property:", itemData);
            throw new Error("Opgehaald item heeft geen geldig ID");
        }

        // Ensure item always has both ID and Id properties
        if (itemData.ID && !itemData.Id) itemData.Id = itemData.ID;
        if (itemData.Id && !itemData.ID) itemData.ID = itemData.Id;

        // Stel de globale bewerkingsvariabelen in met de opgehaalde data
        // De initialisatie-logica van elke modal gebruikt deze variabelen.
        switch (eventType.toLowerCase()) {
            case 'verlof':
                window.verlofModalBewerkingsmodus = true;
                window.verlofModalBewerkItem = itemData;
                console.log("[openModalVoorBewerken] Verlof bewerkingsmodus ingesteld:", {
                    bewerkingsmodus: window.verlofModalBewerkingsmodus,
                    itemData: window.verlofModalBewerkItem,
                    itemId: itemData.ID || itemData.Id
                });
                break;
            case 'ziekte':
                window.ziekteModalBewerkingsmodus = true;
                window.ziekteModalBewerkItem = itemData;
                break;
            case 'compensatie':
                window.compensatieModalBewerkingsmodus = true;
                window.compensatieModalBewerkItem = itemData;
                break;
            case 'zittingvrij':
                window.zittingvrijModalBewerkingsmodus = true;
                window.zittingvrijModalBewerkItem = itemData;
                break;
        }

        // Sluit de laad-modal. Een korte timeout geeft de UI tijd om te updaten.
        closeModal();

        setTimeout(() => {
            console.log(`[openModalVoorBewerken] Openen van ${eventType} modal in bewerkingsmodus`); 
            
            // SET THE GLOBAL VARIABLES HERE, RIGHT BEFORE OPENING THE MODAL
            if (eventType.toLowerCase() === 'verlof') {
                window.verlofModalBewerkingsmodus = true;
                window.verlofModalBewerkItem = itemData;
                console.log("[openModalVoorBewerken] SETTING verlof edit mode variables:", {
                    bewerkingsmodus: window.verlofModalBewerkingsmodus,
                    itemData: window.verlofModalBewerkItem,
                    itemId: itemData.ID || itemData.Id
                });
            }
            
            // Now open the modal
            if (eventType.toLowerCase() === 'verlof') {
                openModalFunctie(itemData, new Date(itemData.StartDatum), {
                    loginNaam: itemData.MedewerkerID,
                    normalizedUsername: itemData.MedewerkerID,
                    Title: itemData.Medewerker,
                    displayName: itemData.Medewerker
                });            } else if (eventType.toLowerCase() === 'ziekte') {
                window.ziekteModalBewerkingsmodus = true;
                window.ziekteModalBewerkItem = itemData;
                openModalFunctie({
                    loginNaam: itemData.MedewerkerID,
                    normalizedUsername: itemData.MedewerkerID,
                    displayName: itemData.Medewerker
                }, new Date(itemData.StartDatum), 'ziek');
            } else if (eventType.toLowerCase() === 'compensatie') {
                // Set edit mode for compensatie
                window.compensatieModalBewerkingsmodus = true;
                window.compensatieModalBewerkItem = itemData;
                console.log("[openModalVoorBewerken] SETTING compensatie edit mode variables:", {
                    bewerkingsmodus: window.compensatieModalBewerkingsmodus,
                    itemData: window.compensatieModalBewerkItem,
                    itemId: itemData.ID || itemData.Id
                });
                openModalFunctie(itemData, new Date(itemData.StartCompensatieUren || itemData.StartDatum), {
                    loginNaam: itemData.MedewerkerID,
                    normalizedUsername: itemData.MedewerkerID,
                    Title: itemData.Medewerker,
                    displayName: itemData.Medewerker
                });
            } else {
                openModalFunctie(null, new Date(itemData.StartCompensatieUren || itemData.StartDatum));
            }
        }, 250);
    } catch (error) {
        console.error(`[openModalVoorBewerken] Fout bij ophalen of openen van item:`, error);
        // Zorg ervoor dat de laad-modal sluit bij een fout
        closeModal();
        setTimeout(() => {
            toonModalNotificatie(`Fout bij het laden van het item: ${error.message}`, "error", false);
        }, 300);
    }
};

// --- HTML voor Compensatie Uren Formulier ---
/**
 * Genereert de HTML voor het compensatie-uren formulier.
 * @returns {string} De HTML string voor het formulier.
 */
function getCompensatieUrenFormulierHtml() {
    // Retourneert de HTML-structuur voor het compensatie-uren formulier.
    // Deze HTML is gebaseerd op de `Compensatie-uren Indienen` pagina uit `html.txt`.
    return `
        <form id="compensatie-form" class="compensatie-form space-y-6 p-1">
            <input type="hidden" id="Title" name="Title">
            <input type="hidden" id="MedewerkerID" name="MedewerkerID">
            <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip">
            <input type="hidden" id="Status" name="Status" value="Ingediend">
            <input type="hidden" id="StartCompensatieUrenISO" name="StartCompensatieUrenISO">
            <input type="hidden" id="EindeCompensatieUrenISO" name="EindeCompensatieUrenISO">

            <div id="modal-notification-area" class="notification-area hidden rounded-md" role="alert"></div>

            <div class="intro-banner-modal bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-100">
                    Hier kunt u de uren registreren die u extra heeft gewerkt en wilt compenseren.
                    Zorg ervoor dat de start- en eindtijden correct zijn.
                </p>
            </div>

            <div>
                <label for="ModalMedewerkerDisplay" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medewerker</label>
                <input type="text" id="ModalMedewerkerDisplay" name="MedewerkerDisplay" 
                       class="form-input mt-1 w-full bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                       readonly title="Uw naam zoals bekend in het systeem.">
            </div>

            <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg space-y-4">
                <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">Start Compensatie</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">                    <div>
                        <label for="ModalStartCompensatieDatum" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Startdatum <span class="text-red-500">*</span></label>
                        <input type="date" id="ModalStartCompensatieDatum" name="StartCompensatieDatum" class="form-input mt-1 w-full" required title="Selecteer de startdatum van de compensatie.">
                    </div>
                    <div>
                        <label for="ModalStartCompensatieTijd" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starttijd <span class="text-red-500">*</span></label>
                        <input type="time" id="ModalStartCompensatieTijd" name="StartCompensatieTijd" class="form-input mt-1 w-full" value="09:00" required title="Selecteer de starttijd van de compensatie.">
                    </div>
                </div>
            </fieldset>

            <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg space-y-4">
                <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">Einde Compensatie</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="ModalEindeCompensatieDatum" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einddatum <span class="text-red-500">*</span></label>
                        <input type="date" id="ModalEindeCompensatieDatum" name="EindeCompensatieDatum" class="form-input mt-1 w-full" required title="Selecteer de einddatum van de compensatie.">
                    </div>
                    <div>
                        <label for="ModalEindeCompensatieTijd" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eindtijd <span class="text-red-500">*</span></label>
                        <input type="time" id="ModalEindeCompensatieTijd" name="EindeCompensatieTijd" class="form-input mt-1 w-full" value="17:00" required title="Selecteer de eindtijd van de compensatie.">
                    </div>
                </div>
            </fieldset>
              <div>
                <label for="ModalUrenTotaal" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Totaal Uren</label>
                <input type="text" id="ModalUrenTotaal" name="UrenTotaal" class="form-input mt-1 w-full bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                       readonly title="Wordt automatisch berekend.">
            </div>

            <div>
                <label for="ModalOmschrijving" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Omschrijving</label>
                <textarea id="ModalOmschrijving" name="Omschrijving" rows="3" class="form-textarea mt-1 w-full" placeholder="Geef een duidelijke omschrijving (bijv. project, reden van overwerk)." title="Geef een duidelijke omschrijving voor deze compensatie-uren."></textarea>
                 <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Voer een duidelijke omschrijving in, zoals projectnaam of reden van overwerk.</p>
            </div>
        </form>
    `;
}

// --- Logica voor Compensatie Uren Modal ---
/**
 * Initialiseert de logica voor het compensatie-uren formulier binnen de modal.
 * @param {Date} geselecteerdeDatum - De initieel geselecteerde datum.
 * @param {Object} medewerkerGegevens - Gegevens van de huidige medewerker.
 */
function initializeCompensatieUrenFormulierLogica(geselecteerdeDatum, medewerkerGegevens, existingData = null) {
    // Initialiseert de logica specifiek voor het compensatie-uren formulier.
    console.log("[VerlofroosterModalLogic] Initialiseren compensatie-uren formulier logica. Geselecteerde datum:", geselecteerdeDatum, "Medewerker:", medewerkerGegevens, "Existing data:", existingData);

    // DOM Elementen specifiek voor dit formulier (binnen de modal)
    const medewerkerDisplayInput = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerIdInput = document.getElementById('MedewerkerID'); // Dit is een hidden input in de modal form
    const titleInput = document.getElementById('Title'); // Hidden input
    const aanvraagTijdstipInput = document.getElementById('AanvraagTijdstip'); // Hidden input

    const startCompensatieDatumInput = document.getElementById('ModalStartCompensatieDatum');
    const startCompensatieTijdInput = document.getElementById('ModalStartCompensatieTijd');
    const eindeCompensatieDatumInput = document.getElementById('ModalEindeCompensatieDatum');
    const eindeCompensatieTijdInput = document.getElementById('ModalEindeCompensatieTijd');

    const urenTotaalInput = document.getElementById('ModalUrenTotaal');

    // Check of we in bewerkingsmodus zijn (use passed data instead of global)    const isEdit = !!existingData;

    // Vult gebruikersinformatie in - gebruik medewerkerGegevens als die beschikbaar zijn
    if (medewerkerDisplayInput && medewerkerIdInput && titleInput && aanvraagTijdstipInput) {
        let displayName, userId;
        
        if (medewerkerGegevens && (medewerkerGegevens.Title || medewerkerGegevens.displayName || medewerkerGegevens.Naam)) {
            displayName = medewerkerGegevens.Title || medewerkerGegevens.displayName || medewerkerGegevens.Naam;
            userId = medewerkerGegevens.normalizedUsername || medewerkerGegevens.Username || medewerkerGegevens.loginNaam;
        } else if (window.huidigeGebruiker) {
            displayName = window.huidigeGebruiker.Title || window.huidigeGebruiker.normalizedUsername || "Onbekend";
            userId = window.huidigeGebruiker.normalizedUsername || "";
        } else {
            displayName = "Onbekend";
            userId = "";
        }

        medewerkerDisplayInput.value = displayName;
        medewerkerIdInput.value = userId;

        const vandaag = new Date();
        const datumStringVoorTitel = vandaag.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        titleInput.value = `Compensatie ${displayName} - ${datumStringVoorTitel}`;
        aanvraagTijdstipInput.value = vandaag.toISOString();
    } else {
        console.warn("[VerlofroosterModalLogic] Kon gebruikersinfo velden niet vinden voor compensatieformulier.");
    }

    // Als we in bewerkingsmodus zijn, vul het formulier met bestaande data
    if (isEdit && existingData) {
        console.log("[VerlofroosterModalLogic] Bewerkmodus: vul formulier met bestaande data", existingData);
        
        // Fill form with existing data
        if (medewerkerDisplayInput) medewerkerDisplayInput.value = existingData.Medewerker || "";
        if (medewerkerIdInput) medewerkerIdInput.value = existingData.MedewerkerID || "";
        if (titleInput) titleInput.value = existingData.Title || "";
        
        // Parse dates and times for editing
        if (existingData.StartCompensatieUren) {
            const startDate = new Date(existingData.StartCompensatieUren);
            if (startCompensatieDatumInput) startCompensatieDatumInput.value = startDate.toISOString().split('T')[0];
            if (startCompensatieTijdInput) startCompensatieTijdInput.value = startDate.toTimeString().slice(0, 5);
        }
          if (existingData.EindeCompensatieUren) {
            const endDate = new Date(existingData.EindeCompensatieUren);
            if (eindeCompensatieDatumInput) eindeCompensatieDatumInput.value = endDate.toISOString().split('T')[0];
            if (eindeCompensatieTijdInput) eindeCompensatieTijdInput.value = endDate.toTimeString().slice(0, 5);
        }
        
        const omschrijvingTextarea = document.getElementById('ModalOmschrijving');
        if (omschrijvingTextarea && existingData.Omschrijving) {
            omschrijvingTextarea.value = existingData.Omschrijving;
        }
        
        // Recalculate hours after filling the form
        setTimeout(() => {
            berekenUrenTotaalCompensatie();
        }, 100);
    } else {
        // Stelt standaard datum en tijd in voor nieuwe aanvraag
        setDefaultDateTimesCompensatie();
    }    // Stelt standaard datum en tijd in
    function setDefaultDateTimesCompensatie() {
        // Check for selected date range from context menu or FAB selection
        let initStartDatum, initEindDatum;

        if (window.compensatieModalStartDate && window.compensatieModalEndDate) {
            // Use dates from selection (context menu or other selection)
            initStartDatum = new Date(window.compensatieModalStartDate);
            initEindDatum = new Date(window.compensatieModalEndDate);
            console.log('[CompensatieUren] Using selected date range:', { start: initStartDatum, end: initEindDatum });
        } else if (geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum)) {
            // Use passed date as both start and end
            initStartDatum = new Date(geselecteerdeDatum);
            initEindDatum = new Date(geselecteerdeDatum);
            console.log('[CompensatieUren] Using passed date:', initStartDatum);
        } else {
            // Fallback to today
            initStartDatum = new Date();
            initEindDatum = new Date();
            console.log('[CompensatieUren] Using fallback (today):', initStartDatum);
        }

        const startDatumISO = initStartDatum.toISOString().split('T')[0];
        const eindDatumISO = initEindDatum.toISOString().split('T')[0];

        if (startCompensatieDatumInput) startCompensatieDatumInput.value = startDatumISO;
        if (startCompensatieTijdInput) startCompensatieTijdInput.value = "09:00"; // Standaard starttijd

        if (eindeCompensatieDatumInput) eindeCompensatieDatumInput.value = eindDatumISO;
        if (eindeCompensatieTijdInput) eindeCompensatieTijdInput.value = "17:00"; // Standaard eindtijd

        berekenUrenTotaalCompensatie(); // Herbereken uren
    }

    // Berekent het totaal aantal uren
    function berekenUrenTotaalCompensatie() {
        if (!startCompensatieDatumInput || !startCompensatieTijdInput || !eindeCompensatieDatumInput || !eindeCompensatieTijdInput || !urenTotaalInput) return;

        const startDatumValue = startCompensatieDatumInput.value;
        const startTijdValue = startCompensatieTijdInput.value;
        const eindDatumValue = eindeCompensatieDatumInput.value;
        const eindTijdValue = eindeCompensatieTijdInput.value;

        if (startDatumValue && startTijdValue && eindDatumValue && eindTijdValue) {
            const startDatumTijd = new Date(`${startDatumValue}T${startTijdValue}`);
            const eindDatumTijd = new Date(`${eindDatumValue}T${eindTijdValue}`);

            if (!isNaN(startDatumTijd.getTime()) && !isNaN(eindDatumTijd.getTime()) && eindDatumTijd > startDatumTijd) {
                const verschilInMs = eindDatumTijd.getTime() - startDatumTijd.getTime();
                const verschilInUren = verschilInMs / (1000 * 60 * 60);
                urenTotaalInput.value = verschilInUren.toFixed(2) + " uur";
            } else {
                urenTotaalInput.value = "Ongeldige periode";
            }
        } else {
            urenTotaalInput.value = "";
        }
    }

    // Koppelt event listeners aan datum/tijd inputs
    [startCompensatieDatumInput, startCompensatieTijdInput, eindeCompensatieDatumInput, eindeCompensatieTijdInput].forEach(input => {
        if (input) {
            input.addEventListener('change', berekenUrenTotaalCompensatie);
        }
    });

    if (!isEdit) {
        setDefaultDateTimesCompensatie(); // Stelt initiële waarden in alleen voor nieuwe aanvragen
    }
    applyDarkThemeToModal(); // Past thema toe op de nieuwe formulierelementen
    console.log("[VerlofroosterModalLogic] Compensatie-uren formulier logica geïnitialiseerd.");
}

/**
 * Verwerkt het verzenden van het compensatie-uren formulier.
 * @returns {Promise<boolean>} True als succesvol, anders false.
 */
async function handleCompensatieFormulierVerzenden() {
    // Verwerkt de verzending van het compensatie-uren formulier.
    console.log("[VerlofroosterModalLogic] Compensatie formulier verzenden gestart...");
    const form = document.getElementById('compensatie-form'); // Zorg dat dit ID uniek is binnen de modal
    const submitButton = document.getElementById('modal-action-button'); // De generieke actieknop van de modal

    if (!form || !submitButton) {
        console.error("[VerlofroosterModalLogic] Compensatie formulier of submit knop niet gevonden in modal.");
        toonModalNotificatie("Interne fout: Formulier kan niet worden verzonden.", "error", false);
        return false;
    }    // Check of we in bewerkingsmodus zijn
    const isEdit = window.compensatieModalBewerkingsmodus;
    const itemId = isEdit && window.compensatieModalBewerkItem && window.compensatieModalBewerkItem.ID ? window.compensatieModalBewerkItem.ID : null;

    // Valideert het formulier
    function valideerCompensatieFormulier() {
        const startDatumInput = document.getElementById('ModalStartCompensatieDatum');
        const startTijdInput = document.getElementById('ModalStartCompensatieTijd');
        const eindDatumInput = document.getElementById('ModalEindeCompensatieDatum');
        const eindTijdInput = document.getElementById('ModalEindeCompensatieTijd');
        const omschrijvingTextarea = document.getElementById('ModalOmschrijving');

        if (!startDatumInput || !startTijdInput || !eindDatumInput || !eindTijdInput || !omschrijvingTextarea) {
            toonModalNotificatie("Interne fout: Benodigde formuliervelden niet gevonden.", "error", false);
            return false;
        }

        if (!startDatumInput.value || !startTijdInput.value ||
            !eindDatumInput.value || !eindTijdInput.value) {
            toonModalNotificatie('Vul alle verplichte velden (*) in.', 'error', false);
            return false;
        }
        const startDatumTijd = new Date(`${startDatumInput.value}T${startTijdInput.value}`);
        const eindDatumTijd = new Date(`${eindDatumInput.value}T${eindTijdInput.value}`);

        if (isNaN(startDatumTijd.getTime()) || isNaN(eindDatumTijd.getTime())) {
            toonModalNotificatie('Ongeldige datum of tijd ingevoerd.', 'error', false);
            return false;
        }
        if (eindDatumTijd <= startDatumTijd) {
            toonModalNotificatie('De einddatum en -tijd moeten na de startdatum en -tijd liggen.', 'error', false);
            return false;
        }
        return true;
    }

    if (!valideerCompensatieFormulier()) {
        return false; // Validatie mislukt
    }

    submitButton.disabled = true;
    submitButton.innerHTML = getSpinnerSvg() + (isEdit ? 'Wijzigingen opslaan...' : 'Bezig met indienen...');
    toonModalNotificatie(isEdit ? 'Bezig met opslaan van wijzigingen...' : 'Bezig met indienen van uw compensatie...', 'info', false);    // Haalt de waarden uit de verborgen velden die al gevuld zijn bij initialisatie
    const titleElement = document.getElementById('Title');
    const medewerkerDisplayElement = document.getElementById('ModalMedewerkerDisplay');
    const medewerkerIdElement = document.getElementById('MedewerkerID');
    const aanvraagTijdstipElement = document.getElementById('AanvraagTijdstip');
    const statusElement = document.getElementById('Status');

    if (!titleElement || !medewerkerDisplayElement || !medewerkerIdElement || !aanvraagTijdstipElement || !statusElement) {
        console.error("[VerlofroosterModalLogic] Kritieke verborgen velden ontbreken.");
        toonModalNotificatie("Interne fout: Verborgen formuliervelden niet gevonden.", "error", false);
        submitButton.disabled = false;
        submitButton.textContent = isEdit ? 'Wijzigingen Opslaan' : 'Dien Compensatie In';
        return false;
    }

    const titleValue = titleElement.value;
    const medewerkerDisplayValue = medewerkerDisplayElement.value;
    const medewerkerIdValue = medewerkerIdElement.value;
    const aanvraagTijdstipValue = aanvraagTijdstipElement.value;
    const statusValue = statusElement.value;

    // Haalt waarden op van de zichtbare input velden
    const startCompensatieDatumElement = document.getElementById('ModalStartCompensatieDatum');
    const startCompensatieTijdElement = document.getElementById('ModalStartCompensatieTijd');
    const eindeCompensatieDatumElement = document.getElementById('ModalEindeCompensatieDatum');
    const eindeCompensatieTijdElement = document.getElementById('ModalEindeCompensatieTijd');
    const urenTotaalElement = document.getElementById('ModalUrenTotaal');
    const omschrijvingElement = document.getElementById('ModalOmschrijving');

    if (!startCompensatieDatumElement || !startCompensatieTijdElement || !eindeCompensatieDatumElement || !eindeCompensatieTijdElement || !urenTotaalElement || !omschrijvingElement) {
        console.error("[VerlofroosterModalLogic] Zichtbare formuliervelden ontbreken.");
        toonModalNotificatie("Interne fout: Formuliervelden niet gevonden.", "error", false);
        submitButton.disabled = false;
        submitButton.textContent = isEdit ? 'Wijzigingen Opslaan' : 'Dien Compensatie In';
        return false;
    }

    const startCompensatieDatumValue = startCompensatieDatumElement.value;
    const startCompensatieTijdValue = startCompensatieTijdElement.value;
    const eindeCompensatieDatumValue = eindeCompensatieDatumElement.value;
    const eindeCompensatieTijdValue = eindeCompensatieTijdElement.value;
    const urenTotaalValue = urenTotaalElement.value;
    const omschrijvingValue = omschrijvingElement.value;

    // Combineert datum en tijd naar ISO strings voor SharePoint
    const startDateTimeISO = new Date(`${startCompensatieDatumValue}T${startCompensatieTijdValue}`).toISOString();
    const eindeDateTimeISO = new Date(`${eindeCompensatieDatumValue}T${eindeCompensatieTijdValue}`).toISOString();

    const compensatieLijstConfig = getLijstConfig('CompensatieUren');
    if (!compensatieLijstConfig || !compensatieLijstConfig.lijstId || !compensatieLijstConfig.lijstTitel) {
        toonModalNotificatie('Fout: Compensatie kan niet worden verwerkt (configuratie ontbreekt).', 'error', false);
        submitButton.disabled = false;
        submitButton.textContent = isEdit ? 'Wijzigingen Opslaan' : 'Dien Compensatie In';
        console.error("[VerlofroosterModalLogic] Configuratie voor 'CompensatieUren' lijst niet gevonden of incompleet.");
        return false;
    }
    // Corrigeer de metadata type naam: verwijder spaties en maak eerste letter hoofdletter.
    const listNameForMetadata = compensatieLijstConfig.lijstTitel.replace(/\s+/g, '');
    const metadataType = `SP.Data.${listNameForMetadata.charAt(0).toUpperCase() + listNameForMetadata.slice(1)}ListItem`;


    const formDataPayload = {
        __metadata: { type: metadataType },
        Title: titleValue,
        Medewerker: medewerkerDisplayValue,
        MedewerkerID: medewerkerIdValue,
        AanvraagTijdstip: aanvraagTijdstipValue,
        StartCompensatieUren: startDateTimeISO,
        EindeCompensatieUren: eindeDateTimeISO,
        UrenTotaal: urenTotaalValue,
        Omschrijving: omschrijvingValue,
        Status: statusValue
    };

    console.log('[VerlofroosterModalLogic] Voor te bereiden payload voor SharePoint (CompensatieUren):', JSON.stringify(formDataPayload, null, 2));

    try {        if (isEdit && itemId) {
            console.log(`[VerlofroosterModalLogic] Updating item ${itemId} in CompensatieUren list with data:`, formDataPayload);
            
            // Update bestaand item
            if (typeof window.updateSPListItem !== 'function') {
                throw new Error("Functie updateSPListItem is niet beschikbaar. Zorg dat machtigingen.js geladen is.");
            }
            
            // Add specific debug logging here to check the update parameters
            console.log("[VerlofroosterModalLogic] Calling updateSPListItem with:", {
                listName: 'CompensatieUren',
                itemId: itemId,
                formDataKeys: Object.keys(formDataPayload)
            });
            
            await window.updateSPListItem('CompensatieUren', itemId, formDataPayload);
            toonModalNotificatie('Compensatie uren succesvol bijgewerkt!', 'success');
        } else {
            console.log(`[VerlofroosterModalLogic] Creating new item in CompensatieUren list.`);
            // Maak nieuw item
            if (typeof window.createSPListItem !== 'function') {
                throw new Error("Functie createSPListItem is niet beschikbaar. Zorg dat machtigingen.js geladen is.");
            }
            await window.createSPListItem('CompensatieUren', formDataPayload);
            toonModalNotificatie('Compensatie uren succesvol ingediend!', 'success');
        }        // Succes: sluit modal en ververs rooster
        setTimeout(() => {
            closeModal();
            if (typeof window.laadInitiëleData === 'function') {
                window.laadInitiëleData(false);
            } else if (typeof window.tekenRooster === 'function') {
                window.tekenRooster();
            }
        }, 2000);

        return true;    } catch (error) {
        console.error('[VerlofroosterModalLogic] Fout bij indienen compensatie:', error);
        toonModalNotificatie(`Fout bij ${isEdit ? 'bijwerken' : 'indienen'}: ${error.message}.`, 'error', false);
        return false;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = isEdit ? 'Wijzigingen Opslaan' : 'Compensatie Uren Indienen';
    }
}


/**
 * Opent een modal voor het aanvragen of bewerken van verlof.
 * @param {object} [itemData=null] - Optioneel. De data van een bestaand item om te bewerken.
 * @param {Date} [geselecteerdeDatum=new Date()] - De datum waarvoor verlof wordt aangevraagd (alleen voor nieuwe items).
 * @param {object} [medewerkerGegevens=null] - Medewerker context (alleen voor nieuwe items van huidige gebruiker).
 */
async function openVerlofAanvraagModal(itemData = null, geselecteerdeDatum = new Date(), medewerkerGegevens = null) {
    console.log("[VerlofroosterModalLogic] Opening verlof aanvraag modal. Edit mode:", !!itemData);

    try {
        // Zorg ervoor dat de CSS eerst wordt geladen
        await ensureVerlofModalCSS();

        const isEdit = !!itemData;
        const modalTitle = isEdit ? "Verlof Bewerken" : "Verlof Aanvragen";
        const buttonText = isEdit ? "Wijzigingen Opslaan" : "Verlofaanvraag Indienen";

        const formContainer = document.createElement('div');
        formContainer.className = 'verlof-modal-container';

        // VOLLEDIGE HTML GENERATIE - spiegelt precies de ziekte modal structuur
        formContainer.innerHTML = `
            <form id="verlof-form" class="verlof-form" novalidate>                <!-- Verborgen velden -->
                <input type="hidden" id="Title" name="Title">
                <input type="hidden" id="MedewerkerID" name="MedewerkerID">
                <input type="hidden" id="MedewerkerSharePointName" name="MedewerkerSharePointName">
                <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip">
                <input type="hidden" id="StartDatum" name="StartDatum">
                <input type="hidden" id="EindDatum" name="EindDatum">
                <input type="hidden" id="Status" name="Status" value="Nieuw">
                <input type="hidden" id="RedenId" name="RedenId">
                <input type="hidden" id="Reden" name="Reden" value="Verlof/vakantie">

                <!-- Formulier kop -->
                <div class="form-header">
                    <h2 class="form-title">${modalTitle}</h2>
                </div>

                <!-- Notificatiegebied -->
                <div id="modal-notification-area" class="notification-area hidden" role="alert"></div>

                <!-- Medewerker velden rij -->
                <div class="form-row">
                    <div class="form-group">
                        <label for="ModalMedewerkerDisplay" class="form-label">Medewerker</label>
                        <input type="text" id="ModalMedewerkerDisplay" name="MedewerkerDisplay" 
                               class="form-input bg-gray-50 dark:bg-gray-800 cursor-not-allowed" 
                               readonly title="Je naam zoals bekend in het systeem.">
                        <select id="ModalMedewerkerSelect" name="MedewerkerSelect" class="form-select hidden">
                            <option value="">Selecteer medewerker...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ModalMedewerkerIDDisplay" class="form-label">Medewerker ID</label>
                        <input type="text" id="ModalMedewerkerIDDisplay" name="MedewerkerIDDisplay" 
                               class="form-input bg-gray-50 dark:bg-gray-800 cursor-not-allowed" 
                               readonly title="Je gebruikersnaam.">
                    </div>
                </div>

                <!-- Start datum/tijd rij -->
                <div class="form-row">
                    <div class="form-group flex-2">
                        <label for="ModalStartDatePicker" class="form-label required">Startdatum</label>
                        <input type="date" id="ModalStartDatePicker" name="StartDatePicker" 
                               class="form-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               required title="Selecteer de startdatum van je verlof.">
                    </div>
                    <div class="form-group flex-1">
                        <label for="ModalStartTimePicker" class="form-label required">Starttijd</label>
                        <input type="time" id="ModalStartTimePicker" name="StartTimePicker" 
                               class="form-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               value="09:00" required title="Selecteer de starttijd van je verlof.">
                    </div>
                </div>

                <!-- Eind datum/tijd rij -->
                <div class="form-row">
                    <div class="form-group flex-2">
                        <label for="ModalEndDatePicker" class="form-label required">Einddatum</label>
                        <input type="date" id="ModalEndDatePicker" name="EndDatePicker" 
                               class="form-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               required title="Selecteer de einddatum van je verlof.">
                    </div>
                    <div class="form-group flex-1">
                        <label for="ModalEndTimePicker" class="form-label required">Eindtijd</label>
                        <input type="time" id="ModalEndTimePicker" name="EndTimePicker" 
                               class="form-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               value="17:00" required title="Selecteer de eindtijd van je verlof.">
                    </div>
                </div>

                <!-- Reden veld (alleen-lezen zoals ziekte) -->
                <div class="form-group">
                    <label class="form-label">Reden</label>
                    <input type="text" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" value="Verlof/vakantie" readonly title="De reden voor deze aanvraag is standaard Verlof/vakantie.">
                </div>

                <!-- Beschrijving veld -->
                <div class="form-group">
                    <label for="ModalOmschrijving" class="form-label">Omschrijving (optioneel)</label>
                    <textarea id="ModalOmschrijving" name="Omschrijving" class="form-textarea" placeholder="Eventuele toelichting bij je verlofaanvraag." title="Geef een duidelijke omschrijving voor deze compensatie-uren."></textarea>
                </div>
            </form>
        `;

        window.openModal(
            modalTitle,
            formContainer.innerHTML,
            buttonText,
            submitVerlofAanvraag, // Gebruik de nieuwe, correcte submit functie
            true, // showCancelButton
            false, // showPrevButton
            null, // prevButtonCallback
            'max-w-2xl' // modalSizeClass - wider for this form
        );

        // Initialiseer na het openen van de modal met de JUISTE parameters
        setTimeout(() => {
            const ingelogdeGebruiker = window.huidigeGebruiker;

            let contextVoorVerlof;
            if (medewerkerGegevens && medewerkerGegevens.loginNaam &&
                medewerkerGegevens.loginNaam !== ingelogdeGebruiker.loginNaam) {
                contextVoorVerlof = medewerkerGegevens;
            } else {
                contextVoorVerlof = ingelogdeGebruiker;
            }

            // Stel globale datumvariabelen in voordat je de initialisatie aanroept
            if (geselecteerdeDatum) {
                window.verlofModalStartDate = geselecteerdeDatum;
                window.verlofModalEndDate = geselecteerdeDatum;
            }

            // JUISTE parameter volgorde (spiegel ziekte patroon)
            if (typeof window.initializeVerlofModalForm === 'function') {
                window.initializeVerlofModalForm(
                    contextVoorVerlof,          // 1e param: medewerkerContext (zoals ziekte)
                    geselecteerdeDatum,         // 2e param: geselecteerdeDatum (zoals ziekte)
                    itemData                    // 3e param: itemData (zoals ziekte)
                );
                console.log("[openVerlofAanvraagModal] initializeVerlofModalForm succesvol aangeroepen.");
            } else {
                console.error("[openVerlofAanvraagModal] Functie initializeVerlofModalForm niet gevonden.");
            }
        }, 100);

    } catch (error) {
        console.error("[VerlofroosterModalLogic] Fout bij het openen van verlof modal:", error);
        if (typeof window.toonModalNotificatie === 'function') {
            window.toonModalNotificatie(`Fout bij openen verlofaanvraag: ${error.message}`, "error");
        }
    }
}
// --- Function to load Ziekte Modal CSS ---
/**
 * Dynamisch laden van CSS voor de Ziekte Modal indien nog niet aanwezig.
 * Zorgt ervoor dat de specifieke CSS voor ziekteMelden.aspx wordt geladen.
 */
async function ensureZiekteModalCSS() {
    const cssId = 'ziekte-modal-styles';
    const cssName = 'meldingZiekte_styles';

    // If already loaded, return immediately
    if (document.getElementById(cssId)) {
        console.log("[ensureZiekteModalCSS] CSS already loaded");
        return;
    }

    console.log("[ensureZiekteModalCSS] Loading ziekte modal styles...");

    // Use the central path registry to get the correct URL
    let cssPath;
    if (window.appPaths) {
        cssPath = window.appPaths.getCssUrl(cssName);
    } else {
        // Fallback with correct structure if path registry not available
        cssPath = normalizePath(`${window.spWebAbsoluteUrl}/cpw/pages/css/${cssName}.css`);
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssPath;

        console.log(`[ensureZiekteModalCSS] Loading CSS from: ${cssPath}`);

        link.onload = () => {
            console.log("[ensureZiekteModalCSS] CSS loaded successfully");
            resolve();
        };
        link.onerror = (error) => {
            console.error("[ensureZiekteModalCSS] Failed to load CSS:", error);
            reject(error);
        };
        document.head.appendChild(link);
    });
}

// Helper function if path registry not available
function normalizePath(path) {
    return path.replace(/\/+/g, '/');
}

/**
 * Opent een modal voor het melden van ziekte of beterschap.
 * @param {Object} medewerkerGegevens - Informatie over de medewerker.
 * @param {Date} geselecteerdeDatum - De datum waarop de melding betrekking heeft.
 * @param {string} [typeMelding='ziek'] - Het type melding: 'ziek' of 'beter'.
 */
async function openZiekBeterMeldenModal(medewerkerGegevens, geselecteerdeDatum, typeMelding = 'ziek') {
    console.log("[openZiekBeterMeldenModal] Opening ziekte modal", { medewerkerGegevens, geselecteerdeDatum, typeMelding });

    try {
        // IMPORTANT FIX: Load CSS before creating the modal
        await ensureZiekteModalCSS();

        // Check if modal system is available
        if (typeof window.openModal !== 'function') {
            console.error("[openZiekBeterMeldenModal] Modal system not available");
            return;
        }

        const modalTitle = typeMelding === 'ziek' ? "Ziek Melden" : "Beter Melden";

        // Create the form container with correct classes
        const formContainer = document.createElement('div');
        formContainer.className = 'ziekte-modal-container'; // This is where this line belongs

        // Build the form HTML exactly matching ziekteMelden.aspx structure
        formContainer.innerHTML = `
           
            <form id="ziekte-form" class="ziekte-form" novalidate> <!-- Updated class name -->
                <input type="hidden" id="Title" name="Title">
                <input type="hidden" id="MedewerkerID" name="MedewerkerID"> 
                <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip">
                <input type="hidden" id="StartDatum" name="StartDatum"> 
                <input type="hidden" id="EindDatum" name="EindDatum">   
                <input type="hidden" id="Status" name="Status" value="Nieuw">
                <input type="hidden" id="RedenId" name="RedenId" value="1"> 
                <input type="hidden" id="Reden" name="Reden" value="Ziekte"> 

                <div class="form-header">
                    <h2 class="form-title">${modalTitle}</h2>
                </div>

                <div id="modal-notification-area" class="notification-area hidden" role="alert"></div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="ModalMedewerkerDisplay" class="form-label">Medewerker</label>
                        <input type="text" id="ModalMedewerkerDisplay" name="MedewerkerDisplay" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" readonly title="Je naam zoals bekend in het systeem.">
                    </div>
                    <div class="form-group">
                        <label for="ModalMedewerkerIDDisplay" class="form-label">Medewerker ID</label>
                        <input type="text" id="ModalMedewerkerIDDisplay" name="MedewerkerIDDisplay" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" readonly title="Je gebruikersnaam.">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="ModalStartDatePicker" class="form-label required">Startdatum</label>
                        <input type="date" id="ModalStartDatePicker" name="StartDatePicker" class="form-input" required title="Selecteer de startdatum van je ziekmelding.">
                    </div>
                    <div class="form-group">
                        <label for="ModalStartTimePicker" class="form-label required">Starttijd</label>
                        <input type="time" id="ModalStartTimePicker" name="StartTimePicker" class="form-input" value="09:00" required title="Selecteer de starttijd van je ziekmelding.">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="ModalEndDatePicker" class="form-label required">Einddatum</label>
                        <input type="date" id="ModalEndDatePicker" name="EndDatePicker" class="form-input" required title="Selecteer de einddatum van je ziekmelding.">
                    </div>
                    <div class="form-group">
                        <label for="ModalEndTimePicker" class="form-label required">Eindtijd</label>
                        <input type="time" id="ModalEndTimePicker" name="EndTimePicker" class="form-input" value="17:00" required title="Selecteer de eindtijd van je ziekmelding.">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Reden</label>
                    <input type="text" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" value="Ziekte" readonly title="De reden voor deze aanvraag is standaard Ziekte.">
                </div>

                <div class="form-group">
                    <label for="ModalOmschrijving" class="form-label">Omschrijving (optioneel)</label>
                    <textarea id="ModalOmschrijving" name="Omschrijving" class="form-textarea" placeholder="Eventuele toelichting, bijv. specifieke details over gedeeltelijke dag." title="Geef hier eventueel een extra toelichting op je ziekmelding."></textarea>
                </div>
            </form>
        `;

        // Open the modal with the controlled content
        window.openModal(
            modalTitle,
            formContainer.innerHTML,
            "Melding Opslaan",
            async () => {
                // Call the specific submission handler from meldingZiekte_logic.js
                if (typeof window.submitZiekmelding === 'function') {
                    // Create a fake event object to prevent form submission
                    const fakeEvent = { preventDefault: () => { } };
                    await window.submitZiekmelding(fakeEvent);
                } else {
                    console.error("Functie submitZiekmelding niet gevonden in window scope.");
                    if (typeof window.toonModalNotificatie === 'function') {
                        window.toonModalNotificatie("Fout bij opslaan: submitfunctie niet gevonden.", "error");
                    }
                }
                return true;
            },
            true, // showCancelButton

            false, // showPrevButton
            null, // prevButtonCallback
            'max-w-2xl' // modalSizeClass - wider for this form
        );

        // FIX: Apply ziekte-modal-body class to modal content for proper styling context
        if (window.domRefsLogic && window.domRefsLogic.modalBody) {
            window.domRefsLogic.modalBody.classList.add('ziekte-modal-body');
        }

        // Initialize the form after modal opens (mirror verlof pattern)
        setTimeout(() => {
            // Determine employee context like verlof modal does
            const ingelogdeGebruiker = window.huidigeGebruiker;

            let contextVoorZiekmelding;
            if (medewerkerGegevens && medewerkerGegevens.loginNaam &&
                medewerkerGegevens.loginNaam !== ingelogdeGebruiker.loginNaam) {
                contextVoorZiekmelding = medewerkerGegevens;
            } else {
                contextVoorZiekmelding = ingelogdeGebruiker;
            }

            // FIX: Set global date variables before calling initialization
            if (geselecteerdeDatum) {
                window.ziekmeldingModalStartDate = geselecteerdeDatum;
                window.ziekmeldingModalEndDate = geselecteerdeDatum;
            }

            // Apply theme to ensure dark mode works correctly
            applyDarkThemeToModal();

            // FIX: Correct parameter order
            if (typeof window.initializeZiekmeldingModal === 'function') {
                window.initializeZiekmeldingModal(
                    contextVoorZiekmelding,     // 1st param: medewerkerContext
                    geselecteerdeDatum,         // 2nd param: geselecteerdeDatum  
                    null                        // 3rd param: itemData (null for new)
                );
                console.log("[openZiekBeterMeldenModal] initializeZiekmeldingModal called successfully.");
            } else {
                console.error("[openZiekBeterMeldenModal] Function initializeZiekmeldingModal not found.");
            }
        }, 100);

    } catch (error) {
        console.error("[openZiekBeterMeldenModal] Error opening ziekte modal:", error);
        if (typeof window.toonModalNotificatie === 'function') {
            window.toonModalNotificatie(`Fout bij openen ziekmelding: ${error.message}`, "error");
        }
    }
}

async function ensureVerlofModalCSS() {
    const cssId = 'verlof-modal-styles';
    const cssName = 'meldingVerlof_styles';

    // Check if CSS is already loaded
    if (document.getElementById(cssId)) {
        return;
    }

    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';

        let cssPath;
        if (window.appPaths) {
            cssPath = window.appPaths.getCssUrl(cssName);
        } else {
            // Fallback with correct structure
            cssPath = normalizePath(`${window.spWebAbsoluteUrl}/cpw/pages/css/${cssName}.css`);
        }

        link.href = cssPath;

        link.onload = () => {
            resolve();
        };

        link.onerror = () => {
            console.error(`[ensureVerlofModalCSS] Failed to load ${cssPath}`);
            resolve(); // Still resolve to not block execution
        };

        document.head.appendChild(link);
    });
}

/**
 * Helper function to submit the leave request form.
 * This function is called when the user submits the leave request modal.
 * It gathers the form data, validates it, and either creates or updates a leave request item in SharePoint.
 * It also handles notifications and UI updates based on the success or failure of the operation.
 */
/**
 * Dedicated function for updating existing verlof items
 * This keeps edit logic separate from create logic to avoid confusion
 */
async function updateVerlofAanvraag(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    
    console.log("[updateVerlofAanvraag] Starting update process");
    
    // Verify we're in edit mode
    if (!window.verlofModalBewerkingsmodus || !window.verlofModalBewerkItem) {
        console.error("[updateVerlofAanvraag] Not in edit mode or no item to edit");
        toonModalNotificatie("Fout: Geen item om bij te werken", "error");
        return false;
    }
    
    const bewerkItem = window.verlofModalBewerkItem;
    const itemId = bewerkItem.ID || bewerkItem.Id;
    
    if (!itemId) {
        console.error("[updateVerlofAanvraag] No item ID found");
        toonModalNotificatie("Fout: Item ID ontbreekt", "error");
        return false;
    }
    
    console.log(`[updateVerlofAanvraag] Will delete item ${itemId} and recreate`);
    console.log("[updateVerlofAanvraag] Original item data:", bewerkItem);
    
    // Collect form data for the new item
    const form = document.getElementById('verlof-form');
    const newItemData = {
        Title: form.Title.value,
        MedewerkerID: form.MedewerkerID.value,
        AanvraagTijdstip: form.AanvraagTijdstip.value,
        StartDatum: form.StartDatum.value,
        EindDatum: form.EindDatum.value,
        Status: form.Status.value,
        RedenId: form.RedenId.value,
        Reden: form.Reden.value,
        Omschrijving: form.Omschrijving.value
    };
    
    // Remove empty fields
    Object.keys(newItemData).forEach(key => {
        if (newItemData[key] === null || newItemData[key] === undefined || newItemData[key] === '') {
            delete newItemData[key];
        }
    });
    
    console.log("[updateVerlofAanvraag] New item data:", newItemData);
    
    try {
        toonModalNotificatie('Bezig met verwijderen van origineel item...', 'info', false);
        
        // Step 1: Delete the original item with explicit error checking
        console.log(`[updateVerlofAanvraag] STARTING DELETE of item ${itemId}`);
        
        // Check if deleteSPListItem function exists
        if (typeof window.deleteSPListItem !== 'function') {
            throw new Error("deleteSPListItem function is not available");
        }
        
        const deleteResult = await window.deleteSPListItem('Verlof', itemId);
        console.log(`[updateVerlofAanvraag] DELETE RESULT:`, deleteResult);
        
        if (!deleteResult) {
            throw new Error("Delete operation returned false or null");
        }
        
        console.log(`[updateVerlofAanvraag] SUCCESS: Original item ${itemId} deleted`);
        
        // Step 2: Create the new item
        toonModalNotificatie('Origineel item verwijderd, bezig met aanmaken van nieuw item...', 'info', false);
        console.log(`[updateVerlofAanvraag] STARTING CREATE of new item`);
        
        const createResult = await window.createSPListItem('Verlof', newItemData);
        console.log(`[updateVerlofAanvraag] CREATE RESULT:`, createResult);
        
        console.log(`[updateVerlofAanvraag] SUCCESS: New item created`);
        
        toonModalNotificatie('Verlofaanvraag succesvol bijgewerkt!', 'success');
        
        // Clear edit mode flags
        window.verlofModalBewerkingsmodus = false;
        window.verlofModalBewerkItem = null;
        
        setTimeout(() => {
            closeModal();
            if (typeof window.Laadinitiele === 'function') {
                window.Laadinitiele(false);
            }
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error("[updateVerlofAanvraag] PROCESS FAILED:", error);
        console.error("[updateVerlofAanvraag] Error details:", {
            message: error.message,
            stack: error.stack,
            itemId: itemId,
            deleteFunctionExists: typeof window.deleteSPListItem === 'function'
        });
        
        toonModalNotificatie(`Fout bij bijwerken: ${error.message}`, 'error');
        return false;
    }
}

// Expose the function globally
window.updateVerlofAanvraag = updateVerlofAanvraag;

/**
 * Opens the compensatie uren modal for creating/editing compensatie entries
 * @param {Object|null} itemData - Existing compensatie data for editing (null for new entries)
 * @param {Date} geselecteerdeDatum - The selected date 
 * @param {Object|null} medewerkerGegevens - Employee data
 */
async function openCompensatieUrenModal(itemData = null, geselecteerdeDatum = new Date(), medewerkerGegevens = null) {
    console.log("[VerlofroosterModalLogic] Opening compensatie uren modal. Edit mode:", !!itemData);

    try {
        const isEdit = !!itemData;
        const modalTitle = isEdit ? "Compensatie Uren Bewerken" : "Compensatie Uren Doorgeven";
        const buttonText = isEdit ? "Wijzigingen Opslaan" : "Compensatie Uren Indienen";

        // Set edit mode globals if editing
        if (isEdit) {
            window.compensatieModalBewerkingsmodus = true;
            window.compensatieModalBewerkItem = itemData;
        } else {
            window.compensatieModalBewerkingsmodus = false;
            window.compensatieModalBewerkItem = null;
        }

        const formContainer = document.createElement('div');
        formContainer.className = 'compensatie-modal-container';

        // Generate HTML using the existing function
        formContainer.innerHTML = getCompensatieUrenFormulierHtml();

        // Open the modal with the controlled content
        window.openModal(
            modalTitle,
            formContainer.innerHTML,
            buttonText,
            handleCompensatieFormulierVerzenden,
            true, // showCancelButton
            false, // showPrevButton
            null, // prevButtonCallback
            'max-w-2xl' // modalSizeClass - wider for this form
        );

        // Initialize the form after the modal is opened
        setTimeout(() => {
            const ingelogdeGebruiker = window.huidigeGebruiker;

            let contextVoorCompensatie;
            if (medewerkerGegevens && medewerkerGegevens.loginNaam &&
                medewerkerGegevens.loginNaam !== ingelogdeGebruiker.loginNaam) {
                contextVoorCompensatie = medewerkerGegevens;
            } else {
                contextVoorCompensatie = ingelogdeGebruiker;
            }

            // Initialize the form logic
            if (typeof initializeCompensatieUrenFormulierLogica === 'function') {
                initializeCompensatieUrenFormulierLogica(geselecteerdeDatum, contextVoorCompensatie, itemData);
                console.log("[openCompensatieUrenModal] initializeCompensatieUrenFormulierLogica successfully called.");
            } else {
                console.error("[openCompensatieUrenModal] Function initializeCompensatieUrenFormulierLogica not found.");
            }
        }, 100);

    } catch (error) {
        console.error("[VerlofroosterModalLogic] Error opening compensatie modal:", error);
        if (typeof window.toonModalNotificatie === 'function') {
            window.toonModalNotificatie(`Error opening compensatie modal: ${error.message}`, "error");
        }
    }
}

// Make the function globally available
window.openCompensatieUrenModal = openCompensatieUrenModal;

/**
 * Opens the zittingsvrij modal for creating/editing zittingsvrij entries
 * @param {Object|null} itemData - Existing zittingsvrij data for editing (null for new entries)
 * @param {Date} geselecteerdeDatum - The selected date 
 * @param {Object|null} medewerkerGegevens - Employee data
 */
async function openZittingVrijModal(itemData = null, geselecteerdeDatum = new Date(), medewerkerGegevens = null) {
    console.log("[openZittingVrijModal] Opening zittingsvrij modal", { itemData, geselecteerdeDatum, medewerkerGegevens });

    try {
        // Determine if this is edit mode
        const isEdit = !!itemData;
        const modalTitle = isEdit ? "Zittingsvrij Bewerken" : "Zittingsvrij Melden";

        // Create the form container with the zittingsvrij form HTML structure
        const formContainer = document.createElement('div');
        formContainer.className = 'zittingsvrij-modal-container';

        // Generate HTML matching the standalone page structure but optimized for modal
        formContainer.innerHTML = `
            <form id="zittingvrij-form" class="space-y-6">
                <!-- Hidden fields for SharePoint submission -->
                <input type="hidden" id="form-titel" name="Title">
                <input type="hidden" id="MedewerkerID" name="MedewerkerID">

                <div id="modal-notification-area" class="notification-area hidden rounded-md" role="alert"></div>

                <div class="intro-banner-modal bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <p class="text-sm text-blue-800 dark:text-blue-100">
                        ${isEdit ? 'Bewerk de zittingsvrije periode.' : 'Hier kunt u een medewerker incidenteel zittingvrij melden. Zorg ervoor dat alle gegevens correct zijn ingevuld.'}
                    </p>
                </div>

                <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                    <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Medewerker Informatie</legend>
                    <div class="space-y-4">
                        <div>
                            <label for="form-medewerker-display" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medewerker <span class="text-red-500">*</span></label>
                            <input type="text" id="form-medewerker-display" name="MedewerkerDisplay"
                                   class="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200"
                                   placeholder="Typ volledige naam medewerker..." required>
                        </div>
                        <div>
                            <label for="form-gebruikersnaam" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gebruikersnaam (ter controle)</label>
                            <input type="text" id="form-gebruikersnaam" name="Gebruikersnaam"
                                   class="form-input bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                   placeholder="Wordt automatisch gevuld" readonly>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                    <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Periode Zittingvrij</legend>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="form-start-datum" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Startdatum <span class="text-red-500">*</span></label>
                            <input type="date" id="form-start-datum" name="startDatum" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                        <div>
                            <label for="form-start-tijd" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starttijd <span class="text-red-500">*</span></label>
                            <input type="time" id="form-start-tijd" name="startTijd" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="form-eind-datum" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einddatum <span class="text-red-500">*</span></label>
                            <input type="date" id="form-eind-datum" name="eindDatum" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                        <div>
                            <label for="form-eind-tijd" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eindtijd <span class="text-red-500">*</span></label>
                            <input type="time" id="form-eind-tijd" name="eindTijd" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                    <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Details</legend>
                    <div class="flex items-center mt-2 mb-4">
                        <input id="form-terugkerend" name="Terugkerend" type="checkbox" class="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                        <label for="form-terugkerend" class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Terugkerend evenement</label>
                    </div>

                    <div id="recurring-fields-container" class="space-y-4 hidden">
                        <div>
                            <label for="form-terugkeerpatroon" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terugkeerpatroon</label>
                            <select id="form-terugkeerpatroon" name="TerugkeerPatroon" class="form-select dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                <option value="">Niet herhalen</option>
                                <option value="Dagelijks">Dagelijks</option>
                                <option value="Wekelijks">Wekelijks (zelfde dag v/d week)</option>
                                <option value="Maandelijks">Maandelijks (zelfde dag v/d maand)</option>
                            </select>
                        </div>
                        <div>
                            <label for="form-terugkerend-tot" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Herhalen tot en met</label>
                            <input type="date" id="form-terugkerend-tot" name="TerugkerendTot" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                        </div>
                    </div>
                </fieldset>
            </form>
        `;

        // Open the modal with the form content
        window.openModal(
            modalTitle,
            formContainer.innerHTML,
            isEdit ? "Wijzigingen Opslaan" : "Opslaan",
            async () => {
                // Call the zittingsvrij submission handler
                if (typeof window.handleZittingsvrijModalFormSubmit === 'function') {
                    return await window.handleZittingsvrijModalFormSubmit();
                } else {
                    console.error("[openZittingVrijModal] Function handleZittingsvrijModalFormSubmit not found.");
                    if (typeof window.toonModalNotificatie === 'function') {
                        window.toonModalNotificatie("Fout bij opslaan: submitfunctie niet gevonden.", "error");
                    }
                    return false;
                }
            },
            true, // showCancelButton
            false, // showPrevButton
            null, // prevButtonCallback
            'max-w-2xl' // modalSizeClass - wider for this form
        );

        // Set edit mode flags if this is an edit operation
        if (isEdit) {
            window.zittingvrijModalBewerkingsmodus = true;
            window.zittingvrijModalBewerkItem = itemData;
        }

        // Initialize the form after modal opens
        setTimeout(() => {
            // Determine employee context
            const ingelogdeGebruiker = window.huidigeGebruiker;

            let contextVoorZittingsvrij;
            if (medewerkerGegevens && medewerkerGegevens.loginNaam &&
                medewerkerGegevens.loginNaam !== ingelogdeGebruiker.loginNaam) {
                contextVoorZittingsvrij = medewerkerGegevens;
            } else {
                contextVoorZittingsvrij = ingelogdeGebruiker;
            }

            // Set global context variables for the zittingsvrij modal initialization
            window.zittingVrijModalGeselecteerdeMedewerker = {
                gebruikersnaam: contextVoorZittingsvrij.loginNaam,
                displayName: contextVoorZittingsvrij.displayName || contextVoorZittingsvrij.medewerkerNaamVolledig
            };

            // Apply theme to ensure dark mode works correctly
            if (typeof window.applyDarkThemeToModal === 'function') {
                window.applyDarkThemeToModal();
            }

            // Initialize the form with correct parameters
            if (typeof window.initializeZittingsvrijModalForm === 'function') {
                window.initializeZittingsvrijModalForm(geselecteerdeDatum, contextVoorZittingsvrij);
                console.log("[openZittingVrijModal] initializeZittingsvrijModalForm successfully called.");
            } else {
                console.error("[openZittingVrijModal] Function initializeZittingsvrijModalForm not found.");
            }
        }, 100);

    } catch (error) {
        console.error("[openZittingVrijModal] Error opening zittingsvrij modal:", error);
        if (typeof window.toonModalNotificatie === 'function') {
            window.toonModalNotificatie(`Fout bij openen zittingsvrij modal: ${error.message}`, "error");
        }
    }
}

// Make the function globally available
window.openZittingVrijModal = openZittingVrijModal;