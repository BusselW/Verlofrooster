// tutorial.js - Interactieve tour voor het Team Rooster systeem
// Enhanced version focusing on the most important UI elements and user actions
// Provides practical examples and actionable guidance for effective onboarding

export const tutorialSteps = [
    {
        targetId: 'root',
        message: "Welkom bij het Verlofrooster! Ik ga je snel op weg helpen door kort te laten zien hoe alles werkt.",
    },
    {
        targetId: 'header',
        message: "Dit is de titelbalk. In dit gebied zijn verschillende knoppen geplaatst.",
    },
    {
        targetId: 'btn-melding',
        message: "Deze knop gebruik je om feedback te geven over het verlofrooster. Denk aan verbeterpunten of dingen die simpelweg niet werken."
    },
    {
        targetId: 'btn-settings',
        message: "Dit is het persoonlijke instellingen menu. Hier pas je dingen aan zoals je werktijden, naamsgegevens en later ook de weergave van dit rooster."
    },
    {
        targetId: 'toolbar',
        message: "Dit is de werkbalk! Hier navigeer je door de tijd, schakel je tussen week- en maandweergave, en zoek je mensen en teams.",
    },
    {
        targetId: 'periode-navigatie',
        message: 'Met de pijlen links en rechts verander je van periode. Standaard opent het verlofrooster op de huidige maand. Als je wisselt naar de weekweergave zal dat uiteraard de huidige week zijn.',
    },
    {
        targetId: 'filter-groep', 
        message: 'Dit zijn het filter menu en de zoekbalk. Je kan medewerkers vinden door een deel van hun naam in te typen. Wil je liever het verlof van een heel team zien? Selecteer dat team via de keuzelijst en alle andere teams zijn niet meer zichtbaar.',
    },
    {
        targetId: 'legenda-container',
        message: 'Dit is de legenda. Hier zie je welke kleuren en afkortingen voor welke activiteiten worden gebruikt. VER is verlof, ZK ziekmeldingen, CU compensatie-uren en ZV zittingsvrije dagen. Elke activiteit heeft zijn eigen kleur.',
    },
    {
        targetId: 'medewerker-kolom',
        message: 'In deze kolom staan alle medewerkers met hun profielfoto. Ze zijn gegroepeerd per team en teamleiders hebben een speciale markering. Klik op een foto om meer info over die persoon te zien.',
    },
    {
        targetId: 'rooster-table',
        message: 'Dit is het rooster zelf. Elke rij is een medewerker, elke kolom een dag. In de cellen zie je alle activiteiten: verlofblokken, ziekmeldingen, compensatie-uren, feestdagen en meer.',
    },
    {
        targetId: 'dag-cel',
        message: 'Dit zijn de dagcellen waar alles gebeurt. Je ziet hier verlofblokken (groen), ziekmeldingen (rood), compensatie-uren (blauw) en andere activiteiten. Hover erover voor details, klik om te selecteren.',
        demoActions: [
            {
                type: 'highlight',
                description: 'Voorbeeld cel gemarkeerd'
            }
        ]
    },
    {
        targetId: 'verlof-blok',
        message: 'Dit zijn verlofblokken. De kleur toont de status: groen voor goedgekeurd, geel voor in behandeling, rood voor afgekeurd. Hover erover om details te zien zoals periode, type verlof en toelichting.',
    },
    {
        targetId: 'ziekte-blok',
        message: 'Rode blokken zijn ziekmeldingen. Deze tonen wanneer iemand ziek gemeld is. Hover erover om te zien vanaf welke datum en eventuele toelichtingen.',
    },
    {
        targetId: 'compensatie-uur-blok',
        message: 'Blauwe blokken of CU iconen zijn compensatie-uren. Deze tonen overuren (+) of afgewerkte uren (-). Kijk naar het cijfer voor het aantal uren. Hover voor details.',
    },
    {
        targetId: 'weekend-kolom',
        message: 'Grijze kolommen zijn weekenden. Deze hebben een andere achtergrondkleur zodat je makkelijk weekdagen van weekenden kan onderscheiden.',
    },
    {
        targetId: 'vandaag-kolom',
        message: 'De kolom van vandaag heeft een speciale markering zodat je altijd weet waar je bent in de tijd. Deze kolom wordt automatisch bijgewerkt.',
    },
    {
        targetId: 'fab-container',
        message: 'Deze ronde knop is je snelkoppeling. Hiermee maak je snel verlofaanvragen, meld je je ziek, registreer je compensatie-uren of vraag je zittingsvrije dagen aan.',
    },
    {
        targetId: 'dag-cel',
        message: 'Selecteer eerst één of meerdere dagen door erop te klikken. Shift+klik selecteert een bereik. Daarna rechtsklik je voor het contextmenu met alle opties.',
        demoActions: [
            {
                type: 'highlight',
                description: 'Rechtsklik hier voor het snelmenu'
            }
        ]
    },
    {
        targetId: 'user-dropdown',
        message: 'Klik op je naam of foto voor je persoonlijke instellingen. Hier pas je je werktijden aan, bekijk je verlof overzicht en stel je voorkeuren in.',
    },
    {
        targetId: 'nav-buttons-right',
        message: 'Hier zie je de beheertools (als je rechten hebt) en de helpknop. Gebruik de helpknop om deze uitleg later opnieuw te bekijken. Je weet nu hoe alles werkt!',
    }
];

