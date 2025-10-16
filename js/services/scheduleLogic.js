/**
 * Schedule Logic Functions
 * Pure functions for rotating schedule calculations and week type logic
 */

/**
 * Calculate which week type (A/B) a date falls into for 2-week rotations
 * @param {Date} targetDate - The date to calculate week type for
 * @param {Date} cycleStartDate - The start date of the rotation cycle
 * @returns {string} Week type 'A' or 'B'
 */
export const calculateWeekType = (targetDate, cycleStartDate) => {
    if (!cycleStartDate || !(cycleStartDate instanceof Date)) {
        return 'A'; // Default to week A if no cycle start date
    }
    
    // Calculate which calendar week each date falls into
    // We use Monday as the start of the week (getDay(): Sun=0, Mon=1, ..., Sat=6)
    const getWeekStartDate = (date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    
    // Get the Monday of the week containing the cycle start date
    const cycleWeekStart = getWeekStartDate(cycleStartDate);
    
    // Get the Monday of the week containing the target date
    const targetWeekStart = getWeekStartDate(targetDate);
    
    // Calculate the number of weeks between these Mondays
    const timeDiff = targetWeekStart.getTime() - cycleWeekStart.getTime();
    const weeksSinceCycleStart = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
    
    // Handle negative weeks (dates before cycle start) properly
    // Even weeks = A, Odd weeks = B (using mathematical modulo to handle negatives)
    const weekType = ((weeksSinceCycleStart % 2) + 2) % 2 === 0 ? 'A' : 'B';
    
    // DEBUG: Log week calculation details
    console.log(`🔍 Week calculation for ${targetDate.toLocaleDateString()}:`);
    console.log(`🔍 Cycle start: ${cycleStartDate.toLocaleDateString()} (week starts ${cycleWeekStart.toLocaleDateString()})`);
    console.log(`🔍 Target date: ${targetDate.toLocaleDateString()} (week starts ${targetWeekStart.toLocaleDateString()})`);
    console.log(`🔍 Weeks since cycle start: ${weeksSinceCycleStart}`);
    console.log(`🔍 Week type: ${weekType}`);
    
    return weekType;
};

console.log("Schedule logic utilities loaded successfully.");
