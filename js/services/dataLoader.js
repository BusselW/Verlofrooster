/**
 * @file dataLoader.js
 * @description Unified data loading orchestrator for the Verlofrooster application
 * Combines data fetching and transformation into a single streamlined interface
 * This is the main entry point that replaces refreshData and silentRefreshData
 */

import * as DataFetcher from './dataFetcher.js';
import * as DataTransformers from './dataTransformers.js';

/**
 * Load all data (fetch + transform) with a single function call
 * This replaces both refreshData and silentRefreshData functions
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchFunction - The fetchSharePointList function
 * @param {string} options.weergaveType - View type ('maand' or 'week')
 * @param {number} options.jaar - Current year
 * @param {number} options.periode - Current month (0-11) or week number
 * @param {boolean} options.forceReload - Force reload even if cache exists
 * @param {Object} options.currentUser - Current user object (for logging)
 * 
 * @returns {Promise<Object>} Object containing all transformed data ready for setState
 */
export async function loadAllData(options) {
    const {
        fetchFunction,
        weergaveType,
        jaar,
        periode,
        forceReload = false,
        currentUser = null
    } = options;
    
    // Log current user if provided
    if (currentUser) {
        console.log('👤 Current user from props:', currentUser);
    }
    
    // Fetch all raw data
    const rawData = await DataFetcher.fetchAllData(
        fetchFunction,
        weergaveType,
        jaar,
        periode,
        forceReload
    );
    
    console.log('✅ Data fetched successfully, processing...');
    
    // Transform all data
    const transformedData = DataTransformers.transformAllData(rawData);
    
    console.log('✅ Data processing complete!');
    
    return {
        ...transformedData,
        needsReload: rawData.needsReload
    };
}

/**
 * Load data with manual transformation control
 * Useful for cases where you need different transformation logic
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchFunction - The fetchSharePointList function
 * @param {string} options.weergaveType - View type ('maand' or 'week')
 * @param {number} options.jaar - Current year
 * @param {number} options.periode - Current month (0-11) or week number
 * @param {boolean} options.forceReload - Force reload even if cache exists
 * @param {Function} options.transformFunction - Custom transformation function
 * 
 * @returns {Promise<Object>} Object containing transformed data
 */
export async function loadDataWithCustomTransform(options) {
    const {
        fetchFunction,
        weergaveType,
        jaar,
        periode,
        forceReload = false,
        transformFunction
    } = options;
    
    // Fetch all raw data
    const rawData = await DataFetcher.fetchAllData(
        fetchFunction,
        weergaveType,
        jaar,
        periode,
        forceReload
    );
    
    console.log('✅ Data fetched successfully, applying custom transformation...');
    
    // Apply custom transformation
    const transformedData = transformFunction(rawData);
    
    console.log('✅ Custom transformation complete!');
    
    return {
        ...transformedData,
        needsReload: rawData.needsReload
    };
}

/**
 * Load only static data (no period filtering)
 * Useful for scenarios where you only need teams, shift types, etc.
 * 
 * @param {Function} fetchFunction - The fetchSharePointList function
 * @returns {Promise<Object>} Object containing transformed static data
 */
export async function loadStaticDataOnly(fetchFunction) {
    await DataFetcher.waitForConfiguration();
    
    const staticData = await DataFetcher.fetchStaticData(fetchFunction);
    const transformedData = DataTransformers.transformAllStaticData(staticData);
    
    return transformedData;
}

/**
 * Load only period-specific data (assumes static data already loaded)
 * Useful for incremental updates
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchFunction - The fetchSharePointList function
 * @param {string} options.weergaveType - View type ('maand' or 'week')
 * @param {number} options.jaar - Current year
 * @param {number} options.periode - Current month (0-11) or week number
 * @param {boolean} options.forceReload - Force reload even if cache exists
 * 
 * @returns {Promise<Object>} Object containing transformed period data
 */
export async function loadPeriodDataOnly(options) {
    const {
        fetchFunction,
        weergaveType,
        jaar,
        periode,
        forceReload = false
    } = options;
    
    const periodData = await DataFetcher.fetchPeriodData(
        fetchFunction,
        weergaveType,
        jaar,
        periode,
        forceReload
    );
    
    const transformedData = DataTransformers.transformAllPeriodData(periodData);
    
    return {
        ...transformedData,
        needsReload: periodData.needsReload
    };
}

export default {
    loadAllData,
    loadDataWithCustomTransform,
    loadStaticDataOnly,
    loadPeriodDataOnly
};
