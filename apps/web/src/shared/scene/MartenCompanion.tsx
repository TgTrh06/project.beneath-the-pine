import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Group, Quaternion, Vector3 } from 'three';
import { MartenModel } from './MartenModel';
import type { MartenPose } from './martenPoses';
import { martenMomentAt, retimeMarten, type LifeLevel, type MartenAction } from './forestActivity';
import { dampMotion, motionDelta, motionWindow, strollAt, type CompanionMotion } from './motion';

const poses:Record<MartenAction,MartenPose>={sleep:'curl',rest:'rest',listen:'sit',look:'look-back',stretch:'stretch',groom:'groom',sniff:'stand',walk:'stand',yawn:'sit'};
export function MartenCompanion({animate,level,sleeping=false}:{animate:boolean;level:LifeLevel;sleeping?:boolean}) {
  const root=useRef<Group>(null),elapsed=useRef((sleeping?0:46)*(level==='gentle'?1.65:1));
  const previousLevel=useRef<LifeLevel>(level==='gentle'?'gentle':'lively');
  const initial=martenMomentAt(elapsed.current,previousLevel.current);
  const [action,setAction]=useState<MartenAction>(initial.action),previous=useRef(action);
  const [pose,setPose]=useState<MartenPose>(poses[action]),previousPose=useRef(pose);
  const motion=useRef<CompanionMotion>({walk:0,stride:0,sniff:0,yawn:0,groom:0});
  const r=useMemo(()=>({target:new Vector3(),previous:new Vector3(),q:new Quaternion(),e:new Euler()}),[]);
  useFrame((_,delta)=>{
    if(!animate)return;
    const dt=motionDelta(delta);
    if(level!==previousLevel.current&&level!=='still'){
      elapsed.current=retimeMarten(elapsed.current,previousLevel.current,level);previousLevel.current=level;
    }
    elapsed.current+=dt;
    const moment=martenMomentAt(elapsed.current,previousLevel.current);
    if(moment.action!==previous.current){previous.current=moment.action;setAction(moment.action);}
    const nextPose=moment.action==='sleep'&&moment.progress>.62?'side-sleep':poses[moment.action];
    if(nextPose!==previousPose.current){previousPose.current=nextPose;setPose(nextPose);}
    const envelope=motionWindow(moment.progress,0,1,.2),m=motion.current;
    for(const key of ['sniff','yawn','groom'] as const)m[key]=dampMotion(m[key],moment.action===key?envelope:0,7,dt);
    if(root.current){
      const walking=moment.action==='walk',route=strollAt(walking?moment.progress:0);
      r.target.set(route.x,0,route.z);r.previous.copy(root.current.position);
      root.current.position.lerp(r.target,-Math.expm1(-10*dt));
      const distance=root.current.position.distanceTo(r.previous);
      m.stride+=distance*Math.PI*2/.14;
      m.walk=dampMotion(m.walk,walking?route.weight:0,7,dt);
      r.q.setFromEuler(r.e.set(0,walking?route.heading:0,0));
      root.current.quaternion.slerp(r.q,-Math.expm1(-7*dt));
    }
  },-1);
  return <group name={`marten-${action}`} ref={root}><MartenModel animate={animate} pose={pose} action={action} motion={motion.current}/></group>;
}
