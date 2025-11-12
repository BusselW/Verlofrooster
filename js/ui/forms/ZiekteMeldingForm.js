import { validateFormSubmission, showCRUDRestrictionMessage } from '../../services/crudPermissionService.js';
import { createSharePointDateTime } from '../../utils/dateTimeUtils.js';

const { createElement: h, useState, useEffect } = React;

const resolveCurrentUserMedewerker = (currentUser, currentMedewerker, medewerkers, medewerkersByUsername) => {
    if (currentMedewerker) {
        return currentMedewerker;
    }
    if (!currentUser || !Array.isArray(medewerkers) || medewerkers.length === 0) {
        return null;
    }

    let loginName = currentUser.LoginName || '';
    if (loginName.includes('|')) {
        loginName = loginName.split('|')[1];
    }

    const candidates = new Set();
    if (loginName) {
        candidates.add(loginName.toLowerCase());
    }

    if (loginName.includes('\\')) {
        const [, short] = loginName.split('\\');
        if (short) {
            candidates.add(short.toLowerCase());
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

    return medewerkers.find((m) => {
        if (!m) return false;
        if (m.Username && candidates.has(m.Username.toLowerCase())) {
            return true;
        }
        if (m.Username && m.Username.includes('\\')) {
            const [, short] = m.Username.split('\\');
            if (short && candidates.has(short.toLowerCase())) {
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
    }) || null;
};

const resolveExistingMedewerker = (identifier, medewerkers, medewerkersById, medewerkersByUsername) => {
    if (!identifier) {
        return null;
    }

    if (medewerkersById && typeof medewerkersById.get === 'function') {
        const byId = medewerkersById.get(String(identifier));
        if (byId) {
            return byId;
        }
    }

    if (typeof identifier === 'string' && medewerkersByUsername && typeof medewerkersByUsername.get === 'function') {
        const byUsername = medewerkersByUsername.get(identifier.toLowerCase());
        if (byUsername) {
            return byUsername;
        }
    }

    return medewerkers.find((m) => {
        if (!m) return false;
        if (String(m.Id) === String(identifier)) {
            return true;
        }
        if (m.Username && m.Username.toLowerCase() === String(identifier).toLowerCase()) {
            return true;
        }
        if (m.Title && m.Title.toLowerCase() === String(identifier).toLowerCase()) {
            return true;
        }
        return false;
    }) || null;
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
 * Formulier voor het melden van ziekte.
 * @param {object} props
 * @param {function} props.onSubmit - Functie die wordt aangeroepen bij het submitten.
 * @param {function} props.onClose - Functie die wordt aangeroepen bij annuleren.
 * @param {object} [props.shiftTypes={}] - Object met beschikbare verlofredenen (shift types).
 * @param {object} [props.initialData={}] - Optionele initiële data voor het formulier.
 * @param {Array<object>} [props.medewerkers=[]] - Lijst van medewerkers.
 * @param {object} [props.selection=null] - Geselecteerde datum/tijd uit de kalender.
 */
const ZiekteMeldingForm = ({
    onSubmit,
    onClose,
    shiftTypes = {},
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
    const [omschrijving, setOmschrijving] = useState('');
    const [status, setStatus] = useState('Nieuw');
    const [redenId, setRedenId] = useState(1); // Fixed RedenID for Ziekte
    const [canManageOthers, setCanManageOthers] = useState(Boolean(canManageOthersProp));
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setCanManageOthers(Boolean(canManageOthersProp));
    }, [canManageOthersProp]);

    useEffect(() => {
        if (isInitialized) return;
        
        const initializeForm = () => {
            const userCanManageOthers = Boolean(canManageOthersProp);
            setCanManageOthers(userCanManageOthers);
            console.log('User can manage others events (ziekte):', userCanManageOthers);

            if (Object.keys(initialData).length === 0) {
                // Nieuwe ziekmelding: Huidige gebruiker en defaults instellen
                let targetMedewerker = null;
                
                // If user can manage others and selection contains medewerker data, use that
                if (userCanManageOthers && selection && selection.medewerkerData) {
                    targetMedewerker = selection.medewerkerData;
                    console.log('Using medewerker from selection (privileged user):', targetMedewerker);
                } else {
                    targetMedewerker = resolveCurrentUserMedewerker(
                        currentUser,
                        currentMedewerker,
                        medewerkers,
                        medewerkersByUsername
                    );
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
                // Bestaande ziekmelding: Data uit initialData laden
                const resolved = resolveExistingMedewerker(
                    initialData.MedewerkerID,
                    medewerkers,
                    medewerkersById,
                    medewerkersByUsername
                );

                if (resolved) {
                    setMedewerkerId(String(resolved.Id));
                    setMedewerkerUsername(resolved.Username);
                } else {
                    const fallbackId = initialData.MedewerkerID ? String(initialData.MedewerkerID) : '';
                    setMedewerkerId(fallbackId);
                    setMedewerkerUsername(fallbackId);
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
        
        // Extra security check - if user doesn't have management rights, ensure they can only submit for themselves
        if (!canManageOthers) {
            const allowedMedewerker = resolveCurrentUserMedewerker(
                currentUser,
                currentMedewerker,
                medewerkers,
                medewerkersByUsername
            );
            const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));
            const allowedId = allowedMedewerker ? String(allowedMedewerker.Id) : null;

            if (allowedId && String(medewerkerId) !== allowedId) {
                if (window.NotificationSystem) {
                    window.NotificationSystem.error('Je kunt alleen ziekte melden voor jezelf.', 'Toegang geweigerd');
                }
                return;
            }
            if (!allowedId && selectedMedewerker && selectedMedewerker.Username && currentUser && currentUser.LoginName) {
                const loginName = currentUser.LoginName.includes('|') ? currentUser.LoginName.split('|')[1] : currentUser.LoginName;
                if (selectedMedewerker.Username !== loginName) {
                    if (window.NotificationSystem) {
                        window.NotificationSystem.error('Je kunt alleen ziekte melden voor jezelf.', 'Toegang geweigerd');
                    }
                    return;
                }
            }
        }

        const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));
        const fullName = selectedMedewerker ? selectedMedewerker.Title : 'Onbekend';
        const username = selectedMedewerker ? selectedMedewerker.Username : '';
        const currentDate = new Date().toLocaleDateString('nl-NL');

        const formData = {
            Title: `Ziekmelding - ${fullName} - ${currentDate}`,
            Medewerker: fullName,
            MedewerkerID: username,
            StartDatum: createSharePointDateTime(startDate, startTime),
            EindDatum: createSharePointDateTime(endDate, endTime),
            Omschrijving: omschrijving,
            Status: status,
            RedenId: String(redenId), // Convert to string as SharePoint expects Edm.String
			Reden: 'Ziekte'
        };
        
        // Validate permissions before submission
        try {
            const operation = initialData.ID ? 'update' : 'create';
            const validation = await validateFormSubmission(formData, operation);
            
            if (!validation.valid) {
                console.warn('🚫 Ziekmelding form validation failed:', validation.errors);
                showCRUDRestrictionMessage(operation, validation.errors.join(', '));
                return;
            }
            
            onSubmit(formData);
        } catch (error) {
            console.error('❌ Error validating ziekmelding form:', error);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Er is een fout opgetreden bij het valideren van je ziekmelding.', 'Validatiefout');
            }
        }
    };

    return h('div', { className: 'modal-form-wrapper' },
        h('form', { onSubmit: handleSubmit, className: 'form-container' },
            h('div', { className: 'form-fields' },
                h('input', { type: 'hidden', name: 'Status', value: status }),
                h('input', { type: 'hidden', name: 'MedewerkerUsername', value: medewerkerUsername }),

                // Only show medewerker selector if user can manage others
                canManageOthers && h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep full-width' },
                        h('label', { htmlFor: 'ziekte-medewerker' }, 'Medewerker'),
                        h('select', { 
                            className: 'form-select', 
                            id: 'ziekte-medewerker', 
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
                        h('label', { htmlFor: 'ziekte-start-datum' }, 'Eerste ziektedag *'),
                        h('input', { className: 'form-input', type: 'date', id: 'ziekte-start-datum', value: startDate, onChange: (e) => setStartDate(e.target.value), required: true })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'ziekte-start-tijd' }, 'Starttijd *'),
                        h('input', { className: 'form-input', type: 'time', id: 'ziekte-start-tijd', value: startTime, onChange: (e) => setStartTime(e.target.value), required: true })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'ziekte-eind-datum' }, 'Laatste ziektedag (optioneel)'),
                        h('input', { className: 'form-input', type: 'date', id: 'ziekte-eind-datum', value: endDate, onChange: (e) => setEndDate(e.target.value), min: startDate })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'ziekte-eind-tijd' }, 'Eindtijd'),
                        h('input', { className: 'form-input', type: 'time', id: 'ziekte-eind-tijd', value: endTime, onChange: (e) => setEndTime(e.target.value) })
                    )
                ),

                // Hide reason fields - they're always the same for ziekte
                h('input', { type: 'hidden', name: 'RedenId', value: redenId }),
                h('input', { type: 'hidden', name: 'Reden', value: 'Ziekte' }),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'ziekte-omschrijving' }, 'Omschrijving (optioneel)'),
                        h('textarea', { className: 'form-textarea', id: 'ziekte-omschrijving', rows: 4, value: omschrijving, onChange: (e) => setOmschrijving(e.target.value), placeholder: 'Eventuele toelichting bij je ziekmelding.' })
                    )
                )
            ),

            h('div', { className: 'form-acties' },
                h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Sluiten'),
                h('button', { type: 'submit', className: 'btn btn-primary' }, 'Ziekmelding Indienen')
            )
        )
    );
};

export default ZiekteMeldingForm;