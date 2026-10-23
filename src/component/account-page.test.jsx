import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import axios from 'axios';
import AccountPage from './account-page';
import HomePage from './home-page';
import {AccountProvider} from '../context/account-context';
jest.mock('axios');
global.IS_REACT_ACT_ENVIRONMENT=true;
let container,root,service;
beforeEach(()=>{
 localStorage.clear();axios.get.mockReset();
 axios.get.mockResolvedValue({data:{items:[{id:{videoId:'personal-ai'},snippet:{title:'AI engineering agents',channelId:'ai',thumbnails:{}}}]}});
 service={configured:false,getSession:async()=>null,subscribe:()=>()=>{},saveFavorites:jest.fn(),signIn:jest.fn()};
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const flush=callback=>act(async()=>{callback();});
const mount=()=>flush(()=>root.render(<AccountProvider service={service}><MemoryRouter initialEntries={['/account']}><Routes><Route path="/account" element={<AccountPage/>}/><Route path="/" element={<HomePage/>}/></Routes></MemoryRouter></AccountProvider>));
test('choosing favorite topics changes For you and its topic bar, and refresh reuses the pool',async()=>{
 await mount();
 await flush(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='AI').click());
 await flush(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Save topics').click());
 const nav=container.querySelector('nav[aria-label="Video topics"]');
 expect(nav.textContent).toContain('AI');
 expect(nav.textContent).not.toContain('Entrepreneurship');
 expect(container.querySelector('.video-card h3').textContent).toBe('AI engineering agents');
 const endpoint=new URL(axios.get.mock.calls[0][0],'http://localhost').searchParams.get('endpoint');
 expect(endpoint).toContain('q=ai');
 await flush(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Refresh videos').click());
 expect(axios.get).toHaveBeenCalledTimes(1);
 expect(service.saveFavorites).not.toHaveBeenCalled();
});
test('Google sign-in errors are visible while guest topic selection remains usable',async()=>{
 service.configured=true;service.signIn.mockRejectedValue(new Error('Google sign-in failed. Try again.'));
 await mount();
 await flush(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Continue with Google').click());
 expect(container.querySelector('[role="alert"]').textContent).toMatch(/Google sign-in failed/);
 expect([...container.querySelectorAll('button')].find(b=>b.textContent==='AI').disabled).toBe(false);
});

test('account settings accept more than eight topics and a custom topic',async()=>{
 const {Simulate}=require('react-dom/test-utils');
 await mount();
 const options=[...container.querySelectorAll('.favorite-option')];
 for(const option of options.slice(0,10)) await flush(()=>option.click());
 expect(options[10].disabled).toBe(false);
 const input=container.querySelector('input[aria-label="New topic"]');
 expect(input).not.toBeNull();
 await flush(()=>Simulate.change(input,{target:{value:'Urban gardening'}}));
 await flush(()=>Simulate.submit(container.querySelector('.custom-topic-form')));
 expect([...container.querySelectorAll('.favorite-option')].some(b=>b.textContent.includes('Urban gardening'))).toBe(true);
 await flush(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Save topics').click());
 expect(JSON.parse(localStorage.getItem('devtubes:favorites'))).toHaveLength(11);
 const customLink=[...container.querySelectorAll('.chips a')].find(a=>a.textContent==='Urban gardening');
 expect(customLink.getAttribute('href')).toBe('/topic/urban%20gardening');
 expect(container.querySelector('.chips a[href="/account"]')).toBeNull();
});
