/**
 * Date and Time Utilities for Verlofrooster
 * Pure functions for Dutch calendar calculations, holidays, and date formatting
 */

// Month names in Dutch
export const maandNamenVolledig = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

/**
 * Calculate Easter Sunday for a given year using the algorithm
 * @param {number} jaar - The year to calculate Easter for
 * @returns {Date} Easter Sunday date
 */
export const getPasen = (jaar) => {
    const a = jaar % 19;
    const b = Math.floor(jaar / 100);
    const c = jaar % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const maand = Math.floor((h + l - 7 * m + 114) / 31);
    const dag = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(jaar, maand - 1, dag);
};

/**
 * Get all Dutch holidays for a given year
 * @param {number} jaar - The year to get holidays for
 * @returns {Object} Object with date keys (YYYY-MM-DD) and holiday names as values
 */
export const getFeestdagen = (jaar) => {
    const pasen = getPasen(jaar);
    const feestdagenMap = {};
    
    const voegFeestdagToe = (datum, naam) => {
        const key = datum.toISOString().split('T')[0];
        feestdagenMap[key] = naam;
    };
    
    // Fixed holidays
    voegFeestdagToe(new Date(jaar, 0, 1), 'Nieuwjaarsdag');
    voegFeestdagToe(new Date(jaar, 3, 27), 'Koningsdag');
    voegFeestdagToe(new Date(jaar, 4, 5), 'Bevrijdingsdag');
    voegFeestdagToe(new Date(jaar, 11, 25), 'Eerste Kerstdag');
    voegFeestdagToe(new Date(jaar, 11, 26), 'Tweede Kerstdag');
    
    // Easter-based holidays
    voegFeestdagToe(new Date(pasen.getTime() - 2 * 24 * 3600 * 1000), 'Goede Vrijdag');
    voegFeestdagToe(pasen, 'Eerste Paasdag');
    voegFeestdagToe(new Date(pasen.getTime() + 1 * 24 * 3600 * 1000), 'Tweede Paasdag');
    voegFeestdagToe(new Date(pasen.getTime() + 39 * 24 * 3600 * 1000), 'Hemelvaartsdag');
    voegFeestdagToe(new Date(pasen.getTime() + 49 * 24 * 3600 * 1000), 'Eerste Pinksterdag');
    voegFeestdagToe(new Date(pasen.getTime() + 50 * 24 * 3600 * 1000), 'Tweede Pinksterdag');
    
    return feestdagenMap;
};

/**
 * Get the ISO week number for a given date
 * @param {Date} datum - The date to get the week number for
 * @returns {number} The ISO week number (1-53)
 */
export const getWeekNummer = (datum) => {
    const doelDatum = new Date(datum.getTime());
    const dagVanWeek = (doelDatum.getDay() + 6) % 7; // Monday = 0
    doelDatum.setDate(doelDatum.getDate() - dagVanWeek + 3);
    const eersteJanuari = new Date(doelDatum.getFullYear(), 0, 1);
    return Math.ceil(((doelDatum.getTime() - eersteJanuari.getTime()) / 604800000) + 1);
};

/**
 * Get the number of weeks in a given year
 * @param {number} jaar - The year
 * @returns {number} Number of weeks in the year (52 or 53)
 */
export const getWekenInJaar = (jaar) => {
    const laatste31Dec = new Date(jaar, 11, 31);
    const weekNummer = getWeekNummer(laatste31Dec);
    return weekNummer === 1 ? 52 : weekNummer;
};

/**
 * Get all days in a given month
 * @param {number} maand - Month (0-11, where 0 = January)
 * @param {number} jaar - Year
 * @returns {Date[]} Array of Date objects for each day in the month
 */
export const getDagenInMaand = (maand, jaar) => {
    const dagen = [];
    const laatstedag = new Date(jaar, maand + 1, 0);
    for (let i = 1; i <= laatstedag.getDate(); i++) {
        dagen.push(new Date(jaar, maand, i));
    }
    return dagen;
};

/**
 * Format a date object to YYYY-MM-DD string
 * @param {Date} datum - The date to format
 * @returns {string} Formatted date string
 */
export const formatteerDatum = (datum) => {
    if (!(datum instanceof Date) || isNaN(datum)) {
        // Handle invalid date input gracefully
        console.error("Invalid date provided to formatteerDatum:", datum);
        return 'invalid-date';
    }
    const jaar = datum.getFullYear();
    const maand = (datum.getMonth() + 1).toString().padStart(2, '0');
    const dag = datum.getDate().toString().padStart(2, '0');
    return `${jaar}-${maand}-${dag}`;
};


