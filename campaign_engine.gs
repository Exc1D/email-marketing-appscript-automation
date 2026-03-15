// ── Helpers ───────────────────────────────────────────────────────────────────

var _acronymSet = new Set(CAMPAIGN_CONFIG.acronyms);

function properCase(name) {
  if (!name) return '';
  return name.split(/(\s+|,)/).map(function(word) {
    var clean = word.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (_acronymSet.has(clean)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}

function isValidEmail(email) {
  if (!email) return false;
  var trimmed = String(email).trim();
  var invalid = ['', 'not found', 'unclear', 'not available'];
  if (invalid.indexOf(trimmed.toLowerCase()) !== -1) return false;
  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  var parts = trimmed.split('@');
  var local = parts[0];
  var domain = parts[1];
  // Leading/trailing dots in local part
  if (local.charAt(0) === '.' || local.charAt(local.length - 1) === '.') return false;
  // Leading dot in domain
  if (domain.charAt(0) === '.') return false;
  // Trailing dot in domain
  if (domain.charAt(domain.length - 1) === '.') return false;
  // Consecutive dots anywhere
  if (trimmed.indexOf('..') !== -1) return false;
  // Single-char TLD
  var tld = domain.split('.').pop();
  if (tld.length < 2) return false;
  return true;
}

// Precondition: isValidEmail(email) === true (email contains exactly one @)
function detectTypoDomain(email) {
  var domain = String(email).trim().split('@')[1].toLowerCase();
  var suggestion = CAMPAIGN_CONFIG.typoDomains[domain];
  if (suggestion) {
    return { isTypo: true, suggestion: suggestion };
  }
  return { isTypo: false };
}

// Supports columns A-Z (0-25). Extend for AA+ if needed.
function _colLetter(colIndex) {
  return String.fromCharCode(65 + colIndex);
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildEmail(lead) {
  var company = properCase(lead.firmName);
  var contactRaw = (lead.contactPerson || '').trim();
  var greeting;
  if (CAMPAIGN_CONFIG.useContactPerson && contactRaw) {
    greeting = properCase(contactRaw.split(' ')[0]);
  } else {
    greeting = company;
  }
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');

  var subject = CAMPAIGN_CONFIG.subject;
  var bodyHtml = CAMPAIGN_CONFIG.bodyHtml;

  // Subject replacements
  subject = subject.replace('(Company/Vendor Name)', company);
  subject = subject.replace(/\(Date YYYYMMDD[^)]*\)/g, today);
  subject = subject.replace(/\u00a0/g, ' ').trim();

  // Body replacements
  bodyHtml = bodyHtml.replace(/\[First Name\/Company Name\]/g, greeting);
  bodyHtml = bodyHtml.replace(/\(Company\/Vendor Name\)/g, company);
  bodyHtml = bodyHtml.replace(/\(Date YYYYMMDD[^)]*\)/g, today);

  return { subject: subject, bodyHtml: bodyHtml };
}

function _getInlineImages() {
  var images = {};
  CAMPAIGN_CONFIG.banners.forEach(function(b) {
    images[b.cid] = DriveApp.getFileById(b.driveId).getBlob();
  });
  return images;
}

// ── Core send ─────────────────────────────────────────────────────────────────

function _doSend(isTest) {
  var cfg = CAMPAIGN_CONFIG;
  var cols = cfg.columns;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(cfg.sheetName);
  var logSheet = ss.getSheetByName(cfg.logSheet);

  if (!sheet) throw new Error('Sheet "' + cfg.sheetName + '" not found. Run setup() first.');
  if (!logSheet) throw new Error('Sheet "' + cfg.logSheet + '" not found. Run setup() first.');

  var data = sheet.getDataRange().getValues();
  var statusColLetter = _colLetter(cols.status);
  var lead = null;
  var targetRowIdx = -1;
  var validPendingCount = 0;
  var invalidRanges = [];
  var typoRanges = [];
  var typoLogEntries = [];
  var timestamp = new Date().toISOString();

  // Scan all Pending rows (full pass — surfaces all Invalid/Typo in one invocation)
  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    if (rowData[cols.status] !== 'Pending') continue;

    var email = String(rowData[cols.email]);
    var firmName = rowData[cols.firmName];
    var sheetRow = i + 1; // 1-based row number

    // (1) Structural validation
    if (!isValidEmail(email)) {
      invalidRanges.push(statusColLetter + sheetRow);
      continue;
    }

    // (2) Typo detection
    var typoResult = detectTypoDomain(email);
    if (typoResult.isTypo) {
      typoRanges.push(statusColLetter + sheetRow);
      typoLogEntries.push([timestamp, rowData[cols.row], firmName, email, 'typo: suggested ' + typoResult.suggestion]);
      continue;
    }

    // (3) Eligible — count all valid rows; assign first as send target
    validPendingCount++;
    if (lead === null) {
      targetRowIdx = sheetRow;
      lead = {
        row: rowData[cols.row],
        firmName: firmName,
        state: rowData[cols.state],
        email: email,
        phone: rowData[cols.phone],
        contactPerson: rowData[cols.contactPerson],
      };
    }
  }

  // Batch-write all status updates + log typos
  try {
    if (invalidRanges.length > 0) {
      sheet.getRangeList(invalidRanges).setValue('Invalid');
    }
    if (typoRanges.length > 0) {
      sheet.getRangeList(typoRanges).setValue('Typo');
    }
    typoLogEntries.forEach(function(entry) {
      logSheet.appendRow(entry);
    });
  } catch (e) {
    Logger.log('[' + cfg.name + '] Batch-write error: ' + e.message);
    return;
  }

  // No valid send target found
  if (lead === null) {
    Logger.log('[' + cfg.name + '] No pending leads.' + (isTest ? '' : ' Removing trigger.'));
    if (!isTest) _deleteTrigger();
    return;
  }

  // Build email and fetch banner images
  var built = buildEmail(lead);
  var toAddr = isTest ? cfg.testAddr : String(lead.email).trim();
  var inlineImages = _getInlineImages();

  // Send
  try {
    GmailApp.sendEmail(toAddr, built.subject, '', {
      htmlBody: built.bodyHtml,
      cc: isTest ? '' : cfg.cc,
      name: cfg.senderName,
      inlineImages: inlineImages,
    });
  } catch (e) {
    sheet.getRange(targetRowIdx, cols.status + 1).setValue('send-error');
    logSheet.appendRow([timestamp, lead.row, lead.firmName, toAddr, 'send-error: ' + e.message]);
    Logger.log('[' + cfg.name + '] Send error: ' + e.message);
    return;
  }

  // Mark sent in sheet (skip in test mode)
  if (!isTest) {
    sheet.getRange(targetRowIdx, cols.status + 1).setValue('Sent');
  }

  logSheet.appendRow([timestamp, lead.row, lead.firmName, toAddr, isTest ? 'test-sent' : 'sent']);
  Logger.log('[' + cfg.name + '] ' + (isTest ? '[TEST] ' : '') + 'Sent to ' + toAddr + ' (' + lead.firmName + ')');

  // Auto-remove trigger when no valid pending leads remain
  if (!isTest) {
    var remaining = validPendingCount - 1;
    if (remaining <= 0) {
      Logger.log('[' + cfg.name + '] All leads sent. Removing trigger.');
      _deleteTrigger();
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Called by time trigger every 5 min. */
function sendOneEmail() { _doSend(false); }

/** Run manually to test. Sends to testAddr, does NOT mark lead Sent. */
function sendTest() { _doSend(true); }

/** Install (or re-install) the 5-minute trigger. */
function installTrigger() {
  _deleteTrigger();
  ScriptApp.newTrigger('sendOneEmail').timeBased().everyMinutes(5).create();
  Logger.log('[' + CAMPAIGN_CONFIG.name + '] Trigger installed: sendOneEmail every 5 minutes.');
}

/**
 * One-time setup: creates Leads sheet (if missing) and Send Log sheet (if missing).
 * Run after importing your CSV. Does NOT install the trigger — run sendTest() first
 * to verify the email, then run installTrigger() to begin automated sending.
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = CAMPAIGN_CONFIG;

  if (!ss.getSheetByName(cfg.sheetName)) {
    ss.insertSheet(cfg.sheetName);
    Logger.log('[' + cfg.name + '] Created "' + cfg.sheetName + '" sheet. Import the CSV now, then run setup() again.');
    return;
  }

  if (!ss.getSheetByName(cfg.logSheet)) {
    var log = ss.insertSheet(cfg.logSheet);
    log.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Row', 'Firm', 'To', 'Status']]);
  }

  Logger.log('[' + cfg.name + '] Setup complete. Run sendTest() to verify, then installTrigger() to begin sending.');
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _deleteTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendOneEmail') ScriptApp.deleteTrigger(t);
  });
}

// ── Tests (run manually in GAS editor) ───────────────────────────────────────

/**
 * Tests all pure helper functions. Run from the GAS editor (select runTests,
 * click Run) and check the Execution Log for results.
 * Note: buildEmail depends on GAS APIs and is verified via sendTest() instead.
 */
function runTests() {
  var pass = 0;
  var fail = 0;

  function assert(label, actual, expected) {
    if (actual === expected) {
      pass++;
    } else {
      fail++;
      Logger.log('FAIL: ' + label + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }
  }

  function assertObj(label, actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      pass++;
    } else {
      fail++;
      Logger.log('FAIL: ' + label + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }
  }

  // properCase
  assert('properCase: normal name', properCase('john doe'), 'John Doe');
  assert('properCase: acronym LLC', properCase('acme llc'), 'Acme LLC');
  assert('properCase: acronym CORP', properCase('acme corp'), 'Acme CORP');
  assert('properCase: empty string', properCase(''), '');
  assert('properCase: null', properCase(null), '');
  assert('properCase: with comma', properCase('smith, john'), 'Smith, John');

  // isValidEmail — valid cases
  assert('email: valid basic', isValidEmail('user@example.com'), true);
  assert('email: valid subdomain', isValidEmail('user@mail.example.com'), true);
  assert('email: valid with dot in local', isValidEmail('user.name@example.com'), true);

  // isValidEmail — invalid cases
  assert('email: empty string', isValidEmail(''), false);
  assert('email: null', isValidEmail(null), false);
  assert('email: placeholder not found', isValidEmail('not found'), false);
  assert('email: placeholder unclear', isValidEmail('Unclear'), false);
  assert('email: placeholder not available', isValidEmail('not available'), false);
  assert('email: no @', isValidEmail('userexample.com'), false);
  assert('email: no domain', isValidEmail('user@'), false);
  assert('email: no TLD', isValidEmail('user@domain'), false);
  assert('email: trailing dot', isValidEmail('user@domain.'), false);
  assert('email: leading dot local', isValidEmail('.user@domain.com'), false);
  assert('email: trailing dot local', isValidEmail('user.@domain.com'), false);
  assert('email: leading dot domain', isValidEmail('user@.domain.com'), false);
  assert('email: consecutive dots local', isValidEmail('user..name@domain.com'), false);
  assert('email: consecutive dots domain', isValidEmail('user@domain..com'), false);
  assert('email: single char TLD', isValidEmail('user@domain.c'), false);
  assert('email: space before @', isValidEmail('user @domain.com'), false);

  // detectTypoDomain
  assertObj('typo: gmial.com', detectTypoDomain('user@gmial.com'), { isTypo: true, suggestion: 'gmail.com' });
  assertObj('typo: yaho.com', detectTypoDomain('user@yaho.com'), { isTypo: true, suggestion: 'yahoo.com' });
  assertObj('typo: outlok.com', detectTypoDomain('user@outlok.com'), { isTypo: true, suggestion: 'outlook.com' });
  assertObj('typo: hotmal.com', detectTypoDomain('user@hotmal.com'), { isTypo: true, suggestion: 'hotmail.com' });
  assertObj('typo: valid gmail.com', detectTypoDomain('user@gmail.com'), { isTypo: false });
  assertObj('typo: valid yahoo.com', detectTypoDomain('user@yahoo.com'), { isTypo: false });
  assertObj('typo: valid company domain', detectTypoDomain('user@consultareinc.com'), { isTypo: false });

  // _colLetter
  assert('colLetter: 0 = A', _colLetter(0), 'A');
  assert('colLetter: 6 = G', _colLetter(6), 'G');
  assert('colLetter: 25 = Z', _colLetter(25), 'Z');

  Logger.log('───────────────────────────────────────');
  Logger.log('Tests complete: ' + pass + ' passed, ' + fail + ' failed.');
  if (fail === 0) Logger.log('All tests passed!');
}
