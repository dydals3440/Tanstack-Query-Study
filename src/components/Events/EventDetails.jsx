import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import Header from '../Header.jsx';
import Modal from '../UI/Modal.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import { deleteEvent, fetchEvent, queryClient } from '../../util/http.js';
import { useState } from 'react';

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
  });

  const {
    mutate,
    isPending: isPendingDeletion,
    isError: isErrorDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        // invalidateQueries가 호출될떄, 즉시 자동으로 다시 트리거 되지 않음. 대신 기존 쿼리는 무효화되고, 다음번에 요청될떄 다시 실행됩니다. 하지만 즉시 다시 트리거되지않음!
        queryKey: ['events'],
        // 기존 쿼리는 무효화되고, 다음번에 요청될 떄 다시 실행 (처음에 무효화시키면 삭제되자마자, 한번더 요청을해서 없는 리소스에 한번더 접근하게 됨 -> 요청 낭비)
        refetchType: 'none',
      });
      navigate('/events');
    },
  });

  const handleStartDelete = () => {
    setIsDeleting(true);
  };

  const handleStopDelete = () => {
    setIsDeleting(false);
  };

  const handleDelete = () => {
    mutate({ id });
  };

  let content;

  if (isPending) {
    content = (
      <div id='event-details-content' className='center'>
        <p>Fetching event data....</p>
      </div>
    );
  }

  if (isError) {
    content = (
      <div id='event-details-content' className='center'>
        <ErrorBlock
          title='Failed to load event'
          message={
            error.info?.message ||
            'Failed to fetch event data, please try again later'
          }
        />
      </div>
    );
  }

  if (data) {
    const formattedDate = new Date(data.date).toLocaleDateString('ko-KR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    content = (
      <>
        <header>
          <h1>{data.title}</h1>
          <nav>
            <button onClick={handleStartDelete}>Delete</button>
            <Link to='edit'>Edit</Link>
          </nav>
        </header>
        <div id='event-details-content'>
          <img src={`http://localhost:3000/${data.image}`} alt={data.title} />
          <div id='event-details-info'>
            <div>
              <p id='event-details-location'>{data.location}</p>
              <time dateTime={`Todo-DateT$Todo-Time`}>
                {formattedDate} @ {data.time}
              </time>
            </div>
            <p id='event-details-description'>{data.description}</p>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      {isDeleting && (
        <Modal onClose={handleStopDelete}>
          <h2>Are you sure?</h2>
          <p>
            Do you really want to delete this event? This action cannot be
            undone
          </p>
          <div className='form-actions'>
            {isPendingDeletion && <p>Deleting, please wait...</p>}
            {!isPendingDeletion && (
              <>
                <button onClick={handleStopDelete} className='button-text'>
                  Cancel
                </button>
                <button onClick={handleDelete} className='button'>
                  Delete
                </button>
              </>
            )}
          </div>
          {isErrorDeleting && (
            <ErrorBlock
              title='Failed to delete Event'
              message={
                deleteError.info?.message ||
                'Failed to delete event, please try again later'
              }
            />
          )}
        </Modal>
      )}
      <Outlet />
      <Header>
        <Link to='/events' className='nav-item'>
          View all Events
        </Link>
      </Header>
      <article id='event-details'>{content}</article>
    </>
  );
}
