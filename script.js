const content = document.getElementById('content');

// Check if dark mode is preferred by the user
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    activateDarkMode();
}

// Function to activate dark mode
function activateDarkMode() {
    var element = document.body;
    element.classList.toggle("dark-mode");
}


