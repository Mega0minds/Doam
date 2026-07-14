'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'pidgin';

interface Translations {
  // Common
  getStarted: string;
  signIn: string;
  signUp: string;
  continueWithGoogle: string;
  back: string;
  next: string;
  skip: string;
  save: string;
  saveAndContinue: string;
  saving: string;
  cancel: string;
  settings: string;
  language: string;
  theme: string;

  // Landing page
  heroTagline: string;
  heroDescription: string;
  seeHowItWorks: string;
  soundFamiliar: string;
  mostToolsFail: string;
  problem1Title: string;
  problem1Desc: string;
  problem2Title: string;
  problem2Desc: string;
  problem3Title: string;
  problem3Desc: string;
  solutionTitle: string;
  solutionDesc: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  calendarTitle: string;
  calendarDesc: string;
  featuresTitle: string;
  featureGoalDriven: string;
  featureGoalDrivenDesc: string;
  featureEnergyAware: string;
  featureEnergyAwareDesc: string;
  featureProtectedTime: string;
  featureProtectedTimeDesc: string;
  featureAdaptive: string;
  featureAdaptiveDesc: string;
  brainDumpTitle: string;
  brainDumpDesc: string;
  brainDumpBenefit1: string;
  brainDumpBenefit2: string;
  brainDumpBenefit3: string;
  howItWorksTitle: string;
  howItWorksDesc: string;
  howStep1Title: string;
  howStep1Desc: string;
  howStep2Title: string;
  howStep2Desc: string;
  howStep3Title: string;
  howStep3Desc: string;
  howStep4Title: string;
  howStep4Desc: string;
  trustTitle: string;
  trustDesc: string;
  trust1: string;
  trust2: string;
  trust3: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaButton: string;
  footerTagline: string;

  // Flow labels
  flowIdentity: string;
  flowIdentityDesc: string;
  flowTime: string;
  flowTimeDesc: string;
  flowActions: string;
  flowActionsDesc: string;
  flowSchedule: string;
  flowScheduleDesc: string;

  // Auth
  authWelcome: string;
  authDescription: string;
  authAgreement: string;

  // Onboarding - Welcome
  onboardingWelcomeTitle: string;
  onboardingWelcomeDesc: string;
  onboardingWelcomeWhat: string;
  onboardingTimeEstimate: string;
  onboardingFeature1Title: string;
  onboardingFeature1Desc: string;
  onboardingFeature2Title: string;
  onboardingFeature2Desc: string;
  onboardingFeature3Title: string;
  onboardingFeature3Desc: string;
  onboardingFeature4Title: string;
  onboardingFeature4Desc: string;

  // Onboarding - Goals
  onboardingGoalsTitle: string;
  onboardingGoalsDesc: string;
  onboardingGoalsWhy: string;
  onboardingGoalsSmart: string;
  onboardingPriorityTitle: string;
  onboardingPriorityDesc: string;
  onboardingPriorityWhy: string;

  // Onboarding - Energy
  onboardingEnergyTitle: string;
  onboardingEnergyDesc: string;
  onboardingEnergyWhy: string;
  onboardingChronotypeTitle: string;
  earlyBird: string;
  earlyBirdDesc: string;
  nightOwl: string;
  nightOwlDesc: string;
  neutral: string;
  neutralDesc: string;
  sleepSchedule: string;
  wakeTime: string;
  bedtime: string;
  focusPeriods: string;
  focusPeriodsDesc: string;
  highFocusPeriod: string;
  lowEnergyPeriod: string;

  // Onboarding - Commitments
  onboardingCommitmentsTitle: string;
  onboardingCommitmentsDesc: string;
  onboardingCommitmentsWhy: string;
  addCommitment: string;
  lockCommitment: string;
  startTime: string;
  endTime: string;

  // Onboarding - Complete
  onboardingCompleteTitle: string;
  onboardingCompleteDesc: string;
  onboardingWhatsNext: string;
  onboardingNext1: string;
  onboardingNext2: string;
  onboardingNext3: string;
  onboardingNext4: string;
  goToDashboard: string;

  // Task Nudges
  missedTask: string;
  taskPending: string;
  stayConsistent: string;
  doingGreat: string;
  itsOkay: string;
  tryAgainTomorrow: string;

  // Calendar
  scheduleUpdated: string;
  timeProtected: string;
  today: string;
  peakFocus: string;
  protectedSleep: string;

  // Settings
  settingsTitle: string;
  energyProfile: string;
  commitments: string;
  goals: string;
  languageSettings: string;
  languageDesc: string;
  themeSettings: string;
  lightTheme: string;
  darkTheme: string;
  systemTheme: string;
  replayTour: string;
  replayTourDesc: string;
  replayTourButton: string;

