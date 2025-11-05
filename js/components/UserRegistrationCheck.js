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
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const validateUser = async () => {
            try {
                console.log('🔍 [UserRegistrationCheck] Starting validation...');
                console.log('🔍 [UserRegistrationCheck] Component mounted and running');
                
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
                console.log('🎯 [UserRegistrationCheck] User registration status:', exists ? 'REGISTERED' : 'NOT REGISTERED');
                
                if (exists && onUserValidated) {
                    console.log('✅ [UserRegistrationCheck] User is registered, calling onUserValidated callback');
                    // Call with the expected signature: (isValid, currentUser, userPermissions)
                    onUserValidated(true, user, hasPrivilegedAccess);
                } else if (!exists) {
                    console.log('⚠️ [UserRegistrationCheck] User is NOT registered, will show registration prompt');
                }
                
            } catch (error) {
                console.error('❌ [UserRegistrationCheck] Error validating user:', error);
                setIsRegistered(false);
            } finally {
                console.log('🏁 [UserRegistrationCheck] Validation complete, setting isValidating to false');
                setIsValidating(false);
            }
        };
        
        validateUser();
    }, [onUserValidated]);
    
    // Loading state
    if (isValidating) {
        console.log('🔄 [UserRegistrationCheck] Rendering loading state');
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
    
    // Not registered state - redirect to registration page
    if (!isRegistered) {
        console.log('⚠️ [UserRegistrationCheck] Rendering registration prompt - user is NOT registered');
        const redirectToRegistration = () => {
            window.location.href = 'pages/instellingenCentrum/registratieCentrumN.aspx';
        };

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
                h('div', { style: { fontSize: '4rem', marginBottom: '20px' } }, '👤'),
                h('h2', { style: { marginBottom: '20px', color: '#333' } }, 'Account Registratie Vereist'),
                h('p', { style: { marginBottom: '20px', color: '#666', lineHeight: '1.6' } },
                    `Hallo ${userInfo?.Title || 'gebruiker'}! Om het verlofrooster te kunnen gebruiken, moet je eerst je account registreren en instellen.`
                ),
                h('button', {
                    onClick: redirectToRegistration,
                    style: {
                        width: '100%',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '16px',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        transition: 'background-color 0.2s'
                    },
                    onMouseEnter: (e) => e.target.style.backgroundColor = '#2563eb',
                    onMouseLeave: (e) => e.target.style.backgroundColor = '#3b82f6'
                }, '→ Ga naar Registratie'),
                userInfo && h('div', {
                    style: {
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: '1px solid #e5e7eb'
                    }
                },
                    h('p', {
                        style: {
                            fontSize: '12px',
                            color: '#9ca3af'
                        }
                    }, `Ingelogd als: ${userInfo.LoginName}`)
                )
            )
        );
    }
    
    // Registered - render children
    console.log('✅ [UserRegistrationCheck] User is registered, rendering children');
    return children;
};

// Also export as default for compatibility
export default UserRegistrationCheck;
