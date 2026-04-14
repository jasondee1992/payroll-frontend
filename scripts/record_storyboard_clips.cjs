/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs/promises");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE_URL = "http://127.0.0.1:3000";
const BACKEND_URL = "http://127.0.0.1:8000";
const OUTPUT_DIR = "D:\\Projects\\ss\\videos";
const SUMMARY_PATH = path.join(OUTPUT_DIR, "video_recording_summary.txt");
const TEMP_DIR = path.join(OUTPUT_DIR, ".storyboard-temp");
const STATE_DIR = path.join(TEMP_DIR, "auth-states");
const BROWSER_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

const ROLE_CONFIGS = {
  "system-admin": { username: "superadmin", password: "12345678" },
  hr: { username: "hr", password: "12345678" },
  finance: { username: "finance", password: "12345678" },
  admin: { username: "emp.01", password: "12345678" },
  employee: { username: "employee", password: "12345678" },
  "admin-finance": { username: "admin-finance", password: "12345678" },
};
const CLIP_FILTER = (process.env.STORYBOARD_CLIPS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const STORYBOARD_CLIPS = [
  {
    fileName: "01_system_overview_dashboard.webm",
    line: "1",
    role: "admin-finance",
    note:
      "Best match for the opening line showing the centralized payroll workspace and primary navigation.",
    run: recordSystemOverviewDashboard,
  },
  {
    fileName: "02_secure_login_flow.webm",
    line: "2",
    role: "admin-finance",
    note:
      "Shows the secure login page, credential entry, and transition into the main workspace.",
    run: recordSecureLoginFlow,
  },
  {
    fileName: "03_structured_workspace_navigation.webm",
    line: "3",
    role: "admin-finance",
    note:
      "Shows the structured dashboard, sidebar, and major navigation areas with smooth transitions.",
    run: recordStructuredWorkspaceNavigation,
  },
  {
    fileName: "04_employee_profile_management.webm",
    line: "4",
    role: "admin",
    note:
      "Shows the employee directory and employee profile management flow from list view into detail tabs.",
    run: recordEmployeeProfileManagement,
  },
  {
    fileName: "05_payroll_setup.webm",
    line: "5",
    role: "admin",
    note:
      "Uses the employee edit page as the closest equivalent for payroll setup in the current app.",
    run: recordPayrollSetup,
  },
  {
    fileName: "05_government_details.webm",
    line: "5",
    role: "admin",
    note: "Shows the Government Information tab on the employee profile.",
    run: (page) => recordEmployeeDetailTab(page, "Government Information"),
  },
  {
    fileName: "05_salary_profile.webm",
    line: "5",
    role: "admin",
    note: "Shows the Salary Profile tab on the employee profile.",
    run: (page) => recordEmployeeDetailTab(page, "Salary Profile"),
  },
  {
    fileName: "05_payroll_rules.webm",
    line: "5",
    role: "admin",
    note: "Shows the Payroll Rules tab on the employee profile.",
    run: (page) => recordEmployeeDetailTab(page, "Payroll Rules"),
  },
  {
    fileName: "05_loans.webm",
    line: "5",
    role: "admin",
    note: "Shows the Government Loans section with an expanded loan history when available.",
    run: recordGovernmentLoans,
  },
  {
    fileName: "05_payroll_history.webm",
    line: "5",
    role: "admin",
    note: "Shows the Payroll History tab on the employee profile.",
    run: (page) => recordEmployeeDetailTab(page, "Payroll History"),
  },
  {
    fileName: "06_role_view_system_admin.webm",
    line: "6",
    role: "system-admin",
    note: "Shows the restricted system-admin navigation focused on Employees and Settings.",
    run: recordRoleNavigationClip,
  },
  {
    fileName: "06_role_view_hr.webm",
    line: "6",
    role: "hr",
    note: "Shows the HR role navigation and accessible modules.",
    run: recordRoleNavigationClip,
  },
  {
    fileName: "06_role_view_finance.webm",
    line: "6",
    role: "finance",
    note: "Shows the Finance role navigation including payroll and reports access.",
    run: recordRoleNavigationClip,
  },
  {
    fileName: "06_role_view_admin.webm",
    line: "6",
    role: "admin",
    note: "Shows the Admin role navigation with broad operational access.",
    run: recordRoleNavigationClip,
  },
  {
    fileName: "06_role_view_employee.webm",
    line: "6",
    role: "employee",
    note: "Shows the Employee self-service navigation including attendance and payslips.",
    run: recordRoleNavigationClip,
  },
  {
    fileName: "06_role_view_admin_finance.webm",
    line: "6",
    role: "admin-finance",
    note: "Shows the Admin-Finance role navigation with payroll and reports visibility.",
    run: recordRoleNavigationClip,
  },
  {
    fileName: "07_attendance_monitoring.webm",
    line: "7",
    role: "admin",
    note: "Shows the attendance workspace and monitoring interface.",
    run: recordAttendanceMonitoring,
  },
  {
    fileName: "07_payslip_access.webm",
    line: "7",
    role: "employee",
    note: "Shows the employee payslips workspace as the clearest payslip access view.",
    run: recordPayslipAccess,
  },
  {
    fileName: "07_workspace_configuration.webm",
    line: "7",
    role: "system-admin",
    note: "Shows the system-admin settings workspace and branding configuration view.",
    run: recordWorkspaceConfiguration,
  },
  {
    fileName: "08_operational_control_overview.webm",
    line: "8",
    role: "admin-finance",
    note: "Shows finance-focused reporting and overview surfaces for operational control.",
    run: recordOperationalControlOverview,
  },
  {
    fileName: "09_final_centralized_workspace.webm",
    line: "9",
    role: "admin-finance",
    note: "Ends on a clean centralized workspace view with a stable hold for the closing frame.",
    run: recordFinalCentralizedWorkspace,
  },
];

async function main() {
  const browserPath = await resolveBrowserPath();
  const activeClips =
    CLIP_FILTER.length > 0
      ? STORYBOARD_CLIPS.filter((clip) => CLIP_FILTER.includes(clip.fileName))
      : STORYBOARD_CLIPS;
  const summary = {
    frontendStartCommand:
      "Existing running instance detected; no new command executed. Standard command: npm run dev",
    backendStartCommand:
      "Existing running instance detected; no new command executed. Standard command: D:\\Projects\\payroll-backend\\venv\\Scripts\\python -m uvicorn app.main:app --reload",
    frontendUrl: BASE_URL,
    backendUrl: BACKEND_URL,
    rolesTested: [],
    clips: [],
    sectionsCompleted: [],
    missing: [],
    errors: [],
  };

  await prepareOutput(CLIP_FILTER.length > 0, activeClips);
  await buildAuthStates(browserPath, summary, activeClips);

  for (const clip of activeClips) {
    await recordClip(browserPath, clip, summary);
  }

  await writeSummary(summary, activeClips);
}

async function prepareOutput(isPartialRun, activeClips) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  if (!isPartialRun) {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  }
  await fs.mkdir(STATE_DIR, { recursive: true });

  for (const clip of activeClips) {
    await fs.rm(path.join(OUTPUT_DIR, clip.fileName), { force: true });
  }
}

