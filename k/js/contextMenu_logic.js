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
 * 6. Event type selection submenu (verlof/ziekte) with permission checks
 */

// Global variables
let selectedRange = {
    start: null,
    end: null,
    medewerker: null,
    cells: []
};

let selectedIndividualCells = [];

let contextMenuData = {
    eventId: null,
    eventType: null,
    ownerUsername: null,
    clickedCell: null,
    targetMedewerker: null
};

let selectionMode = 'none'; // 'none', 'range', 'individual'
let isRangeSelectionMode = false;
let isSelecting = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeContextMenu();
    console.log("Enhanced Context Menu Logic Initialized.");
    
    // Set up a periodic check to update the selection indicator
    // This ensures the indicator stays in sync with the main logic
    setInterval(() => {
        if (selectionMode === 'none' || selectionMode === undefined) {
            updateSelectionModeIndicator();
        }
    }, 500);
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
    }    // Initialize event listeners
    setupContextMenuListeners(roosterContainer, contextMenu);
    setupMenuItemListeners();
    setupRangeSelection(roosterContainer);
    
    // Show help for new users
    showSelectionHelp();
    
    // Position the menu off-screen initially
    hideContextMenu();
}

/**
 * Setup context menu event listeners
 */
function setupContextMenuListeners(roosterContainer, contextMenu) {
    // Right-click listener
    roosterContainer.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        handleContextMenu(event, contextMenu);
    });

    // Hide menu on regular click (not right-click)
    document.addEventListener('click', (event) => {
        if (!contextMenu.contains(event.target) && event.button !== 2) {
            hideContextMenu();
        }
    });

    // Hide menu on scroll
    window.addEventListener('scroll', hideContextMenu);
    
    // Hide menu on window resize
    window.addEventListener('resize', hideContextMenu);
}

/**
 * Handle right-click context menu
 */
function handleContextMenu(event, contextMenu) {
    const targetCell = event.target.closest('.rooster-cel');
    const targetRow = event.target.closest('.medewerker-rij');

    // Reset context menu data
    contextMenuData = {
        eventId: null,
        eventType: null,
        ownerUsername: null,
        clickedCell: targetCell,
        targetMedewerker: null
    };

    // Get target employee from row
    if (targetRow) {
        const medewerkerId = targetRow.dataset.medewerkerId;
        const medewerker = window.alleMedewerkers?.find(m => m.ID.toString() === medewerkerId);
        if (medewerker) {
            contextMenuData.targetMedewerker = {
                id: medewerker.ID,
                username: medewerker.Username,
                naam: medewerker.Naam || medewerker.Title
            };
        }
    }

    // Check if clicking on an event
    if (targetCell && targetCell.dataset.eventId) {
        contextMenuData.eventId = targetCell.dataset.eventId;
        contextMenuData.eventType = targetCell.dataset.eventType;
        contextMenuData.ownerUsername = targetCell.dataset.ownerUsername;
    }

    // Position and show the menu
    positionAndShowMenu(event, contextMenu);

    // Update menu state based on permissions
    updateMenuState();
}

/**
 * Position and show the context menu
 */
function positionAndShowMenu(event, contextMenu) {
    let x = event.clientX;
    let y = event.clientY;

    // Make menu visible temporarily to get dimensions
    contextMenu.style.opacity = '0';
    contextMenu.style.pointerEvents = 'none';
    contextMenu.classList.add('visible');

    // Get menu dimensions
    const menuRect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust position to keep menu within viewport
    if (x + menuRect.width > viewportWidth - 10) {
        x = viewportWidth - menuRect.width - 10;
    }
    if (y + menuRect.height > viewportHeight - 10) {
        y = viewportHeight - menuRect.height - 10;
    }

    // Ensure minimum distance from edges
    x = Math.max(10, x);
    y = Math.max(10, y);

    // Position the menu
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    // Make it fully visible
    contextMenu.style.opacity = '1';
    contextMenu.style.pointerEvents = 'auto';
}

/**
 * Update menu state based on permissions and context
 */
