/**
 * UrenPerWeek Tab Enhancements voor beheerCentrum.aspx
 */

// Wacht tot DOM geladen is
document.addEventListener('DOMContentLoaded', () => {
    setupUrenPerWeekTabListeners();
    console.log('UrenPerWeek tab enhancements geladen');
});

// Setup listeners voor UrenPerWeek tab specifieke functionaliteit
function setupUrenPerWeekTabListeners() {
    // Merk op tab wissel
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            if (tabName === 'uren-per-week') {
                console.log('UrenPerWeek tab geactiveerd');
            }
        });
    });

    // Als modal opent, voeg event listener toe voor Medewerker selectie
    document.addEventListener('click', async (e) => {
        if (e.target && (e.target.id === 'modal-close' || e.target.id === 'modal-cancel')) {
            // Modal wordt gesloten
        }
        
        if (e.target && e.target.matches('[onclick*="openCreateModal"]')) {
            const tab = e.target.getAttribute('data-tab') || currentTab;
            if (tab === 'uren-per-week') {
                console.log('UrenPerWeek create modal geopend');
                
                // Dit zet een MutationObserver op die wacht tot de medewerker select beschikbaar is
                const observer = new MutationObserver((mutations, obs) => {
                    const medewerkerInput = document.getElementById('uren-medewerker-naam');
                    if (medewerkerInput) {
                        obs.disconnect(); // Stop observatie
                        setupMedewerkerInputListener();
                    }
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        }
    });
}

// Setup listener voor medewerker selectie om automatisch titel bij te werken
function setupMedewerkerInputListener() {
    const medewerkerInput = document.getElementById('uren-medewerker-naam');
    if (!medewerkerInput) return;

    // Luister naar custom event wanneer medewerker geselecteerd is
    medewerkerInput.addEventListener('medewerkerSelected', (event) => {
        const medewerker = event.detail.medewerker;
        const naam = medewerker.Naam || medewerker.Title || "";
        
        // Update modal title
        const vandaag = new Date();
        const datumFormatted = vandaag.toLocaleDateString('nl-NL');
        const titelElement = document.getElementById('modal-title');
        
        if (titelElement) {
            titelElement.textContent = `Werkuren ${naam} (${datumFormatted})`;
        }
    });
}
