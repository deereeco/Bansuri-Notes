// ============================================
// CONSTANTS
// ============================================
const NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

// Flat to sharp conversion
const FLAT_TO_SHARP = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
  'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'
};

// ============================================
// MUSIC THEORY FUNCTIONS
// ============================================

/**
 * Convert note name to index (0-11)
 */
function noteToIndex(noteName) {
  // Normalize the note name
  let note = noteName.trim().toUpperCase();

  // Handle flats - convert to sharps
  if (note.includes('B') && note.length > 1 && note[1] === 'B') {
    // It's a flat (e.g., "BB" for Bb, or "DB" for Db)
    // This handles case like "Bb" becoming "BB" after toUpperCase
  }

  // Check for flat notation (letter followed by 'b' or 'B')
  if (note.length >= 2) {
    const possibleFlat = note[0] + 'b';
    if (FLAT_TO_SHARP[possibleFlat]) {
      note = FLAT_TO_SHARP[possibleFlat];
    }
  }

  // Find index
  const index = NOTES.indexOf(note);
  return index;
}

/**
 * Get the root note of a flute's scale
 * Flute name is the 4th scale degree, so root = fluteName - 5 semitones
 */
function getRootNoteIndex(fluteName) {
  const fluteIndex = noteToIndex(fluteName);
  if (fluteIndex === -1) return -1;
  // Subtract 5 semitones (mod 12 for wrap-around)
  return (fluteIndex - 5 + 12) % 12;
}

/**
 * Get all notes in a major scale given the root note index
 */
function getScaleNotes(rootIndex) {
  return MAJOR_SCALE_INTERVALS.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTES[noteIndex];
  });
}

/**
 * Parse user note input (space or comma separated)
 * Handles sharps (#) and flats (b), converts flats to sharps
 */
function parseNoteInput(inputString) {
  if (!inputString || !inputString.trim()) return [];

  // Replace commas with spaces, then split by spaces
  const parts = inputString.replace(/,/g, ' ').split(/\s+/);
  const notes = [];

  for (const part of parts) {
    if (!part.trim()) continue;

    let note = part.trim();

    // Normalize: capitalize first letter, handle sharp/flat
    if (note.length >= 1) {
      note = note[0].toUpperCase() + note.slice(1).toLowerCase();
    }

    // Handle flats
    if (note.length >= 2 && note[1] === 'b') {
      const flatKey = note[0].toUpperCase() + 'b';
      if (FLAT_TO_SHARP[flatKey]) {
        note = FLAT_TO_SHARP[flatKey];
      }
    }

    // Handle sharps - normalize to uppercase #
    if (note.includes('#')) {
      note = note[0].toUpperCase() + '#';
    }

    // Validate it's a real note
    if (NOTES.includes(note)) {
      // Only add if not already in the list (avoid duplicates)
      if (!notes.includes(note)) {
        notes.push(note);
      }
    }
  }

  return notes;
}

/**
 * Score a flute against a set of input notes
 * Returns { fluteName, rootNote, scaleNotes, matchCount, matchPercent, matchingNotes, extraNotes }
 */
function scoreFlute(fluteName, inputNotes) {
  const rootIndex = getRootNoteIndex(fluteName);
  const rootNote = NOTES[rootIndex];
  const scaleNotes = getScaleNotes(rootIndex);

  let matchCount = 0;
  const matchingNotes = [];
  const extraNotes = [];

  for (const note of inputNotes) {
    if (scaleNotes.includes(note)) {
      matchCount++;
      matchingNotes.push(note);
    } else {
      extraNotes.push(note);
    }
  }

  const matchPercent = inputNotes.length > 0
    ? Math.round((matchCount / inputNotes.length) * 100)
    : 0;

  return {
    fluteName,
    rootNote,
    scaleNotes,
    matchCount,
    matchPercent,
    matchingNotes,
    extraNotes
  };
}

/**
 * Find best flutes for given input notes
 * Returns array sorted by match percentage (descending)
 */
