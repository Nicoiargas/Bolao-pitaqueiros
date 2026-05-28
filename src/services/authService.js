import { supabase } from './supabase';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@bolao.com';

const mapUser = (row) => row ? ({
  uid:         row.id,
  email:       row.email,
  displayName: row.display_name,
  role:        row.role,
  totalPoints: row.total_points ?? 0,
  createdAt:   row.created_at,
}) : null;

function userFromSession(u) {
  return {
    uid:         u.id,
    email:       u.email,
    displayName: u.user_metadata?.display_name || u.email.split('@')[0],
    role:        u.email === ADMIN_EMAIL ? 'admin' : 'user',
    totalPoints: 0,
  };
}

async function fetchProfile(userId) {
  try {
    const { data } = await Promise.race([
      supabase.from('users').select('*').eq('id', userId).single(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function registerUser(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;

  const profile = {
    id:           data.user.id,
    email,
    display_name: displayName,
    role:         email === ADMIN_EMAIL ? 'admin' : 'user',
    total_points: 0,
  };

  await supabase.from('users').insert(profile).catch(() => {});
  return mapUser(profile);
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email ou senha incorretos');

  const profile = await fetchProfile(data.user.id);
  return profile ? mapUser(profile) : userFromSession(data.user);
}

export async function logoutUser() {
  await supabase.auth.signOut();
}

export function onAuthChange(callback) {
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!session?.user) { callback(null); return; }
    const profile = await fetchProfile(session.user.id);
    callback(profile ? mapUser(profile) : userFromSession(session.user));
  }).catch(() => callback(null));

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION') return;
    if (event === 'PASSWORD_RECOVERY') { callback(null, true); return; }
    if (!session?.user) { callback(null); return; }
    const profile = await fetchProfile(session.user.id);
    callback(profile ? mapUser(profile) : userFromSession(session.user));
  });
  return () => subscription.unsubscribe();
}

export async function isAdmin(uid) {
  try {
    const { data } = await Promise.race([
      supabase.from('users').select('role').eq('id', uid).single(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return data?.role === 'admin';
  } catch {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email === ADMIN_EMAIL;
  }
}

export async function getUserData(uid) {
  const profile = await fetchProfile(uid);
  return mapUser(profile);
}
