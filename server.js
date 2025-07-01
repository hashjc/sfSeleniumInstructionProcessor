//Install different driver for every browser
// Requires authentication details for getting into org

const express = require('express');
const { Builder, By, until, Key } = require('selenium-webdriver');

const app = express();
app.use(express.json());

app.post('/run-plan', async (req, res) => {
    const actionPlan = req.body;
    let driver = await new Builder().forBrowser('chrome').build();
    console.log("Action plan ", actionPlan);
    try {
        let i = 0;
        for (const step of actionPlan) {
            i++;
            console.log('Nth step ', step, ' number', i);
            const { action, details } = step;

            if (action === 'navigate') {
                console.log('Navigate ');
                await driver.get(details.url);
            }

            else if (action === 'openNewTab') {
                console.log("Opening a new tab...");
                await driver.switchTo().newWindow('tab');
            }

            else if (action === 'type') {
                const el = await driver.findElement(By.css(details.selector));
                await el.clear();
                await el.sendKeys(details.text);
            }

            else if (action === 'click') {
                const el = await driver.findElement(By.css(details.selector));
                await el.click();
            }

            else if (action === 'selectByValue') {
                const el = await driver.findElement(By.css(details.selector));
                await el.findElement(By.css(`option[value='${details.value}']`)).click();
            }

            else if (action === 'waitFor') {

                const timeout = details.timeout || 10000; // default to 10 seconds
                const selector = details.selector;
                if (!selector) throw new Error('Missing selector in waitFor step');
                await driver.wait(until.elementLocated(By.css(selector)), timeout);

                //const ms = details.seconds ? details.seconds * 1000 : 1000;
                //await driver.sleep(ms);
            }
           else if (action === 'app_launcher') {
                try {
                    console.log('Starting app_launcher action');
                    
                    // Click the App Launcher button (waffle icon)
                    const appLauncherSelectors = [
                        "//button[@title='App Launcher']",
                        "//button[contains(@class, 'slds-button')]//lightning-primitive-icon[contains(@class, 'waffle')]",
                        "//div[@class='slds-icon-waffle_container']//button",
                        "//button[.//span[text()='App Launcher']]",
                        "//button[contains(@class, 'appLauncher')]"
                    ];
                    
                    let appLauncherBtn;
                    for (const selector of appLauncherSelectors) {
                        try {
                            console.log(`Trying app launcher selector: ${selector}`);
                            appLauncherBtn = await driver.wait(until.elementLocated(By.xpath(selector)), 5000);
                            console.log(`Found app launcher with: ${selector}`);
                            break;
                        } catch (e) {
                            console.log(`App launcher not found with: ${selector}`);
                        }
                    }
                    
                    if (!appLauncherBtn) {
                        throw new Error('App Launcher button not found');
                    }
                    
                    await driver.executeScript("arguments[0].click();", appLauncherBtn);
                    console.log('App Launcher clicked');
                    
                    // Wait for modal/menu to appear
                    await driver.sleep(2000);
                    
                    // Wait for and find the search input
                    const searchInputSelectors = [
                        "//input[@placeholder='Search apps and items...']",
                        "//input[@placeholder='Search apps or items...']",
                        "//input[contains(@placeholder, 'Search apps')]",
                        "//input[@type='search']",
                        "//lightning-input//input",
                        "//div[contains(@class, 'al-search')]//input"
                    ];
                    
                    let searchInput;
                    for (const selector of searchInputSelectors) {
                        try {
                            console.log(`Trying search input selector: ${selector}`);
                            searchInput = await driver.wait(until.elementLocated(By.xpath(selector)), 5000);
                            // Make sure the input is visible and interactable
                            await driver.wait(until.elementIsVisible(searchInput), 3000);
                            console.log(`Found search input with: ${selector}`);
                            break;
                        } catch (e) {
                            console.log(`Search input not found with: ${selector}`);
                        }
                    }
                    
                    if (!searchInput) {
                        throw new Error('Search input not found');
                    }
                    
                    // Clear and enter search text
                    await searchInput.clear();
                    await driver.sleep(500);
                    await searchInput.sendKeys('Accounts');
                    console.log('Entered "Accounts" in search');
                    
                    // Wait for search results to load
                    await driver.sleep(3000);
                    
                    // Find and click Accounts
                    const accountsSelectors = [
                        "//one-app-launcher-menu-item//a[@data-label='Accounts']",
                        "//lightning-focus-trap//a[@data-label='Accounts']",
                        "//a[@data-label='Accounts']",
                        "//a[contains(@title, 'Accounts') and not(contains(@title, 'Account '))]",
                        "//div[contains(@class, 'al-menu-dropdown-list')]//a[text()='Accounts']",
                        "//li[contains(@class, 'al-menu-dropdown-list-item')]//a[contains(text(), 'Accounts')]",
                        "//one-app-launcher-menu-item//a[.//span[text()='Accounts']]",
                        "//*[@data-name='Accounts']//a"
                    ];
                    
                    let accountsLink;
                    for (const selector of accountsSelectors) {
                        try {
                            console.log(`Trying accounts selector: ${selector}`);
                            accountsLink = await driver.wait(until.elementLocated(By.xpath(selector)), 5000);
                            await driver.wait(until.elementIsVisible(accountsLink), 3000);
                            console.log(`Found Accounts link with: ${selector}`);
                            break;
                        } catch (e) {
                            console.log(`Accounts link not found with: ${selector}`);
                        }
                    }
                    
                    if (!accountsLink) {
                        // Fallback: try to find any element containing "Accounts" text
                        try {
                            console.log('Trying fallback Accounts selector');
                            accountsLink = await driver.findElement(By.xpath("//a[normalize-space(text())='Accounts' or .//span[normalize-space(text())='Accounts']]"));
                            console.log('Found Accounts with fallback selector');
                        } catch (e) {
                            throw new Error('Accounts link not found with any selector');
                        }
                    }
                    
                    // Click Accounts
                    await driver.executeScript("arguments[0].click();", accountsLink);
                    console.log('Clicked on Accounts');
                    
                    // Wait for Accounts page to load
                    await driver.sleep(5000);
                    
                    // Wait for page to fully load by checking for list view or other indicators
                    try {
                        await driver.wait(until.elementLocated(By.xpath("//span[text()='Accounts'] | //h1[contains(text(), 'Accounts')]")), 10000);
                        console.log('Accounts page loaded');
                    } catch (e) {
                        console.log('Could not confirm Accounts page load, continuing...');
                    }
                    
                    // Find and click New button
                    const newButtonSelectors = [
                        "//div[contains(@class, 'slds-page-header__detail-row')]//a[@title='New']",
                        "//a[@title='New' and contains(@class, 'slds-button')]",
                        "//lightning-button-menu//a[@title='New']",
                        "//div[@class='actionsContainer']//a[@title='New']",
                        "//a[contains(@class, 'forceActionLink') and @title='New']",
                        "//*[@data-target-selection-name='sfdc:StandardButton.Account.New']//a",
                        "//button[@title='New']",
                        "//a[text()='New' and contains(@class, 'slds-button')]"
                    ];
                    
                    let newButton;
                    for (const selector of newButtonSelectors) {
                        try {
                            console.log(`Trying new button selector: ${selector}`);
                            newButton = await driver.wait(until.elementLocated(By.xpath(selector)), 5000);
                            await driver.wait(until.elementIsVisible(newButton), 3000);
                            console.log(`Found New button with: ${selector}`);
                            break;
                        } catch (e) {
                            console.log(`New button not found with: ${selector}`);
                        }
                    }
                    
                    if (!newButton) {
                        throw new Error('New button not found');
                    }
                    
                    // Click New button
                    await driver.executeScript("arguments[0].click();", newButton);
                    console.log('Clicked New button - Account creation form should open');
                    
                    // Wait for new account form to load
                    await driver.sleep(3000);
                    
                } catch (error) {
                    console.error('Error in app_launcher action:', error.message);
                    
                    // Debug: Take a screenshot and log page source for troubleshooting
                    try {
                        const screenshot = await driver.takeScreenshot();
                        console.log('Screenshot taken for debugging');
                        
                        // Log current URL
                        const currentUrl = await driver.getCurrentUrl();
                        console.log('Current URL:', currentUrl);
                        
                    } catch (debugError) {
                        console.log('Could not take debug screenshot:', debugError.message);
                    }
                    
                    throw error;
                }
}
            else if (action === 'waitForVisible') {
                console.log('Wait for visible ', i, ' step = ', step);
                const timeout = details.timeout || 10000; // default to 10 seconds
                const selector = details.selector;
                if (!selector) throw new Error('Missing selector in waitFor step');
                console.log('Selecor css ', selector)

                //await driver.wait(until.elementLocated(By.css(selector)), timeout);
                await driver.wait(until.elementLocated(By.xpath(selector)), timeout);

                //const ms = details.seconds ? details.seconds * 1000 : 1000;
                //await driver.sleep(ms);
            }

            else if (action === 'sleep') {
                await driver.sleep(details.ms);
            }

        }

        res.json({ status: 'success' });
    } catch (err) {
        console.error('Error during automation:', err);
        res.status(500).json({ status: 'error', message: err.toString() });
    } finally {
        // Don't close the browser if you want to keep it open after execution
        // await driver.quit();
    }
});

app.listen(5001, () => {
  console.log('Selenium Executor API running on http://localhost:5001');
});