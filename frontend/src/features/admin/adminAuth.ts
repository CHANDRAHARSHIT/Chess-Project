/** Admin sign-in / sign-out against /api/admin/auth — separate from the player flow. */

const ADMIN_AUTH_BASE_PATH = "/api/admin/auth";
const DEFAULT_SIGN_IN_CALLBACK_PATH = "/admin/home";

/** Auth.js requires a CSRF token on every sign-in and sign-out POST. */
async function getCsrfToken(): Promise<string | undefined> {
  const response = await fetch(`${ADMIN_AUTH_BASE_PATH}/csrf`);
  const data = await response.json();

  return data?.csrfToken;
}

/** Builds the hidden form Auth.js expects for a provider sign-in POST. */
function buildSignInForm(csrfToken: string | undefined, callbackUrl: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${ADMIN_AUTH_BASE_PATH}/signin/google`;
  form.style.display = "none";

  const fields: Record<string, string | undefined> = { csrfToken, callbackUrl };

  for (const [name, value] of Object.entries(fields)) {
    if (!value) continue;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  return form;
}

/** Starts the admin Google sign-in flow. */
export async function adminSignIn(callbackUrl = DEFAULT_SIGN_IN_CALLBACK_PATH) {
  const csrfToken = await getCsrfToken();

  // A form POST rather than fetch: the browser must follow Auth.js's redirect to
  // Google itself, which a fetch would trip CORS on.
  const form = buildSignInForm(csrfToken, callbackUrl);

  document.body.appendChild(form);
  form.submit();
}

/** Ends the admin session. Does not affect a player session in the same browser. */
export async function adminSignOut() {
  const csrfToken = await getCsrfToken();

  const body = new URLSearchParams();
  if (csrfToken) body.append("csrfToken", csrfToken);
  body.append("json", "true");

  await fetch(`${ADMIN_AUTH_BASE_PATH}/signout`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}
