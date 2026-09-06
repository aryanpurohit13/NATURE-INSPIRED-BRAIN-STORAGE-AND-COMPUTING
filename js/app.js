/**
 * Main Application Controller for DNA Storage Simulator
 * Orchestrates 6 Main Tabs: Home, Encode, Vault, Decode, Error Lab, Analytics.
 */

// Application Global State
window.appState = {
  currentTab: 'home',
  lastDnaTopic: 'home',
  currentText: 'Hello DNA',
  currentBytes: null,
  currentFileName: 'message.txt',
  isFileMode: false,
  encodedData: null,
  homeHelixVisualizer: null,
  encodeHelixVisualizer: null
};

// =========================================================================
// TOAST NOTIFICATIONS
// =========================================================================
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✅',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  };

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '🧬'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
};

// =========================================================================
// TAB NAVIGATION SWITCHER (DUAL HEADINGS: DNA STORAGE & PRESENTATION)
// =========================================================================
function switchTab(tabId) {
  window.appState.currentTab = tabId;

  const mainBtnDna = document.getElementById('main-btn-dna-storage');
  const mainBtnPres = document.getElementById('main-btn-presentation');
  const dnaTopicsBar = document.getElementById('dna-topics-bar');

  if (tabId === 'presentation') {
    // Main heading PRESENTATION is active
    if (mainBtnPres) {
      mainBtnPres.classList.add('active');
      mainBtnPres.classList.remove('text-slate-400');
      mainBtnPres.classList.add('text-white');
    }
    if (mainBtnDna) {
      mainBtnDna.classList.remove('active');
      mainBtnDna.classList.add('text-slate-400');
    }
    if (dnaTopicsBar) dnaTopicsBar.classList.add('hidden');

    // Hide all DNA Storage topic sections
    const tabSections = ['home', 'encode', 'vault', 'decode', 'error-lab', 'analytics'];
    tabSections.forEach(secKey => {
      const sec = document.getElementById(`tab-${secKey}`);
      if (sec) sec.classList.add('hidden');
    });

    // Show Presentation section
    const presSec = document.getElementById('tab-presentation');
    if (presSec) presSec.classList.remove('hidden');

    // Render Presentation Hub view
    if (window.presentationHub) {
      window.presentationHub.renderPresentationView('presentation-hub-container');
    }
  } else {
    // Main heading DNA STORAGE is active
    window.appState.lastDnaTopic = tabId;
    if (mainBtnDna) {
      mainBtnDna.classList.add('active');
      mainBtnDna.classList.remove('text-slate-400');
      mainBtnDna.classList.add('text-white');
    }
    if (mainBtnPres) {
      mainBtnPres.classList.remove('active');
      mainBtnPres.classList.add('text-slate-400');
    }
    if (dnaTopicsBar) dnaTopicsBar.classList.remove('hidden');

    // Hide presentation section
    const presSec = document.getElementById('tab-presentation');
    if (presSec) presSec.classList.add('hidden');

    // Update navbar topic buttons under DNA STORAGE
    const tabButtons = {
      'home': document.getElementById('tab-btn-home'),
      'encode': document.getElementById('tab-btn-encode'),
      'vault': document.getElementById('tab-btn-vault'),
      'decode': document.getElementById('tab-btn-decode'),
      'error': document.getElementById('tab-btn-error'),
      'analytics': document.getElementById('tab-btn-analytics')
    };

    Object.keys(tabButtons).forEach(key => {
      const btn = tabButtons[key];
      if (btn) {
        if (key === tabId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    // Toggle tab sections
    const tabSections = ['home', 'encode', 'vault', 'decode', 'error-lab', 'analytics'];
    tabSections.forEach(secKey => {
      const sec = document.getElementById(`tab-${secKey}`);
      if (sec) {
        const match = (secKey === 'error-lab' && tabId === 'error') || (secKey === tabId);
        if (match) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      }
    });

    // Tab-specific lifecycle activations
    if (tabId === 'home') {
      if (window.appState.homeHelixVisualizer) {
        window.appState.homeHelixVisualizer.resize();
      }
    } else if (tabId === 'encode') {
      if (window.appState.encodeHelixVisualizer) {
        setTimeout(() => window.appState.encodeHelixVisualizer.resize(), 50);
      }
    } else if (tabId === 'vault') {
      renderVaultView();
    } else if (tabId === 'decode') {
      const decodeInput = document.getElementById('decode-dna-input');
      if (decodeInput && window.appState.encodedData && !decodeInput.value.trim()) {
        decodeInput.value = window.appState.encodedData.dna;
        runDecoding();
      }
    } else if (tabId === 'error') {
      initErrorLabView();
    } else if (tabId === 'analytics') {
      renderAnalyticsView();
    }
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initVisualizers();
  initNavigation();
  initHomeTab();
  initEncodeTab();
  initDecodeTab();
  initErrorLabTab();
  initVaultTab();

  // Run initial default encoding
  runEncoding('Hello DNA');
  updateVaultNavBadge();
});

// =========================================================================
// VISUALIZERS INIT
// =========================================================================
function initVisualizers() {
  if (document.getElementById('home-helix-canvas')) {
    window.appState.homeHelixVisualizer = new DNAHelixVisualizer('home-helix-canvas');
  }
  if (document.getElementById('encode-helix-canvas')) {
    window.appState.encodeHelixVisualizer = new DNAHelixVisualizer('encode-helix-canvas', 'helix-base-tooltip');
  }
}

// =========================================================================
// NAVIGATION EVENT BINDINGS
// =========================================================================
function initNavigation() {
  const mainBtnDna = document.getElementById('main-btn-dna-storage');
  const mainBtnPres = document.getElementById('main-btn-presentation');

  if (mainBtnDna) {
    mainBtnDna.addEventListener('click', () => {
      switchTab(window.appState.lastDnaTopic || 'home');
    });
  }

  if (mainBtnPres) {
    mainBtnPres.addEventListener('click', () => {
      switchTab('presentation');
    });
  }

  const tabs = [
    { id: 'tab-btn-home', tab: 'home' },
    { id: 'tab-btn-encode', tab: 'encode' },
    { id: 'tab-btn-vault', tab: 'vault' },
    { id: 'tab-btn-decode', tab: 'decode' },
    { id: 'tab-btn-error', tab: 'error' },
    { id: 'tab-btn-analytics', tab: 'analytics' },
    { id: 'nav-brand-logo', tab: 'home' }
  ];

  tabs.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.addEventListener('click', () => switchTab(item.tab));
    }
  });
}

// =========================================================================
// 1. HOME TAB LOGIC
// =========================================================================
function initHomeTab() {
  const btnStart = document.getElementById('btn-hero-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => switchTab('encode'));
  }

  const btnHow = document.getElementById('btn-hero-how-it-works');
  const modal = document.getElementById('how-it-works-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalGotIt = document.getElementById('btn-modal-got-it');

  if (btnHow && modal) {
    btnHow.addEventListener('click', () => modal.classList.remove('hidden'));
  }
  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (btnModalGotIt && modal) {
    btnModalGotIt.addEventListener('click', () => {
      modal.classList.add('hidden');
      switchTab('encode');
    });
  }

  // Quick Demo "HI" button
  const btnDemoHi = document.getElementById('btn-demo-load-hi');
  if (btnDemoHi) {
    btnDemoHi.addEventListener('click', () => {
      const input = document.getElementById('encode-text-input');
      if (input) input.value = 'HI';
      runEncoding('HI');
      switchTab('encode');
      window.showToast('Loaded "HI" into encoding pipeline!', 'info');
    });
  }
}

// =========================================================================
// 2. ENCODE TAB LOGIC
// =========================================================================
function initEncodeTab() {
  const btnRun = document.getElementById('btn-run-encode');
  const textInput = document.getElementById('encode-text-input');
  const fileInput = document.getElementById('encode-file-input');
  const btnUpload = document.getElementById('btn-encode-upload-file');
  const btnClearFile = document.getElementById('btn-clear-file');
  const btnSaveVault = document.getElementById('btn-save-to-vault');
  const btnCopyDna = document.getElementById('btn-copy-encode-dna');
  const btnToError = document.getElementById('btn-encode-to-error-lab');
  const btnToDecode = document.getElementById('btn-encode-to-decode');

  // Trigger Encoding
  if (btnRun) {
    btnRun.addEventListener('click', () => {
      if (window.appState.isFileMode && window.appState.currentBytes) {
        runEncodingBytes(window.appState.currentBytes, window.appState.currentFileName);
      } else {
        const txt = textInput ? textInput.value : 'Hello DNA';
        runEncoding(txt);
      }
      window.showToast('Data converted to DNA sequence!', 'success');
    });
  }

  // Presets
  document.querySelectorAll('.preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-preset');
      if (textInput) textInput.value = val;
      clearUploadedFile();
      runEncoding(val);
      window.showToast(`Loaded preset: "${val}"`, 'info');
    });
  });

  // File Upload
  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      window.appState.isFileMode = true;
      window.appState.currentFileName = file.name;

      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        window.appState.currentBytes = new Uint8Array(arrayBuffer);

        // Update badge
        const badge = document.getElementById('file-info-badge');
        const badgeName = document.getElementById('file-badge-name');
        const badgeSize = document.getElementById('file-badge-size');
        if (badge && badgeName && badgeSize) {
          badge.classList.remove('hidden');
          badgeName.textContent = file.name;
          badgeSize.textContent = `(${file.size} bytes)`;
        }

        runEncodingBytes(window.appState.currentBytes, file.name);
        window.showToast(`Uploaded ${file.name} (${file.size} bytes)`, 'success');
      };
      reader.readAsArrayBuffer(file);
    });
  }

  if (btnClearFile) {
    btnClearFile.addEventListener('click', () => {
      clearUploadedFile();
      const txt = textInput ? textInput.value : 'Hello DNA';
      runEncoding(txt);
    });
  }

  // Copy DNA Sequence
  if (btnCopyDna) {
    btnCopyDna.addEventListener('click', () => {
      if (window.appState.encodedData) {
        navigator.clipboard.writeText(window.appState.encodedData.dna).then(() => {
          window.showToast('DNA sequence copied to clipboard!', 'info');
        });
      }
    });
  }

  // Save to DNA Vault
  if (btnSaveVault) {
    btnSaveVault.addEventListener('click', () => {
      if (!window.appState.encodedData) return;
      const data = window.appState.encodedData;
      const rec = window.dnaVault.addRecord({
        title: window.appState.isFileMode ? window.appState.currentFileName : (data.text.slice(0, 24) || 'Synthesized DNA'),
        text: window.appState.isFileMode ? `[Binary File: ${window.appState.currentFileName}]` : data.text,
        dna: data.dna,
        byteCount: data.byteCount,
        gcRatio: data.metrics.gcRatio,
        category: window.appState.isFileMode ? 'Uploaded File' : 'Text Input'
      });

      updateVaultNavBadge();
      window.showToast(`Saved Record #${rec.id} to DNA Vault!`, 'success');
    });
  }

  // Go to Error Lab
  if (btnToError) {
    btnToError.addEventListener('click', () => {
      if (window.appState.encodedData) {
        window.dnaErrorLab.setSequence(window.appState.encodedData.dna);
      }
      switchTab('error');
    });
  }

  // Go to Decode
  if (btnToDecode) {
    btnToDecode.addEventListener('click', () => {
      const decodeInput = document.getElementById('decode-dna-input');
      if (decodeInput && window.appState.encodedData) {
        decodeInput.value = window.appState.encodedData.dna;
      }
      switchTab('decode');
      runDecoding();
    });
  }
}

