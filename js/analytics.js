/**
 * DNA Storage Analytics & Viva Voce Reference Engine
 * Computes:
 * 1. Storage statistics (Data size, bits, bases, 2 bits/base efficiency)
 * 2. Nucleotide distribution charts (A, T, G, C counts, percentages, visual bars)
 * 3. GC-Content ratio & thermal stability analysis
 * 4. Theoretical physical molecular mass & volumetric comparison
 * 5. College Viva Voce Questions & Answers Guide
 */

class DNAAnalytics {
  constructor() {
    this.currentMetrics = null;
  }

  updateMetrics(dnaSequence, byteCount = null) {
    if (!window.dnaCodec) return null;
    this.currentMetrics = window.dnaCodec.calculateMetrics(dnaSequence, byteCount);
    return this.currentMetrics;
  }

  renderAnalytics(containerId, dnaSequence = 'CAGACAGC', byteCount = 2) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const m = this.updateMetrics(dnaSequence, byteCount);
    if (!m) return;

    // Determine max count for proportional bar widths
    const maxCount = Math.max(m.counts.A, m.counts.T, m.counts.G, m.counts.C, 1);
    const barWidth = (cnt) => Math.max(8, Math.round((cnt / maxCount) * 100));

    container.innerHTML = `
      <div class="space-y-6 text-slate-200">
        <!-- 1. KEY ENGINEERING TILES -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
          <div class="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">Original Data Size</div>
            <div class="text-xl font-black text-cyan-400 mt-1">${m.byteCount} <span class="text-xs font-normal text-slate-400">bytes</span></div>
            <div class="text-[10px] text-slate-500 mt-0.5">${m.bitCount} binary bits</div>
          </div>

          <div class="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">DNA Bases Synthesized</div>
            <div class="text-xl font-black text-emerald-400 mt-1">${m.totalBases} <span class="text-xs font-normal text-slate-400">bases (nt)</span></div>
            <div class="text-[10px] text-slate-500 mt-0.5">Base pairs synthesized</div>
          </div>

          <div class="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">Encoding Efficiency</div>
            <div class="text-xl font-black text-indigo-400 mt-1">2.00 <span class="text-xs font-normal text-slate-400">bits/base</span></div>
            <div class="text-[10px] text-slate-500 mt-0.5">Theoretical maximum: 2.0</div>
          </div>

          <div class="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">GC Content Ratio</div>
            <div class="text-xl font-black text-amber-400 mt-1">${m.gcRatio}%</div>
            <div class="text-[10px] text-emerald-400 mt-0.5 font-bold">${m.gcQuality}</div>
          </div>
        </div>

        <!-- 2. NUCLEOTIDE DISTRIBUTION CHART & GC CONTENT -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Nucleotide Bar Chart -->
          <div class="md:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-bold text-sm text-white flex items-center gap-1.5">
                <span>📊</span> Nucleotide Frequency Breakdown
              </span>
              <span class="text-[11px] font-mono text-slate-400">Total: ${m.totalBases} nt</span>
            </div>

            <div class="space-y-2.5 font-mono text-xs">
              <!-- A -->
              <div>
                <div class="flex items-center justify-between text-slate-300 mb-1">
                  <div class="flex items-center gap-2">
                    <span class="bead bead-a !w-5 !h-5 text-[10px]">A</span>
                    <span>Adenine</span>
                  </div>
                  <span><strong>${m.counts.A}</strong> bases (${m.percentages.A}%)</span>
                </div>
                <div class="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${barWidth(m.counts.A)}%"></div>
                </div>
              </div>

              <!-- T -->
              <div>
                <div class="flex items-center justify-between text-slate-300 mb-1">
                  <div class="flex items-center gap-2">
                    <span class="bead bead-t !w-5 !h-5 text-[10px]">T</span>
                    <span>Thymine</span>
                  </div>
                  <span><strong>${m.counts.T}</strong> bases (${m.percentages.T}%)</span>
                </div>
                <div class="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div class="h-full bg-rose-500 rounded-full transition-all duration-500" style="width: ${barWidth(m.counts.T)}%"></div>
                </div>
              </div>

              <!-- G -->
              <div>
                <div class="flex items-center justify-between text-slate-300 mb-1">
                  <div class="flex items-center gap-2">
                    <span class="bead bead-g !w-5 !h-5 text-[10px]">G</span>
                    <span>Guanine</span>
                  </div>
                  <span><strong>${m.counts.G}</strong> bases (${m.percentages.G}%)</span>
                </div>
                <div class="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div class="h-full bg-amber-500 rounded-full transition-all duration-500" style="width: ${barWidth(m.counts.G)}%"></div>
                </div>
              </div>

              <!-- C -->
              <div>
                <div class="flex items-center justify-between text-slate-300 mb-1">
                  <div class="flex items-center gap-2">
                    <span class="bead bead-c !w-5 !h-5 text-[10px]">C</span>
                    <span>Cytosine</span>
                  </div>
                  <span><strong>${m.counts.C}</strong> bases (${m.percentages.C}%)</span>
                </div>
                <div class="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div class="h-full bg-cyan-500 rounded-full transition-all duration-500" style="width: ${barWidth(m.counts.C)}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Molecular Physical Metrics Card -->
          <div class="md:col-span-5 bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-800/60 rounded-xl p-4 space-y-3">
            <div class="font-bold text-sm text-purple-300 flex items-center gap-1.5 border-b border-indigo-900/60 pb-2">
              <span>🔬</span> Molecular Physical Density
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center py-1 border-b border-indigo-900/40">
                <span class="text-slate-300">Physical Mass:</span>
                <span class="font-mono font-bold text-cyan-300">${m.massGramsFormatted}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-indigo-900/40">
                <span class="text-slate-300">Density Equivalent:</span>
                <span class="font-mono font-bold text-emerald-300">~215 PB / gram</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-indigo-900/40">
                <span class="text-slate-300">Idle Power (Storage):</span>
                <span class="font-mono font-bold text-white">0 Watts</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-slate-300">Estimated Half-Life:</span>
                <span class="font-mono font-bold text-amber-300">> 500,000 Years</span>
              </div>
            </div>

            <div class="p-2.5 bg-indigo-950/90 rounded-lg border border-indigo-700/50 text-[11px] text-slate-300 leading-relaxed">
              💡 <em>Did you know?</em> A single gram of DNA can store the equivalent of <strong>107,500 standard 2TB NVMe SSD drives</strong> in the volume of a grain of salt!
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

window.dnaAnalytics = new DNAAnalytics();
