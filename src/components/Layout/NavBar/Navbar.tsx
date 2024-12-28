import { useEffect, useState } from "react";
import CerrarSesionButton from "../../UI/CerrarSesionButton/CerrarSesionButton";
import LinkButton from "../../UI/LinkButton/LinkButton";

import classes from "./NavBar.module.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
import { db } from "../../../firebaseConfig"
import { arrayUnion, doc, writeBatch } from "firebase/firestore";
import Button from "../../UI/Button/Button";
const Navbar = () => {
    const [user, setUser] = useState<boolean>(false);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (localStorage.getItem("currentUser")) {
                    setUser(true);
                    return
                } else {
                    setUser(false);
                    return
                }
            } else {
                setUser(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleFunction = () => {
        const lista = ["2404378616001"]
        const batch = writeBatch(db)
        for (const code of lista) {
            batch.update(doc(db, "Paquetes", code), {ruta:"tmfBtqNfMsCP2b2ogOMD", estado:3, historial:arrayUnion({
                estado:3,
                detalles:"Pedido entregado",
                fecha: new Date()
            })})
        }
        batch.commit().then(() => {
            console.log("Batch de actualización exitosa");
        }).catch((error) => {
            console.error("Error al actualizar batch: ", error);
        });
    }


    return (
        <nav className={classes.container}>
            <div className={classes.left}>
                {user && (
                    <CerrarSesionButton></CerrarSesionButton>
                )}
            </div>
            <div className={classes.center}>
                <Button onClick={handleFunction}>Boton solo para matias</Button>
            </div>
            <div className={classes.right}>
                {user ? (
                    <>
                        <LinkButton direccion="/SeccionEmpresa" nombre="Panel principal" />
                        <LinkButton direccion="/SeccionEmpresa/GestionDePaquetes/ingresarFacturacion" nombre="Gestion de Paquetes" />
                        <LinkButton direccion="/SeccionEmpresa/Usuarios/listado" nombre="Gestion de transportistas" />
                    </>
                ) : (
                    <LinkButton direccion="/login" nombre="Iniciar sesión" />
                )
                }
            </div>
        </nav>
    )
}

export default Navbar;