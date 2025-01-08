import classes from "./IngresarFacturacion.module.css"


import { useState } from "react";
import Button from "../../../../components/UI/Button/Button";
import * as XLSX from "xlsx";
import FileDropzone from "../../../../components/UI/DropZone/FileDropZone";
import Table from "../../../../components/UI/Table/Table";
import { doc, getDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { obtenerCoordenadas } from "../../../../mapbox";
import { PaqueteContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
import { useOutletContext } from "react-router-dom";

interface Paquete {
    codigo: string,
    consultora: string,
    nombreConsultora: string,
    facturacion: string,
    direccion: string,
    referencia: string,
    telefono: string,
    campaña: string,
}

const IngresarFacturacionTab = () => {
    const { paquetesContext } = useOutletContext<{ paquetesContext: PaqueteContext[] }>();

    const [errorFile, setErrorFile] = useState<string | null>(null)
    const [data, setData] = useState<Paquete[]>([]);
    const [premios, setPremios] = useState<Record<string, Record<string, number>>>({});
    const [isLoading, setIsLoading] = useState(false)
    const [loadingState, setLoadingState] = useState(false)
    const [avanceCarga, setAvanceCarga] = useState(0)
    const [totalCarga, setTotalCarga] = useState(0)
    const [facturaciones, setFacturaciones] = useState<string[]>([])


    const excelDateToJSDate = (serial: number): string => {
        const excelEpoch = new Date(Date.UTC(1900, 0, 1));
        const daysOffset = serial - 1;
        const jsDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);

        const day = String(jsDate.getUTCDate() - 1).padStart(2, '0');
        const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
        const year = jsDate.getUTCFullYear();

        return `${day}-${month}-${year}`;
    }
    const handleFileSelect = (file: File) => {
        setData([]);
        setIsLoading(true);
        setErrorFile(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target?.result;
            if (fileContent) {
                const workbook = XLSX.read(fileContent, { type: "array" });
                const worksheet = workbook.Sheets["Facturacion Total"];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
                setIsLoading(false);
                const parsedHeaders = data.map((row) => ([row[0] as string, row[5] as string, row[15] as string, row[9] as string, row[10] as string, row[11] as string, row[12] as string, row[26] as string, row[17] as string, row[18] as string]))
                const comienzoTabla = parsedHeaders.findIndex((headers) => {
                    if (JSON.stringify(headers) === JSON.stringify(["PEDIDO", "Fecha", "CAJAS", "CONSULTORA", "NOMBRE CONSULTORA", "DIRECCION", "TELEFONO", "CAMPAÑA FACTURACION", "NOMBRE AFP", "CANTIDAD"])) {
                        return true
                    }
                })
                if (comienzoTabla >= 0) {
                    const parsedData = data.slice(comienzoTabla + 1).map((row) => {
                        return {
                            codigo: row[0] ? row[0].toString().trim() : "",
                            cajas: row[15] ? parseInt(row[15]) : 0,
                            consultora: row[9] ? row[9].toString().trim() : "",
                            nombreConsultora: row[10] ? row[10].toString().trim() : "",
                            facturacion: row[5] ? excelDateToJSDate(parseInt(row[5])) : "",
                            direccion: row[11] ? row[11].toString().trim() : "",
                            telefono: row[12] ? row[12].toString().trim() : "",
                            campaña: row[26] ? row[26].toString().trim() : "",
                            nombreAFP: row[17] ? row[17].toString().trim() : "",
                            cantidadAFP: row[18] ? row[18].toString().trim() : "",
                        }
                    });
                    const validData = parsedData.filter(item => item.codigo != "" && String(item.codigo).trim() !== "");
                    setFacturaciones([...new Set(validData.map(p => p.facturacion))])
                    setIsLoading(false);
                    const fullData: Paquete[] = []
                    const premios: Record<string, Record<string, number>> = {}
                    validData.forEach((pedido) => {
                        if (pedido.nombreAFP != "") {
                            if (!premios[pedido.codigo]) {
                                premios[pedido.codigo] = {}
                            }
                            if (!premios[pedido.codigo][pedido.nombreAFP]) {
                                premios[pedido.codigo][pedido.nombreAFP] = 0
                            }
                            premios[pedido.codigo][pedido.nombreAFP] += parseInt(pedido.cantidadAFP)
                        }
                        for (let i = 1; i <= pedido.cajas; i++) {
                            const direccion = pedido.direccion.split("REFERENCIA")[0] ?? pedido.direccion;
                            const referencia = pedido.direccion.split("REFERENCIA")[1] ?? "";
                            fullData.push({
                                codigo: pedido.codigo + "00" + i,
                                consultora: pedido.consultora,
                                nombreConsultora: pedido.nombreConsultora,
                                direccion: direccion,
                                facturacion: pedido.facturacion,
                                referencia: referencia,
                                telefono: pedido.telefono,
                                campaña: pedido.campaña,
                            })
                        }
                    })
                    const newData = fullData.filter(f => !paquetesContext.map(pc => pc.id).includes(f.codigo))
                    const pedidos = [...new Set(newData.map(d => d.codigo))]
                    const newPremios: Record<string, Record<string, number>> = {}
                    pedidos.forEach(p => {
                        if (premios[p])
                        newPremios[p] = premios[p]
                    })
                    setPremios(newPremios)
                    ingresarData(newData);
                } else {
                    setErrorFile("La plantilla no es la correcta. Descarga la plantilla con el botón superior");
                    return;
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };
    const guardarEnFirebase = async (
        data: Paquete[]
    ) => {
        const batch = writeBatch(db);
        setTotalCarga(data.length)
        let contador = 0
        const campanias: Set<string> = new Set();
        for (const item of data) {
            const docRef = doc(db, "Paquetes", String(item.codigo));
            contador++
            const coordenadas = await obtenerCoordenadas(item.direccion);
            setAvanceCarga(contador)
            const direccion = item.direccion.split("REFERENCIA")[0] ?? item.direccion;
            const referencia = item.direccion.split("REFERENCIA")[1] ?? "";
            if (!campanias.has(item.campaña)) campanias.add(item.campaña)
            const object = {
                contacto: String(item.telefono),
                consultora: item.consultora,
                campania: item.campaña,
                direccion: direccion.trim(),
                facturacion: item.facturacion,
                estado: 0,
                receptor: item.nombreConsultora,
                referencia: referencia.trim(),
                ruta: "",
                coordenadas: coordenadas,
                historial: [
                    {
                        detalles: "Pronto recibiremos tu pedido",
                        estado: 0,
                        fecha: Timestamp.now(),
                    },
                ],
            };
            batch.set(docRef, object);
        }
        Object.keys(premios).forEach((k) => {
            batch.set(doc(db, "Premios", k), { premios: premios[k], transportista: "" })
        })
        const docRef = doc(db, "metadatos/campanias");
        const campañasMetadata = await getDoc(docRef);
        const campañasList = new Set(campañasMetadata.data()!.campañas);
        campanias.forEach((c) => {
            if (!campañasList.has(c)) {
                campañasList.add(c);
            }
        });
        // Convertir de nuevo a array si necesitas un array:
        const nuevoArrayCampañas = Array.from(campañasList);

        batch.set(docRef, { campañas: nuevoArrayCampañas })
        await batch.commit();
        setData([])
        window.location.reload()
        console.log("Batch commit exitoso");
        return
    };
    const handleConfirmarCarga = async () => {
        setLoadingState(true)
        const idsToCheck = data.map((item) => String(item.codigo));
        const encontrados = obtenerDocumentosExistentes(idsToCheck)
        if (idsToCheck.length == encontrados.length) {
            alert("Todos los paquetes ya han sido ingresados, se abortará la operacion")
        } else {
            await guardarEnFirebase(data.filter(p => !encontrados.includes(p.codigo)))
        }
        setLoadingState(false)
    }
    const obtenerDocumentosExistentes = (ids: string[]): string[] => {
        const encontrados = paquetesContext.filter(p => ids.includes(p.id))
        return encontrados.map(p => p.id)
    };
    const ingresarData = (d: Paquete[]) => {
        console.log(d)
        if (d.length > 0) {
            setData(d);
        }
    }

    return (
        <div className={classes.root}>
            {loadingState && (
                <div className={classes.loadingOverflow}>
                    <div className={classes.card}>
                        <div className={classes.spinnerContainer}>
                            <div className={classes.spinner}></div>
                            {totalCarga != 0 ? (
                                <p>{`Guardando ${avanceCarga} de ${totalCarga} paquetes`}</p>
                            ) : (
                                <p>Verificando codigos</p>
                            )}
                            <p><b>NO actualice</b> o regargue esta pagina</p>
                        </div>
                    </div>
                </div>
            )}
            <h2>Sube la facturación Actualizada</h2>
            <br />
            <div className={classes.content}>
                <div className={classes.leftContent}>
                    <h3>Subir plantilla</h3>
                    <center>
                        {errorFile ? <FileDropzone onFileSelect={handleFileSelect} errorString={`${errorFile}`} />
                            : <FileDropzone onFileSelect={handleFileSelect} />}
                        <br />
                        <Button style={{ width: "60%" }} disabled={data.length ? (paquetesContext.length ? false : true) : true} onClick={handleConfirmarCarga}>Confirmar carga</Button>
                    </center>
                </div>
                <div className={classes.rightContent}>
                    {facturaciones.length > 0 &&
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label>Facturaciones encontradas</label><br />
                            <div style={{ display: "flex", flexDirection: "row" }}>
                                {facturaciones.filter(f => data.map(d => d.facturacion).includes(f)).map(p => (
                                    <label>{p}, </label>
                                ))
                                }
                            </div>
                        </div>
                    }
                    <Table
                        data={data.map((p) => (
                            [
                                p.campaña,
                                p.codigo,
                                p.consultora,
                                p.facturacion,
                                p.telefono,
                                p.direccion,
                            ]
                        ))} headers={
                            [
                                `Campaña (${data.length})`,
                                "Codigo",
                                "Consultora",
                                "Facturacion",
                                "Telefono",
                                "Direccion",
                            ]
                        }></Table>

                    <center>
                        {isLoading && (
                            <div className={classes.spinnerContainer}>
                                <div className={classes.spinner}></div>
                                <p>Procesando archivo...</p>
                            </div>
                        )}
                    </center>
                </div>
            </div>
        </div>
    )
}

export default IngresarFacturacionTab;