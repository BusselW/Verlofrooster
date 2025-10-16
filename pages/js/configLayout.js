// configLayout.js - Standardized UI Components for VERLI Huisstijl
// This file provides consistent styling and behavior for all form components across centrum pages

/**
 * VERLI Huisstijl Configuration
 * Standard colors, spacing, and styling for consistent UI
 */
export const VERLI_THEME = {
    colors: {
        primary: '#007bff',
        primaryHover: '#0056b3',
        secondary: '#6c757d',
        success: '#28a745',
        successHover: '#218838',
        warning: '#ffc107',
        warningHover: '#e0a800',
        danger: '#dc3545',
        dangerHover: '#c82333',
        info: '#17a2b8',
        light: '#f8f9fa',
        dark: '#343a40',
        white: '#ffffff',
        border: '#dee2e6',
        borderLight: '#e9ecef',
        text: '#212529',
        textMuted: '#6c757d',
        background: '#ffffff',
        backgroundLight: '#f8f9fa',
        shadow: 'rgba(0, 0, 0, 0.1)',
        shadowStrong: 'rgba(0, 0, 0, 0.25)'
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px'
    },
    borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        pill: '50px'
    },
    typography: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        fontSizes: {
            xs: '12px',
            sm: '14px',
            md: '16px',
            lg: '18px',
            xl: '20px',
            xxl: '24px'
        },
        fontWeights: {
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700'
        }
    },
    shadows: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 4px 8px rgba(0, 0, 0, 0.1)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
        xl: '0 16px 32px rgba(0, 0, 0, 0.1)'
    },
    transitions: {
        fast: '0.15s ease',
        normal: '0.3s ease',
        slow: '0.5s ease'
    }
};

/**
 * Base component class for all VERLI UI components
 */
export class VERLIComponent {
    constructor(options = {}) {
        this.options = { ...this.getDefaultOptions(), ...options };
        this.element = null;
        this.isDestroyed = false;
    }

    getDefaultOptions() {
        return {};
    }

    create() {
        throw new Error('create() method must be implemented');
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.isDestroyed = true;
    }

    on(event, handler) {
        if (this.element) {
            this.element.addEventListener(event, handler);
        }
    }

    off(event, handler) {
        if (this.element) {
            this.element.removeEventListener(event, handler);
        }
    }
}

/**
 * Standardized Input Field Component
 */
export class VERLIInput extends VERLIComponent {
    getDefaultOptions() {
        return {
            type: 'text',
            placeholder: '',
            label: '',
            value: '',
            required: false,
            disabled: false,
            readonly: false,
            validation: null,
            size: 'md', // sm, md, lg
            fullWidth: true,
            helpText: '',
            errorText: '',
            maxLength: null,
            minLength: null,
            pattern: null,
            autocomplete: 'off',
            id: null,
            name: null,
            ariaLabel: null,
            className: ''
        };
    }

    create() {
        const container = document.createElement('div');
        container.className = `verli-input-container ${this.options.className}`;
        
        // Create label if provided
        if (this.options.label) {
            const label = document.createElement('label');
            label.className = 'verli-input-label';
            label.textContent = this.options.label;
            if (this.options.required) {
                label.innerHTML += ' <span class="verli-required">*</span>';
            }
            if (this.options.id) {
                label.setAttribute('for', this.options.id);
            }
            container.appendChild(label);
        }

        // Create input wrapper
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'verli-input-wrapper';

        // Create input element
        const input = document.createElement('input');
        input.type = this.options.type;
        input.className = `verli-input verli-input-${this.options.size}`;
        input.placeholder = this.options.placeholder;
        input.value = this.options.value;
        input.disabled = this.options.disabled;
        input.readOnly = this.options.readonly;
        input.required = this.options.required;
        input.autocomplete = this.options.autocomplete;

        if (this.options.id) input.id = this.options.id;
        if (this.options.name) input.name = this.options.name;
        if (this.options.ariaLabel) input.setAttribute('aria-label', this.options.ariaLabel);
        if (this.options.maxLength) input.maxLength = this.options.maxLength;
        if (this.options.minLength) input.minLength = this.options.minLength;
        if (this.options.pattern) input.pattern = this.options.pattern;
        if (this.options.fullWidth) input.style.width = '100%';

        // Add validation
        if (this.options.validation) {
            input.addEventListener('blur', () => this.validate());
            input.addEventListener('input', () => this.clearError());
        }

        inputWrapper.appendChild(input);

        // Create help text if provided
        if (this.options.helpText) {
            const helpText = document.createElement('div');
            helpText.className = 'verli-input-help';
            helpText.textContent = this.options.helpText;
            inputWrapper.appendChild(helpText);
        }

        // Create error text container
        const errorText = document.createElement('div');
        errorText.className = 'verli-input-error';
        errorText.style.display = 'none';
        if (this.options.errorText) {
            errorText.textContent = this.options.errorText;
            errorText.style.display = 'block';
            input.classList.add('verli-input-error-state');
        }
        inputWrapper.appendChild(errorText);

        container.appendChild(inputWrapper);
        this.element = container;
        this.input = input;
        this.errorElement = errorText;

        return container;
    }

