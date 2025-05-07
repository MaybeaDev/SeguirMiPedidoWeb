import React, { useEffect, useRef, useState } from 'react';



import classes from "./Index.module.css"
import Card from '../../components/UI/Card/Card';
import { db } from '../../firebaseConfig';
import EstadoPaquete from '../../components/UI/EstadoPaquete/EstadoPaquete';
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import Button from '../../components/UI/Button/Button';
import { useNavigate, useParams } from 'react-router-dom';

interface Paquete {
    codigo?: string,
    ultimaModif?: Date,
    historial?: {
        estado: string,
        fecha: string,
        detalles: string
    }[]
}
interface PaqueteExtended extends Paquete {
    campaña: string,
    consultora: string
}


const Index = () => {
    // Estado para almacenar el valor del input y el resultado de la búsqueda
    const { id } = useParams()
    const navigate = useNavigate()
    const [orderCode, setOrderCode] = useState('');
    const [consCode, setConsCode] = useState('');
    const [searchResult, setSearchResult] = useState<Paquete>({});
    const [ordenBuscada, setOrdenBuscada] = useState(false);
    const [buscandoOrden, setBuscandoOrden] = useState(false);
    const [searchResultCons, setSearchResultCons] = useState<PaqueteExtended[]>([]);
    const [ordenConsBuscada, setOrdenConsBuscada] = useState(false);
    const [buscandoOrdenCons, setBuscandoOrdenCons] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log(id)
        if (id === undefined || isNaN(Number(id))) {
            navigate("/")
        }
        if (id) {
            setOrderCode(id)
            searchOrder(id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function verEstado(estadoNumerico: number): string {
        switch (estadoNumerico) {
            case 0:
                return 'Enviado desde Santiago a Puerto Montt';
            case 1:
                return 'Recibido en Bodega';
            case 2:
                return 'En reparto';
            case 3:
                return 'Entregado';
            case 4:
                return 'Falla en entrega, se reintentará';
            case 5:
                return 'Falla en entrega, devuelto al vendedor';
            default:
                return 'Estado desconocido';
        }
    }
    const searchOrder = async (code?: string) => {
        setBuscandoOrden(true)
        setOrdenBuscada(false)
        setSearchResult({})
        console.log(code, orderCode)
        const docRef = doc(db, "Paquetes", code ?? orderCode)
        const paquete = await getDoc(docRef)
        if (paquete.exists()) {
            const datos = paquete.data().historial.map((d: { estado: number, fecha: Timestamp, detalles: string, imagelink?: string }) => ({
                estado: verEstado(d.estado),
                fecha: d.fecha.toDate().toLocaleString(),
                detalles: d.detalles.toString(),
                imagelink: d.imagelink
            }))
            setSearchResult({ codigo: paquete.id, ultimaModif: datos[datos.length - 1].fecha, historial: datos.reverse() })
        } else {
            console.log(searchResultCons)
        }
        setOrdenBuscada(true)
    }

    const searchOrderCons = async (cons?: string) => {
        setBuscandoOrdenCons(true)
        setOrdenConsBuscada(true)
        setSearchResultCons([])
        const q = query(collection(db, "Paquetes"), where("consultora", "==", cons?.toUpperCase() ?? consCode.toUpperCase()))
        const paquetes = await getDocs(q)
        const result: PaqueteExtended[] = []
        paquetes.forEach((p) => {
            const datos = p.data().historial.map((d: { estado: number, fecha: Timestamp, detalles: string }) => ({
                estado: verEstado(d.estado),
                fecha: d.fecha.toDate().toLocaleString(),
                detalles: d.detalles.toString()
            }))
            result.push({ campaña: p.data().campania, codigo: p.id, consultora: p.data().consultora, ultimaModif: datos[datos.length - 1].fecha, historial: datos })
        })
        setSearchResultCons(result)
        setOrdenConsBuscada(false)
    }

    // Función para manejar el cambio en el campo de texto
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOrderCode(e.target.value);
    };

    // Función para manejar la tecla Enter
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            searchOrder();
        }
    };
    // Función para manejar el cambio en el campo de texto
    const handleInputChangeCons = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConsCode(e.target.value);
    };

    // Función para manejar la tecla Enter
    const handleKeyPressCons = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            searchOrderCons();
        }
    };

    return (
        <div className={classes.indexContainer}>
            <center>
                <Card style={{ width: "80%", marginTop: "40px" }}>
                    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                        <Card style={{ flex: 1 }}>
                            <h1 className={classes.h1} style={{ marginBottom: 5 }}>Buscar por codigo de pedido</h1>
                            <div className="search-box" style={{ flexDirection: "row", display: "flex", justifyContent: "center" }}>
                                <input
                                    style={{ flex: 1 }}
                                    type="text"
                                    value={orderCode}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Introduce el código del paquete"
                                />
                                <Button style={{ flex: 0, marginBlock: 15 }} onClick={() => { searchOrder() }}>Buscar</Button>
                            </div>
                        </Card>

                        <Card style={{ flex: 1 }}>
                            <h1 className={classes.h1} style={{ marginBottom: 5 }}>Buscar por codigo de consultora</h1>
                            <div className="search-box" style={{ flexDirection: "row", display: "flex", justifyContent: "center" }}>
                                <input
                                    style={{ flex: 1 }}
                                    type="text"
                                    value={consCode}
                                    onChange={handleInputChangeCons}
                                    onKeyDown={handleKeyPressCons}
                                    placeholder="Introduce el código de consultora"
                                />
                                <Button style={{ flex: 0, marginBlock: 15 }} onClick={() => { searchOrderCons() }}>Buscar</Button>
                            </div>
                        </Card>
                    </div>
                    <div className={classes.searchResult} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {searchResult.ultimaModif != undefined ? (
                            <p style={{ flex: 1 }}><b>Última modificación:</b> {searchResult.ultimaModif.toLocaleString()}</p>
                        ) :
                            ""
                        }
                        <div ref={targetRef} style={{ flex: 1 }}>
                            {searchResult.codigo != undefined ? (
                                searchResult.historial != undefined ? (
                                    <EstadoPaquete historial={searchResult.historial}></EstadoPaquete>
                                ) : (
                                    <p>Ha ocurrido un error???</p>
                                )
                            ) : (
                                buscandoOrden ? (
                                    ordenBuscada ? (
                                        <p>No encontrado</p>
                                    ) : (
                                        <p>Buscando el paquete...</p>
                                    )
                                ) : (
                                    <></>
                                )
                            )}
                        </div>
                    </div>
                    <div className={classes.containerResult}>
                        {ordenConsBuscada ? (
                            <center style={{ gridColumn: "span 2" }}>
                                <p>Buscando orden...</p>
                            </center>
                        ) : (
                            searchResultCons.length > 0 ? (
                                searchResultCons
                                    .sort((a, b) => {
                                        const getPriority = (item: typeof a) => {
                                            const lastState = item.historial![item.historial!.length - 1].estado ?? "";
                                            switch (lastState) {
                                                case "En reparto":
                                                    return 1; // Más prioritario
                                                case "Falla en entrega, se reintentará":
                                                    return 2;
                                                case "Falla en entrega, devuelto al vendedor":
                                                    return 3;
                                                case "Recibido en Bodega":
                                                    return 4;
                                                case "Enviado de bodega central a Puerto Montt":
                                                    return 5;
                                                case "Enviado desde Santiago a Puerto Montt":
                                                    return 5;
                                                case "Entregado":
                                                    return 6; // Menos prioritario
                                                default:
                                                    return 7; // Otros estados
                                            }
                                        };

                                        return getPriority(a) - getPriority(b);
                                    }).map((c) => {
                                        let estado = 0;
                                        switch (c.historial![c.historial!.length - 1].estado ?? "") {
                                            case "Enviado de bodega central a Puerto Montt":
                                                estado = 0;
                                                break;
                                            case "Enviado desde Santiago a Puerto Montt":
                                                estado = 0;
                                                break;
                                            case "Recibido en Bodega":
                                                estado = 1;
                                                break;
                                            case "En reparto":
                                                estado = 2;
                                                break;
                                            case "Entregado":
                                                estado = 3;
                                                break;
                                            case "Falla en entrega, se reintentará":
                                                estado = 4;
                                                break;
                                            case "Falla en entrega, devuelto al vendedor":
                                                estado = 5;
                                                break;
                                            default:
                                                estado = 6;
                                        }
                                        return (
                                            <div
                                                onClick={() => {
                                                    setOrderCode(c.codigo ?? "");
                                                    searchOrder(c.codigo);
                                                    targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                }}
                                                className={classes.containerResultItem}
                                                style={{
                                                    alignContent: "flex-start",
                                                    backgroundColor:
                                                        estado == 2
                                                            ? "rgba(255,255,0,0.05)"
                                                            : estado == 3
                                                                ? "rgba(0,255,0,0.05)"
                                                                : "rgba(255, 0, 0, 0.05)",
                                                }}
                                            >
                                                <div
                                                    className={classes.item}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        flexWrap: "wrap",
                                                        justifyContent: "space-between",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <label style={{ paddingInline: 5, flexShrink: 0 }}>Campaña: </label>
                                                    <label style={{ paddingInline: 5, textAlign: "right", flexGrow: 1 }}>{c.campaña}</label>
                                                </div>
                                                <div
                                                    className={classes.item}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        flexWrap: "wrap",
                                                        justifyContent: "space-between",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <label style={{ paddingInline: 5, flexShrink: 0 }}>Código de paquete: </label>
                                                    <label style={{ paddingInline: 5, textAlign: "right", flexGrow: 1 }}>{c.codigo}</label>
                                                </div>
                                                <div
                                                    className={classes.item}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        flexWrap: "wrap",
                                                        justifyContent: "space-between",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <label style={{ paddingInline: 5, flexShrink: 0 }}>Consultora: </label>
                                                    <label style={{ paddingInline: 5, textAlign: "right", flexGrow: 1 }}>{c.consultora}</label>
                                                </div>
                                                <div
                                                    className={classes.item}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        flexWrap: "wrap",
                                                        justifyContent: "space-between",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <label style={{ paddingInline: 5, flexShrink: 0 }}>Estado: </label>
                                                    <label style={{ paddingInline: 5, textAlign: "right", flexGrow: 1 }}>
                                                        {c.historial![c.historial!.length - 1].estado ?? ""}
                                                    </label>
                                                </div>
                                                <div
                                                    className={classes.item}
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        flexWrap: "wrap",
                                                        justifyContent: "space-between",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <label style={{ paddingInline: 5, flexShrink: 0 }}>Ultima modificación: </label>
                                                    <label style={{ paddingInline: 5, textAlign: "right", flexGrow: 1 }}>
                                                        {c.historial![c.historial!.length - 1].fecha ?? ""}
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })) : (
                                buscandoOrdenCons ? (
                                    <center style={{ gridColumn: "span 2" }}>
                                        <p>No se encontró ningun paquete con ese codigo de consultora</p>
                                    </center>
                                ) : (
                                    <></>
                                )
                            )
                        )}
                    </div>

                </Card>
            </center>
        </div >
    );
};

export default Index;
