import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { act, ReactElement } from 'react';

import { setupMockHandlerCreation, setupMockHandlerDeletion } from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';
import { formatDate } from '../utils/dateUtils';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

// ! HINT. 이 유틸을 사용해 리액트 컴포넌트를 렌더링해보세요.
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Medium: 여기서 ChakraProvider로 묶어주는 동작은 의미있을까요? 있다면 어떤 의미일까요?
};

// ! HINT. 이 유틸을 사용해 일정을 저장해보세요.
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  await user.click(screen.getByTestId('event-submit-button'));
};

// ! HINT. "검색 결과가 없습니다"는 초기에 노출되는데요. 그럼 검증하고자 하는 액션이 실행되기 전에 검증해버리지 않을까요? 이 테스트를 신뢰성있게 만드려면 어떻게 할까요?
describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation();
    const { user } = setup(<App />);

    const newEvent = {
      title: '새로운 회의',
      date: '2024-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
    };

    await saveSchedule(user, newEvent);

    const eventList = screen.getByTestId('event-list');
    const eventTitle = within(eventList).getByText(newEvent.title);
    const eventDate = within(eventList).getByText(newEvent.date);
    const eventTime = within(eventList).getByText(`${newEvent.startTime} - ${newEvent.endTime}`);
    const eventDesc = within(eventList).getByText(newEvent.description);
    const eventLoc = within(eventList).getByText(newEvent.location);
    const eventCat = within(eventList).getByText(`카테고리: ${newEvent.category}`);

    expect(eventTitle).toBeInTheDocument();
    expect(eventDate).toBeInTheDocument();
    expect(eventTime).toBeInTheDocument();
    expect(eventDesc).toBeInTheDocument();
    expect(eventLoc).toBeInTheDocument();
    expect(eventCat).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const initialEvent = {
      id: '1',
      title: '기존 일정',
      date: '2024-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'none',
        interval: 0,
      },
      notificationTime: 0,
    };

    let currentEvents = [initialEvent];

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events: currentEvents })),
      http.put('/api/events/:id', async ({ request }) => {
        const updatedEvent = (await request.json()) as Event;
        currentEvents = currentEvents.map((evt) =>
          evt.id === updatedEvent.id ? updatedEvent : evt
        );
        return HttpResponse.json(updatedEvent);
      })
    );

    const { user } = setup(<App />);

    const eventList = await screen.findByTestId('event-list');
    const initialTitle = await within(eventList).findByText(initialEvent.title);
    expect(initialTitle).toBeInTheDocument();

    const editButton = await screen.findByLabelText('Edit event');
    await user.click(editButton);

    await user.clear(screen.getByLabelText('날짜'));
    await user.type(screen.getByLabelText('날짜'), initialEvent.date);

    const startTimeInput = screen.getByLabelText('시작 시간');
    await user.clear(startTimeInput);
    await user.type(startTimeInput, initialEvent.startTime);

    const endTimeInput = screen.getByLabelText('종료 시간');
    await user.clear(endTimeInput);
    await user.type(endTimeInput, initialEvent.endTime);

    const titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 회의');

    await user.selectOptions(screen.getByLabelText('카테고리'), initialEvent.category);

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(async () => {
      const updatedTitle = await within(eventList).findByText('수정된 회의');
      expect(updatedTitle).toBeInTheDocument();
    });
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);

    const eventTitles = await screen.findAllByText('삭제할 이벤트');
    expect(eventTitles[0]).toBeInTheDocument();

    const deleteButton = await screen.findByLabelText('Delete event');
    await user.click(deleteButton);

    await screen.findByText('검색 결과가 없습니다.');
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    const { user } = setup(<App />);

    // 주별 뷰 선택
    await user.selectOptions(screen.getByLabelText('view'), 'week');

    // 일정이 없는 주로 이동
    const weekView = await screen.findByTestId('week-view');
    expect(weekView).toBeInTheDocument();

    // 일정이 없는지 확인
    const emptyMessage = await screen.findByText('검색 결과가 없습니다.');
    expect(emptyMessage).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    const mockEvents = [
      {
        id: '1',
        title: '주간 회의',
        date: '2024-10-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '팀 미팅',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ];

    setupMockHandlerCreation(mockEvents as Event[]);
    const { user } = setup(<App />);

    await user.selectOptions(screen.getByLabelText('view'), 'week');
    const weekView = screen.getByTestId('week-view');
    const eventElement = await within(weekView).findByText('주간 회의');
    expect(eventElement).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: [] });
      })
    );

    const { user } = setup(<App />);

    // 월별 뷰 선택
    await user.selectOptions(screen.getByLabelText('view'), 'month');

    // 월별 뷰가 표시되는지 확인
    const monthView = await screen.findByTestId('month-view');
    expect(monthView).toBeInTheDocument();

    // 일정이 없는지 확인
    const emptyMessage = await screen.findByText('검색 결과가 없습니다.');
    expect(emptyMessage).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    const mockEvents = [
      {
        id: '1',
        title: '월간 정기 회의',
        date: '2024-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '10월 정기 회의',
        location: '대회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ];

    setupMockHandlerCreation(mockEvents as Event[]);
    setup(<App />);

    const monthView = screen.getByTestId('month-view');
    const eventElement = await within(monthView).findByText('월간 정기 회의');
    expect(eventElement).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    const { user } = setup(<App />);

    // 월별 뷰 선택
    await user.selectOptions(screen.getByLabelText('view'), 'month');

    // 1월로 이동 (날짜 설정은 setupTests.ts에서 2024-10-01로 고정되어 있음)
    const prevButton = screen.getByLabelText('Previous');
    for (let i = 0; i < 9; i++) {
      await user.click(prevButton);
    }

    // 신정이 표시되는지 확인
    const holiday = await screen.findByText('신정');
    expect(holiday).toBeInTheDocument();
  });
});

