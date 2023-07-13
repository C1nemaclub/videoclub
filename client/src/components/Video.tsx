import { useRef, useEffect } from 'react';
import { TPeer } from '../App';

function Video({ peer }: { peer: TPeer }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    peer.peer.on('stream', (stream: MediaStream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, []);
  return <video ref={videoRef} autoPlay playsInline  className='col-span-3 md:col-span-2 w-full'/>;
}

export default Video;
