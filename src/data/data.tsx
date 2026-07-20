import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  MapIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

import GithubIcon from '../components/Icon/GithubIcon';
import InstagramIcon from '../components/Icon/InstagramIcon';
import LinkedInIcon from '../components/Icon/LinkedInIcon';
import heroImage from '../images/header-background.webp';
import portfolioformulastudent from '../images/portfolio/portfolioformulastudent.png';
import portfoliokex from '../images/portfolio/portfoliokex.png'
import profilePic from '../images/profilepic.jpg';
import testimonialImage from '../images/testimonial.webp';
import {generatedProjects} from './generatedProjects';
import {
  About,
  ContactSection,
  ContactType,
  Hero,
  HomepageMeta,
  PortfolioItem,
  SkillGroup,
  Social,
  TestimonialSection,
  TimelineItem,
} from './dataDef';

/**
 * Page meta data
 */
export const homePageMeta: HomepageMeta = {
  title: 'Didrik Liu | Portfolio',
  description: 'Portfolio of Didrik Liu — Data Analyst & AI Engineer based in Stockholm and Granada.',
};

/**
 * Section definition
 */
export const SectionId = {
  Hero: 'hero',
  About: 'about',
  Contact: 'contact',
  Portfolio: 'portfolio',
  Resume: 'resume',
  Skills: 'skills',
  Stats: 'stats',
  Testimonials: 'testimonials',
} as const;

export type SectionId = (typeof SectionId)[keyof typeof SectionId];

/**
 * Hero section
 */
export const heroData: Hero = {
  imageSrc: heroImage,
  name: `I'm Didrik Liu.`,
  description: (
    <>
      <p className="font-mono text-sm leading-relaxed text-ink sm:text-base">
        I'm a <strong className="bg-acid px-1 font-bold text-ink">Data Analyst</strong> and{' '}
        <strong className="bg-acid px-1 font-bold text-ink">AI Engineer</strong> based between{' '}
        <strong className="bg-sky px-1 font-bold text-ink">Stockholm</strong> and{' '}
        <strong className="bg-sky px-1 font-bold text-ink">Granada</strong>, finishing a combined bachelor's &
        master's at the <strong className="font-bold text-ink underline decoration-flare decoration-[3px] underline-offset-2">Royal Institute of Technology (KTH)</strong>. I co-founded{' '}
        <strong className="bg-flare px-1 font-bold text-ink">CommodIQ</strong> (CTO) and{' '}
        <strong className="bg-flare px-1 font-bold text-ink">ARIFY</strong>, and work as a Data Scientist & AI Engineer
        at <strong className="bg-lime px-1 font-bold text-ink">Pricer</strong>.
      </p>
      <p className="font-mono text-sm leading-relaxed text-ink sm:text-base">
        Off the clock: <strong className="font-bold text-ink underline decoration-ink decoration-[3px] underline-offset-2">piano &amp; guitar</strong>,{' '}
        <strong className="font-bold text-ink underline decoration-ink decoration-[3px] underline-offset-2">golf</strong>, and{' '}
        <strong className="font-bold text-ink underline decoration-ink decoration-[3px] underline-offset-2">Formula One</strong> on race weekends.
      </p>
    </>
  ),
  actions: [
    {
      href: '/assets/Didrik Liu\'s CV.pdf',
      text: 'Resume',
      primary: true,
      Icon: ArrowDownTrayIcon,
    },
    {
      href: `#${SectionId.Contact}`,
      text: 'Contact',
      primary: false,
    },
  ],
};

/**
 * About section
 */

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birthDayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  let age = today.getFullYear() - birthDate.getFullYear();

  if (today < birthDayThisYear) {
    age -= 1;
  }

  return age;
};

const birthDate = new Date(2000, 6, 9)

