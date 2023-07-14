import { useState, useEffect, useRef } from 'react';
import { client } from './socket';
import Peer, { SignalData } from 'simple-peer';
import toast from 'react-hot-toast'
import Navbar from './components/Navbar';
import Video from './components/Video';

export type TPeer = {
  peerID: string;
  peer: Peer.Instance;
};

function App() {
  const [me, setMe] = useState<string>('');
  const [peers, setPeers] = useState<TPeer[]>([]);
  const peersRef = useRef<TPeer[]>([]);
  const myVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    client.on('connect', () => setMe(client.id));
    client.on('user-disconnected', (userID: string) => {
      toast.error(`${userID} just left the room!`)
      const peerToDisconnect = peersRef.current.find( (peer: TPeer) => peer.peerID === userID );

      if (peerToDisconnect) peerToDisconnect.peer.destroy();
      peersRef.current.filter((peer: TPeer) => peer.peerID !== userID);
      setPeers((users: TPeer[])=>{ return users.filter((user: TPeer) => user.peerID !== userID)})
    })

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream: MediaStream) => {
        client.connect();
        myVideoRef.current!.srcObject = stream;
        myVideoRef.current!.muted = true;

        client.on('all-users', (users: Array<{ id: string }>) => {
          const peers: TPeer[] = [];
          users.forEach((user: { id: string }) => {
            const peer = createPeer(user.id, client.id, stream);
            peersRef.current.push({
              peerID: user.id,
              peer,
            });
            peers.push({ peerID: user.id, peer});
          });
          setPeers(peers);
        });

        client.on(
          'user-joined',
          (payload: { signal: SignalData; callerID: string }) => {
            toast.success(`${payload.callerID} just joined the room!`)
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peersRef.current.push({
              peerID: payload.callerID,
              peer,
            });
            setPeers((users: TPeer[]) => [...users, {peer, peerID: payload.callerID}]);
          }
        );

        client.on(
          'call-accepted',
          (payload: { signal: SignalData; id: string }) => {
            const peerToConnect = peersRef.current.find(
              (peer: TPeer) => peer.peerID === payload.id
            );

            peerToConnect?.peer.signal(payload.signal);
          }
        );
      })
      .catch((err: Error | any) => {
        console.log(err.message || 'Could not get media stream');
        toast.error(err.message || 'Could not get media stream')
      });



    return () => {
      client.disconnect();
      client.off('connect');
      client.off('all-users');
      client.off('user-joined');
      client.off('call-accepted');
    };
  }, []);

  const createPeer = ( userToCall: string, callerID: string, stream: MediaStream): Peer.Instance => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      client.emit('call-user', { signal, callerID, userToCall });
    });

    return peer;
  };
  const addPeer = (incomingSignal: SignalData,callerID: string,stream: MediaStream ): Peer.Instance => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal: SignalData) => {
      client.emit('answer-call', { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };


  return (
    <>
      <Navbar myId={me} />
      <div className='grid grid-cols-6 gap-4 px-8 py-2 w-3/4 place-content-center border-2 m-auto '>
        <video ref={myVideoRef} autoPlay playsInline className="col-span-3 md:col-span-2 w-full border-sky-400 rounded border-2" />
        {peers.map((peer: TPeer, index) => {
          return <Video key={index} peer={peer} />;
        })}
      </div>
    </>
  );
}

export default App;
