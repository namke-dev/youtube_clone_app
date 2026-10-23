import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {getSupabaseClient} from '../utils/supabase';
import {createAccountService,readCachedFavorites,writeCachedFavorites} from '../utils/account-service';
import {cleanFavorites} from '../utils/personalization';
import {setLibraryOwner} from '../utils/library';

const AccountContext=createContext(null);
const guest={user:null,favorites:[],loading:false,saving:false,error:null,configured:false,profileReady:true};
export const useAccount=()=>useContext(AccountContext)||guest;
export function AccountProvider({children,service:providedService}) {
  const [service]=useState(()=>{
    if (providedService) return providedService;
    try { return createAccountService(getSupabaseClient()); }
    catch { return createAccountService(null); }
  });
  const [state,setState]=useState({...guest,favorites:readCachedFavorites(null),loading:service.configured,configured:service.configured});
  const latest=useRef(state);
  latest.current=state;
  const revision=useRef(0);
  const saveRevision=useRef(0);
  const active=useRef(true);
  useEffect(()=>{
    active.current=true;
    let disposed=false;
    let authEventReceived=false;
    let initialized=false;
    let owner;
    function accept(session) {
      if (!active.current||disposed) return;
      const user=session?.user||null;
      const userId=user?.id||null;
      if (initialized && owner===userId) {
        setState(old=>({...old,user}));
        return;
      }
      initialized=true;owner=userId;
      const current=++revision.current;
      ++saveRevision.current;
      setLibraryOwner(userId);
      setState({...guest,configured:service.configured,user,favorites:readCachedFavorites(userId),loading:Boolean(user),profileReady:!user});
      if (user) {
        service.loadFavorites(userId).then(favorites=>{
          if (!active.current||disposed||current!==revision.current) return;
          writeCachedFavorites(userId,favorites);
          setState(old=>({...old,favorites,loading:false,profileReady:true}));
        }).catch(error=>{
          if (active.current&&!disposed&&current===revision.current) setState(old=>({...old,loading:false,error:error.message,profileReady:false}));
        });
      }
    }
    // The auth callback is synchronous; never await Supabase calls within it.
    const unsubscribe=service.subscribe(session=>{authEventReceived=true;accept(session);});
    service.getSession().then(session=>{if(!authEventReceived) accept(session);}).catch(error=>{
      if (active.current&&!disposed&&!authEventReceived) setState(old=>({...old,loading:false,error:error.message}));
    });
    return ()=>{
      disposed=true;active.current=false;
      unsubscribe();setLibraryOwner(null);
    };
  },[service]);
  async function runAuth(action) {
    setState(old=>({...old,error:null}));
    try { await action(); return true; }
    catch(error) { if(active.current) setState(old=>({...old,error:error.message}));return false; }
  }
  async function saveFavorites(values) {
    const snapshot=latest.current;
    if (snapshot.loading||snapshot.saving||(snapshot.user&&!snapshot.profileReady)) return false;
    const favorites=cleanFavorites(values);
    const userId=snapshot.user?.id||null;
    const current=revision.current;
    const saving=++saveRevision.current;
    const cached=writeCachedFavorites(userId,favorites);
    if(!userId&&!cached) {
      setState(old=>({...old,error:"Could not save your topics on this device. Browser storage may be unavailable."}));
      return false;
    }
    setState(old=>({...old,favorites,saving:Boolean(userId),error:null}));
    try {
      if(userId) await service.saveFavorites(userId,favorites);
      if(active.current&&current===revision.current&&saving===saveRevision.current) setState(old=>({...old,saving:false}));
      return true;
    } catch(error) {
      if(active.current&&current===revision.current&&saving===saveRevision.current) {
        writeCachedFavorites(userId,snapshot.favorites);
        setState(old=>({...old,favorites:snapshot.favorites,saving:false,error:error.message}));
      }
      return false;
    }
  }
  async function reloadFavorites() {
    const userId=latest.current.user?.id;
    if(!userId) return;
    const current=revision.current;
    setState(old=>({...old,loading:true,error:null}));
    try {
      const favorites=await service.loadFavorites(userId);
      if(active.current&&current===revision.current) {
        writeCachedFavorites(userId,favorites);
        setState(old=>({...old,favorites,loading:false,profileReady:true}));
      }
    } catch(error) {
      if(active.current&&current===revision.current) setState(old=>({...old,loading:false,error:error.message}));
    }
  }
  return <AccountContext.Provider value={{...state,saveFavorites,reloadFavorites,signIn:()=>runAuth(()=>service.signIn()),signOut:()=>runAuth(()=>service.signOut())}}>{children}</AccountContext.Provider>;
}