// Helper functie om een element te highlighten tijdens de tutorial
export const highlightElement = (elementId) => {
    // Verwijder eventuele bestaande highlights
    document.querySelectorAll('.tutorial-highlight-active').forEach(el => {
        el.classList.remove('tutorial-highlight-active');
    });
    
    // Zoek het element
    let element = document.getElementById(elementId);
    
    // Als het element niet gevonden wordt via ID, probeer via className
    if (!element) {
        element = document.querySelector(`.${elementId}`);
    }
    
    // Als nog steeds niet gevonden, zoek naar data-tutorial-id
    if (!element) {
        element = document.querySelector(`[data-tutorial-id="${elementId}"]`);
    }
    
    // Special cases for elements that might not have exact IDs
    if (!element) {
        switch(elementId) {
            case 'dag-cel':
                // Find the first visible day cell
                element = document.querySelector('.dag-cel:not(.weekend)') || 
                         document.querySelector('td.dag-kolom:not(.weekend)') ||
                         document.querySelector('td[class*="dag"]');
                break;
            case 'verlof-blok':
                // Find verlof block - try multiple selectors
                element = document.querySelector('.verlof-blok') ||
                         document.querySelector('[data-afkorting="VER"]') ||
                         document.querySelector('.blok[style*="green"]') ||
                         document.querySelector('[class*="verlof"]');
                // If still nothing, look for any element with "VER" text or verlof in title
                if (!element) {
                    const allElements = document.querySelectorAll('td *');
                    for (let el of allElements) {
                        if (el.textContent?.includes('VER') || 
                            el.title?.toLowerCase().includes('verlof')) {
                            element = el;
                            break;
                        }
                    }
                }
                break;
            case 'ziekte-blok':
                // Find ziekte block - try multiple selectors
                element = document.querySelector('.ziekte-blok') ||
                         document.querySelector('[data-afkorting="ZK"]') ||
                         document.querySelector('.blok[style*="red"]') ||
                         document.querySelector('[class*="ziek"]');
                // If still nothing, look for any element with "ZK" text or ziek in title
                if (!element) {
                    const allElements = document.querySelectorAll('td *');
                    for (let el of allElements) {
                        if (el.textContent?.includes('ZK') || 
                            el.title?.toLowerCase().includes('ziek')) {
                            element = el;
                            break;
                        }
                    }
                }
                break;
            case 'compensatie-uur-blok':
                // Find compensatie block - try multiple selectors
                element = document.querySelector('.compensatie-uur-blok') ||
                         document.querySelector('.compensatie-uur-container') ||
                         document.querySelector('[data-afkorting="CU"]') ||
                         document.querySelector('.blok[style*="blue"]') ||
                         document.querySelector('[class*="compensatie"]') ||
                         document.querySelector('td .cu, td [data-type="compensatie"], td [title*="compensatie"], td [title*="uur"]');
                // If still nothing, look for any element with "CU" text or compensatie in title
                if (!element) {
                    const allElements = document.querySelectorAll('td *');
                    for (let el of allElements) {
                        if (el.textContent?.includes('CU') || 
                            el.title?.toLowerCase().includes('compensatie') ||
                            el.title?.toLowerCase().includes('uur')) {
                            element = el;
                            break;
                        }
                    }
                }
                break;
            case 'feestdag':
                // Find feestdag column
                element = document.querySelector('.feestdag') ||
                         document.querySelector('[data-feestdag]') ||
                         document.querySelector('.dag-kolom.feestdag') ||
                         document.querySelector('th[class*="feestdag"]');
                break;
            case 'weekend-kolom':
                // Find weekend column
                element = document.querySelector('.weekend') ||
                         document.querySelector('.dag-kolom.weekend') ||
                         document.querySelector('th.weekend');
                break;
            case 'vandaag-kolom':
                // Find today column
                element = document.querySelector('.vandaag') ||
                         document.querySelector('.dag-kolom.vandaag') ||
                         document.querySelector('th.vandaag') ||
                         document.querySelector('[class*="today"]');
                break;
            case 'fab-container':
                // Find FAB by class if ID doesn't work
                element = document.querySelector('.fab-container') ||
                         document.querySelector('#fab-container') ||
                         document.querySelector('[class*="fab"]');
                break;
            case 'medewerker-kolom':
                // Find first employee column - try multiple selectors
                element = document.querySelector('.medewerker-kolom') ||
                         document.querySelector('#medewerker-kolom') ||
                         document.querySelector('th[class*="medewerker"]') ||
                         document.querySelector('td[class*="medewerker"]') ||
                         document.querySelector('.employee-column') ||
                         document.querySelector('[class*="employee"]');
                // If still not found, try finding the first column header
                if (!element) {
                    const table = document.querySelector('table') || document.querySelector('.rooster-table');
                    if (table) {
                        element = table.querySelector('th:first-child') || 
                                 table.querySelector('td:first-child');
                    }
                }
                break;
            case 'legenda-container':
                element = document.querySelector('.legenda-container') ||
                         document.querySelector('#legenda-container') ||
                         document.querySelector('[class*="legenda"]') ||
                         document.querySelector('[class*="legend"]');
                break;
            case 'btn-melding':
                element = document.querySelector('.btn-melding') ||
                         document.querySelector('#btn-melding') ||
                         document.querySelector('button[class*="melding"]') ||
                         document.querySelector('[href*="melding"]');
                break;
            case 'btn-settings':
                element = document.querySelector('.btn-settings') ||
                         document.querySelector('#btn-settings') ||
                         document.querySelector('.user-dropdown') ||
                         document.querySelector('[class*="settings"]') ||
                         document.querySelector('[class*="user"]');
                break;
        }
    }
    
    if (element) {
        element.classList.add('tutorial-highlight-active');
        
        // Scroll naar het element met extra ruimte voor tooltip
        // Use a slight delay to ensure the element is properly highlighted first
        setTimeout(() => {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }, 100);
        
        return element;
    } else {
        console.warn(`Tutorial element niet gevonden: ${elementId}`);
        console.log('Available elements:', {
            byId: document.getElementById(elementId),
            byClass: document.querySelector(`.${elementId}`),
            allTables: document.querySelectorAll('table').length,
            allThs: document.querySelectorAll('th').length,
            allTds: document.querySelectorAll('td').length
        });
        return null;
    }
};

