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
    if (window.domRefsLogic.modalPlaceholder && window.domRefsLogic.modalPlaceholder.style) window.domRefsLogic.modalPlaceholder.style.pointerEvents = 'none';
    
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
            if (typeof window.laadInitiëleData === 'function') {
                window.laadInitiëleData(false); // false om niet opnieuw modal data te forceren
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
    const functieNaam = "openVerlofAanvraagModal";
    const isEditMode = itemData !== null;
    console.log(`[${functieNaam}] Start. Modus: ${isEditMode ? 'Bewerken' : 'Nieuw'}. ItemData:`, itemData);    let contextMedewerker;
    if (isEditMode) {
        const medewerkerInfo = alleMedewerkers.find(m => m.Username === itemData.MedewerkerID);
        contextMedewerker = {
            loginNaam: medewerkerInfo ? medewerkerInfo.Username : itemData.MedewerkerID,
            displayName: itemData.Medewerker,
            normalizedUsername: itemData.MedewerkerID,
            medewerkerNaamVolledig: itemData.Medewerker,
            Username: itemData.MedewerkerID,
            Title: itemData.Medewerker,
            Naam: itemData.Medewerker
        };
    } else {
        // Voor nieuwe aanvragen, gebruik de doorgegeven medewerkergegevens of huidige gebruiker
        if (medewerkerGegevens) {
            contextMedewerker = {
                loginNaam: medewerkerGegevens.loginNaam || medewerkerGegevens.Username || medewerkerGegevens.normalizedUsername,
                normalizedUsername: medewerkerGegevens.normalizedUsername || medewerkerGegevens.Username,
                Username: medewerkerGegevens.Username || medewerkerGegevens.normalizedUsername,
                displayName: medewerkerGegevens.displayName || medewerkerGegevens.Title || medewerkerGegevens.Naam,
                Title: medewerkerGegevens.Title || medewerkerGegevens.Naam,
                Naam: medewerkerGegevens.Naam || medewerkerGegevens.Title,
                Email: medewerkerGegevens.Email,
                Id: medewerkerGegevens.Id
            };
        } else {
            contextMedewerker = window.huidigeGebruiker;
        }
    }

    console.log(`[${functieNaam}] Using context medewerker:`, contextMedewerker);

    if (!contextMedewerker || !(contextMedewerker.normalizedUsername || contextMedewerker.loginNaam || contextMedewerker.Username)) {
        console.error(`[${functieNaam}] Ongeldige of incomplete medewerkergegevens.`, contextMedewerker);
        toonModalNotificatie('Fout: Medewerkerinformatie is onvolledig.', 'error', false);
        return;
    }
    window.verlofModalMedewerkerContext = contextMedewerker;

    // --- GECORRIGEERDE URL OPBOUW ---
    // Verwijder de oude, problematische manier en bouw het pad direct en correct op.
    const basisUrl = (window.spWebAbsoluteUrl || "").replace(/\/$/, ""); // Zorgt voor een basis-URL zonder slash op het eind
    const modalFormUrl = `${basisUrl}/CPW/Rooster/pages/meldingVerlof.aspx`; // Bouw het pad direct op

    try {
        console.log(`[${functieNaam}] Ophalen modal content van: ${modalFormUrl}`);
        const response = await fetch(modalFormUrl);
        if (!response.ok) {
            throw new Error(`Fout bij ophalen van ${modalFormUrl}: ${response.status} ${response.statusText}`);
        }
        
        const rawHtml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');
        const formElement = doc.querySelector('form#verlof-form');

        if (!formElement) throw new Error(`<form id="verlof-form"> niet gevonden in de geladen HTML.`);

        formElement.querySelector('.form-header')?.remove();
        formElement.querySelector('.form-actions')?.remove();
        if (!formElement.querySelector('#modal-notification-area')) {
            const notificationDiv = document.createElement('div');
            notificationDiv.id = 'modal-notification-area';
            notificationDiv.className = 'notification-area hidden';
            formElement.insertBefore(notificationDiv, formElement.firstChild);
        }
        
        const modalTitle = isEditMode ? 'Verlofaanvraag Bewerken' : 'Verlof Aanvragen';
        const actionButtonText = isEditMode ? 'Wijzigingen Opslaan' : 'Aanvraag Indienen';

        openModal(
            modalTitle,
            formElement.outerHTML,
            actionButtonText,
            async () => {
                if (typeof window.handleVerlofModalFormSubmit === 'function') {
                    const success = await window.handleVerlofModalFormSubmit(document.getElementById('verlof-form'), window.verlofModalMedewerkerContext, geselecteerdeDatum, isEditMode ? itemData.ID : null);
                    if (success) {
                        closeModal();
                        if (typeof window.laadInitiëleData === 'function') window.laadInitiëleData(false);
                    }
                } else {
                    console.error(`[${functieNaam}] Functie handleVerlofModalFormSubmit niet gevonden.`);
                }
            },
            true, false, null, 'max-w-2xl'
        );

        if (window.domRefsLogic && window.domRefsLogic.modalContent) {
            window.domRefsLogic.modalContent.classList.add('verlof-modal-body');
        }        setTimeout(async () => {
            if (typeof window.initializeVerlofModalForm === 'function') {
                // Wacht tot alleMedewerkers beschikbaar is
                let attempts = 0;
                const maxAttempts = 20; // 2 seconden max wachten
                
                while ((!window.alleMedewerkers || window.alleMedewerkers.length === 0) && attempts < maxAttempts) {
                    console.log(`[${functieNaam}] Waiting for alleMedewerkers to load... (attempt ${attempts + 1})`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (window.alleMedewerkers && window.alleMedewerkers.length > 0) {
                    console.log(`[${functieNaam}] alleMedewerkers loaded with ${window.alleMedewerkers.length} employees`);
                } else {
                    console.warn(`[${functieNaam}] alleMedewerkers still not available after waiting`);
                }
                
                window.initializeVerlofModalForm(geselecteerdeDatum, contextMedewerker, itemData);
            }
        }, 50);

    } catch (error) {
        console.error(`[${functieNaam}] Algemene fout:`, error);
        toonModalNotificatie('Er is een fout opgetreden bij het laden van het verlofaanvraagformulier.', 'error', false);
    }
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
/**
 * Opent een modal voor het melden van ziekte of beterschap.
 * @param {Object} medewerkerGegevens - Informatie over de medewerker.
 * @param {Date} geselecteerdeDatum - De datum waarop de melding betrekking heeft.
 * @param {string} [typeMelding='ziek'] - Het type melding: 'ziek' of 'beter'.
 */
async function openZiekBeterMeldenModal(medewerkerGegevens, geselecteerdeDatum, typeMelding = 'ziek') {
    const functieNaam = "openZiekBeterMeldenModal";
    console.log(`[${functieNaam}] Start. Type: ${typeMelding}, Medewerker:`, medewerkerGegevens, "Datum:", geselecteerdeDatum);

    // Zorg ervoor dat de benodigde CSS geladen is
    ensureZiekteModalCSS();

    // Bepaal contextMedewerker
    let contextMedewerker;
    if (medewerkerGegevens) {
        contextMedewerker = {
            loginNaam: medewerkerGegevens.loginNaam || medewerkerGegevens.Username || medewerkerGegevens.normalizedUsername,
            normalizedUsername: medewerkerGegevens.normalizedUsername || medewerkerGegevens.Username,
            Username: medewerkerGegevens.Username || medewerkerGegevens.normalizedUsername,
            displayName: medewerkerGegevens.displayName || medewerkerGegevens.Title || medewerkerGegevens.Naam,
            Title: medewerkerGegevens.Title || medewerkerGegevens.Naam,
            Naam: medewerkerGegevens.Naam || medewerkerGegevens.Title,
            Email: medewerkerGegevens.Email,
            Id: medewerkerGegevens.Id
        };
    } else {
        contextMedewerker = window.huidigeGebruiker;
    }

    console.log(`[${functieNaam}] Using context medewerker:`, contextMedewerker);

    if (!contextMedewerker || !(contextMedewerker.normalizedUsername || contextMedewerker.loginNaam || contextMedewerker.Username)) {
        console.error(`[${functieNaam}] Ongeldige of incomplete medewerkergegevens.`, contextMedewerker);
        toonModalNotificatie('Fout: Medewerkerinformatie is onvolledig.', 'error', false);
        return;
    }
    
    // Sla context op voor later gebruik
    window.ziekteModalMedewerkerContext = contextMedewerker;

    // Bouw de URL naar het .aspx bestand
    const basisUrl = (window.spWebAbsoluteUrl || "").replace(/\/$/, "");
    const modalFormUrl = `${basisUrl}/CPW/Rooster/pages/ziekteMelden.aspx`;

    try {
        console.log(`[${functieNaam}] Ophalen modal content van: ${modalFormUrl}`);
        const response = await fetch(modalFormUrl);
        if (!response.ok) {
            throw new Error(`Fout bij ophalen van ${modalFormUrl}: ${response.status} ${response.statusText}`);
        }
        
        const rawHtml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');
        const formElement = doc.querySelector('form#ziekmelding-form');

        if (!formElement) throw new Error(`<form id="ziekmelding-form"> niet gevonden in de geladen HTML.`);        // Verwijder elementen die niet in de modal horen
        formElement.querySelector('.form-header')?.remove();
        formElement.querySelector('.form-actions')?.remove();
        
        // Zorg ervoor dat er een notification area is
        if (!formElement.querySelector('#modal-notification-area')) {
            const notificationDiv = document.createElement('div');
            notificationDiv.id = 'modal-notification-area';
            notificationDiv.className = 'notification-area hidden';
            formElement.insertBefore(notificationDiv, formElement.firstChild);
        }        // Zorg ervoor dat alle CSS classes correct zijn toegepast voor modal gebruik
        formElement.classList.add('ziekmelding-form', 'space-y-6', 'p-1');
        
        // Kopieer alle style tags van de originele pagina naar de modal content
        const styleElements = doc.querySelectorAll('style');
        let combinedStyles = '';
        styleElements.forEach(style => {
            combinedStyles += style.textContent + '\n';
        });
        
        // Voeg de styles toe aan de modal content
        if (combinedStyles) {
            const styleTag = document.createElement('style');
            styleTag.textContent = combinedStyles;
            formElement.insertBefore(styleTag, formElement.firstChild);
        }
        
        // Wrap het formulier in een form-container div voor consistente styling
        const containerDiv = document.createElement('div');
        containerDiv.className = 'form-container';
        containerDiv.style.padding = '0'; // No padding in modal
        containerDiv.innerHTML = formElement.outerHTML;
          const modalTitle = typeMelding === 'beter' ? 'Beter Melden' : 'Ziek Melden';
        const actionButtonText = typeMelding === 'beter' ? 'Beter Melding Indienen' : 'Ziekmelding Indienen';

        openModal(
            modalTitle,
            containerDiv.outerHTML,
            actionButtonText,
            async () => {
                if (typeof window.handleZiekmeldingFormulierVerzenden === 'function') {
                    const success = await window.handleZiekmeldingFormulierVerzenden(document.getElementById('ziekmelding-form'), window.ziekteModalMedewerkerContext, geselecteerdeDatum);
                    if (success) {
                        closeModal();
                        if (typeof window.laadInitiëleData === 'function') window.laadInitiëleData(false);
                    }
                } else {
                    console.error(`[${functieNaam}] Functie handleZiekmeldingFormulierVerzenden niet gevonden.`);
                }
            },
            true, false, null, 'max-w-2xl'
        );        if (window.domRefsLogic && window.domRefsLogic.modalContent) {
            window.domRefsLogic.modalContent.classList.add('ziekte-modal-body', 'ziekmelding-modal-body');
            
            // Apply consistent theme to modal content
            applyThemeToModalContent(window.domRefsLogic.modalContent);
        }
        
        // Initialiseer het formulier na een korte vertraging
        setTimeout(async () => {
            if (typeof window.initializeZiekModalForm === 'function') {
                // Wacht tot alleMedewerkers beschikbaar is voor super-user functionaliteit
                let attempts = 0;
                const maxAttempts = 20; // 2 seconden max wachten
                
                while ((!window.alleMedewerkers || window.alleMedewerkers.length === 0) && attempts < maxAttempts) {
                    console.log(`[${functieNaam}] Waiting for alleMedewerkers to load... (attempt ${attempts + 1})`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.alleMedewerkers || window.alleMedewerkers.length === 0) {
                    console.warn(`[${functieNaam}] alleMedewerkers not loaded after ${maxAttempts} attempts, continuing anyway`);
                }
                
                await window.initializeZiekModalForm(typeMelding, window.ziekteModalMedewerkerContext, geselecteerdeDatum || new Date());
                
                // Re-apply theme after form initialization to ensure all elements are styled correctly
                if (window.domRefsLogic && window.domRefsLogic.modalContent) {
                    applyThemeToModalContent(window.domRefsLogic.modalContent);
                }
            } else {
                console.error(`[${functieNaam}] Functie initializeZiekModalForm niet gevonden.`);
            }
        }, 100);

    } catch (error) {
        console.error(`[${functieNaam}] Fout bij laden modal:`, error);
        toonModalNotificatie(`Kon modal niet laden: ${error.message}`, 'error', false);
    }
}


/**
 * Helper functie om ervoor te zorgen dat de benodigde CSS voor ziekte modals geladen is
 */
async function ensureZiekteModalCSS() {
    return new Promise((resolve) => {
        // Check if our custom CSS is already loaded
        if (document.getElementById('ziekte-modal-css')) {
            resolve();
            return;
        }

        // Create and inject custom CSS for modal
        const style = document.createElement('style');
        style.id = 'ziekte-modal-css';
        style.textContent = `
            .ziekte-modal-body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                background-color: #f9fafb;
                color: #1f2937;
                line-height: 1.6;
            }
            
            .ziekte-modal-body.dark-theme {
                background-color: #111827;
                color: #f3f4f6;
            }
            
            .ziekmelding-form {
                max-width: none !important;
                margin: 0 !important;
                padding: 1.5rem !important;
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }
            
            .ziekmelding-form .form-label {
                display: block;
                font-weight: 500;
                color: #374151;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                font-family: inherit;
            }
            
            .dark-theme .ziekmelding-form .form-label {
                color: #d1d5db;
            }
            
            .ziekmelding-form .form-input, 
            .ziekmelding-form .form-select, 
            .ziekmelding-form .form-textarea {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                background-color: #ffffff;
                color: #1f2937;
                transition: border-color 0.15s ease, box-shadow 0.15s ease;
                font-family: inherit;
                box-sizing: border-box;
            }
            
            .dark-theme .ziekmelding-form .form-input,
            .dark-theme .ziekmelding-form .form-select,
            .dark-theme .ziekmelding-form .form-textarea {
                background-color: #374151;
                border-color: #4b5563;
                color: #f3f4f6;
            }
            
            .ziekmelding-form .form-input:focus, 
            .ziekmelding-form .form-select:focus, 
            .ziekmelding-form .form-textarea:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .ziekmelding-form .form-input[readonly], 
            .ziekmelding-form .form-input[disabled],
            .ziekmelding-form .form-select[readonly], 
            .ziekmelding-form .form-select[disabled] {
                background-color: #f3f4f6 !important;
                color: #6b7280 !important;
                cursor: not-allowed;
                opacity: 0.7;
            }
            
            .dark-theme .ziekmelding-form .form-input[readonly], 
            .dark-theme .ziekmelding-form .form-input[disabled],
            .dark-theme .ziekmelding-form .form-select[readonly], 
            .dark-theme .ziekmelding-form .form-select[disabled] {
                background-color: #4b5563 !important;
                color: #9ca3af !important;
            }
            
            .ziekmelding-form .form-group {
                margin-bottom: 1.5rem;
            }
            
            .ziekmelding-form .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            
            @media (max-width: 640px) {
                .ziekmelding-form .form-row {
                    grid-template-columns: 1fr;
                }
            }
            
            .ziekmelding-form .hidden {
                display: none !important;
            }
            
            .ziekmelding-form .notification-area {
                margin-bottom: 1.5rem;
            }
            
            /* Modal specific overrides */
            .modal-content .ziekmelding-form {
                background: transparent;
                border: none;
                box-shadow: none;
            }
            
            .modal-content .form-container {
                background: transparent;
                border: none;
                box-shadow: none;
                margin: 0;
                padding: 0;
            }
            
            .modal-content .form-header {
                display: none; /* Hide header in modal */
            }
        `;
        
        document.head.appendChild(style);
        resolve();
    });
}

async function openZiekBeterMeldenModal(medewerkerContext = null) {
    console.log('[ZiekModal] Opening ziekte modal with context:', medewerkerContext);
    
    try {
        // Ensure CSS is loaded
        await ensureZiekteModalCSS();
        
        // Fetch HTML content
        const response = await fetch('/k/pages/ziekteMelden.aspx');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let htmlContent = await response.text();
        
        // Extract form content between form tags
        const formMatch = htmlContent.match(/<form[^>]*id="ziekmelding-form"[^>]*>([\s\S]*?)<\/form>/i);
        if (!formMatch) {
            throw new Error('Could not find ziekmelding form in HTML');
        }
        
        const formContent = formMatch[1];
        
        // Create modal content with proper styling classes
        const modalContent = `
            <div class="ziekte-modal-body ${document.body.classList.contains('dark-theme') ? 'dark-theme' : ''}">
                <div class="ziekmelding-form">
                    <div class="notification-area" id="notification-area"></div>
                    <form id="ziekmelding-form" class="space-y-6">
                        ${formContent}
                    </form>
                </div>
            </div>
        `;
        
        // Apply theme to modal content
        const applyThemeToZiekteModal = () => {
            const modalBody = document.querySelector('.ziekte-modal-body');
            if (modalBody) {
                const isDark = document.body.classList.contains('dark-theme');
                modalBody.classList.toggle('dark-theme', isDark);
                
                // Force styling of all form elements
                const formElements = modalBody.querySelectorAll('.form-input, .form-select, .form-textarea, .form-label');
                formElements.forEach(element => {
                    element.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                });
            }
        };
        
        // Open the modal
        openModal('Ziek/Beter Melden', modalContent, () => {
            // Initialize form after modal opens
            setTimeout(() => {
                applyThemeToZiekteModal();
                initializeZiekModalForm(medewerkerContext);
            }, 100);
        });
        
    } catch (error) {
        console.error('[ZiekModal] Error loading ziekte modal:', error);
        
        // Fallback with simple form
        const fallbackContent = `
            <div class="ziekte-modal-body">
                <div class="ziekmelding-form">
                    <p class="text-red-600 mb-4">Er is een probleem opgetreden bij het laden van het formulier.</p>
                    <p class="text-gray-600">Probeer de pagina te vernieuwen of ga naar de standalone pagina:</p>
                    <a href="/k/pages/ziekteMelden.aspx" class="text-blue-600 hover:text-blue-800 underline">
                        Direct naar ziekmelding pagina
                    </a>
                </div>
            </div>
        `;
        
        openModal('Ziek/Beter Melden', fallbackContent);
    }
}

// --- Registratie Modal Functies (Placeholder, nog te implementeren) ---
function openRegistratieModal() {
    // Opent de modal voor gebruikersregistratie.
    // Toont een placeholder bericht, daadwerkelijke implementatie volgt.
    console.log("[VerlofroosterModalLogic] openRegistratieModal aangeroepen (placeholder).");
    openModal(
        'Gebruikersregistratie',
        '<p class="text-center py-4">Registratieformulier wordt hier geladen...</p>',
        'Registreren',
        () => {
            console.log("Placeholder registratie actie.");
            toonModalNotificatie("Registratie functionaliteit nog niet geïmplementeerd.", "info");
        },
        true, false, null, 'max-w-xl'
    );
}

/**
 * Vult een formulier met bestaande data voor bewerken
 */
window.vulFormulierMetBestaandeData = function(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"], #${key}`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[key];
            } else if (input.type === 'date' && data[key]) {
                // Converteer datum naar YYYY-MM-DD format
                const date = new Date(data[key]);
                input.value = date.toISOString().split('T')[0];
            } else if (input.type === 'time' && data[key]) {
                // Extract tijd uit datetime
                const date = new Date(data[key]);
                input.value = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            } else {
                input.value = data[key] || '';
            }
        }
    });
};