/**
 * Get the name of the day in Dutch
 * @param {Date} datum - The date to get the day name for
 * @returns {string} The Dutch day name (e.g., "Ma" for Monday)
 */
export const getDagNaam = (datum) => {
    // Get day name based on index
    let dagNaam;
    switch (datum.getDay()) {
        case 0: dagNaam = "Zo"; break;
        case 1: dagNaam = "Ma"; break;
        case 2: dagNaam = "Di"; break;
        case 3: dagNaam = "Wo"; break;
        case 4: dagNaam = "Do"; break;
        case 5: dagNaam = "Vr"; break;
        case 6: dagNaam = "Za"; break;
        default: dagNaam = "";
    }

    return dagNaam;
};

/**
 * Get all days in a given week of a year
 * @param {number} weekNummer - Week number (1-53)
 * @param {number} jaar - Year
 * @returns {Date[]} Array of 7 Date objects (Monday to Sunday)
 */
export const getDagenInWeek = (weekNummer, jaar) => {
    const dagen = [];
    const eersteJanuari = new Date(jaar, 0, 1);
    const dagVanWeek = (eersteJanuari.getDay() + 6) % 7; // Monday = 0

    // Calculate the date of the first Monday of the year
    const eersteMaandag = new Date(jaar, 0, 1 - dagVanWeek + (dagVanWeek === 0 ? 0 : 7));

    // Calculate the start date of the desired week
    const startVanWeek = new Date(eersteMaandag);
    startVanWeek.setDate(startVanWeek.getDate() + (weekNummer - 1) * 7);

    // Add 7 days for the week (Monday to Sunday)
    for (let i = 0; i < 7; i++) {
        const dag = new Date(startVanWeek);
        dag.setDate(dag.getDate() + i);
        dagen.push(dag);
    }

    return dagen;
};

/**
 * Check if a given date is today
 * @param {Date} datum - The date to check
 * @returns {boolean} True if the date is today
 */
export const isVandaag = (datum) => {
    const vandaag = new Date();
    const datumCheck = new Date(datum);
    return datumCheck.getDate() === vandaag.getDate() &&
        datumCheck.getMonth() === vandaag.getMonth() &&
        datumCheck.getFullYear() === vandaag.getFullYear();
};

// Duplicate getWeekNummer function removed - already defined on line 72

/**
 * Create a Date object from ISO string that is timezone-safe for local dates
 * @param {string|Date} dateInput - ISO date string or Date object
 * @returns {Date} Date object adjusted for local timezone
 */
export const createLocalDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    
    // If it's already in ISO format with timezone, parse normally
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
        return new Date(dateInput);
    }
    
    // If it's a date string without time, treat as local date
    if (typeof dateInput === 'string') {
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    }
    
    return new Date(dateInput);
};

/**
 * Convert Date to ISO date string (YYYY-MM-DD) for consistent comparison
 * @param {Date} date - Date object
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const toISODate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Compare two dates using ISO date strings for timezone-safe comparison
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if dates are the same day
 */
export const isSameISODate = (date1, date2) => {
    const iso1 = date1 instanceof Date ? toISODate(date1) : date1;
    const iso2 = date2 instanceof Date ? toISODate(date2) : date2;
    return iso1 === iso2;
};

/**
 * Create a properly formatted datetime string for SharePoint submission
 * This ensures consistent timezone handling and prevents date shifts
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} timeString - Time string in HH:MM format
 * @returns {string} Properly formatted datetime string for SharePoint
 */
export const createSharePointDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) {
        console.warn('createSharePointDateTime: Missing date or time input', { dateString, timeString });
        return null;
    }
    
    // Parse input values
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create ISO string manually to avoid timezone conversion
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    
    // Return ISO string without timezone conversion
    return `${year}-${paddedMonth}-${paddedDay}T${paddedHours}:${paddedMinutes}:00`;
};

/**
 * Create a date-only string for SharePoint (useful for full-day events)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Properly formatted date string for SharePoint
 */
export const createSharePointDate = (dateString) => {
    if (!dateString) {
        console.warn('createSharePointDate: Missing date input');
        return null;
    }
    
    // For date-only fields, use the date with time set to start of day
    return createSharePointDateTime(dateString, '00:00');
};

console.log("Date and Time Utilities loaded successfully.");