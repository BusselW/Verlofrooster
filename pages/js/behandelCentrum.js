// bestand: js/behandelen.js

// Wacht tot de Document Object Model (DOM) volledig geladen en geparset is
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM volledig geladen. Initialiseren van de 'Verlof & Compensatie Behandelen' pagina logica.");
    initialiseerBehandelPagina();
});

// Constante voor de SharePoint site URL waar de lijsten zich bevinden.
// Pas dit aan als de lijsten op een andere subsite staan.
// Idealiter wordt dit dynamisch bepaald of uit een centrale configuratie gehaald
// als spWebAbsoluteUrlBeheer in configLijst.js hiervoor bedoeld is en gevuld wordt.
const SHAREPOINT_SITE_URL_LIJSTEN = "https://som.org.om.local/sites/MulderT/Verlof/";

/**
 * initialiseerBehandelPagina
 * Hoofdfunctie om alle functionaliteit voor de pagina op te zetten.
 */
async function initialiseerBehandelPagina() {
    console.log("Start initialiseerBehandelPagina");

    stelTabFunctionaliteitIn();

    // Probeer de entity types voor de SharePoint lijsten te laden.
    // Dit is cruciaal voor het bijwerken van items.
    // We wachten hierop omdat ze nodig zijn voor de update operaties.
    try {
        await laadListItemEntityTypes();
    } catch (error) {
        console.error("Kritieke fout bij het laden van ListItemEntityTypes. Sommige functionaliteit werkt mogelijk niet.", error);
        toonNotificatie('kritiek', 'Kon essentiële lijstconfiguratie niet laden. Pagina werkt mogelijk niet correct.');
        // Overweeg hier de laadindicatoren te verbergen of een duidelijke foutmelding te tonen in de content areas.
        verbergAlleLaadIndicatoren();
        return; // Stop verdere initialisatie als dit mislukt.
    }

    // Laad initieel de data voor de actieve tab (Verlof/Ziekte)
    laadDataVoorActieveTab();

    console.log("Einde initialiseerBehandelPagina");
}

/**
 * laadListItemEntityTypes
 * Laadt de ListItemEntityTypeFullName voor de relevante lijsten.
 */
async function laadListItemEntityTypes() {
    console.log("Start laadListItemEntityTypes");
    const verlofConfig = window.getLijstConfig("Verlof");
    const compensatieConfig = window.getLijstConfig("CompensatieUren");

    if (!verlofConfig || !compensatieConfig) {
        console.error("Kon lijstconfiguratie voor Verlof of CompensatieUren niet vinden via getLijstConfig.");
        throw new Error("Lijstconfiguratie ontbreekt.");
    }

    try {
        // Gebruik Promise.all om parallel te laden
        const [verlofType, compensatieType] = await Promise.all([
            crudBasis.getItemEntityTypeFullName(SHAREPOINT_SITE_URL_LIJSTEN, verlofConfig.lijstTitel),
            crudBasis.getItemEntityTypeFullName(SHAREPOINT_SITE_URL_LIJSTEN, compensatieConfig.lijstTitel)
        ]);

        verlofListItemEntityType = verlofType;
        compensatieListItemEntityType = compensatieType;

        if (verlofListItemEntityType) {
            console.log(`Verlof ListItemEntityType succesvol geladen: ${verlofListItemEntityType}`);
        } else {
            console.warn(`Kon Verlof ListItemEntityType niet laden voor lijst: ${verlofConfig.lijstTitel}. Updates mislukken mogelijk.`);
        }
        if (compensatieListItemEntityType) {
            console.log(`Compensatie ListItemEntityType succesvol geladen: ${compensatieListItemEntityType}`);
        } else {
            console.warn(`Kon Compensatie ListItemEntityType niet laden voor lijst: ${compensatieConfig.lijstTitel}. Updates mislukken mogelijk.`);
        }

        if (!verlofListItemEntityType || !compensatieListItemEntityType) {
             throw new Error("Een of beide ListItemEntityTypes konden niet worden geladen.");
        }

    } catch (error) {
        console.error("Fout tijdens het laden van ListItemEntityTypes:", error);
        // De globale variabelen blijven null, wat later gecheckt kan worden.
        throw error; // Gooi de error door zodat initialiseerBehandelPagina het kan afvangen.
    }
    console.log("Einde laadListItemEntityTypes");
}


/**
 * stelTabFunctionaliteitIn
 * Voegt event listeners toe aan de tab-knoppen om content te wisselen.
 */
