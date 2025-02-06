import { Event } from '../../types';
import { getFilteredEvents } from '../../utils/eventUtils';

describe('getFilteredEvents', () => {
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: '이벤트 1',
      date: '2024-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '첫 번째 이벤트입니다',
      location: '서울',
      category: '회의',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 30,
    },
    {
      id: '2',
      title: '이벤트 2',
      date: '2024-07-03',
      startTime: '14:00',
      endTime: '15:00',
      description: '두 번째 이벤트입니다',
      location: '부산',
      category: '미팅',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 15,
    },
    {
      id: '3',
      title: 'Event Three',
      date: '2024-07-15',
      startTime: '16:00',
      endTime: '17:00',
      description: '세 번째 이벤트입니다',
      location: '대전',
      category: '미팅',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 0,
    },
  ];

  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    const filtered = getFilteredEvents(sampleEvents, '이벤트 2', new Date('2024-07-01'), 'month');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('이벤트 2');
  });

  it('주간 뷰에서 2024-07-01 주의 이벤트만 반환한다', () => {
    const filtered = getFilteredEvents(sampleEvents, '', new Date('2024-07-01'), 'week');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['1', '2']);
  });

  it('월간 뷰에서 2024년 7월의 모든 이벤트를 반환한다', () => {
    const filtered = getFilteredEvents(sampleEvents, '', new Date('2024-07-01'), 'month');
    expect(filtered).toHaveLength(3);
    expect(filtered.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it("검색어 '이벤트'와 주간 뷰 필터링을 동시에 적용한다", () => {
    const filtered = getFilteredEvents(sampleEvents, '이벤트', new Date('2024-07-01'), 'week');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2']);
  });

  it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
    const filtered = getFilteredEvents(sampleEvents, '', new Date('2024-07-01'), 'month');
    expect(filtered).toHaveLength(3);
  });

  it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
    const filtered = getFilteredEvents(sampleEvents, 'EVENT', new Date('2024-07-01'), 'month');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Event Three');
  });

  it('월의 경계에 있는 이벤트를 올바르게 필터링한다', () => {
    const eventsAtMonthBoundary: Event[] = [
      {
        id: '4',
        title: '월말 이벤트',
        date: '2024-07-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '월말 이벤트입니다',
        location: '서울',
        category: '회의',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 30,
      },
      {
        id: '5',
        title: '다음달 이벤트',
        date: '2024-08-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '다음달 이벤트입니다',
        location: '서울',
        category: '회의',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 30,
      },
    ];

    const filtered = getFilteredEvents(eventsAtMonthBoundary, '', new Date('2024-07-31'), 'month');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('4');
  });

  it('빈 이벤트 리스트에 대해 빈 배열을 반환한다', () => {
    const filtered = getFilteredEvents([], '', new Date('2024-07-01'), 'month');
    expect(filtered).toHaveLength(0);
    expect(filtered).toEqual([]);
  });
});
