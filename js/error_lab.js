/**
 * DNA Error Lab & Redundancy Engine
 * Simulates:
 * 1. Environmental/Sequencing DNA mutations (point substitutions, random noise, click-to-mutate)
 * 2. Visual Diff with Arrow Pointers (↑ Error)
 * 3. Corrupted DNA Decoding demonstration (showing byte and character breakdown)
 * 4. Multi-Copy Redundancy with Column-by-Column Majority Voting Error Correction
 */

class DNAErrorLab {
  constructor() {
    this.fullOriginalDNA = 'CAGACAGCATGC';
    this.fullCorruptedDNA = 'CAGACAGCATGC';
    this.visualLength = 48;
    this.originalSequence = 'CAGACAGCATGC';
    this.corruptedSequence = 'CAGACAGCATGC';
    this.mutatedIndices = new Map(); // index -> { from: 'C', to: 'T' }
    this.copiesCount = 3; // 3 or 5 redundant copies
    this.redundantCopies = [];
  }

  setSequence(seq) {
    const clean = (seq || 'CAGACAGC').toUpperCase().replace(/[^ACGT]/g, '');
    this.fullOriginalDNA = clean.length > 0 ? clean : 'CAGACAGC';
    this.fullCorruptedDNA = this.fullOriginalDNA;

    // Visual window of first 48 bases for responsive interactive mutation simulation
    this.visualLength = Math.min(this.fullOriginalDNA.length, 48);
    this.originalSequence = this.fullOriginalDNA.slice(0, this.visualLength);
    this.corruptedSequence = this.originalSequence;

    this.mutatedIndices.clear();
    this.generateRedundantCopies();
  }

  /**
   * Mutate a single base at a random or specified index
   */
  introducePointMutation(targetIdx = null) {
    if (!this.fullOriginalDNA || this.fullOriginalDNA.length === 0) return;

    const bases = ['A', 'C', 'G', 'T'];
    const maxIdx = this.visualLength || Math.min(this.fullOriginalDNA.length, 48);
    const idx = targetIdx !== null ? targetIdx : Math.floor(Math.random() * maxIdx);
    const origBase = this.fullOriginalDNA[idx];

    // Pick a different base
    const candidates = bases.filter(b => b !== origBase);
    const newBase = candidates[Math.floor(Math.random() * candidates.length)];

    // Update visual sequence
    const visArr = this.corruptedSequence.split('');
    visArr[idx] = newBase;
    this.corruptedSequence = visArr.join('');

    // Update full corrupted sequence
    const fullArr = this.fullCorruptedDNA.split('');
    fullArr[idx] = newBase;
    this.fullCorruptedDNA = fullArr.join('');

    this.mutatedIndices.set(idx, { from: origBase, to: newBase });
  }

  /**
   * Toggle or cycle a base directly when clicked by user in UI
   */
  cycleBaseAtIndex(idx) {
    if (idx < 0 || idx >= this.visualLength) return;
    const bases = ['A', 'C', 'G', 'T'];
    const currentBase = this.corruptedSequence[idx];
    const nextIdx = (bases.indexOf(currentBase) + 1) % 4;
    const newBase = bases[nextIdx];

    // Update visual sequence
    const visArr = this.corruptedSequence.split('');
    visArr[idx] = newBase;
    this.corruptedSequence = visArr.join('');

    // Update full sequence
    const fullArr = this.fullCorruptedDNA.split('');
    fullArr[idx] = newBase;
    this.fullCorruptedDNA = fullArr.join('');

    const origBase = this.originalSequence[idx];
    if (newBase === origBase) {
      this.mutatedIndices.delete(idx);
    } else {
      this.mutatedIndices.set(idx, { from: origBase, to: newBase });
    }
  }

