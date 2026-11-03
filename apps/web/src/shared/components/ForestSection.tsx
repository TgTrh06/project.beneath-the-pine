import type {ReactNode} from 'react';
export function ForestSection({title,children,open=false}:{title:string;children:ReactNode;open?:boolean}){return <details className="forest-section" name="forest-settings" open={open}><summary>{title}<span aria-hidden="true">＋</span></summary><div className="forest-section-body">{children}</div></details>}
