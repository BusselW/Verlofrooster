/**
 * @file crudPermissionService.js
 * @description Centralized CRUD permission validation service with VVD/VVM/VVO restrictions
 * This service ensures that employees can add, edit, and delete items but not VVD/VVM/VVO types
 */

import { canManageOthersEvents } from '../ui/ContextMenu.js';
import { getCurrentUserInfo } from './sharepointService.js';

/**
 * Check if an item type is restricted (VVD/VVM/VVO work schedule types)
 * @param {object} item - The item to check
 * @returns {boolean} True if item is restricted
 */
export const isRestrictedItemType = (item) => {
    if (!item) return false;
    
    // Check for UrenPerWeek items with restricted day types
    if (item.MaandagSoort || item.DinsdagSoort || item.WoensdagSoort || 
        item.DonderdagSoort || item.VrijdagSoort) {
        const restrictedTypes = ['VVD', 'VVM', 'VVO'];
        
        const dayTypes = [
            item.MaandagSoort,
            item.DinsdagSoort, 
            item.WoensdagSoort,
            item.DonderdagSoort,
            item.VrijdagSoort
        ].filter(type => type);
        
        return dayTypes.some(type => restrictedTypes.includes(type));
    }
    
    // Check for form data containing restricted types
    if (item.dayType && ['VVD', 'VVM', 'VVO'].includes(item.dayType)) {
        return true;
    }
    
    return false;
};

/**
 * Check if current user can perform CRUD operation on an item
 * @param {string} operation - 'create', 'update', or 'delete'
 * @param {object} item - The item (for update/delete) or item data (for create)
 * @param {string} currentUsername - Current user's username (optional, will be fetched)
 * @returns {Promise<{allowed: boolean, reason: string}>} Permission result
 */
export const checkCRUDPermission = async (operation, item, currentUsername = null) => {
    console.log(`🔍 checkCRUDPermission: ${operation}`, { item, currentUsername });
    
    try {
        // Get current user if not provided
        if (!currentUsername) {
            const currentUser = await getCurrentUserInfo();
            currentUsername = currentUser?.LoginName?.split('|')[1] || currentUser?.LoginName;
        }
        
        if (!currentUsername) {
            return { 
                allowed: false, 
                reason: 'Gebruikersinformatie niet beschikbaar' 
            };
        }
        
        // Check if item is restricted type
        const isRestricted = isRestrictedItemType(item);
        console.log(`🚫 Item is restricted type (VVD/VVM/VVO): ${isRestricted}`);
        
        if (isRestricted) {
            const hasPrivilegedAccess = await canManageOthersEvents();
            console.log(`🔐 User has privileged access: ${hasPrivilegedAccess}`);
            
            if (!hasPrivilegedAccess) {
                return {
                    allowed: false,
                    reason: 'VVD/VVM/VVO werkrooster items kunnen alleen door administrators worden gewijzigd'
                };
            }
            
            // Privileged users can do anything with restricted items
            return { allowed: true, reason: 'Administrator rechten' };
        }
        
        // For non-restricted items, check ownership and privileges
        const hasPrivilegedAccess = await canManageOthersEvents();
        
        if (hasPrivilegedAccess) {
            return { allowed: true, reason: 'Administrator rechten' };
        }
        
        // Check ownership for update/delete operations
        if (operation === 'update' || operation === 'delete') {
            const itemOwner = item.MedewerkerID || item.Gebruikersnaam;
            const isOwnItem = itemOwner === currentUsername;
            
            console.log(`👤 Ownership check:`, { itemOwner, currentUsername, isOwnItem });
            
            if (!isOwnItem) {
                return {
                    allowed: false,
                    reason: 'Je kunt alleen je eigen items bewerken of verwijderen'
                };
            }
        }
        
        // For create operations, check if user is trying to create for someone else
        if (operation === 'create') {
            const targetUser = item.MedewerkerID || item.Gebruikersnaam;
            if (targetUser && targetUser !== currentUsername) {
                return {
                    allowed: false,
                    reason: 'Je kunt alleen items voor jezelf aanmaken'
                };
            }
        }
        
        return { allowed: true, reason: 'Eigen item' };
        
    } catch (error) {
        console.error('❌ Error checking CRUD permission:', error);
        return { 
            allowed: false, 
            reason: 'Fout bij controleren van rechten' 
        };
    }
};

/**
 * Validate form data before submission
 * @param {object} formData - Form data to validate
 * @param {string} operation - 'create' or 'update'
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
export const validateFormSubmission = async (formData, operation = 'create') => {
    console.log(`📝 validateFormSubmission: ${operation}`, formData);
    
    const errors = [];
    
    try {
        // Check CRUD permissions
        const permissionCheck = await checkCRUDPermission(operation, formData);
        
        if (!permissionCheck.allowed) {
            errors.push(permissionCheck.reason);
        }
        
        // Additional validation rules can be added here
        // For example, required field validation, date validation, etc.
        
        return {
            valid: errors.length === 0,
            errors
        };
        
    } catch (error) {
        console.error('❌ Error validating form submission:', error);
        return {
            valid: false,
            errors: ['Fout bij valideren van formuliergegevens']
        };
    }
};

/**
 * Show user-friendly error message for CRUD restrictions
 * @param {string} operation - The attempted operation
 * @param {string} reason - The restriction reason
 */
export const showCRUDRestrictionMessage = (operation, reason) => {
    const operationText = {
        'create': 'aanmaken',
        'update': 'bewerken', 
        'delete': 'verwijderen'
    };
    
    const message = `Kan item niet ${operationText[operation]}: ${reason}`;
    
    // Use NotificationSystem if available, fallback to console
    if (window.NotificationSystem) {
        window.NotificationSystem.error(message, 'Toegang geweigerd');
    } else {
        console.warn(`🚫 CRUD Restriction: ${message}`);
    }
};

/**
 * Wrapper for safe CRUD operations with permission checking
 * @param {string} operation - 'create', 'update', or 'delete'
 * @param {Function} crudFunction - The actual CRUD function to call
 * @param {object} item - Item data
 * @param {...any} args - Additional arguments for the CRUD function
 * @returns {Promise<any>} Operation result or throws error
 */
export const safeCRUDOperation = async (operation, crudFunction, item, ...args) => {
    console.log(`🔒 safeCRUDOperation: ${operation}`, { item, args });
    
    try {
        // Check permissions first
        const permissionCheck = await checkCRUDPermission(operation, item);
        
        if (!permissionCheck.allowed) {
            showCRUDRestrictionMessage(operation, permissionCheck.reason);
            throw new Error(permissionCheck.reason);
        }
        
        // Perform the operation
        console.log(`✅ Permission granted, performing ${operation}`);
        return await crudFunction(item, ...args);
        
    } catch (error) {
        console.error(`❌ Error in safe ${operation} operation:`, error);
        throw error;
    }
};

console.log('✅ CRUD Permission Service loaded successfully.');