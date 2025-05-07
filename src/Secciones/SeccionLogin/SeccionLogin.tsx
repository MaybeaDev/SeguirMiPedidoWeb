import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../firebaseConfig" // Asegúrate de importar correctamente tu configuración de Firebase
import classes from "./SeccionLogin.module.css"; // Importamos el módulo CSS

const SeccionLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [btnDisabled, setBtnDisabled] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  const getUsuariosTransportistas = async () => {
    const q = query(collection(db, "Usuarios"), where("tipo", "==", 0))
    const querySnapshot = await getDocs(q);
    let transportistas = {};
    querySnapshot.forEach((doc) => {
      transportistas = {
        ...transportistas,
        [doc.id]: { id: doc.id, nombre: doc.data().nombre, email: doc.data().email, rut: doc.data().rut, telefono: doc.data().telefono }
      }
    });
  }
  const getRutas = async () => {
    const q = query(collection(db, "Rutas"))
    const querySnapshot = await getDocs(q);
    let rutas = {};
    querySnapshot.forEach((doc) => {
      rutas = {
        ...rutas,
        [doc.id]: {
          alias: doc.data().alias,
          transportista: doc.data().transportista,
          activa: doc.data().activa,
          cargado: doc.data().cargado,
          completado: doc.data().completado,
          en_reparto: doc.data().en_reparto
        },
      };
    });
    console.log(rutas);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setError("cargando...")
    setBtnDisabled(true);
    try {
      // Iniciar sesión con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const rango = parseInt((await user.getIdTokenResult()).claims.range as string)
      const userDocRef = doc(db, "Usuarios", user.uid);


      // Verificar si el tipo de usuario es "empresa"
      console.log(rango)
      if ([1, 2, 3].includes(rango)) {
        updateDoc(userDocRef, { ultimaConexion: Timestamp.now() });
        // Si es un usuario de tipo empresa, redirigir al panel de empresa

        localStorage.setItem('currentUser', rango + "")
        await getRutas()
        await getUsuariosTransportistas()
        if (rango == 1) {
          navigate("/SeccionEmpresa");
        } else if (rango == 3) {
          navigate("/reportes");
        } else {
          navigate("/SeccionEmpresa/GestionDePaquetes/arriboCarga");
        }
        window.location.reload();
      } else {
        // Si no es un usuario de tipo empresa, mostrar error
        setError("No tienes acceso al área de empresa.");
        await signOut(auth);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message); // Mostrar el mensaje de error de Firebase
        if (error.message == "Firebase: Error (auth/invalid-credential).") {
          setError("Usuario no encontrado... Revisa el usuario y la contraseña");
        }
      } else {
        setError("Ocurrió un error inesperado");
      }
    }
    setBtnDisabled(false);
  };

  return (
    <div className={classes.loginContainer}>
      <div className={classes.loginBox}>
        <h2 className={classes.title}>Iniciar sesión</h2>
        {error && <p className={classes.error}>{error}</p>}
        <form onSubmit={handleLogin} className={classes.form}>
          <center>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={classes.input}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={classes.input}
              required
            />
          </center>
          <button disabled={btnDisabled} type="submit" className={classes.submitButton} style={{ backgroundColor: btnDisabled ? "#605454" : "" }}>
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default SeccionLogin;
