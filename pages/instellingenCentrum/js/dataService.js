/**
 * dataService.js - Service for SharePoint data operations
 * 
 * This module handles CRUD operations for SharePoint lists
 */

// Import core context
import { sharePointContext } from './beheerCentrumN.js';

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
        let url = `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
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
        const url = `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': sharePointContext.requestDigest
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
        // First, get the item's metadata type
        const getItemResponse = await fetch(
            `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            }
        );
        
        if (!getItemResponse.ok) {
            throw new Error(`Error ${getItemResponse.status}: ${getItemResponse.statusText}`);
        }
        
        const itemDetails = await getItemResponse.json();
        const itemType = itemDetails.d.__metadata.type;
        
        // Now update the item
        const updateResponse = await fetch(
            `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': sharePointContext.requestDigest,
                    'X-HTTP-Method': 'MERGE',
                    'If-Match': itemDetails.d.__metadata.etag
                },
                body: JSON.stringify({
                    '__metadata': { 'type': itemType },
                    ...itemData
                })
            }
        );
        
        if (!updateResponse.ok) {
            throw new Error(`Error ${updateResponse.status}: ${updateResponse.statusText}`);
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
 * @returns {Promise<boolean>} Success status
 */
async function deleteListItem(listName, itemId) {
    try {
        // First, get the item's etag
        const getItemResponse = await fetch(
            `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose'
                }
            }
        );
        
        if (!getItemResponse.ok) {
            throw new Error(`Error ${getItemResponse.status}: ${getItemResponse.statusText}`);
        }
        
        const itemDetails = await getItemResponse.json();
        
        // Now delete the item
        const deleteResponse = await fetch(
            `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'X-RequestDigest': sharePointContext.requestDigest,
                    'X-HTTP-Method': 'DELETE',
                    'If-Match': itemDetails.d.__metadata.etag
                }
            }
        );
        
        if (!deleteResponse.ok) {
            throw new Error(`Error ${deleteResponse.status}: ${deleteResponse.statusText}`);
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
        const url = `${sharePointContext.siteUrl}/_api/web/lists/getbytitle('${listName}')/fields?$filter=EntityPropertyName eq '${fieldName}'`;
        
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

// Export functions
export {
    getListItems,
    createListItem,
    updateListItem,
    deleteListItem,
    getChoiceFieldOptions
};
