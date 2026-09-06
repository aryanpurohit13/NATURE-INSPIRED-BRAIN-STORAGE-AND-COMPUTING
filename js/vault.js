/**
 * DNA Storage Vault (Digital Bio-Bank)
 * Manages persistent storage records in localStorage, generates IDs (#DNA001),
 * provides pre-seeded demo records for examiner presentations, and handles FASTA/JSON exports.
 */

class DNAVault {
  constructor() {
    this.storageKey = 'dna_storage_vault_records_v1';
    this.records = [];
    this.load();
    if (this.records.length === 0) {
      this.seedDefaultRecords();
    }
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.records = data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not read localStorage, fallback to in-memory', e);
      this.records = [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  seedDefaultRecords() {
    const samples = [
      {
        title: 'Apollo 11 Historical Transmission',
        text: 'One small step for man, one giant leap for mankind.',
        category: 'Historical Archive'
      },
      {
        title: 'Watson & Crick Discovery Memo',
        text: 'We have discovered the secret of life.',
        category: 'Genetics Milestone'
      },
      {
        title: 'College Project Demo Greeting',
        text: 'Hello DNA Storage 2026',
        category: 'System Benchmark'
      }
    ];

    samples.forEach((sample, idx) => {
      const encoded = window.dnaCodec ? window.dnaCodec.encodeTextWithSteps(sample.text) : null;
      const dna = encoded ? encoded.dna : 'CAGACAGC';
      const byteCount = encoded ? encoded.byteCount : sample.text.length;
      const gcRatio = encoded ? encoded.metrics.gcRatio : '50.0';

      this.records.push({
        id: `DNA${String(idx + 1).padStart(3, '0')}`,
        title: sample.title,
        originalText: sample.text,
        byteCount: byteCount,
        bitCount: byteCount * 8,
        baseCount: dna.length,
        dna: dna,
        gcRatio: gcRatio,
        status: 'STORED',
        timestamp: new Date(Date.now() - (3 - idx) * 3600000).toLocaleString(),
        category: sample.category
      });
    });

    this.save();
  }

  addRecord({ title, text, dna, byteCount, gcRatio, category = 'User Input' }) {
    const nextNum = this.records.length + 1;
    const newId = `DNA${String(nextNum).padStart(3, '0')}`;

    const newRecord = {
      id: newId,
      title: title || `Record ${newId}`,
      originalText: text || '',
      byteCount: byteCount || Math.floor(dna.length / 4),
      bitCount: (byteCount || Math.floor(dna.length / 4)) * 8,
      baseCount: dna.length,
      dna: dna,
      gcRatio: gcRatio || '50.0',
      status: 'STORED',
      timestamp: new Date().toLocaleString(),
      category: category
    };

    this.records.unshift(newRecord);
    this.save();
    return newRecord;
  }

  getRecord(id) {
    return this.records.find(r => r.id === id) || null;
  }

  deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this.save();
  }

  clearAll() {
    this.records = [];
    this.save();
  }

  exportFASTA(id) {
    const rec = this.getRecord(id);
    if (!rec) return;

    const fastaContent = `>gi|${rec.id}|ref|DNA_STORAGE| ${rec.title} [size=${rec.byteCount} bytes, bases=${rec.baseCount}, gc=${rec.gcRatio}%]\n${rec.dna.match(/.{1,60}/g).join('\n')}\n`;
    
    const blob = new Blob([fastaContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rec.id}_${rec.title.replace(/\s+/g, '_').toLowerCase()}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportAllJSON() {
    const jsonStr = JSON.stringify(this.records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dna_storage_vault_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  renderVault(containerId, { onLoadDecode, onTestError, onCopy, onDelete }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.records.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 px-4 border border-dashed border-slate-700 rounded-2xl bg-slate-900/40">
          <div class="text-4xl mb-2">🧬</div>
          <h3 class="text-base font-bold text-white mb-1">DNA Storage Vault is Empty</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No synthetic DNA records stored yet. Go to the <strong>Encode</strong> tab to synthesize data into DNA and save it here!
          </p>
          <button id="btn-seed-vault" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-800 transition">
            🔄 Load Benchmark Demo Records
          </button>
        </div>
      `;

      const btnSeed = document.getElementById('btn-seed-vault');
      if (btnSeed) {
        btnSeed.addEventListener('click', () => {
          this.seedDefaultRecords();
          this.renderVault(containerId, { onLoadDecode, onTestError, onCopy, onDelete });
          if (window.showToast) window.showToast('Demo benchmark records loaded!', 'success');
        });
      }
      return;
    }

    let html = `
      <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table class="w-full text-left text-xs font-mono">
          <thead class="bg-slate-950/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
            <tr>
              <th class="p-3">Record ID</th>
              <th class="p-3">Title & Content</th>
              <th class="p-3">Data Metrics</th>
              <th class="p-3">DNA Sequence Snippet</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
    `;

    this.records.forEach(rec => {
      const dnaSnippet = rec.dna.length > 20 ? `${rec.dna.slice(0, 18)}...` : rec.dna;
      html += `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="p-3 font-bold text-cyan-400 whitespace-nowrap">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              #${rec.id}
            </div>
            <div class="text-[10px] text-slate-500 font-sans mt-0.5">${rec.timestamp}</div>
          </td>
          <td class="p-3">
            <div class="font-bold text-white truncate max-w-[200px]">${rec.title}</div>
            <div class="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5 font-sans">"${rec.originalText}"</div>
          </td>
          <td class="p-3 whitespace-nowrap text-slate-300">
            <div><strong class="text-emerald-400">${rec.byteCount}</strong> bytes (${rec.bitCount} bits)</div>
            <div class="text-[10px] text-slate-400 mt-0.5"><strong class="text-amber-400">${rec.baseCount}</strong> bases | GC: ${rec.gcRatio}%</div>
          </td>
          <td class="p-3 font-mono">
            <span class="px-2 py-1 bg-slate-950 rounded text-cyan-300 border border-slate-800 text-[11px] tracking-wider" title="${rec.dna}">
              ${dnaSnippet}
            </span>
          </td>
          <td class="p-3 whitespace-nowrap">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
              <span>●</span> ${rec.status}
            </span>
          </td>
          <td class="p-3 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5 font-sans">
              <button data-action="decode" data-id="${rec.id}" class="px-2.5 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 text-[11px] font-bold rounded border border-cyan-700 transition" title="Decode to Original Data">
                🔓 Decode
              </button>
              <button data-action="error" data-id="${rec.id}" class="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-300 text-[11px] font-bold rounded border border-amber-700 transition" title="Test in Error Lab">
                ⚠️ Error Lab
              </button>
              <button data-action="fasta" data-id="${rec.id}" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700 transition" title="Download FASTA file">
                📄
              </button>
              <button data-action="delete" data-id="${rec.id}" class="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-400 text-[11px] rounded border border-red-800 transition" title="Delete Record">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // Attach row events
    container.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const rec = this.getRecord(id);

        if (action === 'decode' && onLoadDecode && rec) onLoadDecode(rec);
        else if (action === 'error' && onTestError && rec) onTestError(rec);
        else if (action === 'fasta' && rec) this.exportFASTA(id);
        else if (action === 'delete') {
          if (confirm(`Delete record #${id} (${rec ? rec.title : ''})?`)) {
            this.deleteRecord(id);
            this.renderVault(containerId, { onLoadDecode, onTestError, onCopy, onDelete });
            if (window.showToast) window.showToast(`Deleted record #${id}`, 'info');
          }
        }
      });
    });
  }
}

window.dnaVault = new DNAVault();
