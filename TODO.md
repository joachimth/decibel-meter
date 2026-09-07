# Decibel Meter - Project TODO

## Overview

A professional, open-source decibel meter web app optimized for iPhone (and iPad/desktop).
Runs entirely in-browser using the Web Audio API. Deployed as a public GitHub repo
with GitHub Pages auto-deploy via GitHub Actions.

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (dark mode)
- Web Audio API (AnalyserNode, custom biquad weighting)
- Vitest for tests
- GitHub Actions -> GitHub Pages

## Feature Checklist

### Core Measurement
- [x] Microphone access via getUserMedia (iOS Safari compatible)
- [x] AudioContext + AnalyserNode setup
- [x] RMS to dB SPL conversion
- [x] A-weighting filter (IEC 61672-1 biquad cascade)
- [x] C-weighting filter
- [x] Z-weighting (unweighted / flat)
- [x] Time weighting: Slow (1s), Fast (125ms), Impulse (35ms/1.5s)
- [x] Peak detector with hold
- [x] Min / Max / Avg / Peak tracking

### UI / Display
- [x] Analog-style gauge (SVG) with needle, arc zones, tick marks
- [x] Digital dB readout with color coding (green/yellow/orange/red)
- [x] Bottom tab navigation (Meter / Spectrum / Dose / History / Settings)
- [x] Start screen with permission prompt
- [x] Top bar with REC indicator, elapsed time, stop/start/reset, export buttons
- [x] Dark theme throughout (studio meter aesthetic)
- [x] iOS safe-area insets (notch / home indicator)
- [x] Responsive (mobile-first, works on desktop)

### Spectrum Analyzer
- [x] Real-time FFT from AnalyserNode
- [x] 48-band logarithmic frequency display (20Hz - 20kHz)
- [x] Color-coded bar heights
- [x] Frequency labels (octave intervals)
- [x] Adjustable dynamic range

### Dosimeter
- [x] OSHA standard (90dB criterion, 5dB exchange)
- [x] NIOSH standard (85dB criterion, 3dB exchange)
- [x] Dose percentage with bar
- [x] TWA (Time-Weighted Average) calculation
- [x] Remaining exposure time to 100% dose
- [x] 100% dose warning

### History
- [x] Time-series dB line graph (SVG)
- [x] Min/max/avg overlay lines
- [x] Duration and sample count
- [x] History sampled every 250ms, max ~1 hour buffer

### Settings
- [x] Frequency weighting selector (A/C/Z)
- [x] Response time selector (Slow/Fast/Impulse)
- [x] Calibration offset slider (-20 to +20 dB)
- [x] Gauge display range (min/max dB)
- [x] Spectrum dynamic range
- [x] Reset to defaults
- [x] Settings persisted to localStorage

### Data Export
- [x] CSV export (timestamp, level, weighting, response, calibration)
- [x] JSON export (full session record with metadata)
- [x] File download via Blob + URL.createObjectURL

### Reference Guide
- [x] Sound level reference table (0-140 dB)
- [x] Real-time "NOW" indicator showing current level position
- [x] Hearing safety warning

### PWA / iOS
- [x] Web app manifest
- [x] apple-mobile-web-app meta tags (standalone mode)
- [x] theme-color meta
- [x] viewport-fit=cover for safe areas
- [x] Apple touch icon (placeholder, needs generated icons)

### Infrastructure
- [x] GitHub Actions workflow (lint + test + build + Pages deploy)
- [x] SPA fallback (404.html = index.html)
- [x] vite base path for GitHub Pages subdirectory
- [x] README.md
- [x] LICENSE (MIT)
- [x] TODO.md (this file)

### Testing
- [x] dB math unit tests
- [x] A/C/Z weighting filter tests
- [x] Time weighting tests
- [x] Peak detector tests
- [x] Dose calculation tests (OSHA + NIOSH)
- [x] CSV/JSON export tests
- [x] Reference levels data tests

## Future Enhancements (not in scope for v1)

- [ ] Generated app icons (192px, 512px, 180px Apple touch)
- [ ] Service worker for offline use
- [ ] Octave band analysis (1/1 and 1/3 octave)
- [ ] Audio recording + playback
- [ ] Session save/load to IndexedDB
- [ ] Real-time noise map / location tagging
- [ ] Dark/light theme toggle
- [ ] Multi-language support
- [ ] Leq (equivalent continuous level) over configurable periods
- [ ] Percentile statistics (L10, L50, L90)
