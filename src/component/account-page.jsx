import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import {useAccount} from '../context/account-context';
import {topics} from '../utils/topics';
import {MAX_FAVORITES} from '../utils/personalization';
import SideBar from './side-bar';

export default function AccountPage() {
  const account=useAccount();
  const navigate=useNavigate();
  const [draft,setDraft]=useState(account.favorites);
  const [starting,setStarting]=useState(false);
  useEffect(()=>{setDraft(account.favorites);},[account.favorites]);
  const blocked=account.loading||account.saving||(account.user&&!account.profileReady);
  function toggle(name) {
    setDraft(old=>old.includes(name)?old.filter(value=>value!==name):old.length<MAX_FAVORITES?[...old,name]:old);
  }
  async function save() {
    if(await account.saveFavorites(draft)) navigate('/');
  }
  async function signIn() {
    setStarting(true);
    await account.signIn();
    setStarting(false);
  }
  const name=account.user?.user_metadata?.full_name||account.user?.email||'Your account';
  return <div className="app-layout"><SideBar/><main id="main" className="feed account-page">
    <div className="intro"><div><span className="eyebrow">YOUR SPACE</span><h1>Make this feel like you.</h1><p>Your interests. A more personal rabbit hole.</p></div></div>
    <section className="account-card" aria-labelledby="account-heading">
      <h2 id="account-heading">{account.user?'Welcome back.':'Take your interests with you.'}</h2>
      {account.user?<>
        <p className="account-identity">{name}</p>
        <p>Your favorite topics are saved to your account.</p>
        <button className="button" onClick={()=>account.signOut()} disabled={account.loading||account.saving}>Sign out</button>
      </>:<>
        <p>Sign in with Google to keep your favorite topics across devices. Browsing as a guest always works.</p>
        <button className="button google-sign-in" onClick={signIn} disabled={!account.configured||starting||account.loading}>
          <GoogleIcon aria-hidden="true"/>{starting?'Opening Google…':'Continue with Google'}
        </button>
        {!account.configured&&<p className="account-hint">Google sign-in is being set up. You can still choose topics on this device.</p>}
      </>}
    </section>
    <section className="account-card" aria-labelledby="favorites-heading">
      <div className="account-section-heading"><h2 id="favorites-heading">Your favorite topics</h2><span aria-live="polite">{draft.length} / {MAX_FAVORITES}</span></div>
      <p>Choose up to {MAX_FAVORITES}. We’ll pin them in your topic bar and use them to shape For you.</p>
      <div className="favorite-options" aria-label="Choose favorite topics">
        {topics.slice(1).map(topic=><button key={topic.name} className={`favorite-option ${draft.includes(topic.name)?'selected':''}`} aria-pressed={draft.includes(topic.name)} disabled={blocked||(!draft.includes(topic.name)&&draft.length>=MAX_FAVORITES)} onClick={()=>toggle(topic.name)}>{topic.name}</button>)}
      </div>
      <div className="account-save"><button className="button primary" disabled={blocked} onClick={save}>{account.saving?'Saving…':'Save topics'}</button><span>{account.user?'Saved to your account.':'Saved on this device.'}</span></div>
    </section>
    {account.loading&&<p role="status">Loading your account…</p>}
    {account.error&&<div className="account-error" role="alert"><p>{account.error}</p>{account.user&&!account.profileReady&&<button className="button" onClick={()=>account.reloadFavorites()}>Try again</button>}</div>}
  </main></div>;
}
