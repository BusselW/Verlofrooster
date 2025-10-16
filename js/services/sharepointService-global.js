/**
 * @file sharepointService-global.js
 * @description Non-module version of sharepointService.js for use in non-module contexts.
 * Provides SharePoint service functions as global variables.
 */

// Create a fallback appConfiguratie if it doesn't exist
if (typeof window.appConfiguratie === "undefined") {
    console.warn("Creating fallback appConfiguratie object because it was not found");
    window.appConfiguratie = {
        instellingen: {
            debounceTimer: 300,
            siteUrl: ""  // Empty site URL will cause graceful fallbacks
        }
    };
}

// Immediately-invoked function expression to avoid polluting the global scope
(function() {
    /**
     * Fetches a SharePoint list using the app configuration
     * @param {string} lijstNaam - The name of the list as defined in appConfiguratie
     * @returns {Promise<Array>} A Promise with the list items or an empty array on error
     */
    async function fetchSharePointList(lijstNaam) {
        try {
            // Use ConfigHelper if available, otherwise fall back to direct access
            let lijstConfig = null;
            let siteUrl = "";
            
            if (window.ConfigHelper) {
                lijstConfig = window.ConfigHelper.getListConfig(lijstNaam);
                siteUrl = window.ConfigHelper.getSiteUrl();
            } else {
                // Use getLijstConfig for compatibility
                lijstConfig = window.getLijstConfig ? window.getLijstConfig(lijstNaam) : null;
                
                // If not found via getLijstConfig, try appConfiguratie
                if (!lijstConfig && window.appConfiguratie) {
                    lijstConfig = window.appConfiguratie[lijstNaam];
                }
                
                siteUrl = window.appConfiguratie?.instellingen?.siteUrl || "";
            }
            
            if (!lijstConfig) {
                console.warn(`Configuratie voor lijst '${lijstNaam}' niet gevonden. Fallback naar lege lijst.`);
                return [];
            }
            
            if (!siteUrl) {
                console.warn('SharePoint site URL niet gevonden. Fallback naar lege lijst.');
                return [];
            }

            const lijstTitel = lijstConfig.lijstTitel;
            const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstTitel}')/items?$top=5000`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=nometadata' },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                console.warn(`Fout bij ophalen van ${lijstNaam}: ${response.statusText}. Fallback naar lege lijst.`);
                return [];
            }
            
            const data = await response.json();
            return data.value || [];
        } catch (error) {
            console.error(`Fout bij ophalen van lijst ${lijstNaam}:`, error);
            console.warn('Fallback naar lege lijst vanwege fout.');
            return [];
        }
    }

    /**
     * Gets information about a SharePoint user based on their login name.
     * @param {string} loginName - The login name of the user, e.g., 'org\\username'.
     * @returns {Promise<object|null>} A Promise that resolves to user data or null if not found or on error.
     */
    async function getUserInfo(loginName) {
        if (!loginName) {
            console.warn("Ongeldige of ontbrekende loginName voor getUserInfo:", loginName);
            return null;
        }

        const siteUrl = window.ConfigHelper ? window.ConfigHelper.getSiteUrl() : (window.appConfiguratie?.instellingen?.siteUrl || "");
        if (!siteUrl) {
            console.warn("SiteUrl configuratie is niet beschikbaar.");
            return null;
        }
        
        // Handle different formats of loginName and try multiple approaches
        let processedLoginName = loginName;
        
        // If loginName doesn't contain \, try to construct it
        if (!loginName.includes('\\') && loginName.length > 0) {
            // Assume it's just the username part, try common domain
            processedLoginName = `org\\${loginName}`;
        }
        
        try {
            // Try with claim-based format
            const claimLoginName = `i:0#.w|${processedLoginName}`;
            const url = `${siteUrl.replace(/\/$/, '')}/_api/web/siteusers?$filter=LoginName eq '${encodeURIComponent(claimLoginName)}'`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=nometadata' },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                console.warn(`Fout bij ophalen van gebruiker ${loginName}: ${response.statusText}`);
                return null;
            }
            
            const data = await response.json();
            const user = data.value && data.value.length > 0 ? data.value[0] : null;
            
            if (user) {
                return {
                    Id: user.Id,
                    Title: user.Title,
                    Email: user.Email,
                    LoginName: user.LoginName,
                    PictureURL: user.Picture ? user.Picture.Url : null
                };
            }
            
            return null;
        } catch (error) {
            console.error(`Fout bij ophalen van gebruiker ${loginName}:`, error);
            return null;
        }
    }

    /**
     * Updates a SharePoint list item.
     * @param {string} lijstNaam - The name of the list as defined in appConfiguratie.
     * @param {number} itemId - The ID of the item to update.
     * @param {object} fields - The fields to update.
     * @returns {Promise<object|null>} A Promise that resolves to the updated item or null on error.
     */
    async function updateListItem(lijstNaam, itemId, fields) {
        try {
            // Use ConfigHelper if available, otherwise fall back to direct access
            let lijstConfig = null;
            let siteUrl = "";
            
            if (window.ConfigHelper) {
                lijstConfig = window.ConfigHelper.getListConfig(lijstNaam);
                siteUrl = window.ConfigHelper.getSiteUrl();
            } else {
                // Use getLijstConfig for compatibility
                lijstConfig = window.getLijstConfig ? window.getLijstConfig(lijstNaam) : null;
                
                // If not found via getLijstConfig, try appConfiguratie
                if (!lijstConfig && window.appConfiguratie) {
                    lijstConfig = window.appConfiguratie[lijstNaam];
                }
                
                siteUrl = window.appConfiguratie?.instellingen?.siteUrl || "";
            }
            
            if (!lijstConfig) {
                console.warn(`Configuratie voor lijst '${lijstNaam}' niet gevonden.`);
                return null;
            }
            
            if (!siteUrl) {
                console.warn('SharePoint site URL niet gevonden.');
                return null;
            }

            const lijstTitel = lijstConfig.lijstTitel;
            const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstTitel}')/items(${itemId})`;
            
            // Get request digest for form digest value (needed for POST/PATCH operations)
            const digestUrl = `${siteUrl.replace(/\/$/, "")}/_api/contextinfo`;
            const digestResponse = await fetch(digestUrl, {
                method: 'POST',
                headers: { 'Accept': 'application/json;odata=nometadata' },
                credentials: 'same-origin'
            });
            
            if (!digestResponse.ok) {
                throw new Error(`Fout bij ophalen van FormDigestValue: ${digestResponse.statusText}`);
            }
            
            const digestData = await digestResponse.json();
            const formDigestValue = digestData.FormDigestValue;
            
            // Prepare the fields for the update with proper OData metadata
            let entityTypeName = getEntityTypeName(lijstNaam);
            
            // Try to get the exact entity type from an existing item
            const exactEntityType = await getEntityTypeFromExistingItem(lijstNaam, itemId);
            
            const fieldsToUpdate = exactEntityType ? {
                "__metadata": { "type": exactEntityType },
                ...fields
            } : {
                "__metadata": { "type": `SP.Data.${entityTypeName}` },
                ...fields
            };
            
            console.log(`Updating item ${itemId} in ${lijstNaam}:`, {
                entityType: exactEntityType || `SP.Data.${entityTypeName}`,
                method: exactEntityType ? 'exact' : 'mapped',
                fieldsToUpdate
            });
            
            // Perform the update
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': formDigestValue
                },
                body: JSON.stringify(fieldsToUpdate),
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                // Get the response body for detailed error information
                let errorDetail = response.statusText;
                try {
                    const errorBody = await response.text();
                    if (errorBody) {
                        const errorData = JSON.parse(errorBody);
                        if (errorData.error && errorData.error.message) {
                            errorDetail = errorData.error.message.value || errorData.error.message;
                        } else if (errorData["odata.error"] && errorData["odata.error"].message) {
                            errorDetail = errorData["odata.error"].message.value || errorData["odata.error"].message;
                        }
                    }
                } catch (parseError) {
                    console.warn('Could not parse error response:', parseError);
                }
                
                console.error(`SharePoint update error details:`, {
                    status: response.status,
                    statusText: response.statusText,
                    itemId: itemId,
                    listName: lijstNaam,
                    fieldsToUpdate: fieldsToUpdate,
                    errorDetail: errorDetail
                });
                
                throw new Error(`Fout bij bijwerken van item in ${lijstNaam}: ${errorDetail}`);
            }
            
            console.log(`Successfully updated item ${itemId} in ${lijstNaam}`);
            return { success: true, itemId };
        } catch (error) {
            console.error(`Primary update method failed for ${lijstNaam}:`, error);
            
            // Try the fallback simple method
            console.log(`Attempting fallback simple update method for ${lijstNaam}...`);
            const fallbackResult = await updateListItemSimple(lijstNaam, itemId, fields);
            
            if (fallbackResult && fallbackResult.success) {
                console.log(`Fallback update successful for ${lijstNaam}`);
                return fallbackResult;
            } else {
                console.error(`Both update methods failed for ${lijstNaam}`);
                throw error; // Re-throw the original error
            }
        }
    }

    /**
     * Alternative update method without metadata type (fallback approach).
     * @param {string} lijstNaam - Name of the SharePoint list.
     * @param {number} itemId - ID of the item to update.
     * @param {object} fields - Fields to update.
     * @returns {Promise<object|null>} Result object or null on error.
     */
    async function updateListItemSimple(lijstNaam, itemId, fields) {
        try {
            const siteUrl = window.ConfigHelper ? window.ConfigHelper.getSiteUrl() : (window.appConfiguratie?.instellingen?.siteUrl || "");
            if (!siteUrl) {
                console.error("Site URL not found");
                return null;
            }

            const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${lijstNaam}')/items(${itemId})`;
            
            // Get form digest value
            const digestUrl = `${siteUrl}/_api/contextinfo`;
            const digestResponse = await fetch(digestUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                },
                credentials: 'same-origin'
            });
            
            if (!digestResponse.ok) {
                throw new Error(`Fout bij ophalen van FormDigestValue: ${digestResponse.statusText}`);
            }
            
            const digestData = await digestResponse.json();
            const formDigestValue = digestData.FormDigestValue;
            
            // Simple update without metadata (REST API approach)
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=nometadata',
                    'Content-Type': 'application/json',
                    'X-HTTP-Method': 'MERGE',
                    'IF-MATCH': '*',
                    'X-RequestDigest': formDigestValue
                },
                body: JSON.stringify(fields),
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorBody = await response.text();
                    if (errorBody) {
                        const errorData = JSON.parse(errorBody);
                        if (errorData.error && errorData.error.message) {
                            errorDetail = errorData.error.message.value || errorData.error.message;
                        }
                    }
                } catch (parseError) {
                    console.warn('Could not parse error response:', parseError);
                }
                
                throw new Error(`Simple update failed for ${lijstNaam}: ${errorDetail}`);
            }
            
            console.log(`Successfully updated item ${itemId} in ${lijstNaam} using simple method`);
            return { success: true, itemId };
            
        } catch (error) {
            console.error(`Simple update method failed for ${lijstNaam}:`, error);
            return null;
        }
    }

    /**
     * Gets information about the current SharePoint user.
     * @returns {Promise<object|null>} A Promise that resolves to current user data or null on error.
     */
    async function getCurrentUser() {
        try {
            const siteUrl = window.ConfigHelper ? window.ConfigHelper.getSiteUrl() : (window.appConfiguratie?.instellingen?.siteUrl || "");
            if (!siteUrl) {
                console.warn("SiteUrl configuratie is niet beschikbaar voor getCurrentUser.");
                return null;
            }
            
            const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/currentuser`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=nometadata' },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                console.warn(`Fout bij ophalen van huidige gebruiker: ${response.statusText}`);
                return null;
            }
            
            const currentUser = await response.json();
            console.log('Huidige gebruiker opgehaald:', currentUser);
            return currentUser;
        } catch (error) {
            console.error('Fout bij ophalen van huidige gebruiker:', error);
            return null;
        }
    }
    
    /**
     * Gets the proper SharePoint entity type name for a list.
     * @param {string} listName - The SharePoint list name.
     * @returns {string} The entity type name for OData metadata.
     */
    function getEntityTypeName(listName) {
        // Map list names to their SharePoint entity type names
        const entityTypeMap = {
            'Verlof': 'VerlofListItem',
            'CompensatieUren': 'CompensatieUrenListItem', 
            'IncidenteelZittingVrij': 'IncidenteelZittingVrijListItem',
            'Teams': 'TeamsListItem',
            'Medewerkers': 'MedewerkersListItem',
            'gebruikersInstellingen': 'GebruikersInstellingenListItem'
        };
        
        // Return mapped name or generate default
        return entityTypeMap[listName] || `${listName}ListItem`;
    }

    /**
     * Gets the proper entity type from an existing list item.
     * @param {string} listName - The SharePoint list name.
     * @param {number} itemId - The item ID to fetch metadata from.
     * @returns {Promise<string|null>} The entity type name or null if not found.
     */
    async function getEntityTypeFromExistingItem(listName, itemId) {
        try {
            const siteUrl = window.ConfigHelper ? window.ConfigHelper.getSiteUrl() : (window.appConfiguratie?.instellingen?.siteUrl || "");
            if (!siteUrl) return null;
            
            const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})?$select=__metadata`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.d && data.d.__metadata && data.d.__metadata.type) {
                    return data.d.__metadata.type;
                }
            }
        } catch (error) {
            console.warn('Could not fetch entity type from existing item:', error);
        }
        return null;
    }

    /**
     * Counts pending vacation requests ('Verlof/vakantie') with status 'Nieuw'
     * Excludes 'Ziekte' requests as specified
     * @returns {Promise<number>} Number of pending vacation requests
     */
    async function countPendingVacationRequests() {
        try {
            // Get both Verlof items and Verlofredenen to determine vacation vs sick leave
            const verlofItems = await fetchSharePointList('Verlof');
            const verlofredenen = await fetchSharePointList('Verlofredenen');
            
            if (!verlofItems || !verlofredenen) {
                console.warn('Could not fetch required lists for vacation count');
                return 0;
            }
            
            // Check if current user is org\busselw for debug mode
            const currentUser = await getCurrentUser();
            const isDebugUser = currentUser && (
                currentUser.LoginName?.toLowerCase().includes('busselw') ||
                currentUser.Email?.toLowerCase().includes('busselw')
            );
            
            // Find vacation-related reasons (exclude 'Ziekte')
            const vacationReasons = verlofredenen.filter(reason => 
                reason.Titel && !reason.Titel.toLowerCase().includes('ziekte')
            );
            
            const vacationReasonIds = vacationReasons.map(reason => reason.ID?.toString());
            const vacationReasonTitles = vacationReasons.map(reason => reason.Titel);
            
            if (isDebugUser) {
                console.log('🔍 DEBUG MODE for org\\busselw - Detailed vacation count analysis:');
                console.log('📋 Total verlof items found:', verlofItems.length);
                console.log('📝 Total verlofredenen found:', verlofredenen.length);
                console.log('🏖️ Vacation reasons (excluding Ziekte):', vacationReasons.map(r => ({ ID: r.ID, Titel: r.Titel })));
                console.log('🔢 Vacation reason IDs:', vacationReasonIds);
                console.log('📃 Vacation reason titles:', vacationReasonTitles);
                
                // Show all verlof items with detailed analysis
                console.log('📊 All verlof items analysis:');
                verlofItems.forEach((item, index) => {
                    const isNewStatus = item.Status === 'Nieuw';
                    const isVacationReason = item.RedenId && vacationReasonIds.includes(item.RedenId.toString()) ||
                                           item.Reden && vacationReasonTitles.some(title => 
                                               item.Reden.toLowerCase().includes(title.toLowerCase())
                                           );
                    const matchesFilters = isNewStatus && isVacationReason;
                    
                    console.log(`   ${index + 1}. ID: ${item.ID}`, {
                        Medewerker: item.Medewerker,
                        Status: item.Status,
                        Reden: item.Reden,
                        RedenId: item.RedenId,
                        StartDatum: item.StartDatum,
                        EindDatum: item.EindDatum,
                        isNewStatus,
                        isVacationReason,
                        matchesFilters: matchesFilters ? '✅ COUNTED' : '❌ EXCLUDED'
                    });
                });
            }
            
            // Count pending requests (Status = 'Nieuw') for vacation reasons only
            const pendingVacationItems = verlofItems.filter(item => {
                const isNewStatus = item.Status === 'Nieuw';
                const isVacationReason = item.RedenId && vacationReasonIds.includes(item.RedenId.toString()) ||
                                       item.Reden && vacationReasonTitles.some(title => 
                                           item.Reden.toLowerCase().includes(title.toLowerCase())
                                       );
                
                // For debugging - let's see all Status === 'Nieuw' items first
                if (isDebugUser && isNewStatus) {
                    console.log(`🔍 Found Nieuw status item:`, {
                        ID: item.ID,
                        Medewerker: item.Medewerker,
                        Status: item.Status,
                        Reden: item.Reden,
                        RedenId: item.RedenId,
                        isVacationReason
                    });
                }
                
                return isNewStatus && isVacationReason;
            });
            
            // Also count ALL 'Nieuw' items for comparison
            const allNewItems = verlofItems.filter(item => item.Status === 'Nieuw');
            
            if (isDebugUser) {
                console.log(`🔍 COMPARISON: All 'Nieuw' items: ${allNewItems.length}, Vacation 'Nieuw' items: ${pendingVacationItems.length}`);
            }
            
            // Temporarily use all 'Nieuw' items to see if badge shows up
            const pendingVacationCount = isDebugUser ? allNewItems.length : pendingVacationItems.length;
            
            if (isDebugUser) {
                console.log('🎯 FINAL RESULTS:');
                console.log(`   Total pending vacation requests: ${pendingVacationCount}`);
                console.log('   Counted items:', pendingVacationItems.map(item => ({
                    ID: item.ID,
                    Medewerker: item.Medewerker,
                    Status: item.Status,
                    Reden: item.Reden,
                    StartDatum: item.StartDatum,
                    EindDatum: item.EindDatum
                })));
            } else {
                console.log(`Found ${pendingVacationCount} pending vacation requests`);
            }
            
            return pendingVacationCount;
            
        } catch (error) {
            console.error('Error counting pending vacation requests:', error);
            return 0;
        }
    }

    // Expose functions to global scope
    window.SharePointService = {
        fetchSharePointList,
        getUserInfo,
        getCurrentUser,
        updateListItem,
        updateListItemSimple,
        getEntityTypeName,
        getEntityTypeFromExistingItem,
        countPendingVacationRequests
    };
})();