async function buildAuthStates(browserPath, summary, activeClips) {
  for (const role of unique(activeClips.map((clip) => clip.role))) {
    const roleConfig = ROLE_CONFIGS[role];
    if (!roleConfig) {
      summary.missing.push(`No role credentials configured for ${role}.`);
      continue;
    }

    const browser = await launchBrowser(browserPath);
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1200 },
    });
    const page = await context.newPage();
    const statePath = getStatePath(role);

    try {
      await login(page, roleConfig);
      await context.storageState({ path: statePath });
      summary.rolesTested.push(role);
    } catch (error) {
      summary.errors.push(`Unable to build auth state for ${role}: ${formatError(error)}`);
    } finally {
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }
}

async function recordClip(browserPath, clip, summary) {
  const statePath = getStatePath(clip.role);
  const targetPath = path.join(OUTPUT_DIR, clip.fileName);
  const tempVideoDir = path.join(TEMP_DIR, sanitizeFileBaseName(clip.fileName));

  if (clip.fileName !== "02_secure_login_flow.webm") {
    try {
      await fs.access(statePath);
    } catch {
      summary.missing.push(
        `${clip.fileName}: skipped because auth state for ${clip.role} was not created.`,
      );
      return;
    }
  }

  await fs.rm(tempVideoDir, { recursive: true, force: true });
  await fs.mkdir(tempVideoDir, { recursive: true });

  const browser = await launchBrowser(browserPath);
  let context = null;
  let page = null;
  let video = null;

  try {
    context = await browser.newContext({
      viewport: { width: 1600, height: 1200 },
      ...(clip.fileName === "02_secure_login_flow.webm" ? {} : { storageState: statePath }),
      recordVideo: {
        dir: tempVideoDir,
        size: { width: 1600, height: 1200 },
      },
    });
    page = await context.newPage();
    video = page.video();

    await clip.run(page, clip.role);
    await pause(page, 900);
    summary.clips.push(targetPath);
    summary.sectionsCompleted.push(`Line ${clip.line}: ${clip.fileName}`);
  } catch (error) {
    summary.errors.push(`${clip.fileName}: ${formatError(error)}`);
  } finally {
    await page?.close().catch(() => {});
    await context?.close().catch(() => {});
    await browser.close().catch(() => {});

    if (video) {
      try {
        const sourcePath = await video.path();
        await moveFile(sourcePath, targetPath);
      } catch (error) {
        summary.errors.push(`${clip.fileName}: video finalize failed: ${formatError(error)}`);
      }
    }
  }
}

