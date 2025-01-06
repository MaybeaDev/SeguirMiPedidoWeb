import { useEffect, useState } from "react";
import CerrarSesionButton from "../../UI/CerrarSesionButton/CerrarSesionButton";
import LinkButton from "../../UI/LinkButton/LinkButton";

import classes from "./NavBar.module.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
// import { db } from "../../../firebaseConfig"
// import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
// import Button from "../../UI/Button/Button";
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

    // const handleFunction = async () => {

    //     const batch = writeBatch(db)
    //     const q = query(collection(db, "Usuarios"))
    //     const u = (await getDocs(q)).docs.map(d => {
    //         return { uid: d.id, nombre: d.data().nombre }
    //     })
    //     const q2 = query(collection(db, "Paquetes"), where("estado", "==", 3))
    //     const paquetes = (await getDocs(q2)).docs.map(d => {
    //         return {
    //             id: d.id,
    //             ruta: d.data().ruta,
    //             transportista: d.data().transportista,
    //             transportistaNombre: d.data().transportistaNombre,
    //         }
    //     })
    //     const q3 = query(collection(db, "Rutas"))
    //     const r = (await getDocs(q3)).docs.map(d => {
    //         return { id: d.id, transportista: d.data().transportista }
    //     })
    //     console.log(paquetes)
    //     paquetes.forEach(p => {
    //         if (p.transportistaNombre) {
    //             console.log(u.find(u => u.nombre === p.transportistaNombre)?.uid ?? "")
    //             batch.update(doc(db, "Paquetes", p.id), { transportista: u.find(u => u.nombre === p.transportistaNombre)?.uid ?? "" })
    //         } else if(p.ruta) {
    //             console.log(r.find(r => r.id === p.ruta)?.transportista ?? "")
    //             batch.update(doc(db, "Paquetes", p.id), { transportista: r.find(r => r.id === p.ruta)?.transportista ?? "" })
    //         }
    //     })
    //     console.log("Guardando...")
    //     batch.commit().then(() => {
    //         console.log("Batch de actualización exitosa");
    //     }).catch((error) => {
    //         console.error("Error al actualizar batch: ", error);
    //     });
    // }


    return (
        <nav className={classes.container}>
            <div className={classes.left}>
                {user && (
                    <CerrarSesionButton></CerrarSesionButton>
                )}
            </div>
            <div className={classes.center}>
                {/* <Button onClick={handleFunction}>Boton solo para matias</Button> */}
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