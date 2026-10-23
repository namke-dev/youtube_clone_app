import {
  readLibrary,
  saveVideo,
  recordHistory,
  removeVideo,
  clearLibrary,
} from "./library";
const a = { id: { videoId: "a" }, snippet: { title: "A" } };
beforeEach(() => localStorage.clear());
test("saved videos survive a reload and toggle off", () => {
  saveVideo(a);
  expect(readLibrary("saved")[0].id).toBe("a");
  removeVideo("saved", "a");
  expect(readLibrary("saved")).toEqual([]);
});
test("history is newest first without duplicate videos", () => {
  recordHistory(a);
  recordHistory({ id: "b", snippet: { title: "B" } });
  recordHistory(a);
  expect(readLibrary("history").map((v) => v.id)).toEqual(["a", "b"]);
  clearLibrary("history");
  expect(readLibrary("history")).toEqual([]);
});
test("corrupt storage and unavailable storage do not crash playback", () => {
  localStorage.setItem("devtubes:saved", "{oops");
  expect(readLibrary("saved")).toEqual([]);
  localStorage.setItem("devtubes:saved", "{}");
  expect(readLibrary("saved")).toEqual([]);
});

test('account libraries remain isolated and signing out restores guest data', () => {
  const { setLibraryOwner } = require('./library');
  setLibraryOwner(null);
  saveVideo(a);
  setLibraryOwner('user-a');
  expect(readLibrary('saved')).toEqual([]);
  saveVideo({id:'private-a', snippet:{title:'A personal video'}});
  setLibraryOwner('user-b');
  expect(readLibrary('saved')).toEqual([]);
  setLibraryOwner('user-a');
  expect(readLibrary('saved').map(v => v.id)).toEqual(['private-a']);
  setLibraryOwner(null);
  expect(readLibrary('saved').map(v => v.id)).toEqual(['a']);
});