  /**
   * Corrupt multiple bases based on percentage (1% to 25%)
   */
  introduceNoise(percentage) {
    this.corruptedSequence = this.originalSequence;
    this.fullCorruptedDNA = this.fullOriginalDNA;
    this.mutatedIndices.clear();

    const bases = ['A', 'C', 'G', 'T'];
    const count = Math.max(1, Math.round((this.visualLength * percentage) / 100));

    // Choose unique random indices within visual window
    const indices = [];
    while (indices.length < count && indices.length < this.visualLength) {
      const r = Math.floor(Math.random() * this.visualLength);
      if (!indices.includes(r)) indices.push(r);
    }

    const visArr = this.originalSequence.split('');
    const fullArr = this.fullOriginalDNA.split('');

    indices.forEach(idx => {
      const origBase = visArr[idx];
      const candidates = bases.filter(b => b !== origBase);
      const newBase = candidates[Math.floor(Math.random() * candidates.length)];
      visArr[idx] = newBase;
      fullArr[idx] = newBase;
      this.mutatedIndices.set(idx, { from: origBase, to: newBase });
    });

    this.corruptedSequence = visArr.join('');
    this.fullCorruptedDNA = fullArr.join('');
  }

  /**
   * Reset mutations back to pristine sequence
   */
  resetErrors() {
    this.fullCorruptedDNA = this.fullOriginalDNA;
    this.corruptedSequence = this.originalSequence;
    this.mutatedIndices.clear();
    this.generateRedundantCopies();
  }

