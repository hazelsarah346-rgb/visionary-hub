// North Star Pitch Deck Generator — v2 (post-QA fixes)
// Run: NODE_PATH=/opt/homebrew/lib/node_modules node /Users/sarah/visionary-hub/northstar-pitch.js

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  bgDark:    "050F1E",
  bgSurface: "091525",
  bgCard:    "0C1D30",
  border:    "1E3A5F",
  blue:      "2563EB",
  blueLight: "60A5FA",
  purple:    "8B5CF6",
  textWhite: "EFF6FF",
  muted:     "64748B",
  green:     "10B981",
  yellow:    "F59E0B",
  teal:      "06B6D4",
  red:       "EF4444",
  pink:      "EC4899",
};

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function renderIconSvg(IconComponent, color = "#ffffff", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

async function circleIconPng(IconComponent, iconColor, bgColor, size = 256) {
  const iconSize = Math.round(size * 0.55);
  const iconSvg = renderIconSvg(IconComponent, iconColor, iconSize);
  const iconPng = await sharp(Buffer.from(iconSvg)).png().resize(iconSize, iconSize).toBuffer();

  const r = parseInt(bgColor.slice(0, 2), 16);
  const g = parseInt(bgColor.slice(2, 4), 16);
  const b = parseInt(bgColor.slice(4, 6), 16);

  const circle = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="rgb(${r},${g},${b})"/>
    </svg>`
  );

  const circleImg = await sharp(circle).png().toBuffer();
  const offset = Math.round((size - iconSize) / 2);

  const composed = await sharp(circleImg)
    .composite([{ input: iconPng, top: offset, left: offset }])
    .png()
    .toBuffer();

  return "image/png;base64," + composed.toString("base64");
}

// Circle icon with gradient-like dual color (simulate gradient with blend)
async function circleIconGradientPng(IconComponent, iconColor, bg1, bg2, size = 256) {
  const iconSize = Math.round(size * 0.55);
  const iconSvg = renderIconSvg(IconComponent, iconColor, iconSize);
  const iconPng = await sharp(Buffer.from(iconSvg)).png().resize(iconSize, iconSize).toBuffer();

  // Parse colors
  const r1 = parseInt(bg1.slice(0,2),16), g1 = parseInt(bg1.slice(2,4),16), b1 = parseInt(bg1.slice(4,6),16);
  const r2 = parseInt(bg2.slice(0,2),16), g2 = parseInt(bg2.slice(2,4),16), b2 = parseInt(bg2.slice(4,6),16);

  const circle = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgb(${r1},${g1},${b1})"/>
          <stop offset="100%" stop-color="rgb(${r2},${g2},${b2})"/>
        </linearGradient>
      </defs>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#g)"/>
    </svg>`
  );

  const circleImg = await sharp(circle).png().toBuffer();
  const offset = Math.round((size - iconSize) / 2);
  const composed = await sharp(circleImg)
    .composite([{ input: iconPng, top: offset, left: offset }])
    .png()
    .toBuffer();
  return "image/png;base64," + composed.toString("base64");
}

// ─── Reusable card helpers ─────────────────────────────────────────────────────
function addCard(slide, x, y, w, h, accentColor) {
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: C.bgCard },
    line: { color: C.border, width: 1 },
  });
  slide.addShape("rect", {
    x, y, w: 0.07, h,
    fill: { color: accentColor },
    line: { color: accentColor, width: 0 },
  });
}

function addBottomBar(slide) {
  slide.addShape("rect", {
    x: 0, y: 5.47, w: 10, h: 0.155,
    fill: { color: C.blue },
    line: { color: C.blue, width: 0 },
  });
}