export const aboutData: About = {
  profileImageSrc: profilePic,
  description: `Granada-based Data Analyst and AI Engineer finishing a combined bachelor's & master's in Computer Science and Industrial Management at KTH, and co-founder of CommodIQ and ARIFY. I move fast in the early stages of projects — rapid prototyping, quick design pivots, and a strong track record of leading through communication and investor relations.`,
  aboutItems: [
    {label: 'Location', text: 'Stockholm, Sweden & Granada, Spain', Icon: MapIcon},
    {label: 'Age', text: calculateAge(birthDate).toString(), Icon: CalendarIcon},
    {label: 'Interests', text: 'F1, music, golf', Icon: SparklesIcon},
    {label: 'Study', text: 'Royal Institute of Technology (KTH)', Icon: AcademicCapIcon},
  ],
};

/**
 * Skills section
 */
export const skills: SkillGroup[] = [
  {
    name: 'Spoken Languages',
    skills: [
      {
        name: 'Swedish',
        level: 10,
      },
      {
        name: 'English',
        level: 10,
      },
      {
        name: 'Mandarin',
        level: 6,
      },
      {
        name: 'Spanish (learning)',
        level: 3,
      },
    ],
  },
  {
    name: 'AI & Machine Learning',
    skills: [
      {
        name: 'Claude Code (native)',
        level: 9,
      },
      {
        name: 'Promptfoo evals & self-improvement loops',
        level: 8,
      },
      {
        name: 'LSTM & time-series forecasting',
        level: 8,
      },
      {
        name: 'Local model deployment',
        level: 7,
      },
    ],
  },
  {
    name: 'Data & Backend',
    skills: [
      {
        name: 'Python & pandas',
        level: 9,
      },
      {
        name: 'SQL',
        level: 8,
      },
      {
        name: 'Google Cloud Platform',
        level: 8,
      },
      {
        name: 'Supabase',
        level: 7,
      },
    ],
  },
  {
    name: 'Platforms & Tools',
    skills: [
      {
        name: 'Qlik Sense',
        level: 9,
      },
      {
        name: 'ERP (Jeeves, Monitor, D365, Odoo)',
        level: 8,
      },
      {
        name: 'Docker & CI/CD',
        level: 7,
      },
      {
        name: 'React & TypeScript',
        level: 6,
      },
    ],
  },
];

/**
 * Portfolio section
 */
export const portfolioItems: PortfolioItem[] = [
  {
    title: 'Master Thesis (KTH)',
    description:
      'High-Frequency Retail Pricing Data as an Inflation Indicator: Comovement and Forecasting in the Eurozone',
    url: '/assets/High-Frequency Retail Pricing Data as an Inflation Indicator.pdf',
    image: heroImage,
  },
  {
    title: 'KTH Formula Student',
    description: 'Sponsor account manager for project with over 80 students',
    url: 'https://kthformulastudent.se/partners/',
    image: portfolioformulastudent,
  },
  {
    title: 'Bachelor Thesis with A. Moch',
    description: 'Optimizing Object Detection in Autonomous Vehicles Using Grayscale Computer Vision Models',
    url: '/assets/Optimizing Object Detection in Autonomous Vehicles Using Grayscale Computer Vision Models.pdf',
    image: portfoliokex,
  },
  // Machine-generated demos (one per month, deployed to Cloud Run) are appended here.
  ...generatedProjects,
];

/**
 * Resume section
 */
export const education: TimelineItem[] = [
  {
    date: 'Aug 2021 - Jun 2026',
    location: 'Royal Institute of Technology (KTH)',
    title: "Bachelor's + Master's, Computer Science & Industrial Management",
    content: (
      <p>
        Combined bachelor's and master's degree in Computer Science with a specialization in Industrial Management. GPA
        ~4.0. Master's thesis on high-frequency retail pricing data as an inflation indicator for the Eurozone.
      </p>
    ),
  },
];