function clearUploadedFile() {
  window.appState.isFileMode = false;
  window.appState.currentBytes = null;
  window.appState.currentFileName = 'message.txt';
  const fileInput = document.getElementById('encode-file-input');
  const badge = document.getElementById('file-info-badge');
  if (fileInput) fileInput.value = '';
  if (badge) badge.classList.add('hidden');
}

/**
 * Execute text encoding and render step-by-step breakdown
 */
function runEncoding(text) {
  window.appState.currentText = text;
  const result = window.dnaCodec.encodeTextWithSteps(text);
  window.appState.encodedData = result;

  // Render step breakdown list
  const stepsList = document.getElementById('encode-steps-list');
  if (stepsList) {
    let stepsHtml = '';
    const maxSteps = Math.min(result.steps.length, 24);

    for (let i = 0; i < maxSteps; i++) {
      const st = result.steps[i];
      let pairBeads = '';
      st.pairs.forEach(p => {
        pairBeads += `
          <div class="inline-flex flex-col items-center">
            <span class="text-[9px] text-sky-400 font-mono">${p.binary}</span>
            <span class="bead bead-${p.base.toLowerCase()} !w-5 !h-5 text-[10px] font-mono mt-0.5">${p.base}</span>
          </div>
        `;
      });

      stepsHtml += `
        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
            <span class="font-bold text-white font-sans text-[11px] truncate">Char: <strong class="text-cyan-300 font-mono text-xs">"${st.char}"</strong></span>
            <span class="text-[10px] text-slate-500 font-sans">#${st.index + 1} (ASCII ${st.byteVal})</span>
          </div>
          <div class="text-[11px] text-sky-400 font-bold tracking-wider pt-0.5">
            ${st.binary8.slice(0, 4)} ${st.binary8.slice(4)}
          </div>
          <div class="flex items-center justify-between gap-1 pt-1 border-t border-slate-900">
            ${pairBeads}
          </div>
        </div>
      `;
    }

    if (result.steps.length > maxSteps) {
      stepsHtml += `
        <div class="p-2.5 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[11px] text-slate-400 text-center font-sans">
          + ${result.steps.length - maxSteps} more characters synthesized...
        </div>
      `;
    }

    stepsList.innerHTML = stepsHtml;
  }

  // Update DNA Preview & Badges
  const preview = document.getElementById('encode-dna-sequence-preview');
  if (preview) preview.textContent = result.dna;

  const basesBadge = document.getElementById('encode-total-bases-badge');
  if (basesBadge) basesBadge.textContent = `${result.baseCount} bases (${result.byteCount} bytes)`;

  // Update 3D Canvas
  if (window.appState.encodeHelixVisualizer) {
    window.appState.encodeHelixVisualizer.setSequence(result.dna);
  }

  // Sync to Error Lab
  window.dnaErrorLab.setSequence(result.dna);
}

