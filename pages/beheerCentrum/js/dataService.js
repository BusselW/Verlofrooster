/**
 * dataService.js - Service for SharePoint data operations
 * 
 * This module handles CRUD operations for SharePoint lists
 */

// Import core context
import { spContext } from './sharepointContext.js';

/**
 * Get items from a SharePoint list
 * @param {string} listName - The name of the list to fetch from
 * @param {string} selectFields - Fields to select (comma-separated)
 * @param {string} filterQuery - OData filter query
 * @param {string} orderBy - Order by field and direction (e.g., "Title asc")
 * @param {number} top - Maximum number of items to return
 * @returns {Promise<Array>} Array of list items
 */
async function getListItems(listName, selectFields = '*', filterQuery = '', orderBy = 'Id', top = 1000) {
    try {
        let url = `${spContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
        const queryParams = [];
        
        if (selectFields && selectFields !== '*') {
            queryParams.push(`$select=${selectFields}`);
        }
        
        if (filterQuery) {
            queryParams.push(`$filter=${filterQuery}`);
        }
        
        if (orderBy) {
            queryParams.push(`$orderby=${orderBy}`);
        }
        
        if (top) {
            queryParams.push(`$top=${top}`);
        }
        
        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.d.results;
    } catch (error) {
        console.error(`Fout bij ophalen items uit ${listName}:`, error);
        throw error;
    }
}

/**
 * Create a new item in a SharePoint list
 * @param {string} listName - The name of the list
 * @param {Object} itemData - Data for the new item
 * @returns {Promise<Object>} Created item
 */
async function createListItem(listName, itemData) {
    try {
        const url = `${spContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': spContext.requestDigest
            },
            body: JSON.stringify({ 
                '__metadata': { 'type': `SP.Data.${listName}ListItem` },
                ...itemData
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.d;
    } catch (error) {
        console.error(`Fout bij aanmaken item in ${listName}:`, error);
        throw error;
    }
}

/**
 * Update an existing item in a SharePoint list
 * @param {string} listName - The name of the list
 * @param {number} itemId - ID of the item to update
 * @param {Object} itemData - Updated data for the item
 * @returns {Promise<void>}
 */
async function updateListItem(listName, itemId, itemData) {
    try {
        const url = `${spContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': spContext.requestDigest,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'MERGE'
            },
            body: JSON.stringify({
                '__metadata': { 'type': `SP.Data.${listName}ListItem` },
                ...itemData
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Fout bij bijwerken item in ${listName}:`, error);
        throw error;
    }
}

/**
 * Delete an item from a SharePoint list
 * @param {string} listName - The name of the list
 * @param {number} itemId - ID of the item to delete
 * @returns {Promise<void>}
 */
async function deleteListItem(listName, itemId) {
    try {
        const url = `${spContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-RequestDigest': spContext.requestDigest,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'DELETE'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Fout bij verwijderen item uit ${listName}:`, error);
        throw error;
    }
}

/**
 * Get choice field options from a SharePoint list
 * @param {string} listName - The name of the list
 * @param {string} fieldName - The name of the choice field
 * @returns {Promise<Array<string>>} Array of choice options
 */
async function getChoiceFieldOptions(listName, fieldName) {
    try {
        const url = `${spContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/fields?$filter=EntityPropertyName eq '${fieldName}'`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.d.results.length === 0) {
            throw new Error(`Veld ${fieldName} niet gevonden in lijst ${listName}`);
        }
        
        const field = data.d.results[0];
        
        if (field.TypeAsString !== 'Choice' && field.TypeAsString !== 'MultiChoice') {
            throw new Error(`Veld ${fieldName} is geen keuzeveld (${field.TypeAsString})`);
        }
        
        return field.Choices.results;
    } catch (error) {
        console.error(`Fout bij ophalen keuzeopties voor ${fieldName} in ${listName}:`, error);
        throw error;
    }
}

/**
 * Get the user profile by login name
 * @param {string} loginName - The login name of the user
 * @returns {Promise<Object>} User profile data
 */
async function getUserProfile(loginName) {
     try {
         const url = `${spContext.siteUrl}/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='${encodeURIComponent(loginName)}'`;
        
         const response = await fetch(url, {
             method: 'GET',
             headers: {
                 'Accept': 'application/json;odata=verbose'
             }
         });
        
         if (!response.ok) {
             throw new Error(`Error ${response.status}: ${response.statusText}`);
         }
        
         const data = await response.json();
         return data.d;
     } catch (error) {
         console.error(`Fout bij ophalen van gebruikersprofiel voor ${loginName}:`, error);
         throw error;
     }
}

/**
 * Search for users in the site collection.
 * @param {string} query - The search term.
 * @returns {Promise<Array>} Array of user objects matching the query.
 */
