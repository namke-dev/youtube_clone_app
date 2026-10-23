import { cleanFavorites } from './personalization';
const cacheKey = userId => userId ? `devtubes:user:${userId}:favorites` : 'devtubes:favorites';
export function readCachedFavorites(userId) {
  try { return cleanFavorites(JSON.parse(localStorage.getItem(cacheKey(userId)) || '[]')); }
  catch { return []; }
}
export function writeCachedFavorites(userId, favorites) {
  try { localStorage.setItem(cacheKey(userId),JSON.stringify(cleanFavorites(favorites))); return true; }
  catch { return false; }
}
export function createAccountService(client) {
  const requireClient = () => {
    if (!client) throw new Error('Google sign-in is not configured yet. You can continue as a guest.');
    return client;
  };
  return {
    configured: Boolean(client),
    async getSession() {
      if (!client) return null;
      const {data,error} = await client.auth.getSession();
      if (error) throw new Error('Could not restore your account. Please sign in again.');
      return data.session;
    },
    subscribe(listener) {
      if (!client) return () => {};
      const {data} = client.auth.onAuthStateChange((_event,session) => { listener(session); });
      return () => data.subscription.unsubscribe();
    },
    async signIn() {
      const {error} = await requireClient().auth.signInWithOAuth({
        provider:'google',
        options:{redirectTo:new URL('/account',window.location.origin).href,queryParams:{prompt:'select_account'}},
      });
      if (error) throw new Error('Could not open Google sign-in. Please try again.');
    },
    async signOut() {
      const {error} = await requireClient().auth.signOut({scope:'local'});
      if (error) throw new Error('Could not sign out. Please try again.');
    },
    async loadFavorites(userId) {
      const {data,error} = await requireClient().from('user_preferences').select('favorite_topics').eq('user_id',userId).maybeSingle();
      if (error) throw new Error('Your topics could not be synced. Please try again.');
      return cleanFavorites(data?.favorite_topics);
    },
    async saveFavorites(userId, favorites) {
      const {error} = await requireClient().from('user_preferences').upsert({user_id:userId,favorite_topics:cleanFavorites(favorites),updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if (error) throw new Error('Could not save your topics. Please try again.');
    },
  };
}
