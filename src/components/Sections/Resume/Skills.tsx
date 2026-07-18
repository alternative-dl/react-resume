import {FC, memo, PropsWithChildren, useMemo} from 'react';

import {Skill as SkillType, SkillGroup as SkillGroupType} from '../../../data/dataDef';

export const SkillGroup: FC<PropsWithChildren<{skillGroup: SkillGroupType}>> = memo(({skillGroup}) => {
  const {name, skills} = skillGroup;
  return (
    <div className="flex flex-col border-[3px] border-ink bg-paper p-4 shadow-brutal-sm">
      <span className="mb-3 w-max border-2 border-ink bg-lime px-2 py-0.5 font-mono text-sm font-bold uppercase tracking-tight text-ink">
        {name}
      </span>
      <div className="flex flex-col gap-y-3">
        {skills.map((skill, index) => (
          <Skill key={`${skill.name}-${index}`} skill={skill} />
        ))}
      </div>
    </div>
  );
});

SkillGroup.displayName = 'SkillGroup';

export const Skill: FC<{skill: SkillType}> = memo(({skill}) => {
  const {name, level, max = 10} = skill;
  const percentage = useMemo(() => Math.round((level / max) * 100), [level, max]);

  return (
    <div className="flex flex-col gap-y-1">
      <span className="font-mono text-xs font-bold text-ink">{name}</span>
      <div className="h-5 w-full border-2 border-ink bg-white">
        <div className="h-full bg-flare" style={{width: `${percentage}%`}} />
      </div>
    </div>
  );
});

Skill.displayName = 'Skill';
