/**
 * @file tooltipbar.js
 * @description Beheert het maken en weergeven van aangepaste tooltips.
 * 
 * Features:
 * - Responsive tooltips voor VER/ZV/Compensatie/Ziekte/Feestdagen/Buttons
 * - Permission-aware comment visibility
 * - Feestdag inspection capabilities
 * 
 * Developer utilities:
 * - window.inspectFeestdag(date|element) - Inspect feestdag by date or element
 * - window.feestdagVandaag() - Check if today is a feestdag
 * - window.feestdagenDezeMaand() - Get all feestdagen this month
 * - window.TooltipManager.testTooltipSystem() - Test all tooltip functionality
 */

// Maak een singleton object om alle tooltip-logica te beheren.
const TooltipManager = {
    tooltipElement: null,
    currentUserGroups: null,
    showTimeout: null,
    hideTimeout: null,
    globalContextMenuActive: false,

    /**
     * Check if current user belongs to privileged groups that can see comments
     * @returns {Promise<boolean>} - True if user can see comments
     */
    canSeeComments: async function() {
        if (this.currentUserGroups === null) {
            try {
                // Import permission service and get user groups
                if (typeof getCurrentUserGroups === 'function') {
                    this.currentUserGroups = await getCurrentUserGroups();
                } else {
                    console.warn('getCurrentUserGroups not available, assuming no privileged access');
                    this.currentUserGroups = [];
                }
            } catch (error) {
                console.error('Error getting user groups:', error);
                this.currentUserGroups = [];
            }
        }
        
        const privilegedGroups = [
            '1. Sharepoint beheer',
            '1.1. Mulder MT', 
            '2.6 Roosteraars',
            '2.3. Senioren beoordelen'
        ];
        
        return this.currentUserGroups.some(group => 
            privilegedGroups.some(privileged => 
                group.Title && group.Title.includes(privileged)
            )
        );
    },

    /**
     * Initialiseert de tooltip-manager. Creëert het tooltip-element en voegt het toe aan de body.
     * Deze functie moet één keer worden aangeroepen wanneer de applicatie laadt.
     */
    init: function() {
        if (this.tooltipElement) {
            console.log('TooltipManager already initialized');
            return; // Al geïnitialiseerd
        }
        
        console.log('Initializing TooltipManager');
        const tooltip = document.createElement('div');
        tooltip.id = 'custom-tooltip';
        tooltip.className = 'custom-tooltip';
        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;
        console.log('TooltipManager initialized successfully');
    },

    /**
     * Start the tooltip system with proper initialization and observation
     * This is the main entry point for ES6 modules
     */
    start: function() {
        console.log('🚀 Starting TooltipManager system');
        
        // Initialize if not already done
        this.init();
        
        // Auto-attach tooltips to existing elements
        setTimeout(() => {
            console.log('🔄 Auto-attaching tooltips to existing elements');
            this.autoAttachTooltips();
            this.observeDOM();
        }, 100);
        
        // React integration - listen for React updates
        window.addEventListener('react-update', () => {
            console.log('⚛️ React update detected, re-attaching tooltips');
            setTimeout(() => {
                this.autoAttachTooltips();
            }, 50);
        });
        
        console.log('✅ TooltipManager system started successfully');
    },

    /**
     * Koppelt tooltip-events aan een specifiek DOM-element.
     * @param {HTMLElement} element - Het element waarop de mouseover de tooltip moet tonen.
     * @param {string|function} content - De HTML-content voor de tooltip of een functie die de content retourneert.
     */
    attach: function(element, content) {
        if (!this.tooltipElement) {
            this.init();
        }

        // Skip if we've already attached to this element
        if (element.dataset.tooltipAttached === 'true') {
            return;
        }

        // State tracking for better interaction
        let isContextMenuActive = false;
        let lastInteractionType = null;

        const getDeletabilityDelay = (element) => {
            // Check if element is deletable/editable (has contextmenu interactions)
            const isDeletable = element.classList.contains('verlof-blok') || 
                               element.classList.contains('compensatie-uur-blok') ||
                               element.classList.contains('zittingsvrij-blok') ||
                               element.classList.contains('ziekte-blok') ||
                               element.hasAttribute('data-can-delete') ||
                               element.hasAttribute('data-contextmenu') ||
                               element.closest('[data-can-delete]') ||
                               element.closest('[data-contextmenu]');
            
            // Longer delay for deletable items to prevent contextmenu conflicts
            return isDeletable ? 1200 : 500; // 1.2s for deletable, 500ms for others
        };

        const showTooltip = (event) => {
            // Don't show tooltip if context menu is active (local or global)
            if (isContextMenuActive || this.globalContextMenuActive) {
                return;
            }

            // Don't show tooltip if this was triggered by right-click
            if (lastInteractionType === 'rightclick') {
                return;
            }

            // Clear any existing timeouts
            clearTimeout(this.showTimeout);
            clearTimeout(this.hideTimeout);
            
            // Determine delay based on element deletability
            const delay = getDeletabilityDelay(element);
            
            // Add delay to prevent flicker and contextmenu conflicts
            this.showTimeout = setTimeout(async () => {
                // Double-check context menu state before showing (local or global)
                if (isContextMenuActive || this.globalContextMenuActive) {
                    return;
                }

                try {
                    const tooltipContent = typeof content === 'function' ? await content() : content;
                    if (tooltipContent && typeof tooltipContent === 'string' && tooltipContent.trim()) {
                        this.show(tooltipContent);
                        this.updatePosition(event);
                    }
                } catch (error) {
                    console.error('Error generating tooltip content:', error);
                }
            }, delay);
        };

        const hideTooltip = () => {
            clearTimeout(this.showTimeout);
            clearTimeout(this.hideTimeout);
            
            // Add small delay before hiding
            this.hideTimeout = setTimeout(() => {
                this.hide();
            }, 100);
        };

        const cancelTooltip = () => {
            // Immediately cancel any pending tooltips
            clearTimeout(this.showTimeout);
            clearTimeout(this.hideTimeout);
            this.hide();
        };

        const handleRightClick = (event) => {
            lastInteractionType = 'rightclick';
            isContextMenuActive = true;
            
            // Cancel any pending tooltips immediately
            cancelTooltip();
            
            // Reset context menu state after a delay
            setTimeout(() => {
                isContextMenuActive = false;
                lastInteractionType = null;
            }, 3000); // Reset after 3 seconds
        };

        const handleLeftClick = (event) => {
            lastInteractionType = 'leftclick';
            
            // Cancel tooltip on left click as well
            cancelTooltip();
            
            // Reset after short delay
            setTimeout(() => {
                lastInteractionType = null;
            }, 1000);
        };

        const updateTooltipPosition = (event) => {
            // Don't update position if context menu is active (local or global)
            if (isContextMenuActive || this.globalContextMenuActive) {
                return;
            }

            // Throttle position updates for better performance
            if (!this.updatePositionThrottle) {
                this.updatePositionThrottle = setTimeout(() => {
                    this.updatePosition(event);
                    this.updatePositionThrottle = null;
                }, 16); // ~60fps
            }
        };

        // Mouse events
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('mousemove', updateTooltipPosition);
        
        // Click events to handle tooltip cancellation
        element.addEventListener('contextmenu', handleRightClick);
        element.addEventListener('click', handleLeftClick);
        
        // Global context menu detection
        document.addEventListener('contextmenu', () => {
            isContextMenuActive = true;
            this.globalContextMenuActive = true;
            cancelTooltip();
        });
        
        // Reset context menu state when clicking elsewhere
        document.addEventListener('click', (event) => {
            // Check if click is outside any context menu
            if (!event.target.closest('.context-menu, .contextmenu, [role="menu"]')) {
                isContextMenuActive = false;
                this.globalContextMenuActive = false;
            }
        });
        
        // ESC key to cancel tooltips and context menus
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                isContextMenuActive = false;
                this.globalContextMenuActive = false;
                cancelTooltip();
            }
        });
        
        // Mark element as having a tooltip attached
        element.dataset.tooltipAttached = 'true';
        
        // Remove native title attribute to prevent browser's default tooltip
        if (element.hasAttribute('title')) {
            element.dataset.originalTitle = element.getAttribute('title');
            element.removeAttribute('title');
        }
    },

    /**
     * Toont de tooltip met de opgegeven content.
     * @param {string} htmlContent - De HTML-string om in de tooltip weer te geven.
     */
    show: function(htmlContent) {
        if (!this.tooltipElement) {
            this.init();
        }
        this.tooltipElement.innerHTML = htmlContent;
        this.tooltipElement.style.display = 'block';
        this.tooltipElement.style.opacity = '1';
    },

    /**
     * Verbergt de tooltip.
     */
    hide: function() {
        if (!this.tooltipElement) return;
        this.tooltipElement.style.opacity = '0';
        setTimeout(() => {
            if (this.tooltipElement) {
                this.tooltipElement.style.display = 'none';
                this.tooltipElement.innerHTML = ''; // Maak leeg om memory leaks te voorkomen
            }
        }, 200);
    },

    /**
     * Werkt de positie van de tooltip bij op basis van de muispositie.
     * @param {MouseEvent} event - Het mouse event.
     */
    updatePosition: function(event) {
        if (!this.tooltipElement || this.tooltipElement.style.display === 'none') return;
        
        let x = event.clientX + 15;
        let y = event.clientY + 15;

        // Zorg ervoor dat de tooltip niet buiten het scherm valt
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (x + tooltipRect.width > viewportWidth) {
            x = event.clientX - tooltipRect.width - 15;
        }
        if (y + tooltipRect.height > viewportHeight) {
            y = event.clientY - tooltipRect.height - 15;
        }

        this.tooltipElement.style.left = `${x}px`;
        this.tooltipElement.style.top = `${y}px`;
    },
    
    /**
     * Maakt een tooltip voor een verlofitem
     * @param {Object} verlofItem - Het verlof item object
     * @returns {string} HTML voor de tooltip
     */
    createVerlofTooltip: async function(verlofItem) {
        if (!verlofItem) return '';
        
        try {
            // Bepaal de status CSS klasse
            let statusClass = '';
            let statusText = '';
            
            switch(verlofItem.Status) {
                case 'Nieuw':
                    statusClass = 'tooltip-status-new';
                    statusText = 'Nieuw';
                    break;
                case 'Goedgekeurd':
                    statusClass = 'tooltip-status-approved';
                    statusText = 'Goedgekeurd';
                    break;
                case 'Afgekeurd':
                    statusClass = 'tooltip-status-rejected';
                    statusText = 'Afgekeurd';
                    break;
                case 'Ziek':
                    statusClass = 'tooltip-status-sick';
                    statusText = 'Ziek';
                    break;
                default:
                    statusClass = '';
                    statusText = verlofItem.Status || 'Onbekend';
            }
            
            let startDatum = new Date(verlofItem.StartDatum);
            let eindDatum = new Date(verlofItem.EindDatum || verlofItem.StartDatum);
            
            // Check if user can see comments
            const canSeeComments = await this.canSeeComments();
            
            return `
                <div class="custom-tooltip-title">🌴 ${verlofItem.Titel || 'Verlof'}</div>
                <div class="custom-tooltip-content">
                    <div class="custom-tooltip-info">
                        <span class="custom-tooltip-label">👤 Medewerker:</span>
                        <span class="custom-tooltip-value">${verlofItem.MedewerkerNaam || 'Onbekend'}</span>
                    </div>
                    <div class="custom-tooltip-info">
                        <span class="custom-tooltip-label">📅 Van:</span>
                        <span class="custom-tooltip-value">${startDatum.toLocaleDateString('nl-NL')}</span>
                    </div>
                    <div class="custom-tooltip-info">
                        <span class="custom-tooltip-label">📅 Tot:</span>
                        <span class="custom-tooltip-value">${eindDatum.toLocaleDateString('nl-NL')}</span>
                    </div>
                    <div class="custom-tooltip-info">
                        <span class="custom-tooltip-label">� Status:</span>
                        <span class="tooltip-status ${statusClass}">${statusText}</span>
                    </div>
                    ${(verlofItem.Toelichting && canSeeComments) ? `
                    <div class="custom-tooltip-info">
                        <span class="custom-tooltip-label">💬 Toelichting:</span>
                        <span class="custom-tooltip-value">${verlofItem.Toelichting}</span>
                    </div>
                    ` : ''}
                </div>
            `;
        } catch (error) {
            console.error('Error creating verlof tooltip:', error, verlofItem);
            return '<div class="custom-tooltip-title">Verlof</div><div class="custom-tooltip-content">Fout bij laden van gegevens</div>';
        }
    },
    
    /**
     * Maakt een tooltip voor een feestdag
     * @param {string} feestdagNaam - De naam van de feestdag
     * @param {Date} datum - De datum van de feestdag
     * @returns {string} HTML voor de tooltip
     */
    createFeestdagTooltip: function(feestdagNaam, datum) {
        if (!feestdagNaam) return '';
        
        const datumFormatted = datum instanceof Date 
            ? datum.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : '';
            
        // Add emoji based on feestdag type
        let emoji = '🎉';
        const naam = feestdagNaam.toLowerCase();
        if (naam.includes('kerst')) emoji = '🎄';
        else if (naam.includes('nieuwjaar')) emoji = '🎊';
        else if (naam.includes('paas')) emoji = '🐣';
        else if (naam.includes('konings')) emoji = '👑';
        else if (naam.includes('bevrijding')) emoji = '🕊️';
        else if (naam.includes('hemelvaart')) emoji = '☁️';
        else if (naam.includes('pinster')) emoji = '🔥';
            
        return `
            <div class="custom-tooltip tooltip-holiday">
                <div class="custom-tooltip-title">${emoji} ${feestdagNaam}</div>
                <div class="custom-tooltip-content">
                    <div class="custom-tooltip-info">
                        <span class="custom-tooltip-label">📅 Datum:</span>
                        <span class="custom-tooltip-value">${datumFormatted}</span>
                    </div>
                    <div class="custom-tooltip-info">
                        <span class="custom-tooltip-label">🏛️ Type:</span>
                        <span class="custom-tooltip-value">Officiële feestdag</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Maakt een tooltip voor compensatie-uren
     * @param {Object} compensatieItem - Het compensatie item object
     * @returns {string} HTML voor de tooltip
     */
    createCompensatieTooltip: async function(compensatieItem) {
        if (!compensatieItem) return '';
        
        let urenTekst = '';
        let urenIcon = '';
        if (compensatieItem.AantalUren > 0) {
            urenTekst = `+${compensatieItem.AantalUren} uur`;
            urenIcon = '⬆️'; // Plus icon
        } else if (compensatieItem.AantalUren < 0) {
            urenTekst = `${compensatieItem.AantalUren} uur`;
            urenIcon = '⬇️'; // Minus icon
        } else {
            urenTekst = 'Neutraal';
            urenIcon = '⚖️'; // Balance icon
        }
        
        const startDatum = new Date(compensatieItem.StartDatum || compensatieItem.Datum);
        const eindDatum = new Date(compensatieItem.EindDatum || compensatieItem.Datum);
        const status = compensatieItem.Status || 'Actief';
        
        // Check if user can see comments
        const canSeeComments = await this.canSeeComments();
        
        return `
            <div class="custom-tooltip-title">⏰ Compensatie Uren</div>
            <div class="custom-tooltip-content">
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">👤 Medewerker:</span>
                    <span class="custom-tooltip-value">${compensatieItem.MedewerkerNaam || 'Onbekend'}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📅 Van:</span>
                    <span class="custom-tooltip-value">${startDatum.toLocaleDateString('nl-NL')}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📅 Tot:</span>
                    <span class="custom-tooltip-value">${eindDatum.toLocaleDateString('nl-NL')}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📊 Status:</span>
                    <span class="custom-tooltip-value">${status}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">${urenIcon} Uren:</span>
                    <span class="custom-tooltip-value">${urenTekst}</span>
                </div>
                ${(compensatieItem.Toelichting && canSeeComments) ? `
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">💬 Toelichting:</span>
                    <span class="custom-tooltip-value">${compensatieItem.Toelichting}</span>
                </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Maakt een tooltip voor zittingsvrij
     * @param {Object} zittingsvrijItem - Het zittingsvrij item object
     * @returns {string} HTML voor de tooltip
     */
    createZittingsvrijTooltip: async function(zittingsvrijItem) {
        if (!zittingsvrijItem) return '';
        
        let startDatum = new Date(zittingsvrijItem.StartDatum);
        let eindDatum = new Date(zittingsvrijItem.EindDatum || zittingsvrijItem.StartDatum);
        const status = zittingsvrijItem.Status || 'Actief';
        
        // Check if user can see comments
        const canSeeComments = await this.canSeeComments();
        
        return `
            <div class="custom-tooltip-title">🏛️ Zittingsvrij</div>
            <div class="custom-tooltip-content">
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">👤 Medewerker:</span>
                    <span class="custom-tooltip-value">${zittingsvrijItem.MedewerkerNaam || 'Onbekend'}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📅 Van:</span>
                    <span class="custom-tooltip-value">${startDatum.toLocaleDateString('nl-NL')}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📅 Tot:</span>
                    <span class="custom-tooltip-value">${eindDatum.toLocaleDateString('nl-NL')}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📊 Status:</span>
                    <span class="custom-tooltip-value">${status}</span>
                </div>
                ${(zittingsvrijItem.Toelichting && canSeeComments) ? `
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">💬 Toelichting:</span>
                    <span class="custom-tooltip-value">${zittingsvrijItem.Toelichting}</span>
                </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Maakt een tooltip voor ziekmelding
     * @param {Object} ziekteMeldingItem - Het ziekte melding item object
     * @returns {string} HTML voor de tooltip
     */
    createZiekteTooltip: async function(ziekteMeldingItem) {
        if (!ziekteMeldingItem) return '';
        
        let startDatum = new Date(ziekteMeldingItem.StartDatum);
        let eindDatum = ziekteMeldingItem.EindDatum ? new Date(ziekteMeldingItem.EindDatum) : null;
        const status = ziekteMeldingItem.Status || 'Actief';
        
        // Check if user can see comments
        const canSeeComments = await this.canSeeComments();
        
        return `
            <div class="custom-tooltip-title">🤒 Ziekmelding</div>
            <div class="custom-tooltip-content">
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">👤 Medewerker:</span>
                    <span class="custom-tooltip-value">${ziekteMeldingItem.MedewerkerNaam || 'Onbekend'}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📅 Van:</span>
                    <span class="custom-tooltip-value">${startDatum.toLocaleDateString('nl-NL')}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📅 Tot:</span>
                    <span class="custom-tooltip-value">${eindDatum ? eindDatum.toLocaleDateString('nl-NL') : 'Tot nader order'}</span>
                </div>
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">📊 Status:</span>
                    <span class="custom-tooltip-value">${status}</span>
                </div>
                ${(ziekteMeldingItem.Toelichting && canSeeComments) ? `
                <div class="custom-tooltip-info">
                    <span class="custom-tooltip-label">💬 Toelichting:</span>
                    <span class="custom-tooltip-value">${ziekteMeldingItem.Toelichting}</span>
                </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Automatisch tooltips toewijzen aan elementen in de DOM
     * Excludes elements with data-username attribute to prevent conflicts with ProfielKaarten
     */
    autoAttachTooltips: function() {
        console.log('🔍 Auto-attaching tooltips to DOM elements...');
        let attachedCount = 0;
        
        // Attach tooltips to verlof blocks (exclude profile card elements)
        const verlofBloks = document.querySelectorAll('.verlof-blok:not([data-username])');
        console.log(`Found ${verlofBloks.length} verlof blocks`);
        verlofBloks.forEach(element => {
            if (element.dataset.tooltipAttached === 'true') return;
            
            this.attach(element, async () => {
                const verlofData = this.extractVerlofData(element);
                return await this.createVerlofTooltip(verlofData);
            });
            attachedCount++;
        });
        
        // Attach tooltips to compensatie-uren blocks (exclude profile card elements)
        const compensatieBloks = document.querySelectorAll('.compensatie-uur-blok:not([data-username]), .compensatie-uur-container:not([data-username]), [data-afkorting="CU"]:not([data-username])');
        console.log(`Found ${compensatieBloks.length} compensatie blocks`);
        compensatieBloks.forEach(element => {
            if (element.dataset.tooltipAttached === 'true') return;
            
            this.attach(element, async () => {
                const compensatieData = this.extractCompensatieData(element);
                return await this.createCompensatieTooltip(compensatieData);
            });
            attachedCount++;
        });
        
        // Attach tooltips to zittingsvrij blocks (exclude profile card elements)
        const zittingsvrijBloks = document.querySelectorAll('.zittingsvrij-blok:not([data-username]), [data-afkorting="ZV"]:not([data-username])');
        console.log(`Found ${zittingsvrijBloks.length} zittingsvrij blocks`);
        zittingsvrijBloks.forEach(element => {
            if (element.dataset.tooltipAttached === 'true') return;
            
            this.attach(element, async () => {
                const zittingsvrijData = this.extractZittingsvrijData(element);
                return await this.createZittingsvrijTooltip(zittingsvrijData);
            });
            attachedCount++;
        });
        
        // Attach tooltips to ziekte blocks (exclude profile card elements)
        const ziekteBloks = document.querySelectorAll('.ziekte-blok:not([data-username]), [data-afkorting="ZK"]:not([data-username])');
        console.log(`Found ${ziekteBloks.length} ziekte blocks`);
        ziekteBloks.forEach(element => {
            if (element.dataset.tooltipAttached === 'true') return;
            
            this.attach(element, async () => {
                const ziekteData = this.extractZiekteData(element);
                return await this.createZiekteTooltip(ziekteData);
            });
            attachedCount++;
        });
        
        // Attach tooltips to holiday elements (improved selectors, exclude profile card elements)
        const feestdagElements = document.querySelectorAll('.feestdag:not([data-username]), [data-feestdag]:not([data-username]), .dag-cel.feestdag:not([data-username]), .feestdag-cel:not([data-username])');
        console.log(`Found ${feestdagElements.length} feestdag elements`);
        feestdagElements.forEach(element => {
            if (element.dataset.tooltipAttached === 'true') return;
            
            this.attach(element, () => {
                // Use improved inspection method
                const feestdagInfo = this.inspectFeestdagByElement(element);
                
                if (feestdagInfo) {
                    const datum = feestdagInfo.datum ? new Date(feestdagInfo.datum) : new Date();
                    return this.createFeestdagTooltip(feestdagInfo.naam, datum);
                } else {
                    // Fallback to old method
                    const feestdagNaam = element.dataset.feestdag || 
                                        element.getAttribute('title') || 
                                        element.getAttribute('data-original-title') ||
                                        element.textContent?.trim() ||
                                        'Feestdag';
                    const datum = element.dataset.datum ? new Date(element.dataset.datum) : new Date();
                    return this.createFeestdagTooltip(feestdagNaam, datum);
                }
            });
            attachedCount++;
        });
        
        // Attach tooltips to buttons with improved descriptions (exclude profile card elements)
        const buttonElements = document.querySelectorAll('button[title]:not([data-username]), button[data-tooltip]:not([data-username]), .btn[title]:not([data-username]), .btn[data-tooltip]:not([data-username]), [role="button"][title]:not([data-username])');
        console.log(`Found ${buttonElements.length} button elements`);
        buttonElements.forEach(element => {
            if (element.dataset.tooltipAttached === 'true') return;
            
            let tooltipText = element.dataset.tooltip || element.getAttribute('title') || '';
            
            // Enhance button descriptions based on class or content
            if (element.classList.contains('verlof-btn') || element.textContent?.includes('Verlof')) {
                tooltipText = tooltipText || 'Verlof aanvragen voor geselecteerde periode';
            } else if (element.classList.contains('compensatie-btn') || element.textContent?.includes('Compensatie')) {
                tooltipText = tooltipText || 'Compensatie-uren registreren voor geselecteerde periode';
            } else if (element.classList.contains('ziek-btn') || element.textContent?.includes('Ziek')) {
                tooltipText = tooltipText || 'Ziekmelding doen voor geselecteerde periode';
            } else if (element.classList.contains('zittingsvrij-btn') || element.textContent?.includes('Zittingsvrij')) {
                tooltipText = tooltipText || 'Zittingsvrije dag aanvragen voor geselecteerde periode';
            } else if (element.classList.contains('save-btn') || element.textContent?.includes('Opslaan')) {
                tooltipText = tooltipText || 'Wijzigingen opslaan';
            } else if (element.classList.contains('cancel-btn') || element.textContent?.includes('Annuleren')) {
                tooltipText = tooltipText || 'Wijzigingen annuleren';
            } else if (element.classList.contains('delete-btn') || element.textContent?.includes('Verwijder')) {
                tooltipText = tooltipText || 'Item verwijderen';
            } else if (element.classList.contains('edit-btn') || element.textContent?.includes('Bewerk')) {
                tooltipText = tooltipText || 'Item bewerken';
            }
            
            if (tooltipText) {
                this.attach(element, `<div class="custom-tooltip-title">${tooltipText}</div>`);
                attachedCount++;
            }
        });
        
        // Attach tooltips to other icons and elements with titles (exclude profile card elements)
        const iconElements = document.querySelectorAll('i[title]:not([data-tooltip-attached]):not([data-username]), .icon[title]:not([data-tooltip-attached]):not([data-username]), img[title]:not([data-tooltip-attached]):not([data-username]), [data-tooltip]:not([data-tooltip-attached]):not([data-username])');
        console.log(`Found ${iconElements.length} icon/title elements`);
        iconElements.forEach(element => {
            if (element.dataset.tooltipAttached === 'true') return;
            
            const tooltipText = element.dataset.tooltip || element.getAttribute('title') || '';
            if (tooltipText) {
                this.attach(element, `<div class="custom-tooltip-title">${tooltipText}</div>`);
                attachedCount++;
            }
        });
        
        console.log(`✅ Auto-attach tooltips completed: ${attachedCount} tooltips attached`);
    },
    
    /**
     * Extraheert verlof data uit een DOM element
     * @param {HTMLElement} element - Het verlof element
     * @returns {Object} Verlof data object
     */
    extractVerlofData: function(element) {
        const data = {
            Titel: element.dataset.titel || element.textContent?.trim() || 'Verlof',
            MedewerkerNaam: element.dataset.medewerker || 'Onbekend',
            StartDatum: element.dataset.startdatum || new Date().toISOString(),
            EindDatum: element.dataset.einddatum || null,
            Status: element.dataset.status || 'Onbekend',
            Toelichting: element.dataset.toelichting || ''
        };
        
        // Try to extract from CSS classes
        if (element.classList.contains('status-nieuw')) data.Status = 'Nieuw';
        else if (element.classList.contains('status-goedgekeurd')) data.Status = 'Goedgekeurd';
        else if (element.classList.contains('status-afgekeurd')) data.Status = 'Afgekeurd';
        
        return data;
    },
    
    /**
     * Extraheert compensatie data uit een DOM element
     * @param {HTMLElement} element - Het compensatie element
     * @returns {Object} Compensatie data object
     */
    extractCompensatieData: function(element) {
        return {
            MedewerkerNaam: element.dataset.medewerker || 'Onbekend',
            Datum: element.dataset.datum || new Date().toISOString(),
            StartDatum: element.dataset.startdatum || element.dataset.datum || new Date().toISOString(),
            EindDatum: element.dataset.einddatum || element.dataset.datum || null,
            AantalUren: parseFloat(element.dataset.uren) || 0,
            Status: element.dataset.status || 'Actief',
            Toelichting: element.dataset.toelichting || element.getAttribute('title') || ''
        };
    },
    
    /**
     * Extraheert zittingsvrij data uit een DOM element
     * @param {HTMLElement} element - Het zittingsvrij element
     * @returns {Object} Zittingsvrij data object
     */
    extractZittingsvrijData: function(element) {
        return {
            MedewerkerNaam: element.dataset.medewerker || 'Onbekend',
            StartDatum: element.dataset.startdatum || new Date().toISOString(),
            EindDatum: element.dataset.einddatum || null,
            Status: element.dataset.status || 'Actief',
            Toelichting: element.dataset.toelichting || ''
        };
    },
    
    /**
     * Extraheert ziekte data uit een DOM element
     * @param {HTMLElement} element - Het ziekte element
     * @returns {Object} Ziekte data object
     */
    extractZiekteData: function(element) {
        return {
            MedewerkerNaam: element.dataset.medewerker || 'Onbekend',
            StartDatum: element.dataset.startdatum || new Date().toISOString(),
            EindDatum: element.dataset.einddatum || null,
            Status: element.dataset.status || 'Actief',
            Toelichting: element.dataset.toelichting || ''
        };
    },
    
    /**
     * Observeer DOM veranderingen en pas tooltips toe op nieuwe elementen
     */
    observeDOM: function() {
        if (this.observer) return; // Al actief
        
        // Debounce function for better performance
        let debounceTimer = null;
        
        this.observer = new MutationObserver((mutations) => {
            let shouldReattach = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check of er nieuwe elementen zijn toegevoegd die tooltips nodig hebben
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tooltipSelectors = [
                                '.verlof-blok:not([data-username])',
                                '.compensatie-uur-blok:not([data-username])',
                                '.zittingsvrij-blok:not([data-username])',
                                '.ziekte-blok:not([data-username])',
                                '.feestdag:not([data-username])',
                                '[data-feestdag]:not([data-username])',
                                'button[title]:not([data-username])',
                                'i[title]:not([data-username])'
                            ];
                            
                            const hasTooltipElements = node.querySelectorAll ? 
                                tooltipSelectors.some(selector => node.querySelectorAll(selector).length > 0) ||
                                tooltipSelectors.some(selector => node.matches && node.matches(selector)) : false;
                                
                            if (hasTooltipElements) {
                                shouldReattach = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReattach) {
                // Debounce de reattach functie voor betere performance
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    console.log('🔄 DOM changed, reattaching tooltips...');
                    this.autoAttachTooltips();
                }, 500); // 500ms debounce
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            // Don't observe attributes for better performance
            attributes: false,
            attributeOldValue: false,
            characterData: false,
            characterDataOldValue: false
        });
        
        console.log('👁️ DOM observer started for tooltips');
    },
    
    /**
     * Stop DOM observatie
     */
    stopObserving: function() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            console.log('👁️ DOM observer stopped');
        }
    },
    
    /**
     * Inspecteer welke feestdag actief is op een gegeven datum
     * @param {Date|string} datum - De datum om te inspecteren (Date object of YYYY-MM-DD string)
     * @returns {Object|null} Feestdag informatie of null als geen feestdag gevonden
     */
    inspectFeestdagByDate: function(datum) {
        if (!datum) datum = new Date();
        
        // Converteer naar Date object indien nodig
        let targetDate;
        if (typeof datum === 'string') {
            targetDate = new Date(datum);
        } else if (datum instanceof Date) {
            targetDate = datum;
        } else {
            console.warn('Invalid date format provided to inspectFeestdagByDate');
            return null;
        }
        
        // Maak datum string in YYYY-MM-DD formaat voor vergelijking
        const dateString = targetDate.toISOString().split('T')[0];
        
        // Zoek naar feestdag elementen die overeenkomen met deze datum
        const feestdagElements = document.querySelectorAll('.feestdag, [data-feestdag], .dag-cel.feestdag, .feestdag-cel');
        
        for (const element of feestdagElements) {
            const elementDate = this.extractDateFromElement(element);
            if (elementDate && elementDate === dateString) {
                return this.extractFeestdagInfo(element);
            }
        }
        
        console.log(`No feestdag found for date: ${dateString}`);
        return null;
    },
    
    /**
     * Inspecteer feestdag informatie van een DOM element
     * @param {HTMLElement} element - Het element om te inspecteren
     * @returns {Object|null} Feestdag informatie of null als geen feestdag
     */
    inspectFeestdagByElement: function(element) {
        if (!element) {
            console.warn('No element provided to inspectFeestdagByElement');
            return null;
        }
        
        // Check of het element een feestdag element is
        const isFeestdag = element.classList.contains('feestdag') || 
                          element.hasAttribute('data-feestdag') ||
                          element.classList.contains('feestdag-cel') ||
                          (element.classList.contains('dag-cel') && element.classList.contains('feestdag'));
        
        if (!isFeestdag) {
            console.log('Element is not a feestdag element');
            return null;
        }
        
        return this.extractFeestdagInfo(element);
    },
    
    /**
     * Haal datum uit een DOM element
     * @param {HTMLElement} element - Het element
     * @returns {string|null} Datum in YYYY-MM-DD formaat of null
     */
    extractDateFromElement: function(element) {
        // Probeer verschillende manieren om de datum te extraheren
        let dateStr = element.dataset.datum || 
                     element.dataset.date ||
                     element.getAttribute('data-datum') ||
                     element.getAttribute('data-date');
        
        if (dateStr) {
            // Normaliseer datum naar YYYY-MM-DD formaat
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }
        
        // Probeer datum te extraheren uit parent element of grid structuur
        const parent = element.closest('[data-datum], [data-date], .dag-cel, .calendar-day');
        if (parent) {
            dateStr = parent.dataset.datum || 
                     parent.dataset.date ||
                     parent.getAttribute('data-datum') ||
                     parent.getAttribute('data-date');
            
            if (dateStr) {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }
        
        // Als laatste poging, probeer datum te extraheren uit ID of class namen
        const idMatch = element.id.match(/(\d{4}-\d{2}-\d{2})/);
        if (idMatch) {
            return idMatch[1];
        }
        
        return null;
    },
    
    /**
     * Extraheer feestdag informatie uit een element
     * @param {HTMLElement} element - Het feestdag element
     * @returns {Object} Feestdag informatie
     */
    extractFeestdagInfo: function(element) {
        const naam = element.dataset.feestdag || 
                    element.getAttribute('title') || 
                    element.getAttribute('data-original-title') ||
                    element.textContent?.trim() ||
                    'Onbekende feestdag';
        
        const datum = this.extractDateFromElement(element);
        let formattedDate = null;
        
        if (datum) {
            const dateObj = new Date(datum);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('nl-NL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
        }
        
        return {
            naam: naam,
            datum: datum,
            datumFormatted: formattedDate,
            element: element,
            type: 'feestdag',
            isOfficialHoliday: true
        };
    },
    
    /**
     * Krijg alle actieve feestdagen in een bepaalde periode
     * @param {Date} startDate - Startdatum (optioneel, default: vandaag)
     * @param {Date} endDate - Einddatum (optioneel, default: einde van het jaar)
     * @returns {Array} Array van feestdag objecten
     */
    getAllFeestdagenInPeriod: function(startDate = null, endDate = null) {
        if (!startDate) startDate = new Date();
        if (!endDate) {
            endDate = new Date(startDate.getFullYear(), 11, 31); // Einde van het jaar
        }
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const feestdagElements = document.querySelectorAll('.feestdag, [data-feestdag], .dag-cel.feestdag, .feestdag-cel');
        const feestdagen = [];
        
        feestdagElements.forEach(element => {
            const elementDate = this.extractDateFromElement(element);
            if (elementDate && elementDate >= startDateStr && elementDate <= endDateStr) {
                const feestdagInfo = this.extractFeestdagInfo(element);
                if (feestdagInfo) {
                    feestdagen.push(feestdagInfo);
                }
            }
        });
        
        // Sorteer op datum
        feestdagen.sort((a, b) => a.datum.localeCompare(b.datum));
        
        return feestdagen;
    },
    
    /**
     * Developer utility: Log alle feestdagen in console
     */
    logAllFeestdagen: function() {
        const feestdagen = this.getAllFeestdagenInPeriod();
        console.log('🎉 Alle feestdagen gevonden:', feestdagen);
        
        feestdagen.forEach(feestdag => {
            console.log(`📅 ${feestdag.datum} (${feestdag.datumFormatted}): ${feestdag.naam}`);
        });
        
        return feestdagen;
    },

    /**
     * Test functie om tooltip systeem te verifiëren
     */
    testTooltipSystem: function() {
        console.log('🧪 Testing tooltip system...');
        
        const testResults = {
            initialized: !!this.tooltipElement,
            elementCount: {
                verlof: document.querySelectorAll('.verlof-blok:not([data-username])').length,
                compensatie: document.querySelectorAll('.compensatie-uur-blok:not([data-username]), .compensatie-uur-container:not([data-username]), [data-afkorting="CU"]:not([data-username])').length,
                zittingsvrij: document.querySelectorAll('.zittingsvrij-blok:not([data-username]), [data-afkorting="ZV"]:not([data-username])').length,
                ziekte: document.querySelectorAll('.ziekte-blok:not([data-username]), [data-afkorting="ZK"]:not([data-username])').length,
                feestdagen: document.querySelectorAll('.feestdag:not([data-username]), [data-feestdag]:not([data-username]), .dag-cel.feestdag:not([data-username]), .feestdag-cel:not([data-username])').length,
                buttons: document.querySelectorAll('button[title]:not([data-username]), button[data-tooltip]:not([data-username]), .btn[title]:not([data-username]), .btn[data-tooltip]:not([data-username]), [role="button"][title]:not([data-username])').length,
                icons: document.querySelectorAll('i[title]:not([data-username]), .icon[title]:not([data-username]), [data-tooltip]:not([data-username]), img[title]:not([data-username])').length,
                excludedProfileElements: document.querySelectorAll('[data-username]').length
            },
            attachedCount: document.querySelectorAll('[data-tooltip-attached="true"]').length,
            userPermissions: this.currentUserGroups,
            feestdagenDetails: this.getAllFeestdagenInPeriod()
        };
        
        console.log('📊 Tooltip test results:', testResults);
        
        if (testResults.initialized) {
            console.log('✅ TooltipManager is initialized');
        } else {
            console.log('❌ TooltipManager is NOT initialized');
        }
        
        console.log(`📋 Found ${Object.values(testResults.elementCount).reduce((a, b) => a + b, 0)} total elements that should have tooltips`);
        console.log(`🔗 Currently ${testResults.attachedCount} elements have tooltips attached`);
        console.log(`👤 Excluded ${testResults.elementCount.excludedProfileElements} profile card elements from tooltips`);
        
        // Show feestdagen details
        if (testResults.feestdagenDetails.length > 0) {
            console.log(`🎉 Found ${testResults.feestdagenDetails.length} feestdagen:`);
            testResults.feestdagenDetails.forEach(feestdag => {
                console.log(`   📅 ${feestdag.datum}: ${feestdag.naam}`);
            });
        } else {
            console.log('🎉 No feestdagen found in current view');
        }
        
        // Test permission system
        this.canSeeComments().then(canSee => {
            console.log(`🔐 User can see comments: ${canSee}`);
        }).catch(err => {
            console.log(`🔐 Error checking comment permissions: ${err.message}`);
        });
        
        return testResults;
    },
};

// Exporteer de manager voor gebruik in andere modules
export default TooltipManager;

// Initialize when the document is loaded (only if not already initialized)
if (typeof window !== 'undefined' && !window.TooltipManager) {
    // Add developer utilities to window object for easy debugging
    window.TooltipManager = TooltipManager;
    
    // Global API methods for contextmenu coordination
    window.tooltipbar = {
        /**
         * Notify tooltip system that contextmenu is now active
         * This will cancel any pending tooltips and prevent new ones
         */
        setContextMenuActive: () => {
            console.log('📡 tooltipbar API: Setting contextmenu active');
            TooltipManager.globalContextMenuActive = true;
            
            // Cancel any pending tooltips
            if (TooltipManager.showTimeout) {
                clearTimeout(TooltipManager.showTimeout);
                TooltipManager.showTimeout = null;
            }
            if (TooltipManager.hideTimeout) {
                clearTimeout(TooltipManager.hideTimeout);
                TooltipManager.hideTimeout = null;
            }
            TooltipManager.hide();
        },
        
        /**
         * Notify tooltip system that contextmenu is no longer active
         * This allows tooltips to function normally again
         */
        setContextMenuInactive: () => {
            console.log('📡 tooltipbar API: Setting contextmenu inactive');
            TooltipManager.globalContextMenuActive = false;
        },
        
        /**
         * Force cancel any pending tooltip
         */
        cancelPendingTooltip: () => {
            console.log('📡 tooltipbar API: Force canceling pending tooltip');
            if (TooltipManager.showTimeout) {
                clearTimeout(TooltipManager.showTimeout);
                TooltipManager.showTimeout = null;
            }
            if (TooltipManager.hideTimeout) {
                clearTimeout(TooltipManager.hideTimeout);
                TooltipManager.hideTimeout = null;
            }
            TooltipManager.hide();
        },
        
        /**
         * Check if contextmenu is currently active
         */
        isContextMenuActive: () => {
            return TooltipManager.globalContextMenuActive || false;
        }
    };
    
    // Global helper functions for feestdag inspection
    window.inspectFeestdag = function(dateOrElement) {
        if (!dateOrElement) {
            // Show all feestdagen for current period
            return TooltipManager.logAllFeestdagen();
        } else if (typeof dateOrElement === 'string' || dateOrElement instanceof Date) {
            // Inspect by date
            return TooltipManager.inspectFeestdagByDate(dateOrElement);
        } else if (dateOrElement instanceof HTMLElement) {
            // Inspect by element
            return TooltipManager.inspectFeestdagByElement(dateOrElement);
        } else {
            console.warn('Invalid parameter for inspectFeestdag. Use a date string, Date object, or HTMLElement.');
            return null;
        }
    };
    
    // Quick function to check feestdag for today
    window.feestdagVandaag = function() {
        const today = new Date();
        const feestdag = TooltipManager.inspectFeestdagByDate(today);
        if (feestdag) {
            console.log(`🎉 Vandaag is ${feestdag.naam} (${feestdag.datumFormatted})`);
            return feestdag;
        } else {
            console.log('📅 Vandaag is geen feestdag');
            return null;
        }
    };
    
    // Function to get all feestdagen this month
    window.feestdagenDezeMaand = function() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const feestdagen = TooltipManager.getAllFeestdagenInPeriod(startOfMonth, endOfMonth);
        console.log(`🎉 Feestdagen deze maand (${startOfMonth.toLocaleDateString('nl-NL', {month: 'long', year: 'numeric'})}):`, feestdagen);
        return feestdagen;
    };
    
    console.log('🔧 Developer utilities added to window:');
    console.log('   - window.inspectFeestdag(date|element) - Inspect feestdag by date or element');
    console.log('   - window.feestdagVandaag() - Check if today is a feestdag');
    console.log('   - window.feestdagenDezeMaand() - Get all feestdagen this month');
    console.log('   - window.TooltipManager - Access full TooltipManager object');
}