async function recordSystemOverviewDashboard(page) {
  await openRoleLanding(page, "admin-finance", "/dashboard");
  await pause(page, 1500);
  await hoverNavLink(page, "/dashboard");
  await hoverNavLink(page, "/payroll");
  await hoverNavLink(page, "/reports");
  await hoverCardByText(page, "Current");
  await hoverCardByText(page, "Attention");
  await pause(page, 2000);
}

async function recordSecureLoginFlow(page) {
  const roleConfig = ROLE_CONFIGS["admin-finance"];

  await gotoAndSettle(page, `${BASE_URL}/login`);
  await moveMouseToLocator(page, page.locator('input[name="usernameOrEmail"]'));
  await enterInputValue(page, 'input[name="usernameOrEmail"]', roleConfig.username);
  await pause(page, 500);
  await moveMouseToLocator(page, page.locator('input[name="password"]'));
  await enterInputValue(page, 'input[name="password"]', roleConfig.password);
  await pause(page, 500);
  const signInButton = page.getByRole("button", { name: /sign in/i });
  await moveMouseToLocator(page, signInButton);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
  const redirectTo = await authenticateContext(page.context(), roleConfig);
  await gotoAndSettle(page, `${BASE_URL}${redirectTo}`);
  await waitForSettledUi(page, 1200);
  await pause(page, 2000);
}

async function recordStructuredWorkspaceNavigation(page) {
  await openRoleLanding(page, "admin-finance", "/dashboard");
  await pause(page, 1000);
  await clickNavLink(page, "/employees");
  await pause(page, 1300);
  await clickNavLink(page, "/payroll");
  await pause(page, 1300);
  await clickNavLink(page, "/reports");
  await pause(page, 1300);
  await clickNavLink(page, "/dashboard");
  await pause(page, 1800);
}

async function recordEmployeeProfileManagement(page) {
  await gotoEmployees(page, "admin");
  await pause(page, 1200);
  await hoverCardByText(page, "Employees");
  const employeeHref = await firstEmployeeDetailHref(page);
  if (!employeeHref) {
    throw new Error("No employee detail link was found.");
  }
  await moveMouseToLocator(page, page.locator(`a[href="${employeeHref}"]`).first());
  await page.locator(`a[href="${employeeHref}"]`).first().click();
  await waitForSettledUi(page, 1400);
  await clickButtonByText(page, "Work Information");
  await pause(page, 1500);
  await clickButtonByText(page, "Basic Information");
  await pause(page, 1800);
}

async function recordPayrollSetup(page) {
  await openRoleLanding(page, "admin", "/employees/EMP-001/edit");
  await pause(page, 1200);
  await scrollIntoView(page, page.getByText("Payroll Policy Profile", { exact: true }));
  await hoverFieldLabel(page, "Payroll Policy Profile");
  await hoverFieldLabel(page, "Payroll Schedule");
  await hoverFieldLabel(page, "Salary Pay Frequency");
  await pause(page, 1800);
}

async function recordEmployeeDetailTab(page, tabLabel) {
  await openRoleLanding(page, "admin", "/employees/EMP-001");
  await pause(page, 1000);
  await clickButtonByText(page, tabLabel);
  await pause(page, 1800);
  await hoverCardByText(page, tabLabel);
  await pause(page, 1500);
}

async function recordGovernmentLoans(page) {
  await openRoleLanding(page, "admin", "/employees/EMP-001");
  await clickButtonByText(page, "Government Loans");
  await pause(page, 1800);

  const historyButton = page.getByRole("button", { name: /view history/i }).first();
  if (await historyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await moveMouseToLocator(page, historyButton);
    await historyButton.click();
    await waitForSettledUi(page, 1400);
  }

  await hoverCardByText(page, "Government Loans");
  await pause(page, 1800);
}

