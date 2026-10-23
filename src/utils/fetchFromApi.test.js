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
