console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/";  // Your GitHub Pages repo name

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