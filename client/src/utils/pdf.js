import { jsPDF } from "jspdf";

/* ------------------------------------------------------------------ *
 * PDF engine (client-side, jsPDF). Three exports:
 *   exportQuizPaper(quiz, { withAnswers })   -> printable question paper
 *   exportQuizReport(quiz, answers)          -> detailed results + explanations
 *   exportMarkdownPdf({ title, subtitle, markdown }) -> Ask / Notes answers
 * ------------------------------------------------------------------ */

const COLOR = {
  primary: [108, 76, 255],
  primaryDark: [58, 38, 170],
  ink: [23, 21, 58],
  soft: [92, 90, 133],
  line: [224, 222, 245],
  tint: [244, 243, 255],
  green: [18, 150, 110],
  red: [226, 60, 90],
  amber: [217, 140, 0],
  blue: [47, 140, 255],
  grey: [160, 160, 185],
};

const LETTERS = "ABCDEFGH";

// jsPDF's built-in fonts only cover Latin-1, so map common symbols to ASCII
// and drop anything else instead of printing garbage.
const REPLACEMENTS = {
  "→": "->", "←": "<-", "↔": "<->", "⇒": "=>", "–": "-", "—": "-", "−": "-",
  "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "•": "-", "·": "-",
  "≤": "<=", "≥": ">=", "≠": "!=", "≈": "~", "×": "x", "÷": "/", "∞": "inf",
  "√": "sqrt", "π": "pi", "∑": "sum", "∆": "delta", "Δ": "delta", "α": "alpha",
  "β": "beta", "γ": "gamma", "λ": "lambda", "μ": "u", "σ": "sigma", "θ": "theta",
  "✓": "[ok]", "✔": "[ok]", "✗": "x", "✘": "x", "°": " deg", "₂": "2", "₁": "1",
  "²": "2", "³": "3", "\u00a0": " ", "\t": "    ",
};

function clean(input) {
  return String(input ?? "")
    .replace(/[^\x00-\xff]/g, (ch) => REPLACEMENTS[ch] ?? "")
    .replace(/[\u0080-\u009f]/g, "");
}

// Strip inline Markdown (bold, italics, code, links) for plain PDF text.
function inline(text) {
  return clean(text)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1");
}

class PdfWriter {
  constructor({ title, subtitle, badge }) {
    this.pdf = new jsPDF({ unit: "pt", format: "a4" });
    this.W = this.pdf.internal.pageSize.getWidth();
    this.H = this.pdf.internal.pageSize.getHeight();
    this.margin = 48;
    this.contentW = this.W - this.margin * 2;
    this.y = this.margin;
    this.header(title, subtitle, badge);
  }

  color(kind, c) {
    const fn = { text: "setTextColor", fill: "setFillColor", draw: "setDrawColor" }[kind];
    this.pdf[fn](...c);
  }

  header(title, subtitle, badge) {
    const { pdf } = this;
    this.color("fill", COLOR.primary);
    pdf.rect(0, 0, this.W, 112, "F");
    this.color("fill", COLOR.primaryDark);
    pdf.rect(0, 112, this.W, 4, "F");

    this.color("text", [255, 255, 255]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("STUDY DESK", this.margin, 34);
    if (badge) {
      pdf.setFontSize(9);
      pdf.text(clean(badge).toUpperCase(), this.W - this.margin, 34, { align: "right" });
    }
    pdf.setFontSize(21);
    const lines = pdf.splitTextToSize(clean(title), this.contentW).slice(0, 2);
    pdf.text(lines, this.margin, 62);
    if (subtitle) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(clean(subtitle), this.margin, 62 + lines.length * 24 + 2);
    }
    this.y = 144;
  }

  ensure(h) {
    if (this.y + h > this.H - this.margin - 14) {
      this.pdf.addPage();
      this.y = this.margin;
    }
  }

  gap(h = 8) {
    this.y += h;
  }

  /** Wrapped text block. Handles page breaks line-by-line. */
  text(str, { size = 10.5, style = "normal", color = COLOR.ink, indent = 0, lh = 1.42, font = "helvetica", bar = null, after = 4 } = {}) {
    const { pdf } = this;
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    const width = this.contentW - indent - (bar ? 12 : 0);
    const lines = pdf.splitTextToSize(clean(str), width);
    const step = size * lh;
    for (const line of lines) {
      this.ensure(step);
      if (bar) {
        this.color("fill", bar);
        pdf.rect(this.margin + indent, this.y - size + 1, 3, step, "F");
      }
      pdf.setFont(font, style);
      pdf.setFontSize(size);
      this.color("text", color);
      pdf.text(line, this.margin + indent + (bar ? 12 : 0), this.y);
      this.y += step;
    }
    this.y += after;
  }

