import { describe, expect, it } from 'vitest';
import { forestEventAt, martenMomentAt, parseSessionLife, windAt } from './forestActivity';

describe('session forest activity', () => {
  it('respects old motion-off preferences and rejects corrupt local settings', () => {
    expect(parseSessionLife(null,false)).toEqual({level:'still',drift:false});
    expect(parseSessionLife({level:'constructor',drift:'true'})).toEqual({level:'lively',drift:false});
    expect(parseSessionLife({level:'gentle',drift:true},false)).toEqual({level:'gentle',drift:true});
  });
  it('spaces visitors with quiet gaps and bounds progress over a long session', () => {
    const seen=new Set<string>();let quiet=0,lively=0,gentle=0;
    for(let t=0;t<3600;t++) {
      const e=forestEventAt(t,'lively','day','clear');
      if(e){seen.add(e.kind);lively++;expect(e.progress).toBeGreaterThanOrEqual(0);expect(e.progress).toBeLessThan(1);}else quiet++;
      if(forestEventAt(t,'gentle','day','clear'))gentle++;
      expect(forestEventAt(t,'still','day','clear')).toBeNull();
    }
    expect([...seen].sort()).toEqual(['bird','butterfly','cone','flock','needles']);expect(quiet).toBeGreaterThan(lively);expect(gentle).toBeLessThan(lively);
  });
  it('keeps wildlife appropriate to rain and night without replaying skipped events', () => {
    for(let t=0;t<700;t++) {
      const wet=forestEventAt(t,'lively','day','rain');if(wet)expect(['cone','needles']).toContain(wet.kind);
      const dark=forestEventAt(t,'lively','night','clear');if(dark)expect(['bird','flock']).not.toContain(dark.kind);
    }
    expect(forestEventAt(3600,'lively','day','clear')).toEqual(forestEventAt(3600,'lively','day','clear'));
  });
  it('keeps the companion resting most of the time, with bounded excursions and varied actions', () => {
    const actions=new Set<string>();let rest=0;
    for(let t=0;t<3600;t++){const m=martenMomentAt(t,'lively');actions.add(m.action);if(m.action==='sleep'||m.action==='rest')rest++;expect(m.progress).toBeGreaterThanOrEqual(0);expect(m.progress).toBeLessThan(1);}
    expect(actions.size).toBe(9);expect(rest).toBeGreaterThan(1800);expect(martenMomentAt(999,'still').action).toBe('sleep');
    for(let t=0;t<600;t++)expect(windAt(t,'rain')).toBeGreaterThanOrEqual(windAt(t,'clear'));
  });
});
