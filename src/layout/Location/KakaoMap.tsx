import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import data from 'data.json';

const KakaoMap = () => {
  const kakaoMapKey = import.meta.env.VITE_APP_KAKAOMAP_JAVASCRIPT_KEY;

  if (!kakaoMapKey) {
    return <div>공개 데모에서는 외부 지도 링크를 제공하지 않습니다.</div>;
  }

  return <KakaoMapWithApi appkey={kakaoMapKey} />;
};

const KakaoMapWithApi = ({ appkey }: { appkey: string }) => {
  const { lat, lon } = data.mapInfo;

  const [error] = useKakaoLoader({
    appkey,
    libraries: ['services', 'clusterer'],
  });

  if (error) {
    return <div>카카오맵을 불러오는데 실패했습니다.</div>;
  }

  return (
    <Map
      center={{ lat, lng: lon }}
      style={{ width: '100%', height: '230px' }}
      level={3}
    >
      <MapMarker position={{ lat, lng: lon }} />
    </Map>
  );
};

export default KakaoMap;
