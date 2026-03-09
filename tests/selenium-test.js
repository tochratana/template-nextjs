const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

(async function test() {

  const options = new chrome.Options();
  options.addArguments(
    "--headless",
    "--no-sandbox",
    "--disable-dev-shm-usage"
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("https://next-dpl.tochratana.com");

    await driver.wait(until.elementLocated(By.css("body")), 10000);

    console.log("Website loaded successfully!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await driver.quit();
  }

})();