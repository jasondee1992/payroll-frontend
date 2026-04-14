/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs/promises");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE_URL = "http://127.0.0.1:3000";
const BACKEND_URL = "http://127.0.0.1:8000";
const OUTPUT_ROOT = "D:\\Projects\\ss";
const BROWSER_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

const ROLE_CONFIGS = [
  { role: "system-admin", username: "superadmin", password: "12345678" },
  { role: "hr", username: "hr", password: "12345678" },
  { role: "finance", username: "finance", password: "12345678" },
  { role: "admin", username: "emp.01", password: "12345678" },
  { role: "employee", username: "employee", password: "12345678" },
  { role: "admin-finance", username: "admin-finance", password: "12345678" },
];

const EXTRA_ROUTES_BY_ROLE = {
  "system-admin": [],
  hr: [],
  finance: ["/payroll/run", "/payroll/results", "/payroll/periods"],
  admin: ["/payroll/run", "/payroll/results", "/payroll/periods"],
  employee: [],
  "admin-finance": ["/payroll/run", "/payroll/results", "/payroll/periods"],
};

async function main() {
  const browserPath = await resolveBrowserPath();
  const summary = {
    frontendStartCommand: "Existing running instance detected; no new command executed. Standard command: npm run dev",
    backendStartCommand:
      "Existing running instance detected; no new command executed. Standard command: D:\\Projects\\payroll-backend\\venv\\Scripts\\python -m uvicorn app.main:app --reload",
    frontendUrl: BASE_URL,
    backendUrl: BACKEND_URL,
    rolesTested: [],
    navItemsByRole: {},
    pagesVisited: [],
    screenshots: [],
    inaccessible: [],
    errors: [],
    notes: [],
  };

  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  await fs.mkdir(path.join(OUTPUT_ROOT, "common"), { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: browserPath,
  });

  try {
    await captureLoginPage(browser, summary);

    for (const roleConfig of ROLE_CONFIGS) {
      await captureRole(browser, roleConfig, summary);
    }
  } finally {
    await browser.close();
  }

  await writeSummary(summary);
}

async function captureLoginPage(browser, summary) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
  });
  const page = await context.newPage();

  try {
    await gotoAndSettle(page, `${BASE_URL}/login`);
    const target = path.join(OUTPUT_ROOT, "common", "common_login_page_01.png");
    await page.screenshot({ path: target, fullPage: true });
    summary.screenshots.push(target);
    summary.pagesVisited.push("/login");
  } catch (error) {
    summary.errors.push(`login page capture failed: ${formatError(error)}`);
  } finally {
    await context.close();
  }
}

async function captureRole(browser, roleConfig, summary) {
  const roleDir = path.join(OUTPUT_ROOT, roleConfig.role);
  await fs.mkdir(roleDir, { recursive: true });

  const state = { counters: {} };
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
  });
  const page = await context.newPage();

  summary.rolesTested.push(roleConfig.role);

  try {
    await login(page, roleConfig);
    await waitForSettledUi(page);

    await capture(page, roleConfig.role, roleDir, state, "navbar_home", summary);
    await captureProfileMenu(page, roleConfig, roleDir, state, summary);

    const navItems = await getSidebarItems(page);
    summary.navItemsByRole[roleConfig.role] = navItems.map(
      (item) => `${item.label} -> ${item.href}`,
    );

    for (const navItem of navItems) {
      await visitAndCaptureRoute(
        page,
        roleConfig,
        roleDir,
        state,
        summary,
        navItem.href,
        `nav_${slugify(navItem.label)}`,
      );
    }

    await captureEmployeesFlow(page, roleConfig, roleDir, state, summary);
    await captureSettingsFlow(page, roleConfig, roleDir, state, summary);
    await captureExtraRoutes(page, roleConfig, roleDir, state, summary);
  } catch (error) {
    summary.errors.push(`${roleConfig.role}: ${formatError(error)}`);
  } finally {
    await context.close();
  }
}

async function login(page, roleConfig) {
  await gotoAndSettle(page, `${BASE_URL}/login`);
  await page.locator('input[name="usernameOrEmail"]').fill(roleConfig.username);
  await page.locator('input[name="password"]').fill(roleConfig.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20000,
  });
}