function updateMenuState() {
    const isAdmin = checkAdminRights();
    const isOwnEvent = checkIsOwnEvent();
    const hasEvent = !!contextMenuData.eventId;
    const hasSelection = selectedRange.cells.length > 0;
    const canEditThisEvent = hasEvent && (isOwnEvent || isAdmin);

    console.log("Context menu state:", {
        isAdmin,
        isOwnEvent,
        hasEvent,
        hasSelection,
        canEditThisEvent,
        eventType: contextMenuData.eventType,
        targetMedewerker: contextMenuData.targetMedewerker
    });

    // Get menu items
    const bewerkItem = document.getElementById('context-menu-bewerken');
    const verwijderItem = document.getElementById('context-menu-verwijderen');
    const nieuweItem = document.getElementById('context-menu-nieuwe-toevoegen');
    const commentaarItem = document.getElementById('context-menu-commentaar');

    // Reset all items to enabled state
    [bewerkItem, verwijderItem, nieuweItem, commentaarItem].forEach(item => {
        if (item) {
            item.classList.remove('disabled');
            item.style.display = 'list-item';
        }
    });

    // Logic for edit button
    if (bewerkItem) {
        if (canEditThisEvent) {
            bewerkItem.classList.remove('disabled');
        } else {
            bewerkItem.classList.add('disabled');
        }
    }

    // Logic for delete button  
    if (verwijderItem) {
        if (canEditThisEvent) {
            verwijderItem.classList.remove('disabled');
        } else {
            verwijderItem.classList.add('disabled');
        }
    }

    // Logic for add new button
    if (nieuweItem) {
        const canAddForTarget = contextMenuData.targetMedewerker && 
            (isAdmin || contextMenuData.targetMedewerker.username === window.huidigeGebruiker?.normalizedUsername);
            
        if (hasSelection || canAddForTarget || !contextMenuData.targetMedewerker) {
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
 * Check if current user has admin/privileged rights
 */
function checkAdminRights() {
    if (!window.huidigeGebruiker || !window.huidigeGebruiker.sharePointGroepen) {
        return false;
    }

    const privilegedGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6. Roosteraars", "2.3. Senioren beoordelen"];
    return window.huidigeGebruiker.sharePointGroepen.some(groep => 
        privilegedGroups.some(privilegedGroup => 
            groep.toLowerCase().includes(privilegedGroup.toLowerCase())
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
/**
 * Setup date range selection functionality
 * Single click: Select start/end dates (first click = start, second click = end)  
 * Double click: Select person/row
 */
function setupRangeSelection(roosterContainer) {
    let dateSelectionState = {
        startDate: null,
        endDate: null,
        startCell: null,
        endCell: null,
        medewerker: null
    };
    
    // Add selection mode indicator
    createSelectionModeIndicator();
    
    // Handle single and double clicks
    roosterContainer.addEventListener('click', (event) => {
        const cell = event.target.closest('.rooster-cel');
        
        // If clicking on a cell with existing event, allow it but still handle selection
        if (!cell || !cell.dataset.datum) return;
        
        // Prevent this from bubbling up to the row click handler immediately
        event.stopPropagation();
        
        console.log('[ContextMenu] Single click on cell:', cell.dataset.datum);
        
        handleDateSelection(cell);
    });
    
    // Handle double clicks for row/person selection
    roosterContainer.addEventListener('dblclick', (event) => {
        const cell = event.target.closest('.rooster-cel');
        if (!cell) return;
        
        event.stopPropagation();
        event.preventDefault();
        
        console.log('[ContextMenu] Double click detected - selecting person');
        
        // Clear any date selections
        clearDateSelection();
        
        // Select the person
        const row = cell.closest('.medewerker-rij');
        if (row && typeof window.handleRijSelectie === 'function') {
            const syntheticEvent = { currentTarget: row };
            window.handleRijSelectie(syntheticEvent);
            selectionMode = 'none';
            updateSelectionModeIndicator();
        }
    });
      function handleDateSelection(cell) {
        const clickedDate = cell.dataset.datum;
        const clickedRow = cell.closest('.medewerker-rij');
        
        if (!dateSelectionState.startDate) {
            // First click - set start date
            dateSelectionState.startDate = clickedDate;
            dateSelectionState.startCell = cell;
            dateSelectionState.medewerker = getMedewerkerFromCell(cell);
            
            // Clear any previous selections
            clearAllSelections();
              // Highlight start cell with special styling
            cell.classList.add('range-start-only');
            selectedRange.cells = [cell];
            selectedRange.start = clickedDate;
            selectedRange.end = null; // No end date yet
            selectedRange.medewerker = dateSelectionState.medewerker;
            
            // Update global reference
            updateGlobalSelectedRange();
            
            selectionMode = 'range';
            console.log('[ContextMenu] Start date selected:', clickedDate);
            
        } else if (!dateSelectionState.endDate) {
            // Second click - set end date
            const startRow = dateSelectionState.startCell.closest('.medewerker-rij');
            
            // Must be in the same row
            if (startRow !== clickedRow) {
                console.log('[ContextMenu] End date must be in same row, resetting selection');
                clearDateSelection();
                handleDateSelection(cell); // Start new selection
                return;
            }
            
            dateSelectionState.endDate = clickedDate;
            dateSelectionState.endCell = cell;
            
            // Remove start-only styling and update to full range
            dateSelectionState.startCell.classList.remove('range-start-only');
            
            // Update the visual selection to show full range
            updateDateRangeSelection();
            
            console.log('[ContextMenu] End date selected:', clickedDate, 'Range:', dateSelectionState.startDate, 'to', dateSelectionState.endDate);
            
        } else {
            // Third click - start new selection
            console.log('[ContextMenu] Starting new date selection');
            clearDateSelection();
            handleDateSelection(cell);
        }
        
        updateSelectionModeIndicator();
    }
    
    function updateDateRangeSelection() {
        clearRangeSelection();
        
        if (!dateSelectionState.startCell || !dateSelectionState.endCell) return;
        
        const row = dateSelectionState.startCell.closest('.medewerker-rij');
        const allCells = Array.from(row.querySelectorAll('.rooster-cel[data-datum]'));
        
        const startIndex = allCells.indexOf(dateSelectionState.startCell);
        const endIndex = allCells.indexOf(dateSelectionState.endCell);
        
        if (startIndex === -1 || endIndex === -1) return;
        
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        console.log(`[ContextMenu] Updating visual range: ${minIndex} to ${maxIndex} (${maxIndex - minIndex + 1} cells)`);
          // Update selectedRange object
        selectedRange.start = dateSelectionState.startDate;
        selectedRange.end = dateSelectionState.endDate;
        selectedRange.medewerker = dateSelectionState.medewerker;
        selectedRange.cells = [];
        
        // Visually highlight all cells in the range
        for (let i = minIndex; i <= maxIndex; i++) {
            const cell = allCells[i];
            if (cell) {
                cell.classList.add('selected-for-range');
                if (i === minIndex) cell.classList.add('range-start');
                if (i === maxIndex) cell.classList.add('range-end');
                selectedRange.cells.push(cell);
            }
        }
        
        // Update global reference
        updateGlobalSelectedRange();
    }
    
    function clearDateSelection() {
        dateSelectionState = {
            startDate: null,
            endDate: null,
            startCell: null,
            endCell: null,
            medewerker: null
        };
        clearRangeSelection();
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            clearAllSelections();
            clearDateSelection();
        }
    });
}

/**
 * Handle row toggle (click to select/deselect entire row)
 * This should select the PERSON, not all their days
 */
function handleRowToggle(cell) {
    const row = cell.closest('.medewerker-rij');
    if (!row) return;
    
    // Clear any range/cell selections first
    clearRangeSelection();
    clearIndividualSelection();
    
    // Use the main verlofrooster row selection logic instead of our own
    // This selects the PERSON, not the days
    if (typeof window.handleRijSelectie === 'function') {
        const event = { currentTarget: row };
        window.handleRijSelectie(event);
    } else {
        // Fallback if main function not available
        console.warn('Main row selection function not available');
    }
    
    // Set selection mode to none since we're selecting a person, not date ranges
    selectionMode = 'none';
    updateSelectionModeIndicator();
}

/**
 * Select entire row for a medewerker (REMOVED - this was selecting all days)
 * Now we rely on the main verlofrooster logic to select just the person
 */
// function selectEntireRow(cell) - REMOVED

// Legacy functions removed - using new intuitive selection system

/**
 * Create selection mode indicator
 */
function createSelectionModeIndicator() {
    let indicator = document.getElementById('selection-mode-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'selection-mode-indicator';
        indicator.className = 'selection-mode-indicator';
        indicator.style.display = 'none';
        document.body.appendChild(indicator);
    }
}

/**
 * Update selection mode indicator
 */
function updateSelectionModeIndicator() {
    const indicator = document.getElementById('selection-mode-indicator');
    if (!indicator) return;
    
    const rangeCount = selectedRange.cells.length;
    const individualCount = selectedIndividualCells.length;
    const personSelected = window.geselecteerdeMedewerkerId && window.geselecteerdeMedewerkerNaam;
    
    if (rangeCount === 0 && individualCount === 0 && !personSelected) {
        indicator.style.display = 'none';
        return;
    }
    
    let text = '';
    let className = 'selection-mode-indicator';
    
    if (personSelected && selectionMode === 'none') {
        text = `Persoon geselecteerd: ${window.geselecteerdeMedewerkerNaam} (voor ziek/zittingsvrij melden)`;
        className += ' person-mode';
    } else if (selectionMode === 'range' && selectedRange.start && selectedRange.end) {
        if (selectedRange.start === selectedRange.end) {
            text = `Startdatum geselecteerd: ${selectedRange.start} (klik op einddatum om bereik te voltooien)`;
        } else {
            text = `Datumbereik: ${selectedRange.start} - ${selectedRange.end} (${rangeCount} dagen)`;
        }
        className += ' range-mode';
    } else if (rangeCount > 0) {
        text = `Datumbereik geselecteerd: ${rangeCount} dagen`;
        className += ' range-mode';
    }
    
    if (individualCount > 0) {
        if (text) text += ' | ';
        text += `Individueel: ${individualCount} dagen`;
        className += ' individual-mode';
    }
    
    if (text) {
        text += ' (ESC om te wissen)';
    }
    
    indicator.textContent = text;
    indicator.className = className;
    indicator.style.display = 'block';
}

// Hover effects function removed - using simpler interaction model

/**
 * Add cell to range selection
 */
function addCellToRangeSelection(cell, isStart = false) {
    cell.classList.add('selected-for-range');
    if (isStart) {
        cell.classList.add('range-start');
    }
    
    if (!selectedRange.cells.includes(cell)) {
        selectedRange.cells.push(cell);
    }
    
    // Update medewerker info
    if (!selectedRange.medewerker) {
        selectedRange.medewerker = getMedewerkerFromCell(cell);
    }
}

/**
 * Update range selection (drag selection - blue highlighting)
 */
/**
 * Clear range selection only
 */
function clearRangeSelection() {
    selectedRange.cells.forEach(cell => {
        cell.classList.remove('selected-for-range', 'range-start', 'range-end', 'row-selected', 'range-start-only');
    });
    selectedRange = {
        start: null,
        end: null,
        medewerker: null,
        cells: []
    };
    
    // Update global reference
    updateGlobalSelectedRange();
}

/**
 * Clear individual selection only
 */
function clearIndividualSelection() {
    selectedIndividualCells.forEach(cell => {
        cell.classList.remove('selected-individual');
    });
    selectedIndividualCells = [];
}

/**
 * Clear all selections
 */
function clearAllSelections() {
    clearRangeSelection();
    clearIndividualSelection();
    
    // Also clear person/row selection from main verlofrooster logic
    if (window.geselecteerdeMedewerkerId) {
        // Find and clear the selected row class
        const selectedRow = document.querySelector('.medewerker-rij.selected-row');
        if (selectedRow) {
            selectedRow.classList.remove('selected-row');
        }
        
        // Clear global selection variables
        window.geselecteerdeMedewerkerId = null;
        window.geselecteerdeMedewerkerUsername = null;
        window.geselecteerdeMedewerkerNaam = null;
        
        console.log('[ContextMenu] Cleared person selection');
    }
    
    selectionMode = 'none';
    isRangeSelectionMode = false;
    isSelecting = false;
    updateSelectionModeIndicator();
}

/**
 * Get medewerker from cell
 */
function getMedewerkerFromCell(cell) {
    const row = cell.closest('.medewerker-rij');
    const nameCell = row?.querySelector('.medewerker-naam');
    return nameCell?.textContent?.trim();
}

// Bulk delete function removed for simplicity - individual event deletion available through context menu

/**
 * Hide context menu
 */
function hideContextMenu() {
    const contextMenu = document.getElementById('rooster-context-menu');
    if (contextMenu) {
        contextMenu.classList.remove('visible');
        contextMenu.style.opacity = '0';
        contextMenu.style.pointerEvents = 'none';
        // Move it off-screen
        contextMenu.style.left = '-9999px';
        contextMenu.style.top = '-9999px';
    }
}

/**
 * Setup event listeners for menu items
 */
function setupMenuItemListeners() {
    const bewerkItem = document.getElementById('context-menu-bewerken');
    const verwijderItem = document.getElementById('context-menu-verwijderen');
    const nieuweItem = document.getElementById('context-menu-nieuwe-toevoegen');
    const commentaarItem = document.getElementById('context-menu-commentaar');

    if (bewerkItem) {
        bewerkItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (!e.target.closest('.disabled')) {
                handleBewerken();
            }
            hideContextMenu();
        });
    }

    if (verwijderItem) {
        verwijderItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (!e.target.closest('.disabled')) {
                handleVerwijderen();
            }
            hideContextMenu();
        });
    }

    if (nieuweItem) {
        nieuweItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (!e.target.closest('.disabled')) {
                handleNieuweToevoegen();
            }
            hideContextMenu();
        });
    }

    if (commentaarItem) {
        commentaarItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (!e.target.closest('.disabled')) {
                handleCommentaarBewerken();
            }
            hideContextMenu();
        });
    }
}