function stelTabFunctionaliteitIn() {
    console.log("Start stelTabFunctionaliteitIn");
    const tabKnoppen = document.querySelectorAll('.tab-button');
    const tabInhoudContainers = document.querySelectorAll('.tab-content');

    if (!tabKnoppen.length || !tabInhoudContainers.length) {
        console.error("Tab knoppen of inhoud containers niet gevonden.");
        return;
    }

    tabKnoppen.forEach(knop => {
        knop.addEventListener('click', function () {
            const gekozenTab = this.dataset.tab;
            console.log(`Tab knop geklikt: ${gekozenTab}`);

            tabKnoppen.forEach(k => k.classList.remove('active'));
            tabInhoudContainers.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });

            this.classList.add('active');
            const teTonenInhoud = document.getElementById(`content-${gekozenTab}`);
            if (teTonenInhoud) {
                teTonenInhoud.classList.add('active');
                teTonenInhoud.style.display = 'block';
                console.log(`Tab inhoud getoond: content-${gekozenTab}`);
                laadDataVoorTab(gekozenTab);
            } else {
                console.error(`Inhoud container 'content-${gekozenTab}' niet gevonden.`);
            }
        });
    });
    console.log("Einde stelTabFunctionaliteitIn: Event listeners toegevoegd.");
}

/**
 * laadDataVoorActieveTab
 * Bepaalt welke tab momenteel actief is en roept laadDataVoorTab aan.
 */
function laadDataVoorActieveTab() {
    console.log("Start laadDataVoorActieveTab");
    const actieveTabKnop = document.querySelector('.tab-button.active');
    if (actieveTabKnop) {
        const tabNaam = actieveTabKnop.dataset.tab;
        console.log(`Actieve tab gevonden: ${tabNaam}. Data wordt geladen.`);
        laadDataVoorTab(tabNaam);
    } else {
        console.warn("Geen actieve tab gevonden bij het laden van initiële data. Standaard 'verlof' tab data wordt geladen.");
        laadDataVoorTab('verlof'); // Fallback
    }
}

/**
 * laadDataVoorTab
 * Roept de juiste functie aan om data te laden op basis van de geselecteerde tab.
 * @param {string} tabNaam - De naam van de tab (bv. "verlof", "compensatie", "historisch").
 */
function laadDataVoorTab(tabNaam) {
    console.log(`Start laadDataVoorTab voor tab: ${tabNaam}`);
    verbergNotificaties(); // Verberg oude notificaties bij wisselen van tab

    switch (tabNaam) {
        case 'verlof':
            laadOpenstaandeVerlofAanvragen();
            break;
        case 'compensatie':
            laadOpenstaandeCompensatieAanvragen();
            break;
        case 'historisch':
            laadHistorischeAanvragen();
            break;
        default:
            console.error(`Onbekende tabnaam: ${tabNaam}`);
            toonNotificatie('fout', `Onbekende tab: ${tabNaam}. Kan data niet laden.`);
    }
}

/**
 * toonLaadIndicator
 * Toont een laadindicator in de opgegeven container.
 * @param {string} containerId - De ID van de container.
 * @param {string} bericht - Het bericht bij de laadindicator.
 */
