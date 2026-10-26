/* 홍무의 기록 — 댓글 서버 (Cloudflare Workers + D1)
   - 손님이 쓴 댓글은 '대기' 상태로 저장되고, 관리자가 승인해야 사이트에 보입니다.
   - 필요한 설정: D1 연결 이름 DB / 비밀 값 ADMIN_PASSWORD / (선택) ALLOWED_ORIGIN
*/
const MAX_NAME = 20;
const MAX_BODY = 500;
let ready = false;

async function ensureSchema(env) {
  if (ready) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      name TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      ip_hash TEXT NOT NULL
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_comments_page ON comments (page, status, id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments (ip_hash, created_at)'),
  ]);
  ready = true;
}

const origins = (env) => String(env.ALLOWED_ORIGIN || 'https://hongmu0623.github.io').split(',').map((s) => s.trim()).filter(Boolean);

function corsHeaders(env, req) {
  const list = origins(env);
  const o = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': list.includes(o) ? o : list[0],
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (env, req, data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(env, req) },
  });

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(buf);
}
async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
async function ipHash(env, req) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  const h = await sha256(ip + '|' + (env.ADMIN_PASSWORD || 'salt'));
  return Array.from(h.slice(0, 12)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function isAdmin(env, req) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
  const ok = !!(env.ADMIN_PASSWORD && m && (await sameSecret(m[1], env.ADMIN_PASSWORD)));
  if (!ok) await new Promise((r) => setTimeout(r, 600)); // 비밀번호 대입 공격 늦추기
  return ok;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(env, req) });
    if (!env.DB) return json(env, req, { error: '서버 설정이 끝나지 않았어요. (DB 연결 필요)' }, 500);

    try {
      await ensureSchema(env);

      /* ---------- 손님: 승인된 댓글 보기 ---------- */
      if (req.method === 'GET' && url.pathname === '/comments') {
        const page = url.searchParams.get('page') || '';
        if (!/^[\w-]{1,100}$/.test(page)) return json(env, req, { error: '잘못된 요청이에요.' }, 400);
        const { results } = await env.DB.prepare(
          "SELECT id, name, body, created_at FROM comments WHERE page = ?1 AND status = 'approved' ORDER BY id ASC LIMIT 200"
        ).bind(page).all();
        return json(env, req, { comments: results });
      }

      /* ---------- 손님: 댓글 남기기 ---------- */
      if (req.method === 'POST' && url.pathname === '/comments') {
        const origin = req.headers.get('Origin');
        if (origin && !origins(env).includes(origin)) return json(env, req, { error: '허용되지 않은 주소예요.' }, 403);
        let data;
        try { data = await req.json(); } catch (e) { return json(env, req, { error: '잘못된 요청이에요.' }, 400); }

        if (data.website) return json(env, req, { ok: true }); // 봇이 숨은 칸을 채우면 조용히 무시
        const page = String(data.page || '');
        const name = String(data.name || '').trim();
        const body = String(data.body || '').trim();
        if (!/^[\w-]{1,100}$/.test(page)) return json(env, req, { error: '잘못된 요청이에요.' }, 400);
        if (!name || name.length > MAX_NAME) return json(env, req, { error: `이름은 1~${MAX_NAME}자로 적어 주세요.` }, 400);
        if (!body || body.length > MAX_BODY) return json(env, req, { error: `댓글은 1~${MAX_BODY}자로 적어 주세요.` }, 400);
        if (/https?:\/\/|www\./i.test(name + ' ' + body)) return json(env, req, { error: '링크는 넣을 수 없어요.' }, 400);

        const ip = await ipHash(env, req);
        const now = Math.floor(Date.now() / 1000);
        const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ?1 AND created_at > ?2').bind(ip, now - 600).first();
        const daily = await env.DB.prepare('SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ?1 AND created_at > ?2').bind(ip, now - 86400).first();
        if (recent.n >= 3 || daily.n >= 15) return json(env, req, { error: '댓글을 너무 자주 남기고 있어요. 잠시 후 다시 해 주세요.' }, 429);
        const waiting = await env.DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE page = ?1 AND status = 'pending'").bind(page).first();
        if (waiting.n >= 100) return json(env, req, { error: '지금은 댓글을 받을 수 없어요. 나중에 다시 해 주세요.' }, 429);

        await env.DB.prepare('INSERT INTO comments (page, name, body, status, created_at, ip_hash) VALUES (?1, ?2, ?3, \'pending\', ?4, ?5)')
          .bind(page, name, body, now, ip).run();
        return json(env, req, { ok: true }, 201);
      }

      /* ---------- 관리자 ---------- */
      if (url.pathname.startsWith('/admin/')) {
        if (!(await isAdmin(env, req))) return json(env, req, { error: '비밀번호가 맞지 않아요.' }, 401);

        if (req.method === 'GET' && url.pathname === '/admin/comments') {
          const status = ['pending', 'approved'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'pending';
          const { results } = await env.DB.prepare(
            'SELECT id, page, name, body, status, created_at FROM comments WHERE status = ?1 ORDER BY id DESC LIMIT 200'
          ).bind(status).all();
          const c = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM comments GROUP BY status").all();
          const counts = { pending: 0, approved: 0 };
          for (const r of c.results) counts[r.status] = r.n;
          return json(env, req, { comments: results, counts });
        }
        let m;
        if (req.method === 'POST' && (m = url.pathname.match(/^\/admin\/comments\/(\d+)\/approve$/))) {
          await env.DB.prepare("UPDATE comments SET status = 'approved' WHERE id = ?1").bind(+m[1]).run();
          return json(env, req, { ok: true });
        }
        if (req.method === 'DELETE' && (m = url.pathname.match(/^\/admin\/comments\/(\d+)$/))) {
          await env.DB.prepare('DELETE FROM comments WHERE id = ?1').bind(+m[1]).run();
          return json(env, req, { ok: true });
        }
      }

      return json(env, req, { error: '찾을 수 없어요.' }, 404);
    } catch (e) {
      return json(env, req, { error: '서버에 문제가 생겼어요. 잠시 후 다시 해 주세요.' }, 500);
    }
  },
};
