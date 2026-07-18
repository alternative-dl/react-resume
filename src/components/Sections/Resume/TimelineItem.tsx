import {FC, memo} from 'react';

import type {TimelineItem as TimelineItemType} from '../../../data/dataDef';

const TimelineItem: FC<{item: TimelineItemType}> = memo(({item}) => {
  const {title, date, location, content} = item;
  return (
    <div className="mb-6 flex flex-col border-[3px] border-ink bg-paper p-5 text-left shadow-brutal-sm last:mb-0">
      <div className="flex flex-col gap-y-2 pb-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink sm:text-xl">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="border-2 border-ink bg-acid px-2 py-0.5 font-mono text-xs font-bold uppercase text-ink">
            {location}
          </span>
          <span className="border-2 border-ink bg-sky px-2 py-0.5 font-mono text-xs font-bold text-ink">{date}</span>
        </div>
      </div>
      <div className="font-mono text-sm leading-relaxed text-ink">{content}</div>
    </div>
  );
});

TimelineItem.displayName = 'TimelineItem';
export default TimelineItem;
