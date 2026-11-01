// DSA spotlight: cursor-tracking glow for .dsa-spot cards.
// Vanilla rebuild of the 21st.dev Spotlight Card idea (no copied source):
// on mousemove, store the cursor position in CSS vars and the card's
// ::before radial gradient follows it.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dsa-spot').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    });
  });
});
