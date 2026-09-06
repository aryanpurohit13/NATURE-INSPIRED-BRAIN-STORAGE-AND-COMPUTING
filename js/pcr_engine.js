/**
 * PCR Random Access Engine
 * Simulates primer hybridization and thermal cycle amplification
 * to retrieve specific files from a mixed DNA pool.
 */

class PCREngine {
  constructor(codec) {
    this.codec = codec;
    this.poolStrands = []; // All mixed strands across all files
    this.targetFileId = 'MEM1';
    this.currentCycle = 0;
    this.maxCycles = 20;
    this.isAmplifying = false;
    this.cycleHistory = [];
  }

  /**
   * Set up the mixed DNA pool with default or custom multi-file memories
   */
  initializeLibraryPool(customFiles = null) {
    const files = customFiles || [
      { id: 'MEM1', text: 'HELLO WORLD: DNA STORAGE 2026' },
      { id: 'MEM2', text: 'IMAGE_HDR_RES_4096_NEURAL_MAP' },
      { id: 'MEM3', text: 'CRYPTO_KEY_99482_BIO_SECTOR_7' }
    ];

    this.poolStrands = [];
    files.forEach(file => {
      const strands = this.codec.encodeFileToStrands(file.id, file.text);
      this.poolStrands.push(...strands);
    });

    // Shuffle pool strands to simulate a real disordered liquid solution
    this.shufflePool();
    this.resetPCR();
    return this.poolStrands;
  }

  shufflePool() {
    for (let i = this.poolStrands.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.poolStrands[i], this.poolStrands[j]] = [this.poolStrands[j], this.poolStrands[i]];
    }
  }

  resetPCR() {
    this.currentCycle = 0;
    this.isAmplifying = false;
    this.cycleHistory = [];
  }

  /**
   * Perform a single PCR thermal cycle
   * Target strands double (2^n); non-target strands remain at initial count
   */
  stepCycle() {
    if (this.currentCycle >= this.maxCycles) return false;
    this.currentCycle++;

    const targetPrimer = this.codec.filePrimers[this.targetFileId].fwd;
    const targetCountInitial = this.poolStrands.filter(s => s.fileId === this.targetFileId).length;
    const otherCountInitial = this.poolStrands.length - targetCountInitial;

    // Amplification factor: Target strands replicate with ~95% efficiency per cycle
    const amplificationFactor = Math.pow(1.95, this.currentCycle);
    const amplifiedTargetCopies = Math.round(targetCountInitial * amplificationFactor);
    const totalCopiesInTube = amplifiedTargetCopies + otherCountInitial;
    const purity = ((amplifiedTargetCopies / totalCopiesInTube) * 100).toFixed(2);

    const stepResult = {
      cycle: this.currentCycle,
      targetFileId: this.targetFileId,
      targetPrimer: targetPrimer,
      amplifiedTargetCopies: amplifiedTargetCopies,
      backgroundCopies: otherCountInitial,
      totalCopies: totalCopiesInTube,
      purityPercent: purity
    };

    this.cycleHistory.push(stepResult);
    return stepResult;
  }

  /**
   * Run full amplification up to designated cycle count (e.g., 15 cycles)
   */
  runFullAmplification(targetCycles = 15) {
    this.resetPCR();
    for (let i = 0; i < targetCycles; i++) {
      this.stepCycle();
    }
    return this.cycleHistory[this.cycleHistory.length - 1];
  }

  /**
   * Extract isolated target strands ready for sequencing
   */
  extractTargetStrands() {
    return this.poolStrands.filter(s => s.fileId === this.targetFileId);
  }
}

window.PCREngine = PCREngine;
