import { getCurrentUserInfo } from '../../services/sharepointService.js';
import { canManageOthersEvents } from '../ContextMenu.js';
import { validateFormSubmission, showCRUDRestrictionMessage } from '../../services/crudPermissionService.js';
import { createSharePointDateTime } from '../../utils/dateTimeUtils.js';

const { createElement: h, useState, useEffect } = React;

// Helper function to find medewerker by current user
const findMedewerkerForCurrentUser = async (currentUser, medewerkers) => {
    if (!currentUser || !medewerkers.length) return null;
    
    console.log('Finding medewerker for current user:', currentUser);
    console.log('Available medewerkers:', medewerkers.map(m => ({ Id: m.Id, Username: m.Username, Title: m.Title })));
    
    // Extract username from LoginName (format: i:0#.w|domain\username)
    let username = currentUser.LoginName;
    console.log('Original LoginName:', username);
    
    if (username.includes('|')) {
        username = username.split('|')[1];
        console.log('After splitting on |:', username);
    }
    
    let domain = '';
    if (username.includes('\\')) {
        [domain, username] = username.split('\\');
        console.log('Domain:', domain, 'Username:', username);
    }
    
    // Try multiple matching strategies
    const strategies = [
        // 1. Exact match with full domain\username
        (m) => m.Username && m.Username.toLowerCase() === `${domain}\\${username}`.toLowerCase(),
        // 2. Exact match with just username
        (m) => m.Username && m.Username.toLowerCase() === username.toLowerCase(),
        // 3. Contains username (case insensitive)
        (m) => m.Username && m.Username.toLowerCase().includes(username.toLowerCase()),
        // 4. Extract username from medewerker Username and match
        (m) => {
            if (!m.Username) return false;
            let mUsername = m.Username;
            if (mUsername.includes('\\')) {
                mUsername = mUsername.split('\\')[1];
            }
            return mUsername && mUsername.toLowerCase() === username.toLowerCase();
        },
        // 5. Match by email if available
        (m) => currentUser.Email && m.Email && m.Email.toLowerCase() === currentUser.Email.toLowerCase(),
        // 6. Match by title/display name
        (m) => currentUser.Title && m.Title && m.Title.toLowerCase() === currentUser.Title.toLowerCase()
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        const found = medewerkers.find(strategy);
        if (found) {
            console.log(`Found medewerker using strategy ${i + 1}:`, found);
            return found;
        }
    }
    
    console.warn('No medewerker found for current user using any strategy');
    return null;
};

const toInputDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const splitDateTime = (dateTimeString, defaultTime = '09:00') => {
    if (!dateTimeString) return { date: '', time: '' };
    
    // Add type checking to prevent "is not a function" errors
    if (typeof dateTimeString !== 'string') {
        console.warn('splitDateTime: Expected string but received:', typeof dateTimeString, dateTimeString);
        return { date: '', time: defaultTime };
    }
    
    if (dateTimeString.includes('T')) {
        const [date, timePart] = dateTimeString.split('T');
        return { date, time: timePart.substring(0, 5) };
    }
    return { date: dateTimeString, time: defaultTime };
};

/**
 * Formulier voor het aanvragen van verlof.
 * @param {object} props
 * @param {function} props.onSubmit - Functie die wordt aangeroepen bij het submitten.
 * @param {function} props.onClose - Functie die wordt aangeroepen bij annuleren.
 * @param {object} [props.initialData={}] - Optionele initiële data voor het formulier.
 * @param {Array<object>} [props.medewerkers=[]] - Lijst van medewerkers.
 * @param {object} [props.selection=null] - Geselecteerde datum/tijd uit de kalender.
 */