    getValue() {
        return this.input ? this.input.value : '';
    }

    setValue(value) {
        if (this.input) {
            this.input.value = value;
        }
    }

    validate() {
        if (!this.options.validation || !this.input) return true;

        const value = this.input.value;
        const result = this.options.validation(value);

        if (result === true) {
            this.clearError();
            return true;
        } else {
            this.showError(result);
            return false;
        }
    }

    showError(message) {
        if (this.input && this.errorElement) {
            this.input.classList.add('verli-input-error-state');
            this.errorElement.textContent = message;
            this.errorElement.style.display = 'block';
        }
    }

    clearError() {
        if (this.input && this.errorElement) {
            this.input.classList.remove('verli-input-error-state');
            this.errorElement.style.display = 'none';
        }
    }

    focus() {
        if (this.input) {
            this.input.focus();
        }
    }

    disable() {
        if (this.input) {
            this.input.disabled = true;
        }
    }

    enable() {
        if (this.input) {
            this.input.disabled = false;
        }
    }
}

/**
 * Standardized Textarea Component
 */
export class VERLITextarea extends VERLIComponent {
    getDefaultOptions() {
        return {
            placeholder: '',
            label: '',
            value: '',
            required: false,
            disabled: false,
            readonly: false,
            rows: 4,
            cols: null,
            maxLength: null,
            minLength: null,
            resize: 'vertical', // none, horizontal, vertical, both
            fullWidth: true,
            helpText: '',
            errorText: '',
            id: null,
            name: null,
            ariaLabel: null,
            className: ''
        };
    }

    create() {
        const container = document.createElement('div');
        container.className = `verli-textarea-container ${this.options.className}`;
        
        // Create label if provided
        if (this.options.label) {
            const label = document.createElement('label');
            label.className = 'verli-textarea-label';
            label.textContent = this.options.label;
            if (this.options.required) {
                label.innerHTML += ' <span class="verli-required">*</span>';
            }
            if (this.options.id) {
                label.setAttribute('for', this.options.id);
            }
            container.appendChild(label);
        }

        // Create textarea wrapper
        const textareaWrapper = document.createElement('div');
        textareaWrapper.className = 'verli-textarea-wrapper';

        // Create textarea element
        const textarea = document.createElement('textarea');
        textarea.className = 'verli-textarea';
        textarea.placeholder = this.options.placeholder;
        textarea.value = this.options.value;
        textarea.disabled = this.options.disabled;
        textarea.readOnly = this.options.readonly;
        textarea.required = this.options.required;
        textarea.rows = this.options.rows;
        textarea.style.resize = this.options.resize;

        if (this.options.id) textarea.id = this.options.id;
        if (this.options.name) textarea.name = this.options.name;
        if (this.options.ariaLabel) textarea.setAttribute('aria-label', this.options.ariaLabel);
        if (this.options.maxLength) textarea.maxLength = this.options.maxLength;
        if (this.options.minLength) textarea.minLength = this.options.minLength;
        if (this.options.cols) textarea.cols = this.options.cols;
        if (this.options.fullWidth) textarea.style.width = '100%';

        textareaWrapper.appendChild(textarea);

        // Create help text if provided
        if (this.options.helpText) {
            const helpText = document.createElement('div');
            helpText.className = 'verli-textarea-help';
            helpText.textContent = this.options.helpText;
            textareaWrapper.appendChild(helpText);
        }

        // Create error text container
        const errorText = document.createElement('div');
        errorText.className = 'verli-textarea-error';
        errorText.style.display = 'none';
        if (this.options.errorText) {
            errorText.textContent = this.options.errorText;
            errorText.style.display = 'block';
            textarea.classList.add('verli-textarea-error-state');
        }
        textareaWrapper.appendChild(errorText);

        container.appendChild(textareaWrapper);
        this.element = container;
        this.textarea = textarea;
        this.errorElement = errorText;

        return container;
    }

