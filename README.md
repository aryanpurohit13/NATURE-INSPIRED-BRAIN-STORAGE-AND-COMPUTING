# 🧬 DNA Digital Data Storage & Presentation Platform

An interactive, college-demo and presentation-ready working model of an end-to-end **DNA Digital Data Storage Pipeline**:

$$\text{Input Data} \longrightarrow \text{Binary (Base-2)} \longrightarrow \text{DNA Encoding} \longrightarrow \text{DNA Storage Bank} \longrightarrow \text{Error Simulation} \longrightarrow \text{DNA Decoding} \longrightarrow \text{Original Data}$$

---

## 🏛️ Dual Main Headings Architecture

### 1. 🧬 DNA STORAGE (Main Heading 1)
Under the **DNA STORAGE** main heading, you have all 6 core simulation topics:

| Topic | Purpose | Features |
| :--- | :--- | :--- |
| **🏠 Home** | Introduction & Concept | 3D Canvas rotating double helix, "Start Simulation", "How DNA Storage Works" modal guide, Key advantages (215 PB/g, 500,000 yr durability, 0W idle power), Quick "HI" &rarr; DNA demo. |
| **🧬 Encode** | Data &rarr; Binary &rarr; DNA | Text input + Universal file upload (.txt, images, pdfs), 2-bit mapping ($00\to A, 01\to C, 10\to G, 11\to T$), step-by-step character conversion trace, animated double helix strand with hover base inspector ($A, T, G, C$, Purine/Pyrimidine, H-bonds). |
| **💾 DNA Vault** | Stored DNA Sequences | Digital biological bank in `localStorage` storing `#DNA001` records with size, bits, nucleotide sequence, GC-ratio, status `STORED`, pre-seeded demo records, FASTA and JSON exports. |
| **🔓 Decode** | DNA &rarr; Original Data | Pure DNA retrieval workspace (original text removed), reverse decoding ($DNA \to \text{Bits} \to \text{Bytes} \to \text{Data}$), "✅ Successfully Recovered" banner, 100% bit-perfect match verification, and examiner explanation callouts. |
| **⚠️ Error Lab** | Mutation & Error Simulation | Radiation/sequencing mutation simulation, point substitution, clickable nucleotide beads in the sequence strip, side-by-side diff with `↑ Error` pointers, corrupted decode preview, and **Multi-Copy Redundancy with Majority Voting** consensus error repair. |
| **📊 Analytics** | Storage Statistics | Data size, bits, bases, 2 bits/base efficiency, GC-content (%) gauge, nucleotide frequency charts ($A, T, G, C$), and physical mass calculation (femtograms/picograms). |

---

### 2. 📽️ PRESENTATION (Main Heading 2)
A dedicated presentation workspace:
- **Upload Custom Presentation**: Upload your presentation files (`.pdf`, `.pptx`, `.ppt`, `.png`, `.jpg`, `.webp`, `.key`).
- **In-Browser Presentation View**:
  - Embedded PDF viewer with responsive controls and download button.
  - PowerPoint/document handler with quick presentation actions.
- **Interactive 6-Slide Master Deck**: Built-in visual presentation covering motivation, codec, PCR random access, majority voting, and metrics.
- **Presenter & Speaker Notes**: Auto-saving scratchpad in `localStorage` for talking points.
- **Fullscreen Mode & Keyboard Navigation**: Arrow keys (`←` / `→`), Spacebar, PageUp/PageDown, and `F` for fullscreen.

---

## 🔬 Scientific & Mathematical Foundations

### 1. 2-Bit Nucleotide Mapping
Computers store information in bits ($0$ and $1$). DNA has 4 chemical bases:
- `00` &rarr; **A** (Adenine)
- `01` &rarr; **C** (Cytosine)
- `10` &rarr; **G** (Guanine)
- `11` &rarr; **T** (Thymine)

Example: Character `'H'` (ASCII 72 = `01001000`):
$$\text{'H'} \longrightarrow 01\ 00\ 10\ 00 \longrightarrow \text{C}\ \text{A}\ \text{G}\ \text{A}$$

### 2. Multi-Copy Majority Voting Error Correction
In physical DNA data storage, billions of copies of each oligonucleotide strand are synthesized. When sequencers read corrupted reads:
- Copy 1: `A C G T C A A G`
- Copy 2: `A C G T C A A G`
- Copy 3: `A C G T T A A G` *(Error at position 5)*
- **Majority Voting:** 2 votes for `C` vs 1 vote for `T` &rarr; **Recovered: `A C G T C A A G`** &rarr; **✅ Error Corrected**!

---

## 🚀 How to Run Locally (Instant, Zero Installs)

1. Open folder:
   `C:\Users\aryan\.gemini\antigravity\scratch\dna-storage-model`
2. Double-click `index.html` to open directly in Chrome, Edge, Firefox, or Safari.
3. No Node.js, Python, or local build tools required — runs 100% client-side with zero dependencies!

---

## 🌐 Deploy to Vercel / GitHub Pages

### Push to GitHub:
```powershell
cd C:\Users\aryan\.gemini\antigravity\scratch\dna-storage-model
git init
git add .
git commit -m "DNA Storage Simulator with Presentation Hub"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/dna-storage-model.git
git push -u origin main
```

### Deploy to Vercel:
1. Log in at [vercel.com](https://vercel.com) with your GitHub account.
2. Click **"Add New Project"** &rarr; Import `dna-storage-model`.
3. Framework Preset: `Other`, Root Directory: `./`.
4. Click **Deploy** — live in ~15 seconds!
