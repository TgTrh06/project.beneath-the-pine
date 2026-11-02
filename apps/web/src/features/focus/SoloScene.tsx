import { lazy, memo, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ForestAppearance } from '../../app/ForestAppearance';
import { SceneBoundary } from '../camps/scene/SceneBoundary';
import { readBrandValue } from '../../shared/brandStorage';
import { parseSettings, resolveTime, resolveWeather, times, weathers, type TimeChoice, type WeatherChoice } from '../camps/scene/environment';
import '../camps/scene/lodge.css';
import { SessionLifeControls, useSessionLife } from './SessionLifeControls';
const Canvas = lazy(()=>import('../camps/scene/LodgeCanvas'));
const key = 'pyneath:solo-scene';
function readSettings() {try{return parseSettings(JSON.parse(readBrandValue(localStorage,key)??readBrandValue(localStorage,'pyneath:camp-scene')??'{}'));}catch{return parseSettings(null);}}
export const SoloScene = memo(function SoloScene({active,children}:{active:boolean;children:(controls:ReactNode,scene:ReactNode)=>ReactNode}) {
  const [settings,setSettings]=useState(readSettings),[reduced,setReduced]=useState(true),[visible,setVisible]=useState(false);
  const [life,setLife]=useSessionLife(settings.motion);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[now,setNow]=useState(Date.now);
  const phase=resolveTime(settings.time,new Date(now)),weather=resolveWeather(settings.weather,now);
  const animate=active&&life.level!=='still'&&!settings.light&&!failed&&!reduced&&visible;
  const onReady=useCallback(()=>setReady(true),[]),onFailure=useCallback(()=>setFailed(true),[]);
  useEffect(()=>{
    const pref=matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>setReduced(pref.matches),visibility=()=>setVisible(document.visibilityState==='visible');motion();visibility();
    pref.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
    if((navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData)setSettings(s=>({...s,light:true}));
    return ()=>{pref.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{if(!visible||(settings.time!=='auto'&&settings.weather!=='auto'))return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),30000);return ()=>clearInterval(timer);},[visible,settings.time,settings.weather]);
  useEffect(()=>{if(settings.light||ready||failed)return;const timer=setTimeout(onFailure,20000);return ()=>clearTimeout(timer);},[settings.light,ready,failed,attempt,onFailure]);
  function update(next:typeof settings){setSettings(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{/* Optional local preference. */}}
  const controls = <ForestAppearance>
    <fieldset className="session-atmosphere-group"><legend>Cảnh rừng</legend>
      <label>Thời điểm<select aria-label="Thời điểm" value={settings.time} onChange={e=>update({...settings,time:e.target.value as TimeChoice})}>{Object.entries(times).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label>Thời tiết<select aria-label="Thời tiết" value={settings.weather} onChange={e=>update({...settings,weather:e.target.value as WeatherChoice})}>{Object.entries(weathers).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <p className="lodge-environment-note">Thời tiết mô phỏng{settings.weather==='auto'?' · đổi mỗi 20 phút':''}.</p>
    </fieldset>
    <fieldset className="session-atmosphere-group"><legend>Chuyển động</legend>
      <SessionLifeControls value={life} onChange={setLife} disabled={settings.light||reduced||!active||failed}/>
      <button type="button" className="secondary" aria-pressed={settings.light} onClick={()=>{setReady(false);update({...settings,light:!settings.light});}}>Chế độ nhẹ · {settings.light?'Bật':'Tắt'}</button>
    </fieldset>
  </ForestAppearance>;
  return children(controls,<section className="solo-scene camp-lodge" aria-label="Góc riêng dưới cây tùng" data-time={phase} data-weather={weather} data-static={settings.light||failed||!ready}>
    <div className="lodge-stage"><img className="lodge-poster" src={`/solo/solo-poster-${phase}.webp`} alt="Một người ngồi thư thả dưới gốc tùng, Marten nằm cuộn mình ngay bên cạnh." width="1600" height="1000" /><div className="lodge-static-weather" aria-hidden="true" />
    {!settings.light&&!failed&&<SceneBoundary key={attempt} onFailure={onFailure}><div className="lodge-render" style={{opacity:ready?1:0}}><Suspense fallback={null}><Canvas solo life={life} attempt={attempt} phase={phase} weather={weather} members={[]} selected={[]} animate={animate} visible={visible} onMember={()=>{}} onPacts={()=>{}} onReady={onReady} onFailure={onFailure}/></Suspense></div></SceneBoundary>}</div>
    <p className="solo-scene-status" role="status">{failed?<>Cảnh 3D chưa mở được. Phiên vẫn tiếp tục. <button className="text-action" onClick={()=>{setFailed(false);setReady(false);setAttempt(n=>n+1);update({...settings,light:false});}}>Thử lại cảnh 3D</button></>:settings.light?'Đang dùng cảnh tĩnh.':!ready?'Đang mở góc rừng…':reduced?'Chuyển động đã tắt theo cài đặt thiết bị.':''}</p>
  </section>);
});
