import classes from "./SeccionPanelPrincipal.module.css"



import { useOutletContext } from 'react-router-dom';
import { useEffect, useRef, useState } from "react";
import Card from "../../components/UI/Card/Card";
import { PaqueteContext } from "../../components/Otros/PrivateRoutes/PrivateRoutes";




const PanelPrincipal = () => {
    const [isLoading, setIsLoading] = useState(true)
    const { paquetesContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [] }>();
    const [paq, setPaq] = useState({
        noArribado: 0,
        enBodega: 0,
        entregaFallida: 0,
        enProceso: 0,
        entregado: 0,
        total: 0
    })
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current && paquetesContext.length == 0) {
            isFirstRender.current = false;
            return;
        }
        const p = {
            noArribado: 0,
            enBodega: 0,
            entregaFallida: 0,
            enProceso: 0,
            entregado: 0,
            total: 0
        }
        console.log("UseEffect")
        paquetesContext.forEach((paquete) => {
            p.total++
            if (paquete.estado == 0) {
                p.noArribado++
            } else if (paquete.estado == 1) {
                p.enBodega++
            } else if(paquete.estado == 4){
                p.entregaFallida++
            } else if (paquete.estado == 3) {
                p.entregado++
            } else {
                p.enProceso++
            }
        })
        setPaq(p)
        setIsLoading(false)
    }, [paquetesContext])

    return (
        <div>
            <h2>Panel Principal</h2>
            {isLoading ? (
                <>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card titulo="No arribados" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
                        <Card titulo="En bodega" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card titulo="En reparto" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
                        <Card titulo="Entrega Fallida" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
                        <Card titulo="Entregado" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card titulo="Total" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card titulo="No arribados" style={{ width: "100%" }}>{paq.noArribado}</Card>
                        <Card titulo="En bodega" style={{ width: "100%" }}>{paq.enBodega}</Card>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card titulo="En reparto" style={{ width: "100%" }}>{paq.enProceso}</Card>
                        <Card titulo="Entrega Fallida" style={{ width: "100%" }}>{paq.entregaFallida}</Card>
                        <Card titulo="Entregado" style={{ width: "100%" }}>{paq.entregado}</Card>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card titulo="Total" style={{ width: "100%" }}>{paq.total}</Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default PanelPrincipal;