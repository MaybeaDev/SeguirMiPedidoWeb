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
    facturacion:string,
    direccion: string,
    referencia: string,
    telefono: string,
    campaña: string
}

const IngresarFacturacionTab = () => {
    const { paquetesContext } = useOutletContext<{ paquetesContext: PaqueteContext[] }>();

    const [errorFile, setErrorFile] = useState<string | null>(null)
    const [data, setData] = useState<Paquete[]>([]);
    const [isLoading, setIsLoading] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [loadingState, setLoadingState] = useState(false)
    const [avanceCarga, setAvanceCarga] = useState(0)
    const [totalCarga, setTotalCarga] = useState(0)


    const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value)
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
                const factIndex = workbook.SheetNames.indexOf("Facturacion Total");
                const ultimaFacturacion = workbook.SheetNames[factIndex - 2];
                const worksheet = workbook.Sheets[ultimaFacturacion];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
                setIsLoading(false);
                const parsedHeaders = data.map((row) => ([row[0] as string, row[15] as string, row[9] as string, row[10] as string, row[11] as string, row[12] as string, row[26] as string]))
                const comienzoTabla = parsedHeaders.findIndex((headers) => {
                    if (JSON.stringify(headers) === JSON.stringify(["PEDIDO", "CAJAS", "CONSULTORA", "NOMBRE CONSULTORA", "DIRECCION", "TELEFONO", "CAMPAÑA FACTURACION"])) {
                        return true
                    }
                })
                if (comienzoTabla >= 0) {
                    const parsedData = data.slice(comienzoTabla + 1).map((row) => ({
                        codigo: row[0].toString().trim() || "",
                        cajas: row[15] ? parseInt(row[15]) : 0,
                        consultora: row[9].toString().trim() || "",
                        nombreConsultora: row[10].toString().trim() || "",
                        facturacion:ultimaFacturacion + "-" + new Date().getFullYear().toString(),
                        direccion: row[11].toString().trim() || "",
                        telefono: row[12].toString().trim() || "",
                        campaña: row[26].toString().trim() || "",
                    }));

                    // Filtrar las filas que tienen un "codigo" vacío o null
                    const validData = parsedData.filter(item => item.codigo && String(item.codigo).trim() !== "" && item.cajas > 0);
                    setIsLoading(false);
                    console.log(validData);
                    const fullData: Paquete[] = []
                    validData.forEach((pedido) => {
                        for (let i = 1; i <= pedido.cajas; i++) {

                            const direccion = pedido.direccion.split("REFERENCIA")[0] ?? pedido.direccion;
                            const referencia = pedido.direccion.split("REFERENCIA")[1] ?? "";
                            fullData.push({
                                codigo: pedido.codigo + "00" + i,
                                consultora: pedido.consultora,
                                nombreConsultora: pedido.nombreConsultora,
                                direccion: direccion,
                                facturacion:"",
                                referencia: referencia,
                                telefono: pedido.telefono,
                                campaña: pedido.campaña,
                            })
                        }
                    })
                    console.log(fullData.map((p) => p.codigo))
                    ingresarData(fullData);
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
                estado: 0,
                receptor: item.nombreConsultora,
                referencia: referencia.trim(),
                ruta: "",
                coordenadas: coordenadas,
                historial: [
                    {
                        detalles: "El vendedor nos envió tu pedido",
                        estado: 0,
                        fecha: Timestamp.now(),
                    },
                ],
            };
            batch.set(docRef, object);
        }
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
            alert("Los codigos de la ultima facturación ya han sido ingresados, se abortará la operacion")
        } else if (encontrados.length > 0) {
            alert(`Los siguientes códigos ya existen en la base de datos por lo que se abortará la operación: ${[...encontrados].join(", ")}`);
        } else {
            // console.log("Ahora se guardaría")
            await guardarEnFirebase(data)
        }
        setLoadingState(false)
    }
    const obtenerDocumentosExistentes = (ids: string[]): string[] => {
        const encontrados = paquetesContext.filter(p => ids.includes(p.id))
        return encontrados.map(p => p.id)
    };
    const ingresarData = (data: Paquete[]) => {
        if (data.length > 0) {
            setData(data);
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
                        <Button style={{ width: "60%" }} disabled={data.length ?  (paquetesContext.length ? false : true) : true} onClick={handleConfirmarCarga}>Confirmar carga</Button>
                    </center>
                </div>
                <div className={classes.rightContent}>
                    <input type="text" className={classes.input} value={inputValue} onInput={inputHandler} placeholder="buscar fila..." />
                    <Table
                        searchTerms={inputValue.split(";")}
                        data={data.map((p) => (
                            [
                                p.campaña,
                                p.codigo,
                                p.consultora,
                                p.nombreConsultora,
                                p.telefono,
                                p.direccion,
                            ]
                        ))} headers={
                            [
                                "Campaña",
                                "Codigo",
                                "Consultora",
                                "Nombre Cons.",
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