/**
 * Handle edit action
 */
async function handleBewerken() {
    if (!contextMenuData.eventId || !contextMenuData.eventType) {
        console.error('Geen event data beschikbaar voor bewerken');
        return;
    }

    console.log(`Bewerken geklikt voor ${contextMenuData.eventType} met ID: ${contextMenuData.eventId}`);

    try {
        if (typeof window.openModalVoorBewerken === 'function') {
            await window.openModalVoorBewerken(contextMenuData.eventType, contextMenuData.eventId);
        } else {
            console.error("Functie 'openModalVoorBewerken' niet gevonden");
            if (window.toonNotificatie) {
                window.toonNotificatie('Bewerkingsfunctionaliteit is momenteel niet beschikbaar.', 'error');
            } else {
                alert('Bewerkingsfunctionaliteit is momenteel niet beschikbaar.');
            }
        }
    } catch (error) {
        console.error('Fout bij openen bewerkingsmodal:', error);
        if (window.toonNotificatie) {
            window.toonNotificatie('Fout bij openen bewerkvenster', 'error');
        } else {
            alert(`Fout bij openen bewerkvenster: ${error.message}`);
        }
    }
}

/**
 * Handle delete action
 */
async function handleVerwijderen() {
    if (!contextMenuData.eventId || !contextMenuData.eventType) {
        console.error('Geen event data beschikbaar voor verwijderen');
        return;
    }

    const typeNaam = getEventTypeName(contextMenuData.eventType);
    const isConfirmed = confirm(`Weet je zeker dat je deze ${typeNaam} wilt verwijderen?\n\nDeze actie kan niet ongedaan gemaakt worden.`);
    
    if (!isConfirmed) return;

    console.log(`Verwijderen bevestigd voor ${contextMenuData.eventType} met ID: ${contextMenuData.eventId}`);

    try {
        await verwijderItemUitSharePoint(contextMenuData.eventType, contextMenuData.eventId);
    } catch (error) {
        console.error('Fout bij verwijderen:', error);
        if (window.toonNotificatie) {
            window.toonNotificatie(`Kon het item niet verwijderen: ${error.message}`, 'error');
        } else {
            alert(`Kon het item niet verwijderen: ${error.message}`);
        }
    }
}

