import classNames from 'classnames';
import {FC, memo, UIEventHandler, useCallback, useEffect, useRef, useState} from 'react';

import {SectionId, testimonial} from '../../data/data';
import type {Testimonial as TestimonialType} from '../../data/dataDef';
import useInterval from '../../hooks/useInterval';
import useWindow from '../../hooks/useWindow';
import QuoteIcon from '../Icon/QuoteIcon';
import Section from '../Layout/Section';

const TICKER_TEXT = 'Testimonials // References // Kind words // ';

const Testimonials: FC = memo(() => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [scrollValue, setScrollValue] = useState(0);

  const itemWidth = useRef(0);
  const scrollContainer = useRef<HTMLDivElement>(null);

  const {width} = useWindow();

  const {testimonials} = testimonial;

  useEffect(() => {
    itemWidth.current = scrollContainer.current ? scrollContainer.current.offsetWidth : 0;
  }, [width]);

  useEffect(() => {
    if (scrollContainer.current) {
      const newIndex = Math.round(scrollContainer.current.scrollLeft / itemWidth.current);
      setActiveIndex(newIndex);
    }
  }, [itemWidth, scrollValue]);

  const setTestimonial = useCallback(
    (index: number) => () => {
      if (scrollContainer !== null && scrollContainer.current !== null) {
        scrollContainer.current.scrollLeft = itemWidth.current * index;
      }
    },
    [],
  );
  const next = useCallback(() => {
    if (activeIndex + 1 === testimonials.length) {
      setTestimonial(0)();
    } else {
      setTestimonial(activeIndex + 1)();
    }
  }, [activeIndex, setTestimonial, testimonials.length]);

  const handleScroll = useCallback<UIEventHandler<HTMLDivElement>>(event => {
    setScrollValue(event.currentTarget.scrollLeft);
  }, []);

  useInterval(next, testimonials.length > 1 ? 10000 : null);

  // If no testimonials, don't render the section
  if (!testimonials.length) {
    return null;
  }

  return (
    <Section noPadding sectionId={SectionId.Testimonials}>
      <div
        className="flex w-full flex-col items-center bg-paper"
        style={{
          backgroundImage:
            'linear-gradient(rgba(10,10,10,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.07) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}>
        <Ticker />
        <div className="flex w-full items-center justify-center px-4 py-16 md:py-24 lg:px-8">
          <div className="z-10 w-full max-w-screen-md px-4 lg:px-0">
            <div className="flex flex-col items-center gap-y-6 border-[4px] border-ink bg-paper p-6 shadow-brutal-lg">
              <div
                className="no-scrollbar flex w-full touch-pan-x snap-x snap-mandatory gap-x-6 overflow-x-auto scroll-smooth"
                onScroll={handleScroll}
                ref={scrollContainer}>
                {testimonials.map((testimonial, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <Testimonial isActive={isActive} key={`${testimonial.name}-${index}`} testimonial={testimonial} />
                  );
                })}
              </div>
              {testimonials.length > 1 && (
                <div className="flex gap-x-4">
                  {[...Array(testimonials.length)].map((_, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <button
                        className={classNames(
                          'h-4 w-4 border-2 border-ink transition-all duration-300',
                          isActive ? 'bg-signal' : 'bg-paper',
                        )}
                        disabled={isActive}
                        key={`select-button-${index}`}
                        onClick={setTestimonial(index)}></button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <Ticker reverse />
      </div>
    </Section>
  );
});

const Testimonial: FC<{testimonial: TestimonialType; isActive: boolean}> = memo(
  ({testimonial: {text, name, image}, isActive}) => (
    <div
      className={classNames(
        'flex w-full shrink-0 snap-start snap-always flex-col items-start gap-y-4 p-2 transition-opacity duration-1000 sm:flex-row sm:gap-x-6',
        isActive ? 'opacity-100' : 'opacity-0',
      )}>
      {image ? (
        <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
          <QuoteIcon className="absolute -left-2 -top-2 z-10 h-5 w-5 stroke-ink text-signal" />
          <img className="h-full w-full border-[3px] border-ink object-cover" src={image} />
        </div>
      ) : (
        <QuoteIcon className="h-5 w-5 shrink-0 text-ink sm:h-8 sm:w-8" />
      )}
      <div className="flex flex-col gap-y-4">
        <p className="font-mono text-sm font-medium leading-relaxed text-ink sm:text-base">{text}</p>
        <p className="font-mono text-xs font-bold uppercase tracking-tight text-ink sm:text-sm">— {name}</p>
      </div>
    </div>
  ),
);

const Ticker: FC<{reverse?: boolean}> = memo(({reverse = false}) => {
  const content = TICKER_TEXT.repeat(6);
  return (
    <div className="w-full overflow-hidden border-y-[3px] border-ink bg-ink py-2">
      <div
        className="flex w-max animate-marquee whitespace-nowrap font-mono text-sm font-bold uppercase tracking-widest text-paper"
        style={reverse ? {animationDirection: 'reverse'} : undefined}>
        <span className="pr-8">{content}</span>
        <span aria-hidden="true" className="pr-8">
          {content}
        </span>
      </div>
    </div>
  );
});

Ticker.displayName = 'Ticker';

export default Testimonials;
