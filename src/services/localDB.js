const PREFIX = 'bolao_';

export const db = {
  get: (col) => JSON.parse(localStorage.getItem(PREFIX + col) || '[]'),
  save: (col, data) => localStorage.setItem(PREFIX + col, JSON.stringify(data)),
  genId: () => crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36),
};

export function initSeed() {
  if (db.get('users').length === 0) {
    const adminId = db.genId();
    db.save('users', [{
      id: adminId,
      uid: adminId,
      email: 'admin@bolao.com',
      password: 'admin123',
      displayName: 'Admin',
      role: 'admin',
      totalPoints: 0,
      createdAt: new Date().toISOString(),
    }]);
  }

}
