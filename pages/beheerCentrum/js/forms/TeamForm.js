/**
 * TeamForm.js - Team-specific form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the team form
 * Field names match SharePoint Teams list: Naam, Kleur, Teamleider, TeamleiderId, Actief
 */
const teamConfig = {
    sections: [
        {
            title: 'Team Informatie',
            fields: [
                { 
                    name: 'Naam', 
                    label: 'Team Naam', 
                    type: 'text', 
                    required: true, 
                    placeholder: 'Bijv. Ontwikkeling' 
                },
                { 
                    name: 'Kleur', 
                    label: 'Team Kleur', 
                    type: 'color', 
                    required: true, 
                    placeholder: '#3B82F6',
                    help: 'Deze kleur wordt gebruikt in de roosterweergave'
                },
                { 
                    name: 'Teamleider', 
                    label: 'Teamleider Naam', 
                    type: 'text',
                    placeholder: 'Bijv. Jan de Vries',
                    help: 'Volledige naam van de teamleider'
                },
                { 
                    name: 'TeamleiderId', 
                    label: 'Teamleider ID', 
                    type: 'text',
                    placeholder: 'Bijv. org\\jdevries',
                    help: 'Gebruikersnaam in formaat domein\\gebruiker'
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