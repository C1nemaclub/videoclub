import { useRef, useEffect, useState } from 'react';
import { TPeer } from '../App';
import Loader from './Loader';

function Video({ peer }: { peer: TPeer }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState<boolean>(
    false || peer.peer.connected
  );

  useEffect(() => {
    peer.peer.on('stream', (stream: MediaStream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
    peer.peer.on('connect', () => setIsConnected(true));
  }, []);

  return (
    <div className=" col-span-3 md:col-span-2 w-full relative">
      {!isConnected && <Loader />}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className='col-span-3 md:col-span-2 w-full'
      />
    </div>
  );
}

export default Video;
