import { useEffect, useState } from "react";
import CerrarSesionButton from "../../UI/CerrarSesionButton/CerrarSesionButton";
import LinkButton from "../../UI/LinkButton/LinkButton";

import classes from "./NavBar.module.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
// import { functions } from "../../../firebaseConfig"
// import { httpsCallable } from "firebase/functions";
const Navbar = () => {
  const [user, setUser] = useState<string | null>();
  const [userName, setUserName] = useState<string | null>(null);
  useEffect(() => {
    const uns = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (localStorage.getItem("currentUser")) {
          setUser(localStorage.getItem("currentUser"));
          setUserName(user.displayName)
          return
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return uns
  }, [])

  // const handleButtonMatias = async () => {
  //   const result = await httpsCallable(functions, 'cleanStorageBefore')({ date: "2025-04-05T19:35:00.566Z", maxFilesPerBatch: 40 });
  //   if (import.meta.env.DEV) console.log(result)
  // }


  return (
    <nav className={classes.container}>
        {/* <button onClick={handleButtonMatias}>-_-</button> */}
      <div className={classes.left}>
        {user && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <CerrarSesionButton></CerrarSesionButton>
          </div>
        )}
      </div>
      <div className={classes.center}>
        {user ?
          <label style={{
            color: "white",
            wordSpacing: 5,
            fontSize: 20,
            fontWeight: "bold",
            letterSpacing: 1
          }}>
            Bienvenido {userName?.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}, v3.0
          </label> :
          <label style={{
            color: "white",
            wordSpacing: 5,
            fontSize: 25,
            fontWeight: "bold",
            letterSpacing: 1
          }}>
            Rolando Transportes - consulta por tu pedido
          </label>
        }
      </div>
      <div className={classes.right}>
        {user ?
          user == "1" ? (
            <>
              <LinkButton direccion="/SeccionEmpresa/mensaje" nombre="Mensaje publico" />
              <LinkButton direccion="/SeccionEmpresa" nombre="Panel principal" />
              <LinkButton direccion="/SeccionEmpresa/GestionDePaquetes/ingresarFacturacion" nombre="Gestion de Paquetes" />
              <LinkButton direccion="/SeccionEmpresa/Usuarios/listado" nombre="Gestion de transportistas" />
            </>
          ) : (
            <></>
          ) : (
            <LinkButton direccion="/login" nombre="Iniciar sesión" />
          )
        }
      </div>
    </nav>
  )
}

export default Navbar;