async function recordRoleNavigationClip(page, role) {
  const route = role === "system-admin" ? "/employees" : "/dashboard";
  await openRoleLanding(page, role, route);
  await pause(page, 1000);

  const links = await getSidebarItems(page);
  for (const item of links.slice(0, Math.min(5, links.length))) {
    await hoverNavLink(page, item.href);
    await pause(page, 350);
  }

  await pause(page, 1500);
}

async function recordAttendanceMonitoring(page) {
  await openRoleLanding(page, "admin", "/attendance");
  await pause(page, 1400);
  await hoverCardByText(page, "Attendance");
  await hoverTextIfVisible(page, "Exceptions");
  await pause(page, 1800);
}

async function recordPayslipAccess(page) {
  await openRoleLanding(page, "employee", "/payslips");
  await pause(page, 1400);
  await hoverCardByText(page, "Payslip");
  await pause(page, 1800);
}

async function recordWorkspaceConfiguration(page) {
  await openRoleLanding(page, "system-admin", "/settings");
  await pause(page, 1400);
  await hoverTextIfVisible(page, "Company Name");
  await hoverTextIfVisible(page, "Company Logo");
  await hoverTextIfVisible(page, "Login Background");
  await pause(page, 1800);
}

async function recordOperationalControlOverview(page) {
  await openRoleLanding(page, "admin-finance", "/reports");
  await pause(page, 1400);
  await hoverCardByText(page, "Net Pay");
  await hoverCardByText(page, "Government");
  await pause(page, 1000);
  await gotoAndSettle(page, `${BASE_URL}/payroll/results`);
  await pause(page, 1400);
  await hoverCardByText(page, "Payroll");
  await pause(page, 1600);
}

async function recordFinalCentralizedWorkspace(page) {
  await openRoleLanding(page, "admin-finance", "/dashboard");
  await pause(page, 1200);
  await hoverNavLink(page, "/dashboard");
  await hoverCardByText(page, "Current");
  await pause(page, 2600);
}

async function openRoleLanding(page, role, route) {
  const statePath = getStatePath(role);
  try {
    await fs.access(statePath);
  } catch {
    throw new Error(`Missing auth state for role ${role}.`);
  }

  await gotoAndSettle(page, `${BASE_URL}${route}`);
}

async function gotoEmployees(page, role) {
  await openRoleLanding(page, role, "/employees");
}

async function login(page, roleConfig) {
  const redirectTo = await authenticateContext(page.context(), roleConfig);
  await gotoAndSettle(page, `${BASE_URL}${redirectTo}`);
  await waitForSettledUi(page, 1200);
}

async function clickNavLink(page, href) {
  const locator = page.locator(`aside nav a[href="${href}"]`).first();
  await moveMouseToLocator(page, locator);
  await locator.click();
  await waitForSettledUi(page, 1400);
}

async function hoverNavLink(page, href) {
  const locator = page.locator(`aside nav a[href="${href}"]`).first();
  if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
    await moveMouseToLocator(page, locator);
    await pause(page, 500);
  }
}

async function clickButtonByText(page, text) {
  let locator = page
    .getByRole("button", { name: new RegExp(`^${escapeRegex(text)}$`, "i") })
    .first();

  if (!(await locator.isVisible({ timeout: 1200 }).catch(() => false))) {
    locator = page.locator("button").filter({ hasText: new RegExp(text, "i") }).first();
  }

  await moveMouseToLocator(page, locator);
  await locator.click();
  await waitForSettledUi(page, 1400);
}

async function hoverFieldLabel(page, text) {
  const locator = page.getByText(text, { exact: true }).first();
  if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
    await moveMouseToLocator(page, locator);
    await pause(page, 550);
  }
}

async function hoverCardByText(page, text) {
  const locator = page.getByText(new RegExp(text, "i")).first();
  if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
    await moveMouseToLocator(page, locator);
    await pause(page, 500);
  }
}

async function hoverTextIfVisible(page, text) {
  const locator = page.getByText(new RegExp(text, "i")).first();
  if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) {
    await moveMouseToLocator(page, locator);
    await pause(page, 450);
  }
}

async function scrollIntoView(page, locator) {
  if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
    await locator.scrollIntoViewIfNeeded();
    await waitForSettledUi(page, 900);
  }
}

async function firstEmployeeDetailHref(page) {
  const hrefs = await page.locator('a[href^="/employees/"]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute("href"))
      .filter((href) => href && !href.endsWith("/new") && !href.endsWith("/edit")),
  );

  return hrefs[0] ?? null;
}

