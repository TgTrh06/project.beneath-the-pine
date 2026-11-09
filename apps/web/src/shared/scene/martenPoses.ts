export const martenPoses = ['sit','rest','curl','side-sleep','stretch','stand','look-back','groom'] as const;
export type MartenPose = typeof martenPoses[number];
export const martenPoseLabels:Record<MartenPose,string> = {sit:'Ngồi thư thả',rest:'Nằm nghỉ',curl:'Cuộn mình ngủ','side-sleep':'Nằm nghiêng ngủ',stretch:'Vươn vai',stand:'Đứng tò mò','look-back':'Ngoái đầu nhìn',groom:'Chải lông'};
type V = [number,number,number];
export type MartenShape = {torso:'long'|'upright'|'curled'; body:V; scale:V; rotation:V; head:V; headRotation:V; paws:V[]; tail:V[]; eyes:number};
// Four overlapping anatomical volumes, ordered chest, ribs, waist and hips.
// Coordinates are local to the pose's scaled/rotated trunk frame.
export const martenTorsoParts:Record<MartenShape['torso'],{p:V;s:V}[]>={
 long:[{p:[0,.03,.57],s:[.8,.85,.5]},{p:[0,.04,.15],s:[.81,.82,.53]},{p:[0,.06,-.3],s:[.74,.77,.5]},{p:[0,.02,-.66],s:[.81,.83,.42]}],
 upright:[{p:[0,.55,.22],s:[.76,.5,.68]},{p:[0,.1,.06],s:[.78,.5,.68]},{p:[0,-.3,-.12],s:[.71,.46,.66]},{p:[0,-.68,-.28],s:[.8,.41,.65]}],
 curled:[{p:[.36,.03,.53],s:[.62,.8,.46]},{p:[-.18,.04,.19],s:[.65,.85,.45]},{p:[-.3,.06,-.24],s:[.65,.75,.45]},{p:[.14,.04,-.57],s:[.7,.85,.44]}],
};
const tail:V[]=[[0,.19,-.32],[.03,.14,-.52],[.16,.1,-.69],[.34,.07,-.73],[.48,.055,-.66]];
const feet=(frontY:number,frontZ:number,backZ:number):V[]=>[[-.12,frontY,frontZ],[.12,frontY,frontZ],[-.13,.045,backZ],[.13,.045,backZ]];
export const martenShapes:Record<MartenPose,MartenShape>={
 stand:{torso:"long",body:[0,.27,-.06],scale:[.15,.15,.36],rotation:[0,0,0],head:[0,.46,.26],headRotation:[-.1,0,0],paws:feet(.045,.25,-.31),tail,eyes:1},
 sit:{torso:"upright",body:[0,.32,-.09],scale:[.16,.27,.23],rotation:[-.18,0,0],head:[0,.64,.15],headRotation:[.02,0,-.035],paws:feet(.045,.2,-.15),tail:[[0,.13,-.25],[.13,.08,-.4],[.32,.055,-.36],[.37,.045,-.13],[.3,.045,.09]],eyes:1},
 rest:{torso:"long",body:[0,.14,-.09],scale:[.15,.11,.36],rotation:[0,0,0],head:[0,.26,.29],headRotation:[.08,0,0],paws:feet(.035,.42,-.28),tail,eyes:.75},
 curl:{torso:"curled",body:[0,.135,-.04],scale:[.2,.12,.26],rotation:[0,.5,0],head:[.12,.16,.17],headRotation:[.24,-.6,-.18],paws:[[-.08,.035,.2],[.15,.035,.2],[-.16,.035,-.15],[.14,.035,-.19]],tail:[[0,.12,-.26],[-.22,.07,-.23],[-.32,.055,-.02],[-.23,.045,.21],[-.02,.045,.29]],eyes:0},
 'side-sleep':{torso:"long",body:[0,.145,-.07],scale:[.135,.16,.34],rotation:[0,0,1.22],head:[.015,.15,.29],headRotation:[.05,.1,1.15],paws:[[-.24,.035,.3],[-.21,.045,.12],[-.26,.035,-.2],[-.19,.04,-.34]],tail,eyes:0},
 stretch:{torso:"long",body:[0,.25,-.12],scale:[.14,.13,.42],rotation:[.28,0,0],head:[0,.18,.38],headRotation:[.18,0,0],paws:feet(.035,.59,-.4),tail:[[0,.25,-.43],[.02,.32,-.62],[.15,.4,-.76],[.3,.39,-.78],[.41,.31,-.73]],eyes:.6},
 'look-back':{torso:"long",body:[0,.27,-.06],scale:[.15,.15,.36],rotation:[0,-.12,0],head:[.035,.47,.2],headRotation:[-.05,1.15,.08],paws:feet(.045,.25,-.31),tail:[[0,.19,-.32],[-.08,.14,-.52],[-.21,.1,-.69],[-.38,.07,-.66],[-.47,.055,-.5]],eyes:1},
 groom:{torso:"upright",body:[0,.3,-.09],scale:[.16,.25,.23],rotation:[-.15,0,0],head:[0,.53,.16],headRotation:[.42,.25,.1],paws:[[-.12,.045,.2],[.11,.41,.28],[-.13,.045,-.17],[.13,.045,-.17]],tail,eyes:.65},
};
export const awakeSequence:MartenPose[]=['sit','sit','look-back','rest','sit','groom','sit'];
export const sleepingSequence:MartenPose[]=['curl','curl','side-sleep','curl'];

export const curiousSequence:MartenPose[]=['stand','look-back','stand','rest'];

export function resolveMartenPose(pose:MartenPose,sleeping:boolean,ambient:boolean,animate:boolean,seconds:number):MartenPose {
 if(!ambient||!animate)return sleeping?'curl':pose;
 const sequence=sleeping?sleepingSequence:pose==='stand'?curiousSequence:awakeSequence;
 const chosen=sequence[Math.floor(Math.max(0,seconds)/24)%sequence.length];
 return chosen==='groom'&&seconds%24>4?'sit':chosen;
}
