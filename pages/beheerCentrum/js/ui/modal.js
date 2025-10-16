const { createElement: h } = React;

/**
 * A reusable Modal component.
 * @param {{
 *   isOpen: boolean;
 *   onClose: () => void;
 *   title?: string;
 *   children: React.ReactNode;
 *   footer?: React.ReactNode;
 * }} props
 */
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) {
        return null;
    }

    // Modal content - no click propagation handling needed since overlay doesn't close on click

    return h('div', { className: 'modal-overlay' },
        h('div', { className: 'modal' },
            title && h('div', { className: 'modal-header' },
                h('h2', null, title),
                h('button', { 
                    className: 'modal-close', 
                    onClick: onClose, 
                    'aria-label': 'Sluiten' 
                }, '×')
            ),
            h('div', { className: 'modal-body' }, children),
            footer && h('div', { className: 'modal-footer' }, footer)
        )
    );
};