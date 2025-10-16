/**
 * SeniorsForm.js - Senior employees form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the seniors form
 */
const seniorsConfig = {
    sections: [
        {
            title: 'Senior Medewerker Details',
            fields: [
                { 
                    name: 'Medewerker', 
                    label: 'Medewerker', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Naam van de senior medewerker',
                    help: 'Volledige naam van de senior medewerker'
                },
                { 
                    name: 'MedewerkerID', 
                    label: 'Medewerker ID', 
                    type: 'text', 
                    required: true,
                    placeholder: 'domein\\gebruikersnaam',
                    help: 'Unieke identificatie van de medewerker'
                }
            ]
        },
        {
            title: 'Team Informatie',
            type: 'info-section',
            icon: '👥',
            background: 'primary',
            fields: [
                { 
                    name: 'Team', 
                    label: 'Team', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Naam van het team',
                    help: 'Het team waar deze senior medewerker onderdeel van is'
                },
                { 
                    name: 'TeamID', 
                    label: 'Team ID', 
                    type: 'text',
                    placeholder: 'Unieke team identificatie',
                    help: 'Unieke identificatie van het team'
                }
            ]
        }
    ]
};

/**
 * SeniorsForm component using enhanced base form with modal configuration
 */
export const SeniorsForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: seniorsConfig,
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
