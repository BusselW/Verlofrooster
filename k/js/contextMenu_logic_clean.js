/**
 * Enhanced Context Menu Logic voor Verlofrooster
 * Handles right-click menu functionality with admin permissions and range selection
 * 
 * Features:
 * 1. Context menu visible at all times (positioned based on right-click)
 * 2. Permission-based button enabling/disabling
 * 3. Range selection for multiple days
 * 4. Comment editing functionality
 * 5. Fixed edit and delete functionality
 */

// Global variables
let selectedRange = {
    start: null,
    end: null,
    medewerker: null,
    cells: []
};

let contextMenuData = {
    eventId: null,
    eventType: null,
    ownerUsername: null,
    clickedCell: null,
    targetMedewerker: null
};

let isRangeSelectionMode = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeContextMenu();
    console.log("Enhanced Context Menu Logic Initialized.");
});

/**
 * Initialize the context menu functionality
 */
function initializeContextMenu() {
    const roosterContainer = document.getElementById('rooster-data-rows');
    const contextMenu = document.getElementById('rooster-context-menu');

    if (!roosterContainer || !contextMenu) {
        console.error("Context menu of rooster container niet gevonden.");
        return;
    }

    // Initialize event listeners
    setupContextMenuListeners(roosterContainer, contextMenu);
    setupMenuItemListeners();
    setupRangeSelection(roosterContainer);
    
    // Hide menu on outside clicks
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });
}

/**
 * Setup context menu event listeners
 */
function setupContextMenuListeners(roosterContainer, contextMenu) {
    // Right-click event on calendar cells
    roosterContainer.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('day-cell')) {
            const targetMedewerker = getMedewerkerFromCell(e.target);
            const eventData = getEventDataFromCell(e.target);
            
            handleContextMenu(e, { naam: targetMedewerker, username: targetMedewerker }, eventData);
        }
    });
}

/**
 * Setup menu item click listeners
 */
function setupMenuItemListeners() {
    const bewerkItem = document.getElementById('bewerk-item');
    const verwijderItem = document.getElementById('verwijder-item');
    const nieuweItem = document.getElementById('nieuwe-item');
    const commentaarItem = document.getElementById('commentaar-item');

    if (bewerkItem) {
        bewerkItem.addEventListener('click', handleEditEvent);
    }

    if (verwijderItem) {
        verwijderItem.addEventListener('click', handleDeleteEvent);
    }

    if (nieuweItem) {
        nieuweItem.addEventListener('click', handleNieuweToevoegen);
    }

    if (commentaarItem) {
        commentaarItem.addEventListener('click', handleCommentaarBewerken);
    }
}

/**
 * Get event data from a cell element
 */
function getEventDataFromCell(cell) {
    // Extract event data from data attributes or event elements within the cell
    const eventElement = cell.querySelector('.event');
    if (!eventElement) return null;

    return {
        id: eventElement.dataset.eventId || eventElement.getAttribute('data-event-id'),
        type: eventElement.dataset.eventType || eventElement.getAttribute('data-event-type'),
        ownerUsername: eventElement.dataset.ownerUsername || eventElement.getAttribute('data-owner-username')
    };
}

/**
 * Handle right-click context menu
 */
function handleContextMenu(e, targetMedewerker, eventData) {
    e.preventDefault();
    
    contextMenuData.targetMedewerker = targetMedewerker;
    contextMenuData.clickedCell = e.target;
    
    if (eventData) {
        contextMenuData.eventId = eventData.id;
        contextMenuData.eventType = eventData.type;
        contextMenuData.ownerUsername = eventData.ownerUsername;
    } else {
        contextMenuData.eventId = null;
        contextMenuData.eventType = null;
        contextMenuData.ownerUsername = null;
    }

    positionAndShowContextMenu(e);
    updateMenuButtonStates();
}

/**
 * Position and show the context menu
 */
function positionAndShowContextMenu(e) {
    const contextMenu = document.getElementById('rooster-context-menu');
    if (!contextMenu) return;

    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.display = 'block';
    contextMenu.style.visibility = 'visible';
}

/**
 * Hide context menu
 */
