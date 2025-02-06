import { Event } from '../../types';
import { createNotificationMessage, getUpcomingEvents } from '../../utils/notificationUtils';

describe('getUpcomingEvents', () => {
  const baseEvent: Event = {
    id: '1',
    title: '테스트 이벤트',
    date: '2024-07-01',
    startTime: '14:00',
    endTime: '15:00',
    description: '테스트',
    location: '서울',
    category: '회의',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 30,
  };

  const now = new Date('2024-07-01T13:35:00'); // 13시 35분

  it('알림 시간이 정확히 도래한 이벤트를 반환한다', () => {
    const events = [
      {
        ...baseEvent,
        id: '1',
        startTime: '14:00', // 25분 후 시작
        notificationTime: 30, // 30분 전 알림
      },
    ];

    const upcomingEvents = getUpcomingEvents(events, now, []);
    expect(upcomingEvents).toHaveLength(1);
    expect(upcomingEvents[0].id).toBe('1');
  });

  it('이미 알림이 간 이벤트는 제외한다', () => {
    const events = [
      {
        ...baseEvent,
        id: '1',
        startTime: '14:00',
        notificationTime: 30,
      },
    ];

    const notifiedEvents = ['1'];
    const upcomingEvents = getUpcomingEvents(events, now, notifiedEvents);
    expect(upcomingEvents).toHaveLength(0);
  });

  it('알림 시간이 아직 도래하지 않은 이벤트는 반환하지 않는다', () => {
    const events = [
      {
        ...baseEvent,
        id: '1',
        startTime: '15:00', // 1시간 25분 후 시작
        notificationTime: 60, // 60분 전 알림
      },
    ];

    const upcomingEvents = getUpcomingEvents(events, now, []);
    expect(upcomingEvents).toHaveLength(0);
  });

  it('알림 시간이 지난 이벤트는 반환하지 않는다', () => {
    const events = [
      {
        ...baseEvent,
        id: '1',
        startTime: '13:20', // 10분 지난 알림
        notificationTime: 30, // 30분 전 알림
      },
    ];

    const upcomingEvents = getUpcomingEvents(events, now, []);
    expect(upcomingEvents).toHaveLength(0);
  });

  it('여러 이벤트 중 알림 조건에 맞는 이벤트만 반환한다', () => {
    const events = [
      {
        ...baseEvent,
        id: '1',
        startTime: '14:00', // 25분 후 시작
        notificationTime: 30, // 30분 전 알림
      },
      {
        ...baseEvent,
        id: '2',
        startTime: '15:00', // 1시간 25분 후 시작
        notificationTime: 30, // 30분 전 알림
      },
      {
        ...baseEvent,
        id: '3',
        startTime: '13:40', // 5분 후 시작
        notificationTime: 30, // 30분 전 알림
      },
    ];

    const upcomingEvents = getUpcomingEvents(events, now, []);
    expect(upcomingEvents).toHaveLength(2);
    expect(upcomingEvents[0].id).toBe('1');
  });
});

describe('createNotificationMessage', () => {
  it('올바른 알림 메시지를 생성해야 한다', () => {
    const event: Event = {
      id: '1',
      title: '중요 회의',
      date: '2024-07-01',
      startTime: '14:00',
      endTime: '15:00',
      description: '테스트',
      location: '서울',
      category: '회의',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 30,
    };

    const message = createNotificationMessage(event);
    expect(message).toBe('30분 후 중요 회의 일정이 시작됩니다.');
  });

  it('다양한 알림 시간에 대해 올바른 메시지를 생성한다', () => {
    const events: Event[] = [
      {
        ...{
          id: '1',
          title: '회의',
          date: '2024-07-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '테스트',
          location: '서울',
          category: '회의',
          repeat: { type: 'none', interval: 1 },
        },
        notificationTime: 15,
        title: '15분 알림 회의',
      },
      {
        ...{
          id: '2',
          title: '회의',
          date: '2024-07-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '테스트',
          location: '서울',
          category: '회의',
          repeat: { type: 'none', interval: 1 },
        },
        notificationTime: 60,
        title: '1시간 알림 회의',
      },
    ];

    expect(createNotificationMessage(events[0])).toBe('15분 후 15분 알림 회의 일정이 시작됩니다.');
    expect(createNotificationMessage(events[1])).toBe('60분 후 1시간 알림 회의 일정이 시작됩니다.');
  });
});
