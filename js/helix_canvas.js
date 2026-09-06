/**
 * Interactive 3D DNA Double Helix Canvas Visualizer
 * Renders rotating base pairs (A-T, C-G) with realistic 3D depth,
 * Watson-Crick hydrogen bond rungs, and hover base inspection tooltips.
 */

class DNAHelixVisualizer {
  constructor(canvasId, tooltipId = null) {
    this.canvas = document.getElementById(canvasId);
    this.tooltip = tooltipId ? document.getElementById(tooltipId) : null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.angle = 0;
    this.speed = 0.018;
    this.animationId = null;
    this.sequence = 'CAGACAGCATGCGTACATGC';
    this.mutatedIndices = new Set();
    this.hoveredIndex = -1;
    this.mousePos = { x: -100, y: -100 };

    this.colors = {
      'A': '#10b981', // Emerald
      'T': '#f43f5e', // Rose
      'C': '#06b6d4', // Cyan
      'G': '#f59e0b'  // Amber
    };

    this.complement = {
      'A': 'T',
      'T': 'A',
      'C': 'G',
      'G': 'C'
    };

    this.meta = {
      'A': { name: 'Adenine', type: 'Purine', bonds: 2, bin: '00' },
      'T': { name: 'Thymine', type: 'Pyrimidine', bonds: 2, bin: '11' },
      'G': { name: 'Guanine', type: 'Purine', bonds: 3, bin: '10' },
      'C': { name: 'Cytosine', type: 'Pyrimidine', bonds: 3, bin: '01' }
    };

    if (this.canvas) {
      this.initEvents();
      this.resize();
      this.animate();
    }
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
      this.checkHover(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredIndex = -1;
      this.mousePos.x = -100;
      this.mousePos.y = -100;
      if (this.tooltip) {
        this.tooltip.classList.add('hidden');
      }
    });
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 600;
    this.height = rect.height || 260;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    }
  }

  setSequence(sequence, mutatedIndices = []) {
    const clean = (sequence || 'CAGACAGC').toUpperCase().replace(/[^ACGT]/g, '');
    this.sequence = clean.length > 0 ? clean : 'CAGACAGC';
    this.mutatedIndices = new Set(mutatedIndices);
  }

  checkHover(clientX, clientY) {
    if (!this.tooltip) return;
    const pairsCount = Math.min(this.sequence.length, 32);
    const spacing = this.width / (pairsCount + 1);

    let closestIdx = -1;
    let minDistance = 24;

    for (let i = 0; i < pairsCount; i++) {
      const x = (i + 1) * spacing;
      const dist = Math.abs(this.mousePos.x - x);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }

    this.hoveredIndex = closestIdx;

    if (closestIdx !== -1) {
      const base1 = this.sequence[closestIdx] || 'A';
      const base2 = this.complement[base1] || 'T';
      const m1 = this.meta[base1] || this.meta['A'];
      const m2 = this.meta[base2] || this.meta['T'];
      const isMutated = this.mutatedIndices.has(closestIdx);

      this.tooltip.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
          <span class="font-bold text-white text-xs">Position #${closestIdx + 1}</span>
          ${isMutated ? '<span class="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-bold">MUTATED</span>' : '<span class="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold">Base Pair</span>'}
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div class="bg-slate-900/90 p-1.5 rounded border border-slate-700">
            <div class="font-bold text-white flex items-center gap-1">
              <span class="w-3 h-3 rounded-full inline-block" style="background:${this.colors[base1]}"></span>
              ${m1.name} (${base1})
            </div>
            <div class="text-slate-400 text-[10px] mt-0.5">${m1.type}</div>
            <div class="text-cyan-400 text-[10px] font-bold mt-0.5">Bit: ${m1.bin}</div>
          </div>
          <div class="bg-slate-900/90 p-1.5 rounded border border-slate-700">
            <div class="font-bold text-white flex items-center gap-1">
              <span class="w-3 h-3 rounded-full inline-block" style="background:${this.colors[base2]}"></span>
              ${m2.name} (${base2})
            </div>
            <div class="text-slate-400 text-[10px] mt-0.5">${m2.type}</div>
            <div class="text-slate-400 text-[10px] mt-0.5">Complement</div>
          </div>
        </div>
        <div class="text-[10px] text-slate-300 mt-1.5 pt-1 border-t border-slate-800 flex justify-between">
          <span>Hydrogen Bonds: <strong class="text-cyan-300">${m1.bonds} H-bonds</strong></span>
          <span>${base1} = ${base2}</span>
        </div>
      `;

      this.tooltip.classList.remove('hidden');
      this.tooltip.style.left = `${clientX + 15}px`;
      this.tooltip.style.top = `${clientY - 20}px`;
    } else {
      this.tooltip.classList.add('hidden');
    }
  }

  animate() {
    this.render();
    this.angle += this.speed;
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const width = this.width;
    const height = this.height;

    this.ctx.clearRect(0, 0, width, height);

    const pairsCount = Math.min(this.sequence.length, 32);
    const spacing = width / (pairsCount + 1);
    const centerY = height / 2;
    const amplitude = Math.min(height * 0.35, 65); // wave radius

    // Two passes for true 3D ordering:
    // Pass 1: Draw background rungs & back nodes (z < 0)
    // Pass 2: Draw foreground rungs & front nodes (z >= 0)

    const nodesToDraw = [];

    for (let i = 0; i < pairsCount; i++) {
      const base1 = this.sequence[i] || 'A';
      const base2 = this.complement[base1] || 'T';
      const isMutated = this.mutatedIndices.has(i);
      const isHovered = this.hoveredIndex === i;

      const x = (i + 1) * spacing;
      const phase = this.angle + (i * 0.38);

      const sinVal = Math.sin(phase);
      const cosVal = Math.cos(phase);

      const y1 = centerY + sinVal * amplitude;
      const y2 = centerY - sinVal * amplitude;

      const z1 = cosVal;  // Node 1 depth (-1 to 1)
      const z2 = -cosVal; // Node 2 depth (-1 to 1)

      nodesToDraw.push({
        index: i,
        x: x,
        y1: y1,
        y2: y2,
        z1: z1,
        z2: z2,
        base1: base1,
        base2: base2,
        isMutated: isMutated,
        isHovered: isHovered
      });
    }

    // Sort rungs by average z so deeper elements are drawn behind
    nodesToDraw.forEach(item => {
      // Draw connecting hydrogen bond rung
      const alpha = 0.25 + 0.5 * ((Math.min(item.z1, item.z2) + 1) / 2);
      this.ctx.beginPath();
      this.ctx.moveTo(item.x, item.y1);
      this.ctx.lineTo(item.x, item.y2);

      if (item.isMutated) {
        this.ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0.7, alpha)})`;
        this.ctx.lineWidth = 2.8;
        this.ctx.setLineDash([4, 2]);
      } else if (item.isHovered) {
        this.ctx.strokeStyle = `rgba(56, 189, 248, 0.95)`;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);
      } else {
        this.ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.7})`;
        this.ctx.lineWidth = 1.6;
        this.ctx.setLineDash([]);
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw dashed hydrogen bonds in the center rung
      const midY = (item.y1 + item.y2) / 2;
      this.ctx.beginPath();
      this.ctx.arc(item.x, midY, item.isHovered ? 3 : 2, 0, Math.PI * 2);
      this.ctx.fillStyle = item.isMutated ? '#ef4444' : 'rgba(255, 255, 255, 0.6)';
      this.ctx.fill();
    });

    // Draw individual nucleotide spheres sorted by Z
    const spheres = [];
    nodesToDraw.forEach(item => {
      spheres.push({
        x: item.x,
        y: item.y1,
        z: item.z1,
        base: item.base1,
        isMutated: item.isMutated,
        isHovered: item.isHovered,
        strand: 1
      });
      spheres.push({
        x: item.x,
        y: item.y2,
        z: item.z2,
        base: item.base2,
        isMutated: item.isMutated,
        isHovered: item.isHovered,
        strand: 2
      });
    });

    spheres.sort((a, b) => a.z - b.z);

    spheres.forEach(s => {
      // Size & Opacity based on depth z (-1 to 1)
      const scale = 0.65 + 0.45 * ((s.z + 1) / 2);
      const radius = (s.isHovered ? 13 : 10) * scale;
      const alpha = 0.4 + 0.6 * ((s.z + 1) / 2);

      const color = s.isMutated && s.strand === 1 ? '#ef4444' : (this.colors[s.base] || '#38bdf8');

      // Outer glow for hovered or mutated
      if (s.isHovered || s.isMutated) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, radius + 4, 0, Math.PI * 2);
        this.ctx.fillStyle = s.isMutated ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)';
        this.ctx.fill();
        this.ctx.restore();
      }

      // Base circle
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);

      // 3D Gradient shading
      const grad = this.ctx.createRadialGradient(
        s.x - radius * 0.3,
        s.y - radius * 0.3,
        radius * 0.1,
        s.x,
        s.y,
        radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, '#020617');

      this.ctx.fillStyle = grad;
      this.ctx.fill();

      // Border ring
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = s.isMutated ? '#ffffff' : 'rgba(255,255,255,0.4)';
      this.ctx.stroke();

      // Nucleotide Letter Label
      if (s.z > -0.4) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(9, Math.round(9 * scale))}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(s.base, s.x, s.y);
      }
      this.ctx.restore();
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

window.DNAHelixVisualizer = DNAHelixVisualizer;
