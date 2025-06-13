// /k.zip/js/contextMenu_logic.js (nieuw bestand)

document.addEventListener('DOMContentLoaded', () => {
    initializeContextMenu();
    console.log("Context Menu Logic Initialized.");
});

function initializeContextMenu() {
    const roosterContainer = document.getElementById('rooster-data-rows');
    const contextMenu = document.getElementById('rooster-context-menu');

    if (!roosterContainer || !contextMenu) {
        console.error("Context menu of rooster container niet gevonden.");
        return;
    }

    // Listener voor de rechtermuisknop-klik op het rooster
    roosterContainer.addEventListener('contextmenu', (event) => {
        const targetCell = event.target.closest('.rooster-cel');

        // Check of er geklikt is op een cel met een event van de huidige gebruiker
        if (targetCell && targetCell.dataset.eventId && window.huidigeGebruiker) {
            const ownerUsername = targetCell.dataset.ownerUsername || '';
            const currentUserUsername = window.huidigeGebruiker.normalizedUsername || '';

            if (ownerUsername.toLowerCase() === currentUserUsername.toLowerCase()) {
                event.preventDefault(); // Voorkom het standaard browser menu

                // Sla de event data op in het menu zelf voor later gebruik
                contextMenu.dataset.eventId = targetCell.dataset.eventId;
                contextMenu.dataset.eventType = targetCell.dataset.eventType;

                // Positioneer en toon het menu
                contextMenu.style.top = `${event.clientY}px`;
                contextMenu.style.left = `${event.clientX}px`;
                contextMenu.classList.remove('hidden');
            } else {
                // Event is niet van de huidige gebruiker, verberg ons menu en laat standaard gedrag toe
                contextMenu.classList.add('hidden');
            }
        } else {
            // Geen geldig event, verberg ons menu
            contextMenu.classList.add('hidden');
        }
    });

    // Verberg het menu als ergens anders op de pagina wordt geklikt
    document.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
    });

    // Event listeners voor de menu-opties
    const bewerkKnop = document.getElementById('context-menu-bewerken');
    const verwijderKnop = document.getElementById('context-menu-verwijderen');

    if (bewerkKnop) {
        bewerkKnop.addEventListener('click', (e) => {
            e.preventDefault();
            const eventId = contextMenu.dataset.eventId;
            const eventType = contextMenu.dataset.eventType;
            console.log(`Bewerken geklikt voor ${eventType} met ID: ${eventId}`);
            handleBewerken(eventType, eventId);
            contextMenu.classList.add('hidden');
        });
    }

    if (verwijderKnop) {
        verwijderKnop.addEventListener('click', (e) => {
            e.preventDefault();
            const eventId = contextMenu.dataset.eventId;
            const eventType = contextMenu.dataset.eventType;
            console.log(`Verwijderen geklikt voor ${eventType} met ID: ${eventId}`);
            handleVerwijderen(eventType, eventId);
            contextMenu.classList.add('hidden');
        });
    }
}

async function handleBewerken(type, id) {
    // Roep de nieuwe centrale functie aan die we in verlofroosterModal_logic.js zullen maken
    if (typeof window.openModalVoorBewerken === 'function') {
        await window.openModalVoorBewerken(type, id);
    } else {
        console.error("Functie 'openModalVoorBewerken' is niet gevonden. Zorg ervoor dat deze is gedefinieerd in verlofroosterModal_logic.js.");
        alert("Bewerkingsfunctionaliteit is momenteel niet beschikbaar.");
    }
}

function handleVerwijderen(type, id) {
    const typeNaam = type === 'verlof' ? 'verlofaanvraag' : (type === 'compensatie' ? 'compensatiemelding' : 'zittingvrij melding');
    
    // Gebruik een simpele `confirm` dialoog voor nu. Dit kan later vervangen worden door een mooiere modal.
    const isConfirmed = confirm(`Weet je zeker dat je deze ${typeNaam} wilt verwijderen?`);
    
    if (isConfirmed) {
        // Roep een functie aan om het item daadwerkelijk te verwijderen
        verwijderItemUitSharePoint(type, id);
    }
}

async function verwijderItemUitSharePoint(type, id) {
    let lijstKey = '';
    switch(type) {
        case 'verlof': lijstKey = 'Verlof'; break;
        case 'compensatie': lijstKey = 'CompensatieUren'; break;
        case 'zittingvrij': lijstKey = 'IncidenteelZittingVrij'; break;
        default:
            console.error(`Onbekend event type voor verwijderen: ${type}`);
            toonNotificatie(`Onbekend type item kan niet worden verwijderd.`, 'error');
            return;
    }

    if (typeof window.deleteSPListItem !== 'function') {
        console.error("Functie 'deleteSPListItem' niet gevonden in machtigingen.js");
        alert("Verwijderfunctionaliteit is momenteel niet beschikbaar.");
        return;
    }
    
    try {
        toonNotificatie('Item wordt verwijderd...', 'info');
        await window.deleteSPListItem(lijstKey, id);
        toonNotificatie('Item succesvol verwijderd.', 'success');
        
        // Herlaad de data om het rooster te vernieuwen
        if(typeof window.laadInitiëleData === 'function') {
            await window.laadInitiëleData(false);
        }

    } catch (error) {
        console.error(`Fout bij verwijderen van item ${id} uit lijst ${lijstKey}:`, error);
        toonNotificatie(`Kon het item niet verwijderen: ${error.message}`, 'error');
    }
}