function findBestFlutes(inputNotes) {
  const results = [];

  for (const fluteName of NOTES) {
    const score = scoreFlute(fluteName, inputNotes);
    results.push(score);
  }

  // Sort by matchPercent descending, then by matchCount descending
  results.sort((a, b) => {
    if (b.matchPercent !== a.matchPercent) {
      return b.matchPercent - a.matchPercent;
    }
    return b.matchCount - a.matchCount;
  });

  return results;
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

/**
 * Get current orientation based on screen width
 */
function getOrientation() {
  return window.innerWidth < 600 ? 'vertical' : 'horizontal';
}

/**
 * Render a flute visualization
 * @param {HTMLElement} container - Container element
 * @param {string[]} scaleNotes - The 7 notes of the flute's scale
 * @param {string[]} inputNotes - User's input notes (optional)
 */
function renderFlute(container, scaleNotes, inputNotes = []) {
  const orientation = getOrientation();
  const hasInput = inputNotes.length > 0;

  // Create flute element
  const flute = document.createElement('div');
  flute.className = `flute ${orientation}`;

  // Create flute body (background)
  const body = document.createElement('div');
  body.className = 'flute-body';
  flute.appendChild(body);

  // The scale notes correspond to holes:
  // Note 0 (Sa/root) = all holes closed - we'll show this at blow hole for reference
  // Note 1-7 = holes 1-7 (where hole 7 is all open = 7th note)

  // Actually, looking at the description again:
  // - All 6 holes closed = 1st note (Sa)
  // - Open hole 6 = 2nd note
  // - Open holes 5-6 = 3rd note
  // - Open holes 4-6 = 4th note (Ma, flute's name)
  // - Open holes 3-6 = 5th note
  // - Open holes 2-6 = 6th note
  // - All 6 holes open = 7th note

  // So we have:
  // Blow hole (separate, no finger position)
  // Holes 1-6: finger holes
  // The 7 scale notes map to hole configurations

  // For visualization, let's show:
  // - Blow hole separately
  // - 6 finger holes, each labeled with the note when closed up to that point

  // Actually, let me reconsider. The user wants to see which notes map to which holes.
  // The simplest approach: show 7 holes (blow + 6 finger holes), where:
  // - Position 0 (blow hole): shows the full scale or root indicator
  // - Positions 1-6 (finger holes 1-6): show notes as they're revealed by opening

  // Clearer approach based on the description:
  // Hole 6 (rightmost/bottom): when opened alone, gives note 2
  // Holes 5-6 open: note 3
  // etc.

  // But for visual clarity, let's label each hole with the note produced when
  // that hole (and all holes below it) are open:
  // Hole 1 (closest to blow): when 1-6 all open = note 7 (Ni)
  // Hole 2: when 2-6 open = note 6 (Dha)
  // Hole 3: when 3-6 open = note 5 (Pa)
  // Hole 4: when 4-6 open = note 4 (Ma)
  // Hole 5: when 5-6 open = note 3 (Ga)
  // Hole 6: when only 6 open = note 2 (Re)
  // All closed = note 1 (Sa) - shown at blow hole or as label

  // Correct mapping from blow hole to far end:
  // Blow hole: All holes open = 7th note (Ni)
  // Hole 1: When 1-6 open = 7th note, when 2-6 open = 6th note (Dha)
  // Hole 2: When 2-6 open = 6th note (Dha)
  // Hole 3: When 3-6 open = 5th note (Pa)
  // Hole 4: When 4-6 open = 4th note (Ma - flute name)
  // Hole 5: When 5-6 open = 3rd note (Ga)
  // Hole 6: When only 6 open = 2nd note (Re)
  // All closed = 1st note (Sa)

  // Visual layout from blow hole to far end:
  // D# - C# - B - A - G# - F# - E (for A flute)
  // Ni - Dha - Pa - Ma - Ga - Re - Sa

  const holeNotes = [
    scaleNotes[6], // Blow hole (Ni - 7th note)
    scaleNotes[5], // Hole 1 (Dha - 6th note)
    scaleNotes[4], // Hole 2 (Pa - 5th note)
    scaleNotes[3], // Hole 3 (Ma - 4th note, flute name)
    scaleNotes[2], // Hole 4 (Ga - 3rd note)
    scaleNotes[1], // Hole 5 (Re - 2nd note)
    scaleNotes[0], // Hole 6 (Sa - 1st note, root)
  ];

  const holeLabels = ['Ni', 'Dha', 'Pa', 'Ma', 'Ga', 'Re', 'Sa'];

  // Create holes
  for (let i = 0; i < 7; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'hole-wrapper';

    if (i === 0) {
      wrapper.classList.add('blow-hole');
    } else if (i === 6) {
      wrapper.classList.add('hole-6');
    }

    const hole = document.createElement('div');
    hole.className = 'hole';

    if (i === 0) {
      hole.classList.add('blow-hole');
    }

    const note = holeNotes[i];
    hole.textContent = note;

    // Determine color class
    if (hasInput) {
      if (inputNotes.includes(note)) {
        // Note is in user input
        hole.classList.add('default');
      } else {
        // Note is in scale but not in input - avoid
        hole.classList.add('avoid');
      }
    } else {
      // No input - show all as default
      hole.classList.add('default');
    }

    wrapper.appendChild(hole);

    // Add label below/beside the hole
    const label = document.createElement('div');
    label.className = 'hole-label';
    if (i === 0) {
      label.textContent = 'BLOW';
      label.style.fontWeight = 'bold';
      label.style.fontSize = '0.65rem';
    } else {
      label.textContent = holeLabels[i];
    }
    wrapper.appendChild(label);

    flute.appendChild(wrapper);
  }

  // Add extra notes indicator if there are notes not in scale
  if (hasInput) {
    const extraNotes = inputNotes.filter(n => !scaleNotes.includes(n));
    if (extraNotes.length > 0) {
      const extraContainer = document.createElement('div');
      extraContainer.className = 'extra-notes-container';
      extraContainer.style.marginTop = orientation === 'vertical' ? '1rem' : '0';
      extraContainer.style.marginLeft = orientation === 'horizontal' ? '2rem' : '0';
      extraContainer.style.display = 'flex';
      extraContainer.style.flexDirection = orientation === 'vertical' ? 'row' : 'column';
      extraContainer.style.gap = '0.5rem';
      extraContainer.style.alignItems = 'center';

      for (const note of extraNotes) {
        const extraHole = document.createElement('div');
        extraHole.className = 'hole extra';
        extraHole.textContent = note;
        extraHole.title = 'This note is not in the scale';
        extraContainer.appendChild(extraHole);
      }

      flute.appendChild(extraContainer);
    }
  }

  container.innerHTML = '';
  container.appendChild(flute);
}

/**
 * Update the visualizer section
 */
function updateVisualizer() {
  const fluteSelect = document.getElementById('flute-select');
  const notesInput = document.getElementById('visualizer-notes');
  const scaleInfo = document.getElementById('scale-info');
  const fluteContainer = document.getElementById('visualizer-flute');
  const legend = document.querySelector('#visualizer-section .legend');

  const fluteName = fluteSelect.value;
  const rootIndex = getRootNoteIndex(fluteName);
  const rootNote = NOTES[rootIndex];
  const scaleNotes = getScaleNotes(rootIndex);
  const inputNotes = parseNoteInput(notesInput.value);

  // Update scale info
  scaleInfo.innerHTML = `
    <strong>${fluteName} Flute</strong> plays <strong>${rootNote} Major</strong><br>
    Scale: ${scaleNotes.join(' - ')}
  `;

  // Show/hide legend based on whether notes are entered
  if (legend) {
    legend.style.display = inputNotes.length > 0 ? 'flex' : 'none';
  }

  // Render flute
  renderFlute(fluteContainer, scaleNotes, inputNotes);
}

// ============================================
// FLUTE FINDER
// ============================================

let finderResults = [];
let displayedResultCount = 0;

/**
 * Run flute recommendation
 */
function recommendFlutes() {
  const notesInput = document.getElementById('finder-notes');
  const resultsContainer = document.getElementById('finder-results');
  const addNextBtn = document.getElementById('add-next-btn');

  const inputNotes = parseNoteInput(notesInput.value);

  if (inputNotes.length === 0) {
    resultsContainer.innerHTML = '<p style="color: var(--text-secondary);">Please enter some notes to get recommendations.</p>';
    addNextBtn.style.display = 'none';
    return;
  }

  finderResults = findBestFlutes(inputNotes);
  displayedResultCount = 0;
  resultsContainer.innerHTML = '';

  // Show first result
  addNextResult(inputNotes);

  // Show "Add Next" button if there are more results
  addNextBtn.style.display = displayedResultCount < finderResults.length ? 'block' : 'none';
}

/**
 * Add next result card
 */
function addNextResult(inputNotes) {
  if (displayedResultCount >= finderResults.length) return;

  const resultsContainer = document.getElementById('finder-results');
  const addNextBtn = document.getElementById('add-next-btn');
  const result = finderResults[displayedResultCount];

  // If inputNotes not provided, parse from input
  if (!inputNotes) {
    inputNotes = parseNoteInput(document.getElementById('finder-notes').value);
  }

  const card = document.createElement('div');
  card.className = 'result-card';

  const header = document.createElement('h3');
  header.innerHTML = `
    #${displayedResultCount + 1} ${result.fluteName} Flute
    <span class="match-badge">${result.matchPercent}% match</span>
  `;
  card.appendChild(header);

  const info = document.createElement('div');
  info.className = 'scale-info';
  info.innerHTML = `
    Plays <strong>${result.rootNote} Major</strong><br>
    Scale: ${result.scaleNotes.join(' - ')}<br>
    Matching: ${result.matchingNotes.length > 0 ? result.matchingNotes.join(', ') : 'none'}
    ${result.extraNotes.length > 0 ? `<br>Not in scale: ${result.extraNotes.join(', ')}` : ''}
  `;
  card.appendChild(info);

  const fluteContainer = document.createElement('div');
  fluteContainer.className = 'flute-container';
  renderFlute(fluteContainer, result.scaleNotes, inputNotes);
  card.appendChild(fluteContainer);

  resultsContainer.appendChild(card);
  displayedResultCount++;

  // Update button visibility
  addNextBtn.style.display = displayedResultCount < finderResults.length ? 'block' : 'none';
}

// ============================================
// THEME MANAGEMENT
// ============================================

function initTheme() {
  const saved = localStorage.getItem('bansuri-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bansuri-theme', next);
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initTheme();

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Visualizer controls
  document.getElementById('flute-select').addEventListener('change', updateVisualizer);
  document.getElementById('visualizer-notes').addEventListener('input', debounce(updateVisualizer, 300));

  // Finder controls
  document.getElementById('recommend-btn').addEventListener('click', recommendFlutes);
  document.getElementById('add-next-btn').addEventListener('click', () => addNextResult());

  // Handle Enter key on finder input
  document.getElementById('finder-notes').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      recommendFlutes();
    }
  });

  // Re-render on resize (debounced)
  const debouncedRerender = debounce(() => {
    updateVisualizer();
    // Re-render finder results if any
    if (displayedResultCount > 0) {
      const inputNotes = parseNoteInput(document.getElementById('finder-notes').value);
      const resultsContainer = document.getElementById('finder-results');
      resultsContainer.innerHTML = '';
      const tempCount = displayedResultCount;
      displayedResultCount = 0;
      for (let i = 0; i < tempCount; i++) {
        addNextResult(inputNotes);
      }
    }
  }, 250);

  window.addEventListener('resize', debouncedRerender);

  // Initial render
  updateVisualizer();
});
