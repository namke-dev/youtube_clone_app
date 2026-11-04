import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import TodayPage from './today-page';
import { discovery } from '../utils/discovery';
jest.mock('../utils/discovery', () => ({discovery:{discover:jest.fn()}}));
jest.mock('../context/account-context', () => ({useAccount: () => mockAccount}));
let mockAccount = {user:null, favorites:[], loading:false};
global.IS_REACT_ACT_ENVIRONMENT = true;
const item = id => ({id:{videoId:id},snippet:{title:`A story about ${id}`,channelTitle:'Original creator'},contentDetails:{duration:'PT6M'}});
let container, root;
beforeEach(() => {
  mockAccount = {user:null, favorites:[], loading:false};
  discovery.discover.mockReset();
  discovery.discover.mockImplementation(async query => ({items:[item(query), item(`${query}-alternative`)]}));
  container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(() => { act(()=>root.unmount()); container.remove(); });
const render = () => act(async()=>root.render(<MemoryRouter><TodayPage/></MemoryRouter>));

test('Today shows four distinct picks, a real total and a local shuffle without more requests', async () => {
  await render();
  expect(container.querySelectorAll('[data-edition-pick]')).toHaveLength(4);
  expect(container.textContent).toContain('24 min');
  expect(container.querySelectorAll('h1')).toHaveLength(1);
  const before=container.querySelector('[data-edition-pick]').getAttribute('data-edition-pick');
  await act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent.includes('Shuffle picks')).click());
  expect(container.querySelector('[data-edition-pick]').getAttribute('data-edition-pick')).not.toBe(before);
  expect(discovery.discover).toHaveBeenCalledTimes(3);
  expect(container.querySelector('.load-more')).toBeNull();
});

test('one failed lane leaves other stories available with a retry instead of erasing the page', async () => {
  discovery.discover.mockImplementation(async query => {
    if (query.includes('AI technology')) throw new Error('Connection interrupted.');
    return {items:[item(query), item(`${query}-alternative`)]};
  });
  await render();
  expect(container.querySelectorAll('[data-edition-pick]').length).toBeGreaterThan(0);
  expect(container.querySelector('[role="alert"]').textContent).toContain('AI & technology');
  expect(container.textContent).toContain('Retry unavailable topics');
});

test('missing durations show an honest unknown instead of a guessed total', async () => {
  discovery.discover.mockResolvedValue({items:[{id:{videoId:'unknown'},snippet:{title:'Unknown duration'}}]});
  await render();
  expect(container.textContent).toContain('Duration unavailable');
  expect(container.textContent).not.toContain('24 min');
  expect(container.querySelectorAll('[data-edition-pick]')).toHaveLength(1);
});

test('changing account hides old picks immediately and ignores late results from that account', async () => {
  const pending = [];
  discovery.discover.mockImplementation(() => new Promise(resolve => pending.push(resolve)));
  await render();
  mockAccount = {user:{id:'another-owner'},favorites:[],loading:false};
  await render();
  await act(async()=>pending.slice(0,3).forEach(resolve=>resolve({items:[item('previous-account')]})));
  expect(container.textContent).not.toContain('A story about previous-account');
  expect(container.querySelectorAll('[data-edition-pick]')).toHaveLength(0);
  await act(async()=>pending.slice(3).forEach(resolve=>resolve({items:[item('current-account')]})));
  expect(container.textContent).toContain('A story about current-account');
});

test('all failed lanes retain the page title and expose a retry', async () => {
  discovery.discover.mockRejectedValue(new Error('Offline.'));
  await render();
  expect(container.querySelector('h1').textContent).toBe('Today, a little wider.');
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect([...container.querySelectorAll('button')].some(b=>b.textContent.includes('Try again'))).toBe(true);
});
