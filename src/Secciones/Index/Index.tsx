import React, { useEffect, useState } from 'react';



import classes from "./Index.module.css"
import Card from '../../components/UI/Card/Card';
import { db } from '../../firebaseConfig';
import EstadoPaquete from '../../components/UI/EstadoPaquete/EstadoPaquete';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import Button from '../../components/UI/Button/Button';
import { useNavigate, useParams } from 'react-router-dom';
const Index = () => {
    // Estado para almacenar el valor del input y el resultado de la búsqueda
    const {id} = useParams()
    const navigate = useNavigate()
    const [orderCode, setOrderCode] = useState('');
    const [searchResult, setSearchResult] = useState<{ codigo?: string, ultimaModif?: Date, historial?: { estado: string, fecha: string, detalles: string }[] }>({ historial: [] });

    useEffect(() => {
        console.log(id)
        if (id === undefined || isNaN(Number(id))) {
            navigate("/")
          }
        if(id){
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
                return 'Recepcionado por empresa transportista';
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
    const searchOrder = async (code?:string) => {
        const docRef = doc(db, "Paquetes", code ?? orderCode)
        const paquete = await getDoc(docRef)
        if (paquete.exists()) {
            const datos = paquete.data().historial.map((d: { estado: number, fecha: Timestamp, detalles: string }) => ({
                estado: verEstado(d.estado),
                fecha: d.fecha.toDate().toLocaleString(),
                detalles:d.detalles.toString()
            }))
            setSearchResult({ codigo: paquete.id, ultimaModif: datos[datos.length - 1].fecha, historial: datos.reverse() })
        } else {
            setSearchResult({})
        }
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

    return (
        <div className={classes.indexContainer}>
            <center>

                <Card style={{ width: "80%", marginTop: "40px" }}>
                    <h1 className={classes.h1}>Buscar Pedido</h1>
                    <div className="search-box">
                        <input
                        style={{width:"40%"}}
                            type="text"
                            value={orderCode}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Introduce el código del paquete"
                        />
                        <Button onClick={searchOrder}>Buscar</Button>
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
                        ) :
                            <p>Pedido no encontrado :c</p>
                        }
                    </div>
                </Card>
            </center>
        </div>
    );
};

export default Index;
