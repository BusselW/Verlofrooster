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
    console.log(`[VerlofroosterModalLogic] Modal notificatie - Type: ${type}, Bericht: ${bericht}`);
    
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
    // console.log(`[VerlofModalLogic] Thema toegepast op modal: ${opgeslagenThema}`);

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
    console.log("[VerlofroosterModalLogic] Initialiseren modal DOM referenties en event listeners...");
    
    // Gebruikt eerst de bestaande domRefsLogic als die al bestaat in verlofrooster_logic.js
    if (window.domRefsLogic && window.domRefsLogic.modalPlaceholder) {
        console.log("[VerlofroosterModalLogic] Hergebruik bestaande DOM referenties van verlofrooster_logic.js");
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
        window.domRefsLogic.modalPlaceholder.addEventListener('click', function(event) {
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
    console.log("[VerlofroosterModalLogic] Modal initialisatie voltooid.");
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
    console.log("[VerlofroosterModalLogic] Openen modal met titel:", titel);

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
        window.handleModalAction = function() { // Definieer de handler binnen window scope voor correcte verwijdering
            if (typeof window.currentModalActionCallback === 'function') {
                window.currentModalActionCallback();
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
    console.log("[VerlofroosterModalLogic] Sluiten modal...");
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
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
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
                <input type="text" id="ModalUrenTotaal" name="UrenTotaal" 
                       class="form-input mt-1 w-full bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
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
function initializeCompensatieUrenFormulierLogica(geselecteerdeDatum, medewerkerGegevens) {
    // Initialiseert de logica specifiek voor het compensatie-uren formulier.
    console.log("[VerlofroosterModalLogic] Initialiseren compensatie-uren formulier logica. Geselecteerde datum:", geselecteerdeDatum, "Medewerker:", medewerkerGegevens);

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

    // Check of we in bewerkingsmodus zijn
    const editMode = window.checkAndApplyEditMode('compensatie');
    const isEdit = editMode.bewerkingsmodus;
    const bewerkItem = editMode.bewerkItem;

    // Vult gebruikersinformatie in
    if (medewerkerDisplayInput && medewerkerIdInput && titleInput && aanvraagTijdstipInput && window.huidigeGebruiker) {
        medewerkerDisplayInput.value = window.huidigeGebruiker.Title || window.huidigeGebruiker.normalizedUsername || "Onbekend";
        medewerkerIdInput.value = window.huidigeGebruiker.normalizedUsername || "";
        
        const vandaag = new Date();
        const datumStringVoorTitel = vandaag.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        titleInput.value = `Compensatie ${medewerkerDisplayInput.value} - ${datumStringVoorTitel}`;
        aanvraagTijdstipInput.value = vandaag.toISOString();
    } else {
        console.warn("[VerlofroosterModalLogic] Kon gebruikersinfo velden of huidigeGebruiker niet vinden voor compensatieformulier.");
    }

    // Als we in bewerkingsmodus zijn, vul het formulier met bestaande data
    if (isEdit && bewerkItem) {
        window.vulFormulierMetBestaandeData('compensatie-form', {
            ModalMedewerkerDisplay: bewerkItem.Medewerker,
            ModalStartCompensatieDatum: bewerkItem.StartCompensatieUren,
            ModalStartCompensatieTijd: bewerkItem.StartCompensatieUren,
            ModalEindeCompensatieDatum: bewerkItem.EindeCompensatieUren,
            ModalEindeCompensatieTijd: bewerkItem.EindeCompensatieUren,
            ModalOmschrijving: bewerkItem.Omschrijving
        });
    } else {
        // Stelt standaard datum en tijd in voor nieuwe aanvraag
        setDefaultDateTimesCompensatie();
    }

    // Stelt standaard datum en tijd in
    function setDefaultDateTimesCompensatie() {
        const nu = geselecteerdeDatum instanceof Date && !isNaN(geselecteerdeDatum) ? new Date(geselecteerdeDatum) : new Date();
        const vandaagISO = nu.toISOString().split('T')[0];
        // const nuTijd = nu.toTimeString().slice(0,5); // HH:mm // Niet meer gebruikt, vaste default

        if (startCompensatieDatumInput) startCompensatieDatumInput.value = vandaagISO;
        if (startCompensatieTijdInput) startCompensatieTijdInput.value = "09:00"; // Standaard starttijd

        if (eindeCompensatieDatumInput) eindeCompensatieDatumInput.value = vandaagISO;
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
    }

    // Check of we in bewerkingsmodus zijn
    const editMode = window.checkAndApplyEditMode('compensatie');
    const isEdit = editMode.bewerkingsmodus;
    const itemId = isEdit ? editMode.bewerkItem.ID : null;

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
    toonModalNotificatie(isEdit ? 'Bezig met opslaan van wijzigingen...' : 'Bezig met indienen van uw compensatie...', 'info', false);

    // Haalt de waarden uit de verborgen velden die al gevuld zijn bij initialisatie
    const titleValue = document.getElementById('Title').value;
    const medewerkerDisplayValue = document.getElementById('ModalMedewerkerDisplay').value;
    const medewerkerIdValue = document.getElementById('MedewerkerID').value;
    const aanvraagTijdstipValue = document.getElementById('AanvraagTijdstip').value;
    const statusValue = document.getElementById('Status').value;

    // Haalt waarden op van de zichtbare input velden
    const startCompensatieDatumValue = document.getElementById('ModalStartCompensatieDatum').value;
    const startCompensatieTijdValue = document.getElementById('ModalStartCompensatieTijd').value;
    const eindeCompensatieDatumValue = document.getElementById('ModalEindeCompensatieDatum').value;
    const eindeCompensatieTijdValue = document.getElementById('ModalEindeCompensatieTijd').value;
    const urenTotaalValue = document.getElementById('ModalUrenTotaal').value;
    const omschrijvingValue = document.getElementById('ModalOmschrijving').value;
    
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

    try {
        if (isEdit && itemId) {
            // Update bestaand item
            if (typeof window.updateSPListItem !== 'function') {
                throw new Error("Functie updateSPListItem is niet beschikbaar. Controleer of machtigingen.js correct geladen is.");
            }
            await window.updateSPListItem('CompensatieUren', itemId, formDataPayload);
            console.log("[VerlofroosterModalLogic] Compensatie succesvol bijgewerkt in SharePoint.");
            toonModalNotificatie('Compensatie-uren succesvol bijgewerkt!', 'success');
        } else {
            // Maak nieuw item
            if (typeof window.createSPListItem !== 'function') {
                throw new Error("Functie createSPListItem is niet beschikbaar. Controleer of machtigingen.js correct geladen is.");
            }
            await window.createSPListItem('CompensatieUren', formDataPayload);
            console.log("[VerlofroosterModalLogic] Compensatie succesvol opgeslagen in SharePoint.");
            toonModalNotificatie('Compensatie-uren succesvol ingediend!', 'success');
        }

        form.reset(); // Reset het formulier binnen de modal
        initializeCompensatieUrenFormulierLogica(new Date(), { Username: medewerkerIdValue, Title: medewerkerDisplayValue }); // Herinitialiseer met standaardwaarden

        // Sluit de modal na succes
        setTimeout(() => {
            closeModal();
            // Optioneel: ververs de hoofd rooster data
            if (typeof window.Laadinitiele === 'function') {
                window.Laadinitiele(false); // false om niet opnieuw modal data te forceren
            }
        }, 2000); // Geef gebruiker tijd om succesmelding te lezen

        return true;

    } catch (error) {
        console.error('[VerlofroosterModalLogic] Fout bij indienen compensatie:', error);
        toonModalNotificatie(`Fout bij ${isEdit ? 'bijwerken' : 'indienen'}: ${error.message}. Probeer het opnieuw.`, 'error', false);
        return false;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = isEdit ? 'Wijzigingen Opslaan' : 'Dien Compensatie In';
    }
}


/**
 * Opent een modal voor het registreren van compensatie-uren.
 * @param {Object} medewerkerGegevens - Informatie over de medewerker die compensatie-uren registreert.
 * @param {Date} geselecteerdeDatum - De datum waarvoor compensatie-uren worden geregistreerd.
 */
function openCompensatieUrenModal(medewerkerGegevens, geselecteerdeDatum) {
    // Opent de modal voor het registreren van compensatie-uren.
    console.log("[VerlofroosterModalLogic] Openen compensatie-uren modal voor:", medewerkerGegevens, "datum:", geselecteerdeDatum);
      
    // Gebruikt huidige gebruiker als medewerkerGegevens niet is opgegeven
    let contextMedewerker = medewerkerGegevens;
    if (!contextMedewerker && window.huidigeGebruiker) {
        console.log("[VerlofroosterModalLogic] Gebruik huidige gebruiker voor compensatie-uren.");
        contextMedewerker = { // Maak een nieuw object om window.huidigeGebruiker niet te wijzigen
            Id: window.huidigeGebruiker.medewerkerData ? window.huidigeGebruiker.medewerkerData.ID : (window.huidigeGebruiker.Id || null) , // Probeer ID uit medewerkerData, anders SP User ID
            Naam: window.huidigeGebruiker.Title || window.huidigeGebruiker.normalizedUsername,
            Username: window.huidigeGebruiker.normalizedUsername // Gebruik de genormaliseerde username
        };
    }
    
    // Gebruikt huidige datum als geselecteerdeDatum niet is opgegeven
    const datumVoorFormulier = geselecteerdeDatum || new Date();
    
    // Als er nog steeds geen medewerkergegevens zijn, toon een foutmelding
    if (!contextMedewerker || !contextMedewerker.Username) {
        console.error("[VerlofroosterModalLogic] Geen medewerkergegevens beschikbaar voor compensatie-uren modal!");
        toonModalNotificatie("Fout: Geen medewerkergegevens beschikbaar voor compensatie-uren.", "error", false);
        return;
    }
    
    const modalContentHtml = getCompensatieUrenFormulierHtml();
    
    // Opent de modal
    openModal(
        'Compensatie-uren Registreren',
        modalContentHtml,
        'Registreren', // Tekst voor de actieknop
        handleCompensatieFormulierVerzenden, // Callback voor de actieknop
        true, // Toon annuleerknop
        false, // Geen 'Vorige' knop nodig
        null,
        'max-w-lg' // Grootte van de modal
    );
    
    // Initialiseert de formulier logica nadat de HTML in de DOM is
    // Gebruik een kleine timeout om zeker te zijn dat de DOM update voltooid is.
    setTimeout(() => {
        initializeCompensatieUrenFormulierLogica(datumVoorFormulier, contextMedewerker);
        if (window.domRefsLogic && window.domRefsLogic.modalContent) {
            window.domRefsLogic.modalContent.classList.add('compensatie-modal-body'); // Voeg specifieke class toe
        }
    }, 50); // 50ms zou voldoende moeten zijn
}


// /k.zip/js/verlofroosterModal_logic.js (VERVANG deze functie)

/**
 * Opent een modal voor het aanvragen of bewerken van verlof.
 * @param {object} [itemData=null] - Optioneel. De data van een bestaand item om te bewerken.
 * @param {Date} [geselecteerdeDatum=new Date()] - De datum waarvoor verlof wordt aangevraagd (alleen voor nieuwe items).
 * @param {object} [medewerkerGegevens=null] - Medewerker context (alleen voor nieuwe items van huidige gebruiker).
 */
async function openVerlofAanvraagModal(itemData = null, geselecteerdeDatum = new Date(), medewerkerGegevens = null) {
    console.log("[VerlofroosterModalLogic] Opening verlof aanvraag modal");
    
    try {
        // Zorg ervoor dat de CSS eerst wordt geladen
        await ensureVerlofModalCSS();
        
        const modalTitle = "Verlof Aanvragen";
        
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
                    <h2 class="form-title">Verlofaanvraag Indienen</h2>
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
                    <textarea id="ModalOmschrijving" name="Omschrijving" class="form-textarea" placeholder="Eventuele toelichting bij je verlofaanvraag." title="Geef hier eventueel een extra toelichting op je verlofaanvraag."></textarea>
                </div>
            </form>
        `;
        
        window.openModal(
            modalTitle,
            formContainer.innerHTML,
            "Verlofaanvraag Opslaan",
            async () => {
                if (typeof window.submitVerlofAanvraag === 'function') {
                    await window.submitVerlofAanvraag();
                }
                return true;
            },
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
    const cssPath = 'pages/css/meldingZiekte_styles.css'; // Relative to the /cpw/k/ structure
    const cssId = 'ziekte-modal-styles';

    if (document.getElementById(cssId)) {
        // console.log('[VerlofroosterModalLogic] meldingZiekte_styles.css already loaded.');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        
        let fullCssPath = cssPath;
        if (window.spWebAbsoluteUrl) {
            const baseUrl = window.spWebAbsoluteUrl.replace(/\/$/, ''); // Remove trailing slash
            // Corrected path to include /cpw/k/
            const basePathSegment = '/cpw/k/'; 
            fullCssPath = `${baseUrl}${basePathSegment}${cssPath}`;
        } else {
            // Fallback if spWebAbsoluteUrl is not defined. 
            // This assumes the application is served from a path where '/cpw/k/' is appropriate.
            // Or, if running locally, ensure 'pages/css/meldingZiekte_styles.css' is relative to 'k' directory.
            // For development, if verlofRooster.aspx is in 'k', this might become '/k/pages/css/...'
            // However, the error indicates a server context, so spWebAbsoluteUrl should ideally be present.
            // If directly in 'k', then 'pages/css/...' might be intended.
            // A more robust solution might involve a global configuration for base paths.
            console.warn('[VerlofroosterModalLogic] spWebAbsoluteUrl not found, attempting relative path construction for CSS. This might not work in all deployment scenarios.');
            // Attempting a path relative to where verlofRooster.aspx (in 'k') would expect 'pages'
            // This part is tricky without knowing the exact local vs. server setup differences.
            // The user's error points to a server path, so the spWebAbsoluteUrl case is primary.
            // If spWebAbsoluteUrl is missing, it's hard to guess the correct base.
            // Let's assume for now if spWebAbsoluteUrl is missing, it's a local scenario where 'pages/...' from 'k/' is fine.
            // However, the user explicitly mentioned /cpw/k/, so we should try to respect that.
            const currentPath = window.location.pathname;
            if (currentPath.includes('/k/')) {
                 // If current page is in /k/, then 'pages/css/...' should be relative from there.
                 // This is simpler than trying to guess /cpw/
            } else {
                // If not in /k/, it's harder to guess. Defaulting to the simple cssPath.
            }
        }
        
        link.href = fullCssPath; 
        console.log(`[VerlofroosterModalLogic] Attempting to load CSS from: ${fullCssPath}`);

        link.onload = () => {
            console.log(`[VerlofroosterModalLogic] ${cssPath} loaded successfully.`);
            resolve();
        };
        link.onerror = () => {
            console.error(`[VerlofroosterModalLogic] Error loading ${fullCssPath}. Check path and server response.`);
            // Resolve to allow modal to open, albeit potentially unstyled.
            resolve(); 
        };
        document.head.appendChild(link);
    });
}

// --- HTML voor Ziek/Beter Melden Formulier ---
/**
 * Genereert de HTML voor het ziek/beter melden formulier.
 * @param {string} typeMelding - Het type melding ('ziek' of 'beter').
 * @returns {string} De HTML string voor het formulier.
 */
function getMeldingMakenFormulierHtml(typeMelding = 'ziek') {
    // Retourneert de HTML-structuur voor het ziek/beter melden formulier.
    // Deze HTML is gebaseerd op de `Pages/meldingZiekte.aspx` structuur.
    const titelFormulier = typeMelding === 'beter' ? 'Beter Melden' : 'Ziek Melden';
    const startDatumLabel = typeMelding === 'beter' ? 'Datum Beter Gemeld <span class="text-red-500">*</span>' : 'Startdatum Ziekmelding <span class="text-red-500">*</span>';
    const eindDatumLabel = typeMelding === 'beter' ? 'Laatste Dag Ziek (indien van toepassing)' : 'Verwachte Einddatum Ziekmelding <span class="text-red-500">*</span>';

    return `
        <form id="ziekmelding-form" class="ziekmelding-form space-y-6 p-1">
            <input type="hidden" id="Title" name="Title">
            <input type="hidden" id="MedewerkerID" name="MedewerkerID">
            <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip">
            <input type="hidden" id="StartDatum" name="StartDatum">
            <input type="hidden" id="EindDatum" name="EindDatum">
            <input type="hidden" id="Status" name="Status" value="Nieuw">
            <input type="hidden" id="RedenId" name="RedenId">
            <input type="hidden" id="Reden" name="Reden" value="Ziekte">

            <div id="modal-notification-area" class="notification-area hidden rounded-md" role="alert"></div>
            
            <div class="intro-banner-modal bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-100">
                    ${typeMelding === 'beter' ? 'Geef hier aan per wanneer u weer beter bent.' : 'Meld u hier ziek. Vergeet niet uw leidinggevende op de hoogte te stellen.'}
                </p>
            </div>

            <div>
                <label for="MedewerkerDisplay" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medewerker</label>
                <input type="text" id="MedewerkerDisplay" name="MedewerkerDisplay" 
                       class="form-input mt-1 w-full bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                       readonly title="Uw naam zoals bekend in het systeem.">
            </div>

            <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg space-y-4">
                <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">${typeMelding === 'beter' ? 'Datum Beter Melding' : 'Start Ziekmelding'}</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="StartDatePicker" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${startDatumLabel}</label>
                        <input type="date" id="StartDatePicker" name="StartDatePicker" class="form-input mt-1 w-full" required title="Selecteer de startdatum.">
                    </div>
                    <div>
                        <label for="StartTimePicker" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starttijd <span class="text-red-500">*</span></label>
                        <input type="time" id="StartTimePicker" name="StartTimePicker" class="form-input mt-1 w-full" value="09:00" required title="Selecteer de starttijd.">
                    </div>
                </div>
            </fieldset>

            <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg space-y-4">
                <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">${typeMelding === 'beter' ? 'Laatste Dag Ziek (indien van toepassing)' : 'Einde Ziekmelding (verwacht)'}</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="EndDatePicker" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${eindDatumLabel}</label>
                        <input type="date" id="EndDatePicker" name="EndDatePicker" class="form-input mt-1 w-full" ${typeMelding === 'ziek' ? 'required' : ''} title="Selecteer de einddatum.">
                    </div>
                    <div>
                        <label for="EndTimePicker" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eindtijd <span class="text-red-500">*</span></label>
                        <input type="time" id="EndTimePicker" name="EndTimePicker" class="form-input mt-1 w-full" value="17:00" required title="Selecteer de eindtijd.">
                    </div>
                </div>
            </fieldset>
            
            <div>
                <label for="Omschrijving" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Toelichting (optioneel)</label>
                <textarea id="Omschrijving" name="Omschrijving" rows="3" class="form-textarea mt-1 w-full" placeholder="Eventuele aanvullende informatie..." title="Geef hier eventueel een extra toelichting."></textarea>
            </div>
        </form>
    `;
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
                    const fakeEvent = { preventDefault: () => {} };
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
    const cssPath = 'pages/css/meldingVerlof_styles.css';
    
    // Check if CSS is already loaded
    if (document.querySelector(`link[href*="${cssPath}"]`)) {
        console.log(`[VerlofroosterModalLogic] ${cssPath} already loaded.`);
        return;
    }

    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        
        let fullCssPath = cssPath;
        if (window.spWebAbsoluteUrl) {
            const baseUrl = window.spWebAbsoluteUrl.replace(/\/$/, '');
            const basePathSegment = '/cpw/k/'; 
            fullCssPath = `${baseUrl}${basePathSegment}${cssPath}`;
        }
        
        link.href = fullCssPath;
        
        link.onload = () => {
            console.log(`[VerlofroosterModalLogic] ${cssPath} loaded successfully.`);
            resolve();
        };
        
        link.onerror = () => {
            console.error(`[VerlofroosterModalLogic] Failed to load ${cssPath}`);
            resolve(); // Still resolve to not block execution
        };
        
        document.head.appendChild(link);
    });
}

/* Add this to verlofroosterModal_logic.js for debugging */
window.debugVerlofModalFlow = function() {
    console.log('=== VERLOF MODAL FLOW DEBUG ===');
    
    // Check if modal exists
    const modal = document.querySelector('.modal-content') || document.querySelector('#modal-container');
    console.log('Modal container found:', !!modal);
    
    // Check form
    const form = document.getElementById('verlof-form');
    console.log('Verlof form found:', !!form);
    
    if (form) {
        console.log('Form HTML source length:', form.innerHTML.length);
        console.log('Form fields found:');
        
        const expectedFields = [
            'ModalMedewerkerDisplay',
            'ModalMedewerkerIDDisplay', 
            'ModalMedewerkerSelect',
            'ModalStartDatePicker',
            'ModalEndDatePicker',
            'ModalStartTimePicker',
            'ModalEndTimePicker',
            'ModalOmschrijving'
        ];
        
        expectedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            console.log(`  ${fieldId}: ${field ? '✅ Found' : '❌ Missing'}`);
            if (field) {
                console.log(`    Value: "${field.value}", Visible: ${!field.classList.contains('hidden')}`);
            }
        });
    }
    
    // Check initialization
    console.log('Global functions available:');
    console.log('  window.initializeVerlofModalForm:', typeof window.initializeVerlofModalForm);
    console.log('  window.submitVerlofAanvraag:', typeof window.submitVerlofAanvraag);
    
    console.log('=== END DEBUG ===');
};