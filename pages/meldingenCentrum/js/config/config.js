
const getSiteUrl = () => {
    // Try to get from global config if available
    if (window.appConfiguratie?.instellingen?.siteUrl) {
        return window.appConfiguratie.instellingen.siteUrl;
    }
    
    // Try to derive from current location
    const currentUrl = window.location.href;
    const baseUrlPattern = /^(https?:\/\/[^\/]+\/sites\/[^\/]+\/[^\/]+\/[^\/]+)/;
    const match = currentUrl.match(baseUrlPattern);
    
    if (match) {
        return match[1] + '/';
    }
    
    // Fallback to hardcoded default
    return "https://som.org.om.local/sites/MulderT/CustomPW/Verlof/";
};

export const config = {
    siteUrl: getSiteUrl(),
    listName: "MeldFouten",
    privilegedGroups: ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6 Roosteraars", "2.3. Senioren beoordelen", "2.4. Senioren administratie"],
    statusOptions: ["Nieuw", "In behandeling", "Afgesloten"]
};
