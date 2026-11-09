import type { ForestThreshold } from '@pyneath/contracts';
import LodgeCanvas, { type LodgeCanvasProps } from '../../../shared/scene/LodgeCanvas';
import { ForestGrowth } from '../../memory/scene-api';

export default function CampCanvas({ growth, ...props }: Omit<LodgeCanvasProps, 'growth'> & { growth?: readonly ForestThreshold[] }) {
  return <LodgeCanvas {...props} growth={<ForestGrowth earned={growth ?? []} namespace="camp" origin={[3.4,.12,1.5]} />} />;
}