  /**
   * Render side-by-side visual diff with pointer arrows
   */
  renderDiff(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const orig = this.originalSequence;
    const curr = this.corruptedSequence;
    const total = Math.min(orig.length, 36); // Display up to 36 bases for clean layout

    let origBeads = '';
    let currBeads = '';
    let arrowPointers = '';

    for (let i = 0; i < total; i++) {
      const bOrig = orig[i] || 'A';
      const bCurr = curr[i] || 'A';
      const isMutated = this.mutatedIndices.has(i);

      origBeads += `
        <span class="bead bead-${bOrig.toLowerCase()} text-xs !w-7 !h-7 font-mono" title="Pos #${i + 1}: ${bOrig}">
          ${bOrig}
        </span>
      `;

      currBeads += `
        <button data-base-idx="${i}" class="clickable-base bead ${isMutated ? 'bead-mutated' : 'bead-' + bCurr.toLowerCase()} text-xs !w-7 !h-7 font-mono transition transform hover:scale-125" title="Click to mutate Pos #${i + 1} (Current: ${bCurr})">
          ${bCurr}
        </button>
      `;

      if (isMutated) {
        arrowPointers += `
          <div class="inline-flex flex-col items-center justify-center w-7 text-center font-mono">
            <span class="text-red-400 font-bold text-sm animate-bounce">↑</span>
            <span class="text-[9px] font-bold text-red-300">ERR</span>
          </div>
        `;
      } else {
        arrowPointers += `<div class="inline-block w-7 text-center text-slate-700 text-[10px]">·</div>`;
      }
    }

    const mutationCount = this.mutatedIndices.size;

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Sequence Strips -->
        <div class="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner overflow-x-auto">
          <!-- 1. Original Sequence -->
          <div>
            <div class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>1. Original DNA Sequence:</span>
              <span class="text-[10px] text-slate-500 font-normal">Reference Strand</span>
            </div>
            <div class="flex flex-wrap gap-1 items-center pt-1">
              ${origBeads}
            </div>
          </div>

          <!-- 2. Corrupted Sequence with Interactive Clicking -->
          <div class="pt-2 border-t border-slate-900">
            <div class="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>2. Simulated Corrupted Sequence (Click any base to mutate):</span>
              <span class="text-[10px] text-red-400 font-bold">${mutationCount} Mutation${mutationCount === 1 ? '' : 's'} Active</span>
            </div>
            <div class="flex flex-wrap gap-1 items-center pt-1">
              ${currBeads}
            </div>
          </div>

          <!-- 3. Error Pointer Row -->
          <div class="pt-1">
            <div class="flex flex-wrap gap-1 items-center">
              ${arrowPointers}
            </div>
          </div>
        </div>

        <!-- Mutation Status Summary -->
        <div class="p-3 rounded-lg ${mutationCount > 0 ? 'bg-red-950/40 border border-red-800 text-red-300' : 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'} text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">${mutationCount > 0 ? '⚡' : '✅'}</span>
            <span>
              ${mutationCount > 0 
                ? `<strong>${mutationCount} base substitution${mutationCount === 1 ? '' : 's'} detected.</strong> Notice how corrupted DNA nucleotides alter the 2-bit binary representation during retrieval!` 
                : '<strong>DNA Sequence is 100% Intact.</strong> No sequencing noise or environmental mutations present.'}
            </span>
          </div>
        </div>
      </div>
    `;

    // Attach click listeners to beads
    container.querySelectorAll('.clickable-base').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-base-idx'), 10);
        this.cycleBaseAtIndex(idx);
        this.renderDiff(containerId);
        if (typeof window.updateCorruptedPreview === 'function') {
          window.updateCorruptedPreview();
        }
        if (window.helixVisualizer) {
          window.helixVisualizer.setSequence(this.corruptedSequence, Array.from(this.mutatedIndices.keys()));
        }
      });
    });
  }

  /**
   * Decode both original and corrupted sequences side-by-side
   */
  decodeComparison(filenameHint = '') {
    const origDec = window.dnaCodec.decodeDNA(this.fullOriginalDNA || this.originalSequence, filenameHint);
    const corrDec = window.dnaCodec.decodeDNA(this.fullCorruptedDNA || this.corruptedSequence, filenameHint);

    return {
      original: origDec,
      corrupted: corrDec,
      mutationCount: this.mutatedIndices.size,
      hasError: this.mutatedIndices.size > 0,
      mutations: Array.from(this.mutatedIndices.entries())
    };
  }

  /**
   * Generate 3 or 5 redundant copies with realistic distributed noise
   */
  generateRedundantCopies(copiesCount = 3) {
    this.copiesCount = copiesCount;
    this.redundantCopies = [];

    const bases = ['A', 'C', 'G', 'T'];
    const total = this.originalSequence.length;

    for (let c = 0; c < this.copiesCount; c++) {
      const copyArr = this.originalSequence.split('');
      const copyMutations = new Set();

      // Introduce 1 or 2 distinct random errors per copy (simulating independent sequencing reads)
      if (total > 4 && c > 0) {
        const errCount = (c % 2 === 0) ? 2 : 1;
        for (let e = 0; e < errCount; e++) {
          const randIdx = Math.floor(Math.random() * total);
          const origB = copyArr[randIdx];
          const candidates = bases.filter(b => b !== origB);
          copyArr[randIdx] = candidates[Math.floor(Math.random() * candidates.length)];
          copyMutations.add(randIdx);
        }
      }

      this.redundantCopies.push({
        copyNumber: c + 1,
        sequence: copyArr.join(''),
        mutatedIndices: copyMutations
      });
    }

    return this.redundantCopies;
  }

  /**
   * Execute column-by-column majority voting consensus
   */
  executeMajorityVoting() {
    if (this.redundantCopies.length === 0) {
      this.generateRedundantCopies(this.copiesCount);
    }

    const total = this.originalSequence.length;
    const consensusArr = [];
    const columnStats = [];

    for (let col = 0; col < total; col++) {
      const votes = { 'A': 0, 'C': 0, 'G': 0, 'T': 0 };
      const copyBases = [];

      this.redundantCopies.forEach(cp => {
        const b = cp.sequence[col] || 'A';
        copyBases.push(b);
        votes[b] = (votes[b] || 0) + 1;
      });

      // Find winning base
      let winningBase = 'A';
      let maxVotes = -1;
      Object.keys(votes).forEach(b => {
        if (votes[b] > maxVotes) {
          maxVotes = votes[b];
          winningBase = b;
        }
      });

      consensusArr.push(winningBase);
      const isRepaired = copyBases.some(b => b !== winningBase);

      columnStats.push({
        columnIndex: col,
        copyBases: copyBases,
        winningBase: winningBase,
        votes: votes,
        isRepaired: isRepaired,
        originalBase: this.originalSequence[col]
      });
    }

    const recoveredDNA = consensusArr.join('');
    const recoveredDecoded = window.dnaCodec.decodeDNA(recoveredDNA);
    const isBitPerfect = recoveredDNA === this.originalSequence;

    return {
      recoveredDNA: recoveredDNA,
      recoveredText: recoveredDecoded.text,
      columnStats: columnStats,
      isBitPerfect: isBitPerfect,
      copies: this.redundantCopies
    };
  }

  /**
   * Render Majority Voting Table in Error Lab
   */
  renderMajorityVoting(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const result = this.executeMajorityVoting();
    const maxCols = Math.min(this.originalSequence.length, 24);

    let rowsHtml = '';
    result.copies.forEach(cp => {
      let beads = '';
      for (let i = 0; i < maxCols; i++) {
        const b = cp.sequence[i] || 'A';
        const isErr = cp.mutatedIndices.has(i);
        beads += `
          <span class="bead ${isErr ? 'bead-mutated' : 'bead-' + b.toLowerCase()} text-[11px] !w-6 !h-6" title="Copy #${cp.copyNumber}, Pos #${i + 1}: ${b}${isErr ? ' (MUTATED)' : ''}">
            ${b}
          </span>
        `;
      }

      rowsHtml += `
        <div class="flex items-center gap-3 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
          <span class="w-20 text-[11px] font-bold text-slate-400 whitespace-nowrap">Copy #${cp.copyNumber}:</span>
          <div class="flex flex-wrap gap-1 items-center">
            ${beads}
          </div>
        </div>
      `;
    });

    // Consensus Row
    let consensusBeads = '';
    for (let i = 0; i < maxCols; i++) {
      const stat = result.columnStats[i];
      const b = stat.winningBase;
      consensusBeads += `
        <span class="bead bead-${b.toLowerCase()} text-[11px] !w-6 !h-6 shadow-md ${stat.isRepaired ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900' : ''}" title="Consensus Pos #${i + 1}: ${b} (${stat.votes[b]}/${this.copiesCount} votes)${stat.isRepaired ? ' [REPAIRED BY VOTE]' : ''}">
          ${b}
        </span>
      `;
    }

    container.innerHTML = `
      <div class="space-y-3 font-mono text-xs">
        <!-- Copies Rows -->
        <div class="space-y-2">
          ${rowsHtml}
        </div>

        <!-- Majority Voting Divider & Arrow -->
        <div class="flex items-center justify-center gap-2 py-1 text-slate-500 font-sans text-xs">
          <span>↓</span>
          <span class="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Column-by-Column Majority Voting Algorithm</span>
          <span>↓</span>
        </div>

        <!-- Consensus Recovered Strand -->
        <div class="flex items-center gap-3 p-3 bg-emerald-950/40 rounded-xl border border-emerald-700/80 shadow-lg">
          <span class="w-20 text-[11px] font-bold text-emerald-400 whitespace-nowrap">Recovered:</span>
          <div class="flex flex-wrap gap-1 items-center">
            ${consensusBeads}
          </div>
        </div>

        <!-- Verification Banner -->
        <div class="p-3 bg-slate-900 border border-emerald-800 rounded-lg flex items-center justify-between font-sans">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400 text-base">✅</span>
            <div>
              <span class="font-bold text-emerald-300">Error Corrected via Majority Consensus!</span>
              <div class="text-[11px] text-slate-400">
                Recovered Text: <strong class="text-white font-mono">"${result.recoveredText}"</strong>
              </div>
            </div>
          </div>
          <span class="px-2 py-0.5 bg-emerald-900 text-emerald-200 text-[10px] font-bold rounded-full border border-emerald-600">
            ${result.isBitPerfect ? '100% BIT-PERFECT' : 'HEURISTIC RESTORE'}
          </span>
        </div>
      </div>
    `;
  }
}

window.dnaErrorLab = new DNAErrorLab();