function toonLaadIndicator(containerId, bericht = "Laden...") {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner" role="status" aria-label="${bericht}"></div>
                <p>${bericht}</p>
            </div>
        `;
        console.log(`Laadindicator getoond in ${containerId} met bericht: "${bericht}"`);
    } else {
        console.error(`Container met ID '${containerId}' niet gevonden voor laadindicator.`);
    }
}

/**
 * verbergLaadIndicator
 * Verwijdert de laadindicator uit de opgegeven container.
 * (Meestal niet nodig als de content de indicator overschrijft)
 * @param {string} containerId - De ID van de container.
 */
function verbergLaadIndicator(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const spinnerContainer = container.querySelector('.loading-spinner-container');
        if (spinnerContainer) {
            spinnerContainer.remove();
            console.log(`Laadindicator verborgen/verwijderd uit ${containerId}.`);
        }
    }
}

/**
 * verbergAlleLaadIndicatoren
 * Verbergt laadindicatoren in alle request containers.
 */
function verbergAlleLaadIndicatoren() {
    const containerIds = ['requestsContainerVerlof', 'requestsContainerCompensatie', 'requestsContainerHistorisch'];
    containerIds.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            const spinnerContainer = container.querySelector('.loading-spinner-container');
            if (spinnerContainer) spinnerContainer.remove();
        }
    });
    console.log("Alle laadindicatoren verborgen.");
}


/**
 * Haalt de interne naam op voor een gegeven titel uit de velden array van een lijstconfiguratie.
 * @param {object} lijstConfig - De configuratie van de lijst.
 * @param {string} veldTitel - De titel van het veld zoals in de configuratie.
 * @returns {string|null} De interne naam of null als niet gevonden.
 */
function getVeldInterneNaam(lijstConfig, veldTitel) {
    if (!lijstConfig || !lijstConfig.velden) return null;
    const veld = lijstConfig.velden.find(v => v.titel === veldTitel);
    return veld ? veld.interneNaam : null;
}

/**
 * laadOpenstaandeVerlofAanvragen
 * Haalt openstaande verlof/ziekte aanvragen op en toont ze.
 */
async function laadOpenstaandeVerlofAanvragen() {
    const containerId = 'requestsContainerVerlof';
    console.log(`Start laadOpenstaandeVerlofAanvragen in container: ${containerId}`);
    toonLaadIndicator(containerId, "Laden van verlofaanvragen...");

    const verlofConfig = window.getLijstConfig("Verlof");
    if (!verlofConfig) {
        document.getElementById(containerId).innerHTML = '<p class="placeholder-text text-red-600">Fout: Verloflijst configuratie niet gevonden.</p>';
        console.error("Verloflijst configuratie niet gevonden.");
        return;
    }

    // Velden ophalen uit configuratie
    const statusVeld = getVeldInterneNaam(verlofConfig, "Status") || "Status"; // Fallback
    const medewerkerVeld = getVeldInterneNaam(verlofConfig, "Medewerker") || "Medewerker";
    const startDatumVeld = getVeldInterneNaam(verlofConfig, "StartDatum") || "StartDatum";
    const eindDatumVeld = getVeldInterneNaam(verlofConfig, "EindDatum") || "EindDatum";
    const redenVeld = getVeldInterneNaam(verlofConfig, "Reden") || "Reden";
    const omschrijvingVeld = getVeldInterneNaam(verlofConfig, "Omschrijving") || "Omschrijving";
    const aanvraagTijdstipVeld = getVeldInterneNaam(verlofConfig, "AanvraagTijdstip") || "AanvraagTijdstip";


    const selectVelden = `ID,Title,${statusVeld},${medewerkerVeld},${startDatumVeld},${eindDatumVeld},${redenVeld},${omschrijvingVeld},${aanvraagTijdstipVeld}`;
    // Geen expand nodig als "Medewerker" een Text veld is zoals in config.
    const filterQuery = `${statusVeld} eq '${BEHANDEL_STATUS.NIEUW}'`;
    const orderBy = `${aanvraagTijdstipVeld} asc`; // Oudste eerst

    try {
        console.log(`Ophalen van verlofaanvragen van lijst '${verlofConfig.lijstTitel}' met filter '${filterQuery}'`);
        const aanvragen = await crudBasis.getItems(SHAREPOINT_SITE_URL_LIJSTEN, verlofConfig.lijstTitel, selectVelden, filterQuery, "", orderBy);

        verbergLaadIndicator(containerId);
        renderAanvragen(containerId, aanvragen, 'verlof', verlofConfig);
    } catch (error) {
        console.error("Fout bij het laden van openstaande verlofaanvragen:", error);
        verbergLaadIndicator(containerId);
        document.getElementById(containerId).innerHTML = `<p class="placeholder-text text-red-600">Fout bij het laden van verlofaanvragen: ${error.message}.</p>`;
        toonNotificatie('fout', `Fout bij laden verlofaanvragen: ${error.message}`);
    }
}

/**
 * laadOpenstaandeCompensatieAanvragen
 * Haalt openstaande compensatie uren aanvragen op en toont ze.
 */
async function laadOpenstaandeCompensatieAanvragen() {
    const containerId = 'requestsContainerCompensatie';
    console.log(`Start laadOpenstaandeCompensatieAanvragen in container: ${containerId}`);
    toonLaadIndicator(containerId, "Laden van compensatieaanvragen...");

    const compensatieConfig = window.getLijstConfig("CompensatieUren");
    if (!compensatieConfig) {
        document.getElementById(containerId).innerHTML = '<p class="placeholder-text text-red-600">Fout: Compensatielijst configuratie niet gevonden.</p>';
        console.error("Compensatielijst configuratie niet gevonden.");
        return;
    }

    const statusVeld = getVeldInterneNaam(compensatieConfig, "Status") || "Status";
    const medewerkerVeld = getVeldInterneNaam(compensatieConfig, "Medewerker") || "Medewerker";
    const startCompensatieVeld = getVeldInterneNaam(compensatieConfig, "StartCompensatieUren") || "StartCompensatieUren";
    const eindeCompensatieVeld = getVeldInterneNaam(compensatieConfig, "EindeCompensatieUren") || "EindeCompensatieUren";
    const urenTotaalVeld = getVeldInterneNaam(compensatieConfig, "UrenTotaal") || "UrenTotaal";
    const omschrijvingVeld = getVeldInterneNaam(compensatieConfig, "Omschrijving") || "Omschrijving";
    const aanvraagTijdstipVeld = getVeldInterneNaam(compensatieConfig, "AanvraagTijdstip") || "AanvraagTijdstip";

    const selectVelden = `ID,Title,${statusVeld},${medewerkerVeld},${startCompensatieVeld},${eindeCompensatieVeld},${urenTotaalVeld},${omschrijvingVeld},${aanvraagTijdstipVeld}`;
    const filterQuery = `${statusVeld} eq '${BEHANDEL_STATUS.NIEUW}'`;
    const orderBy = `${aanvraagTijdstipVeld} asc`;

    try {
        console.log(`Ophalen van compensatieaanvragen van lijst '${compensatieConfig.lijstTitel}' met filter '${filterQuery}'`);
        const aanvragen = await crudBasis.getItems(SHAREPOINT_SITE_URL_LIJSTEN, compensatieConfig.lijstTitel, selectVelden, filterQuery, "", orderBy);

        verbergLaadIndicator(containerId);
        renderAanvragen(containerId, aanvragen, 'compensatie', compensatieConfig);
    } catch (error) {
        console.error("Fout bij het laden van openstaande compensatieaanvragen:", error);
        verbergLaadIndicator(containerId);
        document.getElementById(containerId).innerHTML = `<p class="placeholder-text text-red-600">Fout bij het laden van compensatieaanvragen: ${error.message}.</p>`;
        toonNotificatie('fout', `Fout bij laden compensatieaanvragen: ${error.message}`);
    }
}

/**
 * laadHistorischeAanvragen
 * Haalt historische (goedgekeurde/afgewezen) aanvragen op.
 */
async function laadHistorischeAanvragen() {
    const containerId = 'requestsContainerHistorisch';
    console.log(`Start laadHistorischeAanvragen in container: ${containerId}`);
    toonLaadIndicator(containerId, "Laden van historische aanvragen...");

    const verlofConfig = window.getLijstConfig("Verlof");
    const compensatieConfig = window.getLijstConfig("CompensatieUren");

    if (!verlofConfig || !compensatieConfig) {
        document.getElementById(containerId).innerHTML = '<p class="placeholder-text text-red-600">Fout: Lijstconfiguraties niet volledig gevonden.</p>';
        console.error("Verlof en/of Compensatie lijstconfiguratie niet gevonden voor historie.");
        return;
    }
    
    // Interne veldnamen voor Verlof
    const verlofStatusVeld = getVeldInterneNaam(verlofConfig, "Status") || "Status";
    const verlofMedewerkerVeld = getVeldInterneNaam(verlofConfig, "Medewerker") || "Medewerker";
    const verlofStartDatumVeld = getVeldInterneNaam(verlofConfig, "StartDatum") || "StartDatum";
    const verlofEindDatumVeld = getVeldInterneNaam(verlofConfig, "EindDatum") || "EindDatum";
    const verlofRedenVeld = getVeldInterneNaam(verlofConfig, "Reden") || "Reden";
    const verlofAanvraagTijdstipVeld = getVeldInterneNaam(verlofConfig, "AanvraagTijdstip") || "Modified"; // Gebruik Modified voor sorteren als AanvraagTijdstip niet altijd relevant is voor historie

    // Interne veldnamen voor Compensatie
    const compStatusVeld = getVeldInterneNaam(compensatieConfig, "Status") || "Status";
    const compMedewerkerVeld = getVeldInterneNaam(compensatieConfig, "Medewerker") || "Medewerker";
    const compStartCompensatieVeld = getVeldInterneNaam(compensatieConfig, "StartCompensatieUren") || "StartCompensatieUren";
    const compEindeCompensatieVeld = getVeldInterneNaam(compensatieConfig, "EindeCompensatieUren") || "EindeCompensatieUren";
    const compUrenTotaalVeld = getVeldInterneNaam(compensatieConfig, "UrenTotaal") || "UrenTotaal";
    const compAanvraagTijdstipVeld = getVeldInterneNaam(compensatieConfig, "AanvraagTijdstip") || "Modified";


    const filterQueryHistorie = `(${verlofStatusVeld} eq '${BEHANDEL_STATUS.GOEDGEKEURD}') or (${verlofStatusVeld} eq '${BEHANDEL_STATUS.AFGEWEZEN}')`;
    const orderByHistorie = `Modified desc`; // Meest recent behandeld eerst

    const selectVerlofHistorie = `ID,Title,${verlofStatusVeld},${verlofMedewerkerVeld},${verlofStartDatumVeld},${verlofEindDatumVeld},${verlofRedenVeld},${verlofAanvraagTijdstipVeld},Modified`;
    const selectCompensatieHistorie = `ID,Title,${compStatusVeld},${compMedewerkerVeld},${compStartCompensatieVeld},${compEindeCompensatieVeld},${compUrenTotaalVeld},${compAanvraagTijdstipVeld},Modified`;

    try {
        const [verlofAanvragen, compensatieAanvragen] = await Promise.all([
            crudBasis.getItems(SHAREPOINT_SITE_URL_LIJSTEN, verlofConfig.lijstTitel, selectVerlofHistorie, filterQueryHistorie, "", orderByHistorie),
            crudBasis.getItems(SHAREPOINT_SITE_URL_LIJSTEN, compensatieConfig.lijstTitel, selectCompensatieHistorie, filterQueryHistorie, "", orderByHistorie)
        ]);

        // Voeg een type toe aan elk item om ze later te kunnen onderscheiden bij het renderen
        const getypteVerlofAanvragen = verlofAanvragen.map(item => ({ ...item, _aanvraagType: 'verlof', _config: verlofConfig }));
        const getypteCompensatieAanvragen = compensatieAanvragen.map(item => ({ ...item, _aanvraagType: 'compensatie', _config: compensatieConfig }));

        const alleHistorischeAanvragen = [...getypteVerlofAanvragen, ...getypteCompensatieAanvragen];

        // Sorteer de gecombineerde lijst op het 'Modified' veld (datum laatste wijziging)
        alleHistorischeAanvragen.sort((a, b) => new Date(b.Modified) - new Date(a.Modified));
        
        verbergLaadIndicator(containerId);
        renderAanvragen(containerId, alleHistorischeAanvragen, 'historisch', null); // Geen specifieke config nodig, type is in item

    } catch (error) {
        console.error("Fout bij het laden van historische aanvragen:", error);
        verbergLaadIndicator(containerId);
        document.getElementById(containerId).innerHTML = `<p class="placeholder-text text-red-600">Fout bij het laden van historie: ${error.message}.</p>`;
        toonNotificatie('fout', `Fout bij laden historie: ${error.message}`);
    }
}


/**
 * renderAanvragen
 * Toont de opgehaalde aanvragen in de gespecificeerde container.
 * @param {string} containerId - De ID van de container.
 * @param {Array} aanvragen - Een array met aanvraagobjecten.
 * @param {string} typeContext - 'verlof', 'compensatie', of 'historisch' (voor de context van de tab).
 * @param {object | null} specifiekeConfig - De lijstconfiguratie voor 'verlof' of 'compensatie' tab. Voor 'historisch' kan dit null zijn.
 */
function renderAanvragen(containerId, aanvragen, typeContext, specifiekeConfig) {
    console.log(`Start renderAanvragen voor context '${typeContext}' in container '${containerId}'. Aantal: ${aanvragen.length}`);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Render container '${containerId}' niet gevonden.`);
        return;
    }

    container.innerHTML = ''; // Maak leeg

    if (!aanvragen || aanvragen.length === 0) {
        let bericht = "Geen aanvragen gevonden die voldoen aan de criteria.";
        if (typeContext === 'verlof') bericht = "Geen openstaande verlofaanvragen gevonden.";
        else if (typeContext === 'compensatie') bericht = "Geen openstaande compensatieaanvragen gevonden.";
        else if (typeContext === 'historisch') bericht = "Geen historische aanvragen gevonden.";
        container.innerHTML = `<p class="placeholder-text">${bericht}</p>`;
        console.log(`Geen aanvragen om te renderen voor context '${typeContext}'.`);
        return;
    }

    const lijstUl = document.createElement('ul');
    lijstUl.className = 'aanvragen-lijst';

    aanvragen.forEach(aanvraag => {
        // Voor historie tab, haal type en config uit het item zelf
        const itemType = typeContext === 'historisch' ? aanvraag._aanvraagType : typeContext;
        const itemConfig = typeContext === 'historisch' ? aanvraag._config : specifiekeConfig;

        const li = document.createElement('li');
        li.className = 'aanvraag-item';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'aanvraag-item-details';

        // Titel van de aanvraag
        const titelP = document.createElement('h3');
        titelP.className = 'aanvraag-item-titel';
        titelP.textContent = aanvraag.Title || `Aanvraag ID: ${aanvraag.ID}`;
        detailsDiv.appendChild(titelP);

        // Dynamisch velden toevoegen op basis van type en config
        let veldenOmTeTonen = [];
        let medewerkerDisplay = aanvraag[getVeldInterneNaam(itemConfig, "Medewerker")] || 'Onbekend';

        if (itemType === 'verlof') {
            veldenOmTeTonen = [
                { label: "Medewerker", waarde: medewerkerDisplay },
                { label: "Status", waarde: aanvraag[getVeldInterneNaam(itemConfig, "Status")], isStatus: true },
                { label: "Reden", waarde: aanvraag[getVeldInterneNaam(itemConfig, "Reden")] },
                { label: "Periode", waarde: `${formatteerDatum(aanvraag[getVeldInterneNaam(itemConfig, "StartDatum")])} t/m ${formatteerDatum(aanvraag[getVeldInterneNaam(itemConfig, "EindDatum")])}` },
                { label: "Ingediend op", waarde: formatteerDatumTijd(aanvraag[getVeldInterneNaam(itemConfig, "AanvraagTijdstip")]) },
                { label: "Omschrijving", waarde: aanvraag[getVeldInterneNaam(itemConfig, "Omschrijving")] }
            ];
        } else if (itemType === 'compensatie') {
            veldenOmTeTonen = [
                { label: "Medewerker", waarde: medewerkerDisplay },
                { label: "Status", waarde: aanvraag[getVeldInterneNaam(itemConfig, "Status")], isStatus: true },
                { label: "Uren Totaal", waarde: aanvraag[getVeldInterneNaam(itemConfig, "UrenTotaal")] },
                { label: "Periode", waarde: `${formatteerDatumTijd(aanvraag[getVeldInterneNaam(itemConfig, "StartCompensatieUren")])} - ${formatteerDatumTijd(aanvraag[getVeldInterneNaam(itemConfig, "EindeCompensatieUren")])}` },
                { label: "Ingediend op", waarde: formatteerDatumTijd(aanvraag[getVeldInterneNaam(itemConfig, "AanvraagTijdstip")]) },
                { label: "Omschrijving", waarde: aanvraag[getVeldInterneNaam(itemConfig, "Omschrijving")] }
            ];
        }
         if (typeContext === 'historisch') {
            // Voeg 'Laatst gewijzigd' toe voor historische items
            veldenOmTeTonen.push({ label: "Behandeld op", waarde: formatteerDatumTijd(aanvraag.Modified) });
        }


        veldenOmTeTonen.forEach(veldInfo => {
            if (veldInfo.waarde) { // Toon alleen als er een waarde is
                const detailBlok = document.createElement('div');
                detailBlok.className = 'detail-blok';
                const p = document.createElement('p');
                const strong = document.createElement('strong');
                strong.textContent = `${veldInfo.label}: `;
                p.appendChild(strong);

                if (veldInfo.isStatus) {
                    const statusSpan = document.createElement('span');
                    statusSpan.className = `status-badge status-${veldInfo.waarde.toLowerCase().replace(/\s+/g, '-')}`;
                    statusSpan.textContent = veldInfo.waarde;
                    p.appendChild(statusSpan);
                } else {
                    p.appendChild(document.createTextNode(veldInfo.waarde));
                }
                detailBlok.appendChild(p);
                detailsDiv.appendChild(detailBlok);
            }
        });
        li.appendChild(detailsDiv);

        // Actieknoppen (alleen voor niet-historische tabs en status 'Nieuw')
        const statusAanvraag = aanvraag[getVeldInterneNaam(itemConfig, "Status")];
        if (typeContext !== 'historisch' && statusAanvraag === BEHANDEL_STATUS.NIEUW) {
            const actiesDiv = document.createElement('div');
            actiesDiv.className = 'aanvraag-item-acties';

            const goedkeurKnop = document.createElement('button');
            goedkeurKnop.className = 'btn btn-success btn-xs';
            goedkeurKnop.innerHTML = '<i class="fas fa-check"></i> Goedkeuren';
            goedkeurKnop.onclick = () => handelAanvraagStatusWijzigen(aanvraag.ID, itemType, BEHANDEL_STATUS.GOEDGEKEURD, itemConfig);
            actiesDiv.appendChild(goedkeurKnop);

            const afwijsKnop = document.createElement('button');
            afwijsKnop.className = 'btn btn-danger btn-xs';
            afwijsKnop.innerHTML = '<i class="fas fa-times"></i> Afwijzen';
            afwijsKnop.onclick = () => handelAanvraagStatusWijzigen(aanvraag.ID, itemType, BEHANDEL_STATUS.AFGEWEZEN, itemConfig);
            actiesDiv.appendChild(afwijsKnop);

            li.appendChild(actiesDiv);
        }
        lijstUl.appendChild(li);
    });
    container.appendChild(lijstUl);
    console.log(`Renderen van ${aanvragen.length} aanvragen voor context '${typeContext}' voltooid.`);
}


