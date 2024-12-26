import { useEffect, useState } from "react";
import CerrarSesionButton from "../../UI/CerrarSesionButton/CerrarSesionButton";
import LinkButton from "../../UI/LinkButton/LinkButton";

import classes from "./NavBar.module.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
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


    return (
        <nav className={classes.container}>
            <div className={classes.left}>
                {user && (
                    <CerrarSesionButton></CerrarSesionButton>
                )}
            </div>
            <div className={classes.center}></div>
            <div className={classes.right}>
                {user ? (
                    <>
                        <LinkButton direccion="/SeccionEmpresa" nombre="Panel principal" />
                        <LinkButton direccion="/SeccionEmpresa/GestionDePaquetes/ingresarFacturacion" nombre="Gestion de Paquetes" />
                        <LinkButton direccion="/SeccionEmpresa/Empleados/listado" nombre="Gestion de empleados" />
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