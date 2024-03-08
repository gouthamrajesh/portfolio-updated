/**
   * Sticky Header on Scroll
   */
const selectHeader = document.querySelector('#header');
if (selectHeader) {
  let headerOffset = selectHeader.offsetTop;
  let nextElement = selectHeader.nextElementSibling;

  const headerFixed = () => {
	if ((headerOffset - window.scrollY) <= 0) {
	  selectHeader.classList.add('sticked');
	  if (nextElement) nextElement.classList.add('sticked-header-offset');
	} else {
	  selectHeader.classList.remove('sticked');
	  if (nextElement) nextElement.classList.remove('sticked-header-offset');
	}
  }
  window.addEventListener('load', headerFixed);
  document.addEventListener('scroll', headerFixed);
}

/**
 * Navbar links active state on scroll
 */
let navbarlinks = document.querySelectorAll('#navbar a');

function navbarlinksActive() {
  navbarlinks.forEach(navbarlink => {

	if (!navbarlink.hash) return;

	let section = document.querySelector(navbarlink.hash);
	if (!section) return;

	let position = window.scrollY + 200;

	if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
	  navbarlink.classList.add('active');
	} else {
	  navbarlink.classList.remove('active');
	}
  })
}
window.addEventListener('load', navbarlinksActive);
document.addEventListener('scroll', navbarlinksActive);

/**
 * Mobile nav toggle
 */
const mobileNavShow = document.querySelector('.mobile-nav-show');
const mobileNavHide = document.querySelector('.mobile-nav-hide');

document.querySelectorAll('.mobile-nav-toggle').forEach(el => {
  el.addEventListener('click', function(event) {
	event.preventDefault();
	mobileNavToogle();
  })
});

function mobileNavToogle() {
  document.querySelector('body').classList.toggle('mobile-nav-active');
  mobileNavShow.classList.toggle('d-none');
  mobileNavHide.classList.toggle('d-none');
}