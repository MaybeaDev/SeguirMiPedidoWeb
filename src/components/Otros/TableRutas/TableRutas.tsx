import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import classes from "./TableRutas.module.css";
import Button from "../../UI/Button/Button";
import { useNavigate } from "react-router-dom";

interface Data {
    id: string,
    alias: string,
    paquetes: string,
    estado: string,
    transportista: string
}

const TableRutas = (props: { initData: Data[], trabajadores: { id: string, nombre: string }[] }) => {
    const [isSaved, setIsSaved] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        setIsSaved(true);
        setTimeout(() => { setIsSaved(false) }, 600)
    }, [props.initData])

    const handleChangeTransportista = async (value: string, rutaID: string) => {
        updateDoc(doc(db, "Rutas", rutaID), { transportista: value, transportistaNombre: props.trabajadores.find(t => t.id == value)!.nombre })

    };
    const handleChangeEstado = async (value: string, rutaID: string) => {
        const data = {
            completado: false,
            en_reparto: false,
            cargado: false,
            activa: false
        }
        if (value === "0") {   //Desactivada
            data.completado = false
            data.en_reparto = false
            data.cargado = false;
            data.activa = false;
        } else if (value === "1") {   //Activada
            data.completado = false
            data.en_reparto = false
            data.cargado = false;
            data.activa = true;
        } else if (value === "2") {   //Cargada
            data.completado = false
            data.en_reparto = false
            data.cargado = true;
            data.activa = true;
        } else if (value === "3") {   //EnReparto
            data.completado = false;
            data.en_reparto = true;
            data.cargado = true;
            data.activa = true;
        } else if (value === "4") {   //Completada
            data.completado = true;
            data.en_reparto = false;
            data.cargado = false;
            data.activa = false;
        }
        updateDoc(doc(db, "Rutas", rutaID), data)
    };

    return (
        <div>
            <table width="100%" className={`${classes.table} ${isSaved && "bouncing"}`}>
                <thead className={classes.thead}>
                    <tr className={classes.trHeadder}>
                        <th className={classes.th}>Ruta</th>
                        <th className={classes.th}>Paquetes</th>
                        <th className={classes.th}>Estado</th>
                        <th className={classes.th}>Transportista</th>
                    </tr>
                </thead>
                <tbody className={classes.tbody}>
                    {props.initData.map((ruta, index) => (
                        <tr key={index} className={classes.tr}>
                            <td className={classes.td}>{ruta.alias}</td>
                            <td className={classes.td}>
                                {parseInt(ruta.paquetes) ? (
                                    <Button
                                        onClick={() => { navigate(`/SeccionEmpresa/GestionDePaquetes/editarRutas/${ruta.id}`) }}>
                                        {ruta.paquetes}
                                    </Button>
                                ) : (<p className={classes.p}>{ruta.paquetes}</p>)}
                            </td>
                            <td className={classes.td}>
                                {ruta.estado != "" ? (

                                    <select
                                        style={{ margin: 0, padding: "5px" }}
                                        value={ruta.estado}
                                        onChange={(e) => handleChangeEstado(e.target.value, ruta.id)}
                                    >
                                        <option value="0">Inactiva</option>
                                        <option value="1">Activa</option>
                                        <option value="2">Cargada</option>
                                        <option value="3">En reparto</option>
                                        <option value="4">Completada</option>
                                    </select>
                                ) : (
                                    <label>En reparto</label>
                                )}
                            </td>
                            <td className={classes.td}>
                                {(ruta.estado != "3") ? (

                                    <select
                                        style={{ margin: 0, padding: "5px" }}
                                        value={ruta.transportista}
                                        onChange={(e) => handleChangeTransportista(e.target.value, ruta.id)}
                                    >
                                        <option value="">No asignado</option>
                                        {props.trabajadores.map((trabajador, index) => (

                                            <option
                                                key={index}
                                                value={trabajador.id}
                                            >
                                                {trabajador.nombre}
                                            </option>))}
                                    </select>
                                ) : (<>
                                    <label>{props.trabajadores.find((it) => it.id == ruta.transportista)?.nombre}</label>
                                </>)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableRutas;