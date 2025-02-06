import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';

import { handlers } from './__mocks__/handlers';

/* msw */
// API 요청을 가로채서 모의 응답 제공 설정
export const server = setupServer(...handlers);

// 타임존 설정
vi.stubEnv('TZ', 'UTC');

// 1. 모든 테스트 실행 전
beforeAll(() => {
  server.listen(); // MSW 서버 시작
  vi.useFakeTimers({ shouldAdvanceTime: true }); // 가짜 타이머 사용
});

// 2. 각각의 테스트 실행 전
beforeEach(() => {
  expect.hasAssertions(); // 각 테스트가 최소 하나의 검증 포함

  // ? Medium: 왜 이 시간을 설정해주는 걸까요?
  // 모든 테스트에서 동일한 시간 사용하기 위함
  vi.setSystemTime(new Date('2024-10-01'));
});

// 3. 각각의 테스트 실행 후
afterEach(() => {
  server.resetHandlers(); // 테스트 후 모든 핸들러 재설정
  vi.clearAllMocks(); // 모의 함수 호출 기록 초기화
});

// 4. 모든 테스트 실행 후
afterAll(() => {
  vi.resetAllMocks(); // 모의 함수 호출 기록 초기화
  vi.useRealTimers(); // 실제 타이머로 복원
  server.close(); // MSW 서버 종료
});
