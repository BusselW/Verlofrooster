/**
 * @file UserRegistrationCheck.js
 * @description Component voor het controleren of een gebruiker is geregistreerd in de Medewerkers lijst
 */

import { getCurrentUserInfo, getSharePointListItems } from '../services/sharepointService.js';

const { createElement: h, useState, useEffect } = window.React;

/**
 * Robust user-to-medewerker matching with multiple strategies
 */
const matchMedewerkerToUser = (user, medewerkers) => {
    if (!user || !Array.isArray(medewerkers) || medewerkers.length === 0) {
        console.warn('matchMedewerkerToUser: Invalid input', { user: !!user, medewerkers: medewerkers?.length });
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

    console.log('🔍 Matching user with candidates:', {
        loginName,
        domain,
        account,
        usernameCandidates: Array.from(usernameCandidates),
        email: emailCandidate,
        title: titleCandidate
    });

    const strategyNames = [
        'Direct Username Match',
        'Short Username Match',
        'Email Match',
        'Title Match'
    ];

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

    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        const match = medewerkers.find(strategy);
        if (match) {
            console.log(`✅ Strategy ${i + 1} (${strategyNames[i]}) matched:`, match.Title, match.Username);
            return match;
        }
    }

    console.warn('❌ No matching strategy found. Checked', medewerkers.length, 'medewerkers');
    return null;
};

/**
 * UserRegistrationCheck Component
 * Controleert of de huidige gebruiker is geregistreerd in de Medewerkers lijst
 * @param {Object} props
 * @param {Function} props.onUserValidated - Callback wanneer validatie succesvol is
 * @param {React.Component} props.children - Child components om te renderen na validatie
 */
export const UserRegistrationCheck = ({ onUserValidated, children }) => {
    const [isValidating, setIsValidating] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const validateUser = async () => {
            try {
                
                // Get current user info
                const user = await getCurrentUserInfo();
                if (!user) {
                    console.error('UserRegistrationCheck: Could not get current user info');
                    setIsValidating(false);
                    return;
                }
                
                setUserInfo(user);
                
                // Check if user exists in Medewerkers list using robust matching
                const medewerkers = await getSharePointListItems('Medewerkers');
                const match = matchMedewerkerToUser(user, medewerkers);
                const exists = match !== null;
                
                setIsRegistered(exists);
                
                if (exists && onUserValidated) {
                    // Call with the expected signature: (isValid, currentUser, userPermissions)
                    onUserValidated(true, user, false);
                }
                
            } catch (error) {
                console.error('UserRegistrationCheck: Error validating user:', error);
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
    
    // Not registered state - AUTOMATICALLY redirect to registration page
    if (!isRegistered) {
        // Automatically redirect without showing a prompt
        window.location.href = 'pages/instellingenCentrum/registratieCentrumN.aspx';
        
        // Show a brief message while redirecting
        return h('div', {
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                zIndex: 9999
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
                h('div', { style: { fontSize: '4rem', marginBottom: '20px' } }, '�'),
                h('h2', { style: { marginBottom: '20px', color: '#333' } }, 'Doorverwijzen naar registratie...'),
                h('p', { style: { marginBottom: '20px', color: '#666', lineHeight: '1.6' } },
                    `Je wordt automatisch doorverwezen naar de registratiepagina...`
                ),
                h('div', { 
                    className: 'loading-spinner',
                    style: {
                        margin: '0 auto',
                        width: '40px',
                        height: '40px'
                    }
                }),
                userInfo && h('p', {
                    style: {
                        marginTop: '24px',
                        fontSize: '13px',
                        color: '#9ca3af'
                    }
                }, `Ingelogd als: ${userInfo.Title || userInfo.LoginName}`)
            )
        );
    }
    
    // Registered - render children
    return children;
};

// Also export as default for compatibility
export default UserRegistrationCheck;
