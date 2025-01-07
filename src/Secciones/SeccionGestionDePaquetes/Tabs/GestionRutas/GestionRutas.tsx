import classes from "./GestionRutas.module.css"



import { useEffect, useState } from "react";
import TableRutas from "../../../../components/Otros/TableRutas/TableRutas";
import { PaqueteContext, RutaContext, TransportistaContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
import { useOutletContext } from "react-router-dom";
interface Data {
    id: string,
    alias: string,
    paquetes: string,
    estado: string,
    transportista: string
}
const GestionRutas = () => {
    const { paquetesContext, rutasContext, transportistasContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [], rutasContext: Record<string, RutaContext>, transportistasContext: Record<string, TransportistaContext> }>();
    const [data, setData] = useState<Data[]>([]);
    const [trabajadores, setTrabajadores] = useState<{ id: string, nombre: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        if (paquetesContext.length == 0) {
            return;
        }
        getData()
        setIsLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paquetesContext, rutasContext, transportistasContext])

    const getData = () => {
        const dat: Data[] = []
        const trab: { id: string, nombre: string }[] = []
        Object.values(transportistasContext).forEach((t) => {
            if (t.tipo == 0) {
                trab.push({id: t.id, nombre: t.nombre})
            }
        })
        Object.values(rutasContext).forEach((k) => {
            let estado = "0";
            if (k.activa) estado = "1";
            if (k.cargado) estado = "2";
            if (k.enReparto) estado = "3";
            if (k.completado) estado = "4";
            dat.push({
                id: k.id,
                alias: k.alias,
                paquetes: paquetesContext.filter((p) => {
                    return p.ruta == k.id && [1, 2, 4].includes(p.estado)
                }).length.toString(),
                estado: estado,
                transportista: k.transportista
            })
        })
        setData(dat)
        setTrabajadores(trab)
    }


    return (
        <div className={classes.container}>
            <h2>Gestionar Rutas</h2>
            <center>
                <div style={{ width: "90%" }}>
                    {isLoading ? (
                        <div className={classes.spinnerContainer}>
                            <div className={classes.spinner}></div>
                            <p>Obteniendo datos sobre las rutas...</p>
                        </div>
                    ) :
                        data.length > 0 && (
                            <TableRutas initData={data} trabajadores={trabajadores} />
                        )
                    }
                </div>
            </center>
        </div>
    )
}

export default GestionRutas;