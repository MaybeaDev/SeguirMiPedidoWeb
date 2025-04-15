import classes from "./SeccionPanelPrincipal.module.css"



import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useRef, useState } from "react";
import Card from "../../components/UI/Card/Card";
import { PaqueteContext } from "../../components/Otros/PrivateRoutes/PrivateRoutes";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Button from "../../components/UI/Button/Button";
import ModalCustom from "../../components/Layout/ModalCustom/ModalCustom";
import Table from "../../components/UI/Table/Table";


interface Totales {
    noArribado: number,
    devolucion: number,
    enBodega: number,
    entregaFallida: number,
    enProceso: number,
    entregado: number,
    total: number,
    zonas: Record<string, number>
}

const PanelPrincipal = () => {
    const navigate = useNavigate();
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [campañaActual, setCampaña] = useState<string[]>([])
    const { paquetesContext, premiosContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [], premiosContext: Record<string, { premios: Record<string, number>; transportista: string }> }>();
    const [premiosCampañaActual, setPremiosCampañaActual] = useState<string[][]>([])
    const [paq, setPaq] = useState<Totales>({
        noArribado: 0,
        devolucion: 0,
        enBodega: 0,
        entregaFallida: 0,
        enProceso: 0,
        entregado: 0,
        total: 0,
        zonas: {}
    })
    const [paq2, setPaq2] = useState<Totales>({
        noArribado: 0,
        devolucion: 0,
        enBodega: 0,
        entregaFallida: 0,
        enProceso: 0,
        entregado: 0,
        total: 0,
        zonas: {}
    })
    const isFirstRender = useRef(true);
    useEffect(() => {
        const paquetes = paquetesContext.filter(p => p.campaña?.includes(campañaActual[campañaActual.length - 1]))
        const premios: Record<string, number> = {}
        paquetes.forEach(p => {
            const pedido = p.id.slice(0, 10)
            if (premiosContext[pedido]) {
                const prem = premiosContext[pedido].premios
                Object.keys(prem).forEach(premioNombre => {
                    if (premios[premioNombre]) {
                        premios[premioNombre] += prem[premioNombre]
                    } else {
                        premios[premioNombre] = prem[premioNombre]
                    }
                })
            }
        })
        const premiosList = Object.keys(premios).map(nombre => {
            return [
                nombre,
                premios[nombre].toString()
            ]
        })
        premiosList.push(["Total:", premiosList.reduce((tot, premio) => tot + parseInt(premio[1]), 0).toString()])
        setPremiosCampañaActual(premiosList)

    }, [campañaActual, paquetesContext, premiosContext])
    useEffect(() => {
        if (isFirstRender.current && paquetesContext.length == 0) {
            isFirstRender.current = false;
            return;
        }
        const p: Totales = {
            noArribado: 0,
            devolucion: 0,
            enBodega: 0,
            entregaFallida: 0,
            enProceso: 0,
            entregado: 0,
            total: 0,
            zonas: {}
        }
        const p2 = { ...p }
        console.log("UseEffect")
        getDoc(doc(db, "metadatos/campanias")).then(r => {
            const camp: string[] = r.data()!.campañas
            paquetesContext.forEach((paquete) => {
                if (camp[camp.length - 1] == (paquete.campaña)) {
                    p.total++
                    if (p.zonas[paquete.zona]) {
                        p.zonas[paquete.zona]++
                    } else if (paquete.zona != null) {
                        p.zonas[paquete.zona] = 1
                    } else if (paquete.zona == null) {
                        if (p.zonas["Otros"]) {
                            p.zonas["Otros"]++
                        } else {
                            p.zonas["Otros"] = 1
                        }
                    }
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
                } else if (camp[camp.length - 2] == (paquete.campaña)) {
                    p2.total++
                    if (p.zonas[paquete.zona]) {
                        p.zonas[paquete.zona]++
                    } else if (paquete.zona != null) {
                        p.zonas[paquete.zona] = 1
                    }
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
            <ModalCustom isOpen={isOpenModal}>
                <Table data={premiosCampañaActual} headers={["Premio", "Cantidad"]} />
                <Button onClick={() => { setIsOpenModal(false) }}>Cerrar</Button>
            </ModalCustom>
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
                        <Card titulo="Total" style={{ width: "100%" }}>
                            {Object.keys(paq.zonas).map(zona => (
                                <>
                                    <b>{zona}:</b> {paq.zonas[zona]}<br />
                                </>
                            ))}
                            <b>Total: </b>{paq.total}
                            <br /><Button onClick={() => { setIsOpenModal(true) }}>Ver total premios</Button>
                        </Card>
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