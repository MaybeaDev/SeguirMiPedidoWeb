import classes from "./ArriboCargaTab.module.css"


import Button from "../../../../components/UI/Button/Button";
import { useEffect, useRef, useState } from "react";
import TablaArribo from "../../../../components/Otros/TableArribo/TablaArribo";
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";


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

    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<Record<string, Paquete[]>>({});
    const [arribados, setArribados] = useState<string[]>([])
    const [noEncontrados, setNoEncontrados] = useState<string[]>([])
    const [inputValue, setInputValue] = useState("")
    const [codigoValido, setCodigoValido] = useState<boolean>()
    const codigoQueue = useRef<string[]>([]); // Cola de códigos pendientes
    const isProcessing = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        obtenerPaquetesNoArribados()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const processQueue = async () => {
        console.log("Processing queue...", isProcessing.current);
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
            console.log(inputValue, "Enter")
            if (inputValue.trim().split(" ").length >= 2) {
                console.log(inputValue.split(" "))
                inputValue.split(" ").forEach((c) => {
                    enqueueCodigo(c.trim())
                })
                setInputValue("");
            } else {
                enqueueCodigo(inputValue.trim())
            }
        }
    }
    const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value)
    }
    const validarCodigo = async (codigo: string) => {
        const docRef = doc(db, "Paquetes", codigo)
        console.log(codigo)
        const paquete = await getDoc(docRef)
        inputRef.current!.value = codigo
        if (paquete.exists()) {
            setCodigoValido(true)
            if (paquete.data().estado == 0) {
                setArribados([
                    ...arribados, codigo
                ])
                updateDoc(docRef, {
                    estado: 1, historial: [
                        ...paquete.data().historial,
                        {
                            estado: 1,
                            fecha: new Date(),
                            detalles: "Recibido por Rolando Transportes!"
                        }
                    ]
                })
                console.log(`Codigo ${codigo} arribado`)
            } else {
                console.log("El paquete ya está arribado")
            }
        } else {
            setCodigoValido(false);
            setNoEncontrados((prev) => [...prev, codigo]);
            console.log(`Código ${codigo} no encontrado`);
        }
    }

    const obtenerPaquetesNoArribados = () => {
        const q = query(collection(db, "Paquetes"), where("estado", "==", 0))
        onSnapshot(q, (snapshot) => {
            setIsLoading(true)
            const paquetes: Record<string, Paquete[]> = {}
            snapshot.forEach((paquete) => {
                if (!paquetes[paquete.data().facturacion ?? ""]) {
                    paquetes[paquete.data().facturacion ?? ""] = []
                }
                paquetes[paquete.data().facturacion ?? ""]
                .push({
                    codigo: paquete.id,
                    consultora: paquete.data().consultora,
                    campaña: paquete.data().campania,
                    fechaIngreso: paquete.data().facturacion ?? "",
                    recibe: paquete.data().receptor,
                    telefono: paquete.data().contacto,
                    direccion: paquete.data().direccion,
                    arribado: arribados.find((p) => p == paquete.id) == undefined ? false : true
                })
            })
            setIsLoading(false)
            setData(paquetes)
        })
    }

    const handleConfirmarArribo = () => { }

    return (
        <>
            <h2>Arribar Carga</h2>
            <br />
            <div className={classes.content}>
                <div className={classes.leftContent}>
                    <h3>Escanear codigos</h3>
                    <label>Ultimo escaneado: </label>
                    <center>
                        <input ref={inputRef} className={`${classes.readOnlyInput} ${codigoValido == undefined
                            ? ""
                            : codigoValido
                                ? classes.validInput
                                : classes.invalidInput}
                        `
                        } style={{ width: "50%" }} readOnly></input>
                    </center>
                    <center>
                        <input type="text" className={classes.input} value={inputValue} onChange={inputHandler} onKeyDown={keyDownHandler} placeholder="buscar fila..." />
                        <Button style={{ width: "60%" }} disabled={data.length ? false : true} onClick={handleConfirmarArribo}>Confirmar Arribo</Button>
                        <h4>No encontrados:</h4>
                        <div className={classes.containerNoEncontrados}>
                            {noEncontrados.map((c) => (
                                <label>{c}</label>
                            ))}
                        </div>
                    </center>
                </div>
                <div className={classes.rightContent}>
                    {Object.values(data).reverse().map((value, ) => {
                            return (
                                <TablaArribo data={
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
                                <p>Procesando archivo...</p>
                            </div>
                        )}
                    </center>
                </div>
            </div>
        </>
    );
};

export default ArriboCargaTab;