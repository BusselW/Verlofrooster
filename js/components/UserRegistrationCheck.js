/**
 * @file UserRegistrationCheck.js
 * @description Component voor het controleren of een gebruiker is geregistreerd in de Medewerkers lijst
 */

import { getCurrentUserInfo, getSharePointListItems } from '../services/sharepointService.js';

const { createElement: h } = window.React;

/**
 * Robust user-to-medewerker matching with multiple strategies
 */
const matchMedewerkerToUser = (user, medewerkers) => {
    if (!user || !Array.isArray(medewerkers) || medewerkers.length === 0) {
        return null;
    }

    let loginName = user.LoginName || '';
    if (loginName.includes('|')) {
        loginName = loginName.split('|')[1];
    }

    let domain = '';
    let account = loginName;
    if (loginName.includes('\\')) {
        [domain, account] = loginName.split('\\');
    }

    const usernameCandidates = new Set();
    if (loginName) {
        usernameCandidates.add(loginName.toLowerCase());
    }
    if (account) {
        usernameCandidates.add(account.toLowerCase());
    }
    if (domain && account) {
        usernameCandidates.add(`${domain}\\${account}`.toLowerCase());
    }

    const emailCandidate = user.Email ? user.Email.toLowerCase() : null;
    const titleCandidate = user.Title ? user.Title.toLowerCase() : null;

    const strategies = [
        (m) => m.Username && usernameCandidates.has(m.Username.toLowerCase()),
        (m) => {
            if (!m.Username) return false;
            const parts = m.Username.split('\\');
            const shortName = parts.length > 1 ? parts[1] : m.Username;
            return shortName && usernameCandidates.has(shortName.toLowerCase());
        },
        (m) => emailCandidate && m.Email && m.Email.toLowerCase() === emailCandidate,
        (m) => titleCandidate && m.Title && m.Title.toLowerCase() === titleCandidate
    ];

    for (const strategy of strategies) {
        const match = medewerkers.find(strategy);
        if (match) {
            return match;
        }
    }

    return null;
};

/**
 * UserRegistrationCheck Component
 * Controleert of de huidige gebruiker is geregistreerd in de Medewerkers lijst
 * @param {Object} props
 * @param {Function} props.onUserValidated - Callback wanneer validatie succesvol is
 * @param {React.Component} props.children - Child components om te renderen na validatie
 */
const UserRegistrationCheck = ({ onUserValidated, children }) => {
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
                
                // Check if user exists in Medewerkers list using robust matching
                const medewerkers = await getSharePointListItems('Medewerkers');
                const match = matchMedewerkerToUser(user, medewerkers);
                const exists = match !== null;
                
                if (match) {
                    console.log('✅ Matched user to medewerker:', match.Title, '(Username:', match.Username, ')');
                } else {
                    console.warn('⚠️ No medewerker match found for user:', user.Title, user.LoginName, user.Email);
                }
                
                // Note: Permission checking can be added later if needed via permissionService
                // For now, we just check if user is registered in Medewerkers
                const hasPrivilegedAccess = false; // Placeholder
                setHasPermission(hasPrivilegedAccess);
                
                setIsRegistered(exists);
                
                if (exists && onUserValidated) {
                    // Call with the expected signature: (isValid, currentUser, userPermissions)
                    onUserValidated(true, user, hasPrivilegedAccess);
                }
                
            } catch (error) {
                console.error('❌ Error validating user:', error);
                setIsRegistered(false);
            } finally {
                setIsValidating(false);
            }
        };
        
        validateUser();
    }, [onUserValidated]);
    
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
