import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export function startDayliTour(options?: { onComplete?: () => void }) {
  if (typeof window === 'undefined') return;

  const isMobile = window.innerWidth < 768;

  // Curated tour steps covering Dayli's core workflows
  const steps: DriveStep[] = [
    {
      element: isMobile ? '#tour-views-mobile' : '#tour-views',
      popover: {
        title: 'Switch Calendar Views',
        description: 'Seamlessly toggle between Day, Week, and Month views. You can also press M, W, or D on your keyboard.',
        side: isMobile ? 'top' : 'bottom',
        align: isMobile ? 'center' : 'start',
      },
    },
    {
      element: '#tour-smart-schedule',
      popover: {
        title: 'Smart Schedule (Quick-Add)',
        description: 'Type plain English like "Dinner with Alex tomorrow 7pm at Bistro" and Dayli extracts the title, date, time, and location.',
        side: isMobile ? 'top' : 'right',
        align: isMobile ? 'center' : 'start',
      },
    },
    {
      element: isMobile ? '#tour-fab-new' : '#tour-new-event',
      popover: {
        title: 'Create Events Instantly',
        description: 'Click anywhere on the calendar or press N to open the full event creator with categories, colors, and repeat options.',
        side: isMobile ? 'top' : 'bottom',
        align: isMobile ? 'center' : 'end',
      },
    },
    {
      element: isMobile ? '#tour-tasks-mobile' : '#tour-tasks-header',
      popover: {
        title: 'Tasks & Reminders Drawer',
        description: 'Keep your to-do checklist alongside your calendar. Set due dates, organize by category, and mark tasks complete.',
        side: isMobile ? 'top' : 'bottom',
        align: isMobile ? 'center' : 'end',
      },
    },
    {
      element: '#tour-calendars',
      popover: {
        title: 'Custom Calendars & Holidays',
        description: 'Filter categories with one click. Official national public holidays are built-in and can be adjusted in settings.',
        side: isMobile ? 'bottom' : 'right',
        align: 'start',
      },
    },
    {
      element: '#tour-chatbot',
      popover: {
        title: 'Dayli AI Assistant',
        description: 'Your personal calendar assistant. Ask questions about your day, check for free time, or schedule meetings with a single tap.',
        side: isMobile ? 'top' : 'left',
        align: isMobile ? 'center' : 'end',
      },
    },
  ];

  // Filter steps to only include elements that exist in the DOM right now
  const availableSteps = steps.filter((step) => {
    if (!step.element || typeof step.element !== 'string') return true;
    return Boolean(document.querySelector(step.element));
  });

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(0, 0, 0, 0.72)',
    stagePadding: 6,
    stageRadius: 10,
    popoverClass: 'dayli-tour-popover',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    onDestroyStarted: () => {
      driverObj.destroy();
      options?.onComplete?.();
    },
    steps: availableSteps.length > 0 ? availableSteps : steps,
  });

  driverObj.drive();
}

