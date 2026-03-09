const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");

async function test() {
  let driver = await new Builder().forBrowser("chrome").build();

  try {
    await driver.get("https://your-domain.com");

    let title = await driver.getTitle();

    if (!title) {
      throw new Error("Page did not load correctly");
    }

    console.log("Website loaded successfully!");
  } finally {
    await driver.quit();
  }
}

test();