function hideContextMenu() {
    const contextMenu = document.getElementById('rooster-context-menu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
        contextMenu.style.visibility = 'hidden';
    }
    clearPreviousSelection();
}

/**
 * Clear previous selection highlighting
 */
function clearPreviousSelection() {
    document.querySelectorAll('.day-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    selectedRange = {
        start: null,
        end: null,
        medewerker: null,
        cells: []
    };
    
    isRangeSelectionMode = false;
}

/**
 * Update menu button states based on permissions and selection
 */
function updateMenuButtonStates() {
    const bewerkItem = document.getElementById('bewerk-item');
    const verwijderItem = document.getElementById('verwijder-item');
    const nieuweItem = document.getElementById('nieuwe-item');
    const commentaarItem = document.getElementById('commentaar-item');

    const isAdmin = checkAdminRights();
    const isOwnEvent = checkIsOwnEvent();
    const hasEvent = contextMenuData.eventId !== null;
    const hasSelection = selectedRange.cells.length > 0;

    // Special permissions check for events
    let canEditThisEvent = false;
    if (hasEvent) {
        canEditThisEvent = isAdmin || isOwnEvent;
    }

    // Reset all items
    [bewerkItem, verwijderItem, nieuweItem, commentaarItem].forEach(item => {
        if (item) {
            item.classList.remove('disabled');
            item.style.display = 'block';
        }
    });

    // Logic for edit button
    if (bewerkItem) {
        if (hasEvent && canEditThisEvent) {
            bewerkItem.classList.remove('disabled');
        } else {
            bewerkItem.classList.add('disabled');
        }
    }

    // Logic for delete button
    if (verwijderItem) {
        if (hasEvent && canEditThisEvent) {
            verwijderItem.classList.remove('disabled');
        } else {
            verwijderItem.classList.add('disabled');
        }
    }

    // Logic for add new button - permissions based on target cell/user
    if (nieuweItem) {
        let canAddNew = true;
        
        if (contextMenuData.targetMedewerker && !isAdmin) {
            // Non-admin can only add to their own calendar
            if (contextMenuData.targetMedewerker.username !== window.huidigeGebruiker?.normalizedUsername) {
                canAddNew = false;
            }
        }
        
        if (canAddNew) {
            nieuweItem.classList.remove('disabled');
        } else {
            nieuweItem.classList.add('disabled');
        }
    }

    // Logic for comment button
    if (commentaarItem) {
        if (canEditThisEvent) {
            commentaarItem.classList.remove('disabled');
        } else {
            commentaarItem.classList.add('disabled');
        }
    }
}

/**
 * Check if current user has admin rights
 */
function checkAdminRights() {
    if (!window.huidigeGebruiker || !window.huidigeGebruiker.sharePointGroepen) {
        return false;
    }

    const adminGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars"];
    return window.huidigeGebruiker.sharePointGroepen.some(groep => 
        adminGroups.some(adminGroup => 
            groep.toLowerCase().includes(adminGroup.toLowerCase())
        )
    );
}

/**
 * Check if the event belongs to the current user
 */
function checkIsOwnEvent() {
    if (!contextMenuData.ownerUsername || !window.huidigeGebruiker?.normalizedUsername) {
        return false;
    }

    return contextMenuData.ownerUsername.toLowerCase() === 
           window.huidigeGebruiker.normalizedUsername.toLowerCase();
}

/**
 * Setup range selection functionality
 */
function setupRangeSelection(roosterContainer) {
    let isSelecting = false;
    let startCell = null;

    roosterContainer.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('day-cell')) {
            isSelecting = true;
            startCell = e.target;
            clearPreviousSelection();
            startCell.classList.add('selected');
            
            selectedRange.start = getDayFromCell(startCell);
            selectedRange.medewerker = getMedewerkerFromCell(startCell);
            selectedRange.cells = [startCell];
            
            isRangeSelectionMode = true;
        }
    });

    roosterContainer.addEventListener('mouseover', (e) => {
        if (isSelecting && e.target.classList.contains('day-cell')) {
            const currentMedewerker = getMedewerkerFromCell(e.target);
            
            // Only allow selection within the same medewerker row
            if (currentMedewerker === selectedRange.medewerker) {
                clearCurrentRangeHighlight();
                highlightRange(startCell, e.target);
            }
        }
    });

    roosterContainer.addEventListener('mouseup', () => {
        isSelecting = false;
    });

    // Prevent drag behavior
    roosterContainer.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
}

