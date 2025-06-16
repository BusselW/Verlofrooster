# Procedure for Determining Medewerker and MedewerkerID in Verlof Modal

This document outlines the logic used in `meldingVerlof.aspx` and `meldingVerlof_logic.js` to determine and populate the "Medewerker" (employee display name) and "MedewerkerID" (employee identifier) fields within the leave request modal.

## Overview

The system differentiates between standard users (requesting leave for themselves) and super-users (who can request leave for others). The core logic resides in `meldingVerlof_logic.js`, specifically within the `initializeVerlofModalForm` function and related helper functions.

## Key Components and Variables

1.  **`window.huidigeGebruiker`**: An object available globally, containing details of the currently logged-in user (e.g., `loginNaam`, `displayName`, `normalizedUsername`, `email`, `id`, `sharePointGroepen`).
2.  **`window.alleMedewerkers`**: An array available globally, containing a list of all employee objects. Each employee object typically has properties like `VolledigeNaam` (full name for display) and `MedewerkerID` (the unique identifier, often a username or specific ID).
3.  **`medewerkerContext` (parameter to `initializeVerlofModalForm`)**: When the modal is opened from a context menu or FAB button related to a specific employee in the roster, this object contains details of that selected employee.
4.  **`huidigeGebruikerVerlofContext` (global in `meldingVerlof_logic.js`)**: This variable stores the context of the employee for whom the leave is actually being requested. It's determined at the beginning of `initializeVerlofModalForm`.
5.  **HTML Form Fields (in `meldingVerlof.aspx` and dynamically loaded into the modal):**
    *   `ModalMedewerkerDisplay` (input, `type="text"`): Displays the employee's full name. Readonly for standard users.
    *   `ModalMedewerkerSelect` (select): Dropdown list for super-users to select an employee. Hidden for standard users.
    *   `ModalMedewerkerIDDisplay` (input, `type="text"`): Displays the employee's ID (e.g., username). Readonly.
    *   `MedewerkerID` (input, `type="hidden"`): Stores the actual MedewerkerID value that will be submitted with the form. This is the crucial field for backend processing.

## Logic Flow in `initializeVerlofModalForm`

1.  **Determine Target User (`targetMedewerkerContext`):**
    *   The function first checks if the current user is a "super-user" using `isUserSuperUser()`. This function typically checks `window.huidigeGebruiker.sharePointGroepen` against a list of privileged groups.
    *   **If Super-User and `medewerkerContext` is provided and different from self:**
        *   If the `medewerkerContext` (passed when clicking on another user's entry in the roster) is valid and refers to a user different from the logged-in super-user, then `targetMedewerkerContext` is set to this `medewerkerContext`. This allows the super-user to act on behalf of the selected employee.
    *   **Else (Standard User OR Super-User acting for self OR no specific `medewerkerContext`):**
        *   `targetMedewerkerContext` is set to `window.huidigeGebruiker`.
    *   The script variable `huidigeGebruikerVerlofContext` is then assigned the value of `targetMedewerkerContext`.

2.  **Retrieve Employee Details (`displayName`, `medewerkerId`):**
    *   The system attempts to find the `huidigeGebruikerVerlofContext` in the `window.alleMedewerkers` list. The matching is attempted using various properties from `huidigeGebruikerVerlofContext` such as `normalizedUsername`, `loginNaam`, `Email`, `displayName`, or `medewerkerNaamVolledig` against corresponding properties in the `window.alleMedewerkers` objects (e.g., `MedewerkerID`, `EMail`, `VolledigeNaam`).
    *   **If a match is found in `window.alleMedewerkers`:**
        *   `displayName` is set to the matched employee's `VolledigeNaam` (or similar full name property).
        *   `medewerkerId` is set to the matched employee's `MedewerkerID` (or similar unique ID property).
    *   **If no match is found in `window.alleMedewerkers` (Fallback):**
        *   `displayName` is derived from `huidigeGebruikerVerlofContext.displayName` or `huidigeGebruikerVerlofContext.medewerkerNaamVolledig`.
        *   `medewerkerId` is derived from `huidigeGebruikerVerlofContext.normalizedUsername` or `huidigeGebruikerVerlofContext.loginNaam`. This fallback ensures that even if the user is not in the `alleMedewerkers` list (e.g., a new user or external), their basic SharePoint identity can be used.

3.  **Populate Form Fields:**
    *   **Standard User UI:**
        *   `ModalMedewerkerDisplay` (visible, readonly input) is set to the determined `displayName`.
        *   `ModalMedewerkerSelect` (dropdown) remains hidden.
    *   **Super-User UI:**
        *   `ModalMedewerkerDisplay` (readonly input) is initially hidden or made non-interactive.
        *   `ModalMedewerkerSelect` (dropdown) is made visible and populated by the `populateEmployeeDropdown` function, which lists all employees from `window.alleMedewerkers`.
        *   The dropdown is set to the determined `medewerkerId` if a `medewerkerContext` was initially provided.
        *   An event listener on `ModalMedewerkerSelect` calls `updateEmployeeFields` when the selection changes.
    *   **Common Fields (for both user types):**
        *   `ModalMedewerkerIDDisplay` (visible, readonly input) is set to the determined `medewerkerId`.
        *   `MedewerkerID` (hidden input) is set to the determined `medewerkerId`. This is the value that gets submitted with the form.

4.  **`updateEmployeeFields(displayName, username)` function:**
    *   This function is primarily called when a super-user changes the selection in the `ModalMedewerkerSelect` dropdown.
    *   It receives the selected employee's display name and their ID (username/MedewerkerID).
    *   It updates:
        *   `ModalMedewerkerIDDisplay.value` with the new `username`.
        *   `MedewerkerID.value` (hidden field) with the new `username`.
        *   It might also update `ModalMedewerkerDisplay.value` if it's being used by super-users.

## Summary of Values

*   **"Medewerker" (Display Name):**
    *   Primarily sourced from `employee.VolledigeNaam` from the `window.alleMedewerkers` list if the target user is found there.
    *   Fallback: `huidigeGebruikerVerlofContext.displayName` or `huidigeGebruikerVerlofContext.medewerkerNaamVolledig`.
    *   Displayed in `ModalMedewerkerDisplay`.
*   **"MedewerkerID" (Identifier):**
    *   Primarily sourced from `employee.MedewerkerID` from the `window.alleMedewerkers` list.
    *   Fallback: `huidigeGebruikerVerlofContext.normalizedUsername` or `huidigeGebruikerVerlofContext.loginNaam`.
    *   Displayed in `ModalMedewerkerIDDisplay` (for visual confirmation).
    *   Stored and submitted via the hidden field `MedewerkerID`.

This process ensures that the correct employee is associated with the leave request, whether it's the logged-in user or another employee selected by a super-user, and leverages a central employee list (`window.alleMedewerkers`) for consistency where possible.
