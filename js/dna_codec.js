/**
 * DNA Data Storage Codec Engine
 * Implements 2-bit nucleotide mapping:
 *   00 -> A (Adenine)
 *   01 -> C (Cytosine)
 *   10 -> G (Guanine)
 *   11 -> T (Thymine)
 * Supports full pipeline: Text/File -> Binary -> DNA -> Error Analysis -> Decoding.
 * Features O(1) byte-table lookup for 100% full-fidelity file synthesis without truncation.
 */

// Precomputed 256-entry lookup tables for O(1) byte <-> 4-base DNA & Binary translation
const BYTE_TO_DNA_TABLE = new Array(256);
const DNA_TO_BYTE_TABLE = {};
const BYTE_TO_BIN = new Array(256);
const DNA_TO_BIN_BYTE = {};

(function initCodecTables() {
  const BASES = ['A', 'C', 'G', 'T'];
  for (let i = 0; i < 256; i++) {
    const b0 = (i >> 6) & 3;
    const b1 = (i >> 4) & 3;
    const b2 = (i >> 2) & 3;
    const b3 = i & 3;
    const dna4 = BASES[b0] + BASES[b1] + BASES[b2] + BASES[b3];
    BYTE_TO_DNA_TABLE[i] = dna4;
    DNA_TO_BYTE_TABLE[dna4] = i;

    const bin8 = i.toString(2).padStart(8, '0');
    BYTE_TO_BIN[i] = bin8;
    DNA_TO_BIN_BYTE[dna4] = bin8;
  }
})();

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
    if (!bytes || bytes.length === 0) return '';
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      return decoder.decode(bytes);
    } catch (e) {
      let res = '';
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        res += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '·';
      }
      return res;
    }
  }

  /**
   * Convert Uint8Array to 8-bit binary string (high-performance chunked)
   */
  bytesToBinary(bytes, maxBytes = null) {
    if (!bytes || bytes.length === 0) return '';
    const limit = maxBytes ? Math.min(bytes.length, maxBytes) : bytes.length;
    const CHUNK_SIZE = 8192;
    const chunks = [];
    for (let i = 0; i < limit; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, limit);
      const sub = new Array(end - i);
      for (let j = i, k = 0; j < end; j++, k++) {
        sub[k] = BYTE_TO_BIN[bytes[j]];
      }
      chunks.push(sub.join(''));
    }
    return chunks.join('');
  }

  /**
   * Convert 8-bit binary string to Uint8Array
   */
  binaryToBytes(binStr) {
    if (!binStr) return new Uint8Array(0);
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
   * High-speed O(1) table lookup: convert Uint8Array directly into complete DNA sequence
   * No bit string overhead, zero truncation, can process multi-megabyte files in milliseconds.
   */
  bytesToDNA(bytes) {
    if (!bytes || bytes.length === 0) return '';
    const len = bytes.length;
    const CHUNK_SIZE = 8192;
    const chunks = [];
    for (let i = 0; i < len; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, len);
      const sub = new Array(end - i);
      for (let j = i, k = 0; j < end; j++, k++) {
        sub[k] = BYTE_TO_DNA_TABLE[bytes[j]];
      }
      chunks.push(sub.join(''));
    }
    return chunks.join('');
  }

  /**
   * High-speed O(1) table lookup: convert DNA string directly into complete Uint8Array
   */
  dnaToBytes(dnaStr) {
    if (!dnaStr) return { bytes: new Uint8Array(0), clean: '' };
    const clean = dnaStr.toUpperCase().replace(/[^ACGT]/g, '');
    const quadCount = Math.floor(clean.length / 4);
    const rem = clean.length % 4;
    const totalBytes = rem > 0 ? quadCount + 1 : quadCount;
    const bytes = new Uint8Array(totalBytes);

    for (let i = 0; i < quadCount; i++) {
      const quad = clean.slice(i * 4, (i + 1) * 4);
      const b = DNA_TO_BYTE_TABLE[quad];
      bytes[i] = b !== undefined ? b : 0;
    }

    if (rem > 0) {
      let tailBin = '';
      for (let i = quadCount * 4; i < clean.length; i++) {
        tailBin += (this.nucToBin[clean[i]] || '00');
      }
      tailBin = tailBin.padEnd(8, '0');
      bytes[quadCount] = parseInt(tailBin, 2);
    }

    return { bytes, clean };
  }

  /**
   * Convert binary string directly to DNA sequence (2 bits per base)
   */
  binaryToDNA(binStr) {
    const parts = [];
    let s = binStr;
    if (s.length % 2 !== 0) s += '0';

    for (let i = 0; i < s.length; i += 2) {
      const pair = s.slice(i, i + 2);
      parts.push(this.binToNuc[pair] || 'A');
    }
    return parts.join('');
  }

  /**
   * Convert DNA sequence back to binary string
   */
  dnaToBinary(dnaStr) {
    const clean = dnaStr.toUpperCase().replace(/[^ACGT]/g, '');
    const quadCount = Math.floor(clean.length / 4);
    const rem = clean.length % 4;
    const CHUNK_SIZE = 2048;
    const chunks = [];
    for (let i = 0; i < quadCount; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, quadCount);
      const sub = new Array(end - i);
      for (let j = i, k = 0; j < end; j++, k++) {
        const q = clean.slice(j * 4, (j + 1) * 4);
        sub[k] = DNA_TO_BIN_BYTE[q] || '00000000';
      }
      chunks.push(sub.join(''));
    }
    let res = chunks.join('');
    if (rem > 0) {
      const tail = clean.slice(quadCount * 4);
      for (let i = 0; i < tail.length; i++) {
        res += (this.nucToBin[tail[i]] || '00');
      }
    }
    return res;
  }

  /**
   * Smart File Type & Magic Number Signature Detector
   * Analyzes file header bytes to reliably identify PNG, JPG, GIF, WebP, PDF, plain text, etc.
   */
  detectFileType(bytes, declaredFileName = '') {
    if (!bytes || bytes.length === 0) {
      return { type: 'text', mime: 'text/plain;charset=utf-8', ext: 'txt', label: 'Empty Text File' };
    }

    const len = bytes.length;

    // Helper to get extension from filename
    let declaredExt = '';
    if (declaredFileName && declaredFileName.includes('.')) {
      const parts = declaredFileName.split('.');
      declaredExt = parts[parts.length - 1].toLowerCase().trim();
    }

    // 1. PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
    if (len >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { type: 'image', mime: 'image/png', ext: 'png', label: 'PNG Image' };
    }

    // 2. JPEG Magic Bytes: FF D8 FF
    if (len >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { type: 'image', mime: 'image/jpeg', ext: 'jpg', label: 'JPEG Image' };
    }

    // 3. GIF Magic Bytes: 47 49 46 38 ('GIF8')
    if (len >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return { type: 'image', mime: 'image/gif', ext: 'gif', label: 'GIF Image' };
    }

    // 4. WebP Magic Bytes: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
    if (len >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return { type: 'image', mime: 'image/webp', ext: 'webp', label: 'WebP Image' };
    }

    // 5. BMP Magic Bytes: 42 4D ('BM')
    if (len >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return { type: 'image', mime: 'image/bmp', ext: 'bmp', label: 'BMP Image' };
    }

    // 6. PDF Magic Bytes: %PDF (25 50 44 46)
    if (len >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { type: 'pdf', mime: 'application/pdf', ext: 'pdf', label: 'PDF Document' };
    }

    // 7. ZIP-based Office documents or ZIP archives: 50 4B 03 04 ('PK\x03\x04')
    if (len >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05)) {
      if (declaredExt === 'pptx') {
        return { type: 'binary', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx', label: 'PowerPoint Presentation' };
      }
      if (declaredExt === 'docx') {
        return { type: 'binary', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', label: 'Word Document' };
      }
      if (declaredExt === 'xlsx') {
        return { type: 'binary', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx', label: 'Excel Spreadsheet' };
      }
      return { type: 'binary', mime: 'application/zip', ext: 'zip', label: 'ZIP Archive' };
    }

    // 8. SVG / XML: starts with '<svg' or '<?xml'
    if (len >= 5) {
      const headerSample = String.fromCharCode(...bytes.slice(0, Math.min(len, 128))).toLowerCase();
      if (headerSample.includes('<svg') || (headerSample.startsWith('<?xml') && headerSample.includes('svg'))) {
        return { type: 'image', mime: 'image/svg+xml', ext: 'svg', label: 'SVG Vector Graphic' };
      }
    }

    // 9. If declared filename has known image extension
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(declaredExt)) {
      const mime = declaredExt === 'svg' ? 'image/svg+xml' : (declaredExt === 'jpg' ? 'image/jpeg' : `image/${declaredExt}`);
      return { type: 'image', mime: mime, ext: declaredExt, label: `${declaredExt.toUpperCase()} Image` };
    }

    // 10. If declared filename has pdf extension
    if (declaredExt === 'pdf') {
      return { type: 'pdf', mime: 'application/pdf', ext: 'pdf', label: 'PDF Document' };
    }

    // 11. Plain Text vs Binary Heuristic
    const sampleLen = Math.min(len, 1024);
    let nullBytes = 0;
    let nonPrintable = 0;
    for (let i = 0; i < sampleLen; i++) {
      const b = bytes[i];
      if (b === 0) nullBytes++;
      else if ((b < 32 && b !== 9 && b !== 10 && b !== 13) || b === 127) nonPrintable++;
    }

    if (nullBytes === 0 && (nonPrintable / sampleLen) < 0.05) {
      let mime = 'text/plain;charset=utf-8';
      let label = 'Plain Text';
      if (declaredExt === 'json') { mime = 'application/json'; label = 'JSON Data'; }
      else if (declaredExt === 'html' || declaredExt === 'htm') { mime = 'text/html'; label = 'HTML Document'; }
      else if (declaredExt === 'csv') { mime = 'text/csv'; label = 'CSV Spreadsheet'; }
      else if (['js', 'py', 'java', 'cpp', 'c', 'ts', 'md'].includes(declaredExt)) { label = `${declaredExt.toUpperCase()} Code`; }

      return { type: 'text', mime: mime, ext: declaredExt || 'txt', label: label };
    }

    // Generic Binary File
    return {
      type: 'binary',
      mime: 'application/octet-stream',
      ext: declaredExt || 'bin',
      label: declaredExt ? `${declaredExt.toUpperCase()} File` : 'Binary Data File'
    };
  }

  /**
   * Generate detailed step-by-step breakdown for character-based visualizer
   */
  encodeTextWithSteps(text) {
    const bytes = this.stringToBytes(text);
    const steps = [];
    let fullBinary = '';
    let fullDNA = '';

    for (let i = 0; i < bytes.length; i++) {
      const byteVal = bytes[i];
      const char = (text && i < text.length) ? text[i] : String.fromCharCode(byteVal);
      const bin8 = BYTE_TO_BIN[byteVal] || byteVal.toString(2).padStart(8, '0');
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
      fileInfo: { type: 'text', mime: 'text/plain;charset=utf-8', ext: 'txt', label: 'Plain Text' },
      steps: steps,
      metrics: this.calculateMetrics(fullDNA, bytes.length)
    };
  }

  /**
   * Encode arbitrary byte array (e.g. from file upload)
   * 100% full-fidelity synthesis of entire file without any truncation!
   */
  encodeBytes(bytes, filename = 'data.bin') {
    const fullDNA = this.bytesToDNA(bytes);
    const fullByteCount = bytes.length;
    const fullBitCount = fullByteCount * 8;
    const fullBaseCount = fullDNA.length;

    // Detect file type and metadata
    const fileInfo = this.detectFileType(bytes, filename);

    // Fast preview binary string for UI (first 128 bytes)
    const previewLen = Math.min(bytes.length, 128);
    const previewBin = this.bytesToBinary(bytes.slice(0, previewLen));

    return {
      filename: filename,
      text: fileInfo.type === 'text' ? this.bytesToString(bytes) : `[${fileInfo.label}: ${filename}]`,
      bytes: bytes,
      byteCount: fullByteCount,
      bitCount: fullBitCount,
      baseCount: fullBaseCount,
      binary: previewBin,
      dna: fullDNA,
      fileInfo: fileInfo,
      metrics: this.calculateMetrics(fullDNA, fullByteCount)
    };
  }

  /**
   * Decode DNA sequence directly into digital bytes & original content
   */
  decodeDNA(dnaStr, filenameHint = '') {
    const { bytes, clean } = this.dnaToBytes(dnaStr);
    const fileInfo = this.detectFileType(bytes, filenameHint);
    const text = (fileInfo.type === 'text') ? this.bytesToString(bytes) : '';

    // Step breakdown for decoding visualization (first 24 characters)
    const steps = [];
    const maxSteps = Math.min(bytes.length, 24);
    for (let i = 0; i < maxSteps; i++) {
      const byteDna = clean.slice(i * 4, (i + 1) * 4);
      const byteVal = bytes[i];
      const bin8 = BYTE_TO_BIN[byteVal] || byteVal.toString(2).padStart(8, '0');
      const char = (byteVal >= 32 && byteVal <= 126) ? String.fromCharCode(byteVal) : '·';

      steps.push({
        index: i,
        dna4: byteDna,
        binary8: bin8,
        byteVal: byteVal,
        char: char
      });
    }

    return {
      dna: clean,
      binary: this.bytesToBinary(bytes.slice(0, Math.min(bytes.length, 128))),
      bytes: bytes,
      text: text,
      fileInfo: fileInfo,
      byteCount: bytes.length,
      bitCount: bytes.length * 8,
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
      const code = dnaSequence.charCodeAt(i);
      if (code === 65) countA++;      // 'A'
      else if (code === 84) countT++; // 'T'
      else if (code === 71) countG++; // 'G'
      else if (code === 67) countC++; // 'C'
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
