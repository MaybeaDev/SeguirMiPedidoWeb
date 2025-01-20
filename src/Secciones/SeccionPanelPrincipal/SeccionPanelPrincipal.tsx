import classes from "./SeccionPanelPrincipal.module.css"



import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useRef, useState } from "react";
import Card from "../../components/UI/Card/Card";
import { PaqueteContext } from "../../components/Otros/PrivateRoutes/PrivateRoutes";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";




const PanelPrincipal = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true)
    const [campañaActual, setCampaña] = useState<string[]>([])
    const { paquetesContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [] }>();
    const [paq, setPaq] = useState({
        noArribado: 0,
        devolucion: 0,
        enBodega: 0,
        entregaFallida: 0,
        enProceso: 0,
        entregado: 0,
        total: 0
    })
    const [paq2, setPaq2] = useState({
        noArribado: 0,
        devolucion: 0,
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
            devolucion: 0,
            enBodega: 0,
            entregaFallida: 0,
            enProceso: 0,
            entregado: 0,
            total: 0
        }
        const p2 = { ...p }
        console.log("UseEffect")
        getDoc(doc(db, "metadatos/campanias")).then(r => {
            const camp: string[] = r.data()!.campañas
            paquetesContext.forEach((paquete) => {
                if (camp[camp.length - 1] == (paquete.campaña)) {
                    p.total++
                    if (paquete.estado == 0) {
                        p.noArribado++
                    } else if (paquete.estado == 1) {
                        p.enBodega++
                    } else if (paquete.estado == 3) {
                        p.entregado++
                    } else if (paquete.estado == 4) {
                        p.entregaFallida++
                    } else if (paquete.estado == 5) {
                        p.devolucion++
                    } else {
                        p.enProceso++
                    }
                } else if (camp.includes(paquete.campaña)) {
                    p2.total++
                    if (paquete.estado == 0) {
                        p2.noArribado++
                    } else if (paquete.estado == 1) {
                        console.log(paquete)
                        p2.enBodega++
                    } else if (paquete.estado == 3) {
                        p2.entregado++
                    } else if (paquete.estado == 4) {
                        p2.entregaFallida++
                    } else if (paquete.estado == 5) {
                        p2.devolucion++
                    } else {
                        p2.enProceso++
                    }
                }
            })
            setCampaña(camp)
            setPaq(p)
            setPaq2(p2)
            setIsLoading(false)
        })
    }, [paquetesContext])

    return (
        <div>
            <h3>{`Campaña ${campañaActual[campañaActual.length - 1]}`}</h3>
            {isLoading ? (
                <>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card titulo="No arribados" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
                        <Card titulo="Devoluciones" style={{ width: "100%" }}><div className={classes.spinnerContainer}><div className={classes.spinner}></div></div></Card>
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
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/Enviado%20desde%20Santiago;${campañaActual[campañaActual.length - 1]}`) }} titulo="No arribados" style={{ width: "100%" }}>{paq.noArribado}</Card>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/Devuelto;${campañaActual[campañaActual.length - 1]}`) }} titulo="Devoluciones" style={{ width: "100%" }}>{paq.devolucion}</Card>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/En%20Bodega;${campañaActual[campañaActual.length - 1]}`) }} titulo="En bodega" style={{ width: "100%" }}>{paq.enBodega}</Card>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/En%20reparto;${campañaActual[campañaActual.length - 1]}`) }} titulo="En reparto" style={{ width: "100%" }}>{paq.enProceso}</Card>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/Entrega%20fallida;${campañaActual[campañaActual.length - 1]}`) }} titulo="Entrega Fallida" style={{ width: "100%" }}>{paq.entregaFallida}</Card>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/Entregado;${campañaActual[campañaActual.length - 1]}`) }} titulo="Entregado" style={{ width: "100%" }}>{paq.entregado}</Card>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card onClick={() => { navigate("/SeccionEmpresa/GestionDePaquetes/verPaquetes") }} titulo="Total" style={{ width: "100%" }}>{paq.total}</Card>
                    </div>
                    <br />
                    <br />
                    <br />

                    <h3>{`Campaña anterior (${campañaActual[campañaActual.length - 2]})`}</h3>

                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/Enviado%20desde%20Santiago;${campañaActual[campañaActual.length - 2]}`) }} titulo="No arribados" style={{ width: "100%" }}>{paq2.noArribado}</Card>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/Devuelto;${campañaActual[campañaActual.length - 2]}`) }} titulo="Devoluciones" style={{ width: "100%" }}>{paq2.devolucion}</Card>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/En%20Bodega;${campañaActual[campañaActual.length - 2]}`) }} titulo="En bodega" style={{ width: "100%" }}>{paq2.enBodega}</Card>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/En%20reparto;${campañaActual[campañaActual.length - 2]}`) }} titulo="En reparto" style={{ width: "100%" }}>{paq2.enProceso}</Card>
                        <Card onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/verPaquetes/Entrega%20fallida;${campañaActual[campañaActual.length - 2]}`) }} titulo="Entrega Fallida" style={{ width: "100%" }}>{paq2.entregaFallida}</Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default PanelPrincipal;