import { useRoute, useLocation } from 'wouter';
import {
  Box, Typography, Paper, Button, Chip, Divider, Stack,
  List, ListItem, ListItemIcon, ListItemText, Alert, Card, CardContent,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, ExpandMore, Timer, MenuBook,
  School, PlayCircle, Download, Quiz, TrendingUp,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';

interface ContentSection {
  title: string;
  body: string;
  keyPoints?: string[];
}

interface TrainingModule {
  title: string;
  type: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  overview: string;
  learningObjectives: string[];
  sections: ContentSection[];
  practicalExercises?: string[];
  additionalResources?: string[];
}

const trainingContent: Record<string, TrainingModule> = {
  'best-practices-guides': {
    title: 'Best Practices Guides',
    type: 'Documentation',
    duration: '45 min read',
    difficulty: 'Beginner',
    overview: 'This guide covers established best practices in waste management and sustainability, from source separation and material recovery to regulatory compliance and continuous improvement.',
    learningObjectives: [
      'Understand the waste management hierarchy: prevent, reduce, reuse, recycle, recover, dispose',
      'Implement effective source separation programs at your facility',
      'Establish proper documentation and tracking systems for waste streams',
      'Meet regulatory compliance requirements for local and federal waste management laws',
      'Develop a continuous improvement framework for waste reduction targets',
    ],
    sections: [
      {
        title: 'The Waste Management Hierarchy',
        body: 'The waste management hierarchy ranks waste management options by environmental preference. Prevention sits at the top as the most favorable option, followed by minimization, reuse, recycling, energy recovery, and disposal. Organizations should apply this hierarchy when making decisions about waste streams.\n\nStart by auditing your current waste streams to identify where in the hierarchy each stream falls. The goal is to push each stream upward over time - converting disposal streams to recycling, recycling to reuse, and ultimately reducing waste generation at the source.',
        keyPoints: [
          'Prevention is always preferred over treatment or disposal',
          'Each step up the hierarchy typically reduces environmental impact and cost',
          'Regular waste audits reveal optimization opportunities',
          'Set measurable targets for moving waste up the hierarchy',
        ],
      },
      {
        title: 'Source Separation Programs',
        body: 'Effective source separation is the foundation of any successful recycling program. Materials that are contaminated or mixed are significantly harder and more expensive to process. Implement clear signage, color-coded bins, and training programs to achieve high separation rates.\n\nBest practice is to provide at minimum four stream separation: general waste, dry recyclables (paper, cardboard, plastics), organic waste, and hazardous/special waste. Higher-value recycling programs add additional streams for glass, metals, e-waste, and textiles.',
        keyPoints: [
          'Contamination rates above 10% make recycling streams economically unviable',
          'Visual signage with photos of accepted items reduces contamination by 30-50%',
          'Place bins at the point of waste generation, not in centralized locations only',
          'Regular contamination audits and feedback loops drive behavior change',
        ],
      },
      {
        title: 'Documentation and Tracking',
        body: 'Accurate waste tracking is essential for compliance, cost control, and improvement planning. Record the type, volume, source, and destination of every waste stream. Use digital systems like VisionPipe to automate data collection via IoT sensors and eliminate manual logging errors.\n\nKey metrics to track include: total waste generated (by weight and volume), diversion rate, contamination rate per stream, cost per ton by disposal method, and carbon emissions associated with waste management activities.',
        keyPoints: [
          'Digital tracking systems reduce data entry errors by up to 90%',
          'IoT sensors provide real-time fill-level data for collection optimization',
          'Maintain chain-of-custody records for hazardous waste compliance',
          'Monthly reporting enables trend analysis and early issue detection',
        ],
      },
      {
        title: 'Regulatory Compliance',
        body: 'Waste management is governed by a complex web of local, state, and federal regulations. Key frameworks include the Resource Conservation and Recovery Act (RCRA), state-specific solid waste management acts, and local ordinances governing collection and disposal.\n\nMaintain a compliance calendar with permit renewal dates, reporting deadlines, and inspection schedules. Designate a compliance officer responsible for staying current with regulatory changes and ensuring all operations meet legal requirements.',
        keyPoints: [
          'Non-compliance penalties can exceed $70,000 per day per violation under RCRA',
          'Keep records for a minimum of 3 years (longer for hazardous waste)',
          'EPA ID numbers are required for hazardous waste generators',
          'Annual reporting requirements vary by state and generator category',
        ],
      },
      {
        title: 'Continuous Improvement Framework',
        body: 'Apply Plan-Do-Check-Act (PDCA) cycles to waste management. Set specific, measurable targets (e.g., reduce landfill waste by 20% in 12 months). Implement changes, measure results, and adjust. Engage employees at all levels through training, incentives, and transparent reporting of progress.\n\nBenchmark your performance against industry peers and established standards such as ISO 14001, Zero Waste certification, or TRUE certification. These frameworks provide structured approaches to achieving measurable waste reduction.',
        keyPoints: [
          'Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound',
          'Celebrate milestones to maintain organizational momentum',
          'Zero Waste certification requires 90%+ diversion from landfill',
          'Employee engagement programs can reduce contamination by 40%',
        ],
      },
    ],
    practicalExercises: [
      'Conduct a waste audit at your facility using the provided audit template',
      'Map your current waste streams against the waste management hierarchy',
      'Calculate your current diversion rate and set a 12-month improvement target',
      'Review your compliance calendar and identify any gaps in documentation',
    ],
    additionalResources: [
      'EPA Waste Management Guidelines (epa.gov/rcra)',
      'ISO 14001 Environmental Management System standard',
      'TRUE Zero Waste certification requirements (true.gbci.org)',
      'National Recycling Coalition best practices library',
    ],
  },

  'video-tutorials': {
    title: 'Video Tutorials',
    type: 'Video',
    duration: '2.5 hours total',
    difficulty: 'Beginner',
    overview: 'A comprehensive video tutorial series covering the VisionPipe platform and sustainable waste management practices. From basic platform navigation to advanced sensor integration and route optimization.',
    learningObjectives: [
      'Navigate the VisionPipe dashboard and configure your organization settings',
      'Set up and manage waste points with location data and sensor integration',
      'Use the optimization tools for route planning and collection scheduling',
      'Interpret analytics dashboards and generate compliance reports',
      'Connect IoT sensors and configure real-time monitoring alerts',
    ],
    sections: [
      {
        title: 'Module 1: Getting Started with VisionPipe',
        body: 'This introductory module walks you through initial setup, including creating your organization, inviting team members, and configuring your first waste points. Learn the layout of the dashboard, how navigation works, and where to find key features.\n\nTopics covered: account creation, organization setup, user roles and permissions, dashboard overview, waste point creation, and location mapping.',
        keyPoints: [
          'Organization owners can manage all settings and user permissions',
          'Waste points should be named by location for easy identification',
          'Location data enables route optimization and map-based monitoring',
          'The dashboard provides at-a-glance status of all waste operations',
        ],
      },
      {
        title: 'Module 2: Sensor Setup and IoT Integration',
        body: 'Learn how to connect fill-level sensors, weight scales, and environmental monitors to VisionPipe. This module covers device registration, connection protocols, calibration, and troubleshooting common connectivity issues.\n\nTopics covered: supported sensor types, device registration process, AWS IoT Core integration, reading interpretation, alert configuration, and maintenance scheduling.',
        keyPoints: [
          'Sensors should be calibrated during installation and rechecked quarterly',
          'Battery-powered sensors typically last 2-5 years depending on reporting frequency',
          'Set fill-level alerts at 80% to allow time for collection scheduling',
          'Connection status monitoring helps identify offline sensors early',
        ],
      },
      {
        title: 'Module 3: Route Optimization and Scheduling',
        body: 'Discover how to use the optimization tools to plan efficient collection routes. This module covers creating routes, selecting stops, running the optimization algorithm, and interpreting results.\n\nTopics covered: route creation, depot configuration, stop selection, optimization execution, route map viewing, schedule management, and vendor coordination.',
        keyPoints: [
          'Route optimization typically reduces collection distance by 15-30%',
          'Set your depot location for accurate round-trip calculations',
          'Re-optimize routes when waste points or volumes change significantly',
          'Schedule routes based on sensor data to avoid unnecessary pickups',
        ],
      },
      {
        title: 'Module 4: Analytics and Reporting',
        body: 'Explore the analytics capabilities for tracking waste volumes, diversion rates, cost trends, and environmental impact. Learn how to create custom dashboards, schedule automated reports, and export data for stakeholder presentations.\n\nTopics covered: analytics dashboard, custom chart creation, report generation, PDF exports, sustainability metrics, carbon impact tracking, and trend analysis.',
        keyPoints: [
          'Custom analytics configs let you track metrics specific to your operations',
          'Scheduled reports automate compliance documentation',
          'Carbon impact calculations use industry-standard emission factors',
          'Export options include PDF, CSV, and direct stakeholder sharing',
        ],
      },
      {
        title: 'Module 5: Advanced Features',
        body: 'Deep dive into advanced platform features including the AI advisor, business process mapping, data model management, and API integration for custom workflows.\n\nTopics covered: AI-powered insights, business process visualization, waste stream mapping, API tokens for external integrations, Zapier workflows, and multi-site management.',
        keyPoints: [
          'The AI advisor can analyze your data and suggest optimization opportunities',
          'Business process maps help identify waste reduction opportunities in workflows',
          'API tokens enable custom integrations with ERP and other business systems',
          'Multi-site management provides organization-wide visibility and benchmarking',
        ],
      },
    ],
    practicalExercises: [
      'Set up your first waste point with location data in VisionPipe',
      'Register a test sensor and verify data is flowing to the dashboard',
      'Create a collection route with at least 3 stops and run optimization',
      'Generate a monthly waste summary report and review the metrics',
    ],
  },

  'certification-courses': {
    title: 'Certification Courses',
    type: 'Course',
    duration: '20 hours',
    difficulty: 'Intermediate',
    overview: 'Professional certification programs in sustainability and waste management. These courses prepare you for industry-recognized credentials that demonstrate expertise in environmental management, circular economy principles, and regulatory compliance.',
    learningObjectives: [
      'Understand the requirements for major sustainability certifications (ISO 14001, TRUE, LEED)',
      'Develop an environmental management system aligned with ISO 14001 standards',
      'Apply circular economy principles to waste stream management',
      'Prepare documentation packages for certification audits',
      'Maintain and improve certified management systems over time',
    ],
    sections: [
      {
        title: 'ISO 14001 Environmental Management Systems',
        body: 'ISO 14001 provides a framework for organizations to systematically manage their environmental responsibilities. The standard requires organizations to identify environmental aspects, set objectives and targets, implement operational controls, and monitor performance.\n\nKey elements include: environmental policy, planning (aspects/impacts, legal requirements, objectives), implementation (roles, training, communication, documentation), checking (monitoring, audits, corrective action), and management review.',
        keyPoints: [
          'ISO 14001 follows the Plan-Do-Check-Act cycle for continuous improvement',
          'Certification requires an external audit by an accredited certification body',
          'The standard applies to organizations of any size or industry',
          'Recertification audits occur every 3 years with annual surveillance audits',
        ],
      },
      {
        title: 'TRUE Zero Waste Certification',
        body: 'TRUE (Total Resource Use and Efficiency) certification recognizes facilities that have implemented zero waste practices and achieved at least 90% diversion from landfill, incineration, and the environment. The rating system uses a credit-based approach across categories.\n\nCategories include: redesign, reduce, reuse, compost, recycle, diversion, hazardous waste prevention, leadership, training, procurement, and upstream management. Points are earned by demonstrating performance in each category.',
        keyPoints: [
          'TRUE requires minimum 90% diversion rate to qualify',
          'Certification levels: Certified, Silver, Gold, Platinum',
          'Data must cover a minimum 12-month performance period',
          'On-site waste audits verify reported diversion rates',
        ],
      },
      {
        title: 'LEED Green Building Certification',
        body: 'LEED (Leadership in Energy and Environmental Design) includes credits specifically for waste management during both construction and ongoing operations. The Materials and Resources category covers construction waste management, ongoing recycling, and sustainable purchasing.\n\nKey waste-related credits include: storage and collection of recyclables, construction and demolition waste management, ongoing purchasing and waste policy, and facility maintenance and renovation management.',
        keyPoints: [
          'LEED MR credits require 50-75% diversion of construction waste',
          'Ongoing operations must maintain recycling programs for at least 3 waste streams',
          'Documentation includes waste hauler reports and diversion calculations',
          'LEED v4.1 includes updated waste management prerequisites and credits',
        ],
      },
      {
        title: 'Certified Waste Management Professional (CWMP)',
        body: 'The CWMP credential demonstrates professional expertise in solid waste management practices, regulations, and technology. The program covers collection systems, processing and disposal, environmental protection, financial management, and regulatory compliance.\n\nCandidates must meet education and experience requirements, pass a comprehensive exam, and maintain the credential through continuing education credits.',
        keyPoints: [
          'Requires 5+ years of experience in solid waste management',
          'Exam covers technical, regulatory, and management topics',
          'Continuing education requirement: 30 hours every 3 years',
          'Recognized by SWANA (Solid Waste Association of North America)',
        ],
      },
    ],
    practicalExercises: [
      'Conduct a gap analysis of your facility against ISO 14001 requirements',
      'Calculate your 12-month diversion rate to assess TRUE eligibility',
      'Review LEED scorecard waste management credits applicable to your building',
      'Create a study plan and timeline for your chosen certification exam',
    ],
    additionalResources: [
      'ISO 14001:2015 standard (iso.org)',
      'TRUE Zero Waste rating system guide (true.gbci.org)',
      'LEED v4.1 O+M Rating System (usgbc.org)',
      'SWANA Certified Waste Management Professional program (swana.org)',
    ],
  },

  'assessment-tools': {
    title: 'Assessment Tools',
    type: 'Tools',
    duration: '30 min',
    difficulty: 'Intermediate',
    overview: 'Practical tools and templates for evaluating your sustainability performance. Use these assessment frameworks to benchmark current operations, identify gaps, and prioritize improvement actions.',
    learningObjectives: [
      'Perform a comprehensive waste audit using standardized methodology',
      'Calculate key performance indicators: diversion rate, contamination rate, cost per ton',
      'Benchmark your operations against industry standards and peer organizations',
      'Use assessment results to build a prioritized improvement action plan',
    ],
    sections: [
      {
        title: 'Waste Audit Methodology',
        body: 'A waste audit is the foundation of any waste management improvement program. The standardized methodology involves: defining scope and boundaries, sampling waste over a representative period (minimum 1 week), sorting and weighing waste by category, documenting contamination, and analyzing composition data.\n\nBest practice is to conduct audits quarterly to track trends. Use visual sorting on tarps or tables, weigh each category separately, and photograph notable findings. Record data in a standardized template for consistency across audits.',
        keyPoints: [
          'Sample during a "normal" week - avoid holidays and unusual production periods',
          'Sort into at minimum 8 categories: paper, cardboard, plastics 1-2, plastics 3-7, glass, metals, organics, other',
          'Weigh each category to the nearest 0.1 kg for accuracy',
          'Document contamination sources to target training and signage improvements',
        ],
      },
      {
        title: 'KPI Calculation Frameworks',
        body: 'Key Performance Indicators (KPIs) translate raw waste data into actionable metrics. The essential KPIs for waste management are:\n\n- Diversion Rate: (Total waste - Landfill waste) / Total waste x 100\n- Contamination Rate: Contaminants in recycling stream / Total recycling stream x 100\n- Cost per Ton: Total waste management cost / Total waste (tons)\n- Waste Generation Rate: Total waste / Production unit or headcount\n- Carbon Impact: Emissions avoided through recycling vs. disposal',
        keyPoints: [
          'Track KPIs monthly and report quarterly trends to stakeholders',
          'Diversion rate above 50% is typical; above 90% qualifies for Zero Waste',
          'Contamination rates above 15% should trigger immediate corrective action',
          'Normalize waste generation by production output for meaningful comparison',
        ],
      },
      {
        title: 'Benchmarking and Gap Analysis',
        body: 'Compare your performance against industry benchmarks to identify strengths and opportunities. Use published benchmark data from EPA, SWANA, or industry associations. Conduct a gap analysis by mapping your current state against your target state for each metric.\n\nPrioritize gaps using an impact/effort matrix: high-impact, low-effort improvements should be tackled first. Common quick wins include improving signage, adding recycling streams for high-volume materials, and negotiating better rates with waste haulers.',
        keyPoints: [
          'Industry average diversion rates: offices 40-60%, manufacturing 50-80%, retail 30-50%',
          'Cost benchmarks vary significantly by region and available infrastructure',
          'Focus on closing the largest gaps first for maximum impact',
          'Revisit benchmarks annually as industry standards evolve',
        ],
      },
    ],
    practicalExercises: [
      'Download the waste audit template and schedule your first audit',
      'Calculate your current diversion rate, contamination rate, and cost per ton',
      'Complete the gap analysis worksheet comparing your KPIs to industry benchmarks',
      'Create a prioritized action plan using the impact/effort matrix template',
    ],
  },

  'case-studies': {
    title: 'Case Studies',
    type: 'Case Study',
    duration: '35 min read',
    difficulty: 'Intermediate',
    overview: 'Real-world examples of organizations that have successfully implemented waste management and sustainability initiatives, with measurable results and lessons learned.',
    learningObjectives: [
      'Analyze successful sustainability initiatives across different industries',
      'Identify common success factors and pitfalls in waste reduction programs',
      'Apply lessons learned to your own organization context',
      'Build business cases using real ROI data from comparable initiatives',
    ],
    sections: [
      {
        title: 'Manufacturing: Automotive Parts Supplier Achieves 95% Diversion',
        body: 'A mid-size automotive parts manufacturer reduced landfill waste from 1,200 tons/year to just 60 tons/year over 18 months. The initiative began with a comprehensive waste audit that revealed 40% of landfill waste was recyclable materials being contaminated during collection.\n\nKey actions included: installing color-coded bins at every workstation, implementing a scrap metal recovery program, partnering with a local composting facility for cafeteria waste, and renegotiating hauling contracts to incentivize recycling. Total program investment was $85,000 with annual savings of $240,000 in avoided disposal costs and recycling revenue.',
        keyPoints: [
          'ROI: 283% in the first year, with ongoing savings of $240K/year',
          'Employee training was the single biggest factor in contamination reduction',
          'Scrap metal recovery alone generated $95K in annual revenue',
          'The program created 2 new full-time positions in waste management',
        ],
      },
      {
        title: 'Healthcare: Hospital System Reduces Medical Waste by 35%',
        body: 'A 500-bed hospital system reduced regulated medical waste (RMW) from 18% to 12% of total waste stream by implementing proper segregation training. Previously, non-hazardous items were routinely placed in red bag waste due to confusion about what constitutes regulated waste.\n\nThe program included visual reference cards in every patient room, nursing station, and procedure area. Staff received quarterly training with hands-on sorting exercises. An incentive program rewarded departments that maintained contamination rates below 5%.',
        keyPoints: [
          'RMW disposal costs $0.50-$1.50/lb vs. $0.03-$0.10/lb for general waste',
          'Annual savings: $420,000 from reduced RMW disposal volumes',
          'Contamination rate dropped from 32% to 8% within 6 months',
          'Staff satisfaction scores increased due to clearer procedures',
        ],
      },
      {
        title: 'Retail: National Chain Implements Smart Bin IoT Program',
        body: 'A national retail chain with 200+ locations deployed IoT fill-level sensors in outdoor waste and recycling containers. The data enabled dynamic collection scheduling, replacing fixed weekly pickups with needs-based collection.\n\nResults: 42% reduction in collection trips (eliminating pickups of partially full containers), 23% reduction in overflow incidents, and 18% improvement in recycling capture rate. The centralized dashboard provided regional managers with real-time visibility across all locations.',
        keyPoints: [
          'Sensor payback period: 8 months per location',
          'Collection route optimization saved 35% on fuel costs',
          'Overflow elimination improved customer experience scores',
          'Real-time data enabled proactive vendor performance management',
        ],
      },
      {
        title: 'Construction: Zero Waste Achieved on $50M Commercial Project',
        body: 'A commercial construction project achieved 97% waste diversion through careful planning and on-site sorting. The waste management plan was integrated into the project from pre-construction, with diversion targets included in subcontractor agreements.\n\nOn-site sorting stations with dedicated attendants ensured proper separation. Materials including concrete, wood, metal, drywall, and cardboard were segregated and sent to appropriate recyclers. A material exchange program redirected surplus materials to other job sites.',
        keyPoints: [
          'Pre-construction planning is critical - retrofitting waste management is 3x more expensive',
          'On-site attendants reduced contamination from 25% to 3%',
          'Subcontractor buy-in required both contractual requirements and training',
          'Material exchange program saved $180,000 in procurement costs',
        ],
      },
    ],
  },

  'interactive-workshops': {
    title: 'Interactive Workshops',
    type: 'Workshop',
    duration: '2 hours each',
    difficulty: 'Intermediate',
    overview: 'Hands-on workshop sessions designed for team-based learning. Each workshop includes structured activities, group discussions, and practical exercises that can be run in-person or virtually.',
    learningObjectives: [
      'Facilitate waste audit workshops with cross-functional teams',
      'Run value stream mapping exercises to identify waste reduction opportunities',
      'Lead change management discussions for sustainability initiatives',
      'Design and present improvement proposals to leadership',
    ],
    sections: [
      {
        title: 'Workshop 1: Waste Stream Mapping',
        body: 'This 2-hour workshop guides teams through mapping their facility\'s waste streams from generation to final disposition. Participants create visual flow diagrams showing waste types, volumes, sources, handling steps, and destinations.\n\nFormat: Start with a 15-minute overview of waste stream mapping concepts. Teams of 4-6 then walk through their assigned areas, documenting waste generation points. Return to map findings on a large format diagram. Close with group discussion of findings and quick-win opportunities.',
        keyPoints: [
          'Provide teams with cameras and standardized data collection forms',
          'Include representatives from operations, facilities, and purchasing',
          'Focus on the highest-volume waste streams first',
          'Identify at least 3 actionable improvements per team',
        ],
      },
      {
        title: 'Workshop 2: Circular Economy Design Sprint',
        body: 'A structured ideation workshop where teams apply circular economy principles to current waste challenges. Teams brainstorm ways to eliminate, reduce, reuse, or redesign products and processes to minimize waste generation.\n\nFormat: 20-minute introduction to circular economy principles. Each team receives a specific waste challenge card. 30-minute ideation phase using structured brainstorming techniques. 20-minute prototyping of the top idea. 30-minute presentation and feedback round. 20-minute action planning.',
        keyPoints: [
          'Quantity of ideas matters more than quality in the brainstorming phase',
          'Encourage wild ideas - they often lead to practical innovations',
          'Vote on ideas using impact/feasibility criteria',
          'Assign owners and deadlines for top 3 ideas per team',
        ],
      },
      {
        title: 'Workshop 3: Change Management for Sustainability',
        body: 'Building support for sustainability initiatives requires effective change management. This workshop covers stakeholder analysis, communication planning, and overcoming resistance to new waste management procedures.\n\nFormat: Case study analysis of a failed sustainability initiative (15 min). Stakeholder mapping exercise (20 min). Communication plan development (30 min). Resistance scenarios role-play (30 min). Action plan creation (25 min).',
        keyPoints: [
          'Identify champions, supporters, neutrals, and resistors for each initiative',
          'Tailor messaging: executives want ROI data, operators want simplicity',
          'Address resistance with empathy - understand the root concern',
          'Celebrate and communicate small wins to build momentum',
        ],
      },
    ],
    practicalExercises: [
      'Schedule and run the Waste Stream Mapping workshop with your team',
      'Identify your top 3 waste challenges for the Circular Economy Design Sprint',
      'Complete a stakeholder analysis for your current sustainability initiative',
      'Create a 30-day communication plan for an upcoming process change',
    ],
  },

  'awareness-programs': {
    title: 'Awareness Programs',
    type: 'Program',
    duration: 'Ongoing',
    difficulty: 'Beginner',
    overview: 'Employee engagement and awareness campaign materials designed to build a culture of sustainability. These ready-to-use resources help organizations educate staff, motivate behavior change, and sustain momentum for waste reduction programs.',
    learningObjectives: [
      'Design and launch an employee sustainability awareness campaign',
      'Create effective signage and educational materials for waste programs',
      'Implement gamification and incentive programs to drive participation',
      'Measure employee engagement and behavior change over time',
    ],
    sections: [
      {
        title: 'Campaign Planning and Launch',
        body: 'An effective awareness campaign starts with clear objectives, target audiences, and a timeline. Define what specific behaviors you want to change (e.g., proper recycling sorting, reducing single-use items). Create a campaign name and visual identity that resonates with your workforce.\n\nLaunch with impact: a kick-off event, leadership endorsement, and visible changes to the physical environment. Maintain momentum with weekly updates, monthly challenges, and quarterly celebrations of progress.',
        keyPoints: [
          'Focus on 1-2 behavior changes at a time for maximum impact',
          'Executive sponsorship signals organizational commitment',
          'Physical environment changes (new bins, signage) create immediate visibility',
          'Plan for a minimum 6-month campaign to achieve lasting behavior change',
        ],
      },
      {
        title: 'Signage and Educational Materials',
        body: 'Effective waste management signage is visual, clear, and placed at the point of decision. Use photographs of actual accepted and rejected items rather than text-heavy lists. Color-code everything consistently (e.g., blue for recycling, green for compost, black for landfill).\n\nSupplemental materials include quick reference cards, screensaver slides, break room posters, and email newsletter content. All materials should be available in languages spoken by your workforce.',
        keyPoints: [
          'Photo-based signage reduces contamination 30-50% vs. text-only signs',
          'Place signs at eye level directly above or on waste bins',
          'Update signage when recycling program rules change',
          'Include "when in doubt" guidance (e.g., "if unsure, place in general waste")',
        ],
      },
      {
        title: 'Gamification and Incentives',
        body: 'Competition and rewards drive engagement in waste reduction programs. Implement department-level competitions with visible scoreboards tracking diversion rates, contamination levels, or waste reduction percentages.\n\nReward structures can include: monthly recognition for top-performing departments, gift cards or extra PTO for sustainability champions, team lunch rewards for hitting contamination targets, and annual awards for most innovative waste reduction idea.',
        keyPoints: [
          'Public recognition is often more motivating than monetary rewards',
          'Team-based competitions build collective responsibility',
          'Track and display metrics weekly to maintain engagement',
          'Rotate competition focus to address different waste challenges',
        ],
      },
    ],
    practicalExercises: [
      'Draft a campaign brief with objectives, audiences, timeline, and key messages',
      'Design bin signage for your top 3 waste streams using the photo template',
      'Plan a department competition with rules, scoring, and reward structure',
      'Create a 3-month content calendar for sustainability communications',
    ],
  },

  'industry-reports': {
    title: 'Industry Reports',
    type: 'Report',
    duration: '40 min read',
    difficulty: 'Advanced',
    overview: 'In-depth analysis of sustainability trends, market dynamics, and benchmarks across industries. These reports provide data-driven insights for strategic planning and investment decisions in waste management and circular economy initiatives.',
    learningObjectives: [
      'Analyze current market trends in waste management technology and services',
      'Interpret industry benchmark data for strategic planning',
      'Understand regulatory trends and their impact on waste management operations',
      'Evaluate emerging technologies and their potential ROI',
    ],
    sections: [
      {
        title: 'Market Overview: Global Waste Management Industry',
        body: 'The global waste management market is valued at approximately $530 billion (2025) and is projected to reach $700 billion by 2030, driven by urbanization, regulatory pressure, and the transition to circular economy models. Key growth segments include smart waste management (IoT and AI), organic waste processing, and extended producer responsibility programs.\n\nNorth America and Europe lead in per-capita waste management spending, while Asia-Pacific represents the fastest-growing market. Technology adoption is accelerating across all regions, with particular emphasis on data-driven collection optimization and automated sorting.',
        keyPoints: [
          'Smart waste management segment growing at 16% CAGR',
          'Regulatory requirements are the primary driver of waste management investment',
          'Labor shortages are accelerating automation adoption in sorting facilities',
          'Consolidation continues: top 10 companies hold 35% of global market',
        ],
      },
      {
        title: 'Technology Trends: IoT, AI, and Automation',
        body: 'IoT sensor deployment in waste management is growing at 25% annually. Fill-level sensors, weight monitoring, and GPS tracking are the most widely adopted technologies. AI applications include contamination detection, demand forecasting, and route optimization.\n\nRobotic sorting systems are achieving 95%+ accuracy for common recyclable materials, approaching or exceeding manual sorting quality. Computer vision systems identify materials by type, grade, and contamination level in real-time, enabling dynamic processing adjustments.',
        keyPoints: [
          'Fill-level sensors reduce collection costs by 20-40% on average',
          'AI-powered route optimization delivers 15-30% distance reduction',
          'Robotic sorting ROI is typically 2-3 years at current labor costs',
          'Computer vision contamination detection enables real-time feedback',
        ],
      },
      {
        title: 'Regulatory Outlook',
        body: 'Waste management regulation is intensifying globally. Key trends include: mandatory organic waste diversion (now law in California, Vermont, and several EU countries), extended producer responsibility (EPR) expansion to new product categories, landfill bans for recyclable materials, and mandatory emissions reporting for waste management operations.\n\nOrganizations should prepare for: higher disposal costs as landfill capacity decreases, new reporting requirements, potential carbon pricing impacts on waste management operations, and evolving definitions of what constitutes "recycling" vs. "downcycling".',
        keyPoints: [
          'EU Waste Framework Directive targets 65% municipal recycling by 2035',
          'US states are rapidly adopting EPR laws for packaging (12 states by 2025)',
          'Landfill tipping fees have increased 30% in 5 years in many regions',
          'Carbon reporting may become mandatory for waste generators by 2028',
        ],
      },
    ],
    additionalResources: [
      'EPA National Recycling Strategy (epa.gov)',
      'World Bank What a Waste 2.0 database',
      'ISWA Global Waste Management Outlook',
      'Ellen MacArthur Foundation Circular Economy reports',
    ],
  },

  'research-papers': {
    title: 'Research Papers',
    type: 'Research',
    duration: '50 min read',
    difficulty: 'Advanced',
    overview: 'Curated academic and industry research on sustainable practices, circular economy models, and waste management innovation. Each summary distills key findings and practical implications for waste management professionals.',
    learningObjectives: [
      'Evaluate research methodologies used in waste management studies',
      'Apply research findings to operational improvements',
      'Understand the evidence base for common waste management practices',
      'Identify emerging research areas relevant to your operations',
    ],
    sections: [
      {
        title: 'Life Cycle Assessment of Waste Management Strategies',
        body: 'Life Cycle Assessment (LCA) studies consistently show that waste prevention and recycling outperform landfilling and incineration across most environmental impact categories. However, the relative benefit of recycling vs. energy recovery varies significantly by material type and local energy grid composition.\n\nKey finding: For plastics, recycling is environmentally preferable when contamination rates are below 15% and transportation distances are under 200 miles. Above these thresholds, energy recovery may have lower net environmental impact. This underscores the importance of local infrastructure assessment when designing waste management programs.',
        keyPoints: [
          'LCA should consider all impact categories, not just carbon',
          'Transportation distance significantly affects recycling\'s net benefit',
          'Material-specific analysis is essential - one-size-fits-all rules mislead',
          'End markets for recycled materials must be considered in LCA scope',
        ],
      },
      {
        title: 'Behavioral Science in Waste Reduction Programs',
        body: 'Research in behavioral economics and psychology has identified effective techniques for driving waste reduction behavior. Social norms (showing what others do), defaults (making sustainable options the easy choice), and feedback loops (showing the impact of behavior) are consistently effective.\n\nA meta-analysis of 47 workplace recycling interventions found that multi-component programs (signage + training + feedback) improved recycling rates by an average of 34%, compared to 12% for signage alone and 18% for training alone.',
        keyPoints: [
          'Defaults are the most powerful behavioral lever - make recycling easier than trashing',
          'Social norms work: "80% of your colleagues recycle" outperforms "please recycle"',
          'Real-time feedback (digital displays showing diversion rates) sustains engagement',
          'Multi-component interventions are 2-3x more effective than single interventions',
        ],
      },
      {
        title: 'Economic Analysis of Circular Economy Transitions',
        body: 'Economic studies of circular economy transitions show that the business case strengthens as virgin material costs increase and disposal costs rise. Organizations that adopt circular models early gain competitive advantages through lower input costs, new revenue streams from secondary materials, and resilience to supply chain disruptions.\n\nResearch indicates that full circular economy transition in manufacturing can reduce material input costs by 20-40%, while creating new service-based revenue streams. However, the transition requires significant upfront investment in reverse logistics, remanufacturing capabilities, and customer relationship management.',
        keyPoints: [
          'Circular economy revenue models include leasing, refurbishment, and material recovery',
          'First-mover advantage is significant in establishing reverse logistics networks',
          'Payback periods for circular transitions average 3-5 years in manufacturing',
          'Customer willingness to pay for circular products is growing 15% annually',
        ],
      },
    ],
    additionalResources: [
      'Journal of Cleaner Production (sciencedirect.com)',
      'Resources, Conservation and Recycling journal',
      'Waste Management journal (Elsevier)',
      'Ellen MacArthur Foundation research library',
    ],
  },

  'implementation-guides': {
    title: 'Implementation Guides',
    type: 'Guide',
    duration: '40 min read',
    difficulty: 'Intermediate',
    overview: 'Step-by-step guides for implementing specific sustainability initiatives. Each guide includes planning checklists, timelines, budget templates, and common pitfalls to avoid.',
    learningObjectives: [
      'Plan and execute a recycling program implementation from scratch',
      'Deploy IoT monitoring for waste management operations',
      'Establish vendor management and procurement for waste services',
      'Build internal reporting systems for sustainability metrics',
    ],
    sections: [
      {
        title: 'Implementing a Multi-Stream Recycling Program',
        body: 'Phase 1 (Weeks 1-4): Baseline assessment. Conduct waste audit, survey current infrastructure, analyze hauler contracts, and identify target recycling streams based on volume and market value.\n\nPhase 2 (Weeks 5-8): Infrastructure setup. Procure bins and signage, negotiate recycling hauling agreements, designate collection areas, and install monitoring equipment.\n\nPhase 3 (Weeks 9-12): Launch and training. Roll out new bins with signage, conduct all-hands training sessions, assign floor champions, and begin tracking metrics.\n\nPhase 4 (Months 4-6): Optimization. Analyze contamination data, adjust signage and training based on findings, optimize bin placement, and report initial results.',
        keyPoints: [
          'Budget approximately $500-$2,000 per recycling station (bins + signage + sensors)',
          'Allow 8 weeks minimum between program design and launch',
          'Floor champions should check bins daily during the first month',
          'Expect contamination rates to stabilize after 2-3 months',
        ],
      },
      {
        title: 'IoT Sensor Deployment Guide',
        body: 'Planning: Identify which containers/locations need monitoring (prioritize high-volume, variable fill-rate locations). Select sensor type based on container material and size. Plan network connectivity (cellular, WiFi, or LoRaWAN).\n\nInstallation: Mount sensors according to manufacturer specifications. Configure reporting intervals (typically every 1-4 hours). Set up the VisionPipe dashboard with location data for each sensor. Calibrate and validate readings against manual measurements.\n\nOperations: Establish alert thresholds (typically 80% for routine collection, 95% for urgent). Create maintenance schedules for battery replacement and sensor cleaning. Review data weekly during the first month, then monthly.',
        keyPoints: [
          'Cellular sensors work in most locations but have higher ongoing costs',
          'LoRaWAN is cost-effective for campuses with many sensors in proximity',
          'Validate sensor accuracy quarterly against manual measurements',
          'Budget $100-$300 per sensor plus $5-$15/month for connectivity',
        ],
      },
      {
        title: 'Vendor Management for Waste Services',
        body: 'Effective waste vendor management starts with clear service specifications and performance expectations. Create RFP templates that include: service scope, collection frequency, container requirements, reporting requirements, pricing structure (per-haul, per-ton, or monthly), and performance penalties.\n\nEvaluate vendors on: pricing competitiveness, service reliability (on-time pickup rate), reporting quality and timeliness, environmental performance (diversion rates achieved), responsiveness to service issues, and technology capabilities (routing, tracking, customer portals).',
        keyPoints: [
          'Multi-year contracts (3-5 years) typically secure better pricing',
          'Include automatic price escalation caps tied to CPI',
          'Require monthly service reports with volume, diversion, and contamination data',
          'Performance-based pricing aligns vendor incentives with your goals',
        ],
      },
    ],
    practicalExercises: [
      'Complete the recycling program implementation checklist for your facility',
      'Create a sensor deployment plan with location priorities and connectivity approach',
      'Draft an RFP for waste hauling services using the provided template',
      'Build a 6-month implementation timeline using the project plan template',
    ],
  },

  'community-forums': {
    title: 'Community Forums',
    type: 'Community',
    duration: 'Ongoing',
    difficulty: 'Beginner',
    overview: 'Connect with other waste management professionals to share experiences, ask questions, and collaborate on solutions. The community forums provide peer support, industry networking, and knowledge sharing.',
    learningObjectives: [
      'Connect with waste management professionals facing similar challenges',
      'Share and learn from real-world implementation experiences',
      'Access peer-reviewed solutions to common operational challenges',
      'Stay informed about industry developments through community discussions',
    ],
    sections: [
      {
        title: 'Discussion Categories',
        body: 'The community forums are organized into focused discussion categories to help you find relevant conversations quickly:\n\n- General Discussion: broad sustainability and waste management topics\n- Technical Help: VisionPipe platform questions and troubleshooting\n- Regulatory Compliance: navigating local, state, and federal requirements\n- Vendor Reviews: experiences with waste haulers, equipment suppliers, and consultants\n- Success Stories: share your wins and learn from others\n- Innovation Corner: emerging technologies, pilot programs, and new approaches',
        keyPoints: [
          'Search before posting - your question may already be answered',
          'Include specific details (industry, facility size, region) for better answers',
          'Mark helpful answers as "accepted" to help future searchers',
          'Share your results when you implement community suggestions',
        ],
      },
      {
        title: 'Monthly Community Events',
        body: 'The community hosts regular events to facilitate learning and networking:\n\n- Ask Me Anything (AMA): Monthly sessions with industry experts on specific topics\n- Peer Benchmarking: Quarterly anonymous benchmarking surveys with results discussion\n- Challenge of the Month: A community-wide challenge (e.g., reduce contamination by 5%) with shared progress tracking\n- New Member Welcome: Monthly orientation for new community members',
        keyPoints: [
          'AMA topics are voted on by the community each month',
          'Benchmarking data is anonymized - share freely without competitive concerns',
          'Challenge participants report 2x improvement rates vs. solo efforts',
          'Welcome sessions include a tour of community resources and introductions',
        ],
      },
      {
        title: 'Getting the Most from the Community',
        body: 'Active community members report faster problem resolution, broader networks, and better outcomes on sustainability initiatives. Tips for effective participation:\n\nContribute regularly, even if just brief responses to others\' questions. Ask specific, well-framed questions with context about your situation. Follow up on threads where you asked questions to share what worked. Connect directly with members in similar industries or facing similar challenges.',
        keyPoints: [
          'Members who post monthly are 3x more likely to report high satisfaction',
          'Direct connections often lead to site visits and knowledge exchanges',
          'Community-sourced solutions have a 70% implementation success rate',
          'Active participation builds your professional reputation in the field',
        ],
      },
    ],
  },
};

// URL slug mapping
const slugMap: Record<string, string> = {
  'best-practices-guides': 'Best Practices Guides',
  'video-tutorials': 'Video Tutorials',
  'certification-courses': 'Certification Courses',
  'assessment-tools': 'Assessment Tools',
  'case-studies': 'Case Studies',
  'interactive-workshops': 'Interactive Workshops',
  'awareness-programs': 'Awareness Programs',
  'industry-reports': 'Industry Reports',
  'research-papers': 'Research Papers',
  'implementation-guides': 'Implementation Guides',
  'community-forums': 'Community Forums',
};

export default function TrainingContent() {
  const [, params] = useRoute('/training/:slug');
  const [, navigate] = useLocation();
  const slug = params?.slug || '';

  const content = trainingContent[slug];

  if (!content) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Training content not found.
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/training')}>
          Back to Training Library
        </Button>
      </Box>
    );
  }

  const difficultyColor = {
    Beginner: 'success' as const,
    Intermediate: 'warning' as const,
    Advanced: 'error' as const,
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/training')}
        sx={{ mb: 2 }}
      >
        Back to Training Library
      </Button>

      <PageHeader title={content.title} subtitle={content.overview} />

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip label={content.type} color="primary" />
        <Chip icon={<Timer />} label={content.duration} variant="outlined" />
        <Chip label={content.difficulty} color={difficultyColor[content.difficulty]} />
      </Stack>

      {/* Learning Objectives */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <School sx={{ mr: 1, verticalAlign: 'middle' }} />
          Learning Objectives
        </Typography>
        <List dense>
          {content.learningObjectives.map((obj, i) => (
            <ListItem key={i}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={obj} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Content Sections */}
      {content.sections.map((section, i) => (
        <Accordion key={i} defaultExpanded={i === 0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {i + 1}. {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {section.body.split('\n\n').map((para, j) => (
              <Typography key={j} variant="body1" paragraph>
                {para}
              </Typography>
            ))}
            {section.keyPoints && (
              <Card variant="outlined" sx={{ mt: 2, bgcolor: 'action.hover' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    <TrendingUp sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 18 }} />
                    Key Takeaways
                  </Typography>
                  <List dense>
                    {section.keyPoints.map((point, k) => (
                      <ListItem key={k} sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircle fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={point}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Practical Exercises */}
      {content.practicalExercises && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Quiz sx={{ mr: 1, verticalAlign: 'middle' }} />
            Practical Exercises
          </Typography>
          <List>
            {content.practicalExercises.map((exercise, i) => (
              <ListItem key={i}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Chip label={i + 1} size="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary={exercise} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Additional Resources */}
      {content.additionalResources && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            <MenuBook sx={{ mr: 1, verticalAlign: 'middle' }} />
            Additional Resources
          </Typography>
          <List dense>
            {content.additionalResources.map((resource, i) => (
              <ListItem key={i}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Download fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={resource} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
