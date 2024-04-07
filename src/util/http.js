// {searchTerm, signal} 이렇게 destructuring가능
export async function fetchEvents({ signal, searchTerm }) {
  console.log(searchTerm);
  let url = 'http://localhost:3000/events';

  if (searchTerm) {
    url += '?search=' + searchTerm;
  }
  // 브라우저는 이 취소 신호를 받아 중지함.
  const response = await fetch(url, { signal: signal });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the events');
    error.code = response.status;
    error.info = await response.json();
    throw error;
  }

  const { events } = await response.json();

  return events;
}
