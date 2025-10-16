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
const CompensatieUrenForm = ({ onSubmit, onClose, initialData = {}, medewerkers = [], selection = null }) => {
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
    const [canManageOthers, setCanManageOthers] = useState(false);

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
        const initializeForm = async () => {
            // Check if user can manage events for others
            let userCanManageOthers = false;
            try {
                userCanManageOthers = await canManageOthersEvents();
            } catch (error) {
                console.error('Error checking manage others permission:', error);
            }
            setCanManageOthers(userCanManageOthers);
            console.log('User can manage others events (compensatie):', userCanManageOthers);
            
            const today = toInputDateString(new Date());
            if (Object.keys(initialData).length === 0) {
                // Nieuwe aanvraag
                let targetMedewerker = null;
                
                // If user can manage others and selection contains medewerker data, use that
                if (userCanManageOthers && selection && selection.medewerkerData) {
                    targetMedewerker = selection.medewerkerData;
                    console.log('Using medewerker from selection (privileged user):', targetMedewerker);
                } else {
                    // Otherwise use current user
                    const currentUser = await getCurrentUserInfo();
                    if (currentUser && medewerkers.length > 0) {
                        const loginName = currentUser.LoginName.split('|')[1];
                        targetMedewerker = medewerkers.find(m => m.Username === loginName);
                    }
                }
                
                if (targetMedewerker) {
                    setMedewerkerId(targetMedewerker.Id);
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
                setMedewerkerId(initialData.MedewerkerID || '');
                if (initialData.MedewerkerID) {
                    const medewerker = medewerkers.find(m => m.Id === initialData.MedewerkerID);
                    if (medewerker) setMedewerkerUsername(medewerker.Username);
                }
                const { date: initialStartDate, time: initialStartTime } = splitDateTime(initialData.StartCompensatieUren, '09:00');
                setStartDate(initialStartDate);
                setStartTime(initialStartTime);

                const { date: initialEndDate, time: initialEndTime } = splitDateTime(initialData.EindeCompensatieUren, '17:00');
                setEndDate(initialEndDate);
                setEndTime(initialEndTime);

                const isRuildagValue = initialData.Ruildag || false;
                setIsRuildag(isRuildagValue);
                
                // For ruildag, both start and end should be the same date
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

        h('div', { className: 'form-row' },
            h('div', { className: 'form-groep' },
                h('label', { htmlFor: 'comp-medewerker' }, 'Medewerker'),
                canManageOthers 
                    ? h('select', { 
                        className: 'form-select', 
                        id: 'comp-medewerker', 
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
                        id: 'comp-medewerker', 
                        value: medewerkers.find(m => m.Id === parseInt(medewerkerId, 10))?.Title || 'Laden...', 
                        readOnly: true,
                        title: 'U kunt alleen compensatie-uren doorgeven voor uzelf'
                      })
            ),
            h('div', { className: 'form-groep' },
                h('label', { htmlFor: 'comp-medewerker-id' }, 'Medewerker ID'),
                h('input', { className: 'form-input', type: 'text', id: 'comp-medewerker-id', value: medewerkerUsername, readOnly: true, disabled: true })
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
                h('label', { htmlFor: 'comp-uren-totaal' }, 'Totaal Uren (Max 10)'),
                h('input', { className: 'form-input', type: 'number', id: 'comp-uren-totaal', value: urenTotaal.toFixed(2), readOnly: true, disabled: true })
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