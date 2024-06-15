document.getElementById('toggle-theme').addEventListener('click', function() {
    const body = document.body;
    const button = document.getElementById('toggle-theme');
    const themeIcon = document.getElementById('theme-icon');
    const circle = document.querySelector('.circle');

    // Change color for dark mode
    if (body.style.backgroundColor === 'white') {
        body.style.backgroundColor = '#121212';
        body.style.color = '#D6CACA';
        themeIcon.src = 'darkmode.png';
        circle.style.backgroundColor = '#D6CACA';


    } else {// Change color for light mode
        body.style.backgroundColor = 'white';
        body.style.color = '#000000';
        themeIcon.src = 'lightmodelogo.png';
        circle.style.backgroundColor = '#f39c12'; 

    }
});


// Function to handle scroll event
function handleScroll() {
    const circle = document.querySelector('.circle');
    const triangleRed = document.querySelector('.triangle-red');
    const triangleNavy = document.querySelector('.triangle-navy');
  
    // Check if user has scrolled past certain point (adjust as needed)
    if (window.scrollY > 200 && window.innerWidth > 768) { // Ensure scroll trigger only applies on larger screens
      // Add hide class to slide elements off to the left
      circle.classList.add('hide');
      triangleRed.classList.add('hide');
      triangleNavy.classList.add('hide');
    } else {
      // Remove hide class to slide elements back into view
      circle.classList.remove('hide');
      triangleRed.classList.remove('hide');
      triangleNavy.classList.remove('hide');
    }
  }
  
  // Event listener for scroll event
  window.addEventListener('scroll', handleScroll);
  
  // Event listener for window resize to handle responsive behavior
  window.addEventListener('resize', () => {
    handleScroll(); // Re-run scroll handling on resize
  });
  
  // Initial call to handleScroll to set initial state based on viewport
  handleScroll();
  


