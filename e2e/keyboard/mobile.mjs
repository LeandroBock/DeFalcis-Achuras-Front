// Pantalla de celular (390 px): menú lateral y recorrido con Tab.
import {
  ADMIN_STATE,
  DRIVER_STATE,
  activeElement as active,
  openPage,
} from "./config.mjs";

const PHONE = { width: 390, height: 844 };

export async function runMobile(browser, report) {
  for (const [state, path] of [
    [DRIVER_STATE, "/deliveries"],
    [ADMIN_STATE, "/orders"],
  ]) {
    const page = await openPage(browser, state, path, PHONE);
    const name = `${path} (celular)`;

    let el;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Shift+Tab");
      el = await active(page);
      if (/abrir men[uú]/i.test(el.text)) break;
    }
    report.check(
      `${name}: se llega al botón del menú`,
      /abrir men[uú]/i.test(el.text),
    );

    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await page.keyboard.press("Tab");
    el = await page.evaluate(() => !!document.activeElement?.closest("aside"));
    report.check(
      `${name}: Enter abre el menú y el siguiente Tab entra al menú`,
      el,
    );

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    el = await active(page);
    report.check(
      `${name}: Esc cierra el menú y el foco vuelve al botón`,
      /men[uú]/i.test(el.text),
    );

    let steps = 0;
    let invisible = 0;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(150);
      el = await active(page);
      if (el.tag === "body") continue;
      steps++;
      if (!el.focusVisible) invisible++;
    }
    report.check(
      `${name}: ${steps} pasos de Tab con el foco siempre visible`,
      invisible === 0,
      invisible ? `${invisible} sin foco visible` : "",
    );

    await page.context().close();
  }
}
