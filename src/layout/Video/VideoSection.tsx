import styled from '@emotion/styled';
import data from 'data.json';
import { Caption, Heading2 } from '@/components/Text.tsx';
import { getYouTubeEmbedUrl } from '@/utils/externalLinks.ts';

const VideoSection = () => {
  const video = data.video;
  if (!video?.enabled) return null;

  const embedUrl = getYouTubeEmbedUrl(video.url);
  if (!embedUrl) {
    return <Fallback>등록된 영상 링크를 재생할 수 없습니다. YouTube 링크를 확인해 주세요.</Fallback>;
  }

  return (
    <VideoWrap>
      <Heading2>{video.title || '행사 영상'}</Heading2>
      <Player title={video.title || '행사 영상'} src={embedUrl} allow="fullscreen; picture-in-picture" allowFullScreen />
      <Caption>영상 재생은 YouTube의 정책과 영상 공개 설정에 따릅니다.</Caption>
      <ExternalLink href={video.url} target="_blank" rel="noreferrer">YouTube에서 열기</ExternalLink>
    </VideoWrap>
  );
};

export default VideoSection;

const VideoWrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Player = styled.iframe`
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
  border-radius: 8px;
`;

const Fallback = styled(Caption)`
  color: #6f4b4b;
`;

const ExternalLink = styled.a`
  color: #6f4b4b;
  font-size: 0.9rem;
`;