/**
 * Handel het wijzigen van de status van een aanvraag af.
 * @param {string|number} aanvraagId - Het ID van de aanvraag.
 * @param {string} aanvraagType - 'verlof' of 'compensatie'.
 * @param {string} nieuweStatus - De nieuwe status (bv. "Goedgekeurd", "Afgewezen").
 * @param {object} lijstConfig - De configuratie van de betreffende lijst.
 */
async function handelAanvraagStatusWijzigen(aanvraagId, aanvraagType, nieuweStatus, lijstConfig) {
    console.log(`${nieuweStatus} van ${aanvraagType} aanvraag met ID: ${aanvraagId}`);

    const bevestiging = confirm(`Weet u zeker dat u deze ${aanvraagType}aanvraag wilt ${nieuweStatus.toLowerCase()}?`);
    if (!bevestiging) {
        console.log(`Statuswijziging (${nieuweStatus}) geannuleerd door gebruiker.`);
        return;
    }

    let entityTypeFullName;
    if (aanvraagType === 'verlof') {
        entityTypeFullName = verlofListItemEntityType;
    } else if (aanvraagType === 'compensatie') {
        entityTypeFullName = compensatieListItemEntityType;
    }

    if (!entityTypeFullName) {
        const errMessage = `EntityType voor ${aanvraagType} is niet geladen. Kan item niet bijwerken.`;
        console.error(errMessage);
        toonNotificatie('fout', `Kon status niet wijzigen: configuratiefout (EntityType).`);
        return;
    }
    if (!lijstConfig) {
        const errMessage = `Lijstconfiguratie voor ${aanvraagType} ontbreekt.`;
        console.error(errMessage);
        toonNotificatie('fout', `Kon status niet wijzigen: configuratiefout (LijstConfig).`);
        return;
    }

    const statusVeldInterneNaam = getVeldInterneNaam(lijstConfig, "Status") || "Status";
    const opmerkingBehandelaarVeld = (aanvraagType === 'verlof') ? (getVeldInterneNaam(lijstConfig, "OpmerkingBehandelaar") || "OpmerkingBehandelaar") : null;

    const itemData = {
        '__metadata': { 'type': entityTypeFullName },
        [statusVeldInterneNaam]: nieuweStatus
    };

    // Optioneel: vraag om een reden/opmerking bij afwijzen (of altijd)
    if (nieuweStatus === BEHANDEL_STATUS.AFGEWEZEN && opmerkingBehandelaarVeld) {
        const opmerking = prompt(`Optioneel: geef een reden/opmerking voor het afwijzen van deze ${aanvraagType}aanvraag:`, "");
        if (opmerking !== null) { // Gebruiker klikte OK (ook als het leeg is)
            itemData[opmerkingBehandelaarVeld] = opmerking;
        }
    }
    // Je zou ook een opmerking kunnen vragen bij goedkeuren.

    try {
        await crudBasis.updateItem(SHAREPOINT_SITE_URL_LIJSTEN, lijstConfig.lijstTitel, aanvraagId, itemData);
        console.log(`${aanvraagType} aanvraag ${aanvraagId} succesvol status gewijzigd naar ${nieuweStatus}.`);
        toonNotificatie('succes', `${capitalizeFirstLetter(aanvraagType)}aanvraag succesvol ${nieuweStatus.toLowerCase()}.`);
        
        // Herlaad de data voor de huidige actieve tab om de wijziging te reflecteren
        laadDataVoorActieveTab();
    } catch (error) {
        console.error(`Fout bij status wijzigen (${nieuweStatus}) voor ${aanvraagType} aanvraag ${aanvraagId}:`, error);
        toonNotificatie('fout', `Fout bij status wijzigen: ${error.message}`);
    }
}


