import { fillZero } from '../utils/dateUtils';

/**
 * 두 날짜가 같은지 확인하는 테스트 유틸 함수
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 */
export const assertDate = (date1: Date, date2: Date) => {
  expect(date1.toISOString()).toBe(date2.toISOString());
};

/**
 * 시간을 HH:MM 형식으로 변환하는 함수
 * @param timestamp - 시간 (밀리초)
 * @returns HH:MM 형식의 문자열
 */
export const parseHM = (timestamp: number) => {
  const date = new Date(timestamp);
  const h = fillZero(date.getHours());
  const m = fillZero(date.getMinutes());
  return `${h}:${m}`;
};
