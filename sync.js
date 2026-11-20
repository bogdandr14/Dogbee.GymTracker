// Gym Tracker – optional Google sign-in + Firestore sync.
// Data layout: users/{uid}                 (profile, marks the catalog as seeded)
//              users/{uid}/meta/muscles    ({map: {muscle: group}})
//              users/{uid}/exercises/{id}  ({name, eq, main, sec})
//              users/{uid}/entries/{id}    ({ex, date, ts, sets:[{w,r}]})
const V = '12.15.0';
const emit = (kind, detail = {}) => window.dispatchEvent(new CustomEvent('gymsync', { detail: { kind, ...detail } }));

async function start() {
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || !cfg.projectId) { window.GymSync = { available: false }; emit('ready'); return; }

  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(cfg);
  const auth = A.getAuth(app);
  let db;
  try { db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
  catch (e) { db = F.getFirestore(app); }

  let uid = null, unsubs = [], data = {}, pending = {}, cached = {}, error = '', seedPending = false;
  const G = window.GymSync = { available: true, user: null };

  let seeding = false, retryAt = 0;
  const status = () => {
    // Retry the first-sign-in check once we are online again (also covers missed 'online' events).
    if (uid && seedPending && navigator.onLine && !seeding && Date.now() > retryAt) { retryAt = Date.now() + 5000; ensureSeeded(uid); }
    const s = error ? 'error' : !navigator.onLine ? 'offline' : (seedPending || Object.values(pending).some(Boolean)) ? 'syncing' : 'synced';
    emit('status', { status: s, error });
  };
  const ref = (...p) => F.doc(db, 'users', uid, ...p);
  const fail = e => { error = (e && (e.code || e.message)) || 'unknown error'; status(); };

  function emitData() {
    if (!data.exercises || !data.entries || !data.muscles) return;
    emit('data', { fromCache: Object.values(cached).some(Boolean), data: { muscles: data.muscles, exercises: data.exercises, entries: data.entries } });
  }

  async function ensureSeeded(u) {
    seeding = true;
    try {
      const snap = await F.getDocFromServer(F.doc(db, 'users', u));
      seedPending = false; status();
      if (snap.exists()) return;
      const d = window.GymDefaults();
      const b = F.writeBatch(db);
      b.set(F.doc(db, 'users', u), { createdAt: Date.now() });
      b.set(F.doc(db, 'users', u, 'meta', 'muscles'), { map: d.muscles });
      for (const x of d.exercises) b.set(F.doc(db, 'users', u, 'exercises', x.id), { name: x.name, eq: x.eq, main: x.main, sec: x.sec });
      await b.commit();
    } catch (e) {
      // Offline on first sign-in on this device: try again when back online.
      seedPending = true;
    } finally { seeding = false; }
    status();
  }

  function listen(u) {
    const opt = { includeMetadataChanges: true };
    unsubs.push(F.onSnapshot(F.collection(db, 'users', u, 'exercises'), opt, s => {
      data.exercises = s.docs.map(d => { const x = d.data(); return { id: d.id, name: x.name || '?', eq: x.eq || '', main: x.main || '', sec: Array.isArray(x.sec) ? x.sec : [] }; });
      pending.ex = s.metadata.hasPendingWrites; cached.ex = s.metadata.fromCache; error = ''; status(); emitData();
    }, fail));
    unsubs.push(F.onSnapshot(F.collection(db, 'users', u, 'entries'), opt, s => {
      data.entries = s.docs.map(d => { const x = d.data(); return { id: d.id, ex: x.ex, date: x.date, ts: x.ts || 0, sets: (x.sets || []).map(o => [+o.w || 0, +o.r || 0]) }; });
      pending.en = s.metadata.hasPendingWrites; cached.en = s.metadata.fromCache; error = ''; status(); emitData();
    }, fail));
    unsubs.push(F.onSnapshot(F.doc(db, 'users', u, 'meta', 'muscles'), opt, s => {
      data.muscles = (s.exists() && s.data().map) || {};
      pending.mu = s.metadata.hasPendingWrites; status(); emitData();
    }, fail));
  }

  const entryDoc = e => ({ ex: e.ex, date: e.date, ts: e.ts || Date.now(), sets: e.sets.map(([w, r]) => ({ w: +w || 0, r: +r || 0 })) });
  const exDoc = x => ({ name: x.name, eq: x.eq, main: x.main, sec: x.sec || [] });

  // Writes are not awaited: offline they are queued by Firestore and sent later.
  G.apply = (type, p) => {
    if (!uid) throw new Error('not signed in');
    if (type === 'putEntry') F.setDoc(ref('entries', p.id), entryDoc(p)).catch(fail);
    else if (type === 'delEntry') F.deleteDoc(ref('entries', p)).catch(fail);
    else if (type === 'putExercise') F.setDoc(ref('exercises', p.id), exDoc(p)).catch(fail);
    else if (type === 'putMuscles') F.setDoc(ref('meta', 'muscles'), { map: p }).catch(fail);
    else if (type === 'delExercise') {
      const ids = [p.id, ...(p.entries || [])];
      for (let i = 0; i < ids.length; i += 450) {
        const b = F.writeBatch(db);
        ids.slice(i, i + 450).forEach((id, j) => b.delete(i + j === 0 ? ref('exercises', id) : ref('entries', id)));
        b.commit().catch(fail);
      }
    } else if (type === 'bulk') {
      const ops = [...(p.exercises || []).map(x => [ref('exercises', x.id), exDoc(x)]), ...(p.entries || []).map(e => [ref('entries', e.id), entryDoc(e)])];
      if (p.muscles) ops.push([ref('meta', 'muscles'), { map: p.muscles }]);
      for (let i = 0; i < ops.length; i += 450) {
        const b = F.writeBatch(db);
        ops.slice(i, i + 450).forEach(([r, d]) => b.set(r, d));
        b.commit().catch(fail);
      }
    }
  };

  G.signIn = async () => {
    const provider = new A.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { await A.signInWithPopup(auth, provider); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) {
        await A.signInWithRedirect(auth, provider);
      } else if (e.code !== 'auth/popup-closed-by-user') throw e;
    }
  };
  G.signOut = () => A.signOut(auth);
  A.getRedirectResult(auth).catch(() => {});

  A.onAuthStateChanged(auth, async u => {
    unsubs.forEach(f => f()); unsubs = []; data = {}; pending = {}; cached = {}; error = ''; seedPending = false;
    uid = u ? u.uid : null;
    G.user = u ? { uid: u.uid, email: u.email || '', name: u.displayName || '' } : null;
    emit('user');
    if (u) { listen(u.uid); await ensureSeeded(u.uid); }
    status();
  });

  addEventListener('online', () => { if (uid && seedPending) ensureSeeded(uid); status(); });
  addEventListener('offline', status);
  emit('ready');
}

start().catch(e => { window.GymSync = { available: false, loadError: String(e && e.message || e) }; emit('ready'); });
