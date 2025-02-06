import { Event } from '../types';
import { getWeekDates, isDateInRange } from './dateUtils';

/**
 * 주어진 날짜 범위에 해당하는 이벤트들을 필터링해주는 함수.
 */
function filterEventsByDateRange(events: Event[], start: Date, end: Date): Event[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return isDateInRange(eventDate, start, end);
  });
}

/**
 * 주어진 문자열이 특정 텍스트를 포함하는지 확인해주는 함수.
 */
function containsTerm(target: string, term: string) {
  return target.toLowerCase().includes(term.toLowerCase());
}

/**
 * 주어진 이벤트 리스트에서 특정 텍스트를 포함하는 이벤트들을 찾아주는 함수.
 */
function searchEvents(events: Event[], term: string) {
  return events.filter(
    ({ title, description, location }) =>
      containsTerm(title, term) || containsTerm(description, term) || containsTerm(location, term)
  );
}

/**
 * 주어진 날짜에 해당하는 주의 이벤트들을 필터링해주는 함수.
 */
function filterEventsByDateRangeAtWeek(events: Event[], currentDate: Date) {
  const weekDates = getWeekDates(currentDate);
  return filterEventsByDateRange(events, weekDates[0], weekDates[6]);
}

/**
 * 주어진 날짜에 해당하는 월의 이벤트들을 필터링해주는 함수.
 */
function filterEventsByDateRangeAtMonth(events: Event[], currentDate: Date) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  return filterEventsByDateRange(events, monthStart, monthEnd);
}

/**
 * 주어진 이벤트 리스트를 검색어와 뷰에 따라 필터링해주는 함수.
 */
export function getFilteredEvents(
  events: Event[],
  searchTerm: string,
  currentDate: Date,
  view: 'week' | 'month'
): Event[] {
  const searchedEvents = searchEvents(events, searchTerm);

  if (view === 'week') {
    return filterEventsByDateRangeAtWeek(searchedEvents, currentDate);
  }

  if (view === 'month') {
    return filterEventsByDateRangeAtMonth(searchedEvents, currentDate);
  }

  return searchedEvents;
}
