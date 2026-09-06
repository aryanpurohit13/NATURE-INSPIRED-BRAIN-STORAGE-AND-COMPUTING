/**
 * Presentation Hub Module
 * Allows the user to:
 * 1. Upload custom presentation files (PDF, PPTX, PPT, Images, Keynote)
 * 2. View presentations in-browser (Embedded PDF viewer or Slide Deck viewer)
 * 3. Browse a 6-slide built-in interactive DNA Storage slide deck with animations
 * 4. Use presenter controls: Next, Previous, Fullscreen mode, Slide Jump, Keyboard shortcuts
 * 5. Manage real-time Speaker Notes with localStorage persistence
 */

class PresentationHub {
  constructor() {
    this.currentSlide = 0;
    this.uploadedFile = null; // { name, size, type, url, isPdf, isImage, isPpt }
    this.speakerNotesKey = 'dna_presentation_speaker_notes_v1';
    this.speakerNotes = this.loadSpeakerNotes();

    // Built-in 6-slide master presentation deck
    this.defaultSlides = [
      {
        slideNumber: 1,
        tag: 'Title Slide',
        title: 'DNA Digital Data Storage',
        subtitle: 'Storing the Digital Universe in the Molecule of Life',
        bullets: [
          'Addressing the global data expansion with biological information density.',
          'Converting 0s and 1s into the four fundamental chemical nucleotides: A, T, G, and C.',
          'Achieving archival longevity measured in millennia at zero idle electrical power.'
        ],
        icon: '🧬',
        badge: 'Introduction & Vision',
        speakerNote: 'Welcome examiners. Today I present our working model of DNA Digital Data Storage—a fusion of computer science, information theory, and synthetic molecular biology.'
      },
      {
        slideNumber: 2,
        tag: 'The Challenge',
        title: 'The Silicon Crisis & Data Explosion',
        subtitle: 'Why Conventional Storage Cannot Keep Pace',
        bullets: [
          'Global digital footprint will exceed 175 Zettabytes (175 trillion gigabytes).',
          'Silicon NAND flash memories suffer from physical gate leakage after 5–10 years.',
          'Magnetic tapes require constant environmental maintenance and degrade after 15–20 years.',
          'Worldwide enterprise data centers consume over 2% of total global electricity.'
        ],
        icon: '⚡',
        badge: 'Industry Motivation',
        speakerNote: 'Silicon storage media are physically reaching atomic limits. DNA provides a physical density six orders of magnitude greater than any flash drive on Earth.'
      },
      {
        slideNumber: 3,
        tag: 'The Codec Engine',
        title: 'Mathematical Encoding & Chemical Synthesis',
        subtitle: 'Base-2 Binary to Base-4 Quaternary Mapping',
        bullets: [
          '2-Bit Mapping Dictionary: 00 = Adenine (A), 01 = Cytosine (C), 10 = Guanine (G), 11 = Thymine (T).',
          'Characters serialize into 8-bit ASCII/UTF-8 bytes (e.g. "H" = 01001000 -> CAGA).',
          'Payload chunking into physical oligos (100–200 nt) flanked by primer tags and addresses.',
          'Liquid synthesis platforms assemble physical DNA oligonucleotides base-by-base.'
        ],
        icon: '📐',
        badge: 'Information Theory',
        speakerNote: 'Computers think in binary bits. Because DNA has four chemical states (A, T, G, C), each base naturally stores exactly two bits (2^2 = 4), achieving a theoretical efficiency of 2 bits per base.'
      },
      {
        slideNumber: 4,
        tag: 'Random Access',
        title: 'Selective Retrieval via PCR Amplification',
        subtitle: 'Targeting One Specific File in a Mixed Pool',
        bullets: [
          'Trillions of distinct digital files are suspended together in a single disordered liquid pool.',
          'Each file is synthesized with distinct 20-base Forward and Reverse Primer barcodes.',
          'Polymerase Chain Reaction (PCR) uses matching primers to selectively amplify the target file 2^n fold.',
          'The chosen file is enriched to >99.9% purity for high-throughput sequencing without reading the entire archive.'
        ],
        icon: '🔬',
        badge: 'Random Access Retrieval',
        speakerNote: 'How do we find a file without reading the whole test tube? We use molecular random access. Primers act like file search queries, amplifying only the targeted file via PCR.'
      },
      {
        slideNumber: 5,
        tag: 'Resilience',
        title: 'Error Simulation & Majority Voting',
        subtitle: 'Overcoming Biochemical Decay & Sequencing Noise',
        bullets: [
          'Physical DNA can experience deamination, radiation damage, and sequencing substitutions.',
          'Chemical synthesis inherently creates millions of physical redundant copies per strand.',
          'Multi-Copy Majority Voting inspects independent reads column-by-column to outvote mutated bases.',
          'Integrated error correction guarantees 100% bit-perfect file reconstruction.'
        ],
        icon: '🛡️',
        badge: 'Fault Tolerance',
        speakerNote: 'Real DNA storage deals with biological noise. By leveraging copy coverage and majority voting across reads, our model automatically isolates and repairs mutated bases.'
      },
      {
        slideNumber: 6,
        tag: 'Summary & Metrics',
        title: 'The Molecular Archive of Tomorrow',
        subtitle: 'Density, Longevity, and Environmental Sustainability',
        bullets: [
          'Density: ~215 Petabytes (215 million GB) stored inside just 1 single gram of DNA.',
          'Durability: Preserved in synthetic silica capsules, DNA lasts over 500,000+ years.',
          'Sustainability: Consumes 0 Watts of electrical power in passive archival state.',
          'All worldwide data could theoretically be preserved in a single shoebox of DNA.'
        ],
        icon: '🌍',
        badge: 'Benchmark Highlights',
        speakerNote: 'To summarize: DNA storage offers unmatched storage density, millennia-scale durability, and zero power consumption. Thank you for your time, and I welcome any questions.'
      }
    ];
  }