/**
 * Execute raw byte array encoding (File upload)
 */
function runEncodingBytes(bytes, filename) {
  const result = window.dnaCodec.encodeBytes(bytes, filename);
  window.appState.encodedData = result;

  const stepsList = document.getElementById('encode-steps-list');
  if (stepsList) {
    let stepsHtml = '';
    const maxBytes = Math.min(bytes.length, 16);

    for (let i = 0; i < maxBytes; i++) {
      const bVal = bytes[i];
      const bin8 = bVal.toString(2).padStart(8, '0');
      let pairBeads = '';
      for (let p = 0; p < 8; p += 2) {
        const pair = bin8.slice(p, p + 2);
        const base = window.dnaCodec.binToNuc[pair];
        pairBeads += `
          <div class="inline-flex flex-col items-center">
            <span class="text-[9px] text-sky-400 font-mono">${pair}</span>
            <span class="bead bead-${base.toLowerCase()} !w-5 !h-5 text-[10px] font-mono mt-0.5">${base}</span>
          </div>
        `;
      }

      stepsHtml += `
        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
            <span class="font-bold text-white font-sans text-[11px]">Byte #${i + 1}</span>
            <span class="text-[10px] text-slate-500 font-mono">0x${bVal.toString(16).toUpperCase().padStart(2, '0')}</span>
          </div>
          <div class="text-[11px] text-sky-400 font-bold tracking-wider pt-0.5">
            ${bin8.slice(0, 4)} ${bin8.slice(4)}
          </div>
          <div class="flex items-center justify-between gap-1 pt-1 border-t border-slate-900">
            ${pairBeads}
          </div>
        </div>
      `;
    }

    if (bytes.length > maxBytes) {
      stepsHtml += `
        <div class="p-2.5 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[11px] text-slate-400 text-center font-sans">
          + ${bytes.length - maxBytes} more binary bytes synthesized...
        </div>
      `;
    }

    stepsList.innerHTML = stepsHtml;
  }

  const preview = document.getElementById('encode-dna-sequence-preview');
  if (preview) preview.textContent = result.dna;

  const basesBadge = document.getElementById('encode-total-bases-badge');
  if (basesBadge) basesBadge.textContent = `${result.baseCount} bases (${result.byteCount} bytes)`;

  if (window.appState.encodeHelixVisualizer) {
    window.appState.encodeHelixVisualizer.setSequence(result.dna);
  }

  window.dnaErrorLab.setSequence(result.dna);
}

