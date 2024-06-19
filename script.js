document.getElementById('toggle-theme').addEventListener('click', function() {
  const body = document.body;
  const themeIcon = document.getElementById('theme-icon');
  const circle = document.querySelector('.circle');

  // Toggle between dark and light modes
  if (body.classList.contains('dark-mode')) {
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
      themeIcon.src = 'lightmodelogo.png';
      circle.classList.remove('dark-mode');
      circle.classList.add('light-mode');
  } else {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      themeIcon.src = 'darkmode.png';
      circle.classList.remove('light-mode');
      circle.classList.add('dark-mode');
  }
});


// Animation for stuff later in page
document.addEventListener("DOMContentLoaded", () => {

	// Use Intersection Observer to determine if objects are within the viewport
	const observer = new IntersectionObserver(entries => {
	  entries.forEach(entry => {
		if (entry.isIntersecting) {
		  entry.target.classList.add('in-view');
		  return;
		}
		entry.target.classList.remove('in-view');
	  });
	});

	// Get all the elements with the .animate class applied
	const allAnimatedElements = document.querySelectorAll('.animate');

	// Add the observer to each of those elements
	allAnimatedElements.forEach((element) => observer.observe(element));

}); 

// Function to scroll away
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
  



//Scroll to top button
  document.getElementById('scrollButton').addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});