async function searchSiteUsers(query) {
    if (!query || query.length < 3) {
        console.log('Query too short or empty:', query);
        return [];
    }
    
    try {
        console.log('Starting searchSiteUsers with query:', query);
        console.log('spContext:', spContext);
        
        if (!spContext.siteUrl) {
            throw new Error('SharePoint context not initialized - siteUrl is missing');
        }
        
        // Escape single quotes in query to prevent OData errors
        const escapedQuery = query.replace(/'/g, "''");
        
        // Search in Title (DisplayName), Email, and LoginName
        const filter = `(substringof('${escapedQuery}', Title) or substringof('${escapedQuery}', Email) or substringof('${escapedQuery}', LoginName))`;
        const url = `${spContext.siteUrl}/_api/web/siteusers?$filter=${filter}&$top=10&$select=Id,Title,Email,LoginName,PrincipalType`;

        console.log('Search URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Raw API response:', data);
        
        if (!data.d || !data.d.results) {
            console.error('Unexpected API response structure:', data);
            return [];
        }
        
        // Filter for users only (PrincipalType === 1) and exclude system accounts
        const users = data.d.results.filter(user => {
            const isUser = user.PrincipalType === 1;
            const isNotSystemAccount = !user.LoginName.includes('sharepoint\\system');
            console.log(`User ${user.Title}: isUser=${isUser}, isNotSystemAccount=${isNotSystemAccount}`);
            return isUser && isNotSystemAccount;
        });
        
        console.log('Filtered users:', users);
        console.log('Number of filtered users:', users.length);
        
        return users;
        
    } catch (error) {
        console.error('Primary search failed, trying alternative method...', error);
        
        try {
            // Try alternative search method
            const alternativeResults = await searchSiteUsersAlternative(query);
            console.log('Alternative search succeeded with', alternativeResults.length, 'results');
            return alternativeResults;
        } catch (alternativeError) {
            console.error('Alternative search also failed:', alternativeError);
            console.error('Error details:', {
                primaryError: error.message,
                alternativeError: alternativeError.message,
                query: query,
                spContext: spContext
            });
            // Return empty array instead of throwing to prevent UI break
            return [];
        }
    }
}

/**
 * Alternative search method using People Search API
 * @param {string} query - The search term.
 * @returns {Promise<Array>} Array of user objects matching the query.
 */
async function searchSiteUsersAlternative(query) {
    if (!query || query.length < 3) {
        return [];
    }
    
    try {
        console.log('Trying alternative search method...');
        
        // Use People Search API as fallback
        const encodedQuery = encodeURIComponent(query);
        const url = `${spContext.siteUrl}/_api/search/query?querytext='${encodedQuery}'&sourceid='b09a7990-05ea-4af9-81ef-edfab16c4e31'&selectproperties='PreferredName,WorkEmail,AccountName'&rowlimit=10`;
        
        console.log('Alternative search URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Alternative search failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Alternative search response:', data);
        
        if (data.d?.query?.PrimaryQueryResult?.RelevantResults?.Table?.Rows) {
            const users = data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.map(row => {
                const cells = row.Cells;
                const getCell = (key) => cells.find(cell => cell.Key === key)?.Value || '';
                
                return {
                    Id: Math.random(), // Generate temporary ID
                    Title: getCell('PreferredName'),
                    Email: getCell('WorkEmail'),
                    LoginName: getCell('AccountName'),
                    PrincipalType: 1
                };
            }).filter(user => user.Title && user.Email);
            
            console.log('Alternative search processed users:', users);
            return users;
        }
        
        return [];
        
    } catch (error) {
        console.error('Alternative search failed:', error);
        return [];
    }
}

/**
 * Test SharePoint connection and basic user data access
 * @returns {Promise<Object>} Test results
 */
async function testSharePointConnection() {
    try {
        console.log('Testing SharePoint connection...');
        console.log('Current spContext:', spContext);
        
        if (!spContext.siteUrl) {
            return { success: false, error: 'SharePoint context not initialized' };
        }
        
        // Test basic site access
        const testUrl = `${spContext.siteUrl}/_api/web`;
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!response.ok) {
            return { success: false, error: `Site access failed: ${response.status}` };
        }
        
        // Test user access
        const usersUrl = `${spContext.siteUrl}/_api/web/siteusers?$top=1`;
        const usersResponse = await fetch(usersUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        });
        
        if (!usersResponse.ok) {
            return { success: false, error: `Users access failed: ${usersResponse.status}` };
        }
        
        const usersData = await usersResponse.json();
        const userCount = usersData.d?.results?.length || 0;
        
        return { 
            success: true, 
            siteUrl: spContext.siteUrl,
            userCount: userCount,
            message: 'SharePoint connection successful'
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Export functions
export {
    getListItems,
    createListItem,
    updateListItem,
    deleteListItem,
    getChoiceFieldOptions,
    getUserProfile,
    searchSiteUsers,
    searchSiteUsersAlternative,
    testSharePointConnection
};