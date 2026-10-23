import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import Header from './header';
import {AccountProvider} from '../context/account-context';
global.IS_REACT_ACT_ENVIRONMENT=true;

test.each([null,{id:'header-user',user_metadata:{full_name:'Nam'}}])('header keeps account access available on watch routes for %s',async user=>{
 const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
 const service={configured:Boolean(user),getSession:async()=>user?{user}:null,subscribe:()=>()=>{},loadFavorites:async()=>[]};
 try {
  await act(async()=>root.render(<AccountProvider service={service}><MemoryRouter initialEntries={['/video/example']}><Header/></MemoryRouter></AccountProvider>));
  const link=container.querySelector('header a[href="/account"]');
  expect(link).not.toBeNull();
  expect(link.getAttribute('aria-label')).toBe('Your account and favorite topics');
  expect(container.querySelector('header').lastElementChild).toBe(link);
  if(user) expect(link.textContent).toBe('N');
  await act(async()=>link.click());
 }finally{act(()=>root.unmount());container.remove();}
});