/**
 * Handle add new action - now shows options for different event types
 */
function handleNieuweToevoegen() {
    console.log('Nieuwe toevoegen geklikt', { selectionMode, selectedRange, selectedIndividualCells, contextMenuData });

    // Get target employee info
    let targetMedewerker = contextMenuData.targetMedewerker;
    
    // Check if user can add events for the target employee
    const isAdmin = checkAdminRights();
    const canAddForTarget = !targetMedewerker || 
                           isAdmin || 
                           (targetMedewerker && 
                            targetMedewerker.username === window.huidigeGebruiker?.normalizedUsername);
    
    if (!canAddForTarget) {
        if (window.toonNotificatie) {
            window.toonNotificatie('U kunt alleen gebeurtenissen voor uzelf toevoegen.', 'warning');
        } else {
            alert('U kunt alleen gebeurtenissen voor uzelf toevoegen.');
        }
        return;
    }
    
    // Show event type selection menu
    showEventTypeSelectionMenu();
}

/**
 * Shows a submenu for selecting event type (verlof, ziekte, etc.)
 */
function showEventTypeSelectionMenu() {
    // Create or get the submenu
    let submenu = document.getElementById('context-submenu-event-types');
    if (!submenu) {
        submenu = document.createElement('div');
        submenu.id = 'context-submenu-event-types';
        submenu.className = 'context-submenu bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50';
        submenu.style.position = 'fixed';
        submenu.style.display = 'none';
        submenu.style.minWidth = '150px';
        
        // Create menu items
        const verlofItem = document.createElement('button');
        verlofItem.className = 'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
        verlofItem.innerHTML = '📅 Verlof/Vakantie';
        verlofItem.onclick = () => handleEventTypeSelection('verlof');
        
        const ziekteItem = document.createElement('button');
        ziekteItem.className = 'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
        ziekteItem.innerHTML = '🤒 Ziek Melden';
        ziekteItem.onclick = () => handleEventTypeSelection('ziekte');
        
        submenu.appendChild(verlofItem);
        submenu.appendChild(ziekteItem);
        document.body.appendChild(submenu);
    }
    
    // Position the submenu
    const contextMenu = document.getElementById('rooster-context-menu');
    const menuRect = contextMenu.getBoundingClientRect();
    
    submenu.style.left = `${menuRect.right + 5}px`;
    submenu.style.top = `${menuRect.top}px`;
    submenu.style.display = 'block';
    
    // Hide main context menu
    hideContextMenu();
    
    // Hide submenu when clicking elsewhere
    const hideSubmenu = (e) => {
        if (!submenu.contains(e.target)) {
            submenu.style.display = 'none';
            document.removeEventListener('click', hideSubmenu);
        }
    };
    setTimeout(() => document.addEventListener('click', hideSubmenu), 10);
}

