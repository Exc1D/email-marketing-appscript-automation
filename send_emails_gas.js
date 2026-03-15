// ── Config ────────────────────────────────────────────────────────────────────

const SENDER   = 'davdlaurence.a.cig@gmail.com';
const CC       = 'virginia@consultareinc.com';
const TEST_ADDR = 'davidaviado.dla@gmail.com';
const SHEET_NAME = 'Leads';
const LOG_SHEET  = 'Send Log';

// Banner images stored in personal Google Drive (not company files)
const IMG_BANNER1_ID = '13iVinLZ2hwDbMn8zdik7bDD59qqDEtqB'; // image3.png (top banner)
const IMG_BANNER2_ID = '1VSqPYsiTomE855fO9LQ4C0G25W2hAmT8'; // image1.png (middle banner)
const IMG_BANNER3_ID = '192Ezh2Oz_CiLjDL74p67xe0DWnftql2P'; // image2.png (bottom banner)

const ACRONYMS = new Set([
  'LLC','INC','CORP','USA','FDA','CBP','USDA','EPA',
  'IOR','FSVP','CO','LTD','PBC','DBA','LP','NA',
]);

// ── Template (embedded — no Drive access needed) ───────────────────────────────

const TEMPLATE_SUBJECT =
  '(Company/Vendor Name) - Are Your Imports Fully FSVP-Compliant? End-to-End Support Available - (Date YYYYMMDD - e.g. 20260311)';

