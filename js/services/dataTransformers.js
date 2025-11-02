/**
 * @file dataTransformers.js
 * @description Data transformation utilities for the Verlofrooster application
 * Converts raw SharePoint data into the format needed by the application
 * All transformations are pure functions for easier testing
 */

import { createLocalDate } from '../utils/dateTimeUtils.js';
import { getProfilePhotoUrl } from '../utils/userUtils.js';

/**
 * Transform raw Teams data from SharePoint into application format
 * @param {Array} teamsData - Raw teams data from SharePoint
 * @returns {Object} Object with teamsMapped array and teamNameToIdMap
 */
export function transformTeams(teamsData) {
    const teamsMapped = (teamsData || []).map(item => ({
        id: item.Title || item.ID?.toString(),
        naam: item.Naam || item.Title,
        Naam: item.Naam || item.Title, // Add both versions for compatibility
        kleur: item.Kleur || '#cccccc'
    }));
    
    console.log(`👥 Loaded ${teamsMapped.length} teams:`, teamsMapped.map(t => `${t.naam} (${t.id})`));
    
    // Create lookup map for team name to ID
    const teamNameToIdMap = teamsMapped.reduce((acc, t) => {
        acc[t.naam] = t.id;
        return acc;
    }, {});
    
    return {
        teamsMapped,
        teamNameToIdMap
    };
}

/**
 * Transform raw Verlofredenen (shift types) data from SharePoint
 * @param {Array} verlofredenenData - Raw verlofredenen data from SharePoint
 * @returns {Object} Map of shift type ID to shift type object
 */
export function transformShiftTypes(verlofredenenData) {
    const transformedShiftTypes = (verlofredenenData || []).reduce((acc, item) => {
        if (item.Title) {
            acc[item.ID] = {
                id: item.ID,
                label: item.Title,
                kleur: item.Kleur || '#999999',
                afkorting: item.Afkorting || '??'
            };
        }
        return acc;
    }, {});
    
    console.log(`📋 Loaded ${Object.keys(transformedShiftTypes).length} shift types`);
    
    return transformedShiftTypes;
}

/**
 * Transform and filter Medewerkers (employees) data
 * @param {Array} medewerkersData - Raw medewerkers data from SharePoint
 * @param {Object} teamNameToIdMap - Map of team names to team IDs
 * @returns {Array} Transformed medewerkers array
 */
export function transformMedewerkers(medewerkersData, teamNameToIdMap) {
    const medewerkersProcessed = (medewerkersData || [])
        .filter(item => item.Naam && item.Actief !== false)
        .map(item => ({
            ...item,
            id: item.ID,
            naam: item.Naam,
            team: teamNameToIdMap[item.Team] || '',
            Username: item.Username || null
        }));
    
    console.log(`👤 Loaded ${medewerkersProcessed.length} active medewerkers`);
    
    return medewerkersProcessed;
}

/**
 * Alternative Medewerkers transformation with profile photos (used in silentRefreshData)
 * @param {Array} medewerkersData - Raw medewerkers data from SharePoint
 * @param {Object} teamNameToIdMap - Map of team names to team IDs
 * @returns {Array} Transformed medewerkers array with profile photos
 */
export function transformMedewerkersWithPhotos(medewerkersData, teamNameToIdMap) {
    const medewerkersTransformed = (medewerkersData || []).map(m => ({
        id: m.ID,
        naam: m.Naam || m.Title || 'Onbekend',
        team: teamNameToIdMap[m.Team] || 'geen_team',
        username: m.Username || '',
        Username: m.Username || '',
        Title: m.Naam || m.Title || 'Onbekend',
        profilePhoto: getProfilePhotoUrl(m.Username),
        horenStatus: m.HorenStatus
    }));
    
    console.log(`👤 Loaded ${medewerkersTransformed.length} medewerkers with profile photos`);
    
    return medewerkersTransformed;
}

/**
 * Transform Verlof (leave) items with date conversion
 * @param {Array} verlofData - Raw verlof data from SharePoint
 * @returns {Array} Transformed verlof items
 */
export function transformVerlofItems(verlofData) {
    const transformed = (verlofData || []).map(v => ({
        ...v,
        StartDatum: createLocalDate(v.StartDatum),
        EindDatum: createLocalDate(v.EindDatum)
    }));
    
    console.log(`📅 Processed ${transformed.length} verlof items`);
    
    return transformed;
}

/**
 * Transform Zittingsvrij (court-free) items with date conversion
 * @param {Array} zittingsvrijData - Raw zittingsvrij data from SharePoint
 * @returns {Array} Transformed zittingsvrij items
 */
