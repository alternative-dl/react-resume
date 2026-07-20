import {FC, memo, PropsWithChildren} from 'react';

const ResumeSection: FC<PropsWithChildren<{title: string}>> = memo(({title, children}) => {
  return (
    <div className="grid grid-cols-1 gap-y-6 py-10 first:pt-0 last:pb-0 md:grid-cols-4 md:gap-x-8">
      <div className="col-span-1 flex justify-center md:justify-start">
        <div className="h-max">
          <h2 className="w-max border-[3px] border-ink bg-flare px-3 py-1 font-display text-xl font-bold uppercase tracking-tight text-ink shadow-brutal-sm">
            {title}
          </h2>
        </div>
      </div>
      <div className="col-span-1 flex flex-col md:col-span-3">{children}</div>
    </div>
  );
});

ResumeSection.displayName = 'ResumeSection';
export default ResumeSection;
