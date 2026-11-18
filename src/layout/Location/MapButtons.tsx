import styled from '@emotion/styled';
import data from 'data.json';
import Button from '@/components/Button.tsx';
import { getKakaoMapLinks, getNaverMapLinks, isAllowedMapUrl, openExternalAppOrWeb } from '@/utils/externalLinks.ts';

const MapButtons = () => {
  const { mapInfo } = data;
  const destinationName = data.event?.venue || mapInfo.address1;
  const destinationAddress = data.event?.address || mapInfo.address1;

  if (mapInfo.enabled === false || (!mapInfo.address1 && !mapInfo.address2)) {
    return null;
  }

  const modes = [
    { key: 'public' as const, label: '대중교통' },
    { key: 'car' as const, label: '차량' },
  ];

  return (
    <MapButtonWrapper>
      {modes.map(({ key, label }) => {
        const naver = getNaverMapLinks(destinationName, destinationAddress, mapInfo.lat, mapInfo.lon, key);
        const kakao = getKakaoMapLinks(destinationName, destinationAddress, mapInfo.lat, mapInfo.lon, key);
        const naverWebUrl = isAllowedMapUrl(mapInfo.naverMap, 'naver') ? mapInfo.naverMap : naver.webUrl;
        const kakaoWebUrl = isAllowedMapUrl(mapInfo.kakaoMap, 'kakao') ? mapInfo.kakaoMap : kakao.webUrl;
        return (
          <div key={key}>
            <Button href={naverWebUrl} onClick={(event) => { event.preventDefault(); openExternalAppOrWeb(naver.appUrl, naverWebUrl); }}>
              네이버 {label}
            </Button>
            <Button href={kakaoWebUrl} onClick={(event) => { event.preventDefault(); openExternalAppOrWeb(kakao.appUrl, kakaoWebUrl); }}>
              카카오 {label}
            </Button>
          </div>
        );
      })}
    </MapButtonWrapper>
  );
};

export default MapButtons;

const MapButtonWrapper = styled.div`
  margin: 8px;
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;
