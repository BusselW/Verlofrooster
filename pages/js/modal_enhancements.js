/**
 * Verbeterde modal functionaliteit voor beheerCentrum.aspx
 * Met speciale focus op Uren Per Week tab
 */

// Medewerker Autocomplete helper
class MedewerkerAutocomplete {
    constructor(inputElement, hiddenInputElement) {
        this.inputElement = inputElement;
        this.hiddenInputElement = hiddenInputElement;
        this.dropdownContainer = null;
        this.allMedewerkers = [];
        this.filteredMedewerkers = [];
        this.selectedIndex = -1;
        this.minChars = 3;
        this.setupEventListeners();
    }

    async initialize() {
        try {
            showLoading('Medewerkers laden van SharePoint...');
            await this.loadAllMedewerkers();
            hideLoading();
            
            if (this.allMedewerkers.length > 0) {
                console.log('[MedewerkerAutocomplete] Succesvol geïnitialiseerd met', this.allMedewerkers.length, 'medewerkers van SharePoint');
                showNotification(`${this.allMedewerkers.length} medewerkers geladen van SharePoint`, 'success');
            } else {
                throw new Error('Geen medewerkers gevonden in SharePoint');
            }
        } catch (error) {
            hideLoading();
            console.error('[MedewerkerAutocomplete] Fout bij initialiseren:', error);
            showNotification(`Fout bij laden medewerkers: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadAllMedewerkers() {
        try {
            // Load employees from SharePoint using the existing functions in beheerCentrum.aspx
            this.allMedewerkers = [];
            
            // Get the Medewerkers configuration
            const medewerkersConfig = typeof getLijstConfig === 'function' ? getLijstConfig("Medewerkers") : null;
            if (!medewerkersConfig) {
                throw new Error('Configuratie voor Medewerkers lijst niet gevonden. Controleer of de pagina correct is geladen.');
            }
            
            // Load data using the global loadListData function from beheerCentrum.aspx
            if (typeof window.loadListData !== 'function') {
                throw new Error('loadListData functie niet beschikbaar. Controleer of beheerCentrum.aspx correct is geladen.');
            }

            const data = await window.loadListData("Medewerkers", medewerkersConfig);
            console.log('[MedewerkerAutocomplete] Raw SharePoint data:', data);
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('Geen medewerkers data ontvangen van SharePoint. Controleer de SharePoint verbinding.');
            }

            this.allMedewerkers = data;
            
            // Sort by name for better UX
            this.allMedewerkers.sort((a, b) => {
                const nameA = a.Naam || a.Title || "";
                const nameB = b.Naam || b.Title || "";
                return nameA.localeCompare(nameB);
            });
            
            console.log(`[MedewerkerAutocomplete] ${this.allMedewerkers.length} medewerkers succesvol geladen van SharePoint`);
            
            // Log first few records to understand the data structure
            if (this.allMedewerkers.length > 0) {
                console.log('[MedewerkerAutocomplete] Voorbeeld van SharePoint data structuur:', this.allMedewerkers.slice(0, 2));
            }
        } catch (error) {
            console.error('[MedewerkerAutocomplete] Fout bij laden medewerkers van SharePoint:', error);
            throw new Error(`Kon medewerkers niet laden: ${error.message}`);
        }
    }

    setupEventListeners() {
        // Wrapper voor input element
        const wrapper = document.createElement('div');
        wrapper.className = 'medewerker-autocomplete-wrapper w-full';
        this.inputElement.parentNode.insertBefore(wrapper, this.inputElement);
        wrapper.appendChild(this.inputElement);

        // Maak dropdown container
        this.dropdownContainer = document.createElement('div');
        this.dropdownContainer.className = 'medewerker-autocomplete-dropdown hidden';
        wrapper.appendChild(this.dropdownContainer);

        // Input event listeners
        this.inputElement.addEventListener('input', this.handleInput.bind(this));
        this.inputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.inputElement.addEventListener('blur', () => {
            // Wacht even zodat klikken op een dropdown item werkt
            setTimeout(() => {
                this.hideDropdown();
            }, 200);
        });

        // Globale click handler voor buiten dropdown
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    handleInput(event) {
        try {
            const query = event.target.value.trim().toLowerCase();
            
            // Wis hidden input als gebruiker handmatig input verandert en enable het weer
            if (this.hiddenInputElement) {
                this.hiddenInputElement.value = '';
                this.hiddenInputElement.disabled = false;
                
                // Reset styling when user starts typing again
                this.hiddenInputElement.style.backgroundColor = '';
                this.hiddenInputElement.style.color = '';
                this.hiddenInputElement.style.cursor = '';
            }
            
            if (query.length < this.minChars) {
                this.hideDropdown();
                return;
            }

            this.filterMedewerkers(query);
            this.renderDropdown();
        } catch (error) {
            console.error('[MedewerkerAutocomplete] Fout bij verwerken input:', error);
            this.hideDropdown();
        }
    }

    handleKeyDown(event) {
        // Alleen verwerken als dropdown open is
        if (this.dropdownContainer.classList.contains('hidden')) {
            return;
        }

        switch(event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredMedewerkers.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection();
                break;
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredMedewerkers.length) {
                    this.selectMedewerker(this.filteredMedewerkers[this.selectedIndex]);
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.hideDropdown();
                break;
        }
    }

    /**
     * Filter medewerkers based on multiple search criteria
     * Searches across: full name, first name, last name, email, phone, username
     * This allows admins to search by typing "bussel" to find Willem Bussel,
     * or search by email, phone number, etc.
     */
    filterMedewerkers(query) {
        // Safety check to prevent errors
        if (!this.allMedewerkers || !Array.isArray(this.allMedewerkers)) {
            console.warn('[MedewerkerAutocomplete] Geen medewerkers beschikbaar om te filteren');
            this.filteredMedewerkers = [];
            this.selectedIndex = -1;
            return;
        }
        
        this.filteredMedewerkers = this.allMedewerkers.filter(medewerker => {
            // Search across multiple fields for better user experience
            const searchFields = [
                medewerker.Naam || medewerker.Title || '',           // Full name (primary)
                medewerker.Voornaam || medewerker.FirstName || '',   // First name
                medewerker.Achternaam || medewerker.LastName || '',  // Last name
                medewerker.E_x002d_mail || medewerker.Email || '',   // Email
                medewerker.Telefoon || medewerker.Phone || '',       // Phone
                medewerker.Username || '',                           // Username (org\busselw format)
                medewerker.DisplayName || ''                         // Display name if available
            ];
            
            // Check if any field contains the search term
            return searchFields.some(field => 
                field.toLowerCase().includes(query)
            );
        });

        // Reset selected index
        this.selectedIndex = this.filteredMedewerkers.length > 0 ? 0 : -1;
    }

    renderDropdown() {
        try {
            if (!this.filteredMedewerkers || !Array.isArray(this.filteredMedewerkers) || this.filteredMedewerkers.length === 0) {
                this.hideDropdown();
                return;
            }

            this.dropdownContainer.innerHTML = '';
            this.filteredMedewerkers.forEach((medewerker, index) => {
                const item = document.createElement('div');
                item.className = 'medewerker-autocomplete-item';
                if (index === this.selectedIndex) {
                    item.classList.add('selected');
                }
                
                const naam = medewerker.Naam || medewerker.Title || "";
                const voornaam = medewerker.Voornaam || medewerker.FirstName || "";
                const achternaam = medewerker.Achternaam || medewerker.LastName || "";
                const username = medewerker.Username || "";
                const email = medewerker.E_x002d_mail || medewerker.Email || "";
                
                // Show more detailed information for easier identification
                let displayInfo = '';
                if (voornaam && achternaam) {
                    displayInfo = `${voornaam} ${achternaam}`;
                } else {
                    displayInfo = naam;
                }
                
                // Show email as secondary info if available, otherwise username
                const secondaryInfo = email || username;
                
                item.innerHTML = `
                    <div class="font-medium">${displayInfo}</div>
                    <div class="text-xs opacity-70">${secondaryInfo}</div>
                `;
                
                item.addEventListener('click', () => {
                    this.selectMedewerker(medewerker);
                });
                
                this.dropdownContainer.appendChild(item);
            });
            
            this.showDropdown();
        } catch (error) {
            console.error('[MedewerkerAutocomplete] Fout bij renderen dropdown:', error);
            this.hideDropdown();
        }
    }

    showDropdown() {
        this.dropdownContainer.classList.remove('hidden');
    }

    hideDropdown() {
        this.dropdownContainer.classList.add('hidden');
    }

    updateSelection() {
        const items = this.dropdownContainer.querySelectorAll('.medewerker-autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });

        // Scroll naar geselecteerd item indien nodig
        if (this.selectedIndex >= 0) {
            const selectedItem = items[this.selectedIndex];
            if (selectedItem) {
                if (selectedItem.offsetTop < this.dropdownContainer.scrollTop) {
                    this.dropdownContainer.scrollTop = selectedItem.offsetTop;
                } else if (selectedItem.offsetTop + selectedItem.offsetHeight > this.dropdownContainer.scrollTop + this.dropdownContainer.offsetHeight) {
                    this.dropdownContainer.scrollTop = selectedItem.offsetTop + selectedItem.offsetHeight - this.dropdownContainer.offsetHeight;
                }
            }
        }
    }

    selectMedewerker(medewerker) {
        const naam = medewerker.Naam || medewerker.Title || "";
        const username = medewerker.Username || "";
        
        // Update input veld met naam
        this.inputElement.value = naam;
        
        // Update hidden input met genormaliseerde username en disable het
        if (this.hiddenInputElement) {
            this.hiddenInputElement.value = username;
            this.hiddenInputElement.disabled = true; // Disable field when auto-filled by SharePoint
            
            // Add visual indication that field is auto-filled
            this.hiddenInputElement.style.backgroundColor = '#f3f4f6';
            this.hiddenInputElement.style.color = '#6b7280';
            this.hiddenInputElement.style.cursor = 'not-allowed';
            
            // Trigger change event om andere logica te laten reageren
            const event = new Event('change', { bubbles: true });
            this.hiddenInputElement.dispatchEvent(event);
        }
        
        this.hideDropdown();
        
        // Trigger een custom event dat de medewerker is geselecteerd
        const selectEvent = new CustomEvent('medewerkerSelected', { 
            detail: { medewerker: medewerker }
        });
        this.inputElement.dispatchEvent(selectEvent);
    }

    // Static helper to create and initialize an autocomplete instance
    static async create(inputSelector, hiddenInputSelector) {
        try {
            const inputElement = document.querySelector(inputSelector);
            const hiddenInputElement = document.querySelector(hiddenInputSelector);
            
            if (!inputElement) {
                throw new Error(`Input element met selector '${inputSelector}' niet gevonden`);
            }
            
            if (!hiddenInputElement) {
                throw new Error(`Hidden input element met selector '${hiddenInputSelector}' niet gevonden`);
            }
            
            const instance = new MedewerkerAutocomplete(inputElement, hiddenInputElement);
            await instance.initialize();
            return instance;
        } catch (error) {
            console.error('[MedewerkerAutocomplete.create] Fout:', error);
            throw error;
        }
    }
}

// Helper functies voor werkrooster UI
function renderWerkroosterInputRows(container, dagenVanDeWeek, urenData = null) {
    if (!container) return;
    
    // Verwijder bestaande rijen
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Header rij
    const headerRow = document.createElement('div');
    headerRow.className = 'grid grid-cols-1 md:grid-cols-5 gap-x-3 gap-y-2 items-center p-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1';
    headerRow.innerHTML = `
        <div>Dag</div>
        <div>Vrije dag</div>
        <div>Starttijd</div>
        <div>Eindtijd</div>
        <div>Status</div>
    `;
    container.appendChild(headerRow);
    
    // Dagen rijen
    dagenVanDeWeek.forEach(dag => {
        const dagData = urenData ? {
            soort: urenData[`${dag}Soort`] || 'Werken',
            start: urenData[`${dag}Start`] || '',
            eind: urenData[`${dag}Eind`] || ''
        } : { soort: 'Werken', start: '', eind: '' };
        
        const isVrij = dagData.soort === 'VVD';
        
        const rijDiv = document.createElement('div');
        rijDiv.className = 'werkrooster-dag-row';
        rijDiv.id = `werkrooster-row-${dag.toLowerCase()}`;
        
        rijDiv.innerHTML = `
            <div class="font-medium">${dag}</div>
            <div>
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" id="uren-${dag.toLowerCase()}-vrij" class="form-checkbox h-5 w-5 text-blue-600 rounded" ${isVrij ? 'checked' : ''}>
                    <span class="text-sm">Vrije dag</span>
                </label>
            </div>
            <div>
                <input type="time" id="uren-${dag.toLowerCase()}-start" class="form-input w-full" value="${dagData.start}" ${isVrij ? 'disabled' : ''}>
            </div>
            <div>
                <input type="time" id="uren-${dag.toLowerCase()}-eind" class="form-input w-full" value="${dagData.eind}" ${isVrij ? 'disabled' : ''}>
            </div>
            <div>
                <span id="uren-${dag.toLowerCase()}-berekende-soort" class="text-sm italic">${isVrij ? 'VVD' : 'Werken'}</span>
            </div>
        `;
        
        container.appendChild(rijDiv);
        
        // Event listeners voor vrije dag toggle
        const vrijeDagCheckbox = document.getElementById(`uren-${dag.toLowerCase()}-vrij`);
        const startInput = document.getElementById(`uren-${dag.toLowerCase()}-start`);
        const eindInput = document.getElementById(`uren-${dag.toLowerCase()}-eind`);
        const berekendeSoortSpan = document.getElementById(`uren-${dag.toLowerCase()}-berekende-soort`);
        
        if (vrijeDagCheckbox && startInput && eindInput && berekendeSoortSpan) {
            const updateDagLogica = () => {
                const isVrijeDag = vrijeDagCheckbox.checked;
                startInput.disabled = isVrijeDag;
                eindInput.disabled = isVrijeDag;
                
                if (isVrijeDag) {
                    berekendeSoortSpan.textContent = 'VVD';
                    berekendeSoortSpan.className = 'text-sm';
                    return;
                }
                
                const startTijd = startInput.value;
                const eindTijd = eindInput.value;
                
                let soortDagBerekend = 'Werken';
                
                if (!startTijd && !eindTijd) {
                    soortDagBerekend = 'Niet Werkzaam';
                } else if (!startTijd || !eindTijd) {
                    soortDagBerekend = 'Onvolledig';
                } else if (startTijd >= eindTijd) {
                    soortDagBerekend = 'Tijd Fout';
                }
                
                berekendeSoortSpan.textContent = soortDagBerekend;
                berekendeSoortSpan.className = 'text-sm';
                
                if (['Tijd Fout', 'Onvolledig'].includes(soortDagBerekend)) {
                    berekendeSoortSpan.classList.add('text-red-600', 'dark:text-red-400', 'font-semibold');
                } else {
                    berekendeSoortSpan.classList.add('italic');
                }
            };
            
            vrijeDagCheckbox.addEventListener('change', updateDagLogica);
            startInput.addEventListener('change', updateDagLogica);
            eindInput.addEventListener('change', updateDagLogica);
            
            // Initialize
            updateDagLogica();
        }
    });
}

// Global tijden toepassen op alle werkdagen
function applyGlobalTimesToWeekdays() {
    const globalStartTime = document.getElementById('global-start-time')?.value;
    const globalEndTime = document.getElementById('global-end-time')?.value;
    
    if (!globalStartTime || !globalEndTime) {
        showNotification('Vul zowel start- als eindtijd in om op alle werkdagen toe te passen.', 'error');
        return;
    }
    
    const dagenVanDeWeek = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
    
    dagenVanDeWeek.forEach(dag => {
        const vrijeDagCheckbox = document.getElementById(`uren-${dag.toLowerCase()}-vrij`);
        const startInput = document.getElementById(`uren-${dag.toLowerCase()}-start`);
        const eindInput = document.getElementById(`uren-${dag.toLowerCase()}-eind`);
        
        if (vrijeDagCheckbox && !vrijeDagCheckbox.checked && startInput && eindInput) {
            startInput.value = globalStartTime;
            eindInput.value = globalEndTime;
            
            // Trigger change event
            startInput.dispatchEvent(new Event('change'));
            eindInput.dispatchEvent(new Event('change'));
        }
    });
    
    showNotification('Tijden toegepast op alle werkdagen.', 'success');
}

// Validate en verzamel werkrooster data
function validateAndCollectWerkroosterData() {
    const medewerkerInput = document.getElementById('uren-medewerker-naam');
    const medewerkerIdInput = document.getElementById('uren-medewerker-id');
    const ingangsdatumInput = document.getElementById('uren-ingangsdatum');
    
    if (!medewerkerInput || !medewerkerIdInput || !ingangsdatumInput) {
        showNotification('Formulier elementen niet gevonden.', 'error');
        return null;
    }
    
    if (!medewerkerInput.value || !medewerkerIdInput.value) {
        showNotification('Selecteer een medewerker.', 'error');
        return null;
    }
    
    if (!ingangsdatumInput.value) {
        showNotification('Ingangsdatum is verplicht.', 'error');
        return null;
    }
    
    const [year, month, day] = ingangsdatumInput.value.split('-').map(Number);
    const ingangsdatumUTC = new Date(Date.UTC(year, month - 1, day));
    
    const medewerkerNaam = medewerkerInput.value;
    const medewerkerId = medewerkerIdInput.value;
    
    const vandaag = new Date();
    const datumFormatted = vandaag.toLocaleDateString('nl-NL');
    
    // Create a SharePoint compatible object
    const roosterData = {
        __metadata: { type: 'SP.Data.UrenPerWeekListItem' },
        Title: `Werkuren ${medewerkerNaam} (${datumFormatted})`,
        MedewerkerID: medewerkerId,
        Ingangsdatum: ingangsdatumUTC.toISOString()
    };
    
    const dagenVanDeWeek = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
    let isValide = true;
    
    dagenVanDeWeek.forEach(dag => {
        const vrijeDagCheckbox = document.getElementById(`uren-${dag.toLowerCase()}-vrij`);
        const startInput = document.getElementById(`uren-${dag.toLowerCase()}-start`);
        const eindInput = document.getElementById(`uren-${dag.toLowerCase()}-eind`);
        const berekendeSoortSpan = document.getElementById(`uren-${dag.toLowerCase()}-berekende-soort`);
        
        if (!vrijeDagCheckbox || !startInput || !eindInput || !berekendeSoortSpan) {
            showNotification(`Formulier elementen voor ${dag} niet gevonden.`, 'error');
            isValide = false;
            return;
        }
        
        const isVrij = vrijeDagCheckbox.checked;
        const startVal = startInput.value;
        const eindVal = eindInput.value;
        let soortDagDefinitief = berekendeSoortSpan.textContent;
        
        if (isVrij) {
            soortDagDefinitief = "VVD";
            roosterData[`${dag}Start`] = null;
            roosterData[`${dag}Eind`] = null;
        } else {
            if (soortDagDefinitief === "Tijd Fout" || soortDagDefinitief === "Onvolledig") {
                showNotification(`Controleer de tijden voor ${dag}. Huidige status: ${soortDagDefinitief}.`, 'error');
                isValide = false;
            } else if (soortDagDefinitief === "Werken") {
                if (!startVal || !eindVal) {
                    showNotification(`Voor ${dag}: vul zowel start- als eindtijd in.`, 'error');
                    isValide = false;
                }
            }
            roosterData[`${dag}Start`] = startVal || null;
            roosterData[`${dag}Eind`] = eindVal || null;
        }
        roosterData[`${dag}Soort`] = soortDagDefinitief === "Tijd Fout" || soortDagDefinitief === "Onvolledig" ? "Niet Werkzaam" : soortDagDefinitief;
    });
    
    return isValide ? roosterData : null;
}

// Verbeter de open modal functie voor het Uren Per Week formulier
function createUrenPerWeekFormContent(config, itemData = null) {
    const today = new Date();
    const todayISOString = today.toISOString().split('T')[0];
    
    const html = `
        <div class="modal-form-content">
            <div class="form-field">
                <label for="uren-medewerker-naam" class="form-label">
                    Medewerker <span class="form-required">*</span>
                </label>
                <input type="text" id="uren-medewerker-naam" class="form-input" placeholder="Begin met typen om een medewerker te zoeken..." 
                       value="${itemData && itemData.Title ? itemData.Title.replace(/^Werkuren\s+([^(]+).*$/, '$1').trim() : ''}">
                <p class="form-help-text">Typ minimaal 3 tekens om medewerkers te zoeken</p>
            </div>
            
            <div class="form-field">
                <label for="uren-medewerker-id" class="form-label">MedewerkerID</label>
                <input type="text" id="uren-medewerker-id" class="form-input" readonly 
                       value="${itemData ? itemData.MedewerkerID || '' : ''}">
            </div>
            
            <div class="form-field">
                <label for="uren-ingangsdatum" class="form-label">
                    Ingangsdatum <span class="form-required">*</span>
                </label>
                <input type="date" id="uren-ingangsdatum" class="form-input" 
                       value="${itemData && itemData.Ingangsdatum ? new Date(itemData.Ingangsdatum).toISOString().split('T')[0] : todayISOString}">
                <p class="form-help-text">Datum vanaf wanneer dit rooster geldig is</p>
            </div>
            
            <div class="werkrooster-form-card p-4 sm:p-6 rounded-lg shadow-sm">
                <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 class="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Globale Tijdinstelling (voor Ma-Vr)</h4>
                    <div class="flex flex-col sm:flex-row items-center gap-3">
                        <div class="w-full sm:w-auto">
                            <label for="global-start-time" class="block text-xs font-medium mb-1">Starttijd</label>
                            <input type="time" id="global-start-time" class="form-input">
                        </div>
                        <div class="w-full sm:w-auto">
                            <label for="global-end-time" class="block text-xs font-medium mb-1">Eindtijd</label>
                            <input type="time" id="global-end-time" class="form-input">
                        </div>
                        <div class="w-full sm:w-auto flex items-end">
                            <button type="button" id="apply-global-time-button" class="btn btn-primary text-xs py-1.5">
                                Toepassen op alle werkdagen
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="werkrooster-input-rows" class="space-y-3">
                    <!-- Wordt dynamisch gevuld -->
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// Functie om medewerker autocomplete te initialiseren
async function initializeMedewerkerAutocomplete() {
    try {
        const medewerkerInput = document.getElementById('uren-medewerker-naam');
        const medewerkerIdInput = document.getElementById('uren-medewerker-id');
        
        if (medewerkerInput && medewerkerIdInput) {
            const autocomplete = new MedewerkerAutocomplete(medewerkerInput, medewerkerIdInput);
            try {
                await autocomplete.initialize();
                
                // Event listener voor wanneer een medewerker is geselecteerd
                medewerkerInput.addEventListener('medewerkerSelected', (event) => {
                    console.log('Medewerker geselecteerd:', event.detail.medewerker);
                    // Hier kunnen we meer logica toevoegen indien nodig
                });
            } catch (error) {
                console.error('[modal_enhancements] Fout bij initialiseren medewerker autocomplete:', error);
                // Toon een melding aan de gebruiker
                const statusElement = document.getElementById('modal-status');
                if (statusElement) {
                    statusElement.innerHTML = `
                        <div class="bg-red-100 border-red-400 text-red-700 p-3 rounded-lg border dark:bg-red-700/30 dark:text-red-200 dark:border-red-600">
                            <p>Er is een probleem opgetreden bij het laden van de medewerkerlijst. 
                            Probeer het later opnieuw of vul de gegevens handmatig in.</p>
                        </div>
                    `;
                }
            }
        } else {
            console.warn('[modal_enhancements] Medewerker input velden niet gevonden');
        }
    } catch (error) {
        console.error('[modal_enhancements] Onverwachte fout in initializeMedewerkerAutocomplete:', error);
    }
}

// Global notification function that uses the existing notification system
function showNotification(message, type = 'info') {
    try {
        // Try to use the existing notification system from beheerCentrum.aspx
        if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback to console and alert
        console[type === 'error' ? 'error' : 'log']('[modal_enhancements] ' + message);
        
        // Only show alerts for errors
        if (type === 'error') {
            alert(message);
        }
        
        // Try to find and update status element
        const statusElement = document.getElementById('modal-status');
        if (statusElement) {
            let bgClass = 'bg-blue-100 border-blue-400 text-blue-700';
            let darkClass = 'dark:bg-blue-700/30 dark:text-blue-200 dark:border-blue-600';
            
            if (type === 'error') {
                bgClass = 'bg-red-100 border-red-400 text-red-700';
                darkClass = 'dark:bg-red-700/30 dark:text-red-200 dark:border-red-600';
            } else if (type === 'success') {
                bgClass = 'bg-green-100 border-green-400 text-green-700';
                darkClass = 'dark:bg-green-700/30 dark:text-green-200 dark:border-green-600';
            } else if (type === 'warning') {
                bgClass = 'bg-yellow-100 border-yellow-400 text-yellow-700';
                darkClass = 'dark:bg-yellow-700/30 dark:text-yellow-200 dark:border-yellow-600';
            }
            
            statusElement.innerHTML = `
                <div class="${bgClass} ${darkClass} p-3 rounded-lg border">
                    <p>${message}</p>
                </div>
            `;
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    statusElement.innerHTML = '';
                }, 3000);
            }
        }
    } catch (error) {
        console.error('[modal_enhancements] Error in showNotification:', error);
        alert(message);
    }
}

function hideLoading() {
    try {
        if (typeof window.hideLoading === 'function' && window.hideLoading !== hideLoading) {
            window.hideLoading();
        }
    } catch (error) {
        console.error('[modal_enhancements] Error in hideLoading:', error);
    }
}

function showLoading(message) {
    try {
        if (typeof window.showLoading === 'function' && window.showLoading !== showLoading) {
            window.showLoading(message);
        }
    } catch (error) {
        console.error('[modal_enhancements] Error in showLoading:', error);
    }
}

// Functions to work with SharePoint items
async function createItem(listName, itemData) {
    if (!listName || !itemData) {
        throw new Error('Lijst naam en item data zijn vereist voor createItem');
    }
    
    try {
        // Get the list configuration
        const config = typeof getLijstConfig === 'function' ? getLijstConfig(listName) : null;
        if (!config) {
            throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);
        }
        
        // Use existing saveModalData flow through the form
        const form = document.getElementById('modal-form');
        if (form) {
            // We'll use form submission through standard saveModalData flow
            Object.entries(itemData).forEach(([key, value]) => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = !!value;
                    } else {
                        input.value = value === null ? '' : value;
                    }
                } else {
                    // Create hidden input for fields not in the form
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = key;
                    hiddenInput.value = value === null ? '' : value;
                    form.appendChild(hiddenInput);
                }
            });
            
            // Call the standard saveModalData function
            if (typeof saveModalData === 'function') {
                await saveModalData();
                return true;
            }
        }
        
        // Fallback if form approach doesn't work
        console.warn('[modal_enhancements] Fallback methode voor createItem gebruikt');
        const listTitle = config.lijstTitel;
        const url = `${window.sharePointContext?.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': document.getElementById('__REQUESTDIGEST')?.value || '',
                'IF-MATCH': '*'
            },
            body: JSON.stringify(itemData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`SharePoint API Error: ${error.error?.message?.value || 'Onbekende fout'}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[modal_enhancements] Error in createItem:', error);
        throw error;
    }
}

