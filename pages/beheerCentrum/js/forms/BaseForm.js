
/**
 * BaseForm.js - Base form component with shared functionality
 */

const { useState, useEffect, createElement: h } = React;

export const BaseForm = ({ 
    onSave, 
    onCancel, 
    initialData = {}, 
    config, 
    title,
    children // Allow custom field rendering
}) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field) => {
        const value = formData[field.name] || '';
        const hasError = errors[field.name];

        const baseProps = {
            id: field.name,
            name: field.name,
            required: field.required,
            className: hasError ? 'error' : '',
            onChange: (e) => {
                const newValue = field.type === 'checkbox' ? e.target.checked : e.target.value;
                handleInputChange(field.name, newValue);
            }
        };

        let inputElement;

        switch (field.type) {
            case 'textarea':
                inputElement = h('textarea', { ...baseProps, value, rows: 4 });
                break;
            case 'checkbox':
                inputElement = h('input', { ...baseProps, type: 'checkbox', checked: !!value });
                break;
            case 'color':
                inputElement = h('div', { className: 'color-input-group' },
                    h('input', { 
                        ...baseProps, 
                        type: 'color', 
                        value: value || '#ffffff',
                        className: 'color-picker'
                    }),
                    h('input', { 
                        ...baseProps, 
                        type: 'text', 
                        value,
                        placeholder: '#FFFFFF',
                        className: 'color-text',
                        onChange: (e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith('#')) val = '#' + val;
                            handleInputChange(field.name, val);
                        }
                    }),
                    h('div', { 
                        className: 'color-preview',
                        style: { backgroundColor: value || '#ffffff' }
                    })
                );
                break;
            case 'select':
                inputElement = h('select', { ...baseProps, value },
                    h('option', { value: '' }, 'Selecteer...'),
                    ...(field.options || []).map(option => 
                        h('option', { key: option.value, value: option.value }, option.label)
                    )
                );
                break;
            default:
                inputElement = h('input', { 
                    ...baseProps, 
                    type: field.type || 'text', 
                    value 
                });
        }

        return h('div', { 
            className: `form-field ${field.colSpan ? `col-span-${field.colSpan}` : ''}`,
            key: field.name 
        },
            h('label', { htmlFor: field.name }, 
                field.label,
                field.required && h('span', { className: 'required' }, ' *')
            ),
            inputElement,
            field.help && h('div', { className: 'form-help' }, field.help),
            hasError && h('div', { className: 'form-error' }, hasError)
        );
    };

    const renderSection = (section, index) => {
        return h('div', { className: 'form-section', key: index },
            h('h3', { className: 'form-section-title' }, section.title),
            h('div', { className: 'form-section-fields' },
                section.fields.map(renderField)
            )
        );
    };

    return h('div', { className: 'modal-form-content modal-compact' },
        h('div', { className: 'form-header' },
            h('h2', { className: 'form-title' }, title)
        ),
        h('form', { onSubmit: handleSubmit, className: 'enhanced-form' },
            h('div', { className: 'form-body' },
                children || config.sections.map(renderSection)
            ),
            h('div', { className: 'form-actions' },
                h('button', {
                    type: 'button',
                    className: 'btn btn-secondary',
                    onClick: onCancel,
                    disabled: isSubmitting
                }, 'Annuleren'),
                h('button', {
                    type: 'submit',
                    className: 'btn btn-primary',
                    disabled: isSubmitting
                }, isSubmitting ? 'Opslaan...' : 'Opslaan')
            )
        )
    );
};

// Export form data helper
export const useFormData = (initialData) => {
    const [formData, setFormData] = useState(initialData);
    
    const updateField = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const resetForm = (newData = {}) => {
        setFormData(newData);
    };

    return { formData, updateField, resetForm };
};
