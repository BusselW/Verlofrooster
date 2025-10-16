/**
 * sharepointContext.js - Manages the SharePoint connection context.
 * This module initializes the connection and provides the context
 * (siteUrl, requestDigest) to other services.
 */

// The context object that will be shared
export const spContext = {
    siteUrl: null,
    requestDigest: null,
    initialized: false,
};

/**
 * Initializes the SharePoint context by fetching the site URL and request digest.
 * It uses the global `appConfiguratie` object set by `configLijst.js`.
 * @returns {Promise<boolean>} True if initialization was successful, false otherwise.
 */
export async function initializeSharePointContext() {
    if (spContext.initialized) {
        console.log('SharePoint context already initialized.');
        return true;
    }

    try {
        // Use the siteUrl from the global config, or fallback to the current origin.
        const siteUrl = window.appConfiguratie?.instellingen?.siteUrl;
        if (!siteUrl) {
            throw new Error('SharePoint site URL not found in appConfiguratie.');
        }

        const response = await fetch(`${siteUrl}/_api/contextinfo`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
            },
        });

        if (!response.ok) {
            throw new Error(`SharePoint context request failed with status ${response.status}`);
        }

        const data = await response.json();
        const requestDigest = data.d.GetContextWebInformation.FormDigestValue;

        // Update the shared context object
        spContext.siteUrl = siteUrl;
        spContext.requestDigest = requestDigest;
        spContext.initialized = true;

        console.log('SharePoint context initialized successfully.');
        return true;

    } catch (error) {
        console.error('Failed to initialize SharePoint context:', error);
        return false;
    }
}
