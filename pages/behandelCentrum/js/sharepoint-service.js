import { appConfig } from './config.js';

class SharePointService {
    constructor() {
        this.siteUrl = appConfig.sharePoint.siteUrl;
        this.requestDigest = null;
    }

    async initialize() {
        try {
            const contextUrl = `${this.siteUrl}_api/contextinfo`;
            const response = await fetch(contextUrl, {
                method: "POST",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose"
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to get request digest: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            this.requestDigest = data.d.GetContextWebInformation.FormDigestValue;
            return true;
        } catch (error) {
            console.error("Error initializing SharePoint context:", error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const response = await fetch(`${this.siteUrl}_api/web/currentuser`, {
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                return data.d;
            }
            return null;
        } catch (error) {
            console.warn("Could not get current user:", error);
            return null;
        }
    }

    async getListItems(listName, selectFields = "", filterQuery = "", orderBy = "") {
        try {
            let apiUrl = `${this.siteUrl}_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items`;
            const params = [];

            if (selectFields) params.push(`$select=${selectFields}`);
            if (filterQuery) params.push(`$filter=${filterQuery}`);
            if (orderBy) params.push(`$orderby=${orderBy}`);
            params.push('$top=5000');

            if (params.length > 0) {
                apiUrl += `?${params.join('&')}`;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose"
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error response for ${listName}:`, response.status, errorText);
                throw new Error(`Failed to get ${listName}: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return data.d.results;
        } catch (error) {
            console.error(`Error getting ${listName}:`, error);
            throw error;
        }
    }

    async updateListItem(listName, itemId, itemData) {
        try {
            const getUrl = `${this.siteUrl}_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items(${itemId})`;
            const getResponse = await fetch(getUrl, {
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose"
                },
                credentials: 'same-origin'
            });

            if (!getResponse.ok) {
                throw new Error(`Cannot get item ${itemId}: ${getResponse.status}`);
            }

            const currentItem = await getResponse.json();
            const metadata = currentItem.d.__metadata;

            const updateData = {
                __metadata: metadata,
                ...itemData
            };

            const updateUrl = `${this.siteUrl}_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items(${itemId})`;

            const response = await fetch(updateUrl, {
                method: "POST",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-RequestDigest": this.requestDigest,
                    "IF-MATCH": "*",
                    "X-HTTP-Method": "MERGE"
                },
                credentials: 'same-origin',
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error updating item ${itemId}:`, response.status, errorText);
                throw new Error(`Error updating item: ${response.status} - ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error("Error updating item:", error);
            throw error;
        }
    }
}

export const sharepointService = new SharePointService();