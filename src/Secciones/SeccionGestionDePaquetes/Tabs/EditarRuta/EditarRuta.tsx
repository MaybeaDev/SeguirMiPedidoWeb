import classes from "./EditarRuta.module.css"



import { useOutletContext, useParams } from "react-router-dom";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useEffect, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import { PaqueteContext, RutaContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";


const EditarRutaTab = () => {
    const { paquetesContext, rutasContext } = useOutletContext<{ paquetesContext: PaqueteContext[], rutasContext : Record<string, RutaContext> }>();
    const [paquetes, setPaquetes] = useState<string[][]>([])
    const [ruta, setRuta] = useState("")
    const [searchQuery, setSearchQuery] = useState<string>("");
    const { rutaID } = useParams()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { getPaquetes(rutaID!);console.log("datos actualizados") }, [paquetesContext])

    const getPaquetes = (id: string) => {
        const filtrados = paquetesContext.filter((p) => {
            return p.ruta == id && ![0, 3].includes(p.estado)
        })
        const paq: string[][] = []
        setRuta(rutasContext[rutaID!] ? rutasContext[rutaID!].alias : "Ruta no encontrada")
        filtrados.forEach((p) => {
            paq.push(
                [
                    p.id,
                    p.consultora,
                    p.contacto,
                    (() => {
                        switch (p.estado) {
                            case 1:
                                return "En Bodega";
                            case 2:
                                return "En Reparto";
                            case 4:
                                return "Entrega fallida";
                            default:
                                return "En Proceso";
                        }
                    })(),
                    p.direccion
                ]
            )
        })
        setPaquetes(paq)        
    }

    const devolverABodega = async (key: string) => {
        const paquete = paquetes.find((p) => p[0] == key)
        const docRef = doc(db, "Paquetes", paquete![0])
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            if (docSnap.data().estado == 1) {
                updateDoc(docRef, { ruta: "" })
            } else {
                await updateDoc(docRef, {
                    ruta: "",
                    estado: 1, historial: arrayUnion({
                        estado: 1,
                        fecha: new Date(),
                        detalles: "Devuelto a Bodega"
                    })
                })
            }
        }
    }
    const marcarEntregado = async (key: string) => {
        const paquete = paquetes.find((p) => p[0] == key)
        const docRef = doc(db, "Paquetes", paquete![0])
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                estado: 3, historial: arrayUnion({
                    estado: 3,
                    fecha: new Date(),
                    detalles: "Pedido entregado"
                })
            })
        }
    }
    const marcarNoEntregado = async (key: string) => {
        const paquete = paquetes.find((p) => p[0] == key)
        const docRef = doc(db, "Paquetes", paquete![0])
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                estado: 4, historial: arrayUnion({
                    estado: 4,
                    fecha: new Date(),
                    detalles: "Pedido no entregado"
                })
            })
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
            <h1>{ruta == "" ? "Identificando ruta..." : ruta}</h1>
            <h3>{rutasContext[rutaID!]?.transportistaNombre}</h3>
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
                "Direccion",
                "Opciones"
            ]}
                searchTerms={searchQuery.split(";").map((term) => normalizeString(term))}
            >
                {(key: string) => (
                    <>
                        <button className={classes.button + " " + classes.buttonBodega}
                            onDoubleClick={() => { devolverABodega(key); }}>
                            Devolver a bodega
                        </button>
                        <button className={classes.button + " " + classes.buttonEntregado}
                            onDoubleClick={() => { marcarEntregado(key); }}>
                            Marcar entregado
                        </button>
                        <button className={classes.button + " " + classes.buttonNoEntregado}
                            onDoubleClick={() => { marcarNoEntregado(key); }}>
                            Marcar no entregado
                        </button>
                    </>

                )}
            </Table>
        </div>
    )
}

export default EditarRutaTab;