export const experience: TimelineItem[] = [
  {
    date: 'May 2026 - Present',
    location: 'CommodIQ AB',
    title: 'Co-Founder & CTO',
    content: (
      <p>
        Co-founded CommodIQ as the sole technical lead. Built CI/CD pipelines and platform infrastructure on GCP and
        Supabase, and designed a self-improvement loop for the AI system — including a golden dataset and Promptfoo-based
        systems testing. Consult on structured platforming with least-privilege access and secure-by-design principles
        to prepare for ISO audits.
      </p>
    ),
  },
  {
    date: '2023 - Present',
    location: 'Pricer AB',
    title: 'Data Scientist & AI Engineer',
    content: (
      <p>
        Develop AI solutions for the Operations team to modernize workflows and platforms, building middleware and
        integrations from scratch and deploying new AI-based tooling into production. Build internal dashboards in Qlik
        Sense and maintain connectors across multiple platforms. Analyze electronic shelf label energy usage with LSTM
        and alternative models on GCP, and support migration from a legacy ERP to a new ERP system.
      </p>
    ),
  },
  {
    date: '2025 - 2026',
    location: 'ARIFY AB',
    title: 'Co-Founder',
    content: (
      <p>
        Co-founded ARIFY with peers, leading product direction and client relations. Built CI/CD pipelines and platform
        infrastructure on Google Cloud Platform, and consulted on structured platforming using least-privilege access
        and secure-by-design principles to prepare for ISO audits.
      </p>
    ),
  },
  {
    date: 'Aug 2021 - 2024',
    location: 'KTH Formula Student',
    title: 'Head of Business Relations',
    content: (
      <p>
        Led sponsor outreach and planned the Business Plan Presentation, a scored part of the competition. Drafted the
        majority of contracts between the project and its sponsors, and maintained the project's WordPress website.
      </p>
    ),
  },
  {
    date: 'Jun 2022 - Jun 2023',
    location: 'Polarium Energy Solutions AB',
    title: 'Sourcing Intern',
    content: (
      <p>
        Handled day-to-day sourcing administration in Microsoft Dynamics 365 Business Central, and designed an analysis
        tool in Python integrated with Microsoft Excel to visualize data in 3D. Reference available on request.
      </p>
    ),
  },
  {
    date: 'Jun 2018 - Aug 2018',
    location: 'Wibax AB, Stockholm, Sweden',
    title: 'Sourcing Intern',
    content: (
      <p>
        Supported sourcing and import declaration for chemicals purchased by the company. Reference available on
        request.
      </p>
    ),
  },
];

/**
 * Testimonial section
 */
export const testimonial: TestimonialSection = {
  imageSrc: testimonialImage,
  testimonials: [
    {
      name: 'Serge de Gosson de Varennes',
      text: 'One of the most impressive aspects of Didrik\'s internship was his adeptness at problem-solving, his constant search for way of solving problems with new ideas combining different methods and data.',
      image: 'https://img-0.journaldunet.com/xLlkzXC63gDdcushr3kQuWU5JL0=/200x/smart/be409eb37b16499c833dc387f7d15c1f/user-jdn/39490182-serge-de-gosson-de-varennes.jpg',
    },
  ],
};

/**
 * Contact section
 */
export const contact: ContactSection = {
  headerText: 'Get in touch.',
  description: 'Don\'t hestitate to contact me on LinkedIn or Email!',
  items: [
    {
      type: ContactType.Email,
      text: 'didrik.liu@gmail.com',
      href: 'mailto:didrik.liu@gmail.com',
    },
    {
      type: ContactType.Location,
      text: 'Stockholm, Sweden',
      href: 'https://www.google.com/maps',
    },
    {
      type: ContactType.Github,
      text: 'alternative-dl',
      href: 'https://github.com/alternative-dl',
    },
  ],
};

/**
 * Social items
 */
export const socialLinks: Social[] = [
  {label: 'Github', Icon: GithubIcon, href: 'https://github.com/alternative-dl'},
  {label: 'LinkedIn', Icon: LinkedInIcon, href: 'https://www.linkedin.com/in/didrik-liu-69575518b/'},
  {label: 'Instagram', Icon: InstagramIcon, href: 'https://www.instagram.com/didrik.liu/'},
];
