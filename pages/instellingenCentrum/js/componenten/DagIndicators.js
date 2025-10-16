/**
 * @file DagIndicators.js
 * @description Day Type Calculation Logic for Work Hours
 * This module handles the determination of day types (VVO, VVM, VVD, Normaal, Flexibele start tijd)
 * based on start/end times and free day status.
 */

// Day type constants
export const DAY_TYPES = {
    VVD: 'VVD',                    // Vaste Vrije Dag (Full Free Day)
    VVO: 'VVO',                    // Vaste Vrije Ochtend (Free Morning)
    VVM: 'VVM',                    // Vaste Vrije Middag (Free Afternoon)  
    NORMAAL: 'Normaal',            // Normal working day
    FLEXIBEL: 'Flexibele uren'     // Flexible hours (internal use only)
};

// Day type display labels
export const DAY_TYPE_LABELS = {
    [DAY_TYPES.VVD]: 'VVD - Vaste Vrije Dag',
    [DAY_TYPES.VVO]: 'VVO - Vaste Vrije Ochtend', 
    [DAY_TYPES.VVM]: 'VVM - Vaste Vrije Middag',
    [DAY_TYPES.FLEXIBEL]: 'Flexibele uren',
    [DAY_TYPES.NORMAAL]: 'Normaal'
};

// Default day type colors (can be overridden by SharePoint DagenIndicators)
export const DEFAULT_DAY_TYPE_COLORS = {
    [DAY_TYPES.VVD]: '#e74c3c',      // Red
    [DAY_TYPES.VVO]: '#3498db',      // Blue (distinct from VVM)
    [DAY_TYPES.VVM]: '#f39c12',      // Orange
    [DAY_TYPES.FLEXIBEL]: '#9b59b6', // Purple
    [DAY_TYPES.NORMAAL]: '#27ae60'   // Green
};

/**
 * Determines the work day type based on start time, end time, and free day status
 * Corrected logic based on user requirements:
 * 
 * - VVD: Vrije Dag checkbox is checked (overrides all, disables time pickers)
 * - Flexibele uren: ONLY when time pickers are BLANK and VVD checkbox is UNCHECKED
 * - VVO: Morning off - employee starts at 12:00+ (no work before 13:00)
 * - VVM: Afternoon off - employee starts before 13:00 AND ends before 13:00
 * - Normaal: All other cases with filled time pickers (doesn't fit VVO/VVM patterns)
 * 
 * Key definitions:
 * - Morning = time before 13:00
 * - Middag = time after 12:00
 * 
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format  
 * @param {boolean} isVrijeDag - Whether the day is explicitly marked as free (VVD checkbox)
 * @returns {string} Day type (VVD, VVO, VVM, Normaal, or Flexibele uren)
 */
export function determineWorkDayType(startTime, endTime, isVrijeDag = false) {
    console.log(`Determining work day type for: ${startTime} - ${endTime}, isVrijeDag: ${isVrijeDag}`);
    
    // Step 1: VVD - Check for explicitly marked free day (checkbox overrides everything)
    if (isVrijeDag) {
        console.log('VVD: Explicitly marked as free day via checkbox');
        return DAY_TYPES.VVD;
    }
    
    // Step 2: Flexibele uren - ONLY when time pickers are BLANK and VVD checkbox is UNCHECKED
    if (!startTime || !endTime || startTime === '--:--' || endTime === '--:--' || 
        startTime.trim() === '' || endTime.trim() === '') {
        console.log('Flexibele uren: Empty or undefined times detected (and VVD not checked)');
        return DAY_TYPES.FLEXIBEL;
    }
    
    // Step 3: Parse and validate time inputs
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.log('Flexibele uren: Invalid time format detected');
        return DAY_TYPES.FLEXIBEL;
    }
    
    // Step 4: Check for no work (start and end times are the same) - treat as flexible
    if (startTime === endTime) {
        console.log('Flexibele uren: Start and end times are identical');
        return DAY_TYPES.FLEXIBEL;
    }
    
    // Convert to minutes for easier comparison
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    console.log(`Parsed: start=${Math.floor(startMinutes/60)}:${String(startMinutes%60).padStart(2,'0')}, end=${Math.floor(endMinutes/60)}:${String(endMinutes%60).padStart(2,'0')}`);
    
    // Step 5: Define time boundaries
    const morningEnd = 13 * 60;        // 13:00 - End of morning period
    const middagStart = 12 * 60;       // 12:00 - Start of middag period
    
    // Step 6: Apply the corrected logic - if times are filled, determine VVO/VVM/Normaal
    
    // VVM: Afternoon off - worked morning only (starts before 13:00 AND ends at or before 13:00)
    if (startMinutes < morningEnd && endMinutes <= morningEnd) {
        console.log('VVM: Worked morning only, afternoon off (start < 13:00 AND end <= 13:00)');
        return DAY_TYPES.VVM;
    }
    
    // VVO: Morning off - no work in morning (starts at 12:00+ = no work before 13:00)
    if (startMinutes >= middagStart) {
        console.log('VVO: Morning off, started at middag time (start >= 12:00)');
        return DAY_TYPES.VVO;
    }
    
    // Normaal: All other cases with filled time pickers (doesn't fit VVO/VVM patterns)
    console.log('Normaal: Filled time pickers that don\'t fit VVO/VVM patterns');
    return DAY_TYPES.NORMAAL;
}

