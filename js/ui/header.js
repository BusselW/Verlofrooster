// Header.js - Navigation header with admin buttons and user menu
import { getProfilePhotoUrl } from '../utils/userUtils.js';
import { getBaseUrl } from '../services/linkInfo.js';

const { useState, useEffect, createElement: h } = React;

/**
 * Navigation Header Component
 * @param {object} props - Component properties
 * @param {object} props.userPermissions - User permissions object
 * @param {object} props.currentUser - Current user data from SharePoint
 */
const Header = ({ userPermissions, currentUser }) => {
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [userInfo, setUserInfo] = useState({
        naam: '',
        pictureUrl: '',
        loading: true
    });

    // Load user information and photo
    useEffect(() => {
        if (currentUser && currentUser.Email) {
            setUserInfo(prev => ({ 
                ...prev, 
                naam: currentUser.Title || currentUser.LoginName, 
                loading: false 
            }));
            
            // Get profile photo URL from SharePoint
            try {
                const photoUrl = getProfilePhotoUrl(currentUser);
                if (photoUrl) {
                    setUserInfo(prev => ({ ...prev, pictureUrl: photoUrl }));
                } else {
                    // Fallback to SharePoint default user photo
                    setUserInfo(prev => ({ 
                        ...prev,
                        pictureUrl: `/_layouts/15/userphoto.aspx?size=M&username=${encodeURIComponent(currentUser.Email)}`
                    }));
                }
            } catch (error) {
                console.warn('Error getting profile photo URL:', error);
                // Fallback to SharePoint default user photo
                setUserInfo(prev => ({ 
                    ...prev,
                    pictureUrl: `/_layouts/15/userphoto.aspx?size=M&username=${encodeURIComponent(currentUser.Email)}`
                }));
            }
        }
    }, [currentUser]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownOpen && !event.target.closest('.user-dropdown')) {
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userDropdownOpen]);

    const navigateTo = (page) => {
        const baseUrl = getBaseUrl();
        window.location.href = `${baseUrl}/${page}`;
    };

    if (userPermissions.loading || userInfo.loading) {
        return h('div', { className: 'header-placeholder' }, 'Header laden...');
    }

    return h('header', { className: 'app-header' },
        h('div', { className: 'header-content' },
            // Logo/Title section
            h('div', { className: 'header-logo' },
                h('h1', { className: 'app-title' }, 'Verlofrooster')
            ),
            
            // Navigation buttons section
            h('div', { className: 'header-nav' },
                // Admin button
                userPermissions.isAdmin && h('button', {
                    className: 'nav-btn nav-btn-admin',
                    onClick: () => navigateTo('pages/adminCentrum/adminCentrumN.aspx'),
                    title: 'Administratie Centrum'
                },
                    h('i', { className: 'fas fa-cog' }),
                    h('span', null, 'Admin')
                ),

                // Beheer button
                userPermissions.isFunctional && h('button', {
                    className: 'nav-btn nav-btn-beheer',
                    onClick: () => navigateTo('pages/beheerCentrum/beheerCentrumN.aspx'),
                    title: 'Beheer Centrum'
                },
                    h('i', { className: 'fas fa-tools' }),
                    h('span', null, 'Beheer')
                ),

                // Behandelen button
                userPermissions.isTaakbeheer && h('button', {
                    className: 'nav-btn nav-btn-behandelen',
                    onClick: () => navigateTo('pages/behandelCentrum/behandelCentrumN.aspx'),
                    title: 'Behandel Centrum'
                },
                    h('i', { className: 'fas fa-clipboard-check' }),
                    h('span', null, 'Behandelen')
                )
            ),

            // User menu section
            h('div', { className: 'header-user' },
                h('div', { className: 'user-dropdown' },
                    h('button', {
                        className: 'user-menu-trigger',
                        onClick: () => setUserDropdownOpen(!userDropdownOpen),
                        title: `Gebruikersmenu - ${userInfo.naam}`
                    },
                        h('img', {
                            className: 'user-avatar',
                            src: userInfo.pictureUrl,
                            alt: `${userInfo.naam} avatar`,
                            onError: (e) => {
                                // Fallback if image fails to load
                                e.target.src = '/_layouts/15/userphoto.aspx?size=M';
                            }
                        }),
                        h('span', { className: 'user-name' }, userInfo.naam),
                        h('i', { 
                            className: `fas fa-chevron-${userDropdownOpen ? 'up' : 'down'}` 
                        })
                    ),

                    userDropdownOpen && h('div', { className: 'user-dropdown-menu' },
                        h('div', { className: 'dropdown-header' },
                            h('img', {
                                className: 'dropdown-avatar',
                                src: userInfo.pictureUrl,
                                alt: `${userInfo.naam} avatar`
                            }),
                            h('div', { className: 'dropdown-user-info' },
                                h('div', { className: 'dropdown-user-name' }, userInfo.naam),
                                h('div', { className: 'dropdown-user-email' }, currentUser.Email)
                            )
                        ),
                        h('hr', { className: 'dropdown-divider' }),
                        h('button', { 
                            className: 'dropdown-item',
                            onClick: () => navigateTo('pages/instellingenCentrum/instellingenCentrumN.aspx')
                        },
                            h('i', { className: 'fas fa-cog' }),
                            h('span', null, 'Instellingen')
                        ),
                        h('button', { 
                            className: 'dropdown-item',
                            onClick: () => {
                                if (typeof window.openHandleiding === 'function') {
                                    window.openHandleiding();
                                }
                                setUserDropdownOpen(false);
                            }
                        },
                            h('i', { className: 'fas fa-question-circle' }),
                            h('span', null, 'Handleiding')
                        ),
                        h('hr', { className: 'dropdown-divider' }),
                        h('button', { 
                            className: 'dropdown-item dropdown-item-danger',
                            onClick: () => {
                                if (confirm('Weet je zeker dat je wilt uitloggen?')) {
                                    window.location.href = '/_layouts/15/SignOut.aspx';
                                }
                            }
                        },
                            h('i', { className: 'fas fa-sign-out-alt' }),
                            h('span', null, 'Uitloggen')
                        )
                    )
                )
            )
        )
    );
};

export default Header;

console.log("Header component loaded successfully.");