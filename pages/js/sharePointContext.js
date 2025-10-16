/**
 * sharePointContext.js - Shared SharePoint context and utilities
 * 
 * This module provides shared SharePoint connection context and utilities
 * that can be used across multiple admin modules (adminCentrum, beheerCentrum, etc.)
 */

// Global SharePoint context
export let sharePointContext = {
    siteUrl: '',
    requestDigest: ''
};

/**
 * Initialize SharePoint connection and get context
 * @returns {Promise<boolean>} Success status
 */
export async function initializeSharePointContext() {
    try {
        // Get site URL from global configuration or current location
        const siteUrl = CONFIG_GLOBAL?.SITE_URL || window.location.origin;
        
        // Get request digest for SharePoint REST API calls
        const digestResponse = await fetch(`${siteUrl}/_api/contextinfo`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!digestResponse.ok) {
            throw new Error('Kon geen verbinding maken met SharePoint');
        }
        
        const digestData = await digestResponse.json();
        const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
        
        // Update global context
        sharePointContext.siteUrl = siteUrl;
        sharePointContext.requestDigest = requestDigest;
        
        console.log('SharePoint context geïnitialiseerd');
        return true;
        
    } catch (error) {
        console.error('Fout bij initialiseren SharePoint context:', error);
        return false;
    }
}

/**
 * Get current SharePoint context
 * @returns {Object} Current SharePoint context
 */
export function getSharePointContext() {
    return sharePointContext;
}

/**
 * Update SharePoint context (used by modules that need to set context)
 * @param {Object} newContext - New context object
 */
export function setSharePointContext(newContext) {
    sharePointContext = { ...sharePointContext, ...newContext };
}

/**
 * Refresh request digest token
 * @returns {Promise<string>} New request digest token
 */
export async function refreshRequestDigest() {
    try {
        const digestResponse = await fetch(`${sharePointContext.siteUrl}/_api/contextinfo`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!digestResponse.ok) {
            throw new Error('Kon request digest niet vernieuwen');
        }
        
        const digestData = await digestResponse.json();
        const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
        
        sharePointContext.requestDigest = requestDigest;
        
        return requestDigest;
        
    } catch (error) {
        console.error('Fout bij vernieuwen request digest:', error);
        throw error;
    }
}

/**
 * Global configuration mapping for SharePoint lists
 */
export const LIJST_CONFIGURATIE = {
    'Medewerkers': 'Medewerkers',
    'DagenIndicators': 'DagenIndicators', 
    'keuzelijstFuncties': 'keuzelijstFuncties',
    'Verlofredenen': 'Verlofredenen',
    'Teams': 'Teams',
    'Seniors': 'Seniors',
    'UrenPerWeek': 'UrenPerWeek',
    'IncidenteelZittingVrij': 'IncidenteelZittingVrij',
    'CompensatieUren': 'CompensatieUren',
    'Verlof': 'Verlof'
};