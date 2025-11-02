/**
 * @file dataFetcher.js
 * @description Data fetching utilities for the Verlofrooster application
 * Provides centralized functions for loading static and period-specific SharePoint data
 * with smart caching and configuration waiting
 */

import * as LoadingLogic from './loadingLogic.js';

/**
 * Wait for the global appConfiguratie to be available with timeout
 * @param {number} maxAttempts - Maximum number of attempts (default: 50)
 * @param {number} delayMs - Delay between attempts in milliseconds (default: 100)
 * @returns {Promise<void>} Resolves when configuration is available
 * @throws {Error} If configuration not loaded after timeout
 */
export async function waitForConfiguration(maxAttempts = 50, delayMs = 100) {
    let attempts = 0;
    
    while (!window.appConfiguratie && attempts < maxAttempts) {
        console.log(`⏳ Waiting for appConfiguratie... attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempts++;
    }
    
    if (!window.appConfiguratie) {
        throw new Error('Configuration not loaded after timeout');
    }
    
    console.log('✅ Configuration available');
}

/**
 * Fetch all static SharePoint lists that don't change often
 * These lists are loaded on every data refresh regardless of period
 * @param {Function} fetchFunction - The fetchSharePointList function to use
 * @returns {Promise<Object>} Object containing all static data
 */
export async function fetchStaticData(fetchFunction) {
    console.log('📊 Fetching static SharePoint lists...');
    
    const [
        medewerkersData,
        teamsData,
        verlofredenenData,
        urenPerWeekData,
        dagenIndicatorsData
    ] = await Promise.all([
        fetchFunction('Medewerkers'),
        fetchFunction('Teams'),
        fetchFunction('Verlofredenen'),
        fetchFunction('UrenPerWeek'),
        fetchFunction('DagenIndicators')
    ]);
    
    console.log('✅ Static data fetched successfully');
    
    return {
        medewerkersData,
        teamsData,
        verlofredenenData,
        urenPerWeekData,
        dagenIndicatorsData
    };
}

/**
 * Fetch period-specific SharePoint data with smart filtering and caching
 * Uses LoadingLogic to determine if data needs to be reloaded or can use cache
 * @param {Function} fetchFunction - The fetchSharePointList function to use
 * @param {string} weergaveType - View type ('maand' or 'week')
 * @param {number} jaar - Current year
 * @param {number} periode - Current month (0-11) or week number
 * @param {boolean} forceReload - Force reload even if cache exists
 * @returns {Promise<Object>} Object containing period-specific data
 */
export async function fetchPeriodData(fetchFunction, weergaveType, jaar, periode, forceReload = false) {
    // Check if we need to reload data for the current period
    const needsReload = forceReload || LoadingLogic.shouldReloadData(weergaveType, jaar, periode);
    
    let verlofData, zittingsvrijData, compensatieUrenData;
    
    if (needsReload) {
        console.log('🔍 Loading period-specific data with filtering...');
        
        // Update cache key for current period
        LoadingLogic.updateCacheKey(weergaveType, jaar, periode);
        
        // Load filtered data for the current period
        [verlofData, zittingsvrijData, compensatieUrenData] = await Promise.all([
            LoadingLogic.loadFilteredData(
                fetchFunction,
                'Verlof',
                'verlof',
                weergaveType,
                jaar,
                periode
            ),
            LoadingLogic.loadFilteredData(
                fetchFunction,
                'IncidenteelZittingVrij',
                'zittingsvrij',
                weergaveType,
                jaar,
                periode
            ),
            LoadingLogic.loadFilteredData(
                fetchFunction,
                'CompensatieUren',
                'compensatie',
                weergaveType,
                jaar,
                periode
            )
        ]);
        
        // Log loading statistics
        LoadingLogic.logLoadingStatus();
        
    } else {
        console.log('✅ Using cached data for current period');
        
        // Use cached data
        verlofData = LoadingLogic.getCachedData('verlof') || [];
        zittingsvrijData = LoadingLogic.getCachedData('zittingsvrij') || [];
        compensatieUrenData = LoadingLogic.getCachedData('compensatie') || [];
        
        console.log(
            `📁 Using cached data: ${verlofData.length} verlof, ` +
            `${zittingsvrijData.length} zittingsvrij, ` +
            `${compensatieUrenData.length} compensatie items`
        );
    }
    
    return {
        verlofData,
        zittingsvrijData,
        compensatieUrenData,
        needsReload
    };
}

/**
 * Fetch all data (static + period-specific) in one call
 * This is the main entry point for data loading
 * @param {Function} fetchFunction - The fetchSharePointList function to use
 * @param {string} weergaveType - View type ('maand' or 'week')
 * @param {number} jaar - Current year
 * @param {number} periode - Current month (0-11) or week number
 * @param {boolean} forceReload - Force reload even if cache exists
 * @returns {Promise<Object>} Object containing all data
 */
export async function fetchAllData(fetchFunction, weergaveType, jaar, periode, forceReload = false) {
    console.log('🔄 Starting data fetch...');
    
    // Wait for configuration
    await waitForConfiguration();
    
    // Check if fetchSharePointList is available
    if (typeof fetchFunction !== 'function') {
        throw new Error('SharePoint service not available');
    }
    
    // Fetch static and period data in parallel for better performance
    const [staticData, periodData] = await Promise.all([
        fetchStaticData(fetchFunction),
        fetchPeriodData(fetchFunction, weergaveType, jaar, periode, forceReload)
    ]);
    
    console.log('✅ All data fetched successfully');
    
    return {
        ...staticData,
        ...periodData
    };
}

export default {
    waitForConfiguration,
    fetchStaticData,
    fetchPeriodData,
    fetchAllData
};
