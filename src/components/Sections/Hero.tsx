import {ChevronDownIcon} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Image from 'next/image';
import {FC, memo} from 'react';

import {heroData, SectionId} from '../../data/data';
import Section from '../Layout/Section';
import Socials from '../Socials';

const Hero: FC = memo(() => {
  const {imageSrc, name, description, actions} = heroData;

  return (
    <Section noPadding sectionId={SectionId.Hero}>
      <div className="relative flex h-screen w-full items-center justify-center">
        <Image
          alt={`${name}-image`}
          className="absolute z-0 h-full w-full object-cover"
          placeholder="blur"
          priority
          src={imageSrc}
        />
        <div className="z-10 w-full max-w-screen-lg px-4 lg:px-0">
          <div className="flex flex-col items-start gap-y-6 border-[4px] border-ink bg-paper p-6 shadow-brutal-lg sm:p-8">
            <span className="inline-block border-[3px] border-ink bg-acid px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-ink sm:text-sm">
              Data Analyst // AI Engineer
            </span>
            <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tighter text-ink sm:text-6xl lg:text-7xl">
              {name}
            </h1>
            <div className="flex flex-col gap-y-3 text-left">{description}</div>
            <div className="flex gap-x-3 text-ink">
              <Socials />
            </div>
            <div className="flex w-full flex-wrap gap-4">
              {actions.map(({href, text, primary, Icon}) => (
                <a
                  className={classNames(
                    'flex items-center gap-x-2 border-[3px] border-ink px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-tight text-ink shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal focus:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:text-base',
                    primary ? 'bg-acid' : 'bg-paper',
                  )}
                  href={href}
                  key={text}>
                  {text}
                  {Icon && <Icon className="h-5 w-5 text-ink sm:h-6 sm:w-6" />}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <a
            className="border-[3px] border-ink bg-acid p-1.5 shadow-brutal-sm hover:bg-flare focus:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:p-2"
            href={`/#${SectionId.About}`}>
            <ChevronDownIcon className="h-5 w-5 bg-transparent text-ink sm:h-6 sm:w-6" />
          </a>
        </div>
      </div>
    </Section>
  );
});

Hero.displayName = 'Hero';
export default Hero;