export function transformZittingsvrijItems(zittingsvrijData) {
    const transformed = (zittingsvrijData || []).map(z => ({
        ...z,
        StartDatum: createLocalDate(z.ZittingsVrijeDagTijd),
        EindDatum: createLocalDate(z.ZittingsVrijeDagTijdEind)
    }));
    
    console.log(`⚖️ Processed ${transformed.length} zittingsvrij items`);
    
    return transformed;
}

/**
 * Transform CompensatieUren (compensation hours) items with date conversion
 * Standard version without ruildagStart (used in refreshData)
 * @param {Array} compensatieData - Raw compensatie data from SharePoint
 * @returns {Array} Transformed compensatie items
 */
export function transformCompensatieItems(compensatieData) {
    const transformed = (compensatieData || []).map(c => ({
        ...c,
        StartCompensatieUren: createLocalDate(c.StartCompensatieUren),
        EindeCompensatieUren: createLocalDate(c.EindeCompensatieUren),
        ruildagStart: c.ruildagStart ? createLocalDate(c.ruildagStart) : null
    }));
    
    console.log(`⏱️ Processed ${transformed.length} compensatie items`);
    
    return transformed;
}

/**
 * Alternative CompensatieUren transformation without ruildagStart (used in silentRefreshData)
 * @param {Array} compensatieData - Raw compensatie data from SharePoint
 * @returns {Array} Transformed compensatie items
 */
export function transformCompensatieItemsSimple(compensatieData) {
    const transformed = (compensatieData || []).map(c => ({
        ...c,
        StartCompensatieUren: createLocalDate(c.StartCompensatieUren),
        EindeCompensatieUren: createLocalDate(c.EindeCompensatieUren)
    }));
    
    console.log(`⏱️ Processed ${transformed.length} compensatie items (simple)`);
    
    return transformed;
}

/**
 * Transform UrenPerWeek items with complex date parsing
 * This handles Dutch date formats and rotating schedules
 * @param {Array} urenPerWeekData - Raw urenPerWeek data from SharePoint
 * @returns {Array} Transformed urenPerWeek items
 */
export function transformUrenPerWeekItems(urenPerWeekData) {
    const transformed = (urenPerWeekData || []).map(u => {
        // Normalize Ingangsdatum by properly parsing and resetting time components
        let ingangsDate;
        
        try {
            // Handle Dutch date format (DD-MM-YYYY)
            if (typeof u.Ingangsdatum === 'string' && u.Ingangsdatum.match(/^\d{1,2}-\d{1,2}-\d{4}/)) {
                const parts = u.Ingangsdatum.split(' ')[0].split('-');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
                const year = parseInt(parts[2], 10);
                
                ingangsDate = new Date(year, month, day);
            } else {
                ingangsDate = new Date(u.Ingangsdatum);
            }
            
            // Check if date is valid
            if (isNaN(ingangsDate.getTime())) {
                console.error('Invalid date after parsing:', u.Ingangsdatum);
                ingangsDate = null;
            } else {
                // Reset time components for consistent comparison
                ingangsDate.setHours(0, 0, 0, 0);
            }
        } catch (error) {
            console.error('Error parsing date:', error, u.Ingangsdatum);
            ingangsDate = null;
        }
        
        // Parse CycleStartDate if present (for 2-week rotations)
        let cycleStartDate = null;
        if (u.CycleStartDate) {
            try {
                cycleStartDate = new Date(u.CycleStartDate);
                if (isNaN(cycleStartDate.getTime())) {
                    cycleStartDate = null;
                } else {
                    cycleStartDate.setHours(0, 0, 0, 0);
                }
            } catch (error) {
                console.error('Error parsing CycleStartDate:', error, u.CycleStartDate);
                cycleStartDate = null;
            }
        }
        
        // Handle WeekType field - preserve original value but normalize case
        let weekType = null;
        if (u.WeekType !== undefined && u.WeekType !== null && u.WeekType !== '') {
            weekType = String(u.WeekType).trim().toUpperCase();
            // Validate it's either A or B
            if (weekType !== 'A' && weekType !== 'B') {
                console.error(`Invalid WeekType '${u.WeekType}' for record ID ${u.Id}, expected 'A' or 'B'`);
                weekType = null;
            }
        }
        
        // Handle IsRotatingSchedule field (defaults to false for backwards compatibility)
        const isRotatingSchedule = u.IsRotatingSchedule === true || u.IsRotatingSchedule === 'true';
        
        return {
            ...u,
            Ingangsdatum: ingangsDate,
            CycleStartDate: cycleStartDate,
            WeekType: weekType,
            IsRotatingSchedule: isRotatingSchedule
        };
    });
    
    console.log(`📊 Processed ${transformed.length} urenPerWeek items`);
    
    return transformed;
}

