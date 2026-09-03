const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) =>
    console.log("BROWSER_CONSOLE:", msg.type(), msg.text()),
  );
  page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.toString()));

  await page.goto("http://localhost:5175/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  console.log("URL1", page.url());
  console.log("BODY_TEXT1", await page.locator("body").innerText());

  await page.fill('input[type="email"]', "aarav.mehta@nexura.club");
  await page.fill('input[type="password"]', "demo");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);

  console.log("URL2", page.url());
  console.log("BODY_TEXT2", await page.locator("body").innerText());

  await browser.close();
})();
