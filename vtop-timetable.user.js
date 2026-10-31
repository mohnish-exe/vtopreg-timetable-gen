// ==UserScript==
// @name         VTOP Visual Timetable Generator
// @namespace    https://vit.ac.in/
// @version      1.2.0
// @description  Dynamically visualizes and injects your FFCS timetable into VTOP registration pages with PNG download.
// @author       Antigravity
// @match        *://*.vit.ac.in/*
// @match        *://*/*vtop*
// @match        http://localhost/*
// @match        file:///*
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const css = `
    #vtop-timetable-container {
        margin-top: 35px;
        margin-bottom: 50px;
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
        width: 100%;
        clear: both;
    }
    .vtop-tt-header-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 12px;
        padding: 0 4px;
    }
    .vtop-download-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background-color: #437e55;
        color: #ffffff !important;
        font-size: 14px;
        font-weight: 600;
        padding: 9px 18px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease-in-out;
    }
    .vtop-download-btn:hover {
        background-color: #356743;
        transform: translateY(-1px);
    }
    #vtop-timetable-capture-area {
        background-color: #ffffff !important;
        padding: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        overflow-x: auto;
        box-sizing: border-box;
    }
    .vtop-tt-table {
        width: 100%;
        min-width: 1100px;
        border-collapse: collapse;
        table-layout: fixed;
        background-color: #ffffff !important;
        border: 1.5px solid #333333 !important;
    }
    .vtop-tt-table th, .vtop-tt-table td {
        border: 1px solid #333333 !important;
        text-align: center;
        vertical-align: middle;
        padding: 6px 2px;
        line-height: 1.3;
        box-sizing: border-box;
    }
    .vtop-tt-cat-header {
        background-color: #cfd5dc !important;
        color: #111827 !important;
        font-weight: 800;
        font-size: 13px;
        width: 85px;
        text-transform: uppercase;
        padding: 8px 2px !important;
    }
    .vtop-tt-theory-morning { background-color: #ced6f7 !important; color: #000000 !important; font-size: 11.5px; font-weight: 700 !important; }
    .vtop-tt-theory-afternoon { background-color: #ced6f7 !important; color: #000000 !important; font-size: 11.5px; font-weight: 700 !important; }
    .vtop-tt-lab-morning { background-color: #bfe3fd !important; color: #000000 !important; font-size: 11.5px; font-weight: 700 !important; }
    .vtop-tt-lab-afternoon { background-color: #bfe3fd !important; color: #000000 !important; font-size: 11.5px; font-weight: 700 !important; }
    .vtop-tt-lunch-header-sep { background-color: #9ca3af !important; width: 22px; padding: 0 !important; }
    .vtop-tt-day-cell { background-color: #cfd5dc !important; color: #111827 !important; font-weight: 800; font-size: 13px; }
    .vtop-tt-lunch-cell {
        background-color: #cfd5dc !important;
        color: #111827 !important;
        font-weight: 800;
        font-size: 13px;
        width: 22px;
        line-height: 1.6;
        padding: 10px 2px !important;
        letter-spacing: 2px;
    }
    .vtop-tt-cell {
        background-color: #fffff0 !important;
        color: #8c8c8c;
        font-size: 12px;
        height: 50px;
    }
    .vtop-tt-cell .vtop-slot-label { font-size: 12px; color: #8c8c8c; }
    .vtop-tt-cell.vtop-allocated {
        background-color: #d6f58a !important;
        color: #111827;
    }
    .vtop-tt-cell.vtop-allocated .vtop-slot-label {
        font-size: 12px;
        color: #1f2937;
        font-weight: 500;
        display: block;
        margin-bottom: 2px;
        pointer-events: none;
    }
    .vtop-tt-cell.vtop-allocated .vtop-course-acronym {
        font-size: 12px;
        font-weight: 800;
        color: #000000;
        display: inline-block;
        padding: 1px 3px;
        border-radius: 2px;
        cursor: text;
        outline: none;
    }
    .vtop-tt-cell.vtop-allocated .vtop-course-acronym:focus {
        background-color: #ffffff;
        box-shadow: 0 0 0 2px #3b82f6;
    }
    .vtop-table-responsive { overflow-x: auto; width: 100%; }
    .vtop-tt-footer-info {
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #64748b;
    }
    .vtop-tt-legend { display: inline-flex; align-items: center; gap: 6px; }
    .vtop-legend-box {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        border: 1px solid #333333;
        background-color: #d6f58a;
        display: inline-block;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.innerHTML = css;
  document.head.appendChild(styleEl);

  const TIMETABLE_CONFIG = {
    theoryHours: [
      { start: '8:00 AM', end: '8:50 AM' }, { start: '8:55 AM', end: '9:45 AM' }, { start: '9:50 AM', end: '10:40 AM' },
      { start: '10:45 AM', end: '11:35 AM' }, { start: '11:40 AM', end: '12:30 PM' }, { start: '12:35 PM', end: '1:25 PM' },
      { start: '2:00 PM', end: '2:50 PM' }, { start: '2:55 PM', end: '3:45 PM' }, { start: '3:50 PM', end: '4:40 PM' },
      { start: '4:45 PM', end: '5:35 PM' }, { start: '5:40 PM', end: '6:30 PM' }, { start: '6:35 PM', end: '7:25 PM' }
    ],
    labHours: [
      { start: '08:00 AM', end: '08:50 AM' }, { start: '08:50 AM', end: '09:40 AM' }, { start: '09:50 AM', end: '10:40 AM' },
      { start: '10:40 AM', end: '11:30 AM' }, { start: '11:40 AM', end: '12:30 PM' }, { start: '12:30 PM', end: '1:20 PM' },
      { start: '2:00 PM', end: '2:50 PM' }, { start: '2:50 PM', end: '3:40 PM' }, { start: '3:50 PM', end: '4:40 PM' },
      { start: '4:40 PM', end: '5:30 PM' }, { start: '5:40 PM', end: '6:30 PM' }, { start: '6:30 PM', end: '7:20 PM' }
    ],
    days: [
      {
        name: 'MON',
        periods: [
          { label: 'A1 / L1', slots: ['A1', 'L1'] }, { label: 'F1 / L2', slots: ['F1', 'L2'] },
          { label: 'D1 / L3', slots: ['D1', 'L3'] }, { label: 'TB1 / L4', slots: ['TB1', 'L4'] },
          { label: 'TG1 / L5', slots: ['TG1', 'L5'] }, { label: 'S11 / L6', slots: ['S11', 'L6'] },
          { label: 'A2 / L31', slots: ['A2', 'L31'] }, { label: 'F2 / L32', slots: ['F2', 'L32'] },
          { label: 'D2 / L33', slots: ['D2', 'L33'] }, { label: 'TB2 / L34', slots: ['TB2', 'L34'] },
          { label: 'TG2 / L35', slots: ['TG2', 'L35'] }, { label: 'S3 / L36', slots: ['S3', 'L36'] }
        ]
      },
      {
        name: 'TUE',
        periods: [
          { label: 'B1 / L7', slots: ['B1', 'L7'] }, { label: 'G1 / L8', slots: ['G1', 'L8'] },
          { label: 'E1 / L9', slots: ['E1', 'L9'] }, { label: 'TC1 / L10', slots: ['TC1', 'L10'] },
          { label: 'TAA1 / L11', slots: ['TAA1', 'L11'] }, { label: 'L12', slots: ['L12'] },
          { label: 'B2 / L37', slots: ['B2', 'L37'] }, { label: 'G2 / L38', slots: ['G2', 'L38'] },
          { label: 'E2 / L39', slots: ['E2', 'L39'] }, { label: 'TC2 / L40', slots: ['TC2', 'L40'] },
          { label: 'TAA2 / L41', slots: ['TAA2', 'L41'] }, { label: 'S1 / L42', slots: ['S1', 'L42'] }
        ]
      },
      {
        name: 'WED',
        periods: [
          { label: 'C1 / L13', slots: ['C1', 'L13'] }, { label: 'A1 / L14', slots: ['A1', 'L14'] },
          { label: 'F1 / L15', slots: ['F1', 'L15'] }, { label: 'TD1 / L16', slots: ['TD1', 'L16'] },
          { label: 'TBB1 / L17', slots: ['TBB1', 'L17'] }, { label: 'L18', slots: ['L18'] },
          { label: 'C2 / L43', slots: ['C2', 'L43'] }, { label: 'A2 / L44', slots: ['A2', 'L44'] },
          { label: 'F2 / L45', slots: ['F2', 'L45'] }, { label: 'TD2 / L46', slots: ['TD2', 'L46'] },
          { label: 'TBB2 / L47', slots: ['TBB2', 'L47'] }, { label: 'S4 / L48', slots: ['S4', 'L48'] }
        ]
      },
      {
        name: 'THU',
        periods: [
          { label: 'D1 / L19', slots: ['D1', 'L19'] }, { label: 'B1 / L20', slots: ['B1', 'L20'] },
          { label: 'G1 / L21', slots: ['G1', 'L21'] }, { label: 'TE1 / L22', slots: ['TE1', 'L22'] },
          { label: 'TCC1 / L23', slots: ['TCC1', 'L23'] }, { label: 'L24', slots: ['L24'] },
          { label: 'D2 / L49', slots: ['D2', 'L49'] }, { label: 'B2 / L50', slots: ['B2', 'L50'] },
          { label: 'G2 / L51', slots: ['G2', 'L51'] }, { label: 'TE2 / L52', slots: ['TE2', 'L52'] },
          { label: 'TCC2 / L53', slots: ['TCC2', 'L53'] }, { label: 'S2 / L54', slots: ['S2', 'L54'] }
        ]
      },
      {
        name: 'FRI',
        periods: [
          { label: 'E1 / L25', slots: ['E1', 'L25'] }, { label: 'C1 / L26', slots: ['C1', 'L26'] },
          { label: 'TA1 / L27', slots: ['TA1', 'L27'] }, { label: 'TF1 / L28', slots: ['TF1', 'L28'] },
          { label: 'TDD1 / L29', slots: ['TDD1', 'L29'] }, { label: 'S15 / L30', slots: ['S15', 'L30'] },
          { label: 'E2 / L55', slots: ['E2', 'L55'] }, { label: 'C2 / L56', slots: ['C2', 'L56'] },
          { label: 'TA2 / L57', slots: ['TA2', 'L57'] }, { label: 'TF2 / L58', slots: ['TF2', 'L58'] },
          { label: 'TDD2 / L59', slots: ['TDD2', 'L59'] }, { label: 'L60', slots: ['L60'] }
        ]
      }
    ]
  };

  const COLORS = {
    headerGray: '#cfd5dc',
    lunchDivider: '#9ca3af',
    theoryMorning: '#ced6f7',
    theoryAfternoon: '#ced6f7',
    labColor: '#bfe3fd',
    allocatedGreen: '#d6f58a',
    unallocatedCream: '#fffff0',
    borderDark: '#333333',
    textDark: '#111827',
    textMuted: '#8c8c8c'
  };

  function generateCourseAcronym(courseDetailsText, courseCode) {
    if (/^I?STS/i.test(courseCode) || /soft\s*skill/i.test(courseDetailsText)) {
      return 'STS';
    }

    let text = courseDetailsText || '';
    text = text.replace(/^[A-Z0-9]{5,10}\s*[-:]\s*/i, '').trim();
    text = text.replace(/\s*[-–—]\s*(Theory|Lab|Soft Skill|Embedded|Project|Online).*$/i, '').trim();

    const isLab = /lab/i.test(courseDetailsText) || (courseCode && courseCode.endsWith('P'));
    let baseTitle = text.replace(/\bLab\b/gi, '').trim();

    const stopWords = new Set(['and', 'of', 'in', 'to', 'for', 'the', 'a', 'an', '&', '-']);
    const words = baseTitle.split(/[\s\-–—/]+/).filter(w => w.trim().length > 0);

    let acronym = '';
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
      if (!cleanWord) continue;
      if (/^(I|II|III|IV|V|VI)$/i.test(cleanWord)) continue;
      if (stopWords.has(cleanWord.toLowerCase())) continue;
      acronym += cleanWord[0].toUpperCase();
    }

    if (!acronym && words.length > 0) {
      acronym = words.map(w => w[0].toUpperCase()).join('');
    }

    if (isLab) {
      return (acronym ? acronym + ' LAB' : 'LAB').trim();
    }
    return acronym || 'COURSE';
  }

  function extractRegisteredCourses() {
    const tables = document.querySelectorAll('table');
    let registeredTable = null;
    let slotColIdx = -1;
    let detailsColIdx = -1;
    let codeColIdx = -1;
    let titleColIdx = -1;

    for (const table of tables) {
      const ths = Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td'));
      let foundSlot = false;
      let foundDetails = false;

      ths.forEach((th, idx) => {
        const text = th.innerText.toLowerCase().trim();
        if (text === 'slot' || text.includes('slot')) {
          slotColIdx = idx;
          foundSlot = true;
        }
        if (text.includes('course details') || text.includes('course detail')) {
          detailsColIdx = idx;
          foundDetails = true;
        }
        if (text === 'course code' || text.includes('code')) codeColIdx = idx;
        if (text === 'course title' || text.includes('title')) titleColIdx = idx;
      });

      if (foundSlot && (foundDetails || (codeColIdx !== -1 && titleColIdx !== -1))) {
        registeredTable = table;
        break;
      }
    }

    if (!registeredTable || slotColIdx === -1) return [];

    const courses = [];
    const rows = registeredTable.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length <= slotColIdx) return;

      const rawSlot = cells[slotColIdx].innerText.trim();
      if (!rawSlot || rawSlot === '-' || rawSlot === '-NA-') return;

      let courseDetailsText = '';
      let courseCode = '';

      if (detailsColIdx !== -1 && cells.length > detailsColIdx) {
        courseDetailsText = cells[detailsColIdx].innerText.trim();
        const codeMatch = courseDetailsText.match(/^([A-Z0-9]{5,10})/i);
        if (codeMatch) courseCode = codeMatch[1].toUpperCase();
      } else if (titleColIdx !== -1 && codeColIdx !== -1) {
        courseCode = cells[codeColIdx].innerText.trim().toUpperCase();
        courseDetailsText = courseCode + ' - ' + cells[titleColIdx].innerText.trim();
      }

      const storageKey = 'vtop_acronym_' + courseCode;
      const customAcronym = localStorage.getItem(storageKey);
      const acronym = customAcronym || generateCourseAcronym(courseDetailsText, courseCode);

      const slotTokens = rawSlot
        .split(/[\+,\/\s]+/)
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);

      courses.push({
        code: courseCode,
        details: courseDetailsText,
        rawSlot: rawSlot,
        slotTokens: slotTokens,
        acronym: acronym
      });
    });

    return courses;
  }

  function buildSlotMap(courses) {
    const slotMap = new Map();
    courses.forEach(course => {
      course.slotTokens.forEach(slot => {
        if (!slotMap.has(slot)) slotMap.set(slot, []);
        slotMap.get(slot).push(course);
      });
    });
    return slotMap;
  }

  function formatBoldHours(item) {
    return `<span style="font-weight: 700; color: #000000; font-size: 11.5px;">${item.start}</span><br><span style="font-weight: 400; color: #111827; font-size: 11px;">to</span><br><span style="font-weight: 700; color: #000000; font-size: 11.5px;">${item.end}</span>`;
  }

  function handleDownload() {
    const captureArea = document.getElementById('vtop-timetable-capture-area');
    const downloadBtn = document.getElementById('vtop-download-btn');
    if (!captureArea) return;

    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerText = 'Generating Image...';
    downloadBtn.disabled = true;

    const fileName = 'TimeTable.png';

    const triggerDownload = (canvas) => {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    };

    if (typeof html2canvas !== 'undefined') {
      html2canvas(captureArea, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const cloneArea = clonedDoc.getElementById('vtop-timetable-capture-area');
          if (cloneArea) {
            cloneArea.style.backgroundColor = '#ffffff';
            const cells = cloneArea.querySelectorAll('th, td');
            cells.forEach(cell => {
              const bg = cell.style.backgroundColor;
              if (bg) {
                cell.setAttribute('style', cell.getAttribute('style') + '; background-color: ' + bg + ' !important;');
              }
            });
          }
        }
      }).then(triggerDownload).catch(() => {
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
      });
    }
  }

  function createGridCell(period, slotMap) {
    const td = document.createElement('td');
    td.className = 'vtop-tt-cell';

    let matchedCourse = null;
    for (const slot of period.slots) {
      if (slotMap.has(slot)) {
        matchedCourse = slotMap.get(slot)[0];
        break;
      }
    }

    if (matchedCourse) {
      td.classList.add('vtop-allocated');
      td.style.cssText = `background-color: ${COLORS.allocatedGreen} !important; background: ${COLORS.allocatedGreen} !important; color: #111827; border: 1px solid ${COLORS.borderDark} !important; text-align: center; vertical-align: middle; padding: 6px 2px; height: 50px;`;
      td.title = `${matchedCourse.details}\nSlot: ${matchedCourse.rawSlot}`;

      const slotSpan = document.createElement('span');
      slotSpan.className = 'vtop-slot-label';
      slotSpan.style.cssText = 'font-size: 12px; color: #1f2937; font-weight: 500; display: block; margin-bottom: 2px; pointer-events: none;';
      slotSpan.innerText = period.label;

      const acronymSpan = document.createElement('span');
      acronymSpan.className = 'vtop-course-acronym';
      acronymSpan.setAttribute('data-course-code', matchedCourse.code);
      acronymSpan.contentEditable = 'true';
      acronymSpan.spellcheck = false;
      acronymSpan.title = 'Click to edit acronym directly';
      acronymSpan.innerText = matchedCourse.acronym;
      acronymSpan.style.cssText = 'font-size: 12px; font-weight: 800; color: #000000; display: inline-block; padding: 1px 3px; border-radius: 2px; cursor: text; outline: none; line-height: 1.2;';

      acronymSpan.addEventListener('focus', () => {
        acronymSpan.style.backgroundColor = '#ffffff';
        acronymSpan.style.boxShadow = '0 0 0 2px #3b82f6';
      });

      const commitChange = () => {
        acronymSpan.style.backgroundColor = 'transparent';
        acronymSpan.style.boxShadow = 'none';
        const newVal = acronymSpan.innerText.trim().toUpperCase();
        if (newVal && newVal !== matchedCourse.acronym) {
          matchedCourse.acronym = newVal;
          localStorage.setItem('vtop_acronym_' + matchedCourse.code, newVal);
          document.querySelectorAll(`.vtop-course-acronym[data-course-code="${matchedCourse.code}"]`).forEach(el => {
            el.innerText = newVal;
          });
        } else {
          acronymSpan.innerText = matchedCourse.acronym;
        }
      };

      acronymSpan.addEventListener('blur', commitChange);
      acronymSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          acronymSpan.blur();
        }
      });

      td.appendChild(slotSpan);
      td.appendChild(acronymSpan);
    } else {
      td.style.cssText = `background-color: ${COLORS.unallocatedCream} !important; background: ${COLORS.unallocatedCream} !important; color: ${COLORS.textMuted}; border: 1px solid ${COLORS.borderDark} !important; text-align: center; vertical-align: middle; padding: 6px 2px; height: 50px;`;
      const slotSpan = document.createElement('span');
      slotSpan.className = 'vtop-slot-label';
      slotSpan.style.cssText = `font-size: 12px; color: ${COLORS.textMuted}; font-weight: normal;`;
      slotSpan.innerText = period.label;
      td.appendChild(slotSpan);
    }

    return td;
  }

  function buildTimetableElement(courses, slotMap) {
    const container = document.createElement('div');
    container.id = 'vtop-timetable-container';
    container.style.cssText = 'margin-top: 35px; margin-bottom: 50px; font-family: Arial, Helvetica, sans-serif; width: 100%; clear: both;';

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = 'text-align: center; margin-bottom: 15px;';
    const heading = document.createElement('h3');
    heading.style.cssText = 'font-weight: bold; color: #333333; margin: 0;';
    heading.innerText = 'Time Table';
    titleContainer.appendChild(heading);
    container.appendChild(titleContainer);

    const headerBar = document.createElement('div');
    headerBar.className = 'vtop-tt-header-bar';
    headerBar.style.cssText = 'display: flex; justify-content: flex-end; align-items: center; margin-bottom: 12px; padding: 0 4px;';

    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'vtop-download-btn';
    downloadBtn.className = 'vtop-download-btn';
    downloadBtn.type = 'button';
    downloadBtn.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; background-color: #437e55; color: #ffffff; font-size: 14px; font-weight: 600; padding: 9px 18px; border-radius: 6px; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15);';
    downloadBtn.innerHTML = `
      <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
      </svg>
      Download Timetable
    `;
    downloadBtn.addEventListener('click', handleDownload);
    headerBar.appendChild(downloadBtn);
    container.appendChild(headerBar);

    const captureArea = document.createElement('div');
    captureArea.id = 'vtop-timetable-capture-area';
    captureArea.style.cssText = 'background-color: #ffffff !important; padding: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); overflow-x: auto; box-sizing: border-box;';

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'vtop-table-responsive';
    tableWrapper.style.cssText = 'overflow-x: auto; width: 100%;';

    const table = document.createElement('table');
    table.id = 'vtop-tt-main-table';
    table.className = 'vtop-tt-table';
    table.style.cssText = `width: 100%; min-width: 1100px; border-collapse: collapse; table-layout: fixed; background-color: #ffffff !important; border: 1.5px solid ${COLORS.borderDark} !important; font-family: Arial, Helvetica, sans-serif;`;

    // Header Row 1: Theory
    const trTheory = document.createElement('tr');
    const thTheoryLabel = document.createElement('th');
    thTheoryLabel.className = 'vtop-tt-cat-header';
    thTheoryLabel.style.cssText = `background-color: ${COLORS.headerGray} !important; background: ${COLORS.headerGray} !important; color: #111827; font-weight: 800; font-size: 13px; width: 85px; text-transform: uppercase; border: 1px solid ${COLORS.borderDark} !important; padding: 8px 2px; text-align: center;`;
    thTheoryLabel.innerHTML = 'THEORY<br>HOURS';
    trTheory.appendChild(thTheoryLabel);

    for (let i = 0; i < 6; i++) {
      const th = document.createElement('th');
      th.className = 'vtop-tt-theory-morning';
      th.style.cssText = `background-color: ${COLORS.theoryMorning} !important; background: ${COLORS.theoryMorning} !important; color: #000000; border: 1px solid ${COLORS.borderDark} !important; padding: 6px 2px; text-align: center; line-height: 1.35;`;
      th.innerHTML = formatBoldHours(TIMETABLE_CONFIG.theoryHours[i]);
      trTheory.appendChild(th);
    }

    const thLunchHeader = document.createElement('th');
    thLunchHeader.className = 'vtop-tt-lunch-header-sep';
    thLunchHeader.rowSpan = 2;
    thLunchHeader.style.cssText = `background-color: ${COLORS.lunchDivider} !important; background: ${COLORS.lunchDivider} !important; width: 22px; padding: 0 !important; border: 1px solid ${COLORS.borderDark} !important;`;
    trTheory.appendChild(thLunchHeader);

    for (let i = 6; i < 12; i++) {
      const th = document.createElement('th');
      th.className = 'vtop-tt-theory-afternoon';
      th.style.cssText = `background-color: ${COLORS.theoryAfternoon} !important; background: ${COLORS.theoryAfternoon} !important; color: #000000; border: 1px solid ${COLORS.borderDark} !important; padding: 6px 2px; text-align: center; line-height: 1.35;`;
      th.innerHTML = formatBoldHours(TIMETABLE_CONFIG.theoryHours[i]);
      trTheory.appendChild(th);
    }
    table.appendChild(trTheory);

    // Header Row 2: Lab
    const trLab = document.createElement('tr');
    const thLabLabel = document.createElement('th');
    thLabLabel.className = 'vtop-tt-cat-header';
    thLabLabel.style.cssText = `background-color: ${COLORS.headerGray} !important; background: ${COLORS.headerGray} !important; color: #111827; font-weight: 800; font-size: 13px; width: 85px; text-transform: uppercase; border: 1px solid ${COLORS.borderDark} !important; padding: 8px 2px; text-align: center;`;
    thLabLabel.innerHTML = 'LAB<br>HOURS';
    trLab.appendChild(thLabLabel);

    for (let i = 0; i < 6; i++) {
      const th = document.createElement('th');
      th.className = 'vtop-tt-lab-morning';
      th.style.cssText = `background-color: ${COLORS.labColor} !important; background: ${COLORS.labColor} !important; color: #000000; border: 1px solid ${COLORS.borderDark} !important; padding: 6px 2px; text-align: center; line-height: 1.35;`;
      th.innerHTML = formatBoldHours(TIMETABLE_CONFIG.labHours[i]);
      trLab.appendChild(th);
    }

    for (let i = 6; i < 12; i++) {
      const th = document.createElement('th');
      th.className = 'vtop-tt-lab-afternoon';
      th.style.cssText = `background-color: ${COLORS.labColor} !important; background: ${COLORS.labColor} !important; color: #000000; border: 1px solid ${COLORS.borderDark} !important; padding: 6px 2px; text-align: center; line-height: 1.35;`;
      th.innerHTML = formatBoldHours(TIMETABLE_CONFIG.labHours[i]);
      trLab.appendChild(th);
    }
    table.appendChild(trLab);

    // Days MON to FRI
    TIMETABLE_CONFIG.days.forEach((dayData, dayIdx) => {
      const tr = document.createElement('tr');
      const tdDay = document.createElement('td');
      tdDay.className = 'vtop-tt-day-cell';
      tdDay.style.cssText = `background-color: ${COLORS.headerGray} !important; background: ${COLORS.headerGray} !important; color: #111827; font-weight: 800; font-size: 13px; border: 1px solid ${COLORS.borderDark} !important; text-align: center; padding: 6px 2px;`;
      tdDay.innerText = dayData.name;
      tr.appendChild(tdDay);

      for (let pIdx = 0; pIdx < 6; pIdx++) {
        tr.appendChild(createGridCell(dayData.periods[pIdx], slotMap));
      }

      if (dayIdx === 0) {
        const tdLunch = document.createElement('td');
        tdLunch.className = 'vtop-tt-lunch-cell';
        tdLunch.rowSpan = 5;
        tdLunch.style.cssText = `background-color: ${COLORS.headerGray} !important; background: ${COLORS.headerGray} !important; color: #111827; font-weight: 800; font-size: 13px; width: 22px; line-height: 1.6; border: 1px solid ${COLORS.borderDark} !important; text-align: center; padding: 10px 2px !important; letter-spacing: 2px;`;
        tdLunch.innerHTML = 'L<br>U<br>N<br>C<br>H';
        tr.appendChild(tdLunch);
      }

      for (let pIdx = 6; pIdx < 12; pIdx++) {
        tr.appendChild(createGridCell(dayData.periods[pIdx], slotMap));
      }

      table.appendChild(tr);
    });

    tableWrapper.appendChild(table);
    captureArea.appendChild(tableWrapper);
    container.appendChild(captureArea);

    const footerInfo = document.createElement('div');
    footerInfo.className = 'vtop-tt-footer-info';
    footerInfo.style.cssText = 'margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; padding: 0 4px;';
    footerInfo.innerHTML = `
      <div class="vtop-tt-legend" style="display: inline-flex; align-items: center; gap: 6px;">
        <span class="vtop-legend-box" style="width: 14px; height: 14px; border-radius: 3px; border: 1px solid ${COLORS.borderDark}; background-color: ${COLORS.allocatedGreen}; display: inline-block;"></span>
        <span><b>Enrolled Slot:</b> Displays slot code & course acronym (Click directly on any acronym to edit)</span>
      </div>
      <div><span>Total Registered Courses: <b>${courses.length}</b></span></div>
    `;
    container.appendChild(footerInfo);

    return container;
  }

  function injectTimetable() {
    const courses = extractRegisteredCourses();
    if (!courses || courses.length === 0) return;

    const slotMap = buildSlotMap(courses);
    const existing = document.getElementById('vtop-timetable-container');
    if (existing) existing.remove();

    const timetableEl = buildTimetableElement(courses, slotMap);

    let targetContainer = null;
    const headings = document.querySelectorAll('h3, h4, h2');
    for (const h of headings) {
      if (h.innerText.toLowerCase().includes('registered credits')) {
        let nextEl = h.parentElement;
        while (nextEl && !nextEl.classList.contains('container') && nextEl.id !== 'page-wrapper') {
          if (nextEl.nextElementSibling) {
            nextEl = nextEl.nextElementSibling;
            if (nextEl.classList.contains('table-responsive') || nextEl.tagName === 'TABLE') {
              targetContainer = nextEl;
              break;
            }
          } else {
            nextEl = nextEl.parentElement;
          }
        }
        if (targetContainer) break;
      }
    }

    if (!targetContainer) {
      const respTables = document.querySelectorAll('.table-responsive');
      if (respTables.length > 0) targetContainer = respTables[respTables.length - 1];
    }

    if (targetContainer && targetContainer.parentElement) {
      targetContainer.parentElement.insertBefore(timetableEl, targetContainer.nextSibling);
    } else {
      const container = document.querySelector('.container') || document.querySelector('#page-wrapper') || document.body;
      container.appendChild(timetableEl);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTimetable);
  } else {
    injectTimetable();
  }

  const targetNode = document.getElementById('page-wrapper') || document.body;
  if (targetNode) {
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!document.getElementById('vtop-timetable-container')) {
          injectTimetable();
        }
      }, 300);
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }
})();
