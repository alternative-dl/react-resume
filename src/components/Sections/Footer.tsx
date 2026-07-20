import {ChevronUpIcon} from '@heroicons/react/24/solid';
import {FC, memo} from 'react';

import {SectionId} from '../../data/data';
import Socials from '../Socials';

const currentYear = new Date().getFullYear();

const Footer: FC = memo(() => (
  <div className="relative border-t-[3px] border-ink bg-ink px-4 pb-8 pt-14 sm:px-8 sm:pt-16">
    <div className="absolute inset-x-0 -top-5 flex justify-center sm:-top-6">
      <a
        className="border-[3px] border-ink bg-signal p-1.5 shadow-brutal-sm hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-signal sm:p-2"
        href={`/#${SectionId.Hero}`}>
        <ChevronUpIcon className="h-6 w-6 bg-transparent text-ink sm:h-8 sm:w-8" />
      </a>
    </div>
    <div className="flex flex-col items-center gap-y-6">
      <div className="flex gap-x-3 text-signal">
        <Socials />
      </div>
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-paper">
        © {currentYear} Didrik Liu
      </span>
    </div>
  </div>
));

Footer.displayName = 'Footer';
export default Footer;
