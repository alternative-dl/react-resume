import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  FlagIcon,
  MapIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

import GithubIcon from '../components/Icon/GithubIcon';
import InstagramIcon from '../components/Icon/InstagramIcon';
import LinkedInIcon from '../components/Icon/LinkedInIcon';

import heroImage from '../images/header-background.webp';
import portfolioImage1 from '../images/portfolio/portfolio-1.jpg';
import portfolioImage2 from '../images/portfolio/portfolio-2.jpg';

import profilePic from '../images/profilepic.jpg';
import testimonialImage from '../images/testimonial.webp';


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
  title: 'DIdrik Liu | Portfolio',
  description: "",
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
      <p className="prose-sm text-stone-200 sm:prose-base lg:prose-lg">
        I'm a Stockholm based <strong className="text-stone-100">Data Analyst</strong>, currently studying at <strong className="text-stone-100">Royal Institute of Technology</strong> and working at Qviqe as Founder and Technical Sales Consultant.
      </p>
      <p className="prose-sm text-stone-200 sm:prose-base lg:prose-lg">
        In my free time, you can catch me playing <strong className="text-stone-100">piano & guitar</strong>, or <strong className="text-stone-100">golfing</strong> with friends. On race weekends you will catch me watching <strong className="text-stone-100">Formula One</strong>.
      </p>
    </>
  ),
  actions: [
    {
      href: '/assets/resume.pdf',
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
export const aboutData: About = {
  profileImageSrc: profilePic,
  description: '',
  aboutItems: [
    {label: 'Location', text: 'Stockholm, Sweden', Icon: MapIcon},
    {label: 'Age', text: '24', Icon: CalendarIcon},
    {label: 'Nationality', text: 'Chinese & Swedish', Icon: FlagIcon},
    {label: 'Interests', text: 'F1, music, golf', Icon: SparklesIcon},
    {label: 'Study', text: 'Royal Institute of Technology', Icon: AcademicCapIcon},
    {label: 'Employment', text: 'Open to Work', Icon: BuildingOffice2Icon},
  ],
};

/**
 * Skills section
 */
export const skills: SkillGroup[] = [
  {
    name: 'Spoken languages',
    skills: [
      {
        name: 'English',
        level: 10,
      },
      {
        name: 'Swedish',
        level: 10,
      },
      {
        name: 'Mandarin',
        level: 5,
      },
    ],
  },
  {
    name: 'Frontend development',
    skills: [
      {
        name: 'plotly',
        level: 8,
      },
      {
        name: 'React & Typescript',
        level: 5,
      },
      {
        name: 'GraphQL',
        level: 6,
      },
    ],
  },
  {
    name: 'Backend development',
    skills: [
      {
        name: 'Google Cloud Platform',
        level: 6,
      },
      {
        name: 'python & pandas',
        level: 9,
      },
      {
        name: 'SQL',
        level: 7,
      }
    ],
  },
];

/**
 * Portfolio section
 */
export const portfolioItems: PortfolioItem[] = [
  {
    title: 'Project title 1',
    description: 'Give a short description of your project here.',
    url: 'https://yourprojectlink.com',
    image: portfolioImage1,
  },
  {
    title: 'Project title 2',
    description: 'Give a short description of your project here.',
    url: 'https://yourprojectlink.com',
    image: portfolioImage2,
  },
  // Add more projects as needed
];

/**
 * Resume section
 */
export const education: TimelineItem[] = [
  {
    date: 'Aug 2021 - Jun 2026',
    location: 'Royal Institute of Technology',
    title: 'M.Sc. Computer Science',
    content: <p>Master's degree in Computer Science with focus on data analytics and software development</p>,
  },
  {
    date: 'Aug 2024 - Jun 2026',
    location: 'Royal Institute of Technology',
    title: 'Master of Industrial Management',
    content: <p>Master's degree in Industrial Management in parallell with CS programme</p>,
  },
];

export const experience: TimelineItem[] = [
  {
    date: 'Jun 2023 - Aug 2023',
    location: 'Pricer AB',
    title: 'Internship in Data Analytics',
    content: (
      <p>
        Create internal dashboards in Qlik Sense. Analyze label energy usage and create LSTM models and alternative approaches on Google Cloud Platform. 
      </p>
    ),
  },
  {
    date: 'Aug 2021 - Jun 2024',
    location: 'KTH Formula Student',
    title: 'Head of Business Relations',
    content: (
      <p>
        Responsible for sponsor contact and planning of Business Plan Presentation (part of competition) at the student project. Drafting majorities of contracts between the project and project sponsors. Also responsible for maintenance of Wordpress website. . 
      </p>
    ),
  },
  {
    date: 'Jun 2022 - Aug 2022',
    location: 'Polarium Energy Solutions AB',
    title: 'Internship at Sourcing Division',
    content: (
      <p>
        Day to day sourcing administration in Microsoft BC, started my own project designed an analysis tool in Python integrated with Microsoft Excel to visualize data in 3D. Reference available per request.  
      </p>
    ),
  },
  {
    date: 'Jun 2018 - Aug 2018',
    location: 'Wibax AB',
    title: 'Internship at Sourcing Division',
    content: (
      <p>
        Internship at Wibax AB, primarily practiced on sourcing and import declaration on chemicals purchased by the company. Reference available per request.
      </p>
    ),
  },
  {
    date: 'Jun 2016 - Aug 2016',
    location: 'Simei Media Co. Ltd, Shanghai, China ',
    title: 'Internship at Marketing Division',
    content: (
      <p>
        Internship at the Shanghai marketing division and focused on one PR  project with an automobile maker in China. Responsible for English translation on marketing brochures and practiced on marketing strategies.  
      </p>
    ),
  },
  {
    date: '2014 - 2017',
    location: 'Lidingö Basket',
    title: 'Head Coach',
    content: (
      <p>
      
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
  description: 'Here is a good spot for a message to your readers to let them know how best to reach out to you.',
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
