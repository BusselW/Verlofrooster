
import { getCurrentUserInfo } from '../../services/sharepointService.js';
import { canManageOthersEvents } from '../ContextMenu.js';
import { validateFormSubmission, showCRUDRestrictionMessage } from '../../services/crudPermissionService.js';
import { createSharePointDateTime } from '../../utils/dateTimeUtils.js';

const { createElement: h, useState, useEffect } = React;

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
const ZittingsvrijForm = ({ onSubmit, onCancel, initialData = {}, medewerkers = [], selection = null }) => {
    const [medewerkerId, setMedewerkerId] = useState('');
    const [medewerkerUsername, setMedewerkerUsername] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [title, setTitle] = useState(initialData.Title || '');
    const [opmerking, setOpmerking] = useState(initialData.Opmerking || null);
    const [terugkerend, setTerugkerend] = useState(initialData.Terugkerend || false);
    const [terugkerendTot, setTerugkerendTot] = useState('');
    const [terugkeerPatroon, setTerugkeerPatroon] = useState('Wekelijks');
    const [canManageOthers, setCanManageOthers] = useState(false);

    useEffect(() => {
        const initializeForm = async () => {
            console.log('ZittingsvrijForm initializing with:', { initialData, selection, medewerkers: medewerkers.length });
            
            // Check if user can manage events for others
            let userCanManageOthers = false;
            try {
                userCanManageOthers = await canManageOthersEvents();
            } catch (error) {
                console.error('Error checking manage others permission:', error);
            }
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
                setStartTime('09:00');
                setEndTime('17:00');

                // 2. Medewerker instellen
                let employeeSet = false;
                
                // If user can manage others and selection contains medewerker data, use that
                if (userCanManageOthers && selection && selection.medewerkerData) {
                    const targetMedewerker = selection.medewerkerData;
                    setMedewerkerId(targetMedewerker.Id);
                    setMedewerkerUsername(targetMedewerker.Username);
                    employeeSet = true;
                    console.log('Using medewerker from selection (privileged user):', targetMedewerker);
                }
                // Remove the non-privileged selection logic - users without canManageOthers 
                // should only be able to create events for themselves
                
                if (!employeeSet) {
                    // Always default to current user
                    const currentUser = await getCurrentUserInfo();
                    if (currentUser && medewerkers.length > 0) {
                        const loginName = currentUser.LoginName.split('|')[1];
                        const medewerker = medewerkers.find(m => m.Username === loginName);
                        if (medewerker) {
                            setMedewerkerId(medewerker.Id);
                            setMedewerkerUsername(medewerker.Username);
                        }
                    }
                }

                // 3. Set default title similar to VerlofAanvraagForm
                let targetMedewerkerForTitle = null;
                if (userCanManageOthers && selection && selection.medewerkerData) {
                    targetMedewerkerForTitle = selection.medewerkerData;
                } else {
                    const currentUser = await getCurrentUserInfo();
                    if (currentUser && medewerkers.length > 0) {
                        const loginName = currentUser.LoginName.split('|')[1];
                        targetMedewerkerForTitle = medewerkers.find(m => m.Username === loginName);
                    }
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
                setMedewerkerId(initialData.MedewerkerID || '');
                if (initialData.MedewerkerID) {
                    const medewerker = medewerkers.find(m => m.Id === initialData.MedewerkerID);
                    if (medewerker) setMedewerkerUsername(medewerker.Username);
                }

                const { date: initialStartDate, time: initialStartTime } = splitDateTime(initialData.ZittingsVrijeDagTijd, '09:00');
                setStartDate(initialStartDate);
                setStartTime(initialStartTime);

                const { date: initialEndDate, time: initialEndTime } = splitDateTime(initialData.ZittingsVrijeDagTijdEind, '17:00');
                setEndDate(initialEndDate);
                setEndTime(initialEndTime);

                setTitle(initialData.Title || '');
                setOpmerking(initialData.Opmerking || null);
                setTerugkerend(initialData.Terugkerend || false);
                setTerugkerendTot(initialData.TerugkerendTot ? toInputDateString(new Date(initialData.TerugkerendTot)) : today);
                setTerugkeerPatroon(initialData.TerugkeerPatroon || 'Wekelijks');
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Extra security check - if user doesn't have management rights, ensure they can only submit for themselves
        if (!canManageOthers) {
            // Get current user
            const currentUser = getCurrentUserInfo();
            currentUser.then(user => {
                if (user) {
                    const loginName = user.LoginName.split('|')[1];
                    const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));
                    
                    // If not submitting for self, show error and return
                    if (selectedMedewerker && selectedMedewerker.Username !== loginName) {
                        if (window.NotificationSystem) {
                            window.NotificationSystem.error('Je kunt alleen zittingsvrij registreren voor jezelf.', 'Toegang geweigerd');
                        }
                        return;
                    }
                    
                    // Continue with form submission for own events
                    submitForm();
                }
            }).catch(error => {
                console.error('Error checking current user for zittingsvrij:', error);
                if (window.NotificationSystem) {
                    window.NotificationSystem.error('Er is een fout opgetreden bij het controleren van je gebruikersrechten.', 'Fout');
                }
            });
        } else {
            // User has management rights, proceed normally
            submitForm();
        }
    };
    
    // Separated form submission logic
    const submitForm = async () => {
        const selectedMedewerker = medewerkers.find(m => m.Id === parseInt(medewerkerId, 10));
        const fullName = selectedMedewerker ? selectedMedewerker.Title : 'Onbekend';
        const currentDate = new Date().toLocaleDateString('nl-NL');

        // Use the title from the form, or generate default if empty
        const finalTitle = title && title.trim() ? title : `Zittingsvrij - ${fullName} - ${currentDate}`;

        const formData = {
            Title: finalTitle,
            Medewerker: selectedMedewerker ? selectedMedewerker.Title : null,
            Gebruikersnaam: medewerkerUsername,
            ZittingsVrijeDagTijd: createSharePointDateTime(startDate, startTime),
            ZittingsVrijeDagTijdEind: createSharePointDateTime(endDate, endTime),
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
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-medewerker' }, 'Medewerker'),
                        canManageOthers 
                            ? h('select', {
                                id: 'zv-medewerker',
                                className: 'form-select',
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
                                id: 'zv-medewerker', 
                                value: medewerkers.find(m => m.Id === parseInt(medewerkerId, 10))?.Title || 'Laden...', 
                                readOnly: true,
                                title: 'U kunt alleen zittingsvrij maken voor uzelf'
                              })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-medewerker-id' }, 'Medewerker ID'),
                        h('input', { className: 'form-input', type: 'text', id: 'zv-medewerker-id', value: medewerkerUsername, readOnly: true, disabled: true })
                    )
                ),

                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-start-datum' }, 'Startdatum'),
                        h('input', { type: 'date', id: 'zv-start-datum', className: 'form-input', value: startDate, onChange: (e) => setStartDate(e.target.value), required: true })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-start-tijd' }, 'Starttijd'),
                        h('input', { type: 'time', id: 'zv-start-tijd', className: 'form-input', value: startTime, onChange: (e) => setStartTime(e.target.value), required: true })
                    )
                ),
                
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-eind-datum' }, 'Einddatum'),
                        h('input', { type: 'date', id: 'zv-eind-datum', className: 'form-input', value: endDate, onChange: (e) => setEndDate(e.target.value), required: true, min: startDate })
                    ),
                    h('div', { className: 'form-groep' },
                        h('label', { htmlFor: 'zv-eind-tijd' }, 'Eindtijd'),
                        h('input', { type: 'time', id: 'zv-eind-tijd', className: 'form-input', value: endTime, onChange: (e) => setEndTime(e.target.value), required: true })
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
