import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { createNewEvent } from '../../util/http.js';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import { queryClient } from '../../util/http.js';

export default function NewEvent() {
  const navigate = useNavigate();
  // isError일떄는 에러일때, error는 에러메시지가 담김
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createNewEvent,
    onSuccess: () => {
      // exact가 true면 정확히 일치하는 쿼리 ['events', { searchTerm }] 이렇게만된다.
      // {queryKey: ['events'], exact: true]}
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate('/events');
    },
    onError: () => {},
  });

  function handleSubmit(formData) {
    mutate({ event: formData });
    // mutation 성공과 실패에 상관없이 events 페이지로 가게됨. (onSuccess, onError로 핸들링하는게 직관적)
    // navigate('/events');
  }

  return (
    <Modal onClose={() => navigate('../')}>
      <EventForm onSubmit={handleSubmit}>
        {isPending && 'Submitting...'}
        {!isPending && (
          <>
            <Link to='../' className='button-text'>
              Cancel
            </Link>
            <button type='submit' className='button'>
              Create
            </button>
          </>
        )}
      </EventForm>
      {isError && (
        <ErrorBlock
          title='Failed to create Event'
          message={
            error.info?.message ||
            'Failed to create event. Please check your inputs and try again later'
          }
        />
      )}
    </Modal>
  );
}
