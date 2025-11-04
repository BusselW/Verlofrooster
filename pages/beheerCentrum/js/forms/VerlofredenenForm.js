/**
 * VerlofredenenForm.js - Leave reasons form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the leave reasons form
 * Field names match SharePoint Verlofredenen list: Naam, Kleur, Afkorting, VerlofDag
 */
const verlofredenenConfig = {
    sections: [
        {
            title: 'Verlof Reden Details',
            fields: [
                { 
                    name: 'Naam', 
                    label: 'Verlof Naam', 
                    type: 'text', 
                    required: true,
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
                    name: 'Kleur', 
                    label: 'Kleur', 
                    type: 'color', 
                    required: true,
                    placeholder: '#10B981',
                    help: 'Kleur voor deze verloftype in het rooster'
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