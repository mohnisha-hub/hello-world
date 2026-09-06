import { test, expect } from "@playwright/test";

const password = "password123";

test.skip(!process.env.DATABASE_URL?.startsWith("postgres"), "Postgres DATABASE_URL is required for e2e");

test("visitor search finds live listings and hides draft profiles", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Search perfumes/i).fill("Oud Wood");
  await expect(page.getByRole("link", { name: /Tom Ford - Oud Wood/i })).toBeVisible();
  const draft = await page.request.get("/u/aditi_draft");
  expect(draft.status()).toBe(404);
});

test("signup, rejected wrong password, then login redirect", async ({ page }) => {
  const username = `t${Date.now().toString(36).slice(-8)}`;
  await page.goto("/signup?from=/me/wishlist");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/me\/wishlist/);
  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/login?from=/me/wishlist");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("wrongpass");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/Could not sign in|those details/i)).toBeVisible();
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/me\/wishlist/);
});

test("non-admin never sees the impersonation switcher", async ({ page }) => {
  await page.goto("/login?from=/me");
  await page.getByLabel("Username").fill("aarav_perfumes");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/me/);
  await expect(page.getByText("Admin editing as")).toHaveCount(0);
});

test("admin can switch acting user", async ({ page }) => {
  await page.goto("/login?from=/me/profile");
  await page.getByLabel("Username").fill(process.env.ADMIN_USERNAME || "mohnisha");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Admin editing as")).toBeVisible();
  await page.getByRole("combobox").selectOption({ label: "@priya_scents" });
  await expect(page.getByText("Username: @priya_scents", { exact: false })).toBeVisible();
});

test("logged-out listing shows login CTA and public profile hides email", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Search perfumes/i).fill("Oud Wood");
  await page.getByRole("link", { name: /Tom Ford - Oud Wood/i }).click();
  await expect(page.getByText(/to wishlist or buy/i)).toBeVisible();
  await page.goto("/u/aarav_perfumes");
  await expect(page.getByText("aarav.scents@example.com")).toHaveCount(0);
  await expect(page.getByText("+91")).toHaveCount(0);
});

test("seller can decline a bid", async ({ page }) => {
  await page.goto("/login?from=/me/bids");
  await page.getByLabel("Username").fill("rohan_oud");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Bids" })).toBeVisible();
  const decline = page.getByRole("button", { name: "Decline" }).first();
  await expect(decline).toBeVisible();
  await decline.click();
  await expect(page.getByText("Bid declined.")).toBeVisible();
});
