import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import axios from 'axios';
import App from './App';
jest.mock('axios');
global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=jest.fn();

test.each(['/', '/explore', '/topic/ai', '/search/design', '/video/nav-example', '/channel/nav-example', '/saved', '/history', '/account', '/missing-page'])('one shared mobile navigation is available on %s',async path=>{
 localStorage.clear();window.history.replaceState({},'',path);
 axios.get.mockResolvedValue({data:{items:[]}});
 const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
 try {
  await act(async()=>root.render(<App/>));
  const navs=container.querySelectorAll('nav[aria-label="Mobile navigation"]');
  expect(navs).toHaveLength(1);
  expect([...navs[0].querySelectorAll('a')].map(link=>link.getAttribute('href'))).toEqual(['/','/explore','/history','/saved']);
  if(['/','/explore','/history','/saved'].includes(path)) expect(navs[0].querySelector('[aria-current="page"]').getAttribute('href')).toBe(path);
 }finally{act(()=>root.unmount());container.remove();}
});
