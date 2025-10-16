
import { config } from '../config/config.js';

const buildUrl = (endpoint) => `${config.siteUrl}_api/web/${endpoint}`;

const getRequest = async (endpoint) => {
    const response = await fetch(buildUrl(endpoint), {
        headers: {
            'Accept': 'application/json;odata=verbose',
            'X-RequestDigest': document.getElementById('__REQUESTDIGEST').value
        }
    });
    if (!response.ok) throw new Error(`Fout bij ophalen van data: ${response.statusText}`);
    const data = await response.json();
    return data.d.results || data.d;
};

const postRequest = async (endpoint, payload) => {
    const response = await fetch(buildUrl(endpoint), {
        method: 'POST',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': document.getElementById('__REQUESTDIGEST').value
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Fout bij posten van data: ${response.statusText}`);
    return response;
};

const updateRequest = async (endpoint, payload) => {
    const response = await fetch(buildUrl(endpoint), {
        method: 'POST',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': document.getElementById('__REQUESTDIGEST').value,
            'X-HTTP-Method': 'MERGE',
            'If-Match': '*'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Fout bij updaten van data: ${response.statusText}`);
    return response;
};

const deleteRequest = async (endpoint) => {
    const response = await fetch(buildUrl(endpoint), {
        method: 'POST',
        headers: {
            'Accept': 'application/json;odata=verbose',
            'X-RequestDigest': document.getElementById('__REQUESTDIGEST').value,
            'X-HTTP-Method': 'DELETE',
            'If-Match': '*'
        }
    });
    if (!response.ok) throw new Error(`Fout bij verwijderen van data: ${response.statusText}`);
    return response;
};

export const getFeedbackItems = () => getRequest(`lists/getbytitle('${config.listName}')/items?$select=Id,Title,Feedback,Status,Antwoorden,Author/Title&$expand=Author`);

export const addFeedbackItem = (title, feedback) => postRequest(`lists/getbytitle('${config.listName}')/items`, {
    '__metadata': { 'type': `SP.Data.${config.listName}ListItem` },
    Title: title,
    Feedback: feedback,
    Status: 'Nieuw'
});

export const updateFeedbackItem = (id, data) => updateRequest(`lists/getbytitle('${config.listName}')/items(${id})`, {
    '__metadata': { 'type': `SP.Data.${config.listName}ListItem` },
    ...data
});

export const deleteFeedbackItem = (id) => deleteRequest(`lists/getbytitle('${config.listName}')/items(${id})`);

export const getCurrentUser = () => getRequest('currentuser');

export const checkUserInGroup = async (groupName) => {
    const user = await getCurrentUser();
    const groups = await getRequest(`users/getbyid(${user.Id})/groups`);
    return groups.some(group => group.Title === groupName);
};

export const isCurrentUserPrivileged = async () => {
    for (const groupName of config.privilegedGroups) {
        if (await checkUserInGroup(groupName)) {
            return true;
        }
    }
    return false;
};