/**
 * Controleert en past bewerkingsmodus toe
 */
window.checkAndApplyEditMode = function(modalType) {
    let bewerkItem = null;
    let bewerkingsmodus = false;
    
    switch(modalType) {
        case 'verlof':
            bewerkingsmodus = window.verlofModalBewerkingsmodus || false;
            bewerkItem = window.verlofModalBewerkItem || null;
            break;
        case 'compensatie':
            bewerkingsmodus = window.compensatieModalBewerkingsmodus || false;
            bewerkItem = window.compensatieModalBewerkItem || null;
            break;
        case 'ziekte':
            bewerkingsmodus = window.ziekteModalBewerkingsmodus || false;
            bewerkItem = window.ziekteModalBewerkItem || null;
            break;
        case 'zittingvrij':
            bewerkingsmodus = window.zittingvrijModalBewerkingsmodus || false;
            bewerkItem = window.zittingvrijModalBewerkItem || null;
            break;
    }
    
    if (bewerkingsmodus && bewerkItem) {
        // Pas modal titel aan
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = modalTitle.textContent.replace('Aanvragen', 'Bewerken').replace('Registreren', 'Bewerken').replace('Melden', 'Bewerken');
        }
        
        // Pas actieknop aan
        const actionButton = document.getElementById('modal-action-button');
        if (actionButton) {
            actionButton.textContent = 'Wijzigingen Opslaan';
        }
        
        // Voeg hidden field toe voor ID
        const form = document.querySelector('form');
        if (form && !form.querySelector('input[name="ItemID"]')) {
            const idField = document.createElement('input');
            idField.type = 'hidden';
            idField.name = 'ItemID';
            idField.value = bewerkItem.ID || '';
            form.appendChild(idField);
        }
        
        return { bewerkingsmodus, bewerkItem };
    }
    
    return { bewerkingsmodus: false, bewerkItem: null };
};

