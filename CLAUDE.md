# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript web application for Bansuri (Indian bamboo flute) players. It helps visualize notes on different flutes and recommends the best flute for playing specific melodies.

The app is a static site with no build process - just open `index.html` in a browser.

## Running the Application

```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Use a simple HTTP server
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Core Architecture

### Bansuri Music Theory Foundation

The entire application is built on one critical music theory concept:

**A Bansuri flute is named after its 4th scale degree (subdominant), NOT its root note.**

To find which major scale a flute plays: count **5 semitones DOWN** from the flute's name.

Example: An "A Flute" plays E Major (A - 5 semitones = E)

This relationship is implemented in `getRootNoteIndex()` in app.js:47-52.

### Code Structure

**app.js** (500+ lines) contains all application logic organized in clear sections:

1. **Constants** (lines 1-11): `NOTES` array, `MAJOR_SCALE_INTERVALS`, flat-to-sharp conversions
2. **Music Theory Functions** (lines 14-168): Core calculations for note conversions, scale generation, and flute scoring
3. **UI Rendering** (lines 170-378): Flute visualization with responsive horizontal/vertical orientations
4. **Flute Finder** (lines 380-459): Recommendation system that scores all 12 flutes against input notes
5. **Theme Management** (lines 461-475): Dark/light mode with localStorage persistence
6. **Event Listeners** (lines 477-537): Initialization and user interaction handling

### Key Algorithms

**Note Input Parsing** (app.js:68-108):
- Accepts space-separated or comma-separated notes
- Automatically converts flats (Db, Bb) to sharps (C#, A#)
- Validates against the `NOTES` array
- Deduplicates input

**Flute Scoring** (app.js:114-145):
- Calculates match percentage: matching notes / total input notes
- Separates notes into: matching (in scale), extra (not in scale)
- Returns full score object for rendering

**Visual Hole Mapping** (app.js:256-264):
- Maps scale degrees to physical hole positions on flute
- Order: Blow hole (7th note) → Finger holes 1-6 → Hole 6 (root note)
- Sargam labels: Ni, Dha, Pa, Ma, Ga, Re, Sa

### Responsive Design

The flute visualization switches between horizontal and vertical orientations based on screen width:
- Vertical: < 600px (mobile)
- Horizontal: ≥ 600px (desktop)

Implemented in `getOrientation()` (app.js:177-179) and re-renders on resize with debouncing.

### Color Coding System

When notes are entered, the visualization uses:
- **Blue (default)**: All scale notes (shown on the flute holes)
- **Green (extra)**: Notes in input but NOT in scale - shown separately above/beside the flute

## Important Files

- `index.html`: Main app interface with two sections (Visualizer and Finder)
- `app.js`: All application logic
- `styles.css`: CSS custom properties for theming, responsive flute rendering
- `High level App Description.html`: Detailed documentation of Bansuri theory and app usage

## Development Notes

### Making Changes to Music Theory

If modifying note calculations:
1. The `MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]` pattern is fundamental
2. The 5-semitone offset in `getRootNoteIndex()` is critical to Bansuri naming convention
3. Test with known examples: A Flute = E Major, C Flute = G Major, G Flute = D Major

### Modifying the Flute Visualization

The hole rendering logic in `renderFlute()` (app.js:187-347) relies on:
- `holeNotes` array mapping scale degrees to visual positions
- `holeLabels` providing Sargam notation (Sa, Re, Ga, Ma, Pa, Dha, Ni)
- Special styling for blow hole (index 0) and hole 6 (furthest from blow)

### Theme System

Dark/light mode uses CSS custom properties. All colors are defined in `:root` and `[data-theme="dark"]` in styles.css. Theme preference persists via localStorage key `bansuri-theme`.
