import {DevicePhoneMobileIcon, EnvelopeIcon, MapPinIcon} from '@heroicons/react/24/outline';
import {FC, memo} from 'react';

import {contact, SectionId} from '../../../data/data';
import {ContactType, ContactValue} from '../../../data/dataDef';
import FacebookIcon from '../../Icon/FacebookIcon';
import GithubIcon from '../../Icon/GithubIcon';
import InstagramIcon from '../../Icon/InstagramIcon';
import LinkedInIcon from '../../Icon/LinkedInIcon';
import TwitterIcon from '../../Icon/TwitterIcon';
import Section from '../../Layout/Section';
import ContactForm from './ContactForm';

const ContactValueMap: Record<ContactType, ContactValue> = {
  [ContactType.Email]: {Icon: EnvelopeIcon, srLabel: 'Email'},
  [ContactType.Phone]: {Icon: DevicePhoneMobileIcon, srLabel: 'Phone'},
  [ContactType.Location]: {Icon: MapPinIcon, srLabel: 'Location'},
  [ContactType.Github]: {Icon: GithubIcon, srLabel: 'Github'},
  [ContactType.LinkedIn]: {Icon: LinkedInIcon, srLabel: 'LinkedIn'},
  [ContactType.Facebook]: {Icon: FacebookIcon, srLabel: 'Facebook'},
  [ContactType.Twitter]: {Icon: TwitterIcon, srLabel: 'Twitter'},
  [ContactType.Instagram]: {Icon: InstagramIcon, srLabel: 'Instagram'},
};

const Contact: FC = memo(() => {
  const {headerText, description, items} = contact;
  return (
    <Section className="border-t-[3px] border-ink bg-acid" sectionId={SectionId.Contact}>
      <div className="flex flex-col gap-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <EnvelopeIcon className="hidden h-14 w-14 border-[3px] border-ink bg-paper p-2 text-ink shadow-brutal-sm md:block" strokeWidth={2} />
          <h2 className="w-max border-[3px] border-ink bg-paper px-4 py-2 font-display text-2xl font-bold uppercase tracking-tight text-ink shadow-brutal sm:text-3xl">
            {headerText}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="order-2 col-span-1 md:order-1 ">
            <ContactForm />
          </div>
          <div className="order-1 col-span-1 flex flex-col gap-y-5 md:order-2">
            <p className="font-mono text-sm leading-relaxed text-ink sm:text-base">{description}</p>
            <dl className="flex flex-col gap-y-3">
              {items.map(({type, text, href}) => {
                const {Icon, srLabel} = ContactValueMap[type];
                return (
                  <div key={srLabel}>
                    <dt className="sr-only">{srLabel}</dt>
                    <dd className="flex items-center">
                      <a
                        className="flex items-center gap-x-3 border-[3px] border-ink bg-paper px-3 py-2 font-mono text-sm font-bold text-ink shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal focus:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:text-base"
                        href={href}
                        target="_blank">
                        <Icon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-ink" strokeWidth={2.5} />
                        <span>{text}</span>
                      </a>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>
    </Section>
  );
});

Contact.displayName = 'About';
export default Contact;
