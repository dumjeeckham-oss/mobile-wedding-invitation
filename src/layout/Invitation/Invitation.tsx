import styled from '@emotion/styled';
import data from 'data.json';
import Host from '../Contact/Host.tsx';
import RoundButton from '@/components/RoundButton.tsx';
import { Caption, Paragraph } from '@/components/Text.tsx';

const Invitation = () => {
  const { greeting } = data;
  return (
    <InvitationWrapper>
      <Paragraph>{data.event?.intro || greeting.message}</Paragraph>
      {data.event && (
        <EventMeta>
          <MetaLine>{data.event.type}</MetaLine>
          {data.event.dateTime && <MetaLine>{data.event.dateTime}</MetaLine>}
          {data.event.venue && <MetaLine>{data.event.venue}</MetaLine>}
          {data.event.address && <MetaLine>{data.event.address}</MetaLine>}
          {data.event.detail && <Caption textAlign="center">{data.event.detail}</Caption>}
        </EventMeta>
      )}
      <Host />
      <Caption textAlign={'center'}>{greeting.eventDetail}</Caption>
      <RoundButton as="span">
        공개 데모에서는 캘린더 등록을 제공하지 않습니다.
      </RoundButton>
    </InvitationWrapper>
  );
};

export default Invitation;

const InvitationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const EventMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
`;

const MetaLine = styled.span`
  color: #4f4f4f;
`;
