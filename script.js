
const toggle = document.querySelector('[data-menu-toggle]');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => links.classList.toggle('open'));
}

const path = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
});

const revealSelector = '.section,.card,.product-card,.order-card,.location-card,.photo-block,.map,.poster-row img,.notice,.feature-card,.location-preview,.menu-showcase,.accent-card';
const revealItems = document.querySelectorAll(revealSelector);

// Keep content visible by default. Animations are only enabled after JS is ready,
// so a browser, preview tool or hosting issue can never leave the page blank.
document.documentElement.classList.add('animate-ready');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px 120px 0px' });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('in-view'));
}

window.addEventListener('load', () => {
  document.querySelectorAll('.hero, .brand-strip').forEach(item => item.classList.add('in-view'));
});

document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  const isInternal = href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !link.target;
  if (!isInternal) return;
  link.addEventListener('click', event => {
    event.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { window.location.href = href; }, 160);
  });
});
