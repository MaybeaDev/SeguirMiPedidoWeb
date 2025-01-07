import classes from "./Despachos.module.css"


import { useEffect, useRef, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import Button from "../../../../components/UI/Button/Button";
import { doc, getDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import JsBarcode from "jsbarcode";
import { Document, Packer, Paragraph, Table as TableDocx, TableRow, TableCell, ImageRun, TextRun } from "docx";
import { obtenerCoordenadas } from "../../../../mapbox";

const DespachosTab = () => {

    const [data, setData] = useState<string[][]>([])
    const [descargado, setDescargado] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        setDescargado(false)
    }, [data])


    const handleOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            console.log("Enter")
            handleAgregarDespacho()
        }
    }
    const handleAgregarDespacho = async () => {
        if (formRef.current!) {
            const nombre = formRef.current.Nombre
            const destinatario = formRef.current.Destinatario
            const fono = formRef.current.Fono
            const ciudad = formRef.current.Ciudad
            const direccion = formRef.current.Direccion
            const bultos = formRef.current.Bultos
            if (nombre.value == "") {
                console.log(nombre)
                nombre.focus()
            } else if (destinatario.value == "") {
                destinatario.focus()
            } else if (fono.value == "") {
                fono.focus()
            } else if (ciudad.value == "") {
                ciudad.focus()
            } else if (direccion.value == "") {
                direccion.focus()
            } else if (bultos.value == "") {
                bultos.focus()
            } else if (parseInt(bultos.value) <= 0) {
                bultos.value = 1
                bultos.focus()
            } else if (parseInt(bultos.value) > 100) {
                bultos.value = 100
                bultos.focus()
            } else {
                const docRef = doc(db, "metadatos/contador")
                const ultimoDespacho = await (await getDoc(docRef)).data()!.ultimoDespacho
                updateDoc(docRef, { ultimoDespacho: parseInt(ultimoDespacho) + 1 })
                const newData: string[][] = []
                for (let i = 0; i < parseInt(bultos.value); i++) {
                    console.log(i)
                    const codigo = "DESP" + ultimoDespacho.toString().padStart(6, "0") + i.toString().padStart(3, "0")
                    const date = new Date();
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0
                    const year = date.getFullYear();

                    const formattedDate = `${day}/${month}/${year}`;
                    newData.push(
                        [
                            codigo,
                            nombre.value.toUpperCase(),
                            destinatario.value.toUpperCase(),
                            fono.value,
                            ciudad.value.toUpperCase(),
                            direccion.value.toUpperCase(),
                            formattedDate,
                        ]
                    )
                }
                setData([
                    ...data,
                    ...newData
                ])
                formRef.current.reset()
                formRef.current!.Nombre.focus()
            }

        }
    }
    const handleGuardarDespachos = async () => {
        if (data.length <= 0) return
        if (!descargado) {
            await handleDescargarListado()
        }
        const batch = writeBatch(db)
        const nombresAGuardar: string[] = []
        for (const row of data) {
            const docRef = doc(db, "Paquetes", String(row[0]));
            const coordenadas = await obtenerCoordenadas(row[5]);
            nombresAGuardar.push(row[1])
            const object = {
                contacto: String(row[3]),
                campaña: "Despacho particular",
                direccion: row[5],
                estado: 1,
                historial: [
                    {
                        detalles: "Hemos recibido la encomienda",
                        estado: 1,
                        fecha: Timestamp.fromDate(new Date()),
                    },
                ],
                receptor: row[2],
                referencia: row[4],
                facturacion: " Particular",
                ruta: "",
                rutaAlias: "",
                transportistaNombre: "",
                consultora: row[1],
                coordenadas: coordenadas,
            };
            batch.set(docRef, object)
        }
        batch.commit();
        setData([])
    }
    const handleEliminarData = (fila: string) => {
        setData((prevData) => prevData.filter((row) => row[0] != fila));
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
                                                text: row[2],
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
    return (
        <div className={classes.root}>
            <h2>Despachos</h2>
            <div className={classes.inputGroup}>
                <label>Cliente</label>
                <label>Destinatario</label>
                <label>Fono contacto</label>
                <label>Ciudad</label>
                <label>Direccion</label>
                <label>Bultos</label>
                <label></label>
            </div>
            <form ref={formRef}>
                <div className={classes.inputGroup}>
                    <input style={{ flex: 1 }} autoComplete="off" onKeyDown={handleOnKeyDown} required name="Nombre" type="text" placeholder="Cliente" />
                    <input style={{ flex: 1 }} autoComplete="off" onKeyDown={handleOnKeyDown} required name="Destinatario" type="text" placeholder="Destinatario" />
                    <input style={{ flex: 1 }} autoComplete="off" onKeyDown={handleOnKeyDown} required name="Fono" type="number" placeholder="Fono" />
                    <input style={{ flex: 1 }} autoComplete="off" onKeyDown={handleOnKeyDown} required name="Ciudad" type="text" placeholder="Ciudad" />
                    <input style={{ flex: 1 }} autoComplete="off" onKeyDown={handleOnKeyDown} required name="Direccion" type="text" placeholder="Direccion" />
                    <input style={{ flex: 1 }} autoComplete="off" onKeyDown={handleOnKeyDown} required name="Bultos" type="number" min="1" max="1000" placeholder="Bultos" />
                    <input style={{ flex: 1 }} onClick={handleAgregarDespacho} type="button" placeholder="Fecha" value="Agregar" />
                </div>
            </form>
            <div className={classes.spaceAround}>
                <Button className={classes.botonAzul} onClick={handleDescargarListado}>Descargar Codigos de barra</Button>
                <Button onClick={handleGuardarDespachos}>Guardar</Button>
            </div>
            <Table data={data} headers={
                [
                    "Codigo",
                    "Cliente",
                    "Destinatario",
                    "Fono",
                    "Ciudad",
                    "Direccion",
                    "Fecha",
                    "Eliminar"
                ]
            }
            >
                {(rowIndex: string) => (
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