/**
 * Gets display label for a work day type
 * @param {string} type - Day type (VVD, VVO, VVM, etc.)
 * @returns {string} Human-readable label
 */
export function getWorkDayTypeDisplay(type) {
    return DAY_TYPE_LABELS[type] || type || '-';
}

/**
 * Calculates hours worked between start and end time
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Hours worked (rounded to 1 decimal place)
 */
export function calculateHoursWorked(startTime, endTime) {
    if (!startTime || !endTime || startTime === '--:--' || endTime === '--:--') {
        return 0;
    }
    
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
    }
    
    if (end <= start) {
        return 0;
    }
    
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Format to 1 decimal place if needed
    return diffHours % 1 === 0 ? diffHours : Number(diffHours.toFixed(1));
}

/**
 * Gets style object for day type badge
 * @param {string} type - Day type
 * @param {object} customColors - Custom color mapping from SharePoint
 * @returns {object} Style object with backgroundColor, color, etc.
 */
export function getDayTypeStyle(type, customColors = {}) {
    const colors = { ...DEFAULT_DAY_TYPE_COLORS, ...customColors };
    const backgroundColor = colors[type] || '#e0e0e0';
    
    return {
        backgroundColor,
        color: 'white',
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '500',
        textTransform: 'uppercase'
    };
}

/**
 * Validates time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid format
 */
export function isValidTimeFormat(time) {
    if (!time || time === '--:--') return true; // Allow empty/flexible
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

/**
 * Validates that end time is after start time
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} True if end time is after start time
 */
export function validateTimeRange(startTime, endTime) {
    if (!startTime || !endTime || startTime === '--:--' || endTime === '--:--') {
        return true; // Allow flexible times
    }
    
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
        return false;
    }
    
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    return end > start;
}

/**
 * Generates work schedule data structure for SharePoint submission
 * This follows the structure expected by the UrenPerWeek list
 * 
 * @param {object} workHours - Work hours data (monday, tuesday, etc.)
 * @param {object} options - Additional options
 * @param {string} options.weekType - 'A' or 'B' for rotating schedules, null for fixed
 * @param {boolean} options.isRotating - Whether this is a rotating schedule
 * @param {string} options.userId - User's LoginName
 * @param {string} options.ingangsdatum - Start date (ISO string)
 * @param {string} options.cycleStartDate - Cycle start date for rotating schedules
 * @returns {object} SharePoint-ready data structure
 */
export function generateWorkScheduleData(workHours, options = {}) {
    const {
        weekType = null,
        isRotating = false,
        userId,
        ingangsdatum,
        cycleStartDate
    } = options;
    
    const dayMap = {
        monday: 'Maandag',
        tuesday: 'Dinsdag', 
        wednesday: 'Woensdag',
        thursday: 'Donderdag',
        friday: 'Vrijdag'
    };
    
    const scheduleData = {
        MedewerkerID: userId,
        Ingangsdatum: ingangsdatum,
        VeranderingsDatum: new Date().toISOString(), // Track when this was created/updated
        // Rotation fields - ensure proper values are set
        WeekType: isRotating ? weekType : null,
        IsRotatingSchedule: isRotating, // Boolean field - true for rotating schedules
        CycleStartDate: isRotating && cycleStartDate ? cycleStartDate : null,
    };
    
    // Debug logging for rotating schedule
    if (isRotating) {
        console.log('🔄 Generating rotating schedule data:', {
            weekType: weekType,
            isRotating: isRotating,
            IsRotatingSchedule: isRotating === true,
            cycleStartDate: cycleStartDate,
            CycleStartDate: isRotating && cycleStartDate ? cycleStartDate : null
        });
    }
    
    // Add day-specific data
    Object.entries(dayMap).forEach(([englishDay, dutchDay]) => {
        const dayData = workHours[englishDay];
        if (dayData) {
            const dayType = determineWorkDayType(dayData.start, dayData.end, dayData.isFreeDag);
            const hoursWorked = calculateHoursWorked(dayData.start, dayData.end);
            
            scheduleData[`${dutchDay}Start`] = dayData.start || '';
            scheduleData[`${dutchDay}Eind`] = dayData.end || '';
            scheduleData[`${dutchDay}Soort`] = dayType;
            scheduleData[`${dutchDay}Totaal`] = hoursWorked.toString();
            // Note: VrijeDag fields removed as they don't exist in SharePoint yet
            // Free day status is tracked via dayType (VVD = Vrije Volledige Dag)
        }
    });
    
    return scheduleData;
}

/**
 * Default day configuration for new schedules
 */
export const DEFAULT_WORK_HOURS = {
    monday: { start: '09:00', end: '17:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
    tuesday: { start: '09:00', end: '17:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
    wednesday: { start: '09:00', end: '17:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
    thursday: { start: '09:00', end: '17:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false },
    friday: { start: '09:00', end: '17:00', hours: 8, type: DAY_TYPES.NORMAAL, isFreeDag: false }
};

/**
 * Days of the week configuration
 */
export const WORK_DAYS = [
    { key: 'monday', label: 'Maandag', short: 'Ma' },
    { key: 'tuesday', label: 'Dinsdag', short: 'Di' },
    { key: 'wednesday', label: 'Woensdag', short: 'Wo' },
    { key: 'thursday', label: 'Donderdag', short: 'Do' },
    { key: 'friday', label: 'Vrijdag', short: 'Vr' }
];