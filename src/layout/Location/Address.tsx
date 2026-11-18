import styled from '@emotion/styled';
import data from 'data.json';
import { Caption, PointTitle } from '@/components/Text.tsx';
import { ILocationInfo } from '@/types/data.ts';
import Button from '@/components/Button.tsx';

const Address = () => {
  const { locationInfo, mapInfo, event } = data;
  const address = event?.address || mapInfo.address1;
  const copyAddress = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(address);
  };
  return (
    <WayWrapper>
      {mapInfo.enabled !== false && (
        <AddressRow>
          <Caption>{address}</Caption>
          <Button href="#address" onClick={(event) => { event.preventDefault(); void copyAddress(); }}>주소 복사</Button>
        </AddressRow>
      )}
      {locationInfo?.map((item: ILocationInfo) => {
        const { title, desc } = item;
        return (
          <Way key={title}>
            <PointTitle>{title}</PointTitle>
            <Caption>{desc}</Caption>
          </Way>
        );
      })}
      {mapInfo.enabled !== false && mapInfo.transit && <Way><PointTitle>대중교통</PointTitle><Caption>{mapInfo.transit}</Caption></Way>}
      {mapInfo.enabled !== false && mapInfo.parking && <Way><PointTitle>주차</PointTitle><Caption>{mapInfo.parking}</Caption></Way>}
    </WayWrapper>
  );
};

export default Address;

const WayWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 20px 0px;
  gap: 20px;
`;

const Way = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const AddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;
