//Ex from gpt
// Modify the URL when a page is loaded
function loadPage(page) {
    const contentDiv = document.getElementById('content');
    
    // Simulate different "pages" by changing content
    switch(page) {
      case 'home':
        contentDiv.innerHTML = '<h1>Welcome to the Home Page!</h1>';
        history.pushState({ page: 'home' }, 'Home', '/home');
        break;
      case 'about':
        contentDiv.innerHTML = '<h1>About Us</h1><p>This is the about page.</p>';
        history.pushState({ page: 'about' }, 'About', '/about');
        break;
      case 'contact':
        contentDiv.innerHTML = '<h1>Contact Us</h1><p>Here is how you can contact us.</p>';
        history.pushState({ page: 'contact' }, 'Contact', '/contact');
        break;
      default:
        contentDiv.innerHTML = '<h1>404 - Page Not Found</h1>';
        break;
    }
  }
  