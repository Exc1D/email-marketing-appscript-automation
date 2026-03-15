// ── Config ────────────────────────────────────────────────────────────────────

const SENDER    = 'davdlaurence.a.cig@gmail.com';
const CC        = 'virginia@consultareinc.com';
const TEST_ADDR = 'davidaviado.dla@gmail.com';
const SHEET_NAME = 'SQF Leads';
const LOG_SHEET  = 'SQF Send Log';

// Banner images stored in personal Google Drive — fill in after uploading
const IMG_BANNER1_ID = '1akcWIReTlaA7fL3C6VuUoe4jDLHWcyvH'; // top banner
const IMG_BANNER2_ID = '1SwKK3jZ0pYpbdjDkrsMikwRG_NgXYhZx'; // bottom banner

const ACRONYMS = new Set([
  'LLC','INC','CORP','USA','FDA','CBP','USDA','EPA',
  'IOR','FSVP','SQF','GFSI','ISO','CO','LTD','PBC','DBA','LP','NA',
]);

// ── Template (embedded — no Drive access needed) ───────────────────────────────

const TEMPLATE_SUBJECT =
  '(Company/Vendor Name) - SQF Edition 10 Has Arrived \u2014 Is Your Facility Ready for the Transition? - (Date YYYYMMDD - e.g. 20260311)';

const TEMPLATE_BODY = `<p>Hi [First Name/Company Name],</p><p>Greetings!</p><p>With the release of <strong>SQF Edition 10 from the Safe Quality Food Institute</strong>, organizations pursuing or maintaining SQF certification are reviewing their food safety management systems, documentation, and operational controls to ensure alignment with the updated requirements before their next certification audit.</p><p>Edition 10 introduces several important updates affecting how organizations structure and manage their SQF systems.</p><p><strong>Key updates include:</strong></p><ul style="list-style:none;padding:0;margin:0;"><li><strong>Food Safety Culture</strong>&nbsp;&ndash; Stronger expectations for leadership engagement, communication, and continuous improvement.</li><li><strong>Change Management</strong>&nbsp;&ndash; Documented procedures are expected to manage operational changes such as processes, suppliers, equipment, or ingredients.</li><li><strong>Risk-Based Environmental Monitoring</strong>&nbsp;&ndash; Monitoring programs should be designed based on risk rather than a uniform approach.</li><li><strong>Food Sector Category (FSC) Updates</strong>&nbsp;&ndash; Some categories have been revised or consolidated, potentially affecting certification scope.</li><li><strong>Personnel Competency</strong>&nbsp;&ndash; Increased focus on training effectiveness and documented employee competency.</li></ul><p>To support organizations navigating these updates, <strong>Consultare Inc. Group provides two integrated solution</strong></p><p><strong>End-to-End SQF Compliance Support</strong></p><p>Through <strong><a href="http://foodsafetysystems.pro">FoodSafetySystems.pro</a></strong>, we provide expert support to help organizations implement, manage, and maintain SQF systems.</p><p>Our services include:</p><p>&bull; SQF system implementation and program development<br>&bull; Documentation, procedures, and record system alignment<br>&bull; Gap assessments and audit readiness preparation<br>&bull; Ongoing compliance management and system maintenance</p><p><strong>AI-Powered Compliance Management Platform</strong></p><p>Organizations can also manage their compliance programs using our digital platform:</p><p><strong><a href="https://systemsbuilderpro.pario.io/r/SBP-N0COIR7">SystemsBuilder.pro</a></strong></p><p>We are offering a <strong><a href="https://systemsbuilderpro.pario.io/r/SBP-N0COIR7">FREE PASS Account</a></strong> so organizations can explore the platform.</p><p>Activate your <strong>FREE PASS Account</strong>:<br><a href="https://systemsbuilderpro.pario.io/r/SBP-N0COIR7">https://systemsbuilderpro.pario.io/r/SBP-N0COIR7</a></p><p>With <a href="https://systemsbuilderpro.pario.io/r/SBP-N0COIR7">SystemsBuilderPro</a>,&nbsp;organizations can:</p><p>&bull; Manage <strong>10,000+ mapped compliance requirements</strong>&nbsp;across FDA, ISO, GFSI, and other frameworks<br>&bull; Automate documentation, policies, and compliance records<br>&bull; Stay <strong>continuously audit-ready</strong>&nbsp;with structured templates and version control<br>&bull; Use <strong>AskSAM &mdash; the AI compliance assistant</strong>&nbsp;to answer regulatory questions, draft documents, and track compliance tasks<br>&bull; Launch a fully structured compliance workspace in minutes</p><p>Many organizations are using the transition to <strong>SQF Edition 10</strong>&nbsp;as an opportunity to <strong>modernize their compliance systems, reduce manual documentation work, and strengthen audit readiness.</strong></p><p>You may activate your <strong><a href="https://systemsbuilderpro.pario.io/r/SBP-N0COIR7">FREE PASS Account</a></strong>&nbsp;to explore the platform, or schedule a short discussion to see how we can support your organization with <strong>both system implementation and ongoing compliance management.</strong></p><p><strong>&#128197; Schedule your meeting here:</strong></p><p><strong><a href="https://calendar.app.google/gHsyJ6Pe2wQQdEzo9">SQF Standards and Requirements Discussion</a></strong></p><p>Best regards,</p><p>David Aviado<br>Customer Success Representative<br>Consultare Inc. Group</p><p>202-982-3002</p><p><strong><em>Begin your free compliance management system software, training, and end-to-end support journey today.</em></strong></p><p><img src="cid:banner1" alt="" width="624"></p><p><img src="cid:banner2" alt="" width="624"></p><p><em>If you no longer wish to receive emails from us, simply reply with &quot;Unsubscribe&quot; in the subject line or body of your message.</em></p>`;

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
  const greeting   = company;
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
