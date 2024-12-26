import classes from "./VerPaquetesTab.module.css"

import { useEffect, useRef, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import { db } from "../../../../firebaseConfig";
import { collection, DocumentData, DocumentSnapshot, getDocs, limit, onSnapshot, query, QueryDocumentSnapshot, where } from "firebase/firestore";
import Button from "../../../../components/UI/Button/Button";
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
    const [searchQuery, setSearchQuery] = useState<string>("");
    const codigoRef = useRef<HTMLInputElement>(null)
    const campañaRef = useRef<HTMLInputElement>(null)
    const codConsultoraRef = useRef<HTMLInputElement>(null)
    const rutaRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getRutas()
        getTransportistas()
        getPaquetes()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getRutas = () => {
        const q = query(collection(db, "Rutas"));
        onSnapshot(q, async (querySnapshot) => {
            const rutas: { [key: string]: Ruta } = {}
            querySnapshot.forEach((doc) => {
                const ruta: Ruta = {
                    id: doc.id,
                    alias: doc.data().alias,
                    transportista: doc.data().transportista,
                }
                rutas[ruta.id] = ruta
            })
            setRutas(rutas)
        })
    }
    const getTransportistas = () => {
        const q = query(collection(db, "Usuarios"), where("tipo", "==", 0));
        onSnapshot(q, async (querySnapshot) => {
            const transportistas: { [key: string]: Transportista } = {}
            querySnapshot.forEach((doc) => {
                const transportista: Transportista = {
                    nombre: doc.data().nombre,
                    id: doc.id
                }
                transportistas[transportista.id] = transportista
            })
            setTransportistas(transportistas)
        })
    }

    const buscarPaquetesPor = async (filtro: string, valor: string) => {
        console.log(filtro, valor)
        const q = query(
            collection(db, "Paquetes"),
            where(filtro, ">=", valor),
            where(filtro, "<=", valor + "\uf8ff")
        );
        const querySnapshot = await getDocs(q);
        const paquetes: string[][] = [];
        querySnapshot.forEach((doc) => {
            paquetes.push(buscarRutaYTransportista(doc))
        })
        setPaquetes(paquetes);
        setTableData(paquetes);
    }
    const getPaquetesFiltrados = async () => {
        const codigo = codigoRef.current!.value
        const campaña = campañaRef.current!.value
        const codConsultora = codConsultoraRef.current!.value
        const ruta = rutaRef.current!.value
        let q = query(collection(db, "Paquetes")); // Iniciar la query base
        if (codigo !== "") {
            q = query(q, where("__name__", "==", codigo));
        }
        if (campaña !== "") {
            q = query(q, where("campania", "==", campaña));
        }
        if (codConsultora !== "") {
            q = query(q, where("consultora", "==", codConsultora));
        }
        if (codConsultora !== "") {
            q = query(q, where("ruta", "==", ruta));
        }
        const querySnapshot = await getDocs(q);
        const paquetes: string[][] = [];
        querySnapshot.forEach((doc) => {
            paquetes.push(buscarRutaYTransportista(doc))
        })
        setPaquetes(paquetes);
        setTableData(paquetes);
    }
    const getPaquetes = async () => {
        const q = query(collection(db, "Paquetes"), limit(20));
        const querySnapshot = await getDocs(q);
        const paquetes: string[][] = [];
        querySnapshot.forEach((doc) => {
            paquetes.push(buscarRutaYTransportista(doc))
        })
        setPaquetes(paquetes);
        setTableData(paquetes);
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
                <center>
                    <div className={classes.spaceAround} style={{ width: "80%" }}>
                        <label style={{ width: "20%", borderRadius: "50px" }}>Codigo</label>
                        <label style={{ width: "20%", borderRadius: "50px" }}>Campaña</label>
                        <label style={{ width: "20%", borderRadius: "50px" }}>Cod. Consultora</label>
                        <label style={{ width: "20%", borderRadius: "50px" }}>Ruta</label>
                        <label style={{ width: "20%", visibility: "hidden" }}>Borrar filtros</label>
                    </div>
                </center>
                <div className={classes.inputGroup}>
                    <input onKeyDown={(e) => {if (e.key =="Enter") buscarPaquetesPor("__name__", codigoRef.current!.value) }} ref={codigoRef} autoComplete="off" name="Codigo" type="text" placeholder="Codigo" />
                    <input onKeyDown={(e) => {if (e.key =="Enter") buscarPaquetesPor("campania", campañaRef.current!.value) }} ref={campañaRef} autoComplete="off" name="Campaña" type="text" placeholder="Campaña" />
                    <input onKeyDown={(e) => {if (e.key =="Enter") buscarPaquetesPor("consultora", codConsultoraRef.current!.value) }} ref={codConsultoraRef} autoComplete="off" name="CodConsultora" type="text" placeholder="Cod. Consultora" />
                    <input onKeyDown={(e) => {if (e.key =="Enter") buscarPaquetesPor("ruta", rutaRef.current!.value) }} ref={rutaRef} autoComplete="off" name="Ruta" type="text" placeholder="Ruta" />
                    <input className={classes.inputButton} type="button" value="Aplicar filtros" onClick={() => { getPaquetesFiltrados() }} />
                </div>
                <center>
                    <div className={classes.spaceAround} style={{ width: "80%" }}>
                        <Button style={{ width: "10%", borderRadius: "50px" }} onClick={() => { buscarPaquetesPor("__name__", codigoRef.current!.value) }}>Buscar</Button>
                        <Button style={{ width: "10%", borderRadius: "50px" }} onClick={() => { buscarPaquetesPor("campania", campañaRef.current!.value) }}>Buscar</Button>
                        <Button style={{ width: "10%", borderRadius: "50px" }} onClick={() => { buscarPaquetesPor("consultora", codConsultoraRef.current!.value) }}>Buscar</Button>
                        <Button style={{ width: "10%", borderRadius: "50px" }} onClick={() => { buscarPaquetesPor("ruta", rutaRef.current!.value) }}>Buscar</Button>
                        <Button style={{ width: "10%" }} onClick={() => { getPaquetes() }}>Borrar filtros</Button>
                    </div>
                    <br />
                    <div className={classes.spaceAround} style={{ width: "30%" }}>
                    </div>
                </center>
                <input
                    type="text"
                    placeholder="Buscar en los resultados..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>
            <Table
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
        </>
    );
};

export default VerPaquetesTab;