  // Goal Categories
  academicCareer: string;
  health: string;
  personalGrowth: string;
  social: string;
  spiritualMental: string;
  restRecreation: string;
  academicCareerDesc: string;
  healthDesc: string;
  personalGrowthDesc: string;
  socialDesc: string;
  spiritualMentalDesc: string;
  restRecreationDesc: string;

  // Tour
  tourWelcome: string;
  tourWelcomeDesc: string;
  tourCalendar: string;
  tourCalendarDesc: string;
  tourTasks: string;
  tourTasksDesc: string;
  tourBrainDump: string;
  tourBrainDumpDesc: string;
  tourGoals: string;
  tourGoalsDesc: string;
  tourEnergy: string;
  tourEnergyDesc: string;
  tourCommitments: string;
  tourCommitmentsDesc: string;
  tourSettings: string;
  tourSettingsDesc: string;
  tourComplete: string;
  tourCompleteDesc: string;
  skipTour: string;

  // Profile Section
  profileBiography: string;
  profileBiographyDesc: string;
  profileRegenerate: string;
  profileRegenerating: string;
  profileWhatWorks: string;
  profileWhatWorksDesc: string;
  profileImproving: string;
  profileImprovingDesc: string;
  profileKeyTraits: string;
  profileFocusTime: string;
  profilePlanningStyle: string;
  profileTopPriorities: string;
  profileOverview: string;
  profileEdit: string;
  profileAboutYou: string;
  profileBehavioral: string;
  profileAcademicLevel: string;
  profileFieldOfStudy: string;
  profileLongTermGoals: string;
  profileStrengths: string;
  profileAreasToImprove: string;
  profileStudyHabits: string;
  profileConsistencyLevel: string;
  profileWorkStyle: string;
  profileBlockers: string;
  profileSave: string;
  profileSaving: string;
  profileSaved: string;
  profileSaveError: string;
  profileBioUpdated: string;
  profileBioError: string;

  // Dashboard
  dashboardTitle: string;
  dashboardSubtitle: string;
  dashboardGenerateSchedule: string;
  dashboardGenerating: string;
  dashboardCompleteSetup: string;
  dashboardCompleteOnboarding: string;
  dashboardSetGoals: string;
  dashboardAddTask: string;
  dashboardNoSchedule: string;
  dashboardNoScheduleDesc: string;
  dashboardSubmitProof: string;
  dashboardVerifyWithAI: string;
  dashboardVerifying: string;
  dashboardProofVerified: string;
  dashboardProofFailed: string;
  dashboardBreakTime: string;
  dashboardScheduleGenerated: string;
  dashboardShowMore: string;
  dashboardShowLess: string;

  // Errors & Notifications
  errorGeneric: string;
  errorTryAgain: string;
  successSaved: string;
  progressSaved: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Common
    getStarted: 'Get Started',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    continueWithGoogle: 'Continue with Google',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    save: 'Save',
    saveAndContinue: 'Save & Continue',
    saving: 'Saving...',
    cancel: 'Cancel',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',

