export type GreetingTimeBand = 'morning' | 'afternoon' | 'evening' | 'night';

export const getGreetingTimeBand = (date: Date): GreetingTimeBand => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'afternoon';
  if (hour >= 15 && hour < 18) return 'evening';
  return 'night';
};

export const getNextGreetingBoundary = (date: Date): Date => {
  const boundaries = [5, 11, 15, 18]
    .map((hour) => {
      const boundary = new Date(date);
      boundary.setHours(hour, 0, 0, 0);
      return boundary;
    })
    .find((boundary) => boundary.getTime() > date.getTime());

  if (boundaries) return boundaries;

  const nextMorning = new Date(date);
  nextMorning.setDate(nextMorning.getDate() + 1);
  nextMorning.setHours(5, 0, 0, 0);
  return nextMorning;
};