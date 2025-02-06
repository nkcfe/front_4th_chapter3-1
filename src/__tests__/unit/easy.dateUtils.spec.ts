import { Event } from '../../types';
import {
  fillZero,
  formatDate,
  formatMonth,
  formatWeek,
  getDaysInMonth,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
  isDateInRange,
} from '../../utils/dateUtils';

describe('getDaysInMonth', () => {
  it('1월은 31일 수를 반환한다', () => {
    expect(getDaysInMonth(2024, 1)).toBe(31);
  });

  it('4월은 30일 일수를 반환한다', () => {
    expect(getDaysInMonth(2024, 4)).toBe(30);
  });

  it('윤년의 2월에 대해 29일을 반환한다', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29);
  });

  it('평년의 2월에 대해 28일을 반환한다', () => {
    expect(getDaysInMonth(2023, 2)).toBe(28);
  });

  it('유효하지 않은 월에 대해 적절히 처리한다', () => {
    expect(getDaysInMonth(2024, 13)).toBe(0);
  });
});

describe('getWeekDates', () => {
  it('주중의 날짜(수요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date('2025-02-07');
    expect(getWeekDates(date)).toEqual([
      new Date('2025-02-02'),
      new Date('2025-02-03'),
      new Date('2025-02-04'),
      new Date('2025-02-05'),
      new Date('2025-02-06'),
      new Date('2025-02-07'),
      new Date('2025-02-08'),
    ]);
  });

  it('주의 시작(월요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date('2025-02-03');
    expect(getWeekDates(date)).toEqual([
      new Date('2025-02-02'),
      new Date('2025-02-03'),
      new Date('2025-02-04'),
      new Date('2025-02-05'),
      new Date('2025-02-06'),
      new Date('2025-02-07'),
      new Date('2025-02-08'),
    ]);
  });

  it('주의 끝(일요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date('2025-02-09');
    expect(getWeekDates(date)).toEqual([
      new Date('2025-02-09'),
      new Date('2025-02-10'),
      new Date('2025-02-11'),
      new Date('2025-02-12'),
      new Date('2025-02-13'),
      new Date('2025-02-14'),
      new Date('2025-02-15'),
    ]);
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연말)', () => {
    const date = new Date('2024-12-31');
    expect(getWeekDates(date)).toEqual([
      new Date('2024-12-29'),
      new Date('2024-12-30'),
      new Date('2024-12-31'),
      new Date('2025-01-01'),
      new Date('2025-01-02'),
      new Date('2025-01-03'),
      new Date('2025-01-04'),
    ]);
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연초)', () => {
    const date = new Date('2025-01-01');
    expect(getWeekDates(date)).toEqual([
      new Date('2024-12-29'),
      new Date('2024-12-30'),
      new Date('2024-12-31'),
      new Date('2025-01-01'),
      new Date('2025-01-02'),
      new Date('2025-01-03'),
      new Date('2025-01-04'),
    ]);
  });

  it('윤년의 2월 29일을 포함한 주를 올바르게 처리한다', () => {
    const date = new Date('2024-02-29');
    expect(getWeekDates(date)).toEqual([
      new Date('2024-02-25'),
      new Date('2024-02-26'),
      new Date('2024-02-27'),
      new Date('2024-02-28'),
      new Date('2024-02-29'),
      new Date('2024-03-01'),
      new Date('2024-03-02'),
    ]);
  });

  it('월의 마지막 날짜를 포함한 주를 올바르게 처리한다', () => {
    const date = new Date('2024-04-30');
    expect(getWeekDates(date)).toEqual([
      new Date('2024-04-28'),
      new Date('2024-04-29'),
      new Date('2024-04-30'),
      new Date('2024-05-01'),
      new Date('2024-05-02'),
      new Date('2024-05-03'),
      new Date('2024-05-04'),
    ]);
  });
});

describe('getWeeksAtMonth', () => {
  it('2024년 7월 1일의 올바른 주 정보를 반환해야 한다', () => {
    const date = new Date('2024-07-01');
    expect(getWeeksAtMonth(date)).toEqual([
      [null, 1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12, 13],
      [14, 15, 16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25, 26, 27],
      [28, 29, 30, 31, null, null, null],
    ]);
  });
});

describe('getEventsForDay', () => {
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Event 1',
      date: '2024-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '첫 번째 이벤트',
      location: '서울',
      category: '회의',
      repeat: {
        type: 'none',
        interval: 1,
      },
      notificationTime: 30,
    },
    {
      id: '2',
      title: 'Event 2',
      date: '2024-07-02',
      startTime: '14:00',
      endTime: '15:00',
      description: '두 번째 이벤트',
      location: '부산',
      category: '미팅',
      repeat: {
        type: 'none',
        interval: 1,
      },
      notificationTime: 15,
    },
    {
      id: '3',
      title: 'Event 3',
      date: '2024-07-01',
      startTime: '16:00',
      endTime: '17:00',
      description: '세 번째 이벤트',
      location: '대전',
      category: '미팅',
      repeat: {
        type: 'none',
        interval: 1,
      },
      notificationTime: 0,
    },
  ];

  it('특정 날짜(1일)에 해당하는 이벤트만 정확히 반환한다', () => {
    const result = getEventsForDay(sampleEvents, 1);
    expect(result).toHaveLength(2);
    expect(result).toEqual([sampleEvents[0], sampleEvents[2]]);
  });

  it('해당 날짜에 이벤트가 없을 경우 빈 배열을 반환한다', () => {
    expect(getEventsForDay(sampleEvents, 3)).toEqual([]);
  });

  it('날짜가 0일 경우 빈 배열을 반환한다', () => {
    expect(getEventsForDay(sampleEvents, 0)).toEqual([]);
  });

  it('날짜가 32일 이상인 경우 빈 배열을 반환한다', () => {
    expect(getEventsForDay(sampleEvents, 32)).toEqual([]);
  });
});

