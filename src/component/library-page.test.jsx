import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import LibraryPage from './library-page';
import {AccountProvider} from '../context/account-context';
import {saveVideo,setLibraryOwner} from '../utils/library';
global.IS_REACT_ACT_ENVIRONMENT=true;

test('library hides guest entries until account restoration finishes',async()=>{
  localStorage.clear();setLibraryOwner(null);
  saveVideo({id:'private-guest-video',snippet:{title:'Guest saved film',channelId:'a',thumbnails:{}}});
  let restore;
  const session=new Promise(resolve=>{restore=resolve;});
  const service={configured:true,getSession:()=>session,subscribe:()=>()=>{},loadFavorites:async()=>[]};
  const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
  try {
    await act(async()=>root.render(<AccountProvider service={service}><MemoryRouter><LibraryPage type="saved"/></MemoryRouter></AccountProvider>));
    expect(container.textContent).toContain('Loading your library');
    expect(container.textContent).not.toContain('Guest saved film');
    expect(container.querySelector('.remove')).toBeNull();
    await act(async()=>restore({user:{id:'library-owner'}}));
    expect(container.textContent).not.toContain('Guest saved film');
    expect(container.textContent).toContain('Something worth coming back to.');
  }finally{act(()=>root.unmount());container.remove();setLibraryOwner(null);}
});
