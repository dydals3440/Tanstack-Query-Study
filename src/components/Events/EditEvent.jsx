import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { fetchEvent, updateEvent, queryClient } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;
      // 해당 줄에 대한, 나가는 쿼리가 있는 경우 해당 쿼리가 최소되도록 할 수 있따.
      // 이렇게 해야 해당 쿼리의 응답 데이터와 낙관적으로 업데이트된 데이터가 충돌되지 않음!
      // 업데이트 요청이 완료되기 이전에, 이러한 진행 중인 요청이 완료되면 이전 데이터를 다시 가져오게 되는데 이는 원하는 동작 방식이 아님. (cancelQueries는 promise라 await처리)
      await queryClient.cancelQueries({ queryKey: ['events', id] });
      // 하지만 cancelQueries는 변형을 취소하지 않으며, useQuery로 트리거된 쿼리만 취소!

      // 2. 작업 실패시 optimistic update 롤백방법
      const previousEvent = queryClient.getQueryData(['events', id]);

      // setQueryData를 통해 이미 저장된 데이터를 응답을 기다리지 않고 수정가능.
      // 첫번쨰 인수는, 편집하려는 쿼리키: 두번쨰 인수는, 해당 쿼리 키 아래에서 저장하려는 새 데이터.
      queryClient.setQueryData(['events', id], newEvent);

      return { previousEvent };
    },
    onError: (error, data, context) => {
      // context 객체는 중요하다. context에 previousEvent가 포함된다. (return을 해주어야한다. 위에서)
      queryClient.setQueryData(['events', id], context.previousEvent);
    },
    // 성공 여부오 상관없이 mutation이 완료될 떄 마다 실행되는 것.
    onSettled: () => {
      // 백엔드에 있는 것과 동일한 데이터가 프론트에 있는지
      // 낙관적 업데이트를 실행하고 오류가 발생하면, 롤백하더라도 이 mutation이 완료될 떄마다 여전히 백엔드에서 최신 데이터를 가져왔는지 확인할 수 있다. 그럼 백엔드에서 다른 작업을 실행하여 데이터가 백엔드와 프론트엔드 간에 동기화되지 않은 경우 리액트 쿼리에 데이터를 내부적으로 다시 가져오도록 강제하여 다시 동기화합니다.
      queryClient.invalidateQueries(['events', id]);
    },
  });

  function handleSubmit(formData) {
    mutate({ id, event: formData });
    navigate('../');
  }

  function handleClose() {
    navigate('../');
  }

  let content;

  if (isPending) {
    content = (
      <div className='center'>
        <LoadingIndicator />
      </div>
    );
  }

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title='Failed to load event'
          message={
            error.info?.message ||
            'Failed to load event. Please check your inputs and try again later'
          }
        />
        ;
        <div className='form-actions'>
          <Link to='../' className='button'>
            OKay
          </Link>
        </div>
        ;
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to='../' className='button-text'>
          Cancel
        </Link>
        <button type='submit' className='button'>
          Update
        </button>
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}
