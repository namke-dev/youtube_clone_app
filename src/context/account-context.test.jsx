import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {AccountProvider,useAccount} from './account-context';
import {readCachedFavorites,writeCachedFavorites} from '../utils/account-service';
import {saveVideo,readLibrary} from '../utils/library';
global.IS_REACT_ACT_ENVIRONMENT=true;
let container,root,service,emit;
function Probe() {
  const account=useAccount();
  return <><output>{JSON.stringify({user:account.user?.id||null,favorites:account.favorites,loading:account.loading,error:account.error})}</output><button onClick={()=>account.saveFavorites(['Physics'])}>Save</button><button onClick={()=>account.signOut()}>Sign out</button></>;
}
const state=()=>JSON.parse(container.querySelector('output').textContent);
const flush=callback=>act(async()=>{callback();});
beforeEach(()=>{
 localStorage.clear();
 service={configured:true,getSession:jest.fn().mockResolvedValue({user:{id:'alice'}}),subscribe:callback=>{emit=callback;return ()=>{};},loadFavorites:jest.fn().mockResolvedValue(['AI']),saveFavorites:jest.fn().mockResolvedValue(),signOut:jest.fn().mockImplementation(async()=>emit(null))};
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const mount=()=>flush(()=>root.render(<AccountProvider service={service}><Probe/></AccountProvider>));
test('restores the account and favorites, then returns to separate guest preferences on sign out',async()=>{
 writeCachedFavorites(null,['Apple']);
 await mount();
 expect(state()).toMatchObject({user:'alice',favorites:['AI'],loading:false});
 saveVideo({id:'private',snippet:{title:'Private'}});
 await flush(()=>container.querySelectorAll('button')[1].click());
 expect(state()).toMatchObject({user:null,favorites:['Apple'],loading:false});
 expect(readLibrary('saved')).toEqual([]);
});
test('stale profile data cannot overwrite another account',async()=>{
 let finishAlice;
 service.loadFavorites.mockImplementation(id=>id==='alice'?new Promise(resolve=>{finishAlice=resolve;}):Promise.resolve(['Physics']));
 await mount();
 await flush(()=>emit({user:{id:'bob'}}));
 expect(state()).toMatchObject({user:'bob',favorites:['Physics']});
 await flush(()=>finishAlice(['Apple']));
 expect(state()).toMatchObject({user:'bob',favorites:['Physics']});
 expect(readCachedFavorites('bob')).toEqual(['Physics']);
});
test('a late bootstrap session cannot replace a newer sign-in event',async()=>{
 let finishSession;
 service.getSession.mockImplementation(()=>new Promise(resolve=>{finishSession=resolve;}));
 await mount();
 await flush(()=>emit({user:{id:'bob'}}));
 await flush(()=>finishSession(null));
 expect(state().user).toBe('bob');
});
test('failed preference saves roll back the optimistic value and report failure',async()=>{
 service.saveFavorites.mockRejectedValue(new Error('Could not save your topics.'));
 await mount();
 await flush(()=>container.querySelector('button').click());
 expect(state().favorites).toEqual(['AI']);
 expect(state().error).toMatch(/could not save/i);
 expect(readCachedFavorites('alice')).toEqual(['AI']);
});
test('guest favorites work without a configured login provider',async()=>{
 service.configured=false;service.getSession.mockResolvedValue(null);
 await mount();
 await flush(()=>container.querySelector('button').click());
 expect(state()).toMatchObject({user:null,favorites:['Physics']});
 expect(readCachedFavorites(null)).toEqual(['Physics']);
 expect(service.saveFavorites).not.toHaveBeenCalled();
});

test('guest storage failures are reported rather than claiming preferences were saved',async()=>{
 service.configured=false;service.getSession.mockResolvedValue(null);
 await mount();
 const denied=jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('storage disabled');});
 try {
   await flush(()=>container.querySelector('button').click());
   expect(state().error).toMatch(/could not save.*device/i);
   expect(state().favorites).toEqual([]);
 } finally {denied.mockRestore();}
});