  loadSpeakerNotes() {
    try {
      const saved = localStorage.getItem(this.speakerNotesKey);
      return saved || '';
    } catch (e) {
      return '';
    }
  }

  saveSpeakerNotes(notes) {
    this.speakerNotes = notes;
    try {
      localStorage.setItem(this.speakerNotesKey, notes);
    } catch (e) {}
  }

  handleFileUpload(file, onRender) {
    if (!file) return;

    const fileType = file.type || '';
    const fileName = file.name || 'presentation';
    const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
    const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
    const isPpt = /\.(pptx?|key|odp)$/i.test(fileName);

    const reader = new FileReader();

    if (isPdf || isImage) {
      reader.onload = (e) => {
        this.uploadedFile = {
          name: fileName,
          size: file.size,
          sizeFormatted: this.formatBytes(file.size),
          type: fileType,
          url: e.target.result,
          isPdf: isPdf,
          isImage: isImage,
          isPpt: false,
          uploadDate: new Date().toLocaleTimeString()
        };
        if (onRender) onRender();
      };
      reader.readAsDataURL(file);
    } else {
      // PPT or other presentation document
      reader.onload = (e) => {
        this.uploadedFile = {
          name: fileName,
          size: file.size,
          sizeFormatted: this.formatBytes(file.size),
          type: fileType || 'application/vnd.presentation',
          url: e.target.result,
          isPdf: false,
          isImage: false,
          isPpt: true,
          uploadDate: new Date().toLocaleTimeString()
        };
        if (onRender) onRender();
      };
      reader.readAsDataURL(file);
    }
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  resetToDefaultDeck(onRender) {
    this.uploadedFile = null;
    this.currentSlide = 0;
    if (onRender) onRender();
  }

  nextSlide() {
    if (this.currentSlide < this.defaultSlides.length - 1) {
      this.currentSlide++;
      return true;
    }
    return false;
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      return true;
    }
    return false;
  }

