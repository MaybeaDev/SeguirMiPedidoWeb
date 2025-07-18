import classes from "./ArriboCargaTab.module.css"


import { useEffect, useRef, useState } from "react";
import TablaArribo from "../../../../components/Otros/TableArribo/TablaArribo";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useOutletContext } from "react-router-dom";
import { PaqueteContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";


interface Paquete {
    codigo: string,
    consultora: string,
    campaña: string,
    fechaIngreso: string,
    recibe: string,
    telefono: string,
    direccion: string,
    arribado: boolean
}

const ArriboCargaTab = () => {
    const { paquetesContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [] }>();
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<Record<string, Paquete[]>>({});
    const [arribados, setArribados] = useState<string[]>([])
    const [noEncontrados, setNoEncontrados] = useState<string[]>([])
    const [inputValue, setInputValue] = useState("")
    const [codigoValido, setCodigoValido] = useState<boolean>()
    const [ultimoValidado, setUltimoValidado] = useState("")
    const codigoQueue = useRef<string[]>([]); // Cola de códigos pendientes
    const isProcessing = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current && paquetesContext.length == 0) {
            isFirstRender.current = false;
            return;
        }
        obtenerPaquetesNoArribados()
        setIsLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paquetesContext])

    const processQueue = async () => {
        if (import.meta.env.DEV) console.log("Processing queue...", isProcessing.current);
        if (isProcessing.current) return;
        isProcessing.current = true;
        while (codigoQueue.current.length > 0) {
            const codigo = codigoQueue.current.shift()!;
            await validarCodigo(codigo);
        }
        isProcessing.current = false;
    };
    const enqueueCodigo = (codigo: string) => {
        codigoQueue.current.push(codigo);
        processQueue();
    };
    const keyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key == "Enter") {
            if (import.meta.env.DEV) console.log(inputValue, "Enter")
            if (inputValue.trim().split(" ").length >= 2) {
                if (import.meta.env.DEV) console.log(inputValue.split(" "))
                inputValue.split(" ").forEach((c) => {
                    enqueueCodigo(c.trim())
                })
            } else {
                if (inputValue.trim().length > 0) {
                    enqueueCodigo(inputValue.trim())
                }
            }
            if (import.meta.env.DEV) console.log("Limpiado")
            setInputValue("");
        }
    }
    const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value)
    }
    const validarCodigo = async (codigo: string) => {
        const p = paquetesContext.find(p => p.id == codigo)
        if (import.meta.env.DEV) console.log(codigo)
        setUltimoValidado(codigo)
        if (p) {
            setCodigoValido(true)
            if (p.estado == 0) {
                setArribados([
                    ...arribados, codigo
                ])
                updateDoc(doc(db, "Paquetes", codigo), {
                    estado: 1, historial: arrayUnion({
                        estado: 1,
                        fecha: new Date(),
                        detalles: "Recibido por Rolando Transportes!"
                    })
                })
if (import.meta.env.DEV) console.log(`Codigo ${codigo} arribado`)
            } else {
    if (import.meta.env.DEV) console.log("El paquete ya está arribado")
}
        } else {
    setCodigoValido(false);
    setNoEncontrados((prev) => [...prev, codigo]);
    if (import.meta.env.DEV) console.log(`Código ${codigo} no encontrado`);
}
    }

const obtenerPaquetesNoArribados = () => {
    const paquetes: Record<string, Paquete[]> = {}
    const filtrados = paquetesContext.filter((p) => p.estado == 0)
    const filtradosOrdenados = filtrados.sort((a, b) => {
        const [diaA, mesA, añoA] = a.facturacion.split("-").map(Number);
        const [diaB, mesB, añoB] = b.facturacion.split("-").map(Number);

        const dateA = new Date(añoA, mesA - 1, diaA); // Crear objeto Date
        const dateB = new Date(añoB, mesB - 1, diaB);

        return dateA.getTime() - dateB.getTime(); // Ordenar de más reciente a más antigua
    });
    filtradosOrdenados.forEach((paquete) => {
        if (!paquetes[paquete.facturacion]) {
            paquetes[paquete.facturacion] = []
        }
        paquetes[paquete.facturacion]
            .push({
                codigo: paquete.id,
                consultora: paquete.consultora,
                campaña: paquete.campaña,
                fechaIngreso: paquete.facturacion,
                recibe: paquete.receptor,
                telefono: paquete.contacto,
                direccion: paquete.direccion,
                arribado: arribados.find((p) => p == paquete.id) == undefined ? false : true
            })
    })
    setData(paquetes)
}


return (
    <>
        <h2>Arribar Carga</h2>
        <br />
        <div className={classes.content}>
            <div className={classes.leftContent}>
                <h3>Escanear codigos (Restantes: {Object.values(data).reduce((total, d) => total + d.length,0 )})</h3>
                {ultimoValidado != "" && (
                    <>
                        <label>Ultimo escaneado: </label>
                        <center>
                            <input ref={inputRef} className={`${classes.readOnlyInput} ${codigoValido == undefined
                                ? ""
                                : codigoValido
                                    ? classes.validInput
                                    : classes.invalidInput}
                        `
                            } style={{ width: "50%" }} value={ultimoValidado} readOnly></input>
                            <label style={{ marginLeft: 10 }}>{codigoQueue.current.length} en proceso</label>
                        </center>
                    </>
                )}
                <center>
                    <input autoFocus type="text" className={classes.input} value={inputValue} onChange={inputHandler} onKeyDown={keyDownHandler} placeholder="Escanear Aqui..." />
                    {noEncontrados.length > 0 && (
                        <>
                            <h4>No encontrados:</h4>
                            <div className={classes.containerNoEncontrados}>
                                {noEncontrados.map((c) => (
                                    <label>{c}</label>
                                ))}
                            </div>
                        </>
                    )}
                </center>
            </div>
            <div className={classes.rightContent}>
                {Object.values(data).map((value,_) => {
                    return (
                        <TablaArribo key={_} data={
                            value.map((p) => [
                                p.codigo,
                                p.consultora,
                                p.campaña,
                                p.fechaIngreso,
                                p.recibe,
                                p.telefono,
                                p.arribado
                            ])
                        } headers={[
                            "Código",
                            "Consultora",
                            "Campaña",
                            "Fecha facturacion",
                            "Recibe",
                            "Teléfono",
                        ]} />
                    )
                })}


                <center>
                    {isLoading && (
                        <div className={classes.spinnerContainer}>
                            <div className={classes.spinner}></div>
                            <p>Obteniendo paquetes no arribados...</p>
                        </div>
                    )}
                </center>
            </div>
        </div>
    </>
);
};

export default ArriboCargaTab;