import { useEffect, useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
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
    const [data, setData] = useState<Data[]>(props.initData)
    const [dataFiltered, setDataFiltered] = useState<Data[]>(props.initData)
    const [needSaveDataTransportista, setNeedSaveDataTransportista] = useState(false)
    const [needSaveDataEstado, setNeedSaveDataEstado] = useState(false)
    const [filtro, setFiltro] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false)

    const navigate = useNavigate()

    useEffect(() => {
        if (props.initData && props.initData.length > 0) {
            setIsLoading(true);
            setIsSaved(true);
            setNeedSaveDataEstado(false);
            setNeedSaveDataTransportista(false);
            setData(props.initData);
            setDataFiltered(props.initData);
            setIsLoading(false);
            setTimeout(() => { setIsSaved(false) }, 600)
        }
    }, [props.initData])

    useEffect(() => {
        handleFiltrar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtro, data])

    const handleChangeTransportista = async (value: string, index: number) => {
        const newData = data.map((data, i) => {
            if (i === index) {
                const newVal = {
                    ...data,
                    transportista: value
                }
                return newVal
            } else return data
        })
        setData(newData);
        const transportistasAntes = props.initData.map(it => it.transportista)
        const transportistasDespues = newData.map(it => it.transportista)
        let sonIguales = true

        transportistasAntes.forEach((it, index) => {
            const after = transportistasDespues[index]
            if (it != after) {
                sonIguales = false
            }
        })
        if (sonIguales) {
            setNeedSaveDataTransportista(false);
        } else {
            setNeedSaveDataTransportista(true);
        }
        handleFiltrar()
    };
    const handleChangeEstado = async (value: string, index: number) => {
        const newData = data.map((data, i) => {
            if (i === index) {
                const newVal = {
                    ...data,
                    estado: value
                }
                return newVal
            } else return data
        })
        setData(newData);
        const estadosAntes = props.initData.map(it => it.estado)
        const estadosDespues = newData.map(it => it.estado)
        let sonIguales = true

        estadosAntes.forEach((it, index) => {
            const after = estadosDespues[index]
            if (it != after) {
                sonIguales = false

            }
        })
        if (sonIguales) {
            setNeedSaveDataEstado(false);
        } else {
            setNeedSaveDataEstado(true);
        }
        handleFiltrar()
    };


    const handleFiltrar = () => {
        const query = filtro;
        const searchTerms = query
            .split(";") // Divide por punto y coma
            .map((term) => normalizeString(term)) // Normaliza cada término
            .filter((term) => term.length > 0); // Elimina términos vacíos
        const filteredData = data.filter((ruta) =>
            searchTerms.every((term) =>
                normalizeString(ruta.alias).includes(term)
            )
        );
        setDataFiltered(filteredData);
    }
    const normalizeString = (str: string): string => {
        return str
            .normalize("NFD") // Descompone los caracteres con tildes en base + tilde
            .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes y diacríticos
            .replace(/[\u200B-\u200D\uFEFF]/g, "") // Elimina caracteres invisibles
            .replace(/\s+/g, " ") // Reemplaza múltiples espacios por uno solo
            .trim() // Elimina espacios al inicio y final
            .toLowerCase(); // Convierte a minúsculas
    };



    const saveChanges = async () => {
        setIsLoading(true);
        const batch = writeBatch(db)

        const estadosAntes = props.initData.map((it) => [it.estado, it.id])
        const estadosDespues = data.map((it) => [it.estado, it.id])
        const transportistasAntes = props.initData.map((it) => [it.transportista, it.id])
        const transportistasDespues = data.map((it) => [it.transportista, it.id])

        const cambios: { [x: string]: { estado?: number, transportista?: string } } = {}
        transportistasAntes.forEach((it, index) => {
            const antes = it[0]
            const despues = transportistasDespues[index][0]
            if (antes != despues) {
                cambios[it[1]] = { transportista: despues }
            }
        })
        estadosAntes.forEach((it, index) => {
            const antes = it[0]
            const despues = estadosDespues[index][0]
            if (antes != despues) {
                cambios[it[1]] = { estado: parseInt(despues) }
            }
        })
        Object.keys(cambios).forEach(key => {
            const docRef = doc(db, "Rutas", key)
            const data: {
                transportista?: string,
                transportistaNombre?: string,
                activa?: boolean,
                cargado?: boolean,
                en_reparto?: boolean,
                completado?: boolean,
            } = {}
            if (cambios[key].transportista != undefined) {
                data.transportista = cambios[key].transportista
                data.transportistaNombre = props.trabajadores.find((t) => t.id == cambios[key].transportista)?.nombre
            }
            if (cambios[key].estado != undefined) {
                if (cambios[key].estado === 0) {   //Desactivada
                    data.completado = false
                    data.en_reparto = false
                    data.cargado = false;
                    data.activa = false;
                } else if (cambios[key].estado === 1) {   //Activada
                    data.completado = false
                    data.en_reparto = false
                    data.cargado = false;
                    data.activa = true;
                } else if (cambios[key].estado === 2) {   //Cargada
                    data.completado = false
                    data.en_reparto = false
                    data.cargado = true;
                    data.activa = true;
                } else if (cambios[key].estado === 3) {   //EnReparto
                    data.completado = false;
                    data.en_reparto = true;
                    data.cargado = true;
                    data.activa = true;
                } else if (cambios[key].estado === 4) {   //Completada
                    data.completado = true;
                    data.en_reparto = false;
                    data.cargado = false;
                    data.activa = false;
                }
            }
            batch.update(docRef, data)
        })
        await batch.commit();
        setIsLoading(false);
        setIsSaved(true);
        setNeedSaveDataEstado(false)
        setNeedSaveDataTransportista(false)
    };
    const highlightMatches = (text: string, terms: string[]): string => {
        if (!terms || terms.length === 0 || terms.every((term) => term.trim() === "")) {
            return text;
        }

        const escapedTerms = terms
            .map((term) => term.trim())
            .filter((term) => term.length > 0)
            .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

        if (escapedTerms.length === 0) {
            return text;
        }
        const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
        return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
    };


    return (
        <div>
            <input
                type="text"
                placeholder="Filtrar rutas..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />
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
                    {dataFiltered.map((ruta, index) => (
                        <tr key={index} className={classes.tr}>
                            <td
                                className={classes.td}
                                dangerouslySetInnerHTML={{
                                    __html: filtro
                                        ? highlightMatches(ruta.alias, [filtro])
                                        : ruta.alias,
                                }}
                            ></td>
                            <td className={classes.td}>
                                {parseInt(ruta.paquetes) ? (
                                    <Button
                                    onClick={()=>{navigate(`/SeccionEmpresa/GestionDePaquetes/editarRutas/${ruta.id}`)}}>
                                        {ruta.paquetes}
                                    </Button>
                                ) : (<p>{ruta.paquetes}</p>)}
                            </td>
                            <td className={classes.td}>
                                {ruta.estado != "3" ? (

                                    <select
                                        style={{ margin: 0, padding: "5px" }}
                                        value={ruta.estado}
                                        onChange={(e) => handleChangeEstado(e.target.value, index)}
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
                                        onChange={(e) => handleChangeTransportista(e.target.value, index)}
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

            {(needSaveDataTransportista || needSaveDataEstado) && (isLoading ?
                <div className={classes.spinnerContainer}>
                    <div className={classes.spinner}></div>
                </div>
                :
                <Button onClick={saveChanges} style={{ marginTop: "10px" }}>
                    Guardar Cambios
                </Button>)}
        </div>
    );
};

export default TableRutas;