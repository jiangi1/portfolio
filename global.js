console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/";

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume.html', title: 'CV' },
  { url: 'https://github.com/jiangi1', title: 'GitHub', external: true }
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }
  
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );
  
  if (p.external || (a.host !== location.host && !url.startsWith('/'))) {
    a.target = '_blank';
  }
  
  nav.append(a);
}

// Create the theme switcher UI
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="dark">Dark (Glassmorphism)</option>
      <option value="light">Light (Lavender)</option>
      <option value="auto">Automatic</option>
    </select>
  </label>`
);

// Function to set the color scheme and save to localStorage
function setColorScheme(colorScheme) {
  document.documentElement.setAttribute('data-theme', colorScheme);
  localStorage.setItem('colorScheme', colorScheme);
}

// Get reference to the select element
let select = document.querySelector('.color-scheme select');

// Load saved preference from localStorage (persists across page loads)
let savedScheme = localStorage.getItem('colorScheme');
if (savedScheme) {
  select.value = savedScheme;
  setColorScheme(savedScheme);
} else {
  // Default to dark if no saved preference
  setColorScheme('dark');
}

// Listen for changes to the select dropdown
select.addEventListener('input', function (event) {
  setColorScheme(event.target.value);
});

let contactForm = document.querySelector('form');

// Add submit event listener if the form exists
contactForm?.addEventListener('submit', function(event) {
    // Prevent default form submission
    event.preventDefault();
    
    // Create FormData object from the form
    let data = new FormData(contactForm);
    
    // Build URL parameters
    let params = [];
    for (let [name, value] of data) {
        // Encode each value properly for URLs
        params.push(`${name}=${encodeURIComponent(value)}`);
    }
    
    // Build the final URL
    let url = contactForm.action + '?' + params.join('&');
    
    // Open the email client with the encoded data
    location.href = url;
});

export async function fetchJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
      return [];
    }
  }

  export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) return;
    
    containerElement.innerHTML = '';
    
    for (let project of projects) {
      const article = document.createElement('article');
      article.innerHTML = `
        <${headingLevel}>${project.title}</${headingLevel}>
        <img src="${project.image}" alt="${project.title}">
        <div class="project-year">${project.year}</div>
        <p>${project.description}</p>
      `;
      containerElement.appendChild(article);
    }
  }