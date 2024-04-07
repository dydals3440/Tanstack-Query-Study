import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchEvents } from '../../util/http';
import LoadingIndicator from '../UI/LoadingIndicator';
import ErrorBlock from '../UI/ErrorBlock';
import EventItem from './EventItem';

export default function FindEventSection() {
  const searchElement = useRef();
  // 초기 상태를 ''가 아니라, undefined로 값을 전달하지 않으면 되고 enabled에는 searchTerm이 undefined가 아닌경우 활성화되도록 설정합니다!
  const [searchTerm, setSearchTerm] = useState(undefined);
  // undefined인 경우에 아래 쿼리는 비활성화!
  // 사용자가 searchTerm을 빈 문자열로 만들어도, 쿼리가 활성화되어 요청이 이제 전송이 된다.
  const { data, isPending, isError, error, isLoading } = useQuery({
    queryKey: ['events', { search: searchTerm }],
    queryFn: ({ signal }) => fetchEvents({ signal, searchTerm }),
    // enabled: false시 요청이 가지 않음.
    enabled: searchTerm !== undefined,
  });

  function handleSubmit(event) {
    event.preventDefault();
    setSearchTerm(searchElement.current.value);
  }

  let content = <p>Please enter a search term and to find events.</p>;

  // isPending vs isLoading
  // isLoading의 경우 쿼리가 비활성화되었다고 해서 True가 되지 않음.

  if (isLoading) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock
        title='An error occured'
        message={error.info?.message || 'Failed to Fetch Events'}
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
    <section className='content-section' id='all-events-section'>
      <header>
        <h2>Find your next event!</h2>
        <form onSubmit={handleSubmit} id='search-form'>
          <input
            type='search'
            placeholder='Search events'
            ref={searchElement}
          />
          <button>Search</button>
        </form>
      </header>
      {content}
    </section>
  );
}
