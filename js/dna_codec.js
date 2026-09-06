/**
 * DNA Data Storage Codec Engine
 * Implements 2-bit nucleotide mapping:
 *   00 -> A (Adenine)
 *   01 -> C (Cytosine)
 *   10 -> G (Guanine)
 *   11 -> T (Thymine)
 * Supports full pipeline: Text/File -> Binary -> DNA -> Error Analysis -> Decoding.
 */

class DNACodec {
  constructor() {
    this.binToNuc = { '00': 'A', '01': 'C', '10': 'G', '11': 'T' };
    this.nucToBin = { 'A': '00', 'C': '01', 'G': '10', 'T': '11' };
    this.complement = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };

    this.nucMetadata = {
      'A': { name: 'Adenine', type: 'Purine', complement: 'T', hydrogenBonds: 2, bin: '00', color: '#10b981' },
      'T': { name: 'Thymine', type: 'Pyrimidine', complement: 'A', hydrogenBonds: 2, bin: '11', color: '#f43f5e' },
      'G': { name: 'Guanine', type: 'Purine', complement: 'C', hydrogenBonds: 3, bin: '10', color: '#f59e0b' },
      'C': { name: 'Cytosine', type: 'Pyrimidine', complement: 'G', hydrogenBonds: 3, bin: '01', color: '#06b6d4' }
    };
  }

  /**
   * Convert UTF-8 string to Uint8Array
   */
  stringToBytes(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  /**
   * Convert Uint8Array to UTF-8 string
   */
  bytesToString(bytes) {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      return decoder.decode(bytes);
    } catch (e) {
      // Fallback ASCII
      let res = '';
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        res += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '';
      }
      return res;
    }
  }

  /**
   * Convert Uint8Array to 8-bit binary string
   */
  bytesToBinary(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += bytes[i].toString(2).padStart(8, '0');
    }
    return bin;
  }

  /**
   * Convert 8-bit binary string to Uint8Array
   */
  binaryToBytes(binStr) {
    // Pad to 8-bit boundary if needed
    const padded = binStr.padEnd(Math.ceil(binStr.length / 8) * 8, '0');
    const byteCount = Math.floor(padded.length / 8);
    const bytes = new Uint8Array(byteCount);
    for (let i = 0; i < byteCount; i++) {
      const byteBin = padded.slice(i * 8, (i + 1) * 8);
      bytes[i] = parseInt(byteBin, 2);
    }
    return bytes;
  }

  /**
   * Convert binary string directly to DNA sequence (2 bits per base)
   */
  binaryToDNA(binStr) {
    let dna = '';
    // Pad to multiple of 2
    let s = binStr;
    if (s.length % 2 !== 0) s += '0';

    for (let i = 0; i < s.length; i += 2) {
      const pair = s.slice(i, i + 2);
      dna += this.binToNuc[pair] || 'A';
    }
    return dna;
  }

  /**
   * Convert DNA sequence back to binary string
   */
  dnaToBinary(dnaStr) {
    const clean = dnaStr.toUpperCase().replace(/[^ACGT]/g, '');
    let bin = '';
    for (let i = 0; i < clean.length; i++) {
      bin += this.nucToBin[clean[i]] || '00';
    }
    return bin;
  }

  /**
   * Generate detailed step-by-step breakdown for character-based visualizer
   * Example: 'H' -> 72 -> '01001000' -> ['01'->C, '00'->A, '10'->G, '00'->A] -> 'CAGA'
   */
  encodeTextWithSteps(text) {
    const bytes = this.stringToBytes(text);
    const steps = [];
    let fullBinary = '';
    let fullDNA = '';

    for (let i = 0; i < bytes.length; i++) {
      const byteVal = bytes[i];
      const char = (text && i < text.length) ? text[i] : String.fromCharCode(byteVal);
      const bin8 = byteVal.toString(2).padStart(8, '0');
      fullBinary += bin8;

      const pairs = [];
      let charDna = '';
      for (let p = 0; p < 8; p += 2) {
        const pair = bin8.slice(p, p + 2);
        const base = this.binToNuc[pair];
        charDna += base;
        pairs.push({
          binary: pair,
          base: base,
          baseMeta: this.nucMetadata[base]
        });
      }

      fullDNA += charDna;
      steps.push({
        index: i,
        char: char,
        byteVal: byteVal,
        binary8: bin8,
        pairs: pairs,
        charDna: charDna
      });
    }

    return {
      text: text,
      bytes: bytes,
      byteCount: bytes.length,
      bitCount: bytes.length * 8,
      baseCount: fullDNA.length,
      binary: fullBinary,
      dna: fullDNA,
      steps: steps,
      metrics: this.calculateMetrics(fullDNA, bytes.length)
    };
  }

  /**
   * Encode arbitrary byte array (e.g. from file upload)
   */
  encodeBytes(bytes, filename = 'data.bin') {
    const bin = this.bytesToBinary(bytes);
    const dna = this.binaryToDNA(bin);
    return {
      filename: filename,
      bytes: bytes,
      byteCount: bytes.length,
      bitCount: bytes.length * 8,
      baseCount: dna.length,
      binary: bin,
      dna: dna,
      metrics: this.calculateMetrics(dna, bytes.length)
    };
  }

  /**
   * Decode DNA sequence directly into digital bytes & text
   */
  decodeDNA(dnaStr) {
    const clean = dnaStr.toUpperCase().replace(/[^ACGT]/g, '');
    const binary = this.dnaToBinary(clean);
    const bytes = this.binaryToBytes(binary);
    const text = this.bytesToString(bytes);

    // Step breakdown for decoding visualization
    const steps = [];
    const maxSteps = Math.min(bytes.length, 30); // show first 30 chars for UI performance
    for (let i = 0; i < maxSteps; i++) {
      const byteDna = clean.slice(i * 4, (i + 1) * 4);
      const byteBin = binary.slice(i * 8, (i + 1) * 8);
      const byteVal = bytes[i];
      const char = (byteVal >= 32 && byteVal <= 126) ? String.fromCharCode(byteVal) : '·';

      steps.push({
        index: i,
        dna4: byteDna,
        binary8: byteBin,
        byteVal: byteVal,
        char: char
      });
    }

    return {
      dna: clean,
      binary: binary,
      bytes: bytes,
      text: text,
      byteCount: bytes.length,
      bitCount: binary.length,
      baseCount: clean.length,
      steps: steps,
      metrics: this.calculateMetrics(clean, bytes.length)
    };
  }

  /**
   * Calculate storage analytics & biochemical properties
   */
  calculateMetrics(dnaSequence, byteCount = null) {
    const total = dnaSequence.length;
    if (total === 0) {
      return {
        totalBases: 0,
        byteCount: 0,
        bitCount: 0,
        counts: { A: 0, T: 0, G: 0, C: 0 },
        percentages: { A: '0.0', T: '0.0', G: '0.0', C: '0.0' },
        gcRatio: '0.0',
        efficiencyBitsPerBase: 2.0,
        massGrams: 0,
        massGramsFormatted: '0 fg',
        densityPetabytesPerGram: 215
      };
    }

    let countA = 0, countT = 0, countG = 0, countC = 0;
    for (let i = 0; i < total; i++) {
      const nuc = dnaSequence[i];
      if (nuc === 'A') countA++;
      else if (nuc === 'T') countT++;
      else if (nuc === 'G') countG++;
      else if (nuc === 'C') countC++;
    }

    const gcCount = countG + countC;
    const gcRatio = (gcCount / total) * 100;

    const actualBytes = byteCount !== null ? byteCount : Math.floor((total * 2) / 8);
    const bitCount = total * 2;

    // Molecular mass calculation:
    // Average molecular weight of single nucleotide ~330 g/mol
    // Mass in grams = (total * 330) / Avogadro's number (6.022e23)
    const massGrams = (total * 330) / 6.02214076e23;

    return {
      totalBases: total,
      byteCount: actualBytes,
      bitCount: bitCount,
      counts: { A: countA, T: countT, G: countG, C: countC },
      percentages: {
        A: ((countA / total) * 100).toFixed(1),
        T: ((countT / total) * 100).toFixed(1),
        G: ((countG / total) * 100).toFixed(1),
        C: ((countC / total) * 100).toFixed(1)
      },
      gcRatio: gcRatio.toFixed(1),
      gcQuality: (gcRatio >= 40 && gcRatio <= 60) ? 'Optimal (Stable Synthesis)' : (gcRatio < 40 ? 'AT-Rich (Low Melting Temp)' : 'GC-Rich (Secondary Hairpin Risk)'),
      efficiencyBitsPerBase: 2.0,
      massGrams: massGrams.toExponential(3),
      massGramsFormatted: massGrams < 1e-12 ? `${(massGrams * 1e15).toFixed(2)} fg (femtograms)` : `${(massGrams * 1e12).toFixed(2)} pg (picograms)`,
      densityPetabytesPerGram: 215
    };
  }
}

// Global instance
window.dnaCodec = new DNACodec();
