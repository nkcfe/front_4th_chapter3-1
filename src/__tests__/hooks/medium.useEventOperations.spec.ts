import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils';
import { useEventOperations } from '../../hooks/useEventOperations';
import { server } from '../../setupTests';
import { Event, EventForm } from '../../types';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

describe('useEventOperations', () => {
  // 각 테스트 전에 toast mock 초기화
  beforeEach(() => {
    toastFn.mockClear();
  });

  it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
    const initialEvents: Event[] = [
      {
        id: '1',
        title: '테스트 이벤트',
        date: '2024-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '테스트',
        repeat: {
          type: 'none',
          interval: 0,
        },
        notificationTime: 10,
      },
    ];

    setupMockHandlerCreation(initialEvents);

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.events).toEqual(initialEvents);
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정 로딩 완료!',
        status: 'info',
      })
    );
  });

  it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
    setupMockHandlerCreation();

    const newEvent: EventForm = {
      title: '새로운 회의',
      date: '2024-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 킥오프 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 15,
    };

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    expect(result.current.events[0]).toMatchObject(
      expect.objectContaining({
        ...newEvent,
        id: '1',
      })
    );
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정이 추가되었습니다.',
        status: 'success',
      })
    );
  });

  it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
    setupMockHandlerUpdating();

    const updatedEvent = {
      id: '1',
      title: '수정된 회의',
      endTime: '11:00',
    };

    const { result } = renderHook(() => useEventOperations(true));

    await act(async () => {
      await result.current.saveEvent(updatedEvent as Event);
    });

    const updatedEventInList = result.current.events.find((e) => e.id === '1');
    expect(updatedEventInList?.title).toBe('수정된 회의');
    expect(updatedEventInList?.endTime).toBe('11:00');
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정이 수정되었습니다.',
        status: 'success',
      })
    );
  });

  it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다', async () => {
    setupMockHandlerDeletion();

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(result.current.events).toHaveLength(0);
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정이 삭제되었습니다.',
        status: 'info',
      })
    );
  });

  it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
    server.use(
      http.get('/api/events', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '이벤트 로딩 실패',
        status: 'error',
      })
    );
  });

  it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
    server.use(
      http.put('/api/events/:id', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const { result } = renderHook(() => useEventOperations(true));

    await act(async () => {
      await result.current.saveEvent({
        id: '999',
        title: '존재하지 않는 이벤트',
      } as Event);
    });

    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정 저장 실패',
        status: 'error',
      })
    );
  });

  it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
    server.use(
      http.delete('/api/events/:id', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정 삭제 실패',
        status: 'error',
      })
    );
  });
});
