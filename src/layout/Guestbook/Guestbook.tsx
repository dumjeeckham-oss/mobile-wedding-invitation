import styled from '@emotion/styled';
import CommentForm from './CommentForm.tsx';
import { Heading2 } from '@/components/Text.tsx';

const Guestbook = () => {
  return (
    <GuestBookWrapper>
      <Heading2>
        메시지 입력 기능을 미리 확인해 보세요.
        <br />
        공개 데모에서는 입력 내용이 저장되거나 전달되지 않습니다.
      </Heading2>
      <CommentForm />
    </GuestBookWrapper>
  );
};

export default Guestbook;

const GuestBookWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 50px;
`;
