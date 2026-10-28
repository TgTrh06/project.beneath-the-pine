import type { MartenPose } from '../../../features/camps/scene/martenPoses';
import './marten.css';
type IllustrationPose = MartenPose | 'peek' | 'loaf' | 'look-right' | 'perch' | 'nap';
const aliases:Partial<Record<IllustrationPose,MartenPose>>={peek:'stand',loaf:'rest','look-right':'look-back',perch:'sit',nap:'side-sleep'};
/** Static renders of the shared 3D model keep inline companions inexpensive. */
export function MartenIllustration({className,pose='stand'}:{className?:string;pose?:IllustrationPose;trackPointer?:boolean}){
 const resolved=aliases[pose]??pose;
 return <span className={`marten-illustration ${className??''}`} aria-hidden="true"><img className="marten-illustration__sprite" src={`/marten/3d/${resolved}.webp`} alt="" draggable={false}/></span>;
}