/**
 * Handles the selection of a specific event type
 */
function handleEventTypeSelection(eventType) {
    console.log('Event type selected:', eventType);
    
    // Hide submenu
    const submenu = document.getElementById('context-submenu-event-types');
    if (submenu) {
        submenu.style.display = 'none';
    }
    
    if (eventType === 'ziekte') {
        handleZiekteToevoegen();
    } else {
        handleVerlofToevoegen();
    }
}

/**
 * Handles adding new ziekte event with permission checks
 */
function handleZiekteToevoegen() {
    console.log('Creating ziekte event - checking selection:', {
        geselecteerdeMedewerkerId: window.geselecteerdeMedewerkerId,
        geselecteerdeMedewerkerUsername: window.geselecteerdeMedewerkerUsername,
        geselecteerdeMedewerkerNaam: window.geselecteerdeMedewerkerNaam
    });
    
    // Check permissions for ziekte events using same logic as FAB menu
    const isPrivilegedUser = checkAdminRights();
    let medewerkerContext;
    
    if (isPrivilegedUser) {
        // Privileged users: can report for anyone if someone is selected, or for themselves if no one is selected
        // Use the same global selection variables as the FAB menu
        if (window.geselecteerdeMedewerkerId && window.geselecteerdeMedewerkerUsername && window.geselecteerdeMedewerkerNaam) {
            // Use selected employee context from global selection
            medewerkerContext = {
                Username: window.geselecteerdeMedewerkerUsername,
                Naam: window.geselecteerdeMedewerkerNaam,
                Id: window.geselecteerdeMedewerkerId,
                loginNaam: window.geselecteerdeMedewerkerUsername,
                Title: window.geselecteerdeMedewerkerNaam,
                Email: null // Will be filled by the modal if needed
            };
            console.log("[ContextMenu] Privileged user creating ziekte for selected employee:", medewerkerContext);
        } else {
            // No selection - report for themselves
            medewerkerContext = {
                Username: window.huidigeGebruiker.normalizedUsername,
                loginNaam: window.huidigeGebruiker.loginNaam,
                Naam: window.huidigeGebruiker.Title || window.huidigeGebruiker.Naam,
                Title: window.huidigeGebruiker.Title,
                Id: window.huidigeGebruiker.medewerkerData ? window.huidigeGebruiker.medewerkerData.ID : window.huidigeGebruiker.Id,
                Email: window.huidigeGebruiker.Email
            };
            console.log("[ContextMenu] Privileged user creating ziekte for themselves:", medewerkerContext);
        }
    } else {
        // Regular users: can only report for themselves
        // Check if they have someone else selected
        if (window.geselecteerdeMedewerkerId && 
            window.geselecteerdeMedewerkerUsername !== window.huidigeGebruiker?.normalizedUsername) {
            
            if (window.toonNotificatie) {
                window.toonNotificatie('U kunt alleen ziekmeldingen voor uzelf maken. Selectie wordt genegeerd.', 'warning');
            } else {
                alert('U kunt alleen ziekmeldingen voor uzelf maken. Selectie wordt genegeerd.');
            }
        }
        
        // Always use zichzelf for regular users
        medewerkerContext = {
            Username: window.huidigeGebruiker.normalizedUsername,
            loginNaam: window.huidigeGebruiker.loginNaam,
            Naam: window.huidigeGebruiker.Title || window.huidigeGebruiker.Naam,
            Title: window.huidigeGebruiker.Title,
            Id: window.huidigeGebruiker.medewerkerData ? window.huidigeGebruiker.medewerkerData.ID : window.huidigeGebruiker.Id,
            Email: window.huidigeGebruiker.Email
        };
        console.log("[ContextMenu] Regular user creating ziekte for themselves:", medewerkerContext);
    }
    
    // Get selected date from context
    const selectedDate = getSelectedDateFromContext();
    
    // Open ziekte modal
    if (typeof window.openZiekBeterMeldenModal === 'function') {
        window.openZiekBeterMeldenModal(medewerkerContext, selectedDate, 'ziek');
    } else {
        console.error("Function 'openZiekBeterMeldenModal' not found");
        if (window.toonNotificatie) {
            window.toonNotificatie('Ziekmelding functionaliteit is momenteel niet beschikbaar.', 'error');
        } else {
            alert('Ziekmelding functionaliteit is momenteel niet beschikbaar.');
        }
    }
}

/**
 * Handles adding new verlof event (existing functionality)
 */
