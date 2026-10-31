# VTOP Timetable Generator Extension

A browser extension that extracts course and slot details directly from your VTOP Course Registration page and visually generates your weekly timetable right below the Registered Credits(s) section, with one-click PNG download.

---

## Key Features

1. Universal Slot Mapping for Any Course:
   - Supports all VIT theory slots (A1-G1, A2-G2).
   - Supports all tutorial / extension slots (TA1-TG1, TAA1-TDD1, TA2-TG2, etc.).
   - Supports all lab slots (L1-L30 morning, L31-L60 afternoon).
   - Supports seminar slots (S1, S2, S3, S4, S11, S15).
   - Automatically parses multi-slot combinations (e.g. D1+TD1+TDD1, E1+TE1, L37+L38, etc.).

2. Automated Course Acronym Engine:
   - Automatically forms acronyms from course titles (first letters of each word, omitting stop words like and, of, in, to, for, the).
   - Example: Complex Variables and Linear Algebra -> CVLA
   - Example: Digital Image Processing -> DIP
   - Example: Natural Language Processing -> NLP
   - Example: Machine Learning -> ML
   - Special handling for Soft Skills (Soft Skill) -> STS
   - Special handling for Labs (Lab Only) -> ML LAB
   - Click to Edit: Click directly on any acronym in the timetable to customize it inline without popups.

3. High-Resolution Timetable Download:
   - Clicking the "Download Timetable" button renders a crisp, high-DPI 2x scale PNG.
   - Saves cleanly as TimeTable.png

4. Dynamic AJAX Navigation Support:
   - VTOP dynamically switches tabs using AJAX.
   - A built-in MutationObserver detects dynamic updates and automatically re-injects the timetable without requiring a full page refresh.

---

## How to Install

### Option A: Install as a Chrome / Edge / Brave Extension (Recommended)

1. Open your browser and navigate to the Extensions management page:
   - Chrome: chrome://extensions/
   - Brave: brave://extensions/
   - Edge: edge://extensions/
2. Enable "Developer mode" (toggle in the top-right corner).
3. Click the "Load unpacked" button.
4. Select the directory:
   `tt` (or `vtop-timetable-extension`)
5. The extension is now active. Open any VTOP registration page to view your visual timetable.

---

## Project Structure

```
vtopreg-timetable-gen/
|-- manifest.json              # Chrome Manifest V3 configuration
|-- content.js                 # Extraction, slot mapping, timetable injection & download logic
|-- content.css                # Visual stylesheet matching reference design
|-- popup.html                 # Extension toolbar popup UI
|-- popup.js                   # Popup actions
|-- lib/
|   `-- html2canvas.min.js     # Bundled offline high-res screenshot capture
|-- icons/
|   |-- icon16.png
|   |-- icon48.png
|   `-- icon128.png
`-- README.md
```
