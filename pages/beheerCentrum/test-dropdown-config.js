/**
 * Test script to verify dropdown configuration in browser console
 * 
 * Open Beheercentrum page and paste this in the console to debug
 */

console.log('=== TESTING DROPDOWN CONFIGURATION ===');

// Test 1: Check if appConfiguratie is loaded
console.log('\n1. Testing appConfiguratie availability:');
console.log('window.appConfiguratie exists:', !!window.appConfiguratie);
console.log('Available keys:', Object.keys(window.appConfiguratie || {}));

// Test 2: Check specific list configurations
console.log('\n2. Testing specific list configurations:');
console.log('keuzelijstFuncties config:', window.appConfiguratie?.keuzelijstFuncties);
console.log('Teams config:', window.appConfiguratie?.Teams);

// Test 3: Check list names
console.log('\n3. Testing resolved list names:');
console.log('keuzelijstFuncties list name:', window.appConfiguratie?.keuzelijstFuncties?.lijstTitel);
console.log('Teams list name:', window.appConfiguratie?.Teams?.lijstTitel);

// Test 4: Check SharePoint context
console.log('\n4. Testing SharePoint context:');
console.log('spContext available:', typeof spContext !== 'undefined');
if (typeof spContext !== 'undefined') {
    console.log('spContext:', spContext);
}

// Test 5: Try to fetch data manually
console.log('\n5. Testing manual data fetch:');
if (typeof getListItems !== 'undefined' && window.appConfiguratie?.keuzelijstFuncties?.lijstTitel) {
    console.log('Attempting to fetch keuzelijstFuncties...');
    getListItems(window.appConfiguratie.keuzelijstFuncties.lijstTitel)
        .then(items => {
            console.log(`✓ Successfully fetched ${items.length} items from keuzelijstFuncties:`, items);
        })
        .catch(error => {
            console.error('✗ Error fetching keuzelijstFuncties:', error);
        });
        
    console.log('Attempting to fetch Teams...');
    getListItems(window.appConfiguratie.Teams.lijstTitel)
        .then(items => {
            console.log(`✓ Successfully fetched ${items.length} items from Teams:`, items);
        })
        .catch(error => {
            console.error('✗ Error fetching Teams:', error);
        });
} else {
    console.error('✗ getListItems function or appConfiguratie not available');
}

console.log('\n=== TEST COMPLETE ===');
