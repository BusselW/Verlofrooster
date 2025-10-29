/**
 * @file UserRegistrationCheck.js
 * @description Component voor het controleren of een gebruiker is geregistreerd in de Medewerkers lijst
 */

import { getCurrentUserInfo, getCurrentUserGroups, checkListItemExists } from '../services/sharepointService.js';

const { createElement: h } = window.React;

/**
 * UserRegistrationCheck Component
 * Controleert of de huidige gebruiker is geregistreerd in de Medewerkers lijst
 * @param {Object} props
 * @param {Function} props.onValidated - Callback wanneer validatie succesvol is
 * @param {React.Component} props.children - Child components om te renderen na validatie
 */
const UserRegistrationCheck = ({ onValidated, children }) => {
    const [isValidating, setIsValidating] = React.useState(true);
    const [isRegistered, setIsRegistered] = React.useState(false);
    const [userInfo, setUserInfo] = React.useState(null);
    const [hasPermission, setHasPermission] = React.useState(false);

    React.useEffect(() => {
        const validateUser = async () => {
            try {
                console.log('🔍 Validating user registration...');
                
                // Get current user info
                const user = await getCurrentUserInfo();
                if (!user) {
                    console.error('❌ Could not get current user info');
                    setIsValidating(false);
                    return;
                }
                
                setUserInfo(user);
                console.log('👤 Current user:', user.Title);
                
                // Get user groups
                const groups = await getCurrentUserGroups();
                console.log('👥 User groups:', groups.map(g => g.Title).join(', '));
                
                // Check if user has admin/management permissions
                const privilegedGroups = [
                    '1. Sharepoint beheer',
                    '1.1. Mulder MT',
                    '2.6 Roosteraars'
                ];
                
                const hasPrivilegedAccess = groups.some(group => 
                    privilegedGroups.some(privileged => 
                        group.Title && group.Title.includes(privileged)
                    )
                );
                
                setHasPermission(hasPrivilegedAccess);
                
                // Extract username from LoginName (format: i:0#.w|domain\username)
                const loginName = user.LoginName.split('|')[1];
                console.log('🔑 Login name:', loginName);
                
                // Check if user exists in Medewerkers list
                const exists = await checkListItemExists('Medewerkers', 'Username', loginName);
                
                if (exists || hasPrivilegedAccess) {
                    console.log('✅ User is registered or has privileged access');
                    setIsRegistered(true);
                    if (onValidated) {
                        onValidated({ user, isRegistered: true, hasPrivilegedAccess });
                    }
                } else {
                    console.warn('⚠️ User is not registered in Medewerkers list');
                    setIsRegistered(false);
                }
                
            } catch (error) {
                console.error('❌ Error validating user:', error);
                setIsRegistered(false);
            } finally {
                setIsValidating(false);
            }
        };
        
        validateUser();
    }, [onValidated]);
    
    // Loading state
    if (isValidating) {
        return h('div', { 
            style: { 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '20px'
            } 
        },
            h('div', { className: 'loading-spinner' }),
            h('p', { style: { fontSize: '1.2rem', color: '#666' } }, 'Gebruiker valideren...')
        );
    }
    
    // Not registered state
    if (!isRegistered) {
        return h('div', {
            style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }
        },
            h('div', {
                style: {
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    maxWidth: '500px',
                    textAlign: 'center'
                }
            },
                h('div', { style: { fontSize: '4rem', marginBottom: '20px' } }, '⚠️'),
                h('h2', { style: { marginBottom: '20px', color: '#333' } }, 'Geen toegang'),
                h('p', { style: { marginBottom: '20px', color: '#666', lineHeight: '1.6' } },
                    hasPermission 
                        ? 'U heeft beheerdersrechten maar bent nog niet geregistreerd in de Medewerkers lijst.'
                        : 'U bent nog niet geregistreerd als medewerker in het systeem.'
                ),
                h('p', { style: { marginBottom: '30px', color: '#666', lineHeight: '1.6' } },
                    'Neem contact op met de beheerder om uzelf te laten registreren in de Medewerkers lijst.'
                ),
                userInfo && h('div', {
                    style: {
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        color: '#666'
                    }
                },
                    h('p', { style: { margin: '5px 0' } }, h('strong', null, 'Naam: '), userInfo.Title),
                    h('p', { style: { margin: '5px 0' } }, h('strong', null, 'E-mail: '), userInfo.Email)
                )
            )
        );
    }
    
    // Registered - render children
    return children;
};

export default UserRegistrationCheck;
