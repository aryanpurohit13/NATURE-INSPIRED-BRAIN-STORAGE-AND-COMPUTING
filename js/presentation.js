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

    // Slideshow & Cinema Presenter State
    this.isAutoPlaying = false;
    this.autoPlayDuration = 5; // seconds per slide (3, 5, 8, 10)
    this.loopSlideshow = true;
    this.slideStartTime = 0;
    this.progressInterval = null;
    this.isSlideShowActive = false;
    this.laserPointerActive = false;
    this.showNotesOverlay = false;
    this.hudTimeout = null;
    this.containerId = 'presentation-hub-container';

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

    // Revoke previous object URL if any to prevent memory leaks
    if (this.uploadedFile && this.uploadedFile.url && this.uploadedFile.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(this.uploadedFile.url); } catch (e) {}
    }

    // Instant blob URL: works on any file size from 1 KB to 500 MB without delay
    const objectUrl = URL.createObjectURL(file);

    this.uploadedFile = {
      name: fileName,
      size: file.size,
      sizeFormatted: this.formatBytes(file.size),
      type: fileType,
      url: objectUrl,
      isPdf: isPdf,
      isImage: isImage,
      isPpt: isPpt,
      uploadDate: new Date().toLocaleTimeString()
    };

    if (onRender) onRender();
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

  nextSlide(allowLoop = false) {
    if (this.currentSlide < this.defaultSlides.length - 1) {
      this.currentSlide++;
      return true;
    } else if (allowLoop && this.loopSlideshow) {
      this.currentSlide = 0;
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

  // =========================================================================
  // SLIDESHOW AUTO-PLAY ENGINE
  // =========================================================================
  startAutoPlay() {
    this.stopAutoPlay(false);
    this.isAutoPlaying = true;
    this.slideStartTime = Date.now();
    this.updateAutoPlayUi();

    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.slideStartTime;
      const total = this.autoPlayDuration * 1000;
      const pct = Math.min(100, (elapsed / total) * 100);

      const stageBar = document.getElementById('stage-progress-bar');
      if (stageBar) stageBar.style.width = `${pct}%`;

      const modalBar = document.getElementById('slideshow-progress-line');
      if (modalBar) modalBar.style.width = `${pct}%`;

      if (elapsed >= total) {
        this.slideStartTime = Date.now();
        const moved = this.nextSlide(this.loopSlideshow);
        if (moved) {
          if (this.isSlideShowActive) {
            this.updateFullscreenSlideContent();
          } else {
            this.renderPresentationView(this.containerId);
          }
        } else {
          this.stopAutoPlay(true);
        }
      }
    }, 50);
  }

  stopAutoPlay(updateUi = true) {
    this.isAutoPlaying = false;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    const stageBar = document.getElementById('stage-progress-bar');
    if (stageBar) stageBar.style.width = '0%';
    const modalBar = document.getElementById('slideshow-progress-line');
    if (modalBar) modalBar.style.width = '0%';

    if (updateUi) this.updateAutoPlayUi();
  }

  toggleAutoPlay() {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
      if (window.showToast) window.showToast('Slideshow paused', 'info');
    } else {
      this.startAutoPlay();
      if (window.showToast) window.showToast(`Slideshow started (${this.autoPlayDuration}s / slide)`, 'success');
    }
  }

  updateAutoPlayUi() {
    const label = document.getElementById('label-toggle-autoplay');
    const icon = document.getElementById('icon-toggle-autoplay');
    if (label) label.textContent = this.isAutoPlaying ? 'Pause Slideshow' : 'Auto-Play Slideshow';
    if (icon) icon.textContent = this.isAutoPlaying ? '⏸️' : '▶️';

    const fsIcon = document.getElementById('fs-autoplay-icon');
    const fsLabel = document.getElementById('fs-autoplay-label');
    if (fsIcon) fsIcon.textContent = this.isAutoPlaying ? '⏸️' : '▶️';
    if (fsLabel) fsLabel.textContent = this.isAutoPlaying ? 'Pause' : 'Play';

    const fsBadge = document.getElementById('fs-autoplay-badge');
    if (fsBadge) {
      fsBadge.innerHTML = this.isAutoPlaying
        ? `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span> Auto-Advancing (${this.autoPlayDuration}s)`
        : `<span class="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span> Manual Control`;
    }
  }

  // =========================================================================
  // FULLSCREEN CINEMA SLIDESHOW MODE
  // =========================================================================
  startFullscreenSlideshow() {
    this.isSlideShowActive = true;
    let modal = document.getElementById('fullscreen-slideshow-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'fullscreen-slideshow-modal';
      document.body.appendChild(modal);
    }

    modal.className = 'fixed inset-0 z-[9999] bg-[#020617] text-white flex flex-col justify-between overflow-hidden select-none';
    modal.innerHTML = this.renderFullscreenLayout();

    if (!document.fullscreenElement) {
      try {
        if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      } catch (e) {}
    }

    this.attachFullscreenEvents();

    if (!this.isAutoPlaying) {
      this.startAutoPlay();
    } else {
      this.updateAutoPlayUi();
    }
  }

  renderFullscreenLayout() {
    const hasCustomFile = !!this.uploadedFile;
    const slide = this.defaultSlides[this.currentSlide];

    return `
      <!-- LASER POINTER DOT -->
      <div id="slideshow-laser-dot" class="laser-pointer-dot"></div>

      <!-- TOP HEADER BAR -->
      <div class="p-4 sm:px-8 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 flex items-center justify-between z-20">
        <div class="flex items-center gap-3">
          <span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-lg shadow-md shadow-cyan-600/30">
            🧬
          </span>
          <div>
            <div class="text-xs font-black text-white tracking-wider uppercase flex items-center gap-2">
              <span>DNA Data Storage Platform</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">Cinema Slideshow</span>
            </div>
            <div class="text-[11px] text-slate-400 font-sans">
              ${hasCustomFile ? `Custom Presentation: ${this.uploadedFile.name}` : `Master Deck &bull; Slide ${this.currentSlide + 1} of ${this.defaultSlides.length}`}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div id="fs-autoplay-badge" class="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            ${this.isAutoPlaying ? `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span> Auto-Advancing (${this.autoPlayDuration}s)` : '<span class="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span> Manual Control'}
          </div>

          <button id="btn-close-slideshow" class="px-3.5 py-1.5 bg-slate-800 hover:bg-red-950 hover:border-red-700 hover:text-red-300 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition flex items-center gap-1.5 cursor-pointer" title="Exit Slide Show (Esc)">
            <span>✕</span><span>Exit (Esc)</span>
          </button>
        </div>
      </div>

      <!-- MAIN SLIDE BODY VIEWPORT -->
      <div id="fullscreen-slide-viewport" class="flex-grow flex items-center justify-center p-6 sm:p-12 overflow-auto relative">
        ${this.renderFullscreenBodyContent()}
      </div>

      <!-- FLOATING SPEAKER NOTES DRAWER -->
      <div id="fs-notes-drawer" class="${this.showNotesOverlay ? '' : 'hidden'} absolute bottom-24 right-6 w-96 max-w-[90vw] p-4 bg-slate-900/95 border border-cyan-800/80 rounded-2xl shadow-2xl backdrop-blur-md z-30 space-y-2">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <span>📝</span><span>Speaker Notes (Slide ${this.currentSlide + 1})</span>
          </span>
          <button id="btn-close-notes-drawer" class="text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>
        <div class="text-xs text-slate-200 leading-relaxed font-sans max-h-48 overflow-y-auto">
          ${this.defaultSlides[this.currentSlide] ? this.defaultSlides[this.currentSlide].speakerNote : ''}
        </div>
      </div>

      <!-- BOTTOM FLOATING HUD CONTROLS -->
      <div id="slideshow-hud-bar" class="slideshow-hud p-4 sm:px-8 bg-slate-950/95 backdrop-blur border-t border-slate-800/80 relative z-20">
        <!-- Progress Bar Line on HUD Top Edge -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
          <div id="slideshow-progress-line" class="slideshow-progress-line w-0 h-full"></div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 max-w-6xl mx-auto">
          <!-- Slide Counter & Label -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60">
              Slide ${this.currentSlide + 1} / ${this.defaultSlides.length}
            </span>
            <span class="hidden sm:inline text-xs text-slate-400 truncate max-w-xs font-medium">
              ${slide ? slide.title : ''}
            </span>
          </div>

          <!-- Main Player Control Buttons -->
          <div class="flex items-center gap-2">
            <button id="btn-fs-prev" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40" ${this.currentSlide === 0 ? 'disabled' : ''}>
              <span>◀</span><span>Prev</span>
            </button>

            <button id="btn-fs-toggle-play" class="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 cursor-pointer">
              <span id="fs-autoplay-icon">${this.isAutoPlaying ? '⏸️' : '▶️'}</span>
              <span id="fs-autoplay-label">${this.isAutoPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button id="btn-fs-next" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40" ${this.currentSlide === this.defaultSlides.length - 1 && !this.loopSlideshow ? 'disabled' : ''}>
              <span>Next</span><span>▶</span>
            </button>
          </div>

          <!-- Tool Belt: Speed, Laser, Notes, Loop -->
          <div class="flex items-center gap-2">
            <!-- Speed Selector -->
            <div class="flex items-center gap-1 text-xs text-slate-400">
              <span>⏱️</span>
              <select id="fs-select-speed" class="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer">
                <option value="3" ${this.autoPlayDuration === 3 ? 'selected' : ''}>3s</option>
                <option value="5" ${this.autoPlayDuration === 5 ? 'selected' : ''}>5s</option>
                <option value="8" ${this.autoPlayDuration === 8 ? 'selected' : ''}>8s</option>
                <option value="10" ${this.autoPlayDuration === 10 ? 'selected' : ''}>10s</option>
              </select>
            </div>

            <!-- Laser Pointer Mode Button -->
            <button id="btn-fs-laser" class="px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.laserPointerActive ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'}" title="Toggle Laser Pointer (L)">
              <span>🔴</span><span class="hidden md:inline">Laser</span>
            </button>

            <!-- Speaker Notes Mode Button -->
            <button id="btn-fs-notes" class="px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.showNotesOverlay ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'}" title="Speaker Notes (N)">
              <span>📝</span><span class="hidden md:inline">Notes</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderFullscreenBodyContent() {
    if (this.uploadedFile) {
      if (this.uploadedFile.isPdf) {
        return `
          <div class="w-full h-full max-w-6xl max-h-[85vh] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <iframe src="${this.uploadedFile.url}#view=FitH" class="w-full flex-grow border-0" title="Presentation PDF Viewer"></iframe>
          </div>
        `;
      } else if (this.uploadedFile.isImage) {
        return `
          <div class="w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center">
            <img src="${this.uploadedFile.url}" alt="${this.uploadedFile.name}" class="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800">
          </div>
        `;
      } else {
        return `
          <div class="max-w-xl p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-4xl shadow-xl">📊</div>
            <h2 class="text-2xl font-black text-white">${this.uploadedFile.name}</h2>
            <p class="text-xs text-slate-400">PowerPoint Presentation ready for presentation.</p>
            <div class="flex items-center justify-center gap-3 pt-2">
              <a href="${this.uploadedFile.url}" download="${this.uploadedFile.name}" class="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-600/20">
                <span>📥</span><span>Download PPT File</span>
              </a>
              <button id="btn-fs-switch-deck" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer">
                Show Master 6-Slide Deck
              </button>
            </div>
          </div>
        `;
      }
    }

    const slide = this.defaultSlides[this.currentSlide];
    return `
      <div class="slide-content-enter w-full max-w-5xl bg-gradient-to-br from-slate-900/95 via-[#0a1122] to-slate-950 border border-slate-800/80 rounded-3xl p-8 sm:p-14 shadow-2xl space-y-8 my-auto select-none">
        <!-- Top Slide Badge & Counter -->
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-5">
          <div class="flex items-center gap-4">
            <span class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-3xl shadow-xl shadow-cyan-600/30">
              ${slide.icon}
            </span>
            <div>
              <span class="text-xs font-black font-mono text-cyan-400 tracking-widest uppercase">SLIDE 0${slide.slideNumber} / 06</span>
              <div class="text-sm font-semibold text-slate-300 font-sans">${slide.tag}</div>
            </div>
          </div>

          <span class="px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-bold shadow-sm">
            ${slide.badge}
          </span>
        </div>

        <!-- Slide Title & Subtitle -->
        <div class="space-y-3">
          <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            ${slide.title}
          </h1>
          <p class="text-base sm:text-xl text-cyan-300/90 font-medium">
            ${slide.subtitle}
          </p>
        </div>

        <!-- Slide Bullets with glowing points -->
        <div class="space-y-3.5 pt-2">
          ${slide.bullets.map(b => `
            <div class="flex items-start gap-4 p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl shadow-sm hover:border-cyan-800/60 transition">
              <span class="text-emerald-400 text-lg mt-0.5">✦</span>
              <span class="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">${b}</span>
            </div>
          `).join('')}
        </div>

        <!-- Footer Strip -->
        <div class="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs font-mono text-slate-500">
          <span>DNA Data Storage Working Model &bull; College Examination Deck</span>
          <span>Shortcut: Space / &rarr; to advance &bull; L for Laser</span>
        </div>
      </div>
    `;
  }

  updateFullscreenSlideContent() {
    const viewport = document.getElementById('fullscreen-slide-viewport');
    if (viewport) {
      viewport.innerHTML = this.renderFullscreenBodyContent();
    }
    const notesContent = document.querySelector('#fs-notes-drawer .text-slate-200');
    if (notesContent && this.defaultSlides[this.currentSlide]) {
      notesContent.textContent = this.defaultSlides[this.currentSlide].speakerNote;
    }
    const notesTitle = document.querySelector('#fs-notes-drawer span');
    if (notesTitle) {
      notesTitle.innerHTML = `<span>📝</span><span>Speaker Notes (Slide ${this.currentSlide + 1})</span>`;
    }
    const hudBar = document.getElementById('slideshow-hud-bar');
    if (hudBar) {
      const slide = this.defaultSlides[this.currentSlide];
      const counter = hudBar.querySelector('.font-mono.font-bold');
      if (counter) counter.textContent = `Slide ${this.currentSlide + 1} / ${this.defaultSlides.length}`;
      const title = hudBar.querySelector('.truncate');
      if (title && slide) title.textContent = slide.title;
      const btnPrev = document.getElementById('btn-fs-prev');
      if (btnPrev) btnPrev.disabled = (this.currentSlide === 0);
      const btnNext = document.getElementById('btn-fs-next');
      if (btnNext) btnNext.disabled = (this.currentSlide === this.defaultSlides.length - 1 && !this.loopSlideshow);
    }
    this.updateAutoPlayUi();
  }

  attachFullscreenEvents() {
    const modal = document.getElementById('fullscreen-slideshow-modal');
    if (!modal) return;

    const hudBar = document.getElementById('slideshow-hud-bar');
    const laserDot = document.getElementById('slideshow-laser-dot');
    const btnClose = document.getElementById('btn-close-slideshow');
    const btnNext = document.getElementById('btn-fs-next');
    const btnPrev = document.getElementById('btn-fs-prev');
    const btnTogglePlay = document.getElementById('btn-fs-toggle-play');
    const speedSelect = document.getElementById('fs-select-speed');
    const btnLaser = document.getElementById('btn-fs-laser');
    const btnNotes = document.getElementById('btn-fs-notes');
    const btnCloseNotes = document.getElementById('btn-close-notes-drawer');
    const btnSwitchDeck = document.getElementById('btn-fs-switch-deck');

    const resetHudTimer = () => {
      if (hudBar) hudBar.classList.remove('hud-idle');
      if (this.hudTimeout) clearTimeout(this.hudTimeout);
      this.hudTimeout = setTimeout(() => {
        if (this.isSlideShowActive && hudBar) {
          hudBar.classList.add('hud-idle');
        }
      }, 3000);
    };

    modal.onmousemove = (e) => {
      resetHudTimer();
      if (this.laserPointerActive && laserDot) {
        laserDot.style.display = 'block';
        laserDot.style.left = `${e.clientX}px`;
        laserDot.style.top = `${e.clientY}px`;
      }
    };

    resetHudTimer();

    if (btnClose) btnClose.onclick = () => this.closeFullscreenSlideshow();

    if (btnNext) {
      btnNext.onclick = () => {
        this.nextSlide(this.loopSlideshow);
        this.slideStartTime = Date.now();
        this.updateFullscreenSlideContent();
      };
    }

    if (btnPrev) {
      btnPrev.onclick = () => {
        this.prevSlide();
        this.slideStartTime = Date.now();
        this.updateFullscreenSlideContent();
      };
    }

    if (btnTogglePlay) {
      btnTogglePlay.onclick = () => {
        this.toggleAutoPlay();
      };
    }

    if (speedSelect) {
      speedSelect.onchange = (e) => {
        this.autoPlayDuration = parseInt(e.target.value, 10) || 5;
        this.slideStartTime = Date.now();
        this.updateAutoPlayUi();
      };
    }

    if (btnLaser) {
      btnLaser.onclick = () => {
        this.laserPointerActive = !this.laserPointerActive;
        if (!this.laserPointerActive && laserDot) laserDot.style.display = 'none';
        btnLaser.className = `px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.laserPointerActive ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'}`;
      };
    }

    if (btnNotes) {
      btnNotes.onclick = () => {
        this.showNotesOverlay = !this.showNotesOverlay;
        const drawer = document.getElementById('fs-notes-drawer');
        if (drawer) {
          if (this.showNotesOverlay) drawer.classList.remove('hidden');
          else drawer.classList.add('hidden');
        }
        btnNotes.className = `px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.showNotesOverlay ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'}`;
      };
    }

    if (btnCloseNotes) {
      btnCloseNotes.onclick = () => {
        this.showNotesOverlay = false;
        const drawer = document.getElementById('fs-notes-drawer');
        if (drawer) drawer.classList.add('hidden');
        if (btnNotes) btnNotes.className = 'px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300';
      };
    }

    if (btnSwitchDeck) {
      btnSwitchDeck.onclick = () => {
        this.resetToDefaultDeck(() => {
          this.updateFullscreenSlideContent();
        });
      };
    }
  }

  closeFullscreenSlideshow() {
    this.isSlideShowActive = false;
    if (this.hudTimeout) clearTimeout(this.hudTimeout);
    const modal = document.getElementById('fullscreen-slideshow-modal');
    if (modal) modal.remove();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this.renderPresentationView(this.containerId);
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
              Run an automated Slide Show, upload custom files (PDF, PPTX, Images), or present with interactive slide controls.
            </p>
          </div>

          <!-- Presentation Mode Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <input type="file" id="pres-file-input" accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.key" class="hidden">

            <button type="button" id="btn-pres-upload" class="cursor-pointer px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/30">
              <span>📤</span><span>Upload Presentation</span>
            </button>

            <!-- START SLIDE SHOW PRIMARY BUTTON -->
            <button type="button" id="btn-start-slideshow" class="cursor-pointer px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30" title="Start Fullscreen Slide Show (F5)">
              <span>▶️</span><span>Start Slide Show (F5)</span>
            </button>

            ${hasCustomFile ? `
              <button id="btn-pres-reset-default" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
                <span>🔄</span><span>Default Deck</span>
              </button>
            ` : ''}

            <button id="btn-pres-fullscreen" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-800 transition flex items-center gap-1.5 cursor-pointer" title="Fullscreen View (F)">
              <span>⛶</span><span>Fullscreen</span>
            </button>
          </div>
        </div>

        <!-- MAIN PRESENTATION SCREEN -->
        <div id="presentation-stage-wrapper" class="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden min-h-[480px] flex flex-col">
          <!-- Real-Time Countdown Progress Bar -->
          <div class="h-1 w-full bg-slate-900/80 overflow-hidden">
            <div id="stage-progress-bar" class="slideshow-progress-line w-0 h-full"></div>
          </div>
          ${this.renderStageContent()}
        </div>

        <!-- CONTROLS & SPEAKER NOTES PANEL -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Slide Navigation & Thumbnails Strip -->
          <div class="${hasCustomFile ? 'md:col-span-6' : 'md:col-span-7'} bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                <span>🎛️</span> Slide Deck & Slideshow Controls
              </span>
              <span class="text-[11px] font-mono text-cyan-400">Shortcuts: F5 / Space / ← →</span>
            </div>

            ${!hasCustomFile ? `
              <!-- Slide Thumbnails Strip -->
              <div class="grid grid-cols-6 gap-2 pt-1">
                ${this.defaultSlides.map((s, idx) => `
                  <button data-jump-slide="${idx}" class="p-2 rounded-xl border text-center transition cursor-pointer ${this.currentSlide === idx ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}">
                    <div class="text-xs font-black">#${s.slideNumber}</div>
                    <div class="text-[9px] truncate font-sans mt-0.5">${s.tag}</div>
                  </button>
                `).join('')}
              </div>

              <!-- Next / Prev Action Buttons -->
              <div class="flex items-center justify-between pt-2">
                <button id="btn-pres-prev" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-40 cursor-pointer" ${this.currentSlide === 0 ? 'disabled' : ''}>
                  <span>←</span><span>Previous Slide</span>
                </button>
                <span class="text-xs font-mono font-bold text-slate-300">
                  Slide ${this.currentSlide + 1} of ${this.defaultSlides.length}
                </span>
                <button id="btn-pres-next" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30 disabled:opacity-40 cursor-pointer" ${this.currentSlide === this.defaultSlides.length - 1 && !this.loopSlideshow ? 'disabled' : ''}>
                  <span>Next Slide</span><span>→</span>
                </button>
              </div>

              <!-- Automated Slideshow Toolbar Row -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 mt-1">
                <div class="flex items-center gap-2">
                  <button type="button" id="btn-toggle-autoplay" class="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                    <span id="icon-toggle-autoplay">${this.isAutoPlaying ? '⏸️' : '▶️'}</span>
                    <span id="label-toggle-autoplay">${this.isAutoPlaying ? 'Pause Slideshow' : 'Auto-Play Slideshow'}</span>
                  </button>

                  <div class="flex items-center gap-1 text-xs text-slate-400">
                    <span>⏱️</span>
                    <select id="select-autoplay-speed" class="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer">
                      <option value="3" ${this.autoPlayDuration === 3 ? 'selected' : ''}>3s / slide</option>
                      <option value="5" ${this.autoPlayDuration === 5 ? 'selected' : ''}>5s / slide</option>
                      <option value="8" ${this.autoPlayDuration === 8 ? 'selected' : ''}>8s / slide</option>
                      <option value="10" ${this.autoPlayDuration === 10 ? 'selected' : ''}>10s / slide</option>
                    </select>
                  </div>

                  <label class="inline-flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                    <input type="checkbox" id="chk-loop-slideshow" ${this.loopSlideshow ? 'checked' : ''} class="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0">
                    <span>Loop</span>
                  </label>
                </div>

                <button type="button" id="btn-card-slideshow" class="px-3 py-1.5 bg-gradient-to-r from-cyan-900 to-emerald-900 hover:from-cyan-800 hover:to-emerald-800 border border-cyan-700/60 text-cyan-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                  <span>⛶</span><span>Start Fullscreen Slide Show</span>
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
              <div class="flex items-center gap-2">
                <a href="${this.uploadedFile.url}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1">
                  <span>Open in New Tab</span><span>↗</span>
                </a>
                <span class="text-[11px] text-slate-400">Embedded PDF Viewer</span>
              </div>
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
            <div class="max-w-md space-y-2">
              <h3 class="text-xl font-bold text-white">${this.uploadedFile.name}</h3>
              <p class="text-xs text-slate-400">
                PowerPoint Presentation Ready (${this.uploadedFile.sizeFormatted}).
              </p>
              <div class="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-2.5 text-left flex items-start gap-2">
                <span class="text-base">💡</span>
                <span><strong>Pro Tip:</strong> To present and view your slides directly in this browser window, export your PowerPoint deck as a <strong>PDF</strong> and upload it here!</span>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <a href="${this.uploadedFile.url}" download="${this.uploadedFile.name}" class="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-600/20">
                <span>📥</span><span>Download Presentation File</span>
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
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4 text-xs font-mono text-slate-500">
          <span>DNA Data Storage Working Model &bull; 6 Master Slides</span>
          <div class="flex items-center gap-2">
            <button type="button" id="btn-stage-slideshow" class="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-sans font-semibold transition flex items-center gap-1.5 border border-emerald-800 cursor-pointer">
              <span>▶️</span><span>Play Slide Show (F5)</span>
            </button>
            <button type="button" id="btn-stage-upload" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-sans font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer">
              <span>📤</span><span>Upload Your Own Slides</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(containerId) {
    const fileInput = document.getElementById('pres-file-input');
    const btnUpload = document.getElementById('btn-pres-upload');
    const btnStageUpload = document.getElementById('btn-stage-upload');
    const btnStageSlideshow = document.getElementById('btn-stage-slideshow');
    const btnStartSlideshow = document.getElementById('btn-start-slideshow');
    const btnCardSlideshow = document.getElementById('btn-card-slideshow');
    const btnToggleAutoPlay = document.getElementById('btn-toggle-autoplay');
    const selectSpeed = document.getElementById('select-autoplay-speed');
    const chkLoop = document.getElementById('chk-loop-slideshow');

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

    // Upload Presentation Triggers
    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }
    if (btnStageUpload && fileInput) {
      btnStageUpload.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }
    if (btnReupload && fileInput) {
      btnReupload.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const f = e.target.files[0];
          this.handleFileUpload(f, () => {
            this.renderPresentationView(containerId);
            if (window.showToast) window.showToast(`Loaded presentation: ${f.name}`, 'success');
          });
        }
        fileInput.value = '';
      });
    }

    // Slideshow Triggers
    if (btnStartSlideshow) {
      btnStartSlideshow.addEventListener('click', () => {
        this.startFullscreenSlideshow();
      });
    }
    if (btnCardSlideshow) {
      btnCardSlideshow.addEventListener('click', () => {
        this.startFullscreenSlideshow();
      });
    }
    if (btnStageSlideshow) {
      btnStageSlideshow.addEventListener('click', () => {
        this.startFullscreenSlideshow();
      });
    }

    // In-page Auto-Play Toggle
    if (btnToggleAutoPlay) {
      btnToggleAutoPlay.addEventListener('click', () => {
        this.toggleAutoPlay();
      });
    }

    if (selectSpeed) {
      selectSpeed.addEventListener('change', (e) => {
        this.autoPlayDuration = parseInt(e.target.value, 10) || 5;
        this.slideStartTime = Date.now();
        this.updateAutoPlayUi();
      });
    }

    if (chkLoop) {
      chkLoop.addEventListener('change', (e) => {
        this.loopSlideshow = e.target.checked;
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

    // Fullscreen Mode on Stage Wrapper
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

    // Drag & Drop presentation files directly onto the stage
    if (stageWrapper) {
      stageWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        stageWrapper.classList.add('border-cyan-400', 'ring-2', 'ring-cyan-500/50');
      });
      stageWrapper.addEventListener('dragleave', () => {
        stageWrapper.classList.remove('border-cyan-400', 'ring-2', 'ring-cyan-500/50');
      });
      stageWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        stageWrapper.classList.remove('border-cyan-400', 'ring-2', 'ring-cyan-500/50');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const droppedFile = e.dataTransfer.files[0];
          this.handleFileUpload(droppedFile, () => {
            this.renderPresentationView(containerId);
            if (window.showToast) window.showToast(`Loaded presentation: ${droppedFile.name}`, 'success');
          });
        }
      });
    }

    // Next / Prev slide buttons
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.nextSlide(this.loopSlideshow)) {
          this.slideStartTime = Date.now();
          this.renderPresentationView(containerId);
        }
      });
    }
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.prevSlide()) {
          this.slideStartTime = Date.now();
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
        this.slideStartTime = Date.now();
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

    // Unified Keyboard Navigation
    window.onkeydown = (e) => {
      // Don't intercept when user is typing in textarea or input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      // Handle Fullscreen Slideshow keys
      if (this.isSlideShowActive) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeFullscreenSlideshow();
          return;
        }
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          this.toggleAutoPlay();
          return;
        }
        if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          this.laserPointerActive = !this.laserPointerActive;
          const laserDot = document.getElementById('slideshow-laser-dot');
          if (!this.laserPointerActive && laserDot) laserDot.style.display = 'none';
          const btnLaser = document.getElementById('btn-fs-laser');
          if (btnLaser) {
            btnLaser.className = `px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.laserPointerActive ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'}`;
          }
          return;
        }
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          this.showNotesOverlay = !this.showNotesOverlay;
          const drawer = document.getElementById('fs-notes-drawer');
          if (drawer) {
            if (this.showNotesOverlay) drawer.classList.remove('hidden');
            else drawer.classList.add('hidden');
          }
          const btnNotes = document.getElementById('btn-fs-notes');
          if (btnNotes) {
            btnNotes.className = `px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.showNotesOverlay ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'}`;
          }
          return;
        }
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          this.nextSlide(this.loopSlideshow);
          this.slideStartTime = Date.now();
          this.updateFullscreenSlideContent();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          this.prevSlide();
          this.slideStartTime = Date.now();
          this.updateFullscreenSlideContent();
          return;
        }
      }

      // In-page PRESENTATION tab keys
      if (window.appState && window.appState.currentTab === 'presentation') {
        if (e.key === 'F5' || (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey)) {
          e.preventDefault();
          this.startFullscreenSlideshow();
          return;
        }
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          if (this.nextSlide(this.loopSlideshow)) {
            this.slideStartTime = Date.now();
            this.renderPresentationView(containerId);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          if (this.prevSlide()) {
            this.slideStartTime = Date.now();
            this.renderPresentationView(containerId);
          }
        } else if (e.key.toLowerCase() === 'f' && stageWrapper) {
          e.preventDefault();
          if (!document.fullscreenElement) {
            stageWrapper.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }
      }
    };
  }
}

window.presentationHub = new PresentationHub();
