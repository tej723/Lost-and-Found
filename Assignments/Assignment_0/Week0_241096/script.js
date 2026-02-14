// Function to update greeting based on time of day
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById('greeting');
    
    if (hour >= 5 && hour < 12) {
        greetingElement.textContent = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greetingElement.textContent = 'Good Afternoon';
    } else {
        greetingElement.textContent = 'Good Evening';
    }
}

// Function to update current date
function updateDate() {
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    dateElement.textContent = formattedDate;
}

// Initialize and set interval to update
function init() {
    updateGreeting();
    updateDate();
    
    // Update greeting every minute
    setInterval(updateGreeting, 60000);
    
    // Update date at midnight
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight - new Date();
    
    setTimeout(() => {
        updateDate();
        // After first update, update daily
        setInterval(updateDate, 86400000);
    }, timeUntilMidnight);
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);