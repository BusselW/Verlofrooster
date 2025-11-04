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
 * Formulier voor het registreren van compensatie-uren.
 * @param {object} props
 * @param {function} props.onSubmit - Functie die wordt aangeroepen bij het submitten.
 * @param {function} props.onClose - Functie die wordt aangeroepen bij annuleren.
 * @param {object} [props.initialData={}] - Optionele initiële data voor het formulier.
 * @param {Array<object>} [props.medewerkers=[]] - Lijst van medewerkers.
 * @param {object} [props.selection=null] - Geselecteerde datum/tijd uit de kalender.
 */
const CompensatieUrenForm = ({
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
    const [isRuildag, setIsRuildag] = useState(false);
    const [ruildagStart, setRuildagStart] = useState('');
    const [ruildagEinde, setRuildagEinde] = useState('');
    const [omschrijving, setOmschrijving] = useState('');
    const [status, setStatus] = useState('Ingediend');
    const [urenTotaal, setUrenTotaal] = useState(0);
    const [canManageOthers, setCanManageOthers] = useState(Boolean(canManageOthersProp));

    useEffect(() => {
        setCanManageOthers(Boolean(canManageOthersProp));
    }, [canManageOthersProp]);

    // Effect for calculating total hours
    useEffect(() => {
        if (startDate && startTime && endDate && endTime) {
            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${endDate}T${endTime}`);
            if (endDateTime > startDateTime) {
                const diffMillis = endDateTime - startDateTime;
                const diffHours = diffMillis / (1000 * 60 * 60);
                setUrenTotaal(Math.min(diffHours, 10)); // Cap at 10 hours
            } else {
                setUrenTotaal(0);
            }
        }
    }, [startDate, startTime, endDate, endTime]);

    useEffect(() => {
        const initializeForm = () => {
            const userCanManageOthers = Boolean(canManageOthersProp);
            setCanManageOthers(userCanManageOthers);
            console.log('User can manage others events (compensatie):', userCanManageOthers);

            const today = toInputDateString(new Date());
            if (Object.keys(initialData).length === 0) {
                // Nieuwe aanvraag
                let targetMedewerker = null;

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
                if (selection && selection.start) {
                    const selectedDate = toInputDateString(selection.start);
                    setStartDate(selectedDate);
                    setEndDate(selectedDate); // End date is always same as start date
                } else {
                    setStartDate(today);
                    setEndDate(today); // End date is always same as start date
                }
                setStartTime('09:00');
                setEndTime('17:00');
                setIsRuildag(false);
                setRuildagStart(today);
                setRuildagEinde(today);
                setStatus('Ingediend');
            } else {
                // Bestaande aanvraag
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

                const { date: initialStartDate, time: initialStartTime } = splitDateTime(initialData.StartCompensatieUren, '09:00');
                setStartDate(initialStartDate);
                setStartTime(initialStartTime);

                const { date: initialEndDate, time: initialEndTime } = splitDateTime(initialData.EindeCompensatieUren, '17:00');
                setEndDate(initialEndDate);
                setEndTime(initialEndTime);

                const isRuildagValue = initialData.Ruildag || false;
                setIsRuildag(isRuildagValue);

                if (isRuildagValue && initialData.ruildagStart) {
                    const ruildagDate = toInputDateString(new Date(initialData.ruildagStart));
                    setRuildagStart(ruildagDate);
                    setRuildagEinde(ruildagDate);
                } else {
                    setRuildagStart(today);
                    setRuildagEinde(today);
                }

                setOmschrijving(initialData.Omschrijving || '');
                setStatus(initialData.Status || 'Ingediend');
            }
        };
        initializeForm();
    }, [
        initialData,
        medewerkers,
        selection,
        currentUser,
        canManageOthersProp,
        currentMedewerker,
        medewerkersById,
        medewerkersByUsername
    ]);

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

        const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));
        const fullName = selectedMedewerker ? selectedMedewerker.Title : 'Onbekend';
        const username = selectedMedewerker ? selectedMedewerker.Username : '';
        const currentDate = new Date().toLocaleDateString('nl-NL');

        // Create properly formatted datetime strings for SharePoint submission
        // This ensures consistent timezone handling and prevents date shifts
        const startDateTimeString = createSharePointDateTime(startDate, startTime);
        const endDateTimeString = createSharePointDateTime(endDate, endTime);
        const ruildagStartString = isRuildag && ruildagStart ? createSharePointDateTime(ruildagStart, '09:00') : null;
        const ruildagEindeString = isRuildag && ruildagEinde ? createSharePointDateTime(ruildagEinde, '17:00') : null;

        const formData = {
            Title: `Compensatie-uren - ${fullName} - ${currentDate}`,
            Medewerker: fullName,
            MedewerkerID: username,
            StartCompensatieUren: startDateTimeString,
            EindeCompensatieUren: endDateTimeString,
            Ruildag: isRuildag,
            ruildagStart: ruildagStartString,
            ruildagEinde: ruildagEindeString,
            Omschrijving: omschrijving,
            Status: status,
            UrenTotaal: String(urenTotaal) // Convert to string as SharePoint expects Edm.String
        };
        
        // Validate permissions before submission
        try {
            const operation = formData.ID ? 'update' : 'create';
            const validation = await validateFormSubmission(formData, operation);
            
            if (!validation.valid) {
                console.warn('🚫 Compensatie form validation failed:', validation.errors);
                showCRUDRestrictionMessage(operation, validation.errors.join(', '));
                return;
            }
            
            onSubmit(formData);
        } catch (error) {
            console.error('❌ Error validating compensatie form:', error);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Er is een fout opgetreden bij het valideren van het formulier.', 'Validatiefout');
            }
        }
    };

    return h('form', { onSubmit: handleSubmit, className: 'form-container' },
        h('input', { type: 'hidden', name: 'status', value: status }),
        h('input', { type: 'hidden', name: 'MedewerkerUsername', value: medewerkerUsername }),

        // Only show medewerker selector if user can manage others
        canManageOthers && h('div', { className: 'form-row' },
            h('div', { className: 'form-groep full-width' },
                h('label', { htmlFor: 'comp-medewerker' }, 'Medewerker'),
                h('select', { 
                    className: 'form-select', 
                    id: 'comp-medewerker', 
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
                h('label', { htmlFor: 'comp-werk-datum' }, 'Datum gewerkt *'),
                h('input', { className: 'form-input', type: 'date', id: 'comp-werk-datum', value: startDate, onChange: (e) => {
                    setStartDate(e.target.value);
                    setEndDate(e.target.value); // End date is always the same as start date
                }, required: true })
            ),
            h('div', { className: 'form-groep' },
                h('label', { htmlFor: 'comp-start-tijd' }, 'Starttijd *'),
                h('input', { className: 'form-input', type: 'time', id: 'comp-start-tijd', value: startTime, onChange: (e) => setStartTime(e.target.value), required: true })
            )
        ),

        h('div', { className: 'form-row' },
            h('div', { className: 'form-groep' },
                h('label', { htmlFor: 'comp-eind-tijd' }, 'Eindtijd *'),
                h('input', { className: 'form-input', type: 'time', id: 'comp-eind-tijd', value: endTime, onChange: (e) => setEndTime(e.target.value), required: true })
            ),
            h('div', { className: 'form-groep' },
                h('label', { htmlFor: 'comp-uren-totaal' }, 
                    h('span', null, 'Totaal: ', 
                        h('strong', { style: { color: urenTotaal > 0 ? '#10b981' : '#6b7280' } }, `${urenTotaal.toFixed(1)} uur`)
                    )
                ),
                h('input', { type: 'hidden', id: 'comp-uren-totaal', value: urenTotaal })
            )
        ),

        h('div', { className: 'form-row' },
            h('div', { className: 'form-groep form-check' },
                h('input', { type: 'checkbox', id: 'comp-ruildag', checked: isRuildag, onChange: (e) => setIsRuildag(e.target.checked) }),
                h('label', { htmlFor: 'comp-ruildag' }, 'Dit is een ruildag (ik ruil uren met een andere dag)')
            )
        ),

        isRuildag && h('div', { className: 'form-row' },
            h('div', { className: 'form-groep' },
                h('label', { htmlFor: 'comp-ruildag-datum' }, 'Datum waarop ik uren heb geruild *'),
                h('input', { className: 'form-input', type: 'date', id: 'comp-ruildag-datum', value: ruildagStart, onChange: (e) => {
                    setRuildagStart(e.target.value);
                    setRuildagEinde(e.target.value); // Use same date for both start and end of ruildag
                }, required: isRuildag })
            ),
            h('div', { className: 'form-groep' },
                h('div', { className: 'help-text' }, 'Geef aan op welke dag u deze uren heeft geruild.')
            )
        ),

        h('div', { className: 'form-row' },
            h('div', { className: 'form-groep' },
                h('label', { htmlFor: 'comp-omschrijving' }, 'Omschrijving'),
                h('textarea', { className: 'form-textarea', id: 'comp-omschrijving', rows: 3, value: omschrijving, onChange: (e) => setOmschrijving(e.target.value), placeholder: 'Reden voor compensatie-uren of toelichting bij ruildag' })
            )
        ),

        h('div', { className: 'form-acties' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Annuleren'),
            h('button', { type: 'submit', className: 'btn btn-primary' }, 'Opslaan')
        )
    );
};

export default CompensatieUrenForm;