import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const Debug = () => {
  const [uid, setUid] = useState('');
  const [range, setRange] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    const setRangeFn = httpsCallable(getFunctions(), "setRange")
    e.preventDefault(); // previene el recargo de página
    const snap = await getDocs(query(collection(db, "Usuarios")))
    snap.docs.forEach(async d => {
      const uid = d.id
      const tipo = d.data().tipo as number
      const data = { uid, range: tipo }
      console.log(data)
      const r = await setRangeFn(data)
      console.log(r)
      setMessage((r.data as { status: number, message: string }).message)
    })
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="uid"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />
        <input
          placeholder="range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        />
        <input type="submit" />
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};
