const button = document.querySelector('.menu-button');
const navigation = document.querySelector('#site-nav');
const closeMenu = () => {
  button?.setAttribute('aria-expanded', 'false');
  navigation?.classList.remove('open');
};
button?.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    closeMenu();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && button?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    button?.focus();
  }
});
