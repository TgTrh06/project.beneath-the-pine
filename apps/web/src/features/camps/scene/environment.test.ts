import { describe, expect, it } from 'vitest';
import { parseSettings, resolveTime, resolveWeather } from './environment';

describe('Camp environment preferences',()=>{
  it('preserves old graphics preferences and supplies compatible defaults',()=>{
    expect(parseSettings({light:true,motion:false})).toEqual({light:true,motion:false,time:'auto',weather:'clear'});
  });
  it('rejects corrupt settings and inherited property names',()=>{
    expect(parseSettings({time:'constructor',weather:'toString'})).toMatchObject({time:'auto',weather:'clear'});
    expect(parseSettings(null)).toEqual(parseSettings('broken'));
    expect(parseSettings({time:'night',weather:'rain',motion:false})).toMatchObject({time:'night',weather:'rain',motion:false});
  });
  it('changes time phases at local-hour boundaries and honors a manual choice',()=>{
    for(const [hour,minute,expected] of [[4,59,'night'],[5,0,'dawn'],[7,0,'day'],[16,59,'day'],[17,0,'dusk'],[19,0,'night']] as const)
      expect(resolveTime('auto',new Date(2026,9,27,hour,minute))).toBe(expected);
    expect(resolveTime('day',new Date(2026,9,27,23))).toBe('day');
  });
  it('keeps weather stable for 20 minutes and manual weather independent of time',()=>{
    expect(resolveWeather('auto',0)).toBe(resolveWeather('auto',1_199_999));
    expect(resolveWeather('auto',1_200_000)).not.toBe(resolveWeather('auto',0));
    expect(resolveWeather('auto',7_200_000)).toBe(resolveWeather('auto',0));
    expect(resolveWeather('rain',9_999_999)).toBe('rain');
  });
});
