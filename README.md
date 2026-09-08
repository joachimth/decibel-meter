# Decibel Meter

A professional, open-source decibel meter web app. Real-time sound pressure level measurement with frequency weighting, spectrum analysis, dosimetry, and data export. Runs entirely in the browser. Add to your iPhone home screen for a native-app experience.

**Live app:** [joachimth.github.io/decibel-meter](https://joachimth.github.io/decibel-meter/)

## Features

- **Real-time SPL meter** with analog-style gauge and digital readout
- **Frequency weighting**: A-weighting (human ear), C-weighting (high SPL), Z-weighting (flat)
- **Response time**: Slow (1s), Fast (125ms), Impulse (35ms rise / 1.5s decay)
- **Frequency spectrum analyzer**: 48-band logarithmic display, 20 Hz - 20 kHz
- **Level history graph**: time-series plot with min/max/avg overlays
- **Noise dosimeter**: OSHA and NIOSH standards, dose %, TWA, remaining exposure time
- **Calibration**: adjustable dB offset for matching a reference sound level meter
- **Data export**: CSV and JSON download of measurement sessions
- **Reference levels**: built-in guide from threshold of hearing to instant damage
- **PWA support**: installable on iPhone/iPad via Add to Home Screen
- **Privacy**: audio is processed entirely on-device. No data leaves your device.

## Tech Stack

- React 18 + TypeScript
- Vite 5 build tool
- Tailwind CSS 3
- Web Audio API (AnalyserNode + custom biquad weighting filters)
- Vitest for testing
- GitHub Actions CI/CD to GitHub Pages

## Accuracy

Phone microphone sensitivity varies by device and model. The default full-scale reference is 115 dB SPL (typical for phone mics, which clip around 110-125 dB). This app provides reliable **relative** measurements for comparing noise levels. For **absolute SPL accuracy**, calibrate against a certified sound level meter using the calibration offset in Settings. The spectrum display is scaled in the SPL domain: each frame the FFT bins are shifted so the spectrum's total energy matches the SPL reading, keeping bars and gauge consistent.

The A-weighting filter follows the IEC 61672-1 standard (biquad cascade via bilinear transform).

## Development

```bash
bun install
bun run dev        # local dev server on port 5174
bun run test       # run tests
bun run lint       # eslint
bun run build      # production build to dist/
```

## Architecture

```
src/
  main.tsx              Entry point
  App.tsx               Main app, tab routing, top bar
  index.css             Tailwind + custom styles
  types.ts              TypeScript types
  hooks/
    useAudioMeter.ts    Core audio engine: getUserMedia -> AnalyserNode -> weighting -> dB
    useLocalStorage.ts  Persisted settings
  lib/
    db.ts               dB math, A/C/Z weighting biquads, time weighting, peak detection
    reference.ts        Sound level reference data, OSHA/NIOSH dose calculation
    export.ts           CSV/JSON export + file download
  components/
    Gauge.tsx           Analog SVG gauge with needle, arc, ticks
    Spectrum.tsx        Logarithmic FFT bar display
    HistoryGraph.tsx    SVG time-series line graph
    StatsBar.tsx        Min/Avg/Max/Peak readout
    Dosimeter.tsx       Noise dose calculation display
    SettingsPanel.tsx   Weighting, response, calibration, range settings
    ReferenceLevels.tsx Sound level reference guide
    TabBar.tsx          Bottom tab navigation
    StartScreen.tsx     Permission/start screen
```

## License

MIT
