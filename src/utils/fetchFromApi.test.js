import axios from "axios";
import { fetchFromApi } from "./fetchFromApi";
jest.mock("axios");
test("keeps credentials out of the browser and reuses successful reads", async () => {
  axios.get.mockResolvedValue({ data: { items: [{ id: "test" }] } });
  const endpoint = "search?part=snippet&q=cache-test";
  expect(await fetchFromApi(endpoint)).toEqual({ items: [{ id: "test" }] });
  expect(await fetchFromApi(endpoint)).toEqual({ items: [{ id: "test" }] });
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get.mock.calls[0][0]).toMatch(/^\/api\/youtube\?/);
});

test("search cache lasts 30 minutes, deduplicates pending calls and expires", async () => {
  jest.useFakeTimers();
  try {
    axios.get.mockClear();
    axios.get.mockResolvedValue({ data: { items: [] } });
    const endpoint = 'search?maxResults=50&q=ttl-test';
    await Promise.all([fetchFromApi(endpoint), fetchFromApi(endpoint)]);
    jest.advanceTimersByTime(29 * 60 * 1000);
    await fetchFromApi(endpoint);
    expect(axios.get).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60 * 1000);
    await fetchFromApi(endpoint);
    expect(axios.get).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});
