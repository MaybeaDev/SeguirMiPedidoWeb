import classes from "./EditarRuta.module.css"



import { useParams } from "react-router-dom";
import { arrayUnion, collection, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useEffect, useState } from "react";
import Table from "../../../../components/UI/Table/Table";


const EditarRutaTab = () => {
    const [paquetes, setPaquetes] = useState<string[][]>([])
    const [ruta, setRuta] = useState("")
    const [searchQuery, setSearchQuery] = useState<string>("");
    const { rutaID } = useParams()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { getRuta() }, [])

    const getPaquetes = async (id: string, transportista: string) => {
        const q = query(collection(db, "Paquetes"), where("ruta", "==", id), where("estado", "not-in", [0, 3]))
        onSnapshot(q, (snap) => {
            const paq: string[][] = []
            snap.forEach((p) => {
                paq.push(
                    [
                        p.id,
                        p.data().consultora,
                        p.data().contacto,
                        (() => {
                            switch (p.data().estado) {
                                case 0:
                                    return "Enviado desde Santiago"
                                case 1:
                                    return "En Bodega";
                                case 2:
                                    return "En Reparto";
                                case 3:
                                    return "Entregado";
                                case 4:
                                    return "Entrega fallida";
                                default:
                                    return "En Proceso";
                            }
                        })(),
                        transportista
                    ]
                )
            })
            setPaquetes(paq)
        })
    }
    const getRuta = async () => {
        const docRef = doc(db, `Rutas/${rutaID}`)
        const ruta = await getDoc(docRef)
        setRuta(ruta.data()!.alias)
        getPaquetes(ruta.id, ruta.data()!.transportistaNombre)
    }

    const devolverABodega = async (index: number) => {
        const docRef = doc(db, "Paquetes", paquetes[index][0])
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            if (docSnap.data().estado == 1) {
                updateDoc(docRef, { ruta: "" })
            } else {
                await updateDoc(docRef, {
                    ruta:"",
                    estado: 1, historial: arrayUnion({
                        estado: 1,
                        fecha: new Date(),
                        detalles: "Devuelto a Bodega"
                    })
                })
            }
        }
    }
    const marcarEntregado = async (index: number) => {
        const docRef = doc(db, "Paquetes", paquetes[index][0])
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                estado: 3, historial: arrayUnion({
                    estado: 3,
                    fecha: new Date(),
                    detalles: "Pedido entregado"
                })
            })
            setPaquetes(paquetes.filter(p => p[0] != paquetes[index][0]))
        }
    }
    const marcarNoEntregado = async (index: number) => {
        const docRef = doc(db, "Paquetes", paquetes[index][0])
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                estado: 4, historial: arrayUnion({
                    estado: 4,
                    fecha: new Date(),
                    detalles: "Pedido no entregado"
                })
            })
            setPaquetes(paquetes.filter(p => p[0] != paquetes[index][0]))
        }
    }
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value.toString();
        setSearchQuery(query);
    };
    const normalizeString = (str: string): string => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\u200B-\u200D\uFEFF]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    };
    return (
        <div className={classes.root}>
            <h1>{ruta}</h1>
            <input
                type="text"
                placeholder="Buscar en los resultados..."
                value={searchQuery}
                onChange={handleSearch}
            />
            <Table data={paquetes} headers={[
                "Codigo",
                "Consultora",
                "Telefono",
                "Estado",
                "Transportista",
                "Opciones"
            ]}
                searchTerms={searchQuery.split(";").map((term) => normalizeString(term))}
            >
                {(rowIndex: number) => (
                    <>
                        <button className={classes.button + " " + classes.buttonBodega}
                            onDoubleClick={() => { devolverABodega(rowIndex); }}>
                            Devolver a bodega
                        </button>
                        <button className={classes.button + " " + classes.buttonEntregado}
                            onDoubleClick={() => { marcarEntregado(rowIndex); }}>
                            Marcar entregado
                        </button>
                        <button className={classes.button + " " + classes.buttonNoEntregado}
                            onDoubleClick={() => { marcarNoEntregado(rowIndex); }}>
                            Marcar no entregado
                        </button>
                    </>

                )}
            </Table>
        </div>
    )
}

export default EditarRutaTab;