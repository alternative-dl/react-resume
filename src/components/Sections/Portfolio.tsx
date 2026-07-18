import {ArrowTopRightOnSquareIcon} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Image from 'next/image';
import {FC, memo, MouseEvent, useCallback, useEffect, useRef, useState} from 'react';

import {isMobile} from '../../config';
import {portfolioItems, SectionId} from '../../data/data';
import {PortfolioItem} from '../../data/dataDef';
import useDetectOutsideClick from '../../hooks/useDetectOutsideClick';
import Section from '../Layout/Section';

const Portfolio: FC = memo(() => {
  return (
    <Section className="border-t-[3px] border-ink bg-lime" sectionId={SectionId.Portfolio}>
      <div className="flex flex-col gap-y-10">
        <h2 className="w-max border-[3px] border-ink bg-paper px-4 py-2 font-display text-2xl font-bold uppercase tracking-tight text-ink shadow-brutal sm:text-3xl">
          Selected Work
        </h2>
        <div className="w-full columns-1 gap-6 sm:columns-2 lg:columns-3">
          {portfolioItems.map((item, index) => {
            const {title, image} = item;
            return (
              <div className="mb-6 break-inside-avoid" key={`${title}-${index}`}>
                <div className="relative h-72 w-full overflow-hidden border-[4px] border-ink shadow-brutal sm:h-80 md:h-96">
                  {index === 0 && (
                    <span className="absolute left-0 top-4 z-10 border-y-[3px] border-r-[3px] border-ink bg-flare px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-ink">
                      ★ Featured
                    </span>
                  )}
                  <Image alt={title} className="h-full w-full object-cover" placeholder="blur" src={image} />
                  <ItemOverlay item={item} />
                </div>
              </div>
            );
          })}
        </div>
        <span className="self-center font-mono text-sm font-bold uppercase tracking-widest text-ink">
          [ more to come ]
        </span>
      </div>
    </Section>
  );
});


Portfolio.displayName = 'Portfolio';
export default Portfolio;

const ItemOverlay: FC<{item: PortfolioItem}> = memo(({item: {url, title, description}}) => {
  const [mobile, setMobile] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Avoid hydration styling errors by setting mobile in useEffect
    if (isMobile) {
      setMobile(true);
    }
  }, []);
  useDetectOutsideClick(linkRef, () => setShowOverlay(false));

  const handleItemClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (mobile && !showOverlay) {
        event.preventDefault();
        setShowOverlay(!showOverlay);
      }
    },
    [mobile, showOverlay],
  );

  return (
    <a
      className={classNames(
        'absolute inset-0 h-full w-full border-t-[4px] border-ink bg-acid transition-all duration-200',
        {'opacity-0 hover:opacity-100': !mobile},
        showOverlay ? 'opacity-100' : 'opacity-0',
      )}
      href={url}
      onClick={handleItemClick}
      ref={linkRef}
      target="_blank">
      <div className="relative h-full w-full px-5 pb-5 pt-16">
        <div className="flex h-full w-full flex-col gap-y-3 overflow-y-auto overscroll-contain">
          <h2 className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-ink">{title}</h2>
          <p className="font-mono text-xs leading-relaxed text-ink sm:text-sm">{description}</p>
        </div>
        <ArrowTopRightOnSquareIcon
          className="absolute bottom-2 right-2 h-5 w-5 shrink-0 text-ink"
          strokeWidth={2.5}
        />
      </div>
    </a>
  );
});
