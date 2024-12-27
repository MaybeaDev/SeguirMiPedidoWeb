




import { useEffect, useState } from "react";
import TableRutas from "../../../../components/Otros/TableRutas/TableRutas";
import classes from "./GestionRutas.module.css"
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
interface Data {
    id: string,
    alias: string,
    paquetes: string,
    estado: string,
    transportista: string
}
const GestionRutas = () => {
    const [data, setData] = useState<Data[]>([]);
    const [trabajadores, setTrabajadores] = useState<{ id: string, nombre: string }[]>([])
    useEffect(() => {
        const [s1, s2] = [snapshotRutas(), snapshotUsuarios()]
        return () => {
            s1()
            s2()
        }
    }, [])
    const snapshotRutas = () => {
        const q = query(collection(db, "Rutas"));
        return onSnapshot(q, (snap) => {
            const rutasPromises: Promise<Data>[] = [];
    
            snap.forEach((doc) => {
                let estado = "0";
                if (doc.data().activa) estado = "1";
                if (doc.data().cargado) estado = "2";
                if (doc.data().en_reparto) estado = "3";
                if (doc.data().completado) estado = "4";
                const q = query(collection(db, "Paquetes"), where("ruta", "==", doc.id), where("estado", "in", [1, 2, 4]));
                const rutaPromise = getDocs(q).then((querySnapshot) => {
                    const paquetes = querySnapshot.size;
                    return {
                        id: doc.id,
                        alias: doc.data().alias,
                        paquetes: paquetes.toString(),
                        estado: estado,
                        transportista: doc.data().transportista,
                    };
                });
                rutasPromises.push(rutaPromise);
            });
            // Esperar a que todas las promesas se resuelvan
            Promise.all(rutasPromises).then((rutas) => {
                setData(rutas);
            });
        });
    };
    

    const snapshotUsuarios = () => {
        const q2 = query(collection(db, "Usuarios"))
        return onSnapshot(q2, (snap) => {
            const trabajadores: { id: string, nombre: string }[] = []
            snap.forEach((doc) => {
                if (doc.data().tipo == 0) {
                    trabajadores.push({ id: doc.id, nombre: doc.data().nombre })
                }
            })
            setTrabajadores(trabajadores)
        })
    }


    return (
        <div className={classes.container}>
            <h2>Gestionar Rutas</h2>
            <center>
                <div style={{ width: "90%" }}>
                    {data.length > 0 && (
                        <TableRutas initData={data} trabajadores={trabajadores} />
                    )}
                </div>
            </center>
        </div>
    )
}

export default GestionRutas;