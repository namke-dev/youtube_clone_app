import { createAccountService, readCachedFavorites, writeCachedFavorites } from './account-service';
beforeEach(() => localStorage.clear());
test('missing configuration supports a guest session and refuses fake sign-in', async () => {
  const service = createAccountService(null);
  expect(service.configured).toBe(false);
  expect(await service.getSession()).toBeNull();
  await expect(service.signIn()).rejects.toThrow(/not configured/i);
});
test('Google OAuth uses a same-origin account callback', async () => {
  const signInWithOAuth=jest.fn().mockResolvedValue({error:null});
  await createAccountService({auth:{signInWithOAuth}}).signIn();
  expect(signInWithOAuth).toHaveBeenCalledWith({provider:'google',options:{redirectTo:'http://localhost/account',queryParams:{prompt:'select_account'}}});
});
test('preferences load and save are scoped to the authenticated user ID', async () => {
  const maybeSingle=jest.fn().mockResolvedValue({data:{favorite_topics:['AI','unknown']},error:null});
  const eq=jest.fn().mockReturnValue({maybeSingle});
  const upsert=jest.fn().mockResolvedValue({error:null});
  const from=jest.fn().mockReturnValue({select:()=>({eq}),upsert});
  const service=createAccountService({from});
  expect(await service.loadFavorites('alice')).toEqual(['AI']);
  expect(eq).toHaveBeenCalledWith('user_id','alice');
  await service.saveFavorites('alice',['AI','unknown']);
  expect(from).toHaveBeenCalledWith('user_preferences');
  expect(upsert).toHaveBeenCalledWith(expect.objectContaining({user_id:'alice',favorite_topics:['AI']}),{onConflict:'user_id'});
});
test('server preference failures are surfaced and never reported as saved', async () => {
  const service=createAccountService({from:()=>({upsert:async()=>({error:{message:'denied'}})})});
  await expect(service.saveFavorites('alice',['AI'])).rejects.toThrow(/could not save/i);
});
test('cached preferences are separated for guests and different accounts', () => {
  writeCachedFavorites(null,['Physics']);
  writeCachedFavorites('alice',['AI']);
  expect(readCachedFavorites('alice')).toEqual(['AI']);
  expect(readCachedFavorites('bob')).toEqual([]);
  expect(readCachedFavorites(null)).toEqual(['Physics']);
});
