const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
require("chromedriver");

(async function test() {

  const options = new chrome.Options();
  options.addArguments(
    "--headless",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  );

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("https://next-dpl.tochratana.com/");

    await driver.wait(until.elementLocated(By.css("body")), 5000);

    console.log("Test passed!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();