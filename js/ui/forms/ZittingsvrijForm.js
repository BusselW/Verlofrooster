import { validateFormSubmission, showCRUDRestrictionMessage } from '../../services/crudPermissionService.js';
import { createSharePointDateTime } from '../../utils/dateTimeUtils.js';

const { createElement: h, useState, useEffect, useRef } = React;

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

/**
 * Bereken tijden en afkorting op basis van dagdeel selectie
 */
const getTimesForDagdeel = (dagdeel) => {
    const timeMap = {
        'Hele dag': { start: '08:00', end: '16:00', afkorting: 'ZV' },
        'Ochtend': { start: '08:00', end: '11:59', afkorting: 'ZVO' },
        'Middag': { start: '12:01', end: '16:00', afkorting: 'ZVM' }
    };
    return timeMap[dagdeel] || timeMap['Hele dag'];
};

const splitDateTime = (dateTimeString, defaultTime = '09:00') => {
    if (!dateTimeString) return { date: '', time: '' };
    if (dateTimeString.includes('T')) {
        const [date, timePart] = dateTimeString.split('T');
        return { date, time: timePart.substring(0, 5) };
    }
    // Fallback for date-only strings or other formats
    return { date: dateTimeString, time: defaultTime };
};

/**
 * Formulier voor het registreren van een zittingsvrije dag.
 * @param {object} props
 * @param {function} props.onSubmit - Functie die wordt aangeroepen bij het submitten.
 * @param {function} props.onCancel - Functie die wordt aangeroepen bij annuleren.
 * @param {object} [props.initialData={}] - Optionele initiële data voor het formulier.
 * @param {Array<object>} props.medewerkers - Lijst van medewerkers om uit te kiezen.
 */
