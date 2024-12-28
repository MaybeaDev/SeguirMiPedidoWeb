import { useEffect, useState } from "react";
import { collection, writeBatch, doc, addDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import Button from "../../../../components/UI/Button/Button";
import ModalRutas from "../../../../components/Layout/ModalRutas/ModalRutas";



import classes from "./ArmadoRutasTab.module.css";
import { useOutletContext } from "react-router-dom";
import { PaqueteContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
type Paquete = {
    codigo: string;
    direccion: string;
    consultora: string;
};


const ArmadoRutasTab: React.FC = () => {
    const { paquetesContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [] }>();
    const [paquetesNoAsignados, setPaquetesNoAsignados] = useState<Paquete[]>([]);
    const [paquetesParaAsignar, setPaquetesParaAsignar] = useState<Paquete[]>([]);
    const [noEncontrados, setNoEncontrados] = useState<string[]>([])

    const [filtroIzquierda, setFiltroIzquierda] = useState<string>("");
    const [filtroDerecha, setFiltroDerecha] = useState<string>("");
    const [tablaIzquierdaBouncing, setTablaIzquierdaBouncing] = useState(false)
    const [tablaDerechaBouncing, setTablaDerechaBouncing] = useState(false)
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        setPaquetesNoAsignados([])
        setPaquetesParaAsignar([]);
        setIsLoading(true);
        const paquetes: Paquete[] = [];
        const filtrados = paquetesContext.filter((p) => (p.ruta == "" && p.estado != 0))
        filtrados.forEach((paquete) => {
            paquetes.push({
                codigo: paquete.id,
                direccion: paquete.direccion,
                consultora: paquete.consultora,
            });
        })
        setIsLoading(false);
        setPaquetesNoAsignados(paquetes);
    }, [paquetesContext]);

    const filtrarPaquetes = (paquetes: Paquete[], filtro: string): Paquete[] => {
        return paquetes.filter((p) =>
            p.codigo.toString().toLowerCase().includes(filtro.toLowerCase()) ||
            p.direccion.toString().toLowerCase().includes(filtro.toLowerCase()) ||
            p.consultora.toString().toLowerCase().includes(filtro.toLowerCase())
        );
    };
    const guardarRuta = async (rutaObjetivo: { rutaId: string | null, alias: string | null }): Promise<void> => {
        if (rutaObjetivo.rutaId) {
            const batch = writeBatch(db);
            const rutaRef = doc(db, "Rutas", rutaObjetivo.rutaId)
            const ruta = await getDoc(rutaRef)
            if (ruta.data()?.completado == true) {
                batch.update(rutaRef, { "activa": true, "cargado": true, "completado": false })
            } else {
                batch.update(rutaRef, { "activa": true, "cargado": true })
            }
            paquetesParaAsignar.forEach(paquete => {
                const sfRef = doc(db, "Paquetes", paquete.codigo);
                batch.update(sfRef, { "ruta": rutaObjetivo.rutaId });
            })
            batch.commit();
        } else {
            const nuevaRutaRef = await addDoc(collection(db, "Rutas"), {
                activa: false,
                alias: rutaObjetivo.alias,
                cargado: false,
                completado: false,
                en_reparto: false,
                no_entregado: [],
                transportista: "",
            });
            localStorage.setItem(nuevaRutaRef.id, JSON.stringify({ id: nuevaRutaRef.id, alias: rutaObjetivo.alias, transportista: "" }))

            await guardarRuta({ rutaId: nuevaRutaRef.id, alias: rutaObjetivo.alias });
        }
    }

    const handleOnKeyDownIzquierda = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            const paquetesMover = paquetesNoAsignados.filter((p) => filtroIzquierda == p.codigo);
            const paquetesOtraLista = paquetesParaAsignar.filter((p) => filtroIzquierda == p.codigo);
            if (paquetesMover.length == 0 && paquetesOtraLista.length == 0) {
                const noEncontradosCopy = [...noEncontrados]
                noEncontradosCopy.push(filtroIzquierda)
                setNoEncontrados(noEncontradosCopy)
            }
            setPaquetesNoAsignados(paquetesNoAsignados.filter((p) => filtroIzquierda != p.codigo));
            setPaquetesParaAsignar([...paquetesParaAsignar, ...paquetesMover]);
            if (paquetesMover.length) {
                setTablaDerechaBouncing(true)
                setTimeout(() => {
                    setTablaDerechaBouncing(false)
                }, 300)
            }
            setFiltroIzquierda("")
        }
    };
    const handleOnKeyDownDerecha = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            const paquetesMover = paquetesParaAsignar.filter((p) => filtroDerecha == p.codigo);
            setPaquetesParaAsignar(paquetesParaAsignar.filter((p) => filtroDerecha != p.codigo));
            setPaquetesNoAsignados([...paquetesNoAsignados, ...paquetesMover]);
            if (paquetesMover.length) {
                setTablaIzquierdaBouncing(true)
                setTimeout(() => {
                    setTablaIzquierdaBouncing(false)
                }, 300)
            }
            setFiltroDerecha("")
        }
    };

    const handleOnChangeIzquierda = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltroIzquierda(e.target.value.toUpperCase());
    }
    const handleOnChangeDerecha = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltroDerecha(e.target.value.toUpperCase());
    }

    return (
        <>
            <ModalRutas
                isOpen={isOpenModal}
                onClose={() => { setIsOpenModal(false) }}
                paquetes={[]}
                onConfirm={guardarRuta}
            />
            <h2>Armado de rutas</h2>
            <div className={classes.containerNoEncontrados}>
                {noEncontrados.map((c) => (
                    <label>{c}</label>
                ))}
            </div>
            <div className={classes.filtersContainer}>
                <div className={classes.filterGroup}>
                    <input className={classes.input}
                        type="text"
                        placeholder="Buscar..."
                        value={filtroIzquierda}
                        onChange={handleOnChangeIzquierda}
                        onKeyDown={handleOnKeyDownIzquierda}
                    />
                </div>

                <div className={classes.filterGroup}>
                    <input className={classes.input}
                        type="text"
                        placeholder="Buscar..."
                        value={filtroDerecha}
                        onChange={handleOnChangeDerecha}
                        onKeyDown={handleOnKeyDownDerecha}
                    />
                </div>
            </div>
            <div className={classes.containerTables}>
                <center style={{ width: "49%" }}>

                    <h3 style={{ marginTop: "0" }}>Paquetes sin ruta asignada ({paquetesNoAsignados.length})</h3>
                    <div className={classes.tableContainer}>
                        <table className={tablaIzquierdaBouncing ? classes.table + " bouncing" : classes.table}>
                            <thead className={classes.thead}>
                                <tr className={classes.trHeadder}>
                                    <th className={classes.th}>Codigo</th>
                                    <th className={classes.th}>Consultora</th>
                                    <th className={classes.th}>Direccion</th>
                                </tr>
                            </thead>
                            <tbody className={classes.tbody}>
                                {filtrarPaquetes(paquetesNoAsignados, filtroIzquierda).reverse().map((paquete) => (
                                    <tr
                                        className={classes.tr}
                                        key={paquete.codigo}
                                    >
                                        <td className={classes.td}>{paquete.codigo}</td>
                                        <td className={classes.td}>{paquete.consultora}</td>
                                        <td className={classes.td}>{paquete.direccion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <center>
                        {isLoading ? (
                            <div className={classes.spinnerContainer}>
                                <div className={classes.spinner}></div>
                                <p>Obteniendo cajas...</p>
                            </div>
                        ) :
                            paquetesNoAsignados.length == 0 &&
                            <p>No hay cajas sin asignar!</p>
                        }
                    </center>
                </center>
                <center style={{ width: "49%" }}>
                    <h3 style={{ marginTop: "0" }}>Paquetes para asignar a una ruta ({paquetesParaAsignar.length})</h3>
                    <div className={classes.tableContainer}>
                        <table className={tablaDerechaBouncing ? classes.table + " bouncing" : classes.table}>
                            <thead className={classes.thead}>
                                <tr className={classes.trHeadder}>
                                    <th className={classes.th}>Codigo</th>
                                    <th className={classes.th}>Direccion</th>
                                    <th className={classes.th}>Referencia</th>
                                </tr>
                            </thead>
                            <tbody className={classes.tbody}>
                                {filtrarPaquetes(paquetesParaAsignar, filtroDerecha).reverse().map((paquete) => (
                                    <tr
                                        className={classes.tr}
                                        key={paquete.codigo}
                                    >
                                        <td className={classes.td}>{paquete.codigo}</td>
                                        <td className={classes.td}>{paquete.direccion}</td>
                                        <td className={classes.td}>{paquete.consultora}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </center>
            </div>
            <Button disabled={paquetesParaAsignar.length ? false : true} onClick={() => { setIsOpenModal(true) }}>Crear Ruta</Button>
        </>
    );
};

export default ArmadoRutasTab;