const VerlofAanvraagForm = ({ onSubmit, onClose, initialData = {}, medewerkers = [], selection = null }) => {
    const [medewerkerId, setMedewerkerId] = useState('');
    const [medewerkerUsername, setMedewerkerUsername] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [redenId, setRedenId] = useState(2); // Fixed RedenID for Verlof/vakantie
    const [omschrijving, setOmschrijving] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('Nieuw');
    const [canManageOthers, setCanManageOthers] = useState(false);

    useEffect(() => {
        const initializeForm = async () => {
            console.log('VerlofAanvraagForm initializing with:', { initialData, selection, medewerkers: medewerkers.length });
            
            // Check if user can manage events for others
            let userCanManageOthers = false;
            try {
                userCanManageOthers = await canManageOthersEvents();
            } catch (error) {
                console.error('Error checking manage others permission:', error);
            }
            setCanManageOthers(userCanManageOthers);
            console.log('User can manage others events:', userCanManageOthers);
            
            if (Object.keys(initialData).length === 0) {
                // --- Nieuwe aanvraag: Huidige gebruiker en defaults instellen ---
                let targetMedewerker = null;
                
                // If user can manage others and selection contains medewerker data, use that
                if (userCanManageOthers && selection && selection.medewerkerData) {
                    targetMedewerker = selection.medewerkerData;
                    console.log('Using medewerker from selection (privileged user):', targetMedewerker);
                } else {
                    // Otherwise use current user (for regular users or when no selection)
                    const currentUser = await getCurrentUserInfo();
                    console.log('Current user from SharePoint:', currentUser);
                    
                    if (currentUser && medewerkers.length > 0) {
                        targetMedewerker = await findMedewerkerForCurrentUser(currentUser, medewerkers);
                        console.log('Found medewerker for current user:', targetMedewerker);
                        
                        if (!targetMedewerker) {
                            console.warn('No medewerker found for current user');
                        }
                    }
                }
                
                if (targetMedewerker) {
                    setMedewerkerId(targetMedewerker.Id);
                    setMedewerkerUsername(targetMedewerker.Username);
                }
                const today = toInputDateString(new Date());
                if (selection && selection.start) {
                    setStartDate(toInputDateString(selection.start));
                    const endDateValue = selection.end ? toInputDateString(selection.end) : toInputDateString(selection.start);
                    setEndDate(endDateValue);
                } else {
                    setStartDate(today);
                    setEndDate(today);
                }
                setStartTime('09:00');
                setEndTime('17:00');
            } else {
                // --- Bestaande aanvraag: Data uit initialData laden ---
                console.log('Loading existing verlof data:', initialData);
                setMedewerkerId(initialData.MedewerkerID || '');
                if (initialData.MedewerkerID) {
                    // Try to find medewerker by different criteria
                    let medewerker = medewerkers.find(m => m.Id === initialData.MedewerkerID);
                    if (!medewerker) {
                        // Try to find by Username if MedewerkerID is actually a username
                        medewerker = medewerkers.find(m => m.Username === initialData.MedewerkerID);
                    }
                    if (!medewerker) {
                        // Try to find by Title if MedewerkerID matches title
                        medewerker = medewerkers.find(m => m.Title === initialData.MedewerkerID);
                    }
                    
                    console.log('Found medewerker for existing data:', medewerker, 'from MedewerkerID:', initialData.MedewerkerID);
                    
                    if (medewerker) {
                        setMedewerkerId(medewerker.Id);
                        setMedewerkerUsername(medewerker.Username);
                    } else {
                        console.warn('Could not find medewerker for MedewerkerID:', initialData.MedewerkerID);
                        setMedewerkerUsername(initialData.MedewerkerID); // Fallback
                    }
                }

                const { date: initialStartDate, time: initialStartTime } = splitDateTime(initialData.StartDatum, '09:00');
                setStartDate(initialStartDate);
                setStartTime(initialStartTime);

                const { date: initialEndDate, time: initialEndTime } = splitDateTime(initialData.EindDatum, '17:00');
                setEndDate(initialEndDate);
                setEndTime(initialEndTime);

                setOmschrijving(initialData.Omschrijving || '');
                setStatus(initialData.Status || 'Nieuw');
            }
        };

        initializeForm();
    }, [initialData, medewerkers, selection]);

    const handleMedewerkerChange = (e) => {
        const selectedId = e.target.value;
        setMedewerkerId(selectedId);
        const medewerker = medewerkers.find(m => m.Id == selectedId);
        if (medewerker) {
            setMedewerkerUsername(medewerker.Username);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent double submission
        if (isSubmitting) {
            console.log('Form submission already in progress, ignoring...');
            return;
        }
        
        setIsSubmitting(true);
        const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));
        const fullName = selectedMedewerker ? selectedMedewerker.Title : 'Onbekend';
        const currentDate = new Date().toLocaleDateString('nl-NL');

        console.log('VerlofAanvraagForm handleSubmit:', {
            selectedMedewerker,
            medewerkerId,
            medewerkerUsername,
            fullName
        });

        // Validate required fields
        if (!selectedMedewerker) {
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Selecteer een medewerker', 'Validatiefout');
            }
            setIsSubmitting(false);
            return;
        }
        if (!medewerkerUsername) {
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Medewerker username is vereist maar ontbreekt', 'Validatiefout');
            }
            setIsSubmitting(false);
            return;
        }
        if (!startDate || !endDate) {
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Start- en einddatum zijn vereist', 'Validatiefout');
            }
            setIsSubmitting(false);
            return;
        }

        const formData = {
            Title: `Verlofaanvraag - ${fullName} - ${currentDate}`,
            Medewerker: selectedMedewerker.Title,
            MedewerkerID: medewerkerUsername,
            StartDatum: createSharePointDateTime(startDate, startTime),
            EindDatum: createSharePointDateTime(endDate, endTime),
            RedenId: String(redenId), // Convert to string as SharePoint expects Edm.String
            Reden: 'Verlof/vakantie',
            Omschrijving: omschrijving,
            Status: status,
        };
        
        console.log('Final formData for verlof submission:', formData);
        
        // Validate permissions before submission
        try {
            const operation = formData.ID ? 'update' : 'create';
            const validation = await validateFormSubmission(formData, operation);
            
            if (!validation.valid) {
                console.warn('🚫 Form validation failed:', validation.errors);
                showCRUDRestrictionMessage(operation, validation.errors.join(', '));
                setIsSubmitting(false);
                return;
            }
            
            onSubmit(formData);
            // Note: setIsSubmitting(false) is handled by parent component after successful submission
        } catch (error) {
            console.error('❌ Error validating verlof form:', error);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Er is een fout opgetreden bij het valideren van het formulier.', 'Validatiefout');
            }
            setIsSubmitting(false);
        }
    };

    return h('div', { className: 'modal-form-wrapper' },
        h('form', { onSubmit: handleSubmit, className: 'form-container', id: 'verlof-form' },
            h('div', { className: 'form-fields' },
                h('input', { type: 'hidden', name: 'Status', value: status }),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-medewerker' }, 'Medewerker'),
                        canManageOthers 
                            ? h('select', { 
                                className: 'form-select', 
                                id: 'verlof-medewerker', 
                                value: medewerkerId, 
                                onChange: handleMedewerkerChange, 
                                required: true 
                              },
                                h('option', { value: '', disabled: true }, 'Selecteer medewerker'),
                                medewerkers.map(m => h('option', { key: m.Id, value: m.Id }, m.Title))
                              )
                            : h('input', { 
                                className: 'form-input readonly-field', 
                                type: 'text', 
                                id: 'verlof-medewerker', 
                                value: (medewerkers.find(m => m.Id === parseInt(medewerkerId, 10)) || {}).Title || 'Laden...', 
                                readOnly: true,
                                title: 'U kunt alleen verlof aanvragen voor uzelf'
                              })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-medewerker-id' }, 'Medewerker ID'),
                        h('input', { className: 'form-input', type: 'text', id: 'verlof-medewerker-id', value: medewerkerUsername, readOnly: true, disabled: true })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-start-datum' }, 'Startdatum *'),
                        h('input', { className: 'form-input', type: 'date', id: 'verlof-start-datum', value: startDate, onChange: (e) => setStartDate(e.target.value), required: true })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-start-tijd' }, 'Starttijd *'),
                        h('input', { className: 'form-input', type: 'time', id: 'verlof-start-tijd', value: startTime, onChange: (e) => setStartTime(e.target.value), required: true })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-eind-datum' }, 'Einddatum *'),
                        h('input', { className: 'form-input', type: 'date', id: 'verlof-eind-datum', value: endDate, onChange: (e) => setEndDate(e.target.value), required: true, min: startDate })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-eind-tijd' }, 'Eindtijd *'),
                        h('input', { className: 'form-input', type: 'time', id: 'verlof-eind-tijd', value: endTime, onChange: (e) => setEndTime(e.target.value), required: true })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-reden' }, 'Reden'),
                        h('input', { className: 'form-input', id: 'verlof-reden', type: 'text', value: 'Verlof/vakantie', disabled: true })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-reden-id' }, 'Reden ID'),
                        h('input', { className: 'form-input', id: 'verlof-reden-id', type: 'text', value: redenId, disabled: true })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'verlof-omschrijving' }, 'Omschrijving (optioneel)'),
                        h('textarea', { className: 'form-textarea', id: 'verlof-omschrijving', rows: 4, value: omschrijving, onChange: (e) => setOmschrijving(e.target.value), placeholder: 'Eventuele toelichting bij je verlofaanvraag.' })
                    )
                )
            ),

            h('div', { className: 'form-acties' },
                h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Sluiten'),
                h('button', { 
                    type: 'submit', 
                    className: 'btn btn-primary',
                    disabled: isSubmitting
                }, isSubmitting ? 'Bezig met indienen...' : 'Verlofaanvraag Indienen')
            )
        )
    );
};

export default VerlofAanvraagForm;