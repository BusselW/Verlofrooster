/**
 * EnhancedBaseForm.js - Enhanced base form component with modal layout configuration support
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { getModalConfig } from '../config/modalLayouts.js';

const { useState, useEffect, createElement: h } = React;

/**
 * Enhanced base form component that supports modal layout configurations
 * @param {Object} props - Component props
 * @param {Function} props.onSave - Save handler function
 * @param {Function} props.onCancel - Cancel handler function
 * @param {Object} props.initialData - Initial form data
 * @param {Object} props.config - Form field configuration
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Custom content to render instead of or alongside config sections
 * @param {string} props.modalType - Modal type for layout configuration (employee, standard, etc.)
 * @param {Object} props.modalOverrides - Configuration overrides for modal layout
 * @param {boolean} props.showAutocomplete - Whether to show autocomplete section for employee forms
 * @param {Function} props.autocompleteSearchFunction - Search function for autocomplete
 * @param {string} props.autocompleteSelectedValue - Currently selected autocomplete value
 * @param {Function} props.onAutocompleteSelect - Autocomplete selection handler
 */
export const EnhancedBaseForm = ({
    onSave,
    onCancel,
    initialData = {},
    config,
    title,
    children,
    modalType = 'standard',
    modalOverrides = {},
    showAutocomplete = false,
    autocompleteSearchFunction,
    autocompleteSelectedValue,
    onAutocompleteSelect
}) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Get modal configuration
    const modalConfig = getModalConfig(modalType, modalOverrides);

    useEffect(() => {
        setFormData(initialData);
        setErrors({});
    }, [initialData]);

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: null
            }));
        }
    };

    const validateField = (field, value) => {
        if (field.required && (!value || value.toString().trim() === '')) {
            return `${field.label} is verplicht`;
        }

        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Voer een geldig e-mailadres in';
            }
        }

        if (field.type === 'color' && value) {
            const colorRegex = /^#[0-9A-Fa-f]{6}$/;
            if (!colorRegex.test(value)) {
                return 'Voer een geldige hex kleur in (bijv. #FF0000)';
            }
        }

        if (field.minLength && value && value.length < field.minLength) {
            return `${field.label} moet minimaal ${field.minLength} karakters bevatten`;
        }

        if (field.maxLength && value && value.length > field.maxLength) {
            return `${field.label} mag maximaal ${field.maxLength} karakters bevatten`;
        }

        return null;
    };

    const validateForm = () => {
        const newErrors = {};
        let hasErrors = false;

        config.sections.forEach(section => {
            section.fields.forEach(field => {
                const error = validateField(field, formData[field.name]);
                if (error) {
                    newErrors[field.name] = error;
                    hasErrors = true;
                }
            });
        });

        setErrors(newErrors);
        return !hasErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error saving form:', error);
            // Show error to user
            setErrors({ 
                _general: 'Er is een fout opgetreden bij het opslaan. Probeer het opnieuw.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field) => {
        const value = formData[field.name] || '';
        const hasError = errors[field.name];
        const isReadOnly = field.readOnly || (!initialData.Id && field.readOnlyForNew);

        const baseProps = {
            id: field.name,
            name: field.name,
            required: field.required,
            className: hasError ? 'form-input error' : 'form-input',
            'aria-describedby': hasError ? `${field.name}-error` : field.help ? `${field.name}-help` : undefined,
            'aria-invalid': hasError ? 'true' : 'false'
        };

        let inputElement;

        switch (field.type) {
            case 'textarea':
                inputElement = h('textarea', {
                    ...baseProps,
                    value,
                    rows: field.rows || 4,
                    placeholder: field.placeholder,
                    readOnly: isReadOnly,
                    className: isReadOnly ? 'form-input readonly' : baseProps.className,
                    onChange: (e) => handleInputChange(field.name, e.target.value)
                });
                break;
                
            case 'checkbox':
                inputElement = h('input', {
                    ...baseProps,
                    type: 'checkbox',
                    checked: !!value,
                    className: 'form-checkbox',
                    onChange: (e) => handleInputChange(field.name, e.target.checked)
                });
                break;
                
            case 'toggle':
                inputElement = h('label', {
                    className: 'toggle-switch',
                    'aria-label': field.label
                },
                    h('input', {
                        ...baseProps,
                        type: 'checkbox',
                        checked: !!value,
                        className: 'toggle-input',
                        onChange: (e) => handleInputChange(field.name, e.target.checked)
                    }),
                    h('span', { 
                        className: 'toggle-slider',
                        'aria-hidden': 'true'
                    })
                );
                break;
                
            case 'color':
                inputElement = h('div', { className: 'color-input-group' },
                    h('input', {
                        ...baseProps,
                        type: 'color',
                        value: value || '#ffffff',
                        className: 'color-picker',
                        onChange: (e) => handleInputChange(field.name, e.target.value)
                    }),
                    h('input', {
                        ...baseProps,
                        type: 'text',
                        value,
                        placeholder: field.placeholder || '#FFFFFF',
                        className: 'color-text',
                        onChange: (e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith('#')) val = '#' + val;
                            handleInputChange(field.name, val);
                        }
                    }),
                    h('div', {
                        className: 'color-preview',
                        style: { backgroundColor: value || '#ffffff' },
                        'aria-hidden': 'true'
                    })
                );
                break;
                
            case 'select':
                inputElement = h('select', {
                    ...baseProps,
                    value,
                    className: 'form-select',
                    onChange: (e) => handleInputChange(field.name, e.target.value)
                },
                    h('option', { value: '', disabled: true }, field.placeholder || 'Selecteer...'),
                    ...(field.options || []).map(option =>
                        h('option', { key: option.value, value: option.value }, option.label)
                    )
                );
                break;
                
            default:
                inputElement = h('input', {
                    ...baseProps,
                    type: field.type || 'text',
                    value,
                    placeholder: field.placeholder,
                    readOnly: isReadOnly,
                    className: isReadOnly ? 'form-input readonly' : baseProps.className,
                    onChange: (e) => handleInputChange(field.name, e.target.value)
                });
        }

        return inputElement;
    };

    const renderFormField = (field) => {
        const hasError = errors[field.name];
        
        return h('div', {
            className: `form-field ${field.colSpan ? `col-span-${field.colSpan}` : ''}`,
            key: field.name
        },
            h('label', {
                htmlFor: field.name,
                className: 'form-label'
            },
                field.label,
                field.required && h('span', { className: 'required', 'aria-label': 'verplicht' }, ' *')
            ),
            renderField(field),
            field.help && h('div', { 
                id: `${field.name}-help`,
                className: 'form-help' 
            }, field.help),
            hasError && h('div', {
                id: `${field.name}-error`,
                className: 'form-error',
                role: 'alert'
            }, hasError)
        );
    };

    const renderToggleField = (field) => {
        return h('div', {
            className: 'toggle-field',
            key: field.name
        },
            h('div', { className: 'toggle-field-content' },
                h('div', { className: 'toggle-field-info' },
                    h('label', {
                        htmlFor: field.name,
                        className: 'toggle-label'
                    }, field.label),
                    field.help && h('div', { className: 'toggle-help' }, field.help)
                ),
                h('div', { className: 'toggle-field-control' },
                    renderField(field)
                )
            )
        );
    };

    const renderSection = (section, index) => {
        const sectionClasses = [
            'form-section',
            section.type === 'toggle-section' ? 'toggle-section' : '',
            section.background ? `section-bg-${section.background}` : ''
        ].filter(Boolean).join(' ');

        const fieldsContainerClass = section.type === 'toggle-section' 
            ? 'toggle-section-fields' 
            : 'form-section-fields';

        return h('div', {
            className: sectionClasses,
            key: index
        },
            h('h3', { className: 'form-section-title' },
                section.icon && h('span', { className: 'section-icon', 'aria-hidden': 'true' }, section.icon),
                section.title
            ),
            h('div', { className: fieldsContainerClass },
                section.fields.map(field => 
                    section.type === 'toggle-section' 
                        ? renderToggleField(field)
                        : renderFormField(field)
                )
            )
        );
    };

    const renderAutocompleteSection = () => {
        if (!showAutocomplete || !modalConfig.specialSections?.autocomplete?.show) return null;

        const { autocomplete } = modalConfig.specialSections;
        
        return h('div', {
            className: `form-section autocomplete-section section-bg-${autocomplete.background || 'info'}`
        },
            h('h3', { className: 'form-section-title' },
                autocomplete.icon && h('span', { className: 'section-icon', 'aria-hidden': 'true' }, autocomplete.icon),
                autocomplete.title || 'Zoek Medewerker'
            ),
            h('div', { className: 'form-field' },
                h('label', { className: 'form-label' }, 'Zoek bestaande medewerker'),
                // Import and use Autocomplete component dynamically
                autocompleteSearchFunction && h('div', {
                    className: 'autocomplete-wrapper',
                    'data-search-placeholder': autocomplete.searchPlaceholder || 'Type om te zoeken...'
                }),
                autocomplete.helpText && h('div', { className: 'form-help' }, autocomplete.helpText)
            )
        );
    };

    // Generate modal CSS classes based on configuration
    const getModalClasses = () => {
        const classes = [
            'modal-form-wrapper',
            `modal-${modalConfig.width}`,
            `modal-height-${modalConfig.height}`,
            modalConfig.header.gradient !== 'none' ? `header-${modalConfig.header.gradient}` : '',
            modalConfig.animation ? `anim-${modalConfig.animation.enter}` : ''
        ].filter(Boolean);
        
        return classes.join(' ');
    };

    const getHeaderClasses = () => {
        const classes = [
            'modal-header',
            modalConfig.header.gradient !== 'none' ? `gradient-${modalConfig.header.gradient}` : '',
            `text-${modalConfig.header.textColor}`
        ].filter(Boolean);
        
        return classes.join(' ');
    };

    return h('div', { 
        className: 'modal-form-content modal-compact',
        role: 'dialog',
        'aria-labelledby': 'modal-title',
        'aria-modal': 'true'
    },
        // Header
        h('div', { className: getHeaderClasses() },
            h('h2', { 
                id: 'modal-title',
                className: 'modal-title' 
            }, title),
            modalConfig.header.showCloseButton && h('button', {
                type: 'button',
                className: 'modal-close-button',
                onClick: onCancel,
                'aria-label': 'Sluiten'
            }, '×')
        ),
        
        // Body - removed nested modal-body wrapper to prevent double scrollbars
        h('form', { 
            id: 'enhanced-form',
            onSubmit: handleSubmit, 
            className: `enhanced-form padding-${modalConfig.body.padding} bg-${modalConfig.body.background}` 
        },
            // Show general error if any
            errors._general && h('div', {
                className: 'form-error general-error',
                role: 'alert'
            }, errors._general),
            
            // Autocomplete section for employee forms
            renderAutocompleteSection(),
            
            // Form sections or custom children
            children || config.sections.map(renderSection)
        ),
        
        // Footer
        modalConfig.footer.show && h('div', { 
            className: `modal-footer alignment-${modalConfig.footer.alignment} padding-${modalConfig.footer.padding} bg-${modalConfig.footer.background}`,
            style: {
                position: modalConfig.footer.sticky ? 'sticky' : 'static',
                bottom: modalConfig.footer.sticky ? 0 : 'auto'
            }
        },
            h('button', {
                type: 'button',
                className: 'btn btn-secondary',
                onClick: onCancel,
                disabled: isSubmitting
            }, 'Annuleren'),
            h('button', {
                type: 'submit',
                form: 'enhanced-form',
                className: 'btn btn-primary',
                disabled: isSubmitting
            }, isSubmitting ? 'Opslaan...' : 'Opslaan')
        )
    );
};

/**
 * Hook for managing form data with enhanced features
 */
export const useEnhancedFormData = (initialData, config = {}) => {
    const [formData, setFormData] = useState(initialData);
    const [isDirty, setIsDirty] = useState(false);
    
    const updateField = (fieldName, value) => {
        setFormData(prev => {
            const newData = { ...prev, [fieldName]: value };
            setIsDirty(true);
            return newData;
        });
    };

    const resetForm = (newData = {}) => {
        setFormData(newData);
        setIsDirty(false);
    };

    const validateField = (fieldName, validators = {}) => {
        const value = formData[fieldName];
        
        if (validators.required && (!value || value.toString().trim() === '')) {
            return 'Dit veld is verplicht';
        }
        
        if (validators.email && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Voer een geldig e-mailadres in';
            }
        }
        
        if (validators.minLength && value && value.length < validators.minLength) {
            return `Minimaal ${validators.minLength} karakters vereist`;
        }
        
        if (validators.custom && typeof validators.custom === 'function') {
            return validators.custom(value, formData);
        }
        
        return null;
    };

    return { 
        formData, 
        updateField, 
        resetForm, 
        isDirty, 
        validateField 
    };
};