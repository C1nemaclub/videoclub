import { useRef, useEffect } from 'react';
import Peer from 'simple-peer';

function Video({ peer }: { peer: Peer.Instance }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    peer.on('stream', (stream: MediaStream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, []);
  return <video ref={videoRef} autoPlay playsInline />;
}

export default Video;
