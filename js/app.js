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

    if (window.presentationHub && !window.presentationHub.isSlideShowActive) {
      window.presentationHub.stopAutoPlay();
    }

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
      if (decodeInput && window.appState.encodedData && (!decodeInput.value.trim() || decodeInput.value === 'CAGACAGC')) {
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

  // File Processing Engine
  function handleEncodeFile(file) {
    if (!file) return;

    window.appState.isFileMode = true;
    window.appState.currentFileName = file.name;

    const formatSize = (bytes) => {
      if (bytes < 1024) return `${bytes} bytes`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const badge = document.getElementById('file-info-badge');
    const badgeName = document.getElementById('file-badge-name');
    const badgeSize = document.getElementById('file-badge-size');
    const modeInd = document.getElementById('input-mode-indicator');

    if (badge && badgeName && badgeSize) {
      badge.classList.remove('hidden');
      badgeName.textContent = file.name;
      badgeSize.textContent = `(${formatSize(file.size)})`;
    }
    if (modeInd) {
      modeInd.textContent = `Mode: Loaded File (${file.name})`;
    }

    const isTextFile = file.type.startsWith('text') || /\.(txt|csv|json|md|py|js|html|xml|css)$/i.test(file.name);

    if (isTextFile && file.size < 200000) {
      const textReader = new FileReader();
      textReader.onload = (te) => {
        if (textInput) textInput.value = te.target.result;
      };
      textReader.readAsText(file);
    } else {
      if (textInput) textInput.value = `[Binary File Stream Loaded: ${file.name} - ${formatSize(file.size)}]`;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      window.appState.currentBytes = new Uint8Array(arrayBuffer);
      runEncodingBytes(window.appState.currentBytes, file.name);
      window.showToast(`Loaded & encoded ${file.name} (${formatSize(file.size)})`, 'success');
    };
    reader.readAsArrayBuffer(file);
  }

  // File Upload via Native Button / Input
  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleEncodeFile(e.target.files[0]);
      }
      fileInput.value = '';
    });
  }

  // Drag & Drop on Encode Drop Zone
  const dropZone = document.getElementById('encode-drop-zone');
  if (dropZone) {
    dropZone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-cyan-400', 'bg-cyan-950/40');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-cyan-400', 'bg-cyan-950/40');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-cyan-400', 'bg-cyan-950/40');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleEncodeFile(e.dataTransfer.files[0]);
      }
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
  const modeInd = document.getElementById('input-mode-indicator');
  if (fileInput) fileInput.value = '';
  if (badge) badge.classList.add('hidden');
  if (modeInd) modeInd.textContent = 'Mode: Text Input';
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

  const formatSize = (b) => {
    if (b < 1024) return `${b} bytes`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

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
        <div class="p-2.5 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-[11px] text-slate-400 text-center font-sans">
          <span class="font-bold text-cyan-400">+ ${(bytes.length - maxBytes).toLocaleString()} more bytes synthesized</span>
          <span class="text-[10px] text-slate-500">100% full-fidelity DNA encoded</span>
        </div>
      `;
    }

    stepsList.innerHTML = stepsHtml;
  }

  const preview = document.getElementById('encode-dna-sequence-preview');
  if (preview) {
    if (result.dna.length > 8000) {
      preview.textContent = result.dna.slice(0, 8000) + `\n\n... [Showing first 8,000 bases of ${result.dna.length.toLocaleString()} total bases. 100% full sequence synthesized in memory and ready for retrieval & download!]`;
    } else {
      preview.textContent = result.dna;
    }
  }

  const basesBadge = document.getElementById('encode-total-bases-badge');
  if (basesBadge) {
    basesBadge.textContent = `${result.baseCount.toLocaleString()} bases (${formatSize(result.byteCount)})`;
  }

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
  const btnDecodeUpload = document.getElementById('btn-decode-upload-file');
  const decodeFileInput = document.getElementById('decode-file-input');
  const decodeInput = document.getElementById('decode-dna-input');

  if (btnRun) {
    btnRun.addEventListener('click', () => runDecoding());
  }

  if (btnPaste) {
    btnPaste.addEventListener('click', () => {
      if (window.appState.encodedData) {
        if (decodeInput) decodeInput.value = window.appState.encodedData.dna;
        runDecoding();
        window.showToast('Loaded currently synthesized DNA sequence!', 'info');
      }
    });
  }

  // Upload file or DNA sequence directly into Decode workspace
  if (btnDecodeUpload && decodeFileInput) {
    btnDecodeUpload.addEventListener('click', () => {
      decodeFileInput.click();
    });

    decodeFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleDecodeUploadedFile(e.target.files[0]);
      }
      decodeFileInput.value = '';
    });
  }

  // Drag & drop directly into Decode textarea
  if (decodeInput) {
    decodeInput.addEventListener('dragover', (e) => {
      e.preventDefault();
      decodeInput.classList.add('border-emerald-400');
    });
    decodeInput.addEventListener('dragleave', () => {
      decodeInput.classList.remove('border-emerald-400');
    });
    decodeInput.addEventListener('drop', (e) => {
      e.preventDefault();
      decodeInput.classList.remove('border-emerald-400');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleDecodeUploadedFile(e.dataTransfer.files[0]);
      }
    });
  }
}

/**
 * Handle direct file upload in Decode Tab
 */
function handleDecodeUploadedFile(file) {
  if (!file) return;

  const isDnaTextFile = /\.(txt|dna|fasta|fa|seq)$/i.test(file.name);

  if (isDnaTextFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result || '';
      const clean = content.toUpperCase().replace(/[^ACGT]/g, '');
      const rawNonSpace = content.replace(/\s/g, '');

      // Check if file consists of DNA letters (A, T, G, C)
      if (clean.length > 0 && (clean.length / rawNonSpace.length) > 0.75) {
        const input = document.getElementById('decode-dna-input');
        if (input) input.value = clean;
        window.appState.currentFileName = file.name.replace(/\.(dna|fasta|fa|seq)$/i, '.txt');
        runDecoding();
        window.showToast(`Loaded ${clean.length.toLocaleString()} bases from ${file.name}`, 'success');
      } else {
        // Plain text file: encode then decode
        const bytes = new TextEncoder().encode(content);
        window.appState.isFileMode = true;
        window.appState.currentFileName = file.name;
        window.appState.currentBytes = bytes;
        const enc = window.dnaCodec.encodeBytes(bytes, file.name);
        window.appState.encodedData = enc;
        const input = document.getElementById('decode-dna-input');
        if (input) input.value = enc.dna;
        runDecoding();
        window.showToast(`Synthesized & decoded ${file.name}!`, 'success');
      }
    };
    reader.readAsText(file);
  } else {
    // Binary file (PNG, JPG, PDF, etc.): read bytes, encode to DNA, and decode
    const reader = new FileReader();
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target.result);
      window.appState.isFileMode = true;
      window.appState.currentFileName = file.name;
      window.appState.currentBytes = bytes;
      const enc = window.dnaCodec.encodeBytes(bytes, file.name);
      window.appState.encodedData = enc;

      const input = document.getElementById('decode-dna-input');
      if (input) input.value = enc.dna;
      runDecoding();
      window.showToast(`Synthesized & decoded ${file.name}!`, 'success');
    };
    reader.readAsArrayBuffer(file);
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

  // Pass current file name as hint if available
  const filenameHint = (window.appState.isFileMode && window.appState.currentFileName) ? window.appState.currentFileName : '';
  const result = window.dnaCodec.decodeDNA(rawDna, filenameHint);

  const formatSize = (b) => {
    if (b < 1024) return `${b} bytes`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Update Badges & Stats
  const badge = document.getElementById('decode-status-badge');
  const statBytes = document.getElementById('decode-stat-bytes');
  const statBits = document.getElementById('decode-stat-bits');
  const statBases = document.getElementById('decode-stat-bases');

  if (statBytes) statBytes.textContent = formatSize(result.byteCount);
  if (statBits) statBits.textContent = `${result.bitCount.toLocaleString()} bits`;
  if (statBases) statBases.textContent = `${result.baseCount.toLocaleString()} bases`;

  if (badge) {
    // Check if bit-perfect match with original encoded data
    const isMatch = window.appState.encodedData && (result.dna === window.appState.encodedData.dna);
    if (isMatch) {
      badge.textContent = '100% BIT-PERFECT MATCH';
      badge.className = 'px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-bold';
    } else {
      badge.textContent = 'DECODED FROM DNA';
      badge.className = 'px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 text-[10px] font-bold';
    }
  }

  // Determine final filename and MIME type
  const detected = result.fileInfo;
  let resolvedFilename = window.appState.isFileMode ? window.appState.currentFileName : `restored_from_dna.${detected.ext}`;
  if (!resolvedFilename.includes('.')) {
    resolvedFilename += `.${detected.ext}`;
  }

  // Clean up any previously created object URLs to prevent memory leaks
  if (window._currentDecodedBlobUrl) {
    URL.revokeObjectURL(window._currentDecodedBlobUrl);
    window._currentDecodedBlobUrl = null;
  }

  const blob = new Blob([result.bytes], { type: detected.mime });
  const blobUrl = URL.createObjectURL(blob);
  window._currentDecodedBlobUrl = blobUrl;

  // Render decoded content in #decode-output-preview based on file type
  const preview = document.getElementById('decode-output-preview');
  const btnOpenTab = document.getElementById('btn-open-decoded-tab');
  const typeBadgeContainer = document.getElementById('decode-type-badge-container');

  if (typeBadgeContainer) {
    typeBadgeContainer.innerHTML = `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">Type: ${detected.label} (${formatSize(result.byteCount)})</span>`;
  }

  if (preview) {
    if (detected.type === 'image') {
      preview.className = 'p-3 bg-slate-950 rounded-xl border border-emerald-900/60 min-h-[160px] flex flex-col items-center justify-center overflow-hidden';
      preview.innerHTML = `
        <div class="flex flex-col items-center gap-2.5 w-full">
          <div class="relative group rounded-xl overflow-hidden border border-emerald-500/40 bg-black/60 p-2 shadow-2xl max-w-full">
            <img src="${blobUrl}" alt="Decoded Image" class="max-h-64 max-w-full object-contain rounded-lg mx-auto shadow" />
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span class="px-2.5 py-0.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono font-bold flex items-center gap-1">
              <span>🖼️</span><span>${detected.label} Restored</span>
            </span>
            <span class="text-slate-400 font-mono text-[11px]">${formatSize(result.byteCount)} &bull; ${result.baseCount.toLocaleString()} bases</span>
          </div>
        </div>
      `;
      if (btnOpenTab) {
        btnOpenTab.href = blobUrl;
        btnOpenTab.classList.remove('hidden');
      }
    } else if (detected.type === 'pdf') {
      preview.className = 'p-3 bg-slate-950 rounded-xl border border-emerald-900/60 min-h-[160px] flex flex-col items-center justify-center overflow-hidden';
      preview.innerHTML = `
        <div class="w-full flex flex-col gap-2.5">
          <div class="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-xl">📄</span>
              <div>
                <div class="text-xs font-bold text-white">${resolvedFilename}</div>
                <div class="text-[10px] text-slate-400 font-mono">${formatSize(result.byteCount)} &bull; PDF Document Restored</div>
              </div>
            </div>
          </div>
          <div class="w-full h-64 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
            <iframe src="${blobUrl}#toolbar=1" class="w-full h-full" title="Decoded PDF Document"></iframe>
          </div>
        </div>
      `;
      if (btnOpenTab) {
        btnOpenTab.href = blobUrl;
        btnOpenTab.classList.remove('hidden');
      }
    } else if (detected.type === 'text') {
      preview.className = 'p-4 bg-slate-950 rounded-xl text-sm font-mono font-bold text-emerald-400 border border-emerald-900/60 min-h-[90px] break-all whitespace-pre-wrap flex items-center justify-center text-center overflow-hidden';
      preview.textContent = result.text || '(Empty string)';
      if (btnOpenTab) btnOpenTab.classList.add('hidden');
    } else {
      // Binary file card
      const hexSample = Array.from(result.bytes.slice(0, 16))
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');

      preview.className = 'p-4 bg-slate-950 rounded-xl border border-emerald-900/60 min-h-[120px] flex flex-col items-center justify-center overflow-hidden';
      preview.innerHTML = `
        <div class="w-full space-y-2.5">
          <div class="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span class="text-3xl">📦</span>
            <div class="flex-grow">
              <div class="text-xs font-bold text-white flex items-center gap-2">
                <span>${resolvedFilename}</span>
                <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-mono">${detected.label}</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5">${formatSize(result.byteCount)} &bull; ${result.bitCount.toLocaleString()} bits restored bit-perfect</div>
            </div>
          </div>
          <div class="p-2 bg-slate-900/60 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span class="text-slate-500">Header Bytes:</span>
            <span class="text-sky-300 font-bold tracking-wider">${hexSample}...</span>
          </div>
        </div>
      `;
      if (btnOpenTab) btnOpenTab.classList.add('hidden');
    }
  }

  // Handle Download Restored File Button
  const btnDownloadDecoded = document.getElementById('btn-download-decoded-file');
  if (btnDownloadDecoded) {
    if (result.bytes && result.bytes.length > 0) {
      btnDownloadDecoded.classList.remove('hidden');
      btnDownloadDecoded.innerHTML = `<span>📥</span><span>Download ${resolvedFilename} (${formatSize(result.byteCount)})</span>`;
      btnDownloadDecoded.onclick = () => {
        const downloadBlob = new Blob([result.bytes], { type: detected.mime });
        const downloadUrl = URL.createObjectURL(downloadBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = resolvedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 2500);
        window.showToast(`Downloaded ${resolvedFilename}!`, 'success');
      };
    } else {
      btnDownloadDecoded.classList.add('hidden');
    }
  }

  // Render reverse steps (first 24 characters)
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
          + ${(result.byteCount - result.steps.length).toLocaleString()} more characters decoded...
        </div>
      `;
    }

    stepsContainer.innerHTML = stepsHtml;
  }

  window.showToast('DNA successfully retrieved & decoded!', 'success');
}

// Helper to escape HTML characters
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Make updateCorruptedPreview global so error_lab.js can trigger it on bead clicks
window.updateCorruptedPreview = updateCorruptedPreview;

// =========================================================================
// 5. ERROR LAB TAB LOGIC
// =========================================================================
function initErrorLabTab() {
  const btnMutate = document.getElementById('btn-err-mutate-point');
  const btnReset = document.getElementById('btn-err-reset');
  const btnTestCorrupt = document.getElementById('btn-test-corrupt-decode');
  const btnReVote = document.getElementById('btn-run-majority-voting');
  const btnErrSendToDecode = document.getElementById('btn-err-send-to-decoder');

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

  if (btnErrSendToDecode) {
    btnErrSendToDecode.addEventListener('click', () => {
      const decodeInput = document.getElementById('decode-dna-input');
      if (decodeInput && window.dnaErrorLab) {
        decodeInput.value = window.dnaErrorLab.fullCorruptedDNA || window.dnaErrorLab.corruptedSequence;
      }
      switchTab('decode');
      runDecoding();
      window.showToast('Transferred corrupted DNA strand to Decoder!', 'info');
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
  const filenameHint = (window.appState.isFileMode && window.appState.currentFileName) ? window.appState.currentFileName : '';
  const comp = window.dnaErrorLab.decodeComparison(filenameHint);

  const origTypeBadge = document.getElementById('err-orig-type-badge');
  const corruptTypeBadge = document.getElementById('err-corrupt-type-badge');
  const counterBadge = document.getElementById('err-mutation-counter-badge');
  const origContainer = document.getElementById('err-orig-preview-container');
  const corruptContainer = document.getElementById('err-corrupt-preview-container');
  const origStats = document.getElementById('err-orig-stats');
  const corruptStats = document.getElementById('err-corrupt-stats');
  const btnDownloadCorrupt = document.getElementById('btn-download-corrupted-file');

  const formatSize = (b) => {
    if (b < 1024) return `${b} bytes`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Update Mutation Counter Badge
  if (counterBadge) {
    if (comp.hasError) {
      counterBadge.textContent = `${comp.mutationCount} Mutation${comp.mutationCount === 1 ? '' : 's'} Active (Corrupted)`;
      counterBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-700 animate-pulse';
    } else {
      counterBadge.textContent = '0 Mutations (100% Intact Reference)';
      counterBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700';
    }
  }

  // Detected file types
  const origInfo = comp.original.fileInfo;
  const corrInfo = comp.corrupted.fileInfo;

  if (origTypeBadge) {
    origTypeBadge.textContent = `${origInfo.label} (${formatSize(comp.original.byteCount)})`;
  }

  if (corruptTypeBadge) {
    if (comp.hasError) {
      corruptTypeBadge.textContent = `CORRUPTED (${comp.mutationCount} base substitution${comp.mutationCount === 1 ? '' : 's'})`;
      corruptTypeBadge.className = 'px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-700 font-mono text-[10px] font-bold';
    } else {
      corruptTypeBadge.textContent = '100% Intact';
      corruptTypeBadge.className = 'px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono text-[10px]';
    }
  }

  // Clean up any previously created object URLs
  if (window._errOrigBlobUrl) {
    URL.revokeObjectURL(window._errOrigBlobUrl);
    window._errOrigBlobUrl = null;
  }
  if (window._errCorruptBlobUrl) {
    URL.revokeObjectURL(window._errCorruptBlobUrl);
    window._errCorruptBlobUrl = null;
  }

  // Render previews based on file type
  if (origInfo.type === 'image') {
    // ----------------------------------------------------
    // IMAGE RENDERING: Original vs Corrupted
    // ----------------------------------------------------
    const origBlob = new Blob([comp.original.bytes], { type: origInfo.mime });
    const origUrl = URL.createObjectURL(origBlob);
    window._errOrigBlobUrl = origUrl;

    if (origContainer) {
      origContainer.innerHTML = `
        <div class="flex flex-col items-center gap-2 w-full">
          <div class="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-black/60 p-1.5 max-h-48 max-w-full">
            <img src="${origUrl}" alt="Original Pristine" class="max-h-44 object-contain rounded-lg mx-auto shadow" />
          </div>
          <span class="text-[10px] text-emerald-400 font-mono">Pristine Image (${formatSize(comp.original.byteCount)})</span>
        </div>
      `;
    }

    if (corruptContainer) {
      if (!comp.hasError) {
        corruptContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center p-6 text-slate-400 text-center space-y-2">
            <span class="text-3xl">✨</span>
            <div class="font-bold text-xs text-white">Strand is Currently Unmutated</div>
            <div class="text-[11px] text-slate-500">Click "Introduce Mutation" or click on nucleotide beads above to simulate sequencing corruption on this image!</div>
          </div>
        `;
      } else {
        const corruptBlob = new Blob([comp.corrupted.bytes], { type: origInfo.mime });
        const corruptUrl = URL.createObjectURL(corruptBlob);
        window._errCorruptBlobUrl = corruptUrl;

        const testImg = new Image();
        testImg.onload = () => {
          corruptContainer.innerHTML = `
            <div class="flex flex-col items-center gap-2 w-full">
              <div class="relative rounded-xl overflow-hidden border-2 border-red-500 bg-red-950/40 p-1.5 max-h-48 max-w-full shadow-lg shadow-red-950">
                <img src="${corruptUrl}" alt="Corrupted by Mutation" class="max-h-44 object-contain rounded-lg mx-auto filter contrast-125 brightness-90" />
                <div class="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-900/90 text-red-200 text-[10px] font-bold font-mono border border-red-500">
                  MUTATED
                </div>
              </div>
              <span class="text-[10px] text-red-400 font-mono font-bold">⚠️ Rendered with Stream Glitches (${comp.mutationCount} bit error)</span>
            </div>
          `;
        };
        testImg.onerror = () => {
          const canvasId = 'corrupt-glitch-canvas';
          corruptContainer.innerHTML = `
            <div class="flex flex-col items-center gap-2 w-full">
              <div class="relative rounded-xl overflow-hidden border-2 border-red-500/80 bg-slate-950 p-2 w-full max-w-xs shadow-xl">
                <canvas id="${canvasId}" width="260" height="130" class="w-full h-32 rounded-lg bg-black"></canvas>
                <div class="absolute inset-0 bg-red-950/40 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                  <span class="text-2xl animate-pulse">⚡</span>
                  <span class="text-[11px] font-black text-red-300 mt-1 uppercase tracking-wider">File Header Corrupted</span>
                  <span class="text-[9px] text-red-200 font-mono">Format parser rejected file (CRC/Stream Invalid)</span>
                </div>
              </div>
              <span class="text-[10px] text-red-400 font-mono font-bold">💥 Unreadable by OS: Base mutation broke file header!</span>
            </div>
          `;

          setTimeout(() => {
            const cvs = document.getElementById(canvasId);
            if (cvs) {
              const ctx = cvs.getContext('2d');
              const w = cvs.width, h = cvs.height;
              const imgData = ctx.createImageData(w, h);
              for (let i = 0; i < imgData.data.length; i += 4) {
                const noise = Math.random() > 0.82 ? Math.floor(Math.random() * 255) : 10;
                imgData.data[i] = noise > 100 ? 255 : (noise > 50 ? 200 : 20);
                imgData.data[i + 1] = noise > 200 ? 50 : 10;
                imgData.data[i + 2] = noise > 150 ? 100 : 30;
                imgData.data[i + 3] = 255;
              }
              ctx.putImageData(imgData, 0, 0);
              ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
              for (let y = 0; y < h; y += 4) {
                ctx.fillRect(0, y, w, 1.5);
              }
            }
          }, 20);
        };
        testImg.src = corruptUrl;
      }
    }
  } else if (origInfo.type === 'text') {
    // ----------------------------------------------------
    // TEXT RENDERING: Character-by-Character Mutation Diff
    // ----------------------------------------------------
    if (origContainer) {
      origContainer.innerHTML = `
        <div class="font-mono text-white p-3 bg-slate-900 rounded-xl border border-slate-800 break-all whitespace-pre-wrap w-full text-xs text-left max-h-48 overflow-y-auto">
          ${escapeHtml(comp.original.text || 'Hello DNA')}
        </div>
      `;
    }

    if (corruptContainer) {
      if (!comp.hasError) {
        corruptContainer.innerHTML = `
          <div class="font-mono text-emerald-400 p-3 bg-slate-900 rounded-xl border border-slate-800 break-all whitespace-pre-wrap w-full text-xs text-left max-h-48 overflow-y-auto">
            ${escapeHtml(comp.original.text || 'Hello DNA')}
          </div>
        `;
      } else {
        const oText = comp.original.text || '';
        const cText = comp.corrupted.text || '';
        const maxLen = Math.max(oText.length, cText.length);
        let diffHtml = '';
        let diffChanges = [];

        for (let i = 0; i < maxLen; i++) {
          const chO = oText[i] || '';
          const chC = cText[i] || '';
          if (chO !== chC) {
            diffHtml += `<span class="bg-red-600/40 text-red-300 font-black px-1 rounded border border-red-500/80 animate-pulse underline" title="Original: '${chO}' -> Corrupted: '${chC}'">${escapeHtml(chC || '·')}</span>`;
            diffChanges.push(`'${chO}' &rarr; <strong class="text-red-300">'${chC}'</strong>`);
          } else {
            diffHtml += escapeHtml(chC);
          }
        }

        corruptContainer.innerHTML = `
          <div class="w-full space-y-2 text-left">
            <div class="font-mono text-red-200 p-3 bg-red-950/40 rounded-xl border border-red-800/80 break-all whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">
              ${diffHtml}
            </div>
            <div class="text-[10px] text-red-400 font-mono">
              Altered: ${diffChanges.slice(0, 3).join(', ')}${diffChanges.length > 3 ? ` (+${diffChanges.length - 3} more)` : ''}
            </div>
          </div>
        `;
      }
    }
  } else {
    // ----------------------------------------------------
    // PDF / BINARY DOCUMENT RENDERING
    // ----------------------------------------------------
    const hexOrig = Array.from(comp.original.bytes.slice(0, 12)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const hexCorr = Array.from(comp.corrupted.bytes.slice(0, 12)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

    if (origContainer) {
      origContainer.innerHTML = `
        <div class="w-full space-y-2 text-left">
          <div class="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span class="text-2xl">📄</span>
            <div>
              <div class="font-bold text-white text-xs">${origInfo.label}</div>
              <div class="text-[10px] text-slate-400 font-mono">${formatSize(comp.original.byteCount)} &bull; Header: ${hexOrig}...</div>
            </div>
          </div>
          <div class="text-[10px] text-emerald-400 font-mono">Status: 100% Valid File Structure</div>
        </div>
      `;
    }

    if (corruptContainer) {
      if (!comp.hasError) {
        corruptContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center p-6 text-slate-400 text-center space-y-1">
            <span class="text-2xl">✨</span>
            <div class="font-bold text-xs text-white">No Errors Introduced</div>
            <div class="text-[10px] text-slate-500">Mutate bases to simulate document corruption</div>
          </div>
        `;
      } else {
        corruptContainer.innerHTML = `
          <div class="w-full space-y-2 text-left">
            <div class="flex items-center gap-3 bg-red-950/40 p-3 rounded-xl border border-red-800">
              <span class="text-2xl text-red-400">⚡</span>
              <div>
                <div class="font-bold text-red-300 text-xs">${origInfo.label} (Damaged)</div>
                <div class="text-[10px] text-red-400/80 font-mono">${formatSize(comp.corrupted.byteCount)} &bull; Header: ${hexCorr}...</div>
              </div>
            </div>
            <div class="p-2 bg-red-950/60 rounded-lg border border-red-800/60 text-[10px] text-red-300 font-sans">
              ⚠️ <strong>Integrity Compromised:</strong> Document parser / Adobe Acrobat will report this file is damaged and cannot be opened.
            </div>
          </div>
        `;
      }
    }
  }

  // Update Stats row
  if (origStats) {
    origStats.innerHTML = `<span>Bases: ${comp.original.baseCount.toLocaleString()} &bull; Bytes: ${formatSize(comp.original.byteCount)}</span><span class="text-emerald-400 font-bold">100% Valid</span>`;
  }

  if (corruptStats) {
    if (comp.hasError) {
      corruptStats.innerHTML = `<span class="text-red-400 font-bold">⚠️ ${comp.mutationCount} Mutated Base${comp.mutationCount === 1 ? '' : 's'} (${comp.mutationCount * 2} bit flips)</span>`;
    } else {
      corruptStats.innerHTML = `<span class="text-slate-400 font-mono">0 Errors &bull; Intact</span>`;
    }
  }

  // Setup Download Corrupted File Button
  if (btnDownloadCorrupt) {
    if (comp.hasError && comp.corrupted.bytes && comp.corrupted.bytes.length > 0) {
      btnDownloadCorrupt.classList.remove('hidden');
      const corruptedFileName = 'corrupted_' + (window.appState.isFileMode ? window.appState.currentFileName : `mutated_file.${corrInfo.ext}`);
      btnDownloadCorrupt.innerHTML = `<span>📥</span><span>Download Corrupted File (${formatSize(comp.corrupted.byteCount)})</span>`;
      btnDownloadCorrupt.onclick = () => {
        const cBlob = new Blob([comp.corrupted.bytes], { type: corrInfo.mime });
        const cUrl = URL.createObjectURL(cBlob);
        const a = document.createElement('a');
        a.href = cUrl;
        a.download = corruptedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(cUrl), 2500);
        window.showToast(`Downloaded ${corruptedFileName} for error testing!`, 'warn');
      };
    } else {
      btnDownloadCorrupt.classList.add('hidden');
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
