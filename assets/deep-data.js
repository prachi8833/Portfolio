/* Portfolio content for the deep-dive layer. All names, numbers and records in UI previews are sample data. */
window.PF_DATA = (function () {
  const ENV = 'Power Automate · cloud flow';
  const flows = {
    intro: {
      name: 'IT – Send IT Intro Emails', env: ENV,
      desc: 'Sends new hires topic-specific IT onboarding emails. IT ticks a Yes/No column on the hire\'s list item and the matching email goes out — each branch fires only when its own column has just changed to “Yes”, so edits never re-send.',
      nodes: [
        { k: 'trigger', t: 'When an item is created or modified', d: 'SharePoint list · polls every 1 minute' },
        { k: 'sp', t: 'Get changes for an item or a file (properties only)', d: 'Exposes ColumnHasChanged/<Column> for every field' },
        { title: 'Nine parallel condition branches', chips: ['MFA setup', 'Greenshot', 'Microsoft 365', 'Foxy Proxy', 'Email signature', 'IT tickets', 'Moving day', 'Office alarm / access', '+ more'] },
        { title: 'Each branch: changed AND = “Yes”?', d: 'and(ColumnHasChanged = true, column = "Yes")', split: [
          { label: 'Yes', cls: 'y', nodes: [{ k: 'email', t: 'Send an email (V2)', d: 'Branded HTML body for that topic' }] },
          { label: 'No', cls: 'n', nodes: [{ k: 'var', t: 'Do nothing', d: 'Branch ends' }] }] }
      ]
    },
    nle: {
      name: 'NLE List – Columns Removal', env: ENV,
      desc: 'When HR marks a departing employee “Removed” on a vendor\'s hire-sheet column, the employee\'s row is moved from that vendor\'s active Excel table to its departed table — one parallel branch per outsourcing partner.',
      nodes: [
        { k: 'trigger', t: 'When an item is created or modified', d: 'Offboarding NLE list (HR site)' },
        { k: 'sp', t: 'Get changes for an item or a file (properties only)' },
        { title: 'Parallel branch per BPO partner', chips: ['Partner A', 'Partner B', 'Partner C', 'Partner D'] },
        { title: 'Hire-sheet column changed to “Removed”?', split: [
          { label: 'Yes', cls: 'y', nodes: [{ k: 'xl', t: 'Add a row into a table', d: 'Departed / NLE table' }, { k: 'xl', t: 'Delete a row', d: 'Active-employee table' }] },
          { label: 'No', cls: 'n', nodes: [{ k: 'var', t: 'Skip', d: '' }] }] }
      ]
    },
    bt: {
      name: 'IT – Asset Check-In on Offboarding', env: ENV,
      desc: 'When IT sets AssetCheckIn = Yes on a departing employee, every asset (e.g. headsets) and pooled accessory (keyboard, mouse) assigned to them is checked back into the asset-management platform and made available again.',
      nodes: [
        { k: 'trigger', t: 'When an item is created or modified', d: 'Offboarding NLE list' },
        { title: 'AssetCheckIn changed to “Yes”?', split: [
          { label: 'Yes', cls: 'y', nodes: [
            { k: 'dv', t: 'List rows · environment variable', d: 'API key read from Dataverse, never typed into the flow' },
            { k: 'http', t: 'HTTP GET · employee by e-mail', d: 'Find the departing user in the asset platform' },
            { k: 'http', t: 'HTTP GET · assigned assets + accessories', d: 'Both serialized and pooled items' },
            { k: 'loop', t: 'Apply to each item', d: 'Check-in call per record' },
            { k: 'sp', t: 'Update item', d: 'Write result summary back to the list' }] },
          { label: 'No', cls: 'n', nodes: [{ k: 'var', t: 'Skip', d: '' }] }] }
      ]
    },
    xfer: {
      name: 'IT – Accessory Transfer', env: ENV,
      desc: 'Moves a quantity of a pooled accessory (e.g. cables) from one site\'s stock to another. Validates the numbers first, then updates both records in the asset platform and reports back on the request item.',
      nodes: [
        { k: 'trigger', t: 'When an item is created or modified', d: 'Trigger condition: Status = “Complete” · Split On enabled' },
        { k: 'dv', t: 'List rows · environment variable definitions', d: 'Reads the API key via $expand on the variable value' },
        { k: 'var', t: 'Initialize variable · ApiKey' },
        { k: 'http', t: 'HTTP GET · source & destination accessory', d: 'Two lookups' },
        { title: 'Valid transfer?', d: 'source qty ≥ requested · source ≠ destination · qty > 0 · destination id > 0', split: [
          { label: 'Yes', cls: 'y', nodes: [{ k: 'http', t: 'HTTP PUT × 2', d: 'Decrement source, increment destination' }, { k: 'sp', t: 'Update item → Success', d: 'API response stored for audit' }] },
          { label: 'No', cls: 'n', nodes: [{ k: 'sp', t: 'Update item → Failed', d: 'Reason written to the request' }] }] }
      ]
    },
    five9: {
      name: 'Five9 – Campaign DNIS Update', env: ENV,
      desc: 'Executes the approved steps of a number swap against the contact-centre platform\'s admin web service. One flow, two cases — add the new number to the campaign, or remove the old one — each writing its result back to the swap queue.',
      nodes: [
        { k: 'trigger', t: 'When an item is created or modified', d: 'Swap Queue · fires only on “Approved for Campaign Add” / “Approved for Old DID Removal”' },
        { k: 'dv', t: 'List rows × 2 · environment variables', d: 'Service-account lookup' },
        { k: 'var', t: 'Initialize variable · auth header', d: 'Base64 of user:password' },
        { title: 'Switch on Status', k: 'sw', split: [
          { label: 'Approved for Campaign Add', cls: 'c', nodes: [{ k: 'http', t: 'HTTP · SOAP addDNISToCampaign', d: 'Timeout PT5M · async pattern off' }, { title: 'statusCode = 200?', split: [{ label: 'Yes', cls: 'y', nodes: [{ k: 'sp', t: 'Update → Added to Campaign', d: '' }] }, { label: 'No', cls: 'n', nodes: [{ k: 'sp', t: 'Update → Failed / Needs Attention', d: '' }] }] }] },
          { label: 'Approved for Old DID Removal', cls: 'c', nodes: [{ k: 'http', t: 'HTTP · SOAP removeDNISFromCampaign', d: 'Same hardening' }, { title: 'statusCode = 200?', split: [{ label: 'Yes', cls: 'y', nodes: [{ k: 'sp', t: 'Update → Awaiting Manual Release', d: '' }] }, { label: 'No', cls: 'n', nodes: [{ k: 'sp', t: 'Update → Failed / Needs Attention', d: '' }] }] }] }] }
      ]
    },
    verify: {
      name: 'Five9 – Verify DID in Directory', env: ENV,
      desc: 'Called directly by the dashboard (HTTP trigger). Asks the platform whether a number is still owned anywhere in the ~2,500-number directory, so a number missing from its campaign is routed to a real manual release instead of being written off.',
      nodes: [
        { k: 'trigger', t: 'When an HTTP request is received', d: 'Invoked from the dashboard\'s Verify action' },
        { k: 'dv', t: 'List rows · environment variables' },
        { k: 'http', t: 'HTTP · SOAP getDNISList', d: 'Parameter-free — returns the full directory' },
        { k: 'resp', t: 'Response', d: 'Found / not found, handed back to the browser' }
      ]
    },
    promo: {
      name: 'HR – Send Promotion Announcement Emails', env: ENV,
      desc: 'Sends a company-wide congratulations email and an operations position-change notice from one HR form submission. The two branches run sequentially (not in parallel) and are guarded so a re-save can never send twice.',
      nodes: [
        { k: 'trigger', t: 'When an item is created or modified', d: 'Promotion Announcements list' },
        { title: 'SendCompanyEmailTrigger = Yes AND status ≠ Sent?', split: [
          { label: 'Yes', cls: 'y', nodes: [
            { k: 'var', t: 'Compose · subject + body', d: 'replace() chain fills {{tokens}} from the settings JSON' },
            { k: 'email', t: 'Send an email (V2)', d: 'Sender read from settings — no flow edit to change it' },
            { k: 'sp', t: 'Update item', d: 'CompanyEmailStatus = Sent · date stamped' }] },
          { label: 'No', cls: 'n', nodes: [{ k: 'var', t: 'Skip', d: '' }] }] },
        { title: 'Then: SendOpsEmailTrigger = Yes AND status ≠ Sent?', split: [
          { label: 'Yes', cls: 'y', nodes: [{ k: 'var', t: 'Compose · subject + body' }, { k: 'email', t: 'Send an email (V2)', d: 'Operations title-change notice' }, { k: 'sp', t: 'Update item', d: 'OpsEmailStatus = Sent' }] },
          { label: 'No', cls: 'n', nodes: [{ k: 'var', t: 'Skip', d: '' }] }] }
      ]
    }
  };

  const patterns = [
    { title: 'SharePoint REST helper (shared by every dashboard)', lang: 'javascript', src: `const SITE = location.origin + '/sites/HR';
let digest, digestAt = 0;

async function getDigest() {                       // form-digest tokens last ~30 min
  if (digest && Date.now() - digestAt < 25 * 60e3) return digest;
  const r = await fetch(SITE + '/_api/contextinfo', { method: 'POST',
    headers: { Accept: 'application/json;odata=nometadata' }, credentials: 'same-origin' });
  digest = (await r.json()).FormDigestValue; digestAt = Date.now();
  return digest;
}

async function spGet(path) {
  const r = await fetch(SITE + '/_api/' + path, {
    headers: { Accept: 'application/json;odata=nometadata' }, credentials: 'same-origin' });
  if (!r.ok) throw new Error('GET ' + path + ' → ' + r.status);
  return (await r.json()).value;
}

async function spUpdate(list, id, fields) {         // MERGE = partial update
  const r = await fetch(\`\${SITE}/_api/web/lists/getbytitle('\${list}')/items(\${id})\`, {
    method: 'POST', credentials: 'same-origin', body: JSON.stringify(fields),
    headers: { 'Content-Type': 'application/json;odata=nometadata', 'X-RequestDigest': await getDigest(),
               'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' } });
  if (!r.ok) throw new Error('UPDATE failed ' + r.status);
}` },
    { title: 'Bulk Entra / Intune work with Microsoft Graph PowerShell', lang: 'powershell', src: `Connect-MgGraph -Scopes 'DeviceManagementConfiguration.Read.All','Group.Read.All' -NoWelcome

# Settings Catalog policies + the groups they are assigned to
$policies = (Invoke-MgGraphRequest -Uri 'beta/deviceManagement/configurationPolicies?$top=100').value
foreach ($p in $policies) {
  $assign = (Invoke-MgGraphRequest -Uri "beta/deviceManagement/configurationPolicies/$($p.id)/assignments").value
  [pscustomobject]@{
    Policy  = $p.name
    Targets = ($assign | ForEach-Object { $_.target.groupId }) -join ', '
  }
}` }
  ];

  const languages = [
    ['JavaScript (ES5 → ES2020)', 'Dashboards, SPAs, serverless functions'],
    ['PowerShell', 'Graph / Intune / Exchange automation, diagnostics'],
    ['HTML & CSS', 'Hand-written UI, design systems, branded emails'],
    ['SQL / PostgREST', 'Supabase tables, RLS policies, seed data'],
    ['Power Fx / Flow expressions', 'Conditions, replace() chains, trigger filters'],
    ['SOAP / XML', 'Contact-centre admin web service'],
    ['JSON', 'Settings blobs, flow definitions, list payloads'],
    ['Python', 'One-off data imports (openpyxl)'],
    ['Markdown', 'Runbooks & documentation']
  ];

  const pattern = [
    ['Browser SPA', 'Vanilla JS, one file, no framework'],
    ['Script Editor web part', 'Pasted shell + externally-hosted JS'],
    ['SharePoint REST / Graph', 'Lists as the data tier'],
    ['Power Automate', 'Triggers, emails, 3rd-party APIs'],
    ['External APIs', 'Asset, contact-centre, e-mail, DB']
  ];

  const also = [
    { cat: 'Public Form · Automation', t: 'New Hire Intake Form', d: 'A public, guest-invite intake form and a filing flow on the extranet site — new hires submit once, records are filed automatically.', pills: ['SharePoint', 'Power Automate', 'Guest access'] },
    { cat: 'Web App · Power Platform', t: 'Careers Portal', d: 'Internal careers page backed by SharePoint lists, with an HR security group controlling who manages openings.', pills: ['SharePoint', 'JavaScript', 'REST API'] },
    { cat: 'Survey · Automation', t: 'Exit Interview Survey', d: 'Standalone survey page with a response list and a Forms-sync flow so every submission lands in one place, tagged by source.', pills: ['MS Forms', 'Power Automate', 'SharePoint'] },
    { cat: 'Hub · Procurement', t: 'Purchase Tracking Hub', d: 'A dashboard layered over the Purchase Requisition and Inventory Tracking lists — visibility without touching the existing forms.', pills: ['SharePoint', 'JavaScript', 'Lists'] },
    { cat: 'Hub · Multi-tenant', t: 'Offboarding Hub — second tenant', d: 'The same offboarding architecture re-deployed to a separate organisation: own lists, own branding, own people-picker route.', pills: ['SharePoint', 'JavaScript', 'Entra ID'] },
    { cat: 'Documentation', t: 'IT Documentation Dashboard', d: 'Shared team knowledge base with flow diagrams, code/API blocks and branded covers; multi-author, enforced doc standard for every flow.', pills: ['SharePoint', 'Quill', 'REST API'] }
  ];


  const sys = {
    cs15: [['Dashboard SPA', 'ui', 'REST'], ['SharePoint Swap Queue', 'sp', 'item change'], ['Power Automate', 'flow', 'SOAP'], ['Contact-centre admin API', 'ext']],
    cs16: [['Registration Form', 'ui', 'responses'], ['Pass & Request Lists', 'sp', 'REST'], ['HR Dashboard', 'ui', 'scheduled'], ['Check-in Flow', 'flow', 'send'], ['Employee Inbox', 'email']],
    cs17: [['Promotion Form', 'ui', 'save'], ['Announcements List', 'sp', 'trigger'], ['Power Automate', 'flow', 'replace()'], ['Outlook', 'email']],
    cs18: [['OneDrive Sync', 'data', 'deploy'], ['Site Assets JS/CSS', 'sp', 'script src'], ['Home Page Widgets', 'ui', 'REST'], ['Updates & Events Lists', 'sp']],
    cs19: [['IT ticks a topic', 'sp', 'item modified'], ['Flow Trigger', 'flow', 'get changes'], ['Condition Branch', 'flow', 'is Yes?'], ['Outlook', 'email']],
    cs20: [['Offboarding NLE List', 'sp', 'trigger'], ['Power Automate', 'flow', 'rows / HTTP'], ['Excel Tables', 'data'], ['Asset Platform API', 'ext']],
    cs21: [['Intune Script', 'ext', 'user context'], ['User Session', 'ui', 'resolve PFN'], ['Package Folder INI', 'data', 'and'], ['HKCU StartupTask', 'data']],
    cs22: [['Visitor Browser', 'ui', 'AJAX POST'], ['Netlify Forms', 'sp', 'event'], ['Serverless Function', 'flow', 'API call'], ['Resend', 'email']],
    cs23: [['GitHub Pages', 'sp', 'serves'], ['Browser App', 'ui', 'PostgREST'], ['Supabase API + RLS', 'ext', 'SQL'], ['Postgres', 'data']],
    cs6: [['Hub SPA', 'ui', 'REST'], ['SharePoint Lists', 'sp', 'trigger'], ['Power Automate', 'flow', 'rows / HTTP'], ['Excel & Asset API', 'ext']],
    cs11: [['Transfer Form', 'ui', 'submit'], ['Requests List', 'sp', 'Complete'], ['Power Automate', 'flow', 'HTTP PUT'], ['Asset Platform API', 'ext', 'notify'], ['Teams Channel', 'email']],
    cs14: [['Wiki SPA', 'ui', 'REST'], ['Article Lists', 'sp', 'sign'], ['Routing', 'flow', 'email'], ['HR Inbox', 'email']],
    cs12: [['Graph PowerShell', 'ui', 'Graph'], ['Microsoft Graph', 'ext', 'read / write'], ['Intune Policies', 'sp', 'assigned to'], ['Entra Groups', 'data']]
  };

  const projects = [
    /* ---------------- 15 · Five9 ---------------- */
    {
      id: 'cs15', num: 15, cat: 'automation', catLabel: 'Automation', icon: 'AUT', short: 'Five9 Hub',
      title: ['Contact-Centre Number', 'Rotation Hub'], cardTitle: 'Five9 DID Rotation Hub',
      tagline: ['Flagged', 'Tracked', 'Confirm-Gated', 'Verified'],
      blurb: 'Collapsed a weekly, fully-manual “dead number” rotation across two admin surfaces into one tracked queue — CSV import, auto-flagging, live verification against the platform.',
      desc: 'A SharePoint dashboard that turns a weekly 100–200-number swap procedure into a guided queue: import a per-campaign performance CSV, auto-flag numbers that meet three criteria, then drive each swap through its lifecycle with confirm-gated actions and live checks against the contact-centre platform.',
      badges: ['📥 CSV Import &amp; Auto-Flagging', '🔁 5-Step Swap Lifecycle', '🔌 SOAP API via Power Automate', '📊 Performance Analytics'],
      problem: ['Weekly rotation done by hand across two separate admin consoles', '100–200 numbers per week, no single place to see status', 'Easy to remove a number that was never added', 'No history of what was swapped or how it performed'],
      solution: ['Import report → numbers matching 3 criteria are flagged automatically', 'Each swap tracked: buy → add to campaign → remove old → release old', 'Live “is this DID really in the platform?” check before any removal', 'History, analytics and per-number performance trend in one app'],
      arch: ['Vanilla-JS SPA in a SharePoint Script Editor web part', 'Swap Queue + Settings lists as the data tier', 'Power Automate flows as the secure bridge to the SOAP admin API', 'Credentials in Dataverse environment variables'],
      steps: [['Import CSV', 'Drag-and-drop weekly report'], ['Auto-flag', '3 configurable criteria'], ['Approve', 'Confirm-gated queue'], ['Flow runs', 'SOAP add / remove'], ['Verify', 'Live platform check'], ['Release', 'Old number retired']],
      mock: { type: 'dash', url: 'sharepoint.com/…/Rotation-Hub.aspx', brand: 'DID Rotation', active: 1, nav: [['Dashboard'], ['Swap Queue', 12], ['Import Report'], ['Alt Area Code'], ['Performance'], ['History'], ['Analytics'], ['Learn']], title: 'Swap Queue', btn: '+ Add Swap', btn2: 'Import CSV',
        kpis: [['38', 'Flagged this week', '#e8b54d'], ['12', 'In progress', '#4a8fd4'], ['7', 'Awaiting release', '#a78bfa'], ['21', 'Completed', '#4cc38a']],
        steps: [['Flagged', 'Bought', 'Added to campaign', 'Old removed', 'Released'], 2],
        cols: ['Campaign', 'Swap', 'Reason', 'Status'],
        rows: [['Inbound-A', ['#old|604-555-0142', '#new|604-555-0188'], 'Low contact %', '@in|Added to campaign'], ['Outbound-C', ['#old|778-555-0173', '#new|778-555-0121'], 'Zero attempts', '@wa|Awaiting removal'], ['Inbound-B', ['#old|236-555-0165', '#new|236-555-0109'], 'Low inbound', '@ok|Released']].map(r => [r[0], '#chip|' + r[1][0].slice(5) + ' → ' + r[1][1].slice(5), r[2], r[3]]) },
      stack: {
        lang: [['JavaScript (ES5)', '~148 KB, one IIFE'], ['CSS', 'minified, light theme'], ['PowerShell', 'API spike + diagnostics'], ['SOAP / XML', 'admin web service'], ['Flow expressions', 'switch, conditions']],
        plat: [['SharePoint Online', 'page + Script Editor web part'], ['Power Automate', '3 flows'], ['Dataverse', 'env variables for credentials'], ['Five9 admin web service', 'v12']],
        data: [['Swap Queue list', 'one row per swap'], ['Settings list', 'JSON blob: campaigns + thresholds'], ['PerformanceHistory', 'per-DID trend data'], ['Check-history log', 'per-DID audit']]
      },
      apis: [['Five9 Configuration Web Services', 'addDNISToCampaign · removeDNISFromCampaign · getDNISList · getCampaigns', 'Executing and verifying swaps (SOAP over HTTPS)'], ['SharePoint REST', '/_api/web/lists · $filter · MERGE', 'Queue, settings, history, analytics'], ['Power Automate HTTP trigger', 'POST (request/response)', 'Dashboard → flow → platform verify']],
      fns: [['verifyOldDidThenProceed()', 'Checks the campaign first, falls back to the full directory before any removal'], ['verifyDidInDirectory()', 'Calls the directory-wide verify flow and handles timeouts without hanging'], ['importReport(csv)', 'Parses the weekly report, applies the 3 criteria, de-duplicates re-uploads'], ['renderCalendar()', 'Completed-swaps-by-day grid with clickable drill-down'], ['startTour()', 'Spotlight walkthrough for new admins']],
      flows: ['five9', 'verify'],
      code: [{ title: 'SOAP call executed by the flow (simplified)', lang: 'xml', src: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.admin.ws.five9.com/">
  <soapenv:Body>
    <ser:addDNISToCampaign>
      <campaignName>@{triggerBody()?['CampaignName']}</campaignName>
      <DNISList>@{triggerBody()?['NewDID']}</DNISList>
    </ser:addDNISToCampaign>
  </soapenv:Body>
</soapenv:Envelope>` }, { title: 'Verify-before-remove (browser side)', lang: 'javascript', src: `async function verifyOldDidThenProceed(row) {
  const inCampaign = await callFlow(VERIFY_CAMPAIGN_URL, { did: row.OldDID, campaign: row.Campaign });
  if (inCampaign.found) return queueRemoval(row);

  // not in the campaign — is it still owned anywhere in the directory?
  const inDirectory = await callFlow(DIRECTORY_VERIFY_URL, { did: row.OldDID }, { timeoutMs: 90e3 });
  if (inDirectory.found) return markAwaitingManualRelease(row);   // still billable → release for real
  return markNotInPlatform(row);                                   // genuinely gone
}` }],
      features: [['📥', 'Drag-and-drop CSV import', 'Weekly report in, flagged numbers out'], ['🧭', 'Alt area-code finder', 'Includes toll-free support'], ['📈', 'Per-number trend', 'Contact %, attempts, inbound over time'], ['🗓', 'Swap calendar', 'Clickable days with full detail'], ['🧪', 'Live verify', 'Never remove a number that isn\'t there'], ['🎓', 'Tour + Learn tab', 'Onboard new admins in minutes']],
      impact: [['100–200', 'Swaps per week managed'], ['2 → 1', 'Admin surfaces consolidated'], ['~2,500', 'Numbers verifiable on demand'], ['0', 'Blind removals']],
      pills: ['JavaScript', 'SharePoint', 'Power Automate', 'SOAP API', 'Dataverse'],
      summary: 'Replaced a repetitive two-console procedure with one tracked, verifiable queue — and a hard-won root-cause fix (a malformed country-code prefix that made flows hang) now documented so it can\'t recur.',
      quote: 'Automate the clicking, keep a human on the decisions.'
    },
    /* ---------------- 16 · Parking ---------------- */
    {
      id: 'cs16', num: 16, cat: 'platform', catLabel: 'Power Platform', icon: 'PWR', short: 'Parking Hub',
      title: ['Parking Pass', 'Management Hub'], cardTitle: 'Parking Pass Management Hub',
      tagline: ['Digitized', 'Audited', 'Self-Service', 'Role-Aware'],
      blurb: 'Replaced HR\'s Excel-based parking tracking with an inventory, request-review and audit-log dashboard, plus employee self-service and scheduled check-ins.',
      desc: 'An HR dashboard that digitizes company-paid parking passes: live inventory across offices, an approve/decline request queue, an append-only history log, vehicle records, editable email templates and a monthly “is this still yours?” confirmation cycle.',
      badges: ['🅿 Pass Inventory', '✅ Request Review Queue', '✉ Editable Email Templates', '🔐 Role-Based Views'],
      problem: ['Passes tracked in spreadsheets, shared by email', 'No audit trail of who held which pass and when', 'Lost / returned passes unclear; stale assignments', 'Employees had no way to see their own pass'],
      solution: ['Inventory with check-in / check-out and Returned vs. Lost outcomes', 'Review queue and flagged-for-review list for HR', 'Append-only history for every action', 'Self-service “My Pass” plus monthly confirmation banner'],
      arch: ['Script Editor SPA on the HR site', '4 SharePoint lists (passes, requests, history, settings)', 'Microsoft Forms for intake, extranet info page for staff', 'Directory search via SharePoint people-search API'],
      steps: [['Request', 'Form or HR entry'], ['Review', 'Approve / decline'], ['Assign', 'Pass + vehicle'], ['Confirm', 'Monthly check-in'], ['Return', 'Returned / Lost'], ['Audit', 'History log']],
      mock: { type: 'dash', url: 'sharepoint.com/sites/HR/…/Parking-Hub.aspx', brand: 'Parking Hub', active: 2, nav: [['Dashboard'], ['My Pass'], ['Pass Inventory'], ['Pass Requests', 4], ['Review Queue', 2], ['Pass History'], ['Master Data'], ['Reports'], ['Settings']], title: 'Pass Inventory', btn: '+ Add Pass', btn2: '✉ Monthly Check-In',
        kpis: [['120', 'Total passes', '#4a8fd4'], ['14', 'Available', '#4cc38a'], ['104', 'In use', '#a78bfa'], ['2', 'Lost', '#ef6a6a']],
        cols: ['Pass #', 'Office', 'Assigned to', 'Eligibility', 'Status'],
        rows: [['P-1042', 'Office A', 'Jordan K.', '5 AM shift', '@ok|✓ Confirmed'], ['P-1043', 'Office A', 'Sam P.', 'Management', '@wa|Not confirmed'], ['P-2210', 'Office B', '— (Storage)', '—', '@in|Available'], ['P-2214', 'Office B', 'Riley T.', '5 AM shift', '@er|Lost']] },
      stack: {
        lang: [['JavaScript (ES5)', 'single IIFE'], ['CSS', 'shared design system, pp- prefix'], ['Python', 'one-off workbook import (openpyxl)'], ['HTML', 'email templates + shell']],
        plat: [['SharePoint Online', 'HR site + extranet'], ['Microsoft Forms', 'pass registration'], ['Power Automate', 'scheduled check-in emails'], ['Microsoft Graph', 'workbook download']],
        data: [['Passes list', 'inventory + vehicle fields'], ['Requests list', 'form + manual'], ['Pass History', 'append-only'], ['Settings list', 'locations, templates']]
      },
      apis: [['SharePoint REST', 'lists · items · $filter', 'All inventory / request CRUD'], ['SharePoint People Search', '/_api/search/query', 'Directory lookup (name, title, department)'], ['Microsoft Graph', '/shares/{id}/driveItem', 'Pulled the legacy workbook for the data migration'], ['Microsoft Forms', 'Response page', 'Employee pass registration']],
      fns: [['renderInventory() / setInventorySort()', 'Sortable, filterable inventory with status badges'], ['confirmCheckIn()', 'Outcome (Returned / Lost) + comments, logged to history'], ['openTemplatePreviewModal()', 'Live preview of email templates in a branded envelope'], ['bulkAdd()', 'CSV or manual-row bulk creation'], ['startProductTour()', 'In-app guided tour']],
      flows: [],
      code: [{ title: 'Branded email templates with live preview', lang: 'javascript', src: `const SAMPLE = { name: 'Jordan K.', office: 'Office A', pass: '#1042' };

function fillTemplate(tpl, vars) {                 // {{token}} replacement
  return tpl.replace(/{{\\s*(\\w+)\\s*}}/g, (_, k) => (vars[k] ?? ''));
}

function previewTemplate(tpl) {
  const body = emailBodyToHtml(fillTemplate(tpl.body, SAMPLE));
  openModal(emailEnvelopeHtml({ subject: fillTemplate(tpl.subject, SAMPLE), body }));
}` }],
      features: [['🅿', 'Pass inventory', 'Search, filter, sort, bulk add, CSV export'], ['🚩', 'Review queue', 'HR can flag a pass for follow-up'], ['🧾', 'Audit history', 'Every action stamped and filterable'], ['🚗', 'Vehicle records', 'Make / model / plate with in-place edit'], ['📊', 'Reports', 'Hand-rolled bar charts, no library'], ['🎓', 'Product tour', 'Guided walkthrough for HR']],
      impact: [['Excel → App', 'Single source of truth'], ['Full', 'Audit trail on every pass'], ['Monthly', 'Self-confirm cycle'], ['Role-based', 'Employee vs. HR views']],
      pills: ['JavaScript', 'SharePoint', 'MS Forms', 'Power Automate'],
      summary: 'Moved parking administration from spreadsheets to a governed app with a real audit trail — and deliberately removed an automated shift-verification feature when HR preferred a simple manual check.',
      quote: 'Know what to build — and what to take back out.'
    },
    /* ---------------- 17 · Promotion ---------------- */
    {
      id: 'cs17', num: 17, cat: 'automation', catLabel: 'Automation', icon: 'AUT', short: 'Promotion Hub',
      title: ['Promotion Announcement', 'Hub'], cardTitle: 'Promotion Announcement Hub',
      tagline: ['One Form', 'Two Emails', 'Guarded', 'Branded'],
      blurb: 'HR announces promotions from one form — a company-wide congratulations and an operations title-change notice go out together, safely and exactly once.',
      desc: 'An HR form with a dynamic list of people that stores each announcement in SharePoint and triggers a Power Automate flow to send two branded emails — company-wide congratulations and an operations position-change notice — with templates HR can edit in-app.',
      badges: ['👥 Dynamic People List', '✉ Two-Email Flow', '🧩 Editable Templates', '🛡 Send-Once Guards'],
      problem: ['Promotions announced by hand-written emails', 'Operations notified separately, often late', 'No record of what was announced or when', 'Template wording drifting between announcements'],
      solution: ['Single form → company email + operations notice', 'People picked from the directory, stored as JSON', 'Templates in a settings list, editable by admins', 'Status columns written only by the flow prevent duplicates'],
      arch: ['Script Editor page on the HR site', 'Announcements + Settings + Admins lists', 'Flow reads the same template JSON as the JS preview', 'Sequential branches, not parallel'],
      steps: [['Add people', 'Directory picker'], ['Preview', 'Live email render'], ['Save', 'List item created'], ['Flow: Company', 'Congratulations email'], ['Flow: Ops', 'Title-change notice'], ['Stamp', 'Sent status + date']],
      mock: { type: 'mail', url: 'HR Promotion Form  →  Outlook', trigger: 'flow sends 2 emails', from: 'Human Resources', to: 'All Staff', subject: 'Congratulations to our newly promoted colleagues!', kicker: 'COMPANY ANNOUNCEMENT', h: 'Congratulations on your promotion!', sub: 'Effective 1 November', footer: 'Sent on behalf of Human Resources',
        panel: { title: 'New Promotion Announcement', sub: 'Effective date · 1 Nov', rows: [['Alex R.  ·  Team Lead', 'text', 'Care'], ['Sam P.  ·  Quality Analyst II', 'text', 'QA'], ['+ Add another person', false], ['Send company email', 'new'], ['Send operations notice', true]], foot: 'Live preview matches the email exactly.' },
        body: [['p', 'Please join us in congratulating our colleagues on their new roles:'], ['row', 'Alex R. — Team Lead', 'Customer Care'], ['row', 'Sam P. — Quality Analyst II', 'Quality Assurance'], ['p', 'Thank you for your dedication and hard work.']] },
      stack: {
        lang: [['JavaScript (ES5)', 'form + live preview'], ['Flow expressions', 'replace() token chains'], ['HTML', 'email bodies'], ['JSON', 'people + template settings']],
        plat: [['SharePoint Online', 'HR site'], ['Power Automate', '1 flow, 2 sequential branches'], ['Office 365 Outlook', 'Send an email (V2)'], ['SharePoint people-picker service', 'directory lookup']],
        data: [['Announcements list', 'PeopleJSON + status columns'], ['Settings list', 'SettingsJSON templates'], ['Admins list', 'gates the settings gear']]
      },
      apis: [['SharePoint REST', 'items · MERGE', 'Announcements, settings, admins'], ['SharePoint people-picker web service', 'ClientPeoplePickerWebServiceInterface', 'Directory lookups (Graph passthrough unavailable)'], ['Office 365 Outlook connector', 'SendEmailV2', 'Both announcement emails']],
      fns: [['fillTemplate(tpl, vars)', 'Same {{token}} contract as the flow\'s replace() chain'], ['addPerson() / removePerson()', 'Dynamic repeating rows serialized to PeopleJSON'], ['saveAnnouncement()', 'Creates the item and flags both email triggers'], ['isAdmin()', 'Shows the Settings gear only to listed admins']],
      flows: ['promo'],
      code: [{ title: 'Token fill — identical in JS and in the flow', lang: 'javascript', src: `// browser: live preview
const fillTemplate = (tpl, v) => tpl.replace(/{{(\\w+)}}/g, (_, k) => v[k] ?? '');

// Power Automate (Compose action) — same contract
// replace(replace(settings.bodyTemplate, '{{roleTitle}}', triggerBody()?['RoleTitle']),
//         '{{effectiveDate}}', formatDateTime(triggerBody()?['EffectiveDate'], 'MMMM d, yyyy'))` }],
      features: [['👥', 'Multi-person announcements', 'One form, any number of people'], ['👁', 'Live preview', 'See the exact email before sending'], ['✍', 'Admin-editable templates', 'Wording and recipients without a redeploy'], ['🛡', 'Send-once guard', 'Status ≠ Sent check on every branch'], ['🔁', 'Sequential branches', 'Avoids a parallel race on the same item'], ['🔒', 'Admin gating', 'Settings visible to listed admins only']],
      impact: [['1 form', 'Two emails, always together'], ['0', 'Duplicate sends'], ['Editable', 'Without touching the flow'], ['Logged', 'Every announcement']],
      pills: ['JavaScript', 'SharePoint', 'Power Automate', 'Outlook'],
      summary: 'A small tool with careful engineering: shared template logic between browser and flow, status columns only the flow can write, and sequential branches after finding that parallel ones collide.',
      quote: 'Reliability is a design decision, not a bug fix.'
    },
    /* ---------------- 18 · Intranet ---------------- */
    {
      id: 'cs18', num: 18, cat: 'platform', catLabel: 'Power Platform', icon: 'PWR', short: 'Intranet Home',
      title: ['Intranet Home', 'Widgets'], cardTitle: 'Intranet Daily Updates & Events Widgets',
      tagline: ['Posted', 'Prioritized', 'Acknowledged', 'Read'],
      blurb: 'Custom widgets on the company intranet home page: a Daily Updates feed with priority tags and an urgent-acknowledgment popup, plus Upcoming Events.',
      desc: 'Custom code embedded in a native modern SharePoint page: a Daily Updates feed (compose, edit, delete, read/unread), Important/Urgent priority with an acknowledgment popup, and an Upcoming Events widget — sitting beside a native recognition carousel.',
      badges: ['📣 Daily Updates Feed', '🚨 Urgent Acknowledgment', '📅 Upcoming Events', '🏆 Recognition Carousel'],
      problem: ['Company news buried in email threads', 'No way to flag urgent notices or confirm they were seen', 'Events list not surfaced on the home page'],
      solution: ['Rich-text feed with read/unread state per user', 'Important / Urgent tags and a must-acknowledge popup', 'Events widget reading the calendar list'],
      arch: ['Two Modern Script Editor web parts + one native image gallery', 'JS/CSS in Site Assets, synced from OneDrive', 'Injected CSS to fix SharePoint row / column widths'],
      steps: [['Compose', 'Rich-text post'], ['Tag', 'Normal / Important / Urgent'], ['Publish', 'List item'], ['Display', 'Feed widget'], ['Acknowledge', 'Urgent popup'], ['Track', 'Read state']],
      mock: { type: 'home', url: 'sharepoint.com/…/MainHomePage-IntraNet.aspx', hero: 'Welcome to the Intranet', cols: [['Daily Updates', [['Holiday schedule posted', 'Important', 'wa'], ['Systems maintenance tonight', 'Urgent', 'er'], ['New benefits portal', '', '']]], ['Employee Recognition', [['Employee of the month', '★', 'ok'], ['Team award — Q3', '', '']]], ['Upcoming Events', [['Town hall', 'Oct 12', 'in'], ['Fire drill', 'Oct 18', 'in'], ['Team lunch', 'Oct 25', 'in']]]] },
      stack: {
        lang: [['JavaScript', 'two widgets'], ['CSS', 'plus runtime-injected layout fixes'], ['HTML', 'rich-text compose']],
        plat: [['SharePoint Online', 'modern page'], ['PnP Modern Script Editor', 'web part host'], ['OneDrive sync', 'deploys JS/CSS']],
        data: [['Daily Updates list', 'posts, priority, read tracking'], ['Company Events Calendar', 'events source'], ['Award Carousel library', 'native gallery source']]
      },
      apis: [['SharePoint REST', 'items · attachments', 'Feed and events data']],
      fns: [['renderFeed()', 'Newest-first feed with unread markers'], ['showUrgentPopup()', 'Blocks until acknowledged, then records it'], ['fixColumnWidths()', 'Injects CSS so the 3-column row sizes correctly']],
      flows: [],
      code: [{ title: 'Verifying layout by measurement, not screenshots', lang: 'javascript', src: `// SharePoint lazy-loads sections; an empty DOM can look like a bug.
const cols = [...document.querySelectorAll('.CanvasZone .CanvasSection > div')]
  .map(el => Math.round(el.getBoundingClientRect().width));
console.table(cols);   // expect three roughly equal columns` }],
      features: [['🚨', 'Urgent popup', 'Cannot be ignored until acknowledged'], ['✉', 'Read / unread', 'Per-user tracking'], ['🖋', 'Rich-text compose', 'Formatting and links'], ['📐', 'Layout hardening', 'Fixes for SharePoint canvas quirks'], ['📅', 'Events widget', 'Always current'], ['🏆', 'Recognition', 'Native carousel from a library']],
      impact: [['Seen', 'Urgent notices confirmed'], ['Centralized', 'News + events + recognition'], ['Zero', 'Extra licences'], ['Live', 'On the company home page']],
      pills: ['JavaScript', 'SharePoint', 'CSS', 'REST API'],
      summary: 'Extended a native SharePoint page without replacing it — custom widgets where control mattered, native web parts where they were good enough.',
      quote: 'Use the platform where it\'s good; write code where it isn\'t.'
    },
    /* ---------------- 19 · Intro emails ---------------- */
    {
      id: 'cs19', num: 19, cat: 'automation', catLabel: 'Automation', icon: 'AUT', short: 'Intro Emails',
      title: ['New-Hire IT', 'Intro Emails'], cardTitle: 'New-Hire IT Intro Email Automation',
      tagline: ['Topic-Based', 'Idempotent', 'Branded', 'Self-Serve'],
      blurb: 'A SharePoint list and a Power Automate flow that send new hires exactly the IT guides they need — MFA, Greenshot, signatures and more — one tick at a time.',
      desc: 'IT ticks topics for a new hire on a SharePoint list item; a flow with nine parallel branches emails the matching branded guide for each, firing only when that column has just changed to “Yes”.',
      badges: ['✉ Topic-Specific Emails', '🌿 9 Parallel Branches', '🧱 Branded HTML', '🔁 No Re-Sends'],
      problem: ['New hires got the same long, generic IT email', 'Guides sent by hand and sometimes forgotten', 'Edits to a list item risked duplicate emails'],
      solution: ['One Yes/No column per topic', 'Each branch checks “changed AND = Yes”', 'Branded HTML per topic, easy to maintain'],
      arch: ['SharePoint list as the control panel', 'Trigger + Get changes (properties only)', 'Parallel conditions → Send an email (V2)'],
      steps: [['Tick a topic', 'Column set to Yes'], ['Trigger', 'Item modified'], ['Get changes', 'Which columns changed'], ['Branch', 'Matching topic only'], ['Send', 'Branded email'], ['Done', 'No duplicates']],
      mock: { type: 'mail', url: 'SharePoint list  →  Outlook', trigger: 'flow sends', from: 'IT Support', to: 'new.hire@company.com', subject: 'Set up Multi-Factor Authentication (step 1 of 3)', kicker: 'IT WELCOME SERIES', h: 'Secure your account in 3 minutes', sub: 'Multi-Factor Authentication', cta: 'Open the setup guide', footer: 'Need help? Open an IT ticket from the intranet.',
        panel: { title: 'IT Intro Emails — New Hire', sub: 'Jordan K. · starts Monday', rows: [['MFA setup', 'new'], ['Greenshot', true], ['Microsoft 365', true], ['Foxy Proxy', false], ['Email signature', false], ['IT tickets', true], ['Moving day', false], ['Office alarm / access', false]], foot: 'Ticking a topic emails it once — never again on later edits.' },
        body: [['p', 'Welcome to the team! Follow these steps to secure your account:'], ['row', '1 · Install the authenticator app', 'iOS or Android — takes under a minute'], ['row', '2 · Scan the QR code', 'Shown on the Microsoft setup page'], ['row', '3 · Approve the test sign-in', 'Confirms everything works']] },
      stack: {
        lang: [['Flow expressions', 'ColumnHasChanged logic'], ['HTML', 'email templates (issues tracked in a redesign backlog)']],
        plat: [['Power Automate', 'cloud flow, 1-minute polling'], ['SharePoint Online', 'trigger list'], ['Office 365 Outlook', 'Send an email (V2)']],
        data: [['IT Intro Emails list', 'one Yes/No column per topic']]
      },
      apis: [['SharePoint connector', 'GetChanges (properties only)', 'Detect which columns just changed'], ['Office 365 Outlook connector', 'SendEmailV2', 'Deliver each topic email']],
      fns: [['and(ColumnHasChanged, equals “Yes”)', 'The gate on every branch'], ['Code-view JSON extraction', 'Read full HTML bodies and conditions without screenshots']],
      flows: ['intro'],
      code: [{ title: 'Branch gate (flow expression)', lang: 'text', src: `and(
  equals(outputs('Get_changes_for_an_item_or_a_file_(properties_only)')?['body/ColumnHasChanged/MFA'], true),
  equals(triggerBody()?['MFA/Value'], 'Yes')
)` }],
      features: [['🎯', 'Targeted content', 'Only the topics that apply'], ['🔒', 'Change-aware', 'Never re-sends on unrelated edits'], ['🎨', 'Branded', 'Consistent look across all guides'], ['🧩', 'Extensible', 'New topic = new column + branch']],
      impact: [['9', 'Topic emails automated'], ['0', 'Duplicate sends'], ['Faster', 'New-hire IT readiness'], ['Reusable', 'Pattern cloned for other flows']],
      pills: ['Power Automate', 'SharePoint', 'Outlook', 'HTML'],
      summary: 'A simple control surface for IT with careful change detection underneath — and the template this pattern gave to the promotion flow.',
      quote: 'The best onboarding is the one that arrives at the right moment.'
    },
    /* ---------------- 20 · Offboarding flows ---------------- */
    {
      id: 'cs20', num: 20, cat: 'automation', catLabel: 'Automation', icon: 'AUT', short: 'Offboarding Flows',
      title: ['Offboarding Data', 'Hygiene Flows'], cardTitle: 'Offboarding Data & Asset Check-In Flows',
      tagline: ['Moved', 'Checked-In', 'Recorded', 'Hands-Off'],
      blurb: 'Two flows behind the offboarding list: move departing staff between partner Excel tables, and check every assigned asset back into inventory automatically.',
      desc: 'When HR or IT updates the Offboarding NLE list, flows move the employee\'s row between active and departed Excel tables for each outsourcing partner and, on a single Yes, check all their assets and accessories back into the asset platform via API.',
      badges: ['📊 Excel Table Moves', '📦 Asset Check-In via API', '🌿 Per-Partner Branches', '🔑 Key in Dataverse'],
      problem: ['Departed staff lingered in partner active-employee sheets', 'Equipment checked in by hand — or forgotten', 'Two teams touching the same record'],
      solution: ['Column change → row moves between Excel tables', 'One “Yes” → all assets + accessories checked in', 'Results written back to the list'],
      arch: ['One SharePoint list, two independent flows', 'Excel Online tables as partner records', 'HTTP actions against the asset platform'],
      steps: [['HR updates list', 'NLE record'], ['Flow A', 'Move Excel rows'], ['IT sets Yes', 'AssetCheckIn'], ['Flow B', 'Look up employee'], ['Check in', 'Assets + accessories'], ['Record', 'Result on item']],
      mock: { type: 'dash', url: 'sharepoint.com/sites/HR/Lists/Offboarding NLE', brand: 'NLE List', active: 0, nav: [['All items'], ['Pending check-in'], ['Completed']], title: 'Offboarding NLE List', btn: '+ New', btn2: 'Export',
        kpis: [['9', 'Pending check-in', '#e8b54d'], ['41', 'Checked in', '#4cc38a'], ['4', 'Partner tables', '#4a8fd4'], ['0', 'Failed', '#ef6a6a']],
        cols: ['Employee', 'Partner', 'Hire sheet', 'Asset check-in'],
        rows: [['Alex R.', 'Partner A', '@ok|Removed', '@ok|Yes — 3 items'], ['Sam P.', 'Partner C', '@wa|Pending', '@mu|No'], ['Riley T.', 'Partner B', '@ok|Removed', '@in|Running…']] },
      stack: {
        lang: [['Flow expressions', 'conditions, ColumnHasChanged'], ['JSON', 'request / response bodies']],
        plat: [['Power Automate', '2 flows'], ['SharePoint Online', 'trigger list'], ['Excel Online (Business)', 'table rows'], ['Dataverse', 'API key as environment variable']],
        data: [['Offboarding NLE list', 'trigger'], ['Partner workbooks', 'active / departed tables']]
      },
      apis: [['Asset-management REST API', 'GET employees · GET assets/accessories · check-in', 'Automated check-in on offboarding'], ['Excel Online connector', 'Add row · Delete row', 'Moving employees between tables']],
      fns: [['Apply to each', 'Check in every assigned record'], ['Environment-variable lookup', 'Keeps the key out of the flow definition']],
      flows: ['nle', 'bt'],
      code: [{ title: 'Environment-variable lookup (Dataverse List rows)', lang: 'text', src: `Table:   Environment Variable Definitions
Filter:  schemaname eq 'new_AssetApiKey'
Expand:  environmentvariabledefinition_environmentvariablevalue($select=value)

ApiKey = first(outputs('List_rows')?['body/value'])
         ?['environmentvariabledefinition_environmentvariablevalue'][0]?['value']` }],
      features: [['🧹', 'List hygiene', 'Partner sheets stay current'], ['📦', 'Full check-in', 'Assets and pooled accessories'], ['🧾', 'Result trail', 'API response stored on the item'], ['🛡', 'Separate flows', 'A fix to one can\'t break the other']],
      impact: [['Hands-off', 'Asset recovery'], ['4', 'Partner tables kept in sync'], ['Logged', 'Every check-in result'], ['Safer', 'Offboarding hygiene']],
      pills: ['Power Automate', 'Excel', 'REST API', 'Dataverse'],
      summary: 'Offboarding used to depend on someone remembering a second system; now one column change does it, and the result is visible on the same record.',
      quote: 'Close the loop where the work already happens.'
    },
    /* ---------------- 21 · Greenshot ---------------- */
    {
      id: 'cs21', num: 21, cat: 'endpoint', catLabel: 'Endpoint', icon: 'END', short: 'Greenshot',
      title: ['Per-User App Settings', 'via Intune'], cardTitle: 'Per-User App Configuration via Intune',
      tagline: ['Diagnosed', 'Per-User', 'MSIX-Aware', 'Verified'],
      blurb: 'Why a Store/MSIX app installed fine but its hotkeys, destination and startup never applied — a per-user-state problem, not a deployment problem.',
      desc: 'The app deployed correctly but its settings never reached users. Root-cause analysis showed settings live in two separate per-user locations (an INI inside the MSIX package folder and a StartupTask registry value) and that a SYSTEM-context script was writing to the wrong profile.',
      badges: ['🔎 Root-Cause Analysis', '📦 MSIX Internals', '🧩 Intune Scripts', '🧪 Verify-Don\'t-Assume'],
      problem: ['Hotkey, save destination and launch-on-startup not applying', 'Script ran as SYSTEM so “per-user” writes landed in the wrong hive', 'Package paths are install-specific'],
      solution: ['Identified two separate settings locations', 'Resolve the package family name live, never hard-code it', 'Run the script in user context; Remediations noted as a licensing-gated option'],
      arch: ['Intune platform script (user context)', 'Greenshot.ini under the package\'s LocalCache', 'HKCU StartupTask registry value'],
      steps: [['Observe', 'Settings not applied'], ['Inspect', 'ini + registry'], ['Find cause', 'SYSTEM context'], ['Resolve PFN', 'Get-AppxPackage'], ['Write per-user', 'ini + startup key'], ['Verify', 'On a real device']],
      mock: { type: 'term', url: 'PowerShell — verification on a test device', lines: [['m', '# resolve the package instead of trusting last session\'s value'], ['p', 'PS> Get-AppxPackage -Name "HaukeGtze*" | Select PackageFamilyName'], ['g', 'HaukeGtze.GreenshotScreencapture_<hash>'], ['p', 'PS> Select-String FullscreenHotkey,Destinations $ini'], ['y', 'FullscreenHotkey=F9'], ['y', 'Destinations=Word'], ['p', 'PS> Get-ItemProperty "HKCU:\\…\\SystemAppData\\<PFN>\\Greenshot.exe"'], ['g', 'State : 2   # enabled — launches at sign-in']] },
      stack: {
        lang: [['PowerShell', 'configuration + diagnostics'], ['INI', 'application settings']],
        plat: [['Microsoft Intune', 'platform scripts, assignments'], ['Windows MSIX / AppX', 'per-user package storage'], ['Windows registry', 'HKCU StartupTask']],
        data: [['Greenshot.ini', 'hotkeys, destinations'], ['Registry value', 'launch on startup']]
      },
      apis: [['AppX / Windows PowerShell', 'Get-AppxPackage · Set-ItemProperty', 'Resolve the install-specific path and set values']],
      fns: [['Resolve-PackagePath', 'Builds the LocalCache path from the live package family name'], ['Set-StartupTask', 'Enables the MSIX StartupTask value for the current user']],
      flows: [],
      code: [{ title: 'Resolve, then configure — per user', lang: 'powershell', src: `$pkg = Get-AppxPackage -Name 'HaukeGtze*' -ErrorAction Stop       # never hard-code the hash
$ini = Join-Path $env:LOCALAPPDATA "Packages\\$($pkg.PackageFamilyName)\\LocalCache\\Roaming\\Greenshot\\Greenshot.ini"

if (Test-Path $ini) {
  (Get-Content $ini) -replace '^FullscreenHotkey=.*','FullscreenHotkey=F9' |
    Set-Content $ini
}

# launch-on-startup is NOT in the ini — it is an MSIX StartupTask value in HKCU
$key = "HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppModel\\SystemAppData\\$($pkg.PackageFamilyName)\\Greenshot.exe"
Set-ItemProperty -Path $key -Name State -Value 2` }],
      features: [['🔬', 'Evidence-first', 'Registry and files inspected on a real device'], ['📍', 'Two locations', 'ini and registry handled separately'], ['👤', 'User context', 'Right hive, right profile'], ['⚠', 'Licensing aware', 'Documented why Remediations was off the table']],
      impact: [['Root cause', 'Identified & documented'], ['2', 'Settings locations mapped'], ['Per-user', 'Design for deployment'], ['Reusable', 'For any MSIX app']],
      pills: ['Intune', 'PowerShell', 'MSIX', 'Windows'],
      summary: 'A reminder that “deployed” and “configured” are different states — the fix was understanding where an MSIX app keeps per-user state, not writing more script.',
      quote: 'Verify the live system; last week\'s facts expire.'
    },
    /* ---------------- 22 · Events site ---------------- */
    {
      id: 'cs22', num: 22, cat: 'web', catLabel: 'Web & Apps', icon: 'WEB', short: 'Event Hall Site',
      title: ['Event Venue', 'Website'], cardTitle: 'Event Venue Website & Inquiry Pipeline',
      tagline: ['Static', 'Serverless', 'Branded', 'Free to Host'],
      blurb: 'A public marketing site with an inquiry form and branded confirmation emails — static HTML plus one serverless function, hosted at zero cost.',
      desc: 'A hand-written marketing site for a private event hall: photo carousel, an inquiry form with catering and décor options, and a serverless function that sends a branded internal notification and a customer confirmation on every submission.',
      badges: ['🌐 Static Site', '⚡ Serverless Function', '✉ Branded Emails', '🪤 Spam Honeypot'],
      problem: ['A venue with no web presence or lead capture', 'Inquiries arriving as scattered calls and texts', 'Needed zero ongoing hosting cost'],
      solution: ['Responsive one-page site with carousel', 'AJAX inquiry form, no page reload', 'Function emails both the owner and the customer'],
      arch: ['index.html + styles.css + script.js — no framework', 'Netlify Function fires on every form submission', 'Resend API for transactional email'],
      steps: [['Visit', 'Photo carousel'], ['Inquire', 'AJAX form'], ['Filter', 'Honeypot field'], ['Function', 'submission-created'], ['Notify', 'Owner email'], ['Confirm', 'Customer email']],
      mock: { type: 'site', url: 'events-venue.netlify.app', h: 'Where Beautiful Celebrations Come Together', p: 'Weddings · Birthdays · Corporate events', cta: 'Plan Your Event →', fields: ['Name', 'Email', 'Phone', 'Event date', 'Event type', 'Guests'], submit: 'Send Inquiry' },
      stack: {
        lang: [['HTML / CSS / JavaScript', 'no build step'], ['Node.js', 'serverless function']],
        plat: [['Netlify', 'hosting, forms, functions'], ['Netlify CLI', 'deploys by explicit site ID'], ['GitHub', 'version control']],
        data: [['Netlify Forms', 'submission store'], ['Images', 're-encoded JPGs with logo checks']]
      },
      apis: [['Resend', 'POST /emails', 'Branded notification + confirmation'], ['Netlify Forms', 'submission-created event', 'Triggers the function with no webhook'], ['Google Maps', 'link-out', 'Directions']],
      fns: [['submission-created.js', 'Builds and sends both HTML emails'], ['script.js · carousel', 'Arrows, dots, top-biased crop'], ['script.js · AJAX submit', 'fetch POST with inline success state']],
      flows: [],
      code: [{ title: 'netlify/functions/submission-created.js (simplified)', lang: 'javascript', src: `exports.handler = async (event) => {
  const { payload } = JSON.parse(event.body);
  const d = payload.data;
  if (d.company) return { statusCode: 200 };            // honeypot: bots fill this field

  const send = (to, subject, html) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Events <onboarding@resend.dev>', to, subject, html })
  });

  await send(process.env.NOTIFY_TO, 'New inquiry — ' + d.name, ownerEmail(d));
  await send(d.email, 'Thanks for your inquiry', customerEmail(d));
  return { statusCode: 200 };
};` }],
      features: [['🖼', 'Photo carousel', 'Cropped for people and décor'], ['📝', 'Rich inquiry form', 'Catering and décor branches'], ['📧', 'Two branded emails', 'Owner + customer'], ['🛡', 'Honeypot', 'Quiet spam filter'], ['🚀', 'CLI deploys', 'Explicit site ID, repeatable'], ['💸', '$0 hosting', 'Free tier only']],
      impact: [['$0', 'Hosting cost'], ['2', 'Emails per inquiry'], ['0', 'Frameworks'], ['Live', 'Public site']],
      pills: ['HTML/CSS/JS', 'Netlify', 'Node.js', 'Resend'],
      summary: 'Full-stack from design to deploy on a free tier — including the discipline of not shipping photos that carry another business\'s branding.',
      quote: 'Small surface area, big first impression.'
    },
    /* ---------------- 23 · Learning Hub ---------------- */
    {
      id: 'cs23', num: 23, cat: 'web', catLabel: 'Web & Apps', icon: 'WEB', short: 'Learning Hub',
      title: ['Gamified', 'Learning Hub'], cardTitle: 'Gamified Learning Hub (Full-Stack)',
      tagline: ['Gamified', 'Adaptive', 'Serverless', 'Parent-Aware'],
      blurb: 'A private learning app for two kids: a daily quest, 11 mini-games, adaptive difficulty and a star economy, on GitHub Pages and Supabase with no server.',
      desc: 'A full-stack web app built end-to-end: a daily quest (subjects → reading → games → exercise), an adaptive mastery ladder, a star/reward economy, streaks, 11 standalone mini-games and a parent dashboard — vanilla JS in the browser talking straight to Supabase.',
      badges: ['🎮 11 Mini-Games', '🪜 Adaptive Mastery Ladder', '⭐ Star Economy', '🔐 RLS-Backed'],
      problem: ['Learning apps are either dull or ad-ridden', 'Different ages need different difficulty', 'Parents want progress visibility without a vendor account'],
      solution: ['Daily quest across subjects, reading and games', 'Per-child start grade and ceiling; level-ups on recent passes', 'Parent dashboard for content, rewards and progress'],
      arch: ['Static HTML/JS on GitHub Pages (auto-deploy on push)', 'Supabase REST from the browser with a publishable key', 'Row-level security as the real boundary'],
      steps: [['Sign in', 'Kid PIN'], ['Daily quest', '3 subjects · 2 passages'], ['Games', '2 per day'], ['Stars', 'Capped + bonuses'], ['Level up', '4-of-5 rule'], ['Parent view', 'Progress + rewards']],
      mock: { type: 'kids', url: 'prachi8833.github.io/Learning-Hub', h: 'Today\'s Quest', p: 'Subjects · Reading · Games · Dharma · Exercise', tiles: [['➗', 'Math Duel'], ['🔤', 'Word Builder'], ['✖', 'Times Tables'], ['🔬', 'Science Lab'], ['🌍', 'Geography'], ['🫀', 'Body Explorer'], ['📖', 'Story Order'], ['🏳', 'World Flags']], q: '⭐ 240 stars · 🔥 6-day streak', qb: 'Continue' },
      stack: {
        lang: [['JavaScript', 'no frameworks, no build'], ['HTML / CSS', 'self-contained pages'], ['SQL', 'tables, RLS, seed data']],
        plat: [['GitHub Pages', 'hosting, auto-deploy'], ['Supabase', 'Postgres + REST'], ['Git / GitHub', 'PR-based workflow']],
        data: [['subjects / questions / sessions', 'content + attempts'], ['stars_log', 'balance = SUM(amount)'], ['game_scores', 'upserts per game'], ['star_config', 'economy values']]
      },
      apis: [['Supabase PostgREST', 'GET/POST/PATCH /rest/v1/<table>', 'All reads and writes from the browser'], ['Web Storage', 'localStorage', 'Auto re-login, daily plan']],
      fns: [['db(path, opts)', 'Thin fetch wrapper for PostgREST'], ['recordTopicRoundResult()', 'Mastery ladder: 4-of-5 passes → level up, never demote'], ['applyDailyCap()', 'Star cap across learning + reading + games'], ['pickTopicsForSubject()', 'Chooses and persists 2 topics per visit'], ['loadQ()', 'Dispatches question types: MCQ, fill-in, rearrange, matching']],
      flows: [],
      code: [{ title: 'Browser → Supabase with no server', lang: 'javascript', src: `const SB = 'https://<project>.supabase.co/rest/v1';
const KEY = '<publishable key>';                         // safe because RLS enforces access

async function db(path, opt = {}) {
  const r = await fetch(SB + path, { ...opt, headers: {
    apikey: KEY, Authorization: 'Bearer ' + KEY,
    'Content-Type': 'application/json', Prefer: 'return=representation', ...opt.headers } });
  if (!r.ok) throw new Error(path + ' → ' + r.status);
  return r.status === 204 ? null : r.json();
}

// local midnight, never UTC — the classic streak bug
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };` }],
      features: [['🧭', 'Daily quest', 'Five phases, state persisted'], ['🪜', 'Mastery ladder', 'Per-child grade range'], ['🌱', 'Streak garden', 'Visual reward'], ['🎯', 'Question types', 'MCQ, fill-in, matching, rearrange'], ['🛠', 'Parent dashboard', 'Content and rewards admin'], ['📚', 'ARCHITECTURE.md', 'Written for future-me']],
      impact: [['11', 'Standalone games'], ['2', 'Kids, 2 difficulty tracks'], ['0', 'Servers to run'], ['PR-based', 'Delivery with docs']],
      pills: ['JavaScript', 'Supabase', 'GitHub Pages', 'SQL'],
      summary: 'A product-sized build outside of work: data model, game contract, economy tuning and RLS — shipped with an architecture document so every change is deliberate.',
      quote: 'Learning sticks when it feels like play.'
    }
  ];

  /* deep-dives attached to existing case studies */
  const extend = [
    {
      target: 'cs6', short: 'Offboarding Hub', cardTitle: 'Offboarding Hub',
      mock: { type: 'dash', url: 'sharepoint.com/…/Offboarding-Dashboard.aspx', brand: 'Offboarding Hub', active: 0, nav: [['Tasks', 6], ['New Request'], ['Archive'], ['Calendar'], ['Analytics'], ['People'], ['Settings']], title: 'Active Offboardings', btn: '+ New Request', btn2: 'Export',
        kpis: [['11', 'Active', '#4a8fd4'], ['6', 'Tasks due this week', '#e8b54d'], ['94%', 'Checklist complete', '#4cc38a'], ['3', 'Awaiting IT', '#a78bfa']],
        cols: ['Employee', 'Last day', 'HR', 'IT', 'Ops'], rows: [['Alex R.', 'Oct 17', '@ok|Done', '@wa|Pending', '@ok|Done'], ['Sam P.', 'Oct 21', '@wa|Pending', '@mu|—', '@mu|—'], ['Riley T.', 'Oct 24', '@ok|Done', '@ok|Done', '@in|In progress']],
        bars: [['HR', 82, '82%'], ['IT', 64, '64%'], ['Operations', 91, '91%']] },
      stack: { lang: [['JavaScript (ES5)', '~6,500 lines, one IIFE'], ['HTML / CSS', '~770-line shell'], ['Flow expressions', 'companion flows']], plat: [['SharePoint Online', 'Script Editor web part'], ['Microsoft Entra ID', 'people picker'], ['Power Automate', 'NLE + asset flows']], data: [['Offboarding list(s)', 'tasks, status, archive'], ['Settings list', 'config'], ['localStorage', 'tour-seen flag']] },
      apis: [['SharePoint REST', 'lists · items · batch', 'Requests, tasks, archive'], ['Entra people search', 'people-picker service', 'Employee lookup'], ['Power Automate', 'list triggers', 'Partner table moves and asset check-in']],
      fns: [['renderTasks() / renderArchive()', 'Checklist and archive views'], ['renderCalendar()', 'Last-day calendar'], ['renderAnalytics()', 'Completion by team'], ['pw-tour-guide.js', 'Standalone guided tour via window bridges']],
      flows: ['nle', 'bt'],
      code: [{ title: 'Deploy model — JS via sync, HTML via the page canvas', lang: 'text', src: `JS  : edit locally → OneDrive sync → SiteAssets/…/ParkWest-Offboarding-Hub.js
        (the web part re-adds ?pnp=<timestamp> on every load, so a reload always gets new code)
HTML: pasted snapshot in the page's CanvasContent1
        (edit via the SitePages API when the shell changes)` }]
    },
    {
      target: 'cs11', short: 'Equipment Hub', cardTitle: 'Equipment Movement Hub',
      mock: { type: 'dash', url: 'sharepoint.com/sites/IT-HelpDesk/…', brand: 'Equipment Hub', active: 1, nav: [['Dashboard'], ['New Transfer'], ['Spare Usage'], ['History'], ['Ask a Question'], ['Settings']], title: 'New Transfer', btn: 'Submit', btn2: 'Cancel',
        kpis: [['4', 'Sites', '#4a8fd4'], ['2', 'Item types', '#a78bfa'], ['Live', 'Asset sync', '#4cc38a'], ['Teams', 'Notifications', '#e8b54d']],
        cols: ['Item', 'Type', 'From → To', 'Qty', 'Status'], rows: [['Headset', 'Serialized asset', 'Site A → Alex R.', '1', '@ok|Success'], ['Keyboard', 'Pooled accessory', 'Site B → Site A', '5', '@ok|Success'], ['Cable', 'Pooled accessory', 'Site A → Site C', '10', '@wa|Complete — running']] },
      stack: { lang: [['JavaScript', 'transfer form, Entra search'], ['Flow expressions', 'trigger conditions, validation'], ['JSON', 'config-driven settings']], plat: [['SharePoint Online', 'IT site, lists'], ['Power Automate', '3+ flows'], ['Dataverse', 'API key env variable'], ['Microsoft Teams', 'channel notifications']], data: [['AccessoryTransfers', 'Draft / Complete / Success / Failed'], ['SpareUsage', 'spares consumption'], ['Equipment Hub Settings', 'config-driven columns']] },
      apis: [['Asset-management REST API', 'GET/PUT assets · accessories · employees', 'Check-out, check-in, transfers'], ['SharePoint REST', 'lists', 'Requests + settings'], ['Entra people search', 'people-picker', 'Employee search on the form']],
      fns: [['Config-driven columns', 'Locations / categories in a settings JSON, not Choice columns'], ['Validation gate', '4-clause condition before any API write'], ['Status as state machine', 'Draft → Complete → Success / Failed']],
      flows: ['xfer', 'bt'],
      code: [{ title: 'Trigger condition + guarded update', lang: 'text', src: `Trigger condition : @equals(triggerOutputs()?['body/Status/Value'], 'Complete')
Validation (all 4) : source.quantity >= Quantity
                     SourceAccessoryId != DestinationAccessoryId
                     Quantity > 0
                     DestinationAccessoryId > 0
On success         : PUT source (qty − n), PUT destination (qty + n), Status = Success
On failure         : Status = Failed, reason → BlueTallyResponse` }]
    },
    {
      target: 'cs14', short: 'Knowledge Base', cardTitle: 'Knowledge Base',
      mock: { type: 'wiki', url: 'sharepoint.com/sites/WIKI/…/Knowledge-Hub.aspx', search: 'Search articles…', cats: ['★ Favorites', 'HR & Policies', 'IT', 'Operations', 'Finance'], active: 1, h: 'Acceptable Use Policy', badge: 'Updated today', box: 'Contents · 1 Purpose · 2 Scope · 3 Responsibilities', sign: 'Acknowledge & sign', signNote: 'A signed copy is routed to HR' },
      stack: { lang: [['JavaScript', 'SPA, router, rich-text editor'], ['HTML / CSS', 'article rendering']], plat: [['SharePoint Online', 'WIKI site'], ['PnP Script Editor', 'web part host'], ['Microsoft Graph', 'user / group lookups']], data: [['WikiArticles', 'ArticleJson per row'], ['PolicyArticles', 'formal policies'], ['Per-user settings rows', 'favorites + “updated” badges']] },
      apis: [['SharePoint REST', 'items · attachments · permissions', 'Articles, categories, image upload'], ['Microsoft Graph', '/users · /groups', 'People and role resolution']],
      fns: [['canEditArticle()', 'SuperAdmin / department-admin rules'], ['syncContentsBox()', 'Auto-builds the Contents block from h2 headings'], ['wireArticleFind()', 'Per-article Ctrl+F without re-rendering'], ['Favorites & Updated badge', 'Server-persisted per-user state']],
      flows: [],
      code: [{ title: 'Per-user state stored server-side', lang: 'javascript', src: `// favorites follow the person across devices — not localStorage
const FAV = { AppID: 'kb-favorites', User: me.email };
async function saveFavorites(ids) {
  const row = await findRow(FAV);
  return row ? spUpdate('ScopeSettings', row.Id, { Value: JSON.stringify(ids) })
             : spCreate('ScopeSettings', { ...FAV, Value: JSON.stringify(ids) });
}` }]
    },
    {
      target: 'cs12', short: 'Intune Policies', cardTitle: 'Intune & Entra Hardening',
      mock: { type: 'term', url: 'PowerShell — Graph audit', lines: [['m', '# list Settings Catalog policies and where they are assigned'], ['p', 'PS> Connect-MgGraph -NoWelcome'], ['p', 'PS> Get-PolicyAssignmentReport | Sort Policy'], ['g', 'Policy                          Targets'], ['y', 'Windows – Laptop baseline         grp-laptops'], ['y', 'Browser – Restricted tier          grp-highly-restricted'], ['r', 'CONFLICT  Chrome URL blocklist     device scope vs user scope'], ['g', '→ resolved: moved to a single scope, group renamed to convention']] },
      stack: { lang: [['PowerShell', 'Microsoft Graph SDK'], ['JSON', 'Settings Catalog payloads']], plat: [['Microsoft Intune', 'Settings Catalog policies'], ['Microsoft Entra ID', 'security groups, naming convention'], ['Microsoft Teams admin', 'guest / group-creation lockdown']], data: [['Policy & group ID map', 'living documentation'], ['Root-cause history', 'why the tenant looks this way']] },
      apis: [['Microsoft Graph (beta)', 'deviceManagement/configurationPolicies · /assignments', 'Policy inventory and assignment audit'], ['Microsoft Graph', 'groups · members', 'Group cleanup and targeting']],
      fns: [['Policy ↔ group inventory', 'Cross-reference of what targets what'], ['Conflict triage', 'Pair Graph data with the portal\'s per-device drill-down'], ['Naming convention', 'Device vs. user groups, tiered laptop families']],
      flows: [],
      code: [{ title: 'Assignment audit (Graph PowerShell)', lang: 'powershell', src: `$policies = (Invoke-MgGraphRequest -Uri 'beta/deviceManagement/configurationPolicies?$top=100').value

$report = foreach ($p in $policies) {
  $a = (Invoke-MgGraphRequest -Uri "beta/deviceManagement/configurationPolicies/$($p.id)/assignments").value
  foreach ($t in $a) {
    [pscustomobject]@{ Policy = $p.name; GroupId = $t.target.groupId; Intent = $t.target.'@odata.type' }
  }
}
$report | Sort-Object Policy | Format-Table -AutoSize` }]
    }
  ];

  return { sys, flows, patterns, languages, pattern, also, projects, extend };
})();
