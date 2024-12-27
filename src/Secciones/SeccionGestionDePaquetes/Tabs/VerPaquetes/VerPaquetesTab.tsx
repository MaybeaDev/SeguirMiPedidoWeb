import classes from "./VerPaquetesTab.module.css"

import { useEffect, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import { db } from "../../../../firebaseConfig";
import { collection, DocumentData, DocumentSnapshot, onSnapshot, query, QueryDocumentSnapshot, where } from "firebase/firestore";
function formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0'); // Asegura que el día tiene 2 dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 (enero) a 11 (diciembre), por eso sumamos 1
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0'); // Asegura que las horas tienen 2 dígitos
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Asegura que los minutos tienen 2 dígitos

    // Formato dd/mm/yyyy hh:mm
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

interface Ruta {
    id: string;
    alias: string,
    transportista: string,
}
interface Transportista {
    nombre: string,
    id: string,
}
const VerPaquetesTab = () => {
    const [paquetes, setPaquetes] = useState<string[][]>([]);
    const [rutas, setRutas] = useState<Record<string, Ruta>>({});
    const [transportistas, setTransportistas] = useState<Record<string, Transportista>>({});
    const [tableData, setTableData] = useState<string[][]>([]);
    const [isLoading, setIsLoading] = useState(true)
    const [mensajeCargando, setMensajeCargando] = useState("Obteniendo Paquetes...")
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        setTimeout(() => {
            setMensajeCargando("Está tomando mas tiempo de lo esperado debido a la conexión a internet...")
            setTimeout(()=>{
                setMensajeCargando("Deberías considerar revisar tu conexion a internet...")
            }, 5000)
        }, 2000)
        getRutas()
        getTransportistas()
    }, [])
    useEffect(() => {
        console.log("UseEffect 2")
        console.log(rutas, transportistas, paquetes)
        if (Object.keys(rutas).length != 0 && Object.keys(transportistas).length != 0 && paquetes.length == 0) {
            getPaquetes()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rutas, transportistas])

    const getRutas = () => {
        const q = query(collection(db, "Rutas"));
        onSnapshot(q, (querySnapshot) => {
            const rutas: { [key: string]: Ruta } = {}
            querySnapshot.forEach((doc) => {
                const ruta: Ruta = {
                    id: doc.id,
                    alias: doc.data().alias,
                    transportista: doc.data().transportista,
                }
                rutas[ruta.id] = ruta
            })
            console.log("Rutas actualizadas")
            setRutas(rutas)
        })
    }
    const getTransportistas = () => {
        const q = query(collection(db, "Usuarios"), where("tipo", "==", 0));
        onSnapshot(q, (querySnapshot) => {
            const transportistas: { [key: string]: Transportista } = {}
            querySnapshot.forEach((doc) => {
                const transportista: Transportista = {
                    nombre: doc.data().nombre,
                    id: doc.id
                }
                transportistas[transportista.id] = transportista
            })
            console.log("transportistas actualizados")
            setTransportistas(transportistas)
        })
    }
    const getPaquetes = () => {
        const q = query(collection(db, "Paquetes"));
        onSnapshot(q, async (querySnapshot) => {
            const paquetes: string[][] = [];
            querySnapshot.forEach((doc) => {
                paquetes.push(buscarRutaYTransportista(doc))
            })
            setIsLoading(false);
            setPaquetes(paquetes);
            setTableData(paquetes);
        })
    };
    const buscarRutaYTransportista = (doc: QueryDocumentSnapshot<DocumentData, DocumentData> | DocumentSnapshot<DocumentData, DocumentData>) => {

        if (doc.data() !== undefined) {
            const paquete = [
                doc.data()!.campania ?? "",
                doc.id,
                doc.data()!.consultora,
                formatDate(doc.data()!.historial[0].fecha.toDate()),
                (() => {
                    const estado = doc.data()!.historial[doc.data()!.historial.length - 1].estado;
                    switch (estado) {
                        case 0:
                            return "Enviado desde Santiago"
                        case 1:
                            return "En Bodega";
                        case 2:
                            return "En Reparto";
                        case 3:
                            return "Entregado";
                        case 4:
                            return "Entrega fallida";
                        default:
                            return "En Proceso";
                    }
                })(),
                doc.data()!.receptor,
                doc.data()!.contacto,
                doc.data()!.direccion,
                doc.data()!.referencia ?? "",
            ];

            if (doc.data()!.ruta) {
                console.log(rutas, doc.data()!.ruta)
                paquete.push(rutas[doc.data()!.ruta].alias);
                if (doc.data()!.transportista) {
                    paquete.push(transportistas[doc.data()!.transportista].nombre);
                } else {
                    if (rutas[doc.data()!.ruta].transportista) {
                        const transportista = transportistas[rutas[doc.data()!.ruta].transportista]
                        paquete.push(transportista.nombre);
                    } else {
                        paquete.push("")
                    }
                }
            }
            else {
                paquete.push("")
                paquete.push("")
            }


            return paquete
        } else {
            return []
        }

    }


    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value.toString();
        setSearchQuery(query);

        // Divide el query en términos usando ';' y normaliza cada término
        const searchTerms = query
            .split(";") // Divide por punto y coma
            .map((term) => normalizeString(term)) // Normaliza cada término
            .filter((term) => term.length > 0); // Elimina términos vacíos

        const filteredData = paquetes.filter((paquete) =>
            // Cada término debe coincidir en al menos un campo del paquete
            searchTerms.every((term) =>
                paquete.some((field) =>
                    normalizeString((field ?? "").toString()).includes(term)
                )
            )
        );

        setTableData(filteredData);
    };

    const normalizeString = (str: string): string => {
        return str
            .normalize("NFD") // Descompone los caracteres con tildes en base + tilde
            .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes y diacríticos
            .replace(/[\u200B-\u200D\uFEFF]/g, "") // Elimina caracteres invisibles
            .replace(/\s+/g, " ") // Reemplaza múltiples espacios por uno solo
            .trim() // Elimina espacios al inicio y final
            .toLowerCase(); // Convierte a minúsculas
    };

    return (
        <>
            <h2>Ver Paquetes</h2>
            <div>
                <input
                    type="text"
                    placeholder="Buscar en los resultados..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>

            {isLoading ? (
                <div className={classes.spinnerContainer}>
                    <div className={classes.spinner}></div>
                    <p>{mensajeCargando}</p>
                </div>
            ) : (

                <Table
                    max={200}
                    headers={[
                        "Campaña",
                        "Codigo",
                        "Codigo consu.",
                        "Fecha arribo",
                        "Estado",
                        "Consultora",
                        "Telefono",
                        "Direccion",
                        "Referencia",
                        "Ruta",
                        "Transportista",
                    ]}
                    data={tableData}
                    searchTerms={searchQuery.split(";").map((term) => normalizeString(term))} // Normaliza y divide términos
                />
            )}
        </>
    );
};

export default VerPaquetesTab;