  goToSlide(idx) {
    if (idx >= 0 && idx < this.defaultSlides.length) {
      this.currentSlide = idx;
      return true;
    }
    return false;
  }

  renderPresentationView(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check if custom uploaded presentation exists
    const hasCustomFile = !!this.uploadedFile;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- TOP PRESENTATION HEADER -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>📽️</span> Presentation Workspace
            </div>
            <h2 class="text-2xl font-black text-white flex items-center gap-2">
              <span>PRESENTATION</span>
              ${hasCustomFile ? `<span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono">Custom Upload: ${this.uploadedFile.name}</span>` : '<span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">Default Deck (6 Slides)</span>'}
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Upload your college presentation file (PDF, PPTX, Images) or present directly using the interactive built-in slide deck.
            </p>
          </div>

          <!-- Presentation Mode Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <input type="file" id="pres-file-input" accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.key" class="hidden">
            <button id="btn-pres-upload" class="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/30">
              <span>📤</span><span>Upload Presentation</span>
            </button>

            ${hasCustomFile ? `
              <button id="btn-pres-reset-default" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5">
                <span>🔄</span><span>Use Default Deck</span>
              </button>
            ` : ''}

            <button id="btn-pres-fullscreen" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-800 transition flex items-center gap-1.5" title="Start Fullscreen Mode (F)">
              <span>⛶</span><span>Fullscreen</span>
            </button>
          </div>
        </div>

        <!-- MAIN PRESENTATION SCREEN -->
        <div id="presentation-stage-wrapper" class="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden min-h-[480px] flex flex-col">
          ${this.renderStageContent()}
        </div>

        <!-- CONTROLS & SPEAKER NOTES PANEL -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Slide Navigation & Thumbnails (If in default deck mode) -->
          <div class="${hasCustomFile ? 'md:col-span-6' : 'md:col-span-7'} bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                <span>🎛️</span> Slide Deck Controls
              </span>
              <span class="text-[11px] font-mono text-cyan-400">Keyboard: ← / → or Space</span>
            </div>

            ${!hasCustomFile ? `
              <!-- Slide Thumbnails Strip -->
              <div class="grid grid-cols-6 gap-2 pt-1">
                ${this.defaultSlides.map((s, idx) => `
                  <button data-jump-slide="${idx}" class="p-2 rounded-xl border text-center transition ${this.currentSlide === idx ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}">
                    <div class="text-xs font-black">#${s.slideNumber}</div>
                    <div class="text-[9px] truncate font-sans mt-0.5">${s.tag}</div>
                  </button>
                `).join('')}
              </div>

              <!-- Next / Prev Action Buttons -->
              <div class="flex items-center justify-between pt-2">
                <button id="btn-pres-prev" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-40" ${this.currentSlide === 0 ? 'disabled' : ''}>
                  <span>←</span><span>Previous Slide</span>
                </button>
                <span class="text-xs font-mono font-bold text-slate-300">
                  Slide ${this.currentSlide + 1} of ${this.defaultSlides.length}
                </span>
                <button id="btn-pres-next" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30 disabled:opacity-40" ${this.currentSlide === this.defaultSlides.length - 1 ? 'disabled' : ''}>
                  <span>Next Slide</span><span>→</span>
                </button>
              </div>
            ` : `
              <!-- Custom File Info Card -->
              <div class="space-y-2 text-xs">
                <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div class="font-bold text-white flex items-center gap-2">
                    <span class="text-emerald-400">📄</span>
                    <span>${this.uploadedFile.name}</span>
                  </div>
                  <div class="text-[11px] text-slate-400">
                    Size: ${this.uploadedFile.sizeFormatted} | Uploaded: ${this.uploadedFile.uploadDate}
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-2">
                  <a href="${this.uploadedFile.url}" download="${this.uploadedFile.name}" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold border border-slate-700 transition flex items-center gap-1">
                    <span>📥</span><span>Download Presentation File</span>
                  </a>
                  <button id="btn-reupload-file" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition">
                    Upload Different File
                  </button>
                </div>
              </div>
            `}
          </div>

          <!-- Speaker Notes Scratchpad -->
          <div class="${hasCustomFile ? 'md:col-span-6' : 'md:col-span-5'} bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <span>📝</span> Presenter / Speaker Notes
              </span>
              <span id="speaker-notes-status" class="text-[10px] text-emerald-400 font-mono">Auto-saved</span>
            </div>

            <textarea id="pres-speaker-notes" rows="5" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-sans text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500 transition" placeholder="Write or paste your presentation talking points, viva reminders, or speech bullets here...">${this.speakerNotes || (!hasCustomFile ? this.defaultSlides[this.currentSlide].speakerNote : '')}</textarea>

            <div class="flex items-center justify-between text-[10px] text-slate-500">
              <span>Saved locally in browser storage</span>
              <button id="btn-load-slide-note" class="text-cyan-400 hover:text-cyan-300 font-bold">
                Insert Recommended Talking Point
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(containerId);
  }

