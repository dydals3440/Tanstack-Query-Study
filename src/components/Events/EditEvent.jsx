import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { fetchEvent, updateEvent, queryClient } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EditEvent() {
  const navigate = useNavigate();
  // react-router-dom에서 제공하는 제출함수.
  const submit = useSubmit();
  const { state } = useNavigation();

  const { id } = useParams();

  // loader를 사용하기에, useLoaderData를 활용해서 엑세스할 수 있지만, useQuery를 사용하는 것이 좋다.
  // 아래 loader에서 fetchQuery를 사용하면, 리액트 쿼리가 해당 요청을 보내고, 해당 응답 데이터를 캐시에 젖아하게 됩니다. 따라서 여기 컴포넌트에서 useQuery가 다시 실행되면 캐시된 아래 데이터가 사용됩니다.
  // 리액트 쿼리에서 제공하는 다른 모든 이점은 유지한다. (이창에서 나갔다가 다시 오면, 내부적으로 가져오기 트리거하여 업데이트 된 데이터를 찾음.) => 캐싱 매커니즘 떄문에 가능.

  // 하지만 loader를 사용하게되면 pending 이라는 개념이 필요없다. 화면이 켜지기전에 데이터를 받아오기 떄문에, 따라서 제거해주면 된다.
  // Error와 ,Errorblock을 지워줄 수 있다. 리액트 라우터돔의 에러를 사용하면 되기 떄문이다.
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
    // 캐시 데이터가  10초 미만인 경우, 내부적으로 다시 가져오지 않고, 해당 데이터가 사용됨.
    // loader랑 안겹침, 요청이 하나가 됨.
    staleTime: 10000,
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
    // mutate({ id, event: formData });
    // navigate('../');

    // 이 코드는 클라이언트 사이드의 action (아래) 함수를 실행한다.
    submit(formData, { method: 'PUT' });
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
        {state === 'submitting' ? (
          <p>Sending Data...</p>
        ) : (
          <>
            <Link to='../' className='button-text'>
              Cancel
            </Link>
            <button type='submit' className='button'>
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

// 컴퓨터가 화면에 표시되기도 전에 데이터를 받아올 수 있음.
// 컴포넌트 함수 외부에 있으므로 useQuery로 데이터를 불러오는 것이 아닌, queryClient를 사용하여 직접 로드합니다.
// queryClient.fetchQuery()를 활용한다. 프
export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });
}

export async function action({ request, params }) {
  // 리액트 라우터에서 제공되는 메소드 전송된 데이터를 받아올 수 있음.
  const formData = await request.formData();
  // 키 값 쌍 객체로 받아올 수 있음.
  const updatedEventData = Object.fromEntries(formData);
  console.log(updatedEventData);
  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(['events']); // invalidateQueries도 promise를 반환하기에 await
  return redirect('../');
}
