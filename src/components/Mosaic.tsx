import {FC, memo} from 'react';

/**
 * Pixelated "mosaic" censor for a name that isn't public yet (e.g. a
 * pre-launch company). Renders a fixed-width pixel-grid block in place of the
 * text, sized in `ch`/`em` so it adapts to whatever context it sits in. The
 * real name is never placed in the DOM — only a generic aria-label.
 */
const Mosaic: FC<{chars?: number; label?: string}> = memo(({chars = 8, label = 'Undisclosed — pre-launch'}) => (
  <span
    aria-label={label}
    className="mx-0.5 inline-block h-[1.05em] translate-y-[0.18em] border-2 border-ink align-baseline"
    role="img"
    style={{
      width: `${chars}ch`,
      backgroundColor: '#0a0a0a',
      backgroundImage:
        'linear-gradient(45deg,#616161 25%,transparent 25%,transparent 75%,#616161 75%),linear-gradient(45deg,#616161 25%,transparent 25%,transparent 75%,#616161 75%)',
      backgroundSize: '6px 6px',
      backgroundPosition: '0 0,3px 3px',
    }}
    title="Pre-launch — coming soon"
  />
));

Mosaic.displayName = 'Mosaic';
export default Mosaic;
