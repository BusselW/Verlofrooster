/**
 * @file GenericForm.js
 * @description A generic form component that can handle all different data types from dataTabs.js
 */

import { Autocomplete } from '../ui/Autocomplete.js';
import { searchSiteUsers, getListItems } from '../dataService.js';

const { useState, useEffect, createElement: h } = React;

/**
 * A generic form component that can handle all different data types
 * @param {object} props
 * @param {(formData: object) => void} props.onSave
 * @param {() => void} props.onCancel
 * @param {object} [props.initialData]
 * @param {object[]} props.formFields - The fields to display in the form, from dataTabs.js formFields
 * @param {string} props.title - The title for the form
 * @param {string} props.tabType - The type of tab (medewerkers, teams, etc.)
 */
export const GenericForm = ({ onSave, onCancel, initialData = {}, formFields = [], title, tabType }) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [selectOptions, setSelectOptions] = useState({});

    // Load options for select fields that have a listSource
    useEffect(() => {
        const loadSelectOptions = async () => {
            const selectFields = formFields.filter(f => f.type === 'select' && f.listSource);
            
            for (const field of selectFields) {
                try {
                    const listName = window.appConfiguratie[field.listSource]?.lijstTitel;
                    if (listName) {
                        const items = await getListItems(listName);
                        const options = items.map(item => ({
                            value: item[field.valueField],
                            label: item[field.valueField]
                        }));
                        setSelectOptions(prev => ({
                            ...prev,
                            [field.name]: options
                        }));
                    }
                } catch (error) {
                    console.error(`Error loading options for ${field.name}:`, error);
                }
            }
        };
        
        loadSelectOptions();
    }, [formFields]);

    const handleAutocompleteSelect = (user) => {
        // Map SharePoint user data to your form fields (for medewerkers)
        if (tabType === 'medewerkers') {
            setFormData(prev => ({
                ...prev,
                Naam: user.Title, // e.g., Bussel, van, W.
                Username: user.LoginName.split('|').pop(), // e.g., org\busselw
                E_x002d_mail: user.Email,
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        formFields.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is verplicht`;
            }
            
            if (field.type === 'email' && formData[field.name]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData[field.name])) {
                    newErrors[field.name] = 'Voer een geldig e-mailadres in';
                }
            }
            
            if (field.type === 'number' && formData[field.name]) {
                const num = parseFloat(formData[field.name]);
                if (isNaN(num) || num < 0) {
                    newErrors[field.name] = 'Voer een geldig getal in';
                }
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Ensure username is in the correct format before saving (for medewerkers)
        let dataToSave = { ...formData };
        if (tabType === 'medewerkers' && formData.Username) {
            dataToSave.Username = formData.Username.replace(/\\/g, '\\');
        }
        
        onSave(dataToSave);
    };

    const renderField = (field) => {
        if (!field) return null;

        const isReadOnly = (tabType === 'medewerkers' && field.name === 'Username') || 
                          (!initialData.Id && tabType === 'medewerkers' && ['Naam', 'E_x002d_mail'].includes(field.name));

        const commonProps = {
            id: field.name,
            name: field.name,
            value: formData[field.name] || '',
            onChange: handleChange,
            readOnly: isReadOnly,
            required: field.required,
            placeholder: field.placeholder || '',
        };

        let inputElement;
        
        switch (field.type) {
            case 'textarea':
                inputElement = h('textarea', { ...commonProps, rows: 3 });
                break;
            case 'checkbox':
                inputElement = h('input', { 
                    ...commonProps, 
                    type: 'checkbox', 
                    checked: formData[field.name] || false,
                    value: undefined // Don't use value for checkboxes
                });
                break;
            case 'color':
                inputElement = h('div', { className: 'color-input-group' },
                    h('input', { 
                        ...commonProps, 
                        type: 'color',
                        className: 'color-picker',
                        onChange: (e) => {
                            setFormData(prev => ({
                                ...prev,
                                [field.name]: e.target.value
                            }));
                        }
                    }),
                    h('input', { 
                        ...commonProps, 
                        type: 'text', 
                        className: 'color-text',
                        placeholder: '#FFFFFF',
                        pattern: '^#[0-9A-Fa-f]{6}$',
                        onChange: (e) => {
                            let value = e.target.value;
                            // Auto-add # if not present
                            if (value && !value.startsWith('#')) {
                                value = '#' + value;
                            }
                            setFormData(prev => ({
                                ...prev,
                                [field.name]: value
                            }));
                        }
                    }),
                    h('div', { 
                        className: 'color-preview',
                        style: { 
                            backgroundColor: formData[field.name] || '#ffffff',
                            width: '30px',
                            height: '30px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            display: 'inline-block',
                            marginLeft: '8px'
                        }
                    })
                );
                break;
            case 'select':
                const options = field.options || selectOptions[field.name] || [];
                inputElement = h('select', { ...commonProps },
                    h('option', { value: '' }, 'Selecteer...'),
                    ...options.map(option => 
                        h('option', { key: option.value, value: option.value }, option.label)
                    )
                );
                break;
            case 'date':
                inputElement = h('input', { ...commonProps, type: 'date' });
                break;
            case 'datetime':
                inputElement = h('input', { ...commonProps, type: 'datetime-local' });
                break;
            case 'number':
                inputElement = h('input', { ...commonProps, type: 'number', step: field.step || 'any' });
                break;
            case 'email':
                inputElement = h('input', { ...commonProps, type: 'email' });
                break;
            default:
                inputElement = h('input', { ...commonProps, type: 'text' });
        }

        const fieldClass = field.type === 'checkbox' ? 'form-field toggle-switch' : 'form-field';
        const containerClass = `${fieldClass} ${field.fullWidth ? 'full-width' : ''}`;

        return h('div', { key: field.name, className: containerClass },
            h('label', { htmlFor: field.name, className: field.required ? 'required' : '' }, field.label),
            inputElement,
            errors[field.name] && h('span', { className: 'error-message' }, errors[field.name])
        );
    };

    // Group fields by section
    const groupedFields = formFields.reduce((acc, field) => {
        const section = field.section || 'default';
        if (!acc[section]) acc[section] = [];
        acc[section].push(field);
        return acc;
    }, {});

    // Render grouped sections
    const renderSections = () => {
        return Object.entries(groupedFields).map(([sectionName, fields]) => {
            const regularFields = fields.filter(f => f.type !== 'checkbox' && !f.fullWidth);
            const fullWidthFields = fields.filter(f => f.fullWidth);
            const checkboxFields = fields.filter(f => f.type === 'checkbox');

            return h('div', { key: sectionName, className: 'form-section' },
                sectionName !== 'default' && h('h3', { className: 'section-title' }, sectionName),
                
                // Regular fields in grid
                regularFields.length > 0 && h('div', { className: 'form-grid' },
                    ...regularFields.map(field => renderField(field))
                ),
                
                // Full width fields
                ...fullWidthFields.map(field => renderField(field)),
                
                // Checkbox fields
                ...checkboxFields.map(field => renderField(field))
            );
        });
    };

    return h('form', { className: 'modal-form', onSubmit: handleSubmit },
        h('div', { className: 'modal-header' },
            h('h2', { className: 'form-title' }, title),
            h('button', { 
                type: 'button', 
                className: 'close-btn',
                onClick: onCancel,
                'aria-label': 'Sluiten'
            }, '×')
        ),

        h('div', { className: 'modal-body' },
            // Autocomplete for medewerkers (only for new employees)
            !initialData.Id && tabType === 'medewerkers' && h('div', { className: 'form-field full-width' },
                h('label', null, 'Zoek Medewerker'),
                h(Autocomplete, {
                    onSelect: handleAutocompleteSelect,
                    searchFunction: searchSiteUsers
                })
            ),

            // Render all sections
            ...renderSections()
        ),

        h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn-secondary', onClick: onCancel }, 'Annuleren'),
            h('button', { type: 'submit', className: 'btn-primary' }, 
                initialData.Id ? 'Bijwerken' : 'Toevoegen')
        )
    );
};