  renderStageContent() {
    if (this.uploadedFile) {
      if (this.uploadedFile.isPdf) {
        return `
          <div class="w-full h-[620px] flex flex-col bg-slate-950">
            <div class="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs px-4">
              <span class="font-bold text-white flex items-center gap-2">
                <span>📑</span><span>${this.uploadedFile.name}</span>
              </span>
              <span class="text-[11px] text-slate-400">Embedded PDF Viewer</span>
            </div>
            <iframe src="${this.uploadedFile.url}#view=FitH" class="w-full flex-grow border-0" title="Presentation PDF Viewer"></iframe>
          </div>
        `;
      } else if (this.uploadedFile.isImage) {
        return `
          <div class="w-full h-[520px] flex items-center justify-center p-6 bg-slate-950">
            <img src="${this.uploadedFile.url}" alt="${this.uploadedFile.name}" class="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800">
          </div>
        `;
      } else {
        // PPT / PPTX file
        return `
          <div class="w-full h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-950 space-y-4">
            <div class="w-20 h-20 rounded-2xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-4xl shadow-xl">
              📊
            </div>
            <div class="max-w-md space-y-1.5">
              <h3 class="text-xl font-bold text-white">${this.uploadedFile.name}</h3>
              <p class="text-xs text-slate-400">
                PowerPoint Presentation Ready (${this.uploadedFile.sizeFormatted}). You can download and present it directly with your slides!
              </p>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <a href="${this.uploadedFile.url}" download="${this.uploadedFile.name}" class="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-600/20">
                <span>📥</span><span>Download & Present File</span>
              </a>
              <button id="btn-pres-switch-deck" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition">
                Show Visual Interactive Deck
              </button>
            </div>
          </div>
        `;
      }
    }

    // Default Interactive Slide Deck
    const slide = this.defaultSlides[this.currentSlide];

    return `
      <div class="p-8 sm:p-12 flex-grow flex flex-col justify-between bg-gradient-to-br from-slate-950 via-[#0a1122] to-slate-950 select-none">
        <!-- Slide Top Bar -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-xl shadow-lg shadow-cyan-600/30">
              ${slide.icon}
            </span>
            <div>
              <span class="text-xs font-black font-mono text-cyan-400 tracking-wider uppercase">Slide 0${slide.slideNumber} / 06</span>
              <div class="text-[11px] text-slate-400 font-sans">${slide.tag}</div>
            </div>
          </div>

          <span class="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-bold">
            ${slide.badge}
          </span>
        </div>

        <!-- Slide Main Body -->
        <div class="my-auto py-8 max-w-3xl space-y-6">
          <div class="space-y-2">
            <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              ${slide.title}
            </h1>
            <p class="text-sm sm:text-base text-cyan-300 font-medium">
              ${slide.subtitle}
            </p>
          </div>

          <div class="space-y-3 pt-2">
            ${slide.bullets.map(bullet => `
              <div class="flex items-start gap-3 p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl shadow-sm">
                <span class="text-emerald-400 text-sm mt-0.5">✦</span>
                <span class="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">${bullet}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Slide Footer Bar -->
        <div class="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs font-mono text-slate-500">
          <span>DNA Data Storage Working Model</span>
          <span>College Demo & Presentation System</span>
        </div>
      </div>
    `;
  }

  attachEvents(containerId) {
    const fileInput = document.getElementById('pres-file-input');
    const btnUpload = document.getElementById('btn-pres-upload');
    const btnReupload = document.getElementById('btn-reupload-file');
    const btnReset = document.getElementById('btn-pres-reset-default');
    const btnSwitchDeck = document.getElementById('btn-pres-switch-deck');
    const btnFullscreen = document.getElementById('btn-pres-fullscreen');
    const stageWrapper = document.getElementById('presentation-stage-wrapper');

    const btnNext = document.getElementById('btn-pres-next');
    const btnPrev = document.getElementById('btn-pres-prev');
    const notesArea = document.getElementById('pres-speaker-notes');
    const btnLoadSlideNote = document.getElementById('btn-load-slide-note');
    const notesStatus = document.getElementById('speaker-notes-status');

    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => fileInput.click());
    }
    if (btnReupload && fileInput) {
      btnReupload.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (f) {
          this.handleFileUpload(f, () => {
            this.renderPresentationView(containerId);
            if (window.showToast) window.showToast(`Loaded presentation: ${f.name}`, 'success');
          });
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.resetToDefaultDeck(() => {
          this.renderPresentationView(containerId);
          if (window.showToast) window.showToast('Restored default interactive slide deck', 'info');
        });
      });
    }

    if (btnSwitchDeck) {
      btnSwitchDeck.addEventListener('click', () => {
        this.resetToDefaultDeck(() => {
          this.renderPresentationView(containerId);
        });
      });
    }

    // Fullscreen Mode
    if (btnFullscreen && stageWrapper) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          stageWrapper.requestFullscreen().catch(err => {
            console.warn('Fullscreen error', err);
          });
        } else {
          document.exitFullscreen();
        }
      });
    }

    // Next / Prev slide
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.nextSlide()) {
          this.renderPresentationView(containerId);
        }
      });
    }
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.prevSlide()) {
          this.renderPresentationView(containerId);
        }
      });
    }

    // Thumbnail jump
    const jumpBtns = document.querySelectorAll('button[data-jump-slide]');
    jumpBtns.forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.getAttribute('data-jump-slide'), 10);
        this.goToSlide(idx);
        this.renderPresentationView(containerId);
      });
    });

    // Speaker notes save
    if (notesArea) {
      notesArea.addEventListener('input', (e) => {
        this.saveSpeakerNotes(e.target.value);
        if (notesStatus) {
          notesStatus.textContent = 'Auto-saved';
        }
      });
    }

    if (btnLoadSlideNote && notesArea) {
      btnLoadSlideNote.addEventListener('click', () => {
        const note = this.defaultSlides[this.currentSlide].speakerNote;
        notesArea.value = note;
        this.saveSpeakerNotes(note);
        if (window.showToast) window.showToast('Inserted slide talking points!', 'info');
      });
    }

    // Keyboard navigation when presentation is active
    window.onkeydown = (e) => {
      // Don't trigger when user is typing in textarea or input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (window.appState && window.appState.currentTab !== 'presentation') return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (this.nextSlide()) this.renderPresentationView(containerId);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (this.prevSlide()) this.renderPresentationView(containerId);
      } else if (e.key.toLowerCase() === 'f' && stageWrapper) {
        e.preventDefault();
        if (!document.fullscreenElement) {
          stageWrapper.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    };
  }
}

window.presentationHub = new PresentationHub();
