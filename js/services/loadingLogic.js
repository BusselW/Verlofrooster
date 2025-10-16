/**
 * @file loadingLogic.js
 * @description Smart loading logic voor het beperken van SharePoint data loads.
 * 
 * Deze service beheert het laden van data voor de huidige periode en zorgt ervoor dat:
 * - Alleen relevante data wordt geladen (huidige maand + buffer)
 * - SharePoint's 5000 item limiet niet wordt overschreden
 * - Overlappende periodes correct worden afgehandeld
 * - Data efficiënt wordt gecached en herladen wanneer nodig
 * 
 * Features:
 * - Period-based data loading (maand/week view)
 * - Buffer period handling voor overlapping items
 * - Caching mechanisme om onnodige herladingen te voorkomen
 * - OData query generation voor SharePoint filtering
 * 
 * Usage:
 * - Import in verlofRooster.aspx and use with existing fetchSharePointList function
 * - loadFilteredData() replaces direct fetchSharePointList calls for date-sensitive lists
 * - shouldReloadData() checks if new data loading is needed
 * - Cache automatically handles period transitions
 * 
 * Supported Lists:
 * - Verlof (includes ziekte with Status='Ziek')
 * - CompensatieUren  
 * - IncidenteelZittingVrij
 * 
 * Developer tools:
 * - window.LoadingLogic - Access full API
 * - window.clearLoadingCache() - Clear all cached data
 * - window.getLoadingStats() - View cache statistics
 * - window.logLoadingStatus() - Log current status
 */

// Cache object voor geladen data per periode
const dataCache = {
    verlofItems: new Map(),
    compensatieItems: new Map(),
    zittingsvrijItems: new Map(),
    ziekteItems: new Map(),
    lastLoadedPeriod: null,
    currentCacheKey: null
};

/**
 * Genereer een cache key gebaseerd op view type en periode
 * @param {string} viewType - 'maand' of 'week'
 * @param {number} year - Het jaar
 * @param {number} monthOrWeek - Maand (0-11) of week nummer
 * @returns {string} Unieke cache key
 */
function generateCacheKey(viewType, year, monthOrWeek) {
    return `${viewType}-${year}-${monthOrWeek}`;
}

/**
 * Bereken de datum range voor de huidige periode inclusief buffer
 * @param {string} viewType - 'maand' of 'week'
 * @param {number} year - Het jaar
 * @param {number} monthOrWeek - Maand (0-11) of week nummer
 * @returns {Object} Object met startDate en endDate
 */
