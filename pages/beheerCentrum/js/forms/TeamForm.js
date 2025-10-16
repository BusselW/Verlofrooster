/**
 * TeamForm.js - Team-specific form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the team form
 */
const teamConfig = {
    sections: [
        {
            title: 'Team Informatie',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Team Naam', 
                    type: 'text', 
                    required: true, 
                    placeholder: 'Bijv. Ontwikkeling' 
                },
                { 
                    name: 'TeamKleur', 
                    label: 'Team Kleur', 
                    type: 'color', 
                    required: true, 
                    placeholder: '#3B82F6',
                    help: 'Deze kleur wordt gebruikt in de roosterweergave'
                },
                { 
                    name: 'Omschrijving', 
                    label: 'Omschrijving', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 3,
                    placeholder: 'Beschrijf de rol en verantwoordelijkheden van dit team...' 
                }
            ]
        },
        {
            title: 'Instellingen',
            type: 'toggle-section',
            icon: '⚙️',
            background: 'neutral',
            fields: [
                { 
                    name: 'Actief', 
                    label: 'Team Actief', 
                    type: 'toggle', 
                    help: 'Schakel uit om team te deactiveren' 
                },
                { 
                    name: 'ZichtbaarInRooster', 
                    label: 'Zichtbaar in Rooster', 
                    type: 'toggle', 
                    help: 'Toon dit team in de roosterweergave' 
                }
            ]
        }
    ]
};

/**
 * TeamForm component using enhanced base form with modal configuration
 */
export const TeamForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: teamConfig,
        title,
        modalType: 'standard',
        modalOverrides: {
            width: 'medium',
            header: {
                gradient: 'primary',
                showIcon: true
            }
        }
    });
};