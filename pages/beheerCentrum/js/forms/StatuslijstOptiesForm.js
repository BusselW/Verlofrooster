/**
 * StatuslijstOptiesForm.js - Status options form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the status options form
 */
const statuslijstOptiesConfig = {
    sections: [
        {
            title: 'Status Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Status Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Actief, Inactief, In Behandeling, Goedgekeurd',
                    help: 'De naam van de status die gebruikt wordt in het systeem'
                }
            ]
        }
    ]
};

/**
 * StatuslijstOptiesForm component using enhanced base form with modal configuration
 */
export const StatuslijstOptiesForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: statuslijstOptiesConfig,
        title,
        modalType: 'standard',
        modalOverrides: {
            width: 'small',
            header: {
                gradient: 'success',
                showIcon: true
            }
        }
    });
};
