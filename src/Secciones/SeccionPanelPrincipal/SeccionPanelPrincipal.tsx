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
    const paquetes = paquetesContext.filter(p => p.campaña?.includes(campañaActual[campañaActual.length - 1]) && p.id.endsWith("001"))
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
    if (import.meta.env.DEV) console.log("UseEffect")
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
          if (paquete.estado == 0) {
            p2.noArribado++
          } else if (paquete.estado == 1) {
            if (import.meta.env.DEV) console.log(paquete)
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

  const campaña_actual = campañaActual[campañaActual.length - 1]
  const p_campaña_actual = paquetesContext.filter(p => p.campaña === campaña_actual)
  const p_campaña_actual_arr = p_campaña_actual.filter(p => p.historial.length > 1).length
  const campaña_anterior = campañaActual[campañaActual.length - 2]
  const p_campaña_anterior = paquetesContext.filter(p => p.campaña === campaña_anterior)
  const p_campaña_anterior_arr = p_campaña_anterior.filter(p => p.historial.length > 1).length

  const entregados_en = (paquetes: PaqueteContext[], dias: number = 0) => {
    return paquetes.filter(p => {
      const arribo = p.historial[1]?.fecha.toDate()
      const entrega = p.historial.find(p => p.estado === 3)?.fecha.toDate()
      if (!arribo || !entrega) return false
      arribo.setDate(arribo.getDate() + dias)
      return arribo.getFullYear() == entrega.getFullYear() &&
        arribo.getMonth() == entrega.getMonth() &&
        arribo.getDate() == entrega.getDate()
    }).length
  }


  const fd_camp_act = entregados_en(p_campaña_actual, 0)
  const sd_camp_act = entregados_en(p_campaña_actual, 1)
  const td_camp_act = entregados_en(p_campaña_actual, 2)
  const ttd_camp_act = fd_camp_act + sd_camp_act + td_camp_act
  const ent_camp_act = p_campaña_actual.filter(p => p.estado === 3).length

  const fd_camp_ant = entregados_en(p_campaña_anterior, 0)
  const sd_camp_ant = entregados_en(p_campaña_anterior, 1)
  const td_camp_ant = entregados_en(p_campaña_anterior, 2)
  const ttd_camp_ant = fd_camp_ant + sd_camp_ant + td_camp_ant


  return (
    <div>
      <ModalCustom isOpen={isOpenModal}>
        <Table data={premiosCampañaActual} headers={["Premio", "Cantidad"]} />
        <Button onClick={() => { setIsOpenModal(false) }}>Cerrar</Button>
      </ModalCustom>
      <h3>{`Campaña ${campaña_actual}`}</h3>
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
            <Card titulo="Total" style={{ width: "100%" }}>
              <div className={classes.spinnerContainer}>
                <div className={classes.spinner}>
                </div>
              </div>
            </Card>
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
            <Card titulo="Totales" style={{ width: "100%" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>

                {/* Zonas */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h4 style={{ margin: 0 }}>Zonas</h4>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {Object.keys(paq.zonas).map(zona => (
                      <li key={zona}>
                        <b>{zona}:</b> {paq.zonas[zona]}
                      </li>
                    ))}
                    <li><b>Total paquetes: {paq.total}</b></li>
                    <li><Button onClick={() => setIsOpenModal(true)}>Ver premios</Button></li>
                  </ul>
                </div>

                {/* Estadísticas de entrega */}
                <div style={{ flex: 1, minWidth: 300 }}>
                  <h4 style={{ margin: 0 }}>Entregas</h4>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.2rem",
                    alignItems: "center",
                    marginBlock: 10,
                  }}>
                    <div>Primer día: {fd_camp_act} ({(fd_camp_act / p_campaña_actual_arr * 100).toFixed(2)}%)</div>
                    <div>Total 3 días: {ttd_camp_act} ({(ttd_camp_act / p_campaña_actual_arr * 100).toFixed(2)}%)</div>

                    <div>Segundo día: {sd_camp_act} ({(sd_camp_act / p_campaña_actual_arr * 100).toFixed(2)}%)</div>
                    <div>Más de 3 días: {ent_camp_act - ttd_camp_act} ({((ent_camp_act - ttd_camp_act) / p_campaña_actual_arr * 100).toFixed(2)}%)</div>

                    <div>Tercer día: {td_camp_act} ({(td_camp_act / p_campaña_actual_arr * 100).toFixed(2)}%)</div>
                    <div>No entregados: {p_campaña_actual_arr - ent_camp_act} ({((p_campaña_actual_arr - ent_camp_act) / p_campaña_actual_arr * 100).toFixed(2)}%)</div>

                  </div>
                </div>

              </div>
            </Card>

          </div>
          <br />
          <br />
          <br />

          <h3>{`Campaña anterior (${campaña_anterior})`}</h3>
          <div>
            <label> Entregados el primer dia: {fd_camp_ant} ({(fd_camp_ant * 100 / p_campaña_anterior_arr).toFixed(3)}%)</label><br />
            <label> Entregados el segundo dia: {sd_camp_ant} ({(sd_camp_ant * 100 / p_campaña_anterior_arr).toFixed(3)}%)</label><br />
            <label> Entregados el tercer dia: {td_camp_ant} ({(td_camp_ant * 100 / p_campaña_anterior_arr).toFixed(3)}%)</label><br />
            <label> Total 3 dias: {ttd_camp_ant} ({(ttd_camp_ant * 100 / p_campaña_anterior_arr).toFixed(3)}%)</label><br />
            <label> Mas de 3 dias: {paq2.total - ttd_camp_ant} ({((paq2.total - ttd_camp_ant) * 100 / p_campaña_anterior_arr).toFixed(3)}%)</label><br />
          </div>
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