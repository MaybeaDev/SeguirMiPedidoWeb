




import { useEffect, useState } from "react";
import TableRutas from "../../../../components/Otros/TableRutas/TableRutas";
import classes from "./GestionRutas.module.css"
import { PaqueteContext, RutaContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
import { useOutletContext } from "react-router-dom";
interface Data {
    id: string,
    alias: string,
    paquetes: string,
    estado: string,
    transportista: string
}
const GestionRutas = () => {
    const { paquetesContext, rutasContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [], rutasContext: Record<string, RutaContext> }>();
    const [data, setData] = useState<Data[]>([]);
    const [trabajadores, setTrabajadores] = useState<{ id: string, nombre: string }[]>([])
    useEffect(() => {
        getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getData = () => {
        const dat:Data[] = []
        const trab:{ id: string, nombre: string }[] = []
        Object.keys(rutasContext).forEach((k) => {
            const r = rutasContext[k]
            let estado = "0";
            if (r.activa) estado = "1";
            if (r.cargado) estado = "2";
            if (r.enReparto) estado = "3";
            if (r.completado) estado = "4";
            dat.push({
                id: r.id,
                alias: r.alias,
                paquetes: paquetesContext.filter((p) => {
                    return p.ruta == r.id && [1, 2, 4].includes(p.estado) 
                }).length.toString(),
                estado: estado,
                transportista: r.transportistaNombre
            })
        })
        dat.forEach((r) => {
            const ruta = rutasContext[r.id]
            console.log(ruta, r.id)
            let estado = "0";
            if (ruta.activa) estado = "1";
            if (ruta.cargado) estado = "2";
            if (ruta.enReparto) estado = "3";
            if (ruta.completado) estado = "4";
            r.estado = estado;
            r.transportista = ruta.transportista
            trab.push({
                id:ruta.transportista,
                nombre: ruta.transportistaNombre
            })
        })
        console.log(dat)
        setData(dat)
        setTrabajadores(trab)
    }


    return (
        <div className={classes.container}>
            <h2>Gestionar Rutas</h2>
            <center>
                <div style={{ width: "90%" }}>
                    {data.length > 0 && (
                        <TableRutas initData={data} trabajadores={trabajadores} />
                    )}
                </div>
            </center>
        </div>
    )
}

export default GestionRutas;