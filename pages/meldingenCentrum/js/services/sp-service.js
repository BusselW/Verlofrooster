
import { config } from '../config/config.js';

const buildUrl = (endpoint) => `${config.siteUrl.replace(/\/$/, '')}/_api/web/${endpoint}`;

// Get request digest for SharePoint operations
const getRequestDigest = async () => {
    try {
        const response = await fetch(`${config.siteUrl.replace(/\/$/, '')}/_api/contextinfo`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=nometadata'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get request digest: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.FormDigestValue;
    } catch (error) {
        console.error('Error getting request digest:', error);
        throw error;
    }
};

const getRequest = async (endpoint) => {
    try {
        const response = await fetch(buildUrl(endpoint), {
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=nometadata'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Fout bij ophalen van data: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.value || data;
    } catch (error) {
        console.error('Error in getRequest:', error);
        throw error;
    }
};

const postRequest = async (endpoint, payload) => {
    try {
        const digest = await getRequestDigest();
        
        const response = await fetch(buildUrl(endpoint), {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;odata=nometadata',
                'X-RequestDigest': digest
            },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fout bij posten van data: ${response.statusText} - ${errorText}`);
        }
        
        return response.json();
    } catch (error) {
        console.error('Error in postRequest:', error);
        throw error;
    }
};

const updateRequest = async (endpoint, payload) => {
    try {
        const digest = await getRequestDigest();
        
        const response = await fetch(buildUrl(endpoint), {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;odata=nometadata',
                'X-RequestDigest': digest,
                'X-HTTP-Method': 'MERGE',
                'If-Match': '*'
            },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fout bij updaten van data: ${response.statusText} - ${errorText}`);
        }
        
        return response;
    } catch (error) {
        console.error('Error in updateRequest:', error);
        throw error;
    }
};

const deleteRequest = async (endpoint) => {
    try {
        const digest = await getRequestDigest();
        
        const response = await fetch(buildUrl(endpoint), {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=nometadata',
                'X-RequestDigest': digest,
                'X-HTTP-Method': 'DELETE',
                'If-Match': '*'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fout bij verwijderen van data: ${response.statusText} - ${errorText}`);
        }
        
        return response;
    } catch (error) {
        console.error('Error in deleteRequest:', error);
        throw error;
    }
};

// Get all feedback items with Author information
export const getFeedbackItems = async () => {
    try {
        return await getRequest(
            `lists/getbytitle('${config.listName}')/items?$select=Id,Title,FoutBeschrijving,Status,Reactie,Created,Modified,Author/Title,Editor/Title&$expand=Author,Editor&$orderby=Created desc`
        );
    } catch (error) {
        console.error('Error fetching feedback items:', error);
        return [];
    }
};

// Add new feedback item
export const addFeedbackItem = async (title, beschrijving) => {
    try {
        const listTitle = config.listName;
        // For MeldFouten list, the metadata type should be SP.Data.MeldFoutenListItem
        const metadataType = `SP.Data.${listTitle}ListItem`;
        
        return await postRequest(`lists/getbytitle('${listTitle}')/items`, {
            '__metadata': { 'type': metadataType },
            'Title': title,
            'Beschrijving_x0020_fout': beschrijving,
            'Status': 'Nieuw',
            'WaarFout': 'Meldingencentrum'
        });
    } catch (error) {
        console.error('Error adding feedback item:', error);
        throw error;
    }
};

// Update feedback item
export const updateFeedbackItem = async (id, data) => {
    try {
        const listTitle = config.listName;
        const metadataType = `SP.Data.${listTitle}ListItem`;
        
        const payload = {
            '__metadata': { 'type': metadataType },
            ...data
        };
        
        return await updateRequest(`lists/getbytitle('${listTitle}')/items(${id})`, payload);
    } catch (error) {
        console.error('Error updating feedback item:', error);
        throw error;
    }
};

// Delete feedback item
export const deleteFeedbackItem = async (id) => {
    try {
        return await deleteRequest(`lists/getbytitle('${config.listName}')/items(${id})`);
    } catch (error) {
        console.error('Error deleting feedback item:', error);
        throw error;
    }
};

// Get current user
export const getCurrentUser = async () => {
    try {
        return await getRequest('currentuser');
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Check if user is in a specific group
export const checkUserInGroup = async (groupName) => {
    try {
        const user = await getCurrentUser();
        if (!user || !user.Id) {
            return false;
        }
        
        const groups = await getRequest(`siteusers/getbyid(${user.Id})/groups`);
        return Array.isArray(groups) && groups.some(group => group.Title === groupName);
    } catch (error) {
        console.error('Error checking user group:', error);
        return false;
    }
};

// Check if current user has privileged access
export const isCurrentUserPrivileged = async () => {
    try {
        for (const groupName of config.privilegedGroups) {
            if (await checkUserInGroup(groupName)) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking privileges:', error);
        return false;
    }
};
