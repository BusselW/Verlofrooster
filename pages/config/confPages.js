/**
 * Configuration file for admin pages
 * Defines common components and settings for administrative pages
 */

// Import linkInfo service for proper navigation
import * as linkInfo from '../../js/services/linkInfo.js';

// Make sure React is available globally
const { createElement: h, useState, useEffect } = React;

/**
 * Common header component for general pages
 * @param {Object} props - Component properties
 * @param {string} props.title - Main title for the page
 * @param {string} props.subtitle - Subtitle for the page
 * @param {function} props.onBack - Function to call when back button is clicked
 */
export const GHeader = ({ title, subtitle, onBack }) => {
    return h('div', { className: 'general-header' },
        h('div', { className: 'general-header-content' },
            // Back button
            h('button', {
                className: 'btn btn-back',
                onClick: onBack,
                title: 'Terug naar hoofdpagina'
            },
                h('i', { className: 'fas fa-arrow-left' }),
                'Terug'
            ),
            // Title section
            h('div', { className: 'general-header-text' },
                h('h1', { className: 'general-title' }, title),
                subtitle && h('p', { className: 'general-subtitle' }, subtitle)
            )
        )
    );
};

/**
 * Permission check for admin access
 * @param {Object} userPermissions - User permissions object
 * @returns {boolean} Whether user has admin access
 */
export const hasAdminAccess = (userPermissions) => {
    return userPermissions?.isAdmin === true;
};

/**
 * Access denied component
 */
export const AccessDenied = () => {
    return h('div', { className: 'access-denied-container' },
        h('div', { className: 'access-denied-content' },
            h('div', { className: 'access-denied-icon' },
                h('i', { className: 'fas fa-lock' })
            ),
            h('h2', null, 'Toegang geweigerd'),
            h('p', null, 'U heeft geen toegang tot deze pagina. Alleen SharePoint beheerders kunnen deze functionaliteit gebruiken.'),
            h('button', {
                className: 'btn btn-primary',
                onClick: () => window.history.back()
            }, 'Terug')
        )
    );
};

/**
 * Default navigation function to go back to main application
 */
export const navigateBack = () => {
    const targetUrl = linkInfo.getVerlofRoosterUrl();
    window.location.href = targetUrl;
};

console.log('Admin page configuration loaded successfully.');