// =========================================================================
// 3. DNA VAULT TAB LOGIC
// =========================================================================
function initVaultTab() {
  const btnExport = document.getElementById('btn-vault-export-json');
  const btnClear = document.getElementById('btn-vault-clear');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      window.dnaVault.exportAllJSON();
      window.showToast('Exported DNA Vault records to JSON', 'info');
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Clear all stored records in the DNA Vault?')) {
        window.dnaVault.clearAll();
        renderVaultView();
        updateVaultNavBadge();
        window.showToast('DNA Vault cleared', 'warn');
      }
    });
  }
}

function updateVaultNavBadge() {
  const badge = document.getElementById('nav-vault-badge');
  if (badge && window.dnaVault) {
    badge.textContent = window.dnaVault.records.length;
  }
}

function renderVaultView() {
  window.dnaVault.renderVault('vault-table-container', {
    onLoadDecode: (rec) => {
      const input = document.getElementById('decode-dna-input');
      if (input) input.value = rec.dna;
      switchTab('decode');
      runDecoding();
      window.showToast(`Loaded record #${rec.id} into Decoder!`, 'success');
    },
    onTestError: (rec) => {
      window.dnaErrorLab.setSequence(rec.dna);
      switchTab('error');
      window.showToast(`Loaded record #${rec.id} into Error Lab!`, 'info');
    }
  });
  updateVaultNavBadge();
}

