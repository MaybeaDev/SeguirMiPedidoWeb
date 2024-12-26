import { useEffect, useState } from "react";
import Card from "../../components/UI/Card/Card";
import { db } from "../../firebaseConfig";
import { collection, query, getDocs } from "firebase/firestore";




const PanelPrincipal = () => {
    const [paquetes, setPaquetes] = useState<{ enBodega: number, enProceso: number, entregado: number, total: number }>({
        enBodega: 0,
        enProceso: 0,
        entregado: 0,
        total: 0
    })
    const getPaquetes = async () => {
        const q = query(collection(db, "Paquetes"));
        const querySnapshot = await getDocs(q);
        const p = {
            enBodega: 0,
            enProceso: 0,
            entregado: 0,
            total: 0
        }
        querySnapshot.forEach((doc) => {
            p.total++
            if (doc.data().estado == 1) {
                p.enBodega++
            } else if (doc.data().estado == 3) {
                p.entregado++
            } else {
                p.enProceso++
            }
        });
        setPaquetes(p)
    }
    useEffect(() => {
        getPaquetes();
    }, []); // [] asegura que esto se ejecute solo una vez al montar el componente



    return (
        <div>
            <h2>Panel Principal</h2>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px" }}>
                <Card titulo="En bodega" style={{ width: "100%" }}>{paquetes.enBodega}</Card>
                <Card titulo="En proceso" style={{ width: "100%" }}>{paquetes.enProceso}</Card>
                <Card titulo="Entregado" style={{ width: "100%" }}>{paquetes.entregado}</Card>
                <Card titulo="Total" style={{ width: "100%" }}>{paquetes.total}</Card>
            </div>
        </div>
    )
}

export default PanelPrincipal;