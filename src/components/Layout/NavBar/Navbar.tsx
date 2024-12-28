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

    // const handleFunction = () => {
    //     const lista = [
    //         "2404289203001",
    //         "2404288067001",
    //         "2404289537001",
    //         "2404290715001",
    //         "2404291422001",
    //         "2404290243001",
    //         "2404285882001",
    //         "2404286609001",
    //         "2404285855001",
    //         "2404288583001",
    //         "2404284722001",
    //         "2404291776001",
    //         "2404286360001",
    //         "2404286502001",
    //         "2404285341001",
    //         "2404288782001",
    //         "2404290162001",
    //         "2404288882001",
    //         "2404291789001",
    //         "2404288853001",
    //         "2404291310001",
    //         "2404288799001",
    //         "2404287232001",
    //         "2404289749001",
    //         "2404290577001",
    //         "2404285707001",
    //         "2404289292001",
    //         "2404288661001",
    //         "2404285772001",
    //         "2404287355001",
    //         "2404287137001",
    //         "2404286465001",
    //         "2404290562001",
    //         "2404284758001",
    //         "2404284662001",
    //         "2404290670001",
    //         "2404290786001",
    //         "2404284862001",
    //         "2404288435001",
    //         "2404288733001",
    //         "2404287525001",
    //         "2404286072001",
    //         "2404287876001",
    //         "2404287595001",
    //         "2404289542001",
    //         "2404286693001",
    //         "2404286918001",
    //         "2404287573001",
    //         "2404288634001",
    //         "2404286284001",
    //         "2404286988001",
    //         "2404289638001",
    //         "2404288544001",
    //         "2404288585001",
    //         "2404287345001",
    //         "2404286885001",
    //         "2404290727001",
    //         "2404286227001",
    //         "2404288416001",
    //         "2404287515001",
    //         "2404288784001",
    //         "2404286803001",
    //         "2404291886001",
    //         "2404291886002",
    //         "2404285819001",
    //         "2404285819002",
    //         "2404285007001",
    //         "2404288191001",
    //         "2404286242001",
    //         "2404284639001",
    //         "2404291358001",
    //         "2404289169001",
    //         "2404291228001",
    //         "2404288038001",
    //         "2404285783001",
    //         "2404287064001",
    //         "2404285232001",
    //         "2404290978001",
    //         "2404290495001",
    //         "2404290304001",
    //         "2404285673001",
    //         "2404289679001",
    //         "2404289114001",
    //         "2404289089001",
    //         "2404292269001",
    //         "2404291612001",
    //         "2404290118001",
    //         "2404290297001",
    //         "2404291181001",
    //         "2404288683001",
    //         "2404285623001",
    //         "2404292289001",
    //         "2404289314001",
    //         "2404287704001",
    //         "2404287910001",
    //         "2404284723001",
    //         "2404287569001",
    //         "2404286055001",
    //         "2404289969001",
    //         "2404289932001",
    //         "2404288063001",
    //         "2404286192001",
    //         "2404292020001",
    //         "2404285908001",
    //         "2404289052001",
    //         "2404291909001",
    //         "2404289797001",
    //         "2404291866001",
    //         "2404290745001",
    //         "2404288760001",
    //         "2404288231001",
    //         "2404287805001",
    //         "2404287217001",
    //         "2404291152001",
    //         "2404287755001",
    //         "2404286071001",
    //         "2404289993001",
    //         "2404285774001",
    //         "2404288521001",
    //         "2404286441001",
    //         "2404284804001",
    //         "2404289050001",
    //         "2404286565001",
    //         "2404290990001",
    //         "2404291905001",
    //         "2404288030001",
    //         "2404286986001",
    //         "2404290240001",
    //         "2404290240002"
    //     ]
    //     const batch = writeBatch(db)
    //     for (const code of lista) {
    //         batch.update(doc(db, "Paquetes", code), {facturacion:"16-12-2024"})
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