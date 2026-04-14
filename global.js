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

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

let select = document.querySelector('.color-scheme select');

let savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  select.value = savedTheme;
  setTheme(savedTheme);
} else {
  setTheme('dark');
}

select.addEventListener('input', function(event) {
  setTheme(event.target.value);
});