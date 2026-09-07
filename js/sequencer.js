/**
 * DNA Sequencing & Error Correction Engine
 * Simulates high-throughput sequencing reads, biochemical decay,
 * base substitutions, address demultiplexing, and Hamming ECC restoration.
 */

class DNASequencer {
  constructor(codec) {
    this.codec = codec;
    this.mutationRate = 0.05; // 5% default
    this.sequencingReads = [];
    this.lastDecodedResult = null;
  }

  setMutationRate(rate) {
    this.mutationRate = Math.max(0, Math.min(0.3, parseFloat(rate)));
  }

  /**
   * Simulates sequencing reads with stochastic mutations
   */
  simulateSequencing(strands) {
    const bases = ['A', 'C', 'G', 'T'];
    this.sequencingReads = [];

    strands.forEach((strand, strandIdx) => {
      const originalSeq = strand.fullSequence;
      let sequencedSeq = '';
      const mutations = [];

      for (let i = 0; i < originalSeq.length; i++) {
        const originalBase = originalSeq[i];
        const isMutated = Math.random() < this.mutationRate;

        if (isMutated) {
          const alternatives = bases.filter(b => b !== originalBase);
          const mutatedBase = alternatives[Math.floor(Math.random() * alternatives.length)];
          sequencedSeq += mutatedBase;
          mutations.push({
            pos: i,
            original: originalBase,
            mutated: mutatedBase
          });
        } else {
          sequencedSeq += originalBase;
        }
      }

      this.sequencingReads.push({
        ...strand,
        sequencedSequence: sequencedSeq,
        mutations: mutations,
        isCorrupted: mutations.length > 0
      });
    });

    // Simulate reads arriving out of order (shuffle)
    const shuffledReads = [...this.sequencingReads];
    for (let i = shuffledReads.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledReads[i], shuffledReads[j]] = [shuffledReads[j], shuffledReads[i]];
    }

    return shuffledReads;
  }

  /**
   * Decode the sequencing reads into recovered digital data:
   * 1. Address resolution (sort chunks)
   * 2. Raw decoding (without ECC)
   * 3. ECC decoding (with Hamming bit correction)
   */
  decodeReads(reads) {
    let totalMutations = 0;
    let totalErrorsCorrected = 0;
    let uncorrectableFailures = 0;

    // Step 1: Demultiplex and sort reads by Chunk Address
    // Each strand structure: [Fwd:8][Barcode:4][Address:4][Payload:8][ECC:4][Rev:8]
    // Address is at index 12 to 16
    const sortedReads = [];

    reads.forEach(read => {
      totalMutations += read.mutations.length;
      const seq = read.sequencedSequence || read.fullSequence;
      
      // Parse address bases (indices 12 to 15)
      const addrBases = seq.slice(12, 16);
      const addrBin = this.codec.dnaToBinary(addrBases);
      const chunkIdx = parseInt(addrBin, 2);

      // Extract raw payload (indices 16 to 23 = 8 bases)
      const payloadBases = seq.slice(16, 24);
      // Extract ECC bases (indices 24 to 27 = 4 bases)
      const eccBases = seq.slice(24, 28);

      sortedReads.push({
        chunkIndex: isNaN(chunkIdx) ? read.chunkIndex : chunkIdx,
        payloadBases: payloadBases,
        eccBases: eccBases,
        originalStrand: read
      });
    });

    // Sort by chunk index to rebuild original file sequence
    sortedReads.sort((a, b) => a.chunkIndex - b.chunkIndex);

    let rawText = '';
    let eccRestoredText = '';

    sortedReads.forEach(item => {
      // --- A. Raw Naive Decoding (No ECC) ---
      const rawBits = this.codec.dnaToBinary(item.payloadBases);
      const rawTextChunk = this.codec.binaryToText(rawBits);
      rawText += rawTextChunk;

      // --- B. ECC Hamming Correction ---
      // 8 payload bases = 16 bits = 4 nibbles of 4 bits each
      const payloadBits = this.codec.dnaToBinary(item.payloadBases);
      const eccBits = this.codec.dnaToBinary(item.eccBases);

      let correctedPayloadBits = '';

      for (let n = 0; n < 16; n += 4) {
        const nibble = payloadBits.slice(n, n + 4);
        const pPair = eccBits.slice((n / 4) * 2, (n / 4) * 2 + 2);
        
        // Synthesize 8-bit codeword from data nibble + ECC parity bits
        const codeword = `${pPair[0] || '0'}${pPair[1] || '0'}${nibble[0]}${pPair[0] ^ pPair[1] || '0'}${nibble[1]}${nibble[2]}${nibble[3]}0`;
        const result = this.codec.decodeHammingNibble(codeword);

        if (result.corrected) totalErrorsCorrected++;
        if (result.failed) uncorrectableFailures++;
        correctedPayloadBits += result.nibble;
      }

      const eccTextChunk = this.codec.binaryToText(correctedPayloadBits);
      eccRestoredText += eccTextChunk;
    });

    const result = {
      totalReads: reads.length,
      totalMutations: totalMutations,
      totalErrorsCorrected: totalErrorsCorrected,
      uncorrectableFailures: uncorrectableFailures,
      rawText: rawText,
      eccRestoredText: eccRestoredText,
      sortedReads: sortedReads
    };

    this.lastDecodedResult = result;
    return result;
  }
}

window.DNASequencer = DNASequencer;
