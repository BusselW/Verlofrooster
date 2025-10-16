/**
 * FormComponent.js - Reusable form components for beheerCentrumN
 * 
 * This module contains reusable form components for the beheerCentrum page,
 * using React with the 'h' pragma.
 */

const { createElement: h, Fragment } = React;

/**
 * Input Field Component
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, number, email, etc.)
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.readOnly - Whether the field is read-only
 * @param {string} props.helpText - Help text to display below the input
 */
function InputField({
    id,
    label,
    type = 'text',
    value,
    onChange,
    required = false,
    placeholder = '',
    readOnly = false,
    helpText = '',
    ...rest
}) {
    return h('div', { className: 'form-group' },
        h('label', { htmlFor: id, className: 'form-label' },
            label,
            required && h('span', { className: 'required-indicator' }, '*')
        ),
        h('input', {
            id,
            type,
            value,
            onChange,
            required,
            placeholder,
            readOnly,
            className: `form-input ${readOnly ? 'read-only' : ''}`,
            ...rest
        }),
        helpText && h('p', { className: 'form-help-text' }, helpText)
    );
}

/**
 * Select Field Component
 * @param {Object} props - Component props
 * @param {string} props.id - Select ID
 * @param {string} props.label - Select label
 * @param {Array} props.options - Array of options { value, label }
 * @param {string|number} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.multiple - Whether multiple selection is allowed
 * @param {string} props.helpText - Help text to display below the select
 */
function SelectField({
    id,
    label,
    options = [],
    value,
    onChange,
    required = false,
    multiple = false,
    helpText = '',
    ...rest
}) {
    return h('div', { className: 'form-group' },
        h('label', { htmlFor: id, className: 'form-label' },
            label,
            required && h('span', { className: 'required-indicator' }, '*')
        ),
        h('select', {
            id,
            value,
            onChange,
            required,
            multiple,
            className: 'form-select',
            ...rest
        },
            options.map(option => 
                h('option', { 
                    key: option.value, 
                    value: option.value 
                }, 
                option.label)
            )
        ),
        helpText && h('p', { className: 'form-help-text' }, helpText)
    );
}

/**
 * Checkbox Field Component
 * @param {Object} props - Component props
 * @param {string} props.id - Checkbox ID
 * @param {string} props.label - Checkbox label
 * @param {boolean} props.checked - Whether the checkbox is checked
 * @param {Function} props.onChange - Change handler
 * @param {string} props.helpText - Help text to display below the checkbox
 */
function CheckboxField({
    id,
    label,
    checked,
    onChange,
    helpText = '',
    ...rest
}) {
    return h('div', { className: 'form-group checkbox-group' },
        h('div', { className: 'checkbox-wrapper' },
            h('input', {
                id,
                type: 'checkbox',
                checked,
                onChange,
                className: 'form-checkbox',
                ...rest
            }),
            h('label', { htmlFor: id, className: 'checkbox-label' }, label)
        ),
        helpText && h('p', { className: 'form-help-text' }, helpText)
    );
}

/**
 * Date Field Component
 * @param {Object} props - Component props
 * @param {string} props.id - Date input ID
 * @param {string} props.label - Date input label
 * @param {string} props.value - Date value (YYYY-MM-DD)
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.min - Minimum date (YYYY-MM-DD)
 * @param {string} props.max - Maximum date (YYYY-MM-DD)
 * @param {string} props.helpText - Help text to display below the input
 */
function DateField({
    id,
    label,
    value,
    onChange,
    required = false,
    min = '',
    max = '',
    helpText = '',
    ...rest
}) {
    return h('div', { className: 'form-group' },
        h('label', { htmlFor: id, className: 'form-label' },
            label,
            required && h('span', { className: 'required-indicator' }, '*')
        ),
        h('input', {
            id,
            type: 'date',
            value,
            onChange,
            required,
            min,
            max,
            className: 'form-input form-date',
            ...rest
        }),
        helpText && h('p', { className: 'form-help-text' }, helpText)
    );
}

/**
 * Textarea Field Component
 * @param {Object} props - Component props
 * @param {string} props.id - Textarea ID
 * @param {string} props.label - Textarea label
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.rows - Number of rows
 * @param {string} props.helpText - Help text to display below the textarea
 */
function TextareaField({
    id,
    label,
    value,
    onChange,
    required = false,
    placeholder = '',
    rows = 4,
    helpText = '',
    ...rest
}) {
    return h('div', { className: 'form-group' },
        h('label', { htmlFor: id, className: 'form-label' },
            label,
            required && h('span', { className: 'required-indicator' }, '*')
        ),
        h('textarea', {
            id,
            value,
            onChange,
            required,
            placeholder,
            rows,
            className: 'form-textarea',
            ...rest
        }),
        helpText && h('p', { className: 'form-help-text' }, helpText)
    );
}

/**
 * Form Actions Component
 * @param {Object} props - Component props
 * @param {Function} props.onCancel - Cancel handler
 * @param {Function} props.onSubmit - Submit handler
 * @param {string} props.submitLabel - Submit button label
 * @param {string} props.cancelLabel - Cancel button label
 * @param {boolean} props.isSubmitting - Whether form is submitting
 */
function FormActions({
    onCancel,
    onSubmit,
    submitLabel = 'Opslaan',
    cancelLabel = 'Annuleren',
    isSubmitting = false
}) {
    return h('div', { className: 'form-actions' },
        h('button', {
            type: 'button',
            onClick: onCancel,
            className: 'btn btn-secondary',
            disabled: isSubmitting
        }, cancelLabel),
        h('button', {
            type: 'submit',
            onClick: onSubmit,
            className: 'btn btn-primary',
            disabled: isSubmitting
        }, 
            isSubmitting ? 'Bezig met opslaan...' : submitLabel
        )
    );
}

// Export components
export {
    InputField,
    SelectField,
    CheckboxField,
    DateField,
    TextareaField,
    FormActions
};