// Helper functie om highlight te verwijderen
export const removeHighlight = () => {
    document.querySelectorAll('.tutorial-highlight-active').forEach(el => {
        el.classList.remove('tutorial-highlight-active');
    });
};

// Extra uitleg per onderwerp met praktische voorbeelden
export const tutorialTopics = {
    verlofAanvragen: {
        title: "Verlof Aanvragen",
        steps: [
            "Periode kiezen:",
            "   • Enkele dag: Klik op bijvoorbeeld maandag 15 juli",
            "   • Meerdere dagen: Klik op startdag, dan op einddag", 
            "   • Handig: Shift+klik selecteert automatisch alles ertussen",
            "Formulier openen:",
            "   • Snelste: Rechtsklik op geselecteerde dag(en) en kies 'Verlof aanvragen'",
            "   • Of: Gebruik de ronde knop rechtsonder",
            "   • Tip: Rechtsklik is sneller als je al dagen hebt geselecteerd",
            "Formulier invullen:",
            "   • Verloftype: Vakantie, Kort verzuim, Verlof zonder behoud van salaris",
            "   • Datum check: Controleer of de data kloppen",
            "   • Opmerking: Bijvoorbeeld 'Familievakantie' of 'Doktersafspraak'",
            "   • Halve dagen: Vink aan als je alleen ochtend of middag vrij bent",
            "Versturen:",
            "   • Klik 'Opslaan' - je aanvraag gaat naar je manager",
            "   • Je ziet het direct in het rooster (meestal geel = wacht op goedkeuring)",
            "   • Je manager krijgt automatisch een melding"
        ]
    },
    ziekMelden: {
        title: "Ziek Melden",
        steps: [
            "Voor vandaag (meeste gevallen):",
            "   • Zoek je eigen rij in het rooster",
            "   • Klik op vandaag in je rij",
            "   • Rechtsklik en kies 'Ziek melden'",
            "Voor meerdere dagen:",
            "   • Selecteer startdag tot einddag",
            "   • Rechtsklik en kies 'Ziek melden'",
            "Formulier invullen:",
            "   • Type: Ziek, Doktersbezoek, Ziekte kind",
            "   • Opmerking: Bijvoorbeeld 'Griep' of 'Tandarts' (niet verplicht)",
            "   • Halve dag: Vink aan als je maar een deel van de dag ziek bent",
            "Direct actief:",
            "   • Ziekmeldingen zijn meteen zichtbaar (rood in het rooster)",
            "   • Geen goedkeuring nodig - gewoon direct actief",
            "   • Je leidinggevende krijgt automatisch bericht"
        ]
    },
    compensatieUren: {
        title: "Compensatie-uren Bijhouden",
        steps: [
            "Overuren registreren:",
            "   • Selecteer de dag(en) waar je extra hebt gewerkt",
            "   • Bijvoorbeeld: klik op afgelopen vrijdag in je rij",
            "Formulier openen:",
            "   • Snelste: Rechtsklik en kies 'Compensatieuren doorgeven'",
            "   • Of: Gebruik de ronde knop en kies 'Compensatieuren'",
            "   • Tip: Rechtsklik is handiger omdat je dan al de juiste dag hebt",
            "Gegevens invullen:",
            "   • Type: Overuren, Ruildag, Extra dienst, Reistijd",
            "   • Aantal uren: bijvoorbeeld 2,5 uur (gebruik een komma)",
            "   • Beschrijving: Bijvoorbeeld 'Avonddienst voor spoedklus'",
            "   • Datum/tijd: Wanneer je die extra uren hebt gemaakt",
            "Opslaan en checken:",
            "   • Compensatie-uren zie je als blauwe blokjes in het rooster",
            "   • Je plus/min uren worden automatisch bijgehouden",
            "   • Je leidinggevende kan ze nog goedkeuren of aanpassen"
        ]
    },
    navigatie: {
        title: "Navigeren door het Rooster",
        steps: [
            "Tussen periodes bewegen:",
            "   • Pijltjes: ga naar vorige/volgende week of maand",
            "   • Sneltoets: Gebruik de pijltjestoetsen op je toetsenbord",
            "Weergave kiezen:",
            "   • 'Week' weergave: Perfect voor gedetailleerde planning (7 dagen)",
            "   • 'Maand' weergave: Overzicht van een hele maand tegelijk",
            "   • Tip: Wissel vaak tussen beide voor het beste resultaat",
            "Zoeken en filteren:",
            "   • Zoeken: Typ een naam om die persoon te vinden",
            "   • Team filter: Selecteer een team om alleen die medewerkers te zien",
            "   • Combineren: Filter op team en zoek op naam voor precisie",
            "Kleuren herkennen:",
            "   • Gebruik de legenda om snel verloftypen te herkennen",
            "   • Groen: Goedgekeurd verlof",
            "   • Geel: Wacht nog op goedkeuring",
            "   • Rood: Ziek of afgewezen",
            "Handige trucs:",
            "   • Ctrl+klik: Selecteer meerdere losse dagen",
            "   • Shift+klik: Selecteer een heel bereik",
            "   • Dubbelklik: Zoom in op specifieke dag"
        ]
    },
    shortcutKeys: {
        title: "Sneltoetsen en Trucs",
        steps: [
            "Navigatie met je toetsenbord:",
            "   • Pijltjes links/rechts: Vorige/volgende periode",
            "   • Pijltjes omhoog/omlaag: Scroll door de medewerkerslijst",
            "   • Home/End: Spring naar begin/eind van het jaar",
            "Slimme muisacties:",
            "   • Ctrl+klik: Selecteer meerdere losse dagen",
            "   • Shift+klik: Selecteer een heel bereik",
            "   • Dubbelklik: Open direct een actie voor die dag",
            "Zoek en filter:",
            "   • Ctrl+F: Zoek op de pagina",
            "   • Tab: Spring naar het volgende invoerveld",
            "   • Escape: Sluit open menus/formulieren",
            "Snelle acties:",
            "   • Rechtsklik: Snelmenu op geselecteerde dagen - snelste manier!",
            "   • FAB: De ronde knop voor algemene acties",
            "   • Spatie: Open FAB menu (als er niks geselecteerd is)",
            "   • Enter: Bevestig actie in een formulier",
            "   • Escape: Annuleer wat je aan het doen bent",
            "Systeem:",
            "   • F5 of Ctrl+R: Ververs de pagina voor nieuwe gegevens",
            "   • Ctrl+Shift+R: Hard refresh (cache wissen)",
            "   • Ctrl + (plus): Zoom in op de pagina",
            "   • Ctrl - (min): Zoom uit op de pagina"
        ]
    }
};

