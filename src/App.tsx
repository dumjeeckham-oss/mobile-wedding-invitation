import { useEffect, useRef, useState } from 'react';
import { Heading1 } from '@/components/Text.tsx';
import Wrapper from '@/components/Wrapper.tsx';
import Container from '@/layout/Container.tsx';
import FloatingBar from '@/layout/FloatingBar/FloatingBar.tsx';
import GalleryWrap from '@/layout/Gallery/GalleryWrap.tsx';
import Guestbook from '@/layout/Guestbook/Guestbook.tsx';
import Invitation from '@/layout/Invitation/Invitation.tsx';
import Location from '@/layout/Location/Location.tsx';
import Main from '@/layout/Main/Main.tsx';
import VideoSection from '@/layout/Video/VideoSection.tsx';
import data from 'data.json';
import AdminApp from './admin/AdminApp.tsx';
import EventPublic from './admin/EventPublic.tsx';

function DemoInvitation() {
  const [isVisible, setIsVisible] = useState(false);
  const galleryRef = useRef(null);

  useEffect(() => {
    window.addEventListener('scroll', checkScrollPosition);
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  const checkScrollPosition = () => {
    if (galleryRef.current) {
      const { offsetTop } = galleryRef.current;
      const scrollPosition = window.scrollY;

      if (scrollPosition >= offsetTop) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  };

  return (
    <Container>
      <Wrapper>
        <Main />
      </Wrapper>
      <Wrapper>
        <Heading1>데모 안내</Heading1>
        <Invitation />
      </Wrapper>
      {data.video?.enabled && (
        <Wrapper>
          <Heading1>영상</Heading1>
          <VideoSection />
        </Wrapper>
      )}
      {data.event?.showGallery !== false && (
        <Wrapper ref={galleryRef}>
          <Heading1>Gallery</Heading1>
          <GalleryWrap />
        </Wrapper>
      )}
      <Wrapper>
        <Heading1>데모 위치 안내</Heading1>
        <Location />
      </Wrapper>
      <Wrapper>
        <Heading1>메시지 기능 미리보기</Heading1>
        <Guestbook />
      </Wrapper>
      <FloatingBar isVisible={isVisible} />
    </Container>
  );
}

function App() {
  const path = window.location.pathname;
  if (path === '/admin' || path === '/admin/') return <AdminApp />;
  if (path.startsWith('/e/')) return <EventPublic slug={decodeURIComponent(path.slice(3))} />;
  return <DemoInvitation />;
}

export default App;
