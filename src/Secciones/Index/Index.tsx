import React, { useEffect, useState } from 'react';



import classes from "./Index.module.css"
import Card from '../../components/UI/Card/Card';
import { db } from '../../firebaseConfig';
import EstadoPaquete from '../../components/UI/EstadoPaquete/EstadoPaquete';
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import Button from '../../components/UI/Button/Button';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '../../components/UI/Table/Table';

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
    campaña:string,
    consultora:string
}


const Index = () => {
    // Estado para almacenar el valor del input y el resultado de la búsqueda
    const { id } = useParams()
    const navigate = useNavigate()
    const [orderCode, setOrderCode] = useState('');
    const [consCode, setConsCode] = useState('');
    const [searchResult, setSearchResult] = useState<Paquete>({});
    const [searchResultCons, setSearchResultCons] = useState<PaqueteExtended[]>([]);

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
                return 'Enviado desde el almacén';
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
        console.log(code, orderCode)
        const docRef = doc(db, "Paquetes", code ?? orderCode)
        const paquete = await getDoc(docRef)
        if (paquete.exists()) {
            const datos = paquete.data().historial.map((d: { estado: number, fecha: Timestamp, detalles: string }) => ({
                estado: verEstado(d.estado),
                fecha: d.fecha.toDate().toLocaleString(),
                detalles: d.detalles.toString()
            }))
            setSearchResult({ codigo: paquete.id, ultimaModif: datos[datos.length - 1].fecha, historial: datos.reverse() })
        } else {
            setSearchResult({})
            console.log(searchResultCons)
        }
    }

    const searchOrderCons = async (cons?: string) => {
        console.log(cons)
        setSearchResultCons([])
        const q = query(collection(db, "Paquetes"), where("consultora", "==", cons ?? consCode))
        const paquetes = await getDocs(q)
        const result: PaqueteExtended[] = []
        paquetes.forEach((p) => {
            const datos = p.data().historial.map((d: { estado: number, fecha: Timestamp, detalles: string }) => ({
                estado: verEstado(d.estado),
                fecha: d.fecha.toDate().toLocaleString(),
                detalles: d.detalles.toString()
            }))
            result.push({ campaña:p.data().campania, codigo: p.id, consultora:p.data().consultora, ultimaModif: datos[datos.length - 1].fecha, historial: datos })
        })
        console.log(result)
        setSearchResultCons(result)
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
                    <div style={{ display: "flex", width: "100%" }}>
                        <Card style={{ width: "50%", marginTop: "40px" }}>
                            <h1 className={classes.h1}>Buscar por codigo de pedido</h1>
                            <div className="search-box">
                                <input
                                    style={{ width: "40%" }}
                                    type="text"
                                    value={orderCode}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Introduce el código del paquete"
                                />
                                <Button onClick={()=>{searchOrder()}}>Buscar</Button>
                            </div>
                        </Card>

                        <Card style={{ width: "50%", marginTop: "40px" }}>
                            <h1 className={classes.h1}>Buscar por codigo de consultora</h1>
                            <div className="search-box">
                                <input
                                    style={{ width: "40%" }}
                                    type="text"
                                    value={consCode}
                                    onChange={handleInputChangeCons}
                                    onKeyDown={handleKeyPressCons}
                                    placeholder="Introduce el código de consultora"
                                />
                                <Button onClick={()=>{searchOrderCons()}}>Buscar</Button>
                            </div>
                        </Card>
                    </div>
                    <div className={classes.searchResult}>
                        {searchResult.ultimaModif != undefined ? (
                            <p><b>Última modificación:</b> {searchResult.ultimaModif.toLocaleString()}</p>
                        ) :
                            ""
                        }
                        {searchResult.historial != undefined ? (
                            <>
                                <EstadoPaquete historial={searchResult.historial}></EstadoPaquete>
                            </>
                        ) : searchResultCons.length >= 0 && (
                            <p>Introduce un codigo de paquete</p>
                        )
                        }
                    </div>
                    {searchResultCons.length >= 0 ? (
                        <div>
                            <Table data={searchResultCons.map((p) => {
                                return [
                                    p.campaña,
                                    p.codigo ?? "",
                                    p.consultora,
                                    p.historial![p.historial!.length - 1].estado ?? "",
                                    p.historial![p.historial!.length - 1].fecha ?? "",
                                ]
                            })} headers={[
                                "Campaña",
                                "Codigo",
                                "Consultora",
                                "Estado",
                                "Ultima modificacion"
                            ]}>
                            </Table>
                        </div>
                    ) : (
                        <div>
                            <p>No se encontraron resultados para la consulta.</p>
                        </div>
                    )}
                </Card>
            </center>
        </div>
    );
};

export default Index;
