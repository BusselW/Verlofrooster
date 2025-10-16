/**
 * User-related utility functions
 * Pure functions for user data processing and formatting
 */

/**
 * Get initials from a full name
 * @param {string} naam - Full name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitialen = (naam) => {
    if (!naam) return '';
    return naam.split(' ')
        .filter(d => d.length > 0)
        .map(d => d[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Get SharePoint profile photo URL for a user
 * @param {Object} gebruiker - User object with Username or LoginName
 * @param {string} grootte - Photo size ('S', 'M', 'L')
 * @returns {string} Profile photo URL or fallback URL
 */
export const getProfilePhotoUrl = (gebruiker, grootte = 'M') => {
    try {
        const loginName = gebruiker?.Username || gebruiker?.LoginName;
        if (!loginName) {
            console.warn('[getProfilePhotoUrl] No loginName found in user object:', gebruiker);
            return '_layouts/15/userphoto.aspx?size=S';
        }
        
        // Extract username from domain\username format or i:0#.w| format
        let usernameOnly = loginName;
        if (loginName.includes('\\')) {
            usernameOnly = loginName.split('\\')[1];
        } else if (loginName.startsWith('i:0#.w|')) {
            usernameOnly = loginName.substring(7);
            if (usernameOnly.includes('\\')) {
                usernameOnly = usernameOnly.split('\\')[1];
            }
        }
        
        // Get site URL from config
        const siteUrl = window.appConfiguratie?.instellingen?.siteUrl || 'https://som.org.om.local/sites/MulderT/CustomPW/Verlof';
        
        // Construct URL to SharePoint profile photo
        const photoUrl = `${siteUrl}/_layouts/15/userphoto.aspx?size=${grootte}&accountname=${usernameOnly}@org.om.local`;
        
        console.log('[getProfilePhotoUrl] Generated photo URL:', photoUrl);
        return photoUrl;
        
    } catch (error) {
        console.error('[getProfilePhotoUrl] Error generating photo URL:', error);
        return '_layouts/15/userphoto.aspx?size=S';
    }
};

console.log("User utilities loaded successfully.");
