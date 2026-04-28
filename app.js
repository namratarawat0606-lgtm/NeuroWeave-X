// ============================================================
// app.js — Tab Navigation
// Simple function to switch between the 4 modules
// ============================================================

function showTab(tabName) {
  // Hide all tab content panels
  document.querySelectorAll('.tab-content').forEach((el) => {
    el.classList.remove('active');
  });

  // Remove active styling from all nav tabs
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.classList.remove('active');
  });

  // Show the selected panel
  document.getElementById('tab-' + tabName).classList.add('active');

  // Highlight the selected nav button
  const activeBtn = document.querySelector(`.tab[onclick="showTab('${tabName}')"]`);
  if (activeBtn) activeBtn.classList.add('active');
}