  rule(c = COLOR.line) {
    this.ensure(10);
    this.color("draw", c);
    this.pdf.setLineWidth(0.6);
    this.pdf.line(this.margin, this.y, this.W - this.margin, this.y);
    this.y += 10;
  }

  pill(label, x, y, c) {
    const { pdf } = this;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    const w = pdf.getTextWidth(clean(label)) + 14;
    this.color("fill", c);
    pdf.roundedRect(x, y - 10, w, 15, 7, 7, "F");
    this.color("text", [255, 255, 255]);
    pdf.text(clean(label), x + 7, y + 0.5);
    return w;
  }

  section(label) {
    this.ensure(30);
    this.gap(6);
    this.text(label, { size: 13, style: "bold", color: COLOR.primaryDark, after: 2 });
    this.rule(COLOR.primary);
  }

  footers() {
    const { pdf } = this;
    const n = pdf.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      pdf.setPage(i);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      this.color("text", COLOR.grey);
      pdf.text("Study Desk - your personal study assistant", this.margin, this.H - 26);
      pdf.text(`Page ${i} of ${n}`, this.W - this.margin, this.H - 26, { align: "right" });
    }
  }

  save(filename) {
    this.footers();
    this.pdf.save(filename);
  }
}

const slug = (s) =>
  clean(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "study-desk";

const today = () =>
  new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

/* ---------------------------- Quiz helpers ---------------------------- */

export function scoreQuiz(quiz, answers) {
  let correct = 0, wrong = 0, skipped = 0, mcqTotal = 0, shortTotal = 0;
  quiz.questions.forEach((q, i) => {
    if (q.type === "mcq") {
      mcqTotal++;
      const a = answers[i];
      if (a === undefined || a === null) skipped++;
      else if (a === q.correctIndex) correct++;
      else wrong++;
    } else {
      shortTotal++;
    }
  });
  const percent = mcqTotal ? Math.round((correct / mcqTotal) * 100) : 0;
  return { correct, wrong, skipped, mcqTotal, shortTotal, percent };
}

export function questionStatus(q, answer) {
  if (q.type !== "mcq") return "short";
  if (answer === undefined || answer === null) return "skipped";
  return answer === q.correctIndex ? "correct" : "wrong";
}

const STATUS_COLOR = { correct: COLOR.green, wrong: COLOR.red, skipped: COLOR.amber, short: COLOR.blue };
const STATUS_LABEL = { correct: "CORRECT", wrong: "INCORRECT", skipped: "NOT ANSWERED", short: "SHORT ANSWER" };

/* --------------------------- Question paper --------------------------- */

export function exportQuizPaper(quiz, { withAnswers = false } = {}) {
  const doc = new PdfWriter({
    title: quiz.title,
    subtitle: `${quiz.topic}  |  ${quiz.difficulty}  |  ${quiz.questions.length} questions  |  ${today()}`,
    badge: withAnswers ? "Question paper + answer key" : "Question paper",
  });

  doc.text("Name: ______________________________        Date: ________________", { size: 10.5, color: COLOR.soft, after: 6 });
  doc.text("Choose the single best option for each multiple-choice question.", { size: 9.5, color: COLOR.soft, style: "italic", after: 8 });
  doc.rule();

  quiz.questions.forEach((q, i) => {
    doc.ensure(70);
    doc.text(`${i + 1}.  ${q.question}`, { size: 11.5, style: "bold", after: 5 });
    if (q.type === "mcq") {
      q.options.forEach((opt, k) => {
        doc.text(`${LETTERS[k]})  ${opt}`, { indent: 18, after: 2 });
      });
    } else {
      for (let l = 0; l < 3; l++) {
        doc.ensure(18);
        doc.color("draw", COLOR.line);
        doc.pdf.line(doc.margin + 18, doc.y + 6, doc.W - doc.margin, doc.y + 6);
        doc.gap(18);
      }
    }
    doc.gap(10);
  });

  if (withAnswers) {
    doc.pdf.addPage();
    doc.y = doc.margin;
    doc.section("Answer key");
    quiz.questions.forEach((q, i) => {
      const ans = q.type === "mcq" ? `${LETTERS[q.correctIndex]}) ${q.options[q.correctIndex]}` : q.answer;
      doc.text(`${i + 1}.  ${ans}`, { style: "bold", color: COLOR.green, after: 1 });
      if (q.explanation) doc.text(q.explanation, { size: 9.5, color: COLOR.soft, indent: 18, after: 7 });
    });
  }

  doc.save(`${slug(quiz.title)}-${withAnswers ? "paper-with-answers" : "paper"}.pdf`);
}

/* ---------------------------- Results report --------------------------- */

export function exportQuizReport(quiz, answers) {
  const s = scoreQuiz(quiz, answers);
  const doc = new PdfWriter({
    title: `${quiz.title} - Results`,
    subtitle: `${quiz.topic}  |  ${quiz.difficulty}  |  ${today()}`,
    badge: "Detailed answer report",
  });
  const { pdf } = doc;

  // --- score card ---
  const cardH = 92;
  doc.color("fill", COLOR.tint);
  pdf.roundedRect(doc.margin, doc.y, doc.contentW, cardH, 8, 8, "F");
  const ringC = s.percent >= 70 ? COLOR.green : s.percent >= 40 ? COLOR.amber : COLOR.red;
  doc.color("fill", ringC);
  pdf.circle(doc.margin + 52, doc.y + cardH / 2, 34, "F");
  doc.color("text", [255, 255, 255]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(`${s.percent}%`, doc.margin + 52, doc.y + cardH / 2 + 8, { align: "center" });

  const tx = doc.margin + 108;
  doc.color("text", COLOR.ink);
  pdf.setFontSize(15);
  pdf.text(s.mcqTotal ? `${s.correct} of ${s.mcqTotal} correct` : "Short-answer review", tx, doc.y + 32);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  doc.color("text", COLOR.soft);
  const verdict =
    s.percent >= 85 ? "Excellent work - you have a strong grasp of this topic."
    : s.percent >= 70 ? "Good job - a little revision will make it solid."
    : s.percent >= 40 ? "Decent start - review the explanations below."
    : "Keep going - study the explanations below and try again.";
  pdf.text(s.mcqTotal ? verdict : "Compare your answers with the model answers below.", tx, doc.y + 50);
  pdf.text(
    `Incorrect: ${s.wrong}    Not answered: ${s.skipped}` + (s.shortTotal ? `    Short answers: ${s.shortTotal}` : ""),
    tx, doc.y + 68
  );
  doc.y += cardH + 18;

  // --- overview chips ---
  doc.section("Question overview");
  let x = doc.margin;
  const box = 26;
  quiz.questions.forEach((q, i) => {
    if (x + box > doc.W - doc.margin) {
      x = doc.margin;
      doc.y += box + 6;
    }
    doc.ensure(box + 6);
    const st = questionStatus(q, answers[i]);
    doc.color("fill", STATUS_COLOR[st]);
    pdf.roundedRect(x, doc.y, box, box, 5, 5, "F");
    doc.color("text", [255, 255, 255]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(String(i + 1), x + box / 2, doc.y + box / 2 + 3.5, { align: "center" });
    x += box + 6;
  });
  doc.y += box + 8;
  [["correct", "Correct"], ["wrong", "Incorrect"], ["skipped", "Not answered"], ["short", "Short answer"]].forEach(([k, label], n) => {
    const lx = doc.margin + n * 120;
    doc.color("fill", STATUS_COLOR[k]);
    pdf.circle(lx + 4, doc.y, 4, "F");
    doc.color("text", COLOR.soft);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(label, lx + 12, doc.y + 3);
  });
  doc.y += 18;

  // --- detailed review ---
  doc.section("Detailed review");
  quiz.questions.forEach((q, i) => {
    const st = questionStatus(q, answers[i]);
    doc.ensure(90);
    doc.pill(`Q${i + 1}  ${STATUS_LABEL[st]}`, doc.margin, doc.y + 4, STATUS_COLOR[st]);
    doc.gap(24);
    doc.text(q.question, { size: 11.5, style: "bold", after: 6 });

    if (q.type === "mcq") {
      q.options.forEach((opt, k) => {
        const isCorrect = k === q.correctIndex;
        const picked = answers[i] === k;
        const col = isCorrect ? COLOR.green : picked ? COLOR.red : COLOR.ink;
        let tag = "";
        if (isCorrect && picked) tag = "   (your answer - correct)";
        else if (isCorrect) tag = "   (correct answer)";
        else if (picked) tag = "   (your answer)";

        doc.ensure(16);
        if (isCorrect || picked) {
          doc.color("fill", col);
          pdf.circle(doc.margin + 7, doc.y - 3.5, 3.2, "F");
        } else {
          doc.color("draw", COLOR.grey);
          pdf.setLineWidth(0.7);
          pdf.circle(doc.margin + 7, doc.y - 3.5, 3.2, "S");
        }
        doc.text(`${LETTERS[k]})  ${opt}${tag}`, {
          indent: 18, color: col, style: isCorrect || picked ? "bold" : "normal", after: 2,
        });
      });
      if (st === "skipped") doc.text("You did not answer this question.", { size: 9.5, style: "italic", color: COLOR.amber, indent: 18, after: 2 });
    } else {
      const mine = (answers[i] || "").trim();
      doc.text("Your answer", { size: 9, style: "bold", color: COLOR.soft, indent: 0, after: 1 });
      doc.text(mine || "(left blank)", { color: mine ? COLOR.ink : COLOR.grey, style: mine ? "normal" : "italic", bar: COLOR.blue, after: 5 });
      doc.text("Model answer", { size: 9, style: "bold", color: COLOR.soft, after: 1 });
      doc.text(q.answer, { color: COLOR.green, style: "bold", bar: COLOR.green, after: 4 });
    }

    if (q.explanation) {
      doc.gap(3);
      doc.text("Explanation", { size: 9, style: "bold", color: COLOR.primary, after: 1 });
      doc.text(q.explanation, { size: 10, color: COLOR.soft, bar: COLOR.primary, after: 6 });
    }
    doc.gap(6);
    doc.rule();
  });

  doc.save(`${slug(quiz.title)}-results.pdf`);
}

/* ------------------------- Markdown -> PDF (Ask / Notes) ------------------------- */

export function exportMarkdownPdf({ title, subtitle, markdown, badge = "Study answer" }) {
  const doc = new PdfWriter({ title, subtitle: subtitle || today(), badge });
  const lines = String(markdown || "").replace(/\r/g, "").split("\n");
  let inCode = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    if (/^\s*```/.test(raw)) {
      inCode = !inCode;
      doc.gap(3);
      continue;
    }
    if (inCode) {
      doc.text(raw || " ", { font: "courier", size: 9.5, color: COLOR.primaryDark, bar: COLOR.line, lh: 1.3, after: 0 });
      continue;
    }
    if (!raw.trim()) { doc.gap(5); continue; }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(raw)) { doc.rule(); continue; }

    const h = raw.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      doc.gap(level <= 2 ? 8 : 4);
      doc.ensure(34);
      doc.text(inline(h[2]), {
        size: [17, 14.5, 12.5, 11.5, 11, 10.5][level - 1],
        style: "bold",
        color: level <= 2 ? COLOR.primaryDark : COLOR.ink,
        after: level <= 2 ? 4 : 2,
      });
      if (level === 1) doc.rule(COLOR.primary);
      continue;
    }

    const bullet = raw.match(/^(\s*)([-*+])\s+(.*)$/);
    if (bullet) {
      const depth = Math.floor(bullet[1].replace(/\t/g, "  ").length / 2);
      const ind = 8 + depth * 16;
      doc.ensure(16);
      doc.color("fill", COLOR.primary);
      doc.pdf.circle(doc.margin + ind - 6, doc.y - 3.4, 1.8, "F");
      doc.text(inline(bullet[3]), { indent: ind, after: 2 });
      continue;
    }

    const num = raw.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (num) {
      const depth = Math.floor(num[1].replace(/\t/g, "  ").length / 2);
      const ind = 20 + depth * 16;
      doc.ensure(16);
      doc.pdf.setFont("helvetica", "bold");
      doc.pdf.setFontSize(10.5);
      doc.color("text", COLOR.primary);
      doc.pdf.text(`${num[2]}.`, doc.margin + ind - 18 + depth * 0, doc.y);
      doc.text(inline(num[3]), { indent: ind, after: 2 });
      continue;
    }

    if (/^\s*>/.test(raw)) {
      doc.text(inline(raw.replace(/^\s*>\s?/, "")), { style: "italic", color: COLOR.soft, bar: COLOR.primary, after: 3 });
      continue;
    }

    // Markdown tables: skip the |---| separator, print rows as "a | b | c"
    if (/^\s*\|/.test(raw)) {
      if (/^\s*\|?[\s:|-]+\|?\s*$/.test(raw) && raw.includes("-")) continue;
      const cells = raw.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
      doc.text(cells.join("   |   "), { size: 10, bar: COLOR.line, after: 2 });
      continue;
    }

    doc.text(inline(raw), { after: 3 });
  }

  doc.save(`${slug(title)}.pdf`);
}
