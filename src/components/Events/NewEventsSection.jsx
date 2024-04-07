import { useQuery } from '@tanstack/react-query';

import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import EventItem from './EventItem.jsx';
import { fetchEvents } from '../../util/http.js';

export default function NewEventsSection() {
  // isPending: 용청이 응답을 받았는지 알려주는 것.하지만, 응답으로 받은 결과가 반드시
  // 데이터인 것은 아니다. 오류가 발생할 수 있다. 이를 해결해주는게 error
  // 발생한 오류에 대한 정보가 포함된 것이 error(에러메시지)
  // refetch: 사용자가 버튼을 눌렀을 때 동일한 쿼리를 재호출
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5000,
    // 기본값은 5분 (30000 => 30초)
    gcTime: 30000,
  });

  let content;

  if (isPending) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock
        title='An error occurred'
        message={error.info?.message || 'failed to fetch events.'}
      />
    );
  }

  if (data) {
    content = (
      <ul className='events-list'>
        {data.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className='content-section' id='new-events-section'>
      <header>
        <h2>Recently added events</h2>
      </header>
      {content}
    </section>
  );
}