async function captureProfileMenu(page, roleConfig, roleDir, state, summary) {
  try {
    const button = page.locator('header button[aria-haspopup="menu"]').first();
    if (!(await button.isVisible({ timeout: 3000 }))) {
      return;
    }
    await button.click();
    await waitForSettledUi(page, 600);
    await capture(page, roleConfig.role, roleDir, state, "profile_menu", summary);

    const profileButton = page.getByRole("button", { name: /my profile/i });
    if (await profileButton.isVisible({ timeout: 2000 })) {
      await profileButton.click();
      await waitForSettledUi(page, 800);
      await capture(page, roleConfig.role, roleDir, state, "profile_dialog", summary);
      await page.keyboard.press("Escape");
      await waitForSettledUi(page, 400);
    } else {
      await page.keyboard.press("Escape");
    }
  } catch (error) {
    summary.errors.push(`${roleConfig.role}: profile menu capture failed: ${formatError(error)}`);
  }
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

async function visitAndCaptureRoute(page, roleConfig, roleDir, state, summary, route, name) {
  try {
    await gotoAndSettle(page, `${BASE_URL}${route}`);
    await capture(page, roleConfig.role, roleDir, state, name, summary);
    await captureTabs(page, roleConfig, roleDir, state, summary, name);
  } catch (error) {
    summary.inaccessible.push(`${roleConfig.role}: ${route} -> ${formatError(error)}`);
  }
}

async function captureTabs(page, roleConfig, roleDir, state, summary, baseName) {
  let tabLabels = [];
  try {
    tabLabels = await page.locator('[role="tab"]').evaluateAll((elements) =>
      elements
        .map((element) => element.textContent?.trim().replace(/\s+/g, " ") ?? "")
        .filter(Boolean),
    );
  } catch {
    return;
  }

  const uniqueLabels = [...new Set(tabLabels)].slice(0, 8);

  for (const label of uniqueLabels) {
    try {
      const tab = page.getByRole("tab", { name: label }).first();
      await tab.click();
      await waitForSettledUi(page, 700);
      await capture(
        page,
        roleConfig.role,
        roleDir,
        state,
        `${baseName}_tab_${slugify(label)}`,
        summary,
      );
    } catch (error) {
      summary.errors.push(
        `${roleConfig.role}: tab capture failed for ${baseName} / ${label}: ${formatError(error)}`,
      );
    }
  }
}

async function captureEmployeesFlow(page, roleConfig, roleDir, state, summary) {
  if (!summary.navItemsByRole[roleConfig.role]?.some((item) => item.includes("/employees"))) {
    return;
  }

  try {
    await gotoAndSettle(page, `${BASE_URL}/employees`);
    await capture(page, roleConfig.role, roleDir, state, "employees_list", summary);

    const addEmployeeLink = page.locator('a[href="/employees/new"]').first();
    if (await addEmployeeLink.isVisible({ timeout: 1500 }).catch(() => false)) {
      await addEmployeeLink.click();
      await page.waitForURL("**/employees/new", { timeout: 10000 });
      await waitForSettledUi(page, 800);
      await capture(page, roleConfig.role, roleDir, state, "employees_new", summary);
    }

    await gotoAndSettle(page, `${BASE_URL}/employees`);
    const detailHref = await firstEmployeeDetailHref(page);
    if (detailHref) {
      await gotoAndSettle(page, `${BASE_URL}${detailHref}`);
      await capture(page, roleConfig.role, roleDir, state, "employees_detail", summary);
      await captureTabs(page, roleConfig, roleDir, state, summary, "employees_detail");

      const editLink = page.locator('a[href$="/edit"]').first();
      if (await editLink.isVisible({ timeout: 1500 }).catch(() => false)) {
        const href = await editLink.getAttribute("href");
        if (href) {
          await gotoAndSettle(page, `${BASE_URL}${href}`);
          await capture(page, roleConfig.role, roleDir, state, "employees_edit", summary);
        }
      }
    }
  } catch (error) {
    summary.errors.push(`${roleConfig.role}: employee flow failed: ${formatError(error)}`);
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

async function captureSettingsFlow(page, roleConfig, roleDir, state, summary) {
  if (!summary.navItemsByRole[roleConfig.role]?.some((item) => item.includes("/settings"))) {
    return;
  }

  try {
    await gotoAndSettle(page, `${BASE_URL}/settings`);
    await capture(page, roleConfig.role, roleDir, state, "settings", summary);
    await captureTabs(page, roleConfig, roleDir, state, summary, "settings");
  } catch (error) {
    summary.errors.push(`${roleConfig.role}: settings flow failed: ${formatError(error)}`);
  }
}

async function captureExtraRoutes(page, roleConfig, roleDir, state, summary) {
  const routes = EXTRA_ROUTES_BY_ROLE[roleConfig.role] ?? [];

  for (const route of routes) {
    try {
      await gotoAndSettle(page, `${BASE_URL}${route}`);
      await capture(
        page,
        roleConfig.role,
        roleDir,
        state,
        routeToName(route),
        summary,
      );
      await captureTabs(page, roleConfig, roleDir, state, summary, routeToName(route));
    } catch (error) {
      summary.inaccessible.push(`${roleConfig.role}: ${route} -> ${formatError(error)}`);
    }
  }
}

async function capture(page, role, roleDir, state, baseName, summary) {
  await waitForSettledUi(page);
  const nextNumber = (state.counters[baseName] ?? 0) + 1;
  state.counters[baseName] = nextNumber;
  const fileName = `${role}_${baseName}_${String(nextNumber).padStart(2, "0")}.png`;
  const filePath = path.join(roleDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  summary.screenshots.push(filePath);
  summary.pagesVisited.push(page.url());
}

async function gotoAndSettle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForSettledUi(page);
}

async function waitForSettledUi(page, delay = 1200) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // Continue even when the app keeps long-polling or streaming.
  }
  await page.waitForTimeout(delay);
}

async function resolveBrowserPath() {
  for (const candidate of BROWSER_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next browser path.
    }
  }

  throw new Error("No supported local browser executable found.");
}

