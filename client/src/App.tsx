import { useState, useEffect, useRef } from 'react';
import { client } from './socket';
import Peer, { SignalData } from 'simple-peer';
import Navbar from './components/Navbar';
import Video from './components/Video';

type TPeer = {
  peerID: string;
  peer: Peer.Instance;
};

function App() {
  const [me, setMe] = useState<string>('');
  const [peers, setPeers] = useState<Peer.Instance[]>([]);
  const peersRef = useRef<TPeer[]>([]);
  const myVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    client.on('connect', () => setMe(client.id));

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream: MediaStream) => {
        client.connect();
        myVideoRef.current!.srcObject = stream;

        client.on('all-users', (users: Array<{ id: string }>) => {
          const peers: Peer.Instance[] = [];
          users.forEach((user: { id: string }) => {
            const peer = createPeer(user.id, client.id, stream);
            peersRef.current.push({
              peerID: user.id,
              peer,
            });
            peers.push(peer);
          });
          setPeers(peers);
        });

        client.on(
          'user-joined',
          (payload: { signal: SignalData; callerID: string }) => {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peersRef.current.push({
              peerID: payload.callerID,
              peer,
            });
            setPeers((users: Peer.Instance[]) => [...users, peer]);
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
      });

    return () => {
      client.disconnect();
      client.off('connect');
      client.off('all-users');
      client.off('user-joined');
      client.off('call-accepted');
    };
  }, []);

  const createPeer = (
    userToCall: string,
    callerID: string,
    stream: MediaStream
  ): Peer.Instance => {
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
  const addPeer = (
    incomingSignal: SignalData,
    callerID: string,
    stream: MediaStream
  ): Peer.Instance => {
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
      <Navbar />
      <h2>{me}</h2>
      <video ref={myVideoRef} autoPlay playsInline />
      {peers.map((peer: Peer.Instance, index) => {
        return <Video key={index} peer={peer} />;
      })}
    </>
  );
}

export default App;
