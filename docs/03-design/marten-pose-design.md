# Marten pose family — 2026-10-29

Marten uses a shared articulated model with eight poses: relaxed sitting, awake resting, curled sleep, side sleep, stretching, curious standing, looking back and grooming. A single pose definition controls body, head, four paws, tail curve and eye openness. The anatomy and palette remain shared between all poses.

## Model and movement

- Longer body, tapered muzzle, dark back, lighter belly, irregular cream bib, ear interiors, brow/eye highlights, whiskers, toes and small claws.
- A continuous curved tail mesh replaces overlapping tail beads. Sphere geometry and palette materials are reused inside each model instance. Tail geometry is updated in place during transitions.
- Poses blend using delta-based interpolation; breathing, blinking, ear movement and tail movement use active elapsed time. Hidden pages and reduced-motion handling use the existing scene controls.
- Camp cycles quiet awake poses at 24-second intervals. Grooming lasts about four seconds before returning to sitting. Solo cycles only curled and side sleep. Return starts with curious standing. Explicit static poses are retained when ambient playback is off.
- Shadows refresh at a capped cadence during animation. Disabling motion restores a deterministic static pose. No user data influences pose selection.

## Integration

`martenPoses.ts` contains pose data and ambient selection; `MartenModel.tsx` renders it. Camp and Solo mount the shared model close to the ground. Return requests the curious pose. `MartenIllustration` uses transparent renders from `public/marten/3d`, including the stretching illustration in the session-ending message. Existing forest posters and Return's inline companion render are refreshed.

No model download or dependency was added, and the forest GLBs do not need regeneration for this revision. Inline companions remain static images for predictable cost and motion accessibility.

## Validation

- Rendered eight poses from front/three-quarter, side and rear views; inspected the contact sheet and sleep/standing close-ups.
- Browser render checks passed for moving versus static frames, with no uncaught page errors.
- Four focused tests cover explicit pose preservation, sleeping-only Solo playback, Return's curious cycle and the short grooming action.
- Updated Camp/Solo/Return posters for four phases, including Return mobile variants, with no page errors during export. Shared Camp posters contain no members.
- Production web build passed; the existing shared Three.js chunk-size advisory remains. Physical-device GPU performance has not been measured.

Preview contact sheet: `.openai/marten-qa/poses.png`. Individual angle renders are in the same ignored QA directory. No deployment is included.


## Slim torso revision

The trunk is now shaped from chest, rib cage, waist and hip control volumes, with separate longitudinal, upright and curled profiles. A continuous lofted surface connects those volumes to avoid visible sphere seams. The waist narrows independently of the chest and hips; long poses are elongated and upright poses have a slimmer abdomen. Neck and leg anchors follow the chest/hip frames instead of the old single body centre.

Pose profiles share topology so the skin, shading and joints can blend during existing transitions. All eight illustrations and the Camp/Solo/Return fallback posters have been refreshed. Comparison: `.openai/marten-qa/slim-comparison.png`.

Six focused tests passed, covering profile topology, finite surfaces and normals, plus existing ambient pose selection. The eight poses were rendered from three angles and checked for moving/static frames with no page errors.


## Soft coat revision

The waist control volume has been widened and the chest/abdomen/hip radii brought closer together. The upright abdomen has a gentler rounded profile; the continuous torso still follows the four anatomical regions.

Short rounded locks sweep toward the hips over the torso, with smaller fringes around the cheeks and cream bib. Coat geometry shares the skin's pose profiles and vertex buffers. The short locks are rendered separately from the shadow-casting skin to avoid harsh self-shadow lines at this scale. The tail is fuller with a smoother 16-sided section and very subtle surface irregularity.

All eight inline renders and Camp/Solo/Return posters are refreshed. Before/after preview: `.openai/marten-qa/fluffy-comparison.png`. The coat is stylized geometry, not a photographic strand simulation.
