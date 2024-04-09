import { useIsFetching } from '@tanstack/react-query';

export default function Header({ children }) {
  const fetching = useIsFetching();
  console.log(fetching);
  // fetching === 0 ? 데이터 안받아옴 : 1이면 데이터 받아옴
  return (
    <>
      <div id='main-header-loading'>{fetching > 0 && <progress />}</div>
      <header id='main-header'>
        <div id='header-title'>
          <h1>React Events</h1>
        </div>
        <nav>{children}</nav>
      </header>
    </>
  );
}
