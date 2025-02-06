import { Event, EventForm } from '../../types';
import {
  convertEventToDateRange,
  findOverlappingEvents,
  isOverlapping,
  parseDateTime,
} from '../../utils/eventOverlap';

describe('parseDateTime', () => {
  it('2024-07-01 14:30을 정확한 Date 객체로 변환한다', () => {
    const date = parseDateTime('2024-07-01', '14:30');
    expect(date).toEqual(new Date('2024-07-01T14:30:00'));
  });

  it('잘못된 날짜 형식에 대해 Invalid Date를 반환한다', () => {
    const date = parseDateTime('2024-13-01', '14:30');
    expect(date.toString()).toBe('Invalid Date');
  });

  it('잘못된 시간 형식에 대해 Invalid Date를 반환한다', () => {
    const date = parseDateTime('2024-07-01', '25:00');
    expect(date.toString()).toBe('Invalid Date');
  });

  it('날짜 문자열이 비어있을 때 Invalid Date를 반환한다', () => {
    const date = parseDateTime('', '14:30');
    expect(date.toString()).toBe('Invalid Date');
  });
});

describe('convertEventToDateRange', () => {
  const sampleEvent: EventForm = {
    title: '테스트 이벤트',
    date: '2024-07-01',
    startTime: '14:30',
    endTime: '15:30',
    description: '테스트',
    location: '서울',
    category: '회의',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 30,
  };

  it('일반적인 이벤트를 올바른 시작 및 종료 시간을 가진 객체로 변환한다', () => {
    const range = convertEventToDateRange(sampleEvent);
    expect(range.start).toEqual(new Date('2024-07-01T14:30:00'));
    expect(range.end).toEqual(new Date('2024-07-01T15:30:00'));
  });

  it('잘못된 날짜 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const invalidEvent = { ...sampleEvent, date: '2024-13-01' };
    const range = convertEventToDateRange(invalidEvent);
    expect(range.start.toString()).toBe('Invalid Date');
    expect(range.end.toString()).toBe('Invalid Date');
  });

  it('잘못된 시간 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const invalidEvent = { ...sampleEvent, startTime: '25:00' };
    const range = convertEventToDateRange(invalidEvent);
    expect(range.start.toString()).toBe('Invalid Date');
  });
});

describe('isOverlapping', () => {
  const event1: EventForm = {
    title: '이벤트 1',
    date: '2024-07-01',
    startTime: '14:00',
    endTime: '16:00',
    description: '',
    location: '',
    category: '',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 0,
  };

  const event2: EventForm = {
    title: '이벤트 2',
    date: '2024-07-01',
    startTime: '15:00',
    endTime: '17:00',
    description: '',
    location: '',
    category: '',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 0,
  };

  const event3: EventForm = {
    title: '이벤트 3',
    date: '2024-07-01',
    startTime: '17:00',
    endTime: '18:00',
    description: '',
    location: '',
    category: '',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 0,
  };

  it('두 이벤트가 겹치는 경우 true를 반환한다', () => {
    expect(isOverlapping(event1, event2)).toBe(true);
  });

  it('두 이벤트가 겹치지 않는 경우 false를 반환한다', () => {
    expect(isOverlapping(event1, event3)).toBe(false);
  });
});

describe('findOverlappingEvents', () => {
  const existingEvents: Event[] = [
    {
      id: '1',
      title: '이벤트 1',
      date: '2024-07-01',
      startTime: '14:00',
      endTime: '16:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 0,
    },
    {
      id: '2',
      title: '이벤트 2',
      date: '2024-07-01',
      startTime: '17:00',
      endTime: '18:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 0,
    },
  ];

  const newEvent: EventForm = {
    title: '새 이벤트',
    date: '2024-07-01',
    startTime: '15:00',
    endTime: '17:00',
    description: '',
    location: '',
    category: '',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 0,
  };

  it('새 이벤트와 겹치는 모든 이벤트를 반환한다', () => {
    const overlapping = findOverlappingEvents(newEvent, existingEvents);
    expect(overlapping).toHaveLength(1);
    expect(overlapping[0].id).toBe('1');
  });

  it('겹치는 이벤트가 없으면 빈 배열을 반환한다', () => {
    const nonOverlappingEvent: EventForm = {
      ...newEvent,
      startTime: '18:30',
      endTime: '19:30',
    };
    const overlapping = findOverlappingEvents(nonOverlappingEvent, existingEvents);
    expect(overlapping).toHaveLength(0);
  });
});
