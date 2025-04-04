import classes from "./EditarRuta.module.css"



import { useOutletContext, useParams } from "react-router-dom";
import { arrayUnion, deleteField, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useEffect, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import { PaqueteContext, RutaContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
import Button from "../../../../components/UI/Button/Button";
import ModalCustom from "../../../../components/Layout/ModalCustom/ModalCustom";


const EditarRutaTab = () => {
    const { paquetesContext, rutasContext, premiosContext } = useOutletContext<{ paquetesContext: PaqueteContext[], rutasContext: Record<string, RutaContext>, premiosContext: Record<string, { premios: Record<string, number>; transportista: string, entregado: boolean }> }>();
    const [paquetes, setPaquetes] = useState<string[][]>([])
    const [ruta, setRuta] = useState("")
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [entregaMasivaRut, setEntregaMasivaRut] = useState("");
    const [entregaMasivaNombre, setEntregaMasivaNombre] = useState("");
    const { rutaID } = useParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { getPaquetes(rutaID!); console.log("datos actualizados") }, [paquetesContext])
    useEffect(() => {
        if (!isOpenModal) {
            setEntregaMasivaRut("")
            setEntregaMasivaNombre("")
        }
    }, [isOpenModal])

    const getPaquetes = (id: string) => {
        const filtrados = paquetesContext.filter((p) => {
            return p.ruta == id && ![0, 3, 5].includes(p.estado)
        })
        const paq: string[][] = []
        setRuta(rutasContext[rutaID!] ? rutasContext[rutaID!].alias : "Ruta no encontrada")
        filtrados.forEach((p) => {
            paq.push(
                [
                    p.id.slice(0, p.id.length - 3),
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
        // Contar las ocurrencias de cada paquete
        const counts: Record<string, number> = {};
        paq.forEach((item) => {
            const key = JSON.stringify(item);
            counts[key] = (counts[key] || 0) + 1;
        });
        // Crear la lista única con el conteo añadido al primer elemento
        const paquetesUnicos = Array.from(new Set(paq.map((item) => JSON.stringify(item))))
            .map((item) => JSON.parse(item))
            .map((item: string[]) => {
                const key = JSON.stringify(item);
                const count = counts[key];
                item[0] += count > 1 ? ` (${count})` : ""; // Añadir el conteo si hay duplicados
                return item;
            });
        setPaquetes(paquetesUnicos);
    }
    const devolverABodega = async (key: string) => {
        console.log(key.split(" ")[0].split(" ")[0])
        const paquetes = paquetesContext.filter(p => p.id.slice(0, p.id.length - 3) == key.split(" ")[0])
        console.log(paquetes.length)
        const batch = writeBatch(db)
        if (premiosContext[key.split(" ")[0]]) {
            batch.update(doc(db, "Premios", key.split(" ")[0]), { transportista: "", ruta: deleteField() })
        }
        paquetes.forEach((p, index) => {
            if (p.estado == 1) {
                batch.update(doc(db, "Paquetes", key.split(" ")[0] + (index + 1).toString().padStart(3, "0")), { ruta: "" })
            } else {
                batch.update(doc(db, "Paquetes", key.split(" ")[0] + (index + 1).toString().padStart(3, "0")), {
                    ruta: "",
                    estado: 1, historial: arrayUnion({
                        estado: 1,
                        fecha: new Date(),
                        detalles: "Devuelto a Bodega"
                    })
                })
            }
        })
        batch.commit()
    }
    const marcarEntregado = async (pedido: string) => {
        const key = pedido.split(" ")[0]
        const paquetes = paquetesContext.filter(p => p.id.slice(0, 10) == key)
        paquetes.forEach(p => {
            updateDoc(doc(db, "Paquetes", p.id), {
                estado: 3,
                historial: arrayUnion({
                    estado: 3,
                    fecha: new Date(),
                    detalles: "Pedido entregado por sistema"
                })
            })
        })
        if (premiosContext[key]) {
            updateDoc(doc(db, "Premios", key), { entregado: true })
        }
    }
    const marcarNoEntregado = async (pedido: string) => {
        const key = pedido.split(" ")[0]
        const paquetes = paquetesContext.filter(p => p.id.slice(0, 10) == key)
        paquetes.forEach(p => {
            updateDoc(doc(db, "Paquetes", p.id), {
                estado: 5, historial: arrayUnion({
                    estado: 5,
                    fecha: new Date(),
                    detalles: "Pedido devuelto a Santiago"
                })
            })
        })
        if (premiosContext[key]) {
            updateDoc(doc(db, "Premios", key), { entregado: false, ruta: deleteField(), transportista: "" })
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

    const handleEntregaMasiva = () => {
        setIsOpenModal(true)
    }
    const entregaMasiva = () => {
        if (entregaMasivaNombre === "" || entregaMasivaRut === "") {
            alert("Debe ingresar el nombre y RUT de la persona a la que se entregarán los pedidos.")
            return
        }
        if (rutaID && Object.keys(rutasContext).includes(rutaID)) {
            if (rutasContext[rutaID].transportista === "") {
                alert("Debe seleccionar un transportista para la ruta.")
                return
            }
        }
        const pedidos = paquetes.map((p) => p[0].split(" ")[0])
        const batch = writeBatch(db)
        pedidos.forEach((pedido) => {
            const key = pedido
            const paquetes = paquetesContext.filter(p => p.id.slice(0, 10) == key)
            paquetes.forEach(p => {
                batch.update(doc(db, "Paquetes", p.id), {
                    estado: 3,
                    historial: arrayUnion({
                        estado: 3,
                        fecha: new Date(),
                        detalles: "Pedido entregado a " + entregaMasivaNombre + " Rut: " + entregaMasivaRut
                    }),
                    ruta: rutaID,
                    rutaAlias: rutasContext[rutaID!].alias,
                    transportista: rutasContext[rutaID!].transportista,
                    transportistaNombre: rutasContext[rutaID!].transportistaNombre,
                })
            })
            if (premiosContext[key]) {
                batch.update(doc(db, "Premios", key), {
                    entregado: true,
                    ruta: rutaID,
                    transportista: rutasContext[rutaID!].transportista
                })
            }
        })
        batch.commit()
        console.log(pedidos)
        setIsOpenModal(false)
    }
    const formatRut = (value: string) => {

        const numbers = value.toLowerCase().replace(/[^0-9k]/gi, '');

        // Agregar puntos y guión según la cantidad de dígitos
        // Separar el dígito verificador
        if (numbers.length == 0) {
            return ""
        } else if (numbers.length == 1) {
            return numbers;
        } else {
            const dv = numbers.slice(-1);
            const numeroBase = numbers.slice(0, -1);
            const partes = numeroBase.split("").reverse().join('').match(/.{1,3}/g);
            const rutFormateado = (partes ?? []).join('.').split("").reverse().join('') + '-' + dv;
            return rutFormateado;
        }
    };
    return (
        <div className={classes.root}>
            <ModalCustom isOpen={isOpenModal} style={{ width: 400 }}>
                <h3>Entrega Masiva</h3>
                <div>
                    <label>Rut</label>
                    <input type="text" placeholder="Ingrese el Rut" value={entregaMasivaRut} onInput={(e) => setEntregaMasivaRut(formatRut((e.target as HTMLInputElement).value))} />
                </div>
                <div>
                    <label>Nombre</label>
                    <input type="text" placeholder="Ingrese el nombre" value={entregaMasivaNombre} onInput={(e) => setEntregaMasivaNombre((e.target as HTMLInputElement).value)} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
                    <Button onClick={() => { setIsOpenModal(false) }}>Cancelar</Button>
                    <Button onClick={entregaMasiva}>Aceptar</Button>
                </div>
            </ModalCustom>
            <h1>{ruta == "" ? "Identificando ruta..." : ruta}</h1>
            <h3>{rutasContext[rutaID!]?.transportistaNombre}</h3>
            <input
                type="text"
                placeholder="Buscar en los resultados..."
                value={searchQuery}
                onChange={handleSearch}
            />
            <br />
            {
                ruta.split(" ").map((p) => p.toLowerCase()).includes("despachos") &&
                <Button onClick={handleEntregaMasiva}>
                    <label>Entrega Masiva</label>
                </Button>
            }
            <Table
                data={paquetes}
                headers={[
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
                            Devolver Pedido
                        </button>
                    </>
                )}
            </Table>
        </div>
    )
}

export default EditarRutaTab;