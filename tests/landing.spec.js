const { test, expect } = require("@playwright/test");

const targetSelectors = {
  home: "#inicio",
  solucoes: "#tecnologia",
  produtos: "#beneficios",
  cases: "#case",
  contato: "#contato",
};

const expectAnchorTargetVisible = async (page, selector) => {
  const target = page.locator(selector);
  await expect(target).toBeVisible();

  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeLessThan(page.viewportSize().height * 0.9);
};

test.describe("navegacao principal", () => {
  test("desktop ancora posiciona as secoes certas", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Fluxo exclusivo de desktop.");

    await page.goto("/");

    await page.getByRole("link", { name: "Soluções" }).click();
    await expect(page).toHaveURL(/#tecnologia$/);
    await expectAnchorTargetVisible(page, targetSelectors.solucoes);

    await page.getByRole("link", { name: "Produtos" }).click();
    await expect(page).toHaveURL(/#beneficios$/);
    await expectAnchorTargetVisible(page, targetSelectors.produtos);

    await page.getByRole("link", { name: "Cases" }).click();
    await expect(page).toHaveURL(/#case$/);
    await expectAnchorTargetVisible(page, targetSelectors.cases);

    await page.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/#inicio$/);
    await expectAnchorTargetVisible(page, targetSelectors.home);
  });

  test("mobile menu leva ate o formulario", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Fluxo exclusivo de mobile.");

    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("link", { name: "Solicitar demonstração" }).click();

    await expect(page).toHaveURL(/#contato$/);
    await expectAnchorTargetVisible(page, targetSelectors.contato);
  });
});

test.describe("formulario", () => {
  test("valida campos obrigatorios e aceita mensagem opcional", async ({ page }) => {
    await page.goto("/");

    const ctaButtons = page.getByRole("link", { name: /Solicitar demonstração|Fale com um consultor/i });
    await ctaButtons.first().click();
    await expect(page).toHaveURL(/#contato$/);

    const submitButton = page.getByRole("button", { name: "Enviar solicitação" });
    await submitButton.click();

    const feedback = page.locator(".form-feedback");
    await expect(feedback).toHaveText(
      "Confira os campos destacados. O formulário precisa estar completo para prosseguir."
    );

    await page.getByRole("textbox", { name: /Nome/i }).fill("Rubem Motta Coelho");
    await page.getByRole("textbox", { name: /E-mail/i }).fill("rubem.coelho@logicoop.com");
    await page.getByRole("textbox", { name: /Telefone/i }).fill("11987654321");
    await page.getByRole("textbox", { name: /Empresa/i }).fill(
      "Logicoop Logística e Transporte de Cargas"
    );
    await page.getByRole("combobox", { name: /Estado/i }).selectOption("SP");
    await page.getByRole("textbox", { name: /Cidade/i }).fill("Guarulhos");

    await submitButton.click();

    await expect(feedback).toHaveText(
      "Solicitação validada com sucesso. Seu formulário está pronto para envio."
    );
  });
});