    // Landing page
    heroTagline: 'Stop dragging — just DoAm.',
    heroDescription: 'An AI-powered system built for students — designed around how you actually live, not ideal routines.',
    seeHowItWorks: 'See How It Works',
    soundFamiliar: 'Sound familiar?',
    mostToolsFail: 'Most planning tools set you up to fail.',
    problem1Title: '"Planning feels overwhelming."',
    problem1Desc: 'Endless to-do lists that grow faster than you can check them off. Where do you even start?',
    problem2Title: '"Schedules don\'t survive real life."',
    problem2Desc: 'Perfect plans that fall apart by Tuesday. Classes, surprises, energy dips — life happens.',
    problem3Title: '"You know your goals — but not when."',
    problem3Desc: 'You want to study, exercise, rest, and grow. But when? And how much? That\'s the hard part.',
    solutionTitle: 'DoAm does the hard part for you',
    solutionDesc: 'Instead of filling a calendar, you tell DoAm who you are. It builds a schedule that fits.',
    step1Title: 'Understands who you are',
    step1Desc: 'Your goals, your energy patterns, your non-negotiables. DoAm learns your priorities.',
    step2Title: 'Maps your real available time',
    step2Desc: 'Classes, sleep, and life get protected. DoAm works with what\'s left.',
    step3Title: 'Breaks goals into actions',
    step3Desc: 'Big goals become small, repeatable tasks that fit into your day.',
    step4Title: 'Adapts when life changes',
    step4Desc: 'Missed something? DoAm adjusts — no guilt, no judgment. Just a new plan.',
    calendarTitle: 'A calendar that thinks with you',
    calendarDesc: 'Not just a scheduler. A system that understands how life works.',
    featuresTitle: 'Core Features',
    featureGoalDriven: 'Goal-Driven',
    featureGoalDrivenDesc: 'Goals automatically become time blocks. No manual planning.',
    featureEnergyAware: 'Energy-Aware',
    featureEnergyAwareDesc: 'Study when your focus is highest. Rest when you need it.',
    featureProtectedTime: 'Protected Time',
    featureProtectedTimeDesc: 'Classes, sleep, and life are locked. AI can\'t override them.',
    featureAdaptive: 'Adaptive',
    featureAdaptiveDesc: 'Miss a task? DoAm adjusts. It learns from your patterns.',
    brainDumpTitle: 'A place to unload your thoughts',
    brainDumpDesc: 'Before DoAm organizes your day, use BrainDump to empty your mind. Type out everything — tasks, worries, ideas. Then let AI turn it into action.',
    brainDumpBenefit1: 'Reduces mental clutter',
    brainDumpBenefit2: 'AI extracts actionable tasks',
    brainDumpBenefit3: 'Connects to your calendar automatically',
    howItWorksTitle: 'Get started in minutes',
    howItWorksDesc: 'No complex setup. Just answer a few questions.',
    howStep1Title: 'Define six key areas of your life',
    howStep1Desc: 'Pick what matters across six core life areas',
    howStep2Title: 'Input your classes, sleep, and all fixed, non-negotiable commitments',
    howStep2Desc: 'Lock in everything you can\'t move so DoAm plans around real life',
    howStep3Title: 'Generate schedule',
    howStep3Desc: 'Let DoAm build your calendar',
    howStep4Title: 'Follow & adjust',
    howStep4Desc: 'Complete tasks, skip if needed',
    trustTitle: 'You\'re always in control',
    trustDesc: 'DoAm is a recommendation system, not a dictator.',
    trust1: 'AI recommends — you decide',
    trust2: 'Adjust anytime, no judgment',
    trust3: 'Your priorities, your pace',
    ctaTitle: 'Build a schedule that works in real life',
    ctaDesc: 'Stop fighting your calendar. Start working with it.',
    ctaButton: 'Start with DoAm',
    footerTagline: 'Built for students who want schedules that actually work.',

    // Flow labels
    flowIdentity: 'Identity',
    flowIdentityDesc: 'Who you are',
    flowTime: 'Time',
    flowTimeDesc: 'What\'s available',
    flowActions: 'Actions',
    flowActionsDesc: 'What to do',
    flowSchedule: 'Schedule',
    flowScheduleDesc: 'When to do it',

    // Auth
    authWelcome: 'DoAm',
    authDescription: 'AI-powered scheduling for your goals and priorities',
    authAgreement: 'By signing up, you agree to let DoAm help you achieve your goals',

    // Onboarding - Welcome
    onboardingWelcomeTitle: 'Welcome to DoAm',
    onboardingWelcomeDesc: 'We\'ll ask a few simple questions to build a schedule that fits your real life. This takes about 3-5 minutes.',
    onboardingWelcomeWhat: 'DoAm helps you turn your goals into a realistic calendar — built around your real life, your energy, and your commitments.',
    onboardingTimeEstimate: '3-5 minutes',
    onboardingFeature1Title: 'Set Holistic Goals',
    onboardingFeature1Desc: 'Define goals across 6 life areas: academics, health, growth, social, spiritual, and rest.',
    onboardingFeature2Title: 'Know Your Energy',
    onboardingFeature2Desc: 'Tell us when you\'re at your best so we can schedule accordingly.',
    onboardingFeature3Title: 'Lock Your Commitments',
    onboardingFeature3Desc: 'Add classes, work, and other non-negotiable time blocks.',
    onboardingFeature4Title: 'AI-Powered Scheduling',
    onboardingFeature4Desc: 'Get personalized schedule recommendations that respect your priorities.',

    // Onboarding - Goals
    onboardingGoalsTitle: 'Define Your Goals',
    onboardingGoalsDesc: 'Set one goal for each life area. Skip any you like!',
    onboardingGoalsWhy: 'Your calendar is built around what matters most to you.',
    onboardingGoalsSmart: 'Set SMART goals for best results.',
    onboardingPriorityTitle: 'Rank Your Priorities',
    onboardingPriorityDesc: 'Drag to reorder (1 = most important)',
    onboardingPriorityWhy: 'When time clashes, we protect what you rank higher.',