function addTitleDivider(slide, y) {
  slide.addShape("rect", {
    x: 0.45, y: y, w: 9.1, h: 0.03,
    fill: { color: C.border },
    line: { color: C.border, width: 0 },
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function buildDeck() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10" × 5.625"
  pres.title = "North Star — Pitch Deck";
  pres.author = "North Star";

  const W = 10, H = 5.625;

  // Pre-render all icons
  const icons = {
    lightbulb:      await circleIconPng(fa.FaLightbulb,     "#ffffff", "2563EB", 256),
    search:         await circleIconPng(fa.FaSearch,         "#ffffff", "2563EB", 256),
    map:            await circleIconPng(fa.FaMapMarkedAlt,   "#ffffff", "8B5CF6", 256),
    moon:           await circleIconPng(fa.FaMoon,           "#ffffff", "06B6D4", 256),
    compass:        await circleIconPng(fa.FaCompass,        "#ffffff", "06B6D4", 256),
    users:          await circleIconPng(fa.FaUsers,          "#ffffff", "8B5CF6", 256),
    comment:        await circleIconPng(fa.FaCommentDots,    "#ffffff", "10B981", 256),
    robot:          await circleIconPng(fa.FaRobot,          "#ffffff", "EC4899", 256),
    home:           await circleIconPng(fa.FaHome,           "#ffffff", "2563EB", 256),
    grad:           await circleIconPng(fa.FaGraduationCap,  "#ffffff", "2563EB", 256),
    refresh:        await circleIconPng(fa.FaSync,           "#ffffff", "8B5CF6", 256),
    starYellow:     await circleIconPng(fa.FaStar,           "#ffffff", "F59E0B", 256),
    handshake:      await circleIconPng(fa.FaHandshake,      "#ffffff", "2563EB", 256),
    bullhorn:       await circleIconPng(fa.FaBullhorn,       "#ffffff", "10B981", 256),
    lightbulbPurp:  await circleIconPng(fa.FaLightbulb,     "#ffffff", "8B5CF6", 256),
    mapYellow:      await circleIconPng(fa.FaMapMarkedAlt,   "#ffffff", "F59E0B", 256),
    checkGreen:     await iconToBase64Png(fa.FaCheckCircle,  "#10B981", 256),
    lightbulbGrad:  await circleIconGradientPng(fa.FaLightbulb, "#ffffff", "2563EB", "8B5CF6", 512),
  };

  // Starfield dot positions
  function addStarfield(slide, dots) {
    for (const [dx, dy] of dots) {
      slide.addShape("ellipse", {
        x: dx - 0.02, y: dy - 0.02, w: 0.04, h: 0.04,
        fill: { color: C.blueLight, transparency: 55 },
        line: { color: C.blueLight, width: 0 },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 1 — TITLE
  // FIX: Removed explicit \n in headline — let text wrap naturally in wider box
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    addStarfield(slide, [
      [0.5, 0.3], [1.8, 0.8], [3.2, 0.2], [4.5, 0.6], [6.1, 0.1], [7.8, 0.4],
      [9.2, 0.9], [0.2, 1.5], [2.3, 1.2], [5.6, 1.8], [8.4, 1.3], [9.7, 2.0],
      [1.1, 4.5], [3.7, 5.0], [6.9, 4.8], [8.8, 5.2],
    ]);

    // Top-left logo
    slide.addImage({ data: icons.lightbulb, x: 0.42, y: 0.25, w: 0.55, h: 0.55 });
    slide.addText([
      { text: "North ", options: { color: C.textWhite, bold: true } },
      { text: "★ ", options: { color: C.blueLight, bold: true } },
      { text: "Star", options: { color: C.blueLight, bold: true } },
    ], {
      x: 1.07, y: 0.24, w: 3.6, h: 0.58,
      fontSize: 20, fontFace: "Georgia",
      valign: "middle", margin: 0,
    });

    // Center headline — two explicit lines, sized to fit on one line each
    slide.addText("Clarity, Structure & Support —", {
      x: 0.5, y: 1.05, w: 9.0, h: 0.9,
      fontSize: 38, fontFace: "Georgia",
      color: C.textWhite, bold: true,
      align: "center", valign: "middle",
    });
    slide.addText("for everyone figuring it out.", {
      x: 0.5, y: 2.05, w: 9.0, h: 0.9,
      fontSize: 38, fontFace: "Georgia",
      color: C.textWhite, bold: true,
      align: "center", valign: "middle",
    });

    // Sub-tagline
    slide.addText("Built for students, career switchers, and anyone still finding their path.", {
      x: 1.0, y: 3.12, w: 8.0, h: 0.5,
      fontSize: 17, fontFace: "Calibri",
      color: C.blueLight, align: "center",
    });

    addBottomBar(slide);

    slide.addText("project-u53n4.vercel.app", {
      x: 6.5, y: 5.2, w: 3.3, h: 0.25,
      fontSize: 9, fontFace: "Calibri",
      color: C.muted, align: "right",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 2 — THE PROBLEM
  // FIX: Tightened icon-to-label gap; made cards slightly shorter to feel tighter
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    slide.addText("The people who need help most — get the least support", {
      x: 0.45, y: 0.18, w: 9.1, h: 0.78,
      fontSize: 24, fontFace: "Georgia",
      color: C.textWhite, bold: true, align: "left",
    });
    addTitleDivider(slide, 0.98);

    const cards = [
      { icon: icons.search, accent: C.blue,   label: "No Clarity",   body: "No clear north star. Scattered goals. No idea what 'next' even looks like." },
      { icon: icons.map,    accent: C.purple,  label: "No Structure",  body: "Generic advice. No roadmap. Overwhelmed by options with zero traction." },
      { icon: icons.moon,   accent: C.teal,    label: "No Support",    body: "No mentors at their stage. No accountability. Figuring it out completely alone." },
    ];

    const cw = 2.88, ch = 3.55, cy = 1.12;
    cards.forEach((card, i) => {
      const cx = 0.45 + i * (cw + 0.2);
      addCard(slide, cx, cy, cw, ch, card.accent);
      // Icon centered at top of card
      slide.addImage({ data: card.icon, x: cx + (cw - 0.65) / 2, y: cy + 0.2, w: 0.65, h: 0.65 });
      // Label
      slide.addText(card.label, {
        x: cx + 0.14, y: cy + 1.0, w: cw - 0.22, h: 0.44,
        fontSize: 18, fontFace: "Georgia", bold: true,
        color: C.textWhite, align: "center", margin: 0,
      });
      // Body
      slide.addText(card.body, {
        x: cx + 0.18, y: cy + 1.5, w: cw - 0.32, h: 1.85,
        fontSize: 13.5, fontFace: "Calibri",
        color: C.muted, align: "center", wrap: true,
      });
    });

    addBottomBar(slide);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 3 — THE SOLUTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    // Left panel
    slide.addShape("rect", {
      x: 0, y: 0, w: 4.6, h: H,
      fill: { color: C.bgSurface },
      line: { color: C.bgSurface, width: 0 },
    });

    slide.addText("One place. Everything they need to move forward.", {
      x: 0.45, y: 0.9, w: 3.7, h: 2.1,
      fontSize: 32, fontFace: "Georgia",
      color: C.textWhite, bold: true, align: "left",
    });

    slide.addText("North Star gives people the clarity, structure, and support that actually fits their stage.", {
      x: 0.45, y: 3.15, w: 3.7, h: 1.1,
      fontSize: 14, fontFace: "Calibri",
      color: C.muted, align: "left", wrap: true,
    });

    // Vertical divider
    slide.addShape("rect", {
      x: 4.6, y: 0.2, w: 0.04, h: H - 0.4,
      fill: { color: C.border },
      line: { color: C.border, width: 0 },
    });

    // Right — 4 pillar cards
    const pillars = [
      { icon: icons.lightbulb, color: C.blue,   title: "Vision Canvas", desc: "Define where you're going" },
      { icon: icons.mapYellow, color: C.yellow,  title: "Roadmap",       desc: "Get a concrete path & milestones" },
      { icon: icons.users,     color: C.purple,  title: "Mentorship",    desc: "Connect with people who've been there" },
      { icon: icons.comment,   color: C.green,   title: "Community",     desc: "Grow with peers at your exact stage" },
    ];

    const pw = 4.85, ph = 1.0;
    pillars.forEach((p, i) => {
      const px = 4.75, py = 0.28 + i * (ph + 0.14);
      addCard(slide, px, py, pw, ph, p.color);
      slide.addImage({ data: p.icon, x: px + 0.17, y: py + 0.18, w: 0.62, h: 0.62 });
      slide.addText(p.title, {
        x: px + 0.92, y: py + 0.1, w: pw - 1.08, h: 0.4,
        fontSize: 15, fontFace: "Georgia", bold: true,
        color: C.textWhite, margin: 0, valign: "middle",
      });
      slide.addText(p.desc, {
        x: px + 0.92, y: py + 0.5, w: pw - 1.08, h: 0.38,
        fontSize: 12.5, fontFace: "Calibri",
        color: C.muted, margin: 0,
      });
    });

    addBottomBar(slide);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 4 — PRODUCT: 6 FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    slide.addText("What's inside North Star", {
      x: 0.45, y: 0.2, w: 9.1, h: 0.55,
      fontSize: 26, fontFace: "Georgia",
      color: C.textWhite, bold: true, align: "left",
    });
    addTitleDivider(slide, 0.77);

    const features = [
      { icon: icons.home,      color: C.blue,   title: "Flow",          desc: "Peer feed — share wins, stay inspired, never go it alone" },
      { icon: icons.lightbulb, color: C.yellow,  title: "Vision Canvas", desc: "Set your goal → get an AI-built roadmap tuned to you" },
      { icon: icons.compass,   color: C.teal,   title: "Explore",        desc: "Scholarships, internships & programs matched to your goals" },
      { icon: icons.comment,   color: C.green,  title: "Connect",        desc: "Peer group chats for people at your exact stage" },
      { icon: icons.users,     color: C.purple, title: "Mentorship",     desc: "Connect with mentors who've walked your path" },
      { icon: icons.robot,     color: C.pink,   title: "North Star AI",  desc: "Personal AI coach — ask anything, anytime" },
    ];

    const fw = 4.4, fh = 1.35;
    features.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const fx = 0.45 + col * (fw + 0.7);
      const fy = 0.88 + row * (fh + 0.14);

      addCard(slide, fx, fy, fw, fh, f.color);
      slide.addImage({ data: f.icon, x: fx + 0.16, y: fy + (fh - 0.62) / 2, w: 0.62, h: 0.62 });
      slide.addText(f.title, {
        x: fx + 0.9, y: fy + 0.12, w: fw - 1.05, h: 0.38,
        fontSize: 15, fontFace: "Georgia", bold: true,
        color: C.textWhite, margin: 0, valign: "middle",
      });
      slide.addText(f.desc, {
        x: fx + 0.9, y: fy + 0.52, w: fw - 1.05, h: 0.68,
        fontSize: 12, fontFace: "Calibri",
        color: C.muted, margin: 0, wrap: true,
      });
    });

    addBottomBar(slide);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 5 — HOW IT WORKS
  // FIX: Reduced step card height so they feel tighter, not floaty
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    slide.addText("From lost to moving forward — in 3 steps", {
      x: 0.45, y: 0.2, w: 9.1, h: 0.58,
      fontSize: 26, fontFace: "Georgia",
      color: C.textWhite, bold: true, align: "left",
    });
    addTitleDivider(slide, 0.8);

    const steps = [
      { num: "1", color: C.blue,   title: "Define",  desc: "Build your Vision Canvas in 60 seconds. Set your goal, field, and big vision." },
      { num: "2", color: C.purple, title: "Build",   desc: "Get your AI-generated roadmap. Milestones, next steps, opportunities — all tuned to you." },
      { num: "3", color: C.green,  title: "Grow",    desc: "Connect with mentors, join peer groups, track progress, reflect daily." },
    ];

    // FIX: tighter card height
    const sw = 2.72, sh = 3.6, sy = 0.93;
    steps.forEach((s, i) => {
      const sx = 0.45 + i * (sw + 0.66);

      addCard(slide, sx, sy, sw, sh, s.color);

      // Top colored band
      slide.addShape("rect", {
        x: sx, y: sy, w: sw, h: 0.1,
        fill: { color: s.color },
        line: { color: s.color, width: 0 },
      });

      // Number circle
      slide.addShape("ellipse", {
        x: sx + sw/2 - 0.42, y: sy + 0.22, w: 0.84, h: 0.84,
        fill: { color: s.color },
        line: { color: s.color, width: 0 },
      });
      slide.addText(s.num, {
        x: sx + sw/2 - 0.42, y: sy + 0.22, w: 0.84, h: 0.84,
        fontSize: 26, fontFace: "Georgia", bold: true,
        color: C.textWhite, align: "center", valign: "middle", margin: 0,
      });

      // Step title
      slide.addText(s.title, {
        x: sx + 0.12, y: sy + 1.22, w: sw - 0.24, h: 0.5,
        fontSize: 22, fontFace: "Georgia", bold: true,
        color: C.textWhite, align: "center", margin: 0,
      });

      // Description — 3 lines max
      slide.addText(s.desc, {
        x: sx + 0.18, y: sy + 1.82, w: sw - 0.36, h: 1.55,
        fontSize: 13, fontFace: "Calibri",
        color: C.muted, align: "center", wrap: true,
      });
    });

    // Arrow connectors
    [0, 1].forEach(i => {
      const arrowX = 0.45 + (i + 1) * (sw + 0.66) - 0.64;
      const arrowY = sy + sh/2 - 0.12;
      slide.addShape("rect", {
        x: arrowX, y: arrowY + 0.06, w: 0.36, h: 0.06,
        fill: { color: C.blueLight, transparency: 20 },
        line: { color: C.blueLight, width: 0 },
      });
      slide.addText("›", {
        x: arrowX + 0.14, y: arrowY - 0.1, w: 0.3, h: 0.42,
        fontSize: 22, color: C.blueLight,
        align: "center", valign: "middle", margin: 0,
      });
    });

    addBottomBar(slide);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 6 — WHO IT'S FOR
  // FIX: Shorter audience cards; title text shortened for 3rd card
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    slide.addText("Built for the ones figuring it out", {
      x: 0.45, y: 0.2, w: 9.1, h: 0.55,
      fontSize: 26, fontFace: "Georgia",
      color: C.textWhite, bold: true, align: "left",
    });
    addTitleDivider(slide, 0.77);

    const audiences = [
      { icon: icons.grad,      color: C.blue,   title: "Students",              desc: "Undergrads with ambition but no clear path. Need structure before they graduate." },
      { icon: icons.refresh,   color: C.purple,  title: "Career Switchers",      desc: "Professionals pivoting to new fields. Need clarity, not more noise." },
      { icon: icons.starYellow,color: C.yellow,  title: "Figuring It Out",            desc: "People who want to move forward but lack a roadmap and real support." },
    ];

    const aw = 2.88, ah = 3.1, ay = 0.9;
    audiences.forEach((a, i) => {
      const ax = 0.45 + i * (aw + 0.2);
      addCard(slide, ax, ay, aw, ah, a.color);

      slide.addImage({ data: a.icon, x: ax + (aw - 0.65) / 2, y: ay + 0.18, w: 0.65, h: 0.65 });

      slide.addText(a.title, {
        x: ax + 0.14, y: ay + 0.96, w: aw - 0.22, h: 0.5,
        fontSize: 16, fontFace: "Georgia", bold: true,
        color: C.textWhite, align: "center", margin: 0, wrap: true,
      });

      slide.addText(a.desc, {
        x: ax + 0.18, y: ay + 1.52, w: aw - 0.32, h: 1.38,
        fontSize: 13, fontFace: "Calibri",
        color: C.muted, align: "center", wrap: true,
      });
    });

    // Stat bar — positioned below cards with comfortable gap
    const statY = ay + ah + 0.16;
    slide.addShape("rect", {
      x: 0.45, y: statY, w: 9.1, h: 0.7,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
    });
    slide.addShape("rect", {
      x: 0.45, y: statY, w: 0.07, h: 0.7,
      fill: { color: C.yellow },
      line: { color: C.yellow, width: 0 },
    });
    slide.addText([
      { text: "1 in 3 young people ", options: { bold: true, color: C.yellow } },
      { text: "report feeling completely lost about their career direction.", options: { color: C.muted } },
    ], {
      x: 0.68, y: statY + 0.02, w: 8.65, h: 0.66,
      fontSize: 14, fontFace: "Calibri",
      valign: "middle", margin: 0,
    });

    addBottomBar(slide);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 7 — TRACTION & WHAT'S BUILT
  // FIX: Vercel badge now uses blueLight text for contrast; tech stack better spaced
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    slide.addText("Live product. Real users. Built to scale.", {
      x: 0.45, y: 0.2, w: 9.1, h: 0.55,
      fontSize: 26, fontFace: "Georgia",
      color: C.textWhite, bold: true, align: "left",
    });
    addTitleDivider(slide, 0.77);

    // Left column — what's live
    addCard(slide, 0.45, 0.9, 5.05, 4.35, C.green);

    slide.addText("What's Live", {
      x: 0.65, y: 0.96, w: 4.65, h: 0.42,
      fontSize: 16, fontFace: "Georgia", bold: true,
      color: C.green, margin: 0,
    });

    const liveItems = [
      "Web app live at project-u53n4.vercel.app",
      "AI Vision Canvas + roadmap generator",
      "Real-time peer community feed",
      "Peer group chat (Connect tab)",
      "Mentor application system",
      "Cross-device sync (web + mobile)",
      "Supabase backend + Vercel deployment",
    ];

    liveItems.forEach((item, i) => {
      slide.addImage({ data: icons.checkGreen, x: 0.65, y: 1.49 + i * 0.41, w: 0.28, h: 0.28 });
      slide.addText(item, {
        x: 1.04, y: 1.47 + i * 0.41, w: 4.2, h: 0.35,
        fontSize: 12.5, fontFace: "Calibri",
        color: C.textWhite, margin: 0, valign: "middle",
      });
    });

    // Right column — tech stack
    addCard(slide, 5.65, 0.9, 3.9, 4.35, C.blue);

    slide.addText("Tech Stack", {
      x: 5.85, y: 0.96, w: 3.5, h: 0.42,
      fontSize: 16, fontFace: "Georgia", bold: true,
      color: C.blueLight, margin: 0,
    });

    const techStack = [
      { name: "React",      color: C.blueLight },
      { name: "Supabase",   color: C.green },
      { name: "Vercel",     color: C.blueLight },   // FIX: was textWhite (low contrast)
      { name: "OpenAI",     color: C.purple },
      { name: "Real-time",  color: C.teal },
    ];

    techStack.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 5.82 + col * 1.86;
      const by = 1.55 + row * 0.72;

      slide.addShape("rect", {
        x: bx, y: by, w: 1.68, h: 0.52,
        fill: { color: C.bgSurface },
        line: { color: t.color, width: 1 },
      });
      slide.addText(t.name, {
        x: bx, y: by, w: 1.68, h: 0.52,
        fontSize: 13, fontFace: "Calibri", bold: true,
        color: t.color, align: "center", valign: "middle", margin: 0,
      });
    });

    addBottomBar(slide);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 8 — THE ASK
  // FIX: Ensured 3rd ask card doesn't get clipped by the bottom bar
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    slide.addText("The Ask", {
      x: 0.45, y: 0.2, w: 9.1, h: 0.52,
      fontSize: 26, fontFace: "Georgia",
      color: C.textWhite, bold: true, align: "left",
    });
    addTitleDivider(slide, 0.74);

    // Left column
    slide.addText("We're looking for", {
      x: 0.45, y: 0.84, w: 4.9, h: 0.44,
      fontSize: 18, fontFace: "Georgia", bold: true,
      color: C.blueLight,
    });

    const asks = [
      { icon: icons.handshake,   color: C.blue,   title: "Partnerships", desc: "Universities, bootcamps, NGOs working with students & career switchers" },
      { icon: icons.bullhorn,    color: C.green,  title: "Early Users",  desc: "Students and career switchers ready to find their north star" },
      { icon: icons.lightbulbPurp, color: C.purple, title: "Advisors",  desc: "People who understand edtech, community, and career development" },
    ];

    // FIX: reduced card height so 3 cards fit without crowding the bottom bar
    const akh = 1.0;
    const askGap = 0.14;
    const askStartY = 1.36;
    asks.forEach((a, i) => {
      const ay = askStartY + i * (akh + askGap);
      addCard(slide, 0.45, ay, 4.9, akh, a.color);
      slide.addImage({ data: a.icon, x: 0.62, y: ay + 0.19, w: 0.55, h: 0.55 });
      slide.addText(a.title, {
        x: 1.27, y: ay + 0.06, w: 3.9, h: 0.36,
        fontSize: 15, fontFace: "Georgia", bold: true,
        color: C.textWhite, margin: 0,
      });
      slide.addText(a.desc, {
        x: 1.27, y: ay + 0.43, w: 3.9, h: 0.48,
        fontSize: 12, fontFace: "Calibri",
        color: C.muted, margin: 0, wrap: true,
      });
    });

    // Right column — CTA box
    slide.addShape("rect", {
      x: 5.5, y: 0.84, w: 4.05, h: 4.38,
      fill: { color: C.bgCard },
      line: { color: C.blue, width: 2 },
    });
    slide.addShape("rect", {
      x: 5.5, y: 0.84, w: 0.07, h: 4.38,
      fill: { color: C.blue },
      line: { color: C.blue, width: 0 },
    });

    slide.addText("Get Involved", {
      x: 5.7, y: 0.98, w: 3.7, h: 0.5,
      fontSize: 20, fontFace: "Georgia", bold: true,
      color: C.textWhite, align: "center",
    });

    slide.addShape("rect", {
      x: 5.9, y: 1.58, w: 3.3, h: 0.03,
      fill: { color: C.border },
      line: { color: C.border, width: 0 },
    });

    slide.addText("Try it now:", {
      x: 5.7, y: 1.72, w: 3.7, h: 0.3,
      fontSize: 12, fontFace: "Calibri",
      color: C.muted, align: "center",
    });
    slide.addText("project-u53n4.vercel.app", {
      x: 5.7, y: 2.02, w: 3.7, h: 0.36,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: C.blueLight, align: "center",
    });

    slide.addText("Let's talk:", {
      x: 5.7, y: 2.5, w: 3.7, h: 0.3,
      fontSize: 12, fontFace: "Calibri",
      color: C.muted, align: "center",
    });
    slide.addText("hello@northstar.app", {
      x: 5.7, y: 2.82, w: 3.7, h: 0.36,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: C.blueLight, align: "center",
    });

    // CTA button
    slide.addShape("rect", {
      x: 5.9, y: 3.45, w: 3.3, h: 0.72,
      fill: { color: C.blue },
      line: { color: C.blue, width: 0 },
    });
    slide.addText("Join the North Star community", {
      x: 5.9, y: 3.45, w: 3.3, h: 0.72,
      fontSize: 13, fontFace: "Calibri", bold: true,
      color: C.textWhite, align: "center", valign: "middle", margin: 0,
    });

    addBottomBar(slide);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 9 — CLOSING
  // FIX: Icon now uses gradient (blue→purple). Bottom bar explicitly confirmed visible.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgDark };

    addStarfield(slide, [
      [0.4, 0.3], [1.6, 0.7], [3.0, 0.2], [4.4, 0.5], [6.0, 0.1], [7.7, 0.4],
      [9.1, 0.9], [0.2, 1.4], [2.2, 1.1], [5.5, 1.7], [8.3, 1.2], [9.6, 2.1],
      [0.8, 4.4], [3.5, 4.9], [6.8, 4.7], [8.7, 5.1], [1.5, 3.5], [5.0, 4.6],
    ]);

    // Large gradient icon
    slide.addImage({ data: icons.lightbulbGrad, x: 4.1, y: 0.35, w: 1.8, h: 1.8 });

    // "North ★ Star" wordmark
    slide.addText([
      { text: "North ", options: { color: C.textWhite, bold: true } },
      { text: "★ ", options: { color: C.blueLight, bold: true } },
      { text: "Star", options: { color: C.blueLight, bold: true } },
    ], {
      x: 1.0, y: 2.32, w: 8.0, h: 0.9,
      fontSize: 46, fontFace: "Georgia",
      align: "center", valign: "middle", margin: 0,
    });

    // Tagline
    slide.addText("Stop figuring it out alone.", {
      x: 1.0, y: 3.3, w: 8.0, h: 0.55,
      fontSize: 22, fontFace: "Georgia",
      color: C.muted, align: "center",
    });

    // Sub
    slide.addText("Clarity.  Structure.  Support.  Community.", {
      x: 1.5, y: 3.93, w: 7.0, h: 0.38,
      fontSize: 15, fontFace: "Calibri",
      color: C.muted, align: "center",
    });

    // URL
    slide.addText("project-u53n4.vercel.app", {
      x: 3.0, y: 4.42, w: 4.0, h: 0.32,
      fontSize: 12, fontFace: "Calibri",
      color: C.blueLight, align: "center",
    });

    // Bottom bar — explicit y within safe zone
    slide.addShape("rect", {
      x: 0, y: 5.47, w: 10, h: 0.155,
      fill: { color: C.blue },
      line: { color: C.blue, width: 0 },
    });
  }

  // ─── Write file ────────────────────────────────────────────────────────────
  const outPath = "/Users/sarah/visionary-hub/NorthStar-Pitch.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("Saved:", outPath);
}

buildDeck().catch(err => { console.error(err); process.exit(1); });
