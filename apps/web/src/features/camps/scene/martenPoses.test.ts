import {describe,it,expect} from 'vitest';
import {resolveMartenPose} from './martenPoses';
describe('Marten ambient behaviour',()=>{
 it('keeps the explicit pose when motion or ambient playback is disabled',()=>{expect(resolveMartenPose('stretch',false,true,false,130)).toBe('stretch');expect(resolveMartenPose('rest',false,false,true,130)).toBe('rest');});
 it('keeps solo asleep throughout its ambient cycle',()=>{for(let t=0;t<240;t+=12)expect(['curl','side-sleep']).toContain(resolveMartenPose('sit',true,true,true,t));expect(resolveMartenPose('sit',true,true,false,85)).toBe('curl');});
 it('greets in the curious pose and returns after the sequence',()=>{expect(resolveMartenPose('stand',false,true,true,0)).toBe('stand');expect(resolveMartenPose('stand',false,true,true,24)).toBe('look-back');expect(resolveMartenPose('stand',false,true,true,96)).toBe('stand');});
 it('limits grooming to a brief action followed by quiet sitting',()=>{expect(resolveMartenPose('sit',false,true,true,121)).toBe('groom');expect(resolveMartenPose('sit',false,true,true,125)).toBe('sit');expect(resolveMartenPose('groom',false,false,true,125)).toBe('groom');});
});
