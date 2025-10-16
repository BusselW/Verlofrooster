// Moving Orange Square Tutorial System
// Enhanced version with animated orange square instead of overlay + highlights
// Provides smooth movement animations between tutorial steps

import { tutorialSteps } from './roosterTutorial.js';

// Helper function to find elements (reused from original)
export const findTutorialElement = (elementId) => {
    // Try different methods to find the element
    let element = document.getElementById(elementId);
    
    if (!element) {
        element = document.querySelector(`.${elementId}`);
    }
    
    if (!element) {
        element = document.querySelector(`[data-tutorial-id="${elementId}"]`);
    }
    
    // Special cases for elements that might not have exact IDs
    if (!element) {
        switch(elementId) {
            case 'dag-cel':
                element = document.querySelector('.dag-cel:not(.weekend)') || 
                         document.querySelector('td.dag-kolom:not(.weekend)') ||
                         document.querySelector('td[class*="dag"]');
                break;
            case 'verlof-blok':
                element = document.querySelector('.verlof-blok') ||
                         document.querySelector('[data-afkorting="VER"]') ||
                         document.querySelector('.blok[style*="green"]') ||
                         document.querySelector('[class*="verlof"]');
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
                element = document.querySelector('.ziekte-blok') ||
                         document.querySelector('[data-afkorting="ZK"]') ||
                         document.querySelector('.blok[style*="red"]') ||
                         document.querySelector('[class*="ziek"]');
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
                element = document.querySelector('.compensatie-uur-blok') ||
                         document.querySelector('.compensatie-uur-container') ||
                         document.querySelector('[data-afkorting="CU"]') ||
                         document.querySelector('.blok[style*="blue"]') ||
                         document.querySelector('[class*="compensatie"]');
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
            case 'weekend-kolom':
                element = document.querySelector('.weekend') ||
                         document.querySelector('.dag-kolom.weekend') ||
                         document.querySelector('th.weekend');
                break;
            case 'vandaag-kolom':
                element = document.querySelector('.vandaag') ||
                         document.querySelector('.dag-kolom.vandaag') ||
                         document.querySelector('th.vandaag') ||
                         document.querySelector('[class*="today"]');
                break;
            case 'fab-container':
                element = document.querySelector('.fab-container') ||
                         document.querySelector('#fab-container') ||
                         document.querySelector('[class*="fab"]');
                break;
            case 'medewerker-kolom':
                element = document.querySelector('.medewerker-kolom') ||
                         document.querySelector('#medewerker-kolom') ||
                         document.querySelector('th[class*="medewerker"]') ||
                         document.querySelector('td[class*="medewerker"]');
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
    
    return element;
};

// Main class for the moving orange square tutorial
export class OrangeTutorial {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = tutorialSteps.length;
        this.tooltipElement = null;
        this.orangeSquare = null;
        this.isActive = false;
        this.isMobile = window.innerWidth < 768;
        this.animationDuration = 800; // ms for smooth transitions
    }

    // Start the tutorial
    start() {
        if (this.isActive) return;
        
        console.log("Starting Orange Square Tutorial...");
        this.isActive = true;
        this.currentStep = 0;
        
        // Create orange square
        this.createOrangeSquare();
        
        // Show first step
        this.showStep(0);
        
        // Add window resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Add keyboard navigation
        this.addKeyboardNavigation();
    }

    // End the tutorial
    end() {
        console.log("Ending Orange Square Tutorial...");
        this.isActive = false;
        
        // Remove orange square
        if (this.orangeSquare) {
            this.orangeSquare.remove();
            this.orangeSquare = null;
        }
        
        // Remove tooltip
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this));
        this.removeKeyboardNavigation();
        
        // Fire custom event for tutorial completion
        document.dispatchEvent(new CustomEvent('tutorial-completed'));
    }

    // Create the moving orange square
    createOrangeSquare() {
        this.orangeSquare = document.createElement('div');
        this.orangeSquare.className = 'tutorial-orange-square';
        
        // Add pulse animation and glow effect
        this.orangeSquare.innerHTML = `
            <div class="orange-square-inner">
                <div class="orange-square-pulse"></div>
                <div class="orange-square-glow"></div>
            </div>
        `;
        
        // Style the square
        this.orangeSquare.style.cssText = `
            position: fixed;
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #ff8c00, #ff6b00);
            border-radius: 8px;
            box-shadow: 
                0 0 20px rgba(255, 140, 0, 0.4),
                0 0 40px rgba(255, 140, 0, 0.2),
                0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            pointer-events: none;
            transition: all ${this.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 0;
            transform: scale(0.5);
        `;
        
        // Add inner styling
        const innerSquare = this.orangeSquare.querySelector('.orange-square-inner');
        innerSquare.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 8px;
            overflow: hidden;
        `;
        
        // Add pulse animation
        const pulse = this.orangeSquare.querySelector('.orange-square-pulse');
        pulse.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 140, 0, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: orange-pulse 2s ease-in-out infinite;
        `;
        
        // Add glow effect
        const glow = this.orangeSquare.querySelector('.orange-square-glow');
        glow.style.cssText = `
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            background: linear-gradient(135deg, #ff8c00, #ff6b00);
            border-radius: 12px;
            opacity: 0.5;
            animation: orange-glow 3s ease-in-out infinite alternate;
            z-index: -1;
        `;
        
        document.body.appendChild(this.orangeSquare);
        
        // Animate in
        setTimeout(() => {
            this.orangeSquare.style.opacity = '1';
            this.orangeSquare.style.transform = 'scale(1)';
        }, 100);
    }

    // Show a specific step
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) {
            this.end();
            return;
        }
        
        this.currentStep = stepIndex;
        const step = tutorialSteps[stepIndex];
        
        // Find target element
        const targetElement = findTutorialElement(step.targetId);
        
        if (targetElement) {
            // Move orange square to target
            this.moveSquareToTarget(targetElement);
            
            // Create/update tooltip
            setTimeout(() => {
                this.createTooltip(step, targetElement);
            }, this.animationDuration / 2);
        } else {
            console.warn(`Tutorial element not found: ${step.targetId}`);
            // Show tooltip at current position
            this.createTooltip(step, null);
        }
    }

    // Move orange square to target element
    moveSquareToTarget(targetElement) {
        if (!targetElement || !this.orangeSquare) return;
        
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Calculate center position
        const centerX = rect.left + scrollLeft + (rect.width / 2) - 20; // 20 = half square width
        const centerY = rect.top + scrollTop + (rect.height / 2) - 20; // 20 = half square height
        
        // Add slight bounce effect on arrival
        this.orangeSquare.style.transform = 'scale(1.2)';
        
        // Move to position
        this.orangeSquare.style.left = `${centerX}px`;
        this.orangeSquare.style.top = `${centerY}px`;
        
        // Smooth scroll to keep target in view
        targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
        });
        
        // Reset scale after animation
        setTimeout(() => {
            if (this.orangeSquare) {
                this.orangeSquare.style.transform = 'scale(1)';
            }
        }, this.animationDuration);
    }

    // Create tooltip for current step
    createTooltip(step, targetElement) {
        // Remove existing tooltip
        if (this.tooltipElement) {
            this.tooltipElement.remove();
        }
        
        // Create new tooltip
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tutorial-tooltip-orange';
        
        // Add content
        this.tooltipElement.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-icon">🎯</span>
                <span class="tooltip-title">${this.getStepTitle(step)}</span>
            </div>
            <div class="tooltip-content">${step.message}</div>
            <div class="tooltip-navigation">
                ${this.currentStep > 0 ? 
                    '<button class="tooltip-btn tooltip-btn-secondary" id="tooltip-prev">← Vorige</button>' : 
                    '<button class="tooltip-btn tooltip-btn-skip" id="tooltip-skip">Overslaan</button>'}
                <button class="tooltip-btn tooltip-btn-primary" id="tooltip-next">
                    ${this.currentStep < this.totalSteps - 1 ? 'Volgende →' : 'Klaar! 🎉'}
                </button>
            </div>
            <div class="tooltip-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${((this.currentStep + 1) / this.totalSteps) * 100}%"></div>
                </div>
                <span class="progress-text">${this.currentStep + 1} / ${this.totalSteps}</span>
            </div>
            <button class="tooltip-close" id="tooltip-close" title="Tour sluiten">×</button>
        `;
        
        // Style the tooltip
        this.tooltipElement.style.cssText = `
            position: fixed;
            max-width: 320px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            border: 2px solid #ff8c00;
            font-family: 'Inter', sans-serif;
            z-index: 9998;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(this.tooltipElement);
        
        // Position tooltip
        this.positionTooltip(targetElement);
        
        // Animate in
        setTimeout(() => {
            this.tooltipElement.style.opacity = '1';
            this.tooltipElement.style.transform = 'translateY(0)';
        }, 100);
        
        // Add event listeners
        this.addTooltipEventListeners();
    }

    // Position tooltip relative to target or orange square
    positionTooltip(targetElement) {
        if (!this.tooltipElement) return;
        
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        let left, top;
        
        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            
            // Position below target by default
            left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            top = targetRect.bottom + 20;
            
            // Adjust if going off-screen
            if (top + tooltipRect.height > window.innerHeight) {
                top = targetRect.top - tooltipRect.height - 20;
            }
            
            if (left < 20) left = 20;
            if (left + tooltipRect.width > window.innerWidth - 20) {
                left = window.innerWidth - tooltipRect.width - 20;
            }
        } else {
            // Center on screen if no target
            left = (window.innerWidth - tooltipRect.width) / 2;
            top = (window.innerHeight - tooltipRect.height) / 2;
        }
        
        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
    }

    // Get step title
    getStepTitle(step) {
        const defaultTitles = [
            "Welkom!", "Hoofdnavigatie", "Feedback", "Instellingen", "Werkbalk",
            "Navigatie", "Zoeken", "Legenda", "Medewerkers", "Rooster",
            "Dagcellen", "Verlof", "Ziekte", "Compensatie", "Feestdagen",
            "Weekenden", "Vandaag", "Snelle Acties", "Rechtsklik", "Profiel", "Klaar!"
        ];
        return step.title || defaultTitles[this.currentStep] || `Stap ${this.currentStep + 1}`;
    }

    // Add event listeners to tooltip buttons
    addTooltipEventListeners() {
        const nextBtn = this.tooltipElement?.querySelector('#tooltip-next');
        const prevBtn = this.tooltipElement?.querySelector('#tooltip-prev');
        const skipBtn = this.tooltipElement?.querySelector('#tooltip-skip');
        const closeBtn = this.tooltipElement?.querySelector('#tooltip-close');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showStep(this.currentStep + 1));
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.showStep(this.currentStep - 1));
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.end());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.end());
        }
    }

    // Handle window resize
    handleResize() {
        this.isMobile = window.innerWidth < 768;
        
        if (this.isActive) {
            const targetElement = findTutorialElement(tutorialSteps[this.currentStep].targetId);
            if (targetElement) {
                setTimeout(() => {
                    this.moveSquareToTarget(targetElement);
                    this.positionTooltip(targetElement);
                }, 100);
            }
        }
    }

    // Add keyboard navigation
    addKeyboardNavigation() {
        this.keyboardHandler = (e) => {
            if (!this.isActive) return;
            
            switch(e.key) {
                case 'ArrowRight':
                case 'Space':
                    e.preventDefault();
                    this.showStep(this.currentStep + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.showStep(this.currentStep - 1);
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.end();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardHandler);
    }

    // Remove keyboard navigation
    removeKeyboardNavigation() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
    }
}

// Create and export tutorial instance
export const orangeTutorial = new OrangeTutorial();

// Export start function for compatibility
export const roosterTutorial = () => {
    orangeTutorial.start();
};

console.log('✅ Orange Square Tutorial System loaded successfully.');