const TEMPLATE_BODY = `<p>Hi [First Name/Company Name],</p><p>Greetings!</p><p>FDA Foreign Supplier Verification Program (FSVP) compliance places <strong>legal responsibility on the Importer</strong>&mdash;not only to maintain documentation, but to <strong>evaluate suppliers, verify products, approve shipments, and defend compliance during FDA inspections</strong>.</p><p>At <strong>Consultare Inc. Group (</strong><strong><a href="http://fsvpservices.com">FSVPServices.com</a></strong><strong>)</strong>, we provide <strong>end-to-end FSVP and import compliance services</strong>&nbsp;designed specifically for <strong>U.S. importers, foreign manufacturers, and brand owners</strong>&mdash;covering <strong>every compliance level FDA and CBP inspect</strong>.</p><h3><strong>Our FSVP &amp; Import Compliance Services by Required Level</strong></h3><h3><strong>1. Importer (Company)-Level FSVP Compliance</strong></h3><p>We establish, manage, and maintain your importer-level FSVP program under <strong>21 CFR Part 1 Subpart L</strong>, including:</p><ul><li>FSVP Agent &amp; U.S. Agent representation</li><li>Importer of Record (IOR) compliance support</li><li>FSVP Qualified Individual (FSVPQI) designation and oversight</li><li>FDA Facility Registration &amp; biennial renewal monitoring</li><li>D-U-N-S&reg; registration support</li><li>Importer identity, recordkeeping, and regulatory accountability</li><li>Ongoing FSVP program maintenance, reanalysis, and audit readiness</li></ul><h3><strong>2. Facility / Supplier-Level Verification</strong></h3><p>We perform <strong>risk-based supplier evaluation and approval</strong>, not just document collection:</p><ul><li>Supplier hazard analysis review</li><li>Evaluation of food safety controls, GMPs, and preventive controls</li><li>FDA compliance history, Import Alert &amp; Warning Letter screening</li><li>Supplier approval, conditional approval, or disqualification</li><li>Corrective action review and effectiveness verification</li><li>Annual supplier reanalysis as required under &sect;1.505</li><li>Audit-ready supplier records maintained by the FSVPQI</li></ul><h3><strong>3. Product / Material-Level Compliance (SKU-Specific)</strong></h3><p>FSVP is <strong>product-specific</strong>&mdash;we ensure each SKU meets FDA requirements:</p><ul><li>Product hazard analysis (biological, chemical, physical)</li><li>Ingredient, allergen, and formulation review</li><li>Product specification and COA verification</li><li>Risk level determination and verification frequency</li><li>Annual product reanalysis and trigger-event review</li><li>Label regulatory compliance review (21 CFR Part 101), when required</li></ul><h3><strong>4. Shipment-Level &amp; Entry Compliance</strong></h3><p>We support <strong>actual shipment release</strong>, not just program setup:</p><ul><li>FSVP / IOR Shipment Intake &amp; Compliance Questionnaire review</li><li>FDA Prior Notice verification</li><li>Shipment document review (invoice, packing list, BOL/AWB)</li><li>Batch, lot coding, and traceability assessment</li><li>Sanitary Transportation documentation review</li><li>Shipment-level risk assessment</li><li>Approval, conditional approval, or non-approval of shipments</li><li>Record retention for FDA and CBP inspections</li></ul><h3><strong>5. Multi-Agency Import Compliance Coverage</strong></h3><p>Our services extend beyond FDA when applicable:</p><ul><li>CBP documentation coordination &amp; entry support</li><li>Customs broker facilitation (non-broker role)</li><li>USDA permits, phytosanitary &amp; veterinary documentation</li><li>EPA / TSCA certifications for packaging and materials</li><li>UFLPA forced labor review support</li><li>AD/CVD screening assistance</li></ul><h3><strong>Why Importers Work With Consultare Inc. Group</strong></h3><ul><li><strong>Importer-focused accountability</strong>&nbsp;aligned with FDA enforcement</li><li><strong>Shipment approval authority</strong>&nbsp;backed by documented risk analysis</li><li><strong>Audit &amp; inspection defense support</strong>&nbsp;during FDA reviews</li><li><strong>Scalable services</strong>&nbsp;for multi-supplier and multi-SKU portfolios</li></ul><p><strong>Supporting Tools &amp; Training (Optional Add-On)</strong></p><p>Clients may also choose to avail our FSVP and Importer Compliance Management Software and structured training&mdash;tools designed to enhance documentation, tracking, and audit readiness&mdash;available as an additional service alongside our expert-led FSVP execution.</p><p>Organizations that want a <strong>structured digital compliance workspace</strong>&nbsp;may also utilize our compliance management platform<a href="https://systemsbuilderpro.pario.io/register?ref=SBP-BY8PXGB">&nbsp;</a><strong><a href="https://systemsbuilderpro.pario.io/register?ref=SBP-BY8PXGB">SystemsBuilder.pro</a></strong>, which supports documentation management, regulatory tracking, and structured compliance workflows across FDA and other regulatory frameworks.</p><p>To allow organizations to explore the platform, we are offering a<a href="https://systemsbuilderpro.pario.io/r/SBP-BY8PXGB">&nbsp;</a><strong><a href="https://systemsbuilderpro.pario.io/r/SBP-BY8PXGB">FREE PASS Account</a></strong>&nbsp;with access to the compliance workspace and core features.</p><p>Activate your <strong>FREE PASS Account here:<br></strong><a href="https://systemsbuilderpro.pario.io/r/SBP-BY8PXGB">https://systemsbuilderpro.pario.io/r/SBP-BY8PXGB</a></p><p><strong>Start your FSVP and import compliance journey with a team that executes, approves, and stands behind your compliance.</strong></p><p><strong>Schedule your meeting here:<br></strong><strong><a href="https://calendar.app.google/mG7xMfRcTpeNMXVv7">https://calendar.app.google/mG7xMfRcTpeNMXVv7</a></strong></p><p>Best regards,</p><p>David Aviado</p><p>Customer Success Representative</p><p>Consultare Inc. Group</p><p>202-982-3002</p><p><em>Begin your free compliance management system software, training, and end-to-end support journey today.</em></p><p><img src="cid:banner1" alt="" width="624"></p><p><img src="cid:banner2" alt="" width="624"></p><p><img src="cid:banner3" alt="" width="624"></p><p><em>If you no longer wish to receive emails from us, simply reply with &quot;Unsubscribe&quot; in the subject line or body of your message.</em></p>`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function properCase(name) {
  if (!name) return '';
  return name.split(/(\s+|,)/).map(word => {
    const clean = word.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (ACRONYMS.has(clean)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}

function isValidEmail(email) {
  if (!email) return false;
  const invalid = ['', 'not found', 'unclear', 'not available'];
  if (invalid.includes(email.trim().toLowerCase())) return false;
  if (email.trim().endsWith('.')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function buildEmail(lead) {
  const company    = properCase(lead.firmName);
  const contactRaw = (lead.contactPerson || '').trim();
  const greeting   = contactRaw ? properCase(contactRaw.split(' ')[0]) : company;
  const today      = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');

  let subject  = TEMPLATE_SUBJECT;
  let bodyHtml = TEMPLATE_BODY;

  // Subject replacements
  subject = subject.replace('(Company/Vendor Name)', company);
  subject = subject.replace(/\(Date YYYYMMDD[^)]*\)/g, today);
  subject = subject.replace(/\u00a0/g, ' ').trim();

  // Body replacements
  bodyHtml = bodyHtml.replace(/\[First Name\/Company Name\]/g, greeting);
  bodyHtml = bodyHtml.replace(/\(Company\/Vendor Name\)/g, company);
  bodyHtml = bodyHtml.replace(/\(Date YYYYMMDD[^)]*\)/g, today);

  return { subject, bodyHtml };
}

// ── Core send ─────────────────────────────────────────────────────────────────

function _doSend(isTest) {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const sheet    = ss.getSheetByName(SHEET_NAME);
  const logSheet = ss.getSheetByName(LOG_SHEET);

  if (!sheet)    throw new Error('Sheet "' + SHEET_NAME + '" not found. Run setup() first.');
  if (!logSheet) throw new Error('Sheet "' + LOG_SHEET  + '" not found. Run setup() first.');

  // Scan: mark invalid-email Pending rows as Invalid; find first valid Pending lead
  const data = sheet.getDataRange().getValues();
  let targetRowIdx = -1;
  let lead = null;

  for (let i = 1; i < data.length; i++) {
    const [row, firmName, state, email, phone, contactPerson, status] = data[i];
    if (status !== 'Pending') continue;
    if (!isValidEmail(String(email))) {
      sheet.getRange(i + 1, 7).setValue('Invalid');
      continue;
    }
    if (targetRowIdx === -1) {
      targetRowIdx = i + 1;
      lead = { row, firmName, state, email, phone, contactPerson };
    }
  }

  if (!targetRowIdx) {
    Logger.log('No pending leads. ' + (isTest ? '' : 'Removing trigger.'));
    if (!isTest) _deleteTrigger();
    return;
  }

  const { subject, bodyHtml } = buildEmail(lead);
  const toAddr = isTest ? TEST_ADDR : String(lead.email).trim();

  const inlineImages = {
    banner1: DriveApp.getFileById(IMG_BANNER1_ID).getBlob(),
    banner2: DriveApp.getFileById(IMG_BANNER2_ID).getBlob(),
    banner3: DriveApp.getFileById(IMG_BANNER3_ID).getBlob(),
  };

  try {
    GmailApp.sendEmail(toAddr, subject, '', {
      htmlBody: bodyHtml,
      cc: isTest ? '' : CC,
      name: 'David Laurence',
      inlineImages,
    });
  } catch (e) {
    logSheet.appendRow([new Date().toISOString(), lead.row, lead.firmName, toAddr, 'send-error: ' + e.message]);
    Logger.log('Send error: ' + e.message);
    return;
  }

  if (!isTest) {
    sheet.getRange(targetRowIdx, 7).setValue('Sent');
  }

  logSheet.appendRow([
    new Date().toISOString(), lead.row, lead.firmName, toAddr,
    isTest ? 'test-sent' : 'sent',
  ]);
  Logger.log((isTest ? '[TEST] ' : '') + 'Sent to ' + toAddr + ' (' + lead.firmName + ')');

  if (!isTest) {
    const pending = sheet.getRange(2, 7, sheet.getLastRow() - 1, 1)
      .getValues().filter(([s]) => s === 'Pending').length;
    if (pending === 0) {
      Logger.log('All leads sent. Removing trigger.');
      _deleteTrigger();
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Called by time trigger every 5 min. */
function sendOneEmail() { _doSend(false); }

/** Run manually to test. Sends to TEST_ADDR, does NOT mark lead Sent. */
function sendTest() { _doSend(true); }

/** Install (or re-install) the 5-minute trigger. */
function installTrigger() {
  _deleteTrigger();
  ScriptApp.newTrigger('sendOneEmail').timeBased().everyMinutes(5).create();
  Logger.log('Trigger installed: sendOneEmail every 5 minutes.');
}

/** One-time setup: creates Send Log sheet + trigger. Run after importing CSV. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName(SHEET_NAME)) {
    ss.insertSheet(SHEET_NAME);
    Logger.log('Created "' + SHEET_NAME + '" sheet. Import the CSV now, then run setup() again.');
    return;
  }

  if (!ss.getSheetByName(LOG_SHEET)) {
    const log = ss.insertSheet(LOG_SHEET);
    log.getRange(1, 1, 1, 5).setValues([['Timestamp','Row','Firm','To','Status']]);
  }

  Logger.log('Setup complete.');
  installTrigger();
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _deleteTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendOneEmail') ScriptApp.deleteTrigger(t);
  });
}