/**
 * Transform DagenIndicators (day indicators) data
 * @param {Array} dagenIndicatorsData - Raw dagenIndicators data from SharePoint
 * @returns {Object} Map of indicator title to indicator object
 */
export function transformDagenIndicators(dagenIndicatorsData) {
    const indicatorsMapped = (dagenIndicatorsData || []).reduce((acc, item) => {
        if (item.Title) {
            acc[item.Title] = {
                ...item,
                kleur: item.Kleur || '#cccccc',
                Beschrijving: item.Beschrijving || ''
            };
        }
        return acc;
    }, {});
    
    console.log(`🔔 Loaded ${Object.keys(indicatorsMapped).length} dagen indicators`);
    
    return indicatorsMapped;
}

/**
 * Alternative DagenIndicators transformation (used in silentRefreshData)
 * @param {Array} dagenIndicatorsData - Raw dagenIndicators data from SharePoint
 * @returns {Object} Map of indicator title to indicator object
 */
export function transformDagenIndicatorsSimple(dagenIndicatorsData) {
    const transformed = (dagenIndicatorsData || []).reduce((acc, item) => {
        if (item.Title) {
            acc[item.Title] = {
                Title: item.Title,
                kleur: item.Kleur || '#999999',
                Beschrijving: item.Beschrijving || ''
            };
        }
        return acc;
    }, {});
    
    console.log(`🔔 Loaded ${Object.keys(transformed).length} dagen indicators (simple)`);
    
    return transformed;
}

/**
 * Transform all static data in one call
 * @param {Object} staticData - Object containing all raw static data
 * @returns {Object} Object containing all transformed static data
 */
export function transformAllStaticData(staticData) {
    const { teamsMapped, teamNameToIdMap } = transformTeams(staticData.teamsData);
    const shiftTypes = transformShiftTypes(staticData.verlofredenenData);
    const medewerkers = transformMedewerkers(staticData.medewerkersData, teamNameToIdMap);
    const urenPerWeekItems = transformUrenPerWeekItems(staticData.urenPerWeekData);
    const dagenIndicators = transformDagenIndicators(staticData.dagenIndicatorsData);
    
    return {
        teams: teamsMapped,
        teamNameToIdMap,
        shiftTypes,
        medewerkers,
        urenPerWeekItems,
        dagenIndicators
    };
}

/**
 * Transform all period-specific data in one call
 * @param {Object} periodData - Object containing all raw period data
 * @returns {Object} Object containing all transformed period data
 */
export function transformAllPeriodData(periodData) {
    const verlofItems = transformVerlofItems(periodData.verlofData);
    const zittingsvrijItems = transformZittingsvrijItems(periodData.zittingsvrijData);
    const compensatieItems = transformCompensatieItems(periodData.compensatieUrenData);
    
    return {
        verlofItems,
        zittingsvrijItems,
        compensatieItems
    };
}

/**
 * Transform all data (static + period) in one call
 * @param {Object} rawData - Object containing all raw data
 * @returns {Object} Object containing all transformed data
 */
export function transformAllData(rawData) {
    const staticTransformed = transformAllStaticData({
        teamsData: rawData.teamsData,
        verlofredenenData: rawData.verlofredenenData,
        medewerkersData: rawData.medewerkersData,
        urenPerWeekData: rawData.urenPerWeekData,
        dagenIndicatorsData: rawData.dagenIndicatorsData
    });
    
    const periodTransformed = transformAllPeriodData({
        verlofData: rawData.verlofData,
        zittingsvrijData: rawData.zittingsvrijData,
        compensatieUrenData: rawData.compensatieUrenData
    });
    
    return {
        ...staticTransformed,
        ...periodTransformed
    };
}

export default {
    transformTeams,
    transformShiftTypes,
    transformMedewerkers,
    transformMedewerkersWithPhotos,
    transformVerlofItems,
    transformZittingsvrijItems,
    transformCompensatieItems,
    transformCompensatieItemsSimple,
    transformUrenPerWeekItems,
    transformDagenIndicators,
    transformDagenIndicatorsSimple,
    transformAllStaticData,
    transformAllPeriodData,
    transformAllData
};