/**
 * Formatteert een ISO datumstring of Date object naar dd-mm-jjjj formaat.
 * @param {string | Date} datumInput - De datumstring of Date object.
 * @returns {string} Geformatteerde datum of 'N/A'.
 */
function formatteerDatum(datumInput) {
    if (!datumInput) return 'N/A';
    try {
        const datum = new Date(datumInput);
        if (isNaN(datum.getTime())) return 'Ongeldige datum';
        const dag = String(datum.getDate()).padStart(2, '0');
        const maand = String(datum.getMonth() + 1).padStart(2, '0'); // Maanden zijn 0-based
        const jaar = datum.getFullYear();
        return `${dag}-${maand}-${jaar}`;
    } catch (e) {
        console.warn(`Kon datum niet formatteren: ${datumInput}`, e);
        return 'Datumfout';
    }
}
/**
 * Formatteert een ISO datumstring of Date object naar dd-mm-jjjj HH:MM formaat.
 * @param {string | Date} datumInput - De datumstring of Date object.
 * @returns {string} Geformatteerde datum en tijd of 'N/A'.
 */
function formatteerDatumTijd(datumInput) {
    if (!datumInput) return 'N/A';
    try {
        const datum = new Date(datumInput);
        if (isNaN(datum.getTime())) return 'Ongeldige datum/tijd';
        const dag = String(datum.getDate()).padStart(2, '0');
        const maand = String(datum.getMonth() + 1).padStart(2, '0');
        const jaar = datum.getFullYear();
        const uren = String(datum.getHours()).padStart(2, '0');
        const minuten = String(datum.getMinutes()).padStart(2, '0');
        return `${dag}-${maand}-${jaar} ${uren}:${minuten}`;
    } catch (e) {
        console.warn(`Kon datum/tijd niet formatteren: ${datumInput}`, e);
        return 'Datum/tijdfout';
    }
}


