// Browser regression for the Coach launcher covering the mobile Next button.
// Run against the saved disposable MAP using the existing browser-control tab.
export async function checkMobileNavigation(tab) {
  await tab.playwright.getByRole('button',{name:/^Step 4: /}).click();
  await tab.playwright.domSnapshot();
  await tab.playwright.getByRole('button',{name:/Add My Investments/}).click();
  await tab.playwright.domSnapshot();
  if (!await tab.playwright.getByRole('heading',{name:'How much do you invest each year?',exact:true}).isVisible()) throw Error('Mobile Next did not reach Investing');
  if (await tab.playwright.getByRole('button',{name:'Ask Your Money Coach',exact:true}).getAttribute('aria-expanded') !== 'false') throw Error('Mobile Next opened Coach instead');
  return 'PASS: mobile Next reaches Investing and Coach stays closed';
}