    // Onboarding - Energy
    onboardingEnergyTitle: 'Your Energy Profile',
    onboardingEnergyDesc: 'Help us understand when you work best so we can optimize your schedule.',
    onboardingEnergyWhy: 'We place hard tasks when your brain works best.',
    onboardingChronotypeTitle: 'Are you a morning person or night owl?',
    earlyBird: 'Early Bird',
    earlyBirdDesc: 'I wake up early and feel most productive in the morning',
    nightOwl: 'Night Owl',
    nightOwlDesc: 'I come alive in the evening and work best at night',
    neutral: 'Somewhere in Between',
    neutralDesc: 'My energy is fairly consistent throughout the day',
    sleepSchedule: 'Sleep Schedule',
    wakeTime: 'Wake Up Time',
    bedtime: 'Bedtime',
    focusPeriods: 'Focus Periods',
    focusPeriodsDesc: 'When do you typically have the most energy for deep work?',
    highFocusPeriod: 'High Focus Period',
    lowEnergyPeriod: 'Low Energy Period',

    // Onboarding - Commitments
    onboardingCommitmentsTitle: 'Fixed Commitments',
    onboardingCommitmentsDesc: 'Add your non-negotiable time blocks. These will never be overwritten by AI suggestions.',
    onboardingCommitmentsWhy: 'We never schedule over these. Ever.',
    addCommitment: 'Add Commitment',
    lockCommitment: 'Lock this commitment (cannot be moved)',
    startTime: 'Start Time',
    endTime: 'End Time',

    // Onboarding - Complete
    onboardingCompleteTitle: 'You\'re All Set!',
    onboardingCompleteDesc: 'Your personalized scheduling profile is ready. Head to the dashboard to generate your first AI-optimized schedule.',
    onboardingWhatsNext: 'What\'s Next?',
    onboardingNext1: 'Add your tasks on the Tasks page',
    onboardingNext2: 'Generate your schedule on the Dashboard',
    onboardingNext3: 'DoAm will match tasks to your energy levels',
    onboardingNext4: 'Complete tasks and track your progress',
    goToDashboard: 'Go to Dashboard',

    // Task Nudges
    missedTask: 'You missed this task',
    taskPending: 'Task pending',
    stayConsistent: 'Stay consistent',
    doingGreat: 'You\'re doing great',
    itsOkay: 'It\'s okay, we\'ll adjust',
    tryAgainTomorrow: 'Let\'s try again tomorrow',

    // Calendar
    scheduleUpdated: 'Your schedule has been updated',
    timeProtected: 'This time is protected',
    today: 'Today',
    peakFocus: 'Peak Focus',
    protectedSleep: 'Protected Sleep',

    // Settings
    settingsTitle: 'Settings',
    energyProfile: 'Energy Profile',
    commitments: 'Commitments',
    goals: 'Goals',
    languageSettings: 'Language',
    languageDesc: 'Choose your preferred language',
    themeSettings: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    systemTheme: 'System',
    replayTour: 'App Tour',
    replayTourDesc: 'Replay the guided tour to learn about DoAm features',
    replayTourButton: 'Start Tour',

    // Goal Categories
    academicCareer: 'Academic / Career',
    health: 'Health',
    personalGrowth: 'Personal Growth',
    social: 'Social',
    spiritualMental: 'Spiritual / Mental',
    restRecreation: 'Rest & Recreation',
    academicCareerDesc: 'Studies, job skills, professional growth',
    healthDesc: 'Fitness, nutrition, medical checkups',
    personalGrowthDesc: 'Skills, hobbies, self-improvement',
    socialDesc: 'Relationships, community, networking',
    spiritualMentalDesc: 'Mindfulness, meditation, mental health',
    restRecreationDesc: 'Relaxation, entertainment, downtime',

    // Tour
    tourWelcome: 'Welcome to DoAm!',
    tourWelcomeDesc: 'Let us show you around. This quick tour will help you get the most out of your AI-powered system.',
    tourCalendar: 'Your Smart Calendar',
    tourCalendarDesc: 'Generate AI-powered schedules that respect your energy patterns. Tasks are placed at optimal times for peak productivity.',
    tourTasks: 'Manage Your Tasks',
    tourTasksDesc: 'Add tasks with priority and type. Deep work goes to high-energy hours, shallow tasks fill the gaps.',
    tourBrainDump: 'Brain Dump',
    tourBrainDumpDesc: 'Quickly capture thoughts and ideas. AI will help organize them into actionable tasks.',
    tourGoals: 'Set Your Goals',
    tourGoalsDesc: 'Define goals across 6 life areas. Your schedule will prioritize what matters most to you.',
    tourEnergy: 'Energy Awareness',
    tourEnergyDesc: 'Your schedule adapts to when you have the most energy. Morning person? Night owl? We adjust accordingly.',
    tourCommitments: 'Fixed Commitments',
    tourCommitmentsDesc: 'Block out classes, meetings, and non-negotiable time. Your schedule works around these.',
    tourSettings: 'Settings',
    tourSettingsDesc: 'Customize your energy profile, commitments, and preferences anytime.',
    tourComplete: "You're All Set!",
    tourCompleteDesc: 'Start generating your personalized schedule. DoAm will learn and improve with every day you use it.',
    skipTour: 'Skip tour',

