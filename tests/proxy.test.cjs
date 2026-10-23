const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/youtube");
function response() {
  return {
    code: 200,
    headers: {},
    status(n) {
      this.code = n;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
  };
}
test("rejects non-read methods and unapproved routes before any provider call", async () => {
  for (const [method, endpoint] of [
    ["POST", "search"],
    ["GET", "https://evil.test"],
    ["GET", "search?api_key=secret"],
    ["GET", "search?maxResults=999"],
  ]) {
    const res = response();
    await handler({ method, query: { endpoint } }, res);
    assert.ok([400, 405].includes(res.code));
  }
});
test("reports missing configuration without leaking credentials", async () => {
  const old = process.env.RAPIDAPI_KEY;
  const legacy = process.env.REACT_APP_API_KEY;
  delete process.env.RAPIDAPI_KEY;
  delete process.env.REACT_APP_API_KEY;
  try {
    const res = response();
    await handler({ method: "GET", query: { endpoint: "videos?id=a" } }, res);
    assert.equal(res.code, 503);
  } finally {
    if (old !== undefined) process.env.RAPIDAPI_KEY = old;
    if (legacy !== undefined) process.env.REACT_APP_API_KEY = legacy;
  }
});
test("sanitizes provider failures and caches successful public responses", async () => {
  const oldFetch = global.fetch;
  const old = process.env.RAPIDAPI_KEY;
  process.env.RAPIDAPI_KEY = "test-only";
  try {
    global.fetch = async () => ({ ok: false, status: 429 });
    let res = response();
    await handler(
      { method: "GET", query: { endpoint: "search?q=hello" } },
      res,
    );
    assert.equal(res.code, 429);
    assert.deepEqual(res.data, { error: "Video provider unavailable" });
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ items: [] }),
    });
    res = response();
    await handler(
      { method: "GET", query: { endpoint: "search?q=hello" } },
      res,
    );
    assert.equal(res.code, 200);
    assert.match(res.headers["Cache-Control"], /s-maxage=300/);
    assert.deepEqual(res.data, { items: [] });
  } finally {
    global.fetch = oldFetch;
    if (old === undefined) delete process.env.RAPIDAPI_KEY;
    else process.env.RAPIDAPI_KEY = old;
  }
});