// Main class for handling the tutorial functionality
export class RoosterTutorial {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = tutorialSteps.length;
        this.tooltipElement = null;
        this.overlayElement = null;
        this.isActive = false;
        this.isMobile = window.innerWidth < 768;
    }

    // Start the tutorial
    start() {
        if (this.isActive) return;
        
        console.log("Starting tutorial...");
        this.isActive = true;
        this.currentStep = 0;
        
        // Create overlay
        this.createOverlay();
        
        // Show first step
        this.showStep(0);
        
        // Add window resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    // End the tutorial
    end() {
        console.log("Ending tutorial...");
        this.isActive = false;
        
        // Remove highlight
        removeHighlight();
        
        // Remove demo highlights
        this.cleanupDemoElements();
        
        // Remove tooltip
        if (this.tooltipElement) {
            document.body.removeChild(this.tooltipElement);
            this.tooltipElement = null;
        }
        
        // Remove overlay
        if (this.overlayElement) {
            document.body.removeChild(this.overlayElement);
            this.overlayElement = null;
        }
        
        // Remove resize listener
        window.removeEventListener('resize', this.handleResize.bind(this));
        
        // Fire custom event for tutorial completion
        document.dispatchEvent(new CustomEvent('tutorial-completed'));
    }

    // Clean up demo elements
    cleanupDemoElements() {
        document.querySelectorAll('.tutorial-demo-highlight, .tutorial-demo-click').forEach(el => {
            el.classList.remove('tutorial-demo-highlight', 'tutorial-demo-click');
        });
    }

    // Create overlay
    createOverlay() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'tutorial-overlay';
        document.body.appendChild(this.overlayElement);
    }

    // Show a specific step
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) {
            this.end();
            return;
        }
        
        // Clean up previous demo elements
        this.cleanupDemoElements();
        
        this.currentStep = stepIndex;
        const step = tutorialSteps[stepIndex];
        
        // Highlight target element
        const targetElement = highlightElement(step.targetId);
        
        // Execute demo actions if specified
        if (step.demoActions) {
            this.executeDemoActions(step.demoActions, targetElement);
        }
        
        // Create or update tooltip with a slight delay to ensure smooth positioning
        setTimeout(() => {
            this.createTooltip(step, targetElement);
        }, 200);
    }

    // Execute demo actions for interactive examples
    executeDemoActions(actions, targetElement) {
        actions.forEach((action, index) => {
            setTimeout(() => {
                switch (action.type) {
                    case 'highlight':
                        // Find a specific cell for org\busselw if available
                        const targetCell = this.findDemonstrationCell();
                        if (targetCell) {
                            targetCell.classList.add('tutorial-demo-highlight');
                            console.log('🎯 Demo:', action.description);
                        }
                        break;
                    case 'click':
                        if (targetElement) {
                            // Simulate a visual click effect
                            targetElement.classList.add('tutorial-demo-click');
                            setTimeout(() => {
                                targetElement.classList.remove('tutorial-demo-click');
                            }, 300);
                        }
                        break;
                    case 'openModal':
                        // This would be called when showing form examples
                        console.log('🎯 Demo: Opening example modal for', action.description);
                        break;
                }
            }, index * 1000); // Stagger actions by 1 second
        });
    }

    // Find a suitable cell for demonstration
    findDemonstrationCell() {
        // Look for a cell in the first few rows that's not a weekend
        const cells = document.querySelectorAll('.dag-cel:not(.weekend)');
        if (cells.length > 0) {
            return cells[0]; // Return first suitable cell
        }
        
        // Fallback to any cell
        const anyCells = document.querySelectorAll('td.dag-kolom:not(.weekend)');
        return anyCells.length > 0 ? anyCells[0] : null;
    }

    // Create tooltip for current step
    createTooltip(step, targetElement) {
        // Remove existing tooltip if any
        if (this.tooltipElement) {
            document.body.removeChild(this.tooltipElement);
        }
        
        // Create new tooltip
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tutorial-tooltip';
        
        // Add content
        this.tooltipElement.innerHTML = `
            <div class="tutorial-tooltip-header">${this.getStepTitle(step)}</div>
            <div class="tutorial-tooltip-content">${step.message}</div>
            <div class="tutorial-navigation">
                ${this.currentStep > 0 ? 
                    '<button class="tutorial-btn tutorial-btn-secondary" id="tutorial-prev">⬅️ Vorige</button>' : 
                    '<button class="tutorial-btn-skip" id="tutorial-skip">⏭️ Overslaan</button>'}
                <button class="tutorial-btn tutorial-btn-primary" id="tutorial-next">
                    ${this.currentStep < this.totalSteps - 1 ? 'Volgende ➡️' : '🎉 Klaar!'}
                </button>
            </div>
            <div class="tutorial-progress">
                <span class="tutorial-progress-text">Stap ${this.currentStep + 1} van ${this.totalSteps}</span>
                ${this.createProgressDots()}
            </div>
            <button class="tutorial-btn-close" id="tutorial-close" title="Tour sluiten">✕</button>
        `;
        
        // Add to DOM temporarily positioned off-screen to measure dimensions
        this.tooltipElement.style.visibility = 'hidden';
        this.tooltipElement.style.position = 'absolute';
        this.tooltipElement.style.left = '-9999px';
        this.tooltipElement.style.top = '-9999px';
        document.body.appendChild(this.tooltipElement);
        
        // Position tooltip relative to target after measuring
        setTimeout(() => {
            this.positionTooltip(targetElement);
            this.tooltipElement.style.visibility = 'visible';
        }, 50);
        
        // Add event listeners
        this.addTooltipEventListeners();
    }

    // Get appropriate title for step
    getStepTitle(step) {
        // Default titles based on step index
        const defaultTitles = [
            "Welkom bij het Verlofrooster!",      // 0
            "Hoofdnavigatie",                     // 1  
            "Melding knop",                       // 2
            "Instellingen knop",                  // 3
            "Je Werkbalk",                        // 4
            "Door de Tijd Navigeren",             // 5
            "Zoeken en Filteren",                 // 6
            "Kleuren Uitgelegd",                  // 7
            "Medewerkerskolom",                   // 8
            "Het Rooster Zelf",                   // 9
            "Dagcellen - Waar Alles Gebeurt",    // 10
            "Verlofblokken",                      // 11
            "Ziekmeldingen",                      // 12
            "Compensatie-uren",                   // 13
            "Feestdagen",                         // 14
            "Weekenden",                          // 15
            "Vandaag Markering",                  // 16
            "Snelle Acties",                      // 17
            "Rechtsklik Menu",                    // 18
            "Je Profiel",                         // 19
            "Klaar!"                              // 20
        ];
        
        return step.title || defaultTitles[this.currentStep] || `Stap ${this.currentStep + 1}`;
    }

    // Create progress dots
    createProgressDots() {
        let dots = '';
        for (let i = 0; i < this.totalSteps; i++) {
            dots += `<div class="tutorial-progress-dot ${i === this.currentStep ? 'active' : ''}"></div>`;
        }
        return dots;
    }

    // Position tooltip relative to target element
    positionTooltip(targetElement) {
        if (!targetElement || !this.tooltipElement) return;
        
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        
        // Default position (bottom)
        let position = 'bottom';
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        let top = targetRect.bottom + 15;
        
        // Check if tooltip would go off-screen and adjust
        if (top + tooltipRect.height > window.innerHeight) {
            // Try top position
            top = targetRect.top - tooltipRect.height - 15;
            position = 'top';
            
            // If still off-screen, try right position
            if (top < 0) {
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + 15;
                position = 'right';
                
                // If still off-screen, try left position
                if (left + tooltipRect.width > window.innerWidth) {
                    left = targetRect.left - tooltipRect.width - 15;
                    position = 'left';
                }
            }
        }
        
        // Ensure tooltip stays within viewport
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        
        // Apply position
        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
        
        // Add position class for arrow
        this.tooltipElement.className = `tutorial-tooltip position-${position}`;
        
        // Ensure tooltip is visible by scrolling viewport if needed
        this.ensureTooltipVisible(left, top, tooltipRect.width, tooltipRect.height);
    }

    // Ensure tooltip is visible in viewport by scrolling if necessary
    ensureTooltipVisible(tooltipLeft, tooltipTop, tooltipWidth, tooltipHeight) {
        const scrollPadding = 20; // Extra padding for better UX
        
        // Calculate tooltip bounds
        const tooltipRight = tooltipLeft + tooltipWidth;
        const tooltipBottom = tooltipTop + tooltipHeight;
        
        // Calculate current viewport
        const viewportLeft = window.pageXOffset;
        const viewportTop = window.pageYOffset;
        const viewportRight = viewportLeft + window.innerWidth;
        const viewportBottom = viewportTop + window.innerHeight;
        
        // Calculate needed scroll adjustments
        let scrollX = 0;
        let scrollY = 0;
        
        // Horizontal scrolling
        if (tooltipLeft < viewportLeft + scrollPadding) {
            scrollX = tooltipLeft - scrollPadding - viewportLeft;
        } else if (tooltipRight > viewportRight - scrollPadding) {
            scrollX = tooltipRight + scrollPadding - viewportRight;
        }
        
        // Vertical scrolling
        if (tooltipTop < viewportTop + scrollPadding) {
            scrollY = tooltipTop - scrollPadding - viewportTop;
        } else if (tooltipBottom > viewportBottom - scrollPadding) {
            scrollY = tooltipBottom + scrollPadding - viewportBottom;
        }
        
        // Smooth scroll to keep tooltip visible
        if (scrollX !== 0 || scrollY !== 0) {
            window.scrollBy({
                left: scrollX,
                top: scrollY,
                behavior: 'smooth'
            });
        }
    }

    // Add event listeners to tooltip buttons
    addTooltipEventListeners() {
        const nextBtn = this.tooltipElement.querySelector('#tutorial-next');
        const prevBtn = this.tooltipElement.querySelector('#tutorial-prev');
        const skipBtn = this.tooltipElement.querySelector('#tutorial-skip');
        const closeBtn = this.tooltipElement.querySelector('#tutorial-close');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.showStep(this.currentStep + 1);
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.showStep(this.currentStep - 1);
            });
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.end();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.end();
            });
        }
    }

    // Handle window resize
    handleResize() {
        this.isMobile = window.innerWidth < 768;
        
        // Reposition tooltip with smooth scrolling adjustment
        if (this.isActive && this.tooltipElement) {
            const targetElement = document.querySelector('.tutorial-highlight-active');
            if (targetElement) {
                // Add a small delay to allow the resize to complete
                setTimeout(() => {
                    this.positionTooltip(targetElement);
                }, 100);
            }
        }
    }

    // Go to next step
    next() {
        if (this.currentStep < this.totalSteps - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.end();
        }
    }

    // Go to previous step
    previous() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
}

// Create and export tutorial instance
export const roosterTutorial = new RoosterTutorial();