import classes from "./Despachos.module.css"


import { useEffect, useRef, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import Button from "../../../../components/UI/Button/Button";
import { doc, getDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import JsBarcode from "jsbarcode";
import { Document, Packer, Paragraph, Table as TableDocx, TableRow, TableCell, ImageRun, TextRun } from "docx";
import { obtenerCoordenadas } from "../../../../mapbox";

interface Consultora {
    transportista: string,
    consultora: string,
    fono: string,
    ciudad: string,
    direccion: string,
}
const DespachosTab = () => {

    const [data, setData] = useState<string[][]>([])
    const [descargado, setDescargado] = useState(false)
    const [consultoras, setConsultoras] = useState<Consultora[]>([])
    const [fechaInputValue, setFechaInputValue] = useState(new Date().toISOString().split("T")[0])
    const formRef = useRef<HTMLFormElement>(null)
    useEffect(() => {
        const docRef = doc(db, "metadatos/despachos")
        getDoc(docRef).then((d) => {
            setConsultoras(d.data()!.historial.map((c: Consultora) => {
                return {
                    transportista: c.transportista,
                    consultora: c.consultora,
                    fono: c.fono,
                    ciudad: c.ciudad,
                    direccion: c.direccion
                }
            }))
        })
    }, [])
    useEffect(() => {
        setDescargado(false)
    }, [data])


    const handleOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            console.log("Enter")
            handleAgregarDespacho()
        }
    }
    const handleOnChangeConsultora = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value)
        formRef.current!.Consultora.value = e.target.value
        const consultora = consultoras.find((c) => c.consultora === formRef.current!.Consultora.value)
        if (consultora) {
            formRef.current!.Transportista.value = consultora.transportista
            formRef.current!.Fono.value = consultora.fono
            formRef.current!.Ciudad.value = consultora.ciudad
            formRef.current!.Direccion.value = consultora.direccion
            formRef.current!.Fecha.focus()
        }
    }
    const handleAgregarDespacho = async () => {
        if (formRef.current!) {
            const consultora = formRef.current.Consultora
            const transportista = formRef.current.Transportista
            const fono = formRef.current.Fono
            const ciudad = formRef.current.Ciudad
            const direccion = formRef.current.Direccion
            const fecha = formRef.current.Fecha
            if (consultora.value == "") {
                consultora.focus()
            } else if (transportista.value == "") {
                transportista.focus()
            } else if (fono.value == "") {
                fono.focus()
            } else if (ciudad.value == "") {
                ciudad.focus()
            } else if (direccion.value == "") {
                direccion.focus()
            } else if (fecha.value == "") {
                fecha.focus()
            } else if (new Date(fecha.value) > new Date('2100-12-31')) {
                alert("La fecha ingresada no es válida")
            } else {
                const docRef = doc(db, "metadatos/contador")
                const ultimoDespacho = await (await getDoc(docRef)).data()!.ultimoDespacho
                updateDoc(docRef, { ultimoDespacho: parseInt(ultimoDespacho) + 1 })
                const codigo = "DESP" + ultimoDespacho.toString().padStart(10, "0");
                const date = new Date(fecha.value);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0
                const year = date.getFullYear();

                const formattedDate = `${day}/${month}/${year}`;

                setData([
                    ...data,
                    [
                        codigo,
                        consultora.value.toUpperCase(),
                        transportista.value.toUpperCase(),
                        fono.value,
                        ciudad.value.toUpperCase(),
                        direccion.value.toUpperCase(),
                        formattedDate,
                    ]
                ])
                formRef.current.reset()
                formRef.current!.Consultora.focus()
            }

        }
    }
    const handleGuardarDespachos = async () => {
        if (data.length <= 0) return
        if (!descargado) {
            await handleDescargarListado()
        }
        const batch = writeBatch(db)
        const consultorasAGuardar: string[] = []
        for (const row of data) {
            const docRef = doc(db, "Paquetes", String(row[0]));
            const coordenadas = await obtenerCoordenadas(row[5]);
            consultorasAGuardar.push(row[1])
            const object = {
                contacto: String(row[3]),
                consultora: "Despacho particular",
                direccion: row[5],
                campaña: "Despacho particular",
                estado: 1,
                receptor: row[1],
                ruta: "",
                coordenadas: coordenadas,
                historial: [
                    {
                        detalles: "Hemos recibido la encomienda",
                        estado: 1,
                        fecha: formatToFirebaseTimestamp(row[6]),
                    },
                ],
            };
            batch.set(docRef, object)
        }
        batch.commit();
        const docRef = doc(db, "metadatos/despachos")
        getDoc(docRef).then((d) => {
            const historial: Consultora[] = [...d.data()!.historial]
            const ingresos = data.map((d) => {
                return {
                    consultora: d[1],
                    transportista: d[2],
                    fono: d[3],
                    ciudad: d[4],
                    direccion: d[5],
                }
            })
            const existentes = historial.filter((h) => ingresos.map((h) => h.consultora).includes(h.consultora))
            const inexistentes = (ingresos.filter((c) => !historial.map(h => h.consultora).includes(c.consultora)))
            console.log(historial, existentes, inexistentes)
            for (const existente of existentes) {
                const indice = historial.indexOf(existente)
                historial[indice] = ingresos[indice]

            }
            updateDoc(docRef, { historial: [...historial,...inexistentes] })
        })
        setData([])
    }
    const handleEliminarData = (fila: number) => {
        setData((prevData) => prevData.filter((_, index) => index !== fila));
    }
    const generateBarcode = (text: string): string => {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, text, { format: "CODE128" });
        return canvas.toDataURL("image/png");
    };
    const base64ToArrayBuffer = (base64: string) => {
        const binaryString = atob(base64);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };
    const handleDescargarListado = async () => {
        setDescargado(true)
        const paragraphs = data.map((row) => {
            const barcodeData = generateBarcode(row[0]); // Primer elemento de cada lista
            return new TableDocx({
                borders: {
                    top: { style: "none", color: "000000" },
                    bottom: { style: "none", color: "000000" },
                    left: { style: "none", color: "000000" },
                    right: { style: "none", color: "000000" },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: {
                                    top: { style: "none", color: "000000" },
                                    bottom: { style: "none", color: "000000" },
                                    left: { style: "none", color: "000000" },
                                    right: { style: "none", color: "000000" },
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                type: "png",
                                                data: base64ToArrayBuffer(barcodeData.split(",")[1]),
                                                transformation: {
                                                    width: 200,
                                                    height: 75,
                                                    rotation: 90
                                                },
                                            }),
                                        ]
                                    })
                                ]
                            }),
                            new TableCell({
                                borders: {
                                    top: { style: "none", color: "000000" },
                                    bottom: { style: "none", color: "000000" },
                                    left: { style: "none", color: "000000" },
                                    right: { style: "none", color: "000000" },
                                },
                                children: [
                                    new Paragraph({
                                        alignment: "center",
                                        spacing: {
                                            after: 200,  // Espacio después del párrafo (en puntos)
                                            before: 200,  // Espacio después del párrafo (en puntos)
                                        },
                                        children: [
                                            new TextRun({
                                                text: row[1],
                                                font: "calibri",
                                                size: 52,
                                            })
                                        ]
                                    }),
                                    new Paragraph({
                                        alignment: "center",
                                        spacing: {
                                            after: 200,  // Espacio después del párrafo (en puntos)
                                            before: 200,
                                        },
                                        children: [
                                            new TextRun({
                                                text: `${row[5]}, ${row[4]}`,
                                                font: "calibri",
                                                size: 52,
                                            })
                                        ]
                                    }),
                                    new Paragraph({
                                        alignment: "center",
                                        spacing: {
                                            after: 2500,  // Espacio después del párrafo (en puntos)
                                            before: 200,
                                        },
                                        children: [
                                            new TextRun({
                                                text: row[3],
                                                font: "calibri",
                                                size: 52,
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ],
            })
        });

        const doc = new Document({
            sections: [{
                properties: {
                    // Márgenes estrechos
                    page: {
                        margin: {
                            top: 750,
                            right: 750,
                            bottom: 750,
                            left: 750,
                        },
                    },
                },
                children: paragraphs
            }]
        });

        Packer.toBlob(doc).then((blob) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "barcodes.docx";
            link.click();
        });
    }
    const formatToFirebaseTimestamp = (dateString: string): Timestamp => {
        const [day, month, year] = dateString.split('/').map(Number);
        // Nota: Los meses en JavaScript comienzan desde 0, por lo que restamos 1 al mes.
        const date = new Date(year, month - 1, day);
        return Timestamp.fromDate(date);
    }



    return (
        <div className={classes.root}>
            <h2>Despachos</h2>
            <div className={classes.inputGroup}>
                <label>Consultora</label>
                <label>Transportista</label>
                <label>Fono</label>
                <label>Ciudad</label>
                <label>Direccion</label>
                <label>Fecha</label>
                <label></label>
            </div>
            <form ref={formRef}>
                <div className={classes.inputGroup}>
                    <input onKeyDown={handleOnKeyDown} onChange={handleOnChangeConsultora} required autoComplete="off" name="Consultora" type="text" list="datalist" placeholder="Consultora" />
                    <datalist id="datalist">
                        {consultoras.map((c, index) => (
                            <option key={index} value={c.consultora}>{`${c.transportista}, ${c.ciudad}, ${c.direccion}`}</option>
                        ))}
                    </datalist>
                    <input autoComplete="off" autoCapitalize="characters" onKeyDown={handleOnKeyDown} required name="Transportista" type="text" placeholder="Transportista" />
                    <input autoComplete="off" autoCapitalize="characters" onKeyDown={handleOnKeyDown} required name="Fono" type="number" placeholder="Fono" />
                    <input autoComplete="off" autoCapitalize="characters" onKeyDown={handleOnKeyDown} required name="Ciudad" type="text" placeholder="Ciudad" />
                    <input autoComplete="off" autoCapitalize="characters" onKeyDown={handleOnKeyDown} required name="Direccion" type="text" placeholder="Direccion" />
                    <input autoComplete="off" autoCapitalize="characters" onKeyDown={handleOnKeyDown} onChange={(e) => { setFechaInputValue(e.target.value) }} required name="Fecha" value={fechaInputValue} type="date" max="2100-12-31" placeholder="Fecha" />
                    <input onClick={handleAgregarDespacho} type="button" placeholder="Fecha" value="Agregar" />
                </div>
            </form>
            <div className={classes.spaceAround}>
                <Button className={classes.botonAzul} onClick={handleDescargarListado}>Descargar Codigos de barra</Button>
                <Button onClick={handleGuardarDespachos}>Guardar</Button>
            </div>
            <Table data={data} headers={
                [
                    "Codigo",
                    "Consultora",
                    "Transportista",
                    "Fono",
                    "Ciudad",
                    "Direccion",
                    "Fecha",
                    "Eliminar"
                ]
            }
            >
                {(rowIndex: number) => (
                    <input
                        onClick={(e) => {
                            e.stopPropagation(); // Evita que se dispare el evento de la fila
                            handleEliminarData(rowIndex);
                        }}
                        type="button"
                        value="Eliminar"
                    />
                )}
            </Table>
        </div>
    )
}

export default DespachosTab;