function handleVerlofToevoegen() {
    console.log('Creating verlof event', { selectionMode, selectedRange, selectedIndividualCells, contextMenuData });

    let startDate = null;
    let endDate = null;
    let targetMedewerker = contextMenuData.targetMedewerker;
    let selectedDates = [];

    // Check for row selection (green - entire row)
    if (selectionMode === 'row' && selectedRange.cells.length > 0) {
        startDate = new Date(selectedRange.start);
        endDate = new Date(selectedRange.end);
        targetMedewerker = selectedRange.medewerker || targetMedewerker;
        console.log('Using row selection:', { startDate, endDate, targetMedewerker, totalDays: selectedRange.cells.length });
    }
    // Check for range selection (blue - drag selection)
    else if (selectionMode === 'range' && selectedRange.cells.length > 0) {
        startDate = new Date(selectedRange.start);
        endDate = new Date(selectedRange.end);
        targetMedewerker = selectedRange.medewerker || targetMedewerker;
        console.log('Using range selection:', { startDate, endDate, targetMedewerker });
    } 
    // Check for individual cell selection (red - ctrl+click, legacy)
    else if (selectedIndividualCells.length > 0) {
        selectedDates = selectedIndividualCells
            .map(cell => cell.dataset.datum)
            .filter(datum => datum)
            .sort();
        
        if (selectedDates.length > 0) {
            startDate = new Date(selectedDates[0]);
            endDate = selectedDates.length > 1 ? new Date(selectedDates[selectedDates.length - 1]) : startDate;
            
            // Get medewerker from first selected cell
            const firstCell = selectedIndividualCells[0];
            targetMedewerker = getMedewerkerFromCell(firstCell) || targetMedewerker;
        }
        console.log('Using individual selection:', { selectedDates, startDate, endDate, targetMedewerker });
    } 
    // Single cell selection (right-click on empty cell)
    else if (contextMenuData.clickedCell && contextMenuData.clickedCell.dataset.datum) {
        const datum = new Date(contextMenuData.clickedCell.dataset.datum);
        startDate = datum;
        endDate = datum;
        console.log('Using single cell:', { startDate, endDate, targetMedewerker });
    }

    // Open verlof modal with pre-filled dates
    if (typeof window.openVerlofAanvraagModal === 'function') {
        let medewerkerContext;
          if (targetMedewerker && typeof targetMedewerker === 'object') {
            // targetMedewerker is een object met {id, username, naam}
            console.log('[ContextMenu] Processing object targetMedewerker:', targetMedewerker);
            const medewerkerDetails = window.alleMedewerkers?.find(m => 
                m.ID === targetMedewerker.id ||
                m.Username === targetMedewerker.username ||
                m.Naam === targetMedewerker.naam
            );
            
            if (medewerkerDetails) {
                medewerkerContext = {
                    Id: medewerkerDetails.ID,
                    Username: medewerkerDetails.Username,
                    loginNaam: medewerkerDetails.Username,
                    normalizedUsername: medewerkerDetails.Username,
                    Naam: medewerkerDetails.Naam || medewerkerDetails.Title,
                    Title: medewerkerDetails.Title || medewerkerDetails.Naam,
                    Email: medewerkerDetails.Email,
                    displayName: medewerkerDetails.Naam || medewerkerDetails.Title
                };
                console.log('[ContextMenu] Found employee details for object targetMedewerker:', medewerkerContext);
            } else {
                // Fallback for medewerker context from object
                medewerkerContext = {
                    Id: targetMedewerker.id,
                    Naam: targetMedewerker.naam,
                    Title: targetMedewerker.naam,
                    loginNaam: targetMedewerker.username,
                    normalizedUsername: targetMedewerker.username,
                    Username: targetMedewerker.username,
                    displayName: targetMedewerker.naam
                };
                console.log('[ContextMenu] Using fallback for object targetMedewerker:', medewerkerContext);
            }
        } else if (targetMedewerker && typeof targetMedewerker === 'string') {
            // targetMedewerker is een string
            console.log('[ContextMenu] Processing string targetMedewerker:', targetMedewerker);
            const medewerkerDetails = window.alleMedewerkers?.find(m => 
                m.Naam === targetMedewerker || 
                m.Title === targetMedewerker ||
                m.Username === targetMedewerker
            );
            
            if (medewerkerDetails) {
                medewerkerContext = {
                    Id: medewerkerDetails.ID,
                    Username: medewerkerDetails.Username,
                    loginNaam: medewerkerDetails.Username,
                    normalizedUsername: medewerkerDetails.Username,
                    Naam: medewerkerDetails.Naam || medewerkerDetails.Title,
                    Title: medewerkerDetails.Title || medewerkerDetails.Naam,
                    Email: medewerkerDetails.Email,
                    displayName: medewerkerDetails.Naam || medewerkerDetails.Title
                };
                console.log('[ContextMenu] Found employee details for string targetMedewerker:', medewerkerContext);
            } else {
                // Fallback for medewerker context from string
                medewerkerContext = {
                    Naam: targetMedewerker,
                    Title: targetMedewerker,
                    loginNaam: targetMedewerker,
                    normalizedUsername: targetMedewerker,
                    Username: targetMedewerker,
                    displayName: targetMedewerker
                };
                console.log('[ContextMenu] Using fallback for string targetMedewerker:', medewerkerContext);            }
        } else {
            // Use current user als fallback (geen targetMedewerker of targetMedewerker is null)
            console.log('[ContextMenu] No targetMedewerker, using current user as fallback');
            if (window.huidigeGebruiker) {
                medewerkerContext = {
                    Id: window.huidigeGebruiker.Id,
                    Username: window.huidigeGebruiker.normalizedUsername,
                    loginNaam: window.huidigeGebruiker.loginNaam,
                    normalizedUsername: window.huidigeGebruiker.normalizedUsername,
                    Naam: window.huidigeGebruiker.Title,
                    Title: window.huidigeGebruiker.Title,
                    Email: window.huidigeGebruiker.Email,
                    displayName: window.huidigeGebruiker.Title
                };
                console.log('[ContextMenu] Using current user context:', medewerkerContext);
            } else {
                // Laatste fallback
                medewerkerContext = {
                    Naam: 'Huidige gebruiker',
                    Title: 'Huidige gebruiker',
                    loginNaam: '',
                    normalizedUsername: '',
                    Username: ''
                };
            }
        }

        console.log('Opening verlof modal with context:', { startDate, endDate, medewerkerContext, selectionMode });

        // Store dates for the modal to use
        window.verlofModalStartDate = startDate;
        window.verlofModalEndDate = endDate;
        window.verlofModalSelectionMode = selectionMode;

        // Call the modal with itemData=null (new), startDate, medewerkerContext
        window.openVerlofAanvraagModal(null, startDate || new Date(), medewerkerContext);
          // Note: Date pre-filling is now handled by the improved initializeVerlofModalForm function
        // We pass the date range via the global variables that are set above

        // Store additional selection data for the modal to use
        if (selectedDates.length > 0) {
            window.verlofModalSelectedDates = selectedDates;
        }
        
        // Show helpful message about selection
        const totalSelected = selectedRange.cells.length + selectedIndividualCells.length;
        if (totalSelected > 1) {
            setTimeout(() => {
                if (window.toonModalNotificatie) {
                    let selectionTypeText = '';
                    if (selectionMode === 'row') {
                        selectionTypeText = 'hele rij';
                    } else if (selectionMode === 'range') {
                        selectionTypeText = 'bereik';
                    } else {
                        selectionTypeText = 'individuele dagen';
                    }
                    
                    window.toonModalNotificatie(
                        `${totalSelected} dagen geselecteerd (${selectionTypeText}). Datums zijn vooringevuld.`, 
                        'info'
                    );
                }
            }, 500);
        }
    } else {
        console.error("Functie 'openVerlofAanvraagModal' niet gevonden");
        if (window.toonNotificatie) {
            window.toonNotificatie('Functionaliteit voor nieuwe aanvraag is momenteel niet beschikbaar.', 'error');
        } else {
            alert('Functionaliteit voor nieuwe aanvraag is momenteel niet beschikbaar.');
        }
    }

    // Don't clear selections automatically - let user clear with ESC if desired
}