function clearCurrentRangeHighlight() {
    selectedRange.cells.forEach(cell => {
        cell.classList.remove('selected');
    });
    selectedRange.cells = [];
}

function highlightRange(startCell, endCell) {
    const allCells = Array.from(document.querySelectorAll('.day-cell'));
    const startIndex = allCells.indexOf(startCell);
    const endIndex = allCells.indexOf(endCell);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const [minIndex, maxIndex] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    
    // Only select cells in the same row (same medewerker)
    const startRow = startCell.closest('tr');
    
    for (let i = minIndex; i <= maxIndex; i++) {
        const cell = allCells[i];
        if (cell.closest('tr') === startRow) {
            cell.classList.add('selected');
            selectedRange.cells.push(cell);
        }
    }
    
    // Update range data
    selectedRange.start = getDayFromCell(allCells[minIndex]);
    selectedRange.end = getDayFromCell(allCells[maxIndex]);
}

function getDayFromCell(cell) {
    const dayHeader = cell.dataset.date || cell.getAttribute('data-date');
    return dayHeader;
}

function getMedewerkerFromCell(cell) {
    const row = cell.closest('tr');
    const nameCell = row?.querySelector('.medewerker-naam');
    return nameCell?.textContent?.trim();
}

/**
 * Handle edit button click
 */
function handleEditEvent() {
    if (!contextMenuData.eventId || document.getElementById('bewerk-item').classList.contains('disabled')) {
        return;
    }

    hideContextMenu();
    
    // Call the modal edit function
    if (typeof window.openModalVoorBewerken === 'function') {
        window.openModalVoorBewerken(contextMenuData.eventType, contextMenuData.eventId);
    } else {
        console.error("Edit modal function not available");
        alert("Bewerk functionaliteit is momenteel niet beschikbaar.");
    }
}

/**
 * Handle delete button click
 */
function handleDeleteEvent() {
    if (!contextMenuData.eventId || document.getElementById('verwijder-item').classList.contains('disabled')) {
        return;
    }

    if (!confirm("Weet je zeker dat je dit item wilt verwijderen?")) {
        return;
    }

    hideContextMenu();
    
    deleteEventFromSharePoint(contextMenuData.eventId, contextMenuData.eventType);
}

/**
 * Delete event from SharePoint
 */
async function deleteEventFromSharePoint(eventId, eventType) {
    try {
        let lijstKey;
        
        switch(eventType?.toLowerCase()) {
            case 'verlof': 
                lijstKey = 'Verlof'; 
                break;
            case 'compensatie': 
                lijstKey = 'CompensatieUren'; 
                break;
            case 'zittingvrij': 
                lijstKey = 'IncidenteelZittingVrij'; 
                break;
            case 'ziekte': 
                lijstKey = 'Ziekte'; 
                break;
            default:
                throw new Error(`Onbekend event type: ${eventType}`);
        }

        if (typeof window.deleteSPListItem === 'function') {
            await window.deleteSPListItem(lijstKey, eventId);
            alert("Item succesvol verwijderd.");
            
            // Refresh the calendar view
            if (typeof window.loadRoosterData === 'function') {
                window.loadRoosterData();
            }
        } else {
            throw new Error("Delete functionaliteit is niet beschikbaar");
        }
    } catch (error) {
        console.error("Error deleting event:", error);
        alert("Fout bij het verwijderen: " + error.message);
    }
}

/**
 * Handle nieuwe toevoegen button click
 */
