import { act, renderHook } from '@testing-library/react';

import { useNotifications } from '../../hooks/useNotifications.ts';
import { Event } from '../../types.ts';
import { formatDate } from '../../utils/dateUtils.ts';
import { parseHM } from '../utils.ts';

describe('useNotifications', () => {
  // 현재 시간을 고정하기 위한 setup
  beforeEach(() => {
    vi.setSystemTime(new Date('2024-10-01T10:00:00.000Z'));
  });

  it('초기 상태에서는 알림이 없어야 한다', () => {
    const events: Event[] = [];
    const { result } = renderHook(() => useNotifications(events));

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.notifiedEvents).toHaveLength(0);
  });

  it('지정된 시간이 된 경우 알림이 새롭게 생성되어 추가된다', () => {
    // 현재 시간으로부터 10분 후에 시작하는 이벤트
    const now = new Date();
    const events: Event[] = [
      {
        id: '1',
        title: '곧 시작할 회의',
        date: formatDate(now),
        startTime: parseHM(now.getTime() + 10 * 60 * 1000), // 10분 후
        endTime: parseHM(now.getTime() + 70 * 60 * 1000),
        description: '테스트 회의',
        location: '회의실 A',
        category: '회의',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10, // 10분 전에 알림
      },
    ];

    const { result } = renderHook(() => useNotifications(events));

    // 시간을 1초 진행
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual({
      id: '1',
      message: expect.stringContaining('곧 시작할 회의'),
    });
  });

  it('index를 기준으로 알림을 적절하게 제거할 수 있다', () => {
    const events: Event[] = [
      {
        id: '1',
        title: '테스트 회의',
        date: formatDate(new Date()),
        startTime: '10:10',
        endTime: '11:10',
        description: '테스트',
        location: '회의실',
        category: '회의',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ];

    const { result } = renderHook(() => useNotifications(events));

    // 알림 생성
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.notifications).toHaveLength(1);

    // 알림 제거
    act(() => {
      result.current.removeNotification(0);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('이미 알림이 발생한 이벤트에 대해서는 중복 알림이 발생하지 않아야 한다', () => {
    const now = new Date();
    const events: Event[] = [
      {
        id: '1',
        title: '중복 방지 테스트',
        date: formatDate(now),
        startTime: parseHM(now.getTime() + 10 * 60 * 1000),
        endTime: parseHM(now.getTime() + 70 * 60 * 1000),
        description: '테스트',
        location: '회의실',
        category: '회의',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ];

    const { result } = renderHook(() => useNotifications(events));

    // 첫 번째 알림 생성
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.notifications).toHaveLength(1);

    // 추가 시간 진행
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 알림 개수가 증가하지 않아야 함
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifiedEvents).toContain('1');
  });
});
