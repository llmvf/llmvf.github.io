const button = document.querySelector('.menu-button');
const navigation = document.querySelector('#site-nav');
button?.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    button.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }
});
