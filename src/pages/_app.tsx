import '../globalStyles.scss';

import type {AppProps} from 'next/app';
import {Space_Grotesk, Space_Mono} from 'next/font/google';
import {memo} from 'react';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const monoFont = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
});

const MyApp = memo(({Component, pageProps}: AppProps): JSX.Element => {
  return (
    <div className={`${displayFont.variable} ${monoFont.variable}`}>
      <Component {...pageProps} />
    </div>
  );
});

export default MyApp;