async function getSidebarItems(page) {
  return page.locator("aside nav a[href]").evaluateAll((elements) => {
    const seen = new Set();
    const items = [];

    for (const element of elements) {
      const href = element.getAttribute("href");
      const label = element.textContent?.trim().replace(/\s+/g, " ") ?? "";
      if (!href || !label || seen.has(href)) {
        continue;
      }
      seen.add(href);
      items.push({ href, label });
    }

    return items;
  });
}

async function gotoAndSettle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForSettledUi(page);
}

async function authenticateContext(context, roleConfig) {
  const response = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      usernameOrEmail: roleConfig.username,
      password: roleConfig.password,
      remember: true,
      redirectTo: null,
    },
  });
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(responseBody.error ?? `Auth bridge failed with status ${response.status()}.`);
  }

  return responseBody.redirectTo ?? "/dashboard";
}

async function waitForSettledUi(page, delay = 1200) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // Continue even when the app keeps polling.
  }
  await page.waitForTimeout(delay);
}

async function moveMouseToLocator(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (!box) {
    return;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 28 });
}

async function enterInputValue(page, selector, value) {
  const locator = page.locator(selector);
  await locator.click();
  await locator.evaluate((input, nextValue) => {
    const descriptor = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    );
    descriptor?.set?.call(input, nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.blur();
  }, value);
  await page.waitForTimeout(150);
}

async function pause(page, delay = 1000) {
  await page.waitForTimeout(delay);
}

async function launchBrowser(executablePath) {
  return chromium.launch({
    headless: true,
    executablePath,
  });
}

async function resolveBrowserPath() {
  for (const candidate of BROWSER_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next path.
    }
  }

  throw new Error("No supported local browser executable found.");
}

function getStatePath(role) {
  return path.join(STATE_DIR, `${role}.json`);
}

async function moveFile(sourcePath, targetPath) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await fs.rename(sourcePath, targetPath);
      return;
    } catch (error) {
      if (attempt === 5) {
        await fs.copyFile(sourcePath, targetPath);
        await wait(500);
        await fs.rm(sourcePath, { force: true });
        return;
      }
      await wait(600);
      if (error && error.code !== "EBUSY" && error.code !== "EPERM") {
        throw error;
      }
    }
  }
}

async function wait(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

async function writeSummary(summary, activeClips) {
  const lines = [
    `frontend start command used: ${summary.frontendStartCommand}`,
    `backend start command used: ${summary.backendStartCommand}`,
    `frontend url: ${summary.frontendUrl}`,
    `backend url: ${summary.backendUrl}`,
    "",
    `roles successfully tested: ${unique(summary.rolesTested).join(", ")}`,
    "",
    "clips recorded:",
  ];

  for (const clip of summary.clips) {
    lines.push(`- ${clip}`);
  }

  lines.push("");
  lines.push("sections completed:");
  for (const section of summary.sectionsCompleted) {
    lines.push(`- ${section}`);
  }

  lines.push("");
  lines.push("missing or inaccessible features:");
  if (summary.missing.length === 0) {
    lines.push("- none");
  } else {
    for (const item of summary.missing) {
      lines.push(`- ${item}`);
    }
  }

  lines.push("");
  lines.push("errors encountered:");
  if (summary.errors.length === 0) {
    lines.push("- none");
  } else {
    for (const item of summary.errors) {
      lines.push(`- ${item}`);
    }
  }

  lines.push("");
  lines.push("notes on which clips best match each voiceover line:");
  for (const clip of activeClips) {
    lines.push(`- Line ${clip.line}: ${clip.fileName} -> ${clip.note}`);
  }

  lines.push("");
  lines.push("notes:");
  lines.push("- Clips were recorded as short reusable browser-automation videos, not one long raw walkthrough.");
  lines.push("- Videos were saved as .webm because no local mp4 conversion tool such as ffmpeg was available.");
  lines.push("- Payroll setup in clip 05_payroll_setup uses the employee edit page as the closest equivalent in the current UI.");

  await fs.writeFile(SUMMARY_PATH, `${lines.join("\n")}\n`, "utf8");
}

function sanitizeFileBaseName(fileName) {
  return fileName.replace(/[^a-z0-9._-]+/gi, "_");
}

function unique(values) {
  return [...new Set(values)];
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch(async (error) => {
  const lines = [
    "storyboard clip recording failed before completion.",
    `error: ${formatError(error)}`,
  ];
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(SUMMARY_PATH, `${lines.join("\n")}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
