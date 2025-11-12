/**
 * @file UserRegistrationCheck.js
 * @description Component voor het controleren of een gebruiker is geregistreerd in de Medewerkers lijst
 */

import { getCurrentUserInfo, getSharePointListItems } from '../services/sharepointService.js';

const { createElement: h, useState, useEffect, useMemo } = window.React;

// Debug mode - zet op false voor productie om console logs te verbergen
const DEBUG_MODE = true;

/**
 * Robuuste gebruiker-naar-medewerker matching met meerdere strategieën
 */
const matchMedewerkerToUser = (user, medewerkers) => {
    if (!user || !Array.isArray(medewerkers) || medewerkers.length === 0) {
        console.warn('matchMedewerkerToUser: Ongeldige invoer', { user: !!user, medewerkers: medewerkers?.length });
        return null;
    }

    // Parse login naam en bereid kandidaten voor
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

    if (DEBUG_MODE) {
        console.log('🔍 Gebruiker matchen met kandidaten:', {
            loginName,
            domain,
            account,
            usernameCandidates: Array.from(usernameCandidates),
            email: emailCandidate,
            title: titleCandidate
        });
    }

    // Matching strategieën in volgorde van betrouwbaarheid
    const strategyNames = [
        'Directe Username Match',
        'Korte Username Match',
        'Email Match',
        'Titel Match'
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

    // Zoek eerste match
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        const match = medewerkers.find(strategy);
        if (match) {
            if (DEBUG_MODE) {
                console.log(`✅ Strategie ${i + 1} (${strategyNames[i]}) gevonden:`, match.Title, match.Username);
            }
            return match;
        }
    }

    console.warn('❌ Geen matching strategie gevonden. Gecontroleerd:', medewerkers.length, 'medewerkers');
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
                // Haal huidige gebruiker info op
                const user = await getCurrentUserInfo();
                if (!user) {
                    console.error('UserRegistrationCheck: Kon gebruikersinfo niet ophalen');
                    setIsValidating(false);
                    return;
                }
                
                setUserInfo(user);
                
                // Controleer of gebruiker bestaat in Medewerkers lijst met robuuste matching
                const medewerkers = await getSharePointListItems('Medewerkers');
                const match = matchMedewerkerToUser(user, medewerkers);
                const exists = match !== null;
                
                setIsRegistered(exists);
                
                if (exists && onUserValidated) {
                    // Roep aan met de verwachte signature: (isValid, currentUser, userPermissions)
                    onUserValidated(true, user, false);
                }
                
            } catch (error) {
                console.error('UserRegistrationCheck: Fout bij valideren gebruiker:', error);
                setIsRegistered(false);
            } finally {
                setIsValidating(false);
            }
        };
        
        validateUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Alleen bij mount uitvoeren, onUserValidated kan wijzigen maar dat triggert geen hervalidatie
    
    // Laad status
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
    
    // Niet geregistreerd status - AUTOMATISCH doorsturen naar registratiepagina
    if (!isRegistered) {
        // Gebruik useEffect om redirect te behandelen en render loop te voorkomen
        React.useEffect(() => {
            const redirectTimer = setTimeout(() => {
                window.location.href = 'pages/instellingenCentrum/registratieCentrumN.aspx';
            }, 100);
            
            return () => clearTimeout(redirectTimer);
        }, []);
        
        // Toon een kort bericht tijdens doorsturen
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
                h('div', { style: { fontSize: '4rem', marginBottom: '20px' } }, '🔄'),
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
    
    // Geregistreerd - render children
    return children;
};

// Export ook als default voor compatibiliteit
export default UserRegistrationCheck;
