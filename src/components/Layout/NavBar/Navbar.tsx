import { useState } from "react";
import CerrarSesionButton from "../../UI/CerrarSesionButton/CerrarSesionButton";
import LinkButton from "../../UI/LinkButton/LinkButton";

import classes from "./NavBar.module.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
// import { db } from "../../../firebaseConfig"
// import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
// import Button from "../../UI/Button/Button";
const Navbar = () => {
    const [user, setUser] = useState<string | null>(null);
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (localStorage.getItem("currentUser")) {
                setUser(localStorage.getItem("currentUser"));
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

    //     const q = query(collection(db, "Paquetes"), where("estado", "==", 2), where("ruta", "==", "O7u1sQZBvxMMUrPnVUir"))
    //     const paquetes = (await getDocs(q)).docs.map(d => {
    //         return {
    //             id: d.id,
    //             ruta: d.data().ruta,
    //         }
    //     })

    //     console.log(paquetes)
    //     paquetes.forEach(async p => {
    //         const premioRef = doc(db, "Premios", p.id.slice(0, 10))
    //         const premio = await getDoc(premioRef)
    //         if (premio.exists()) {
    //             console.log("existe")
    //             await updateDoc(doc(db, "Premios", p.id.slice(0, 10)), { transportista: "hTnTPDzF7odTBS31RaJnyNGRS8l2", ruta: "O7u1sQZBvxMMUrPnVUir" })
    //         }
    //     })
    // paquetes.forEach(p => {
    //     batch.update(doc(db, "Paquetes", p.id), { ruta: "Sistema", rutaAlias:"Sistema", transportistaNombre:"Sistema" })
    // })
    // console.log("Guardando...")
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
                        Gestion de pedidos de Rolando Transportes v1.2
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