describe('formatWeek', () => {
  it('월의 중간 날짜에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2024-07-15'); // 7월 중순
    expect(formatWeek(date)).toBe('2024년 7월 3주');
  });

  it('월의 첫 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2024-07-01'); // 7월 1일 (월요일)
    expect(formatWeek(date)).toBe('2024년 7월 1주');
  });

  it('월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2024-07-31'); // 7월 31일 (수요일)
    expect(formatWeek(date)).toBe('2024년 8월 1주');
  });

  it('연도가 바뀌는 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2024-12-31'); // 12월 31일 (화요일)
    expect(formatWeek(date)).toBe('2025년 1월 1주');
  });

  it('윤년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2024-02-29'); // 2024년은 윤년
    expect(formatWeek(date)).toBe('2024년 2월 5주');
  });

  it('평년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2023-02-28'); // 2023년은 평년
    expect(formatWeek(date)).toBe('2023년 3월 1주');
  });
});

describe('formatMonth', () => {
  it("2024년 7월 10일을 '2024년 7월'로 반환한다", () => {
    const date = new Date('2024-07-10');
    expect(formatMonth(date)).toBe('2024년 7월');
  });
});

describe('isDateInRange', () => {
  const rangeStart = new Date('2024-07-01');
  const rangeEnd = new Date('2024-07-31');

  it('범위 내의 날짜 2024-07-10에 대해 true를 반환한다', () => {
    const date = new Date('2024-07-10');
    expect(isDateInRange(date, rangeStart, rangeEnd)).toBe(true);
  });

  it('범위의 시작일 2024-07-01에 대해 true를 반환한다', () => {
    const date = new Date('2024-07-01');
    expect(isDateInRange(date, rangeStart, rangeEnd)).toBe(true);
  });

  it('범위의 종료일 2024-07-31에 대해 true를 반환한다', () => {
    const date = new Date('2024-07-31');
    expect(isDateInRange(date, rangeStart, rangeEnd)).toBe(true);
  });

  it('범위 이전의 날짜 2024-06-30에 대해 false를 반환한다', () => {
    const date = new Date('2024-06-30');
    expect(isDateInRange(date, rangeStart, rangeEnd)).toBe(false);
  });

  it('범위 이후의 날짜 2024-08-01에 대해 false를 반환한다', () => {
    const date = new Date('2024-08-01');
    expect(isDateInRange(date, rangeStart, rangeEnd)).toBe(false);
  });

  it('시작일이 종료일보다 늦은 경우 모든 날짜에 대해 false를 반환한다', () => {
    const date = new Date('2024-08-01');
    expect(isDateInRange(date, rangeEnd, rangeStart)).toBe(false);
  });
});

describe('fillZero', () => {
  it('5를 2자리로 변환하면 "05"를 반환한다', () => {
    expect(fillZero(5)).toBe('05');
  });

  it('10을 2자리로 변환하면 "10"을 반환한다', () => {
    expect(fillZero(10)).toBe('10');
  });

  it('3을 3자리로 변환하면 "003"을 반환한다', () => {
    expect(fillZero(3, 3)).toBe('003');
  });

  it('100을 2자리로 변환하면 "100"을 반환한다', () => {
    expect(fillZero(100)).toBe('100');
  });

  it('0을 2자리로 변환하면 "00"을 반환한다', () => {
    expect(fillZero(0)).toBe('00');
  });

  it('1을 5자리로 변환하면 "00001"을 반환한다', () => {
    expect(fillZero(1, 5)).toBe('00001');
  });

  it('소수점이 있는 3.14를 5자리로 변환하면 "03.14"를 반환한다', () => {
    expect(fillZero(3.14, 5)).toBe('03.14');
  });

  it('size 파라미터를 생략하면 기본값 2를 사용한다', () => {
    expect(fillZero(1)).toBe('01');
  });

  it('value가 지정된 size보다 큰 자릿수를 가지면 원래 값을 그대로 반환한다', () => {
    expect(fillZero(12345, 2)).toBe('12345');
  });
});

describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 포맷팅한다', () => {
    const date = new Date('2024-07-10');
    expect(formatDate(date)).toBe('2024-07-10');
  });

  it('day 파라미터가 제공되면 해당 일자로 포맷팅한다', () => {
    const date = new Date('2024-07-10');
    expect(formatDate(date, 15)).toBe('2024-07-15');
  });

  it('월이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const date = new Date('2024-7-10');
    expect(formatDate(date, 1)).toBe('2024-07-01');
  });

  it('일이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const date = new Date('2024-07-1');
    expect(formatDate(date, 1)).toBe('2024-07-01');
  });
});
