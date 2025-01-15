console.log("utils.js loaded");

/**
 * Function to send POST requests to the server
 * @param {string} url - The endpoint URL
 * @param {object} data - The data to send in the request body
 * @returns {Promise<object>} - The JSON response from the server
 */
export async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST', // HTTP method
        headers: {
            'Content-Type': 'application/json' // Specify JSON content
        },
        body: JSON.stringify(data) // Convert data to JSON string
    });
    console.log('posted to: ' + url);

    return response.json(); // Parse and return JSON response
}

/**
 * Function to send GET requests to the server
 * @param {string} url - The endpoint URL
 * @returns {Promise<object>} - The JSON response from the server
 */
export async function getData(url = '') {
    const response = await fetch(url, {
        method: 'GET' // HTTP method
    });
    console.log('fetched from:' + url);

    return response.json(); // Parse and return JSON response
}

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce interval in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