const ZittingsvrijForm = ({
    onSubmit,
    onCancel,
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
    const [dagdeel, setDagdeel] = useState('Hele dag');
    const [title, setTitle] = useState(initialData.Title || '');
    const [opmerking, setOpmerking] = useState(initialData.Opmerking || null);
    const [terugkerend, setTerugkerend] = useState(initialData.Terugkerend || false);
    const [terugkerendTot, setTerugkerendTot] = useState('');
    const [terugkeerPatroon, setTerugkeerPatroon] = useState('Wekelijks');
    const [canManageOthers, setCanManageOthers] = useState(Boolean(canManageOthersProp));
    const isInitialized = useRef(false);

    useEffect(() => {
        setCanManageOthers(Boolean(canManageOthersProp));
    }, [canManageOthersProp]);

    useEffect(() => {
        // Only initialize once
        if (isInitialized.current) return;
        
        const initializeForm = () => {
            console.log('ZittingsvrijForm initializing with:', { initialData, selection, medewerkers: medewerkers.length });
            
            const userCanManageOthers = Boolean(canManageOthersProp);
            setCanManageOthers(userCanManageOthers);
            console.log('User can manage others events (zittingsvrij):', userCanManageOthers);
            
            const today = toInputDateString(new Date());
            if (Object.keys(initialData).length === 0) { // Nieuw item
                // 1. Datums instellen - handle both single day and date range selections
                if (selection && selection.start) {
                    const startDateValue = toInputDateString(selection.start);
                    setStartDate(startDateValue);
                    
                    // If there's an end date different from start date, use it, otherwise use start date
                    if (selection.end && selection.end.getTime() !== selection.start.getTime()) {
                        setEndDate(toInputDateString(selection.end));
                    } else {
                        setEndDate(startDateValue);
                    }
                } else {
                    setStartDate(today);
                    setEndDate(today);
                }
                
                // Set default dagdeel and auto-calculate times
                setDagdeel('Hele dag');
                const defaultTimes = getTimesForDagdeel('Hele dag');
                setStartTime(defaultTimes.start);
                setEndTime(defaultTimes.end);

                // 2. Medewerker instellen
                let employeeSet = false;
                
                // If user can manage others and selection contains medewerker data, use that
                if (userCanManageOthers && selection && selection.medewerkerData) {
                    const targetMedewerker = selection.medewerkerData;
                    setMedewerkerId(String(targetMedewerker.Id));
                    setMedewerkerUsername(targetMedewerker.Username);
                    employeeSet = true;
                    console.log('Using medewerker from selection (privileged user):', targetMedewerker);
                }
                // Remove the non-privileged selection logic - users without canManageOthers 
                // should only be able to create events for themselves
                
                if (!employeeSet) {
                    const resolved = resolveCurrentUserMedewerker(
                        currentUser,
                        currentMedewerker,
                        medewerkers,
                        medewerkersByUsername
                    );
                    if (resolved) {
                        setMedewerkerId(String(resolved.Id));
                        setMedewerkerUsername(resolved.Username);
                    }
                }

                // 3. Set default title similar to VerlofAanvraagForm
                let targetMedewerkerForTitle = null;
                if (userCanManageOthers && selection && selection.medewerkerData) {
                    targetMedewerkerForTitle = selection.medewerkerData;
                } else {
                    targetMedewerkerForTitle = resolveCurrentUserMedewerker(
                        currentUser,
                        currentMedewerker,
                        medewerkers,
                        medewerkersByUsername
                    );
                }
                
                if (targetMedewerkerForTitle) {
                    const currentDate = new Date().toLocaleDateString('nl-NL');
                    setTitle(`Zittingsvrij - ${targetMedewerkerForTitle.Title} - ${currentDate}`);
                }
                
                setOpmerking(null);
                setTerugkerend(false);
                setTerugkerendTot(today);
                setTerugkeerPatroon('Wekelijks');

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

                const { date: initialStartDate, time: initialStartTime } = splitDateTime(initialData.ZittingsVrijeDagTijd, '09:00');
                setStartDate(initialStartDate);
                setStartTime(initialStartTime);

                const { date: initialEndDate, time: initialEndTime } = splitDateTime(initialData.ZittingsVrijeDagTijdEind, '17:00');
                setEndDate(initialEndDate);
                setEndTime(initialEndTime);
                
                // Set dagdeel from initialData if available
                setDagdeel(initialData.Dagdeel || 'Hele dag');

                setTitle(initialData.Title || '');
                setOpmerking(initialData.Opmerking || null);
                setTerugkerend(initialData.Terugkerend || false);
                setTerugkerendTot(initialData.TerugkerendTot ? toInputDateString(new Date(initialData.TerugkerendTot)) : today);
                setTerugkeerPatroon(initialData.TerugkeerPatroon || 'Wekelijks');
            }
            
            isInitialized.current = true;
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
    
    const handleDagdeelChange = (e) => {
        const selectedDagdeel = e.target.value;
        setDagdeel(selectedDagdeel);
        
        // Auto-calculate times based on dagdeel
        const times = getTimesForDagdeel(selectedDagdeel);
        setStartTime(times.start);
        setEndTime(times.end);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Extra security check - if user doesn't have management rights, ensure they can only submit for themselves
        if (!canManageOthers) {
            const allowedMedewerker = resolveCurrentUserMedewerker(
                currentUser,
                currentMedewerker,
                medewerkers,
                medewerkersByUsername
            );
            const allowedId = allowedMedewerker ? String(allowedMedewerker.Id) : null;
            const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));

            if (allowedId && String(medewerkerId) !== allowedId) {
                if (window.NotificationSystem) {
                    window.NotificationSystem.error('Je kunt alleen zittingsvrij registreren voor jezelf.', 'Toegang geweigerd');
                }
                return;
            }
            if (!allowedId && selectedMedewerker && selectedMedewerker.Username && currentUser && currentUser.LoginName) {
                const loginName = currentUser.LoginName.includes('|') ? currentUser.LoginName.split('|')[1] : currentUser.LoginName;
                if (selectedMedewerker.Username !== loginName) {
                    if (window.NotificationSystem) {
                        window.NotificationSystem.error('Je kunt alleen zittingsvrij registreren voor jezelf.', 'Toegang geweigerd');
                    }
                    return;
                }
            }
        }

        submitForm();
    };
    
    // Separated form submission logic
    const submitForm = async () => {
    const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));
        const fullName = selectedMedewerker ? selectedMedewerker.Title : 'Onbekend';
        const currentDate = new Date().toLocaleDateString('nl-NL');

        // Use the title from the form, or generate default if empty
        const finalTitle = title && title.trim() ? title : `Zittingsvrij - ${fullName} - ${currentDate}`;
        
        // Get afkorting based on selected dagdeel
        const times = getTimesForDagdeel(dagdeel);

        const formData = {
            Title: finalTitle,
            Medewerker: selectedMedewerker ? selectedMedewerker.Title : null,
            Gebruikersnaam: selectedMedewerker ? selectedMedewerker.Username : medewerkerUsername,
            ZittingsVrijeDagTijd: createSharePointDateTime(startDate, startTime),
            ZittingsVrijeDagTijdEind: createSharePointDateTime(endDate, endTime),
            Dagdeel: dagdeel,
            Afkorting: times.afkorting,
            Opmerking: opmerking,
            Terugkerend: false, // Always false since recurring is hidden
            TerugkerendTot: null,
            TerugkeerPatroon: null,
            // Add a list property to specify which list to use
            _listName: 'IncidenteelZittingVrij'
        };
        
        // Validate permissions before submission
        try {
            const operation = formData.ID ? 'update' : 'create';
            const validation = await validateFormSubmission(formData, operation);
            
            if (!validation.valid) {
                console.warn('🚫 Zittingsvrij form validation failed:', validation.errors);
                showCRUDRestrictionMessage(operation, validation.errors.join(', '));
                return;
            }
            
            onSubmit(formData);
        } catch (error) {
            console.error('❌ Error validating zittingsvrij form:', error);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Er is een fout opgetreden bij het valideren van het formulier.', 'Validatiefout');
            }
        }
    };

    return h('div', { className: 'modal-form-wrapper' },
        h('form', { onSubmit: handleSubmit, className: 'form-container' },
            h('div', { className: 'form-fields' },
                h('input', { type: 'hidden', name: 'MedewerkerUsername', value: medewerkerUsername }),

                // Only show medewerker selector if user can manage others
                canManageOthers && h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep full-width' },
                        h('label', { htmlFor: 'zv-medewerker' }, 'Medewerker'),
                        h('select', {
                            id: 'zv-medewerker',
                            className: 'form-select',
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
                        h('label', { htmlFor: 'zv-start-datum' }, 'Startdatum'),
                        h('input', { type: 'date', id: 'zv-start-datum', className: 'form-input', value: startDate, onChange: (e) => setStartDate(e.target.value), required: true })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-eind-datum' }, 'Einddatum'),
                        h('input', { type: 'date', id: 'zv-eind-datum', className: 'form-input', value: endDate, onChange: (e) => setEndDate(e.target.value), required: true, min: startDate })
                    )
                ),
                
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-dagdeel' }, 'Dagdeel'),
                        h('select', {
                            id: 'zv-dagdeel',
                            className: 'form-select',
                            value: dagdeel,
                            onChange: handleDagdeelChange,
                            required: true
                        },
                            h('option', { value: 'Hele dag' }, 'Hele dag (08:00 - 16:00) - ZV'),
                            h('option', { value: 'Ochtend' }, 'Ochtend (08:00 - 11:59) - ZVO'),
                            h('option', { value: 'Middag' }, 'Middag (12:01 - 16:00) - ZVM')
                        )
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-tijden-preview' }, 'Berekende tijden'),
                        h('input', { 
                            type: 'text', 
                            id: 'zv-tijden-preview', 
                            className: 'form-input readonly-field', 
                            value: `${startTime} - ${endTime} (${getTimesForDagdeel(dagdeel).afkorting})`, 
                            readOnly: true, 
                            disabled: true,
                            title: 'Tijden worden automatisch berekend op basis van het geselecteerde dagdeel'
                        })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-title' }, 'Titel / Reden'),
                        h('input', { 
                            type: 'text', 
                            id: 'zv-title', 
                            className: 'form-input', 
                            value: title, 
                            onChange: (e) => setTitle(e.target.value), 
                            required: true, 
                            placeholder: 'Korte omschrijving, bijv. Cursus' 
                        })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-opmerking' }, 'Opmerking (optioneel)'),
                        h('textarea', { 
                            id: 'zv-opmerking', 
                            className: 'form-textarea', 
                            rows: 3, 
                            value: opmerking || '', 
                            onChange: (e) => setOpmerking(e.target.value), 
                            placeholder: 'Extra details' 
                        })
                    )
                )

        // Terugkerende afspraak section is hidden for now
        // terugkerend && h('div', { className: 'form-row' },
        //     h('div', { className: 'form-groep' },
        //         h('label', { htmlFor: 'zv-terugkerend-tot' }, 'Herhalen tot'),
        //         h('input', { 
        //             type: 'date', 
        //             id: 'zv-terugkerend-tot', 
        //             className: 'form-input', 
        //             value: terugkerendTot, 
        //             onChange: (e) => setTerugkerendTot(e.target.value),
        //             min: startDate,
        //             required: true
        //         })
        //     ),
        //     h('div', { className: 'form-groep' },
        //         h('label', { htmlFor: 'zv-terugkeer-patroon' }, 'Herhaalpatroon'),
        //         h('select', { 
        //             id: 'zv-terugkeer-patroon', 
        //             className: 'form-select', 
        //             value: terugkeerPatroon, 
        //             onChange: (e) => setTerugkeerPatroon(e.target.value),
        //             required: true
        //         },
        //             h('option', { value: 'Wekelijks' }, 'Wekelijks'),
        //             h('option', { value: 'Maandelijks' }, 'Maandelijks')
        //         )
        //     )
        // )
            ),

            h('div', { className: 'form-acties' },
                h('button', { type: 'button', className: 'btn btn-secondary', onClick: onCancel }, 'Annuleren'),
                h('button', { type: 'submit', className: 'btn btn-primary' }, 'Zittingsvrij maken')
            )
        )
    );
};

export default ZittingsvrijForm;
