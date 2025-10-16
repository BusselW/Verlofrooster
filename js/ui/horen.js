/**
 * @file horen.js
 * @description Handles fetching and displaying "Horen" status for medewerkers
 * Shows appropriate icons to indicate if a medewerker can be planned for hearing
 */

import TooltipManager from './tooltipbar.js';

/**
 * Renders a hearing status icon based on the medewerker's "Horen" property
 * @param {Object} medewerker - The medewerker object containing Horen status
 * @returns {HTMLElement} React element with the appropriate hearing icon
 */
export function renderHorenStatus(medewerker) {
    const { createElement: h } = React;
    
    // Default to false if the property doesn't exist
    const canHear = medewerker && medewerker.Horen === true;
    
    return h('div', { 
        className: `horen-status ${canHear ? 'horen-ja' : 'horen-nee'}`,
        ref: (element) => {
            if (element && !element.dataset.tooltipAttached) {
                TooltipManager.attach(element, () => {
                    return `<div class="custom-tooltip-title">${canHear ? 'Beschikbaar voor horen' : 'Niet beschikbaar voor horen'}</div>
                    <div class="custom-tooltip-content">
                        <div class="custom-tooltip-info">
                            <span class="custom-tooltip-value">
                                ${canHear 
                                    ? 'Deze medewerker kan ingepland worden voor horen.' 
                                    : 'Deze medewerker kan niet ingepland worden voor horen.'}
                            </span>
                        </div>
                    </div>`;
                });
            }
        }
    }, 
        h('img', {
            src: `./icons/profilecards/${canHear ? 'horen-ja' : 'horen-nee'}.svg`,
            alt: canHear ? 'Horen: Ja' : 'Horen: Nee',
            className: 'horen-icon',
            style: { width: '16px', height: '16px' }
        })
    );
}

/**
 * Gets the hearing status of a medewerker
 * @param {Object} medewerker - The medewerker object to check
 * @returns {boolean} True if the medewerker can hear, false otherwise
 */
export function getHorenStatus(medewerker) {
    return medewerker && medewerker.Horen === true;
}

/**
 * Filters medewerkers based on their hearing status
 * @param {Array} medewerkers - Array of medewerker objects
 * @param {boolean} horenStatus - The status to filter by (true for can hear, false for cannot hear)
 * @returns {Array} Filtered array of medewerkers
 */
export function filterMedewerkersByHorenStatus(medewerkers, horenStatus) {
    if (!Array.isArray(medewerkers)) return [];
    
    return medewerkers.filter(medewerker => 
        medewerker && medewerker.Horen === horenStatus
    );
}

console.log("Horen module loaded successfully.");