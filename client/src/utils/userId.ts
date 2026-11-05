// Persistent player identifier stored in sessionStorage
// Survives page refreshes and socket reconnections within the tab session
export const getPersistentUserId = (): string => {
  if (typeof window === 'undefined') return 'ssr_player';
  let uid = sessionStorage.getItem('footy_user_id');
  if (!uid) {
    uid = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem('footy_user_id', uid);
  }
  return uid;
};