// =========================================================================
// 4. DECODE TAB LOGIC
// =========================================================================
function initDecodeTab() {
  const btnRun = document.getElementById('btn-run-decode');
  const btnPaste = document.getElementById('btn-decode-paste-active');

  if (btnRun) {
    btnRun.addEventListener('click', () => runDecoding());
  }

  if (btnPaste) {
    btnPaste.addEventListener('click', () => {
      if (window.appState.encodedData) {
        const input = document.getElementById('decode-dna-input');
        if (input) input.value = window.appState.encodedData.dna;
        runDecoding();
        window.showToast('Loaded currently synthesized DNA sequence!', 'info');
      }
    });
  }
}

function runDecoding() {
  const input = document.getElementById('decode-dna-input');
  if (!input) return;

  const rawDna = input.value.trim();
  if (!rawDna) {
    window.showToast('Please enter a DNA sequence to decode', 'warn');
    return;
  }

  const result = window.dnaCodec.decodeDNA(rawDna);

  // Update Preview Box
  const preview = document.getElementById('decode-output-preview');
  if (preview) {
    preview.textContent = result.text || '[Binary File Stream]';
  }

  // Update Badges & Stats
  const badge = document.getElementById('decode-status-badge');
  const statBytes = document.getElementById('decode-stat-bytes');
  const statBits = document.getElementById('decode-stat-bits');
  const statBases = document.getElementById('decode-stat-bases');

  if (statBytes) statBytes.textContent = `${result.byteCount} bytes`;
  if (statBits) statBits.textContent = `${result.bitCount} bits`;
  if (statBases) statBases.textContent = `${result.baseCount} bases`;

  if (badge) {
    // Check if bit-perfect match with original text
    if (window.appState.encodedData && result.dna === window.appState.encodedData.dna) {
      badge.textContent = '100% BIT-PERFECT MATCH';
      badge.className = 'px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-bold';
    } else {
      badge.textContent = 'DECODED FROM DNA';
      badge.className = 'px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 text-[10px] font-bold';
    }
  }

  // Render reverse steps
  const stepsContainer = document.getElementById('decode-steps-list');
  if (stepsContainer) {
    let stepsHtml = '';
    result.steps.forEach(st => {
      let beads = '';
      for (let i = 0; i < st.dna4.length; i++) {
        const b = st.dna4[i];
        beads += `<span class="bead bead-${b.toLowerCase()} !w-5 !h-5 text-[10px] font-mono">${b}</span>`;
      }

      stepsHtml += `
        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
            <span class="font-bold text-white font-sans text-[11px]">Pos #${st.index + 1}</span>
            <span class="font-bold text-emerald-400 font-mono text-sm">"${st.char}"</span>
          </div>
          <div class="flex items-center gap-1 pt-1">
            ${beads}
          </div>
          <div class="text-[10px] text-sky-400 font-bold pt-0.5 border-t border-slate-900">
            ${st.binary8.slice(0, 4)} ${st.binary8.slice(4)}
          </div>
        </div>
      `;
    });

    if (result.byteCount > result.steps.length) {
      stepsHtml += `
        <div class="p-2.5 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[11px] text-slate-400 text-center font-sans">
          + ${result.byteCount - result.steps.length} more characters decoded...
        </div>
      `;
    }

    stepsContainer.innerHTML = stepsHtml;
  }

  window.showToast('DNA successfully retrieved & decoded!', 'success');
}