    getValue() {
        return this.textarea ? this.textarea.value : '';
    }

    setValue(value) {
        if (this.textarea) {
            this.textarea.value = value;
        }
    }

    focus() {
        if (this.textarea) {
            this.textarea.focus();
        }
    }
}

/**
 * Standardized Select Dropdown Component
 */
export class VERLISelect extends VERLIComponent {
    getDefaultOptions() {
        return {
            label: '',
            options: [], // Array of {value, text, disabled, selected}
            value: '',
            required: false,
            disabled: false,
            multiple: false,
            size: 'md',
            fullWidth: true,
            helpText: '',
            errorText: '',
            placeholder: 'Selecteer een optie...',
            id: null,
            name: null,
            ariaLabel: null,
            className: '',
            searchable: false,
            clearable: false
        };
    }

    create() {
        const container = document.createElement('div');
        container.className = `verli-select-container ${this.options.className}`;
        
        // Create label if provided
        if (this.options.label) {
            const label = document.createElement('label');
            label.className = 'verli-select-label';
            label.textContent = this.options.label;
            if (this.options.required) {
                label.innerHTML += ' <span class="verli-required">*</span>';
            }
            if (this.options.id) {
                label.setAttribute('for', this.options.id);
            }
            container.appendChild(label);
        }

        // Create select wrapper
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'verli-select-wrapper';

        // Create select element
        const select = document.createElement('select');
        select.className = `verli-select verli-select-${this.options.size}`;
        select.disabled = this.options.disabled;
        select.required = this.options.required;
        select.multiple = this.options.multiple;

        if (this.options.id) select.id = this.options.id;
        if (this.options.name) select.name = this.options.name;
        if (this.options.ariaLabel) select.setAttribute('aria-label', this.options.ariaLabel);
        if (this.options.fullWidth) select.style.width = '100%';

        // Add placeholder option if not multiple
        if (!this.options.multiple && this.options.placeholder) {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = this.options.placeholder;
            placeholderOption.disabled = true;
            placeholderOption.selected = !this.options.value;
            select.appendChild(placeholderOption);
        }

        // Add options
        this.options.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            optionElement.disabled = option.disabled || false;
            optionElement.selected = option.selected || (option.value === this.options.value);
            select.appendChild(optionElement);
        });

        selectWrapper.appendChild(select);

        // Create help text if provided
        if (this.options.helpText) {
            const helpText = document.createElement('div');
            helpText.className = 'verli-select-help';
            helpText.textContent = this.options.helpText;
            selectWrapper.appendChild(helpText);
        }

        // Create error text container
        const errorText = document.createElement('div');
        errorText.className = 'verli-select-error';
        errorText.style.display = 'none';
        if (this.options.errorText) {
            errorText.textContent = this.options.errorText;
            errorText.style.display = 'block';
            select.classList.add('verli-select-error-state');
        }
        selectWrapper.appendChild(errorText);

        container.appendChild(selectWrapper);
        this.element = container;
        this.select = select;
        this.errorElement = errorText;

        return container;
    }

    getValue() {
        if (!this.select) return this.options.multiple ? [] : '';
        
        if (this.options.multiple) {
            return Array.from(this.select.selectedOptions).map(option => option.value);
        }
        return this.select.value;
    }

    setValue(value) {
        if (!this.select) return;

        if (this.options.multiple) {
            Array.from(this.select.options).forEach(option => {
                option.selected = Array.isArray(value) ? value.includes(option.value) : false;
            });
        } else {
            this.select.value = value;
        }
    }

    addOption(value, text, selected = false) {
        if (!this.select) return;

        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        option.selected = selected;
        this.select.appendChild(option);
    }

    removeOption(value) {
        if (!this.select) return;

        const option = this.select.querySelector(`option[value="${value}"]`);
        if (option) {
            option.remove();
        }
    }

    clearOptions() {
        if (!this.select) return;

        // Keep placeholder if exists
        const placeholder = this.select.querySelector('option[disabled]:first-child');
        this.select.innerHTML = '';
        if (placeholder) {
            this.select.appendChild(placeholder);
        }
    }
}

