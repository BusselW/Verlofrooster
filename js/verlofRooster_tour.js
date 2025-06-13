// Interactive tour logic for Verlofrooster
// console.log('verlofRooster_tour.js loaded'); // Keep this at the top if you want to see it first

// Global tour state
let currentTourStepIndex = 0;
let tourSteps = [];
const TOUR_POPUP_ID = 'interactive-tour-popup';
const TOUR_OVERLAY_ID = 'interactive-tour-overlay';

function initializeTourSteps() {
    tourSteps = [
        {
            element: '#app-container',
            title: 'Verlofrooster',
            content: 'Welkom bij het Teamverlofrooster! In deze applicatie kun je je verlof en compensatie-uren doorgeven aan je teamleider/senior.',
            position: 'bottom'
        },
        {
            element: '#app-title',
            title: 'Verlofrooster',
            content: 'Let op: deze applicatie vervangt het doorgeven van je verlof/compensatie-uren via P-Direkt niet.',
            position: 'bottom'
        },
        {
            element: '#current-month-year',
            title: 'Periode Navigatie',
            content: 'Dit toont de huidige maand en jaar. Gebruik de pijlknoppen ernaast om naar de vorige of volgende periode te gaan. Met "Vandaag" spring je direct terug naar de huidige datum.',
            position: 'bottom'
        },
        {
            element: '.view-toggle-group',
            title: 'Weergave Opties',
            content: 'Schakel hier tussen de week- en maandweergave van het rooster.',
            position: 'bottom'
        },
        {
            element: '#team-filter-select',
            title: 'Filteren op team',
            content: 'Filter het rooster om alleen medewerkers van een specifiek team te tonen.',
            position: 'bottom'
        },
        {
            element: '#rooster-search-input',
            title: 'Medewerker zoeken',
            content: 'Typ hier de naam van een medewerker om deze snel in het rooster te vinden.',
            position: 'bottom'
        },
        {
            element: '#legenda-section',
            title: 'Legenda',
            content: 'De legenda legt de betekenis uit van de verschillende kleuren en markeringen die in het rooster worden gebruikt.',
            position: 'bottom'
        },
        {
            element: '#rooster-grid-container',
            title: 'Het Rooster',
            content: 'Dit is het hart van de applicatie: het verlofrooster. Hier zie je de medewerkers en hun geplande verlofdagen en andere afwezigheden.',
            position: 'top'
        },
        {
            element: '#rooster-grid-header .rooster-header-medewerker',
            title: 'Medewerkerskolom',
            content: 'In deze kolom staan de namen van de medewerkers. Je kunt op de sorteerknop klikken om de volgorde aan te passen.',
            position: 'right'
        },
        {
            element: '#fab-add-button',
            title: 'Snelle Acties',
            content: 'Gebruik deze knop voor snelle acties zoals het aanvragen van verlof, het doorgeven van compensatie-uren, of het maken van een ziekmelding.',
            position: 'left'
        },
        {
            element: '#rooster-dropdown-button',
            title: 'Gebruikersmenu',
            content: 'Klik hier voor toegang tot jouw persoonlijke gegevens, instellingen voor het rooster, en de optie om het thema te wisselen.',
            position: 'left'
        },
        {
            element: '#melding-button',
            title: 'Melding Maken',
            content: 'Heb je een fout gevonden of een suggestie ter verbetering? Gebruik deze knop om een melding te maken.',
            position: 'right'
        },
        {
            element: '#help-button',
            title: 'Hulp & Tour',
            content: 'Je bevindt je nu in de interactieve tour. Klik op "Stop Tour" om deze te beëindigen. Je kunt de tour altijd opnieuw starten via deze knop.',
            position: 'bottom'
        }
    ];
}

function createTourOverlay() {
    if (document.getElementById(TOUR_OVERLAY_ID)) return;
    const overlay = document.createElement('div');
    overlay.id = TOUR_OVERLAY_ID;
    overlay.className = 'tour-overlay';
    document.body.appendChild(overlay);
    document.body.classList.add('tour-active');
}

function removeTourOverlay() {
    const overlay = document.getElementById(TOUR_OVERLAY_ID);
    if (overlay) {
        overlay.remove();
    }
    document.body.classList.remove('tour-active');
}

function createTourPopup() {
    let popup = document.getElementById(TOUR_POPUP_ID);
    if (popup) {
        popup.style.display = 'block';
        return popup;
    }
    popup = document.createElement('div');
    popup.id = TOUR_POPUP_ID;
    popup.className = 'tour-popup';
    popup.innerHTML = `
        <h3 id="tour-popup-title" class="text-lg font-semibold mb-2"></h3>
        <p id="tour-popup-content" class="text-sm mb-3"></p>
        <div class="tour-popup-navigation flex justify-between items-center mt-4">
            <button id="tour-prev-button" class="tour-popup-button secondary py-2 px-3 rounded text-xs">Vorige</button>
            <span id="tour-step-indicator" class="text-xs text-gray-600"></span>
            <button id="tour-next-button" class="tour-popup-button py-2 px-3 rounded text-xs">Volgende</button>
        </div>
        <button id="tour-end-button" class="tour-popup-button secondary mt-3 w-full py-2 rounded text-xs">Stop Tour</button>
    `;
    document.body.appendChild(popup);

    document.getElementById('tour-prev-button').addEventListener('click', showPreviousTourStep);
    document.getElementById('tour-next-button').addEventListener('click', showNextTourStep);
    document.getElementById('tour-end-button').addEventListener('click', endInteractiveTour);
    return popup;
}

function highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add('tour-highlighted-element');
        const elementRect = element.getBoundingClientRect();
        if (elementRect.top < 0 || elementRect.bottom > window.innerHeight || elementRect.left < 0 || elementRect.right > window.innerWidth) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }
    return element;
}

function removeHighlight() {
    const highlighted = document.querySelector('.tour-highlighted-element');
    if (highlighted) {
        highlighted.classList.remove('tour-highlighted-element');
    }
}

function positionPopup(popup, targetElement, position = 'bottom') {
    if (!popup) return;
    if (!targetElement) {
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        return;
    }

    const rect = targetElement.getBoundingClientRect();
    requestAnimationFrame(() => {
        const popupRect = popup.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.transform = 'none';

        const offset = 15;
        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - popupRect.height - offset;
                left = rect.left + (rect.width / 2) - (popupRect.width / 2);
                break;
            case 'bottom':
                top = rect.bottom + offset;
                left = rect.left + (rect.width / 2) - (popupRect.width / 2);
                break;
            case 'left':
                left = rect.left - popupRect.width - offset;
                top = rect.top + (rect.height / 2) - (popupRect.height / 2);
                break;
            case 'right':
                left = rect.right + offset;
                top = rect.top + (rect.height / 2) - (popupRect.height / 2);
                break;
            default:
                top = rect.bottom + offset;
                left = rect.left + (rect.width / 2) - (popupRect.width / 2);
        }

        if (top < offset) top = offset;
        if (left < offset) left = offset;
        if (left + popupRect.width > window.innerWidth - offset) {
            left = window.innerWidth - popupRect.width - offset;
        }
        if (top + popupRect.height > window.innerHeight - offset) {
            top = window.innerHeight - popupRect.height - offset;
        }

        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    });
}

function showTourStep(index) {
    if (index < 0 || index >= tourSteps.length) {
        endInteractiveTour();
        return;
    }
    currentTourStepIndex = index;
    const step = tourSteps[index];

    removeHighlight();
    const targetElement = highlightElement(step.element);

    const popup = document.getElementById(TOUR_POPUP_ID) || createTourPopup();
    if (!popup) {
        console.error("Failed to create or find tour popup.");
        return;
    }
    popup.style.display = 'block';

    document.getElementById('tour-popup-title').textContent = step.title;
    document.getElementById('tour-popup-content').textContent = step.content;
    document.getElementById('tour-step-indicator').textContent = `Stap ${index + 1} van ${tourSteps.length}`;

    requestAnimationFrame(() => {
        positionPopup(popup, targetElement, step.position);
    });

    document.getElementById('tour-prev-button').disabled = index === 0;
    document.getElementById('tour-next-button').textContent = (index === tourSteps.length - 1) ? 'Voltooien' : 'Volgende';
    document.getElementById('tour-next-button').disabled = false;
}

function showNextTourStep() {
    if (currentTourStepIndex < tourSteps.length - 1) {
        showTourStep(currentTourStepIndex + 1);
    } else {
        document.getElementById('tour-next-button').disabled = true;
        endInteractiveTour();
    }
}

function showPreviousTourStep() {
    if (currentTourStepIndex > 0) {
        showTourStep(currentTourStepIndex - 1);
    }
}

function startInteractiveTour() {
    if (document.getElementById(TOUR_POPUP_ID) && document.getElementById(TOUR_POPUP_ID).style.display !== 'none') {
        // console.log("Tour is already active.");
        return;
    }
    // console.log('Attempting to start tour...');
    if (tourSteps.length === 0) {
        initializeTourSteps();
    }
    if (tourSteps.length === 0) {
        console.error("Tour steps not initialized.");
        alert("Kon de tour niet starten: geen stappen gedefinieerd.");
        return;
    }
    currentTourStepIndex = 0;
    createTourOverlay();
    createTourPopup();
    showTourStep(0);
    // console.log('Interactive tour started.');
}

function endInteractiveTour() {
    removeHighlight();
    const popup = document.getElementById(TOUR_POPUP_ID);
    if (popup) {
        popup.style.display = 'none';
    }
    removeTourOverlay();
    // console.log('Interactive tour ended.');
}

function highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        // Add the highlight class
        element.classList.add('tour-highlighted-element');

        // Create a clone if needed to bring above overlay
        const elementRect = element.getBoundingClientRect();

        // Scroll into view if needed
        if (elementRect.top < 0 || elementRect.bottom > window.innerHeight ||
            elementRect.left < 0 || elementRect.right > window.innerWidth) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }
    return element;
}

document.addEventListener('DOMContentLoaded', () => {
    const helpButton = document.getElementById('help-button');
    if (helpButton) {
        helpButton.addEventListener('click', (event) => {
            event.preventDefault();
            // console.log('Help button clicked, starting tour...');
            startInteractiveTour();
        });
    } else {
        console.warn('#help-button not found for tour.');
    }
    if (tourSteps.length === 0) { // Pre-initialize
        initializeTourSteps();
    }
});

console.log('verlofRooster_tour.js processed');
