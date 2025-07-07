import { FormEvent, useEffect, useState } from "react";
import classes from "./Mensaje.module.css"; // Importamos el módulo CSS
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const SeccionMensaje = () => {
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string>("");
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [mensajeActual, setMensajeActual] = useState("")

  useEffect(()=>{
    const docRef = doc(db, "/Mensaje", "mensaje")
    const uns = onSnapshot(docRef, snap=>{
      if (import.meta.env.DEV) console.log(snap.data())
      if (snap.exists()) setMensajeActual(snap.data().text)
      else setMensajeActual("")
    })

    return uns
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBtnDisabled(true)
    if (message.trim().length === 0) {
      setError("Ingresa un valor")
    } else {
      const docRef = doc(db, "/Mensaje", "mensaje")
      await updateDoc(docRef, { text: message })
      setError(`Mensaje actualizado con éxito (${message})`)
      setMessage("")
    }
    setBtnDisabled(false)
  }

  return (
    <div className={classes.loginContainer}>
      <div className={classes.loginBox}>
        <h2 className={classes.title}>Cambiar el mensaje publico</h2>
        <h3 className={classes.subtitle}>Mensaje actual: <br/> {mensajeActual}</h3>
        {error && <p className={classes.error}>{error}</p>}
        <form onSubmit={e => handleSubmit(e)} className={classes.form}>
          <center>
            <input
              type="text"
              placeholder="Introduzca un mensaje para mostrar"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={classes.input}
              required
            />
          </center>
          <button disabled={btnDisabled} type="submit" className={classes.submitButton} style={{ backgroundColor: btnDisabled ? "#605454" : "" }}>
            Enviar Cambios
          </button>
        </form>
      </div>
    </div>
  );
};

export default SeccionMensaje;
