console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/";  // Your GitHub repository name

// Define all pages
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume.html', title: 'CV' },
  { url: 'https://github.com/jiangi1', title: 'GitHub', external: true }
];

// Create navigation element
let nav = document.createElement('nav');
document.body.prepend(nav);

// Add links
for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  // Handle base path for internal links
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }
  
  // Create link element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // Add current class if this is the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );
  
  // Open external links in new tab
  if (p.external || (a.host !== location.host && !url.startsWith('/'))) {
    a.target = '_blank';
  }
  
  nav.append(a);
}

// Create theme switcher UI
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="auto">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`
);

// Function to set the theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Get reference to the select element
let select = document.querySelector('.color-scheme select');

// Load saved preference from localStorage
let savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  select.value = savedTheme;
  setTheme(savedTheme);
} else {
  // Default to auto (follows OS)
  setTheme('auto');
}

// Listen for changes to the select dropdown
select.addEventListener('input', function(event) {
  setTheme(event.target.value);
});