/**
 * Standardized Checkbox Component
 */
export class VERLICheckbox extends VERLIComponent {
    getDefaultOptions() {
        return {
            label: '',
            checked: false,
            disabled: false,
            required: false,
            value: 'on',
            id: null,
            name: null,
            ariaLabel: null,
            className: '',
            helpText: '',
            size: 'md' // sm, md, lg
        };
    }

    create() {
        const container = document.createElement('div');
        container.className = `verli-checkbox-container ${this.options.className}`;

        // Create checkbox wrapper
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'verli-checkbox-wrapper';

        // Create checkbox input
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = `verli-checkbox verli-checkbox-${this.options.size}`;
        checkbox.checked = this.options.checked;
        checkbox.disabled = this.options.disabled;
        checkbox.required = this.options.required;
        checkbox.value = this.options.value;

        if (this.options.id) checkbox.id = this.options.id;
        if (this.options.name) checkbox.name = this.options.name;
        if (this.options.ariaLabel) checkbox.setAttribute('aria-label', this.options.ariaLabel);

        // Create custom checkbox visual
        const checkboxVisual = document.createElement('div');
        checkboxVisual.className = 'verli-checkbox-visual';

        // Create label
        const label = document.createElement('label');
        label.className = 'verli-checkbox-label';
        if (this.options.id) {
            label.setAttribute('for', this.options.id);
        }

        // Add click handler to label for accessibility
        label.addEventListener('click', () => {
            if (!this.options.disabled) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        label.appendChild(checkbox);
        label.appendChild(checkboxVisual);

        if (this.options.label) {
            const labelText = document.createElement('span');
            labelText.className = 'verli-checkbox-text';
            labelText.textContent = this.options.label;
            label.appendChild(labelText);
        }

        checkboxWrapper.appendChild(label);

        // Create help text if provided
        if (this.options.helpText) {
            const helpText = document.createElement('div');
            helpText.className = 'verli-checkbox-help';
            helpText.textContent = this.options.helpText;
            checkboxWrapper.appendChild(helpText);
        }

        container.appendChild(checkboxWrapper);
        this.element = container;
        this.checkbox = checkbox;

        return container;
    }

    getValue() {
        return this.checkbox ? this.checkbox.checked : false;
    }

    setValue(checked) {
        if (this.checkbox) {
            this.checkbox.checked = checked;
        }
    }

    check() {
        this.setValue(true);
    }

    uncheck() {
        this.setValue(false);
    }

    toggle() {
        this.setValue(!this.getValue());
    }
}

/**
 * Standardized Button Component
 */
export class VERLIButton extends VERLIComponent {
    getDefaultOptions() {
        return {
            text: '',
            type: 'button', // button, submit, reset
            variant: 'primary', // primary, secondary, success, warning, danger, info, light, dark, link
            size: 'md', // sm, md, lg
            disabled: false,
            loading: false,
            fullWidth: false,
            icon: null,
            iconPosition: 'left', // left, right
            onClick: null,
            id: null,
            className: '',
            ariaLabel: null,
            tooltip: null
        };
    }

    create() {
        const button = document.createElement('button');
        button.type = this.options.type;
        button.className = `verli-button verli-button-${this.options.variant} verli-button-${this.options.size} ${this.options.className}`;
        button.disabled = this.options.disabled || this.options.loading;

        if (this.options.id) button.id = this.options.id;
        if (this.options.ariaLabel) button.setAttribute('aria-label', this.options.ariaLabel);
        if (this.options.tooltip) button.title = this.options.tooltip;
        if (this.options.fullWidth) button.style.width = '100%';

        // Create button content
        const content = document.createElement('div');
        content.className = 'verli-button-content';

        // Add icon if provided
        if (this.options.icon && this.options.iconPosition === 'left') {
            const icon = document.createElement('i');
            icon.className = `verli-button-icon verli-button-icon-left ${this.options.icon}`;
            content.appendChild(icon);
        }

        // Add text
        if (this.options.text) {
            const text = document.createElement('span');
            text.className = 'verli-button-text';
            text.textContent = this.options.text;
            content.appendChild(text);
        }

        // Add icon if provided (right position)
        if (this.options.icon && this.options.iconPosition === 'right') {
            const icon = document.createElement('i');
            icon.className = `verli-button-icon verli-button-icon-right ${this.options.icon}`;
            content.appendChild(icon);
        }

        // Add loading spinner if loading
        if (this.options.loading) {
            const spinner = document.createElement('div');
            spinner.className = 'verli-button-spinner';
            content.appendChild(spinner);
            button.classList.add('verli-button-loading');
        }

        button.appendChild(content);

        // Add click handler
        if (this.options.onClick) {
            button.addEventListener('click', this.options.onClick);
        }

        this.element = button;
        this.button = button;

        return button;
    }

    setText(text) {
        if (this.button) {
            const textElement = this.button.querySelector('.verli-button-text');
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }

    setLoading(loading) {
        if (!this.button) return;

        if (loading) {
            this.button.disabled = true;
            this.button.classList.add('verli-button-loading');
            
            // Add spinner if not exists
            if (!this.button.querySelector('.verli-button-spinner')) {
                const spinner = document.createElement('div');
                spinner.className = 'verli-button-spinner';
                this.button.querySelector('.verli-button-content').appendChild(spinner);
            }
        } else {
            this.button.disabled = this.options.disabled;
            this.button.classList.remove('verli-button-loading');
            
            // Remove spinner
            const spinner = this.button.querySelector('.verli-button-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    disable() {
        if (this.button) {
            this.button.disabled = true;
        }
    }

    enable() {
        if (this.button) {
            this.button.disabled = false;
        }
    }
}

/**
 * Standardized Card Component
 */
export class VERLICard extends VERLIComponent {
    getDefaultOptions() {
        return {
            title: '',
            text: '',
            imageUrl: '',
            imageAlt: '',
            className: '',
            onClick: null
        };
    }

    create() {
        const card = document.createElement('div');
        card.className = `verli-card ${this.options.className}`;

        if (this.options.onClick) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', this.options.onClick);
        }

        // Add image if provided
        if (this.options.imageUrl) {
            const image = document.createElement('img');
            image.className = 'verli-card-image';
            image.src = this.options.imageUrl;
            image.alt = this.options.imageAlt;
            card.appendChild(image);
        }

        // Add content container
        const content = document.createElement('div');
        content.className = 'verli-card-content';

        // Add title if provided
        if (this.options.title) {
            const title = document.createElement('h3');
            title.className = 'verli-card-title';
            title.textContent = this.options.title;
            content.appendChild(title);
        }

        // Add text if provided
        if (this.options.text) {
            const text = document.createElement('p');
            text.className = 'verli-card-text';
            text.textContent = this.options.text;
            content.appendChild(text);
        }

        card.appendChild(content);
        this.element = card;

        return card;
    }
}

/**
 * Standardized Breadcrumb Component
 */
export class VERLIBreadcrumb extends VERLIComponent {
    getDefaultOptions() {
        return {
            items: [], // Array of {text, href, active}
            separator: '/',
            className: ''
        };
    }

    create() {
        const nav = document.createElement('nav');
        nav.className = `verli-breadcrumb ${this.options.className}`;

        this.options.items.forEach((item, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                separator.className = 'verli-breadcrumb-separator';
                separator.textContent = this.options.separator;
                nav.appendChild(separator);
            }

            if (item.active || !item.href) {
                const span = document.createElement('span');
                span.className = 'verli-breadcrumb-item verli-breadcrumb-active';
                span.textContent = item.text;
                nav.appendChild(span);
            } else {
                const link = document.createElement('a');
                link.className = 'verli-breadcrumb-item verli-breadcrumb-link';
                link.href = item.href;
                link.textContent = item.text;
                nav.appendChild(link);
            }
        });

        this.element = nav;
        return nav;
    }
}

/**
 * Standardized Progress Bar Component
 */
export class VERLIProgress extends VERLIComponent {
    getDefaultOptions() {
        return {
            value: 0,
            max: 100,
            animated: false,
            variant: 'primary', // primary, success, warning, danger
            className: ''
        };
    }

    create() {
        const progress = document.createElement('div');
        progress.className = `verli-progress ${this.options.className}`;

        const bar = document.createElement('div');
        bar.className = `verli-progress-bar verli-progress-${this.options.variant}`;
        if (this.options.animated) {
            bar.classList.add('verli-progress-animated');
        }

        this.updateProgress();
        progress.appendChild(bar);

        this.element = progress;
        this.bar = bar;
        return progress;
    }

    updateProgress() {
        if (this.bar) {
            const percentage = Math.min(100, Math.max(0, (this.options.value / this.options.max) * 100));
            this.bar.style.width = `${percentage}%`;
        }
    }

    setValue(value) {
        this.options.value = value;
        this.updateProgress();
    }
}

/**
 * Standardized Tabs Component
 */
export class VERLITabs extends VERLIComponent {
    getDefaultOptions() {
        return {
            tabs: [], // Array of {id, label, content, active}
            className: ''
        };
    }

    create() {
        const container = document.createElement('div');
        container.className = `verli-tabs-container ${this.options.className}`;

        // Create tabs header
        const tabsHeader = document.createElement('div');
        tabsHeader.className = 'verli-tabs';

        // Create tab panels container
        const panelsContainer = document.createElement('div');
        panelsContainer.className = 'verli-tab-panels';

        this.options.tabs.forEach((tab, index) => {
            // Create tab button
            const tabButton = document.createElement('div');
            tabButton.className = 'verli-tab';
            tabButton.textContent = tab.label;
            tabButton.dataset.tab = tab.id;
            if (tab.active) {
                tabButton.classList.add('verli-tab-active');
            }

            // Add click handler
            tabButton.addEventListener('click', () => {
                this.activateTab(tab.id);
            });

            tabsHeader.appendChild(tabButton);

            // Create tab panel
            const panel = document.createElement('div');
            panel.className = 'verli-tab-panel';
            panel.id = tab.id;
            if (tab.active) {
                panel.classList.add('verli-tab-active');
            }
            if (typeof tab.content === 'string') {
                panel.innerHTML = tab.content;
            } else if (tab.content instanceof HTMLElement) {
                panel.appendChild(tab.content);
            }

            panelsContainer.appendChild(panel);
        });

        container.appendChild(tabsHeader);
        container.appendChild(panelsContainer);

        this.element = container;
        this.tabsHeader = tabsHeader;
        this.panelsContainer = panelsContainer;

        return container;
    }

    activateTab(tabId) {
        // Remove active class from all tabs and panels
        this.tabsHeader.querySelectorAll('.verli-tab').forEach(tab => {
            tab.classList.remove('verli-tab-active');
        });
        this.panelsContainer.querySelectorAll('.verli-tab-panel').forEach(panel => {
            panel.classList.remove('verli-tab-active');
        });

        // Add active class to selected tab and panel
        const selectedTab = this.tabsHeader.querySelector(`[data-tab="${tabId}"]`);
        const selectedPanel = this.panelsContainer.querySelector(`#${tabId}`);

        if (selectedTab) selectedTab.classList.add('verli-tab-active');
        if (selectedPanel) selectedPanel.classList.add('verli-tab-active');
    }
}

/**
 * Standardized Accordion Component
 */
export class VERLIAccordion extends VERLIComponent {
    getDefaultOptions() {
        return {
            items: [], // Array of {id, title, content, open}
            allowMultiple: false,
            className: ''
        };
    }

    create() {
        const accordion = document.createElement('div');
        accordion.className = `verli-accordion ${this.options.className}`;

        this.options.items.forEach((item, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'verli-accordion-item';

            // Create header
            const header = document.createElement('div');
            header.className = 'verli-accordion-header';
            header.innerHTML = `
                <h4>${item.title}</h4>
                <span class="verli-accordion-icon">▶</span>
            `;

            // Create content
            const content = document.createElement('div');
            content.className = 'verli-accordion-content';
            if (typeof item.content === 'string') {
                content.innerHTML = item.content;
            } else if (item.content instanceof HTMLElement) {
                content.appendChild(item.content);
            }

            // Set initial state
            if (item.open) {
                content.classList.add('verli-accordion-open');
                header.querySelector('.verli-accordion-icon').classList.add('verli-accordion-open');
            }

            // Add click handler
            header.addEventListener('click', () => {
                this.toggleItem(accordionItem, !this.options.allowMultiple);
            });

            accordionItem.appendChild(header);
            accordionItem.appendChild(content);
            accordion.appendChild(accordionItem);
        });

        this.element = accordion;
        return accordion;
    }

    toggleItem(item, closeOthers = false) {
        const content = item.querySelector('.verli-accordion-content');
        const icon = item.querySelector('.verli-accordion-icon');
        const isOpen = content.classList.contains('verli-accordion-open');

        if (closeOthers) {
            // Close all other items
            this.element.querySelectorAll('.verli-accordion-content').forEach(otherContent => {
                if (otherContent !== content) {
                    otherContent.classList.remove('verli-accordion-open');
                    otherContent.parentNode.querySelector('.verli-accordion-icon').classList.remove('verli-accordion-open');
                }
            });
        }

        // Toggle current item
        content.classList.toggle('verli-accordion-open', !isOpen);
        icon.classList.toggle('verli-accordion-open', !isOpen);
    }
}

/**
 * Utility functions for validation
 */
export const VERLIValidation = {
    required: (value) => {
        return value && value.trim() !== '' ? true : 'Dit veld is verplicht';
    },

    email: (value) => {
        if (!value) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? true : 'Voer een geldig e-mailadres in';
    },

    minLength: (min) => (value) => {
        if (!value) return true;
        return value.length >= min ? true : `Minimaal ${min} tekens vereist`;
    },

    maxLength: (max) => (value) => {
        if (!value) return true;
        return value.length <= max ? true : `Maximaal ${max} tekens toegestaan`;
    },

    number: (value) => {
        if (!value) return true;
        return !isNaN(value) && !isNaN(parseFloat(value)) ? true : 'Voer een geldig getal in';
    },

    pattern: (pattern, message) => (value) => {
        if (!value) return true;
        const regex = new RegExp(pattern);
        return regex.test(value) ? true : message;
    },

    combine: (...validators) => (value) => {
        for (const validator of validators) {
            const result = validator(value);
            if (result !== true) {
                return result;
            }
        }
        return true;
    }
};

/**
 * Utility functions for common operations
 */
export const VERLIUtils = {
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    },

    formatDate: (date, format = 'dd-mm-yyyy') => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        return format
            .replace('dd', day)
            .replace('mm', month)
            .replace('yyyy', year);
    },

    generateId: (prefix = 'verli') => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};

console.log('✅ VERLI ConfigLayout System loaded successfully');