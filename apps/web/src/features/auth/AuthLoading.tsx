import { ReturnScene } from '../return/ReturnScene';
export function AuthLoading(){return <ReturnScene place="auth">{()=> <main className="site-shell forest-shell forest-auth"><div className="forest-auth-loading" role="status"><img src="/marten/3d/rest.webp" width="88" height="68" alt=""/><p>Đang mở khoảng riêng của bạn…</p></div></main>}</ReturnScene>}
