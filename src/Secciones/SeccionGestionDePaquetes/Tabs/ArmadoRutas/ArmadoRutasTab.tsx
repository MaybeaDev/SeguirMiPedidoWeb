import { useEffect, useRef, useState } from "react";
import { collection, writeBatch, doc, addDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import Button from "../../../../components/UI/Button/Button";
import ModalRutas from "../../../../components/Layout/ModalRutas/ModalRutas";



import classes from "./ArmadoRutasTab.module.css";
import { useOutletContext } from "react-router-dom";
import { PaqueteContext, RutaContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
import ModalPremios from "../../../../components/Layout/ModalPremios/ModalPremios";
import Table from "../../../../components/UI/Table/Table";
type Paquete = {
    codigo: string;
    direccion: string;
    consultora: string;
};


const ArmadoRutasTab: React.FC = () => {
    const { paquetesContext, rutasContext, premiosContext } = useOutletContext<{ paquetesContext: PaqueteContext[], rutasContext: Record<string, RutaContext>, premiosContext: Record<string, { premios: Record<string, number>; transportista: string, entregado: boolean }> }>();
    const [paquetesNoAsignados, setPaquetesNoAsignados] = useState<Paquete[]>([]);
    const [paquetesParaAsignar, setPaquetesParaAsignar] = useState<Paquete[]>([]);
    const [noEncontrados, setNoEncontrados] = useState<string[]>([])
    const [filtroIzquierda, setFiltroIzquierda] = useState<string>("");
    const [filtroDerecha, setFiltroDerecha] = useState<string>("");
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isOpenModalPremios, setIsOpenModalPremios] = useState(false)
    const [ruta, setRuta] = useState("")
    const [modalPremiosData, setModalPremiosData] = useState<Record<string, number>[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current && paquetesContext.length == 0) {
            isFirstRender.current = false;
            return;
        }
        setIsLoading(true);
        const paquetes: Paquete[] = [];
        const filtrados = paquetesContext.filter((p) => (p.ruta == "" && p.estado != 0 && p.estado != 5))
        filtrados.forEach((paquete) => {
            paquetes.push({
                codigo: paquete.id,
                direccion: paquete.direccion,
                consultora: paquete.consultora,
            });
        })
        setIsLoading(false);
        setPaquetesNoAsignados(paquetes.filter((p) => !paquetesParaAsignar.map((ppa) => ppa.codigo).includes(p.codigo)));
        setPaquetesParaAsignar(paquetesParaAsignar.filter((ppa) => paquetes.map((p) => p.codigo).includes(ppa.codigo)))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paquetesContext]);

    const guardarRuta = async (rutaObjetivo: { rutaId: string | null, alias: string | null }) => {
        if (!rutaObjetivo.rutaId) {
            const a = rutaObjetivo.alias!.trim()
            addDoc(collection(db, "Rutas"), {
                activa: false,
                alias: a.charAt(0).toUpperCase() + a.slice(1).toLowerCase(),
                cargado: false,
                completado: false,
                en_reparto: false,
                transportista: "",
            }).then((r) => {
                guardarRuta({ rutaId: r.id, alias: a.charAt(0).toUpperCase() + a.slice(1).toLowerCase() })
            })
        } else {
            setRuta(rutaObjetivo.alias!)
            const batch = writeBatch(db);
            const rutaRef = doc(db, "Rutas", rutaObjetivo.rutaId)
            batch.update(rutaRef, { "activa": true, "cargado": true, "completado": false })
            if (rutasContext[rutaObjetivo.rutaId]?.enReparto) {
                paquetesParaAsignar.forEach(paquete => {
                    const sfRef = doc(db, "Paquetes", paquete.codigo);
                    batch.update(sfRef, {
                        "ruta": rutaObjetivo.rutaId,
                        "estado": 2,
                        historial: arrayUnion({
                            fecha: new Date(),
                            estado: 2,
                            detalles: "Tu pedido está en reparto"
                        })
                    });
                })
            } else {
                paquetesParaAsignar.forEach(paquete => {
                    const sfRef = doc(db, "Paquetes", paquete.codigo);
                    batch.update(sfRef, { "ruta": rutaObjetivo.rutaId });
                })
            }
            if (Object.keys(obtenerPremios()).length > 0) {

                if (rutaObjetivo.rutaId && rutasContext[rutaObjetivo.rutaId] && rutasContext[rutaObjetivo.rutaId!].transportista != "") {
                    const paquetes = [... new Set(paquetesParaAsignar.filter(p => p.codigo.slice(0, 4) != "DESP").map(p => p.codigo.slice(0, 10)))]
                    paquetes.forEach(
                        p => {
                            if (premiosContext[p]) {
                                console.log({
                                    "transportista": rutasContext[rutaObjetivo.rutaId!].transportista,
                                    "ruta": rutasContext[rutaObjetivo.rutaId!].id
                                })
                                const sfRef = doc(db, "Premios", p);
                                batch.update(sfRef, {
                                    "transportista": rutasContext[rutaObjetivo.rutaId!].transportista,
                                    "ruta": rutasContext[rutaObjetivo.rutaId!].id
                                });
                            }
                        })
                }
            }
            batch.commit();
            setModalPremiosData([obtenerPremios()]);
            setIsOpenModalPremios(true)
        }
    }

    const obtenerPremios = (): Record<string, number> => {
        const premios: Record<string, number> = {};
        const pedidos = [...new Set(paquetesParaAsignar.map((p) => p.codigo.slice(0, 10)))];
        pedidos.forEach((codigo) => {
            const premio = premiosContext[codigo]?.premios;
            if (!premio) return;
            Object.entries(premio).forEach(([nombrePremio, cantidad]) => {
                premios[nombrePremio] = (premios[nombrePremio] || 0) + cantidad;
            });
        });
        return premios;
    };

    const handleOnKeyDownIzquierda = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            let paquetesMover = paquetesNoAsignados.filter((p) => filtroIzquierda == p.codigo);
            let paquetesOtraLista = paquetesParaAsignar.filter((p) => filtroIzquierda == p.codigo);
            if (filtroIzquierda.length == 10) {
                paquetesMover = paquetesNoAsignados.filter((p) => filtroIzquierda == p.codigo.slice(0, 10));
                paquetesOtraLista = paquetesParaAsignar.filter((p) => filtroIzquierda == p.codigo.slice(0, 10));
            } else if (filtroIzquierda.length == 13) {
                if (paquetesMover.length > 0) {
                    paquetesMover = paquetesNoAsignados.filter((p) => filtroIzquierda.slice(0, 10) == p.codigo.slice(0, 10));
                    paquetesOtraLista = paquetesParaAsignar.filter((p) => filtroIzquierda.slice(0, 10) == p.codigo.slice(0, 10));
                }
            }

            if (paquetesMover.length == 0 && paquetesOtraLista.length == 0) {
                const noEncontradosCopy = [...noEncontrados]
                noEncontradosCopy.push(filtroIzquierda)
                setNoEncontrados(noEncontradosCopy)
            }

            setPaquetesNoAsignados(paquetesNoAsignados.filter((p) => !paquetesMover.map((paquete) => paquete.codigo).includes(p.codigo)));
            setPaquetesParaAsignar([...paquetesParaAsignar, ...paquetesMover]);
            setFiltroIzquierda("")
        }
    };
    const handleOnKeyDownDerecha = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            let paquetesMover = paquetesParaAsignar.filter((p) => filtroDerecha == p.codigo);
            if (filtroDerecha.length == 10) {
                paquetesMover = paquetesParaAsignar.filter((p) => filtroDerecha == p.codigo.slice(0, 10));
                console.log("PM=10", paquetesMover)
            } else if (filtroDerecha.length == 13) {
                if (paquetesMover.length > 0) {
                    paquetesMover = paquetesParaAsignar.filter((p) => filtroDerecha.slice(0, 10) == p.codigo.slice(0, 10));
                    console.log("PM=13", paquetesMover)
                }
            }
            console.log("PaquetesMover", paquetesMover)
            setPaquetesParaAsignar(paquetesParaAsignar.filter((p) => !paquetesMover.map((paquete) => paquete.codigo).includes(p.codigo)));
            setPaquetesNoAsignados([...paquetesNoAsignados, ...paquetesMover]);
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
                rutas={rutasContext}
                onConfirm={guardarRuta}
            />
            <ModalPremios
                isOpen={isOpenModalPremios}
                premios={modalPremiosData}
                ruta={ruta}
                onConfirm={() => { setModalPremiosData([]); setIsOpenModalPremios(false) }}
            />
            <h2>Sacar a reparto</h2>
            {
                <Table data={Object.entries(obtenerPremios()).map(([premio, cantidad]) => [
                    premio,
                    cantidad.toString(),
                ])} headers={["Premio", "Cantidad"]} />
            }
            <div className={classes.containerNoEncontrados}>
                {noEncontrados.map((c, _) => (
                    <label key={_}>{c}</label>
                ))}
            </div>
            <div className={classes.filtersContainer}>
                <div className={classes.filterGroup} style={{ margin: 0 }}>
                    <input autoFocus
                        style={{ margin: 0 }}
                        type="text"
                        placeholder="Buscar..."
                        value={filtroIzquierda}
                        onChange={handleOnChangeIzquierda}
                        onKeyDown={handleOnKeyDownIzquierda}
                    />
                </div>

                <div className={classes.filterGroup} style={{ margin: 0 }}>
                    <input
                        style={{ margin: 0 }}
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
                        <Table
                            data={paquetesNoAsignados.map(
                                (p) => {
                                    return [
                                        p.codigo,
                                        p.consultora,
                                        p.direccion
                                    ]
                                })}
                            headers={["Codigo", "Consultora", "Direccion"]}
                            searchTerms={filtroIzquierda.split(";")} />
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
                    </div>

                </center>
                <center style={{ width: "49%" }}>
                    <h3 style={{ marginTop: "0" }}>Paquetes para sacar a reparto ({paquetesParaAsignar.length})</h3>
                    <div className={classes.tableContainer}>
                        <Table data={paquetesParaAsignar.map((p) => {
                            return [
                                p.codigo,
                                p.consultora,
                                p.direccion
                            ]
                        })} headers={["Codigo", "Consultora", "Direccion"]}
                            searchTerms={filtroDerecha.split(";")}
                        />
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
                    </div>
                </center>
            </div>
            <Button disabled={paquetesParaAsignar.length ? false : true} onClick={() => { setIsOpenModal(true) }}>Cargar Ruta</Button>
        </>
    );
};

export default ArmadoRutasTab;