/**
 * Toont een notificatiebericht aan de gebruiker.
 * @param {'succes' | 'fout' | 'info' | 'waarschuwing' | 'kritiek'} type - Het type notificatie.
 * @param {string} bericht - Het te tonen bericht.
 * @param {number} duurMs - Hoe lang de notificatie zichtbaar blijft in ms. 0 = oneindig.
 */
function toonNotificatie(type, bericht, duurMs = 7000) {
    const container = document.getElementById('notificationContainerFixed');
    if (!container) {
        console.error("Notification container (notificationContainerFixed) niet gevonden:", bericht);
        alert(`Notificatie (${type}): ${bericht}`); // Fallback
        return;
    }

    const notificatieDiv = document.createElement('div');
    notificatieDiv.className = `notification-item notification-${type}`; // Gebruik klassen uit algemeen.css

    let iconClass = '';
    switch (type) {
        case 'succes': iconClass = 'fas fa-check-circle'; break;
        case 'fout': iconClass = 'fas fa-times-circle'; break;
        case 'info': iconClass = 'fas fa-info-circle'; break;
        case 'waarschuwing': iconClass = 'fas fa-exclamation-triangle'; break;
        case 'kritiek': iconClass = 'fas fa-shield-alt'; break;
        default: iconClass = 'fas fa-bell';
    }

    notificatieDiv.innerHTML = `
        <i class="icon ${iconClass}"></i>
        <span class="message">${bericht}</span>
        <button class="close-btn" aria-label="Sluiten">&times;</button>
    `;

    notificatieDiv.querySelector('.close-btn').addEventListener('click', () => notificatieDiv.remove());
    container.prepend(notificatieDiv); // Nieuwste bovenaan
    console.log(`Notificatie (${type}): ${bericht}`);

    if (duurMs > 0 && type !== 'kritiek' && type !== 'fout') { // Kritieke en foutmeldingen blijven staan
        setTimeout(() => {
            // Voeg een fade-out toe voor een soepelere verwijdering
            notificatieDiv.style.transition = 'opacity 0.5s ease';
            notificatieDiv.style.opacity = '0';
            setTimeout(() => notificatieDiv.remove(), 500);
        }, duurMs);
    }
}

/**
 * Verbergt (verwijdert) alle huidige notificaties.
 */
function verbergNotificaties() {
    const container = document.getElementById('notificationContainerFixed');
    if (container) {
        container.innerHTML = '';
        console.log("Alle notificaties verborgen/verwijderd.");
    }
}

/**
 * Helper functie om de eerste letter van een string een hoofdletter te maken.
 * @param {string} string - De input string.
 * @returns {string} De string met de eerste letter als hoofdletter.
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
