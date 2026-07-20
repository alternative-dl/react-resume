import classNames from 'classnames';
import Image from 'next/image';
import {FC, memo} from 'react';

import {aboutData, SectionId} from '../../data/data';
import Section from '../Layout/Section';

const About: FC = memo(() => {
  const {profileImageSrc, description, aboutItems} = aboutData;
  return (
    <Section className="border-t-[3px] border-ink bg-paper" sectionId={SectionId.About}>
      <div className={classNames('grid grid-cols-1 gap-y-6', {'md:grid-cols-4 md:gap-x-8': !!profileImageSrc})}>
        {!!profileImageSrc && (
          <div className="col-span-1 flex justify-center md:justify-start">
            <div className="relative h-32 w-32 overflow-hidden border-[4px] border-ink shadow-brutal md:h-40 md:w-40">
              <Image alt="about-me-image" className="h-full w-full object-cover" src={profileImageSrc} />
            </div>
          </div>
        )}
        <div className={classNames('col-span-1 flex flex-col gap-y-6', {'md:col-span-3': !!profileImageSrc})}>
          <div className="flex flex-col gap-y-3">
            <h2 className="w-max border-[3px] border-ink bg-signal px-3 py-1 font-display text-2xl font-bold uppercase tracking-tight text-ink shadow-brutal-sm sm:text-3xl">
              About me
            </h2>
            <p className="max-w-2xl font-mono text-sm leading-relaxed text-ink sm:text-base">{description}</p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {aboutItems.map(({label, text, Icon}, idx) => (
              <li
                className="col-span-1 flex items-center gap-x-3 border-[3px] border-ink bg-paper px-3 py-2 shadow-brutal-sm"
                key={idx}>
                {Icon && <Icon className="h-5 w-5 shrink-0 text-ink" strokeWidth={2.5} />}
                <span className="font-mono text-xs font-bold uppercase tracking-tight text-ink">{label}:</span>
                <span className="font-mono text-xs text-ink sm:text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
});

About.displayName = 'About';
export default About;
