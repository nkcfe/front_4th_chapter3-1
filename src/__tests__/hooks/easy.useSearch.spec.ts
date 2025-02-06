import { act, renderHook } from '@testing-library/react';

import { useSearch } from '../../hooks/useSearch.ts';
import { Event } from '../../types.ts';

describe('useSearch', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-10-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const sampleEvents: Event[] = [
    {
      id: '1',
      title: '팀 회의',
      date: '2024-10-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '회의',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 30,
    },
    {
      id: '2',
      title: '점심 약속',
      date: '2024-10-02',
      startTime: '12:00',
      endTime: '13:00',
      description: '팀원들과 점심',
      location: '구내식당',
      category: '식사',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 15,
    },
    {
      id: '3',
      title: '고객 미팅',
      date: '2024-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '회의실 예약 필요',
      location: '회의실 B',
      category: '미팅',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 30,
    },
  ];

  it('검색어가 비어있을 때 모든 이벤트를 반환해야 한다', () => {
    const currentDate = new Date();

    const { result } = renderHook(() => useSearch(sampleEvents, currentDate, 'month'));

    expect(result.current.filteredEvents).toHaveLength(3);
    expect(result.current.searchTerm).toBe('');
  });

  it('검색어에 맞는 이벤트만 필터링해야 한다', async () => {
    const currentDate = new Date();

    const { result } = renderHook(() => useSearch(sampleEvents, currentDate, 'month'));

    await act(async () => {
      result.current.setSearchTerm('회의');
    });

    expect(result.current.filteredEvents).toHaveLength(2);
    expect(result.current.filteredEvents[0].title).toBe('팀 회의');
    expect(result.current.filteredEvents[1].title).toBe('고객 미팅');
  });

  it('검색어가 제목, 설명, 위치 중 하나라도 일치하면 해당 이벤트를 반환해야 한다', async () => {
    const currentDate = new Date();

    const { result } = renderHook(() => useSearch(sampleEvents, currentDate, 'month'));

    await act(async () => {
      result.current.setSearchTerm('회의실');
    });

    expect(result.current.filteredEvents).toHaveLength(2);
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(['1', '3']);
  });

  it('현재 뷰(주간/월간)에 해당하는 이벤트만 반환해야 한다', async () => {
    const currentDate = new Date('2024-10-01');

    // 월간 뷰 테스트
    const { result, rerender } = renderHook(() => useSearch(sampleEvents, currentDate, 'month'));

    // 리렌더링을 강제로 트리거
    await act(async () => {
      rerender();
    });

    expect(result.current.filteredEvents).toHaveLength(3);
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(['1', '2', '3']);

    // 주간 뷰 테스트
    const { result: weekResult, rerender: weekRerender } = renderHook(() =>
      useSearch(sampleEvents, currentDate, 'week')
    );

    await act(async () => {
      weekRerender();
    });

    expect(weekResult.current.filteredEvents).toHaveLength(2);
    expect(weekResult.current.filteredEvents.map((e) => e.id)).toEqual(['1', '2']);
  });

  it("검색어를 '회의'에서 '점심'으로 변경하면 필터링된 결과가 즉시 업데이트되어야 한다", async () => {
    const currentDate = new Date();

    const { result } = renderHook(() => useSearch(sampleEvents, currentDate, 'month'));

    await act(async () => {
      result.current.setSearchTerm('회의');
    });
    expect(result.current.filteredEvents).toHaveLength(2);
    expect(result.current.filteredEvents[0].title).toBe('팀 회의');
    expect(result.current.filteredEvents[1].title).toBe('고객 미팅');

    await act(async () => {
      result.current.setSearchTerm('점심');
    });
    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe('점심 약속');
  });
});
