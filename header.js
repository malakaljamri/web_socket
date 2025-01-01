// app.js

// Function to load different pages dynamically
function loadPage(page) {
    const contentDiv = document.getElementById('content');
    
    // Simulate different "pages" by changing content
    switch(page) {
      case 'home':
        contentDiv.innerHTML = '<h1>Welcome to the Home Page!</h1>';
        break;
      case 'posts':
        contentDiv.innerHTML = '<h1>P:</h1><p>post side</p>';
        break;
      case 'comments':
        contentDiv.innerHTML = '<h1>C:</h1><p>Comment side</p>';
        break;
      case 'direct-msgs':
          contentDiv.innerHTML = '<h1>D:</h1><p>Direct msg</p>';
        break;
      case 'liked-posts':
          contentDiv.innerHTML = '<h1>L:</h1><p>Liked post :)</p>';
        break;
      default:
        contentDiv.innerHTML = '<h1>404 - Page Not Found</h1>';
    }
    // Update the browser history
    history.pushState({ page: page }, '', `/${page}`);
  }
  
  // Load the home page by default
//   loadPage('home');

 //Handle browser back and forward navigation
    document.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        loadPage(event.state.page);
    }
    });

    // Example of loading content dynamically via AJAX
    function loadContentFromServer() {
    fetch('https://api.example.com/content')
        .then(response => response.json())
        .then(data => {
        // Assuming the response contains the HTML content you want to load
        document.getElementById('content').innerHTML = data.html;
        })
        .catch(error => console.error('Error loading content:', error));
    }

    // Load the Home page by default when the page is loaded
    document.addEventListener('DOMContentLoaded', () => {
    loadPage('home');
    });
  