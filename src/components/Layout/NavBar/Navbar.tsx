import { useState } from "react";
import CerrarSesionButton from "../../UI/CerrarSesionButton/CerrarSesionButton";
import LinkButton from "../../UI/LinkButton/LinkButton";

import classes from "./NavBar.module.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
// import { db } from "../../../firebaseConfig"
// import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
// import Button from "../../UI/Button/Button";
const Navbar = () => {
    const [user, setUser] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    onAuthStateChanged(auth, (user) => {
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

    // const handleFunction = async () => {
    //     const batch = writeBatch(db)
    //     const q = query(collection(db, "Paquetes"), where("facturacion", "==", "00-02-2025"))
    //     const docs = await getDocs(q)
    //     docs.forEach((doc) => {
    //         batch.update(doc.ref, { facturacion: "31-01-2025" })
    //     })
    // console.log("Guardando "+docs.size+" cambios...")
    // batch.commit().then(() => {
    //     console.log("Batch de actualización exitosa");
    // }).catch((error) => {
    //     console.error("Error al actualizar batch: ", error);
    // });
    // }


    return (
        <nav className={classes.container}>
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
                        Bienvenido {userName?.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}, v1.3.3
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
                {/* <Button onClick={handleFunction}>Boton solo para matias</Button> */}
            </div>
            <div className={classes.right}>
                {user ?
                    user == "1" ? (
                        <>
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