describe('검색 기능', () => {
  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const emptyMessage = await screen.findByText('검색 결과가 없습니다.');
    expect(emptyMessage).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const mockEvents = [
      {
        id: '1',
        title: '팀 회의',
        date: '2024-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none' as const, interval: 0 },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '개인 일정',
        date: '2024-10-16',
        startTime: '14:00',
        endTime: '15:00',
        description: '개인 업무',
        location: '회의실 B',
        category: '개인',
        repeat: { type: 'none' as const, interval: 0 },
        notificationTime: 10,
      },
    ];

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: mockEvents });
      })
    );

    const { user } = setup(<App />);

    // 이벤트 리스트 컨테이너 찾기
    const eventList = await screen.findByTestId('event-list');

    // 초기 데이터 로딩 대기
    await waitFor(async () => {
      expect(within(eventList).getByText(mockEvents[0].title)).toBeInTheDocument();
      expect(within(eventList).getByText(mockEvents[1].title)).toBeInTheDocument();
    });

    // 검색어 입력
    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    // 검색 결과 확인
    await waitFor(() => {
      // 검색어와 일치하는 일정은 표시되어야 함
      expect(within(eventList).getByText('팀 회의')).toBeInTheDocument();
      // 검색어와 일치하지 않는 일정은 사라져야 함
      expect(within(eventList).queryByText('개인 일정')).not.toBeInTheDocument();
    });
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const mockEvents = [
      {
        id: '1',
        title: '팀 회의',
        date: '2024-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none' as const, interval: 0 },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '개인 일정',
        date: '2024-10-16',
        startTime: '14:00',
        endTime: '15:00',
        description: '개인 업무',
        location: '회의실 B',
        category: '개인',
        repeat: { type: 'none' as const, interval: 0 },
        notificationTime: 10,
      },
    ];

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: mockEvents });
      })
    );

    const { user } = setup(<App />);

    // 이벤트 리스트 컨테이너 찾기
    const eventList = await screen.findByTestId('event-list');

    // 초기 데이터 로딩 대기
    await waitFor(async () => {
      const event1 = within(eventList).getByText(mockEvents[0].title);
      const event2 = within(eventList).getByText(mockEvents[1].title);
      expect(event1).toBeInTheDocument();
      expect(event2).toBeInTheDocument();
    });

    // 검색어 '팀' 입력
    const searchInput = screen.getByLabelText('일정 검색');
    await user.type(searchInput, '팀');

    // 검색 결과 확인 ('팀 회의'만 표시)
    await waitFor(() => {
      expect(within(eventList).getByText('팀 회의')).toBeInTheDocument();
      expect(within(eventList).queryByText('개인 일정')).not.toBeInTheDocument();
    });

    // 검색어 삭제
    await user.clear(searchInput);

    // 모든 일정이 다시 표시되는지 확인
    await waitFor(() => {
      const event1 = within(eventList).getByText(mockEvents[0].title);
      const event2 = within(eventList).getByText(mockEvents[1].title);
      expect(event1).toBeInTheDocument();
      expect(event2).toBeInTheDocument();
    });
  });
});

describe('일정 충돌', () => {
  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    server.use(
      http.post('/api/events', () =>
        HttpResponse.json({ message: '일정이 겹칩니다' }, { status: 409 })
      )
    );

    const { user } = setup(<App />);

    const newEvent = {
      title: '새 회의',
      date: '2024-10-15',
      startTime: '10:30',
      endTime: '11:30',
      description: '새로운 회의',
      location: '회의실 B',
      category: '업무',
    };

    await saveSchedule(user, newEvent);

    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정 저장 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    );
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    server.use(
      http.get('/api/events', () => {
        const mockEvents = [
          {
            id: '1',
            title: '테스트 회의',
            date: '2024-10-15',
            startTime: '09:00',
            endTime: '10:00',
            description: '팀 미팅',
            location: '회의실 B',
            category: '업무',
            repeat: { type: 'none', interval: 0 },
            notificationTime: 10,
          },
        ];
        return HttpResponse.json({ events: mockEvents });
      }),
      http.put('/api/events/:id', () =>
        HttpResponse.json({ message: '일정이 겹칩니다' }, { status: 409 })
      )
    );

    const { user } = setup(<App />);

    // 초기 데이터 확인
    const eventTitles = await screen.findAllByText('테스트 회의');
    expect(eventTitles[0]).toBeInTheDocument();

    // 수정 버튼 클릭
    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[0]);

    const startTimeInput = screen.getByLabelText('시작 시간');
    await user.clear(startTimeInput);
    await user.type(startTimeInput, '10:30');

    await user.click(screen.getByTestId('event-submit-button'));
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  const now = new Date();
  const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
  const hours = tenMinutesLater.getHours().toString().padStart(2, '0');
  const minutes = tenMinutesLater.getMinutes().toString().padStart(2, '0');

  server.use(
    http.get('/api/events', () => {
      const mockEvents = [
        {
          id: '1',
          title: '알림 테스트 회의',
          date: formatDate(tenMinutesLater),
          startTime: `${hours}:${minutes}`,
          endTime: '23:59',
          description: '알림 테스트',
          location: '회의실',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ];
      return HttpResponse.json({ events: mockEvents });
    })
  );

  vi.useFakeTimers();
  setup(<App />);

  await act(async () => {
    vi.advanceTimersByTime(1000);
  });

  await waitFor(() => {
    expect(screen.getByText('10분 후 알림 테스트 회의 일정이 시작됩니다.')).toBeInTheDocument();
  });

  vi.useRealTimers();
});
