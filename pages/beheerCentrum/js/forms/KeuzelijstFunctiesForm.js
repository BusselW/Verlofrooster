/**
 * KeuzelijstFunctiesForm.js - Function choices form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the function choices form
 */
const keuzelijstFunctiesConfig = {
    sections: [
        {
            title: 'Functie Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Functie Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Senior Adviseur, Manager, Secretaris',
                    help: 'De naam van de functie die medewerkers kunnen hebben'
                }
            ]
        }
    ]
};

/**
 * KeuzelijstFunctiesForm component using enhanced base form with modal configuration
 */
export const KeuzelijstFunctiesForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: keuzelijstFunctiesConfig,
        title,
        modalType: 'standard',
        modalOverrides: {
            width: 'small',
            header: {
                gradient: 'secondary',
                showIcon: true
            }
        }
    });
};