    // Profile Section
    profileBiography: 'AI Biography',
    profileBiographyDesc: 'A personalized summary of who you are based on your goals and behavior.',
    profileRegenerate: 'Regenerate',
    profileRegenerating: 'Regenerating...',
    profileWhatWorks: 'What Works Best for You',
    profileWhatWorksDesc: 'Key patterns that help you succeed.',
    profileImproving: "What We're Improving Together",
    profileImprovingDesc: 'Areas we are working on together.',
    profileKeyTraits: 'Key Traits',
    profileFocusTime: 'Focus Time',
    profilePlanningStyle: 'Planning Style',
    profileTopPriorities: 'Top Priorities',
    profileOverview: 'Overview',
    profileEdit: 'Edit Profile',
    profileAboutYou: 'About You',
    profileBehavioral: 'Behavioral Patterns',
    profileAcademicLevel: 'Academic Level',
    profileFieldOfStudy: 'Field of Study',
    profileLongTermGoals: 'Long-term Aspirations',
    profileStrengths: 'Your Strengths',
    profileAreasToImprove: 'Areas to Improve',
    profileStudyHabits: 'Study/Work Habits',
    profileConsistencyLevel: 'Consistency Level',
    profileWorkStyle: 'Preferred Work Style',
    profileBlockers: 'Typical Blockers',
    profileSave: 'Save Profile',
    profileSaving: 'Saving...',
    profileSaved: 'Profile saved!',
    profileSaveError: 'Failed to save. Please try again.',
    profileBioUpdated: 'Biography updated!',
    profileBioError: 'Failed to regenerate. Please try again.',

    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Your AI-powered daily schedule',
    dashboardGenerateSchedule: 'Generate Schedule',
    dashboardGenerating: 'Generating...',
    dashboardCompleteSetup: 'Complete Your Setup',
    dashboardCompleteOnboarding: 'Complete onboarding to set energy profile',
    dashboardSetGoals: 'Set your goals in onboarding',
    dashboardAddTask: 'Add at least one task',
    dashboardNoSchedule: 'No schedule yet',
    dashboardNoScheduleDesc: 'Click "Generate Schedule" to let AI plan your day based on your goals and energy',
    dashboardSubmitProof: 'Submit Proof',
    dashboardVerifyWithAI: 'Verify with AI',
    dashboardVerifying: 'Verifying...',
    dashboardProofVerified: 'Proof Verified!',
    dashboardProofFailed: 'Verification Failed',
    dashboardBreakTime: 'Break Time',
    dashboardScheduleGenerated: 'Your day has been optimally planned.',
    dashboardShowMore: 'See more',
    dashboardShowLess: 'Show less',

