/* ============================================================
   THE CHRONICLE OF GOUTHAM RAJESH
   Interactions: back-to-top button & smooth index navigation
   ============================================================ */
(function () {
  'use strict';

  var backToTop = document.getElementById('backToTop');

  // Show the back-to-top button only after the reader scrolls past the masthead
  function onScroll() {
    if (!backToTop) return;
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  // Scroll to top on click
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      var top = document.getElementById('top');
      if (top) {
        top.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Offset anchor jumps so section headers aren't hidden behind nothing
  // (keeps the double-rule visible above each section when navigated to)
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // update URL without an abrupt jump
      if (history.pushState) {
        history.pushState(null, '', targetId);
      }
    });
  });
})();
