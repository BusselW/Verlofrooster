<!DOCTYPE html>
<!--
    Registration Wizard for VerlofroosterREACT
    Following project instructions: .github/instructions/Code.instructions.md
    Pure HTML with React CDN, ES6 modules, and semantic accessibility standards
-->
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registratie - Verlofrooster</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" href="data:," />

    <!-- React Libraries with CDN fallback -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    
    <!-- Fallback to local SharePoint if CDN fails -->
    <script>  
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"><\/script>');
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"><\/script>');
        }
    </script>

    <!-- Configuration -->
    <script src="../../js/config/configLijst.js"></script>

    <!-- Instellingen Styles -->
    <link href="css/instellingencentrum_s.css" rel="stylesheet">
    
    <!-- Minimal registration wizard styles -->
    <style>
        .progress-bar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            position: relative;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .progress-bar::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 10%;
            right: 10%;
            height: 2px;
            background: #e9ecef;
            z-index: 1;
        }
        
        .progress-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            z-index: 2;
            flex: 1;
        }
        
        .step-number {
            width: 50px; /* Increased from 40px */
            height: 50px; /* Increased from 40px */
            border-radius: 50%;
            background: #e9ecef;
            color: #6c757d;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700; /* Increased from 600 */
            font-size: 1.2rem; /* Added explicit size */
            margin-bottom: 10px; /* Increased from 8px */
            transition: all 0.3s ease;
        }
        
        .progress-step.active .step-number {
            background: #007bff;
            color: white;
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3); /* Added shadow for active state */
        }
        
        .progress-step.current .step-number {
            background: #28a745;
            color: white;
            box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3); /* Added shadow for current state */
        }
        
        .step-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
            font-size: 0.95rem; /* Increased from 14px for better readability */
            text-align: center;
        }
        
        .progress-step.active .step-title {
            color: #007bff;
        }
        
        .progress-step.current .step-title {
            color: #28a745;
        }
        
        .step-label {
            font-size: 0.8rem; /* Increased from 12px for better readability */
            color: #6c757d;
            text-align: center;
        }
        
        .navigation-buttons {
            display: flex;
            justify-content: space-between;
            padding: 24px 0; /* Increased from 20px */
            margin-top: 24px; /* Increased from 20px */
            gap: 12px; /* Added gap for mobile */
        }
        
        .btn-group {
            display: flex;
            gap: 12px; /* Increased from 10px */
        }
        
        /* Make navigation buttons more prominent */
        .navigation-buttons .btn {
            min-width: 120px; /* Ensure buttons are large enough */
            justify-content: center;
        }
        
        /* Responsive adjustments for navigation */
        @media (max-width: 640px) {
            .navigation-buttons {
                flex-direction: column;
            }
            
            .btn-group {
                width: 100%;
            }
            
            .navigation-buttons .btn {
                width: 100%;
            }
        }
    </style>
</head>