function routeToName(route) {
  return route
    .replace(/^\/+/, "")
    .replace(/\//g, "_")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/_+/g, "_");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function writeSummary(summary) {
  const lines = [
    `frontend start command used: ${summary.frontendStartCommand}`,
    `backend start command used: ${summary.backendStartCommand}`,
    `frontend url: ${summary.frontendUrl}`,
    `backend url: ${summary.backendUrl}`,
    "",
    `roles tested: ${summary.rolesTested.join(", ")}`,
    "",
    "navbar items found per role:",
  ];

  for (const [role, items] of Object.entries(summary.navItemsByRole)) {
    lines.push(`- ${role}: ${items.join(" | ") || "none found"}`);
  }

  lines.push("");
  lines.push("pages visited:");
  for (const page of unique(summary.pagesVisited)) {
    lines.push(`- ${page}`);
  }

  lines.push("");
  lines.push("screenshots captured:");
  for (const shot of summary.screenshots) {
    lines.push(`- ${shot}`);
  }

  lines.push("");
  lines.push("inaccessible pages/features:");
  if (summary.inaccessible.length === 0) {
    lines.push("- none");
  } else {
    for (const item of summary.inaccessible) {
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
  lines.push("notes:");
  lines.push("- Existing frontend and backend processes were already running and were reused.");
  lines.push("- Role credentials came from the live payroll.db user table and verified working passwords.");
  lines.push("- Screenshot set focuses on each role's visible navigation, landing pages, and key form/detail flows.");

  const summaryPath = path.join(OUTPUT_ROOT, "screenshot_summary.txt");
  await fs.writeFile(summaryPath, `${lines.join("\n")}\n`, "utf8");
}

function unique(values) {
  return [...new Set(values)];
}

main().catch(async (error) => {
  const summaryPath = path.join(OUTPUT_ROOT, "screenshot_summary.txt");
  const lines = [
    "screenshot capture failed before completion.",
    `error: ${formatError(error)}`,
  ];
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  await fs.writeFile(summaryPath, `${lines.join("\n")}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
