/**
 * @file werktijdenTab.js
 * @description Work Hours Tab Component for Settings Page
 */

import { 
    fetchSharePointList, 
    createSharePointListItem, 
    updateSharePointListItem,
    getCurrentUserInfo 
} from '../../../../js/services/sharepointService.js';
import { 
    maakItem, 
    leesItems, 
    bewerkItem 
} from '../../../../js/services/sharepointCRUD.js';
import {
    DAY_TYPES,
    DAY_TYPE_LABELS,
    DEFAULT_DAY_TYPE_COLORS,
    determineWorkDayType,
    getWorkDayTypeDisplay,
    calculateHoursWorked,
    getDayTypeStyle,
    validateTimeRange,
    generateWorkScheduleData,
    DEFAULT_WORK_HOURS,
    WORK_DAYS
} from './DagIndicators.js';

// Helper function to trim SharePoint login name prefix (i:0;w:org\busselw -> org\busselw)
const trimLoginNaamPrefix = (loginNaam) => {
    if (!loginNaam || typeof loginNaam !== 'string') return loginNaam;
    
    // Handle SharePoint format: i:0#.w|domain\username or i:0;w:domain\username
    if (loginNaam.includes('|')) {
        const parts = loginNaam.split('|');
        return parts.length > 1 ? parts[parts.length - 1] : loginNaam;
    }
    
    // Handle colon format: i:0;w:domain\username
    if (loginNaam.includes(':')) {
        const colonParts = loginNaam.split(':');
        const lastPart = colonParts[colonParts.length - 1];
        return lastPart;
    }
    
    // Fallback: just return as-is if no special format detected
    return loginNaam;
};

const { useState, createElement: h } = React;

