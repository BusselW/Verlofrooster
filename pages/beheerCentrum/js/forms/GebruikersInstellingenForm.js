/**
 * GebruikersInstellingenForm.js - User settings form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the user settings form
 */
const gebruikersInstellingenConfig = {
    sections: [
        {
            title: 'Gebruiker Instellingen',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Instellingen voor John Doe',
                    help: 'Een duidelijke titel voor deze gebruikersinstellingen'
                },
                { 
                    name: 'soortWeergave', 
                    label: 'Soort Weergave', 
                    type: 'select',
                    options: [
                        { value: 'week', label: 'Week Weergave' },
                        { value: 'maand', label: 'Maand Weergave' },
                        { value: 'dag', label: 'Dag Weergave' }
                    ],
                    help: 'Standaard weergave type voor deze gebruiker'
                }
            ]
        },
        {
            title: 'Weergave Instellingen',
            type: 'toggle-section',
            icon: '👁️',
            background: 'primary',
            fields: [
                { 
                    name: 'EigenTeamWeergeven', 
                    label: 'Eigen Team Weergeven', 
                    type: 'toggle',
                    help: 'Toon alleen informatie van het eigen team'
                },
                { 
                    name: 'WeekendenWeergeven', 
                    label: 'Weekenden Weergeven', 
                    type: 'toggle',
                    help: 'Toon weekenden in de roosterweergave'
                },
                { 
                    name: 'BHCAlleenEigen', 
                    label: 'BHC Alleen Eigen Team', 
                    type: 'toggle',
                    help: 'In beheercentrum alleen eigen team tonen'
                }
            ]
        }
    ]
};

/**
 * GebruikersInstellingenForm component using enhanced base form with modal configuration
 */
export const GebruikersInstellingenForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: gebruikersInstellingenConfig,
        title,
        modalType: 'standard',
        modalOverrides: {
            width: 'medium',
            header: {
                gradient: 'info',
                showIcon: true
            }
        }
    });
};
