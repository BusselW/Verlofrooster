const { createElement: h, useState, useEffect, useRef } = React;

// Declare console as global to avoid "console not defined" errors
/* global console */

// Import permission service
import { isUserInAnyGroup } from '../services/permissionService.js';

/**
 * Een Floating Action Button (FAB) met uitklapbare opties.
 * Dit component werkt samen met het selectiemechanisme in k.aspx - de selectie state wordt bewaard
 * en doorgegeven aan formulieren wanneer een optie wordt gekozen. Dit zorgt voor consistentie met het ContextMenu.
 * @param {object} props
 * @param {Array<object>} props.actions - Een array van actie-objecten. Elke object moet { label: string, icon: string, onClick: function, requiredGroups?: Array<string> } bevatten.
 * @param {string} [props.id] - Optionele ID voor het FAB element.
 */
const FloatingActionButton = ({ actions = [], id }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredActions, setFilteredActions] = useState([]);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const fabRef = useRef(null);

    const toggleMenu = (e) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    };

    // Filter actions based on user permissions
    useEffect(() => {
        const filterActions = async () => {
            const filtered = [];
            
            for (const action of actions) {
                if (action.requiredGroups && action.requiredGroups.length > 0) {
                    try {
                        const hasPermission = await isUserInAnyGroup(action.requiredGroups);
                        if (hasPermission) {
                            filtered.push(action);
                        }
                    } catch (error) {
                        console.warn(`Could not check permissions for action ${action.label}:`, error);
                        // In case of error, don't show the action to be safe
                    }
                } else {
                    // No permission requirements, always show
                    filtered.push(action);
                }
            }
            
            setFilteredActions(filtered);
            setPermissionsLoaded(true);
        };

        if (actions.length > 0) {
            filterActions();
        } else {
            setFilteredActions([]);
            setPermissionsLoaded(true);
        }
    }, [actions]);

    // Sluit de FAB als er buiten geklikt wordt
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fabRef.current && !fabRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleActionClick = (action) => {
        action();
        setIsOpen(false);
    };

    // Don't render if permissions are still loading
    if (!permissionsLoaded) {
        return null;
    }

    // Don't render if no actions are available after filtering
    if (filteredActions.length === 0) {
        return null;
    }

    return h('div', { 
        className: 'fab-container', 
        ref: fabRef,
        id: id 
    },
        h('div', { className: `fab-actions ${isOpen ? 'visible' : ''}` },
            filteredActions.map((action, index) =>
                h('div', {
                    key: index,
                    className: `fab-action ${isOpen ? 'visible' : ''}`,
                    onClick: () => handleActionClick(action.onClick)
                },
                    h('span', { className: 'fab-action-label' }, action.label),
                    h('button', { className: 'fab-action-button' }, h('i', { className: `fas ${action.icon}` }))
                )
            )
        ),
        h('button', {
            className: `fab-main-button ${isOpen ? 'open' : ''}`,
            onClick: toggleMenu,
            'aria-label': 'Acties openen'
        },
            h('i', { className: `fas ${isOpen ? 'fa-times' : 'fa-plus'}` })
        )
    );
};

export default FloatingActionButton;

console.log("FloatingActionButton component loaded successfully.");