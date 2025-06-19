// js/verlofrooster_logic.js

/**
 * Hoofdlogica voor de Verlofrooster applicatie.
 * Beheert data ophalen, rooster rendering, navigatie, filtering en UI interacties.
 */

// Globale status en data variabelen
let huidigeWeergave = 'maand';
let huidigeDatumFocus = new Date();
let sorteerKolomMedewerker = 'Naam';
let sorteerRichtingMedewerker = 'asc';

let alleMedewerkers = [];
let alleVerlofItems = [];
let alleTeams = [];
let alleDagenIndicators = [];
let alleUrenPerWeekItems = [];
let alleVerlofredenen = [];
let alleCompensatieUrenItems = [];
let alleKeuzelijstFuncties = [];
let alleStatusOpties = [];
let alleIncidenteelZittingVrijItems = [];

let geselecteerdeMedewerkerId = null;
let geselecteerdeMedewerkerUsername = null; // Volledige claims-based username voor SP
let geselecteerdeMedewerkerNaam = null;   // Display naam voor UI

let gebruikersInstellingen = {
    eigenTeamWeergeven: false,
    soortWeergave: 'light',
    weekendenWeergeven: true
};
let gebruikersInstellingenSPId = null;

let isDataVoorVerlofModalGereed = false;
let isDataVoorRegistratieModalGereed = false;
let isDataVoorZiekBeterModalGereed = false;

const lijstNamen = {
    Verlof: "Verlof",
    CompensatieUren: "CompensatieUren",
    Medewerkers: "Medewerkers",
    DagenIndicator: "DagenIndicators",
    Teams: "Teams",
    Verlofredenen: "Verlofredenen",
    Instellingen: "gebruikersInstellingen",
    UrenPerWeek: "UrenPerWeek",
    IncidenteelZittingVrij: "IncidenteelZittingVrij",
    KeuzelijstFuncties: "keuzelijstFuncties",
    StatusOpties: "statuslijstOpties"
};

const domRefsLogic = {};

/**
 * Toggles the FAB menu open/closed state
 * @param {boolean} [forceClose=false] - Force close the menu
 */
function toggleFabMenu(forceClose = false) {
    if (!domRefsLogic.fabMenu || !domRefsLogic.fabIconPlus || !domRefsLogic.fabIconClose) {
        console.warn("[VerlofroosterLogic] FAB menu elementen niet gevonden voor toggle.");
        return;
    }

    const isMenuOpen = !domRefsLogic.fabMenu.classList.contains('opacity-0');

    if (forceClose || isMenuOpen) {
        // Close menu
        domRefsLogic.fabMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        domRefsLogic.fabIconPlus.classList.remove('hidden');
        domRefsLogic.fabIconClose.classList.add('hidden');
    } else {
        // Open menu
        domRefsLogic.fabMenu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        domRefsLogic.fabIconPlus.classList.add('hidden');
        domRefsLogic.fabIconClose.classList.remove('hidden');
    }
}

/**
 * Initialiseert alle DOM referenties.
 */
function initDOMReferentiesLogic() {
    domRefsLogic.appBody = document.body;
    domRefsLogic.notificationPlaceholder = document.getElementById('notification-placeholder'); domRefsLogic.gebruikersnaamDisplay = document.getElementById('gebruikersnaam-display');
    domRefsLogic.roosterDropdownButton = document.getElementById('rooster-dropdown-button');
    domRefsLogic.roosterDropdownMenu = document.getElementById('rooster-dropdown-menu');
    domRefsLogic.prevMonthButton = document.getElementById('prev-month-button');
    domRefsLogic.currentMonthYear = document.getElementById('current-month-year');
    domRefsLogic.nextMonthButton = document.getElementById('next-month-button');
    domRefsLogic.todayButton = document.getElementById('today-button');
    domRefsLogic.weekViewButton = document.getElementById('week-view-button');
    domRefsLogic.monthViewButton = document.getElementById('month-view-button');
    domRefsLogic.teamFilterSelect = document.getElementById('team-filter-select');
    domRefsLogic.roosterSearchInput = document.getElementById('rooster-search-input');
    domRefsLogic.legendaItemsContainer = document.getElementById('legenda-items-container');
    domRefsLogic.legendaSection = document.getElementById('legenda-section');
    domRefsLogic.registratieMelding = document.getElementById('registratie-melding');
    domRefsLogic.registratieMeldingTekst = document.getElementById('registratie-melding-tekst');
    domRefsLogic.startRegistratieButton = document.getElementById('start-registratie-button');
    domRefsLogic.roosterGridContainer = document.getElementById('rooster-grid-container');
    domRefsLogic.roosterGridHeader = document.getElementById('rooster-grid-header');
    domRefsLogic.roosterDataRows = document.getElementById('rooster-data-rows');
    domRefsLogic.sortMedewerkerButton = document.getElementById('sort-medewerker-button');
    domRefsLogic.fabAddButton = document.getElementById('fab-add-button');
    domRefsLogic.fabMenu = document.getElementById('fab-menu');
    domRefsLogic.fabVerlofAanvragenLink = document.getElementById('fab-verlof-aanvragen');
    domRefsLogic.fabCompensatieAanvragenLink = document.getElementById('fab-compensatie-doorgeven');
    domRefsLogic.fabZiekMeldenLink = document.getElementById('fab-ziek-melden');
    domRefsLogic.fabZittingVrijModalTrigger = document.getElementById('fab-zittingvrij-modal-trigger');
    domRefsLogic.fabIconPlus = document.getElementById('fab-icon-plus');
    domRefsLogic.fabIconClose = document.getElementById('fab-icon-close');
    domRefsLogic.helpButton = document.getElementById('help-button');
    domRefsLogic.meldingButton = document.getElementById('melding-button'); domRefsLogic.modalPlaceholder = document.getElementById('modal-placeholder');
    if (domRefsLogic.modalPlaceholder) {
        domRefsLogic.modalDialog = domRefsLogic.modalPlaceholder.querySelector('.modal-dialog');
        domRefsLogic.modalCard = domRefsLogic.modalPlaceholder.querySelector('.modal-card');
        domRefsLogic.modalTitle = domRefsLogic.modalPlaceholder.querySelector('#modal-title');
        domRefsLogic.modalContent = domRefsLogic.modalPlaceholder.querySelector('#modal-content');
        domRefsLogic.modalCloseButtonX = domRefsLogic.modalPlaceholder.querySelector('#modal-close-button-x');
        domRefsLogic.modalCloseButton = domRefsLogic.modalPlaceholder.querySelector('#modal-close-button');
        domRefsLogic.modalActionButton = domRefsLogic.modalPlaceholder.querySelector('#modal-action-button');
        domRefsLogic.modalActionsContainer = domRefsLogic.modalPlaceholder.querySelector('#modal-actions');
        domRefsLogic.modalStepNavigationContainer = domRefsLogic.modalPlaceholder.querySelector('#modal-step-navigation-container');

        if (!domRefsLogic.modalCard || !domRefsLogic.modalTitle || !domRefsLogic.modalContent || !domRefsLogic.modalCloseButtonX || !domRefsLogic.modalCloseButton || !domRefsLogic.modalActionButton || !domRefsLogic.modalActionsContainer || !domRefsLogic.modalStepNavigationContainer) {
            console.warn("[VerlofroosterLogic] Een of meerdere modal child elementen niet gevonden! Modals werken mogelijk niet correct.");
        }
    } else {
        console.error("[VerlofroosterLogic] Modal placeholder element (#modal-placeholder) niet gevonden! Modals zullen niet werken.");
    }
    window.domRefsLogic = domRefsLogic;
    console.log("[VerlofroosterLogic] DOM referenties geïnitialiseerd.");
}

/**
 * Wacht tot de SharePoint context beschikbaar is.
 */
async function wachtOpSharePointContext() {
    console.log("[VerlofroosterLogic] Wachten op voltooiing initialisatie van machtigingen.js via promise...");
    if (typeof window.machtigingenInitializationPromise === 'undefined') {
        console.error("[VerlofroosterLogic] Kritische fout: window.machtigingenInitializationPromise is niet gedefinieerd.");
        toonNotificatie("Kritische laadfout van applicatie-afhankelijkheden. Probeer de pagina te vernieuwen.", "error", false);
        return false;
    }
    try {
        await window.machtigingenInitializationPromise;
        console.log("[VerlofroosterLogic] Machtigingen.js initialisatie voltooid.");

        if (typeof window.spWebAbsoluteUrl === 'string' && window.huidigeGebruiker && window.huidigeGebruiker.loginNaam) {
            if (domRefsLogic.gebruikersnaamDisplay) {
                domRefsLogic.gebruikersnaamDisplay.textContent = window.huidigeGebruiker.Title || window.huidigeGebruiker.normalizedUsername || "Gebruiker";
            }
            return true;
        } else {
            console.error("[VerlofroosterLogic] Globale context variabelen (spWebAbsoluteUrl, huidigeGebruiker.loginNaam) niet correct gezet na promise.");
            toonNotificatie("Fout bij laden gebruikerscontext. Probeer de pagina te vernieuwen.", "error", false);
            return false;
        }
    } catch (error) {
        console.error("[VerlofroosterLogic] Fout tijdens wachten op machtigingen.js initialisatie promise:", error);
        toonNotificatie("Fout bij laden van basis-afhankelijkheden. Probeer de pagina te vernieuwen.", "error", false);
        return false;
    }
}

/**
 * Helper functie om een string te escapen voor OData queries.
 */
