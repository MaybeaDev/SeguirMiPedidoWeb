import Card from "../../components/UI/Card/Card";
import classes from "./SeccionReportes.module.css"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db, db_persistenceFree } from "../../firebaseConfig";
import { useEffect, useState } from "react";
import { PaqueteContext } from "../../components/Otros/PrivateRoutes/PrivateRoutes";
import Button from "../../components/UI/Button/Button";
import * as XLSX from "xlsx";
import { useNavigate, useOutletContext } from "react-router-dom";

const ReportesScreen = () => {
  const [isLoading, setLoading] = useState(true)
  const [campañas, setCampañas] = useState<string[]>([])
  const [paquetes, setPaquetes] = useState<PaqueteContext[]>([])
  const { userType } = useOutletContext<{userType:number | null }>();
  const navigation = useNavigate()


  useEffect(() => {
    if (userType){
      if ([1, 2, 3].includes(userType))
        obtenerCampañas()
    } else {
      navigation("/")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const obtenerCampañas = async () => {
    const ref = doc(db_persistenceFree, "metadatos", "campanias")
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const temp: string[] = []
      snap.data().campañas.forEach((campaña: string) => { temp.push(campaña) })
      console.log(snap.data().campañas)
      console.log(temp)
      setCampañas(temp)
      onCampañaChange(temp[0])
    }
  }

  const onCampañaChange = async (campaña: string) => {
    setLoading(true)
    console.log("Cambio Campaña a ", campaña)
    const q = query(collection(db, "Paquetes"), where("campania", "==", campaña))
    const docs = await getDocs(q)
    console.log(docs.size)
    const paquetesTemp: PaqueteContext[] = []
    docs.forEach((doc) => {
      const d = doc.data()
      if (paquetesTemp.find(p => p.id == doc.id.slice(0, 10))) { return }
      return paquetesTemp.push({
        id: doc.id.slice(0, 10),
        campaña: d.campania,
        consultora: d.consultora,
        contacto: d.contacto,
        direccion: d.direccion,
        estado: d.estado,
        facturacion: d.facturacion,
        historial: d.historial,
        receptor: d.receptor,
        referencia: d.referencia,
        ruta: d.ruta,
        rutaAlias: d.rutaAlias,
        transportistaNombre: d.transportistaNombre,
      });
    })
    console.log(paquetesTemp)
    setPaquetes(paquetesTemp)
    setLoading(false)
  }

  const descargarExcel = (paq: PaqueteContext[], titulo : string) => {
    const data: {
      Codigo: string,
      Fecha: string,
      Estado: string,
      Recibe: string,
    }[] = []
    paq.forEach((p: PaqueteContext) => {
      if (data.find((d) => d.Codigo == p.id.slice(0, 10))) { return }
      data.push({
        Codigo: p.id.slice(0, 10),
        Fecha: p.historial[p.historial.length - 1].fecha.toDate().toLocaleDateString(),
        Estado: (() => {
          switch (p.estado) {
            case 0:
              return "Enviado desde Santiago"
            case 1:
              return "En Bodega";
            case 2:
              return "En Reparto";
            case 3:
              return "Entregado";
            case 4:
              return "Entrega fallida";
            case 5:
              return "Devuelto";
            default:
              return "En Proceso";
          }
        })(),
        Recibe: p.historial[p.historial.length - 1].detalles.split("entregado a")[1] ?? "No especificado",
      })
    })
    console.log(data, paq)
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, "R. "+titulo+" C"+paq[0].campaña+" "+formatFecha(new Date())+".xlsx");
  }
  const formatFecha = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // +1 porque los meses empiezan en 0
    const year = d.getFullYear();
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    const sec = d.getSeconds().toString().padStart(2, '0');
  
    return `${day}-${month}-${year}, ${hour};${minute};${sec}`;
  };

  return (
    <div className={classes.container}>
      <h1>Generar Reportes</h1>
      <label style={{ paddingRight: "20px" }}>Campaña</label>
      <select onChange={(e) => { onCampañaChange(e.target.value) }}>
        {campañas.map((c) => {
          return <option value={c}>{c}</option>
        })}
      </select>
      <div className={classes.content}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 20px" }}>

          <Card titulo="Entregados" style={{ width: "100%" }}>
            <div className={classes.spinnerContainer}>
              {isLoading ?
                <div className={classes.spinner}></div>
                :
                <>
                  <label>Total: {paquetes.filter((p: PaqueteContext) => p.estado == 3).length}</label>
                  {paquetes.filter((p: PaqueteContext) => p.estado == 3).length != 0 &&
                  <Button onClick={() => { descargarExcel(paquetes.filter((p: PaqueteContext) => p.estado == 3).sort((a, b) => {
                        return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
                      }), "entregados") }}>Descargar Excel</Button>
                  }
                  <br />
                  <table style={{ width: "100%" }}>
                    <thead>
                      <th>Codigo</th>
                      <th>Fecha</th>
                    </thead>
                    <tbody>
                      {paquetes.filter((p: PaqueteContext) => p.estado == 3).sort((a, b) => {
                        return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
                      }).map((p: PaqueteContext) => {
                        return <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.historial[p.historial.length - 1].fecha.toDate().toLocaleString()}</td>
                          <td onClick={()=>{navigation("/"+p.id+"001")}}>&#128269;</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </>
              }
            </div>
          </Card>

          <Card titulo="Devueltos" style={{ width: "100%" }}>
            <div className={classes.spinnerContainer}>
              {isLoading ?
                <div className={classes.spinner}></div>
                :
                <>
                  <label>Total: {paquetes.filter((p: PaqueteContext) => p.estado == 5).length}</label>
                  {paquetes.filter((p: PaqueteContext) => p.estado == 5).length != 0 &&
                  <Button onClick={() => { descargarExcel(paquetes.filter((p: PaqueteContext) => p.estado == 5).sort((a, b) => {
                        return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
                      }), "devoluciones") }}>Descargar Excel</Button>
                  }
                  <br />
                  <table style={{ width: "100%" }}>
                    <thead>
                      <th>Codigo</th>
                      <th>Fecha</th>
                    </thead>
                    <tbody>
                      {paquetes.filter((p: PaqueteContext) => p.estado == 5).sort((a, b) => {
                        return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
                      }).map((p: PaqueteContext) => {
                        return <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.historial[p.historial.length - 1].fecha.toDate().toLocaleString()}</td>
                          <td onClick={()=>{navigation("/"+p.id+"001")}}>&#128269;</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </>
              }
            </div>
          </Card>

          <Card titulo="En proceso" style={{ width: "100%" }}>
            <div className={classes.spinnerContainer}>
              {isLoading ?
                <div className={classes.spinner}></div>
                :
                <>
                  <label>Total: {paquetes.filter((p: PaqueteContext) => ![3, 5].includes(p.estado)).length}</label>
                  {paquetes.filter((p: PaqueteContext) => ![3, 5].includes(p.estado)).length != 0 &&
                  <Button onClick={() => { descargarExcel(paquetes.filter((p: PaqueteContext) => ![3, 5].includes(p.estado)).sort((a, b) => {
                        return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
                      }), "En Proceso") }}>Descargar Excel</Button>
                  }
                  <br />
                  <table style={{ width: "100%" }}>
                    <thead>
                      <th>Codigo</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </thead>
                    <tbody>
                      {paquetes.filter((p: PaqueteContext) => ![3, 5].includes(p.estado)).sort((a, b) => {
                        return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
                      }).map((p: PaqueteContext) => {
                        return <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.historial[p.historial.length - 1].fecha.toDate().toLocaleString()}</td>
                          <td>{(() => {
                            switch (p.estado) {
                              case 0:
                                return "Enviado desde Santiago"
                              case 1:
                                return "En Bodega";
                              case 2:
                                return "En Reparto";
                              case 3:
                                return "Entregado";
                              case 4:
                                return "Entrega fallida";
                              case 5:
                                return "Devuelto";
                              default:
                                return "En Proceso";
                            }
                          })()}</td>
                          <td onClick={()=>{navigation("/"+p.id+"001")}}>&#128269;</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </>
              }
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ReportesScreen;