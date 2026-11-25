import { BookVideoStory } from '../types/library';

export const CURATED_BOOK_STORIES: Record<string, BookVideoStory> = {
  'bk-morling': {
    bookId: 'bk-morling',
    bookTitle: 'Research Methods in Psychology',
    author: 'Beth Morling',
    callNumber: 'BF 76.5 MOR',
    visualStyle: 'Visual Concept Animation',
    storyTitle: 'Why Correlation Fools You — And How True Experiments Isolate Cause',
    hookSummary:
      'Turn 600 pages of research validity theory into a 56-second visual walkthrough of covariance, temporal precedence, and confounds.',
    totalDurationSeconds: 56,
    keyTakeaways: [
      'Ch. 3 (Three Claims): Separate frequency, association, and causal claims before choosing your statistical test.',
      'Ch. 8–10 (Causal Rules): Causal proof requires covariance, temporal precedence, and eliminating internal confounds.',
      'Ch. 14 (Replication): Pair p-values with effect sizes and confidence intervals when drafting your dissertation.',
    ],
    source: 'curated',
    scenes: [
      {
        sceneNumber: 1,
        chapterBeat: '01 · The Illusion Trap',
        visualHeadline: 'Three Claims That Look Identical',
        narration:
          'When reading academic papers, headlines blur together. Morling shows every study makes one of three distinct claims: frequency, association, or cause.',
        visualMotif: 'contrast',
        diagramLabels: ['Frequency Claim', 'Association Claim', 'Causal Claim'],
        citationAnchor: 'Ch. 3 · Three Claims, Four Validities',
        durationSeconds: 14,
      },
      {
        sceneNumber: 2,
        chapterBeat: '02 · Four Validities',
        visualHeadline: 'Stress-Test Every Graph You See',
        narration:
          'Before trusting a finding, check construct, external, statistical, and internal validity. Weakness in just one lens breaks the entire conclusion.',
        visualMotif: 'network',
        diagramLabels: ['Construct Validity', 'Internal Control', 'Statistical Power'],
        citationAnchor: 'Ch. 3 · Interrogation Framework',
        durationSeconds: 14,
      },
      {
        sceneNumber: 3,
        chapterBeat: '03 · isolating Cause',
        visualHeadline: 'Random Assignment Cancels Hidden Noise',
        narration:
          'Correlations hide third-variable confounds. By randomly assigning participants, individual differences balance out so only your manipulated variable explains the shift.',
        visualMotif: 'experiment',
        diagramLabels: ['Random Assignment', 'Manipulated Variable', 'Confound Cancelled'],
        citationAnchor: 'Ch. 10 · Simple Experiments',
        durationSeconds: 14,
      },
      {
        sceneNumber: 4,
        chapterBeat: '04 · Dissertation Action',
        visualHeadline: 'Pair Your Thesis With Floor 2 Tools',
        narration:
          'Map your hypotheses using Morling’s checklist on Floor 1, then walk to Floor 2 SPSS stations to verify confidence intervals and effect sizes.',
        visualMotif: 'spatial',
        diagramLabels: ['Hypothesis Audit', 'SPSS Confidence Band', 'Viva-Ready Method'],
        citationAnchor: 'Ch. 14 · Replicability & Generalisation',
        durationSeconds: 14,
      },
    ],
  },
  'bk-field': {
    bookId: 'bk-field',
    bookTitle: 'Discovering Statistics Using IBM SPSS Statistics',
    author: 'Andy Field',
    callNumber: 'HA 32 FIE',
    visualStyle: 'Lab Case Narrative',
    storyTitle: 'From Messy Spreadsheets to Defensible Regression Models',
    hookSummary:
      'Visualise how Field frames statistical models as Signal plus Error—so you know what every SPSS output box actually means.',
    totalDurationSeconds: 56,
    keyTakeaways: [
      'Ch. 2 (Core Equation): Every model is Outcome = Model + Error; residual plots reveal whether your model misses real structure.',
      'Ch. 5 (Assumptions): Inspect normality, linearity, and homoscedasticity visually before trusting a p-value.',
      'Ch. 9 (Regression & Effect): Report R-squared, confidence intervals, and standardised betas rather than raw p-thresholds.',
    ],
    source: 'curated',
    scenes: [
      {
        sceneNumber: 1,
        chapterBeat: '01 · The Golden Equation',
        visualHeadline: 'Outcome Equals Model Plus Error',
        narration:
          'Forget memorising thirty separate tests. Andy Field shows every statistical model simply splits real-world data into predictable pattern and leftover error.',
        visualMotif: 'contrast',
        diagramLabels: ['Observed Data', 'Fitted Model', 'Residual Error'],
        citationAnchor: 'Ch. 2 · The SPINE of Statistics',
        durationSeconds: 14,
      },
      {
        sceneNumber: 2,
        chapterBeat: '02 · Reading Bias',
        visualHeadline: 'Spot Outliers Before Running Tests',
        narration:
          'A single extreme point tilts a regression slope completely. Plot histograms and boxplots first so outliers never distort your postgraduate findings.',
        visualMotif: 'experiment',
        diagramLabels: ['Skew & Kurtosis', 'Leverage Check', 'Robust Bootstrap'],
        citationAnchor: 'Ch. 5 · The Beast of Bias',
        durationSeconds: 14,
      },
      {
        sceneNumber: 3,
        chapterBeat: '03 · Choosing the Model',
        visualHeadline: 'Navigate From T-Tests to Regression',
        narration:
          'Compare group means with t-tests and ANOVA, or predict continuous outcomes with multiple regression—all built on the exact same general linear model.',
        visualMotif: 'timeline',
        diagramLabels: ['Explore Distributions', 'Check Assumptions', 'Fit Linear Model'],
        citationAnchor: 'Ch. 8–9 · General Linear Model',
        durationSeconds: 14,
      },
      {
        sceneNumber: 4,
        chapterBeat: '04 · Live SPSS Run',
        visualHeadline: 'Run Worked Examples on PC-204',
        narration:
          'Keep Field open beside SPSS on Floor 2 PC-204. Match each menu dialog directly to your output tables and report effect sizes clearly.',
        visualMotif: 'spatial',
        diagramLabels: ['Syntax Log', 'Effect Size r', 'APA Output Table'],
        citationAnchor: 'Ch. 9 · Interpreting Output',
        durationSeconds: 14,
      },
    ],
  },
  'bk-brown': {
    bookId: 'bk-brown',
    bookTitle: 'Change by Design',
    author: 'Tim Brown',
    callNumber: 'TS 171.4 BRO',
    visualStyle: 'Architectural Documentary',
    storyTitle: 'How Design Thinking Turns Campus Friction Into Testable Prototypes',
    hookSummary:
      'Watch Tim Brown’s Inspiration → Ideation → Implementation loop unfold visually across real postgraduate research spaces.',
    totalDurationSeconds: 56,
    keyTakeaways: [
      'Ch. 1–2 (Empathy): Shadow real user behaviour—like students hunting power sockets—rather than relying on surveys alone.',
      'Ch. 4 (Rapid Prototyping): Build the cheapest artefact that answers a real question in minutes, not months.',
      'Ch. 7 (Storytelling): Anchor every prototype around a clear human journey from pain point to measurable relief.',
    ],
    source: 'curated',
    scenes: [
      {
        sceneNumber: 1,
        chapterBeat: '01 · Three Lenses',
        visualHeadline: 'Desirability, Feasibility, and Viability',
        narration:
          'Great systems sit where human need meets technical reality and sustainable operations. Tim Brown warns never to start with technology before empathy.',
        visualMotif: 'network',
        diagramLabels: ['Human Desirability', 'Tech Feasibility', 'System Viability'],
        citationAnchor: 'Ch. 1 · Design Thinking Overlapping Spaces',
        durationSeconds: 14,
      },
      {
        sceneNumber: 2,
        chapterBeat: '02 · Diverge & Converge',
        visualHeadline: 'Flare Broadly, Then Focus Sharply',
        narration:
          'First expand options wide through field observation and How Might We framing. Only then converge onto the sharpest concepts worth testing.',
        visualMotif: 'timeline',
        diagramLabels: ['Field Observation', 'HMW Framing', 'Focused Convergence'],
        citationAnchor: 'Ch. 3 · A Mental Matrix',
        durationSeconds: 14,
      },
      {
        sceneNumber: 3,
        chapterBeat: '03 · Think With Hands',
        visualHeadline: 'Prototype Early to Fail Safely',
        narration:
          'A rough prototype exposes broken assumptions in five minutes. Test physical spaces, digital flows, and edge cases long before committing infrastructure.',
        visualMotif: 'spatial',
        diagramLabels: ['Paper Mockup', 'Live Stress Test', 'Refined Blueprint'],
        citationAnchor: 'Ch. 4 · Building to Think',
        durationSeconds: 14,
      },
      {
        sceneNumber: 4,
        chapterBeat: '04 · Narrative Impact',
        visualHeadline: 'Deliver Experiences, Not Just Features',
        narration:
          'Students do not remember menus; they remember whether they found a quiet booth before their viva. Story-driven design keeps every team aligned.',
        visualMotif: 'contrast',
        diagramLabels: ['Before: Walking Floors', 'After: Zero-Friction', 'Measurable Outcome'],
        citationAnchor: 'Ch. 7 · Storytelling in Design',
        durationSeconds: 14,
      },
    ],
  },
};
