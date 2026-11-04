import type { ForestArrangement, ForestThreshold } from '@pyneath/contracts';
import { arrangedForest } from './forestArrangement';

export function ForestPreview({ earned, arrangement }: { earned: readonly ForestThreshold[]; arrangement: ForestArrangement | null }) {
  const items = arrangedForest(earned, arrangement);
  return <svg className="forest-preview" viewBox="0 0 240 144" role="img" aria-label={`Góc rừng nhìn từ trên xuống: ${items.length} vật phẩm đang hiện.`}>
    <ellipse cx="120" cy="78" rx="108" ry="56" fill="currentColor" opacity=".06"/>
    <path d="M24 114Q120 130 216 114" fill="none" stroke="currentColor" opacity=".4"/>
    {items.map(({ threshold, position: [x, z] }) => <g key={threshold} data-item={threshold} transform={`translate(${120 + x * 85} ${65 + z * 70})`} stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none">
      {threshold === 1 ? <><path d="M0 16V-13M0 0Q-24 1-18-17Q0-17 0 0ZM0-5Q-1-26 17-24Q22-7 0-5Z" fill="currentColor" fillOpacity=".16"/></>
        : threshold === 3 ? <>{[[-13, 0], [0, -9], [13, 5]].map(([a, b], i) => <g key={i} transform={`translate(${a} ${b})`}><path d="M0 10V0"/><path d="M0-5C-10-18-17-4-6 0C-17 8-3 15 0 5C7 16 18 4 7 0C18-10 3-17 0-5Z" fill="currentColor" fillOpacity=".2"/></g>)}</>
          : <><path d="M-14 18V-30H1V-22M-8-19H13L10 11H-5ZM-8-19L-3-24H8L13-19Z"/><path d="M2-12V4" strokeWidth="4"/></>}
    </g>)}
    {!items.length && <text x="120" y="80" textAnchor="middle" fill="currentColor" fontSize="13">Một khoảng yên.</text>}
  </svg>;
}
