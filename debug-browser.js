const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) =>
    console.log("BROWSER_CONSOLE:", msg.type(), msg.text()),
  );
  page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));
  page.on("requestfailed", (req) =>
    console.log(
      "REQUEST_FAILED:",
      req.url(),
      req.failure && req.failure().errorText,
    ),
  );

  await page.goto("http://localhost:5173/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(5000);
  await browser.close();
})();