// =========================================================================
// 5. ERROR LAB TAB LOGIC
// =========================================================================
function initErrorLabTab() {
  const btnMutate = document.getElementById('btn-err-mutate-point');
  const btnReset = document.getElementById('btn-err-reset');
  const btnTestCorrupt = document.getElementById('btn-test-corrupt-decode');
  const btnReVote = document.getElementById('btn-run-majority-voting');

  if (btnMutate) {
    btnMutate.addEventListener('click', () => {
      window.dnaErrorLab.introducePointMutation();
      window.dnaErrorLab.renderDiff('error-diff-container');
      updateCorruptedPreview();
      window.showToast('Point mutation introduced into DNA strand!', 'warn');
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      window.dnaErrorLab.resetErrors();
      window.dnaErrorLab.renderDiff('error-diff-container');
      updateCorruptedPreview();
      window.showToast('Reset back to pristine DNA sequence', 'info');
    });
  }

  if (btnTestCorrupt) {
    btnTestCorrupt.addEventListener('click', () => {
      updateCorruptedPreview();
      window.showToast('Decoded corrupted sequence!', 'error');
    });
  }

  if (btnReVote) {
    btnReVote.addEventListener('click', () => {
      window.dnaErrorLab.generateRedundantCopies();
      window.dnaErrorLab.renderMajorityVoting('majority-voting-container');
      window.showToast('Majority voting consensus computed across copies!', 'success');
    });
  }
}

function initErrorLabView() {
  window.dnaErrorLab.renderDiff('error-diff-container');
  window.dnaErrorLab.renderMajorityVoting('majority-voting-container');
  updateCorruptedPreview();
}

function updateCorruptedPreview() {
  const comp = window.dnaErrorLab.decodeComparison();
  const origEl = document.getElementById('err-orig-text-preview');
  const corrEl = document.getElementById('err-corrupt-text-preview');

  if (origEl) origEl.textContent = comp.original.text || '[Binary Data]';
  if (corrEl) {
    corrEl.textContent = comp.corrupted.text || '[Corrupted Bytes]';
    if (comp.hasError) {
      corrEl.classList.add('text-red-400');
      corrEl.classList.remove('text-emerald-400');
    } else {
      corrEl.classList.add('text-emerald-400');
      corrEl.classList.remove('text-red-400');
    }
  }
}

// =========================================================================
// 6. ANALYTICS TAB LOGIC
// =========================================================================
function renderAnalyticsView() {
  const seq = (window.appState.encodedData && window.appState.encodedData.dna) ? window.appState.encodedData.dna : 'CAGACAGC';
  const byteCount = (window.appState.encodedData && window.appState.encodedData.byteCount) ? window.appState.encodedData.byteCount : 2;
  window.dnaAnalytics.renderAnalytics('analytics-dashboard-container', seq, byteCount);
}
