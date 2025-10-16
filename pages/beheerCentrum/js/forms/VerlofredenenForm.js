/**
 * VerlofredenenForm.js - Leave reasons form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the leave reasons form
 */
const verlofredenenConfig = {
    sections: [
        {
            title: 'Verlof Reden Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Verlof Naam', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Jaarlijks Verlof',
                    help: 'De volledige naam van de verloftype'
                },
                { 
                    name: 'Afkorting', 
                    label: 'Afkorting', 
                    type: 'text', 
                    required: true, 
                    maxLength: 5,
                    placeholder: 'JV',
                    help: 'Korte afkorting (max 5 karakters) voor in het rooster'
                },
                { 
                    name: 'VerlofKleur', 
                    label: 'Kleur', 
                    type: 'color', 
                    required: true,
                    placeholder: '#10B981',
                    help: 'Kleur voor deze verloftype in het rooster'
                },
                { 
                    name: 'Omschrijving', 
                    label: 'Omschrijving', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 3,
                    placeholder: 'Beschrijf wanneer dit verloftype van toepassing is...',
                    help: 'Uitgebreide beschrijving van dit verloftype'
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
                    name: 'VerlofDag', 
                    label: 'Is Verlofdag', 
                    type: 'toggle', 
                    help: 'Schakel in als dit een officiële verlofdag is die wordt afgetrokken van verloftegoed'
                },
                { 
                    name: 'Actief', 
                    label: 'Actief', 
                    type: 'toggle', 
                    help: 'Schakel uit om dit verloftype te deactiveren'
                },
                { 
                    name: 'ZichtbaarInRooster', 
                    label: 'Zichtbaar in Rooster', 
                    type: 'toggle', 
                    help: 'Toon dit verloftype als optie in de roosterweergave'
                }
            ]
        }
    ]
};

/**
 * VerlofredenenForm component using enhanced base form with modal configuration
 */
export const VerlofredenenForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: verlofredenenConfig,
        title,
        modalType: 'standard',
        modalOverrides: {
            width: 'medium',
            header: {
                gradient: 'success',
                showIcon: true
            }
        }
    });
};