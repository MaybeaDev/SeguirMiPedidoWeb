import { useEffect, useState } from "react";
import CerrarSesionButton from "../../UI/CerrarSesionButton/CerrarSesionButton";
import LinkButton from "../../UI/LinkButton/LinkButton";

import classes from "./NavBar.module.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
// import { db } from "../../../firebaseConfig"
// import { arrayUnion, doc, writeBatch } from "firebase/firestore";
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

    // const handleFunction = () => {
    //     const lista = ["2404382917001","2404379884001","2404377627001","2404376626001","2404381085001","2404375820001","2404382013001","2404375399001","2404373722001","2404375337001","2404383314001","2404379762001","2404375106001","2404377719001","2404376434001","2404375294001","2404382041001","2404382697001","2404374111001","2404374580001","2404379701001","2404376968001","2404375839001","2404374745001","2404380754001","2404378726001","2404376000001","2404383714001","2404379506001","2404381062001","2404378948001","2404379125001","2404381787001","2404382902001","2404374074001","2404378531001","2404374945001","2404378709001","2404379416001","2404375583001","2404383505001","2404374528001","2404378244001","2404376395001","2404374219001","2404381820001","2404377881001","2404381779001"
    //     ]
    //     const batch = writeBatch(db)
    //     for (const code of lista) {
    //         batch.update(doc(db, "Paquetes", code), {
    //             ruta: "2XFHmWatYdFpfELiZnpz", estado: 3, historial: arrayUnion({
    //                 estado: 3,
    //                 detalles: "Pedido entregado",
    //                 fecha: new Date(2024, 11, 27, 17, 0, 0)
    //             })
    //         })
    //     }
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