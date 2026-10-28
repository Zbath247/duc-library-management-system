import db from '../config/db.js';

export function recordAudit(userId, action, entityType, entityId, details = null, ipAddress = null) {
  try {
    const detailsStr = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null;
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId || null, action, entityType, entityId || null, detailsStr, ipAddress || null);
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
}

export function auditMiddleware(action, entityType) {
  return (req, res, next) => {
    // Intercept finish to record log on successful responses
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        const entityId = req.params?.id || req.body?.id || null;
        recordAudit(req.user?.id, action, entityType, entityId, { body: req.body, query: req.query }, ip);
      }
    });
    next();
  };
}