// Exporteert de belangrijkste functies voor globaal gebruik
window.openModal = openModal;
window.closeModal = closeModal;
window.initializeVerlofroosterModals = initializeVerlofroosterModals;
window.openRegistratieModal = openRegistratieModal;
window.openVerlofAanvraagModal = openVerlofAanvraagModal;
window.openCompensatieUrenModal = openCompensatieUrenModal;
window.openAdminZittingVrijModal = openAdminZittingVrijModal; 
window.openZiekBeterMeldenModal = openZiekBeterMeldenModal; // Nieuwe functie toegevoegd
window.toonModalNotificatie = toonModalNotificatie; // Maakt de notificatiefunctie globaal beschikbaar

// Logt dat het script volledig is geladen
console.log("[VerlofroosterModalLogic] Alle modale functies zijn succesvol geregistreerd in het globale bereik.");

// --- Helper functie om theme consistent toe te passen op modal content
function applyThemeToModalContent(modalContentElement) {
    if (!modalContentElement) return;
    
    const isDarkTheme = document.body.classList.contains('dark-theme');
    console.log(`[VerlofroosterModalLogic] Applying theme to modal content. Dark theme: ${isDarkTheme}`);
    
    // Apply theme class to modal content
    if (isDarkTheme) {
        modalContentElement.classList.add('dark-theme');
    } else {
        modalContentElement.classList.remove('dark-theme');
    }
    
    // Force update all form elements within the modal
    const formElements = modalContentElement.querySelectorAll('input, select, textarea, label, fieldset, legend');
    formElements.forEach(element => {
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
            if (element.hasAttribute('readonly') || element.hasAttribute('disabled')) {
                // Readonly/disabled styling
                element.style.backgroundColor = isDarkTheme ? '#4b5563' : '#f3f4f6';
                element.style.color = isDarkTheme ? '#9ca3af' : '#6b7280';
                element.style.borderColor = isDarkTheme ? '#6b7280' : '#d1d5db';
                element.style.cursor = 'not-allowed';
            } else {
                // Regular input styling
                element.style.backgroundColor = isDarkTheme ? '#374151' : '#ffffff';
                element.style.color = isDarkTheme ? '#f3f4f6' : '#000000';
                element.style.borderColor = isDarkTheme ? '#4b5563' : '#d1d5db';
            }
        } else if (element.tagName === 'LABEL') {
            element.style.color = isDarkTheme ? '#d1d5db' : '#374151';
        } else if (element.tagName === 'FIELDSET') {
            element.style.borderColor = isDarkTheme ? '#4b5563' : '#d1d5db';
        } else if (element.tagName === 'LEGEND') {
            element.style.color = isDarkTheme ? '#d1d5db' : '#374151';
        }
    });
    
    // Update notification area if present
    const notificationArea = modalContentElement.querySelector('#modal-notification-area');
    if (notificationArea) {
        // This will be handled by the toonModalNotificatie function when needed
        console.log('[VerlofroosterModalLogic] Notification area found, theme will be applied when notifications are shown');
    }
}