    // Errors & Notifications
    errorGeneric: 'Something went wrong',
    errorTryAgain: 'Please try again',
    successSaved: 'Saved successfully!',
    progressSaved: 'Your progress is saved.',
  },
  pidgin: {
    // Common
    getStarted: 'Make We Start',
    signIn: 'Enter',
    signUp: 'Join Us',
    continueWithGoogle: 'Use Google Enter',
    back: 'Go Back',
    next: 'Next',
    skip: 'Skip Am',
    save: 'Save Am',
    saveAndContinue: 'Save Am & Continue',
    saving: 'Dey Save...',
    cancel: 'Cancel',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',

    // Landing page
    heroTagline: 'Stop dragging — just DoAm.',
    heroDescription: 'AI system wey dey built for students — e follow how your life dey, no be perfect routine.',
    seeHowItWorks: 'See How E Dey Work',
    soundFamiliar: 'This one sound like you?',
    mostToolsFail: 'Most planning tools go make you fail.',
    problem1Title: '"Planning too much for my head."',
    problem1Desc: 'List wey no dey finish, e dey grow pass as you fit tick am. Where you go start from?',
    problem2Title: '"Schedules no fit survive real life."',
    problem2Desc: 'Perfect plans wey go scatter by Tuesday. Class, surprises, energy dey low — life happen.',
    problem3Title: '"You know your goals — but when?"',
    problem3Desc: 'You wan study, exercise, rest, and grow. But when? And how much? Na the hard part be that.',
    solutionTitle: 'DoAm go do the hard part for you',
    solutionDesc: 'Instead to dey fill calendar, you just tell DoAm who you be. E go build schedule wey fit you.',
    step1Title: 'E understand who you be',
    step1Desc: 'Your goals, your energy pattern, your non-negotiables. DoAm learn your priorities.',
    step2Title: 'E map your real available time',
    step2Desc: 'Class, sleep, and life dey protected. DoAm work with wetin remain.',
    step3Title: 'E break goals into actions',
    step3Desc: 'Big goals become small tasks wey fit enter your day.',
    step4Title: 'E adjust when life change',
    step4Desc: 'You miss something? DoAm go adjust — no guilt, no judgment. Just new plan.',
    calendarTitle: 'Calendar wey think with you',
    calendarDesc: 'No just scheduler. Na system wey understand how life work.',
    featuresTitle: 'Main Features',
    featureGoalDriven: 'Goal-Driven',
    featureGoalDrivenDesc: 'Goals automatic become time blocks. No manual planning.',
    featureEnergyAware: 'Energy-Aware',
    featureEnergyAwareDesc: 'Study when your focus high. Rest when you need am.',
    featureProtectedTime: 'Protected Time',
    featureProtectedTimeDesc: 'Class, sleep, and life dey locked. AI no fit touch am.',
    featureAdaptive: 'Adaptive',
    featureAdaptiveDesc: 'You miss task? DoAm go adjust. E learn from your pattern.',
    brainDumpTitle: 'Place to off-load your thoughts',
    brainDumpDesc: 'Before DoAm organize your day, use BrainDump empty your mind. Type everything — tasks, wahala, ideas. Then let AI turn am to action.',
    brainDumpBenefit1: 'Reduce mental load',
    brainDumpBenefit2: 'AI extract actionable tasks',
    brainDumpBenefit3: 'Connect to your calendar automatic',
    howItWorksTitle: 'Start am for few minutes',
    howItWorksDesc: 'No complex setup. Just answer small questions.',
    howStep1Title: 'Define six key areas of your life',
    howStep1Desc: 'Pick wetin matter for your six core life areas',
    howStep2Title: 'Input your classes, sleep, and all fixed, non-negotiable commitments',
    howStep2Desc: 'Lock everything wey you no fit move so DoAm go plan around your real life',
    howStep3Title: 'Generate schedule',
    howStep3Desc: 'Make DoAm build your calendar',
    howStep4Title: 'Follow & adjust',
    howStep4Desc: 'Complete tasks, skip if you need',
    trustTitle: 'You dey always in control',
    trustDesc: 'DoAm na recommendation system, no be dictator.',
    trust1: 'AI recommend — you decide',
    trust2: 'Adjust anytime, no judgment',
    trust3: 'Your priorities, your pace',
    ctaTitle: 'Build schedule wey work for real life',
    ctaDesc: 'Stop to dey fight your calendar. Start to work with am.',
    ctaButton: 'Start with DoAm',
    footerTagline: 'Built for students wey wan schedules wey actually work.',

    // Flow labels
    flowIdentity: 'Identity',
    flowIdentityDesc: 'Who you be',
    flowTime: 'Time',
    flowTimeDesc: 'Wetin dey available',
    flowActions: 'Actions',
    flowActionsDesc: 'Wetin to do',
    flowSchedule: 'Schedule',
    flowScheduleDesc: 'When to do am',

    // Auth
    authWelcome: 'DoAm',
    authDescription: 'AI scheduling for your goals and priorities',
    authAgreement: 'If you sign up, you agree make DoAm help you achieve your goals',

    // Onboarding - Welcome
    onboardingWelcomeTitle: 'Welcome to DoAm',
    onboardingWelcomeDesc: 'We go ask small questions so we fit plan your time well. E go take like 3-5 minutes.',
    onboardingWelcomeWhat: 'DoAm dey help you turn your goals to correct plan — the way your life be.',
    onboardingTimeEstimate: '3-5 minutes',
    onboardingFeature1Title: 'Set Your Goals',
    onboardingFeature1Desc: 'Define goals for 6 life areas: academics, health, growth, social, spiritual, and rest.',
    onboardingFeature2Title: 'Know Your Energy',
    onboardingFeature2Desc: 'Tell us when your head dey sharp so we fit schedule well.',
    onboardingFeature3Title: 'Lock Your Commitments',
    onboardingFeature3Desc: 'Add class, work, and other things wey no fit move.',
    onboardingFeature4Title: 'AI-Powered Scheduling',
    onboardingFeature4Desc: 'Get schedule wey respect your priorities.',

    // Onboarding - Goals
    onboardingGoalsTitle: 'Make We Set Your Goals',
    onboardingGoalsDesc: 'Set one goal for each life area. You fit skip any wey you no want!',
    onboardingGoalsWhy: 'Your plan go follow wetin matter to you.',
    onboardingGoalsSmart: 'Set SMART goals for better results.',
    onboardingPriorityTitle: 'Rank Your Priorities',
    onboardingPriorityDesc: 'Tap to reorder (1 = most important)',
    onboardingPriorityWhy: 'If time jam time, we go hold the higher one first.',

    // Onboarding - Energy
    onboardingEnergyTitle: 'Your Energy Profile',
    onboardingEnergyDesc: 'This one help us know when your head sharp.',
    onboardingEnergyWhy: 'We go place hard tasks when your brain work best.',
    onboardingChronotypeTitle: 'You be morning person or night owl?',
    earlyBird: 'Early Bird',
    earlyBirdDesc: 'I wake up early and my head sharp for morning',
    nightOwl: 'Night Owl',
    nightOwlDesc: 'I come alive for evening and work best for night',
    neutral: 'Middle Ground',
    neutralDesc: 'My energy dey consistent throughout the day',
    sleepSchedule: 'Sleep Schedule',
    wakeTime: 'Wake Up Time',
    bedtime: 'Bedtime',
    focusPeriods: 'Focus Periods',
    focusPeriodsDesc: 'When your energy dey highest for deep work?',
    highFocusPeriod: 'High Focus Period',
    lowEnergyPeriod: 'Low Energy Period',

    // Onboarding - Commitments
    onboardingCommitmentsTitle: 'Fixed Commitments',
    onboardingCommitmentsDesc: 'Add your time blocks wey no fit move. Anything you lock here, we no go touch am.',
    onboardingCommitmentsWhy: 'Anything you lock here, we no go touch am. Ever.',
    addCommitment: 'Add Commitment',
    lockCommitment: 'Lock this one (e no fit move)',
    startTime: 'Start Time',
    endTime: 'End Time',

    // Onboarding - Complete
    onboardingCompleteTitle: 'You Don Set!',
    onboardingCompleteDesc: 'Your scheduling profile don ready. We go turn your goals to action and build your calendar the way your life be.',
    onboardingWhatsNext: 'Wetin Next?',
    onboardingNext1: 'Add your tasks for Tasks page',
    onboardingNext2: 'Generate your schedule for Dashboard',
    onboardingNext3: 'DoAm go match tasks to your energy levels',
    onboardingNext4: 'Complete tasks and track your progress',
    goToDashboard: 'Go to Dashboard',

    // Task Nudges
    missedTask: 'You never DoAm today?',
    taskPending: 'This one still dey wait for you',
    stayConsistent: 'Active! Make sure you DoAm.',
    doingGreat: 'You dey try, no slack',
    itsOkay: 'No wahala, we go adjust am',
    tryAgainTomorrow: 'Make we run am again tomorrow',

    // Calendar
    scheduleUpdated: 'We don update your plan',
    timeProtected: 'This time na your own',
    today: 'Today',
    peakFocus: 'Peak Focus',
    protectedSleep: 'Protected Sleep',

    // Settings
    settingsTitle: 'Settings',
    energyProfile: 'Energy Profile',
    commitments: 'Commitments',
    goals: 'Goals',
    languageSettings: 'Language',
    languageDesc: 'Choose the language wey you prefer',
    themeSettings: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    systemTheme: 'System',
    replayTour: 'App Tour',
    replayTourDesc: 'Replay the guided tour to learn about DoAm features',
    replayTourButton: 'Start Tour',

    // Goal Categories
    academicCareer: 'Academic / Career',
    health: 'Health',
    personalGrowth: 'Personal Growth',
    social: 'Social',
    spiritualMental: 'Spiritual / Mental',
    restRecreation: 'Rest & Recreation',
    academicCareerDesc: 'Studies, job skills, professional growth',
    healthDesc: 'Fitness, nutrition, medical checkups',
    personalGrowthDesc: 'Skills, hobbies, self-improvement',
    socialDesc: 'Relationships, community, networking',
    spiritualMentalDesc: 'Mindfulness, meditation, mental health',
    restRecreationDesc: 'Relaxation, entertainment, downtime',

    // Tour
    tourWelcome: 'Welcome to DoAm!',
    tourWelcomeDesc: 'Make we show you around. This quick tour go help you get the most from your AI calendar.',
    tourCalendar: 'Your Smart Calendar',
    tourCalendarDesc: 'Generate AI-powered schedules wey respect your energy patterns. Tasks dey placed for optimal times.',
    tourTasks: 'Manage Your Tasks',
    tourTasksDesc: 'Add tasks with priority and type. Deep work go to high-energy hours, shallow tasks fill the gaps.',
    tourBrainDump: 'Brain Dump',
    tourBrainDumpDesc: 'Quickly capture your thoughts and ideas. AI go help organize them into actionable tasks.',
    tourGoals: 'Set Your Goals',
    tourGoalsDesc: 'Define goals across 6 life areas. Your schedule go prioritize wetin matter most to you.',
    tourEnergy: 'Energy Awareness',
    tourEnergyDesc: 'Your schedule dey adapt to when you get the most energy. Morning person? Night owl? We adjust.',
    tourCommitments: 'Fixed Commitments',
    tourCommitmentsDesc: 'Block out classes, meetings, and non-negotiable time. Your schedule work around these.',
    tourSettings: 'Settings',
    tourSettingsDesc: 'Customize your energy profile, commitments, and preferences anytime.',
    tourComplete: 'You Don Ready!',
    tourCompleteDesc: 'Start generating your personalized schedule. DoAm go learn and improve everyday.',
    skipTour: 'Skip tour',

    // Profile Section
    profileBiography: 'AI Biography',
    profileBiographyDesc: 'Personalized summary of who you be based on your goals and behavior.',
    profileRegenerate: 'Regenerate',
    profileRegenerating: 'Dey Regenerate...',
    profileWhatWorks: 'Wetin Dey Work For You',
    profileWhatWorksDesc: 'Key patterns wey dey help you succeed.',
    profileImproving: 'Wetin We Dey Improve Together',
    profileImprovingDesc: 'Areas wey we dey work on together.',
    profileKeyTraits: 'Key Traits',
    profileFocusTime: 'Focus Time',
    profilePlanningStyle: 'Planning Style',
    profileTopPriorities: 'Top Priorities',
    profileOverview: 'Overview',
    profileEdit: 'Edit Profile',
    profileAboutYou: 'About You',
    profileBehavioral: 'How You Work',
    profileAcademicLevel: 'Academic Level',
    profileFieldOfStudy: 'Field of Study',
    profileLongTermGoals: 'Long-term Goals',
    profileStrengths: 'Your Strengths',
    profileAreasToImprove: 'Areas You Dey Work On',
    profileStudyHabits: 'Study Habits',
    profileConsistencyLevel: 'Consistency Level',
    profileWorkStyle: 'Work Style',
    profileBlockers: 'Wetin Dey Block You',
    profileSave: 'Save Profile',
    profileSaving: 'Dey Save...',
    profileSaved: 'Profile don save!',
    profileSaveError: 'E no save. Try again.',
    profileBioUpdated: 'Biography don update!',
    profileBioError: 'E no work. Try again.',

    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Your AI-powered daily schedule',
    dashboardGenerateSchedule: 'Generate Schedule',
    dashboardGenerating: 'Dey Generate...',
    dashboardCompleteSetup: 'Complete Your Setup',
    dashboardCompleteOnboarding: 'Complete onboarding to set energy profile',
    dashboardSetGoals: 'Set your goals for onboarding',
    dashboardAddTask: 'Add at least one task',
    dashboardNoSchedule: 'No schedule yet',
    dashboardNoScheduleDesc: 'Click "Generate Schedule" make AI plan your day based on your goals and energy',
    dashboardSubmitProof: 'Submit Proof',
    dashboardVerifyWithAI: 'Verify with AI',
    dashboardVerifying: 'Dey Verify...',
    dashboardProofVerified: 'Proof Don Verify!',
    dashboardProofFailed: 'Verification Fail',
    dashboardBreakTime: 'Break Time',
    dashboardScheduleGenerated: 'We don plan your day well well.',
    dashboardShowMore: 'See more',
    dashboardShowLess: 'Show less',

    // Errors & Notifications
    errorGeneric: 'Something no work well',
    errorTryAgain: 'Abeg try again',
    successSaved: 'E don save!',
    progressSaved: 'Your progress don save.',
  },
};
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = localStorage.getItem('doam-language');
    return (stored === 'pidgin' ? 'pidgin' : 'en') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') localStorage.setItem('doam-language', lang);
  };

  useEffect(() => {
    const stored = localStorage.getItem('doam-language');
    if (stored === 'pidgin' || stored === 'en') {
      setLanguageState(stored);
    }
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
