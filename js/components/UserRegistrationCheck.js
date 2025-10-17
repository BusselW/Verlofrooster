import { fetchSharePointList, getCurrentUser, trimLoginNaamPrefix } from '../services/sharepointService.js';
import { getCurrentUserGroups } from '../services/permissionService.js';

const { useState, useEffect, createElement: h } = window.React;

export const UserRegistrationCheck = ({ onUserValidated, children }) => {
    console.log('🚀 UserRegistrationCheck component initialized');
    const [isChecking, setIsChecking] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState({
        isAdmin: false,
        isFunctional: false,
        isTaakbeheer: false,
        loading: true
    });

    useEffect(() => {
        console.log('📋 UserRegistrationCheck useEffect triggered');
        checkUserRegistration();
    }, []);

    const checkUserRegistration = async () => {
        try {
            console.log('🔍 Starting user registration check...');
            setIsChecking(true);

            const user = await getCurrentUser();
            if (!user) {
                console.warn('⚠️ No user info returned, proceeding anyway');
                onUserValidated(true, null, { 
                    isAdmin: false,
                    isFunctional: false,
                    isTaakbeheer: false,
                    loading: false 
                });
                return;
            }
            setCurrentUser(user);

            const groupsArray = await getCurrentUserGroups();
            
            const permissions = {
                isAdmin: Array.isArray(groupsArray) && groupsArray.some(group => {
                    const groupStr = String(group || '').toLowerCase();
                    return groupStr.includes('admin') || 
                           groupStr.includes('beheerder') ||
                           groupStr.includes('systeembeheer');
                }),
                isFunctional: Array.isArray(groupsArray) && groupsArray.some(group => {
                    const groupStr = String(group || '').toLowerCase();
                    return groupStr.includes('functioneel') || 
                           groupStr.includes('functional') ||
                           groupStr.includes('verlofbeheer');
                }),
                isTaakbeheer: Array.isArray(groupsArray) && groupsArray.some(group => {
                    const groupStr = String(group || '').toLowerCase();
                    return groupStr.includes('taakbeheer') || 
                           groupStr.includes('behandel') ||
                           groupStr.includes('verlofverwerking');
                }),
                loading: false
            };
            
            console.log('👥 User groups:', groupsArray);
            console.log('🔑 Derived permissions:', permissions);

            setUserPermissions(permissions);

            let userLoginName = user?.LoginName || '';
            if (!userLoginName) {
                throw new Error('LoginName niet beschikbaar');
            }
            if (userLoginName.startsWith('i:0#.w|')) {
                userLoginName = userLoginName.substring(7);
            }

            const medewerkers = await fetchSharePointList('Medewerkers');
            const userExists = Array.isArray(medewerkers) && medewerkers.some(m => 
                m?.Actief && 
                m?.Username && 
                (m.Username === userLoginName || 
                 trimLoginNaamPrefix(m.Username) === trimLoginNaamPrefix(userLoginName))
            );

            setIsRegistered(userExists);
            console.log('✅ User validation complete. User exists:', userExists);
            onUserValidated(true, user, permissions);

        } catch (error) {
            console.error('❌ Error checking user registration:', error);
            const defaultPermissions = { 
                isAdmin: false, 
                isFunctional: false, 
                isTaakbeheer: false, 
                loading: false 
            };
            console.log('⚠️ Proceeding with default permissions');
            onUserValidated(true, null, defaultPermissions);
        } finally {
            console.log('🏁 User registration check complete');
            setIsChecking(false);
        }
    };

    const redirectToRegistration = () => {
        window.location.href = 'pages/instellingenCentrum/registratieCentrumN.aspx';
    };

    // Not registered overlay
    if (!isRegistered && !isChecking) {
        return h('div', null,
            children,
            h('div', {
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    fontFamily: 'Inter, sans-serif'
                }
            },
                h('div', {
                    style: {
                        maxWidth: '480px',
                        width: '90%',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '32px',
                        textAlign: 'center'
                    }
                },
                    h('div', {
                        style: {
                            margin: '0 auto 24px',
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }
                    },
                        h('i', {
                            className: 'fas fa-user-plus',
                            style: {
                                fontSize: '24px',
                                color: '#d97706'
                            }
                        })
                    ),
                    h('h2', {
                        style: {
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '12px'
                        }
                    }, 'Account Registratie Vereist'),
                    h('p', {
                        style: {
                            fontSize: '16px',
                            color: '#6b7280',
                            marginBottom: '24px',
                            lineHeight: '1.5'
                        }
                    }, `Hallo ${currentUser?.Title || 'gebruiker'}! Om het verlofrooster te kunnen gebruiken, moet je eerst je account registreren en instellen.`),
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
                    },
                        h('i', { className: 'fas fa-arrow-right', style: { marginRight: '8px' } }),
                        'Ga naar Registratie'
                    ),
                    h('button', {
                        onClick: checkUserRegistration,
                        style: {
                            width: '100%',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            fontWeight: '500',
                            fontSize: '14px',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        },
                        onMouseEnter: (e) => e.target.style.backgroundColor = '#e5e7eb',
                        onMouseLeave: (e) => e.target.style.backgroundColor = '#f3f4f6'
                    },
                        h('i', { className: 'fas fa-sync-alt', style: { marginRight: '8px' } }),
                        'Opnieuw Controleren'
                    ),
                    currentUser && h('div', {
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
                        }, `Ingelogd als: ${currentUser.LoginName}`)
                    )
                )
            )
        );
    }

    // Loading overlay
    if (isChecking) {
        return h('div', null,
            children,
            h('div', {
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    fontFamily: 'Inter, sans-serif'
                }
            },
                h('div', {
                    style: {
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }
                },
                    h('div', { 
                        className: 'loading-spinner', 
                        style: { margin: '0 auto 16px' } 
                    }),
                    h('h2', {
                        style: {
                            fontSize: '18px',
                            fontWeight: '500',
                            color: '#111827',
                            marginBottom: '8px'
                        }
                    }, 'Gebruiker valideren...'),
                    h('p', {
                        style: {
                            fontSize: '14px',
                            color: '#6b7280'
                        }
                    }, 'Even geduld, we controleren je toegangsrechten.')
                )
            )
        );
    }

    return children;
};