// Function to update an existing SharePoint item
async function updateItem(listName, itemId, itemData) {
    if (!listName || !itemId || !itemData) {
        throw new Error('Lijst naam, item ID, en item data zijn vereist voor updateItem');
    }
    
    try {
        // Get the list configuration
        const config = typeof getLijstConfig === 'function' ? getLijstConfig(listName) : null;
        if (!config) {
            throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);
        }
        
        // Use existing saveModalData flow through the form
        const form = document.getElementById('modal-form');
        if (form) {
            // Make sure the ID is stored
            const idInput = form.querySelector('[name="ID"]');
            if (!idInput) {
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'ID';
                hiddenInput.value = itemId;
                form.appendChild(hiddenInput);
            } else {
                idInput.value = itemId;
            }
            
            // We'll use form submission through standard saveModalData flow
            Object.entries(itemData).forEach(([key, value]) => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = !!value;
                    } else {
                        input.value = value === null ? '' : value;
                    }
                } else {
                    // Create hidden input for fields not in the form
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = key;
                    hiddenInput.value = value === null ? '' : value;
                    form.appendChild(hiddenInput);
                }
            });
            
            // Call the standard saveModalData function
            if (typeof saveModalData === 'function') {
                await saveModalData();
                return true;
            }
        }
        
        // Fallback if form approach doesn't work
        console.warn('[modal_enhancements] Fallback methode voor updateItem gebruikt');
        const listTitle = config.lijstTitel;
        const url = `${window.sharePointContext?.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': document.getElementById('__REQUESTDIGEST')?.value || '',
                'IF-MATCH': '*',
                'X-HTTP-Method': 'MERGE'
            },
            body: JSON.stringify(itemData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`SharePoint API Error: ${error.error?.message?.value || 'Onbekende fout'}`);
        }
        
        return true;
    } catch (error) {
        console.error('[modal_enhancements] Error in updateItem:', error);
        throw error;
    }
}

// Make sure loadListData is exposed to the window for modal_enhancements.js
window.loadListData = loadListData;

// Special function for handling Uren Per Week modal
async function openUrenPerWeekModal(action, itemData = null) {
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-form');
    const modalContent = document.getElementById('modal-content');
    const modalStatus = document.getElementById('modal-status');
    const modalSave = document.getElementById('modal-save');
    
    if (!modalTitle || !modalForm || !modalContent || !modalStatus) {
        showNotification('Modal elementen niet gevonden.', 'error');
        return;
    }
    
    // Show loading
    showLoading('Uren Per Week formulier laden...');
    
    try {
        // Set initial title
        const vandaag = new Date();
        const datumFormatted = vandaag.toLocaleDateString('nl-NL');
        
        if (action === 'create') {
            modalTitle.textContent = `Werkuren (${datumFormatted})`;
        } else if (action === 'edit' && itemData) {
            modalTitle.textContent = itemData.Title || `Werkuren (${datumFormatted})`;
        }
        
        // Get config
        const config = getLijstConfig("UrenPerWeek");
        if (!config) {
            throw new Error('Configuratie voor UrenPerWeek lijst niet gevonden');
        }
        
        // Generate form content
        modalContent.innerHTML = createUrenPerWeekFormContent(config, itemData);
        
        // Init components
        const dagenVanDeWeek = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
        renderWerkroosterInputRows(document.getElementById('werkrooster-input-rows'), dagenVanDeWeek, itemData);
        
        await initializeMedewerkerAutocomplete();
        
        // Add event listeners
        const applyGlobalTimeButton = document.getElementById('apply-global-time-button');
        if (applyGlobalTimeButton) {
            applyGlobalTimeButton.addEventListener('click', applyGlobalTimesToWeekdays);
        }
        
        // Setup save handler
        modalSave.removeEventListener('click', saveModalData);
        modalSave.addEventListener('click', async () => {
            await saveUrenPerWeekData(itemData ? itemData.ID : null);
        });
        
        // Show modal
        document.getElementById('modal').classList.remove('hidden');
    } catch (error) {
        console.error('[openUrenPerWeekModal] Fout bij openen modal:', error);
        showNotification('Fout bij openen formulier: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Function to save UrenPerWeek data
async function saveUrenPerWeekData(itemId = null) {
    showLoading('Werkrooster opslaan...');
    
    try {
        const formData = validateAndCollectWerkroosterData();
        if (!formData) {
            // Validation failed, message already shown
            return;
        }
        
        if (itemId) {
            // Update existing item
            await updateItem('UrenPerWeek', itemId, formData);
            showNotification('Werkrooster succesvol bijgewerkt.', 'success');
        } else {
            // Create new item
            await createItem('UrenPerWeek', formData);
            showNotification('Werkrooster succesvol aangemaakt.', 'success');
        }
        
        // Close modal and refresh data
        document.getElementById('modal').classList.add('hidden');
        
        // Refresh the tab data
        const tab = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
        if (tab === 'uren-per-week') {
            const config = getLijstConfig("UrenPerWeek");
            if (config) {
                renderListItems('UrenPerWeek', config);
            }
        }
    } catch (error) {
        console.error('[saveUrenPerWeekData] Fout bij opslaan:', error);
        showNotification('Fout bij opslaan: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Helper functie om item op te halen op basis van ID
async function fetchItemById(listName, itemId) {
    if (!listName || !itemId) {
        throw new Error('Lijst naam en item ID zijn vereist');
    }
    
    try {
        const config = typeof getLijstConfig === 'function' ? getLijstConfig(listName) : null;
        if (!config) {
            throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);
        }
        
        // Gebruik bestaande functie indien beschikbaar
        if (typeof getItemById === 'function') {
            return await getItemById(listName, itemId);
        }
        
        // Fallback naar directe SharePoint API call
        const listTitle = config.lijstTitel;
        const url = `${window.sharePointContext?.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`SharePoint API Error: ${error.error?.message?.value || 'Onbekende fout'}`);
        }
        
        const result = await response.json();
        return result.d;
    } catch (error) {
        console.error('[fetchItemById] Fout:', error);
        throw error;
    }
}

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
    console.log('[modal_enhancements] Initialisatie gestart');
    
    // Make sure we have access to key functions
    if (typeof window.loadListData !== 'function') {
        console.warn('[modal_enhancements] loadListData niet beschikbaar in window scope. Zorg ervoor dat window.loadListData = loadListData; is toegevoegd aan beheerCentrum.aspx');
    }
    
    // Setup event listeners for the UrenPerWeek tab
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                if (tabName === 'uren-per-week') {
                    console.log('[modal_enhancements] UrenPerWeek tab actief');
                }
            });
        });
    } else {
        console.warn('[modal_enhancements] Geen tab buttons gevonden');
    }
    
    // Enhance create buttons for UrenPerWeek
    document.querySelectorAll('[data-tab="uren-per-week"] .list-actions button.create-item-btn').forEach(button => {
        button.removeAttribute('onclick');
        button.addEventListener('click', () => {
            const tabName = button.closest('[data-tab]')?.getAttribute('data-tab');
            if (tabName === 'uren-per-week') {
                const config = typeof getLijstConfig === 'function' ? getLijstConfig("UrenPerWeek") : null;
                if (config) {
                    openUrenPerWeekModal('create');
                } else {
                    showNotification('Configuratie voor UrenPerWeek lijst niet gevonden', 'error');
                }
            }
        });
    });

    // Hook into edit buttons for UrenPerWeek
    document.addEventListener('click', async (e) => {
        if (e.target && e.target.matches('[data-action="edit"]')) {
            const listName = e.target.getAttribute('data-list');
            const itemId = e.target.getAttribute('data-id');
            
            if (listName === 'UrenPerWeek' && itemId) {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    const config = typeof getLijstConfig === 'function' ? getLijstConfig(listName) : null;
                    if (!config) {
                        throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);
                    }
                    
                    showLoading(`Item ${itemId} ophalen...`);
                    const data = await fetchItemById(listName, itemId);
                    hideLoading();
                    
                    if (data) {
                        openUrenPerWeekModal('edit', data);
                    }
                } catch (error) {
                    console.error('[modal_enhancements] Fout bij bewerken item:', error);
                    showNotification('Fout bij ophalen item: ' + error.message, 'error');
                    hideLoading();
                }
            }
        }
    });

    console.log('[modal_enhancements] Initialisatie voltooid');
});