/**
 * Gets the selected date from context menu or current selection
 */
function getSelectedDateFromContext() {
    // Try to get date from clicked cell
    if (contextMenuData.clickedCell && contextMenuData.clickedCell.dataset.datum) {
        return new Date(contextMenuData.clickedCell.dataset.datum);
    }
    
    // Try to get date from range selection
    if (selectedRange.cells.length > 0) {
        const dates = selectedRange.cells.map(cell => new Date(cell.dataset.datum)).sort((a, b) => a - b);
        return dates[0];
    }
    
    // Try to get date from individual selection
    if (selectedIndividualCells.length > 0) {
        const selectedDates = selectedIndividualCells.map(cell => new Date(cell.dataset.datum)).sort((a, b) => a - b);
        return selectedDates[0];
    }
    
    // Default to today
    return new Date();
}

/**
 * Handle comment editing
 */
async function handleCommentaarBewerken() {
    if (!contextMenuData.eventId || !contextMenuData.eventType) {
        console.error('Geen event data beschikbaar voor commentaar bewerken');
        return;
    }

    console.log(`Commentaar bewerken voor ${contextMenuData.eventType} met ID: ${contextMenuData.eventId}`);

    try {
        // Get current item data first
        const itemData = await getEventData(contextMenuData.eventType, contextMenuData.eventId);
        if (!itemData) {
            throw new Error('Kon event data niet ophalen');
        }

        // Get current comment based on event type
        let currentComment = '';
        switch(contextMenuData.eventType) {
            case 'verlof':
                currentComment = itemData.Omschrijving || '';
                break;
            case 'compensatie':
            case 'zittingvrij':
            case 'ziekte':
                currentComment = itemData.Opmerking || '';
                break;
        }

        // Create a simple prompt modal for comment editing
        const newComment = prompt('Bewerk commentaar:', currentComment);
        
        if (newComment !== null && newComment !== currentComment) {
            await updateEventComment(contextMenuData.eventType, contextMenuData.eventId, newComment);
            
            if (window.toonNotificatie) {
                window.toonNotificatie('Commentaar succesvol bijgewerkt', 'success');
            } else {
                alert('Commentaar succesvol bijgewerkt');
            }
            
            // Refresh the roster
            if (typeof window.laadInitiëleData === 'function') {
                await window.laadInitiëleData(false);
            }
        }
    } catch (error) {
        console.error('Fout bij bewerken commentaar:', error);
        if (window.toonNotificatie) {
            window.toonNotificatie(`Kon commentaar niet bijwerken: ${error.message}`, 'error');
        } else {
            alert(`Kon commentaar niet bijwerken: ${error.message}`);
        }
    }
}

/**
 * Get event type display name
 */
function getEventTypeName(type) {
    switch(type) {
        case 'verlof': return 'verlofaanvraag';
        case 'compensatie': return 'compensatiemelding';
        case 'zittingvrij': return 'zittingvrij melding';
        case 'ziekte': return 'ziektemelding';
        default: return 'item';
    }
}

/**
 * Delete item from SharePoint
 */