export function getCurrentPeriodDateRange(viewType, year, monthOrWeek) {
    let startDate, endDate;
    
    if (viewType === 'maand') {
        // Voor maand view: vorige maand tot volgende maand (3 maanden buffer)
        const bufferMonths = 1;
        
        // Start van vorige maand
        const startMonth = monthOrWeek - bufferMonths;
        startDate = new Date(year, startMonth, 1);
        
        // Einde van volgende maand
        const endMonth = monthOrWeek + bufferMonths + 1;
        endDate = new Date(year, endMonth, 0); // 0 = laatste dag van vorige maand
        
    } else if (viewType === 'week') {
        // Voor week view: 2 weken voor tot 2 weken na (5 weken buffer)
        const bufferWeeks = 2;
        
        // Bereken start van week
        const firstJan = new Date(year, 0, 1);
        const firstMonday = new Date(firstJan);
        const dayOfWeek = (firstJan.getDay() + 6) % 7; // Maandag = 0
        firstMonday.setDate(firstJan.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7));
        
        startDate = new Date(firstMonday);
        startDate.setDate(startDate.getDate() + (monthOrWeek - bufferWeeks - 1) * 7);
        
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (bufferWeeks * 2 + 1) * 7);
    }
    
    // Zorg ervoor dat we geen negatieve datums hebben
    if (startDate.getFullYear() < 1900) {
        startDate = new Date(1900, 0, 1);
    }
    
    console.log(`📅 Loading period range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    return { startDate, endDate };
}

/**
 * Genereer OData filter query voor SharePoint lijst
 * @param {Date} startDate - Start datum voor filter
 * @param {Date} endDate - Eind datum voor filter
 * @param {string} listType - Type lijst ('verlof', 'compensatie', 'zittingsvrij', 'ziekte')
 * @returns {string} OData filter string
 */
export function generateODataFilter(startDate, endDate, listType) {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    let dateFields = [];
    
    switch (listType.toLowerCase()) {
        case 'verlof':
            // Verlof items: check overlap tussen StartDatum/EindDatum en onze periode
            dateFields = ['StartDatum', 'EindDatum'];
            break;
            
        case 'compensatie':
        case 'compensatieuren':
            // Compensatie items: meestal alleen StartDatum, soms EindDatum
            dateFields = ['StartDatum', 'EindDatum', 'Datum'];
            break;
            
        case 'zittingsvrij':
            // Zittingsvrij items: StartDatum en EindDatum
            dateFields = ['StartDatum', 'EindDatum'];
            break;
            
        case 'ziekte':
        case 'ziekmelding':
            // Ziekte items: StartDatum en optioneel EindDatum
            dateFields = ['StartDatum', 'EindDatum'];
            break;
            
        default:
            console.warn(`Unknown list type for filtering: ${listType}`);
            return '';
    }
    
    // Bouw filter voor overlapping periodes
    // Een item overlapt als: (item.start <= onze.end) EN (item.end >= onze.start)
    const conditions = [];
    
    if (dateFields.includes('StartDatum')) {
        conditions.push(`StartDatum le datetime'${endISO}'`);
    }
    
    if (dateFields.includes('EindDatum')) {
        conditions.push(`(EindDatum ge datetime'${startISO}' or EindDatum eq null)`);
    } else if (dateFields.includes('Datum')) {
        // Voor items met alleen Datum veld
        conditions.push(`Datum ge datetime'${startISO}' and Datum le datetime'${endISO}'`);
    }
    
    const filter = conditions.length > 0 ? conditions.join(' and ') : '';
    
    console.log(`🔍 Generated OData filter for ${listType}:`, filter);
    return filter;
}

/**
 * Check of data moet worden herladen voor een nieuwe periode
 * @param {string} viewType - 'maand' of 'week'
 * @param {number} year - Het jaar
 * @param {number} monthOrWeek - Maand (0-11) of week nummer
 * @returns {boolean} True als data moet worden herladen
 */
export function shouldReloadData(viewType, year, monthOrWeek) {
    const cacheKey = generateCacheKey(viewType, year, monthOrWeek);
    const shouldReload = dataCache.currentCacheKey !== cacheKey;
    
    if (shouldReload) {
        console.log(`🔄 Data reload needed: cache key changed from ${dataCache.currentCacheKey} to ${cacheKey}`);
    } else {
        console.log(`✅ Using cached data for period: ${cacheKey}`);
    }
    
    return shouldReload;
}

/**
 * Update de cache key voor de huidige periode
 * @param {string} viewType - 'maand' of 'week'
 * @param {number} year - Het jaar
 * @param {number} monthOrWeek - Maand (0-11) of week nummer
 */
export function updateCacheKey(viewType, year, monthOrWeek) {
    const cacheKey = generateCacheKey(viewType, year, monthOrWeek);
    dataCache.currentCacheKey = cacheKey;
    dataCache.lastLoadedPeriod = { viewType, year, monthOrWeek };
    console.log(`📝 Cache key updated to: ${cacheKey}`);
}

/**
 * Cache data voor een specifieke lijst en periode
 * @param {string} listType - Type lijst ('verlof', 'compensatie', 'zittingsvrij', 'ziekte')
 * @param {Array} data - De data om te cachen
 * @param {string} cacheKey - De cache key (optioneel, gebruikt huidige als niet gegeven)
 */
export function cacheData(listType, data, cacheKey = null) {
    const key = cacheKey || dataCache.currentCacheKey;
    if (!key) return;
    
    const cacheMap = getCacheMapForListType(listType);
    if (cacheMap) {
        cacheMap.set(key, data);
        console.log(`💾 Cached ${data.length} items for ${listType} (key: ${key})`);
    }
}

/**
 * Haal gecachte data op voor een specifieke lijst
 * @param {string} listType - Type lijst ('verlof', 'compensatie', 'zittingsvrij', 'ziekte')
 * @param {string} cacheKey - De cache key (optioneel, gebruikt huidige als niet gegeven)
 * @returns {Array|null} Gecachte data of null als niet gevonden
 */
export function getCachedData(listType, cacheKey = null) {
    const key = cacheKey || dataCache.currentCacheKey;
    if (!key) return null;
    
    const cacheMap = getCacheMapForListType(listType);
    if (cacheMap && cacheMap.has(key)) {
        const data = cacheMap.get(key);
        console.log(`📁 Retrieved ${data.length} cached items for ${listType} (key: ${key})`);
        return data;
    }
    
    return null;
}

/**
 * Helper functie om de juiste cache map te krijgen voor een lijst type
 * @param {string} listType - Type lijst
 * @returns {Map|null} De cache map of null
 */
function getCacheMapForListType(listType) {
    switch (listType.toLowerCase()) {
        case 'verlof':
            return dataCache.verlofItems;
        case 'compensatie':
        case 'compensatieuren':
            return dataCache.compensatieItems;
        case 'zittingsvrij':
            return dataCache.zittingsvrijItems;
        case 'ziekte':
        case 'ziekmelding':
            return dataCache.ziekteItems;
        default:
            console.warn(`Unknown list type for caching: ${listType}`);
            return null;
    }
}

/**
 * Wis alle cache data
 */
export function clearAllCache() {
    dataCache.verlofItems.clear();
    dataCache.compensatieItems.clear();
    dataCache.zittingsvrijItems.clear();
    dataCache.ziekteItems.clear();
    dataCache.currentCacheKey = null;
    dataCache.lastLoadedPeriod = null;
    console.log('🗑️ All cache data cleared');
}

/**
 * Wis cache voor een specifieke periode
 * @param {string} viewType - 'maand' of 'week'
 * @param {number} year - Het jaar
 * @param {number} monthOrWeek - Maand (0-11) of week nummer
 */
export function clearCacheForPeriod(viewType, year, monthOrWeek) {
    const cacheKey = generateCacheKey(viewType, year, monthOrWeek);
    
    dataCache.verlofItems.delete(cacheKey);
    dataCache.compensatieItems.delete(cacheKey);
    dataCache.zittingsvrijItems.delete(cacheKey);
    dataCache.ziekteItems.delete(cacheKey);
    
    console.log(`🗑️ Cache cleared for period: ${cacheKey}`);
}

/**
 * Get cache statistics voor debugging
 * @returns {Object} Cache statistieken
 */
export function getCacheStats() {
    return {
        currentCacheKey: dataCache.currentCacheKey,
        lastLoadedPeriod: dataCache.lastLoadedPeriod,
        cacheSize: {
            verlof: dataCache.verlofItems.size,
            compensatie: dataCache.compensatieItems.size,
            zittingsvrij: dataCache.zittingsvrijItems.size,
            ziekte: dataCache.ziekteItems.size
        },
        cachedPeriods: {
            verlof: Array.from(dataCache.verlofItems.keys()),
            compensatie: Array.from(dataCache.compensatieItems.keys()),
            zittingsvrij: Array.from(dataCache.zittingsvrijItems.keys()),
            ziekte: Array.from(dataCache.ziekteItems.keys())
        }
    };
}

/**
 * Wrapper functie voor SharePoint data loading met filtering
 * @param {Function} fetchFunction - De originele fetch functie (bijv. fetchSharePointList)
 * @param {string} listName - Naam van de SharePoint lijst
 * @param {string} listType - Type lijst voor filtering
 * @param {string} viewType - 'maand' of 'week'
 * @param {number} year - Het jaar
 * @param {number} monthOrWeek - Maand (0-11) of week nummer
 * @returns {Promise<Array>} Gefilterde data
 */
export async function loadFilteredData(fetchFunction, listName, listType, viewType, year, monthOrWeek) {
    const cacheKey = generateCacheKey(viewType, year, monthOrWeek);
    
    // Check cache eerst
    const cachedData = getCachedData(listType, cacheKey);
    if (cachedData) {
        return cachedData;
    }
    
    // Generate date range en filter
    const { startDate, endDate } = getCurrentPeriodDateRange(viewType, year, monthOrWeek);
    const filter = generateODataFilter(startDate, endDate, listType);
    
    try {
        let data;
        
        if (filter) {
            // Gebruik filter als het beschikbaar is
            console.log(`🔍 Loading ${listName} with filter for period ${cacheKey}`);
            
            // Bouw query parameters
            const queryParams = {
                $filter: filter,
                $top: 5000, // SharePoint limiet
                $orderby: 'StartDatum desc' // Nieuwste eerst
            };
            
            // Als de fetch functie query parameters ondersteunt
            if (fetchFunction.length > 1) {
                data = await fetchFunction(listName, queryParams);
            } else {
                // Fallback: load alles en filter lokaal (minder efficiënt)
                console.warn(`⚠️ Fetch function does not support query parameters, falling back to local filtering`);
                const allData = await fetchFunction(listName);
                data = filterDataLocally(allData, startDate, endDate, listType);
            }
        } else {
            // Geen filter beschikbaar, load alles
            console.log(`📥 Loading all ${listName} data (no filter available)`);
            data = await fetchFunction(listName);
        }
        
        // Cache de data
        cacheData(listType, data, cacheKey);
        
        console.log(`✅ Loaded ${data.length} items from ${listName} for period ${cacheKey}`);
        return data;
        
    } catch (error) {
        console.error(`❌ Error loading filtered data for ${listName}:`, error);
        
        // Fallback: probeer zonder filter
        try {
            console.log(`🔄 Fallback: loading ${listName} without filter`);
            const data = await fetchFunction(listName);
            const filteredData = filterDataLocally(data, startDate, endDate, listType);
            cacheData(listType, filteredData, cacheKey);
            return filteredData;
        } catch (fallbackError) {
            console.error(`❌ Fallback failed for ${listName}:`, fallbackError);
            return [];
        }
    }
}

/**
 * Filter data lokaal als server-side filtering niet mogelijk is
 * @param {Array} data - Alle data
 * @param {Date} startDate - Start datum filter
 * @param {Date} endDate - Eind datum filter
 * @param {string} listType - Type lijst
 * @returns {Array} Gefilterde data
 */
function filterDataLocally(data, startDate, endDate, listType) {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => {
        try {
            // Bepaal relevante datum velden gebaseerd op list type
            let itemStart, itemEnd;
            
            switch (listType.toLowerCase()) {
                case 'verlof':
                    itemStart = item.StartDatum ? new Date(item.StartDatum) : null;
                    itemEnd = item.EindDatum ? new Date(item.EindDatum) : itemStart;
                    break;
                    
                case 'compensatie':
                case 'compensatieuren':
                    itemStart = item.StartDatum ? new Date(item.StartDatum) : 
                               item.Datum ? new Date(item.Datum) : null;
                    itemEnd = item.EindDatum ? new Date(item.EindDatum) : itemStart;
                    break;
                    
                case 'zittingsvrij':
                    itemStart = item.StartDatum ? new Date(item.StartDatum) : null;
                    itemEnd = item.EindDatum ? new Date(item.EindDatum) : itemStart;
                    break;
                    
                case 'ziekte':
                case 'ziekmelding':
                    itemStart = item.StartDatum ? new Date(item.StartDatum) : null;
                    itemEnd = item.EindDatum ? new Date(item.EindDatum) : null; // Kan null zijn voor lopende ziektes
                    break;
                    
                default:
                    return true; // Als we het type niet kennen, behoud het item
            }
            
            // Als we geen valide start datum hebben, behoud het item
            if (!itemStart || isNaN(itemStart.getTime())) {
                return true;
            }
            
            // Check overlap: item overlapt als (item.start <= filter.end) EN (item.end >= filter.start)
            const overlapStart = itemStart <= endDate;
            const overlapEnd = !itemEnd || itemEnd >= startDate;
            
            return overlapStart && overlapEnd;
            
        } catch (error) {
            console.warn(`Error filtering item locally:`, error, item);
            return true; // Bij twijfel, behoud het item
        }
    });
}

/**
 * Debug functie om loading status te loggen
 */
export function logLoadingStatus() {
    const stats = getCacheStats();
    console.log('📊 Loading Logic Status:', stats);
    
    if (stats.lastLoadedPeriod) {
        const { viewType, year, monthOrWeek } = stats.lastLoadedPeriod;
        const { startDate, endDate } = getCurrentPeriodDateRange(viewType, year, monthOrWeek);
        console.log(`📅 Current period range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    }
}

// Export default object met alle functies voor gemakkelijke import
export default {
    getCurrentPeriodDateRange,
    generateODataFilter,
    shouldReloadData,
    updateCacheKey,
    cacheData,
    getCachedData,
    clearAllCache,
    clearCacheForPeriod,
    getCacheStats,
    loadFilteredData,
    logLoadingStatus
};