import { validateFormSubmission, showCRUDRestrictionMessage } from '../../services/crudPermissionService.js';
import { createSharePointDateTime } from '../../utils/dateTimeUtils.js';

const { createElement: h, useState, useEffect } = React;

// Helper function to find medewerker by current user using cached data
const findMedewerkerForCurrentUser = (currentUser, medewerkers, medewerkersByUsername, currentMedewerker) => {
    if (currentMedewerker) {
        return currentMedewerker;
    }
    if (!currentUser || !Array.isArray(medewerkers) || medewerkers.length === 0) {
        return null;
    }

    let username = currentUser.LoginName || '';
    if (username.includes('|')) {
        username = username.split('|')[1];
    }

    const candidates = new Set();
    candidates.add(username.toLowerCase());

    if (username.includes('\\')) {
        const [, shortName] = username.split('\\');
        if (shortName) {
            candidates.add(shortName.toLowerCase());
        }
    }

    if (currentUser.Email) {
        candidates.add(currentUser.Email.toLowerCase());
    }
    if (currentUser.Title) {
        candidates.add(currentUser.Title.toLowerCase());
    }

    if (medewerkersByUsername && typeof medewerkersByUsername.get === 'function') {
        for (const value of candidates) {
            const match = medewerkersByUsername.get(value);
            if (match) {
                return match;
            }
        }
    }

    const fallback = medewerkers.find((m) => {
        if (!m) return false;
        if (m.Username && candidates.has(m.Username.toLowerCase())) {
            return true;
        }
        if (m.Username && m.Username.includes('\\')) {
            const [, shortName] = m.Username.split('\\');
            if (shortName && candidates.has(shortName.toLowerCase())) {
                return true;
            }
        }
        if (currentUser.Email && m.Email && m.Email.toLowerCase() === currentUser.Email.toLowerCase()) {
            return true;
        }
        if (currentUser.Title && m.Title && m.Title.toLowerCase() === currentUser.Title.toLowerCase()) {
            return true;
        }
        return false;
    });

    return fallback || null;
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
const VerlofAanvraagForm = ({
    onSubmit,
    onClose,
    initialData = {},
    medewerkers = [],
    selection = null,
    currentUser = null,
    canManageOthers: canManageOthersProp = false,
    currentMedewerker = null,
    medewerkersById = null,
    medewerkersByUsername = null
}) => {
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
    const [canManageOthers, setCanManageOthers] = useState(Boolean(canManageOthersProp));
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setCanManageOthers(Boolean(canManageOthersProp));
    }, [canManageOthersProp]);

    useEffect(() => {
        // Only initialize once
        if (isInitialized) return;
        
        const initializeForm = () => {
            console.log('VerlofAanvraagForm initializing with:', { initialData, selection, medewerkers: medewerkers.length });
            
            const userCanManageOthers = Boolean(canManageOthersProp);
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
                    targetMedewerker = findMedewerkerForCurrentUser(
                        currentUser,
                        medewerkers,
                        medewerkersByUsername,
                        currentMedewerker
                    );
                    console.log('Resolved medewerker for current user:', targetMedewerker);
                    if (!targetMedewerker) {
                        console.warn('No medewerker found for current user');
                    }
                }
                
                if (targetMedewerker) {
                    setMedewerkerId(String(targetMedewerker.Id));
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
                const resolveExistingMedewerker = (identifier) => {
                    if (!identifier) {
                        return null;
                    }
                    let resolved = null;
                    if (medewerkersById && typeof medewerkersById.get === 'function') {
                        resolved = medewerkersById.get(String(identifier));
                    }
                    if (!resolved && typeof identifier === 'string' && medewerkersByUsername && typeof medewerkersByUsername.get === 'function') {
                        resolved = medewerkersByUsername.get(identifier.toLowerCase());
                    }
                    if (!resolved) {
                        resolved = medewerkers.find((m) => {
                            if (!m) return false;
                            if (String(m.Id) === String(identifier)) return true;
                            if (m.Username && m.Username.toLowerCase() === String(identifier).toLowerCase()) return true;
                            if (m.Title && m.Title.toLowerCase() === String(identifier).toLowerCase()) return true;
                            return false;
                        });
                    }
                    return resolved || null;
                };

                const existingMedewerker = resolveExistingMedewerker(initialData.MedewerkerID);

                if (existingMedewerker) {
                    setMedewerkerId(String(existingMedewerker.Id));
                    setMedewerkerUsername(existingMedewerker.Username);
                    console.log('Resolved medewerker for existing data:', existingMedewerker);
                } else {
                    console.warn('Could not resolve medewerker for MedewerkerID:', initialData.MedewerkerID);
                    setMedewerkerId(initialData.MedewerkerID ? String(initialData.MedewerkerID) : '');
                    setMedewerkerUsername(initialData.MedewerkerID);
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
            setIsInitialized(true);
        };
        initializeForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

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
                h('input', { type: 'hidden', name: 'MedewerkerUsername', value: medewerkerUsername }),

                // Only show medewerker selector if user can manage others
                canManageOthers && h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep full-width' },
                        h('label', { htmlFor: 'verlof-medewerker' }, 'Medewerker'),
                        h('select', { 
                            className: 'form-select', 
                            id: 'verlof-medewerker', 
                            value: medewerkerId, 
                            onChange: handleMedewerkerChange, 
                            required: true 
                          },
                            h('option', { value: '', disabled: true }, 'Selecteer medewerker'),
                            medewerkers.map(m => h('option', { key: m.Id, value: m.Id }, m.Title))
                        )
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

                // Hide reason fields - they're always the same for verlof
                h('input', { type: 'hidden', name: 'RedenId', value: redenId }),
                h('input', { type: 'hidden', name: 'Reden', value: 'Verlof/vakantie' }),

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