function escapeODataString(value) {
    if (value === null || value === undefined) return "null";
    return value.replace(/'/g, "''");
}

/**
 * Controleert of de huidige gebruiker geregistreerd is in de Medewerkers lijst.
 */
async function controleerGebruikersRegistratie() {
    console.log("[VerlofroosterLogic] Starten controle gebruikersregistratie.");
    if (!window.huidigeGebruiker || !window.huidigeGebruiker.normalizedUsername) {
        console.error("[VerlofroosterLogic] Kan gebruikersregistratie niet controleren: huidigeGebruiker.normalizedUsername is niet beschikbaar.");
        toonRegistratieMelding("Gebruikersinformatie kon niet worden geladen. Probeer de pagina te vernieuwen.", false);
        return false;
    }

    const waardeVoorFilter = escapeODataString(window.huidigeGebruiker.normalizedUsername);
    const filterQuery = `$filter=Username eq '${waardeVoorFilter}'`;
    const selectQuery = "$select=ID,Title,Naam,Username,Team,Actief,Verbergen,Functie,E_x002d_mail,Horen";

    if (typeof window.getLijstItemsAlgemeen !== 'function') {
        console.error("[VerlofroosterLogic] Functie getLijstItemsAlgemeen is niet beschikbaar.");
        toonRegistratieMelding("Systeemfout: Benodigde functies voor datakoppeling ontbreken.", false);
        return false;
    }

    try {
        // GECORRIGEERDE AANROEP: Gebruik lijstNamen.Medewerkers (de key)
        const gevondenMedewerkers = await window.getLijstItemsAlgemeen(lijstNamen.Medewerkers, selectQuery, filterQuery);

        if (gevondenMedewerkers && gevondenMedewerkers.length > 0) {
            const medewerker = gevondenMedewerkers[0];
            if (medewerker.Actief && !medewerker.Verbergen) {
                window.huidigeGebruiker.medewerkerData = medewerker;
                if (domRefsLogic.gebruikersnaamDisplay && medewerker.Naam) {
                    domRefsLogic.gebruikersnaamDisplay.textContent = medewerker.Naam;
                }
                if (domRefsLogic.registratieMelding) domRefsLogic.registratieMelding.classList.add('hidden');
                console.log("[VerlofroosterLogic] Gebruiker is geregistreerd en actief:", medewerker.Naam);
                return true;
            } else {
                const reden = !medewerker.Actief ? "niet Actief" : "verborgen in het rooster";
                toonRegistratieMelding(`Uw account is bekend, maar staat momenteel als ${reden}. Neem contact op met de beheerder indien dit onjuist is.`, false);
                return false;
            }
        } else {
            toonRegistratieMelding("Uw account is nog niet bekend in het verlofrooster. Klik hieronder om het registratieproces te starten.", true);
            return false;
        }
    } catch (error) {
        console.error("[VerlofroosterLogic] Fout tijdens controle gebruikersregistratie:", error);
        toonRegistratieMelding("Fout bij het controleren van uw registratiestatus. Probeer het later opnieuw.", false);
        return false;
    }
}

/**
 * Toont een melding m.b.t. gebruikersregistratie.
 */
function toonRegistratieMelding(tekst, toonRegistratieKnop) {
    if (domRefsLogic.registratieMelding && domRefsLogic.registratieMeldingTekst && domRefsLogic.startRegistratieButton) {
        domRefsLogic.registratieMeldingTekst.innerHTML = tekst;
        domRefsLogic.startRegistratieButton.classList.toggle('hidden', !toonRegistratieKnop);
        domRefsLogic.registratieMelding.classList.remove('hidden');
        if (domRefsLogic.roosterGridContainer) domRefsLogic.roosterGridContainer.classList.add('hidden');
        if (domRefsLogic.legendaSection) domRefsLogic.legendaSection.classList.add('hidden');
    } else {
        console.error("[VerlofroosterLogic] DOM elementen voor registratie melding niet gevonden.");
        alert(tekst);
    }
}

/**
 * Get the current visible date range based on the current view and focus date
 */
function getVisibleDateRange() {
    const startDate = new Date(huidigeDatumFocus);
    const endDate = new Date(huidigeDatumFocus);

    if (huidigeWeergave === 'maand') {
        // For month view, get the full month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of current month
        endDate.setHours(23, 59, 59, 999);
    } else {
        // For week view, get the full week (Monday to Sunday)
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setDate(startDate.getDate() + 6); // 7 days total
        endDate.setHours(23, 59, 59, 999);
    }

    console.log(`[VerlofroosterLogic] Visible date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    return { startDate, endDate };
}

/**
 * Create date filter query parameters for SharePoint REST API
 */
function createDateFilterQuery(dateRange) {
    const startDateISO = dateRange.startDate.toISOString();
    const endDateISO = dateRange.endDate.toISOString();
    
    // For verlof items: filter where (StartDatum <= endDate AND EindDatum >= startDate)
    const verlofFilter = `(StartDatum le datetime'${endDateISO}' and EindDatum ge datetime'${startDateISO}')`;
    
    // For compensatie items: similar logic with their date fields
    const compensatieFilter = `(StartCompensatieUren le datetime'${endDateISO}' and EindeCompensatieUren ge datetime'${startDateISO}')`;
    
    // For zittingvrij items: check ZittingsVrijeDagTijd field
    const zittingVrijFilter = `(ZittingsVrijeDagTijd le datetime'${endDateISO}' and ZittingsVrijeDagTijd ge datetime'${startDateISO}')`;
    
    return {
        verlofFilter,
        compensatieFilter,
        zittingVrijFilter
    };
}

/**
 * Laadt alle initiële data die nodig is voor het rooster.
 * Optionally filters date-sensitive data by the current visible period.
 */
async function laadInitiëleData(forceerModalData = false, loadOnlyCurrentPeriod = true) {
    console.log(`[VerlofroosterLogic] Starten met laden van initiële data. Forceer modal data: ${forceerModalData}, Filter periode: ${loadOnlyCurrentPeriod}`);
    if (domRefsLogic.notificationPlaceholder && !forceerModalData) {
        toonNotificatie("Bezig met laden van roostergegevens...", "info", 10000);
    }    try {
        // Get date filters if we're loading only current period
        let dateFilters = null;
        if (loadOnlyCurrentPeriod) {
            const visibleRange = getVisibleDateRange();
            dateFilters = createDateFilterQuery(visibleRange);
            console.log("[VerlofroosterLogic] Using date filters for current period:", dateFilters);
        }

        const dataPromises = [
            window.getLijstItemsAlgemeen(lijstNamen.Medewerkers, "$select=ID,Title,Naam,Username,Team,Actief,Verbergen,Functie,E_x002d_mail,Horen").then(items => {
                alleMedewerkers = items || [];
                window.alleMedewerkers = alleMedewerkers; // Zorg ervoor dat het globaal beschikbaar is
            }),
            // Load verlof items with date filter if applicable
            window.getLijstItemsAlgemeen(
                lijstNamen.Verlof, 
                dateFilters ? `$filter=${dateFilters.verlofFilter}` : undefined
            ).then(items => {
                console.log(`[VerlofroosterLogic] Loaded Verlof items (${loadOnlyCurrentPeriod ? 'filtered' : 'all'}):`, items ? items.length : 0);
                if (items && items.length > 0) {
                    console.log("[VerlofroosterLogic] Sample Verlof item:", items[0]);
                } else {
                    console.warn(`[VerlofroosterLogic] No Verlof items loaded from SharePoint! (${loadOnlyCurrentPeriod ? 'filtered by current period' : 'no filter'})`);
                }

                // Apply date normalization to ensure consistent date formats
                if (typeof window.normalizeSharePointDates === 'function') {
                    alleVerlofItems = window.normalizeSharePointDates(items || [], ['StartDatum', 'EindDatum']);
                    console.log("[VerlofroosterLogic] Normalized Verlof dates. First item dates:",
                        alleVerlofItems.length > 0 ? {
                            StartDatum: alleVerlofItems[0].StartDatum,
                            EindDatum: alleVerlofItems[0].EindDatum
                        } : "No items"
                    );
                } else {
                    alleVerlofItems = items || [];
                    console.warn("[VerlofroosterLogic] Date normalization function not available");
                }
            }),
            // Load compensatie items with date filter if applicable
            window.getLijstItemsAlgemeen(
                lijstNamen.CompensatieUren,
                dateFilters ? `$filter=${dateFilters.compensatieFilter}` : undefined
            ).then(items => {
                console.log(`[VerlofroosterLogic] Loaded CompensatieUren items (${loadOnlyCurrentPeriod ? 'filtered' : 'all'}):`, items ? items.length : 0);
                // Also normalize dates for compensation items
                if (typeof window.normalizeSharePointDates === 'function') {
                    alleCompensatieUrenItems = window.normalizeSharePointDates(items || [], ['StartCompensatieUren', 'EindeCompensatieUren']);
                } else {
                    alleCompensatieUrenItems = items || [];
                }
            }),            window.getLijstItemsAlgemeen(lijstNamen.Teams, "$select=ID,Title,Naam,Kleur,Actief").then(items => {
                alleTeams = items || [];
                window.alleTeams = alleTeams; // Ensure it's on the window object
            }),
            window.getLijstItemsAlgemeen(lijstNamen.DagenIndicator).then(items => alleDagenIndicators = items || []),
            window.getLijstItemsAlgemeen(lijstNamen.UrenPerWeek).then(items => alleUrenPerWeekItems = items || []),
            // Load zittingvrij items with date filter if applicable
            window.getLijstItemsAlgemeen(
                lijstNamen.IncidenteelZittingVrij,
                dateFilters ? `$filter=${dateFilters.zittingVrijFilter}` : undefined
            ).then(items => {
                console.log(`[VerlofroosterLogic] Loaded IncidenteelZittingVrij items (${loadOnlyCurrentPeriod ? 'filtered' : 'all'}):`, items ? items.length : 0);
                alleIncidenteelZittingVrijItems = items || [];
            }),
            window.getLijstItemsAlgemeen(lijstNamen.Verlofredenen, "$select=ID,Title,Naam,Kleur,VerlofDag").then(items => alleVerlofredenen = items || [])
        ];

        if (forceerModalData || !isDataVoorRegistratieModalGereed || !isDataVoorVerlofModalGereed || !isDataVoorZiekBeterModalGereed) {
            dataPromises.push(
                window.getLijstItemsAlgemeen(lijstNamen.KeuzelijstFuncties, "$select=ID,Title").then(items => {
                    alleKeuzelijstFuncties = items || [];
                    window.alleKeuzelijstFuncties = alleKeuzelijstFuncties; // Ensure it's on the window object
                })
            );
        }

        const gebruikersInstellingenFilter = `$filter=Title eq '${escapeODataString(window.huidigeGebruiker.normalizedUsername)}'`;
        dataPromises.push(
            window.getLijstItemsAlgemeen(lijstNamen.Instellingen, "$select=ID,Title,EigenTeamWeergeven,soortWeergave,WeekendenWeergeven", gebruikersInstellingenFilter)
                .then(items => {
                    if (items && items.length > 0) {
                        const inst = items[0];
                        gebruikersInstellingen.eigenTeamWeergeven = inst.EigenTeamWeergeven || false;
                        gebruikersInstellingen.soortWeergave = inst.soortWeergave || 'light';
                        gebruikersInstellingen.weekendenWeergeven = (inst.WeekendenWeergeven === null || inst.WeekendenWeergeven === undefined) ? true : inst.WeekendenWeergeven;
                        gebruikersInstellingenSPId = inst.ID;
                    } else {
                        console.log("[VerlofroosterLogic] Geen specifieke gebruikersinstellingen gevonden, standaard waarden worden gebruikt.");
                    }
                })
        );

        await Promise.all(dataPromises);
        console.log("[VerlofroosterLogic] Alle data succesvol geladen/bijgewerkt.");

        isDataVoorRegistratieModalGereed = (alleTeams.length > 0 && alleKeuzelijstFuncties.length > 0);
        isDataVoorVerlofModalGereed = (alleVerlofredenen.length > 0);
        isDataVoorZiekBeterModalGereed = (alleVerlofredenen.length > 0);

        if (!forceerModalData) {
            pasGebruikersInstellingenToe();
            updateTeamFilter();
            updateLegenda();
            updateDatumHeader();
            tekenRooster();
        } else {
            console.log("[VerlofroosterLogic] Modal specifieke data geladen.");
        }

    } catch (error) {
        console.error("[VerlofroosterLogic] Fout tijdens het laden van initiële data:", error);
        isDataVoorRegistratieModalGereed = false;
        isDataVoorVerlofModalGereed = false;
        isDataVoorZiekBeterModalGereed = false;
        if (domRefsLogic.notificationPlaceholder && !forceerModalData) {
            toonNotificatie("Een of meerdere databronnen konden niet geladen worden. Probeer de pagina te vernieuwen.", "error", false);
        }
    }

    if (domRefsLogic.notificationPlaceholder && domRefsLogic.notificationPlaceholder.textContent === "Bezig met laden van roostergegevens..." && !forceerModalData) {
        toonNotificatie("", "info", 1);
    }
    console.log("[VerlofroosterLogic] Einde laadInitiëleData.");

    // Add debugging after alleVerlofItems is loaded
    console.log("=== VERLOF DEBUGGING ===");
    console.log("Total verlof items loaded:", alleVerlofItems?.length || 0);
    console.log("First 5 verlof items:", alleVerlofItems?.slice(0, 5));
    console.log("Last 5 verlof items:", alleVerlofItems?.slice(-5));

    // Check for recent items
    const recentItems = alleVerlofItems?.filter(item => {
        const startDate = new Date(item.StartDatum);
        const now = new Date();
        const daysDiff = (now - startDate) / (1000 * 60 * 60 * 24);
        return Math.abs(daysDiff) <= 30; // Items within 30 days
    });
    console.log("Recent verlof items (±30 days):", recentItems?.length || 0, recentItems);
}

/**
 * Laadt de benodigde data voor de registratie modal.
 */
async function laadBenodigdeDataVoorModal() {
    console.log("[VerlofroosterLogic] Start laden van benodigde data voor modal (Teams, Functies).");
    try {
        const teamsPromise = window.getLijstItemsAlgemeen(lijstNamen.Teams, "$select=ID,Title", "");
        const functiesPromise = window.getLijstItemsAlgemeen(lijstNamen.KeuzelijstFuncties, "$select=ID,Title", "");

        const [teamsData, functiesData] = await Promise.all([teamsPromise, functiesPromise]);

        window.alleTeams = teamsData || [];
        window.alleKeuzelijstFuncties = functiesData || [];

        console.log("[VerlofroosterLogic] Teams en Functies geladen voor modal:", window.alleTeams, window.alleKeuzelijstFuncties);

        // Zet een vlag dat deze specifieke data gereed is, indien nodig voor andere logica
        // isDataVoorRegistratieModalGereed = true; // Of een meer generieke vlag

        return { teams: window.alleTeams, functies: window.alleKeuzelijstFuncties };
    } catch (error) {
        console.error("[VerlofroosterLogic] Fout bij het laden van data voor modal:", error);
        // Toon eventueel een foutmelding aan de gebruiker
        // showAlert("Kon benodigde data voor het formulier niet laden. Probeer het later opnieuw.", "error");
        window.alleTeams = []; // Zorg voor lege arrays bij fout
        window.alleKeuzelijstFuncties = [];
        return { teams: [], functies: [] };
    }
}
// Exporteer de functie naar window scope als dat nog niet gebeurt via een bundler
window.laadBenodigdeDataVoorModal = laadBenodigdeDataVoorModal;

/**
 * Past de UI aan op basis van de geladen gebruikersinstellingen.
 */
function pasGebruikersInstellingenToe() {
    console.log("[VerlofroosterLogic] Toepassen gebruikersinstellingen:", gebruikersInstellingen);    // Apply theme based on user settings using our new theme system
    if (window.applyTheme) {
        window.applyTheme(gebruikersInstellingen.soortWeergave);
        console.log("[VerlofroosterLogic] Thema ingesteld op:", gebruikersInstellingen.soortWeergave);
    } else {
        // Fallback if theme-toggle.js hasn't loaded yet
        if (domRefsLogic.appBody) {
            domRefsLogic.appBody.classList.remove('light-theme', 'dark-theme');
            domRefsLogic.appBody.classList.add(gebruikersInstellingen.soortWeergave === 'dark' ? 'dark-theme' : 'light-theme');
            console.log("[VerlofroosterLogic] Thema ingesteld via fallback methode:", gebruikersInstellingen.soortWeergave);
        }
    }

    if (gebruikersInstellingen.eigenTeamWeergeven && window.huidigeGebruiker?.medewerkerData?.Team) {
        if (alleTeams && alleTeams.length > 0 && domRefsLogic.teamFilterSelect) {
            const eigenTeamObject = alleTeams.find(t => t.Title === window.huidigeGebruiker.medewerkerData.Team || t.Naam === window.huidigeGebruiker.medewerkerData.Team);
            if (eigenTeamObject && domRefsLogic.teamFilterSelect.querySelector(`option[value="${eigenTeamObject.ID}"]`)) {
                domRefsLogic.teamFilterSelect.value = eigenTeamObject.ID;
                console.log("[VerlofroosterLogic] Standaard teamfilter ingesteld op eigen team:", eigenTeamObject.Naam || eigenTeamObject.Title);
            }
        }
    }
}

/**
 * Update de datum header.
 */
function updateDatumHeader() {
    if (!domRefsLogic.currentMonthYear) return;
    const maandNamen = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];
    if (huidigeWeergave === 'maand') {
        domRefsLogic.currentMonthYear.textContent = `${maandNamen[huidigeDatumFocus.getMonth()]} ${huidigeDatumFocus.getFullYear()}`;
    } else {
        let startVanDeWeek = new Date(huidigeDatumFocus);
        let dagVanDeWeek = startVanDeWeek.getDay();
        let diff = startVanDeWeek.getDate() - dagVanDeWeek + (dagVanDeWeek === 0 ? -6 : 1);
        startVanDeWeek.setDate(diff);
        let eindVanDeWeek = new Date(startVanDeWeek);
        eindVanDeWeek.setDate(startVanDeWeek.getDate() + 6);
        if (startVanDeWeek.getMonth() === eindVanDeWeek.getMonth()) {
            domRefsLogic.currentMonthYear.textContent = `${startVanDeWeek.getDate()} - ${eindVanDeWeek.getDate()} ${maandNamen[startVanDeWeek.getMonth()]} ${startVanDeWeek.getFullYear()}`;
        } else if (startVanDeWeek.getFullYear() === eindVanDeWeek.getFullYear()) {
            domRefsLogic.currentMonthYear.textContent = `${startVanDeWeek.getDate()} ${maandNamen[startVanDeWeek.getMonth()].substring(0, 3)} - ${eindVanDeWeek.getDate()} ${maandNamen[eindVanDeWeek.getMonth()].substring(0, 3)} ${startVanDeWeek.getFullYear()}`;
        } else {
            domRefsLogic.currentMonthYear.textContent = `${startVanDeWeek.getDate()}/${startVanDeWeek.getMonth() + 1}/${startVanDeWeek.getFullYear()} - ${eindVanDeWeek.getDate()}/${eindVanDeWeek.getMonth() + 1}/${eindVanDeWeek.getFullYear()}`;
        }
    }
}

/**
 * Vult de team filter dropdown.
 */
function updateTeamFilter() {
    if (!domRefsLogic.teamFilterSelect) return;
    const huidigeSelectie = domRefsLogic.teamFilterSelect.value;
    domRefsLogic.teamFilterSelect.innerHTML = '<option value="all">Alle teams</option>';
    if (!alleTeams || alleTeams.length === 0) {
        console.warn("[VerlofroosterLogic] Geen teams beschikbaar om filter te vullen in updateTeamFilter.");
        return;
    }
    const gesorteerdeTeams = [...alleTeams].sort((a, b) => (a.Naam || a.Title || "").localeCompare(b.Naam || b.Title || ""));
    gesorteerdeTeams.forEach(team => {
        if (team.Actief) {
            const option = document.createElement('option');
            option.value = team.ID;
            option.textContent = team.Naam || team.Title;
            domRefsLogic.teamFilterSelect.appendChild(option);
        }
    });
    if (gebruikersInstellingen.eigenTeamWeergeven && window.huidigeGebruiker?.medewerkerData?.Team) {
        const eigenTeamObject = alleTeams.find(t => t.Title === window.huidigeGebruiker.medewerkerData.Team || t.Naam === window.huidigeGebruiker.medewerkerData.Team);
        if (eigenTeamObject && domRefsLogic.teamFilterSelect.querySelector(`option[value="${eigenTeamObject.ID}"]`)) {
            domRefsLogic.teamFilterSelect.value = eigenTeamObject.ID;
        } else if (domRefsLogic.teamFilterSelect.querySelector(`option[value="${huidigeSelectie}"]`)) {
            domRefsLogic.teamFilterSelect.value = huidigeSelectie;
        }
    } else if (domRefsLogic.teamFilterSelect.querySelector(`option[value="${huidigeSelectie}"]`)) {
        domRefsLogic.teamFilterSelect.value = huidigeSelectie;
    } else {
        domRefsLogic.teamFilterSelect.value = "all";
    }
}

/**
 * Update de legenda.
 */
function updateLegenda() {
    if (!domRefsLogic.legendaItemsContainer || !domRefsLogic.legendaSection) {
        console.warn("[VerlofroosterLogic] Legenda container of sectie niet gevonden.");
        return;
    }
    const container = domRefsLogic.legendaItemsContainer;
    const legendaTitelElement = document.getElementById('legenda-title');

    let currentChild = container.firstChild;
    while (currentChild) {
        let nextChild = currentChild.nextSibling;
        if (currentChild !== legendaTitelElement) {
            container.removeChild(currentChild);
        }
        currentChild = nextChild;
    }
    if (!container.querySelector('#legenda-title')) {
        const h3 = document.createElement('h3');
        h3.id = 'legenda-title';
        h3.className = "text-sm sm:text-md font-semibold text-gray-800 dark:text-gray-100 mr-2";
        h3.textContent = "Legenda:";
        container.insertBefore(h3, container.firstChild);
    }

    if (alleVerlofredenen && alleVerlofredenen.length > 0) {
        alleVerlofredenen.forEach(reden => {
            const span = document.createElement('span');
            span.className = "flex items-center text-xs sm:text-sm";
            const kleurBlok = document.createElement('span');
            kleurBlok.className = "w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm mr-1.5 flex-shrink-0";
            kleurBlok.style.backgroundColor = reden.Kleur || '#cccccc';
            span.appendChild(kleurBlok);
            span.appendChild(document.createTextNode(reden.Naam || reden.Title));
            container.appendChild(span);
        });
    }

    const compensatieLegendaSpan = document.createElement('span');
    compensatieLegendaSpan.className = "flex items-center text-xs sm:text-sm";
    const compensatieKleurBlok = document.createElement('span');
    compensatieKleurBlok.className = "w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm mr-1.5 flex-shrink-0";
    // compensatieKleurBlok.style.backgroundColor = '#107c10'; // Kleurblok niet meer nodig als we icoon gebruiken
    // compensatieLegendaSpan.appendChild(compensatieKleurBlok);

    // Gebruik het SVG icoon voor Compensatie in de legenda
    const compensatieIconImg = document.createElement('img');
    compensatieIconImg.src = 'Icoon/CompensatieUren.svg'; // Gebruik lokaal pad
    compensatieIconImg.alt = 'Compensatie';
    compensatieIconImg.className = 'w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 flex-shrink-0'; // Aangepaste grootte voor legenda
    compensatieLegendaSpan.appendChild(compensatieIconImg);

    compensatieLegendaSpan.appendChild(document.createTextNode("Compensatie"));
    // Clock icon is niet meer nodig als we het SVG icoon gebruiken
    // const clockIcon = document.createElement('span');
    // clockIcon.innerHTML = '&#x23F0;';
    // clockIcon.className = "ml-1";
    // compensatieLegendaSpan.appendChild(clockIcon);
    container.appendChild(compensatieLegendaSpan);

    // Legenda voor Horen Ja (Groen oor)
    const horenJaLegendaSpan = document.createElement('span');
    horenJaLegendaSpan.className = "flex items-center text-xs sm:text-sm";
    const horenJaIconImg = document.createElement('img');
    horenJaIconImg.src = 'Icoon/horen-ja.svg';
    horenJaIconImg.alt = 'Beschikbaar voor horen';
    horenJaIconImg.className = 'w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 flex-shrink-0';
    horenJaLegendaSpan.appendChild(horenJaIconImg);
    horenJaLegendaSpan.appendChild(document.createTextNode("Beschikbaar voor horen"));
    container.appendChild(horenJaLegendaSpan);

    // Legenda voor Horen Nee (Rood oor)
    const horenNeeLegendaSpan = document.createElement('span');
    horenNeeLegendaSpan.className = "flex items-center text-xs sm:text-sm";
    const horenNeeIconImg = document.createElement('img');
    horenNeeIconImg.src = 'Icoon/horen-nee.svg';
    horenNeeIconImg.alt = 'Niet beschikbaar voor horen';
    horenNeeIconImg.className = 'w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 flex-shrink-0';
    horenNeeLegendaSpan.appendChild(horenNeeIconImg);
    horenNeeLegendaSpan.appendChild(document.createTextNode("Niet beschikbaar voor horen"));
    container.appendChild(horenNeeLegendaSpan);
}

/**
 * Controleert of een gegeven datum vandaag is.
 * @param {Date} dag De te controleren datum.
 * @returns {boolean} True als de dag vandaag is, anders false.
 */
function isVandaag(dag) {
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);
    const teVergelijkenDag = new Date(dag);
    teVergelijkenDag.setHours(0, 0, 0, 0);
    return vandaag.getTime() === teVergelijkenDag.getTime();
}

// Gedeelte van Rooster/js/verlofrooster_logic.js

/**
 * Bepaalt een contrasterende tekstkleur (zwart/wit) voor een gegeven achtergrondkleur.
 * @param {string} hex - De hexadecimale kleurcode (bijv. "#RRGGBB").
 * @returns {string} De contrasterende tekstkleur ("#ffffff" of "#1f2937").
 */
function getContrasterendeTekstkleur(hex) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
        // Fallback naar standaard tekstkleur gebaseerd op thema als hex ongeldig is
        return document.body.classList.contains('dark-theme') ? '#f3f4f6' : '#1f2937';
    }
    const hexClean = hex.replace('#', '');
    // Accepteer zowel 3- als 6-karakter hex codes
    if (hexClean.length !== 3 && hexClean.length !== 6) {
        return document.body.classList.contains('dark-theme') ? '#f3f4f6' : '#1f2937';
    }

    let r, g, b;
    if (hexClean.length === 3) {
        r = parseInt(hexClean[0] + hexClean[0], 16);
        g = parseInt(hexClean[1] + hexClean[1], 16);
        b = parseInt(hexClean[2] + hexClean[2], 16);
    } else {
        r = parseInt(hexClean.substring(0, 2), 16);
        g = parseInt(hexClean.substring(2, 4), 16);
        b = parseInt(hexClean.substring(4, 6), 16);
    }

    // Controleer of parsen gelukt is
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return document.body.classList.contains('dark-theme') ? '#f3f4f6' : '#1f2937';
    }

    // WCAG contrast ratio formula (vereenvoudigd: luminantie > 0.5 ? donkere tekst : lichte tekst)
    // Luminantie berekening (0-255)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

    // Drempelwaarde voor leesbaarheid (kan aangepast worden)
    const threshold = 128;

    if (document.body.classList.contains('dark-theme')) {
        // Op
        return luminance > threshold ? '#111827' : '#f0f0f0'; // Tailwind gray-900 voor lichte kleuren, heel licht grijs voor donkere kleuren
    } else {
        // Op een lichte achtergrond
        return luminance > threshold ? '#1f2937' : '#ffffff'; // Tailwind gray-800 voor lichte kleuren, wit voor donkere kleuren
    }
}

/**
 * Helper functie om de dag prefix te krijgen voor UrenPerWeek velden (Maandag, Dinsdag, etc.).
 * @param {Date} date - De datum.
 * @returns {string|null} De prefix ("Maandag", "Dinsdag", etc.) of null voor weekenddagen.
 */
function getDayOfWeekPrefix(date) {
    if (!(date instanceof Date) || isNaN(date)) return null; // Controleer of date een valide Date object is
    const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    switch (dayIndex) {
        case 1: return 'Maandag';
        case 2: return 'Dinsdag';
        case 3: return 'Woensdag';
        case 4: return 'Donderdag';
        case 5: return 'Vrijdag';
        // Zaterdag en Zondag hebben geen prefix in UrenPerWeek, dus null
        default: return null;
    }
}

/**
 * Helper functie om de effectieve datum voor UrenPerWeek items te bepalen.
 * VeranderingsDatum heeft voorrang boven Ingangsdatum.
 * @param {object} upwItem - Het UrenPerWeek item.
 * @returns {Date|null} De effectieve datum of null als geen valide datum gevonden.
 */
function getUrenPerWeekEffectiveDate(upwItem) {
    if (!upwItem) return null;
    // VeranderingsDatum heeft voorrang indien aanwezig en geldig
    if (upwItem.VeranderingsDatum) {
        const veranderingsDatum = new Date(upwItem.VeranderingsDatum);
        // Controleer of het een valide datum is en niet een default "lege" datum zoals jaar 0001
        if (!isNaN(veranderingsDatum.getTime()) && veranderingsDatum.getFullYear() > 1900) {
            return veranderingsDatum;
        }
    }
    // Anders, gebruik Ingangsdatum indien aanwezig en geldig
    if (upwItem.Ingangsdatum) {
        const ingangsDatum = new Date(upwItem.Ingangsdatum);
        if (!isNaN(ingangsDatum.getTime()) && ingangsDatum.getFullYear() > 1900) {
            return ingangsDatum;
        }
    }
    // console.warn("[VerlofroosterLogic] Geen valide effectieve datum gevonden voor UrenPerWeek item:", upwItem);
    return null;
}

// DEFINITIE VAN TEKENROOSTER FUNCTIE START HIER
/**
 * Tekent het volledige rooster (header en data rijen).
 */
// /k.zip/js/verlofrooster_logic.js (vervang de hele functie)

/**
 * Tekent het volledige rooster (header en data rijen).
 */
// /k.zip/js/verlofrooster_logic.js (vervang de hele functie)

/**
 * Tekent het volledige rooster (header en data rijen).
 */
function tekenRooster() {
    console.log("[VerlofroosterLogic] Start tekenRooster.");
    if (!domRefsLogic.roosterDataRows || !domRefsLogic.roosterGridHeader) {
        console.error("[VerlofroosterLogic] Essentiële rooster DOM elementen niet gevonden voor tekenRooster.");
        return;
    }
    domRefsLogic.roosterDataRows.innerHTML = '';
    domRefsLogic.roosterGridHeader.innerHTML = `
        <div class="rooster-header-medewerker sticky left-0 p-2 font-semibold z-30 rounded-tl-md flex items-center text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700">
            <span>Medewerker</span>
            <button id="sort-medewerker-button" title="Sorteer medewerkers" class="ml-auto p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h13M3 8h9M3 12h9M3 16h5M21 12l-4 4-4-4M17 4v16"/></svg>
            </button>
        </div>`;

    updateDatumHeader();
    let dagenInPeriodeVolledig = [];
    let aantalDagenTotaal;
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);

    if (huidigeWeergave === 'maand') {
        aantalDagenTotaal = new Date(huidigeDatumFocus.getFullYear(), huidigeDatumFocus.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= aantalDagenTotaal; i++) {
            dagenInPeriodeVolledig.push(new Date(huidigeDatumFocus.getFullYear(), huidigeDatumFocus.getMonth(), i));
        }
    } else { // week weergave
        aantalDagenTotaal = 7;
        let dagVanDeWeek = huidigeDatumFocus.getDay();
        let startVanDeWeek = new Date(huidigeDatumFocus);
        let diff = startVanDeWeek.getDate() - dagVanDeWeek + (dagVanDeWeek === 0 ? -6 : 1);
        startVanDeWeek.setDate(diff);
        for (let i = 0; i < 7; i++) {
            const dag = new Date(startVanDeWeek);
            dag.setDate(startVanDeWeek.getDate() + i);
            dagenInPeriodeVolledig.push(dag);
        }
    }

    const dagenTonenInPeriode = gebruikersInstellingen.weekendenWeergeven ?
        dagenInPeriodeVolledig :
        dagenInPeriodeVolledig.filter(dag => dag.getDay() !== 0 && dag.getDay() !== 6);

    const effectiefAantalDagenVoorGrid = dagenTonenInPeriode.length;
    const minCellWidth = gebruikersInstellingen.weekendenWeergeven ? 40 : 50;

    domRefsLogic.roosterGridHeader.style.gridTemplateColumns = `minmax(180px, 1.5fr) repeat(${effectiefAantalDagenVoorGrid}, minmax(${minCellWidth}px, 1fr))`;

    const dagNamenKort = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
    dagenTonenInPeriode.forEach(dag => {
        const dagDiv = document.createElement('div');
        dagDiv.className = "dag-header rooster-header-dag p-1.5 text-center text-xs border-r border-gray-300 dark:border-gray-600 last:border-r-0";
        dagDiv.innerHTML = `${dagNamenKort[dag.getDay()]}<br>${dag.getDate()}`;
        if (dag.toDateString() === vandaag.toDateString()) {
            dagDiv.classList.add("dag-header-vandaag");
        }

        if (document.body.classList.contains('dark-theme')) {
            dagDiv.classList.add('bg-gray-700', 'text-gray-200');
        } else {
            dagDiv.classList.add('bg-gray-200', 'text-gray-700');
        }
        domRefsLogic.roosterGridHeader.appendChild(dagDiv);
    });

    const geselecteerdTeamId = domRefsLogic.teamFilterSelect ? domRefsLogic.teamFilterSelect.value : 'all';
    const zoekTerm = domRefsLogic.roosterSearchInput ? domRefsLogic.roosterSearchInput.value.toLowerCase() : '';

    const gesorteerdeMedewerkers = [...alleMedewerkers]
        .filter(mwd => mwd.Actief && !mwd.Verbergen)
        .sort((a, b) => {
            const teamA = a.Team || '';
            const teamB = b.Team || '';
            if (teamA.localeCompare(teamB) !== 0) {
                return teamA.localeCompare(teamB);
            }
            const valA = (a[sorteerKolomMedewerker] || '').toLowerCase();
            const valB = (b[sorteerKolomMedewerker] || '').toLowerCase();
            if (valA < valB) return sorteerRichtingMedewerker === 'asc' ? -1 : 1;
            if (valA > valB) return sorteerRichtingMedewerker === 'asc' ? 1 : -1;
            return 0;
        });

    let gefilterdeMedewerkers = gesorteerdeMedewerkers.filter(mwd => {
        const teamObject = alleTeams.find(t => t.Title === mwd.Team || t.Naam === mwd.Team);
        const teamIdVoorFilter = teamObject ? teamObject.ID : null;
        const teamMatch = geselecteerdTeamId === 'all' || (teamIdVoorFilter && teamIdVoorFilter == geselecteerdTeamId);
        const naamMatch = (mwd.Naam || mwd.Title || '').toLowerCase().includes(zoekTerm);
        return teamMatch && naamMatch;
    });

    if (gefilterdeMedewerkers.length === 0) {
        domRefsLogic.roosterDataRows.innerHTML = `<div class="col-span-full text-center p-4 text-gray-500 dark:text-gray-400">Geen medewerkers gevonden voor de huidige selectie.</div>`;
        return;
    }

    let huidigTeamNaamRender = null;
    gefilterdeMedewerkers.forEach(medewerker => {
        if (!medewerker.Username) {
            console.warn(`[VerlofroosterLogic] Medewerker ${medewerker.Naam || medewerker.Title} heeft geen Username, wordt overgeslagen in rooster.`);
            return;
        }

        if (medewerker.Team !== huidigTeamNaamRender) {
            huidigTeamNaamRender = medewerker.Team;
            const teamObject = alleTeams.find(t => t.Title === huidigTeamNaamRender || t.Naam === huidigTeamNaamRender);

            if (teamObject) {
                const teamHeaderDiv = document.createElement('div');
                teamHeaderDiv.className = `team-header-rij p-2 font-semibold text-sm sticky left-0 z-10`;
                teamHeaderDiv.style.gridColumn = `1 / span ${effectiefAantalDagenVoorGrid + 1}`;
                teamHeaderDiv.textContent = huidigTeamNaamRender || "Team Onbekend";

                const teamKleur = teamObject.Kleur || (domRefsLogic.appBody.classList.contains('dark-theme') ? '#374151' : '#e5e7eb');
                teamHeaderDiv.style.backgroundColor = teamKleur;
                teamHeaderDiv.style.color = getContrasterendeTekstkleur(teamKleur);

                teamHeaderDiv.style.borderBottom = `1px solid var(--grid-line-color, #d1d5db)`;
                teamHeaderDiv.style.borderTop = `1px solid var(--grid-line-color, #d1d5db)`;
                domRefsLogic.roosterDataRows.appendChild(teamHeaderDiv);
            }
        }
        const rijDiv = document.createElement('div');
        rijDiv.className = "medewerker-rij grid gap-px";
        rijDiv.style.gridTemplateColumns = `minmax(180px, 1.5fr) repeat(${effectiefAantalDagenVoorGrid}, minmax(${minCellWidth}px, 1fr))`;
        if (medewerker.ID) {
            rijDiv.dataset.medewerkerId = medewerker.ID;
            rijDiv.addEventListener('click', handleRijSelectie);
        } else {
            console.warn("[VerlofroosterLogic] Medewerker zonder ID gevonden:", medewerker);
        }
        const naamDiv = document.createElement('div');
        naamDiv.className = 'rooster-cel-medewerker sticky left-0 p-2 z-20 border-b border-r min-w-[180px] max-w-[180px]';

        if (document.body.classList.contains('dark-theme')) {
            naamDiv.classList.add('bg-gray-800', 'text-gray-200', 'border-gray-600');
        } else {
            naamDiv.classList.add('bg-white', 'text-gray-800', 'border-gray-300');
        }
        if (typeof window.getProfilePhotoUrl === 'function') {
            const img = document.createElement('img');
            img.src = window.getProfilePhotoUrl(medewerker, 'S');
            img.alt = `Foto ${medewerker.Naam || 'medewerker'}`;
            img.className = 'flex-shrink-0 w-8 h-8 rounded-full mr-2 object-cover';
            img.onerror = function () { this.src = 'Icoon/default-profile.svg'; this.alt = 'Standaard profielicoon'; };
            const profileAndNameContainer = document.createElement('div');
            profileAndNameContainer.className = 'flex items-start w-full';

            profileAndNameContainer.appendChild(img);

            const nameRow = document.createElement('div');
            nameRow.className = 'flex items-center w-full justify-between';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-medium text-sm text-black';
            nameSpan.textContent = medewerker.Naam || 'Onbekend';
            nameRow.appendChild(nameSpan);

            if (medewerker.hasOwnProperty('Horen')) {
                const horenIcon = document.createElement('img');
                horenIcon.src = medewerker.Horen ? 'Icoon/horen-ja.svg' : 'Icoon/horen-nee.svg';
                horenIcon.alt = medewerker.Horen ? 'Beschikbaar voor horen' : 'Niet beschikbaar voor horen';
                horenIcon.className = 'w-4 h-4 flex-shrink-0';
                nameRow.appendChild(horenIcon);
            }

            profileAndNameContainer.appendChild(nameRow);
            naamDiv.appendChild(profileAndNameContainer);
        } else {
            const textContainer = document.createElement('div');
            textContainer.className = 'flex items-center w-full justify-between';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-medium text-sm text-black';
            nameSpan.textContent = medewerker.Naam || 'Onbekend';
            textContainer.appendChild(nameSpan);

            if (medewerker.hasOwnProperty('Horen')) {
                const horenIcon = document.createElement('img');
                horenIcon.src = medewerker.Horen ? 'Icoon/horen-ja.svg' : 'Icoon/horen-nee.svg';
                horenIcon.alt = medewerker.Horen ? 'Beschikbaar voor horen' : 'Niet beschikbaar voor horen';
                horenIcon.className = 'w-4 h-4 flex-shrink-0';
                textContainer.appendChild(horenIcon);
            }

            naamDiv.appendChild(textContainer);
        }
        naamDiv.title = `${medewerker.Naam || 'Onbekend'}${medewerker.Functie ? ' - ' + medewerker.Functie : ''}`;

        if (typeof window.showProfileCard === 'function' && typeof window.delayedHideProfileCard === 'function') {
            naamDiv.addEventListener('mouseenter', (event) => window.showProfileCard(medewerker, event.currentTarget));
            naamDiv.addEventListener('mouseleave', window.delayedHideProfileCard);
        }
        rijDiv.appendChild(naamDiv);

        dagenTonenInPeriode.forEach((dag, index) => {
            const isWeekend = (dag.getDay() === 0 || dag.getDay() === 6);
            const isVandaagCel = isVandaag(dag);

            const celDiv = document.createElement('div');
            celDiv.className = `rooster-cel p-1 ${isWeekend && gebruikersInstellingen.weekendenWeergeven ? 'bg-gray-50 dark:bg-gray-850' : ''} ${isVandaagCel ? 'vandaag' : ''}`;
            celDiv.style.gridColumnStart = index + 2;
            celDiv.dataset.datum = dag.toISOString().split('T')[0];

            if (document.body.classList.contains('dark-theme')) {
                celDiv.classList.add('bg-gray-800', 'text-gray-200');
            } else {
                celDiv.classList.add('bg-white', 'text-gray-800');
            }
            const dagNormaal = new Date(dag.getFullYear(), dag.getMonth(), dag.getDate());
            const genormaliseerdeMedewerkerUsername = typeof window.trimLoginNaamPrefixMachtigingen === 'function' ? window.trimLoginNaamPrefixMachtigingen(medewerker.Username) : medewerker.Username; let cellIsFilled = false;
            let eventItems = []; // Collect all events for this cell

            if (alleVerlofItems.length === 0) {
                console.warn("[VerlofroosterLogic] alleVerlofItems is empty. No verlof items to display.");
            } else {
                console.log(`[VerlofroosterLogic] Processing ${alleVerlofItems.length} verlof items for display`);
            }

            const verlofOpDag = alleVerlofItems.filter(item => {
                if (!item.MedewerkerID) {
                    console.error("[VerlofroosterLogic] Found Verlof item without MedewerkerID:", item);
                    return false;
                }

                const itemMedewerkerID = (item.MedewerkerID && typeof item.MedewerkerID === 'string') ?
                    (typeof window.trimLoginNaamPrefix === 'function' ?
                        window.trimLoginNaamPrefix(item.MedewerkerID) :
                        item.MedewerkerID) :
                    '';

                if (itemMedewerkerID === genormaliseerdeMedewerkerUsername) {
                    const startDate = new Date(item.StartDatum);
                    const endDate = new Date(item.EindDatum);

                    const startDateNoTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const endDateNoTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

                    const isStartDateValid = !isNaN(startDate.getTime()) && startDate.getFullYear() > 1970;
                    const isEndDateValid = !isNaN(endDate.getTime()) && endDate.getFullYear() > 1970;

                    console.log(`[VerlofroosterLogic] Found verlof item for ${medewerker.Naam || 'unknown'} (${genormaliseerdeMedewerkerUsername}):`);
                    console.log(`  - Original MedewerkerID: "${item.MedewerkerID}"`);
                    console.log(`  - Normalized MedewerkerID: "${itemMedewerkerID}"`);
                    console.log(`  - Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
                    console.log(`  - Dates valid: Start=${isStartDateValid}, End=${isEndDateValid}`);
                    console.log(`  - Current day: ${dagNormaal.toLocaleDateString()}`);
                    console.log(`  - Date check: ${(isStartDateValid && isEndDateValid) ? (startDateNoTime <= dagNormaal && endDateNoTime >= dagNormaal ? 'MATCH' : 'NO MATCH') : 'INVALID DATES'}`);
                }

                const startDate = new Date(item.StartDatum);
                const endDate = new Date(item.EindDatum);

                const startDateNoTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const endDateNoTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

                const isStartDateValid = !isNaN(startDate.getTime()) && startDate.getFullYear() > 1970;
                const isEndDateValid = !isNaN(endDate.getTime()) && endDate.getFullYear() > 1970;

                return itemMedewerkerID === genormaliseerdeMedewerkerUsername &&
                    isStartDateValid && isEndDateValid &&
                    startDateNoTime <= dagNormaal &&
                    endDateNoTime >= dagNormaal;
            });

            // Check for compensatie items on this day
            const compensatieOpDag = alleCompensatieUrenItems.filter(item => {
                if (!item || !item.MedewerkerID || !item.StartCompensatieUren || !item.EindeCompensatieUren) return false;
                const itemMedewerkerID = (typeof item.MedewerkerID === 'string') ? (typeof window.trimLoginNaamPrefix === 'function' ? window.trimLoginNaamPrefix(item.MedewerkerID) : item.MedewerkerID) : '';
                try {
                    const startDatumTijd = new Date(item.StartCompensatieUren);
                    const eindDatumTijd = new Date(item.EindeCompensatieUren);
                    if (isNaN(startDatumTijd.getTime()) || isNaN(eindDatumTijd.getTime())) return false;
                    const startDate = new Date(startDatumTijd.getFullYear(), startDatumTijd.getMonth(), startDatumTijd.getDate());
                    const endDate = new Date(eindDatumTijd.getFullYear(), eindDatumTijd.getMonth(), eindDatumTijd.getDate());
                    return itemMedewerkerID === genormaliseerdeMedewerkerUsername && startDate <= dagNormaal && endDate >= dagNormaal;
                } catch (e) {
                    console.error(`[VerlofroosterLogic] Fout bij vergelijken van datums voor compensatie:`, e);
                    return false;
                }
            });

            if (verlofOpDag.length > 0) {
                const item = verlofOpDag[0];
                const verlofRedenInfo = alleVerlofredenen.find(r => r.ID == item.RedenId || r.Title === item.Reden);
                const achtergrondKleur = verlofRedenInfo ? (verlofRedenInfo.Kleur || '#888888') : '#888888';

                // Add verlof item to events collection
                eventItems.push({
                    type: 'verlof',
                    id: item.ID,
                    title: verlofRedenInfo?.Naam || verlofRedenInfo?.Title || "Verlof",
                    subtitle: `${new Date(item.StartDatum).toLocaleDateString()} - ${new Date(item.EindDatum).toLocaleDateString()}`,
                    description: item.Omschrijving,
                    data: item,
                    icon: '🏖️',
                    ownerUsername: (typeof window.trimLoginNaamPrefix === 'function' ? window.trimLoginNaamPrefix(item.MedewerkerID) : item.MedewerkerID)
                });

                celDiv.style.setProperty('background-color', achtergrondKleur, 'important');
                celDiv.style.setProperty('position', 'relative', 'important');
                celDiv.innerHTML = '';

                const tag = document.createElement('span');
                tag.className = 'rooster-cel-tag px-1.5 py-0.5 rounded text-center';
                tag.textContent = (verlofRedenInfo?.Naam || verlofRedenInfo?.Title || "Verlof").substring(0, 3).toUpperCase();
                tag.style.color = getContrasterendeTekstkleur(achtergrondKleur);
                tag.style.display = 'inline-flex';
                tag.style.alignItems = 'center';
                tag.style.justifyContent = 'center';
                tag.style.fontSize = '0.75rem';
                celDiv.appendChild(tag);

                let titelTekstVerlof = `Verlof: ${medewerker.Naam || medewerker.Title}`;
                if (verlofRedenInfo) titelTekstVerlof += `\nReden: ${verlofRedenInfo.Naam || verlofRedenInfo.Title}`;
                titelTekstVerlof += `\nPeriode: ${new Date(item.StartDatum).toLocaleDateString()} - ${new Date(item.EindDatum).toLocaleDateString()}`;
                if (item.Omschrijving) titelTekstVerlof += `\nOmschrijving: ${item.Omschrijving}`;
                celDiv.title = titelTekstVerlof.replace(/\\n/g, '\n');

                // NIEUW: DATA-ATTRIBUTEN VOOR CONTEXTMENU
                celDiv.dataset.eventType = 'verlof';
                celDiv.dataset.eventId = item.ID;
                celDiv.dataset.ownerUsername = (typeof window.trimLoginNaamPrefix === 'function' ? window.trimLoginNaamPrefix(item.MedewerkerID) : item.MedewerkerID);
                cellIsFilled = true;
                if (compensatieOpDag.length > 0) {
                    const compensatieItem = compensatieOpDag[0];

                    // Add compensatie item to events collection
                    eventItems.push({
                        type: 'compensatie',
                        id: compensatieItem.ID,
                        title: 'Compensatie Uren',
                        subtitle: `${new Date(compensatieItem.StartCompensatieUren).toLocaleString()} - ${new Date(compensatieItem.EindeCompensatieUren).toLocaleString()}`,
                        description: compensatieItem.Omschrijving,
                        data: compensatieItem,
                        icon: '⏱️',
                        ownerUsername: (typeof window.trimLoginNaamPrefix === 'function' ? window.trimLoginNaamPrefix(compensatieItem.MedewerkerID) : compensatieItem.MedewerkerID)
                    });

                    const overlayIcon = document.createElement('img');
                    overlayIcon.src = 'Icoon/CompensatieUren.svg';
                    overlayIcon.alt = 'Compensatie';
                    overlayIcon.className = 'rooster-cel-icon-compensatie-overlay';
                    overlayIcon.style.position = 'absolute';
                    overlayIcon.style.top = '2px';
                    overlayIcon.style.right = '2px';
                    overlayIcon.style.width = '18px';
                    overlayIcon.style.height = '18px';
                    overlayIcon.style.opacity = '0.7';
                    overlayIcon.style.pointerEvents = 'none';
                    celDiv.appendChild(overlayIcon);
                }
            } else if (compensatieOpDag.length > 0) {
                // If no verlof but there is compensatie, show just the compensatie
                const item = compensatieOpDag[0];

                // Add compensatie item to events collection
                eventItems.push({
                    type: 'compensatie',
                    id: item.ID,
                    title: 'Compensatie Uren',
                    subtitle: `${new Date(item.StartCompensatieUren).toLocaleString()} - ${new Date(item.EindeCompensatieUren).toLocaleString()}`,
                    description: item.Omschrijving,
                    data: item,
                    icon: '⏱️',
                    ownerUsername: (typeof window.trimLoginNaamPrefix === 'function' ? window.trimLoginNaamPrefix(item.MedewerkerID) : item.MedewerkerID)
                });

                celDiv.style.setProperty('position', 'relative', 'important');
                const iconImg = document.createElement('img');
                iconImg.src = 'Icoon/CompensatieUren.svg';
                iconImg.alt = 'Compensatie';
                iconImg.className = 'rooster-cel-icon-compensatie-overlay';
                iconImg.style.position = 'absolute';
                iconImg.style.top = '2px';
                iconImg.style.right = '2px';
                iconImg.style.width = '18px';
                iconImg.style.height = '18px';
                iconImg.style.opacity = '0.7';
                iconImg.style.pointerEvents = 'none';
                celDiv.appendChild(iconImg);
                let titleText = celDiv.title || '';
                titleText += (titleText ? '\n' : '') + `Compensatie: ${medewerker.Naam || medewerker.Title}`;
                titleText += `\nPeriode: ${new Date(item.StartCompensatieUren).toLocaleString()} - ${new Date(item.EindeCompensatieUren).toLocaleString()}`;
                if (item.Omschrijving) titleText += `\nOmschrijving: ${item.Omschrijving}`;
                celDiv.title = titleText.replace(/\\n/g, '\n');

                // NIEUW: DATA-ATTRIBUTEN VOOR CONTEXTMENU
                celDiv.dataset.eventType = 'compensatie';
                celDiv.dataset.eventId = item.ID;
                celDiv.dataset.ownerUsername = (typeof window.trimLoginNaamPrefix === 'function' ? window.trimLoginNaamPrefix(item.MedewerkerID) : item.MedewerkerID);

                cellIsFilled = true;
            }

            // Setup layered events functionality if there are multiple events
            if (eventItems.length > 1) {
                celDiv.classList.add('has-layered-events', 'event-cell');
                setupLayeredEventsPopup(celDiv, eventItems, medewerker);
            } else if (eventItems.length === 1) {
                celDiv.classList.add('event-cell');
            }
            if (!cellIsFilled) {
                const zittingVrijOpDagItems = alleIncidenteelZittingVrijItems.filter(item => {
                    const genormaliseerdeItemUsername = typeof window.trimLoginNaamPrefixMachtigingen === 'function' ? window.trimLoginNaamPrefixMachtigingen(item.Gebruikersnaam) : item.Gebruikersnaam;
                    if (genormaliseerdeItemUsername !== genormaliseerdeMedewerkerUsername) return false;
                    const startDateCandidate = item.ZittingsVrijeDagTijd;
                    if (!startDateCandidate) return false;
                    const startDate = new Date(startDateCandidate);
                    if (isNaN(startDate.getTime())) return false;
                    startDate.setHours(0, 0, 0, 0);
                    const endDateFieldCandidate = item.ZittingsVrijeDagTijdEind || item.ZittingsVrijeDagTijd;
                    if (!endDateFieldCandidate) return false;
                    const endDate = new Date(endDateFieldCandidate);
                    if (isNaN(endDate.getTime())) return false;
                    endDate.setHours(23, 59, 59, 999);
                    if (item.Terugkerend) {
                        const terugkerendTotCandidate = item.TerugkerendTot;
                        if (!terugkerendTotCandidate) return false;
                        const terugkerendTotDate = new Date(terugkerendTotCandidate);
                        if (isNaN(terugkerendTotDate.getTime())) return false;
                        terugkerendTotDate.setHours(23, 59, 59, 999);
                        if (dagNormaal < startDate || dagNormaal > terugkerendTotDate) return false;
                        const originalEventDayOfWeek = new Date(item.ZittingsVrijeDagTijd).getDay();
                        const originalEventDateOfMonth = new Date(item.ZittingsVrijeDagTijd).getDate();
                        switch (item.TerugkeerPatroon) {
                            case "Wekelijks": return dagNormaal.getDay() === originalEventDayOfWeek;
                            case "Maandelijks": return dagNormaal.getDate() === originalEventDateOfMonth;
                            default: return false;
                        }
                    } else {
                        return dagNormaal >= startDate && dagNormaal <= endDate;
                    }
                });
                if (zittingVrijOpDagItems.length > 0) {
                    const item = zittingVrijOpDagItems[0];
                    const achtergrondKleur = '#F59E0B';
                    celDiv.style.setProperty('background-color', achtergrondKleur, 'important');
                    celDiv.style.setProperty('position', 'relative', 'important');
                    celDiv.innerHTML = '';
                    const tag = document.createElement('span');
                    tag.className = 'rooster-cel-tag px-1.5 py-0.5 rounded text-center';
                    tag.textContent = 'ZTV';
                    tag.style.color = getContrasterendeTekstkleur(achtergrondKleur);
                    tag.style.display = 'inline-flex';
                    tag.style.alignItems = 'center';
                    tag.style.justifyContent = 'center';
                    tag.style.fontSize = '0.75rem';
                    celDiv.appendChild(tag);
                    let titelTekstZittingVrij = `Zittingvrij: ${medewerker.Naam || medewerker.Title}`;
                    titelTekstZittingVrij += `\nStart: ${new Date(item.ZittingsVrijeDagTijd).toLocaleString('nl-NL')}`;
                    if (item.ZittingsVrijeDagTijdEind) {
                        titelTekstZittingVrij += `\nEind: ${new Date(item.ZittingsVrijeDagTijdEind).toLocaleString('nl-NL')}`;
                    }
                    if (item.Terugkerend && item.TerugkeerPatroon && item.TerugkerendTot) {
                        titelTekstZittingVrij += `\nPatroon: ${item.TerugkeerPatroon}, tot: ${new Date(item.TerugkerendTot).toLocaleDateString('nl-NL')}`;
                    }
                    celDiv.title = titelTekstZittingVrij.replace(/\\n/g, '\n');

                    // NIEUW: DATA-ATTRIBUTEN VOOR CONTEXTMENU
                    celDiv.dataset.eventType = 'zittingvrij';
                    celDiv.dataset.eventId = item.ID;
                    celDiv.dataset.ownerUsername = (typeof window.trimLoginNaamPrefix === 'function' ? window.trimLoginNaamPrefix(item.Gebruikersnaam) : item.Gebruikersnaam);

                    cellIsFilled = true;
                }
            }

            if (!cellIsFilled) {
                const dayPrefix = getDayOfWeekPrefix(dagNormaal);
                if (dayPrefix && alleUrenPerWeekItems && alleUrenPerWeekItems.length > 0) {
                    const medewerkerSchedules = alleUrenPerWeekItems
                        .filter(upw => {
                            const effectiveDate = getUrenPerWeekEffectiveDate(upw);
                            return (typeof window.trimLoginNaamPrefixMachtigingen === 'function' ? window.trimLoginNaamPrefixMachtigingen(upw.MedewerkerID) : upw.MedewerkerID) === genormaliseerdeMedewerkerUsername &&
                                effectiveDate && effectiveDate <= dagNormaal;
                        })
                        .sort((a, b) => {
                            const dateA = getUrenPerWeekEffectiveDate(a);
                            const dateB = getUrenPerWeekEffectiveDate(b);
                            if (!dateA && !dateB) return 0;
                            if (!dateA) return 1;
                            if (!dateB) return -1;
                            return dateB.getTime() - dateA.getTime();
                        });

                    if (medewerkerSchedules.length > 0) {
                        const activeSchedule = medewerkerSchedules[0];
                        const daySoortField = dayPrefix + "Soort";
                        const daySoort = activeSchedule[daySoortField];

                        if (daySoort && (daySoort === "VVO" || daySoort === "VVM" || daySoort === "VVD")) {
                            const indicatorInfo = alleDagenIndicators.find(indicator => indicator.Title === daySoort);
                            if (indicatorInfo) {
                                celDiv.style.backgroundColor = indicatorInfo.Kleur || '#E0E0E0';
                                celDiv.innerHTML = '';
                                const tag = document.createElement('span');
                                tag.className = 'rooster-cel-tag px-1.5 py-0.5 rounded text-center';
                                if (indicatorInfo.Patroon && (indicatorInfo.Patroon.startsWith('&') || indicatorInfo.Patroon.startsWith('<svg'))) {
                                    tag.innerHTML = indicatorInfo.Patroon;
                                } else {
                                    tag.textContent = indicatorInfo.Title;
                                }
                                tag.style.color = getContrasterendeTekstkleur(indicatorInfo.Kleur);
                                tag.style.display = 'inline-flex';
                                tag.style.alignItems = 'center';
                                tag.style.justifyContent = 'center';
                                tag.style.fontSize = '0.75rem';
                                celDiv.appendChild(tag);
                                let hoverTitle = indicatorInfo.Beschrijving || indicatorInfo.Title || daySoort;
                                const startField = dayPrefix + "Start";
                                const eindField = dayPrefix + "Eind";
                                if (activeSchedule[startField] && activeSchedule[eindField]) {
                                    hoverTitle += ` (${activeSchedule[startField]} - ${activeSchedule[eindField]})`;
                                }
                                celDiv.title = hoverTitle.trim().replace(/\\n/g, '\n');
                                cellIsFilled = true;
                            }
                        }
                    }
                }
            }

            if (!cellIsFilled) {
                const indicatorVoorDag = alleDagenIndicators.find(indicator => {
                    let dateMatch = false;
                    if (indicator.Beschrijving) {
                        const descDateMatchDDMMYYYY = indicator.Beschrijving.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                        const descDateMatchYYYYMMDD = indicator.Beschrijving.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                        let parsedIndicatorDate = null;
                        if (descDateMatchDDMMYYYY) parsedIndicatorDate = new Date(Date.UTC(parseInt(descDateMatchDDMMYYYY[3]), parseInt(descDateMatchDDMMYYYY[2]) - 1, parseInt(descDateMatchDDMMYYYY[1])));
                        else if (descDateMatchYYYYMMDD) parsedIndicatorDate = new Date(Date.UTC(parseInt(descDateMatchYYYYMMDD[1]), parseInt(descDateMatchYYYYMMDD[2]) - 1, parseInt(descDateMatchYYYYMMDD[3])));
                        if (parsedIndicatorDate && !isNaN(parsedIndicatorDate.getTime())) {
                            const dagNormaalUTC = new Date(Date.UTC(dagNormaal.getFullYear(), dagNormaal.getMonth(), dagNormaal.getDate()));
                            if (parsedIndicatorDate.getTime() === dagNormaalUTC.getTime()) dateMatch = true;
                        }
                    }
                    if (dateMatch) return true;
                    return false;
                });

                if (indicatorVoorDag) {
                    celDiv.style.backgroundColor = indicatorVoorDag.Kleur || '#E0E0E0';
                    celDiv.innerHTML = '';
                    const tag = document.createElement('span');
                    tag.className = 'rooster-cel-tag px-1.5 py-0.5 rounded text-center';
                    if (indicatorVoorDag.Patroon && (indicatorVoorDag.Patroon.startsWith('&') || indicatorVoorDag.Patroon.startsWith('<svg'))) tag.innerHTML = indicatorVoorDag.Patroon;
                    else if (indicatorVoorDag.Title) tag.textContent = indicatorVoorDag.Title.substring(0, 1).toUpperCase();
                    else tag.textContent = 'I';
                    tag.style.color = getContrasterendeTekstkleur(indicatorVoorDag.Kleur);
                    tag.style.display = 'inline-flex';
                    tag.style.alignItems = 'center';
                    tag.style.justifyContent = 'center';
                    tag.style.fontSize = '0.75rem';
                    celDiv.appendChild(tag);
                    let hoverTitle = indicatorVoorDag.Title || "Indicator";
                    const isBeschrijvingDate = indicatorVoorDag.Beschrijving && (indicatorVoorDag.Beschrijving.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/) || indicatorVoorDag.Beschrijving.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/));
                    if (indicatorVoorDag.Beschrijving && !isBeschrijvingDate) hoverTitle += ` (${indicatorVoorDag.Beschrijving})`;
                    celDiv.title = hoverTitle.trim().replace(/\\n/g, '\n');
                    cellIsFilled = true;
                }
            }

            if (gebruikersInstellingen.weekendenWeergeven && !cellIsFilled && (dag.getDay() === 0 || dag.getDay() === 6)) {
                celDiv.classList.add("rooster-cel-weekend");
            }

            if (dag.toDateString() === vandaag.toDateString()) {
                celDiv.classList.add("rooster-cel-vandaag");
            }
            rijDiv.appendChild(celDiv);
        });
        domRefsLogic.roosterDataRows.appendChild(rijDiv);
    });
    console.log("[VerlofroosterLogic] Einde tekenRooster.");

    setTimeout(ensureWeekendStyling, 100);
}
/**
 * Ensures that weekend cells are properly styled in the roster
 * This function reinforces weekend styling after DOM updates
 */
function ensureWeekendStyling() {
    // Get all cells with the weekend class
    const weekendCells = document.querySelectorAll('.rooster-cel-weekend');

    weekendCells.forEach(cell => {
        if (document.body.classList.contains('dark-theme')) {
            cell.style.backgroundColor = '#111827';
        } else {
            cell.style.backgroundColor = '#e5e7eb';
        }
    });

    console.log("[VerlofroosterLogic] Weekend cell styling reinforced");
}

// Hook this into the existing theme change event
document.addEventListener('themeChanged', ensureWeekendStyling);

/**
 * Handler voor het selecteren/deselecteren van een medewerker rij.
 */
function handleRijSelectie(event) {
    const geklikteRij = event.currentTarget;
    const medewerkerIdVanGeklikteRij = geklikteRij.dataset.medewerkerId;

    const medewerker = alleMedewerkers.find(m => m.ID.toString() === medewerkerIdVanGeklikteRij);

    if (geselecteerdeMedewerkerId && geselecteerdeMedewerkerId !== medewerkerIdVanGeklikteRij) {
        const vorigeGeselecteerdeRij = domRefsLogic.roosterDataRows.querySelector(`.medewerker-rij[data-medewerker-id="${geselecteerdeMedewerkerId}"]`);
        if (vorigeGeselecteerdeRij) {
            vorigeGeselecteerdeRij.classList.remove('selected-row');
        }
    }

    if (geselecteerdeMedewerkerId === medewerkerIdVanGeklikteRij) {
        geklikteRij.classList.remove('selected-row');
        geselecteerdeMedewerkerId = null;
        geselecteerdeMedewerkerUsername = null;
        geselecteerdeMedewerkerNaam = null;
        console.log(`[VerlofroosterLogic] Medewerker ${medewerkerIdVanGeklikteRij} gedeselecteerd.`);
    } else {
        geklikteRij.classList.add('selected-row');
        geselecteerdeMedewerkerId = medewerkerIdVanGeklikteRij;
        if (medewerker) {
            geselecteerdeMedewerkerUsername = medewerker.Username;
            geselecteerdeMedewerkerNaam = medewerker.Naam || medewerker.Title;
        } else {
            geselecteerdeMedewerkerUsername = null;
            geselecteerdeMedewerkerNaam = null;
            console.warn(`[VerlofroosterLogic] Kon data niet vinden voor geselecteerde medewerker ID: ${medewerkerIdVanGeklikteRij}`);
        }
        console.log(`[VerlofroosterLogic] Medewerker ${geselecteerdeMedewerkerNaam} (ID: ${geselecteerdeMedewerkerId}, User: ${geselecteerdeMedewerkerUsername}) geselecteerd.`);
    }
    // Export to window for use by other scripts
    window.geselecteerdeMedewerkerId = geselecteerdeMedewerkerId;
    window.geselecteerdeMedewerkerUsername = geselecteerdeMedewerkerUsername;
    window.geselecteerdeMedewerkerNaam = geselecteerdeMedewerkerNaam;
}

// Export the row selection function for use by other scripts
window.handleRijSelectie = handleRijSelectie;


/**
 * Handler voor klikken buiten de roosterrijen om selectie op te heffen.
 */
function handleDocumentKlikVoorDeselectie(event) {
    if (geselecteerdeMedewerkerId && domRefsLogic.roosterDataRows) {
        const isKlikBinnenEenRij = event.target.closest('.medewerker-rij');
        const isKlikBinnenFAB = event.target.closest('#fab-add-button') || event.target.closest('#fab-menu');
        const isKlikBinnenModal = event.target.closest('#modal-placeholder');

        if (!isKlikBinnenEenRij && !isKlikBinnenFAB && !isKlikBinnenModal) {
            const geselecteerdeRijElement = domRefsLogic.roosterDataRows.querySelector(`.medewerker-rij[data-medewerker-id="${geselecteerdeMedewerkerId}"]`);
            if (geselecteerdeRijElement) {
                geselecteerdeRijElement.classList.remove('selected-row');
            }
            console.log(`[VerlofroosterLogic] Medewerker ${geselecteerdeMedewerkerId} gedeselecteerd door buiten de grid/FAB/modal te klikken.`);
            geselecteerdeMedewerkerId = null;
            geselecteerdeMedewerkerUsername = null;
            geselecteerdeMedewerkerNaam = null;

            // Update window globals
            window.geselecteerdeMedewerkerId = null;
            window.geselecteerdeMedewerkerUsername = null;
            window.geselecteerdeMedewerkerNaam = null;
        }
    }
}

/**
 * Toont een notificatie bericht.
 */
function toonNotificatie(bericht, type = 'info', autoHideDelay = 5000) {
    if (!domRefsLogic.notificationPlaceholder) {
        console.warn("[VerlofroosterLogic] Notification placeholder niet gevonden. Bericht:", bericht);
        return;
    }
    domRefsLogic.notificationPlaceholder.textContent = bericht;
    domRefsLogic.notificationPlaceholder.className = 'text-xs sm:text-sm italic p-1 rounded-md';

    switch (type) {
        case 'success':
            domRefsLogic.notificationPlaceholder.classList.add('text-green-700', 'bg-green-100', 'dark:text-green-200', 'dark:bg-green-800');
            break;
        case 'error':
            domRefsLogic.notificationPlaceholder.classList.add('text-red-700', 'bg-red-100', 'dark:text-red-200', 'dark:bg-red-800');
            break;
        case 'info':
        default:
            domRefsLogic.notificationPlaceholder.classList.add('text-blue-700', 'bg-blue-100', 'dark:text-blue-200', 'dark:bg-blue-800');
            break;
    }
    domRefsLogic.notificationPlaceholder.classList.remove('hidden');

    if (domRefsLogic.notificationPlaceholder.timeoutId) {
        clearTimeout(domRefsLogic.notificationPlaceholder.timeoutId);
    }

    if (autoHideDelay !== false && autoHideDelay > 0) {
        domRefsLogic.notificationPlaceholder.timeoutId = setTimeout(() => {
            if (domRefsLogic.notificationPlaceholder) {
                domRefsLogic.notificationPlaceholder.classList.add('hidden');
                domRefsLogic.notificationPlaceholder.textContent = '';
            }
        }, autoHideDelay);
    }
}

/**
 * Initialiseert alle event listeners voor de hoofdpagina.
 */
function initEventListenersLogic() {
    console.log("[VerlofroosterLogic] Start initEventListenersLogic.");

    // Helper function to update the visual state of view toggle buttons
    const updateViewButtonActiveState = (activeView) => {
        const weekBtn = domRefsLogic.weekViewButton;
        const monthBtn = domRefsLogic.monthViewButton;
        const activeClasses = ['bg-blue-500', 'text-white'];
        // Classes that define an active button, also need to be removed from the one becoming inactive.
        const classesToEnsureRemovedFromInactive = ['bg-blue-500', 'text-white'];

        if (!weekBtn || !monthBtn) {
            console.warn("[VerlofroosterLogic] View toggle buttons not found for state update.");
            return;
        }

        // Apply styles based on which view is active
        if (activeView === 'week') {
            weekBtn.classList.add(...activeClasses);
            // Ensure default Tailwind focus behavior is not overridden by removing focus utility classes if they exist from active state
            weekBtn.classList.remove('focus:z-10', 'focus:ring-2', 'focus:ring-blue-500');


            monthBtn.classList.remove(...classesToEnsureRemovedFromInactive);
            // Add back default Tailwind focus classes if they were part of the non-active state defined in HTML
            monthBtn.classList.add('focus:z-10', 'focus:ring-2', 'focus:ring-blue-500');


        } else if (activeView === 'maand') {
            monthBtn.classList.add(...activeClasses);
            monthBtn.classList.remove('focus:z-10', 'focus:ring-2', 'focus:ring-blue-500');

            weekBtn.classList.remove(...classesToEnsureRemovedFromInactive);
            weekBtn.classList.add('focus:z-10', 'focus:ring-2', 'focus:ring-blue-500');        }
        // theme-toggle.js will handle the styling of the button that just became inactive
        // by its selector: .view-toggle-button:not(.bg-blue-500):not(.text-white)
    };

    // Handler for changing the view
    const handleViewChange = async (nieuweWeergave) => {
        if (huidigeWeergave === nieuweWeergave) return; // No action if view is already active

        huidigeWeergave = nieuweWeergave;
        updateViewButtonActiveState(huidigeWeergave); // Update button visual state

        // Reload data for the new view period (different date ranges for month vs week)
        await laadInitiëleData(false, true); // Load only current period data for new view
        
        updateDatumHeader(); // Update things like "Mei 2025"
        console.log(`[VerlofroosterLogic] Weergave gewisseld naar: ${huidigeWeergave}`);
    };

    if (domRefsLogic.fabAddButton && domRefsLogic.fabMenu && domRefsLogic.fabIconPlus && domRefsLogic.fabIconClose) {
        domRefsLogic.fabAddButton.addEventListener('click', () => {
            toggleFabMenu(); // Use the toggleFabMenu function
        });
        document.addEventListener('click', (event) => {
            if (domRefsLogic.fabAddButton && domRefsLogic.fabMenu &&
                !domRefsLogic.fabAddButton.contains(event.target) &&
                !domRefsLogic.fabMenu.contains(event.target)) {
                toggleFabMenu(true); // Force close
            }
        });
    } else { console.warn("[VerlofroosterLogic] FAB elementen niet compleet gevonden in domRefsLogic."); }

    if (domRefsLogic.roosterDropdownButton && domRefsLogic.roosterDropdownMenu) {
        domRefsLogic.roosterDropdownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isMenuOpen = !domRefsLogic.roosterDropdownMenu.classList.contains('hidden');
            if (isMenuOpen) {
                domRefsLogic.roosterDropdownMenu.classList.add('opacity-0', 'scale-95');
                domRefsLogic.roosterDropdownMenu.classList.remove('pointer-events-auto');
                setTimeout(() => domRefsLogic.roosterDropdownMenu.classList.add('hidden'), 200);
            } else {
                domRefsLogic.roosterDropdownMenu.classList.remove('hidden', 'opacity-0', 'scale-95');
                void domRefsLogic.roosterDropdownMenu.offsetWidth;
                domRefsLogic.roosterDropdownMenu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
            }
        });
        document.addEventListener('click', (event) => {
            if (domRefsLogic.roosterDropdownMenu && !domRefsLogic.roosterDropdownMenu.classList.contains('hidden') &&
                domRefsLogic.roosterDropdownButton && !domRefsLogic.roosterDropdownButton.contains(event.target) &&
                !domRefsLogic.roosterDropdownMenu.contains(event.target)) {
                domRefsLogic.roosterDropdownMenu.classList.add('opacity-0', 'scale-95');
                domRefsLogic.roosterDropdownMenu.classList.remove('pointer-events-auto');
                setTimeout(() => domRefsLogic.roosterDropdownMenu.classList.add('hidden'), 200);
            }
        });
    } else { console.warn("[VerlofroosterLogic] Rooster dropdown elementen niet compleet gevonden in domRefsLogic."); }    const navigeerPeriode = async (offsetMaanden, offsetWeken = 0) => {
        if (huidigeWeergave === 'maand') {
            huidigeDatumFocus.setMonth(huidigeDatumFocus.getMonth() + offsetMaanden);
        } else {
            huidigeDatumFocus.setDate(huidigeDatumFocus.getDate() + (offsetWeken * 7));
        }
        
        // Reload date-sensitive data with new date filters (only for current period)
        await laadInitiëleData(false, true);
        
        // Update UI
        updateCurrentMonthDisplay();
    };

    if (domRefsLogic.prevMonthButton) domRefsLogic.prevMonthButton.addEventListener('click', () => navigeerPeriode(huidigeWeergave === 'maand' ? -1 : 0, huidigeWeergave === 'week' ? -1 : 0));
    else { console.warn("[VerlofroosterLogic] prevMonthButton niet gevonden in domRefsLogic."); }

    if (domRefsLogic.nextMonthButton) domRefsLogic.nextMonthButton.addEventListener('click', () => navigeerPeriode(huidigeWeergave === 'maand' ? 1 : 0, huidigeWeergave === 'week' ? 1 : 0));
    else { console.warn("[VerlofroosterLogic] nextMonthButton niet gevonden in domRefsLogic."); }    if (domRefsLogic.todayButton) domRefsLogic.todayButton.addEventListener('click', async () => {
        huidigeDatumFocus = new Date();
        await laadInitiëleData(false, true); // Load only current period data
        updateViewButtonActiveState(huidigeWeergave); // Ensure button state is reapplied if view didn't change but data reloaded
    });
    else { console.warn("[VerlofroosterLogic] todayButton niet gevonden in domRefsLogic."); }

    // Setup event listeners for view toggle buttons
    if (domRefsLogic.weekViewButton) domRefsLogic.weekViewButton.addEventListener('click', () => handleViewChange('week'));
    else { console.warn("[VerlofroosterLogic] weekViewButton niet gevonden in domRefsLogic."); }

    if (domRefsLogic.monthViewButton) domRefsLogic.monthViewButton.addEventListener('click', () => handleViewChange('maand'));
    else { console.warn("[VerlofroosterLogic] monthViewButton niet gevonden in domRefsLogic."); }

    if (domRefsLogic.teamFilterSelect) domRefsLogic.teamFilterSelect.addEventListener('change', tekenRooster);
    else { console.warn("[VerlofroosterLogic] teamFilterSelect niet gevonden in domRefsLogic."); }

    if (domRefsLogic.roosterSearchInput) {
        domRefsLogic.roosterSearchInput.addEventListener('input', () => {
            clearTimeout(domRefsLogic.roosterSearchInput.searchTimeout);
            domRefsLogic.roosterSearchInput.searchTimeout = setTimeout(tekenRooster, 300);
        });
    } else { console.warn("[VerlofroosterLogic] roosterSearchInput niet gevonden in domRefsLogic."); }

    if (domRefsLogic.meldingButton) {
        domRefsLogic.meldingButton.addEventListener('click', (event) => {
            // Prevent default link behavior if it's an <a> tag
            event.preventDefault();

            // Directly navigate
            window.location.href = domRefsLogic.meldingButton.href;
        });
    } else { console.warn("[VerlofroosterLogic] meldingButton niet gevonden in domRefsLogic."); } if (domRefsLogic.startRegistratieButton) {
        domRefsLogic.startRegistratieButton.addEventListener('click', () => {
            console.log("[VerlofroosterLogic] Start registratie button clicked");
            if (typeof openRegistratieModal === 'function') {
                // Make sure data is loaded before opening the modal
                if (typeof window.loadRegistrationData === 'function') {
                    window.loadRegistrationData();
                }
                openRegistratieModal();
            } else {
                console.warn("[VerlofroosterLogic] openRegistratieModal functie niet beschikbaar.");
                alert("Registratie is momenteel niet mogelijk.");
            }
        });
    } else {
        console.warn("[VerlofroosterLogic] startRegistratieButton niet gevonden in domRefsLogic.");
    }

    // Event listener voor de "Verlof aanvragen" FAB knop
    if (domRefsLogic.fabVerlofAanvragenLink) {
        domRefsLogic.fabVerlofAanvragenLink.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("[VerlofroosterLogic] FAB Verlof Aanvragen geklikt.");            if (!isDataVoorVerlofModalGereed) {
                toonNotificatie("Benodigde data voor verlofmodal wordt geladen...", "info");
                await laadInitiëleData(true, false); // Forceer laden van modal specifieke data (all data)
                if (!isDataVoorVerlofModalGereed) {
                    toonNotificatie("Kon data voor verlofmodal niet laden. Probeer opnieuw.", "error");
                    return;
                }
            }// Altijd huidigeGebruiker gebruiken voor FAB verlof aanvraag
            if (window.huidigeGebruiker && (window.huidigeGebruiker.normalizedUsername || window.huidigeGebruiker.loginNaam)) {
                const medewerkerContext = {
                    Username: window.huidigeGebruiker.normalizedUsername, // Gebruik normalizedUsername
                    loginNaam: window.huidigeGebruiker.loginNaam, // Behoud volledige loginNaam
                    normalizedUsername: window.huidigeGebruiker.normalizedUsername, // Zorg dat beide velden beschikbaar zijn
                    Naam: window.huidigeGebruiker.Title || window.huidigeGebruiker.Naam, // Gebruik Title of Naam
                    Title: window.huidigeGebruiker.Title, // Zorg dat Title ook beschikbaar is
                    Id: window.huidigeGebruiker.Id, // SharePoint User ID
                    Email: window.huidigeGebruiker.Email
                };

                // Check if there's a date selection available
                let startDate = new Date();
                let hasDateSelection = false;

                // Check for selectedRange from contextMenu (available globally)
                if (window.selectedRange && window.selectedRange.start) {
                    startDate = new Date(window.selectedRange.start);
                    hasDateSelection = true;

                    // Store the selection for the modal
                    window.verlofModalStartDate = window.selectedRange.start;
                    window.verlofModalEndDate = window.selectedRange.end || window.selectedRange.start;
                    window.verlofModalSelectionMode = window.selectedRange.end ? 'range' : 'single';

                    console.log("[VerlofroosterLogic] FAB gebruikt geselecteerde datums:", {
                        start: window.selectedRange.start,
                        end: window.selectedRange.end,
                        totalDays: window.selectedRange.cells ? window.selectedRange.cells.length : 1
                    });
                } else {
                    console.log("[VerlofroosterLogic] FAB geen datumselectie gevonden, gebruikt vandaag als standaard");

                    // Show helpful message about date selection
                    setTimeout(() => {
                        if (window.toonModalNotificatie) {
                            window.toonModalNotificatie(
                                'TIP: Selecteer eerst datums in het rooster door te klikken voor automatische datumvulling!',
                                'info'
                            );
                        }
                    }, 800);
                }

                console.log("[VerlofroosterLogic] FAB verlof aanvraag met medewerker context:", medewerkerContext);
                console.log("[VerlofroosterLogic] FAB startdatum:", startDate, "- Heeft selectie:", hasDateSelection);

                if (typeof window.openVerlofAanvraagModal === 'function') {
                    window.openVerlofAanvraagModal(null, startDate, medewerkerContext);

                    // Show helpful message if dates were pre-selected
                    if (hasDateSelection) {
                        setTimeout(() => {
                            if (window.toonModalNotificatie) {
                                const endDate = window.selectedRange.end || window.selectedRange.start;
                                const isRange = window.selectedRange.end && window.selectedRange.end !== window.selectedRange.start;
                                const totalDays = window.selectedRange.cells ? window.selectedRange.cells.length : 1;

                                let message;
                                if (isRange) {
                                    message = `Datums vooringevuld: ${window.selectedRange.start} - ${endDate} (${totalDays} dagen)`;
                                } else {
                                    message = `Datum vooringevuld: ${window.selectedRange.start}`;
                                }

                                window.toonModalNotificatie(message, 'info');
                            }
                        }, 500);
                    }
                } else {
                    console.error("[VerlofroosterLogic] openVerlofAanvraagModal functie niet beschikbaar.");
                    toonNotificatie("Fout: Verlofmodal functie is niet beschikbaar.", "error");
                }
            } else {
                console.error("[VerlofroosterLogic] Huidige gebruiker context niet beschikbaar voor FAB verlof aanvraag.");
                toonNotificatie("Fout: Uw gebruikersinformatie is niet beschikbaar.", "error");
            }
            toggleFabMenu(true); // Sluit FAB menu
        });
    } else { console.warn("[VerlofroosterLogic] fabVerlofAanvragenLink niet gevonden in domRefsLogic."); }    // Event listener voor de "CompensatieUren doorgeven" FAB knop
    if (domRefsLogic.fabCompensatieAanvragenLink) {
        domRefsLogic.fabCompensatieAanvragenLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("[VerlofroosterLogic] 'Compensatieuren doorgeven' FAB item geklikt.");

            if (typeof window.openCompensatieUrenModal === 'function') {
                // Always use current user for FAB compensatie request
                if (window.huidigeGebruiker && (window.huidigeGebruiker.normalizedUsername || window.huidigeGebruiker.loginNaam)) {
                    const medewerkerContext = {
                        Username: window.huidigeGebruiker.normalizedUsername,
                        loginNaam: window.huidigeGebruiker.loginNaam,
                        normalizedUsername: window.huidigeGebruiker.normalizedUsername,
                        Naam: window.huidigeGebruiker.Title || window.huidigeGebruiker.Naam,
                        Title: window.huidigeGebruiker.Title,
                        displayName: window.huidigeGebruiker.Title,
                        Id: window.huidigeGebruiker.Id,
                        Email: window.huidigeGebruiker.Email
                    };

                    // Check if there's a date selection available
                    let startDate = new Date();
                    let hasDateSelection = false;

                    // Check for selectedRange from contextMenu (available globally)
                    if (window.selectedRange && window.selectedRange.start) {
                        startDate = new Date(window.selectedRange.start);
                        hasDateSelection = true;

                        // Store the selection for the modal
                        window.compensatieModalStartDate = window.selectedRange.start;
                        window.compensatieModalEndDate = window.selectedRange.end || window.selectedRange.start;

                        console.log("[VerlofroosterLogic] FAB compensatie gebruikt geselecteerde datums:", {
                            start: window.selectedRange.start,
                            end: window.selectedRange.end,
                            totalDays: window.selectedRange.cells ? window.selectedRange.cells.length : 1
                        });
                    } else {
                        console.log("[VerlofroosterLogic] FAB compensatie geen datumselectie gevonden, gebruikt vandaag als standaard");
                    }

                    console.log("[VerlofroosterLogic] FAB compensatie met medewerker context:", medewerkerContext);
                    
                    window.openCompensatieUrenModal(null, startDate, medewerkerContext);

                    // Show helpful message if dates were pre-selected
                    if (hasDateSelection) {
                        setTimeout(() => {
                            if (window.toonModalNotificatie) {
                                const endDate = window.selectedRange.end || window.selectedRange.start;
                                const isRange = window.selectedRange.end && window.selectedRange.end !== window.selectedRange.start;
                                const totalDays = window.selectedRange.cells ? window.selectedRange.cells.length : 1;

                                let message;
                                if (isRange) {
                                    message = `Datums vooringevuld: ${window.selectedRange.start} - ${endDate} (${totalDays} dagen)`;
                                } else {
                                    message = `Datum vooringevuld: ${window.selectedRange.start}`;
                                }

                                window.toonModalNotificatie(message, 'info');
                            }
                        }, 500);
                    }

                    toggleFabMenu(true); // Sluit FAB menu
                } else {
                    console.error("[VerlofroosterLogic] Huidige gebruiker context niet beschikbaar voor FAB compensatie aanvraag.");
                    toonNotificatie("Fout: Uw gebruikersinformatie is niet beschikbaar.", "error");
                    toggleFabMenu(true);
                }
            } else {
                console.error("[VerlofroosterLogic] openCompensatieUrenModal functie niet beschikbaar.");
                toonNotificatie("De functie voor het doorgeven van compensatie-uren is momenteel niet beschikbaar.", "error");
                toggleFabMenu(true);
            }
        });
    } else { console.warn("[VerlofroosterLogic] fabCompensatieAanvragenLink niet gevonden in domRefsLogic."); }
    // Event listener voor de "Ziek/Beter melden" FAB knop
    if (domRefsLogic.fabZiekMeldenLink) {
        domRefsLogic.fabZiekMeldenLink.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("[VerlofroosterLogic] FAB Ziek/Beter Melden geklikt.");            if (!isDataVoorZiekBeterModalGereed) {
                toonNotificatie("Benodigde data voor ziekmelding wordt geladen...", "info");
                await laadInitiëleData(true, false); // Forceer laden van modal specifieke data (all data)
                if (!isDataVoorZiekBeterModalGereed) {
                    toonNotificatie("Kon data voor ziekmelding niet laden. Probeer opnieuw.", "error");
                    return;
                }
            }
            // Check if user is part of privileged groups
            let isPrivilegedUser = false;
            if (window.huidigeGebruiker && window.huidigeGebruiker.sharePointGroepen) {
                const privilegedGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars", "2.3. Senioren beoordelen"];
                isPrivilegedUser = window.huidigeGebruiker.sharePointGroepen.some(groep =>
                    privilegedGroups.some(privilegedGroup => groep.toLowerCase().includes(privilegedGroup.toLowerCase()))
                );
                console.log("[VerlofroosterLogic] Gebruiker behoort tot geprivilegieerde groepen voor ziekmelding:", isPrivilegedUser);
            }

            let medewerkerContext;

            if (isPrivilegedUser) {
                // Privileged users: can report for anyone if someone is selected, or for themselves if no one is selected
                if (geselecteerdeMedewerkerId && geselecteerdeMedewerkerUsername && geselecteerdeMedewerkerNaam) {
                    // Use selected employee context
                    medewerkerContext = {
                        Username: geselecteerdeMedewerkerUsername,
                        Naam: geselecteerdeMedewerkerNaam,
                        Id: geselecteerdeMedewerkerId,
                        loginNaam: geselecteerdeMedewerkerUsername // Use username as loginNaam for selected employee
                    };
                    console.log("[VerlofroosterLogic] Geprivilegieerde gebruiker meldt ziek/beter voor geselecteerde medewerker:", medewerkerContext);
                } else {
                    // No selection - report for themselves
                    medewerkerContext = {
                        Username: window.huidigeGebruiker.normalizedUsername,
                        loginNaam: window.huidigeGebruiker.loginNaam,
                        Naam: window.huidigeGebruiker.Title || window.huidigeGebruiker.Naam,
                        Title: window.huidigeGebruiker.Title,
                        Id: window.huidigeGebruiker.medewerkerData ? window.huidigeGebruiker.medewerkerData.ID : window.huidigeGebruiker.Id,
                        Email: window.huidigeGebruiker.Email
                    };
                    console.log("[VerlofroosterLogic] Geprivilegieerde gebruiker meldt ziek/beter voor zichzelf:", medewerkerContext);
                }
            } else {
                // Regular users: can only report for themselves
                medewerkerContext = {
                    Username: window.huidigeGebruiker.normalizedUsername,
                    loginNaam: window.huidigeGebruiker.loginNaam,
                    Naam: window.huidigeGebruiker.Title || window.huidigeGebruiker.Naam,
                    Title: window.huidigeGebruiker.Title,
                    Id: window.huidigeGebruiker.medewerkerData ? window.huidigeGebruiker.medewerkerData.ID : window.huidigeGebruiker.Id,
                    Email: window.huidigeGebruiker.Email
                };
                console.log("[VerlofroosterLogic] Reguliere gebruiker meldt ziek/beter voor zichzelf:", medewerkerContext);
            }

            if (typeof window.openZiekBeterMeldenModal === 'function') {
                window.openZiekBeterMeldenModal(medewerkerContext, new Date(), 'ziek');
                toggleFabMenu(true); // Sluit FAB menu
            } else {
                console.warn("[VerlofroosterLogic] openZiekBeterMeldenModal functie niet beschikbaar.");
                alert("De functie voor ziek/beter melden is momenteel niet beschikbaar.");
            }
        });
    } else { console.warn("[VerlofroosterLogic] fabZiekMeldenLink niet gevonden in domRefsLogic."); }

    // Event listener voor de "Zittingvrij (incidenteel)" FAB knop
    if (domRefsLogic.fabZittingVrijModalTrigger) {
        domRefsLogic.fabZittingVrijModalTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("[VerlofroosterLogic] 'Zittingvrij (incidenteel) Modal Trigger' FAB item geklikt.");

            // Check if user has selected someone from the grid
            if (!geselecteerdeMedewerkerId || !geselecteerdeMedewerkerUsername || !geselecteerdeMedewerkerNaam) {
                toonNotificatie("Selecteer eerst een medewerker uit het rooster om zittingvrij te melden.", "warning");
                toggleFabMenu(true); // Close FAB menu
                return;
            }

            // Check if user is part of specific admin groups
            let isBeheerder = false;
            if (window.huidigeGebruiker && window.huidigeGebruiker.sharePointGroepen) {
                const adminGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars", "2.3. Senioren beoordelen"];
                isBeheerder = window.huidigeGebruiker.sharePointGroepen.some(groep => adminGroups.includes(groep));
                console.log("[VerlofroosterLogic] Gebruiker behoort tot beheerders groepen:", isBeheerder);
            }            if (typeof window.openZittingVrijModal === 'function') {
                // Pass the selected employee data and selected date
                const selectedMedewerker = {
                    Username: geselecteerdeMedewerkerUsername,
                    loginNaam: geselecteerdeMedewerkerUsername,
                    normalizedUsername: geselecteerdeMedewerkerUsername,
                    Naam: geselecteerdeMedewerkerNaam,
                    displayName: geselecteerdeMedewerkerNaam,
                    medewerkerNaamVolledig: geselecteerdeMedewerkerNaam,
                    Id: geselecteerdeMedewerkerId
                };

                // Get selected date from context menu or default to today
                let selectedDate = new Date();
                if (window.selectedRange && window.selectedRange.start) {
                    selectedDate = new Date(window.selectedRange.start);
                }

                console.log("[VerlofroosterLogic] Zittingvrij modal openen voor:", selectedMedewerker, "op datum:", selectedDate);

                try {
                    window.openZittingVrijModal(null, selectedDate, selectedMedewerker);
                    toggleFabMenu(true); // Close FAB menu
                } catch (error) {
                    console.error("[VerlofroosterLogic] Error opening Zittingvrij modal:", error);
                    toonNotificatie(`Fout bij openen zittingsvrij modal: ${error.message}`, "error");
                }
            } else {
                console.warn("[VerlofroosterLogic] Functie window.openZittingVrijModal niet gevonden.");
                toonNotificatie("Functionaliteit voor zittingvrij melden is momenteel niet beschikbaar.", "error");
            }
        });
    } else { console.warn("[VerlofroosterLogic] FAB ZittingVrij Modal Trigger knop ('fab-zittingvrij-modal-trigger') niet gevonden in domRefsLogic."); }


    if (domRefsLogic.sortMedewerkerButton) {
        domRefsLogic.sortMedewerkerButton.addEventListener('click', () => {
            sorteerRichtingMedewerker = sorteerRichtingMedewerker === 'asc' ? 'desc' : 'asc';
            tekenRooster();
            console.log(`[VerlofroosterLogic] Medewerkers gesorteerd op ${sorteerKolomMedewerker}, richting ${sorteerRichtingMedewerker}`);
        });
    } else { console.warn("[VerlofroosterLogic] sortMedewerkerButton niet gevonden in domRefsLogic."); }

    document.addEventListener('click', handleDocumentKlikVoorDeselectie);

    // Set initial active button state based on the default `huidigeWeergave`
    updateViewButtonActiveState(huidigeWeergave);

    console.log("[VerlofroosterLogic] Einde initEventListenersLogic.");
}

/**
 * Hoofd initialisatiefunctie voor de Verlofrooster applicatie.
 */
async function initializeVerlofrooster() {
    console.log("[VerlofroosterLogic] Start initialisatie Verlofrooster applicatie.");

    // Ensure modal is properly hidden on initial load
    const modalPlaceholder = document.getElementById('modal-placeholder');
    if (modalPlaceholder) {
        modalPlaceholder.classList.add('hidden');
        modalPlaceholder.style.display = 'none';
        modalPlaceholder.style.opacity = '0';
    }

    initDOMReferentiesLogic();

    const opgeslagenThema = localStorage.getItem('verlofroosterThema');
    if (opgeslagenThema) {
        gebruikersInstellingen.soortWeergave = opgeslagenThema;
    }
    domRefsLogic.appBody.classList.add(gebruikersInstellingen.soortWeergave === 'dark' ? 'dark-theme' : 'light-theme');

    if (typeof window.machtigingenInitializationPromise === 'undefined') {
        console.error("[VerlofroosterLogic] Kritische fout: window.machtigingenInitializationPromise is niet gedefinieerd. Machtigingen.js niet (correct) geladen?");
        toonNotificatie("Kritische laadfout van applicatie-afhankelijkheden (Promise). Probeer de pagina te vernieuwen.", "error", false);
        return;
    }

    try {
        console.log("[VerlofroosterLogic] Wachten op voltooiing initialisatie van machtigingen.js via promise...");
        await window.machtigingenInitializationPromise;
        console.log("[VerlofroosterLogic] Machtigingen.js initialisatie voltooid.");

        if (!(typeof window.spWebAbsoluteUrl === 'string' && window.huidigeGebruiker && window.huidigeGebruiker.loginNaam)) {
            console.error("[VerlofroosterLogic] Machtigingen.js promise resolved, maar globale context variabelen zijn nog steeds niet correct gezet.");
            toonNotificatie("Fout bij laden gebruikerscontext na initialisatie. Probeer de pagina te vernieuwen.", "error", false);
            return;
        }
        if (domRefsLogic.gebruikersnaamDisplay) {
            domRefsLogic.gebruikersnaamDisplay.textContent = window.huidigeGebruiker.Title || window.huidigeGebruiker.normalizedUsername || "Gebruiker";
        }

    } catch (error) {
        console.error("[VerlofroosterLogic] Fout tijdens wachten op machtigingen.js initialisatie promise:", error);
        toonNotificatie("Fout bij laden van basis-afhankelijkheden. Probeer de pagina te vernieuwen.", "error", false);
        return;
    }

    const isGeregistreerd = await controleerGebruikersRegistratie();

    if (isGeregistreerd) {
        console.log("[VerlofroosterLogic] Gebruiker is geregistreerd. Laden van rooster data...");
        if (domRefsLogic.roosterGridContainer) domRefsLogic.roosterGridContainer.classList.remove('hidden');
        if (domRefsLogic.legendaSection) domRefsLogic.legendaSection.classList.remove('hidden');
        await laadInitiëleData(false, true); // Load initial data with current period filtering
    } else {
        console.warn("[VerlofroosterLogic] Gebruiker niet geregistreerd of niet actief. Rooster wordt niet geladen.");
        if (domRefsLogic.roosterGridContainer) domRefsLogic.roosterGridContainer.classList.add('hidden');
        if (domRefsLogic.legendaSection) domRefsLogic.legendaSection.classList.add('hidden');        if (!isDataVoorRegistratieModalGereed) {
            console.log("[VerlofroosterLogic] Laden van data specifiek voor registratiemodal...");
            await laadInitiëleData(true, false); // Force modal data, load all items for registration
        }
    }

    initEventListenersLogic();

    if (typeof initializeVerlofroosterModals === 'function') {
        initializeVerlofroosterModals();
    } else {
        console.warn("[VerlofroosterLogic] Functie initializeVerlofroosterModals niet gevonden.");
    }

    if (domRefsLogic.notificationPlaceholder && domRefsLogic.notificationPlaceholder.textContent.includes("Bezig met laden")) {
        toonNotificatie("", "info", 1);
    }
    console.log("[VerlofroosterLogic] Initialisatie Verlofrooster applicatie voltooid.");
}

document.addEventListener('DOMContentLoaded', initializeVerlofrooster);
console.log("js/verlofrooster_logic.js geladen en wacht op DOMContentLoaded.");

/**
 * Update gebruikersinstellingen vanuit de instellingen pagina
 * @param {Object} nieuweInstellingen - Nieuwe instellingen object uit gebruikersInstellingenLijst
 */
function updateGebruikersInstellingen(nieuweInstellingen) {
    console.log("[VerlofroosterLogic] Bijwerken gebruikersinstellingen:", nieuweInstellingen);

    if (nieuweInstellingen) {
        // Update global settings object
        if (nieuweInstellingen.soortWeergave !== undefined) {
            gebruikersInstellingen.soortWeergave = nieuweInstellingen.soortWeergave;
        }
        if (nieuweInstellingen.EigenTeamWeergeven !== undefined) {
            gebruikersInstellingen.eigenTeamWeergeven = nieuweInstellingen.EigenTeamWeergeven;
        }
        if (nieuweInstellingen.WeekendenWeergeven !== undefined) {
            gebruikersInstellingen.weekendenWeergeven = nieuweInstellingen.WeekendenWeergeven;
        }
        if (nieuweInstellingen.ID) {
            gebruikersInstellingenSPId = nieuweInstellingen.ID;
        }

        // Apply updated settings
        pasGebruikersInstellingenToe();

        // Refresh rooster if weekend settings changed
        if (nieuweInstellingen.WeekendenWeergeven !== undefined) {
            renderRooster();
        }
    }
}

// Make the function globally available for communication with settings page
window.updateGebruikersInstellingen = updateGebruikersInstellingen;

/**
 * Enhanced sticky behavior with visual feedback
 * Adds shadow effects when sticky elements are "floating"
 */
function initializeStickyObserver() {
    // Create intersection observer to detect when sticky elements are stuck (vertical)
    const verticalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting, it means it's stuck
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck');
                } else {
                    target.classList.remove('is-stuck');
                }
            });
        },
        {
            threshold: [0, 1],
            rootMargin: '-1px 0px 0px 0px' // Trigger just before element becomes stuck
        }
    );    // Create intersection observer for horizontal sticky elements
    const horizontalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting horizontally, it means it's stuck to the left
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck-horizontal');
                } else {
                    target.classList.remove('is-stuck-horizontal');
                }
            });
        },
        {
            threshold: 1.0,
            rootMargin: '0px'
        }
    );

    const observeStickyElements = () => {
        // Reset observer
        horizontalStickyObserver.disconnect();

        // Find all medewerker cells that should be observed for horizontal sticking
        const medewerkerCells = document.querySelectorAll('.rooster-cel-medewerker');
        medewerkerCells.forEach(cell => {
            horizontalStickyObserver.observe(cell);
        });

        if (medewerkerCells.length > 0) {
            console.log(`Observing ${medewerkerCells.length} medewerker cells for horizontal sticky behavior`);
        }
    };

    // Observe elements immediately if they exist
    observeStickyElements();

    // Create a mutation observer to watch for when rooster data is updated
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.target.id === 'rooster-data-rows') {
                // Re-observe sticky elements when roster is re-rendered
                setTimeout(observeStickyElements, 100);
            }
        });
    });    // Start observing changes to the rooster data rows
    const roosterDataRows = document.getElementById('rooster-data-rows');
    if (roosterDataRows) {
        mutationObserver.observe(roosterDataRows, {
            childList: true,
            subtree: true
        });
    }    // Call observe function initially
    observeStickyElements();
}

// Export toggleFabMenu to window for use by other scripts
window.toggleFabMenu = toggleFabMenu;
// Export laadInitiëleData for use by modals  
window.laadInitiëleData = laadInitiëleData;

console.log("verlofrooster_logic.js Klaar met laden");

/**
 * Enhanced sticky behavior with visual feedback
 * Adds shadow effects when sticky elements are "floating"
 */
function initializeStickyObserver() {
    // Create intersection observer to detect when sticky elements are stuck (vertical)
    const verticalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting, it means it's stuck
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck');
                } else {
                    target.classList.remove('is-stuck');
                }
            });
        },
        {
            threshold: [0, 1],
            rootMargin: '-1px 0px 0px 0px' // Trigger just before element becomes stuck
        }
    );

    // Create intersection observer for horizontal sticky elements
    const horizontalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting horizontally, it means it's stuck to the left
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck-horizontal');
                } else {
                    target.classList.remove('is-stuck-horizontal');
                }
            });
        },
        {
            threshold: [0, 1],
            rootMargin: '0px 0px 0px -1px' // Trigger just before element becomes stuck horizontally
        }
    );

    // Observe the header
    const header = document.getElementById('rooster-grid-header');
    if (header) {
        verticalStickyObserver.observe(header);
    }

    // Function to observe sticky elements when they're created
    const observeStickyElements = () => {
        // Observe the first data row (dagen row)
        const firstDataRow = document.querySelector('#rooster-data-rows > div:first-child');
        if (firstDataRow) {
            verticalStickyObserver.observe(firstDataRow);
            console.log("Observing dagen row for vertical sticky behavior");
        }

        // Observe all medewerker name cells (first cell in each row)
        const medewerkerCells = document.querySelectorAll('#rooster-data-rows > div > div:first-child');
        medewerkerCells.forEach(cell => {
            horizontalStickyObserver.observe(cell);
        });

        if (medewerkerCells.length > 0) {
            console.log(`Observing ${medewerkerCells.length} medewerker cells for horizontal sticky behavior`);
        }
    };

    // Observe elements immediately if they exist
    observeStickyElements();

    // Create a mutation observer to watch for when rooster data is updated
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.target.id === 'rooster-data-rows') {
                // Re-observe sticky elements when roster is re-rendered
                setTimeout(observeStickyElements, 100);
            }
        });
    });

    // Start observing changes to the rooster data rows
    const roosterDataRows = document.getElementById('rooster-data-rows');
    if (roosterDataRows) {
        mutationObserver.observe(roosterDataRows, {
            childList: true,
            subtree: true
        });
    }

    console.log("Enhanced sticky observer initialized for rooster navigation");
}

// Initialize sticky observer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the initial render to complete
    setTimeout(initializeStickyObserver, 500);
});

console.log("verlofrooster_logic.js Klaar met laden");

/**
 * Haalt alle medewerkers op voor gebruik in select/dropdown elementen
 * @returns {Promise<Array>} Array van medewerker objecten met Id, Title en andere relevante gegevens
 */
window.getAlleMedewerkersVoorSelect = async function () {
    // We kunnen de reeds geladen medewerkers gebruiken indien beschikbaar
    if (alleMedewerkers && alleMedewerkers.length > 0) {
        return alleMedewerkers.map(m => ({
            Id: m.Id,
            Title: m.Naam || m.Title,
            PersoneelsNr: m.PersoneelsNr || null,
            E_x002d_mail: m.E_x002d_mail || '',
            Functie: m.Functie || '',
            Gebruikersnaam: m.Gebruikersnaam || ''
        }));
    }

    // Anders direct van SharePoint ophalen
    try {
        const lijstConfigMedewerkers = getLijstConfig(lijstNamen.Medewerkers);
        const medewerkers = await getLijstItems(lijstConfigMedewerkers.lijstNaam, lijstConfigMedewerkers.viewXml);

        return medewerkers.map(m => ({
            Id: m.Id,
            Title: m.Naam || m.Title,
            PersoneelsNr: m.PersoneelsNr || null,
            E_x002d_mail: m.E_x002d_mail || '',
            Functie: m.Functie || '',
            Gebruikersnaam: m.Gebruikersnaam || ''
        }));
    } catch (error) {
        console.error("[VerlofroosterLogic] Fout bij ophalen medewerkers voor select:", error);
        return [];
    }
};

/**
 * Update gebruikersinstellingen vanuit de instellingen pagina
 * @param {Object} nieuweInstellingen - Nieuwe instellingen object uit gebruikersInstellingenLijst
 */
function updateGebruikersInstellingen(nieuweInstellingen) {
    console.log("[VerlofroosterLogic] Bijwerken gebruikersinstellingen:", nieuweInstellingen);

    if (nieuweInstellingen) {
        // Update global settings object
        if (nieuweInstellingen.soortWeergave !== undefined) {
            gebruikersInstellingen.soortWeergave = nieuweInstellingen.soortWeergave;
        }
        if (nieuweInstellingen.EigenTeamWeergeven !== undefined) {
            gebruikersInstellingen.eigenTeamWeergeven = nieuweInstellingen.EigenTeamWeergeven;
        }
        if (nieuweInstellingen.WeekendenWeergeven !== undefined) {
            gebruikersInstellingen.weekendenWeergeven = nieuweInstellingen.WeekendenWeergeven;
        }
        if (nieuweInstellingen.ID) {
            gebruikersInstellingenSPId = nieuweInstellingen.ID;
        }

        // Apply updated settings
        pasGebruikersInstellingenToe();

        // Refresh rooster if weekend settings changed
        if (nieuweInstellingen.WeekendenWeergeven !== undefined) {
            renderRooster();
        }
    }
}

// Make the function globally available for communication with settings page
window.updateGebruikersInstellingen = updateGebruikersInstellingen;

/**
 * Renders the roster with current settings
 * Specialized function to handle re-rendering after settings changes
 */
function renderRooster() {
    if (domRefsLogic.roosterGridContainer) {
        // Force a redraw by temporarily hiding and showing the container
        const wasHidden = domRefsLogic.roosterGridContainer.classList.contains('hidden');
        if (!wasHidden) {
            domRefsLogic.roosterGridContainer.style.opacity = '0';
            setTimeout(() => {
                tekenRooster();
                domRefsLogic.roosterGridContainer.style.opacity = '1';
            }, 50);
        } else {
            tekenRooster();
        }
    } else {
        tekenRooster();
    }
}

/**
 * Setup layered events popup for cells with multiple events
 * @param {HTMLElement} celDiv - The cell element
 * @param {Array} eventItems - Array of event objects
 * @param {Object} medewerker - Employee data
 */
function setupLayeredEventsPopup(celDiv, eventItems, medewerker) {
    if (!eventItems || eventItems.length <= 1) return;
    
    // Add a visual indicator for multiple events
    const indicator = document.createElement('div');
    indicator.className = 'layered-events-indicator';
    indicator.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background: #f59e0b;
        border-radius: 50%;
        font-size: 8px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        z-index: 10;
    `;
    indicator.textContent = eventItems.length;
    celDiv.appendChild(indicator);
    
    // Add click handler to show popup with all events
    celDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        showLayeredEventsPopup(eventItems, medewerker, e);
    });
}

/**
 * Show popup with layered events
 * @param {Array} eventItems - Array of event objects
 * @param {Object} medewerker - Employee data
 * @param {Event} clickEvent - Click event for positioning
 */
function showLayeredEventsPopup(eventItems, medewerker, clickEvent) {
    // Remove existing popup
    const existingPopup = document.querySelector('.layered-events-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'layered-events-popup';
    popup.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 12px;
        max-width: 300px;
        z-index: 1000;
        font-size: 14px;
    `;
    
    // Add content
    let content = `<div style="font-weight: bold; margin-bottom: 8px;">${medewerker.Naam}</div>`;
    eventItems.forEach((item, index) => {
        const bgColor = item.type === 'verlof' ? '#dbeafe' : item.type === 'compensatie' ? '#dcfce7' : '#fef3c7';
        content += `
            <div style="margin-bottom: 4px; padding: 4px 6px; background: ${bgColor}; border-radius: 4px;">
                <strong>${item.title}</strong>
                ${item.data.StartDatum ? `<br><small>${new Date(item.data.StartDatum).toLocaleDateString('nl-NL')} - ${new Date(item.data.EindDatum).toLocaleDateString('nl-NL')}</small>` : ''}
            </div>
        `;
    });
    popup.innerHTML = content;
    
    // Position popup
    document.body.appendChild(popup);
    const rect = popup.getBoundingClientRect();
    const x = Math.min(clickEvent.clientX, window.innerWidth - rect.width - 10);
    const y = Math.min(clickEvent.clientY, window.innerHeight - rect.height - 10);
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    
    // Close on outside click
    const closeHandler = (e) => {
        if (!popup.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// Export toggleFabMenu to window for use by other scripts
window.toggleFabMenu = toggleFabMenu;
// Export laadInitiëleData for use by modals
window.Laadinitiele = laadInitiëleData;

/**
 * Enhanced sticky behavior with visual feedback
 * Adds shadow effects when sticky elements are "floating"
 */
function initializeStickyObserver() {
    // Create intersection observer to detect when sticky elements are stuck (vertical)
    const verticalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting, it means it's stuck
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck');
                } else {
                    target.classList.remove('is-stuck');
                }
            });
        },
        {
            threshold: [0, 1],
            rootMargin: '-1px 0px 0px 0px' // Trigger just before element becomes stuck
        }
    );

    // Create intersection observer for horizontal sticky elements
    const horizontalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting horizontally, it means it's stuck to the left
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck-horizontal');
                } else {
                    target.classList.remove('is-stuck-horizontal');
                }
            });
        },
        {
            threshold: [0, 1],
            rootMargin: '0px 0px 0px -1px' // Trigger just before element becomes stuck horizontally
        }
    );

    // Observe the header
    const header = document.getElementById('rooster-grid-header');
    if (header) {
        verticalStickyObserver.observe(header);
    }

    // Function to observe sticky elements when they're created
    const observeStickyElements = () => {
        // Observe the first data row (dagen row)
        const firstDataRow = document.querySelector('#rooster-data-rows > div:first-child');
        if (firstDataRow) {
            verticalStickyObserver.observe(firstDataRow);
            console.log("Observing dagen row for vertical sticky behavior");
        }

        // Observe all medewerker name cells (first cell in each row)
        const medewerkerCells = document.querySelectorAll('#rooster-data-rows > div > div:first-child');
        medewerkerCells.forEach(cell => {
            horizontalStickyObserver.observe(cell);
        });

        if (medewerkerCells.length > 0) {
            console.log(`Observing ${medewerkerCells.length} medewerker cells for horizontal sticky behavior`);
        }
    };

    // Observe elements immediately if they exist
    observeStickyElements();

    // Create a mutation observer to watch for when rooster data is updated
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.target.id === 'rooster-data-rows') {
                // Re-observe sticky elements when roster is re-rendered
                setTimeout(observeStickyElements, 100);
            }
        });
    });

    // Start observing changes to the rooster data rows
    const roosterDataRows = document.getElementById('rooster-data-rows');
    if (roosterDataRows) {
        mutationObserver.observe(roosterDataRows, {
            childList: true,
            subtree: true
        });
    }

    console.log("Enhanced sticky observer initialized for rooster navigation");
}

// Initialize sticky observer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the initial render to complete
    setTimeout(initializeStickyObserver, 500);
});

/**
 * Haalt alle medewerkers op voor gebruik in select/dropdown elementen
 * @returns {Promise<Array>} Array van medewerker objecten met Id, Title en andere relevante gegevens
 */
window.getAlleMedewerkersVoorSelect = async function () {
    // We kunnen de reeds geladen medewerkers gebruiken indien beschikbaar
    if (alleMedewerkers && alleMedewerkers.length > 0) {
        return alleMedewerkers.map(m => ({
            Id: m.Id,
            Title: m.Naam || m.Title,
            PersoneelsNr: m.PersoneelsNr || null,
            E_x002d_mail: m.E_x002d_mail || '',
            Functie: m.Functie || '',
            Gebruikersnaam: m.Gebruikersnaam || ''
        }));
    }

    // Anders direct van SharePoint ophalen
    try {
        const lijstConfigMedewerkers = getLijstConfig(lijstNamen.Medewerkers);
        const medewerkers = await getLijstItems(lijstConfigMedewerkers.lijstNaam, lijstConfigMedewerkers.viewXml);

        return medewerkers.map(m => ({
            Id: m.Id,
            Title: m.Naam || m.Title,
            PersoneelsNr: m.PersoneelsNr || null,
            E_x002d_mail: m.E_x002d_mail || '',
            Functie: m.Functie || '',
            Gebruikersnaam: m.Gebruikersnaam || ''
        }));
    } catch (error) {
        console.error("[VerlofroosterLogic] Fout bij ophalen medewerkers voor select:", error);
        return [];
    }
};

console.log("verlofrooster_logic.js Klaar met laden");

/**
 * Renders the roster with current settings
 * Specialized function to handle re-rendering after settings changes
 */
function renderRooster() {
    if (domRefsLogic.roosterGridContainer) {
        // Force a redraw by temporarily hiding and showing the container
        const wasHidden = domRefsLogic.roosterGridContainer.classList.contains('hidden');
        if (!wasHidden) {
            domRefsLogic.roosterGridContainer.style.opacity = '0';
            setTimeout(() => {
                tekenRooster();
                domRefsLogic.roosterGridContainer.style.opacity = '1';
            }, 50);
        } else {
            tekenRooster();
        }
    } else {
        tekenRooster();
    }
}

// Export toggleFabMenu to window for use by other scripts
window.toggleFabMenu = toggleFabMenu;

/**
 * Enhanced sticky behavior with visual feedback
 * Adds shadow effects when sticky elements are "floating"
 */
function initializeStickyObserver() {
    // Create intersection observer to detect when sticky elements are stuck (vertical)
    const verticalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting, it means it's stuck
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck');
                } else {
                    target.classList.remove('is-stuck');
                }
            });
        },
        {
            threshold: [0, 1],
            rootMargin: '-1px 0px 0px 0px' // Trigger just before element becomes stuck
        }
    );

    // Create intersection observer for horizontal sticky elements
    const horizontalStickyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const target = entry.target;

                // When element is not intersecting horizontally, it means it's stuck to the left
                if (!entry.isIntersecting) {
                    target.classList.add('is-stuck-horizontal');
                } else {
                    target.classList.remove('is-stuck-horizontal');
                }
            });
        },
        {
            threshold: [0, 1],
            rootMargin: '0px 0px 0px -1px' // Trigger just before element becomes stuck horizontally
        }
    );

    // Observe the header
    const header = document.getElementById('rooster-grid-header');
    if (header) {
        verticalStickyObserver.observe(header);
    }

    // Function to observe sticky elements when they're created
    const observeStickyElements = () => {
        // Observe the first data row (dagen row)
        const firstDataRow = document.querySelector('#rooster-data-rows > div:first-child');
        if (firstDataRow) {
            verticalStickyObserver.observe(firstDataRow);
            console.log("Observing dagen row for vertical sticky behavior");
        }

        // Observe all medewerker name cells (first cell in each row)
        const medewerkerCells = document.querySelectorAll('#rooster-data-rows > div > div:first-child');
        medewerkerCells.forEach(cell => {
            horizontalStickyObserver.observe(cell);
        });

        if (medewerkerCells.length > 0) {
            console.log(`Observing ${medewerkerCells.length} medewerker cells for horizontal sticky behavior`);
        }
    };

    // Observe elements immediately if they exist
    observeStickyElements();

    // Create a mutation observer to watch for when rooster data is updated
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.target.id === 'rooster-data-rows') {
                // Re-observe sticky elements when roster is re-rendered
                setTimeout(observeStickyElements, 100);
            }
        });
    });

    // Start observing changes to the rooster data rows
    const roosterDataRows = document.getElementById('rooster-data-rows');
    if (roosterDataRows) {
        mutationObserver.observe(roosterDataRows, {
            childList: true,
            subtree: true
        });
    }

    console.log("Enhanced sticky observer initialized for rooster navigation");
}

// Initialize sticky observer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the initial render to complete
    setTimeout(initializeStickyObserver, 500);
});

console.log("verlofrooster_logic.js Klaar met laden");

/**
 * Haalt alle medewerkers op voor gebruik in select/dropdown elementen
 * @returns {Promise<Array>} Array van medewerker objecten met Id, Title en andere relevante gegevens
 */
window.getAlleMedewerkersVoorSelect = async function () {
    // We kunnen de reeds geladen medewerkers gebruiken indien beschikbaar
    if (alleMedewerkers && alleMedewerkers.length > 0) {
        return alleMedewerkers.map(m => ({
            Id: m.Id,
            Title: m.Naam || m.Title,
            PersoneelsNr: m.PersoneelsNr || null,
            E_x002d_mail: m.E_x002d_mail || '',
            Functie: m.Functie || '',
            Gebruikersnaam: m.Gebruikersnaam || ''
        }));
    }

    // Anders direct van SharePoint ophalen
    try {
        const lijstConfigMedewerkers = getLijstConfig(lijstNamen.Medewerkers);
        const medewerkers = await getLijstItems(lijstConfigMedewerkers.lijstNaam, lijstConfigMedewerkers.viewXml);

        return medewerkers.map(m => ({
            Id: m.Id,
            Title: m.Naam || m.Title,
            PersoneelsNr: m.PersoneelsNr || null,
            E_x002d_mail: m.E_x002d_mail || '',
            Functie: m.Functie || '',
            Gebruikersnaam: m.Gebruikersnaam || ''
        }));
    } catch (error) {
        console.error("[VerlofroosterLogic] Fout bij ophalen medewerkers voor select:", error);
        return [];
    }
};

/**
 * Update gebruikersinstellingen vanuit de instellingen pagina
 * @param {Object} nieuweInstellingen - Nieuwe instellingen object uit gebruikersInstellingenLijst
 */
function updateGebruikersInstellingen(nieuweInstellingen) {
    console.log("[VerlofroosterLogic] Bijwerken gebruikersinstellingen:", nieuweInstellingen);

    if (nieuweInstellingen) {
        // Update global settings object
        if (nieuweInstellingen.soortWeergave !== undefined) {
            gebruikersInstellingen.soortWeergave = nieuweInstellingen.soortWeergave;
        }
        if (nieuweInstellingen.EigenTeamWeergeven !== undefined) {
            gebruikersInstellingen.eigenTeamWeergeven = nieuweInstellingen.EigenTeamWeergeven;
        }
        if (nieuweInstellingen.WeekendenWeergeven !== undefined) {
            gebruikersInstellingen.weekendenWeergeven = nieuweInstellingen.WeekendenWeergeven;
        }
        if (nieuweInstellingen.ID) {
            gebruikersInstellingenSPId = nieuweInstellingen.ID;
        }

        // Apply updated settings
        pasGebruikersInstellingenToe();

        // Refresh rooster if weekend settings changed
        if (nieuweInstellingen.WeekendenWeergeven !== undefined) {
            renderRooster();
        }
    }
}

// Make the function globally available for communication with settings page
window.updateGebruikersInstellingen = updateGebruikersInstellingen;