function handleNieuweToevoegen() {
    if (document.getElementById('nieuwe-item').classList.contains('disabled')) {
        return;
    }

    hideContextMenu();
    
    let startDate, endDate, targetMedewerker;
    
    if (selectedRange.cells.length > 0) {
        // Range selection mode
        startDate = selectedRange.start;
        endDate = selectedRange.end || selectedRange.start;
        targetMedewerker = selectedRange.medewerker;
    } else if (contextMenuData.clickedCell) {
        // Single cell mode
        startDate = getDayFromCell(contextMenuData.clickedCell);
        endDate = startDate;
        targetMedewerker = contextMenuData.targetMedewerker?.naam;
    }
    
    // Open the verlof modal with pre-filled dates
    if (typeof window.openVerlofAanvraagModal === 'function') {
        const startDateObj = startDate ? new Date(startDate) : new Date();
        
        // Verbeterde medewerkersinformatie voor automatische invulling
        let medewerkerInfo = null;
        
        // Gebruik huidige gebruiker indien geen specifieke medewerker geselecteerd
        if (window.huidigeGebruiker) {
            medewerkerInfo = {
                naam: targetMedewerker || window.huidigeGebruiker.Title,
                username: contextMenuData.targetMedewerker?.username || window.huidigeGebruiker.normalizedUsername,
                loginNaam: window.huidigeGebruiker.loginNaam,
                normalizedUsername: window.huidigeGebruiker.normalizedUsername,
                displayName: window.huidigeGebruiker.Title,
                Title: window.huidigeGebruiker.Title
            };
        } else {
            medewerkerInfo = {
                naam: targetMedewerker,
                username: contextMenuData.targetMedewerker?.username
            };
        }
        
        console.log('[ContextMenu] Opening verlof modal with medewerker info:', medewerkerInfo);
        window.openVerlofAanvraagModal(null, startDateObj, medewerkerInfo);
    } else {
        console.error("Verlof aanvraag modal function not available");
        alert("Nieuwe aanvraag functionaliteit is momenteel niet beschikbaar.");
    }
}

/**
 * Handle comment edit button click
 */
function handleCommentaarBewerken() {
    if (!contextMenuData.eventId || document.getElementById('commentaar-item').classList.contains('disabled')) {
        return;
    }

    const currentComment = getCurrentEventComment() || "";
    const newComment = prompt("Voer commentaar in:", currentComment);
    
    if (newComment !== null) { // null means cancelled
        hideContextMenu();
        updateEventComment(contextMenuData.eventId, contextMenuData.eventType, newComment);
    }
}

/**
 * Get current comment for the event (if available)
 */
function getCurrentEventComment() {
    // Try to get comment from the clicked cell or event data
    const cell = contextMenuData.clickedCell;
    const commentElement = cell?.querySelector('.event-comment') || 
                          cell?.querySelector('[data-comment]');
    
    return commentElement?.textContent || commentElement?.dataset.comment || "";
}

/**
 * Update event comment in SharePoint
 */
async function updateEventComment(eventId, eventType, comment) {
    try {
        let lijstKey, commentField;
        
        switch(eventType?.toLowerCase()) {
            case 'verlof': 
                lijstKey = 'Verlof'; 
                commentField = 'Opmerking';
                break;
            case 'compensatie': 
                lijstKey = 'CompensatieUren'; 
                commentField = 'Opmerking';
                break;
            case 'zittingvrij': 
                lijstKey = 'IncidenteelZittingVrij'; 
                commentField = 'Opmerking';
                break;
            case 'ziekte': 
                lijstKey = 'Ziekte'; 
                commentField = 'Opmerking';
                break;
            default:
                throw new Error(`Onbekend event type: ${eventType}`);
        }

        if (typeof window.updateSPListItem !== 'function') {
            throw new Error("Update functionaliteit is niet beschikbaar");
        }

        const updateData = {};
        updateData[commentField] = comment;

        await window.updateSPListItem(lijstKey, eventId, updateData);
        
        alert("Commentaar succesvol bijgewerkt.");
        
        // Refresh the calendar view
        if (typeof window.loadRoosterData === 'function') {
            window.loadRoosterData();
        }
    } catch (error) {
        console.error("Error updating comment:", error);
        alert("Fout bij het bijwerken van commentaar: " + error.message);
    }
}

// Export key functions for global access
window.contextMenuLogic = {
    clearSelection: clearPreviousSelection,
    hideMenu: hideContextMenu,
    checkAdminRights: checkAdminRights
};

console.log("[ContextMenu] Enhanced context menu logic geladen");
