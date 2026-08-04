import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Génération de la facture en vrai PDF, format "ticket de caisse" (80mm,
// comme un reçu imprimé) plutôt qu'une page A4 — cohérent avec le rendu
// mobile-first d'Ayiba. Contrairement à l'ancienne version (fenêtre HTML
// imprimable côté client), ce module tourne côté serveur : aucune dépendance
// au navigateur du vendeur (popup bloqué, window.print() cassé sur iOS,
// encodage mal déclaré) ne peut plus casser le document.
//
// La hauteur de la page est calculée dynamiquement (nombre d'articles
// variable) via une première passe de mesure, avant de générer le PDF final
// à la bonne taille — évite un ticket avec un grand vide en bas ou, à
// l'inverse, du contenu coupé.

export interface FactureArticle {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

export interface FactureData {
  numero: string;
  dateISO: string;
  vendeurNom: string;
  vendeurLocalisation: string | null;
  vendeurTelephone: string | null;
  clientNom: string;
  clientTelephone: string | null;
  clientAdresse: string | null;
  clientCommune: string | null;
  clientRepere: string | null;
  livreurNom: string | null;
  livreurTelephone: string | null;
  articles: FactureArticle[];
  montantTotal: number;
  /** true si vendeurs.statut === 'valide' (KYC validé) */
  vendeurVerifie: boolean;
  /** Code HMAC tronqué, généré par lib/pdf/facture-securite.ts */
  codeSecurite: string;
  /** URL publique de /verifier/[numero], encodée dans le QR */
  qrCodeUrl: string;
}

const PAGE_WIDTH = 226; // ~80mm, largeur standard d'un reçu de caisse
const MARGIN_X = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const CORAL = "#D85A30";
const TEAL = "#1D9E75";
const TEAL_LIGHT = "#E1F5EE";
const DARK = "#111827";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#B5BAC2";
const DIVIDER = "#D9DCE1";

function formatMontant(v: number) {
  // Intl.NumberFormat("fr-FR") sépare les milliers avec une espace fine
  // insécable (U+202F). La police Helvetica standard de pdfkit n'a pas ce
  // glyphe et affiche un caractère de remplacement (visuellement un "/").
  // On la remplace par une espace normale, supportée par toutes les polices.
  return new Intl.NumberFormat("fr-FR").format(v).replace(/[\u202F\u00A0]/g, " ") + " F";
}

function dashedLine(doc: PDFKit.PDFDocument, y: number) {
  doc
    .moveTo(MARGIN_X, y)
    .lineTo(PAGE_WIDTH - MARGIN_X, y)
    .lineWidth(0.75)
    .dash(2, { space: 2 })
    .strokeColor(DIVIDER)
    .stroke()
    .undash();
  return y;
}

function sectionLabel(doc: PDFKit.PDFDocument, label: string, y: number) {
  doc.font("Helvetica-Bold").fontSize(7).fillColor(TEAL);
  doc.text(label, MARGIN_X, y, { width: CONTENT_WIDTH, characterSpacing: 1.1 });
  return y + doc.heightOfString(label, { width: CONTENT_WIDTH }) + 5;
}

// Badge pilule "✓ VENDEUR VÉRIFIÉ" — repris du même style/couleur que le
// badge de confiance déjà affiché sur les fiches produit de l'app (icône
// ShieldCheck teal), pour que le vendeur validé KYC en base se voit relié
// à la facture qu'il émet.
function drawBadgeVerifie(doc: PDFKit.PDFDocument, y: number): number {
  const label = "✓ VENDEUR VÉRIFIÉ";
  doc.font("Helvetica-Bold").fontSize(7.5);
  const textWidth = doc.widthOfString(label, { characterSpacing: 0.4 });
  const paddingX = 8;
  const badgeHeight = 15;
  const badgeWidth = textWidth + paddingX * 2;

  doc.roundedRect(MARGIN_X, y, badgeWidth, badgeHeight, badgeHeight / 2).fill(TEAL_LIGHT);
  doc
    .fillColor(TEAL)
    .text(label, MARGIN_X + paddingX, y + 4, { characterSpacing: 0.4, lineBreak: false });

  return y + badgeHeight;
}

// Wordmark "Ayiba" en deux tons (corail/anthracite) + point teal en accent —
// une version simplifiée mais fidèle du logo, dessinée en vecteur (donc
// nette à toute résolution), sans dépendre d'un fichier image à charger.
function drawLogo(doc: PDFKit.PDFDocument, y: number) {
  doc.font("Helvetica-Bold").fontSize(22);
  const wAy = doc.widthOfString("Ay");
  const wIba = doc.widthOfString("iba");
  const startX = MARGIN_X + (CONTENT_WIDTH - (wAy + wIba)) / 2;

  doc.circle(startX + wAy - 4, y - 6, 3).fill(TEAL);

  doc.fillColor(CORAL).text("Ay", startX, y, { continued: true, lineBreak: false });
  doc.fillColor(DARK).text("iba", { continued: false, lineBreak: false });

  return y + doc.heightOfString("Ayiba", { width: CONTENT_WIDTH });
}

function draw(doc: PDFKit.PDFDocument, data: FactureData, qrBuffer: Buffer): number {
  let y = 22;

  y = drawLogo(doc, y) + 14;

  doc.font("Helvetica-Bold").fontSize(11).fillColor(CORAL);
  doc.text("FACTURE", MARGIN_X, y, { width: CONTENT_WIDTH, align: "center", characterSpacing: 1.4 });
  y += doc.heightOfString("FACTURE", { width: CONTENT_WIDTH }) + 3;

  const sousTitre = `${data.numero} · ${new Date(data.dateISO).toLocaleDateString("fr-FR")}`;
  doc.font("Helvetica").fontSize(8).fillColor(GRAY);
  doc.text(sousTitre, MARGIN_X, y, { width: CONTENT_WIDTH, align: "center" });
  y += doc.heightOfString(sousTitre, { width: CONTENT_WIDTH }) + 14;

  y = dashedLine(doc, y) + 14;

  // Vendeur
  y = sectionLabel(doc, "VENDEUR", y);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK);
  doc.text(data.vendeurNom, MARGIN_X, y, { width: CONTENT_WIDTH });
  y += doc.heightOfString(data.vendeurNom, { width: CONTENT_WIDTH }) + 2;
  for (const ligne of [data.vendeurLocalisation, data.vendeurTelephone]) {
    if (!ligne) continue;
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY);
    doc.text(ligne, MARGIN_X, y, { width: CONTENT_WIDTH });
    y += doc.heightOfString(ligne, { width: CONTENT_WIDTH }) + 2;
  }
  if (data.vendeurVerifie) {
    y += 3;
    y = drawBadgeVerifie(doc, y);
  }
  y += 8;

  y = dashedLine(doc, y) + 14;

  // Client
  y = sectionLabel(doc, "CLIENT", y);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK);
  doc.text(data.clientNom, MARGIN_X, y, { width: CONTENT_WIDTH });
  y += doc.heightOfString(data.clientNom, { width: CONTENT_WIDTH }) + 2;
  for (const ligne of [data.clientTelephone, data.clientAdresse, data.clientCommune]) {
    if (!ligne) continue;
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY);
    doc.text(ligne, MARGIN_X, y, { width: CONTENT_WIDTH });
    y += doc.heightOfString(ligne, { width: CONTENT_WIDTH }) + 2;
  }
  if (data.clientRepere) {
    // Mis en avant (gras + teal) : contrairement à l'adresse administrative
    // ci-dessus, c'est ce repère qui aide réellement à localiser la maison
    // à Calavi (pas de rues nommées/numérotées dans la zone).
    const repereTexte = `Repère : ${data.clientRepere}`;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(TEAL);
    doc.text(repereTexte, MARGIN_X, y, { width: CONTENT_WIDTH });
    y += doc.heightOfString(repereTexte, { width: CONTENT_WIDTH }) + 2;
  }
  y += 8;

  // Livreur (uniquement si assigné)
  if (data.livreurNom) {
    y = dashedLine(doc, y) + 14;
    y = sectionLabel(doc, "LIVREUR ASSIGNÉ", y);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK);
    doc.text(data.livreurNom, MARGIN_X, y, { width: CONTENT_WIDTH });
    y += doc.heightOfString(data.livreurNom, { width: CONTENT_WIDTH }) + 2;
    if (data.livreurTelephone) {
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY);
      doc.text(data.livreurTelephone, MARGIN_X, y, { width: CONTENT_WIDTH });
      y += doc.heightOfString(data.livreurTelephone, { width: CONTENT_WIDTH }) + 2;
    }
    y += 8;
  }

  y = dashedLine(doc, y) + 14;

  // Articles
  y = sectionLabel(doc, "ARTICLES", y);
  if (data.articles.length === 0) {
    doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(GRAY);
    const vide = "Aucun détail d'article";
    doc.text(vide, MARGIN_X, y, { width: CONTENT_WIDTH });
    y += doc.heightOfString(vide, { width: CONTENT_WIDTH }) + 6;
  } else {
    data.articles.forEach((a) => {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
      doc.text(a.nom, MARGIN_X, y, { width: CONTENT_WIDTH });
      y += doc.heightOfString(a.nom, { width: CONTENT_WIDTH }) + 2;

      const detailLigne = `${a.quantite} × ${formatMontant(a.prix_unitaire)}`;
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY);
      doc.text(detailLigne, MARGIN_X, y, { width: CONTENT_WIDTH * 0.6 });

      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
      const totalLigne = formatMontant(a.total);
      doc.text(totalLigne, MARGIN_X, y, { width: CONTENT_WIDTH, align: "right" });

      y +=
        Math.max(
          doc.heightOfString(detailLigne, { width: CONTENT_WIDTH * 0.6 }),
          doc.heightOfString(totalLigne, { width: CONTENT_WIDTH })
        ) + 10;
    });
  }

  y = dashedLine(doc, y) + 16;

  // Total
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GRAY);
  doc.text("TOTAL", MARGIN_X, y + 5, { width: CONTENT_WIDTH * 0.4, characterSpacing: 0.8 });
  doc.font("Helvetica-Bold").fontSize(16).fillColor(CORAL);
  const totalTexte = formatMontant(data.montantTotal);
  doc.text(totalTexte, MARGIN_X, y, { width: CONTENT_WIDTH, align: "right" });
  y += doc.heightOfString(totalTexte, { width: CONTENT_WIDTH }) + 20;

  y = dashedLine(doc, y) + 18;

  // Authenticité : QR de vérification + code de sécurité en clair, pour une
  // vérification même sans caméra ni connexion (comparaison visuelle avec
  // le code affiché sur la page).
  y = sectionLabel(doc, "AUTHENTICITÉ", y) + 20;

  const qrSize = 76;
  const qrX = MARGIN_X + (CONTENT_WIDTH - qrSize) / 2;

  doc.image(qrBuffer, qrX, y, { width: qrSize, height: qrSize });
  y += qrSize + 14;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
  const codeTexte = `CODE : ${data.codeSecurite}`;
  doc.text(codeTexte, MARGIN_X, y, { width: CONTENT_WIDTH, align: "center", characterSpacing: 0.6 });
  y += doc.heightOfString(codeTexte, { width: CONTENT_WIDTH }) + 4;

  doc.font("Helvetica").fontSize(7).fillColor(GRAY);
  const scanTexte = "Scannez le QR ou saisissez le code sur la page de vérification Ayiba";
  doc.text(scanTexte, MARGIN_X, y, { width: CONTENT_WIDTH, align: "center" });
  y += doc.heightOfString(scanTexte, { width: CONTENT_WIDTH }) + 20;

  y = dashedLine(doc, y) + 16;

  // Pied de page
  doc.font("Helvetica").fontSize(7).fillColor(LIGHT_GRAY);
  const footer1 = "Ayiba Marketplace — document généré automatiquement";
  doc.text(footer1, MARGIN_X, y, { width: CONTENT_WIDTH, align: "center" });
  y += doc.heightOfString(footer1, { width: CONTENT_WIDTH }) + 3;

  const footer2 = `Généré le ${new Date().toLocaleString("fr-FR")}`;
  doc.text(footer2, MARGIN_X, y, { width: CONTENT_WIDTH, align: "center" });
  y += doc.heightOfString(footer2, { width: CONTENT_WIDTH }) + 20;

  return y;
}

