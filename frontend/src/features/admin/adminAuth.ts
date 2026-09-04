/** Admin sign-in / sign-out against /api/admin/auth — separate from the player flow. */

const BASE = "/api/admin/auth";

async function csrfToken(): Promise<string | undefined> {
  const response = await fetch(`${BASE}/csrf`);
  const data = await response.json();
  return data?.csrfToken;
}

export async function adminSignIn(callbackUrl = "/admin/home") {
  const token = await csrfToken();

  // A form POST rather than fetch: the browser must follow Auth.js's redirect to
  // Google itself, which a fetch would trip CORS on.
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${BASE}/signin/google`;
  form.style.display = "none";

  const fields: Record<string, string | undefined> = { csrfToken: token, callbackUrl };
  for (const [name, value] of Object.entries(fields)) {
    if (!value) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export async function adminSignOut() {
  const token = await csrfToken();

  const body = new URLSearchParams();
  if (token) body.append("csrfToken", token);
  body.append("json", "true");

  await fetch(`${BASE}/signout`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}