<body>
    <div id="root"></div>

    <script type="module">
        // Import ErrorBoundary
        import { ErrorBoundary } from '../../js/core/ErrorBoundary.js';
        
        // Import services (adjust paths as needed)
        import { fetchSharePointList, getCurrentUser, getUserInfo, trimLoginNaamPrefix } from '../../js/services/sharepointService.js';
        import { getCurrentUserGroups, isUserInAnyGroup } from '../../js/services/permissionService.js';
        
        // Import tab components
        import { ProfileTab } from './js/componenten/profielTab.js';
        import { WorkHoursTab } from './js/componenten/werktijdenTab.js';
        import { SettingsTab } from './js/componenten/instellingenTab.js';

        // React setup
        const { useState, useEffect, useMemo, useCallback, createElement: h, Fragment } = React;

        // =====================
        // Main Application Component
        // =====================
        const App = () => {
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [user, setUser] = useState(null);
            const [data, setData] = useState({});
            const [debugMode, setDebugMode] = useState(false);

            // Initialize application
            useEffect(() => {
                const initializeApp = async () => {
                    try {
                        setLoading(true);
                        setError(null);

                        // Load current user
                        const currentUser = await getCurrentUser();
                        if (!currentUser) {
                            throw new Error('Kan huidige gebruiker niet laden. Probeer de pagina te vernieuwen.');
                        }
                        setUser(currentUser);

                        // Check if user is in SharePoint admin group for debug mode
                        let isAdmin = false;
                        try {
                            const userGroups = await getCurrentUserGroups();
                            isAdmin = userGroups.some(group => 
                                group.toLowerCase().includes('sharepoint beheer') || 
                                group.toLowerCase().includes('1. sharepoint beheer')
                            );
                            setDebugMode(isAdmin);
                        } catch (groupError) {
                            console.warn('Could not check user groups:', groupError);
                            // Continue anyway - not being able to check groups is not critical
                        }

                        // Users only reach this page if they're not registered
                        // No need to check again - they're here to register!
                    } catch (err) {
                        console.error('Error initializing app:', err);
                        setError(err.message);
                    } finally {
                        setLoading(false);
                    }
                };

                initializeApp();
            }, []);

            // Handle loading state
            if (loading) {
                return h('div', { className: 'loading' },
                    h('div', null,
                        h('div', { className: 'spinner' }),
                        h('p', { className: 'mt-4 text-muted' }, 'Laden...')
                    )
                );
            }

            // Handle error state
            if (error) {
                return h('div', { 
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: '2rem',
                        backgroundColor: '#f9fafb'
                    }
                },
                    h('div', {
                        style: {
                            maxWidth: '600px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            textAlign: 'center'
                        }
                    },
                        h('div', {
                            style: {
                                width: '64px',
                                height: '64px',
                                backgroundColor: '#fee2e2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }
                        },
                            h('i', {
                                className: 'fas fa-exclamation-triangle',
                                style: { fontSize: '24px', color: '#dc2626' }
                            })
                        ),
                        h('h2', {
                            style: {
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '0.75rem'
                            }
                        }, 'Registratie pagina kon niet laden'),
                        h('p', {
                            style: {
                                color: '#6b7280',
                                marginBottom: '1.5rem',
                                lineHeight: '1.6'
                            }
                        }, error),
                        h('button', {
                            onClick: () => window.location.reload(),
                            style: {
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }
                        }, 'Pagina vernieuwen')
                    )
                );
            }

            // Main application render
            return h('div', null,
                h(Header, { user, debugMode }),
                h('div', { className: 'container' },
                    h(MainContent, { user, data })
                )
            );
        };

        // =====================
        // Header Component
        // =====================
        const Header = ({ user, debugMode }) => {
            return h('div', { className: 'header' },
                h('div', { className: 'container' },
                    h('h1', null, 'Account registratie'),
                    h('p', null, `Welkom ${user?.Title || 'nieuwe gebruiker'}! Stel je account in voor het verlofrooster.`),
                    debugMode && h('div', {
                        style: {
                            marginTop: '10px',
                            padding: '8px 12px',
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500'
                        }
                    }, 
                        h('i', { className: 'fas fa-tools', style: { marginRight: '8px' } }),
                        'DEBUG MODE: SharePoint beheer gebruiker - registratie controle omzeild'
                    )
                )
            );
        };

        // =====================
        // Main Content Component
        // =====================
        const MainContent = ({ user, data }) => {
            const [currentStep, setCurrentStep] = useState(1);
            const [registrationData, setRegistrationData] = useState({
                profile: {},
                workHours: {},
                preferences: {}
            });
            const [isCompleted, setIsCompleted] = useState(false);
            const [errors, setErrors] = useState({});
            const [isSubmitting, setIsSubmitting] = useState(false);

            const steps = [
                { id: 1, title: 'Profiel', description: 'Persoonlijke gegevens' },
                { id: 2, title: 'Werktijden', description: 'Werk schema instellingen' },
                { id: 3, title: 'Voorkeuren', description: 'App instellingen' }
            ];

            const handleNext = async () => {
                setErrors({});
                if (currentStep < 3) {
                    setCurrentStep(currentStep + 1);
                }
            };

            const [stepSaveTrigger, setStepSaveTrigger] = useState(0);

            const handleStepSave = async () => {
                // For steps 1 and 2 (profile and work hours), trigger save
                if (currentStep === 1 || currentStep === 2) {
                    setStepSaveTrigger(prev => prev + 1);
                } else {
                    // For step 3 (settings), just advance without saving
                    // (User can configure these later via settings, or they're already auto-saved)
                    if (currentStep < 3) {
                        setCurrentStep(currentStep + 1);
                    } else {
                        // Step 3 - complete registration
                        handleFinish();
                    }
                }
            };

            const getCurrentStepData = () => {
                switch (currentStep) {
                    case 1: return registrationData.profile;
                    case 2: return registrationData.workHours;
                    case 3: return registrationData.preferences;
                    default: return {};
                }
            };

            const handlePrevious = () => {
                if (currentStep > 1) {
                    setCurrentStep(currentStep - 1);
                }
            };

            const handleFinish = async () => {
                try {
                    setIsSubmitting(true);
                    setErrors({});
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Immediately redirect to the main app instead of showing completion screen
                    window.location.href = '../../verlofRooster.aspx';
                    
                } catch (error) {
                    console.error('Registration failed:', error);
                    setErrors({ general: 'Registratie mislukt. Probeer het opnieuw.' });
                    setIsSubmitting(false);
                }
            };

            const updateRegistrationData = (stepKey, data) => {
                setRegistrationData(prev => ({
                    ...prev,
                    [stepKey]: { ...prev[stepKey], ...data }
                }));
            };

            // Since we redirect immediately, no need for completion screen
            // if (isCompleted) { ... }

            return h('div', null,
                // Progress bar
                h('div', { className: 'progress-bar' },
                    ...steps.map(step =>
                        h('div', {
                            key: step.id,
                            className: `progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`
                        },
                            h('div', { className: 'step-number' }, step.id),
                            h('div', { className: 'step-title' }, step.title),
                            h('div', { className: 'step-label' }, step.description)
                        )
                    )
                ),
                
                // Step content - using same structure as original tabs
                h(StepContent, { 
                    currentStep, 
                    user, 
                    data, 
                    updateRegistrationData,
                    onStepSave: handleStepSave,
                    stepSaveTrigger,
                    onSaveComplete: (success) => {
                        if (success) {
                            if (currentStep < 3) {
                                // Move to next step instead of redirecting immediately
                                setCurrentStep(currentStep + 1);
                            } else {
                                // Only redirect after completing all steps or when user finishes
                                
                                // Show success message briefly before redirect
                                const successDiv = document.createElement('div');
                                successDiv.style.cssText = `
                                    position: fixed;
                                    top: 20px;
                                    right: 20px;
                                    background: #d4edda;
                                    color: #155724;
                                    padding: 16px 20px;
                                    border-radius: 8px;
                                    border: 1px solid #c3e6cb;
                                    z-index: 10000;
                                    font-family: Inter, sans-serif;
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                `;
                                successDiv.textContent = 'Registratie voltooid! Doorverwijzen naar de app...';
                                document.body.appendChild(successDiv);
                                
                                setTimeout(() => {
                                    window.location.href = '../../verlofRooster.aspx';
                                }, 1500);
                            }
                        }
                    }
                }),
                
                // Navigation buttons
                h('div', { className: 'navigation-buttons' },
                    h('div', null,
                        currentStep > 1 && h('button', {
                            className: 'btn btn-secondary',
                            onClick: handlePrevious,
                            disabled: isSubmitting
                        }, 'Vorige')
                    ),
                    h('div', { className: 'btn-group' },
                        // Save/Next button for steps 1 and 2, Finish button for step 3
                        currentStep === 1 && h('button', {
                            className: 'btn btn-primary',
                            onClick: handleStepSave,
                            disabled: isSubmitting
                        }, 'Opslaan & Volgende'),
                        
                        currentStep === 2 && h('button', {
                            className: 'btn btn-primary',
                            onClick: handleStepSave,
                            disabled: isSubmitting
                        }, 'Opslaan & Volgende'),
                        
                        currentStep === 3 && h('button', {
                            className: 'btn btn-success',
                            onClick: handleFinish,
                            disabled: isSubmitting
                        }, isSubmitting ? 'Bezig met registreren...' : 'Registratie voltooien')
                    )
                )
            );
        };

        // =====================
        // Step Content Component
        // =====================
        const StepContent = ({ currentStep, user, data, updateRegistrationData, onStepSave, stepSaveTrigger, onSaveComplete }) => {
            const handleProfileUpdate = (profileData) => {
                updateRegistrationData('profile', profileData);
            };

            const handleWorkHoursUpdate = (workHoursData) => {
                updateRegistrationData('workHours', workHoursData);
            };

            const handlePreferencesUpdate = (preferencesData) => {
                updateRegistrationData('preferences', preferencesData);
            };

            switch (currentStep) {
                case 1:
                    return h(ProfileTab, { 
                        user, 
                        data,
                        isRegistration: true,
                        onDataUpdate: handleProfileUpdate,
                        onSave: onStepSave,
                        stepSaveTrigger,
                        onSaveComplete
                    });
                case 2:
                    return h(WorkHoursTab, { 
                        user, 
                        data,
                        isRegistration: true,
                        onDataUpdate: handleWorkHoursUpdate,
                        onSave: onStepSave,
                        stepSaveTrigger,
                        onSaveComplete
                    });
                case 3:
                    return h(SettingsTab, { 
                        user, 
                        data,
                        isRegistration: true,
                        onDataUpdate: handlePreferencesUpdate,
                        onSave: onStepSave,
                        stepSaveTrigger,
                        onSaveComplete
                    });
                default:
                    return h('div', null,
                        h('p', null, 'Ongeldige stap')
                    );
            }
        };

        // =====================
        // Application Initialization
        // =====================
        const initializeApplication = () => {
            const container = document.getElementById('root');
            if (container) {
                const root = ReactDOM.createRoot(container);
                root.render(
                    h(ErrorBoundary, null,
                        h(App)
                    )
                );
                console.log('Registration application initialized successfully');
            } else {
                console.error('Root container not found');
            }
        };

        // Start the application
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApplication);
        } else {
            initializeApplication();
        }

    </script>
</body>

</html>