export async function genererFacturePDF(data: FactureData): Promise<Buffer> {
  // Le QR est généré une seule fois, en amont (async) : draw() reste
  // volontairement synchrone pour pouvoir être appelée deux fois à
  // l'identique (mesure puis rendu final) sans dupliquer l'appel réseau/CPU
  // de génération du QR.
  const qrBuffer = await QRCode.toBuffer(data.qrCodeUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
  });

  // Passe 1 (mesure) : page volontairement très haute, on ne garde que la
  // position finale — le nombre d'articles étant variable, impossible de
  // connaître la hauteur exacte du ticket sans dessiner le contenu une
  // première fois.
  const mesureDoc = new PDFDocument({
    size: [PAGE_WIDTH, 4000],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  mesureDoc.on("data", () => {});
  const hauteurFinale = draw(mesureDoc, data, qrBuffer);
  mesureDoc.end();

  // Passe 2 (finale) : document à la hauteur exacte du contenu, look
  // "ticket de caisse" qui s'arrête pile après le pied de page.
  const doc = new PDFDocument({
    size: [PAGE_WIDTH, Math.ceil(hauteurFinale) + 4],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: { Title: `Facture ${data.numero}`, Author: "Ayiba Marketplace" },
  });
  const chunks: Buffer[] = [];
  const fini = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  draw(doc, data, qrBuffer);
  doc.end();
  return fini;
}
