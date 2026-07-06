// Nav scroll behavior
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mark active nav link
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// Sermon thumbnail color placeholders (cycling palette)
const placeholderGradients = [
  'linear-gradient(135deg, #1a1d2c 0%, #2a2040 100%)',
  'linear-gradient(135deg, #0f1a1a 0%, #1a3030 100%)',
  'linear-gradient(135deg, #1a160a 0%, #332a10 100%)',
  'linear-gradient(135deg, #1a0f0f 0%, #2a1818 100%)',
  'linear-gradient(135deg, #0a1a1a 0%, #103028 100%)',
];
document.querySelectorAll('.sermon-thumb-placeholder').forEach((el, i) => {
  el.style.background = placeholderGradients[i % placeholderGradients.length];
});
