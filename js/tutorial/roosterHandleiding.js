// roosterHandleiding.js - Handleiding voor het Verlofrooster systeem
// Vervangen inhoud met nieuwe handleiding tekst

export const handleidingContent = {
    algemeen: {
        title: "📋 Het Verlofrooster",
        icon: "📋",
        sections: [
            {
                title: "Het Verlofrooster",
                content: `
                    <p>Door de aanhoudende problemen met het verlofrooster in Excel heeft het SharePoint-team een andere oplossing ingericht waarmee je gelijktijdig je verlof kan doorgeven. Geen meldingen meer over dat het bestand in gebruik is, dus!</p>
                    
                    <h4>🎯 In het rooster kun je primair het volgende doen:</h4>
                    <ul>
                        <li><strong>Verlof aanvragen</strong></li>
                        <li><strong>Je ziek melden</strong></li>
                        <li><strong>Compensatie-uren doorgeven</strong></li>
                        <li><strong>Zittingsvrije momenten opgeven</strong></li>
                    </ul>
                `
            }
        ]
    },
    
    gebruikswijze: {
        title: "🛠️ Wat je moet weten",
        icon: "🛠️",
        sections: [
            {
                title: "Wat je moet weten",
                content: `
                    <p>Het aanvragen van verlof, het melden van ziekte, het doorgeven van compensatie-uren en het opgeven van zittingsvrije momenten doe je via één van de volgende twee opties:</p>
                    
                    <h4>📱 Optie 1: Floating Action Button</h4>
                    <p>Klik op de blauwe + knop rechtsonder in het scherm en kies wat je wilt doorgeven.</p>
                    <div class="demo-component">
                        <div class="fab-demo">
                            <div class="fab-container-demo">
                                <button class="fab-main-demo" disabled>
                                    <span class="fab-icon">+</span>
                                </button>
                                <div class="fab-menu-demo">
                                    <div class="fab-item-demo">📝 Verlof aanvragen</div>
                                    <div class="fab-item-demo">🤒 Ziek melden</div>
                                    <div class="fab-item-demo">⏰ Compensatie-uren</div>
                                    <div class="fab-item-demo">⚖️ Zittingsvrij</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h4>🖱️ Optie 2: Contextmenu</h4>
                    <p>Klik met de rechtermuisknop op een dag in het rooster, kies 'Nieuw' en selecteer het gewenste type gebeurtenis.</p>
                    <div class="demo-component">
                        <div class="contextmenu-demo">
                            <div class="contextmenu-container">
                                <div class="contextmenu-header">📅 Nieuw</div>
                                <div class="contextmenu-item">📝 Verlof aanvragen</div>
                                <div class="contextmenu-item">🤒 Ziek melden</div>
                                <div class="contextmenu-item">⏰ Compensatie-uren doorgeven</div>
                                <div class="contextmenu-item">⚖️ Zittingsvrij opgeven</div>
                            </div>
                        </div>
                    </div>
                `
            }
        ]
    },
    
    compensatieUren: {
        title: "⏰ Compensatie-uren",
        icon: "⏰",
        sections: [
            {
                title: "Compensatie-uren",
                content: `
                    <p>Verlofaanvragen en ziekmeldingen zijn voor de meeste mensen bekend. Compensatie-uren zijn misschien minder vanzelfsprekend. Door compensatie-uren in te vullen geef je aan dat je op een bepaalde dag extra hebt gewerkt.</p>
                    
                    <p>Na je keuze verschijnt er een formulier dat je verder kunt invullen.</p>
                    
                    <h4>🔄 Compenseren zonder ruilen</h4>
                    <p>Het kan voorkomen dat je (bijvoorbeeld door omstandigheden in het vorige jaar) min-uren hebt opgelopen. Het is in dat geval de bedoeling dat je die uren inhaalt door extra te werken. In dat geval spreek je met je leidinggevende af wanneer je die uren zal inhalen. Op het verlofrooster worden dit als 'neutrale uren' weergegeven. Er verschijnt op de dag waarop je de uren inhaalt een geel klokje.</p>
                    
                    <h4>🔄 Compenseren door te ruilen (tijd-voor-tijd ruilen)</h4>
                    <p>Stel dat je 9 uur per dag werkt en 36 uur per week maakt, dan wil dat zeggen dat je een volledige dag vrij bent. Soms kan je tandarts op geen enkele andere dag dan de woensdagochtend, echter werk jij normaliter gewoon op de woensdagmorgen… je kan – in overleg met je leidinggevende – ervoor kiezen om op de dag van je afspraak vrij te zijn. Als je daarvoor geen verlof wil opnemen dan kun je daar tijd voor tijd ruilen. Dat wil zeggen dat je woensdag en in afwijking van je reguliere werk-uren niet werkt en in plaats daarvan die uren op een andere dag werkt.</p>
                    
                    <p>Op het 'compensatie-uren doorgeven' formulier staat onderaan het formulier een checkbox met 'tijd voor tijd ruilen'. Als je dit aanvinkt krijg je de mogelijkheid een tweede datum in te vullen. In het eerste datumveld op het formulier geef je aan welke dag je vrij wil zijn terwijl de tweede dag zal weergeven op welke dag je extra hebt gewerkt.</p>
                    
                    <p>Na het juist invullen van deze twee datums/data verschijnt er – net als bij reguliere uren - een klokje op het rooster. Het groene klokje als indicatie voor de plus-uren, het rode klokje als indicator voor de min-uren. Als je kort met je muis op het compensatie-uren klokje blijft hangen zal de datum verschijnen waarmee je hebt geruild.</p>
                    
                    <p>Mogelijk heb je bij de start van het nieuwe jaar (het berekenen van je verlofuren voor dat kalenderjaar) een tekort opgelegd gekregen. In dat geval kun je die uren inhalen door die uren in te halen.</p>
                    
                    <p>In beide gevallen vul je het formulier volledig in (uiteraard zijn opmerkingen optioneel. Gebruik deze vooral als je toch iets wil aangeven over je verlof). Vervolgens sla je het formulier op waarna je terugkeert naar het rooster. De gebeurtenis zal in dat geval op je scherm verschijnen.</p>
                `
            }
        ]
    },
    
    datumSelectie: {
        title: "📅 Twee data selecteren",
        icon: "📅",
        sections: [
            {
                title: "Twee data selecteren",
                content: `
                    <p>Je kan 2 data selecteren om deze snel in te vullen op het formulier. Klik bijvoorbeeld eerst op woensdag 16 juli en vervolgens op donderdag 31 juli. Bij de eerste keer klikken zal het blokje voor die dag oranje kleuren. Bij de tweede keer klikken zal die datum inclusief alle dagen tussen klik 1 en klik 2 opkleuren.</p>
                    
                    <p>Je kan vervolgens op de knop rechtsonderin je scherm of via het rechtsklikken → Nieuw een nieuwe gebeurtenis aanmaken. Op het formulier zullen de start en einddatum automatisch worden gevuld met 16 juli en 31 juli.</p>
                `
            }
        ]
    },
    
    zittingsvrijCompensatie: {
        title: "⚖️ Zittingsvrij en compensatie-uren",
        icon: "⚖️",
        sections: [
            {
                title: "Zittingsvrij en compensatie-uren",
                content: `
                    <p>Je hebt in beginsel twee manieren waarop je je compensatie-uren kan doorgeven. Als je simpelweg het formulier invult zonder 'Ruildag' aan te vinken dan is het een vrij simpel proces waarbij je slechts de datum</p>
                    
                    <p>In het compensatieformulier staat een extra checkbox genaamd 'ruildag doorgeven'. Als je deze aanvinkt dan verschijnt er een extra datum-veld.</p>
                `
            }
        ]
    },
    
    statusVerzoek: {
        title: "📋 Status van je verzoek",
        icon: "📋",
        sections: [
            {
                title: "Status van je verzoek",
                content: `
                    <h4>✅ De volgende gebeurtenissen worden automatisch op 'goedgekeurd' gezet:</h4>
                    <ul>
                        <li><strong>Ziekte doorgeven</strong></li>
                        <li><strong>Compensatie-uren doorgeven</strong> (overleg dit wel met je teamleider!)</li>
                        <li><strong>Zittingsvrije uren opgeven</strong></li>
                    </ul>
                    
                    <p>Enkel de 'Verlof/vakantie' aanvraag dient goedgekeurd te worden door je leidinggevende dan wel senior. Het bijhorende 'blok' in het rooster zal daarom in eerste instantie doorzichtig worden weergeven. Na goedkeuring van je verlof zal het doorzichtige verdwijnen en kleurt de rand van je verlofaanvraag groen.</p>
                `
            }
        ]
    }
};

