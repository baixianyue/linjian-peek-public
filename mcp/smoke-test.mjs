import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 18790;
// Match Render's generated standard Base64 format, including an embedded '/'
// and trailing padding, so the private route cannot regress to URL-safe-only.
const accessToken = "AbCdEfGhIjKlMnOpQrStUvWxYz0123+/abcd==";
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["server.js"], {
  cwd: new URL(".", import.meta.url),
  env: {
    ...process.env,
    PORT: String(port),
    LINJIAN_URL: "http://127.0.0.1:18513",
    LINJIAN_TOKEN: "test-only-token",
    LINJIAN_MCP_PATH_TOKEN: accessToken
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let stderr = "";
child.stderr.on("data", (chunk) => { stderr += chunk; });

async function waitForHealth() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return await response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`server did not become ready: ${stderr}`);
}

async function listTools(url) {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-03-26"
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
  });
}

try {
  const health = await waitForHealth();
  assert.equal(health.mcp_path_token_configured, true);
  assert.equal(health.wallet_mcp_enabled, false);

  const publicResponse = await listTools(`${base}/mcp`);
  assert.equal(publicResponse.status, 404);

  const wrongTokenResponse = await listTools(`${base}/mcp/wrong-token`);
  assert.equal(wrongTokenResponse.status, 404);

  const response = await listTools(`${base}/mcp/${accessToken}`);
  assert.equal(response.status, 200);
  const body = await response.text();
  for (const expected of ["linjian_status", "peek_screen", "get_life_state", "send_notification", "open_app", "get_visit_stats"]) {
    assert.match(body, new RegExp(`\\"name\\":\\"${expected}\\"`));
  }
  for (const blocked of ["send_phone_command", "run_sequence", "phone_screen_off", "start_focus_mode", "get_wallet_state"]) {
    assert.doesNotMatch(body, new RegExp(`\\"name\\":\\"${blocked}\\"`));
  }
  process.stdout.write("personal MCP smoke test passed\n");
} finally {
  child.kill("SIGTERM");
}