// =====================
// Work Hours Tab Component
// =====================
export const WorkHoursTab = ({ user, data, isRegistration = false, onDataUpdate, stepSaveTrigger, onSaveComplete }) => {
    // State management
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true); // New loading state for data fetching
    const [feedback, setFeedback] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [scheduleType, setScheduleType] = useState('fixed'); // 'fixed' or 'rotating'
    const [activeWeek, setActiveWeek] = useState('A');
    const [workHours, setWorkHours] = useState(DEFAULT_WORK_HOURS);
    const [workHoursB, setWorkHoursB] = useState({
        monday: { start: '10:00', end: '18:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
        tuesday: { start: '10:00', end: '18:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
        wednesday: { start: '10:00', end: '18:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
        thursday: { start: '10:00', end: '18:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
        friday: { start: '--:--', end: '--:--', hours: 0, type: DAY_TYPES.VVD, isFreeDag: true }
    });
    const [bulkTimes, setBulkTimes] = useState({ start: '09:00', end: '17:00' });
    const [ingangsdatum, setIngangsdatum] = useState(new Date().toISOString().split('T')[0]);
    const [cycleStartDate, setCycleStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [hasExistingData, setHasExistingData] = useState(false); // Track if existing data was loaded

    // Load user data
    React.useEffect(() => {
        loadUserInfo();
    }, []);

    // Handle save trigger from parent (registration wizard)
    React.useEffect(() => {
        if (isRegistration && stepSaveTrigger > 0) {
            console.log('Save triggered from registration wizard for WorkHoursTab');
            // In registration mode, don't auto-save - let user manually save
            // Only call handleSave if it's explicitly triggered
        }
    }, [stepSaveTrigger]);

    const loadUserInfo = async () => {
        try {
            setIsLoadingData(true);
            setFeedback(null);
            
            const user = await getCurrentUserInfo();
            // Trim the login name prefix to get just "org\busselw" instead of "i:0;w:org\busselw"
            if (user && user.LoginName) {
                user.LoginName = trimLoginNaamPrefix(user.LoginName);
            }
            setUserInfo(user);
            
            // Load existing work hours from SharePoint UrenPerWeek list
            if (user && user.LoginName) {
                await loadExistingWorkHours(user.LoginName);
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            setFeedback({ 
                type: 'error', 
                message: 'Fout bij laden van gebruikersgegevens. Probeer de pagina te vernieuwen.' 
            });
        } finally {
            setIsLoadingData(false);
        }
    };

    // Load existing work hours from UrenPerWeek SharePoint list
    const loadExistingWorkHours = async (userLoginName) => {
        try {
            console.log('Loading existing work hours for user:', userLoginName);
            
            // Fetch all UrenPerWeek records for the current user
            const urenPerWeekItems = await fetchSharePointList('UrenPerWeek');
            
            // Filter records for current user
            const userRecords = urenPerWeekItems.filter(item => 
                item.MedewerkerID === userLoginName
            );
            
            console.log(`Found ${userRecords.length} existing work hour records for user`);
            
            if (userRecords.length === 0) {
                console.log('No existing work hours found, using defaults');
                setHasExistingData(false);
                setFeedback({ 
                    type: 'info', 
                    message: 'Geen bestaande werktijden gevonden. Je kunt nu je eerste rooster instellen.' 
                });
                return;
            }
            
            // Sort by Ingangsdatum to get the most recent record(s)
            userRecords.sort((a, b) => new Date(b.Ingangsdatum) - new Date(a.Ingangsdatum));
            
            // Check if the most recent records are rotating (2 records with same Ingangsdatum)
            const mostRecentDate = userRecords[0].Ingangsdatum;
            const mostRecentRecords = userRecords.filter(record => 
                record.Ingangsdatum === mostRecentDate
            );
            
            console.log(`Most recent records (${mostRecentDate}):`, mostRecentRecords);
            
            // Determine if this is a rotating schedule
            const isRotating = mostRecentRecords.length === 2 && 
                              mostRecentRecords.some(r => r.IsRotatingSchedule === true);
            
            setHasExistingData(true);
            
            if (isRotating) {
                console.log('Loading rotating schedule data');
                setScheduleType('rotating');
                
                // Find Week A and Week B records
                const weekARecord = mostRecentRecords.find(r => r.WeekType === 'A');
                const weekBRecord = mostRecentRecords.find(r => r.WeekType === 'B');
                
                if (weekARecord) {
                    const weekAHours = parseWorkHoursFromRecord(weekARecord);
                    setWorkHours(weekAHours);
                    console.log('Loaded Week A hours:', weekAHours);
                }
                
                if (weekBRecord) {
                    const weekBHours = parseWorkHoursFromRecord(weekBRecord);
                    setWorkHoursB(weekBHours);
                    console.log('Loaded Week B hours:', weekBHours);
                }
                
                // Set cycle start date if available
                if (weekARecord?.CycleStartDate) {
                    setCycleStartDate(new Date(weekARecord.CycleStartDate).toISOString().split('T')[0]);
                }
                
                setFeedback({ 
                    type: 'success', 
                    message: `Je bestaande roulerende rooster is geladen (geldig vanaf ${new Date(mostRecentDate).toLocaleDateString('nl-NL')}).` 
                });
                
            } else {
                console.log('Loading fixed schedule data');
                setScheduleType('fixed');
                
                // Use the most recent single record
                const fixedRecord = mostRecentRecords[0];
                const fixedHours = parseWorkHoursFromRecord(fixedRecord);
                setWorkHours(fixedHours);
                console.log('Loaded fixed schedule hours:', fixedHours);
                
                setFeedback({ 
                    type: 'success', 
                    message: `Je bestaande vaste rooster is geladen (geldig vanaf ${new Date(mostRecentDate).toLocaleDateString('nl-NL')}).` 
                });
            }
            
            // Set ingangsdatum from the most recent record
            if (mostRecentRecords[0]?.Ingangsdatum) {
                setIngangsdatum(new Date(mostRecentRecords[0].Ingangsdatum).toISOString().split('T')[0]);
            }
            
        } catch (error) {
            console.error('Error loading existing work hours:', error);
            setFeedback({ 
                type: 'error', 
                message: 'Fout bij laden van bestaande werktijden. Je kunt toch een nieuw rooster instellen.' 
            });
        }
    };

    // Parse SharePoint record into work hours format
    const parseWorkHoursFromRecord = (record) => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const dayMappings = {
            monday: 'Maandag',
            tuesday: 'Dinsdag', 
            wednesday: 'Woensdag',
            thursday: 'Donderdag',
            friday: 'Vrijdag'
        };
        
        const workHours = {};
        
        days.forEach(day => {
            const dayPrefix = dayMappings[day];
            const startTime = record[`${dayPrefix}Start`] || '--:--';
            const endTime = record[`${dayPrefix}Eind`] || '--:--';
            const dayType = record[`${dayPrefix}Soort`] || DAY_TYPES.NORMAAL;
            
            // Calculate hours
            const hours = startTime === '--:--' || endTime === '--:--' ? 
                0 : calculateHoursWorked(startTime, endTime);
            
            // Determine if it's a free day (VVD)
            const isFreeDag = dayType === DAY_TYPES.VVD || 
                            (startTime === '--:--' && endTime === '--:--');
            
            workHours[day] = {
                start: startTime,
                end: endTime,
                hours: hours,
                type: dayType,
                isFreeDag: isFreeDag
            };
        });
        
        return workHours;
    };

    const handleSave = async () => {
        setIsLoading(true);
        setFeedback(null);
        
        try {
            if (scheduleType === 'rotating') {
                // ROTATING SCHEDULE: Save 2 records (Week A and Week B)
                console.log('Saving rotating schedule - creating 2 records with proper WeekType');
                console.log('🔄 Rotation parameters:', {
                    scheduleType: scheduleType,
                    ingangsdatum: ingangsdatum,
                    cycleStartDate: cycleStartDate,
                    userId: userInfo?.LoginName
                });
                
                // Week A data
                const weekAData = generateWorkScheduleData(workHours, {
                    weekType: 'A',
                    isRotating: true,
                    userId: userInfo?.LoginName,
                    ingangsdatum,
                    cycleStartDate
                });
                
                // Week B data  
                const weekBData = generateWorkScheduleData(workHoursB, {
                    weekType: 'B',
                    isRotating: true,
                    userId: userInfo?.LoginName,
                    ingangsdatum,
                    cycleStartDate
                });
                
                // Add descriptive titles to distinguish between weeks
                weekAData.Title = `${userInfo?.Title || userInfo?.LoginName} - Week A (${new Date(ingangsdatum).toLocaleDateString('nl-NL')})`;
                weekBData.Title = `${userInfo?.Title || userInfo?.LoginName} - Week B (${new Date(ingangsdatum).toLocaleDateString('nl-NL')})`;
                
                console.log('✅ Week A data generated:', weekAData);
                console.log('✅ Week B data generated:', weekBData);
                
                // Save both weeks
                const [weekAResult, weekBResult] = await Promise.all([
                    createSharePointListItem('UrenPerWeek', weekAData),
                    createSharePointListItem('UrenPerWeek', weekBData)
                ]);
                
                console.log('Week A saved with ID:', weekAResult?.ID || weekAResult?.Id);
                console.log('Week B saved with ID:', weekBResult?.ID || weekBResult?.Id);
                
                setFeedback({ type: 'success', message: 'Roterend werkrooster (Week A & B) succesvol opgeslagen!' });
            } else {
                // FIXED SCHEDULE: Save 1 record
                console.log('Saving fixed schedule - creating 1 record');
                
                const scheduleData = generateWorkScheduleData(workHours, {
                    weekType: null,           // WeekType = null for fixed schedules
                    isRotating: false,        // IsRotatingSchedule = false
                    userId: userInfo?.LoginName,
                    ingangsdatum,
                    cycleStartDate: null      // CycleStartDate = null for fixed schedules
                });
                
                // Add a descriptive title
                scheduleData.Title = `${userInfo?.Title || userInfo?.LoginName} - Vast Rooster (${new Date(ingangsdatum).toLocaleDateString('nl-NL')})`;
                
                console.log('Fixed schedule data:', scheduleData);
                
                const result = await createSharePointListItem('UrenPerWeek', scheduleData);
                
                console.log('Fixed schedule saved with ID:', result?.ID || result?.Id);
                
                setFeedback({ type: 'success', message: 'Werkrooster succesvol opgeslagen!' });
                
                // Call onSaveComplete callback if provided (for registration wizard)
                if (onSaveComplete) {
                    onSaveComplete(true);
                }
            }
        } catch (error) {
            console.error('Error saving work hours:', error);
            setFeedback({ 
                type: 'error', 
                message: `Fout bij opslaan van werktijden: ${error.message || 'Onbekende fout'}` 
            });
            
            // Call onSaveComplete with error if provided (for registration wizard)
            if (onSaveComplete) {
                onSaveComplete(false);
            }
        } finally {
            setIsLoading(false);
            // Clear feedback after 8 seconds (longer for rotation message)
            setTimeout(() => setFeedback(null), 8000);
        }
    };

    const days = WORK_DAYS;

    const getCurrentWeekHours = () => {
        const currentHours = scheduleType === 'rotating' && activeWeek === 'B' ? workHoursB : workHours;
        return days.reduce((total, day) => total + currentHours[day.key].hours, 0);
    };

    const handleTimeChange = (day, field, value) => {
        const currentWeekData = scheduleType === 'rotating' && activeWeek === 'B' ? workHoursB : workHours;
        const setCurrentWeekData = scheduleType === 'rotating' && activeWeek === 'B' ? setWorkHoursB : setWorkHours;
        
        setCurrentWeekData(prev => {
            const updated = { ...prev };
            updated[day] = { ...updated[day], [field]: value };
            
            // Recalculate hours and type if start or end time changed
            if (field === 'start' || field === 'end') {
                const newStart = field === 'start' ? value : updated[day].start;
                const newEnd = field === 'end' ? value : updated[day].end;
                
                // Calculate hours
                updated[day].hours = calculateHoursWorked(newStart, newEnd);
                
                // Determine day type using the new logic
                updated[day].type = determineWorkDayType(newStart, newEnd, updated[day].isFreeDag);
            } else if (field === 'isFreeDag') {
                // Update day type when free day status changes
                updated[day].type = determineWorkDayType(
                    updated[day].start, 
                    updated[day].end, 
                    value
                );
                
                // If marking as free day, clear the times and set hours to 0
                if (value) {
                    updated[day].start = '--:--';
                    updated[day].end = '--:--';
                    updated[day].hours = 0;
                } else if (updated[day].start === '--:--' || updated[day].end === '--:--') {
                    // If unmarking free day but times are still --:--, set default times
                    updated[day].start = '09:00';
                    updated[day].end = '17:00';
                    updated[day].hours = calculateHoursWorked('09:00', '17:00');
                    updated[day].type = determineWorkDayType('09:00', '17:00', false);
                }
            }
            
            return updated;
        });
    };

    const handleBulkTimeSet = () => {
        const currentWeekData = scheduleType === 'rotating' && activeWeek === 'B' ? workHoursB : workHours;
        const setCurrentWeekData = scheduleType === 'rotating' && activeWeek === 'B' ? setWorkHoursB : setWorkHours;
        
        setCurrentWeekData(prev => {
            const updated = { ...prev };
            days.forEach(day => {
                if (!updated[day.key].isFreeDag) {
                    updated[day.key].start = bulkTimes.start;
                    updated[day.key].end = bulkTimes.end;
                    updated[day.key].hours = calculateHoursWorked(bulkTimes.start, bulkTimes.end);
                    updated[day.key].type = determineWorkDayType(bulkTimes.start, bulkTimes.end, false);
                }
            });
            return updated;
        });
    };

    return h('div', { className: 'work-hours-tab' },
        // Loading indicator while fetching data
        isLoadingData && h('div', { 
            style: { 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '40px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px'
            } 
        },
            h('div', { 
                style: { 
                    textAlign: 'center' 
                } 
            },
                h('div', { 
                    className: 'loading-spinner', 
                    style: { 
                        width: '40px', 
                        height: '40px', 
                        border: '4px solid #e3e3e3', 
                        borderTop: '4px solid #007bff', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    } 
                }),
                h('p', { 
                    style: { 
                        color: '#6c757d', 
                        margin: '0',
                        fontSize: '14px'
                    } 
                }, 'Je bestaande werktijden worden geladen...')
            )
        ),

        // Main content (only show when not loading)
        !isLoadingData && [
        // Schedule Type Selection Card (now includes the main header)
        h('div', { className: 'card', key: 'schedule-card' },
            h('h3', { className: 'card-title' }, 
                h('svg', { 
                    width: '24', 
                    height: '24', 
                    fill: 'currentColor', 
                    viewBox: '0 0 20 20',
                    style: { marginRight: '0.5rem' }
                }, 
                    h('path', { 
                        fillRule: 'evenodd', 
                        d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z', 
                        clipRule: 'evenodd' 
                    })
                ),
                'Mijn Werkroosters',
                // Small indicator when existing data is loaded
                hasExistingData && h('span', { 
                    style: { 
                        marginLeft: '10px',
                        fontSize: '12px',
                        color: '#28a745',
                        fontWeight: '500',
                        background: '#d4edda',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        border: '1px solid #c3e6cb'
                    } 
                }, '✓ Bestaande gegevens geladen')
            ),
            h('p', { className: 'text-muted mb-3' }, 
                'Stel hier je standaard werktijden in. Dit bepaalt hoe je werkdagen in het rooster worden weergegeven.'
            ),
            // Dynamic tooltip based on schedule type
            h('div', { className: 'info-box', style: { 
                background: scheduleType === 'fixed' ? '#f8f9fa' : '#fff3cd', 
                border: scheduleType === 'fixed' ? '1px solid #e9ecef' : '1px solid #ffeeba', 
                borderRadius: '6px', 
                padding: '15px', 
                marginBottom: '20px' 
            } },
                h('h4', { style: { margin: '0 0 10px 0', color: '#495057', fontSize: '14px' } },                        scheduleType === 'fixed' ? '📅 Vast Werkschema Actief' : '🔄 Roulerend Werkschema Actief'
                ),
                h('ul', { style: { margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#6c757d' } },
                    scheduleType === 'fixed' ? [
                        h('li', { key: 1 }, 'Je hebt een vast rooster gekozen - elke week zijn je uren hetzelfde'),
                        h('li', { key: 2 }, 'Stel voor elke werkdag je begin- en eindtijden in'),
                        h('li', { key: 3 }, 'Markeer vrije dagen met het VVD vakje'),
                        h('li', { key: 4 }, 'Het systeem berekent automatisch je werkdagtype en totaal uren per week')
                    ] : [
                        h('li', { key: 1 }, 'Je hebt een roulerend rooster gekozen - Week 1 en Week 2 wisselen af'),
                        h('li', { key: 2 }, 'Stel voor beide weken (1 en 2) je werktijden in'),
                        h('li', { key: 3 }, 'Kies de startdatum van je Week 1 cyclus'),
                        h('li', { key: 4 }, 'Test eerst je rooster in de playground voordat je het opslaat')
                    ]
                )
            ),
            h('div', { className: 'day-types-info', style: { 
                background: '#e8f4fd', 
                border: '1px solid #bee5eb', 
                borderRadius: '6px', 
                padding: '15px', 
                marginBottom: '20px' 
            } },
                h('h4', { style: { margin: '0 0 10px 0', color: '#0c5460', fontSize: '14px' } }, 
                    '🏷️ Werkdag types die automatisch worden bepaald:'
                ),
                h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px', fontSize: '12px' } },
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        h('span', { 
                            style: { 
                                background: '#27ae60', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '10px',
                                fontWeight: 'bold'
                            } 
                        }, 'Normaal'),
                        h('span', { style: { color: '#495057' } }, 'Volledige werkdag (start 07:00-10:00, eind 15:00-19:00)')
                    ),
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        h('span', { 
                            style: { 
                                background: '#3498db', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '10px',
                                fontWeight: 'bold'
                            } 
                        }, 'VVO'),
                        h('span', { style: { color: '#495057' } }, 'Vaste Vrije Ochtend (start 12:00+, geen ochtendwerk)')
                    ),
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        h('span', { 
                            style: { 
                                background: '#f39c12', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '10px',
                                fontWeight: 'bold'
                            } 
                        }, 'VVM'),
                        h('span', { style: { color: '#495057' } }, 'Vaste Vrije Middag (start <13:00, eind <13:00)')
                    ),
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        h('span', { 
                            style: { 
                                background: '#e74c3c', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '10px',
                                fontWeight: 'bold'
                            } 
                        }, 'VVD'),
                        h('span', { style: { color: '#495057' } }, 'Vaste Vrije Dag (checkbox aangevinkt)')
                    )
                ),
                h('p', { style: { margin: '10px 0 0 0', fontSize: '11px', color: '#6c757d', fontStyle: 'italic' } },
                    'Het type wordt automatisch bepaald op basis van je tijden en of je de dag als vrij markeert.'
                )
            ),
            
            // Date inputs
            h('div', { className: 'form-row', style: { marginTop: '1.5rem' } },
                h('div', { className: 'form-group' },
                    h('label', { className: 'form-label' }, 
                        'Vanaf welke datum gelden deze werktijden?'
                    ),
                    h('input', {
                        type: 'date',
                        className: 'form-input',
                        value: ingangsdatum,
                        onChange: (e) => setIngangsdatum(e.target.value)
                    }),
                    h('small', { className: 'text-muted' }, 
                        'Selecteer de datum vanaf wanneer dit rooster van kracht wordt. Meestal is dit vandaag of de eerstvolgende maandag.'
                    )
                ),
                scheduleType === 'rotating' && h('div', { className: 'form-group' },
                    h('label', { className: 'form-label' }, 
                        'Op welke datum begint Week 1 van je cyclus?'
                    ),
                    h('input', {
                        type: 'date',
                        className: 'form-input',
                        value: cycleStartDate,
                        onChange: (e) => setCycleStartDate(e.target.value)
                    }),
                    h('small', { className: 'text-muted' }, 
                        'Dit bepaalt welke week "Week 1" is en welke "Week 2". Kies bijvoorbeeld de maandag van een week die Week 1 moet worden. Het systeem wisselt daarna automatisch elke week tussen 1 en 2.'
                    )
                )
            )
        ),

        // Week selector for rotating schedules
        scheduleType === 'rotating' && h('div', { className: 'card' },
            h('h3', { className: 'card-title' }, 
                'Welke week wilt u instellen?'
            ),
            h('p', { className: 'text-muted mb-3' }, 
                'U kunt verschillende werktijden instellen voor Week 1 en Week 2. Klik hieronder op de week die u wilt bewerken.'
            ),
            h('div', { className: 'week-selector' },
                h('button', {
                    className: `btn ${activeWeek === 'A' ? 'btn-primary' : 'btn-secondary'}`,
                    onClick: () => setActiveWeek('A')
                }, 
                    h('span', null, '📋 Week 1'),
                    activeWeek === 'A' && h('small', { style: { display: 'block', fontSize: '11px' } }, '(nu aan het bewerken)')
                ),
                h('button', {
                    className: `btn ${activeWeek === 'B' ? 'btn-primary' : 'btn-secondary'}`,
                    onClick: () => setActiveWeek('B')
                }, 
                    h('span', null, '📋 Week 2'),
                    activeWeek === 'B' && h('small', { style: { display: 'block', fontSize: '11px' } }, '(nu aan het bewerken)')
                )
            )
        ),

        // Detailed Schedule Card (now includes bulk operations)
        h('div', { className: 'card' },
            h('div', { className: 'card-header-with-actions' },
                h('h3', { className: 'card-title' }, 
                    scheduleType === 'rotating' ? 
                        `Werktijden voor Week ${activeWeek === 'A' ? '1' : '2'}` : 
                        'Mijn Werktijden'
                ),
                
                // Schedule Type Toggle Slider - moved here
                h('div', { 
                    className: 'schedule-type-toggle-container',
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '1rem',
                        marginBottom: '1rem'
                    }
                },
                    h('label', { 
                        className: 'form-label',
                        style: { margin: 0, fontSize: '0.9rem', fontWeight: '600' }
                    }, 'Rooster type:'),
                    h('div', { 
                        className: 'toggle-slider-container',
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            fontSize: '0.85rem'
                        }
                    },
                        h('span', { 
                            style: { 
                                fontWeight: scheduleType === 'fixed' ? '600' : '400',
                                color: scheduleType === 'fixed' ? '#1e3a8a' : '#64748b',
                                transition: 'all 0.2s ease'
                            } 
                        }, 'Vast'),
                        h('label', { 
                            className: 'toggle-switch',
                            style: {
                                position: 'relative',
                                display: 'inline-block',
                                width: '60px',
                                height: '28px',
                                cursor: 'pointer'
                            }
                        },
                            h('input', {
                                type: 'checkbox',
                                checked: scheduleType === 'rotating',
                                onChange: (e) => setScheduleType(e.target.checked ? 'rotating' : 'fixed'),
                                style: {
                                    opacity: 0,
                                    width: 0,
                                    height: 0
                                }
                            }),
                            h('span', { 
                                className: 'toggle-slider',
                                style: {
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: scheduleType === 'rotating' ? '#10b981' : '#e5e7eb',
                                    transition: 'all 0.3s ease',
                                    borderRadius: '28px',
                                    '&:before': {
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: scheduleType === 'rotating' ? '35px' : '3px',
                                        bottom: '3px',
                                        backgroundColor: 'white',
                                        transition: 'all 0.3s ease',
                                        borderRadius: '50%',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }
                                }
                            },
                                h('span', {
                                    style: {
                                        position: 'absolute',
                                        content: '""',
                                        height: '22px',
                                        width: '22px',
                                        left: scheduleType === 'rotating' ? '35px' : '3px',
                                        bottom: '3px',
                                        backgroundColor: 'white',
                                        transition: 'all 0.3s ease',
                                        borderRadius: '50%',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }
                                })
                            )
                        ),
                        h('span', { 
                            style: { 
                                fontWeight: scheduleType === 'rotating' ? '600' : '400',
                                color: scheduleType === 'rotating' ? '#1e3a8a' : '#64748b',
                                transition: 'all 0.2s ease'
                            } 
                        }, 'Roulerend')
                    ),
                    h('small', { 
                        className: 'text-muted',
                        style: { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            maxWidth: '300px'
                        }
                    }, 
                        scheduleType === 'fixed' 
                            ? 'Elke week dezelfde werktijden' 
                            : 'Week 1 en Week 2 wisselen af'
                    )
                ),
                // Integrated bulk time setter - centered
                h('div', { 
                    className: 'bulk-time-setter',
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem',
                        textAlign: 'center'
                    }
                },
                    h('label', { className: 'form-label' }, 
                        'Snelle instelling voor alle werkdagen:'
                    ),
                    h('div', { className: 'bulk-time-inputs' },
                        h('input', {
                            type: 'time',
                            className: 'form-input',
                            value: bulkTimes.start,
                            onChange: (e) => setBulkTimes(prev => ({ ...prev, start: e.target.value })),
                            title: 'Starttijd voor alle dagen'
                        }),
                        h('span', { className: 'time-separator' }, 'tot'),
                        h('input', {
                            type: 'time',
                            className: 'form-input',
                            value: bulkTimes.end,
                            onChange: (e) => setBulkTimes(prev => ({ ...prev, end: e.target.value })),
                            title: 'Eindtijd voor alle dagen'
                        }),
                        h('button', {
                            className: 'btn btn-secondary',
                            onClick: handleBulkTimeSet,
                            title: 'Pas deze tijden toe op alle werkdagen (vrije dagen blijven ongewijzigd)'
                        }, 'Toepassen op alle dagen')
                    ),
                    h('small', { className: 'text-muted' }, 
                        'Handig als je meestal dezelfde tijden werkt. Vrije dagen worden niet overschreven.'
                    )
                )
            ),
            
            h('div', { className: 'schedule-table-container' },
                h('table', { className: 'schedule-table' },
                    h('thead', null,
                        h('tr', null,
                            h('th', null, 'Weekdag'),
                            h('th', null, 'Begin'),
                            h('th', null, 'Einde'),
                            h('th', null, 'Totaal'),
                            h('th', null, 'Werkdag type'),
                            h('th', null, 'Vrij/Thuis')
                        )
                    ),
                    h('tbody', null,
                        ...days.map(day => {
                            const currentHours = scheduleType === 'rotating' && activeWeek === 'B' ? workHoursB : workHours;
                            const dayData = currentHours[day.key];
                            
                            return h('tr', { key: day.key, className: dayData.isFreeDag ? 'free-day-row' : '' },
                                h('td', { className: 'day-cell' },
                                    h('strong', null, day.label)
                                ),
                                h('td', null,
                                    h('input', {
                                        type: 'time',
                                        className: 'form-input time-input',
                                        value: dayData.start,
                                        onChange: (e) => handleTimeChange(day.key, 'start', e.target.value),
                                        disabled: dayData.isFreeDag
                                    })
                                ),
                                h('td', null,
                                    h('input', {
                                        type: 'time',
                                        className: 'form-input time-input',
                                        value: dayData.end,
                                        onChange: (e) => handleTimeChange(day.key, 'end', e.target.value),
                                        disabled: dayData.isFreeDag
                                    })
                                ),
                                h('td', { className: 'hours-cell' },
                                    h('span', { className: 'hours-badge' }, `${dayData.hours}h`)
                                ),
                                h('td', null,
                                    h('span', { 
                                        className: 'day-type-badge',
                                        style: getDayTypeStyle(dayData.type),
                                        title: getWorkDayTypeDisplay(dayData.type)
                                    }, dayData.type)
                                ),
                                h('td', null,
                                    h('input', {
                                        type: 'checkbox',
                                        checked: dayData.isFreeDag,
                                        onChange: (e) => handleTimeChange(day.key, 'isFreeDag', e.target.checked),
                                        className: 'setting-checkbox'
                                    })
                                )
                            );
                        })
                    )
                )
            )
        ),

        // Save Button
        h('div', { 
            className: 'save-section', 
            style: { 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                marginTop: '20px'
            } 
        },
            feedback && h('div', { 
                className: `feedback-message ${feedback.type}`,
                style: { 
                    alignSelf: 'flex-start',
                    marginBottom: '10px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: feedback.type === 'success' ? '#d4edda' : 
                                    feedback.type === 'error' ? '#f8d7da' : 
                                    feedback.type === 'info' ? '#d1ecf1' : '#f8d7da',
                    color: feedback.type === 'success' ? '#155724' : 
                           feedback.type === 'error' ? '#721c24' : 
                           feedback.type === 'info' ? '#0c5460' : '#721c24',
                    border: feedback.type === 'success' ? '1px solid #c3e6cb' : 
                            feedback.type === 'error' ? '1px solid #f5c6cb' : 
                            feedback.type === 'info' ? '1px solid #bee5eb' : '1px solid #f5c6cb'
                }
            }, feedback.message),
            // Show save button in both modes - settings always, registration optionally
            h('button', {
                className: 'btn btn-primary save-btn',
                onClick: handleSave,
                disabled: isLoading || !userInfo,
                style: { 
                    fontSize: '16px', 
                    padding: '12px 24px',
                    marginBottom: isRegistration ? '10px' : '0'
                }
            }, 
                isLoading ? 'Bezig met opslaan...' : (isRegistration ? 'Werktijden opslaan' : 'Opslaan')
            ),
            !isRegistration && h('p', { 
                className: 'text-muted', 
                style: { 
                    marginTop: '10px', 
                    fontSize: '13px', 
                    alignSelf: 'flex-start',
                    maxWidth: '500px'
                } 
            },
                'Na het opslaan worden je nieuwe werktijden gebruikt in het rooster. Dit kan even duren voordat het overal zichtbaar is.'
            )
        ),

        // Weekly Summary Card (moved to bottom)
        h('div', { className: 'card' },
            h('h3', { className: 'card-title' }, 
                scheduleType === 'rotating' ? 
                    `📊 Overzicht Week ${activeWeek === 'A' ? '1' : '2'}` : 
                    '📊 Overzicht van je werkweek'
            ),
            h('div', { className: 'work-hours-overview' },
                h('div', { className: 'hours-summary' },
                    h('div', { className: 'summary-item' },
                        h('span', { className: 'summary-label' }, 
                            scheduleType === 'rotating' ? 
                                `⏱️ Totaal uren Week ${activeWeek === 'A' ? '1' : '2'}:` : 
                                '⏱️ Totaal uren per week:'
                        ),
                        h('span', { className: 'summary-value' }, `${getCurrentWeekHours()} uur`)
                    ),
                    h('div', { className: 'summary-item' },
                        h('span', { className: 'summary-label' }, '📊 Gemiddeld per werkdag:'),
                        h('span', { className: 'summary-value' }, `${(getCurrentWeekHours() / 5).toFixed(1)} uur`)
                    )
                ),
                
                scheduleType === 'rotating' && h('div', { className: 'info-grid', style: { marginTop: '1rem' } },
                    h('div', { className: 'info-item' },
                        h('span', { className: 'info-label' }, 'Week 1 start datum:'),
                        h('span', { className: 'info-value' }, new Date(cycleStartDate).toLocaleDateString('nl-NL'))
                    ),
                    h('div', { className: 'info-item' },
                        h('span', { className: 'info-label' }, 'Rooster geldig vanaf:'),
                        h('span', { className: 'info-value' }, new Date(ingangsdatum).toLocaleDateString('nl-NL'))
                    )
                ),
                
                scheduleType === 'rotating' && h('div', { 
                    className: 'rotating-info', 
                    style: { 
                        marginTop: '15px', 
                        padding: '12px', 
                        background: '#f8f9fa', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#6c757d'
                    } 
                },
                    h('strong', { style: { color: '#495057' } }, '💡 Hoe werkt je roulerende rooster:'),
                    h('ul', { style: { margin: '5px 0 0 0', paddingLeft: '20px' } },
                        h('li', null, 'Week 1 en Week 2 wisselen elke week af'),
                        h('li', null, `Week 1 begint op ${new Date(cycleStartDate).toLocaleDateString('nl-NL')}`),
                        h('li', null, 'Het systeem berekent automatisch welke week van toepassing is'),
                        h('li', null, 'U kunt beide weken hier apart instellen')
                    )
                )
            )
        )
        ] // End of conditional main content array
    );
};