async function verwijderItemUitSharePoint(type, id) {
    let lijstKey = '';
    switch(type) {
        case 'verlof': lijstKey = 'Verlof'; break;
        case 'compensatie': lijstKey = 'CompensatieUren'; break;
        case 'zittingvrij': lijstKey = 'IncidenteelZittingVrij'; break;
        case 'ziekte': lijstKey = 'Ziekte'; break;
        default:
            throw new Error(`Onbekend event type: ${type}`);
    }

    if (typeof window.deleteSPListItem !== 'function') {
        throw new Error("Verwijderfunctionaliteit is momenteel niet beschikbaar");
    }
    
    if (window.toonNotificatie) {
        window.toonNotificatie('Item wordt verwijderd...', 'info');
    }
    
    await window.deleteSPListItem(lijstKey, id);
    
    if (window.toonNotificatie) {
        window.toonNotificatie('Item succesvol verwijderd.', 'success');
    }
    
    // Refresh roster data
    if (typeof window.laadInitiëleData === 'function') {
        await window.laadInitiëleData(false);
    }
}

/**
 * Get event data from SharePoint
 */
async function getEventData(type, id) {
    let lijstKey = '';
    switch(type) {
        case 'verlof': lijstKey = 'Verlof'; break;
        case 'compensatie': lijstKey = 'CompensatieUren'; break;
        case 'zittingvrij': lijstKey = 'IncidenteelZittingVrij'; break;
        case 'ziekte': lijstKey = 'Ziekte'; break;
        default:
            throw new Error(`Onbekend event type: ${type}`);
    }

    if (typeof window.getLijstItemsAlgemeen !== 'function') {
        throw new Error("Data ophaal functionaliteit is niet beschikbaar");
    }

    const selectQuery = "$select=*";
    const filterQuery = `$filter=ID eq ${id}`;
    
    const items = await window.getLijstItemsAlgemeen(lijstKey, selectQuery, filterQuery);
    return items && items.length > 0 ? items[0] : null;
}

/**
 * Update event comment
 */
async function updateEventComment(type, id, comment) {
    let lijstKey = '';
    let commentField = '';
    
    switch(type) {
        case 'verlof': 
            lijstKey = 'Verlof'; 
            commentField = 'Omschrijving';
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
            throw new Error(`Onbekend event type: ${type}`);
    }

    if (typeof window.updateSPListItem !== 'function') {
        throw new Error("Update functionaliteit is niet beschikbaar");
    }

    const updateData = {};
    updateData[commentField] = comment;

    await window.updateSPListItem(lijstKey, id, updateData);
}

// Export key functions for global access
window.contextMenuLogic = {
    clearSelection: clearAllSelections,
    clearRangeSelection: clearRangeSelection,
    clearIndividualSelection: clearIndividualSelection,
    hideMenu: hideContextMenu,
    checkAdminRights: checkAdminRights,
    getSelectedCells: () => ({
        range: selectedRange.cells,
        individual: selectedIndividualCells,
        total: selectedRange.cells.length + selectedIndividualCells.length
    })
};

// Function to sync selectedRange to global window object
function updateGlobalSelectedRange() {
    window.selectedRange = selectedRange;
    console.log('[ContextMenu] Updated global selectedRange:', window.selectedRange);
}

// Export selectedRange globally for FAB access
window.selectedRange = selectedRange;

console.log("[ContextMenu] Enhanced context menu logic geladen");

/**
 * Show help overlay for new selection system
 */
function showSelectionHelp() {
    // Check if user has seen the help before
    if (localStorage.getItem('verlofrooster-selection-help-seen')) {
        return;
    }
    
    let helpOverlay = document.getElementById('selection-help-overlay');
    if (!helpOverlay) {
        helpOverlay = document.createElement('div');
        helpOverlay.id = 'selection-help-overlay';
        helpOverlay.className = 'selection-help-overlay';        helpOverlay.innerHTML = `
            <strong>📅 Nieuwe selectie-functionaliteit!</strong>
            <ul>
                <li><strong>Klik</strong> = Selecteer/deselecteer hele rij (groen)</li>
                <li><strong>Klik + Sleep</strong> = Selecteer bereik (blauw)</li>
                <li><strong>Rechts-klik</strong> = Context menu</li>
                <li><strong>ESC</strong> = Selectie wissen</li>
            </ul>
            <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                Klik om te sluiten
            </div>
        `;
        document.body.appendChild(helpOverlay);
        
        // Close on click
        helpOverlay.addEventListener('click', () => {
            helpOverlay.classList.remove('show');
            localStorage.setItem('verlofrooster-selection-help-seen', 'true');
            setTimeout(() => {
                if (helpOverlay.parentNode) {
                    helpOverlay.parentNode.removeChild(helpOverlay);
                }
            }, 300);
        });
    }
    
    // Show after a short delay
    setTimeout(() => {
        helpOverlay.classList.add('show');
    }, 1000);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (helpOverlay.classList.contains('show')) {
            helpOverlay.classList.remove('show');
            localStorage.setItem('verlofrooster-selection-help-seen', 'true');
        }
    }, 10000);
}

/**
 * Debugging - log context menu medewerker context determination
 */
function debugLogMedewerkerContext() {
    console.log('[ContextMenu] DEBUG - medewerkerContext bepaling:', {
        targetMedewerker: contextMenuData.targetMedewerker,
        contextMenuData: contextMenuData,
        alleMedewerkers: window.alleMedewerkers ? window.alleMedewerkers.length : 'not available'
    });
}

// Test functie voor datumselectie debugging
window.testDateSelection = function() {
    console.log('=== DATE SELECTION TEST ===');
    console.log('Selected range:', window.selectedRange);
    console.log('Local selectedRange:', selectedRange);
    console.log('Date selection state:', dateSelectionState);
    console.log('Selection mode:', selectionMode);
    
    return {
        globalRange: window.selectedRange,
        localRange: selectedRange,
        selectionMode: selectionMode
    };
};