// Modal class for displaying the manual
export class RoosterHandleiding {
    constructor() {
        this.currentSection = null;
        this.modalElement = null;
        this.isOpen = false;
    }
    
    // Open the manual modal
    open(sectionKey = 'algemeen') {
        if (this.isOpen) {
            this.switchSection(sectionKey);
            return;
        }
        
        this.isOpen = true;
        this.currentSection = sectionKey;
        this.createModal();
        this.showSection(sectionKey);
        
        // Add escape key listener
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
    
    // Close the manual modal
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        if (this.modalElement) {
            // Add fade out animation
            this.modalElement.style.opacity = '0';
            this.modalElement.style.animation = 'backdropFadeOut 0.3s ease forwards';
            
            setTimeout(() => {
                if (this.modalElement && this.modalElement.parentNode) {
                    document.body.removeChild(this.modalElement);
                }
                this.modalElement = null;
            }, 300);
        }
        
        // Remove escape key listener
        document.removeEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Fire custom event
        document.dispatchEvent(new CustomEvent('handleiding-closed'));
        
        console.log('Handleiding modal closed');
    }
    
    // Handle keyboard events
    handleKeyPress(event) {
        if (event.key === 'Escape') {
            this.close();
        }
    }
    
    // Create the modal structure with tabs
    createModal() {
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'handleiding-modal-backdrop';
        
        this.modalElement.innerHTML = `
            <div class="handleiding-modal">
                <div class="handleiding-modal-header">
                    <h2 class="handleiding-modal-title">
                        📚 Verlofrooster Handleiding
                    </h2>
                    <button class="handleiding-close-btn" id="handleiding-close" type="button">
                        ✕
                    </button>
                </div>
                <div class="handleiding-modal-body">
                    <div class="handleiding-tabs">
                        ${this.createTabs()}
                    </div>
                    <div class="handleiding-content" id="handleiding-content">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modalElement);
        
        // Force reflow to ensure styles are applied
        this.modalElement.offsetHeight;
        
        // Add event listeners
        this.addEventListeners();
    }
    
    // Create tab navigation
    createTabs() {
        const sections = Object.keys(handleidingContent);
        
        return sections.map(key => {
            const section = handleidingContent[key];
            return `
                <button class="handleiding-tab ${key === this.currentSection ? 'active' : ''}" 
                        data-section="${key}" type="button">
                    <span class="handleiding-tab-icon">${section.icon}</span>
                    <span class="handleiding-tab-title">${section.title}</span>
                </button>
            `;
        }).join('');
    }
    
    // Show specific section content
    showSection(sectionKey) {
        const section = handleidingContent[sectionKey];
        if (!section) return;
        
        this.currentSection = sectionKey;
        
        // Update tab active state
        const tabs = this.modalElement.querySelectorAll('.handleiding-tab');
        tabs.forEach(tab => {
            if (tab.dataset.section === sectionKey) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update main content
        const contentArea = this.modalElement.querySelector('#handleiding-content');
        
        let html = `
            <div class="handleiding-section">
                <div class="handleiding-section-header">
                    <h1>${section.icon} ${section.title}</h1>
                </div>
        `;
        
        section.sections.forEach(subsection => {
            html += `
                <div class="handleiding-subsection">
                    <h3>${subsection.title}</h3>
                    <div class="handleiding-subsection-content">
                        ${subsection.content}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        contentArea.innerHTML = html;
        
        // Scroll to top of content
        contentArea.scrollTop = 0;
    }
    
    // Switch to different section
    switchSection(sectionKey) {
        this.showSection(sectionKey);
    }
    
    // Add event listeners
    addEventListeners() {
        // Close button
        const closeBtn = this.modalElement.querySelector('#handleiding-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });
        }
        
        // Tab navigation
        const tabs = this.modalElement.querySelectorAll('.handleiding-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const sectionKey = tab.dataset.section;
                this.switchSection(sectionKey);
            });
        });
        
        // Close when clicking backdrop (outside modal)
        this.modalElement.addEventListener('click', (event) => {
            if (event.target === this.modalElement) {
                this.close();
            }
        });
        
        // Prevent modal clicks from closing
        const modal = this.modalElement.querySelector('.handleiding-modal');
        if (modal) {
            modal.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
    }
}

// Create and export instance
export const roosterHandleiding = new RoosterHandleiding();

// Export utility function to open specific sections
export const openHandleiding = (section = 'algemeen') => {
    roosterHandleiding.open(section);
};

// Alias for backward compatibility
export const roosterTutorial = {
    start: () => roosterHandleiding.open('algemeen'),
    openSection: (section) => roosterHandleiding.open(section)
};