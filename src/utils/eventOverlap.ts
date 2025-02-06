import { Event, EventForm } from '../types';

/**
 * 주어진 날짜와 시간을 Date 객체로 변환해주는 함수.
 */
export function parseDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`);
}

/**
 * 이벤트 데이터를 시작 및 종료 시간을 가진 객체로 변환해주는 함수.
 */
export function convertEventToDateRange({ date, startTime, endTime }: Event | EventForm) {
  return {
    start: parseDateTime(date, startTime),
    end: parseDateTime(date, endTime),
  };
}

/**
 * 두 이벤트가 겹치는지 확인해주는 함수.
 */
export function isOverlapping(event1: Event | EventForm, event2: Event | EventForm) {
  const { start: start1, end: end1 } = convertEventToDateRange(event1);
  const { start: start2, end: end2 } = convertEventToDateRange(event2);

  return start1 < end2 && start2 < end1;
}

/**
 * 새로운 이벤트와 기존 이벤트들 중 겹치는 이벤트들을 찾아주는 함수.
 */
export function findOverlappingEvents(newEvent: Event | EventForm, events: Event[]) {
  return events.filter(
    (event) => event.id !== (newEvent as Event).id && isOverlapping(event, newEvent)
  );
}
